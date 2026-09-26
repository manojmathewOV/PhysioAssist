/**
 * Set-up readiness checks what the exercise needs, on the working side,
 * instead of always the whole body (cases from the independent review of
 * 06e77dd: elbows and wrists hidden was "ready" for a shoulder exercise; an
 * upper body in view with the feet out of frame was rejected).
 */
import { EXERCISES } from '../../constants/exercises';
import { framingRequirement } from '../exercises/framingRequirement';
import { checkFraming, createFramingTracker } from '../exercises/useFramingReadiness';
import { MEDIAPIPE_ORDER } from '../../testing/virtualPatient/body';
import type { PoseLandmark } from '../../types/pose';

/** Every landmark clearly visible in the frame, except `hidden`. */
const pose = (hidden: string[] = []): PoseLandmark[] =>
  MEDIAPIPE_ORDER.map((name, index) => ({
    name,
    index,
    x: 0.5,
    y: 0.5,
    visibility: hidden.includes(name) ? 0.1 : 0.95,
  }));

const LOWER = [
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
];

describe('framing for a shoulder exercise (left, rotation at the side)', () => {
  const required = framingRequirement(EXERCISES.shoulderExternalRotation, 'left');

  it('is not ready with the elbows and wrists hidden', () => {
    const checks = checkFraming(
      pose(['left_elbow', 'right_elbow', 'left_wrist', 'right_wrist']),
      undefined,
      required
    );
    expect(checks.inFrame).toBe(false);
    expect(checks.parts?.find((p) => p.label === 'Arm visible')?.ok).toBe(false);
  });

  it('is ready with the upper body in view and the knees and feet out of frame', () => {
    expect(checkFraming(pose(LOWER), undefined, required).inFrame).toBe(true);
  });

  it('needs the working arm, not the other one', () => {
    expect(
      checkFraming(pose(['right_elbow', 'right_wrist']), undefined, required).inFrame
    ).toBe(true);
    expect(checkFraming(pose(['left_wrist']), undefined, required).inFrame).toBe(false);
  });
});

describe('framing for a seated knee exercise (right)', () => {
  const required = framingRequirement(EXERCISES.seatedKneeExtension, 'right');

  it('needs the working leg and the trunk, not the head or the other foot', () => {
    expect(
      checkFraming(
        pose(['nose', 'left_eye', 'right_eye', 'left_ankle']),
        undefined,
        required
      ).inFrame
    ).toBe(true);
    expect(checkFraming(pose(['right_knee']), undefined, required).inFrame).toBe(false);
  });
});

describe('standing exercises and no plan keep the whole-body check', () => {
  it('squat: whole body', () => {
    expect(framingRequirement(EXERCISES.squat, 'left')).toBeUndefined();
    expect(checkFraming(pose(LOWER)).inFrame).toBe(false);
    expect(checkFraming(pose()).inFrame).toBe(true);
  });
});

describe('the readiness tracker uses the requirement', () => {
  it('becomes ready for a shoulder exercise with the feet out of frame', () => {
    const tracker = createFramingTracker({
      required: framingRequirement(EXERCISES.shoulderExternalRotation, 'left'),
    });
    let state = tracker.getState();
    for (let t = 0; t <= 1200; t += 100) state = tracker.update(pose(LOWER), t);
    expect(state.ready).toBe(true);
  });
});
