/**
 * Measurements grouped into series: one per exercise and joint (a seated knee
 * straightening and a heel prop measure different things, so they are never
 * mixed), with sessions that couldn't be measured kept visible.
 *
 * Deliberately no "improved by N°": how repeatable a home camera measurement
 * is hasn't been established, so the series reports what was measured and
 * leaves the judgement of change to the physiotherapist.
 */
import type { ExerciseHistory } from '../store/slices/exerciseSlice';

export interface SeriesPoint {
  date: string;
  degrees?: number;
  approximate?: boolean;
  measured: boolean;
  planVersion?: number;
}

export interface MeasurementSeries {
  key: string;
  exerciseId: string;
  exerciseName: string;
  joint: string;
  direction?: 'away' | 'toward';
  measure?: string;
  /** Oldest first. */
  points: SeriesPoint[];
  measuredCount: number;
  unmeasuredCount: number;
  /** Most recent measured session (under any prescription). */
  latest?: SeriesPoint;
  /** Measured sessions under the current prescription, oldest first. */
  thisPlan: SeriesPoint[];
  /** Measured sessions under earlier prescriptions, oldest first. */
  earlierPlans: SeriesPoint[];
}

/**
 * Series of measured (or attempted) sessions, most recently active first.
 * `currentVersion` is the plan's prescription version now: only sessions
 * under it are "this plan" (without it, the latest measured session's).
 */
export function measurementSeries(
  history: ExerciseHistory[],
  currentVersion?: number
): MeasurementSeries[] {
  const byKey = new Map<string, MeasurementSeries>();
  // History is newest first; build each series oldest first
  for (const h of [...history].reverse()) {
    const attempted =
      (h.bestDegrees !== undefined && Number.isFinite(h.bestDegrees)) ||
      h.measured === false;
    if (!h.joint || !attempted) continue;
    const key = `${h.exerciseId}:${h.joint}`;
    let s = byKey.get(key);
    if (!s) {
      s = {
        key,
        exerciseId: h.exerciseId,
        exerciseName: h.exerciseName,
        joint: h.joint,
        points: [],
        measuredCount: 0,
        unmeasuredCount: 0,
        thisPlan: [],
        earlierPlans: [],
      };
      byKey.set(key, s);
    }
    s.direction = h.direction ?? s.direction;
    s.measure = h.measure ?? s.measure;
    const measured =
      h.measured !== false &&
      h.bestDegrees !== undefined &&
      Number.isFinite(h.bestDegrees);
    s.points.push({
      date: h.date,
      degrees: measured ? h.bestDegrees : undefined,
      approximate: h.approximate,
      measured,
      planVersion: h.planVersion,
    });
    if (measured) s.measuredCount++;
    else s.unmeasuredCount++;
  }
  const series = [...byKey.values()];
  for (const s of series) {
    const measured = s.points.filter((p) => p.measured);
    s.latest = measured[measured.length - 1];
    const version = currentVersion ?? s.latest?.planVersion;
    s.thisPlan = measured.filter((p) => p.planVersion === version);
    s.earlierPlans = measured.filter((p) => p.planVersion !== version);
  }
  return series.sort((a, b) =>
    (b.points[b.points.length - 1]?.date ?? '').localeCompare(
      a.points[a.points.length - 1]?.date ?? ''
    )
  );
}

/** "8° from straight", "~60° rotation", "95°". */
export function seriesValue(
  s: Pick<MeasurementSeries, 'direction' | 'measure'>,
  p: SeriesPoint
): string {
  const value = `${p.approximate ? '~' : ''}${p.degrees}°`;
  if (s.measure) return `${value} ${s.measure}`;
  return s.direction === 'toward' ? `${value} from straight` : value;
}
