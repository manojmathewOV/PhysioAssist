/**
 * The three points that define each joint angle. Shoulders are measured
 * against the trunk midline (hip midpoint to shoulder midpoint), the clinical
 * goniometry convention and Sports2D's: the line from a shoulder to the hip on
 * the same side slopes inward and read shoulder angles ~4° high against motion
 * capture on real recordings (Clemente et al. 2024; see docs/benchmarks).
 */
import type { PoseLandmark } from '../../types/pose';
import { findLandmark } from './landmarkLookup';

/** [proximal, vertex, distal] landmark names for each measurable joint. */
export const JOINT_LANDMARK_NAMES: Record<string, [string, string, string]> = {
  left_elbow: ['left_shoulder', 'left_elbow', 'left_wrist'],
  right_elbow: ['right_shoulder', 'right_elbow', 'right_wrist'],
  left_shoulder: ['left_elbow', 'left_shoulder', 'left_hip'],
  right_shoulder: ['right_elbow', 'right_shoulder', 'right_hip'],
  left_hip: ['left_shoulder', 'left_hip', 'left_knee'],
  right_hip: ['right_shoulder', 'right_hip', 'right_knee'],
  left_knee: ['left_hip', 'left_knee', 'left_ankle'],
  right_knee: ['right_hip', 'right_knee', 'right_ankle'],
  left_ankle: ['left_knee', 'left_ankle', 'left_foot_index'],
  right_ankle: ['right_knee', 'right_ankle', 'right_foot_index'],
};

/** A point below the shoulder along the trunk midline (falls back to the same-side hip). */
function trunkPoint(landmarks: PoseLandmark[], shoulder: PoseLandmark, side: string) {
  const ls = findLandmark(landmarks, 'left_shoulder');
  const rs = findLandmark(landmarks, 'right_shoulder');
  const lh = findLandmark(landmarks, 'left_hip');
  const rh = findLandmark(landmarks, 'right_hip');
  if (!ls || !rs || !lh || !rh) return findLandmark(landmarks, `${side}_hip`);
  return {
    ...shoulder,
    x: shoulder.x + (lh.x + rh.x - ls.x - rs.x) / 2,
    y: shoulder.y + (lh.y + rh.y - ls.y - rs.y) / 2,
    z: (shoulder.z ?? 0) + ((lh.z ?? 0) + (rh.z ?? 0) - (ls.z ?? 0) - (rs.z ?? 0)) / 2,
    visibility: Math.min(ls.visibility, rs.visibility, lh.visibility, rh.visibility),
    name: `${side}_trunk`,
  };
}

/** The three points of a joint angle, or null if any is missing. */
export function jointPoints(
  landmarks: PoseLandmark[],
  joint: string
): [PoseLandmark, PoseLandmark, PoseLandmark] | null {
  const names = JOINT_LANDMARK_NAMES[joint];
  if (!names) return null;
  const proximal = findLandmark(landmarks, names[0]);
  const vertex = findLandmark(landmarks, names[1]);
  // Shoulder: [elbow, shoulder, trunk] with the trunk point in place of the hip
  const shoulder = joint.match(/^(left|right)_shoulder$/);
  const distal =
    shoulder && vertex
      ? trunkPoint(landmarks, vertex, shoulder[1])
      : findLandmark(landmarks, names[2]);
  return proximal && vertex && distal ? [proximal, vertex, distal] : null;
}
