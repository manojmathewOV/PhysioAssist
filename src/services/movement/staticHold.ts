/**
 * Static measurements: a joint angle held still (e.g. the knee resting straight
 * with the heel on a roll), measured as the average over the steadiest
 * stretch rather than counted as repetitions.
 *
 * The angle is unsigned: a knee a few degrees past straight reads the same as
 * one a few degrees short, so hyperextension isn't reported.
 */
import type { MovementDirection, MovementFrame } from './types';

/** How long the leg must stay still to be measured (ms). */
export const HOLD_WINDOW_MS = 2000;
/**
 * "Still": the angle stays within this range (degrees) over the window, above
 * MediaPipe's frame-to-frame jitter on a still limb (about 1-2°).
 */
export const HOLD_MAX_SPREAD_DEG = 3;
/**
 * A hold must be seen throughout: a frame without the angle, or a gap longer
 * than this between observations (ms), breaks it. Two similar readings seconds
 * apart say nothing about what happened in between.
 */
export const HOLD_MAX_GAP_MS = 250;

export interface StaticMeasurement {
  /** Average clinical angle over the chosen still window. */
  degrees: number;
  /** How long the chosen window lasted (ms). */
  heldMs: number;
  /** Range of the angle within the window (degrees): lower is steadier. */
  spreadDegrees: number;
  /** When the window started and ended. */
  fromT: number;
  toT: number;
}

/**
 * The best still window: at least HOLD_WINDOW_MS long with the angle within
 * HOLD_MAX_SPREAD_DEG, and among those the one nearest the goal end (for a
 * straightening measurement the straightest). Null when the joint never
 * stayed still long enough, or wasn't measurable.
 */
export function measureStaticHold(
  frames: MovementFrame[],
  direction: MovementDirection = 'toward',
  { windowMs = HOLD_WINDOW_MS, maxSpread = HOLD_MAX_SPREAD_DEG } = {}
): StaticMeasurement | null {
  let best: StaticMeasurement | null = null;
  // Split into stretches observed without a break, and search each on its own
  let segment: MovementFrame[] = [];
  const flush = () => {
    const found = measureContinuous(segment, direction, windowMs, maxSpread);
    if (
      found &&
      (!best ||
        (direction === 'toward'
          ? found.degrees < best.degrees
          : found.degrees > best.degrees))
    ) {
      best = found;
    }
    segment = [];
  };
  for (const f of frames) {
    const prev = segment[segment.length - 1];
    if (f.angle === null || (prev && f.t - prev.t > HOLD_MAX_GAP_MS)) flush();
    if (f.angle !== null) segment.push(f);
  }
  flush();
  return best;
}

/** The best still window within frames observed without a break. */
function measureContinuous(
  frames: MovementFrame[],
  direction: MovementDirection,
  windowMs: number,
  maxSpread: number
): StaticMeasurement | null {
  const pts = frames as (MovementFrame & { angle: number })[];
  const spread = (a: number, b: number) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = a; i <= b; i++) {
      lo = Math.min(lo, pts[i].angle);
      hi = Math.max(hi, pts[i].angle);
    }
    return hi - lo;
  };
  const mean = (a: number, b: number) => {
    let sum = 0;
    for (let i = a; i <= b; i++) sum += pts[i].angle;
    return sum / (b - a + 1);
  };

  // Every window of (just over) windowMs that is still; keep the one nearest
  // the goal end (for straightening, the straightest)
  let bestWindow: [number, number] | null = null;
  let bestMean = 0;
  let a = 0;
  for (let b = 0; b < pts.length; b++) {
    while (a < b && pts[b].t - pts[a + 1].t >= windowMs) a++;
    if (pts[b].t - pts[a].t < windowMs || spread(a, b) > maxSpread) continue;
    const m = mean(a, b);
    const better = !bestWindow || (direction === 'toward' ? m < bestMean : m > bestMean);
    if (better) {
      bestWindow = [a, b];
      bestMean = m;
    }
  }
  if (!bestWindow) return null;

  // Grow it while the angle stays still around the same value
  let [from, to] = bestWindow;
  while (from > 0 && spread(from - 1, to) <= maxSpread) from--;
  while (to < pts.length - 1 && spread(from, to + 1) <= maxSpread) to++;
  return {
    degrees: mean(from, to),
    heldMs: pts[to].t - pts[from].t,
    spreadDegrees: spread(from, to),
    fromT: pts[from].t,
    toT: pts[to].t,
  };
}
