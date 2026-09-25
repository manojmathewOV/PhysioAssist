/**
 * Splits a recorded session into repetitions from the joint-of-interest angle.
 *
 * Most exercises move the joint away from neutral and back, so a rep is a rise
 * of the clinical angle and a return. Some move towards neutral (straightening
 * a bent knee while sitting): there a rep is a fall of the angle and a return,
 * and its peak is the smallest angle reached. Thresholds adapt to the
 * patient's own range (5th-95th percentile).
 */
import { findLandmark } from '../pose/landmarkLookup';
import type { MovementDirection, MovementFrame, Repetition } from './types';

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
  {
    fallback,
    direction = 'away',
  }: { fallback?: 'hipDrop'; direction?: MovementDirection } = {}
): Repetition[] {
  if (direction === 'toward') {
    // Segment the mirrored angle (a straightening is then a rise), then report
    // the real angles: the peak is the smallest, the rest the largest
    const flipped = smooth(frames.map((f) => (f.angle === null ? null : -f.angle)));
    return segmentBy(frames, flipped, flipped, MIN_REP_AMPLITUDE).map((r) => ({
      ...r,
      peakDegrees: -r.peakDegrees,
      restDegrees: -r.restDegrees,
    }));
  }
  const angles = smooth(frames.map((f) => f.angle));
  const byAngle = segmentBy(frames, angles, angles, MIN_REP_AMPLITUDE);
  if (byAngle.length > 0 || fallback !== 'hipDrop') return byAngle;
  return segmentBy(frames, smooth(hipDrop(frames)), angles, MIN_HIP_DROP);
}

/** A repetition's peak must stand out by this share of the session's range. */
export const MIN_PROMINENCE_SHARE = 0.35;
/** Wobble (in signal units) ignored when finding where a movement starts or ends. */
const EDGE_TOLERANCE = 1.5;

/**
 * Split by `signal`; peaks, rest and hold are measured on `angles`.
 *
 * A repetition is a peak that stands out from the valleys on both sides
 * (topographic prominence, as in scipy's find_peaks) by at least
 * max(minAmplitude, 35% of the session's range). Unlike fixed thresholds this
 * handles exercises that don't return to neutral between repetitions (a
 * shoulder press moves between "goalpost" and overhead) and rests at different
 * heights, and ignores a final repetition that never comes back down.
 */
function segmentBy(
  frames: MovementFrame[],
  signal: (number | null)[],
  angles: (number | null)[],
  minAmplitude: number
): Repetition[] {
  const idx: number[] = [];
  signal.forEach((a, i) => {
    if (a !== null) idx.push(i);
  });
  if (idx.length < 10) return [];
  const v = idx.map((i) => signal[i] as number);
  const sorted = [...v].sort((a, b) => a - b);
  const range = percentile(sorted, 0.95) - percentile(sorted, 0.05);
  const minProminence = Math.max(minAmplitude, MIN_PROMINENCE_SHARE * range);
  if (range < minAmplitude) return [];

  // Local maxima (plateaus count once, at their middle)
  const candidates: number[] = [];
  for (let k = 1; k < v.length - 1; k++) {
    if (v[k] > v[k - 1]) {
      let j = k;
      while (j + 1 < v.length && v[j + 1] === v[k]) j++;
      if (j + 1 < v.length && v[j + 1] < v[k]) candidates.push(Math.floor((k + j) / 2));
      k = j;
    }
  }

  // Prominence: height above the higher of the two lowest points reached
  // before the signal climbs above the peak on either side (or the data ends)
  const peaks = candidates.filter((k) => {
    let leftMin = v[k];
    for (let j = k - 1; j >= 0 && v[j] <= v[k]; j--) leftMin = Math.min(leftMin, v[j]);
    let rightMin = v[k];
    for (let j = k + 1; j < v.length && v[j] <= v[k]; j++)
      rightMin = Math.min(rightMin, v[j]);
    return v[k] - Math.max(leftMin, rightMin) >= minProminence;
  });

  // Merge peaks with no real valley between them (a wobbly top is one repetition)
  const kept: number[] = [];
  for (const k of peaks) {
    const prev = kept[kept.length - 1];
    if (prev !== undefined) {
      let valley = Infinity;
      for (let j = prev; j <= k; j++) valley = Math.min(valley, v[j]);
      if (Math.min(v[prev], v[k]) - valley < minProminence) {
        if (v[k] > v[prev]) kept[kept.length - 1] = k;
        continue;
      }
    }
    kept.push(k);
  }

  const argminBetween = (a: number, b: number) => {
    let m = a;
    for (let j = a; j <= b; j++) if (v[j] < v[m]) m = j;
    return m;
  };
  return kept.map((k, n) => {
    const leftValley = argminBetween(n === 0 ? 0 : kept[n - 1], k);
    const rightValley = argminBetween(
      k,
      n === kept.length - 1 ? v.length - 1 : kept[n + 1]
    );
    // The movement starts where the signal last left its valley level, and ends
    // where it gets back down to the valley level after the peak
    const drop = (v[k] - v[leftValley]) * 0.1 + EDGE_TOLERANCE;
    let a = k;
    while (a > leftValley && v[a - 1] > v[leftValley] + drop) a--;
    // ...then down to the bottom of that slope: the patient's rest posture
    while (a > leftValley && v[a - 1] < v[a]) a--;
    const rise = (v[k] - v[rightValley]) * 0.1 + EDGE_TOLERANCE;
    let b = k;
    while (b < rightValley && v[b + 1] > v[rightValley] + rise) b++;
    while (b < rightValley && v[b + 1] < v[b]) b++;
    return buildRep(frames, angles, idx[a], idx[k], idx[b], n);
  });
}

function buildRep(
  frames: MovementFrame[],
  angles: (number | null)[],
  start: number,
  peakAt: number,
  to: number,
  index: number
): Repetition {
  // The peak is the largest joint angle in the repetition (the signal may be
  // another measure, such as hip drop)
  let peakIndex = peakAt;
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
