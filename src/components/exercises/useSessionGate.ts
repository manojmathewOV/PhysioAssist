/**
 * The steps between pressing Start and counting the first repetition, shared
 * by the native and web Exercise screens:
 *
 *   framing   - "Step back until your whole body is inside the frame"; waits
 *               until useFramingReadiness says the body has been in view ~1 s
 *   countdown - big 3-2-1-Go, spoken as well as shown
 *   active    - the exercise is validated and counted (`onGo` runs first)
 *
 * Practice mode (pretend body) skips framing but still counts down.
 * During the active step `outOfView` turns true when the patient leaves the
 * frame, so the screen can ask them to step back in (the count is kept).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PoseLandmark } from '../../types/pose';
import { audioFeedbackService } from '../../services/audioFeedbackService';
import { FramingState, useFramingReadiness } from './useFramingReadiness';

export type SessionPhase = 'idle' | 'framing' | 'countdown' | 'active';

/** Seconds counted down before the exercise starts. */
export const COUNTDOWN_FROM = 3;
const COUNTDOWN_STEP_MS = 1000;
/** How long "Go" stays on screen. */
const GO_HOLD_MS = 700;

export const FRAMING_MESSAGE = 'Step back until your whole body is inside the frame';
export const OUT_OF_VIEW_MESSAGE = 'Step back into view';

/** Speak now (interrupting other speech); speech failures never break the session. */
const say = (message: string) => {
  Promise.resolve(audioFeedbackService.speak(message, 'high')).catch(() => undefined);
};

export interface SessionGate {
  phase: SessionPhase;
  /** 3, 2, 1, then 0 for "Go"; null outside the countdown. */
  countdown: number | null;
  framing: FramingState;
  /** Mid-session: the patient has stepped out of the frame. */
  outOfView: boolean;
  /** Begin the framing step (or go straight to the countdown). */
  start: (options?: { skipFraming?: boolean }) => void;
  reset: () => void;
}

export function useSessionGate({
  landmarks,
  onGo,
}: {
  landmarks: PoseLandmark[] | null | undefined;
  /** Called once when the countdown reaches "Go". */
  onGo: () => void;
}): SessionGate {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [skipFraming, setSkipFraming] = useState(false);
  const onGoRef = useRef(onGo);
  onGoRef.current = onGo;

  const tracking = !skipFraming && phase !== 'idle';
  const framing = useFramingReadiness(landmarks, tracking);

  const start = useCallback((options?: { skipFraming?: boolean }) => {
    const skip = !!options?.skipFraming;
    setSkipFraming(skip);
    setCountdown(null);
    setPhase(skip ? 'countdown' : 'framing');
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setCountdown(null);
    setSkipFraming(false);
  }, []);

  // Whole body in view for long enough: start the countdown
  useEffect(() => {
    if (phase === 'framing' && framing.ready) {
      setPhase('countdown');
    }
  }, [phase, framing.ready]);

  // 3, 2, 1, Go (spoken and shown), then start counting
  useEffect(() => {
    if (phase !== 'countdown') {
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let n = COUNTDOWN_FROM; n >= 0; n--) {
      timers.push(
        setTimeout(
          () => {
            setCountdown(n);
            say(n > 0 ? String(n) : 'Go');
          },
          (COUNTDOWN_FROM - n) * COUNTDOWN_STEP_MS
        )
      );
    }
    timers.push(
      setTimeout(
        () => {
          setCountdown(null);
          setPhase('active');
          onGoRef.current();
        },
        COUNTDOWN_FROM * COUNTDOWN_STEP_MS + GO_HOLD_MS
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const outOfView = phase === 'active' && !skipFraming && !framing.inView;

  // Say it once each time the patient leaves the frame
  useEffect(() => {
    if (outOfView) {
      say(OUT_OF_VIEW_MESSAGE);
    }
  }, [outOfView]);

  return { phase, countdown, framing, outOfView, start, reset };
}
