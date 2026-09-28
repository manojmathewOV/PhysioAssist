import { analyseSession } from '../analysis';
import {
  collectHeldObservations,
  type HoldObservationProvider,
  type QuantitativeValue,
} from '../quantitativeObservations';
import { findExerciseOption } from '../../../components/exercises/exerciseCatalog';
import { sessionOutcome } from '../../../components/exercises/useMovementAnalysis';
import reducer, {
  startExercise,
  stopExercise,
} from '../../../store/slices/exerciseSlice';
import type { MovementContext, MovementFrame } from '../types';
const ctx: MovementContext = {
  joint: 'knee',
  side: 'left',
  exerciseId: 'heel-prop-extension',
};
const frames: MovementFrame[] = Array.from({ length: 25 }, (_, i) => ({
  t: i * 100,
  angle: 6,
  landmarks: [],
  view: 'side',
}));
const q = (value = 0): QuantitativeValue => ({
  id: 'test-position',
  unit: 'deg',
  state: 'observed',
  value,
  observedFrames: 25,
});
const provider = (values: QuantitativeValue[] = [q()]): HoldObservationProvider => ({
  method: 'synthetic-window-v1',
  observe: () => values,
});
// Exact synthetic quantities exercise data/interval contracts, not a sleeper detector.
describe('held quantitative observations, independent of warning thresholds', () => {
  it('invokes the explicit held observer, not a fabricated repetition detector', () => {
    const observe = jest.fn(() => [q(0)]),
      detect = jest.fn(() => []);
    const a = analyseSession(
      frames,
      ctx,
      {},
      { detect, observeHold: { method: 'synthetic-window-v1', observe } }
    );
    expect(a.result.status).toBe('measured');
    expect(detect).not.toHaveBeenCalled();
    expect(observe).toHaveBeenCalledTimes(1);
    expect(a.observations?.interval).toMatchObject({
      fromT: a.hold?.fromT,
      toT: a.hold?.toT,
      basis: 'accepted_angle_window',
      sampledFrames: 25,
    });
    expect(a.observations?.values[0]).toMatchObject({ value: 0, state: 'observed' });
    expect(a.findings).toEqual([]);
  });
  it('keeps zero, unavailable and not-applicable distinct', () => {
    const values = [
      q(0),
      {
        id: 'hidden-wrist',
        unit: 'deg',
        state: 'unavailable',
        observedFrames: 0,
        reason: 'not_seen',
      },
      {
        id: 'different-variant',
        unit: 'ratio',
        state: 'not_applicable',
        observedFrames: 0,
      },
    ] as QuantitativeValue[];
    const a = analyseSession(frames, ctx, {}, { observeHold: provider(values) });
    expect(a.observations?.values).toEqual(values);
    expect(a.observations?.values[1]).not.toHaveProperty('value');
  });
  it('allows independently observed quantities when no rotation interval is available, explicitly unpaired', () => {
    const a = analyseSession(
      frames.map((f) => ({ ...f, angle: null })),
      ctx,
      {},
      { observeHold: provider([q(3)]) }
    );
    expect(a.result.status).toBe('unavailable');
    expect(a.result.degrees).toBeUndefined();
    expect(a.observations?.interval?.basis).toBe('unmeasured_attempt');
    expect(a.observations?.values[0].value).toBe(3);
  });
  it.each([NaN, Infinity, -Infinity])(
    'rejects non-finite quantity %s rather than storing a normal number',
    (value) => {
      expect(
        collectHeldObservations(frames, ctx, null, provider([q(value)]))
      ).toMatchObject({ values: [], error: 'invalid_output' });
    }
  );
  it('rejects duplicate metrics, impossible counts and excessive payloads', () => {
    for (const values of [
      [q(), q()],
      [{ ...q(), observedFrames: 26 }],
      Array.from({ length: 33 }, (_, i) => ({ ...q(), id: String(i) })),
    ]) {
      expect(collectHeldObservations(frames, ctx, null, provider(values))).toMatchObject({
        values: [],
        error: 'invalid_output',
      });
    }
  });
  it('does not allow an unknown output to carry a number', () => {
    expect(
      collectHeldObservations(
        frames,
        ctx,
        null,
        provider([{ ...q(), state: 'unavailable' }])
      )?.error
    ).toBe('invalid_output');
  });
  it('records observer failure without manufacturing or replacing the angle', () => {
    const a = analyseSession(
      frames,
      ctx,
      {},
      {
        observeHold: {
          method: 'throwing-test',
          observe: () => {
            throw new Error('fixture');
          },
        },
      }
    );
    expect(a.result.degrees).toBe(6);
    expect(a.observations).toMatchObject({ values: [], error: 'observer_failed' });
  });
  it('calls no observer without a meaningful interval or on ambiguous timestamps', () => {
    const observe = jest.fn(() => [q()]);
    const p = { method: 'fixture', observe };
    expect(collectHeldObservations([], ctx, null, p)?.error).toBe('no_interval');
    expect(collectHeldObservations([frames[0], frames[0]], ctx, null, p)?.error).toBe(
      'no_interval'
    );
    expect(observe).not.toHaveBeenCalled();
  });
  it('preserves held values and interval through actual outcome, reducer and JSON round-trip', () => {
    const exercise = findExerciseOption('heel-prop-extension')!.exercise;
    const a = analyseSession(frames, ctx, {}, { observeHold: provider([q(1.5)]) });
    const result = sessionOutcome(a, {
      plan: { joint: 'knee', side: 'left' },
      exercise,
      recordingDemo: false,
      sessionRange: null,
    }).historyResult;
    const saved = reducer(
      reducer(undefined, startExercise(exercise)),
      stopExercise(result)
    ).history[0];
    expect(JSON.parse(JSON.stringify(saved)).observations).toEqual(a.observations);
    expect(saved.observations?.values[0].value).toBe(1.5);
  });
  it('retains per-repetition numeric findings alongside the human cue', () => {
    const input: MovementFrame[] = Array.from({ length: 241 }, (_, i) => ({
      t: i * 33,
      angle: 10 + 80 * Math.sin(Math.PI * ((i % 120) / 120)),
      landmarks: [],
      view: 'front',
    }));
    const context: MovementContext = {
      joint: 'shoulder',
      side: 'left',
      exerciseId: 'shoulder-external-rotation',
    };
    const hit = {
      id: 'elbow_from_side' as const,
      severity: 'warn' as const,
      value: 19.2,
      unit: 'deg' as const,
      durationMs: 450,
    };
    const a = analyseSession(input, context, {}, { detect: () => [hit] });
    expect(a.reps).toHaveLength(2);
    expect(a.findings[0].detail).toBe('Seen in 2 of 2 repetitions.');
    expect(a.compensationObservationCount).toBe(2);
    expect(a.compensationObservations).toHaveLength(2);
    expect(a.compensationObservations?.[0]).toMatchObject({
      ...hit,
      repetitionIndex: 0,
      basis: 'repetition_summary',
    });
    const exercise = findExerciseOption(context.exerciseId)!.exercise;
    const result = sessionOutcome(a, {
      plan: { joint: 'shoulder', side: 'left' },
      exercise,
      recordingDemo: false,
      sessionRange: null,
    }).historyResult;
    expect(result?.compensationObservations).toEqual(a.compensationObservations);
    expect(result?.compensationObservationCount).toBe(2);
  });
  it('does not install a measurement provider or alter legacy output by default', () => {
    expect(collectHeldObservations(frames, ctx, null)).toBeUndefined();
    expect(analyseSession(frames, ctx)).not.toHaveProperty('observations');
  });
});
