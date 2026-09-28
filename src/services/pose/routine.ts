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
import {
  RoundState,
  canonicalSchedule,
  roundState,
  validSchedule,
  windowToday,
} from './schedule';

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
  'schedule',
] as const;

const prescriptionOf = (plan: ExercisePlan) =>
  JSON.stringify(
    PRESCRIPTION_KEYS.map((k) =>
      k === 'schedule' ? canonicalSchedule(plan.schedule) : plan[k] ?? null
    )
  );

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
  /** Unique within the day: `${exerciseId}#${occurrence}` (the occurrence id). */
  key: string;
  /** Which of the day's sessions (or rounds) of this exercise (1-based). */
  occurrence: number;
  /** How many times a day it is prescribed (without an interval schedule). */
  timesPerDay: number;
  /** This occurrence's best outcome today, if tried. */
  status?: Completion;
  /** Completed today. */
  done: boolean;
  /** Completed or stopped early: move on to the next one. */
  finished: boolean;
}

export interface TodaysRoutine {
  /**
   * The occurrences to show: without a schedule, all of today's (all first
   * sessions, then all second ones, ...); with an interval schedule, the
   * current round's.
   */
  items: RoutineItemStatus[];
  /** Completed (of `items`). */
  doneCount: number;
  /** Completed or stopped early (of `items`). */
  finishedCount: number;
  /** The exercise to do now (undefined when all are done or a round isn't due). */
  next?: string;
  /** Its position in `items` (-1 when nothing is due). */
  nextIndex: number;
  /** Interval schedule: the current round (1-based) and rounds finished today. */
  round?: number;
  roundsDone?: number;
  /** Interval schedule: when the next round is due today, if not now. */
  nextDueAt?: number;
  /** Interval schedule: no more rounds today (outside or past the waking window). */
  restOfDay?: boolean;
  /**
   * A schedule is set but incomplete or invalid (e.g. no waking window):
   * nothing is offered until the treating team finishes it; it never falls
   * back to another rhythm.
   */
  scheduleInvalid?: boolean;
  /**
   * Event ids used by records with different contents. None of those records
   * earns credit until a correction record (`resolves`) settles it; listed
   * here so the clinician sees it, never silently resolved.
   */
  conflicts: string[];
}

const isFinished = (c?: Completion) => c === 'completed' || c === 'stopped_early';

type RoutineRecord = Pick<
  ExerciseHistory,
  'id' | 'exerciseId' | 'date' | 'joint' | 'reps' | 'completion'
> &
  Partial<
    Pick<
      ExerciseHistory,
      | 'occurrenceKey'
      | 'episodeId'
      | 'resolves'
      | 'durability'
      | 'activityDay'
      | 'routineCreditEligible'
    >
  >;

/** What must match for a repeated event id to be the same event. */
const payloadOf = (h: RoutineRecord) =>
  JSON.stringify([
    h.exerciseId,
    h.joint,
    h.date,
    h.reps,
    h.completion ?? null,
    h.occurrenceKey ?? null,
    h.episodeId ?? null,
  ]);

/**
 * One record per event.
 *
 * - An exact repeat (same id and contents, e.g. a replayed sync) counts once.
 * - The same id with different contents is a conflict. No record carrying a
 *   disputed id earns credit, whatever order they arrived in: arrival order
 *   is not clinical truth. The conflict is listed until it is resolved.
 * - A resolution is a separate correction record with its own id and
 *   `resolves` naming the disputed id; only the correction earns credit (and
 *   only as it itself records). The disputed originals stay withheld.
 */
function dedupe(history: RoutineRecord[]): {
  records: RoutineRecord[];
  conflicts: string[];
} {
  const payloads = new Map<string, Set<string>>();
  for (const h of history) {
    if (!h.id) continue;
    const set = payloads.get(h.id) ?? new Set<string>();
    set.add(payloadOf(h));
    payloads.set(h.id, set);
  }
  const disputed = new Set(
    [...payloads].filter(([, set]) => set.size > 1).map(([id]) => id)
  );
  const resolved = new Set(
    history.map((h) => h.resolves).filter((id): id is string => Boolean(id))
  );
  const seen = new Set<string>();
  const records: RoutineRecord[] = [];
  for (const h of history) {
    if (!h.id) {
      records.push(h);
      continue;
    }
    if (disputed.has(h.id) || seen.has(h.id)) continue;
    seen.add(h.id);
    records.push(h);
  }
  return {
    records,
    conflicts: [...disputed].filter((id) => !resolved.has(id)),
  };
}

/** `exerciseId#n` -> n, when it names this exercise. */
const occurrenceIn = (
  key: string | undefined,
  exerciseId: string
): number | undefined => {
  if (!key) return undefined;
  const [id, n] = key.split('#');
  const k = Number(n);
  return id === exerciseId && Number.isInteger(k) && k >= 1 ? k : undefined;
};

/**
 * Today's routine and what's done, for the plan's side and care episode.
 *
 * - A session on the other limb, with no recorded side, or from another care
 *   episode (e.g. before an operation) doesn't count: unknown stays unknown.
 * - Each saved session names the occurrence it was for (`occurrenceKey`, set
 *   when it was done), so reordering the routine later doesn't move it. Older
 *   records without one fill occurrences in time order.
 * - A replayed record (same event id and contents) counts once; a conflicting
 *   one is surfaced in `conflicts` and not counted.
 * - With an interval schedule (see schedule.ts), the routine is done in
 *   rounds: the current round's movements first, then the next round only
 *   when due inside the waking window; missed rounds aren't made up.
 */
export function todaysRoutine(
  plan: ExercisePlan | null | undefined,
  history: RoutineRecord[],
  now: number = Date.now()
): TodaysRoutine {
  const today = localDay(now);
  const routine = plan?.routine ?? [];
  const inRoutineIds = new Set(routine.map((i) => i.exerciseId));
  const episodeId = plan?.episode?.id;
  const { records, conflicts } = dedupe(
    history.filter((h) => h.durability !== 'pending' && h.routineCreditEligible !== false)
  );
  const todays = records
    .filter(
      (h) =>
        plan !== null &&
        plan !== undefined &&
        (h.activityDay ?? dayKey(h.date)) === today &&
        h.joint !== undefined &&
        h.joint.startsWith(`${plan.side}_`) &&
        inRoutineIds.has(h.exerciseId) &&
        // A record from another episode (another operation) never counts
        (h.episodeId === undefined ||
          episodeId === undefined ||
          h.episodeId === episodeId)
    )
    .sort((x, y) => x.date.localeCompare(y.date));

  // Each exercise's outcome per occurrence, and when each occurrence finished
  const status = new Map<string, Map<number, Completion>>();
  const finishedAt = new Map<string, Map<number, number>>();
  const next = new Map<string, number>(); // legacy fill position
  const record = (exerciseId: string, k: number, c: Completion, at: number) => {
    const byK = status.get(exerciseId) ?? new Map<number, Completion>();
    status.set(exerciseId, byK);
    const prev = byK.get(k);
    if (!prev || RANK[c] > RANK[prev]) byK.set(k, c);
    if (isFinished(c)) {
      const ends = finishedAt.get(exerciseId) ?? new Map<number, number>();
      finishedAt.set(exerciseId, ends);
      ends.set(k, Math.max(ends.get(k) ?? 0, at));
    }
  };
  for (const h of todays) {
    const c = completionOfSession(h);
    const at = new Date(h.date).getTime();
    const k =
      occurrenceIn(h.occurrenceKey, h.exerciseId) ??
      // Older records: fill occurrences in time order
      next.get(h.exerciseId) ??
      1;
    record(h.exerciseId, k, c, at);
    if (!h.occurrenceKey && isFinished(c)) next.set(h.exerciseId, k + 1);
  }

  const item = (p: PrescribedExercise, occurrence: number): RoutineItemStatus => {
    const st = status.get(p.exerciseId)?.get(occurrence);
    return {
      ...p,
      key: `${p.exerciseId}#${occurrence}`,
      occurrence,
      timesPerDay: timesPerDayOf(p),
      status: st,
      done: st === 'completed',
      finished: isFinished(st),
    };
  };
  const summary = (items: RoutineItemStatus[], due: boolean) => {
    const nextIndex = due ? items.findIndex((i) => !i.finished) : -1;
    return {
      items,
      doneCount: items.filter((i) => i.done).length,
      finishedCount: items.filter((i) => i.finished).length,
      next: nextIndex >= 0 ? items[nextIndex].exerciseId : undefined,
      nextIndex,
      conflicts,
    };
  };

  const schedule = plan?.schedule;
  if (schedule !== undefined && !validSchedule(schedule)) {
    return {
      ...summary(
        routine.map((p) => item(p, 1)),
        false
      ),
      scheduleInvalid: true,
    };
  }
  if (validSchedule(schedule) && routine.length) {
    // Rounds: the first not yet finished by every movement is the current one
    const roundDone = (r: number) =>
      routine.every((p) => isFinished(status.get(p.exerciseId)?.get(r)));
    let round = 1;
    while (roundDone(round)) round++;
    const items = routine.map((p) => item(p, round));
    const started = items.some((i) => i.status);
    const lastEnd =
      round > 1
        ? Math.max(
            ...routine.map((p) => finishedAt.get(p.exerciseId)?.get(round - 1) ?? 0)
          )
        : undefined;
    // A round already begun can be finished while the waking window is open;
    // once it closes, an unfinished round is left (not carried on
    // indefinitely). A new round waits until it's due.
    const windowOpen = now <= windowToday(schedule, now).end;
    const state: RoundState = started
      ? windowOpen
        ? { due: true }
        : { due: false, restOfDay: true }
      : roundState(schedule, now, lastEnd);
    return {
      ...summary(items, state.due),
      round,
      roundsDone: round - 1,
      nextDueAt: state.due ? undefined : state.from,
      restOfDay: state.restOfDay,
    };
  }

  const most = Math.max(0, ...routine.map(timesPerDayOf));
  const items: RoutineItemStatus[] = [];
  for (let occurrence = 1; occurrence <= most; occurrence++) {
    for (const p of routine) {
      if (occurrence <= timesPerDayOf(p)) items.push(item(p, occurrence));
    }
  }
  return summary(items, true);
}

/**
 * The occurrence a session of `exerciseId` done now is for: the first of this
 * exercise not finished yet (undefined when none is due: extra sessions don't
 * count towards another occurrence). Saved with the session.
 */
export function occurrenceFor(
  routine: TodaysRoutine,
  exerciseId: string
): string | undefined {
  if (routine.nextIndex < 0) return undefined;
  return routine.items.find((i) => i.exerciseId === exerciseId && !i.finished)?.key;
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
  // Nothing due (all done, or waiting for the next round's time)
  if (routine.nextIndex < 0) return undefined;
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
