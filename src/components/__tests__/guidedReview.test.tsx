import React from 'react';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { rootReducer } from '../../store';
import { useGuidedRoutine } from '../exercises/useGuidedRoutine';
import GuidedActivity from '../exercises/GuidedActivity';
import HomeScreen from '../../screens/HomeScreen';
import ProgressScreen from '../../screens/ProgressScreen';
import { todaysRoutine } from '../../services/pose/routine';
import { EXERCISES } from '../../constants/exercises';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
const plan: ExercisePlan = {
  joint: 'shoulder',
  side: 'left',
  reps: 2,
  routine: [{ exerciseId: 'arm-raise', reps: 2, holdSeconds: 4 }],
};
function setup(pending = false, includeSaved = false) {
  const initial = rootReducer(undefined, { type: 'init' });
  const key = todaysRoutine(plan, [], Date.now()).items[0].key;
  const record = {
    id: 'pending-one',
    exerciseId: 'arm-raise',
    exerciseName: 'Arm raise',
    profileId: 'review-person',
    date: new Date().toISOString(),
    joint: 'left_shoulder',
    occurrenceKey: key,
    planVersion: plan.version,
    duration: 6,
    reps: 0,
    formScore: 0,
    kind: 'activity',
    completion: 'completed',
    completionBasis: 'patient_report',
    measured: false,
    durability: pending ? 'pending' : 'saved',
    writeRevision: 1,
  };
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initial,
      user: {
        ...initial.user,
        currentUser: { id: 'review-person', name: 'Example', email: '', profile: {} },
      },
      settings: { ...initial.settings, exercisePlan: plan, enableSpeech: false },
      exercise: {
        ...initial.exercise,
        history: (pending || includeSaved ? [record] : []) as any,
        historySaveErrors: pending ? { 'pending-one': 1 } : {},
      },
    },
  });
  return {
    store,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  };
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-28T10:00:00Z'));
  Object.defineProperty(AppState, 'currentState', {
    value: 'active',
    configurable: true,
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
it('Today opens preparation without starting the clock (review R1)', () => {
  const { wrapper } = setup();
  const h = renderHook(() => useGuidedRoutine(), { wrapper });
  act(() => h.result.current.start());
  expect(h.result.current.content).not.toBeNull();
  expect(
    (h.result.current.content as React.ReactElement).props.startedAt
  ).toBeUndefined();
  const ui = render(h.result.current.content as React.ReactElement, { wrapper });
  act(() => {
    jest.advanceTimersByTime(30000);
  });
  expect(ui.queryByTestId('guided-time')).toBeNull();
  expect(ui.getByTestId('guided-start')).toBeTruthy();
  ui.unmount();
  h.unmount();
});
it('a pending occurrence cannot be started again (review R4)', () => {
  const { wrapper } = setup(true);
  const h = renderHook(() => useGuidedRoutine(), { wrapper });
  act(() => h.result.current.start());
  expect(h.result.current.content).toBeNull();
  h.unmount();
});
it('Home does not invite repeating the activity awaiting save', () => {
  const { wrapper } = setup(true);
  const ui = render(<HomeScreen />, { wrapper });
  expect(ui.queryByTestId('home-start-exercises')).toBeNull();
  expect(ui.getByTestId('home-pending-action')).toHaveTextContent(
    'Review unsaved activity'
  );
  ui.unmount();
});
it('asking for a report is not presented as a save failure', () => {
  const ui = render(
    <GuidedActivity
      exercise={EXERCISES.armRaise}
      side="left"
      amount="2 times"
      allowed
      onExit={jest.fn()}
      onRecord={jest.fn()}
    />
  );
  fireEvent.press(ui.getByTestId('guided-start'));
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  fireEvent.press(ui.getByTestId('guided-stop'));
  expect(ui.getByTestId('guided-unsaved')).toHaveTextContent(
    'Tell us how it went to save'
  );
  ui.unmount();
});
it('saved guided activity uses status instead of elapsed seconds as the Home headline', () => {
  const { wrapper } = setup(false, true);
  const ui = render(<HomeScreen />, { wrapper });
  expect(ui.getByTestId('home-progress')).toHaveTextContent('Completed');
  ui.unmount();
});
it('Progress uses the singular for one recorded activity', () => {
  const { wrapper } = setup(false, true);
  const ui = render(<ProgressScreen />, { wrapper });
  expect(ui.queryByText('activities recorded this week')).toBeNull();
  expect(ui.getByText('activity recorded this week')).toBeTruthy();
  ui.unmount();
});

// A daily occurrence key is reused tomorrow: an old failed save must not block care.
it('a pending occurrence from yesterday cannot block today', () => {
  const { store } = setup(true);
  const previous = store.getState();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const s = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...previous,
      exercise: {
        ...previous.exercise,
        history: previous.exercise.history.map((h) => ({ ...h, date: yesterday })),
      },
    },
  });
  const h = renderHook(() => useGuidedRoutine(), {
    wrapper: ({ children }) => <Provider store={s}>{children}</Provider>,
  });
  act(() => h.result.current.start());
  expect(h.result.current.content).not.toBeNull();
  h.unmount();
});

it.each([
  { item: { exerciseId: 'arm-raise', repRange: { min: 2, max: 3 } }, min: 2, max: 3 },
  {
    item: { exerciseId: 'arm-raise', reps: 2, repRange: { min: 2, max: 3 } },
    min: 2,
    max: 2,
  },
])(
  'passes both prescribed bounds to the guided activity ($min–$max)',
  ({ item, min, max }) => {
    const { store } = setup();
    const initial = store.getState();
    const s = configureStore({
      reducer: rootReducer,
      preloadedState: {
        ...initial,
        settings: { ...initial.settings, exercisePlan: { ...plan, routine: [item] } },
      },
    });
    const h = renderHook(() => useGuidedRoutine(), {
      wrapper: ({ children }) => <Provider store={s}>{children}</Provider>,
    });
    act(() => h.result.current.start());
    const activity = h.result.current.content as React.ReactElement;
    expect(activity.props.minimumReps).toBe(min);
    expect(activity.props.maximumReps).toBe(max);
    h.unmount();
  }
);
