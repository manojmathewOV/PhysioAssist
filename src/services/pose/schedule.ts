/**
 * When mini-sessions are due, for a programme done in short rounds spread
 * through the day (e.g. a few repetitions of each movement, repeated every
 * few hours while awake).
 *
 * This is a generic contract with no clinical defaults: the interval and the
 * waking window must be set explicitly by the treating team (see the handover
 * approvals register, C05). A plan without a schedule keeps the plain
 * times-per-day behaviour.
 *
 * Rules: all movements of the current round come first; after a round is
 * finished the next one is due `minHours` later, only inside the waking
 * window; nothing is due outside it; a missed round is not made up later
 * (no catch-up dose).
 */

/**
 * A schedule as entered, possibly incomplete (the editor saves what the
 * clinician has filled in; nothing is offered until it is valid).
 */
export interface ScheduleDraft {
  kind: 'interval';
  minHours?: number;
  maxHours?: number;
  window?: { start?: string; end?: string };
}

export interface IntervalSchedule extends ScheduleDraft {
  kind: 'interval';
  /** Hours from the end of one round to when the next is due. */
  minHours: number;
  /** Upper end of the prescribed interval (shown, not enforced). */
  maxHours?: number;
  /** Local waking window, 'HH:MM' 24-hour; no round is due outside it. */
  window: { start: string; end: string };
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes after local midnight, or undefined for an invalid 'HH:MM'. */
export const minutesOf = (hhmm: string | undefined): number | undefined => {
  const m = HHMM.exec(hhmm ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
};

/** A usable schedule: positive finite interval and a valid, non-empty window. */
export function validSchedule(s: ScheduleDraft | undefined): s is IntervalSchedule {
  if (!s || s.kind !== 'interval') return false;
  if (s.minHours === undefined || !Number.isFinite(s.minHours) || s.minHours <= 0)
    return false;
  if (
    s.maxHours !== undefined &&
    !(Number.isFinite(s.maxHours) && s.maxHours >= s.minHours)
  )
    return false;
  const start = minutesOf(s.window?.start);
  const end = minutesOf(s.window?.end);
  return start !== undefined && end !== undefined && end > start;
}

/** The window's start and end today, as ms timestamps (local time). */
export function windowToday(
  s: IntervalSchedule,
  now: number
): { start: number; end: number } {
  const at = (hhmm: string) => {
    const d = new Date(now);
    const mins = minutesOf(hhmm)!;
    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return d.getTime();
  };
  return { start: at(s.window.start), end: at(s.window.end) };
}

/**
 * Whether a round can be done now; if not, when the next is due today
 * (`from`), or that nothing more is due today (`restOfDay`).
 */
export interface RoundState {
  due: boolean;
  from?: number;
  restOfDay?: boolean;
}

/**
 * Whether a new round may start now. `lastRoundEnd` is when the previous
 * finished round ended (undefined before the first round today).
 */
export function roundState(
  s: IntervalSchedule,
  now: number,
  lastRoundEnd: number | undefined
): RoundState {
  const { start, end } = windowToday(s, now);
  const earliest = Math.max(
    start,
    lastRoundEnd === undefined ? start : lastRoundEnd + s.minHours * 3600_000
  );
  if (earliest > end || now > end) return { due: false, restOfDay: true };
  if (now < earliest) return { due: false, from: earliest };
  return { due: true };
}

/**
 * The schedule in a fixed shape (field order, absent values), so a
 * semantically unchanged schedule compares equal and a real change doesn't.
 * Part of the prescription: timing changes need a new version and renewed
 * confirmation (measurement comparability is unaffected).
 */
export const canonicalSchedule = (s: ScheduleDraft | undefined | null) =>
  s
    ? {
        kind: s.kind ?? null,
        minHours: s.minHours ?? null,
        maxHours: s.maxHours ?? null,
        window: { start: s.window?.start ?? null, end: s.window?.end ?? null },
      }
    : null;

/** What is missing or wrong in a schedule, in the clinician's words. */
export function scheduleProblems(s: ScheduleDraft): string[] {
  const problems: string[] = [];
  if (s.minHours === undefined || !Number.isFinite(s.minHours) || s.minHours <= 0)
    problems.push('Set the time between mini-sessions.');
  if (
    s.maxHours !== undefined &&
    !(Number.isFinite(s.maxHours) && s.minHours !== undefined && s.maxHours >= s.minHours)
  )
    problems.push('The longest gap must be at least the shortest.');
  const start = minutesOf(s.window?.start);
  const end = minutesOf(s.window?.end);
  if (start === undefined || end === undefined)
    problems.push('Set when the day starts and ends (HH:MM, 24-hour).');
  else if (end <= start) problems.push('The day must end after it starts.');
  return problems;
}
