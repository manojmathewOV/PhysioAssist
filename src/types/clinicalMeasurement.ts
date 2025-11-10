/**
 * Clinical Measurement Type Definitions
 * Gate 10A: Clinical-grade joint ROM measurements with compensation detection
 *
 * Based on ISB standards and clinical goniometry best practices
 */

import { AnatomicalReferenceFrame, AnatomicalPlane } from './biomechanics';

/**
 * Comprehensive clinical joint measurement result
 * Includes primary/secondary joints, compensations, and quality assessment
 */
export interface ClinicalJointMeasurement {
  /** Primary joint being measured */
  primaryJoint: {
    name: string;
    type: 'shoulder' | 'elbow' | 'knee' | 'hip' | 'ankle';
    angle: number; // Degrees
    angleType: 'flexion' | 'extension' | 'abduction' | 'adduction' | 'external_rotation' | 'internal_rotation';
    targetAngle?: number; // Clinical target (e.g., 160° for shoulder flexion)
    percentOfTarget?: number; // Percentage of target achieved
    clinicalGrade?: 'excellent' | 'good' | 'fair' | 'limited';
    signedAngle?: number; // For rotation: positive = external, negative = internal

    // Advanced: Scapulohumeral rhythm (shoulder abduction only)
    components?: {
      glenohumeral: number; // True shoulder contribution
      scapulothoracic: number; // Scapular contribution
      rhythm: number; // Ratio (glenohumeral / scapulothoracic)
      rhythmNormal: boolean; // Within 2:1 to 3:1 range
    };
  };

  /** Secondary joints monitored for validation or gating */
  secondaryJoints: {
    [jointName: string]: {
      angle: number;
      withinTolerance: boolean;
      tolerance?: number;
      purpose: 'validation' | 'gating' | 'reference';
      deviation?: number;
      warning?: string;
    };
  };

  /** Reference frames used for measurement */
  referenceFrames: {
    global: AnatomicalReferenceFrame;
    local: AnatomicalReferenceFrame; // Segment frame (e.g., humerus, forearm)
    measurementPlane: AnatomicalPlane;
  };

  /** Detected compensation patterns */
  compensations: CompensationPattern[];

  /** Measurement quality assessment */
  quality: MeasurementQuality;

  /** Timestamp of measurement */
  timestamp: number;
}

/**
 * Compensation pattern detected during measurement
 * Indicates alternative movement strategies used to achieve ROM
 */
export interface CompensationPattern {
  /** Type of compensation */
  type:
    | 'trunk_lean'
    | 'trunk_rotation'
    | 'shoulder_hiking'
    | 'elbow_flexion'
    | 'hip_hike'
    | 'knee_valgus'
    | 'contralateral_lean';

  /** Severity grading */
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';

  /** Magnitude in degrees or units */
  magnitude: number;

  /** Which joint is affected by this compensation */
  affectsJoint: string;

  /** Clinical interpretation note */
  clinicalNote?: string;

  /** Timestamp when detected */
  timestamp?: number;
}

/**
 * Measurement quality assessment
 * Provides confidence in measurement reliability
 */
export interface MeasurementQuality {
  /** Overall quality grade */
  overall: 'excellent' | 'good' | 'fair' | 'poor';

  /** Depth reliability (higher if real depth data available) */
  depthReliability: number; // 0-1

  /** Average landmark visibility for required landmarks */
  landmarkVisibility: number; // 0-1

  /** Anatomical frame stability/confidence */
  frameStability: number; // 0-1

  /** Orientation match (does view match requirements?) */
  orientationMatch?: number; // 0-1

  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Clinical thresholds configuration
 * Defines target ROM values and tolerance ranges for each measurement
 */
export interface ClinicalThresholds {
  shoulder: {
    forwardFlexion: {
      target: number; // Degrees (normal: 160°)
      minAcceptable: number; // Minimum for 'good' grade
    };
    abduction: {
      target: number; // Degrees (normal: 160°)
      minAcceptable: number;
    };
    externalRotation: {
      target: number; // Degrees (normal: 90°)
      elbowAngleTolerance: number; // ±10° tolerance for elbow gating
    };
    internalRotation: {
      target: number; // Degrees (normal: 70°)
    };
    scapulohumeralRhythm: {
      min: number; // Minimum ratio (normal: 2:1)
      max: number; // Maximum ratio (normal: 3:1)
    };
  };
  elbow: {
    flexion: {
      target: number; // Degrees (normal: 150°)
      minAcceptable: number;
    };
    extension: {
      target: number; // Degrees (normal: 0° = full extension)
    };
  };
  knee: {
    flexion: {
      target: number; // Degrees (normal: 135°)
      minAcceptable: number;
    };
    extension: {
      target: number; // Degrees (normal: 0°)
    };
  };
  hip: {
    flexion: {
      target: number;
      minAcceptable: number;
    };
    abduction: {
      target: number;
      minAcceptable: number;
    };
  };
}

/**
 * Default clinical thresholds based on ISB standards and clinical literature
 *
 * References:
 * - Norkin & White (2016): Measurement of Joint Motion: A Guide to Goniometry
 * - American Academy of Orthopaedic Surgeons (AAOS) guidelines
 * - ISB recommendations for joint coordinate systems
 */
export const DEFAULT_CLINICAL_THRESHOLDS: ClinicalThresholds = {
  shoulder: {
    forwardFlexion: {
      target: 160, // Full flexion
      minAcceptable: 120, // Functional minimum
    },
    abduction: {
      target: 160, // Full abduction
      minAcceptable: 120,
    },
    externalRotation: {
      target: 90, // With elbow at 90°
      elbowAngleTolerance: 10, // ±10° tolerance
    },
    internalRotation: {
      target: 70, // With elbow at 90°
    },
    scapulohumeralRhythm: {
      min: 2.0, // 2:1 ratio (glenohumeral : scapulothoracic)
      max: 3.5, // 3.5:1 maximum
    },
  },
  elbow: {
    flexion: {
      target: 150, // Full flexion
      minAcceptable: 130,
    },
    extension: {
      target: 0, // Full extension = straight arm
    },
  },
  knee: {
    flexion: {
      target: 135, // Full flexion
      minAcceptable: 110,
    },
    extension: {
      target: 0, // Full extension = straight leg
    },
  },
  hip: {
    flexion: {
      target: 120,
      minAcceptable: 90,
    },
    abduction: {
      target: 45,
      minAcceptable: 30,
    },
  },
};

/**
 * Measurement context for multi-angle capture workflows
 * Tracks which angles have been captured for complete assessment
 */
export interface MeasurementContext {
  exerciseType: string;
  capturedAngles: {
    frontal?: ClinicalJointMeasurement;
    sagittal?: ClinicalJointMeasurement;
    posterior?: ClinicalJointMeasurement;
  };
  completionStatus: {
    required: string[]; // Required angles for this exercise
    captured: string[]; // Captured so far
    isComplete: boolean;
  };
}

/**
 * Compensation detection configuration
 * Defines thresholds for detecting abnormal movement patterns
 */
export interface CompensationDetectionConfig {
  trunkLean: {
    threshold: number; // Degrees from vertical
    severityThresholds: {
      minimal: number;
      mild: number;
      moderate: number;
      severe: number;
    };
  };
  trunkRotation: {
    threshold: number; // Degrees from frontal
    severityThresholds: {
      minimal: number;
      mild: number;
      moderate: number;
      severe: number;
    };
  };
  shoulderHiking: {
    threshold: number; // Shoulder line tilt in degrees
    severityThresholds: {
      minimal: number;
      mild: number;
      moderate: number;
      severe: number;
    };
  };
}

/**
 * Default compensation detection configuration
 */
export const DEFAULT_COMPENSATION_CONFIG: CompensationDetectionConfig = {
  trunkLean: {
    threshold: 10, // >10° from vertical
    severityThresholds: {
      minimal: 5,
      mild: 10,
      moderate: 20,
      severe: 30,
    },
  },
  trunkRotation: {
    threshold: 15, // >15° from frontal
    severityThresholds: {
      minimal: 10,
      mild: 15,
      moderate: 25,
      severe: 40,
    },
  },
  shoulderHiking: {
    threshold: 5, // >5° shoulder line tilt
    severityThresholds: {
      minimal: 3,
      mild: 5,
      moderate: 10,
      severe: 15,
    },
  },
};
