/**
 * "Get into position" readiness: counting only starts once the whole body has
 * been clearly visible for about a second.
 */
import { act, renderHook } from '@testing-library/react-native';

import type { PoseLandmark } from '../../../types/pose';
import {
  checkFraming,
  createFramingTracker,
  FRAMING_HOLD_MS,
  FRAMING_LOST_MS,
  FRAMING_MIN_POSES,
  FRAMING_STALE_MS,
  useFramingReadiness,
} from '../useFramingReadiness';

// MediaPipe-33 indices
const NOSE = 0;
const LEFT = { shoulder: 11, hip: 23, knee: 25, ankle: 27 };
const RIGHT = { shoulder: 12, hip: 24, knee: 26, ankle: 28 };

/** A standing body with every landmark clearly visible. */
const body = (overrides: Record<number, Partial<PoseLandmark>> = {}): PoseLandmark[] =>
  Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.1 + (i / 33) * 0.8,
    z: 0,
    visibility: 0.95,
    ...overrides[i],
    // Unnamed, so the lookup falls back to MediaPipe-33 indices
    index: i,
    name: '',
  }));

const hidden = (...indices: number[]) =>
  Object.fromEntries(indices.map((i) => [i, { visibility: 0.2 }]));

describe('checkFraming', () => {
  it('sees a whole body when head, shoulders, hips, knees and ankles are visible', () => {
    expect(checkFraming(body())).toEqual({
      head: true,
      shoulders: true,
      hips: true,
      knees: true,
      feet: true,
      fullBody: true,
      // Without an exercise requirement, "in frame" means the whole body
      inFrame: true,
    });
  });

  it('reports missing feet when both ankles are hidden', () => {
    const checks = checkFraming(body(hidden(LEFT.ankle, RIGHT.ankle)));
    expect(checks.feet).toBe(false);
    expect(checks.head).toBe(true);
    expect(checks.fullBody).toBe(false);
  });

  it('accepts one side of each pair, so a side-on stance still counts', () => {
    const checks = checkFraming(
      body(hidden(RIGHT.shoulder, RIGHT.hip, RIGHT.knee, RIGHT.ankle))
    );
    expect(checks.fullBody).toBe(true);
  });

  it('needs the head (nose, eyes or ears)', () => {
    expect(checkFraming(body(hidden(0, 1, 2, 3, 4, 5, 6, 7, 8))).head).toBe(false);
    expect(checkFraming(body(hidden(NOSE))).head).toBe(true); // eyes still visible
  });

  it('uses the 0.6 visibility threshold and ignores points outside the image', () => {
    const lowFeet = { visibility: 0.59 };
    expect(
      checkFraming(body({ [LEFT.ankle]: lowFeet, [RIGHT.ankle]: lowFeet })).feet
    ).toBe(false);
    const offScreen = { y: 1.2 };
    expect(
      checkFraming(body({ [LEFT.ankle]: offScreen, [RIGHT.ankle]: offScreen })).feet
    ).toBe(false);
  });

  it('handles no pose', () => {
    expect(checkFraming(null).fullBody).toBe(false);
    expect(checkFraming([]).fullBody).toBe(false);
  });

  it('finds MoveNet-17 landmarks by name too', () => {
    const names = [
      'nose',
      'left_eye',
      'right_eye',
      'left_ear',
      'right_ear',
      'left_shoulder',
      'right_shoulder',
      'left_elbow',
      'right_elbow',
      'left_wrist',
      'right_wrist',
      'left_hip',
      'right_hip',
      'left_knee',
      'right_knee',
      'left_ankle',
      'right_ankle',
    ];
    const moveNet = names.map((name, index) => ({
      name,
      index,
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));
    expect(checkFraming(moveNet).fullBody).toBe(true);
  });
});

describe('createFramingTracker', () => {
  it('becomes ready after the body has been in view for about a second', () => {
    const tracker = createFramingTracker({ minPoses: 1000 });
    expect(tracker.update(body(), 0).ready).toBe(false);
    expect(tracker.update(body(), 500).progress).toBeCloseTo(0.5);
    expect(tracker.update(body(), FRAMING_HOLD_MS).ready).toBe(true);
  });

  it('or after enough poses in a row, whichever comes first', () => {
    const tracker = createFramingTracker();
    let state = tracker.getState();
    for (let i = 0; i < FRAMING_MIN_POSES; i++) {
      state = tracker.update(body(), i * 10);
    }
    expect(state.ready).toBe(true);
  });

  it('restarts the hold when the body leaves the frame', () => {
    const tracker = createFramingTracker({ minPoses: 1000 });
    tracker.update(body(), 0);
    tracker.update(body(), 800);
    expect(tracker.update(body(hidden(LEFT.ankle, RIGHT.ankle)), 900).progress).toBe(0);
    expect(tracker.update(body(), 1000).ready).toBe(false);
    expect(tracker.update(body(), 2000).ready).toBe(true);
  });

  it('advances the hold between poses with tick()', () => {
    const tracker = createFramingTracker({ minPoses: 1000 });
    tracker.update(body(), 0);
    expect(tracker.tick(FRAMING_HOLD_MS / 2).progress).toBeCloseTo(0.5);
  });

  it('stays ready but reports out of view once the patient walks away', () => {
    const tracker = createFramingTracker();
    for (let i = 0; i < FRAMING_MIN_POSES; i++) {
      tracker.update(body(), i * 33);
    }
    const last = (FRAMING_MIN_POSES - 1) * 33;
    expect(tracker.getState().inView).toBe(true);

    // A brief tracking dropout is ignored
    expect(tracker.update(null, last + 100).inView).toBe(true);

    // No poses at all for a while: out of view, but still "ready" (count kept)
    const later = last + Math.max(FRAMING_LOST_MS, FRAMING_STALE_MS) + 50;
    const state = tracker.tick(later);
    expect(state.inView).toBe(false);
    expect(state.ready).toBe(true);

    // Back in view straight away
    expect(tracker.update(body(), later + 10).inView).toBe(true);
  });

  it('reset() starts over', () => {
    const tracker = createFramingTracker({ minPoses: 1 });
    expect(tracker.update(body(), 0).ready).toBe(true);
    tracker.reset();
    expect(tracker.getState().ready).toBe(false);
  });
});

describe('useFramingReadiness', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reports readiness while enabled and resets when disabled', () => {
    const { result, rerender } = renderHook(
      ({ landmarks, enabled }) => useFramingReadiness(landmarks, enabled),
      { initialProps: { landmarks: body() as PoseLandmark[] | null, enabled: true } }
    );
    expect(result.current.checks.fullBody).toBe(true);
    expect(result.current.ready).toBe(false);

    // New poses every 100 ms (fewer than FRAMING_MIN_POSES) for over a second
    for (let t = 0; t < FRAMING_HOLD_MS + 200; t += 100) {
      act(() => {
        jest.advanceTimersByTime(100);
      });
      rerender({ landmarks: body(), enabled: true });
    }
    expect(result.current.ready).toBe(true);

    rerender({ landmarks: body(), enabled: false });
    expect(result.current.ready).toBe(false);
  });

  it('is not ready from a single stale pose', () => {
    const pose = body();
    const { result } = renderHook(() => useFramingReadiness(pose, true));
    act(() => {
      jest.advanceTimersByTime(FRAMING_HOLD_MS * 2);
    });
    expect(result.current.ready).toBe(false);
    expect(result.current.checks.fullBody).toBe(false);
  });
});
