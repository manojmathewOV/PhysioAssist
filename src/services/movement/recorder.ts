/**
 * Records a session as MovementFrames for the joint of interest: its clinical
 * angle, the measurement landmarks (for compensation checks) and the camera view.
 */
import type { ProcessedPoseData } from '../../types/pose';
import { GoniometerService } from '../goniometerService';
import { getMeasurementLandmarks } from '../pose/measurementLandmarks';
import { clinicalAngle, jointKey } from '../pose/exercisePlan';
import { bodyWidthRatios, bodyYawDegrees } from '../pose/OrientationClassifier';
import { postureOf } from './posture';
import type { CameraView, MovementContext, MovementFrame } from './types';

/** Keep at most this many frames (10 minutes at 30 fps). */
const MAX_FRAMES = 18000;

/**
 * Camera view from how far the body is turned (world landmarks): front up to
 * 15°, side from 60°, oblique in between. Real people facing a phone measured
 * 0.5-8° and a 35° camera 19-36°, so front-view checks run only when the
 * frontal plane faces the camera. 60° matches the width rule below.
 */
export const FRONT_MAX_YAW_DEG = 15;
export const SIDE_MIN_YAW_DEG = 60;

/**
 * Fallback without world landmarks (image landmarks only): front if shoulders
 * are at least 0.58 and hips 0.33 of the torso length, side if shoulders are
 * at most 0.35 of it. Image-landmark proportions on real smartphone video:
 * facing the camera shoulders 0.64-0.73 (0.57 with arms overhead) and hips
 * 0.35-0.39; turned 40-50° 0.39-0.46 and 0.21-0.30.
 */
export const FRONT_SHOULDER_RATIO = 0.58;
export const FRONT_HIP_RATIO = 0.33;
export const SIDE_SHOULDER_RATIO = 0.35;

export function viewOf(
  pose: ProcessedPoseData,
  landmarks = getMeasurementLandmarks(pose)
): CameraView {
  const yaw = bodyYawDegrees(pose.worldLandmarks);
  if (yaw !== null) {
    if (yaw <= FRONT_MAX_YAW_DEG) return 'front';
    return yaw >= SIDE_MIN_YAW_DEG ? 'side' : 'oblique';
  }
  const ratios = bodyWidthRatios(landmarks);
  if (ratios) {
    if (ratios.shoulder <= SIDE_SHOULDER_RATIO) return 'side';
    if (ratios.shoulder >= FRONT_SHOULDER_RATIO && ratios.hip >= FRONT_HIP_RATIO)
      return 'front';
    return 'oblique';
  }
  return pose.viewOrientation === 'sagittal'
    ? 'side'
    : pose.viewOrientation === 'frontal' || pose.viewOrientation === 'posterior'
      ? 'front'
      : 'unknown';
}

export class MovementRecorder {
  readonly frames: MovementFrame[] = [];
  // Own instance: light smoothing, independent of the live rep counter
  private goniometer = new GoniometerService({ smoothingWindow: 3 });
  private readonly key: string;

  constructor(readonly context: MovementContext) {
    this.key = jointKey(context.side, context.joint);
  }

  add(pose: ProcessedPoseData): MovementFrame | null {
    if (this.frames.length >= MAX_FRAMES) return null;
    const landmarks = getMeasurementLandmarks(pose);
    const interior = this.goniometer.getJointAngle(this.key, landmarks);
    const frame: MovementFrame = {
      t: pose.timestamp,
      angle: interior === null ? null : clinicalAngle(this.context.joint, interior),
      landmarks,
      view: viewOf(pose, landmarks),
      posture: postureOf(pose, landmarks),
    };
    this.frames.push(frame);
    return frame;
  }

  reset(): void {
    this.frames.length = 0;
    this.goniometer.resetHistory();
  }
}
