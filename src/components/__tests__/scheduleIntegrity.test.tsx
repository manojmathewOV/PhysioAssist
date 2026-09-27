/**
 * Review 2026-09-27-a47ba14-source-review (agent-handover):
 * R02 - the schedule is part of the prescription (version + confirmation);
 * R03 - eligibility follows the clock in the rendered UI, and Start re-checks;
 * plus: the session is bound to its occurrence at the start, a new episode of
 * the same pathway, and the blank-field schedule editor.
 *
 * Schedule values are synthetic (2 h, 08:00-20:00), not clinical parameters.
 */
import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { RootState, rootReducer } from '../../store';
import { setExercisePlan } from '../../store/slices/settingsSlice';
import type { ExerciseHistory } from '../../store/slices/exerciseSlice';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import {
  confirmProgramme,
  episodeStatus,
  setEpisode,
  startNewEpisode,
} from '../../services/care/episode';
import { todaysRoutine } from '../../services/pose/routine';
import TodayPrep from '../exercises/TodayPrep';
import ScheduleCard from '../exercises/ScheduleCard';
import { useRoutineClock } from '../exercises/useRoutineClock';
import { useRoutineFlow } from '../exercises/useRoutineFlow';

const at = (h: number, m = 0, day = 27) => new Date(2026, 8, day, h, m).getTime();
const iso = (h: number, m = 0) => new Date(at(h, m)).toISOString();

const base: ExercisePlan = {
  joint: 'shoulder',
  side: 'left',
  schedule: {
    kind: 'interval',
    minHours: 2,
    maxHours: 3,
    window: { start: '08:00', end: '20:00' },
  },
  routine: [{ exerciseId: 'arm-raise', repRange: { min: 2, max: 3 } }],
};

const done = (h: number, m = 0): ExerciseHistory => ({
  id: `e-${h}-${m}`,
  exerciseId: 'arm-raise',
  exerciseName: 'Arm raise',
  joint: 'left_shoulder',
  reps: 2,
  completion: 'completed',
  occurrenceKey: 'arm-raise#1',
  date: iso(h, m),
  duration: 30,
  formScore: 0,
});

const storeWith = (plan: ExercisePlan, history: ExerciseHistory[] = []) => {
  const defaults = rootReducer(undefined, { type: '@@test/INIT' });
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...defaults,
      exercise: { ...defaults.exercise, history },
      settings: { ...defaults.settings, exercisePlan: plan },
    },
  });
};

describe('R02: the schedule is part of the prescription', () => {
  const confirmedState = () =>
    rootReducer(
      undefined,
      setExercisePlan(confirmProgramme(setEpisode(base, 'frozen_shoulder')))
    );

  it.each([
    ['minimum interval', { minHours: 3 }],
    ['maximum interval', { maxHours: 4 }],
    ['window start', { window: { start: '09:00', end: '20:00' } }],
    ['window end', { window: { start: '08:00', end: '19:00' } }],
  ])('changing only the %s needs a new version and re-confirmation', (_, patch) => {
    const before = confirmedState();
    const plan = before.settings.exercisePlan!;
    expect(episodeStatus(plan)).toBe('ready');
    const after = rootReducer(
      before,
      setExercisePlan({ ...plan, schedule: { ...plan.schedule!, ...patch } as never })
    );
    expect(after.settings.exercisePlan!.version).toBe(plan.version! + 1);
    expect(episodeStatus(after.settings.exercisePlan)).toBe('needs_confirmation');
  });

  it.each([
    ['removing the schedule', undefined],
    ['an incomplete schedule', { kind: 'interval' as const }],
  ])('%s needs a new version and re-confirmation', (_, schedule) => {
    const before = confirmedState();
    const plan = before.settings.exercisePlan!;
    const after = rootReducer(before, setExercisePlan({ ...plan, schedule }));
    expect(after.settings.exercisePlan!.version).toBe(plan.version! + 1);
    expect(episodeStatus(after.settings.exercisePlan)).toBe('needs_confirmation');
  });

  it('adding a schedule to a plan without one is a change too', () => {
    const before = rootReducer(
      undefined,
      setExercisePlan(
        confirmProgramme(setEpisode({ ...base, schedule: undefined }, 'frozen_shoulder'))
      )
    );
    const plan = before.settings.exercisePlan!;
    const after = rootReducer(
      before,
      setExercisePlan({ ...plan, schedule: base.schedule })
    );
    expect(after.settings.exercisePlan!.version).toBe(plan.version! + 1);
    expect(episodeStatus(after.settings.exercisePlan)).toBe('needs_confirmation');
  });

  it('a semantically unchanged schedule (other field order) is not a revision', () => {
    const before = confirmedState();
    const plan = before.settings.exercisePlan!;
    const same = {
      window: { end: '20:00', start: '08:00' },
      maxHours: 3,
      minHours: 2,
      kind: 'interval' as const,
    };
    const after = rootReducer(before, setExercisePlan({ ...plan, schedule: same }));
    expect(after.settings.exercisePlan!.version).toBe(plan.version);
    expect(episodeStatus(after.settings.exercisePlan)).toBe('ready');
  });
});

/** Today's screen as the app builds it: routine from the clock-aware hook. */
const Today: React.FC = () => {
  const plan = useSelector((s: RootState) => s.settings.exercisePlan);
  const history = useSelector((s: RootState) => s.exercise.history);
  const { routine } = useRoutineClock(plan, history);
  return (
    <TodayPrep
      routine={routine}
      plan={plan!}
      onReady={jest.fn()}
      onRepeat={jest.fn()}
      onOpenSetup={jest.fn()}
      onHelp={jest.fn()}
    />
  );
};

describe('R03: eligibility follows the clock on screen', () => {
  afterEach(() => jest.useRealTimers());

  it('one minute before due, then due, without any plan/history change', () => {
    jest.useFakeTimers({ now: at(11, 59) });
    const ui = render(
      <Provider store={storeWith(base, [done(10)])}>
        <Today />
      </Provider>
    );
    expect(ui.getByTestId('today-next-round')).toBeTruthy();
    expect(ui.queryByTestId('start-routine-button')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(61_000);
    });
    expect(ui.getByTestId('start-routine-button')).toBeTruthy();
    ui.unmount();
    // No timer left behind after unmount
    expect(jest.getTimerCount()).toBe(0);
  });

  it('back in the foreground after the due time, the round is offered', () => {
    jest.useFakeTimers({ now: at(10, 30) });
    let onChange: ((s: string) => void) | undefined;
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, cb) => {
      onChange = cb as (s: string) => void;
      return { remove: jest.fn() } as never;
    });
    const ui = render(
      <Provider store={storeWith(base, [done(10)])}>
        <Today />
      </Provider>
    );
    expect(ui.queryByTestId('start-routine-button')).toBeNull();
    // The app was in the background: time moved on, no timer fired
    jest.setSystemTime(at(12, 30));
    act(() => onChange?.('active'));
    expect(ui.getByTestId('start-routine-button')).toBeTruthy();
    spy.mockRestore();
    ui.unmount();
  });

  it('the window closing ends the day; midnight starts a new one', () => {
    jest.useFakeTimers({ now: at(19, 59) });
    const ui = render(
      <Provider store={storeWith(base, [done(17)])}>
        <Today />
      </Provider>
    );
    expect(ui.getByTestId('start-routine-button')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
    });
    expect(ui.getByTestId('today-rest-of-day')).toBeTruthy();
    // Past midnight: a new day, first round from the window start
    act(() => {
      jest.advanceTimersByTime(4 * 3600_000 + 2 * 60_000);
    });
    expect(ui.getByTestId('today-next-round')).toHaveTextContent(/first mini-session/);
    ui.unmount();
  });
});

describe('Start re-checks eligibility and binds the session at the start', () => {
  afterEach(() => jest.useRealTimers());

  it('a stale screen cannot start a round that is no longer due', () => {
    jest.useFakeTimers({ now: at(19, 59) });
    const store = storeWith(base, [done(17)]);
    const setSelectedKey = jest.fn();
    const { result } = renderHook(
      () => useRoutineFlow({ plan: base, setSelectedKey, start: jest.fn() }),
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );
    expect(result.current.routine.next).toBe('arm-raise');
    // The window closed while the screen showed the old state (no refresh)
    jest.setSystemTime(at(20, 1));
    act(() => result.current.startRoutine());
    expect(setSelectedKey).not.toHaveBeenCalled();
  });

  it('starting from the routine binds its occurrence and episode', () => {
    jest.useFakeTimers({ now: at(12, 30) });
    const plan = confirmProgramme(setEpisode(base, 'frozen_shoulder', undefined, at(9)));
    const store = storeWith(plan, [done(10)]);
    const { result } = renderHook(
      () => useRoutineFlow({ plan, setSelectedKey: jest.fn(), start: jest.fn() }),
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );
    act(() => result.current.startRoutine());
    expect(store.getState().exercise.sessionContext).toEqual({
      occurrenceKey: 'arm-raise#2',
      episodeId: plan.episode!.id,
    });
  });
});

describe('episode lifecycle', () => {
  it('a new episode of the same pathway gets a new identity; old sessions do not count', () => {
    const first = confirmProgramme(
      setEpisode(base, 'cuff_repair', undefined, at(8, 0, 1))
    );
    const second = confirmProgramme(startNewEpisode(first, at(8, 0, 20)));
    expect(second.episode!.id).not.toBe(first.episode!.id);
    expect(second.episode!.pathway).toBe('cuff_repair');
    const old = { ...done(10), episodeId: first.episode!.id };
    expect(todaysRoutine(second, [old], at(10, 1)).doneCount).toBe(0);
    expect(episodeStatus(startNewEpisode(first))).toBe('needs_confirmation');
  });
});

describe('schedule editor', () => {
  it('starts blank; incomplete timing is saved but offers nothing', () => {
    const onChange = jest.fn();
    const plan: ExercisePlan = { ...base, schedule: undefined };
    const ui = render(<ScheduleCard plan={plan} onChange={onChange} />);
    fireEvent(ui.getByTestId('schedule-toggle'), 'onValueChange', true);
    const drafted: ExercisePlan = onChange.mock.calls[0][0];
    expect(drafted.schedule).toEqual({ kind: 'interval' });
    expect(todaysRoutine(drafted, [], at(10)).scheduleInvalid).toBe(true);

    ui.rerender(<ScheduleCard plan={drafted} onChange={onChange} />);
    expect(ui.getByTestId('schedule-min-hours').props.value).toBe('');
    expect(ui.getByTestId('schedule-window-start').props.value).toBe('');
    expect(ui.getByTestId('schedule-problems')).toBeTruthy();

    fireEvent.changeText(ui.getByTestId('schedule-min-hours'), '2');
    fireEvent.changeText(ui.getByTestId('schedule-window-start'), '08:00');
    fireEvent.changeText(ui.getByTestId('schedule-window-end'), '20:00');
    fireEvent.press(ui.getByTestId('schedule-save'));
    const saved: ExercisePlan = onChange.mock.calls.at(-1)[0];
    expect(saved.schedule).toMatchObject({
      minHours: 2,
      window: { start: '08:00', end: '20:00' },
    });
    ui.rerender(<ScheduleCard plan={saved} onChange={onChange} />);
    expect(ui.getByTestId('schedule-complete')).toBeTruthy();
  });
});
