/**
 * MoveNet Clinical Adapter
 *
 * Maps MoveNet's 17-keypoint skeleton to clinical measurement points
 * required for exercise error detection. Provides compatibility layer
 * between pose detection output and clinical threshold validation.
 *
 * MoveNet keypoints (17 total):
 * 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear,
 * 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow,
 * 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip,
 * 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
 *
 * @module moveNetClinicalAdapter
 * @gate Gate 3 - Clinical Thresholds
 */

import { PoseLandmark } from '../types/pose';

export interface ClinicalMeasurements {
  /** Shoulder measurements */
  shoulder: {
    /** Left shoulder elevation (cm) */
    leftElevation: number;
    /** Right shoulder elevation (cm) */
    rightElevation: number;
    /** Shoulder width (cm, for normalization) */
    shoulderWidth: number;
    /** Acromion (shoulder point) height */
    acromionHeight: { left: number; right: number };
  };

  /** Trunk measurements */
  trunk: {
    /** Lateral trunk angle (degrees, 0 = vertical) */
    lateralAngle: number;
    /** Trunk tilt direction ('left' | 'right' | 'none') */
    tiltDirection: 'left' | 'right' | 'none';
  };

  /** Knee measurements */
  knee: {
    /** Knee valgus/varus angle (degrees, negative = valgus) */
    valgusAngle: { left: number; right: number };
    /** Knee flexion angle (degrees) */
    flexionAngle: { left: number; right: number };
    /** Stance width (cm) */
    stanceWidth: number;
  };

  /** Elbow measurements */
  elbow: {
    /** Elbow flexion angle (degrees) */
    flexionAngle: { left: number; right: number };
    /** Shoulder displacement during curl (cm) */
    shoulderDisplacement: { left: number; right: number };
  };

  /** Ankle measurements */
  ankle: {
    /** Heel elevation (cm) */
    heelElevation: { left: number; right: number };
  };

  /** Overall pose quality */
  quality: {
    /** Average confidence across all keypoints */
    averageConfidence: number;
    /** Number of visible keypoints */
    visibleKeypoints: number;
    /** Whether pose quality is sufficient for analysis */
    isSufficient: boolean;
  };
}

/**
 * Calculate distance between two 2D points
 */
const distance2D = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate angle between three points (in degrees)
 * Returns angle at point B
 */
const calculateAngle = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);

  if (angle > 180) {
    angle = 360 - angle;
  }

  return angle;
};

/**
 * Calculate vertical elevation of a point from baseline
 */
const calculateElevation = (
  point: { x: number; y: number },
  baseline: { x: number; y: number }
): number => {
  return Math.abs(point.y - baseline.y);
};

/**
 * Convert MoveNet landmarks to clinical measurements
 *
 * @param landmarks - Array of 17 MoveNet pose landmarks
 * @param frameHeight - Video frame height in pixels (for normalization)
 * @param frameWidth - Video frame width in pixels (for normalization)
 * @returns Clinical measurements object
 */
export const adaptMoveNetToClinical = (
  landmarks: PoseLandmark[],
  frameHeight: number = 1920,
  frameWidth: number = 1080
): ClinicalMeasurements => {
  // Landmark indices (MoveNet standard)
  const NOSE = 0;
  const LEFT_EYE = 1;
  const RIGHT_EYE = 2;
  const LEFT_SHOULDER = 5;
  const RIGHT_SHOULDER = 6;
  const LEFT_ELBOW = 7;
  const RIGHT_ELBOW = 8;
  const LEFT_WRIST = 9;
  const RIGHT_WRIST = 10;
  const LEFT_HIP = 11;
  const RIGHT_HIP = 12;
  const LEFT_KNEE = 13;
  const RIGHT_KNEE = 14;
  const LEFT_ANKLE = 15;
  const RIGHT_ANKLE = 16;

  // Extract keypoints
  const nose = landmarks[NOSE];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftElbow = landmarks[LEFT_ELBOW];
  const rightElbow = landmarks[RIGHT_ELBOW];
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  const leftKnee = landmarks[LEFT_KNEE];
  const rightKnee = landmarks[RIGHT_KNEE];
  const leftAnkle = landmarks[LEFT_ANKLE];
  const rightAnkle = landmarks[RIGHT_ANKLE];

  // === SHOULDER MEASUREMENTS ===
  const shoulderWidth = distance2D(leftShoulder, rightShoulder) * frameWidth;

  // Baseline: midpoint between hips (torso base)
  const hipMidpoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const leftShoulderElevation =
    calculateElevation(leftShoulder, hipMidpoint) * frameHeight;
  const rightShoulderElevation =
    calculateElevation(rightShoulder, hipMidpoint) * frameHeight;

  // === TRUNK MEASUREMENTS ===
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  // Trunk angle from vertical (using shoulder-to-hip line)
  const trunkAngleRad = Math.atan2(
    shoulderMidpoint.x - hipMidpoint.x,
    hipMidpoint.y - shoulderMidpoint.y
  );
  const lateralAngle = Math.abs((trunkAngleRad * 180) / Math.PI);
  const tiltDirection =
    Math.abs(trunkAngleRad) < 0.05 ? 'none' : trunkAngleRad > 0 ? 'right' : 'left';

  // === KNEE MEASUREMENTS ===
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

  // Knee valgus: Calculate angle between knee and ankle-hip line
  // Negative value = valgus (knee caves in), positive = varus (knee bows out)
  const leftValgusAngle = calculateKneeValgus(leftHip, leftKnee, leftAnkle);
  const rightValgusAngle = calculateKneeValgus(rightHip, rightKnee, rightAnkle);

  const stanceWidth = distance2D(leftAnkle, rightAnkle) * frameWidth;

  // === ELBOW MEASUREMENTS ===
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

  // Shoulder displacement: How much shoulder moves during elbow flexion
  // (Would need temporal tracking - simplified here)
  const leftShoulderDisplacement = 0; // TODO: Implement temporal tracking
  const rightShoulderDisplacement = 0;

  // === ANKLE MEASUREMENTS ===
  // Heel elevation: Compare ankle height to baseline (simplified)
  const ankleBaseline = Math.max(leftAnkle.y, rightAnkle.y);
  const leftHeelElevation = Math.abs(leftAnkle.y - ankleBaseline) * frameHeight;
  const rightHeelElevation = Math.abs(rightAnkle.y - ankleBaseline) * frameHeight;

  // === QUALITY MEASUREMENTS ===
  const avgConfidence =
    landmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / landmarks.length;
  const visibleKeypoints = landmarks.filter((lm) => (lm.visibility || 0) > 0.5).length;
  const isSufficient = avgConfidence > 0.5 && visibleKeypoints >= 10;

  return {
    shoulder: {
      leftElevation: leftShoulderElevation,
      rightElevation: rightShoulderElevation,
      shoulderWidth,
      acromionHeight: {
        left: leftShoulder.y * frameHeight,
        right: rightShoulder.y * frameHeight,
      },
    },
    trunk: {
      lateralAngle,
      tiltDirection,
    },
    knee: {
      valgusAngle: {
        left: leftValgusAngle,
        right: rightValgusAngle,
      },
      flexionAngle: {
        left: leftKneeAngle,
        right: rightKneeAngle,
      },
      stanceWidth,
    },
    elbow: {
      flexionAngle: {
        left: leftElbowAngle,
        right: rightElbowAngle,
      },
      shoulderDisplacement: {
        left: leftShoulderDisplacement,
        right: rightShoulderDisplacement,
      },
    },
    ankle: {
      heelElevation: {
        left: leftHeelElevation,
        right: rightHeelElevation,
      },
    },
    quality: {
      averageConfidence: avgConfidence,
      visibleKeypoints,
      isSufficient,
    },
  };
};

/**
 * Calculate knee valgus angle
 * Negative = valgus (knee caves inward) - ACL injury risk
 * Positive = varus (knee bows outward)
 */
const calculateKneeValgus = (
  hip: { x: number; y: number },
  knee: { x: number; y: number },
  ankle: { x: number; y: number }
): number => {
  // Calculate the angle deviation from straight vertical line
  const hipToAnkleX = ankle.x - hip.x;
  const kneeDeviation = knee.x - (hip.x + hipToAnkleX / 2);

  // Convert to angle (simplified)
  // Negative = valgus (medial knee displacement)
  const valgusAngle = Math.atan2(kneeDeviation, hip.y - knee.y) * (180 / Math.PI);

  return valgusAngle;
};

/**
 * Helper: Check if measurement exceeds threshold
 */
export const checkThreshold = (
  value: number,
  threshold: number,
  maxThreshold?: number
): 'normal' | 'warning' | 'critical' => {
  if (value < threshold) {
    return 'normal';
  }
  if (maxThreshold && value >= maxThreshold) {
    return 'critical';
  }
  return 'warning';
};

/**
 * Helper: Normalize percentage values
 */
export const normalizePercentage = (value: number, reference: number): number => {
  if (reference === 0) return 0;
  return (value / reference) * 100;
};

export default adaptMoveNetToClinical;
