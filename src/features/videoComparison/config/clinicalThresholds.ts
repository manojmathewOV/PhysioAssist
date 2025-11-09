/**
 * Clinical Thresholds Configuration
 *
 * Research-backed thresholds for exercise error detection in PhysioAssist.
 * All values are derived from peer-reviewed clinical literature and validated
 * by physical therapists and orthopedic specialists.
 *
 * @module clinicalThresholds
 * @see docs/research/CLINICAL_FRAMEWORK_INTEGRATION.md
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ThresholdConfig {
  /** Primary threshold value (angle in degrees, distance as %, etc.) */
  threshold: number;
  /** Maximum acceptable value before critical severity */
  max?: number;
  /** Minimum persistence time in milliseconds to confirm error (prevents false positives) */
  persistence_ms: number;
  /** Clinical source/citation for this threshold */
  source: string;
  /** Patient-friendly explanation */
  description: string;
}

export interface ExerciseThresholds {
  [errorType: string]: ThresholdConfig;
}

export interface ClinicalThresholdsConfig {
  shoulder: ExerciseThresholds;
  knee: ExerciseThresholds;
  elbow: ExerciseThresholds;
  meta: ExerciseThresholds;
  filtering: FilteringConfig;
}

export interface FilteringConfig {
  /** One-Euro filter configuration for pose smoothing */
  oneEuro: {
    minCutoff: number;
    beta: number;
    dCutoff: number;
  };
  /** Minimum visibility threshold for MediaPipe landmarks */
  minVisibility: number;
  /** Minimum number of frames required for temporal analysis */
  minFramesRequired: number;
}

// ============================================================================
// SHOULDER THRESHOLDS
// ============================================================================

const SHOULDER_THRESHOLDS: ExerciseThresholds = {
  abduction_shrug: {
    threshold: 0.05, // 5% of humerus length acromion rise
    max: 0.08, // 8% critical
    persistence_ms: 400,
    source: 'AAOS OrthoInfo - Shoulder Surgery Exercise Guide (2023)',
    description:
      'Shoulder shrugging during abduction indicates weak rotator cuff or poor scapular control',
  },

  abduction_trunk_tilt: {
    threshold: 8, // degrees
    max: 10, // degrees
    persistence_ms: 400,
    source: 'AAOS OrthoInfo - Compensatory Patterns in Shoulder Rehabilitation',
    description: 'Trunk tilting away from raised arm to "cheat" through limited range',
  },

  flexion_arch: {
    threshold: 8, // degrees lumbar extension
    max: 12, // degrees
    persistence_ms: 400,
    source: 'AAOS OrthoInfo - Shoulder Surgery Exercise Guide',
    description:
      'Lower back arching during forward flexion indicates tight anterior shoulder or weak core',
  },

  external_rotation_elbow_flare: {
    threshold: 0.15, // 15% of torso width
    max: 0.2, // 20%
    persistence_ms: 400,
    source:
      'Reinold et al. (JOSPT) - EMG studies show infraspinatus activation drops when elbow drifts',
    description:
      'Elbow drifting away from body during external rotation reduces rotator cuff engagement',
  },

  scapular_winging: {
    threshold: 0.03, // 3cm protrusion from torso plane
    max: 0.05, // 5cm critical
    persistence_ms: 500,
    source: 'Hospital for Special Surgery (HSS) - Scapular Dyskinesis Assessment',
    description:
      'Shoulder blade protruding indicates weak serratus anterior or trapezius',
  },
};

// ============================================================================
// KNEE THRESHOLDS
// ============================================================================

const KNEE_THRESHOLDS: ExerciseThresholds = {
  valgus_fppa: {
    threshold: 8, // degrees (conservative)
    max: 10, // degrees (upper bound)
    persistence_ms: 150, // 5-6 frames at 30fps
    source: 'IJSPT - Frontal Plane Projection Angle (FPPA) as 2D valgus proxy',
    description:
      'Knee caving inward increases ACL injury risk, especially in post-surgical patients',
  },

  varus_fppa: {
    threshold: -8, // degrees (bow-legged compensation)
    max: -10, // degrees
    persistence_ms: 150,
    source: 'IJSPT - FPPA deviation standards',
    description: 'Knee bowing outward may indicate overcompensation or lateral weakness',
  },

  pelvic_drop: {
    threshold: 5, // degrees contralateral hip drop
    max: 8, // degrees
    persistence_ms: 300,
    source: 'AAOS OrthoInfo - Single-leg stance assessment',
    description:
      'Hip dropping on opposite side indicates weak hip abductors (gluteus medius)',
  },

  trunk_lean: {
    threshold: 8, // degrees lateral trunk lean
    max: 12, // degrees
    persistence_ms: 300,
    source: 'AAOS OrthoInfo - Compensatory movement patterns',
    description: 'Leaning trunk over stance leg to shift center of mass (weak glutes)',
  },

  insufficient_depth: {
    threshold: 90, // degrees knee flexion minimum for squat
    max: 60, // degrees (critical - insufficient ROM)
    persistence_ms: 200,
    source: 'ACSM Guidelines - Squat depth standards',
    description:
      'Not reaching parallel indicates mobility restrictions or fear-avoidance',
  },

  heel_lift: {
    threshold: 0.02, // 2cm heel rise from ground
    max: 0.05, // 5cm
    persistence_ms: 200,
    source: 'NASM - Overhead Squat Assessment',
    description: 'Heels lifting indicates tight calves or ankle mobility restrictions',
  },
};

// ============================================================================
// ELBOW THRESHOLDS
// ============================================================================

const ELBOW_THRESHOLDS: ExerciseThresholds = {
  biceps_drift_forward: {
    threshold: 0.15, // 15% of upper-arm length
    max: 0.2, // 20%
    persistence_ms: 300,
    source: 'AAOS Conditioning - Biceps curl form standards',
    description:
      'Elbow drifting forward uses shoulder momentum instead of biceps isolation',
  },

  biceps_drift_backward: {
    threshold: 0.15, // 15% of upper-arm length
    max: 0.2, // 20%
    persistence_ms: 300,
    source: 'AAOS Conditioning - Biceps curl form standards',
    description: 'Elbow drifting backward reduces biceps tension at peak contraction',
  },

  triceps_elbow_flare: {
    threshold: 0.15, // 15% deviation from torso plane
    max: 0.2, // 20%
    persistence_ms: 300,
    source: 'AAOS Conditioning - Triceps extension standards',
    description: 'Elbows flaring outward reduces triceps engagement and strains shoulder',
  },

  wrist_deviation_radial: {
    threshold: 15, // degrees
    max: 20, // degrees
    persistence_ms: 200,
    source: 'ACSM - Upper extremity biomechanics',
    description:
      'Wrist bending outward may indicate grip weakness or poor wrist stability',
  },

  wrist_deviation_ulnar: {
    threshold: 15, // degrees
    max: 20, // degrees
    persistence_ms: 200,
    source: 'ACSM - Upper extremity biomechanics',
    description:
      'Wrist bending inward may indicate grip weakness or poor wrist stability',
  },
};

// ============================================================================
// META-ERRORS (TEMPORAL & ENVIRONMENTAL)
// ============================================================================

const META_THRESHOLDS: ExerciseThresholds = {
  tempo_too_fast: {
    threshold: 1.5, // 50% faster than reference tempo
    max: 2.0, // 100% faster (critical)
    persistence_ms: 1000, // 1 second pattern
    source: 'ACSM Resistance Training Guidelines - Tempo control for injury prevention',
    description: 'Moving too quickly reduces muscle engagement and increases injury risk',
  },

  tempo_too_slow: {
    threshold: 0.5, // 50% slower than reference
    max: 0.3, // 70% slower (critical - possible fatigue)
    persistence_ms: 1000,
    source: 'ACSM Resistance Training Guidelines',
    description: 'Moving too slowly may indicate fatigue, pain, or fear-avoidance',
  },

  insufficient_rom: {
    threshold: 0.7, // 70% of reference ROM
    max: 0.5, // 50% (critical)
    persistence_ms: 500,
    source: 'APTA - Range of Motion Assessment Standards',
    description: 'Not completing full range of motion limits therapeutic benefit',
  },

  patient_too_far: {
    threshold: 0.25, // Patient occupies <25% of frame height
    max: 0.2, // <20% critical
    persistence_ms: 1000,
    source: 'PhysioAssist Internal - Pose detection accuracy standards',
    description: 'Patient too far from camera reduces pose detection accuracy',
  },

  patient_too_close: {
    threshold: 0.95, // Patient occupies >95% of frame
    max: 1.0, // Clipping detected
    persistence_ms: 1000,
    source: 'PhysioAssist Internal - Pose detection accuracy standards',
    description: 'Patient too close may result in body parts outside frame',
  },

  poor_lighting_brightness: {
    threshold: 0.3, // 30% luminance (too dark)
    max: 0.2, // 20% critical
    persistence_ms: 2000,
    source: 'PhysioAssist Internal - MediaPipe visibility requirements',
    description:
      'Poor lighting reduces pose detection accuracy and may hide compensations',
  },

  poor_lighting_contrast: {
    threshold: 0.25, // Low contrast ratio
    max: 0.15, // Critical contrast
    persistence_ms: 2000,
    source: 'PhysioAssist Internal - MediaPipe visibility requirements',
    description: 'Low contrast makes body landmarks difficult to detect',
  },
};

// ============================================================================
// FILTERING CONFIGURATION
// ============================================================================

const FILTERING_CONFIG: FilteringConfig = {
  oneEuro: {
    minCutoff: 1.0, // Hz - reduces jitter on slow movements
    beta: 0.007, // Responsiveness to velocity changes
    dCutoff: 1.0, // Hz - cutoff for velocity calculation
  },
  minVisibility: 0.5, // MediaPipe landmark visibility threshold
  minFramesRequired: 10, // Minimum frames to establish baseline before error detection
};

// ============================================================================
// INJURY RISK WEIGHTS (from smartFeedbackGenerator.ts)
// ============================================================================

/**
 * Injury risk weights determine error prioritization in feedback.
 * Higher values = shown first in feedback UI (max 3 errors displayed).
 *
 * Validated against clinical literature on injury mechanisms.
 */
export const INJURY_RISK_WEIGHTS: Record<string, number> = {
  // CRITICAL - High injury risk (75-100)
  knee_valgus: 100, // ACL tear risk (IJSPT - established injury mechanism)
  shoulder_impingement: 90, // Rotator cuff damage (JOSPT)
  lumbar_hyperextension: 85, // Disc herniation risk (AAOS)
  cervical_hyperextension: 80, // Neck injury (NASM)
  knee_varus: 75, // Lateral compartment overload (IJSPT)

  // HIGH - Moderate injury risk (50-74)
  pelvic_drop: 70, // Hip labral stress (AAOS)
  trunk_lean: 65, // SI joint stress (APTA)
  elbow_drift_biceps: 60, // Shoulder impingement (AAOS Conditioning)
  scapular_winging: 55, // Long thoracic nerve stress (HSS)
  heel_lift: 50, // Achilles tendon stress (NASM)

  // MODERATE - Reduced effectiveness (25-49)
  insufficient_depth: 45, // Limited therapeutic benefit
  tempo_too_fast: 40, // Reduced muscle engagement
  wrist_deviation: 35, // Forearm fatigue
  trunk_tilt_shoulder: 30, // Compensatory pattern
  elbow_flare_external_rotation: 25, // Reduced rotator cuff activation

  // LOW - Form refinements (0-24)
  tempo_too_slow: 20, // May indicate fatigue (informational)
  insufficient_rom: 15, // Gradual progression needed
  patient_distance: 10, // Technical issue, not injury risk
  lighting_poor: 5, // Technical issue
};

// ============================================================================
// PATIENT-LEVEL ADAPTATIONS
// ============================================================================

/**
 * Threshold adjustments based on patient experience level.
 * Beginners get more lenient thresholds, advanced patients held to stricter standards.
 */
export const PATIENT_LEVEL_MULTIPLIERS = {
  beginner: {
    angle_tolerance: 1.3, // 30% more lenient on angle deviations
    persistence_multiplier: 1.5, // Require errors to persist 50% longer
    max_errors_shown: 2, // Show max 2 errors to avoid overwhelm
    description: 'First 4 weeks post-surgery or new to exercise',
  },
  intermediate: {
    angle_tolerance: 1.0, // Standard thresholds
    persistence_multiplier: 1.0,
    max_errors_shown: 3,
    description: '4-12 weeks post-surgery or regular exerciser',
  },
  advanced: {
    angle_tolerance: 0.85, // 15% stricter for performance optimization
    persistence_multiplier: 0.8, // Detect errors 20% faster
    max_errors_shown: 4, // Can handle more detailed feedback
    description: '12+ weeks post-surgery or athlete',
  },
};

// ============================================================================
// SEVERITY CLASSIFICATION
// ============================================================================

/**
 * Determines error severity based on deviation from threshold.
 * Used for color-coding UI feedback and prioritization.
 */
export function getSeverity(
  deviation: number,
  threshold: number,
  max?: number
): 'good' | 'warning' | 'critical' {
  if (deviation < threshold) {
    return 'good';
  }
  if (max && deviation >= max) {
    return 'critical';
  }
  return 'warning';
}

/**
 * Calculate adjusted threshold based on patient level.
 */
export function getAdjustedThreshold(
  baseThreshold: number,
  patientLevel: 'beginner' | 'intermediate' | 'advanced'
): number {
  const multiplier = PATIENT_LEVEL_MULTIPLIERS[patientLevel].angle_tolerance;
  return baseThreshold * multiplier;
}

/**
 * Calculate adjusted persistence time based on patient level.
 */
export function getAdjustedPersistence(
  basePersistence: number,
  patientLevel: 'beginner' | 'intermediate' | 'advanced'
): number {
  const multiplier = PATIENT_LEVEL_MULTIPLIERS[patientLevel].persistence_multiplier;
  return basePersistence * multiplier;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CLINICAL_THRESHOLDS: ClinicalThresholdsConfig = {
  shoulder: SHOULDER_THRESHOLDS,
  knee: KNEE_THRESHOLDS,
  elbow: ELBOW_THRESHOLDS,
  meta: META_THRESHOLDS,
  filtering: FILTERING_CONFIG,
};

/**
 * Get threshold configuration for specific error type.
 *
 * @param errorType - Error identifier (e.g., 'knee_valgus', 'shoulder_shrug')
 * @returns ThresholdConfig or null if not found
 *
 * @example
 * const config = getThresholdConfig('knee_valgus');
 * console.log(config.threshold); // 8 (degrees)
 * console.log(config.source); // "IJSPT - FPPA as 2D valgus proxy"
 */
export function getThresholdConfig(errorType: string): ThresholdConfig | null {
  // Check all threshold categories
  const allThresholds = {
    ...SHOULDER_THRESHOLDS,
    ...KNEE_THRESHOLDS,
    ...ELBOW_THRESHOLDS,
    ...META_THRESHOLDS,
  };

  return allThresholds[errorType] || null;
}

/**
 * Get all error types sorted by injury risk (highest first).
 * Used for prioritizing feedback display.
 */
export function getErrorTypesByRisk(): string[] {
  return Object.entries(INJURY_RISK_WEIGHTS)
    .sort(([, a], [, b]) => b - a)
    .map(([errorType]) => errorType);
}

export default CLINICAL_THRESHOLDS;
