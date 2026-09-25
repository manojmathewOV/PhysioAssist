/**
 * Pure summaries of exercise history for the Home and Progress screens.
 */
import type { ExerciseHistory } from '../store/slices/exerciseSlice';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar day (YYYY-MM-DD), so an evening session counts on the right day. */
const localDay = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dayKey = (iso: string) => localDay(new Date(iso).getTime());

export interface WeekSummary {
  sessions: number;
  reps: number;
  activeDays: number;
}

/** Sessions, reps and distinct active days in the last 7 days. */
export function summarizeWeek(
  history: ExerciseHistory[],
  now: number = Date.now()
): WeekSummary {
  const recent = history.filter((h) => now - new Date(h.date).getTime() < 7 * DAY_MS);
  return {
    sessions: recent.length,
    reps: recent.reduce((sum, h) => sum + h.reps, 0),
    activeDays: new Set(recent.map((h) => dayKey(h.date))).size,
  };
}

export interface DailyPoint {
  date: string;
  value: number;
}

/** Total reps per day for the last `days` days (oldest first, zero-filled). */
export function dailyReps(
  history: ExerciseHistory[],
  days = 7,
  now: number = Date.now()
): DailyPoint[] {
  const totals = new Map<string, number>();
  history.forEach((h) =>
    totals.set(dayKey(h.date), (totals.get(dayKey(h.date)) ?? 0) + h.reps)
  );
  return Array.from({ length: days }, (_, i) => {
    const date = localDay(now - (days - 1 - i) * DAY_MS);
    return { date, value: totals.get(date) ?? 0 };
  });
}

/** Consecutive days (ending today or yesterday) with at least one session. */
export function currentStreak(
  history: ExerciseHistory[],
  now: number = Date.now()
): number {
  const days = new Set(history.map((h) => dayKey(h.date)));
  let streak = 0;
  let cursor = now;
  if (!days.has(localDay(cursor))) {
    cursor -= DAY_MS; // today not done yet: count from yesterday
  }
  while (days.has(localDay(cursor))) {
    streak++;
    cursor -= DAY_MS;
  }
  return streak;
}
