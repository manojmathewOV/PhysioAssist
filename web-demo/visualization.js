/**
 * PhysioAssist - Visualization and Animation Controller
 *
 * Handles canvas rendering, skeleton overlay, and real-time animation
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let animationId = null;
let isRunning = false;
let currentProgress = 0;
let exerciseConfig = {
  type: 'shoulder_flexion',
  side: 'left',
  speed: 1.0,
  target: 160,
};

let previousAngle = 0;
let frameCount = 0;
let lastTime = Date.now();

// ============================================================================
// CANVAS SETUP
// ============================================================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 640;
canvas.height = 480;

// ============================================================================
// EXERCISE CONFIGURATION
// ============================================================================

const EXERCISE_TARGETS = {
  shoulder_flexion: 160,
  knee_flexion: 135,
  elbow_flexion: 145,
};

const EXERCISE_NAMES = {
  shoulder_flexion: 'Shoulder Flexion',
  knee_flexion: 'Knee Flexion',
  elbow_flexion: 'Elbow Flexion',
};

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

/**
 * Draw skeleton on canvas
 */
function drawSkeleton(pose) {
  // Clear canvas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Scale landmarks to canvas size
  const scaledPose = pose.map(landmark => ({
    x: landmark.x * canvas.width,
    y: landmark.y * canvas.height,
    visibility: landmark.visibility,
    name: landmark.name,
  }));

  // Draw connections
  const connections = getSkeletonConnections(exerciseConfig.type);
  ctx.strokeStyle = '#4A90E2';
  ctx.lineWidth = 4;

  connections.forEach(([idx1, idx2]) => {
    const p1 = scaledPose[idx1];
    const p2 = scaledPose[idx2];

    if (p1.visibility > 0.5 && p2.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });

  // Draw joints
  scaledPose.forEach((landmark, idx) => {
    if (landmark.visibility > 0.5) {
      // Highlight active joints
      const isActiveJoint = isActiveJointIndex(idx, exerciseConfig.type, exerciseConfig.side);

      ctx.beginPath();
      ctx.arc(landmark.x, landmark.y, isActiveJoint ? 8 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = isActiveJoint ? '#FFD700' : '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Draw angle arc for active joint
  drawAngleArc(scaledPose, exerciseConfig);
}

/**
 * Get skeleton connections based on exercise type
 */
function getSkeletonConnections(exerciseType) {
  // Common connections (MoveNet 17 points)
  const baseConnections = [
    [0, 1], [0, 2], [1, 3], [2, 4], // Head
    [5, 6], // Shoulders
    [5, 7], [7, 9], // Left arm
    [6, 8], [8, 10], // Right arm
    [5, 11], [6, 12], // Torso
    [11, 12], // Hips
    [11, 13], [13, 15], // Left leg
    [12, 14], [14, 16], // Right leg
  ];

  return baseConnections;
}

/**
 * Check if joint index is active for current exercise
 */
function isActiveJointIndex(idx, exerciseType, side) {
  const LANDMARKS = {
    NOSE: 0, LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
    LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
    LEFT_WRIST: 9, RIGHT_WRIST: 10,
    LEFT_HIP: 11, RIGHT_HIP: 12,
    LEFT_KNEE: 13, RIGHT_KNEE: 14,
    LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
  };

  if (exerciseType === 'shoulder_flexion') {
    return idx === (side === 'left' ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER) ||
           idx === (side === 'left' ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW) ||
           idx === (side === 'left' ? LANDMARKS.LEFT_HIP : LANDMARKS.RIGHT_HIP);
  } else if (exerciseType === 'knee_flexion') {
    return idx === (side === 'left' ? LANDMARKS.LEFT_HIP : LANDMARKS.RIGHT_HIP) ||
           idx === (side === 'left' ? LANDMARKS.LEFT_KNEE : LANDMARKS.RIGHT_KNEE) ||
           idx === (side === 'left' ? LANDMARKS.LEFT_ANKLE : LANDMARKS.RIGHT_ANKLE);
  } else if (exerciseType === 'elbow_flexion') {
    return idx === (side === 'left' ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER) ||
           idx === (side === 'left' ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW) ||
           idx === (side === 'left' ? LANDMARKS.LEFT_WRIST : LANDMARKS.RIGHT_WRIST);
  }

  return false;
}

/**
 * Draw angle measurement arc
 */
function drawAngleArc(scaledPose, config) {
  const LANDMARKS = {
    LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
    LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
    LEFT_WRIST: 9, RIGHT_WRIST: 10,
    LEFT_HIP: 11, RIGHT_HIP: 12,
    LEFT_KNEE: 13, RIGHT_KNEE: 14,
    LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
  };

  let centerIdx, p1Idx, p2Idx;

  if (config.type === 'shoulder_flexion') {
    centerIdx = config.side === 'left' ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER;
    p1Idx = config.side === 'left' ? LANDMARKS.LEFT_HIP : LANDMARKS.RIGHT_HIP;
    p2Idx = config.side === 'left' ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW;
  } else if (config.type === 'knee_flexion') {
    centerIdx = config.side === 'left' ? LANDMARKS.LEFT_KNEE : LANDMARKS.RIGHT_KNEE;
    p1Idx = config.side === 'left' ? LANDMARKS.LEFT_HIP : LANDMARKS.RIGHT_HIP;
    p2Idx = config.side === 'left' ? LANDMARKS.LEFT_ANKLE : LANDMARKS.RIGHT_ANKLE;
  } else if (config.type === 'elbow_flexion') {
    centerIdx = config.side === 'left' ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW;
    p1Idx = config.side === 'left' ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER;
    p2Idx = config.side === 'left' ? LANDMARKS.LEFT_WRIST : LANDMARKS.RIGHT_WRIST;
  }

  const center = scaledPose[centerIdx];
  const p1 = scaledPose[p1Idx];
  const p2 = scaledPose[p2Idx];

  if (center.visibility > 0.5 && p1.visibility > 0.5 && p2.visibility > 0.5) {
    // Calculate angles
    const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);

    // Draw arc
    ctx.beginPath();
    ctx.arc(center.x, center.y, 40, angle1, angle2, false);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

/**
 * Main animation loop
 */
function animate() {
  if (!isRunning) return;

  // Update progress based on speed
  const speedMultiplier = exerciseConfig.speed;
  currentProgress += 0.005 * speedMultiplier;

  // Create smooth looping animation
  let smoothProgress = currentProgress % 2;
  if (smoothProgress > 1) {
    smoothProgress = 2 - smoothProgress; // Reverse for smooth loop
  }

  // Generate pose based on exercise type
  let pose;
  if (exerciseConfig.type === 'shoulder_flexion') {
    pose = generateShoulderFlexionPose(smoothProgress, exerciseConfig.side);
  } else if (exerciseConfig.type === 'knee_flexion') {
    pose = generateKneeFlexionPose(smoothProgress, exerciseConfig.side);
  } else if (exerciseConfig.type === 'elbow_flexion') {
    pose = generateElbowFlexionPose(smoothProgress, exerciseConfig.side);
  }

  // Analyze biomechanics
  let analysis;
  if (exerciseConfig.type === 'shoulder_flexion') {
    analysis = analyzeShoulderFlexion(pose, exerciseConfig.side);
  } else if (exerciseConfig.type === 'knee_flexion') {
    analysis = analyzeKneeFlexion(pose, exerciseConfig.side);
  } else if (exerciseConfig.type === 'elbow_flexion') {
    analysis = analyzeElbowFlexion(pose, exerciseConfig.side);
  }

  // Generate feedback
  const feedback = generateFeedback(analysis, exerciseConfig.target, previousAngle);
  previousAngle = analysis.angle;

  // Render
  drawSkeleton(pose);
  updateUI(feedback, analysis);

  // Calculate FPS
  frameCount++;
  const currentTime = Date.now();
  if (currentTime - lastTime >= 1000) {
    const fps = Math.round(frameCount / ((currentTime - lastTime) / 1000));
    document.getElementById('fps').textContent = `${fps} fps`;
    frameCount = 0;
    lastTime = currentTime;
  }

  // Continue animation
  animationId = requestAnimationFrame(animate);
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Update all UI elements with current feedback
 */
function updateUI(feedback, analysis) {
  // Update angle display
  const angleDisplay = document.getElementById('angleDisplay');
  angleDisplay.textContent = `${feedback.angle}°`;
  angleDisplay.style.color = feedback.color;

  // Update progress bar
  const progressBar = document.getElementById('progressBar');
  progressBar.style.width = `${feedback.progress}%`;
  progressBar.textContent = `${feedback.progress}%`;
  progressBar.style.background = `linear-gradient(90deg, ${feedback.color}, ${adjustBrightness(feedback.color, 20)})`;

  // Update feedback message
  const feedbackMessage = document.getElementById('feedbackMessage');
  feedbackMessage.textContent = feedback.message;

  // Update instruction
  const instructionText = document.getElementById('instructionText');
  instructionText.textContent = feedback.instruction;

  // Update stats
  document.getElementById('currentAngle').textContent = `${feedback.angle}°`;
  document.getElementById('progressPercent').textContent = `${feedback.progress}%`;

  // Update compensation alert
  const compensationAlert = document.getElementById('compensationAlert');
  const compensationText = document.getElementById('compensationText');
  if (feedback.compensation.detected) {
    compensationAlert.classList.add('show');
    compensationText.textContent = feedback.compensation.message;
  } else {
    compensationAlert.classList.remove('show');
  }

  // Update quality indicator
  updateQualityIndicator(analysis.quality);
}

/**
 * Update pose quality indicator
 */
function updateQualityIndicator(quality) {
  const indicator = document.getElementById('qualityIndicator');
  indicator.className = 'quality-indicator';

  switch (quality) {
    case 'excellent':
      indicator.classList.add('quality-excellent');
      indicator.innerHTML = '<span class="status-indicator active"></span>Pose Quality: Excellent';
      break;
    case 'good':
      indicator.classList.add('quality-good');
      indicator.innerHTML = '<span class="status-indicator active"></span>Pose Quality: Good';
      break;
    case 'fair':
      indicator.classList.add('quality-fair');
      indicator.innerHTML = '<span class="status-indicator active"></span>Pose Quality: Fair';
      break;
    case 'poor':
      indicator.classList.add('quality-poor');
      indicator.innerHTML = '<span class="status-indicator active"></span>Pose Quality: Poor';
      break;
  }
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

// ============================================================================
// CONTROL FUNCTIONS
// ============================================================================

/**
 * Start exercise simulation
 */
function startExercise() {
  if (isRunning) return;

  // Get configuration from UI
  exerciseConfig.type = document.getElementById('exerciseSelect').value;
  exerciseConfig.side = document.getElementById('sideSelect').value;
  exerciseConfig.target = EXERCISE_TARGETS[exerciseConfig.type];

  const speedValue = document.getElementById('speedSelect').value;
  exerciseConfig.speed = speedValue === 'slow' ? 0.5 : speedValue === 'fast' ? 2.0 : 1.0;

  // Update target display
  document.getElementById('targetAngle').textContent = `${exerciseConfig.target}°`;

  // Start animation
  isRunning = true;
  lastTime = Date.now();
  frameCount = 0;
  animate();

  // Update button states
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
}

/**
 * Stop exercise simulation
 */
function stopExercise() {
  isRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Update button states
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

/**
 * Reset exercise
 */
function resetExercise() {
  stopExercise();
  currentProgress = 0;
  previousAngle = 0;

  // Clear canvas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Reset UI
  document.getElementById('angleDisplay').textContent = '0°';
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressBar').textContent = '0%';
  document.getElementById('feedbackMessage').textContent = 'Select exercise and press Start';
  document.getElementById('instructionText').textContent = 'Choose an exercise below to begin';
  document.getElementById('currentAngle').textContent = '0°';
  document.getElementById('progressPercent').textContent = '0%';
  document.getElementById('fps').textContent = '0 fps';
  document.getElementById('compensationAlert').classList.remove('show');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Set initial state
document.getElementById('stopBtn').disabled = true;

// Draw initial empty canvas
ctx.fillStyle = '#1a1a1a';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Add text prompt
ctx.fillStyle = '#666';
ctx.font = '24px Arial';
ctx.textAlign = 'center';
ctx.fillText('Select exercise and press Start', canvas.width / 2, canvas.height / 2);

console.log('✅ PhysioAssist Exercise Simulator loaded successfully!');
console.log('🎮 Use the controls below to start an exercise simulation');
