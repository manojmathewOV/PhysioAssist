/**
 * Measurements grouped into series: one per exercise and joint (a seated knee
 * straightening and a heel prop measure different things, so they are never
 * mixed), with sessions that couldn't be measured kept visible.
 *
 * Values are compared within one measurement method (see measurementMethodOf):
 * a change of dose or goal doesn't split a series, a change of how the number
 * is measured does. Older records without a method are kept apart.
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
  method?: string;
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
  /** Measured sessions with the current measurement method, oldest first. */
  comparable: SeriesPoint[];
  /** Measured sessions measured differently (or of unknown method), oldest first. */
  measuredDifferently: SeriesPoint[];
}

/**
 * Series of measured (or attempted) sessions, most recently active first.
 * The current method is the one the most recent session of the series used.
 */
export function measurementSeries(history: ExerciseHistory[]): MeasurementSeries[] {
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
        comparable: [],
        measuredDifferently: [],
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
      method: h.method,
    });
    if (measured) s.measuredCount++;
    else s.unmeasuredCount++;
  }
  const series = [...byKey.values()];
  for (const s of series) {
    const measured = s.points.filter((p) => p.measured);
    s.latest = measured[measured.length - 1];
    const method = s.points[s.points.length - 1]?.method;
    const same = (p: SeriesPoint) => method !== undefined && p.method === method;
    s.comparable = measured.filter(same);
    s.measuredDifferently = measured.filter((p) => !same(p));
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
