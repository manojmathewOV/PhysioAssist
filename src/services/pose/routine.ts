/**
 * The physiotherapist's routine: the exercises assigned, in order, and which
 * of them are done today. Also versions the prescription, so sessions done
 * under different goals or limits aren't read as one series.
 */
import type { ExerciseHistory } from '../../store/slices/exerciseSlice';
import { dayKey, localDay } from '../../utils/progressSummary';
import type { Exercise } from '../../types/exercise';
import { movementOf } from '../movement/exerciseMovement';
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

/**
 * How much of a prescribed exercise a session did. Completion is separate
 * from measurement: an exercise can be completed without a usable camera
 * reading, and a camera failure before any exercise is only an attempt.
 * Stopping early (e.g. because of symptoms) is a normal outcome, not a
 * failure, and isn't called completed.
 */
export type Completion = 'completed' | 'stopped_early' | 'attempted';

/** Held at least this long (s), a still exercise stopped before its time counts as started. */
const MIN_STOPPED_EARLY_S = 5;

/**
 * From the session: repetition exercises by repetitions against the target,
 * still holds by how long the session lasted against the prescribed time.
 */
export function completionOf(
  exercise: Pick<Exercise, 'id' | 'targetRepetitions' | 'phases'>,
  { reps, durationSeconds }: { reps: number; durationSeconds: number }
): Completion {
  if (movementOf(exercise.id).mode === 'hold') {
    const holdSeconds = (exercise.phases[0]?.holdDuration ?? 0) / 1000;
    if (durationSeconds >= holdSeconds) return 'completed';
    return durationSeconds >= MIN_STOPPED_EARLY_S ? 'stopped_early' : 'attempted';
  }
  if (reps >= Math.max(1, exercise.targetRepetitions ?? 1)) return 'completed';
  return reps > 0 ? 'stopped_early' : 'attempted';
}

/** A saved session's completion (older sessions: any repetition counted). */
const completionOfSession = (h: Pick<ExerciseHistory, 'completion' | 'reps'>) =>
  h.completion ?? (h.reps > 0 ? 'completed' : 'attempted');

const RANK: Record<Completion, number> = { attempted: 1, stopped_early: 2, completed: 3 };

export interface RoutineItemStatus extends PrescribedExercise {
  /** Today's best outcome, if tried today. */
  status?: Completion;
  /** Completed today. */
  done: boolean;
  /** Completed or stopped early: move on to the next one. */
  finished: boolean;
}

export interface TodaysRoutine {
  items: RoutineItemStatus[];
  /** Completed today. */
  doneCount: number;
  /** Completed or stopped early today. */
  finishedCount: number;
  /** The first exercise not finished yet today (undefined when all are). */
  next?: string;
}

/**
 * Today's routine and what's done, for the plan's side: a session of the
 * same exercise on the other limb doesn't count.
 */
export function todaysRoutine(
  plan: ExercisePlan | null | undefined,
  history: Pick<
    ExerciseHistory,
    'exerciseId' | 'date' | 'joint' | 'reps' | 'completion'
  >[],
  now: number = Date.now()
): TodaysRoutine {
  const today = localDay(now);
  const best = new Map<string, Completion>();
  for (const h of history) {
    if (dayKey(h.date) !== today) continue;
    if (h.joint && plan && !h.joint.startsWith(`${plan.side}_`)) continue;
    const c = completionOfSession(h);
    const prev = best.get(h.exerciseId);
    if (!prev || RANK[c] > RANK[prev]) best.set(h.exerciseId, c);
  }
  const items = (plan?.routine ?? []).map((i) => {
    const status = best.get(i.exerciseId);
    return {
      ...i,
      status,
      done: status === 'completed',
      finished: status === 'completed' || status === 'stopped_early',
    };
  });
  return {
    items,
    doneCount: items.filter((i) => i.done).length,
    finishedCount: items.filter((i) => i.finished).length,
    next: items.find((i) => !i.finished)?.exerciseId,
  };
}

/** The exercise after this one in the routine that isn't done yet today. */
export function nextAfter(
  routine: TodaysRoutine,
  exerciseId: string
): string | undefined {
  const index = routine.items.findIndex((i) => i.exerciseId === exerciseId);
  const later =
    routine.items.slice(index + 1).find((i) => !i.finished) ??
    // Then any earlier one still to do (never the one just finished)
    routine.items.find((i) => !i.finished && i.exerciseId !== exerciseId);
  return later?.exerciseId;
}
