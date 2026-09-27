/**
 * Camera view: from body yaw in world landmarks when available, else from
 * image-landmark width ratios.
 */
import { renderBody, STANDING } from '../../../testing/virtualPatient/body';
import { mediapipeResultToPoseData } from '../../pose/mediapipeLandmarks';
import { bodyYawDegrees } from '../../pose/OrientationClassifier';
import type { PoseLandmark, ProcessedPoseData } from '../../../types/pose';
import { viewOf } from '../recorder';

const rad = (deg: number) => (deg * Math.PI) / 180;

/** World landmarks for a torso turned `yaw` degrees from facing the camera. */
const turned = (yaw: number): PoseLandmark[] =>
  (
    [
      ['left_shoulder', 0.18, -0.5],
      ['right_shoulder', -0.18, -0.5],
      ['left_hip', 0.1, 0],
      ['right_hip', -0.1, 0],
    ] as const
  ).map(([name, half, y], index) => ({
    name,
    index,
    x: half * Math.cos(rad(yaw)),
    y,
    z: half * Math.sin(rad(yaw)),
    visibility: 0.9,
  }));

/** Image landmarks with the given shoulder and hip width ratios (torso 0.3). */
const image = (shoulder: number, hip: number): PoseLandmark[] =>
  (
    [
      ['left_shoulder', shoulder / 2, 0.3],
      ['right_shoulder', -shoulder / 2, 0.3],
      ['left_hip', hip / 2, 0.6],
      ['right_hip', -hip / 2, 0.6],
    ] as const
  ).map(([name, half, y], index) => ({
    name,
    index,
    x: 0.5 + half * 0.3,
    y,
    visibility: 0.9,
  }));

const pose = (landmarks: PoseLandmark[], world?: PoseLandmark[]): ProcessedPoseData => ({
  landmarks,
  worldLandmarks: world,
  timestamp: 1,
  confidence: 0.9,
});

describe('bodyYawDegrees', () => {
  it.each([0, 10, 35, 60, 85])('recovers a %i° turn', (yaw) => {
    expect(bodyYawDegrees(turned(yaw))).toBeCloseTo(yaw, 5);
  });

  it('is null without world landmarks', () => {
    expect(bodyYawDegrees(undefined)).toBeNull();
    expect(bodyYawDegrees([])).toBeNull();
  });
});

describe('viewOf', () => {
  it.each([
    [0, 'front'],
    [8, 'front'],
    [15, 'front'],
    [20, 'oblique'],
    [35, 'oblique'],
    [59, 'oblique'],
    [62, 'side'],
    [90, 'side'],
  ])('%i° turn reads as %s', (yaw, view) => {
    // Image widths that on their own would say "side": world landmarks win
    expect(viewOf(pose(image(0.2, 0.1), turned(yaw)))).toBe(view);
  });

  it('reads real image-landmark proportions of a person facing the camera as front', () => {
    // Real smartphone video: shoulders 0.64-0.73, hips 0.35-0.39 of torso length
    expect(viewOf(pose(image(0.66, 0.37)))).toBe('front');
    expect(viewOf(pose(image(0.44, 0.26)))).toBe('oblique');
    expect(viewOf(pose(image(0.25, 0.15)))).toBe('side');
  });

  it("reads the virtual patient's front and side views from its world landmarks", () => {
    const view = (bodyPose: typeof STANDING) =>
      viewOf(mediapipeResultToPoseData(renderBody(bodyPose), { timestamp: 1 })!);
    expect(view({ ...STANDING, view: 'front' })).toBe('front');
    expect(view({ ...STANDING, view: 'side' })).toBe('side');
    expect(view({ ...STANDING, view: 'front', trunkRotation: 35 })).toBe('oblique');
  });
});
