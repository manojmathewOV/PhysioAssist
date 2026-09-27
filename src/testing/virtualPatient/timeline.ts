/**
 * Keyframe timelines for the virtual patient: joint angles over time with smooth
 * (cosine-eased) transitions, plus a small seeded random generator so every
 * "noisy" scenario is exactly reproducible.
 */
/* eslint-disable no-bitwise -- mulberry32 PRNG */
import { BodyPose, STANDING } from './body';

export type JointAngles = Partial<Omit<BodyPose, 'view'>>;

export interface Keyframe {
  /** Milliseconds from the start of the scenario. */
  t: number;
  angles: JointAngles;
}

type AngleKey = keyof JointAngles;
const ANGLE_KEYS = Object.keys(STANDING).filter((k) => k !== 'view') as AngleKey[];

const ease = (u: number) => (1 - Math.cos(Math.PI * u)) / 2;

/** Joint angles at time `t`; holds the first/last keyframe outside the timeline. */
export function sampleTimeline(base: BodyPose, keys: Keyframe[], t: number): BodyPose {
  const pose: BodyPose = { ...base };
  // Resolve each keyframe to full angles so a joint missing from one frame holds
  let prev: BodyPose = { ...base, ...keys[0]?.angles };
  if (keys.length === 0 || t <= keys[0].t) return prev;
  for (let i = 1; i < keys.length; i++) {
    const next: BodyPose = { ...prev, ...keys[i].angles };
    if (t <= keys[i].t) {
      const u = ease((t - keys[i - 1].t) / Math.max(1, keys[i].t - keys[i - 1].t));
      for (const k of ANGLE_KEYS) pose[k] = prev[k] + (next[k] - prev[k]) * u;
      return pose;
    }
    prev = next;
  }
  return prev;
}

export interface RepPlan {
  /** Angles at rest (start of each rep). */
  rest: JointAngles;
  /** Angles at the bottom/top of the movement. */
  target: JointAngles;
  reps: number;
  /** Time to move rest -> target, and back. */
  moveMs: number;
  /** Time held at the target. */
  holdMs: number;
  /** Time held at rest between reps. */
  restMs: number;
  /** Lead-in standing still before the first rep. */
  leadInMs?: number;
}

/** Keyframes for N identical repetitions. */
export function repetitions(plan: RepPlan): Keyframe[] {
  const keys: Keyframe[] = [{ t: 0, angles: plan.rest }];
  let t = plan.leadInMs ?? 1000;
  keys.push({ t, angles: plan.rest });
  for (let i = 0; i < plan.reps; i++) {
    t += plan.moveMs;
    keys.push({ t, angles: plan.target });
    t += plan.holdMs;
    keys.push({ t, angles: plan.target });
    t += plan.moveMs;
    keys.push({ t, angles: plan.rest });
    t += plan.restMs;
    keys.push({ t, angles: plan.rest });
  }
  return keys;
}

export const timelineEnd = (keys: Keyframe[]) => keys[keys.length - 1]?.t ?? 0;

/** Deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample from a uniform generator (Box-Muller). */
export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}
