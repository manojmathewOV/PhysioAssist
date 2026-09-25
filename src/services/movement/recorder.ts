/**
 * Records a session as MovementFrames for the joint of interest: its clinical
 * angle, the measurement landmarks (for compensation checks) and the camera view.
 */
import type { ProcessedPoseData } from '../../types/pose';
import { GoniometerService } from '../goniometerService';
import { getMeasurementLandmarks } from '../pose/measurementLandmarks';
import { clinicalAngle, jointKey } from '../pose/exercisePlan';
import { bodyWidthRatios } from '../pose/OrientationClassifier';
import type { CameraView, MovementContext, MovementFrame } from './types';

/** Keep at most this many frames (10 minutes at 30 fps). */
const MAX_FRAMES = 18000;

/**
 * Front if shoulders are at least 0.62 and hips 0.44 of the torso length,
 * side if shoulders are at most 0.35 of it, oblique in between. Measured on
 * real MediaPipe output (Clemente et al. 2024): facing the camera the hip
 * ratio was 0.47-0.53 in every recording, turned 35° it was 0.38-0.44.
 * Scale-free, so it doesn't depend on how far away the patient stands.
 */
export const FRONT_SHOULDER_RATIO = 0.62;
export const FRONT_HIP_RATIO = 0.44;
export const SIDE_SHOULDER_RATIO = 0.35;

export function viewOf(
  pose: ProcessedPoseData,
  landmarks = getMeasurementLandmarks(pose)
): CameraView {
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
    };
    this.frames.push(frame);
    return frame;
  }

  reset(): void {
    this.frames.length = 0;
    this.goniometer.resetHistory();
  }
}
