/**
 * Today's routine, kept current as time passes. Eligibility depends on the
 * clock (a mini-session becomes due, the waking window opens or closes, the
 * day changes), so the routine is recomputed at the next such boundary and
 * whenever the app returns to the foreground, not polled. The one timer is
 * cleared on unmount.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import type { ExerciseHistory } from '../../store/slices/exerciseSlice';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import { TodaysRoutine, todaysRoutine } from '../../services/pose/routine';
import { validSchedule, windowToday } from '../../services/pose/schedule';

/** Next local midnight after `now`. */
const nextMidnight = (now: number) => {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
};

/**
 * The next moment the routine's eligibility can change on its own: when the
 * next round is due, when the waking window opens or closes, or midnight.
 */
export function nextBoundary(
  plan: ExercisePlan | null | undefined,
  routine: TodaysRoutine,
  now: number
): number {
  const candidates = [nextMidnight(now)];
  if (routine.nextDueAt !== undefined) candidates.push(routine.nextDueAt);
  if (validSchedule(plan?.schedule)) {
    const { start, end } = windowToday(plan!.schedule!, now);
    candidates.push(start, end + 1);
  }
  return Math.min(...candidates.filter((t) => t > now));
}

export function useRoutineClock(
  plan: ExercisePlan | null | undefined,
  history: ExerciseHistory[]
): { routine: TodaysRoutine; now: number; refresh: () => void } {
  const [now, setNow] = useState(() => Date.now());
  const refresh = useCallback(() => setNow(Date.now()), []);
  const routine = useMemo(() => todaysRoutine(plan, history, now), [plan, history, now]);

  // Wake at the next boundary (one timer, replaced whenever it changes)
  useEffect(() => {
    const at = nextBoundary(plan, routine, now);
    const timer = setTimeout(refresh, Math.max(0, at - Date.now()) + 50);
    return () => clearTimeout(timer);
  }, [plan, routine, now, refresh]);

  // Back in the foreground: time may have passed
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { routine, now, refresh };
}
