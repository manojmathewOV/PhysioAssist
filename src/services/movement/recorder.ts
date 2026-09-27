/**
 * Records a session as MovementFrames for the joint of interest: its clinical
 * angle, the measurement landmarks (for compensation checks) and the camera view.
 */
import type { ProcessedPoseData } from '../../types/pose';
import { GoniometerService } from '../goniometerService';
import { getMeasurementLandmarks } from '../pose/measurementLandmarks';
import { BodySide, clinicalAngle, jointKey, JointKind } from '../pose/exercisePlan';
import { findLandmark } from '../pose/landmarkLookup';
import { worldAngle } from '../pose/worldAngle';
import { ExerciseMovement, movementOf, rangeViewOf } from './exerciseMovement';
import { externalRotationDegrees } from '../pose/shoulderRotation';
import { bodyWidthRatios, bodyYawDegrees } from '../pose/OrientationClassifier';
import { postureOf } from './posture';
import type { CameraView, MovementContext, MovementFrame } from './types';

/**
 * Joints measured from MediaPipe's 3D world landmarks when the camera is at an
 * angle (REHAB24-6: shoulder MAE 16-17° -> 11°, knee 18-20° -> 14-18°).
 */
const WORLD_AT_OBLIQUE: JointKind[] = ['shoulder', 'knee'];

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

/** Nearer the camera by at least this much (metres) to count. */
const NEAR_MARGIN_M = 0.05;

/** Which side's joint is nearer the camera (MediaPipe world z: smaller is nearer). */
function nearerSide(pose: ProcessedPoseData, joint: JointKind): BodySide | undefined {
  const world = pose.worldLandmarks;
  if (!world?.length) return undefined;
  const l = findLandmark(world, `left_${joint}`)?.z;
  const r = findLandmark(world, `right_${joint}`)?.z;
  if (l === undefined || r === undefined || Math.abs(l - r) < NEAR_MARGIN_M)
    return undefined;
  return l < r ? 'left' : 'right';
}

export class MovementRecorder {
  readonly frames: MovementFrame[] = [];
  // Own instance: light smoothing, independent of the live rep counter
  private goniometer = new GoniometerService({ smoothingWindow: 3 });
  private readonly key: string;

  private readonly requiredView: CameraView | undefined;
  private readonly measure: ExerciseMovement['measure'];

  constructor(readonly context: MovementContext) {
    this.key = jointKey(context.side, context.joint);
    this.requiredView = rangeViewOf(context.exerciseId);
    this.measure = movementOf(context.exerciseId).measure;
  }

  add(pose: ProcessedPoseData): MovementFrame | null {
    if (this.frames.length >= MAX_FRAMES) return null;
    const landmarks = getMeasurementLandmarks(pose);
    const interior = this.goniometer.getJointAngle(this.key, landmarks);
    const view = viewOf(pose, landmarks);
    const { joint, side } = this.context;
    let angle = interior === null ? null : clinicalAngle(joint, interior);
    let estimated = false;
    if (this.measure === 'external_rotation') {
      // Needs the forearm seen, not just the upper arm
      const wrist = findLandmark(landmarks, `${side}_wrist`);
      angle =
        angle !== null && wrist && wrist.visibility >= 0.5
          ? externalRotationDegrees(pose.worldLandmarks, side)
          : null;
      estimated = angle !== null;
    } else if (angle !== null && view === 'front' && this.requiredView === 'side') {
      // A knee bending towards the camera reads 40-50° too straight: no number
      angle = null;
    } else if (angle !== null && view === 'oblique' && WORLD_AT_OBLIQUE.includes(joint)) {
      // Turned to the camera, the 3D estimate beats the flattened 2D angle
      const world = worldAngle(pose.worldLandmarks, joint, side);
      if (world !== null) {
        angle = world;
        estimated = true;
      }
    }
    // A non-numeric reading (NaN, Infinity) is no reading
    if (angle !== null && !Number.isFinite(angle)) angle = null;
    const frame: MovementFrame = {
      t: pose.timestamp,
      angle,
      estimated,
      landmarks,
      view,
      posture: postureOf(pose, landmarks),
      nearSide: nearerSide(pose, joint),
    };
    this.frames.push(frame);
    return frame;
  }

  reset(): void {
    this.frames.length = 0;
    this.goniometer.resetHistory();
  }
}
