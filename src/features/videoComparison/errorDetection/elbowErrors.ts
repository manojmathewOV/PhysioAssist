/**
 * Elbow Error Detection Algorithms
 *
 * Detects compensatory movement patterns during elbow exercises (bicep curls, tricep extensions).
 * All measurements use MoveNet 17-keypoint model indices.
 *
 * ⚠️ THRESHOLDS REQUIRE CLINICAL VALIDATION ⚠️
 */

import { PoseFrame, KeyPoint } from '../types/pose';
import { ErrorDetectionConfig } from '../config/errorDetectionConfig';

export interface ElbowError {
  type: 'shoulder_compensation' | 'incomplete_extension' | 'wrist_deviation';
  severity: 'warning' | 'critical';
  side: 'left' | 'right';
  value: number;
  unit: 'cm' | 'degrees';
  timestamp: number;
}

/**
 * MoveNet Keypoint Indices
 */
const KEYPOINTS = {
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
 * Detect Shoulder Compensation (Momentum/Cheating)
 *
 * Measures shoulder movement during bicep curl.
 * Patient swings shoulder forward to generate momentum,
 * reducing actual bicep work and increasing injury risk.
 *
 * Detection: Shoulder moves forward/backward during curl
 */
export function detectShoulderCompensation(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): ElbowError | null {
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

  // Calculate shoulder-hip horizontal distance
  // (shoulder moving forward = compensation)
  const userShoulderOffset = Math.abs(userShoulder.x - userHip.x);
  const refShoulderOffset = Math.abs(refShoulder.x - refHip.x);

  // Normalize to shoulder width
  const shoulderWidth = getShoulderWidth(userPose.keypoints);
  const movementPixels = Math.abs(userShoulderOffset - refShoulderOffset);
  const movementCm = pixelsToCm(movementPixels, shoulderWidth);

  // Check against thresholds
  if (movementCm >= ErrorDetectionConfig.elbow.shoulderCompensation.critical_cm) {
    return {
      type: 'shoulder_compensation',
      severity: 'critical',
      side,
      value: movementCm,
      unit: 'cm',
      timestamp: userPose.timestamp,
    };
  }

  if (movementCm >= ErrorDetectionConfig.elbow.shoulderCompensation.warning_cm) {
    return {
      type: 'shoulder_compensation',
      severity: 'warning',
      side,
      value: movementCm,
      unit: 'cm',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect Incomplete Extension
 *
 * Measures elbow angle at bottom of tricep extension.
 * Patient may not fully extend due to weakness or ROM limitation.
 *
 * Detection: Minimum elbow angle > threshold (full extension = ~180°)
 */
export function detectIncompleteExtension(
  userPoses: PoseFrame[],
  referencePoses: PoseFrame[],
  side: 'left' | 'right'
): ElbowError | null {
  const shoulderIdx =
    side === 'left' ? KEYPOINTS.LEFT_SHOULDER : KEYPOINTS.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? KEYPOINTS.LEFT_ELBOW : KEYPOINTS.RIGHT_ELBOW;
  const wristIdx = side === 'left' ? KEYPOINTS.LEFT_WRIST : KEYPOINTS.RIGHT_WRIST;

  // Find minimum elbow angle in each sequence (full extension point)
  let userMinAngle = 180;
  let refMinAngle = 180;

  for (const pose of userPoses) {
    const shoulder = pose.keypoints[shoulderIdx];
    const elbow = pose.keypoints[elbowIdx];
    const wrist = pose.keypoints[wristIdx];

    if (shoulder.confidence > 0.5 && elbow.confidence > 0.5 && wrist.confidence > 0.5) {
      const angle = calculateAngle(shoulder, elbow, wrist);
      if (angle < userMinAngle) {
        userMinAngle = angle;
      }
    }
  }

  for (const pose of referencePoses) {
    const shoulder = pose.keypoints[shoulderIdx];
    const elbow = pose.keypoints[elbowIdx];
    const wrist = pose.keypoints[wristIdx];

    if (shoulder.confidence > 0.5 && elbow.confidence > 0.5 && wrist.confidence > 0.5) {
      const angle = calculateAngle(shoulder, elbow, wrist);
      if (angle < refMinAngle) {
        refMinAngle = angle;
      }
    }
  }

  // Check if user's extension is less than reference
  // Lower angle = more flexion = incomplete extension
  const extensionDeficit = refMinAngle - userMinAngle;

  // Only flag if user has incomplete extension
  if (extensionDeficit <= 0) {
    return null;
  }

  // Check against thresholds
  // Note: Thresholds are stored as target angles (160° = warning, 140° = critical)
  // Convert to deficit for comparison
  if (userMinAngle <= ErrorDetectionConfig.elbow.incompleteExtension.critical_deg) {
    return {
      type: 'incomplete_extension',
      severity: 'critical',
      side,
      value: userMinAngle,
      unit: 'degrees',
      timestamp: userPoses[userPoses.length - 1].timestamp,
    };
  }

  if (userMinAngle <= ErrorDetectionConfig.elbow.incompleteExtension.warning_deg) {
    return {
      type: 'incomplete_extension',
      severity: 'warning',
      side,
      value: userMinAngle,
      unit: 'degrees',
      timestamp: userPoses[userPoses.length - 1].timestamp,
    };
  }

  return null;
}

/**
 * Detect Wrist Deviation
 *
 * Measures wrist alignment during elbow exercises.
 * Excessive flexion or extension can strain wrist tendons.
 *
 * Detection: Elbow-wrist-knuckle angle deviates from neutral
 *
 * ⚠️ Note: MoveNet doesn't detect knuckles, so we approximate
 * by comparing wrist position relative to elbow-wrist vector
 */
export function detectWristDeviation(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): ElbowError | null {
  const elbowIdx = side === 'left' ? KEYPOINTS.LEFT_ELBOW : KEYPOINTS.RIGHT_ELBOW;
  const wristIdx = side === 'left' ? KEYPOINTS.LEFT_WRIST : KEYPOINTS.RIGHT_WRIST;
  const shoulderIdx =
    side === 'left' ? KEYPOINTS.LEFT_SHOULDER : KEYPOINTS.RIGHT_SHOULDER;

  const userElbow = userPose.keypoints[elbowIdx];
  const userWrist = userPose.keypoints[wristIdx];
  const userShoulder = userPose.keypoints[shoulderIdx];

  const refElbow = referencePose.keypoints[elbowIdx];
  const refWrist = referencePose.keypoints[wristIdx];
  const refShoulder = referencePose.keypoints[shoulderIdx];

  // Check confidence
  if (
    userElbow.confidence < 0.5 ||
    userWrist.confidence < 0.5 ||
    userShoulder.confidence < 0.5 ||
    refElbow.confidence < 0.5 ||
    refWrist.confidence < 0.5 ||
    refShoulder.confidence < 0.5
  ) {
    return null;
  }

  // Calculate forearm angle (elbow-wrist vector relative to horizontal)
  const userForearmAngle =
    Math.atan2(userWrist.y - userElbow.y, userWrist.x - userElbow.x) * (180 / Math.PI);
  const refForearmAngle =
    Math.atan2(refWrist.y - refElbow.y, refWrist.x - refElbow.x) * (180 / Math.PI);

  // Calculate deviation (difference from reference)
  const deviation = Math.abs(userForearmAngle - refForearmAngle);

  // Check against thresholds
  if (deviation >= ErrorDetectionConfig.elbow.wristDeviation.critical_deg) {
    return {
      type: 'wrist_deviation',
      severity: 'critical',
      side,
      value: deviation,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  if (deviation >= ErrorDetectionConfig.elbow.wristDeviation.warning_deg) {
    return {
      type: 'wrist_deviation',
      severity: 'warning',
      side,
      value: deviation,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect All Elbow Errors
 *
 * Runs all elbow error detection algorithms and returns all detected errors.
 */
export function detectAllElbowErrors(
  userPoses: PoseFrame[],
  referencePoses: PoseFrame[]
): ElbowError[] {
  const errors: ElbowError[] = [];

  // Frame-by-frame detection (shoulder compensation, wrist deviation)
  for (let i = 0; i < Math.min(userPoses.length, referencePoses.length); i++) {
    const userPose = userPoses[i];
    const refPose = referencePoses[i];

    // Check both sides
    for (const side of ['left', 'right'] as const) {
      const compensation = detectShoulderCompensation(userPose, refPose, side);
      if (compensation) errors.push(compensation);

      const wristDev = detectWristDeviation(userPose, refPose, side);
      if (wristDev) errors.push(wristDev);
    }
  }

  // Sequence-level detection (incomplete extension)
  for (const side of ['left', 'right'] as const) {
    const extensionError = detectIncompleteExtension(userPoses, referencePoses, side);
    if (extensionError) errors.push(extensionError);
  }

  return errors;
}
