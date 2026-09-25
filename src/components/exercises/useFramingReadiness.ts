/**
 * "Get into position" gate: is the patient's whole body inside the camera
 * frame, and has it stayed there long enough to start counting?
 *
 * Counting only starts once the key full-body landmarks (shoulders, hips,
 * knees, ankles, plus the head) have been clearly visible for about a second
 * (or ~15 poses in a row, whichever comes first). Later in the session the same
 * tracker reports when the patient has stepped out of view, so the screen can
 * ask them to step back in without resetting the count.
 *
 * The logic is pure (`checkFraming`, `createFramingTracker`) so it can be unit
 * tested; `useFramingReadiness` wires it to React.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PoseLandmark } from '../../types/pose';
import { findLandmark } from '../../services/pose/landmarkLookup';

/** Minimum landmark visibility (0-1) for a body part to count as "seen". */
export const FRAMING_VISIBILITY = 0.6;
/** How long the whole body must stay visible before the countdown starts. */
export const FRAMING_HOLD_MS = 1000;
/** ...or this many poses in a row, whichever comes first. */
export const FRAMING_MIN_POSES = 15;
/** Out of view for this long (mid-session) before asking to step back in. */
export const FRAMING_LOST_MS = 800;
/** No pose for this long means nobody is being detected. */
export const FRAMING_STALE_MS = 700;

/** Allow landmarks a hair outside the image (normalized coordinates). */
const EDGE_TOLERANCE = 0.02;

const HEAD = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'];
/**
 * Paired body parts. Either side counts, because the app asks patients to
 * stand side-on, where the far limb is partly hidden behind the body.
 */
const BODY_PARTS: Record<'shoulders' | 'hips' | 'knees' | 'ankles', [string, string]> = {
  shoulders: ['left_shoulder', 'right_shoulder'],
  hips: ['left_hip', 'right_hip'],
  knees: ['left_knee', 'right_knee'],
  ankles: ['left_ankle', 'right_ankle'],
};

export interface FramingChecks {
  /** Head (nose, eyes or ears) is visible. */
  head: boolean;
  shoulders: boolean;
  hips: boolean;
  knees: boolean;
  /** Ankles: shown to the patient as "Feet visible". */
  feet: boolean;
  /** Everything above: the whole body is in the frame. */
  fullBody: boolean;
}

export const NO_BODY: FramingChecks = {
  head: false,
  shoulders: false,
  hips: false,
  knees: false,
  feet: false,
  fullBody: false,
};

const isSeen = (landmark: PoseLandmark | undefined, minVisibility: number): boolean =>
  !!landmark &&
  (landmark.visibility ?? 0) >= minVisibility &&
  landmark.x >= -EDGE_TOLERANCE &&
  landmark.x <= 1 + EDGE_TOLERANCE &&
  landmark.y >= -EDGE_TOLERANCE &&
  landmark.y <= 1 + EDGE_TOLERANCE;

/** Which parts of the body the camera can clearly see in one pose. */
export function checkFraming(
  landmarks: PoseLandmark[] | null | undefined,
  minVisibility = FRAMING_VISIBILITY
): FramingChecks {
  if (!landmarks || landmarks.length === 0) {
    return NO_BODY;
  }
  const seen = (name: string) => isSeen(findLandmark(landmarks, name), minVisibility);
  const pair = ([left, right]: [string, string]) => seen(left) || seen(right);

  const head = HEAD.some(seen);
  const shoulders = pair(BODY_PARTS.shoulders);
  const hips = pair(BODY_PARTS.hips);
  const knees = pair(BODY_PARTS.knees);
  const feet = pair(BODY_PARTS.ankles);
  return {
    head,
    shoulders,
    hips,
    knees,
    feet,
    fullBody: head && shoulders && hips && knees && feet,
  };
}

export interface FramingState {
  /** What the camera sees right now. */
  checks: FramingChecks;
  /** 0-1: how far through the "hold still" second the patient is. */
  progress: number;
  /** Latches true once the body has been in frame long enough. */
  ready: boolean;
  /**
   * False once the body has been out of view for FRAMING_LOST_MS (brief
   * tracking dropouts are ignored so the message doesn't flicker).
   */
  inView: boolean;
}

export const INITIAL_FRAMING: FramingState = {
  checks: NO_BODY,
  progress: 0,
  ready: false,
  inView: false,
};

export interface FramingTrackerOptions {
  holdMs?: number;
  minPoses?: number;
  lostMs?: number;
  staleMs?: number;
  minVisibility?: number;
}

export interface FramingTracker {
  /** Feed a new pose (or null when nobody was detected). */
  update(landmarks: PoseLandmark[] | null | undefined, now: number): FramingState;
  /** Advance time without a pose, so a patient who walks away is noticed. */
  tick(now: number): FramingState;
  reset(): void;
  getState(): FramingState;
}

export function createFramingTracker({
  holdMs = FRAMING_HOLD_MS,
  minPoses = FRAMING_MIN_POSES,
  lostMs = FRAMING_LOST_MS,
  staleMs = FRAMING_STALE_MS,
  minVisibility = FRAMING_VISIBILITY,
}: FramingTrackerOptions = {}): FramingTracker {
  let state: FramingState = INITIAL_FRAMING;
  let streakStart: number | null = null;
  let streakPoses = 0;
  let lastSeenAt: number | null = null;
  let lastPoseAt: number | null = null;

  const inViewAt = (now: number) => lastSeenAt !== null && now - lastSeenAt < lostMs;

  const apply = (checks: FramingChecks, now: number, fromPose: boolean) => {
    if (checks.fullBody) {
      if (streakStart === null) {
        streakStart = now;
        streakPoses = 0;
      }
      if (fromPose) {
        streakPoses += 1;
      }
      lastSeenAt = now;
    } else {
      streakStart = null;
      streakPoses = 0;
    }
    const progress =
      streakStart === null
        ? 0
        : Math.min(1, Math.max((now - streakStart) / holdMs, streakPoses / minPoses));
    state = {
      checks,
      progress,
      ready: state.ready || progress >= 1,
      inView: checks.fullBody || inViewAt(now),
    };
    return state;
  };

  return {
    update(landmarks, now) {
      lastPoseAt = now;
      return apply(checkFraming(landmarks, minVisibility), now, true);
    },
    tick(now) {
      if (lastPoseAt === null || now - lastPoseAt >= staleMs) {
        // Nobody detected recently
        return apply(NO_BODY, now, false);
      }
      if (state.checks.fullBody) {
        // Still in view: let the hold timer advance between poses
        return apply(state.checks, now, false);
      }
      const inView = inViewAt(now);
      if (inView !== state.inView) {
        state = { ...state, inView };
      }
      return state;
    },
    reset() {
      state = INITIAL_FRAMING;
      streakStart = null;
      streakPoses = 0;
      lastSeenAt = null;
      lastPoseAt = null;
    },
    getState: () => state,
  };
}

const sameState = (a: FramingState, b: FramingState) =>
  a.ready === b.ready &&
  a.inView === b.inView &&
  Math.abs(a.progress - b.progress) < 0.05 &&
  (Object.keys(a.checks) as (keyof FramingChecks)[]).every(
    (k) => a.checks[k] === b.checks[k]
  );

/** How often the hook re-checks while no new poses arrive. */
const TICK_MS = 250;

/**
 * Tracks framing for the current pose while `enabled`. Resets whenever it is
 * disabled, so every session starts with a fresh "get into position" check.
 */
export function useFramingReadiness(
  landmarks: PoseLandmark[] | null | undefined,
  enabled: boolean,
  options?: FramingTrackerOptions
): FramingState {
  const trackerRef = useRef<FramingTracker | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = createFramingTracker(options);
  }
  const [state, setState] = useState<FramingState>(INITIAL_FRAMING);

  const publish = useCallback(
    (next: FramingState) => setState((prev) => (sameState(prev, next) ? prev : next)),
    []
  );

  // New pose
  useEffect(() => {
    if (enabled) {
      publish(trackerRef.current!.update(landmarks, Date.now()));
    }
  }, [landmarks, enabled, publish]);

  // Clock: advances the hold timer and notices when poses stop arriving
  useEffect(() => {
    const tracker = trackerRef.current!;
    if (!enabled) {
      tracker.reset();
      setState(INITIAL_FRAMING);
      return;
    }
    const id = setInterval(() => publish(tracker.tick(Date.now())), TICK_MS);
    return () => clearInterval(id);
  }, [enabled, publish]);

  return state;
}
