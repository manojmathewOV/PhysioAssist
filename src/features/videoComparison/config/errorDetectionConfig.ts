/**
 * Error Detection Configuration
 *
 * Central configuration file for all error detection thresholds.
 * ⚠️ CLINICIAN TUNING REQUIRED ⚠️
 *
 * All thresholds are placeholders based on research and will need
 * validation with real patient data. Adjust these values through
 * clinical validation process.
 */

export interface ThresholdConfig {
  warning: number;
  critical: number;
}

export interface ShoulderErrorConfig {
  shoulderHiking: {
    warning_cm: number;      // Shoulder elevation in cm
    critical_cm: number;
  };
  trunkLean: {
    warning_deg: number;     // Lateral trunk angle in degrees
    critical_deg: number;
  };
  internalRotation: {
    warning_deg: number;     // Forearm rotation in degrees
    critical_deg: number;
  };
  incompleteROM: {
    warning_percent: number; // Percentage of reference ROM
    critical_percent: number;
  };
}

export interface KneeErrorConfig {
  kneeValgus: {
    warning_percent: number;  // Medial shift as % of stance width
    critical_percent: number; // ⚠️ HIGH INJURY RISK
  };
  heelLift: {
    warning_cm: number;       // Heel elevation in cm
    critical_cm: number;
  };
  posteriorPelvicTilt: {
    warning_deg: number;      // Hip-to-shoulder angle change
    critical_deg: number;
  };
  insufficientDepth: {
    warning_deg: number;      // Knee flexion angle deficit
    critical_deg: number;
  };
}

export interface ElbowErrorConfig {
  shoulderCompensation: {
    warning_cm: number;       // Shoulder movement in cm
    critical_cm: number;
  };
  incompleteExtension: {
    warning_deg: number;      // Minimum elbow angle
    critical_deg: number;
  };
  wristDeviation: {
    warning_deg: number;      // Wrist angle from neutral
    critical_deg: number;
  };
}

export interface GeneralErrorConfig {
  tempo: {
    tooFast_ratio: number;    // speedRatio < this = too fast
    tooSlow_ratio: number;    // speedRatio > this = too slow
  };
  confidence: {
    minimum: number;          // Minimum pose confidence to accept
    warning: number;          // Warn user if below this
  };
  poseQuality: {
    minKeypoints: number;     // Minimum visible keypoints
    minConfidence: number;    // Minimum average confidence
  };
}

/**
 * Default Error Detection Configuration
 *
 * ⚠️ THESE ARE PLACEHOLDER VALUES ⚠️
 * Based on literature review and clinical guidelines.
 * Requires validation with real patient data.
 *
 * Sources:
 * - Knee valgus: Hewett et al. (2005), Myer et al. (2010)
 * - Shoulder mechanics: Kibler et al. (2013), Ludewig & Reynolds (2009)
 * - ROM standards: AAOS Clinical Practice Guidelines
 */
export const ErrorDetectionConfig = {
  /**
   * Shoulder Error Thresholds
   */
  shoulder: {
    shoulderHiking: {
      warning_cm: 2.0,        // ⚠️ TUNE: Visible elevation, not injury risk
      critical_cm: 5.0,       // ⚠️ TUNE: Significant compensation pattern
    },
    trunkLean: {
      warning_deg: 5.0,       // ⚠️ TUNE: Mild trunk shift
      critical_deg: 15.0,     // ⚠️ TUNE: Excessive lateral flexion
    },
    internalRotation: {
      warning_deg: 15.0,      // ⚠️ TUNE: Moderate internal rotation
      critical_deg: 30.0,     // ⚠️ TUNE: Significant impingement risk
    },
    incompleteROM: {
      warning_percent: 70,    // ⚠️ TUNE: 70% of reference ROM
      critical_percent: 50,   // ⚠️ TUNE: 50% of reference ROM
    },
  } as ShoulderErrorConfig,

  /**
   * Knee Error Thresholds
   * ⚠️ Knee valgus is HIGH INJURY RISK - conservative thresholds
   */
  knee: {
    kneeValgus: {
      warning_percent: 5.0,   // ⚠️ TUNE: Mild valgus (Hewett et al.)
      critical_percent: 10.0, // ⚠️ TUNE: Moderate-severe (ACL injury risk)
    },
    heelLift: {
      warning_cm: 1.0,        // ⚠️ TUNE: Visible heel lift
      critical_cm: 2.0,       // ⚠️ TUNE: Significant ankle compensation
    },
    posteriorPelvicTilt: {
      warning_deg: 10.0,      // ⚠️ TUNE: Mild "butt wink"
      critical_deg: 20.0,     // ⚠️ TUNE: Excessive lumbar flexion
    },
    insufficientDepth: {
      warning_deg: 10.0,      // ⚠️ TUNE: 10° short of target
      critical_deg: 20.0,     // ⚠️ TUNE: 20° short of target
    },
  } as KneeErrorConfig,

  /**
   * Elbow Error Thresholds
   */
  elbow: {
    shoulderCompensation: {
      warning_cm: 3.0,        // ⚠️ TUNE: Mild shoulder movement
      critical_cm: 7.0,       // ⚠️ TUNE: Excessive momentum/cheating
    },
    incompleteExtension: {
      warning_deg: 160.0,     // ⚠️ TUNE: Slight flexion at bottom
      critical_deg: 140.0,    // ⚠️ TUNE: Significant ROM limitation
    },
    wristDeviation: {
      warning_deg: 15.0,      // ⚠️ TUNE: Mild wrist flexion/extension
      critical_deg: 30.0,     // ⚠️ TUNE: Significant strain risk
    },
  } as ElbowErrorConfig,

  /**
   * General Thresholds
   */
  general: {
    tempo: {
      tooFast_ratio: 0.8,     // ⚠️ TUNE: 20% faster than reference
      tooSlow_ratio: 1.2,     // ⚠️ TUNE: 20% slower than reference
    },
    confidence: {
      minimum: 0.3,           // ⚠️ TUNE: Reject frames below this
      warning: 0.5,           // ⚠️ TUNE: Warn user if average below this
    },
    poseQuality: {
      minKeypoints: 10,       // ⚠️ TUNE: Out of 17 MoveNet keypoints
      minConfidence: 0.5,     // ⚠️ TUNE: Average confidence threshold
    },
  } as GeneralErrorConfig,
};

/**
 * Get threshold for specific error
 */
export function getThreshold(
  bodyPart: 'shoulder' | 'knee' | 'elbow',
  errorType: string,
  severity: 'warning' | 'critical'
): number {
  const config = ErrorDetectionConfig[bodyPart] as any;
  const errorConfig = config[errorType];

  if (!errorConfig) {
    throw new Error(`Unknown error type: ${errorType}`);
  }

  // Handle different naming conventions
  if (severity === 'warning') {
    return errorConfig.warning_cm || errorConfig.warning_deg || errorConfig.warning_percent || 0;
  } else {
    return errorConfig.critical_cm || errorConfig.critical_deg || errorConfig.critical_percent || 0;
  }
}

/**
 * Update threshold (for tuning tool)
 */
export function updateThreshold(
  bodyPart: 'shoulder' | 'knee' | 'elbow',
  errorType: string,
  severity: 'warning' | 'critical',
  value: number
): void {
  const config = ErrorDetectionConfig[bodyPart] as any;
  const errorConfig = config[errorType];

  if (!errorConfig) {
    throw new Error(`Unknown error type: ${errorType}`);
  }

  // Update based on naming convention
  if ('warning_cm' in errorConfig) {
    if (severity === 'warning') errorConfig.warning_cm = value;
    else errorConfig.critical_cm = value;
  } else if ('warning_deg' in errorConfig) {
    if (severity === 'warning') errorConfig.warning_deg = value;
    else errorConfig.critical_deg = value;
  } else if ('warning_percent' in errorConfig) {
    if (severity === 'warning') errorConfig.warning_percent = value;
    else errorConfig.critical_percent = value;
  }
}

/**
 * Export configuration as JSON (for saving to file)
 */
export function exportConfig(): string {
  return JSON.stringify(ErrorDetectionConfig, null, 2);
}

/**
 * Import configuration from JSON (for loading from file)
 */
export function importConfig(json: string): void {
  try {
    const imported = JSON.parse(json);

    // Validate structure
    if (!imported.shoulder || !imported.knee || !imported.elbow || !imported.general) {
      throw new Error('Invalid config structure');
    }

    // Deep merge
    Object.assign(ErrorDetectionConfig.shoulder, imported.shoulder);
    Object.assign(ErrorDetectionConfig.knee, imported.knee);
    Object.assign(ErrorDetectionConfig.elbow, imported.elbow);
    Object.assign(ErrorDetectionConfig.general, imported.general);

    console.log('[Config] Successfully imported error detection config');
  } catch (error) {
    console.error('[Config] Failed to import config:', error);
    throw error;
  }
}

/**
 * Reset to default values
 */
export function resetToDefaults(): void {
  // Re-import this file to get fresh defaults
  console.log('[Config] Reset to default thresholds');
  // In production, would reload from saved defaults
}

/**
 * Validation helper: Check if thresholds are reasonable
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that critical > warning for all thresholds
  const checkPair = (category: string, error: string, config: any) => {
    const warningKey = Object.keys(config).find(k => k.startsWith('warning'));
    const criticalKey = Object.keys(config).find(k => k.startsWith('critical'));

    if (warningKey && criticalKey) {
      if (config[criticalKey] <= config[warningKey]) {
        errors.push(`${category}.${error}: critical must be > warning`);
      }
    }
  };

  // Validate each error type
  Object.entries(ErrorDetectionConfig.shoulder).forEach(([error, config]) => {
    checkPair('shoulder', error, config);
  });

  Object.entries(ErrorDetectionConfig.knee).forEach(([error, config]) => {
    checkPair('knee', error, config);
  });

  Object.entries(ErrorDetectionConfig.elbow).forEach(([error, config]) => {
    checkPair('elbow', error, config);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
