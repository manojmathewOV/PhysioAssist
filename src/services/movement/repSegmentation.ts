/**
 * Splits a recorded session into repetitions from the joint-of-interest angle.
 *
 * Every exercise here moves the joint away from neutral and back, so a rep is a
 * rise of the clinical angle and a return. Thresholds adapt to the patient's
 * own range (5th-95th percentile), with hysteresis so wobble near the top or
 * bottom doesn't split or merge reps.
 */
import { findLandmark } from '../pose/landmarkLookup';
import type { MovementFrame, Repetition } from './types';

/** Smallest movement (degrees) that counts as a repetition. */
export const MIN_REP_AMPLITUDE = 15;
/** Smallest hip drop (% of torso length) that counts, when timing by the hips. */
export const MIN_HIP_DROP = 8;
/** Within this many degrees of the peak counts as holding. */
export const HOLD_BAND_DEG = 5;

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];

/** Median of a small window, ignoring missing values (removes single-frame spikes). */
function smooth(values: (number | null)[], half = 2): (number | null)[] {
  return values.map((_, i) => {
    const window: number[] = [];
    for (let j = i - half; j <= i + half; j++) {
      const a = values[j];
      if (a !== null && a !== undefined) window.push(a);
    }
    if (window.length === 0) return null;
    window.sort((a, b) => a - b);
    return window[Math.floor(window.length / 2)];
  });
}

/**
 * How far the hips have dropped, in % of torso length (image y points down).
 * Filmed from the front, a squat barely changes the 2D knee angle (the bend
 * points at the camera) but the hips clearly go down and up.
 */
export function hipDrop(frames: MovementFrame[]): (number | null)[] {
  let torso: number | null = null;
  return frames.map((f) => {
    const lh = findLandmark(f.landmarks, 'left_hip');
    const rh = findLandmark(f.landmarks, 'right_hip');
    const ls = findLandmark(f.landmarks, 'left_shoulder');
    const rs = findLandmark(f.landmarks, 'right_shoulder');
    if (!lh || !rh || !ls || !rs || Math.min(lh.visibility, rh.visibility) < 0.5)
      return null;
    const hipY = (lh.y + rh.y) / 2;
    torso ??= Math.abs(hipY - (ls.y + rs.y) / 2) || null;
    return torso ? (hipY / torso) * 100 : null;
  });
}

/**
 * Repetitions from the joint angle. For knee and hip exercises filmed from the
 * front, pass `fallback: 'hipDrop'` to time repetitions by the hips going down
 * when the angle barely moves; range numbers still come from the joint angle.
 */
export function segmentReps(
  frames: MovementFrame[],
  { fallback }: { fallback?: 'hipDrop' } = {}
): Repetition[] {
  const angles = smooth(frames.map((f) => f.angle));
  const byAngle = segmentBy(frames, angles, angles, MIN_REP_AMPLITUDE);
  if (byAngle.length > 0 || fallback !== 'hipDrop') return byAngle;
  return segmentBy(frames, smooth(hipDrop(frames)), angles, MIN_HIP_DROP);
}

/** Split by `signal`; peaks, rest and hold are measured on `angles`. */
function segmentBy(
  frames: MovementFrame[],
  signal: (number | null)[],
  angles: (number | null)[],
  minAmplitude: number
): Repetition[] {
  const valid = signal.filter((a): a is number => a !== null).sort((a, b) => a - b);
  if (valid.length < 10) return [];
  const low = percentile(valid, 0.05);
  const high = percentile(valid, 0.95);
  const amplitude = high - low;
  if (amplitude < minAmplitude) return [];
  const upAt = low + 0.6 * amplitude;
  const downAt = low + 0.3 * amplitude;

  const reps: Repetition[] = [];
  let lastRestIndex = -1; // most recent frame below downAt
  let upIndex = -1; // where the current rep crossed upAt

  signal.forEach((a, i) => {
    if (a === null) return;
    if (upIndex < 0) {
      if (a < downAt) lastRestIndex = i;
      else if (a > upAt && lastRestIndex >= 0) upIndex = i;
      return;
    }
    if (a < downAt) {
      // Back near rest: the rep ends where the angle stops falling
      let end = i;
      while (
        end + 1 < signal.length &&
        signal[end + 1] !== null &&
        (signal[end + 1] as number) <= (signal[end] as number)
      ) {
        end++;
      }
      reps.push(buildRep(frames, signal, angles, lastRestIndex, end, reps.length));
      upIndex = -1;
      lastRestIndex = i;
    }
  });
  return reps;
}

function buildRep(
  frames: MovementFrame[],
  signal: (number | null)[],
  angles: (number | null)[],
  from: number,
  to: number,
  index: number
): Repetition {
  // Start where the signal last sat at its lowest before rising
  let start = from;
  while (
    start > 0 &&
    signal[start - 1] !== null &&
    (signal[start - 1] as number) <= (signal[start] as number)
  ) {
    start--;
  }
  let peakIndex = start;
  for (let i = start; i <= to; i++) {
    if ((angles[i] ?? -Infinity) > (angles[peakIndex] ?? -Infinity)) peakIndex = i;
  }
  const peak = angles[peakIndex] ?? 0;
  let holdMs = 0;
  for (let i = start + 1; i <= to; i++) {
    const a = angles[i];
    if (a !== null && a >= peak - HOLD_BAND_DEG) holdMs += frames[i].t - frames[i - 1].t;
  }
  return {
    index,
    startT: frames[start].t,
    peakT: frames[peakIndex].t,
    endT: frames[to].t,
    peakDegrees: peak,
    restDegrees: Math.min(angles[start] ?? peak, angles[to] ?? peak),
    holdMs,
    frames: frames.slice(start, to + 1),
    baseline: frames[start],
  };
}
