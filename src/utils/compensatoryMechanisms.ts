/**
 * Compensatory Mechanisms for Real-World Patient Use
 *
 * Handles suboptimal conditions common in home healthcare:
 * - Poor lighting
 * - Limited space
 * - Patient mobility constraints
 * - Environmental challenges
 *
 * Philosophy: Maintain medical-grade accuracy while maximizing ease of use
 */

import { Frame } from 'react-native-vision-camera';
import { PoseLandmark } from '../types/pose';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LightingAssessment {
  status: 'too_dark' | 'too_bright' | 'harsh_shadows' | 'good';
  message: string;
  suggestion: string;
  canProceed: boolean;
  icon: string;
  brightness: number;
}

export interface DistanceAssessment {
  status: 'too_far' | 'too_close' | 'perfect';
  instruction: string;
  visual: string;
  distance: 'far' | 'close' | 'optimal';
  bodyFillPercentage: number;
}

export interface EnvironmentConditions {
  lighting: 'poor' | 'good' | 'excellent';
  space: 'limited' | 'adequate' | 'spacious';
  background: 'cluttered' | 'moderate' | 'clean';
  stability: 'unstable' | 'moderate' | 'stable';
}

export interface AdaptiveSettings {
  minConfidence: number;
  smoothing: number;
  exposureCompensation: number;
  minDistance?: number;
  fov?: 'wide' | 'normal';
  cropMode?: 'smart' | 'full';
}

export interface PatientProfile {
  age: number;
  sessionsCompleted: number;
  role?: 'patient' | 'physiotherapist' | 'caregiver';
  mobility: 'full' | 'limited' | 'wheelchair';
  techComfort: 'low' | 'medium' | 'high';
  hasAssistance: boolean;
  hasTremor: boolean;
}

export type AccuracyTier = 'simple' | 'standard' | 'professional';

// ============================================================================
// Constants
// ============================================================================

const BRIGHTNESS_THRESHOLD = {
  LOW: 0.2,
  HIGH: 0.85,
  OPTIMAL_MIN: 0.3,
  OPTIMAL_MAX: 0.7,
};

const SHADOWS_THRESHOLD = 0.4;

const BODY_FILL_THRESHOLD = {
  TOO_CLOSE: 90,
  TOO_FAR: 50,
  OPTIMAL_MIN: 60,
  OPTIMAL_MAX: 85,
};

const STABILITY_THRESHOLD = 0.02; // Variance threshold for tremor detection

// ============================================================================
// 1. Lighting Analysis & Compensation
// ============================================================================

/**
 * Analyzes lighting conditions and provides patient-friendly guidance
 */
export const checkLightingConditions = (frame: Frame): LightingAssessment => {
  const brightness = analyzeBrightness(frame);
  const contrast = analyzeContrast(frame);
  const shadows = detectHarshShadows(frame);

  if (brightness < BRIGHTNESS_THRESHOLD.LOW) {
    return {
      status: 'too_dark',
      message: 'Room is too dark',
      suggestion: 'Turn on more lights or move near a window',
      canProceed: false,
      icon: '💡',
      brightness,
    };
  }

  if (brightness > BRIGHTNESS_THRESHOLD.HIGH) {
    return {
      status: 'too_bright',
      message: 'Too much glare from window',
      suggestion: 'Close curtains or move away from direct sunlight',
      canProceed: false,
      icon: '☀️',
      brightness,
    };
  }

  if (shadows > SHADOWS_THRESHOLD) {
    return {
      status: 'harsh_shadows',
      message: 'Lighting is uneven',
      suggestion: 'Turn on room light or adjust your position',
      canProceed: true, // Can work but not ideal
      icon: '⚠️',
      brightness,
    };
  }

  return {
    status: 'good',
    message: 'Lighting looks great!',
    suggestion: '',
    canProceed: true,
    icon: '✅',
    brightness,
  };
};

/**
 * Analyzes frame brightness (simplified - would use actual pixel data in production)
 */
const analyzeBrightness = (frame: Frame): number => {
  // In production: Analyze actual pixel data
  // For now: Return mock value based on frame properties
  // Range: 0.0 (black) to 1.0 (white)

  // TODO: Implement actual brightness analysis
  // const pixelData = getPixelData(frame);
  // const avgBrightness = calculateAverageBrightness(pixelData);
  // return avgBrightness;

  return 0.5; // Mock: Assume medium brightness
};

/**
 * Analyzes frame contrast
 */
const analyzeContrast = (frame: Frame): number => {
  // TODO: Implement actual contrast analysis
  // const pixelData = getPixelData(frame);
  // const standardDeviation = calculateStdDev(pixelData);
  // return standardDeviation / 255;

  return 0.5; // Mock: Assume medium contrast
};

/**
 * Detects harsh shadows in frame
 */
const detectHarshShadows = (frame: Frame): number => {
  // TODO: Implement shadow detection
  // Look for high-contrast edges and dark regions near person
  // const shadowScore = analyzeShadowRegions(frame);
  // return shadowScore;

  return 0.2; // Mock: Assume low shadow level
};

/**
 * Gets adaptive lighting settings based on conditions
 */
export const getAdaptiveLightingSettings = (
  brightness: number
): AdaptiveSettings => {
  if (brightness < BRIGHTNESS_THRESHOLD.OPTIMAL_MIN) {
    // Low light mode
    return {
      minConfidence: 0.25, // Lower threshold (normal: 0.3)
      smoothing: 0.8, // More smoothing (normal: 0.5)
      exposureCompensation: 1.5, // Increase exposure
    };
  }

  if (brightness > BRIGHTNESS_THRESHOLD.OPTIMAL_MAX) {
    // Bright light mode
    return {
      minConfidence: 0.35, // Higher threshold
      smoothing: 0.3, // Less smoothing
      exposureCompensation: -1.0, // Decrease exposure
    };
  }

  // Normal light mode
  return {
    minConfidence: 0.3,
    smoothing: 0.5,
    exposureCompensation: 0,
  };
};

// ============================================================================
// 2. Distance/Positioning Analysis & Guidance
// ============================================================================

/**
 * Checks if patient is at optimal distance from camera
 */
export const checkPatientDistance = (
  landmarks: PoseLandmark[],
  screenHeight: number
): DistanceAssessment => {
  const bodyHeight = calculateBodyHeight(landmarks);
  const bodyFillPercentage = (bodyHeight / screenHeight) * 100;

  if (bodyFillPercentage < BODY_FILL_THRESHOLD.TOO_FAR) {
    return {
      status: 'too_far',
      instruction: 'Move 2 steps closer',
      visual: '→ → → 👤',
      distance: 'far',
      bodyFillPercentage,
    };
  }

  if (bodyFillPercentage > BODY_FILL_THRESHOLD.TOO_CLOSE) {
    return {
      status: 'too_close',
      instruction: 'Move 2 steps back',
      visual: '👤 ← ← ←',
      distance: 'close',
      bodyFillPercentage,
    };
  }

  return {
    status: 'perfect',
    instruction: 'Perfect! Stay right there',
    visual: '✅ 👤 ✅',
    distance: 'optimal',
    bodyFillPercentage,
  };
};

/**
 * Calculates body height in pixels
 */
const calculateBodyHeight = (landmarks: PoseLandmark[]): number => {
  if (landmarks.length < 17) {
    return 0;
  }

  // Find highest point (nose or eyes)
  const headLandmarks = landmarks.slice(0, 5); // Nose, eyes, ears
  const minY = Math.min(...headLandmarks.map(l => l.y));

  // Find lowest point (ankles or feet)
  const feetLandmarks = landmarks.slice(15, 17); // Ankles
  const maxY = Math.max(...feetLandmarks.map(l => l.y));

  return maxY - minY;
};

/**
 * Gets adaptive distance settings for limited space
 */
export const getAdaptiveDistanceSettings = (
  spaceAvailable: 'limited' | 'adequate' | 'spacious'
): AdaptiveSettings => {
  const settings = {
    limited: {
      minConfidence: 0.25,
      smoothing: 0.6,
      exposureCompensation: 0,
      minDistance: 4, // feet
      fov: 'wide' as const,
      cropMode: 'smart' as const,
    },
    adequate: {
      minConfidence: 0.3,
      smoothing: 0.5,
      exposureCompensation: 0,
      minDistance: 6,
      fov: 'normal' as const,
      cropMode: 'full' as const,
    },
    spacious: {
      minConfidence: 0.35,
      smoothing: 0.4,
      exposureCompensation: 0,
      minDistance: 8,
      fov: 'normal' as const,
      cropMode: 'full' as const,
    },
  };

  return settings[spaceAvailable];
};

// ============================================================================
// 3. Environment Assessment
// ============================================================================

/**
 * Assesses overall environment conditions
 */
export const assessEnvironment = (
  frame: Frame,
  landmarks: PoseLandmark[],
  screenHeight: number
): EnvironmentConditions => {
  const lightingCheck = checkLightingConditions(frame);
  const distanceCheck = checkPatientDistance(landmarks, screenHeight);

  // Assess lighting
  let lighting: 'poor' | 'good' | 'excellent';
  if (lightingCheck.status === 'good' &&
      lightingCheck.brightness >= BRIGHTNESS_THRESHOLD.OPTIMAL_MIN &&
      lightingCheck.brightness <= BRIGHTNESS_THRESHOLD.OPTIMAL_MAX) {
    lighting = 'excellent';
  } else if (lightingCheck.canProceed) {
    lighting = 'good';
  } else {
    lighting = 'poor';
  }

  // Assess space
  let space: 'limited' | 'adequate' | 'spacious';
  if (distanceCheck.bodyFillPercentage >= BODY_FILL_THRESHOLD.OPTIMAL_MIN &&
      distanceCheck.bodyFillPercentage <= BODY_FILL_THRESHOLD.OPTIMAL_MAX) {
    space = 'adequate';
  } else if (distanceCheck.bodyFillPercentage > BODY_FILL_THRESHOLD.OPTIMAL_MAX) {
    space = 'limited';
  } else {
    space = 'spacious';
  }

  // Assess background (simplified)
  const background: 'cluttered' | 'moderate' | 'clean' = 'moderate'; // TODO: Implement

  // Assess stability (based on landmark variance)
  const stability: 'unstable' | 'moderate' | 'stable' = 'moderate'; // TODO: Implement

  return {
    lighting,
    space,
    background,
    stability,
  };
};

// ============================================================================
// 4. Accuracy Tier System
// ============================================================================

/**
 * Selects optimal accuracy tier based on patient and environment
 */
export const selectOptimalTier = (
  patientProfile: PatientProfile,
  environment: EnvironmentConditions
): AccuracyTier => {
  // First-time user or elderly → Simple Mode
  if (patientProfile.age > 65 || patientProfile.sessionsCompleted < 3) {
    return 'simple';
  }

  // Poor environment → Simple Mode
  if (environment.lighting === 'poor' || environment.space === 'limited') {
    return 'simple';
  }

  // Low tech comfort → Simple Mode
  if (patientProfile.techComfort === 'low') {
    return 'simple';
  }

  // Professional user → Professional Mode
  if (patientProfile.role === 'physiotherapist') {
    return 'professional';
  }

  // Default → Standard Mode
  return 'standard';
};

/**
 * Gets settings for specific accuracy tier
 */
export const getTierSettings = (tier: AccuracyTier): {
  minConfidence: number;
  smoothing: number;
  guidance: 'full' | 'moderate' | 'minimal';
  autoRecovery: boolean;
  simplifiedUI: boolean;
  accuracyTarget: string;
  showTechnicalInfo: boolean;
} => {
  const settings = {
    simple: {
      minConfidence: 0.20,
      smoothing: 0.85, // Heavy smoothing for tremors
      guidance: 'full' as const,
      autoRecovery: true,
      simplifiedUI: true,
      accuracyTarget: '±5°', // Sufficient for PT progress tracking
      showTechnicalInfo: false,
    },
    standard: {
      minConfidence: 0.30,
      smoothing: 0.50,
      guidance: 'moderate' as const,
      autoRecovery: true,
      simplifiedUI: false,
      accuracyTarget: '±3°',
      showTechnicalInfo: false,
    },
    professional: {
      minConfidence: 0.40,
      smoothing: 0.30,
      guidance: 'minimal' as const,
      autoRecovery: false,
      simplifiedUI: false,
      accuracyTarget: '±1°',
      showTechnicalInfo: true,
    },
  };

  return settings[tier];
};

// ============================================================================
// 5. Tremor Compensation
// ============================================================================

/**
 * Checks if landmarks are stable (for patients with tremors)
 */
export const checkStability = (
  currentLandmarks: PoseLandmark[],
  landmarkHistory: PoseLandmark[][]
): {
  stable: boolean;
  message: string;
  countdown?: number;
} => {
  if (landmarkHistory.length < 5) {
    return {
      stable: false,
      message: 'Hold still for measurement...',
    };
  }

  const last5Frames = landmarkHistory.slice(-5);
  const variance = calculateLandmarkVariance(last5Frames);

  if (variance < STABILITY_THRESHOLD) {
    return {
      stable: true,
      message: '✅ Stable - measuring now',
    };
  }

  const countdownValue = Math.ceil((variance - STABILITY_THRESHOLD) * 50);
  return {
    stable: false,
    message: 'Hold still for measurement...',
    countdown: countdownValue,
  };
};

/**
 * Calculates variance across landmark history (for tremor detection)
 */
const calculateLandmarkVariance = (history: PoseLandmark[][]): number => {
  if (history.length < 2) {
    return Infinity;
  }

  // Calculate average position for each landmark
  const avgPositions = history[0].map((_, landmarkIndex) => {
    const positions = history.map(frame => frame[landmarkIndex]);
    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
    return { x: avgX, y: avgY };
  });

  // Calculate variance from average
  let totalVariance = 0;
  history.forEach(frame => {
    frame.forEach((landmark, index) => {
      const avg = avgPositions[index];
      const dx = landmark.x - avg.x;
      const dy = landmark.y - avg.y;
      totalVariance += dx * dx + dy * dy;
    });
  });

  return totalVariance / (history.length * history[0].length);
};

/**
 * Gets tremor compensation settings
 */
export const getTremorCompensationSettings = (): {
  enabled: boolean;
  smoothingFactor: number;
  minimumStabilityTime: number;
  visualFeedback: string;
} => {
  return {
    enabled: true,
    smoothingFactor: 0.85, // Higher than normal 0.5
    minimumStabilityTime: 2000, // Wait 2 seconds of stability
    visualFeedback: 'Hold still...',
  };
};

// ============================================================================
// 6. Comprehensive Adaptive System
// ============================================================================

/**
 * Gets comprehensive adaptive settings based on all factors
 */
export const getComprehensiveAdaptiveSettings = (
  patientProfile: PatientProfile,
  environment: EnvironmentConditions,
  lightingAssessment: LightingAssessment
): AdaptiveSettings => {
  // Start with tier-based settings
  const tier = selectOptimalTier(patientProfile, environment);
  const tierSettings = getTierSettings(tier);

  // Apply lighting adjustments
  const lightingSettings = getAdaptiveLightingSettings(lightingAssessment.brightness);

  // Apply space adjustments
  const spaceSettings = getAdaptiveDistanceSettings(environment.space);

  // Apply patient-specific adjustments
  let patientAdjustments: Partial<AdaptiveSettings> = {};

  if (patientProfile.hasTremor) {
    const tremorSettings = getTremorCompensationSettings();
    patientAdjustments.smoothing = tremorSettings.smoothingFactor;
  }

  if (patientProfile.mobility === 'limited' || patientProfile.mobility === 'wheelchair') {
    // More lenient for limited mobility
    patientAdjustments.minConfidence = Math.max(
      (tierSettings.minConfidence || 0.3) - 0.05,
      0.15
    );
  }

  // Combine all settings (priority: patient > environment > tier > base)
  return {
    minConfidence: patientAdjustments.minConfidence ||
                   tierSettings.minConfidence,
    smoothing: patientAdjustments.smoothing ||
               tierSettings.smoothing,
    exposureCompensation: lightingSettings.exposureCompensation,
    minDistance: spaceSettings.minDistance,
    fov: spaceSettings.fov,
    cropMode: spaceSettings.cropMode,
  };
};

// ============================================================================
// 7. Plain Language Translations
// ============================================================================

/**
 * Translates technical terms to patient-friendly language
 */
export const translateToPatientLanguage = {
  // Confidence levels
  confidenceToQuality: (confidence: number): string => {
    if (confidence >= 0.7) return '✅ Tracking great';
    if (confidence >= 0.4) return '⚠️ Tracking okay';
    return '❌ Having trouble seeing you';
  },

  // Technical errors
  errors: {
    'Frame processor initialization failed': {
      title: 'Camera Setup Issue',
      message: "Let's restart and try again",
      actions: ['Try Again', 'Get Help'],
      helpText: 'Close other camera apps first',
    },
    'TFLite model load error': {
      title: 'App needs to restart',
      message: 'This happens sometimes. Just restart the app.',
      actions: ['Restart App'],
      helpText: 'Your data is saved',
    },
    'GPU delegate not available': {
      title: 'Using slower mode',
      message: 'App will work but may be slower',
      actions: ['Continue'],
      helpText: 'This is normal on some devices',
    },
    'Low confidence detection': {
      title: 'Having trouble seeing you',
      message: "Let's improve the view",
      actions: ['Check Lighting', 'Adjust Position', 'Continue Anyway'],
      helpText: 'Stand closer to the camera or turn on lights',
    },
  },

  // Status messages
  status: {
    'Detecting pose...': 'Looking for you...',
    'Processing frame...': 'Analyzing movement...',
    'Inference time: 42ms': '', // Hide technical info
    'FPS: 28.3': '', // Hide technical info
    'Landmarks: 17/17': '📊 Ready to measure',
  },
};

/**
 * Gets patient-friendly error message
 */
export const getPatientFriendlyError = (technicalError: string): {
  title: string;
  message: string;
  actions: string[];
  helpText: string;
} => {
  const errorKey = Object.keys(translateToPatientLanguage.errors).find(key =>
    technicalError.toLowerCase().includes(key.toLowerCase())
  );

  if (errorKey) {
    return translateToPatientLanguage.errors[
      errorKey as keyof typeof translateToPatientLanguage.errors
    ];
  }

  // Default patient-friendly error
  return {
    title: 'Something went wrong',
    message: "Let's try again",
    actions: ['Try Again', 'Get Help'],
    helpText: 'Restart the app if this keeps happening',
  };
};

// ============================================================================
// 8. Coaching Instructions
// ============================================================================

/**
 * Gets real-time coaching instruction based on current state
 */
export const getCoachingInstruction = (
  currentAngle: number,
  targetAngle: number,
  exerciseType: string
): {
  visual: string;
  audio: string;
  haptic: 'gentle' | 'medium' | 'success';
  progress: number;
} => {
  const progress = (currentAngle / targetAngle) * 100;

  if (progress >= 100) {
    return {
      visual: `✅ Perfect! You reached ${targetAngle}°`,
      audio: `Perfect! You reached your goal of ${targetAngle} degrees`,
      haptic: 'success',
      progress: 100,
    };
  }

  if (progress >= 75) {
    const remaining = targetAngle - currentAngle;
    return {
      visual: `Almost there! ${Math.round(remaining)}° more`,
      audio: `Almost there! Just ${Math.round(remaining)} degrees more`,
      haptic: 'medium',
      progress,
    };
  }

  if (progress >= 50) {
    return {
      visual: `Halfway there! Keep going`,
      audio: `You're halfway there! Keep going`,
      haptic: 'gentle',
      progress,
    };
  }

  if (progress >= 25) {
    return {
      visual: `Good start! Continue`,
      audio: `Good start! Continue bending`,
      haptic: 'gentle',
      progress,
    };
  }

  return {
    visual: `Bend further`,
    audio: `Bend your ${exerciseType} further`,
    haptic: 'gentle',
    progress,
  };
};

// ============================================================================
// Exports
// ============================================================================

export default {
  checkLightingConditions,
  checkPatientDistance,
  assessEnvironment,
  selectOptimalTier,
  getTierSettings,
  checkStability,
  getComprehensiveAdaptiveSettings,
  translateToPatientLanguage,
  getPatientFriendlyError,
  getCoachingInstruction,
};
