/**
 * Current regressions for handover findings P01 and P02 (review
 * 2026-09-27-c7ac7f3; agent-handover/reviews/2026-09-27-c7ac7f3/REVIEW.md).
 *
 * P01: replay-safe event and occurrence identity. The original probe
 * (agent-handover/tests archive, c7ac7f3/review.protocols.test.ts) supplies
 * one completed record twice; it must count once.
 *
 * P02: interval scheduling. The original probe is a specification-gap
 * demonstration on a frequency-only plan (no schedule existed). These tests
 * use the new explicit schedule contract (schedule.ts) with SYNTHETIC values
 * (2 h interval, 08:00-20:00 window): they are not clinical parameters; the
 * frozen-shoulder template stays inactive until approved (C05).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer } from '../../../store';
import type { ExerciseHistory } from '../../../store/slices/exerciseSlice';
import { applyPlan, ExercisePlan } from '../exercisePlan';
import { completionOf, nextAfter, occurrenceFor, todaysRoutine } from '../routine';
import { IntervalSchedule, roundState, validSchedule } from '../schedule';
import { EXERCISES } from '../../../constants/exercises';
import TodayPrep from '../../../components/exercises/TodayPrep';
import TodaysRoutineCard from '../../../components/exercises/TodaysRoutineCard';
import { confirmProgramme, setEpisode } from '../../care/episode';

/** Local time today (TZ-independent fixtures). */
const at = (h: number, m = 0) => new Date(2026, 8, 27, h, m).getTime();
const iso = (h: number, m = 0) => new Date(at(h, m)).toISOString();

const rec = (patch: Partial<ExerciseHistory>): ExerciseHistory => ({
  id: 'event-1',
  exerciseId: 'arm-raise',
  exerciseName: 'Arm raise',
  joint: 'left_shoulder',
  reps: 3,
  completion: 'completed',
  date: iso(10),
  duration: 50,
  formScore: 0,
  ...patch,
});

describe('P01: replay-safe event and occurrence identity', () => {
  const plan: ExercisePlan = {
    joint: 'shoulder',
    side: 'left',
    routine: [{ exerciseId: 'arm-raise', reps: 3, timesPerDay: 4 }],
  };

  it('the reviewer case: the same completed record twice counts once', () => {
    const r = todaysRoutine(plan, [rec({}), rec({})], at(10, 1));
    expect(r.doneCount).toBe(1);
    expect(r.conflicts).toEqual([]);
  });

  it('a second real session (its own event) fills the second occurrence', () => {
    const r = todaysRoutine(
      plan,
      [rec({}), rec({ id: 'event-2', date: iso(13) })],
      at(13, 1)
    );
    expect(r.doneCount).toBe(2);
  });

  // R01 (review 2026-09-27-a47ba14-source-review): a disputed id earns no
  // credit in either arrival order; replaced the earlier expectation that the
  // first-arrived record kept counting
  it.each([
    ['completed first', [rec({}), rec({ completion: 'attempted', reps: 0 })]],
    ['attempted first', [rec({ completion: 'attempted', reps: 0 }), rec({})]],
  ])('R01: a completed/attempted conflict earns nothing (%s)', (_, history) => {
    const r = todaysRoutine(plan, history as ExerciseHistory[], at(12));
    expect(r.doneCount).toBe(0);
    expect(r.items[0].status).toBeUndefined();
    expect(r.conflicts).toEqual(['event-1']);
  });

  it('R01: the same id across different occurrences or episodes is a conflict too', () => {
    const occ = todaysRoutine(
      plan,
      [rec({ occurrenceKey: 'arm-raise#1' }), rec({ occurrenceKey: 'arm-raise#2' })],
      at(12)
    );
    expect(occ.doneCount).toBe(0);
    expect(occ.conflicts).toEqual(['event-1']);
    const ep = todaysRoutine(
      plan,
      [rec({ episodeId: 'a' }), rec({ episodeId: 'b' })],
      at(12)
    );
    expect(ep.conflicts).toEqual(['event-1']);
  });

  it('R01: exact replay stays idempotent alongside a conflict elsewhere', () => {
    const r = todaysRoutine(
      plan,
      [rec({}), rec({}), rec({ id: 'x' }), rec({ id: 'x', reps: 1 })],
      at(12)
    );
    expect(r.doneCount).toBe(1);
    expect(r.conflicts).toEqual(['x']);
  });

  it('R01: a correction record settles a conflict and earns only its own credit', () => {
    const disputed = [rec({}), rec({ completion: 'attempted', reps: 0 })];
    const attempted = todaysRoutine(
      plan,
      [
        ...disputed,
        rec({ id: 'fix', resolves: 'event-1', completion: 'attempted', reps: 0 }),
      ],
      at(12)
    );
    expect(attempted.conflicts).toEqual([]);
    expect(attempted.doneCount).toBe(0);
    expect(attempted.items[0].status).toBe('attempted');
    const completed = todaysRoutine(
      plan,
      [...disputed, rec({ id: 'fix', resolves: 'event-1' })],
      at(12)
    );
    expect(completed.doneCount).toBe(1);
  });

  it('attribution is fixed when done: reordering the routine does not move it', () => {
    const two: ExercisePlan = {
      joint: 'knee',
      side: 'left',
      routine: [
        { exerciseId: 'heel-prop-extension' },
        { exerciseId: 'seated-knee-extension', timesPerDay: 2 },
      ],
    };
    const done = rec({
      exerciseId: 'seated-knee-extension',
      joint: 'left_knee',
      occurrenceKey: 'seated-knee-extension#2',
    });
    const r = todaysRoutine(two, [done], at(12));
    const byKey = Object.fromEntries(r.items.map((i) => [i.key, i.done]));
    expect(byKey['seated-knee-extension#1']).toBe(false);
    expect(byKey['seated-knee-extension#2']).toBe(true);
    const reordered = todaysRoutine(
      { ...two, routine: [...two.routine!].reverse() },
      [done],
      at(12)
    );
    expect(reordered.items.find((i) => i.key === 'seated-knee-extension#2')?.done).toBe(
      true
    );
  });

  it('the occurrence a session is for is the first not finished; none when nothing is due', () => {
    const r = todaysRoutine(plan, [rec({ occurrenceKey: 'arm-raise#1' })], at(10, 1));
    expect(occurrenceFor(r, 'arm-raise')).toBe('arm-raise#2');
  });

  it('a session from another care episode (before an operation) does not count', () => {
    const episode = confirmProgramme(setEpisode(plan, 'cuff_repair', undefined, at(9)));
    const r = todaysRoutine(
      episode,
      [rec({ episodeId: 'shoulder_before_surgery-old' })],
      at(10, 1)
    );
    expect(r.doneCount).toBe(0);
    const same = todaysRoutine(
      episode,
      [rec({ episodeId: episode.episode!.id })],
      at(10, 1)
    );
    expect(same.doneCount).toBe(1);
  });
});

describe('P02: interval schedule contract (synthetic values)', () => {
  const plan: ExercisePlan = {
    joint: 'shoulder',
    side: 'left',
    schedule: {
      kind: 'interval',
      minHours: 2,
      maxHours: 3,
      window: { start: '08:00', end: '20:00' },
    },
    routine: [
      { exerciseId: 'arm-raise', repRange: { min: 2, max: 3 } },
      { exerciseId: 'shoulder-external-rotation', repRange: { min: 2, max: 3 } },
    ],
  };
  const roundOne = [
    rec({ id: 'a1', occurrenceKey: 'arm-raise#1', date: iso(9, 50) }),
    rec({
      id: 'b1',
      exerciseId: 'shoulder-external-rotation',
      occurrenceKey: 'shoulder-external-rotation#1',
      date: iso(10),
    }),
  ];

  it('within a round, the next movement is offered', () => {
    const r = todaysRoutine(plan, [roundOne[0]], at(9, 51));
    expect(r.round).toBe(1);
    expect(r.next).toBe('shoulder-external-rotation');
    expect(nextAfter(r, 'arm-raise')).toBe('shoulder-external-rotation');
  });

  it('one minute after a round, nothing is offered; the next is due 2 h after it ended', () => {
    const r = todaysRoutine(plan, roundOne, at(10, 1));
    expect(r.roundsDone).toBe(1);
    expect(r.next).toBeUndefined();
    expect(nextAfter(r, 'shoulder-external-rotation')).toBeUndefined();
    expect(r.nextDueAt).toBe(at(12));
  });

  it('when due, the next round is offered', () => {
    const r = todaysRoutine(plan, roundOne, at(12));
    expect(r.round).toBe(2);
    expect(r.next).toBe('arm-raise');
  });

  it('missed rounds are not made up: hours later, only one round is due', () => {
    const r = todaysRoutine(plan, roundOne, at(17));
    expect(r.round).toBe(2);
    expect(r.items).toHaveLength(2);
    expect(r.items.every((i) => i.occurrence === 2)).toBe(true);
  });

  it('nothing outside the waking window; a round that would fall after it waits until tomorrow', () => {
    expect(todaysRoutine(plan, [], at(7)).nextDueAt).toBe(at(8));
    const late = [
      rec({ id: 'a', occurrenceKey: 'arm-raise#1', date: iso(18, 30) }),
      rec({
        id: 'b',
        exerciseId: 'shoulder-external-rotation',
        occurrenceKey: 'shoulder-external-rotation#1',
        date: iso(18, 40),
      }),
    ];
    const r = todaysRoutine(plan, late, at(18, 41));
    expect(r.next).toBeUndefined();
    expect(r.restOfDay).toBe(true);
    expect(todaysRoutine(plan, [], at(21)).restOfDay).toBe(true);
  });

  // Begun rounds: finishable while the window is open, closed after it
  // (replaces the earlier open-ended exemption; review limit on abandonment)
  it('a round begun late can be finished before the window closes, not after', () => {
    const begun = [rec({ id: 'a', occurrenceKey: 'arm-raise#1', date: iso(19, 50) })];
    expect(todaysRoutine(plan, begun, at(19, 59)).next).toBe(
      'shoulder-external-rotation'
    );
    const after = todaysRoutine(plan, begun, at(20, 5));
    expect(after.next).toBeUndefined();
    expect(after.restOfDay).toBe(true);
  });

  it('the lower bound of a repetition range completes the dose', () => {
    const ex = applyPlan(EXERCISES.armRaise, plan);
    expect(ex.targetRepetitions).toBe(2);
    expect(completionOf(ex, { reps: 2, durationSeconds: 30 })).toBe('completed');
    expect(completionOf(ex, { reps: 1, durationSeconds: 30 })).toBe('stopped_early');
  });

  it('an incomplete schedule offers nothing and never falls back to another rhythm', () => {
    const broken = {
      ...plan,
      schedule: { kind: 'interval', minHours: 2 },
    } as unknown as ExercisePlan;
    expect(validSchedule(broken.schedule)).toBe(false);
    const r = todaysRoutine(broken, [], at(10));
    expect(r.scheduleInvalid).toBe(true);
    expect(r.next).toBeUndefined();
  });

  it('roundState: the next round is due minHours after the previous ended, inside the window', () => {
    const s = plan.schedule as IntervalSchedule;
    expect(roundState(s, at(10), at(9))).toEqual({ due: false, from: at(11) });
    expect(roundState(s, at(11), at(9))).toEqual({ due: true });
  });

  it('the patient sees when the next mini-session is, and the range', () => {
    const r = todaysRoutine(plan, roundOne, at(10, 1));
    const defaults = rootReducer(undefined, { type: '@@test/INIT' });
    const store = configureStore({ reducer: rootReducer, preloadedState: defaults });
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <TodayPrep
          routine={r}
          plan={plan}
          onReady={jest.fn()}
          onRepeat={jest.fn()}
          onOpenSetup={jest.fn()}
          onHelp={jest.fn()}
        />
      </Provider>
    );
    expect(getByTestId('today-next-round')).toHaveTextContent(/Next mini-session from/);
    expect(getByTestId('today-next-round')).toHaveTextContent(/nothing to make up/);
    expect(queryByTestId('start-routine-button')).toBeNull();
    const card = render(<TodaysRoutineCard routine={todaysRoutine(plan, [], at(9))} />);
    expect(card.getByTestId('todays-routine-item-0')).toHaveTextContent(/2–3 times/);
  });
});
