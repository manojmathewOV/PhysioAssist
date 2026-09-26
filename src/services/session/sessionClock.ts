/**
 * One clock for an exercise session, so the live timer, completion, the
 * summary and the saved history agree. It keeps apart:
 * - wall time: from Go to Stop;
 * - paused time: while the patient had paused;
 * - active time: wall minus paused, what the exercise itself took.
 * (How long the joint was continuously observed still is a separate,
 * measurement quantity: see staticHold.)
 */
export interface SessionClock {
  /** When counting started (ms since epoch), or null when not running. */
  startedAt: number | null;
  /** When the current pause began, or null when not paused. */
  pausedAt: number | null;
  /** Paused time before the current pause (ms). */
  pausedMs: number;
}

export const IDLE_CLOCK: SessionClock = { startedAt: null, pausedAt: null, pausedMs: 0 };

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

/** Wall time since Go (ms). */
export const wallMs = (c: SessionClock, now: number): number =>
  c.startedAt === null ? 0 : Math.max(0, finite(now - c.startedAt));

/** Time spent paused, including a pause still going on (ms). */
export const pausedMsOf = (c: SessionClock, now: number): number =>
  Math.max(0, finite(c.pausedMs + (c.pausedAt === null ? 0 : now - c.pausedAt)));

/** Active exercise time: wall time minus pauses (ms). */
export const activeMs = (c: SessionClock, now: number): number =>
  Math.max(0, wallMs(c, now) - pausedMsOf(c, now));

/** Whole seconds, for display and records. */
export const seconds = (ms: number) => Math.floor(ms / 1000);

export const pause = (c: SessionClock, now: number): SessionClock =>
  c.startedAt === null || c.pausedAt !== null ? c : { ...c, pausedAt: now };

export const resume = (c: SessionClock, now: number): SessionClock =>
  c.pausedAt === null
    ? c
    : { ...c, pausedAt: null, pausedMs: c.pausedMs + Math.max(0, now - c.pausedAt) };
