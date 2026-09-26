/**
 * The physiotherapist's routine: the exercises assigned, in order, and which
 * of them are done today. Also versions the prescription, so sessions done
 * under different goals or limits aren't read as one series.
 */
import type { ExerciseHistory } from '../../store/slices/exerciseSlice';
import { dayKey, localDay } from '../../utils/progressSummary';
import type { ExercisePlan, PrescribedExercise } from './exercisePlan';

/** What the physio prescribes; a change to any of these starts a new version. */
const PRESCRIPTION_KEYS = [
  'joint',
  'side',
  'goalDegrees',
  'extensionGoalDegrees',
  'limitDegrees',
  'reps',
  'holdSeconds',
  'routine',
] as const;

const prescriptionOf = (plan: ExercisePlan) =>
  JSON.stringify(PRESCRIPTION_KEYS.map((k) => plan[k] ?? null));

/**
 * The plan to store: its version goes up when the prescription changed (a new
 * demonstration or video alone doesn't change it).
 */
export function withVersion(
  previous: ExercisePlan | null | undefined,
  next: ExercisePlan,
  now: string = new Date().toISOString()
): ExercisePlan {
  if (!previous) {
    return {
      ...next,
      version: next.version ?? 1,
      prescribedAt: next.prescribedAt ?? now,
    };
  }
  const version = previous.version ?? 1;
  return prescriptionOf(previous) === prescriptionOf(next)
    ? { ...next, version, prescribedAt: previous.prescribedAt }
    : { ...next, version: version + 1, prescribedAt: now };
}

export const inRoutine = (plan: ExercisePlan | null | undefined, exerciseId: string) =>
  Boolean(plan?.routine?.some((i) => i.exerciseId === exerciseId));

/** Adds the exercise at the end of the routine, or takes it out. */
export function toggleRoutine(plan: ExercisePlan, exerciseId: string): ExercisePlan {
  const routine = plan.routine ?? [];
  return {
    ...plan,
    routine: inRoutine(plan, exerciseId)
      ? routine.filter((i) => i.exerciseId !== exerciseId)
      : [...routine, { exerciseId }],
  };
}

/** Changes one routine exercise's own prescription (e.g. its repetitions). */
export function updateRoutineItem(
  plan: ExercisePlan,
  exerciseId: string,
  patch: Partial<Omit<PrescribedExercise, 'exerciseId'>>
): ExercisePlan {
  return {
    ...plan,
    routine: (plan.routine ?? []).map((i) =>
      i.exerciseId === exerciseId ? { ...i, ...patch } : i
    ),
  };
}

export interface TodaysRoutine {
  items: (PrescribedExercise & { done: boolean })[];
  doneCount: number;
  /** The first exercise not done yet today (undefined when all are done). */
  next?: string;
}

/**
 * Today's routine and what's done. An attempt counts as done even when it
 * couldn't be measured: the exercise itself still counts.
 */
export function todaysRoutine(
  plan: ExercisePlan | null | undefined,
  history: Pick<ExerciseHistory, 'exerciseId' | 'date'>[],
  now: number = Date.now()
): TodaysRoutine {
  const today = localDay(now);
  const doneToday = new Set(
    history.filter((h) => dayKey(h.date) === today).map((h) => h.exerciseId)
  );
  const items = (plan?.routine ?? []).map((i) => ({
    ...i,
    done: doneToday.has(i.exerciseId),
  }));
  return {
    items,
    doneCount: items.filter((i) => i.done).length,
    next: items.find((i) => !i.done)?.exerciseId,
  };
}

/** The exercise after this one in the routine that isn't done yet today. */
export function nextAfter(
  routine: TodaysRoutine,
  exerciseId: string
): string | undefined {
  const index = routine.items.findIndex((i) => i.exerciseId === exerciseId);
  const later =
    routine.items.slice(index + 1).find((i) => !i.done) ??
    // Then any earlier one still to do (never the one just finished)
    routine.items.find((i) => !i.done && i.exerciseId !== exerciseId);
  return later?.exerciseId;
}
