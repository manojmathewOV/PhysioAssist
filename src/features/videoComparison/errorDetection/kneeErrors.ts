/**
 * Knee Error Detection Algorithms
 *
 * Detects compensatory movement patterns during knee exercises (squats, lunges).
 * All measurements use MoveNet 17-keypoint model indices.
 *
 * ⚠️ KNEE VALGUS IS HIGH INJURY RISK - ACL TEAR ⚠️
 * ⚠️ THRESHOLDS REQUIRE CLINICAL VALIDATION ⚠️
 */

import { PoseFrame, KeyPoint } from '../types/pose';
import { ErrorDetectionConfig } from '../config/errorDetectionConfig';

export interface KneeError {
  type: 'knee_valgus' | 'heel_lift' | 'posterior_pelvic_tilt' | 'insufficient_depth';
  severity: 'warning' | 'critical';
  side: 'left' | 'right' | 'bilateral';
  value: number;
  unit: 'percent' | 'cm' | 'degrees';
  timestamp: number;
}

/**
 * MoveNet Keypoint Indices
 */
const KEYPOINTS = {
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
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
 * Convert pixel distance to cm using stance width as reference
 * Average stance width: 60cm for squats
 */
function pixelsToCm(pixels: number, stanceWidthPixels: number): number {
  const AVERAGE_STANCE_WIDTH_CM = 60;
  return (pixels / stanceWidthPixels) * AVERAGE_STANCE_WIDTH_CM;
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
 * Get stance width (ankle-to-ankle distance)
 */
function getStanceWidth(keypoints: KeyPoint[]): number {
  const leftAnkle = keypoints[KEYPOINTS.LEFT_ANKLE];
  const rightAnkle = keypoints[KEYPOINTS.RIGHT_ANKLE];
  return calculateDistance(leftAnkle, rightAnkle);
}

/**
 * Detect Knee Valgus (Knees Caving In)
 *
 * ⚠️ CRITICAL ERROR - HIGH ACL INJURY RISK ⚠️
 *
 * Measures medial knee displacement relative to ankle position.
 * Knee valgus is a primary predictor of ACL injury, especially in
 * female athletes (Hewett et al., 2005).
 *
 * Detection: Knee X-position moves medially relative to ankle
 */
export function detectKneeValgus(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): KneeError | null {
  const kneeIdx = side === 'left' ? KEYPOINTS.LEFT_KNEE : KEYPOINTS.RIGHT_KNEE;
  const ankleIdx = side === 'left' ? KEYPOINTS.LEFT_ANKLE : KEYPOINTS.RIGHT_ANKLE;
  const hipIdx = side === 'left' ? KEYPOINTS.LEFT_HIP : KEYPOINTS.RIGHT_HIP;

  const userKnee = userPose.keypoints[kneeIdx];
  const userAnkle = userPose.keypoints[ankleIdx];
  const userHip = userPose.keypoints[hipIdx];

  const refKnee = referencePose.keypoints[kneeIdx];
  const refAnkle = referencePose.keypoints[ankleIdx];
  const refHip = referencePose.keypoints[hipIdx];

  // Check confidence
  if (
    userKnee.confidence < 0.5 ||
    userAnkle.confidence < 0.5 ||
    userHip.confidence < 0.5 ||
    refKnee.confidence < 0.5 ||
    refAnkle.confidence < 0.5 ||
    refHip.confidence < 0.5
  ) {
    return null;
  }

  // Calculate medial shift as percentage of stance width
  // Valgus = knee moves medially (towards midline)
  const userStanceWidth = getStanceWidth(userPose.keypoints);
  const refStanceWidth = getStanceWidth(referencePose.keypoints);

  // Calculate knee-ankle horizontal offset
  const userKneeOffset = Math.abs(userKnee.x - userAnkle.x);
  const refKneeOffset = Math.abs(refKnee.x - refAnkle.x);

  // Normalize to stance width (percentage)
  const userOffsetPercent = (userKneeOffset / userStanceWidth) * 100;
  const refOffsetPercent = (refKneeOffset / refStanceWidth) * 100;

  // Valgus = user's knee offset is GREATER than reference
  // (knee deviates more from vertical line)
  const valgusPercent = userOffsetPercent - refOffsetPercent;

  // Only flag if knee offset increased (positive valgus)
  if (valgusPercent <= 0) {
    return null;
  }

  // Check against thresholds
  // ⚠️ Conservative thresholds due to injury risk
  if (valgusPercent >= ErrorDetectionConfig.knee.kneeValgus.critical_percent) {
    return {
      type: 'knee_valgus',
      severity: 'critical',
      side,
      value: valgusPercent,
      unit: 'percent',
      timestamp: userPose.timestamp,
    };
  }

  if (valgusPercent >= ErrorDetectionConfig.knee.kneeValgus.warning_percent) {
    return {
      type: 'knee_valgus',
      severity: 'warning',
      side,
      value: valgusPercent,
      unit: 'percent',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect Heel Lift
 *
 * Measures heel elevation during squat.
 * Heel lift indicates ankle mobility limitation or
 * improper weight distribution.
 *
 * Detection: Ankle Y-position rises during descent
 */
export function detectHeelLift(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): KneeError | null {
  const ankleIdx = side === 'left' ? KEYPOINTS.LEFT_ANKLE : KEYPOINTS.RIGHT_ANKLE;
  const kneeIdx = side === 'left' ? KEYPOINTS.LEFT_KNEE : KEYPOINTS.RIGHT_KNEE;

  const userAnkle = userPose.keypoints[ankleIdx];
  const userKnee = userPose.keypoints[kneeIdx];
  const refAnkle = referencePose.keypoints[ankleIdx];
  const refKnee = referencePose.keypoints[kneeIdx];

  // Check confidence
  if (
    userAnkle.confidence < 0.5 ||
    userKnee.confidence < 0.5 ||
    refAnkle.confidence < 0.5 ||
    refKnee.confidence < 0.5
  ) {
    return null;
  }

  // Calculate vertical movement of ankle relative to knee
  const userAnkleToKnee = userKnee.y - userAnkle.y;
  const refAnkleToKnee = refKnee.y - refAnkle.y;

  // Normalize to stance width
  const userStanceWidth = getStanceWidth(userPose.keypoints);
  const refStanceWidth = getStanceWidth(referencePose.keypoints);

  const userLiftPixels = Math.abs(userAnkleToKnee - refAnkleToKnee);
  const liftCm = pixelsToCm(userLiftPixels, userStanceWidth);

  // Only flag if heel is lifting (ankle moving up)
  if (userAnkleToKnee >= refAnkleToKnee) {
    return null;
  }

  // Check against thresholds
  if (liftCm >= ErrorDetectionConfig.knee.heelLift.critical_cm) {
    return {
      type: 'heel_lift',
      severity: 'critical',
      side,
      value: liftCm,
      unit: 'cm',
      timestamp: userPose.timestamp,
    };
  }

  if (liftCm >= ErrorDetectionConfig.knee.heelLift.warning_cm) {
    return {
      type: 'heel_lift',
      severity: 'warning',
      side,
      value: liftCm,
      unit: 'cm',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect Posterior Pelvic Tilt ("Butt Wink")
 *
 * Measures lumbar flexion at bottom of squat.
 * Excessive posterior tilt can stress lumbar spine.
 *
 * Detection: Hip-to-shoulder angle changes excessively
 */
export function detectPosteriorPelvicTilt(
  userPose: PoseFrame,
  referencePose: PoseFrame
): KneeError | null {
  // Use midpoints for bilateral assessment
  const userLeftHip = userPose.keypoints[KEYPOINTS.LEFT_HIP];
  const userRightHip = userPose.keypoints[KEYPOINTS.RIGHT_HIP];
  const userLeftShoulder = userPose.keypoints[KEYPOINTS.LEFT_SHOULDER];
  const userRightShoulder = userPose.keypoints[KEYPOINTS.RIGHT_SHOULDER];

  const refLeftHip = referencePose.keypoints[KEYPOINTS.LEFT_HIP];
  const refRightHip = referencePose.keypoints[KEYPOINTS.RIGHT_HIP];
  const refLeftShoulder = referencePose.keypoints[KEYPOINTS.LEFT_SHOULDER];
  const refRightShoulder = referencePose.keypoints[KEYPOINTS.RIGHT_SHOULDER];

  // Check confidence
  if (
    userLeftHip.confidence < 0.5 ||
    userRightHip.confidence < 0.5 ||
    userLeftShoulder.confidence < 0.5 ||
    userRightShoulder.confidence < 0.5 ||
    refLeftHip.confidence < 0.5 ||
    refRightHip.confidence < 0.5 ||
    refLeftShoulder.confidence < 0.5 ||
    refRightShoulder.confidence < 0.5
  ) {
    return null;
  }

  // Calculate hip midpoint
  const userHipMid = {
    x: (userLeftHip.x + userRightHip.x) / 2,
    y: (userLeftHip.y + userRightHip.y) / 2,
    confidence: Math.min(userLeftHip.confidence, userRightHip.confidence),
  };

  const refHipMid = {
    x: (refLeftHip.x + refRightHip.x) / 2,
    y: (refLeftHip.y + refRightHip.y) / 2,
    confidence: Math.min(refLeftHip.confidence, refRightHip.confidence),
  };

  // Calculate shoulder midpoint
  const userShoulderMid = {
    x: (userLeftShoulder.x + userRightShoulder.x) / 2,
    y: (userLeftShoulder.y + userRightShoulder.y) / 2,
    confidence: Math.min(userLeftShoulder.confidence, userRightShoulder.confidence),
  };

  const refShoulderMid = {
    x: (refLeftShoulder.x + refRightShoulder.x) / 2,
    y: (refLeftShoulder.y + refRightShoulder.y) / 2,
    confidence: Math.min(refLeftShoulder.confidence, refRightShoulder.confidence),
  };

  // Calculate trunk angle (hip-to-shoulder relative to vertical)
  const userTrunkAngle = Math.abs(
    Math.atan2(userShoulderMid.x - userHipMid.x, userHipMid.y - userShoulderMid.y) *
      (180 / Math.PI)
  );
  const refTrunkAngle = Math.abs(
    Math.atan2(refShoulderMid.x - refHipMid.x, refHipMid.y - refShoulderMid.y) *
      (180 / Math.PI)
  );

  const tiltDifference = Math.abs(userTrunkAngle - refTrunkAngle);

  // Check against thresholds
  if (tiltDifference >= ErrorDetectionConfig.knee.posteriorPelvicTilt.critical_deg) {
    return {
      type: 'posterior_pelvic_tilt',
      severity: 'critical',
      side: 'bilateral',
      value: tiltDifference,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  if (tiltDifference >= ErrorDetectionConfig.knee.posteriorPelvicTilt.warning_deg) {
    return {
      type: 'posterior_pelvic_tilt',
      severity: 'warning',
      side: 'bilateral',
      value: tiltDifference,
      unit: 'degrees',
      timestamp: userPose.timestamp,
    };
  }

  return null;
}

/**
 * Detect Insufficient Depth
 *
 * Measures knee flexion angle at bottom of squat.
 * Patient may not achieve target depth due to weakness,
 * pain, or mobility limitation.
 *
 * Detection: Minimum knee angle > threshold
 */
export function detectInsufficientDepth(
  userPoses: PoseFrame[],
  referencePoses: PoseFrame[],
  side: 'left' | 'right'
): KneeError | null {
  const hipIdx = side === 'left' ? KEYPOINTS.LEFT_HIP : KEYPOINTS.RIGHT_HIP;
  const kneeIdx = side === 'left' ? KEYPOINTS.LEFT_KNEE : KEYPOINTS.RIGHT_KNEE;
  const ankleIdx = side === 'left' ? KEYPOINTS.LEFT_ANKLE : KEYPOINTS.RIGHT_ANKLE;

  // Find minimum knee angle in each sequence (bottom of squat)
  let userMinAngle = 180;
  let refMinAngle = 180;

  for (const pose of userPoses) {
    const hip = pose.keypoints[hipIdx];
    const knee = pose.keypoints[kneeIdx];
    const ankle = pose.keypoints[ankleIdx];

    if (hip.confidence > 0.5 && knee.confidence > 0.5 && ankle.confidence > 0.5) {
      const angle = calculateAngle(hip, knee, ankle);
      if (angle < userMinAngle) {
        userMinAngle = angle;
      }
    }
  }

  for (const pose of referencePoses) {
    const hip = pose.keypoints[hipIdx];
    const knee = pose.keypoints[kneeIdx];
    const ankle = pose.keypoints[ankleIdx];

    if (hip.confidence > 0.5 && knee.confidence > 0.5 && ankle.confidence > 0.5) {
      const angle = calculateAngle(hip, knee, ankle);
      if (angle < refMinAngle) {
        refMinAngle = angle;
      }
    }
  }

  // Calculate deficit (how many degrees short)
  const depthDeficit = userMinAngle - refMinAngle;

  // Only flag if user is shallower than reference
  if (depthDeficit <= 0) {
    return null;
  }

  // Check against thresholds
  if (depthDeficit >= ErrorDetectionConfig.knee.insufficientDepth.critical_deg) {
    return {
      type: 'insufficient_depth',
      severity: 'critical',
      side,
      value: depthDeficit,
      unit: 'degrees',
      timestamp: userPoses[userPoses.length - 1].timestamp,
    };
  }

  if (depthDeficit >= ErrorDetectionConfig.knee.insufficientDepth.warning_deg) {
    return {
      type: 'insufficient_depth',
      severity: 'warning',
      side,
      value: depthDeficit,
      unit: 'degrees',
      timestamp: userPoses[userPoses.length - 1].timestamp,
    };
  }

  return null;
}

/**
 * Detect All Knee Errors
 *
 * Runs all knee error detection algorithms and returns all detected errors.
 */
export function detectAllKneeErrors(
  userPoses: PoseFrame[],
  referencePoses: PoseFrame[]
): KneeError[] {
  const errors: KneeError[] = [];

  // Frame-by-frame detection (valgus, heel lift, pelvic tilt)
  for (let i = 0; i < Math.min(userPoses.length, referencePoses.length); i++) {
    const userPose = userPoses[i];
    const refPose = referencePoses[i];

    // Check both sides for valgus and heel lift
    for (const side of ['left', 'right'] as const) {
      const valgus = detectKneeValgus(userPose, refPose, side);
      if (valgus) errors.push(valgus);

      const heelLift = detectHeelLift(userPose, refPose, side);
      if (heelLift) errors.push(heelLift);
    }

    // Pelvic tilt is bilateral
    const pelvicTilt = detectPosteriorPelvicTilt(userPose, refPose);
    if (pelvicTilt) errors.push(pelvicTilt);
  }

  // Sequence-level detection (insufficient depth)
  for (const side of ['left', 'right'] as const) {
    const depthError = detectInsufficientDepth(userPoses, referencePoses, side);
    if (depthError) errors.push(depthError);
  }

  return errors;
}
