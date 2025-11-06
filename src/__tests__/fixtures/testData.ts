/**
 * Test Data Fixtures for PhysioAssist
 * Comprehensive test data for all testing scenarios
 */

import { PoseLandmark, Keypoint } from '../../types/pose';
import { ExerciseType, ExercisePhase, ValidationResult } from '../../types/exercise';
import { User, UserProfile } from '../../types/user';

// ===== User Test Data =====

export const testUsers = {
  newUser: {
    id: 'test-new-user',
    email: 'newuser@test.com',
    name: 'New Test User',
    profile: {
      age: 25,
      fitnessLevel: 'beginner',
      injuries: [],
      goals: ['flexibility', 'strength'],
      height: 170,
      weight: 70,
    },
  },

  existingUser: {
    id: 'test-existing-user',
    email: 'test@physioassist.com',
    name: 'Test User',
    profile: {
      age: 30,
      fitnessLevel: 'intermediate',
      injuries: ['lower_back'],
      goals: ['rehabilitation', 'flexibility'],
      height: 175,
      weight: 75,
    },
  },

  advancedUser: {
    id: 'test-advanced-user',
    email: 'advanced@test.com',
    name: 'Advanced User',
    profile: {
      age: 35,
      fitnessLevel: 'advanced',
      injuries: [],
      goals: ['strength', 'performance'],
      height: 180,
      weight: 80,
    },
  },

  elderlyUser: {
    id: 'test-elderly-user',
    email: 'elderly@test.com',
    name: 'Elderly User',
    profile: {
      age: 70,
      fitnessLevel: 'beginner',
      injuries: ['knee', 'shoulder'],
      goals: ['mobility', 'balance'],
      height: 165,
      weight: 65,
    },
  },
};

// ===== Pose Landmark Test Data =====

export const generateMockLandmarks = (options: {
  visibility?: number;
  exerciseType?: ExerciseType;
  formQuality?: 'perfect' | 'good' | 'poor';
}): PoseLandmark[] => {
  const { visibility = 0.9, exerciseType = 'bicep_curl', formQuality = 'good' } = options;

  const baseLandmarks: PoseLandmark[] = Array(33)
    .fill(null)
    .map((_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility,
      name: getLandmarkName(i),
    }));

  // Adjust landmarks based on exercise type and form quality
  switch (exerciseType) {
    case 'bicep_curl':
      return generateBicepCurlPose(baseLandmarks, formQuality);
    case 'squat':
      return generateSquatPose(baseLandmarks, formQuality);
    case 'shoulder_press':
      return generateShoulderPressPose(baseLandmarks, formQuality);
    case 'hamstring_stretch':
      return generateHamstringStretchPose(baseLandmarks, formQuality);
    default:
      return baseLandmarks;
  }
};

function generateBicepCurlPose(base: PoseLandmark[], quality: string): PoseLandmark[] {
  const landmarks = [...base];

  // Set body position
  landmarks[11] = { ...landmarks[11], x: 0.45, y: 0.3 }; // left shoulder
  landmarks[12] = { ...landmarks[12], x: 0.55, y: 0.3 }; // right shoulder
  landmarks[23] = { ...landmarks[23], x: 0.45, y: 0.5 }; // left hip
  landmarks[24] = { ...landmarks[24], x: 0.55, y: 0.5 }; // right hip

  switch (quality) {
    case 'perfect':
      // Perfect form - elbow close to body
      landmarks[13] = { ...landmarks[13], x: 0.43, y: 0.4 }; // left elbow
      landmarks[14] = { ...landmarks[14], x: 0.57, y: 0.4 }; // right elbow
      landmarks[15] = { ...landmarks[15], x: 0.42, y: 0.25 }; // left wrist (flexed)
      landmarks[16] = { ...landmarks[16], x: 0.58, y: 0.25 }; // right wrist (flexed)
      break;

    case 'poor':
      // Poor form - elbow flared out
      landmarks[13] = { ...landmarks[13], x: 0.35, y: 0.4 }; // left elbow (flared)
      landmarks[14] = { ...landmarks[14], x: 0.65, y: 0.4 }; // right elbow (flared)
      landmarks[15] = { ...landmarks[15], x: 0.3, y: 0.3 }; // left wrist
      landmarks[16] = { ...landmarks[16], x: 0.7, y: 0.3 }; // right wrist
      break;

    default: // good
      landmarks[13] = { ...landmarks[13], x: 0.42, y: 0.4 }; // left elbow
      landmarks[14] = { ...landmarks[14], x: 0.58, y: 0.4 }; // right elbow
      landmarks[15] = { ...landmarks[15], x: 0.41, y: 0.28 }; // left wrist
      landmarks[16] = { ...landmarks[16], x: 0.59, y: 0.28 }; // right wrist
  }

  return landmarks;
}

function generateSquatPose(base: PoseLandmark[], quality: string): PoseLandmark[] {
  const landmarks = [...base];

  // Set upper body
  landmarks[11] = { ...landmarks[11], x: 0.45, y: 0.3 }; // left shoulder
  landmarks[12] = { ...landmarks[12], x: 0.55, y: 0.3 }; // right shoulder

  switch (quality) {
    case 'perfect':
      // Perfect squat - knees behind toes, hips back
      landmarks[23] = { ...landmarks[23], x: 0.45, y: 0.55 }; // left hip
      landmarks[24] = { ...landmarks[24], x: 0.55, y: 0.55 }; // right hip
      landmarks[25] = { ...landmarks[25], x: 0.44, y: 0.65 }; // left knee
      landmarks[26] = { ...landmarks[26], x: 0.56, y: 0.65 }; // right knee
      landmarks[27] = { ...landmarks[27], x: 0.43, y: 0.85 }; // left ankle
      landmarks[28] = { ...landmarks[28], x: 0.57, y: 0.85 }; // right ankle
      break;

    case 'poor':
      // Poor form - knees past toes, back rounded
      landmarks[23] = { ...landmarks[23], x: 0.48, y: 0.5 }; // left hip (forward)
      landmarks[24] = { ...landmarks[24], x: 0.52, y: 0.5 }; // right hip (forward)
      landmarks[25] = { ...landmarks[25], x: 0.4, y: 0.65 }; // left knee (too forward)
      landmarks[26] = { ...landmarks[26], x: 0.6, y: 0.65 }; // right knee (too forward)
      landmarks[27] = { ...landmarks[27], x: 0.45, y: 0.85 }; // left ankle
      landmarks[28] = { ...landmarks[28], x: 0.55, y: 0.85 }; // right ankle
      break;

    default: // good
      landmarks[23] = { ...landmarks[23], x: 0.46, y: 0.53 }; // left hip
      landmarks[24] = { ...landmarks[24], x: 0.54, y: 0.53 }; // right hip
      landmarks[25] = { ...landmarks[25], x: 0.45, y: 0.65 }; // left knee
      landmarks[26] = { ...landmarks[26], x: 0.55, y: 0.65 }; // right knee
      landmarks[27] = { ...landmarks[27], x: 0.44, y: 0.85 }; // left ankle
      landmarks[28] = { ...landmarks[28], x: 0.56, y: 0.85 }; // right ankle
  }

  return landmarks;
}

function generateShoulderPressPose(
  base: PoseLandmark[],
  quality: string
): PoseLandmark[] {
  const landmarks = [...base];

  // Set core position
  landmarks[23] = { ...landmarks[23], x: 0.45, y: 0.5 }; // left hip
  landmarks[24] = { ...landmarks[24], x: 0.55, y: 0.5 }; // right hip

  switch (quality) {
    case 'perfect':
      // Perfect form - arms straight up, core engaged
      landmarks[11] = { ...landmarks[11], x: 0.45, y: 0.35 }; // left shoulder
      landmarks[12] = { ...landmarks[12], x: 0.55, y: 0.35 }; // right shoulder
      landmarks[13] = { ...landmarks[13], x: 0.44, y: 0.2 }; // left elbow (overhead)
      landmarks[14] = { ...landmarks[14], x: 0.56, y: 0.2 }; // right elbow (overhead)
      landmarks[15] = { ...landmarks[15], x: 0.43, y: 0.1 }; // left wrist (overhead)
      landmarks[16] = { ...landmarks[16], x: 0.57, y: 0.1 }; // right wrist (overhead)
      break;

    case 'poor':
      // Poor form - arched back, uneven press
      landmarks[11] = { ...landmarks[11], x: 0.43, y: 0.38 }; // left shoulder (dropped)
      landmarks[12] = { ...landmarks[12], x: 0.57, y: 0.35 }; // right shoulder
      landmarks[13] = { ...landmarks[13], x: 0.4, y: 0.25 }; // left elbow (lower)
      landmarks[14] = { ...landmarks[14], x: 0.6, y: 0.2 }; // right elbow
      landmarks[15] = { ...landmarks[15], x: 0.38, y: 0.15 }; // left wrist (uneven)
      landmarks[16] = { ...landmarks[16], x: 0.62, y: 0.1 }; // right wrist
      break;

    default: // good
      landmarks[11] = { ...landmarks[11], x: 0.45, y: 0.36 }; // left shoulder
      landmarks[12] = { ...landmarks[12], x: 0.55, y: 0.36 }; // right shoulder
      landmarks[13] = { ...landmarks[13], x: 0.44, y: 0.22 }; // left elbow
      landmarks[14] = { ...landmarks[14], x: 0.56, y: 0.22 }; // right elbow
      landmarks[15] = { ...landmarks[15], x: 0.43, y: 0.12 }; // left wrist
      landmarks[16] = { ...landmarks[16], x: 0.57, y: 0.12 }; // right wrist
  }

  return landmarks;
}

function generateHamstringStretchPose(
  base: PoseLandmark[],
  quality: string
): PoseLandmark[] {
  const landmarks = [...base];

  switch (quality) {
    case 'perfect':
      // Perfect stretch - straight back, reaching toes
      landmarks[11] = { ...landmarks[11], x: 0.45, y: 0.5 }; // left shoulder
      landmarks[12] = { ...landmarks[12], x: 0.55, y: 0.5 }; // right shoulder
      landmarks[23] = { ...landmarks[23], x: 0.45, y: 0.45 }; // left hip
      landmarks[24] = { ...landmarks[24], x: 0.55, y: 0.45 }; // right hip
      landmarks[15] = { ...landmarks[15], x: 0.43, y: 0.8 }; // left wrist (at toes)
      landmarks[16] = { ...landmarks[16], x: 0.57, y: 0.8 }; // right wrist (at toes)
      break;

    case 'poor':
      // Poor form - rounded back, not reaching
      landmarks[11] = { ...landmarks[11], x: 0.45, y: 0.4 }; // left shoulder (hunched)
      landmarks[12] = { ...landmarks[12], x: 0.55, y: 0.4 }; // right shoulder (hunched)
      landmarks[23] = { ...landmarks[23], x: 0.45, y: 0.5 }; // left hip
      landmarks[24] = { ...landmarks[24], x: 0.55, y: 0.5 }; // right hip
      landmarks[15] = { ...landmarks[15], x: 0.44, y: 0.6 }; // left wrist (not reaching)
      landmarks[16] = { ...landmarks[16], x: 0.56, y: 0.6 }; // right wrist (not reaching)
      break;

    default: // good
      landmarks[11] = { ...landmarks[11], x: 0.45, y: 0.45 }; // left shoulder
      landmarks[12] = { ...landmarks[12], x: 0.55, y: 0.45 }; // right shoulder
      landmarks[23] = { ...landmarks[23], x: 0.45, y: 0.47 }; // left hip
      landmarks[24] = { ...landmarks[24], x: 0.55, y: 0.47 }; // right hip
      landmarks[15] = { ...landmarks[15], x: 0.43, y: 0.7 }; // left wrist
      landmarks[16] = { ...landmarks[16], x: 0.57, y: 0.7 }; // right wrist
  }

  return landmarks;
}

function getLandmarkName(index: number): string {
  const names = [
    'nose',
    'left_eye_inner',
    'left_eye',
    'left_eye_outer',
    'right_eye_inner',
    'right_eye',
    'right_eye_outer',
    'left_ear',
    'right_ear',
    'mouth_left',
    'mouth_right',
    'left_shoulder',
    'right_shoulder',
    'left_elbow',
    'right_elbow',
    'left_wrist',
    'right_wrist',
    'left_pinky',
    'right_pinky',
    'left_index',
    'right_index',
    'left_thumb',
    'right_thumb',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
    'left_heel',
    'right_heel',
    'left_foot_index',
    'right_foot_index',
  ];
  return names[index] || `landmark_${index}`;
}

// ===== Exercise Test Data =====

export const testExercisePhases: { [key: string]: ExercisePhase[] } = {
  bicep_curl: [
    {
      name: 'start',
      minDuration: 0,
      maxDuration: 1000,
      criteria: {
        jointAngles: {
          leftElbow: { min: 160, max: 180 },
          rightElbow: { min: 160, max: 180 },
        },
      },
    },
    {
      name: 'flexion',
      minDuration: 500,
      maxDuration: 3000,
      criteria: {
        jointAngles: {
          leftElbow: { min: 30, max: 60 },
          rightElbow: { min: 30, max: 60 },
        },
      },
    },
    {
      name: 'extension',
      minDuration: 500,
      maxDuration: 3000,
      criteria: {
        jointAngles: {
          leftElbow: { min: 140, max: 180 },
          rightElbow: { min: 140, max: 180 },
        },
      },
    },
  ],

  squat: [
    {
      name: 'standing',
      minDuration: 0,
      maxDuration: 1000,
      criteria: {
        jointAngles: {
          leftKnee: { min: 160, max: 180 },
          rightKnee: { min: 160, max: 180 },
          leftHip: { min: 160, max: 180 },
          rightHip: { min: 160, max: 180 },
        },
      },
    },
    {
      name: 'descending',
      minDuration: 1000,
      maxDuration: 3000,
      criteria: {
        jointAngles: {
          leftKnee: { min: 70, max: 110 },
          rightKnee: { min: 70, max: 110 },
          leftHip: { min: 70, max: 110 },
          rightHip: { min: 70, max: 110 },
        },
      },
    },
    {
      name: 'ascending',
      minDuration: 1000,
      maxDuration: 3000,
      criteria: {
        jointAngles: {
          leftKnee: { min: 140, max: 180 },
          rightKnee: { min: 140, max: 180 },
          leftHip: { min: 140, max: 180 },
          rightHip: { min: 140, max: 180 },
        },
      },
    },
  ],
};

// ===== Validation Result Test Data =====

export const testValidationResults: { [key: string]: ValidationResult } = {
  perfect: {
    isValid: true,
    phase: 'flexion',
    formScore: 1.0,
    errors: [],
    feedbackMessage: 'Perfect form! Keep it up!',
    repetitions: 10,
    phaseTransition: false,
  },

  good: {
    isValid: true,
    phase: 'flexion',
    formScore: 0.85,
    errors: [],
    feedbackMessage: 'Good form!',
    repetitions: 8,
    phaseTransition: false,
  },

  needsImprovement: {
    isValid: false,
    phase: 'flexion',
    formScore: 0.6,
    errors: ['elbow_flare', 'shoulder_elevation'],
    feedbackMessage: 'Keep your elbows closer to your body',
    repetitions: 5,
    phaseTransition: false,
  },

  poor: {
    isValid: false,
    phase: 'flexion',
    formScore: 0.3,
    errors: ['elbow_flare', 'shoulder_elevation', 'back_arch', 'momentum'],
    feedbackMessage: 'Slow down and focus on form',
    repetitions: 2,
    phaseTransition: false,
  },
};

// ===== Session Test Data =====

export const testSessions = [
  {
    id: 'session-1',
    userId: 'test-user-1',
    exerciseId: 'bicep_curl',
    startTime: new Date('2025-01-28T10:00:00').toISOString(),
    endTime: new Date('2025-01-28T10:15:00').toISOString(),
    metrics: {
      totalReps: 30,
      sets: 3,
      averageFormScore: 0.85,
      duration: 900, // 15 minutes
      caloriesBurned: 45,
    },
  },
  {
    id: 'session-2',
    userId: 'test-user-1',
    exerciseId: 'squat',
    startTime: new Date('2025-01-27T09:00:00').toISOString(),
    endTime: new Date('2025-01-27T09:20:00').toISOString(),
    metrics: {
      totalReps: 45,
      sets: 3,
      averageFormScore: 0.78,
      duration: 1200, // 20 minutes
      caloriesBurned: 80,
    },
  },
];

// ===== Performance Test Data =====

export const performanceScenarios = {
  lowEnd: {
    deviceScore: 30,
    frameRate: 15,
    processingDelay: 150,
    memoryUsage: 'high',
  },

  midRange: {
    deviceScore: 60,
    frameRate: 24,
    processingDelay: 80,
    memoryUsage: 'medium',
  },

  highEnd: {
    deviceScore: 90,
    frameRate: 30,
    processingDelay: 30,
    memoryUsage: 'low',
  },
};

// ===== Error Scenarios =====

export const errorScenarios = {
  networkErrors: [
    { code: 'NETWORK_ERROR', message: 'No internet connection' },
    { code: 'TIMEOUT', message: 'Request timed out' },
    { code: 'SERVER_ERROR', message: 'Server error (500)' },
  ],

  authErrors: [
    { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    { code: 'TOKEN_EXPIRED', message: 'Session expired' },
    { code: 'ACCOUNT_LOCKED', message: 'Account temporarily locked' },
  ],

  cameraErrors: [
    { code: 'PERMISSION_DENIED', message: 'Camera permission denied' },
    { code: 'CAMERA_NOT_AVAILABLE', message: 'Camera not available' },
    { code: 'CAMERA_IN_USE', message: 'Camera is being used by another app' },
  ],

  modelErrors: [
    { code: 'MODEL_LOAD_FAILED', message: 'Failed to load pose detection model' },
    { code: 'INFERENCE_FAILED', message: 'Pose detection failed' },
    { code: 'LOW_CONFIDENCE', message: 'Cannot detect pose clearly' },
  ],
};

// ===== Accessibility Test Data =====

export const accessibilityLabels = {
  buttons: {
    start: 'Start pose detection',
    stop: 'Stop pose detection',
    selectExercise: 'Select exercise type',
    viewProgress: 'View your progress',
    settings: 'Open settings',
  },

  announcements: {
    exerciseStarted: 'Exercise started. Begin your movements.',
    repCompleted: 'Repetition completed. Count: {count}',
    formCorrection: 'Adjust your form: {correction}',
    exerciseComplete: 'Exercise complete. Well done!',
  },

  hints: {
    doubleTapToStart: 'Double tap to start exercise',
    swipeForMore: 'Swipe left or right for more exercises',
    pinchToZoom: 'Pinch to zoom the exercise guide',
  },
};

// ===== Helper Functions =====

export function generateTimeSeriesData(days: number, exerciseType?: ExerciseType) {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      exerciseId: exerciseType || 'bicep_curl',
      reps: Math.floor(Math.random() * 20) + 10,
      formScore: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
      duration: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
    });
  }

  return data;
}

export function generateMockProgress(userId: string, days: number = 30) {
  return {
    userId,
    totalSessions: days,
    totalReps: days * 35,
    averageFormScore: 0.82,
    currentStreak: Math.floor(Math.random() * 7) + 1,
    bestStreak: Math.floor(Math.random() * 14) + 7,
    exercises: generateTimeSeriesData(days),
    achievements: [
      { id: 'first_workout', unlockedAt: new Date().toISOString() },
      { id: 'week_streak', unlockedAt: new Date().toISOString() },
      { id: 'perfect_form', unlockedAt: new Date().toISOString() },
    ],
  };
}
