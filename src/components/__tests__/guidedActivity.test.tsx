import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store';
import { EXERCISES } from '../../constants/exercises';
import {
  readyActivity,
  transitionActivity as move,
  activityTime,
  activityOutcome,
} from '../../services/session/guidedActivity';
import GuidedActivity from '../exercises/GuidedActivity';
import { useGuidedRoutine } from '../exercises/useGuidedRoutine';
import { logout } from '../../store/slices/userSlice';
import type { ExercisePlan } from '../../services/pose/exercisePlan';

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const plan: ExercisePlan = {
  joint: 'shoulder',
  side: 'left',
  reps: 3,
  routine: [{ exerciseId: 'arm-raise', reps: 3 }],
};
const storeFor = (p: ExercisePlan = plan) => {
  const initial = rootReducer(undefined, { type: 'init' });
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initial,
      user: {
        ...initial.user,
        currentUser: { id: 'synthetic-A', name: 'Example', email: '', profile: {} },
      },
      settings: { ...initial.settings, exercisePlan: p },
    },
  });
};
describe('camera-optional state, not measurement', () => {
  it('shares exact active/paused/wall time: 5 active, 70 paused, 3 active', () => {
    let s = move(readyActivity(), { type: 'start', at: 1000 });
    s = move(s, { type: 'pause', at: 6000 });
    s = move(s, { type: 'resume', at: 76000 });
    s = move(s, { type: 'finish', at: 79000 });
    expect(activityTime(s, 999999)).toEqual({
      activeMilliseconds: 8000,
      pausedMilliseconds: 70000,
      wallMilliseconds: 78000,
    });
  });
  it('requires explicit Start and ignores malformed/backwards timestamps', () => {
    const ready = readyActivity();
    expect(move(ready, { type: 'finish', at: 1 })).toBe(ready);
    const s = move(ready, { type: 'start', at: 1000 });
    for (const at of [NaN, Infinity, -1, 500])
      expect(move(s, { type: 'pause', at })).toBe(s);
  });
  it('keeps interruptions paused until an explicit resume', () => {
    const s = move(move(readyActivity(), { type: 'start', at: 1 }), {
      type: 'interrupt',
      reason: 'background',
      at: 101,
    });
    expect(activityTime(s, 10101).activeMilliseconds).toBe(100);
    expect(move(s, { type: 'start', at: 10101 })).toBe(s);
  });
  it('cannot downgrade a programme-change stop to a resumable background pause', () => {
    let s = move(readyActivity(), { type: 'start', at: 0 });
    s = move(s, { type: 'interrupt', at: 1000, reason: 'programme_changed' });
    s = move(s, { type: 'interrupt', at: 2000, reason: 'background' });
    expect(move(s, { type: 'resume', at: 3000 })).toBe(s);
  });
  it('cannot infer completion, repetitions or angles from an elapsed timer', () => {
    const running = move(readyActivity(), { type: 'start', at: 0 });
    expect(activityOutcome(running, true)).toBeNull();
    const s = move(running, { type: 'finish', at: 60000 });
    expect(activityOutcome(s, false)).toMatchObject({
      completion: 'stopped_early',
      measured: false,
      completionBasis: 'patient_report',
    });
    expect(activityOutcome(s, true)).not.toHaveProperty('reps');
    expect(activityOutcome(s, true)).not.toHaveProperty('degrees');
    expect(
      activityOutcome(move(running, { type: 'finish', at: 0 }), true)?.completion
    ).toBe('attempted');
  });
  it('finish is idempotent and freezes time', () => {
    const s = move(move(readyActivity(), { type: 'start', at: 1 }), {
      type: 'finish',
      at: 11,
    });
    expect(move(s, { type: 'finish', at: 20 })).toBe(s);
  });
});
describe('guided patient screen', () => {
  let change: (s: AppStateStatus) => void;
  const remove = jest.fn();
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    Object.defineProperty(AppState, 'currentState', {
      value: 'active',
      configurable: true,
    });
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, fn) => {
      change = fn;
      return { remove };
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  const props = {
    exercise: EXERCISES.armRaise,
    side: 'left' as const,
    amount: '3 times',
    allowed: true,
    onExit: jest.fn(),
  };
  it('starts deliberately; pause time never becomes activity; finishes honestly unsaved', () => {
    const ui = render(<GuidedActivity {...props} />);
    expect(ui.queryByTestId('guided-time')).toBeNull();
    fireEvent.press(ui.getByTestId('guided-start'));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    fireEvent.press(ui.getByTestId('guided-pause'));
    act(() => {
      jest.advanceTimersByTime(70000);
    });
    fireEvent.press(ui.getByTestId('guided-pause'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    fireEvent.press(ui.getByTestId('guided-stop'));
    expect(ui.getByText(/Active time: 8 sec/)).toBeTruthy();
    fireEvent.press(ui.getByTestId('guided-completed'));
    expect(ui.getByTestId('guided-report')).toHaveTextContent('reported completing');
    expect(ui.getByTestId('guided-unsaved')).toHaveTextContent('not been saved');
    expect(ui.queryByText(/Excellent form|New personal best|\d+°/)).toBeNull();
    ui.unmount();
    expect(remove).toHaveBeenCalled();
  });
  it('backgrounding pauses and returning does not restart', () => {
    const ui = render(<GuidedActivity {...props} />);
    fireEvent.press(ui.getByTestId('guided-start'));
    act(() => {
      jest.advanceTimersByTime(2000);
      change('background');
    });
    act(() => {
      jest.advanceTimersByTime(10000);
      change('active');
    });
    expect(ui.getByTestId('guided-time')).toHaveTextContent('2 sec');
    expect(ui.getByTestId('guided-instruction')).toHaveTextContent('Paused');
    ui.unmount();
  });
  it('a changed programme cannot resume even when its old values are restored', () => {
    const ui = render(<GuidedActivity {...props} />);
    fireEvent.press(ui.getByTestId('guided-start'));
    ui.rerender(<GuidedActivity {...props} allowed={false} />);
    ui.rerender(<GuidedActivity {...props} />);
    fireEvent.press(ui.getByTestId('guided-pause'));
    expect(ui.getByTestId('guided-plan-changed')).toBeTruthy();
    expect(ui.getByTestId('guided-instruction')).toHaveTextContent('Paused');
    ui.unmount();
  });
  it('rechecks due activity and clinical gating; no routine credit for interaction', () => {
    const store = storeFor();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const hook = renderHook(() => useGuidedRoutine(), { wrapper });
    act(() => hook.result.current.start());
    expect(hook.result.current.content).not.toBeNull();
    expect(store.getState().exercise.history).toEqual([]);
    act(() => store.dispatch(logout()));
    expect(hook.result.current.content).toBeNull();
    hook.unmount();
    const blocked = storeFor({
      ...plan,
      episode: { id: 'test', pathway: 'frozen_shoulder', phase: 'symptom_limited' },
    } as ExercisePlan);
    const h = renderHook(() => useGuidedRoutine(), {
      wrapper: ({ children }) => <Provider store={blocked}>{children}</Provider>,
    });
    act(() => h.result.current.start());
    expect(h.result.current.content).toBeNull();
    h.unmount();
  });
});

it('reviewing a reference pauses activity time and does not load media before request', () => {
  jest.useFakeTimers();
  jest.setSystemTime(1000);
  Object.defineProperty(AppState, 'currentState', {
    value: 'active',
    configurable: true,
  });
  const sub = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  const ui = render(
    <GuidedActivity
      exercise={EXERCISES.armRaise}
      side="left"
      amount="3 times"
      allowed
      onExit={() => {}}
      videoLink="https://www.youtube.com/watch?v=M7lc1UVf-VE"
    />
  );
  expect(ui.queryByTestId('guided-video')).toBeNull();
  fireEvent.press(ui.getByTestId('guided-start'));
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  fireEvent.press(ui.getByTestId('guided-watch'));
  expect(ui.getByTestId('guided-video')).toBeTruthy();
  act(() => {
    jest.advanceTimersByTime(10000);
  });
  expect(ui.getByTestId('guided-time')).toHaveTextContent('2 sec');
  fireEvent.press(ui.getByTestId('follow-along-toggle'));
  // Hidden means inaccessible, not destroyed: include hidden nodes for this assertion.
  expect(ui.queryByTestId('guided-video')).toBeNull();
  expect(ui.getByTestId('guided-video', { includeHiddenElements: true })).toHaveProp(
    'accessibilityElementsHidden',
    true
  );
  fireEvent.press(ui.getByTestId('guided-pause'));
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(ui.getByTestId('guided-time')).toHaveTextContent('3 sec');
  ui.unmount();
  sub.mockRestore();
  jest.useRealTimers();
});

it('a programme interrupted during the attempt is recorded without new-programme credit', () => {
  let state = move(readyActivity(), { type: 'start', at: 1000 });
  state = move(state, { type: 'interrupt', at: 2000, reason: 'programme_changed' });
  state = move(state, { type: 'finish', at: 3000 });
  expect(activityOutcome(state, true)).toMatchObject({
    completion: 'completed',
    completionBasis: 'patient_report',
    routineCreditEligible: false,
  });
});
