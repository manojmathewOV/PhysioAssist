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

/** Repetitions done today (local day). */
export function repsToday(history: ExerciseHistory[], now: number = Date.now()): number {
  const today = localDay(now);
  return history
    .filter((h) => dayKey(h.date) === today)
    .reduce((sum, h) => sum + h.reps, 0);
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** The current Monday-to-Sunday week with active days marked. */
export function currentWeek(
  history: ExerciseHistory[],
  now: number = Date.now()
): { label: string; name: string; active: boolean; isToday: boolean }[] {
  const active = new Set(history.map((h) => dayKey(h.date)));
  const mondayOffset = (new Date(now).getDay() + 6) % 7; // 0 = Monday
  return WEEKDAY_LABELS.map((label, i) => {
    const key = localDay(now + (i - mondayOffset) * DAY_MS);
    return {
      label,
      name: WEEKDAY_NAMES[i],
      active: active.has(key),
      isToday: i === mondayOffset,
    };
  });
}

/**
 * One plain-language observation comparing the last 7 days with the 7 before,
 * or null when there isn't enough history to say anything useful.
 */
export function weeklyHighlight(
  history: ExerciseHistory[],
  now: number = Date.now()
): string | null {
  const inWindow = (from: number, to: number) =>
    history
      .filter((h) => {
        const t = new Date(h.date).getTime();
        return now - t >= from && now - t < to;
      })
      .reduce((sum, h) => sum + h.reps, 0);
  const thisWeek = inWindow(0, 7 * DAY_MS);
  const lastWeek = inWindow(7 * DAY_MS, 14 * DAY_MS);
  if (thisWeek === 0 && lastWeek === 0) return null;
  if (lastWeek === 0) return `You did ${thisWeek} repetitions this week. A great start.`;
  const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  if (change >= 5)
    return `You did ${change}% more repetitions than last week. Well done.`;
  if (change <= -5) {
    return `You did fewer repetitions than last week. Little and often is what helps most.`;
  }
  return 'You kept the same pace as last week. Nice and steady.';
}
