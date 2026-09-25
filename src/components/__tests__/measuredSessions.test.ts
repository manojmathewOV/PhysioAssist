/**
 * One accepted result everywhere: the summary and the saved history use the
 * movement analysis's result, and "couldn't measure" stays that way (never a
 * live reading, never zero). Includes the failure cases from the independent
 * review of 06e77dd (front-view squat, incomplete heel prop, gappy hold).
 */
import { EXERCISES } from '../../constants/exercises';
import exerciseReducer, {
  startExercise,
  stopExercise,
} from '../../store/slices/exerciseSlice';
import { sessionOutcome } from '../exercises/useMovementAnalysis';
import { SessionAnalysis, analyseSession } from '../../services/movement/analysis';
import { MovementRecorder } from '../../services/movement/recorder';
import { measureStaticHold } from '../../services/movement/staticHold';
import type { MovementContext, MovementFrame } from '../../services/movement/types';
import { STANDING } from '../../testing/virtualPatient/body';
import { repetitions } from '../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../testing/virtualPatient/VirtualPatient';

const analysis = (patch: Partial<SessionAnalysis>): SessionAnalysis => ({
  result: { status: 'unavailable', reason: 'not_seen' },
  reps: [],
  profile: null,
  findings: [],
  cues: [],
  ...patch,
});

const profile = {
  repCount: 3,
  peakDegrees: 55,
  bestDegrees: 60,
  restDegrees: 0,
  repDurationMs: 3000,
  holdMs: 1500,
};
const threeReps = [0, 1, 2].map(
  (index) => ({ index }) as SessionAnalysis['reps'][number]
);

describe('summary and history take the analysis result', () => {
  it('front-view squat: the rejected knee angle is not replaced by the live reading', () => {
    // Real analysis of a squat filmed from the front
    const context: MovementContext = { joint: 'knee', side: 'left', exerciseId: 'squat' };
    const recorder = new MovementRecorder(context);
    const scenario = {
      id: 'front-squat',
      exerciseId: 'squat',
      title: '',
      description: '',
      base: { ...STANDING, view: 'front' as const },
      timeline: repetitions({
        rest: { leftKnee: 176, rightKnee: 176, leftHip: 176, rightHip: 176 },
        target: { leftKnee: 100, rightKnee: 100, leftHip: 100, rightHip: 100 },
        reps: 3,
        moveMs: 1200,
        holdMs: 800,
        restMs: 600,
      }),
      expect: { reps: 3 },
    };
    for (const f of new VirtualPatient(scenario).frames()) recorder.add(f.pose);
    const result = analyseSession(recorder.frames, context);
    expect(result.result.status).toBe('unavailable');

    // The live counter had a number (0° here, as in the review)
    const outcome = sessionOutcome(result, {
      plan: { joint: 'knee', side: 'left' },
      exercise: EXERCISES.squat,
      recordingDemo: false,
      sessionRange: { joint: 'left_knee', bestDegrees: 0 },
    });
    expect(outcome.summary.range).toBeNull();
    expect(outcome.summary.notice).toMatch(/couldn’t measure your left knee today/);
    expect(outcome.historyResult).toMatchObject({
      measured: false,
      bestDegrees: undefined,
    });
  });

  it('incomplete heel prop: no still window, so no number (not the live 5°)', () => {
    const context: MovementContext = {
      joint: 'knee',
      side: 'left',
      exerciseId: 'heel-prop-extension',
    };
    const frames: MovementFrame[] = [0, 40, 80, 120, 160].map((t) => ({
      t,
      angle: 5,
      landmarks: [],
      view: 'side',
    }));
    const result = analyseSession(frames, context);
    expect(result.result).toEqual({ status: 'unavailable', reason: 'not_still' });
    const outcome = sessionOutcome(result, {
      plan: { joint: 'knee', side: 'left' },
      exercise: EXERCISES.heelPropExtension,
      recordingDemo: false,
      sessionRange: { joint: 'left_knee', bestDegrees: 5 },
    });
    expect(outcome.summary.range).toBeNull();
    expect(outcome.summary.notice).toMatch(/didn’t stay still long enough/);
  });

  it('rotation: repetitions and an approximate rotation from the analysis, not arm height', () => {
    const outcome = sessionOutcome(
      analysis({
        result: { status: 'measured', degrees: 60, approximate: true },
        reps: threeReps,
        profile,
      }),
      {
        plan: { joint: 'shoulder', side: 'left', goalDegrees: 120 },
        exercise: EXERCISES.shoulderExternalRotation,
        recordingDemo: false,
        // The live counter's number here is arm height, not rotation
        sessionRange: { joint: 'left_shoulder', bestDegrees: 8, goalDegrees: 120 },
      }
    );
    expect(outcome.summary.reps).toBe(3);
    expect(outcome.summary.range).toMatchObject({
      bestDegrees: 60,
      measure: 'rotation',
      approximate: true,
      goalDegrees: undefined, // an elevation goal doesn't apply to rotation
    });
    expect(outcome.historyResult).toMatchObject({
      reps: 3,
      bestDegrees: 60,
      measured: true,
    });
  });

  it('heel prop: the steady resting angle, smaller is better', () => {
    const outcome = sessionOutcome(
      analysis({
        result: { status: 'measured', degrees: 6.4 },
        hold: { degrees: 6.4, heldMs: 3000, spreadDegrees: 1, fromT: 0, toT: 3000 },
      }),
      {
        plan: { joint: 'knee', side: 'left' },
        exercise: EXERCISES.heelPropExtension,
        recordingDemo: false,
        sessionRange: { joint: 'left_knee', bestDegrees: 2 },
      }
    );
    expect(outcome.summary.range).toMatchObject({ bestDegrees: 6, direction: 'toward' });
    expect(outcome.historyResult).toMatchObject({ bestDegrees: 6, direction: 'toward' });
  });

  it('the prescribed goal is shown, not the demonstration’s peak', () => {
    const plan = {
      joint: 'shoulder' as const,
      side: 'left' as const,
      goalDegrees: 90,
      reference: {
        ...profile,
        peakDegrees: 160,
        exerciseId: 'arm-raise',
        source: 'demonstration' as const,
        savedAt: '2026-01-01',
      },
    };
    const outcome = sessionOutcome(
      analysis({ result: { status: 'measured', degrees: 95 }, reps: threeReps, profile }),
      {
        plan,
        exercise: EXERCISES.armRaise,
        recordingDemo: false,
        sessionRange: { joint: 'left_shoulder', bestDegrees: 97, goalDegrees: 90 },
      }
    );
    expect(outcome.summary.range).toMatchObject({ bestDegrees: 95, goalDegrees: 90 });
    expect(outcome.summary.range?.goalLabel).toBeUndefined();
  });
});

describe('history', () => {
  it('keeps a rotation session the live counter counted no reps for', () => {
    let state = exerciseReducer(
      undefined,
      startExercise(EXERCISES.shoulderExternalRotation)
    );
    state = exerciseReducer(
      state,
      stopExercise({
        joint: 'left_shoulder',
        bestDegrees: 60,
        measure: 'rotation',
        reps: 3,
      })
    );
    expect(state.history[0]).toMatchObject({
      reps: 3,
      bestDegrees: 60,
      measure: 'rotation',
    });
  });

  it('keeps an attempt that could not be measured, marked as such', () => {
    let state = exerciseReducer(undefined, startExercise(EXERCISES.heelPropExtension));
    state = exerciseReducer(
      state,
      stopExercise({
        joint: 'left_knee',
        measured: false,
        unavailableReason: 'not_still',
      })
    );
    expect(state.history[0]).toMatchObject({
      measured: false,
      unavailableReason: 'not_still',
    });
    expect(state.history[0].bestDegrees).toBeUndefined();
  });

  it('still skips an empty session', () => {
    let state = exerciseReducer(undefined, startExercise(EXERCISES.squat));
    state = exerciseReducer(state, stopExercise());
    expect(state.history).toHaveLength(0);
  });
});

describe('still holds must be observed throughout', () => {
  const frame = (t: number, angle: number | null): MovementFrame => ({
    t,
    angle,
    landmarks: [],
    view: 'side',
  });

  it('two similar readings five seconds apart are not a five-second hold', () => {
    expect(measureStaticHold([frame(0, 8), frame(5000, 8)])).toBeNull();
  });

  it('a frame without the angle breaks the hold', () => {
    const frames = Array.from({ length: 50 }, (_, i) =>
      frame(i * 100, i === 15 ? null : 8)
    );
    // 0-1.4 s and 1.6-4.9 s: only the second stretch is long enough
    const hold = measureStaticHold(frames);
    expect(hold?.fromT).toBe(1600);
  });

  it('with the angle missing in every other frame there is no hold', () => {
    const frames = Array.from({ length: 50 }, (_, i) => frame(i * 100, i % 2 ? null : 8));
    expect(measureStaticHold(frames)).toBeNull();
  });
});
