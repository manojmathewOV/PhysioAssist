/**
 * PhysioAssist Live Exercise Simulation
 *
 * Simulates real-time pose detection, biomechanics analysis, and live feedback
 * for shoulder, knee, and elbow exercises.
 */

// ============================================================================
// POSE DATA STRUCTURES
// ============================================================================

/**
 * MoveNet 17-point skeleton landmark indices
 */
const LANDMARKS = {
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
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

// ============================================================================
// ANGLE CALCULATION
// ============================================================================

/**
 * Calculate angle between three points
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Vertex point {x, y}
 * @param {Object} p3 - Third point {x, y}
 * @returns {number} Angle in degrees
 */
function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = dot / (mag1 * mag2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  return (angleRad * 180) / Math.PI;
}

// ============================================================================
// EXERCISE POSE GENERATORS
// ============================================================================

/**
 * Generate realistic pose data for shoulder flexion exercise
 * @param {number} progress - 0 to 1 (represents exercise completion)
 * @param {string} side - 'left' or 'right'
 * @returns {Array} Array of pose landmarks
 */
function generateShoulderFlexionPose(progress, side = 'left') {
  // Base standing pose
  const basePose = [
    { x: 0.5, y: 0.15, visibility: 0.95, name: 'nose' }, // 0: nose
    { x: 0.48, y: 0.13, visibility: 0.95, name: 'left_eye' }, // 1
    { x: 0.52, y: 0.13, visibility: 0.95, name: 'right_eye' }, // 2
    { x: 0.46, y: 0.15, visibility: 0.9, name: 'left_ear' }, // 3
    { x: 0.54, y: 0.15, visibility: 0.9, name: 'right_ear' }, // 4
    { x: 0.42, y: 0.28, visibility: 0.98, name: 'left_shoulder' }, // 5
    { x: 0.58, y: 0.28, visibility: 0.98, name: 'right_shoulder' }, // 6
  ];

  // Calculate arm movement based on progress (0-180 degrees)
  const maxAngle = 160; // Target shoulder flexion
  const currentAngle = progress * maxAngle;
  const armLength = 0.25;

  if (side === 'left') {
    // Left arm moves forward and up
    const radians = (currentAngle * Math.PI) / 180;
    const elbowX = basePose[5].x + Math.sin(radians) * armLength * 0.6;
    const elbowY = basePose[5].y - Math.cos(radians) * armLength * 0.6;
    const wristX = elbowX + Math.sin(radians) * armLength * 0.4;
    const wristY = elbowY - Math.cos(radians) * armLength * 0.4;

    basePose.push(
      { x: elbowX, y: elbowY, visibility: 0.95, name: 'left_elbow' }, // 7
      { x: 0.65, y: 0.45, visibility: 0.9, name: 'right_elbow' }, // 8
      { x: wristX, y: wristY, visibility: 0.92, name: 'left_wrist' }, // 9
      { x: 0.62, y: 0.55, visibility: 0.88, name: 'right_wrist' } // 10
    );
  } else {
    // Right arm moves
    const radians = (currentAngle * Math.PI) / 180;
    const elbowX = basePose[6].x - Math.sin(radians) * armLength * 0.6;
    const elbowY = basePose[6].y - Math.cos(radians) * armLength * 0.6;
    const wristX = elbowX - Math.sin(radians) * armLength * 0.4;
    const wristY = elbowY - Math.cos(radians) * armLength * 0.4;

    basePose.push(
      { x: 0.35, y: 0.45, visibility: 0.9, name: 'left_elbow' }, // 7
      { x: elbowX, y: elbowY, visibility: 0.95, name: 'right_elbow' }, // 8
      { x: 0.38, y: 0.55, visibility: 0.88, name: 'left_wrist' }, // 9
      { x: wristX, y: wristY, visibility: 0.92, name: 'right_wrist' } // 10
    );
  }

  // Add lower body (stationary)
  basePose.push(
    { x: 0.45, y: 0.55, visibility: 0.95, name: 'left_hip' }, // 11
    { x: 0.55, y: 0.55, visibility: 0.95, name: 'right_hip' }, // 12
    { x: 0.44, y: 0.75, visibility: 0.93, name: 'left_knee' }, // 13
    { x: 0.56, y: 0.75, visibility: 0.93, name: 'right_knee' }, // 14
    { x: 0.43, y: 0.95, visibility: 0.9, name: 'left_ankle' }, // 15
    { x: 0.57, y: 0.95, visibility: 0.9, name: 'right_ankle' } // 16
  );

  return basePose;
}

/**
 * Generate realistic pose data for knee flexion exercise
 * @param {number} progress - 0 to 1
 * @param {string} side - 'left' or 'right'
 * @returns {Array} Array of pose landmarks
 */
function generateKneeFlexionPose(progress, side = 'left') {
  // Lying down position
  const basePose = [
    { x: 0.5, y: 0.25, visibility: 0.95, name: 'nose' },
    { x: 0.48, y: 0.23, visibility: 0.95, name: 'left_eye' },
    { x: 0.52, y: 0.23, visibility: 0.95, name: 'right_eye' },
    { x: 0.46, y: 0.25, visibility: 0.9, name: 'left_ear' },
    { x: 0.54, y: 0.25, visibility: 0.9, name: 'right_ear' },
    { x: 0.42, y: 0.35, visibility: 0.98, name: 'left_shoulder' },
    { x: 0.58, y: 0.35, visibility: 0.98, name: 'right_shoulder' },
    { x: 0.38, y: 0.45, visibility: 0.95, name: 'left_elbow' },
    { x: 0.62, y: 0.45, visibility: 0.95, name: 'right_elbow' },
    { x: 0.35, y: 0.52, visibility: 0.92, name: 'left_wrist' },
    { x: 0.65, y: 0.52, visibility: 0.92, name: 'right_wrist' },
  ];

  // Hips
  basePose.push(
    { x: 0.45, y: 0.55, visibility: 0.95, name: 'left_hip' },
    { x: 0.55, y: 0.55, visibility: 0.95, name: 'right_hip' }
  );

  // Calculate knee flexion (0-135 degrees)
  const maxAngle = 135;
  const currentAngle = progress * maxAngle;
  const thighLength = 0.2;
  const shinLength = 0.2;

  if (side === 'left') {
    // Left knee bends
    const kneeRadians = ((90 - currentAngle) * Math.PI) / 180;
    const kneeX = basePose[11].x;
    const kneeY = basePose[11].y + Math.sin(kneeRadians) * thighLength;

    const ankleRadians = kneeRadians + (currentAngle * Math.PI) / 180;
    const ankleX = kneeX + Math.cos(ankleRadians) * shinLength;
    const ankleY = kneeY + Math.sin(ankleRadians) * shinLength;

    basePose.push(
      { x: kneeX, y: kneeY, visibility: 0.93, name: 'left_knee' },
      { x: 0.56, y: 0.85, visibility: 0.93, name: 'right_knee' }, // Right leg straight
      { x: ankleX, y: ankleY, visibility: 0.9, name: 'left_ankle' },
      { x: 0.57, y: 0.95, visibility: 0.9, name: 'right_ankle' }
    );
  } else {
    // Right knee bends
    const kneeRadians = ((90 - currentAngle) * Math.PI) / 180;
    const kneeX = basePose[12].x;
    const kneeY = basePose[12].y + Math.sin(kneeRadians) * thighLength;

    const ankleRadians = kneeRadians - (currentAngle * Math.PI) / 180;
    const ankleX = kneeX - Math.cos(ankleRadians) * shinLength;
    const ankleY = kneeY + Math.sin(ankleRadians) * shinLength;

    basePose.push(
      { x: 0.44, y: 0.85, visibility: 0.93, name: 'left_knee' }, // Left leg straight
      { x: kneeX, y: kneeY, visibility: 0.93, name: 'right_knee' },
      { x: 0.43, y: 0.95, visibility: 0.9, name: 'left_ankle' },
      { x: ankleX, y: ankleY, visibility: 0.9, name: 'right_ankle' }
    );
  }

  return basePose;
}

/**
 * Generate realistic pose data for elbow flexion exercise
 * @param {number} progress - 0 to 1
 * @param {string} side - 'left' or 'right'
 * @returns {Array} Array of pose landmarks
 */
function generateElbowFlexionPose(progress, side = 'left') {
  const basePose = [
    { x: 0.5, y: 0.15, visibility: 0.95, name: 'nose' },
    { x: 0.48, y: 0.13, visibility: 0.95, name: 'left_eye' },
    { x: 0.52, y: 0.13, visibility: 0.95, name: 'right_eye' },
    { x: 0.46, y: 0.15, visibility: 0.9, name: 'left_ear' },
    { x: 0.54, y: 0.15, visibility: 0.9, name: 'right_ear' },
    { x: 0.42, y: 0.28, visibility: 0.98, name: 'left_shoulder' },
    { x: 0.58, y: 0.28, visibility: 0.98, name: 'right_shoulder' },
  ];

  // Elbow flexion (0-145 degrees)
  const maxAngle = 145;
  const currentAngle = progress * maxAngle;
  const upperArmLength = 0.15;
  const forearmLength = 0.15;

  if (side === 'left') {
    // Left arm at side, elbow bends bringing hand toward shoulder
    const elbowX = basePose[5].x;
    const elbowY = basePose[5].y + upperArmLength;

    // Calculate wrist position based on elbow flexion
    const wristAngleFromVertical = 180 - currentAngle;
    const radians = (wristAngleFromVertical * Math.PI) / 180;
    const wristX = elbowX + Math.sin(radians) * forearmLength;
    const wristY = elbowY - Math.cos(radians) * forearmLength;

    basePose.push(
      { x: elbowX, y: elbowY, visibility: 0.95, name: 'left_elbow' },
      { x: 0.65, y: 0.45, visibility: 0.9, name: 'right_elbow' },
      { x: wristX, y: wristY, visibility: 0.92, name: 'left_wrist' },
      { x: 0.62, y: 0.55, visibility: 0.88, name: 'right_wrist' }
    );
  } else {
    // Right arm bends
    const elbowX = basePose[6].x;
    const elbowY = basePose[6].y + upperArmLength;

    const wristAngleFromVertical = 180 - currentAngle;
    const radians = (wristAngleFromVertical * Math.PI) / 180;
    const wristX = elbowX - Math.sin(radians) * forearmLength;
    const wristY = elbowY - Math.cos(radians) * forearmLength;

    basePose.push(
      { x: 0.35, y: 0.45, visibility: 0.9, name: 'left_elbow' },
      { x: elbowX, y: elbowY, visibility: 0.95, name: 'right_elbow' },
      { x: 0.38, y: 0.55, visibility: 0.88, name: 'left_wrist' },
      { x: wristX, y: wristY, visibility: 0.92, name: 'right_wrist' }
    );
  }

  // Add lower body
  basePose.push(
    { x: 0.45, y: 0.55, visibility: 0.95, name: 'left_hip' },
    { x: 0.55, y: 0.55, visibility: 0.95, name: 'right_hip' },
    { x: 0.44, y: 0.75, visibility: 0.93, name: 'left_knee' },
    { x: 0.56, y: 0.75, visibility: 0.93, name: 'right_knee' },
    { x: 0.43, y: 0.95, visibility: 0.9, name: 'left_ankle' },
    { x: 0.57, y: 0.95, visibility: 0.9, name: 'right_ankle' }
  );

  return basePose;
}

// ============================================================================
// BIOMECHANICS ANALYSIS
// ============================================================================

/**
 * Analyze shoulder flexion from pose data
 */
function analyzeShoulderFlexion(pose, side = 'left') {
  const shoulderIdx =
    side === 'left' ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW;
  const hipIdx = side === 'left' ? LANDMARKS.LEFT_HIP : LANDMARKS.RIGHT_HIP;

  const shoulder = pose[shoulderIdx];
  const elbow = pose[elbowIdx];
  const hip = pose[hipIdx];

  // Calculate shoulder flexion angle
  const angle = calculateAngle(hip, shoulder, elbow);

  return {
    angle: Math.round(angle),
    joint: 'shoulder',
    movement: 'flexion',
    side: side,
    quality: assessPoseQuality(pose, shoulderIdx, elbowIdx),
  };
}

/**
 * Analyze knee flexion from pose data
 */
function analyzeKneeFlexion(pose, side = 'left') {
  const hipIdx = side === 'left' ? LANDMARKS.LEFT_HIP : LANDMARKS.RIGHT_HIP;
  const kneeIdx = side === 'left' ? LANDMARKS.LEFT_KNEE : LANDMARKS.RIGHT_KNEE;
  const ankleIdx = side === 'left' ? LANDMARKS.LEFT_ANKLE : LANDMARKS.RIGHT_ANKLE;

  const hip = pose[hipIdx];
  const knee = pose[kneeIdx];
  const ankle = pose[ankleIdx];

  const angle = calculateAngle(hip, knee, ankle);

  return {
    angle: Math.round(angle),
    joint: 'knee',
    movement: 'flexion',
    side: side,
    quality: assessPoseQuality(pose, hipIdx, kneeIdx, ankleIdx),
  };
}

/**
 * Analyze elbow flexion from pose data
 */
function analyzeElbowFlexion(pose, side = 'left') {
  const shoulderIdx =
    side === 'left' ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW;
  const wristIdx = side === 'left' ? LANDMARKS.LEFT_WRIST : LANDMARKS.RIGHT_WRIST;

  const shoulder = pose[shoulderIdx];
  const elbow = pose[elbowIdx];
  const wrist = pose[wristIdx];

  const angle = calculateAngle(shoulder, elbow, wrist);

  return {
    angle: Math.round(angle),
    joint: 'elbow',
    movement: 'flexion',
    side: side,
    quality: assessPoseQuality(pose, shoulderIdx, elbowIdx, wristIdx),
  };
}

/**
 * Assess pose quality based on landmark visibility
 */
function assessPoseQuality(pose, ...landmarkIndices) {
  const avgVisibility =
    landmarkIndices.reduce((sum, idx) => sum + pose[idx].visibility, 0) /
    landmarkIndices.length;

  if (avgVisibility > 0.9) return 'excellent';
  if (avgVisibility > 0.75) return 'good';
  if (avgVisibility > 0.6) return 'fair';
  return 'poor';
}

// ============================================================================
// FEEDBACK SYSTEM
// ============================================================================

/**
 * Generate real-time feedback based on angle and progress
 */
function generateFeedback(analysis, target, previousAngle = 0) {
  const { angle, joint, movement } = analysis;
  const progress = Math.min(100, (angle / target) * 100);

  // Determine feedback category
  let feedback = {
    angle: angle,
    progress: Math.round(progress),
    target: target,
    color: getFeedbackColor(progress),
    message: '',
    instruction: '',
    compensation: null,
  };

  // Progress-based messages
  if (progress < 25) {
    feedback.message = 'Starting movement...';
    feedback.instruction = 'Move slowly and steadily';
  } else if (progress < 50) {
    feedback.message = 'Keep going!';
    feedback.instruction = "You're doing great";
  } else if (progress < 75) {
    feedback.message = 'Halfway there!';
    feedback.instruction = 'Maintain smooth motion';
  } else if (progress < 95) {
    feedback.message = 'Almost at target!';
    feedback.instruction = 'Just a bit more';
  } else if (progress >= 100) {
    feedback.message = '🎯 TARGET ACHIEVED!';
    feedback.instruction = 'Excellent! Hold for 2 seconds';
  } else {
    feedback.message = 'Great progress!';
    feedback.instruction = 'Keep moving smoothly';
  }

  // Movement direction feedback
  const angleChange = angle - previousAngle;
  if (Math.abs(angleChange) < 1 && progress < 95) {
    feedback.instruction = 'Continue lifting';
  } else if (angleChange < -5) {
    feedback.instruction = "Keep arm up - don't drop yet";
  }

  // Compensation detection (simplified)
  feedback.compensation = detectCompensation(analysis);

  return feedback;
}

/**
 * Get color code based on progress
 */
function getFeedbackColor(progress) {
  if (progress < 50) return '#4A90E2'; // Blue - beginning
  if (progress < 75) return '#7ED321'; // Green - mid-range
  if (progress < 100) return '#F5A623'; // Orange - near target
  return '#FFD700'; // Gold - achieved
}

/**
 * Detect movement compensations
 */
function detectCompensation(analysis) {
  // Simplified compensation detection
  if (analysis.quality === 'poor') {
    return {
      detected: true,
      type: 'visibility',
      message: 'Move into camera view',
      severity: 'moderate',
    };
  }

  return {
    detected: false,
    type: null,
    message: null,
    severity: null,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateShoulderFlexionPose,
    generateKneeFlexionPose,
    generateElbowFlexionPose,
    analyzeShoulderFlexion,
    analyzeKneeFlexion,
    analyzeElbowFlexion,
    generateFeedback,
    calculateAngle,
    LANDMARKS,
  };
}
