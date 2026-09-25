import { EXERCISES } from '../../../constants/exercises';
import type { ExercisePlan } from '../../../services/pose/exercisePlan';
import { referenceFor } from '../useMovementAnalysis';

const ref = {
  exerciseId: 'arm-raise',
  source: 'demonstration' as const,
  savedAt: '2026-09-25T00:00:00Z',
  repCount: 5,
  peakDegrees: 150,
  bestDegrees: 155,
  restDegrees: 10,
  repDurationMs: 5000,
  holdMs: 1200,
};
const plan = (over: Partial<ExercisePlan>): ExercisePlan => ({
  joint: 'shoulder',
  side: 'left',
  ...over,
});

describe('which demonstration a session is compared with', () => {
  it('uses the demonstration saved for this exercise', () => {
    expect(referenceFor(plan({ reference: ref }), EXERCISES.armRaise)).toBe(ref);
    expect(
      referenceFor(plan({ reference: ref }), EXERCISES.shoulderPress)
    ).toBeUndefined();
  });

  it('uses a video demonstration only while the exercise still uses that video', () => {
    const withVideo = { ...ref, videoId: 'dQw4w9WgXcQ' };
    const same = plan({
      reference: withVideo,
      videos: { 'arm-raise': 'https://youtu.be/dQw4w9WgXcQ' },
    });
    const changed = plan({
      reference: withVideo,
      videos: { 'arm-raise': 'https://youtu.be/aaaaaaaaaaa' },
    });
    expect(referenceFor(same, EXERCISES.armRaise)).toBe(withVideo);
    expect(referenceFor(changed, EXERCISES.armRaise)).toBeUndefined();
  });
});
