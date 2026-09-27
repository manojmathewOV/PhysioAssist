import { profileOf } from '../analysis';
import { segmentReps } from '../repSegmentation';
import type { MovementFrame } from '../types';

/** Characterisation, not clinical validation or a new reporting method. */
const trace = (endpoint = 80): MovementFrame[] => {
  const ramp = Array.from({ length: 20 }, (_, i) => 20 + ((endpoint - 20) * i) / 19);
  const values = [
    ...Array(10).fill(20),
    ...ramp,
    ...Array(20).fill(endpoint),
    ...[...ramp].reverse(),
    ...Array(10).fill(20),
  ];
  return values.map((angle, i) => ({ t: i * 33, angle, landmarks: [], view: 'front' }));
};

describe('review: end-of-repetition selection uses the filtered trace', () => {
  it('removes one isolated raw-frame spike before selecting the repetition peak', () => {
    const frames = trace();
    frames[38].angle = 160;
    const reps = segmentReps(frames);
    expect(reps).toHaveLength(1);
    expect(Math.max(...frames.map((f) => f.angle as number))).toBe(160);
    expect(reps[0].peakDegrees).toBe(80);
    expect(profileOf(reps)?.bestDegrees).toBe(80);
  });

  it('does not eliminate an error sustained across most of the median window', () => {
    const frames = trace();
    for (let i = 36; i <= 40; i++) frames[i].angle = 100;
    expect(profileOf(segmentReps(frames))?.bestDegrees).toBe(100);
  });

  it('retains direction: straightening selects a minimum, not a maximum', () => {
    const frames = trace().map((f) => ({ ...f, angle: 100 - (f.angle as number) }));
    frames[38].angle = -60;
    const reps = segmentReps(frames, { direction: 'toward' });
    expect(reps).toHaveLength(1);
    expect(reps[0].peakDegrees).toBe(20);
    expect(profileOf(reps, 'toward')?.bestDegrees).toBe(20);
  });

  it('keeps best and typical peaks distinct without adding the two selections', () => {
    const frames = [60, 80, 100].flatMap((peak, rep) =>
      trace(peak).map((f) => ({ ...f, t: f.t + rep * 3000 }))
    );
    const reps = segmentReps(frames);
    expect(reps).toHaveLength(3);
    expect(profileOf(reps)).toMatchObject({ peakDegrees: 80, bestDegrees: 100 });
    expect(profileOf(reps)?.bestDegrees).toBe(
      Math.max(...reps.map((r) => r.peakDegrees))
    );
  });
});
