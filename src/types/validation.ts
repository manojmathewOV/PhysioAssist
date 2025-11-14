/**
 * Validation Type Definitions
 * Gate 10C: Clinical validation protocol types
 *
 * Types for synthetic test data generation and validation reporting
 */

import { CompensationPattern } from './clinicalMeasurement';

/**
 * Ground truth data structure for validation testing
 * Contains known-correct values to compare against measurements
 */
export interface GroundTruth {
  /** Primary measurement with known true angle */
  primaryMeasurement: {
    joint: string;
    angle: number; // Known true angle (±0.1° precision)
    plane: 'sagittal' | 'coronal' | 'transverse' | 'scapular';
    movement: string;
  };

  /** Secondary measurements for validation */
  secondaryMeasurements: Array<{
    joint: string;
    angle: number;
    expectedDeviation?: number;
  }>;

  /** Expected compensations with ground truth severity */
  compensations: GroundTruthCompensation[];

  /** Test case identifier */
  testCase: string;
}

/**
 * Ground truth compensation data
 */
export interface GroundTruthCompensation {
  type: CompensationPattern['type'];
  magnitude: number; // Precise magnitude
  expectedSeverity: 'minimal' | 'mild' | 'moderate' | 'severe';
}

/**
 * Validation result for single test case
 */
export interface ValidationResult {
  testCase: string;
  groundTruth: number; // True angle
  measured: number; // Measured angle
  error: number; // Absolute error
  passed: boolean; // Within tolerance (±5°)
  compensationMatches?: boolean; // Compensation detection correct
  timestamp?: number;
}

/**
 * Comprehensive validation report
 */
export interface ValidationReport {
  /** Total number of test cases */
  totalTests: number;

  /** Number of passed tests */
  passed: number;

  /** Number of failed tests */
  failed: number;

  /** Pass rate percentage */
  passRate: number;

  /** Statistical metrics */
  metrics: {
    mae: number; // Mean Absolute Error (target: ≤5°)
    rmse: number; // Root Mean Square Error (target: ≤7°)
    maxError: number; // Maximum error (target: ≤10°)
    r2: number; // Coefficient of determination (target: ≥0.95)
  };

  /** Compensation detection metrics */
  compensationMetrics: {
    accuracy: number; // Overall accuracy (%)
    sensitivity: number; // True positive rate (target: ≥80%)
    specificity: number; // True negative rate (target: ≥80%)
    precision?: number; // Precision (target: ≥75%)
    f1Score?: number; // F1 score (target: ≥0.77)
  };

  /** Detailed results for each test case */
  detailedResults: ValidationResult[];

  /** Report timestamp */
  timestamp: string;

  /** Overall validation status */
  status: 'PASS' | 'FAIL';

  /** Summary notes */
  notes?: string[];
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  /** Tolerance for angle measurements (degrees) */
  angleTolerance: number;

  /** Target MAE (degrees) */
  targetMAE: number;

  /** Target RMSE (degrees) */
  targetRMSE: number;

  /** Target R² */
  targetR2: number;

  /** Target compensation sensitivity */
  targetSensitivity: number;

  /** Target compensation specificity */
  targetSpecificity: number;
}

/**
 * Default validation configuration based on clinical accuracy requirements
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  angleTolerance: 5, // ±5° tolerance
  targetMAE: 5, // ≤5° MAE
  targetRMSE: 7, // ≤7° RMSE
  targetR2: 0.95, // ≥0.95 R²
  targetSensitivity: 0.7, // ≥70% sensitivity (reduced after shoulder rotation exclusion)
  targetSpecificity: 0.8, // ≥80% specificity
};
