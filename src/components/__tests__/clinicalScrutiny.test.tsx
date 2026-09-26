/**
 * Acceptance cases from the clinical/product scrutiny of b06be91: one session
 * clock for timer, completion and history; separate same-day occurrences;
 * unknown side stays unknown; non-numeric readings are no readings.
 */
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer } from '../../store';
import {
  ExerciseHistory,
  clockOf,
  pauseExercise,
  resumeExercise,
  startExercise,
  stopExercise,
} from '../../store/slices/exerciseSlice';
import { EXERCISES } from '../../constants/exercises';
import ExerciseControls from '../exercises/ExerciseControls';
import { applyPlan, ExercisePlan } from '../../services/pose/exercisePlan';
import { completionOf, nextAfter, todaysRoutine } from '../../services/pose/routine';
import { activeMs, seconds, wallMs } from '../../services/session/sessionClock';
import { measureStaticHold } from '../../services/movement/staticHold';
import type { MovementFrame } from '../../services/movement/types';
import { measurementSeries } from '../../utils/measurementSeries';

describe('one session clock: 5 s active, 70 s paused, 3 s active', () => {
  const heel = applyPlan(EXERCISES.heelPropExtension, {
    joint: 'knee',
    side: 'left',
    routine: [{ exerciseId: 'heel-prop-extension', holdSeconds: 60 }],
  });

  beforeEach(() => jest.useFakeTimers({ now: new Date('2026-09-26T09:00:00Z') }));
  afterEach(() => jest.useRealTimers());

  it('the timer, completion and the saved record all say 8 active seconds', () => {
    const defaults = rootReducer(undefined, { type: '@@test/INIT' });
    const store = configureStore({ reducer: rootReducer, preloadedState: defaults });
    store.dispatch(startExercise(heel));
    const { getByTestId } = render(
      <Provider store={store}>
        <ExerciseControls isActive />
      </Provider>
    );
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    act(() => {
      store.dispatch(pauseExercise());
    });
    act(() => {
      jest.advanceTimersByTime(70000);
    });
    act(() => {
      store.dispatch(resumeExercise());
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(getByTestId('rep-ring').props.accessibilityLabel).toMatch(/^0:08 of 1:00/);

    // What the stop screens compute
    const clock = clockOf(store.getState().exercise);
    const duration = seconds(activeMs(clock, Date.now()));
    expect(duration).toBe(8);
    expect(seconds(wallMs(clock, Date.now()))).toBe(78);
    expect(completionOf(heel, { reps: 0, durationSeconds: duration })).toBe(
      'stopped_early'
    );

    store.dispatch(
      stopExercise({ joint: 'left_knee', measured: false, completion: 'stopped_early' })
    );
    expect(store.getState().exercise.history[0]).toMatchObject({
      duration: 8,
      wallSeconds: 78,
      pausedSeconds: 70,
      completion: 'stopped_early',
    });
  });
});

const on = (hour: number) => new Date(new Date().setHours(hour, 0, 0, 0)).toISOString();
const entry = (patch: Partial<ExerciseHistory>): ExerciseHistory => ({
  id: `${Math.random()}`,
  exerciseId: 'heel-prop-extension',
  exerciseName: 'Heel prop',
  date: on(9),
  reps: 0,
  duration: 60,
  formScore: 0,
  joint: 'left_knee',
  completion: 'completed',
  ...patch,
});

describe('several sessions of one exercise a day are separate occurrences', () => {
  const plan: ExercisePlan = {
    joint: 'knee',
    side: 'left',
    routine: [
      { exerciseId: 'heel-prop-extension', timesPerDay: 2 },
      { exerciseId: 'seated-knee-extension' },
    ],
  };

  it('the morning session does not complete the afternoon one', () => {
    const r = todaysRoutine(plan, [entry({ date: on(8) })]);
    expect(r.items.map((i) => [i.key, i.done])).toEqual([
      ['heel-prop-extension#1', true],
      ['seated-knee-extension#1', false],
      ['heel-prop-extension#2', false],
    ]);
    expect(r.next).toBe('seated-knee-extension');
  });

  it('a failed attempt stays with its occurrence until one finishes it', () => {
    const r = todaysRoutine(plan, [
      entry({ date: on(8), completion: 'attempted' }),
      entry({ date: on(9) }),
    ]);
    expect(r.items[0]).toMatchObject({ status: 'completed', occurrence: 1 });
    expect(r.items[2].status).toBeUndefined();
  });

  it('after the first session, the next is the other exercise, then the second session', () => {
    const r = todaysRoutine(plan, [
      entry({ date: on(8) }),
      entry({ exerciseId: 'seated-knee-extension', date: on(9) }),
    ]);
    expect(r.next).toBe('heel-prop-extension');
    expect(r.nextIndex).toBe(2);
    expect(nextAfter(r, 'seated-knee-extension')).toBe('heel-prop-extension');
  });
});

describe('unknown stays unknown', () => {
  it('a session with no recorded side does not complete a sided exercise', () => {
    const plan: ExercisePlan = {
      joint: 'knee',
      side: 'right',
      routine: [{ exerciseId: 'heel-prop-extension' }],
    };
    const r = todaysRoutine(plan, [entry({ joint: undefined })]);
    expect(r.items[0].done).toBe(false);
  });
});

describe('non-numeric readings are no readings', () => {
  const frame = (t: number, angle: number | null): MovementFrame => ({
    t,
    angle,
    landmarks: [],
    view: 'side',
  });

  it('a NaN or infinite angle breaks a hold', () => {
    const frames = Array.from({ length: 40 }, (_, i) =>
      frame(i * 100, i === 20 ? NaN : i === 21 ? Infinity : 6)
    );
    const hold = measureStaticHold(frames);
    // 0-1.9 s and 2.2-3.9 s: neither reaches 2 s
    expect(hold).toBeNull();
  });

  it('a hold whose time runs backwards is broken', () => {
    const frames = [...Array.from({ length: 30 }, (_, i) => frame(i * 100, 6))];
    frames[15] = frame(-5000, 6);
    expect(measureStaticHold(frames)).toBeNull();
  });

  it('non-numeric counts or times complete nothing', () => {
    const ext = EXERCISES.seatedKneeExtension;
    expect(completionOf(ext, { reps: NaN, durationSeconds: 60 })).toBe('attempted');
    const heel = EXERCISES.heelPropExtension;
    expect(completionOf(heel, { reps: 0, durationSeconds: Infinity })).toBe('attempted');
  });

  it('a non-numeric saved value is not plotted as a measurement', () => {
    const series = measurementSeries([
      entry({ bestDegrees: NaN, direction: 'toward' }),
      entry({ bestDegrees: 7, direction: 'toward', date: on(8) }),
    ]);
    expect(series[0].points.map((p) => p.degrees)).toEqual([7]);
  });
});
