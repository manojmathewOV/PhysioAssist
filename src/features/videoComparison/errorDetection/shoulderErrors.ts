/**
 * Shoulder Error Detection Algorithms
 *
 * Detects compensatory movement patterns during shoulder exercises.
 * All measurements use MoveNet 17-keypoint model indices.
 *
 * ⚠️ THRESHOLDS REQUIRE CLINICAL VALIDATION ⚠️
 */

import { PoseFrame, KeyPoint } from '../types/pose';
import { ErrorDetectionConfig } from '../config/errorDetectionConfig';

export interface ShoulderError {
  type: 'shoulder_hiking' | 'trunk_lean' | 'internal_rotation' | 'incomplete_rom';
  severity: 'warning' | 'critical';
  side: 'left' | 'right';
  value: number;
  unit: 'cm' | 'degrees' | 'percent';
  timestamp: number;
}

/**
 * MoveNet Keypoint Indices
 */
const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
};

/**
 * Calculate Euclidean distance between two keypoints (in pixels)
 */
function calculateDistance(p1: KeyPoint, p2: KeyPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert pixel distance to cm using shoulder width as reference
 * Average shoulder width: 40cm for adults
 */
function pixelsToCm(pixels: number, shoulderWidthPixels: number): number {
  const AVERAGE_SHOULDER_WIDTH_CM = 40;
  return (pixels / shoulderWidthPixels) * AVERAGE_SHOULDER_WIDTH_CM;
}

/**
 * Calculate angle between three points (in degrees)
 * Returns angle at point b
 */
function calculateAngle(a: KeyPoint, b: KeyPoint, c: KeyPoint): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

/**
 * Get shoulder reference width for normalization
 */
function getShoulderWidth(keypoints: KeyPoint[]): number {
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
  return calculateDistance(leftShoulder, rightShoulder);
}

/**
 * Detect Shoulder Hiking (Elevation)
 *
 * Measures vertical distance between shoulder and ear.
 * Shoulder hiking is a common compensation when patient lacks
 * rotator cuff strength or has impingement.
 *
 * Detection: Shoulder-to-ear distance decreases significantly
 */
export function detectShoulderHiking(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): ShoulderError | null {
  const shoulderIdx =
    side === 'left' ? KEYPOINTS.LEFT_SHOULDER : KEYPOINTS.RIGHT_SHOULDER;
  const earIdx = side === 'left' ? KEYPOINTS.LEFT_EAR : KEYPOINTS.RIGHT_EAR;

  const userShoulder = userPose.keypoints[shoulderIdx];
  const userEar = userPose.keypoints[earIdx];
  const refShoulder = referencePose.keypoints[shoulderIdx];
  const refEar = referencePose.keypoints[earIdx];

  // Check confidence
  if (
    userShoulder.confidence < 0.5 ||
    userEar.confidence < 0.5 ||
    refShoulder.confidence < 0.5 ||
    refEar.confidence < 0.5
  ) {
    return null;
  }

  // Calculate shoulder-to-ear distance
  const userDistance = Math.abs(userEar.y - userShoulder.y);
  const refDistance = Math.abs(refEar.y - refShoulder.y);

  // Normalize to cm
  const userShoulderWidth = getShoulderWidth(userPose.keypoints);
  const refShoulderWidth = getShoulderWidth(referencePose.keypoints);

  const userDistanceCm = pixelsToCm(userDistance, userShoulderWidth);
  const refDistanceCm = pixelsToCm(refDistance, refShoulderWidth);

  // Calculate elevation (how much closer shoulder is to ear)
  const elevationCm = refDistanceCm - userDistanceCm;

  // Check against thresholds
  if (elevationCm >= ErrorDetectionConfig.shoulder.shoulderHiking.critical_cm) {
    return {
      type: 'shoulder_hiking',
      severity: 'critical',
      side,
      value: elevationCm,
      unit: 'cm',
      timestamp: userPose.timestamp,
    };
  }

  if (elevationCm >= ErrorDetectionConfig.shoulder.shoulderHiking.warning_cm) {
    return {
      type: 'shoulder_hiking',
      severity: 'warning',
      side,
      value: elevationCm,
      unit: 'cm',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect Trunk Lean (Lateral Flexion)
 *
 * Measures lateral trunk angle during shoulder abduction.
 * Patient leans away from lifting side to compensate for
 * weakness or ROM limitation.
 *
 * Detection: Hip-to-shoulder line deviates from vertical
 */
export function detectTrunkLean(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): ShoulderError | null {
  const shoulderIdx =
    side === 'left' ? KEYPOINTS.LEFT_SHOULDER : KEYPOINTS.RIGHT_SHOULDER;
  const hipIdx = side === 'left' ? KEYPOINTS.LEFT_HIP : KEYPOINTS.RIGHT_HIP;

  const userShoulder = userPose.keypoints[shoulderIdx];
  const userHip = userPose.keypoints[hipIdx];
  const refShoulder = referencePose.keypoints[shoulderIdx];
  const refHip = referencePose.keypoints[hipIdx];

  // Check confidence
  if (
    userShoulder.confidence < 0.5 ||
    userHip.confidence < 0.5 ||
    refShoulder.confidence < 0.5 ||
    refHip.confidence < 0.5
  ) {
    return null;
  }

  // Calculate trunk angle (lateral deviation from vertical)
  const userLeanAngle = Math.abs(
    Math.atan2(userShoulder.x - userHip.x, userHip.y - userShoulder.y) * (180 / Math.PI)
  );
  const refLeanAngle = Math.abs(
    Math.atan2(refShoulder.x - refHip.x, refHip.y - refShoulder.y) * (180 / Math.PI)
  );

  const leanDifference = Math.abs(userLeanAngle - refLeanAngle);

  // Check against thresholds
  if (leanDifference >= ErrorDetectionConfig.shoulder.trunkLean.critical_deg) {
    return {
      type: 'trunk_lean',
      severity: 'critical',
      side,
      value: leanDifference,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  if (leanDifference >= ErrorDetectionConfig.shoulder.trunkLean.warning_deg) {
    return {
      type: 'trunk_lean',
      severity: 'warning',
      side,
      value: leanDifference,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect Internal Rotation
 *
 * Estimates forearm orientation during shoulder movements.
 * Internal rotation can indicate impingement or compensation.
 *
 * Detection: Elbow-wrist vector deviates medially
 *
 * ⚠️ Note: This is a 2D approximation. Real internal rotation
 * requires 3D motion capture. This detects visible deviation only.
 */
export function detectInternalRotation(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): ShoulderError | null {
  const shoulderIdx =
    side === 'left' ? KEYPOINTS.LEFT_SHOULDER : KEYPOINTS.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? KEYPOINTS.LEFT_ELBOW : KEYPOINTS.RIGHT_ELBOW;
  const wristIdx = side === 'left' ? KEYPOINTS.LEFT_WRIST : KEYPOINTS.RIGHT_WRIST;

  const userShoulder = userPose.keypoints[shoulderIdx];
  const userElbow = userPose.keypoints[elbowIdx];
  const userWrist = userPose.keypoints[wristIdx];

  const refShoulder = referencePose.keypoints[shoulderIdx];
  const refElbow = referencePose.keypoints[elbowIdx];
  const refWrist = referencePose.keypoints[wristIdx];

  // Check confidence
  if (
    userShoulder.confidence < 0.5 ||
    userElbow.confidence < 0.5 ||
    userWrist.confidence < 0.5 ||
    refShoulder.confidence < 0.5 ||
    refElbow.confidence < 0.5 ||
    refWrist.confidence < 0.5
  ) {
    return null;
  }

  // Calculate forearm angle relative to shoulder-elbow line
  const userForearmAngle = calculateAngle(userShoulder, userElbow, userWrist);
  const refForearmAngle = calculateAngle(refShoulder, refElbow, refWrist);

  const rotationDifference = Math.abs(userForearmAngle - refForearmAngle);

  // Check against thresholds
  if (rotationDifference >= ErrorDetectionConfig.shoulder.internalRotation.critical_deg) {
    return {
      type: 'internal_rotation',
      severity: 'critical',
      side,
      value: rotationDifference,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  if (rotationDifference >= ErrorDetectionConfig.shoulder.internalRotation.warning_deg) {
    return {
      type: 'internal_rotation',
      severity: 'warning',
      side,
      value: rotationDifference,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect Incomplete ROM
 *
 * Compares user's maximum shoulder angle to reference.
 * Patient may not achieve full elevation due to weakness,
 * pain, or ROM limitation.
 *
 * Detection: Max angle < threshold percentage of reference
 */
export function detectIncompleteROM(
  userPoses: PoseFrame[],
  referencePoses: PoseFrame[],
  side: 'left' | 'right'
): ShoulderError | null {
  const shoulderIdx =
    side === 'left' ? KEYPOINTS.LEFT_SHOULDER : KEYPOINTS.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? KEYPOINTS.LEFT_ELBOW : KEYPOINTS.RIGHT_ELBOW;
  const hipIdx = side === 'left' ? KEYPOINTS.LEFT_HIP : KEYPOINTS.RIGHT_HIP;

  // Find maximum shoulder abduction angle in each sequence
  let userMaxAngle = 0;
  let refMaxAngle = 0;

  for (const pose of userPoses) {
    const shoulder = pose.keypoints[shoulderIdx];
    const elbow = pose.keypoints[elbowIdx];
    const hip = pose.keypoints[hipIdx];

    if (shoulder.confidence > 0.5 && elbow.confidence > 0.5 && hip.confidence > 0.5) {
      const angle = calculateAngle(hip, shoulder, elbow);
      if (angle > userMaxAngle) {
        userMaxAngle = angle;
      }
    }
  }

  for (const pose of referencePoses) {
    const shoulder = pose.keypoints[shoulderIdx];
    const elbow = pose.keypoints[elbowIdx];
    const hip = pose.keypoints[hipIdx];

    if (shoulder.confidence > 0.5 && elbow.confidence > 0.5 && hip.confidence > 0.5) {
      const angle = calculateAngle(hip, shoulder, elbow);
      if (angle > refMaxAngle) {
        refMaxAngle = angle;
      }
    }
  }

  // Calculate percentage of reference ROM achieved
  const romPercent = (userMaxAngle / refMaxAngle) * 100;

  // Check against thresholds
  if (romPercent <= ErrorDetectionConfig.shoulder.incompleteROM.critical_percent) {
    return {
      type: 'incomplete_rom',
      severity: 'critical',
      side,
      value: romPercent,
      unit: 'percent',
      timestamp: userPoses[userPoses.length - 1].timestamp,
    };
  }

  if (romPercent <= ErrorDetectionConfig.shoulder.incompleteROM.warning_percent) {
    return {
      type: 'incomplete_rom',
      severity: 'warning',
      side,
      value: romPercent,
      unit: 'percent',
      timestamp: userPoses[userPoses.length - 1].timestamp,
    };
  }

  return null;
}

/**
 * Detect All Shoulder Errors
 *
 * Runs all shoulder error detection algorithms and returns all detected errors.
 */
export function detectAllShoulderErrors(
  userPoses: PoseFrame[],
  referencePoses: PoseFrame[]
): ShoulderError[] {
  const errors: ShoulderError[] = [];

  // Frame-by-frame detection (hiking, lean, rotation)
  for (let i = 0; i < Math.min(userPoses.length, referencePoses.length); i++) {
    const userPose = userPoses[i];
    const refPose = referencePoses[i];

    // Check both sides
    for (const side of ['left', 'right'] as const) {
      const hiking = detectShoulderHiking(userPose, refPose, side);
      if (hiking) errors.push(hiking);

      const lean = detectTrunkLean(userPose, refPose, side);
      if (lean) errors.push(lean);

      const rotation = detectInternalRotation(userPose, refPose, side);
      if (rotation) errors.push(rotation);
    }
  }

  // Sequence-level detection (incomplete ROM)
  for (const side of ['left', 'right'] as const) {
    const romError = detectIncompleteROM(userPoses, referencePoses, side);
    if (romError) errors.push(romError);
  }

  return errors;
}
