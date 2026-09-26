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
  'episode',
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

/** Moves an exercise earlier (-1) or later (+1) in the routine. */
export function moveRoutineItem(
  plan: ExercisePlan,
  exerciseId: string,
  delta: -1 | 1
): ExercisePlan {
  const routine = [...(plan.routine ?? [])];
  const from = routine.findIndex((i) => i.exerciseId === exerciseId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= routine.length) return plan;
  [routine[from], routine[to]] = [routine[to], routine[from]];
  return { ...plan, routine };
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
  {
    reps: rawReps,
    durationSeconds: rawDuration,
  }: { reps: number; durationSeconds: number }
): Completion {
  // Non-numeric counts or times count as nothing done
  const reps = Number.isFinite(rawReps) ? rawReps : 0;
  const durationSeconds = Number.isFinite(rawDuration) ? rawDuration : 0;
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
  /** Unique within the day: `${exerciseId}#${occurrence}`. */
  key: string;
  /** Which of the day's sessions of this exercise (1-based). */
  occurrence: number;
  /** How many times a day it is prescribed. */
  timesPerDay: number;
  /** This occurrence's best outcome today, if tried. */
  status?: Completion;
  /** Completed today. */
  done: boolean;
  /** Completed or stopped early: move on to the next one. */
  finished: boolean;
}

export interface TodaysRoutine {
  /** Every occurrence, in order: all first sessions, then all second ones, ... */
  items: RoutineItemStatus[];
  /** Completed today. */
  doneCount: number;
  /** Completed or stopped early today. */
  finishedCount: number;
  /** The exercise of the first occurrence not finished yet (undefined when all are). */
  next?: string;
  /** Its position in `items` (-1 when all are finished). */
  nextIndex: number;
}

const isFinished = (c?: Completion) => c === 'completed' || c === 'stopped_early';

/**
 * Today's routine and what's done, for the plan's side. A session of the same
 * exercise on the other limb, or with no recorded side (older records), doesn't
 * count: unknown stays unknown. An exercise prescribed several times a day has
 * one occurrence per session: the morning one doesn't complete the afternoon
 * one. Sessions fill occurrences in time order; attempts stay with the
 * occurrence they were for until one finishes it.
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
  const routine = plan?.routine ?? [];
  const perExercise = new Map<string, (Completion | undefined)[]>();
  for (const item of routine) {
    perExercise.set(item.exerciseId, new Array(timesPerDayOf(item)).fill(undefined));
  }
  const todays = history
    .filter(
      (h) =>
        dayKey(h.date) === today &&
        plan !== null &&
        plan !== undefined &&
        h.joint !== undefined &&
        h.joint.startsWith(`${plan.side}_`) &&
        perExercise.has(h.exerciseId)
    )
    .sort((x, y) => x.date.localeCompare(y.date));
  const filled = new Map<string, number>();
  for (const h of todays) {
    const slots = perExercise.get(h.exerciseId)!;
    const k = filled.get(h.exerciseId) ?? 0;
    if (k >= slots.length) continue; // more sessions than prescribed
    const c = completionOfSession(h);
    const prev = slots[k];
    if (!prev || RANK[c] > RANK[prev]) slots[k] = c;
    if (isFinished(c)) filled.set(h.exerciseId, k + 1);
  }
  const most = Math.max(0, ...routine.map(timesPerDayOf));
  const items: RoutineItemStatus[] = [];
  for (let occurrence = 1; occurrence <= most; occurrence++) {
    for (const item of routine) {
      const timesPerDay = timesPerDayOf(item);
      if (occurrence > timesPerDay) continue;
      const status = perExercise.get(item.exerciseId)![occurrence - 1];
      items.push({
        ...item,
        key: `${item.exerciseId}#${occurrence}`,
        occurrence,
        timesPerDay,
        status,
        done: status === 'completed',
        finished: isFinished(status),
      });
    }
  }
  const nextIndex = items.findIndex((i) => !i.finished);
  return {
    items,
    doneCount: items.filter((i) => i.done).length,
    finishedCount: items.filter((i) => i.finished).length,
    next: nextIndex >= 0 ? items[nextIndex].exerciseId : undefined,
    nextIndex,
  };
}

/** Times a day an exercise is prescribed (at least once). */
export const timesPerDayOf = (item: PrescribedExercise) =>
  Math.max(1, Math.floor(Number.isFinite(item.timesPerDay) ? item.timesPerDay! : 1));

/**
 * After a session of `exerciseId`: the next occurrence still to do, after the
 * one just done (never that same one again).
 */
export function nextAfter(
  routine: TodaysRoutine,
  exerciseId: string
): string | undefined {
  // The occurrence just done: the latest of this exercise that was tried
  // (or, when the session wasn't saved, its first occurrence still to do)
  let index = -1;
  routine.items.forEach((i, k) => {
    if (i.exerciseId === exerciseId && i.status) index = k;
  });
  if (index < 0) {
    index = routine.items.findIndex((i) => i.exerciseId === exerciseId && !i.finished);
  }
  const later =
    routine.items.slice(index + 1).find((i) => !i.finished) ??
    routine.items.find(
      (i, k) => !i.finished && k !== index && i.exerciseId !== exerciseId
    );
  return later?.exerciseId;
}
