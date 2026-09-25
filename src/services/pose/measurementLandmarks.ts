/**
 * Landmarks in the coordinate space joint angles must be computed in.
 *
 * Pose landmarks are normalized separately per axis (x / width, y / height), so on
 * any non-square frame angles computed directly from them are skewed. MediaPipe's
 * image-landmark z is a rough relative depth that is not on the same scale either.
 * Benchmarked on 150 COCO people with BlazePose Full (docs/benchmarks/POSE_MODELS.md):
 *
 *   normalized x/y + z (previous behaviour)  38.3° mean angle error
 *   normalized x/y                            14.6°
 *   world 3D landmarks                        19.9°
 *   aspect-corrected 2D (this module)         11.7°
 *
 * So angles use aspect-corrected 2D (ignoring MediaPipe's relative z; exact
 * synthetic/test depth is kept), and world landmarks are only used to flag
 * segments turned toward/away from the camera (see getOutOfPlaneSegments).
 */
import type { PoseLandmark, ProcessedPoseData } from '../../types/pose';
import { findLandmark } from './landmarkLookup';

type PoseForMeasurement = Pick<
  ProcessedPoseData,
  'landmarks' | 'aspectRatio' | 'zIsRelative'
>;

const cache = new WeakMap<PoseLandmark[], PoseLandmark[]>();

/**
 * Landmarks scaled so x and y share one unit (image height), with z dropped when
 * it is only a relative depth guess. Memoized per landmark array, so every
 * consumer of a frame shares one copy.
 */
export function getMeasurementLandmarks(pose: PoseForMeasurement): PoseLandmark[] {
  const cached = cache.get(pose.landmarks);
  if (cached) {
    return cached;
  }
  const aspect = pose.aspectRatio ?? 1;
  if (aspect === 1 && !pose.zIsRelative) {
    return pose.landmarks;
  }
  const measured = pose.landmarks.map((lm) => ({
    ...lm,
    x: lm.x * aspect,
    z: pose.zIsRelative ? undefined : lm.z,
  }));
  cache.set(pose.landmarks, measured);
  return measured;
}

/** Limb segments whose orientation matters for angle reliability. */
const SEGMENTS: Record<string, [string, string]> = {
  left_upper_arm: ['left_shoulder', 'left_elbow'],
  right_upper_arm: ['right_shoulder', 'right_elbow'],
  left_forearm: ['left_elbow', 'left_wrist'],
  right_forearm: ['right_elbow', 'right_wrist'],
  left_thigh: ['left_hip', 'left_knee'],
  right_thigh: ['right_hip', 'right_knee'],
  left_shank: ['left_knee', 'left_ankle'],
  right_shank: ['right_knee', 'right_ankle'],
  left_foot: ['left_ankle', 'left_foot_index'],
  right_foot: ['right_ankle', 'right_foot_index'],
};

/** Segments each joint angle depends on. */
export const JOINT_SEGMENTS: Record<string, string[]> = {
  left_elbow: ['left_upper_arm', 'left_forearm'],
  right_elbow: ['right_upper_arm', 'right_forearm'],
  left_shoulder: ['left_upper_arm'],
  right_shoulder: ['right_upper_arm'],
  left_hip: ['left_thigh'],
  right_hip: ['right_thigh'],
  left_knee: ['left_thigh', 'left_shank'],
  right_knee: ['right_thigh', 'right_shank'],
  left_ankle: ['left_shank', 'left_foot'],
  right_ankle: ['right_shank', 'right_foot'],
};

/**
 * Segments tilted more than `thresholdDeg` out of the image plane, from world
 * landmarks. A 2D angle across such a segment is foreshortened, so callers should
 * present it as an estimate (or ask the patient to turn side-on).
 */
export function getOutOfPlaneSegments(
  pose: Pick<ProcessedPoseData, 'worldLandmarks'>,
  thresholdDeg = 30
): Set<string> {
  const tilted = new Set<string>();
  const world = pose.worldLandmarks;
  if (!world || world.length === 0) {
    return tilted;
  }
  for (const [segment, [from, to]] of Object.entries(SEGMENTS)) {
    const a = findLandmark(world, from);
    const b = findLandmark(world, to);
    if (!a || !b || a.z === undefined || b.z === undefined) {
      continue;
    }
    const inPlane = Math.hypot(b.x - a.x, b.y - a.y);
    const tiltDeg = (Math.atan2(Math.abs(b.z - a.z), inPlane) * 180) / Math.PI;
    if (tiltDeg > thresholdDeg) {
      tilted.add(segment);
    }
  }
  return tilted;
}

/** Joint angles (snake_case names) that depend on an out-of-plane segment. */
export function getOutOfPlaneJoints(
  pose: Pick<ProcessedPoseData, 'worldLandmarks'>,
  thresholdDeg = 30
): Set<string> {
  const segments = getOutOfPlaneSegments(pose, thresholdDeg);
  const joints = new Set<string>();
  if (segments.size === 0) {
    return joints;
  }
  for (const [joint, deps] of Object.entries(JOINT_SEGMENTS)) {
    if (deps.some((s) => segments.has(s))) {
      joints.add(joint);
    }
  }
  return joints;
}
