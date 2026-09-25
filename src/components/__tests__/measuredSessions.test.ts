/**
 * Sessions the live counter can't count (shoulder rotation, still
 * measurements) still reach the summary and the history.
 */
import { EXERCISES } from '../../constants/exercises';
import exerciseReducer, {
  startExercise,
  stopExercise,
} from '../../store/slices/exerciseSlice';
import { sessionOutcome } from '../exercises/useMovementAnalysis';
import type { SessionAnalysis } from '../../services/movement/analysis';

const analysis = (patch: Partial<SessionAnalysis>): SessionAnalysis => ({
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

describe('sessions measured by the movement analysis', () => {
  it('rotation: reps and an approximate rotation range come from the analysis', () => {
    const outcome = sessionOutcome(
      analysis({
        reps: [0, 1, 2].map((index) => ({ index }) as SessionAnalysis['reps'][number]),
        profile,
      }),
      {
        plan: { joint: 'shoulder', side: 'left' },
        exercise: EXERCISES.shoulderExternalRotation,
        recordingDemo: false,
        // The live counter's number here is arm height, not rotation
        sessionRange: { joint: 'left_shoulder', bestDegrees: 18 },
      }
    );
    expect(outcome.summary.reps).toBe(3);
    expect(outcome.summary.range).toMatchObject({
      bestDegrees: 60,
      measure: 'rotation',
      approximate: true,
    });
    expect(outcome.historyResult).toMatchObject({
      reps: 3,
      bestDegrees: 60,
      measure: 'rotation',
    });
  });

  it('heel prop: the steady resting angle, smaller is better', () => {
    const outcome = sessionOutcome(
      analysis({
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

  it('other exercises keep the live counter’s result', () => {
    const outcome = sessionOutcome(analysis({ profile }), {
      plan: { joint: 'shoulder', side: 'left' },
      exercise: EXERCISES.armRaise,
      recordingDemo: false,
      sessionRange: { joint: 'left_shoulder', bestDegrees: 150 },
    });
    expect(outcome.historyResult).toBeUndefined();
    expect(outcome.summary.reps).toBeUndefined();
  });

  it('history keeps a rotation session the live counter counted no reps for', () => {
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

  it('history keeps a still measurement with no repetitions', () => {
    let state = exerciseReducer(undefined, startExercise(EXERCISES.heelPropExtension));
    state = exerciseReducer(
      state,
      stopExercise({ joint: 'left_knee', bestDegrees: 6, direction: 'toward' })
    );
    expect(state.history[0]).toMatchObject({ reps: 0, bestDegrees: 6 });
  });

  it('history still skips an empty session', () => {
    let state = exerciseReducer(undefined, startExercise(EXERCISES.squat));
    state = exerciseReducer(state, stopExercise());
    expect(state.history).toHaveLength(0);
  });
});
