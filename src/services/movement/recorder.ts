/**
 * Records a session as MovementFrames for the joint of interest: its clinical
 * angle, the measurement landmarks (for compensation checks) and the camera view.
 */
import type { ProcessedPoseData } from '../../types/pose';
import { GoniometerService } from '../goniometerService';
import { getMeasurementLandmarks } from '../pose/measurementLandmarks';
import { clinicalAngle, jointKey } from '../pose/exercisePlan';
import type { CameraView, MovementContext, MovementFrame } from './types';

/** Keep at most this many frames (10 minutes at 30 fps). */
const MAX_FRAMES = 18000;

export const viewOf = (pose: ProcessedPoseData): CameraView =>
  pose.viewOrientation === 'sagittal'
    ? 'side'
    : pose.viewOrientation === 'frontal' || pose.viewOrientation === 'posterior'
      ? 'front'
      : 'unknown';

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
      view: viewOf(pose),
    };
    this.frames.push(frame);
    return frame;
  }

  reset(): void {
    this.frames.length = 0;
    this.goniometer.resetHistory();
  }
}
