/** Camera-optional activity state. No poses, counts or measurements are inferred. */
import {
  activeMs,
  pause,
  pausedMsOf,
  resume,
  SessionClock,
  wallMs,
} from './sessionClock';

export type GuidedPhase = 'ready' | 'active' | 'paused' | 'finished';
export interface GuidedActivityState {
  phase: GuidedPhase;
  clock: SessionClock;
  lastAt: number;
  endedAt?: number;
  /** An interruption never automatically resumes activity. */
  interruption?: 'background' | 'programme_changed';
}
export type GuidedEvent =
  | { type: 'start' | 'pause' | 'resume' | 'finish'; at: number }
  | { type: 'interrupt'; at: number; reason: 'background' | 'programme_changed' };
export const readyActivity = (): GuidedActivityState => ({
  phase: 'ready',
  clock: { startedAt: null, pausedAt: null, pausedMs: 0 },
  lastAt: 0,
});

export function transitionActivity(
  s: GuidedActivityState,
  event: GuidedEvent
): GuidedActivityState {
  if (!Number.isFinite(event.at) || event.at < s.lastAt || s.phase === 'finished')
    return s;
  const at = event.at;
  if (event.type === 'start' && s.phase === 'ready')
    return {
      phase: 'active',
      clock: { startedAt: at, pausedAt: null, pausedMs: 0 },
      lastAt: at,
    };
  if (event.type === 'interrupt' && s.phase !== 'ready')
    return {
      ...s,
      phase: 'paused',
      clock: pause(s.clock, at),
      lastAt: at,
      interruption:
        s.interruption === 'programme_changed' ? s.interruption : event.reason,
    };
  if (event.type === 'pause' && s.phase === 'active')
    return { ...s, phase: 'paused', clock: pause(s.clock, at), lastAt: at };
  if (
    event.type === 'resume' &&
    s.phase === 'paused' &&
    s.interruption !== 'programme_changed'
  )
    return {
      ...s,
      phase: 'active',
      clock: resume(s.clock, at),
      lastAt: at,
      interruption: undefined,
    };
  if (event.type === 'finish' && s.phase !== 'ready')
    return { ...s, phase: 'finished', endedAt: at, lastAt: at };
  return s;
}

export function activityTime(s: GuidedActivityState, rawNow: number) {
  const now =
    s.endedAt ?? Math.max(s.lastAt, Number.isFinite(rawNow) ? rawNow : s.lastAt);
  return {
    activeMilliseconds: activeMs(s.clock, now),
    pausedMilliseconds: pausedMsOf(s.clock, now),
    wallMilliseconds: wallMs(s.clock, now),
  };
}

/** Record intent only; durable recording is a separate acknowledged operation. */
export function activityOutcome(s: GuidedActivityState, completedByPatient: boolean) {
  if (s.phase !== 'finished') return null;
  const time = activityTime(s, s.endedAt!);
  return {
    ...time,
    startedAt: s.clock.startedAt!,
    endedAt: s.endedAt!,
    kind: 'activity' as const,
    routineCreditEligible: s.interruption !== 'programme_changed',
    completion:
      time.activeMilliseconds <= 0
        ? ('attempted' as const)
        : completedByPatient
          ? ('completed' as const)
          : ('stopped_early' as const),
    completionBasis: 'patient_report' as const,
    measured: false as const,
    reason: 'camera_not_used' as const,
  };
}

export type GuidedActivityOutcome = NonNullable<ReturnType<typeof activityOutcome>>;
