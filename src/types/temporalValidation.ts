/**
 * Temporal Validation Types
 * Gate 10D: Multi-frame temporal consistency validation
 *
 * Validates measurement stability and consistency across video sequences
 */

import { ProcessedPoseData } from './pose';
import { ClinicalJointMeasurement } from './clinicalMeasurement';

/**
 * Temporal sequence of pose frames
 */
export interface TemporalPoseSequence {
  frames: ProcessedPoseData[];
  frameRate: number; // FPS (frames per second)
  duration: number; // Seconds
  sequenceId: string;
  metadata?: {
    movement?: string;
    side?: 'left' | 'right';
    expectedTrajectory?: 'increasing' | 'decreasing' | 'static' | 'oscillating';
    description?: string;
  };
}

/**
 * Temporal measurement sequence
 */
export interface TemporalMeasurementSequence {
  measurements: ClinicalJointMeasurement[];
  timestamps: number[]; // Milliseconds
  frameRate: number;
  duration: number;
  sequenceId: string;
}

/**
 * Frame-to-frame consistency metrics
 */
export interface FrameToFrameConsistency {
  meanDelta: number; // Average angle change between consecutive frames (degrees)
  maxDelta: number; // Maximum angle change between consecutive frames (degrees)
  stdDevDelta: number; // Standard deviation of frame-to-frame changes
  suddenJumps: number; // Count of changes exceeding threshold (default: 15°)
  smoothnessScore: number; // 0-1, higher = smoother (1 - normalizedStdDev)
  passed: boolean; // True if no sudden jumps and smoothness acceptable
}

/**
 * Temporal trajectory validation
 */
export interface TrajectoryValidation {
  expectedPattern: 'increasing' | 'decreasing' | 'static' | 'oscillating';
  observedPattern: 'increasing' | 'decreasing' | 'static' | 'oscillating' | 'erratic';
  patternMatch: boolean;
  trendConsistency: number; // 0-1, how well trajectory matches expected pattern
  reversals: number; // Number of direction changes (low for increasing/decreasing, high for oscillating)
  totalRangeOfMotion: number; // Degrees from min to max
  averageVelocity: number; // Degrees per second
  peakVelocity: number; // Maximum degrees per second
  notes: string[];
}

/**
 * Temporal compensation tracking
 */
export interface TemporalCompensationTracking {
  compensationType: string;
  firstDetectedFrame: number;
  lastDetectedFrame: number;
  totalFramesDetected: number;
  persistenceRate: number; // Percentage of frames with this compensation (0-100)
  severityProgression: Array<{
    frame: number;
    severity: 'minimal' | 'mild' | 'moderate' | 'severe';
    magnitude: number;
  }>;
  isPersistent: boolean; // True if detected in >50% of frames
  isProgressive: boolean; // True if severity increases over time
}

/**
 * Quality degradation over sequence
 */
export interface QualityDegradation {
  initialQuality: number; // Quality score of first frame (0-1)
  finalQuality: number; // Quality score of last frame (0-1)
  meanQuality: number; // Average quality across sequence
  minQuality: number; // Minimum quality encountered
  degradationRate: number; // Change in quality per second
  framesBelow Threshold: number; // Count of frames with quality < 0.7
  qualityDropouts: number; // Count of sudden quality drops (>0.2 drop)
  passed: boolean; // True if quality remains acceptable throughout
}

/**
 * Temporal validation result for a single sequence
 */
export interface TemporalValidationResult {
  sequenceId: string;
  frameCount: number;
  duration: number;
  frameRate: number;

  // Consistency metrics
  consistency: FrameToFrameConsistency;

  // Trajectory validation
  trajectory: TrajectoryValidation;

  // Compensation tracking
  compensations: TemporalCompensationTracking[];

  // Quality analysis
  quality: QualityDegradation;

  // Overall assessment
  passed: boolean;
  issues: string[];
  timestamp: number;
}

/**
 * Temporal validation report across multiple sequences
 */
export interface TemporalValidationReport {
  totalSequences: number;
  passedSequences: number;
  failedSequences: number;
  passRate: number;

  // Aggregate metrics
  aggregateMetrics: {
    meanSmoothness: number;
    meanConsistency: number;
    meanQuality: number;
    totalSuddenJumps: number;
    totalQualityDropouts: number;
    persistentCompensationRate: number; // % of sequences with persistent compensations
  };

  // Per-movement analysis
  perMovementAnalysis: {
    [movement: string]: {
      sequences: number;
      passed: number;
      avgSmoothness: number;
      avgConsistency: number;
      commonIssues: string[];
    };
  };

  // Detailed results
  detailedResults: TemporalValidationResult[];

  // Overall status
  timestamp: string;
  status: 'PASS' | 'FAIL';
  notes: string[];
}

/**
 * Temporal validation configuration
 */
export interface TemporalValidationConfig {
  // Consistency thresholds
  maxFrameToFrameDelta: number; // Maximum acceptable angle change between frames (degrees)
  smoothnessThreshold: number; // Minimum acceptable smoothness score (0-1)

  // Quality thresholds
  minQualityScore: number; // Minimum acceptable quality score (0-1)
  maxQualityDropouts: number; // Maximum allowed sudden quality drops

  // Compensation thresholds
  persistenceThreshold: number; // Minimum % of frames to consider compensation persistent (0-100)

  // Trajectory thresholds
  minTrendConsistency: number; // Minimum acceptable trend consistency (0-1)
  maxReversals: number; // Maximum allowed direction changes for monotonic movements

  // General
  frameRate: number; // Expected frame rate (FPS)
  minSequenceDuration: number; // Minimum sequence duration (seconds)
  maxSequenceDuration: number; // Maximum sequence duration (seconds)
}

/**
 * Default temporal validation configuration
 * Based on clinical requirements and 30 FPS video standard
 */
export const DEFAULT_TEMPORAL_CONFIG: TemporalValidationConfig = {
  // At 30 FPS, a 15° jump means 450°/s velocity - clearly unrealistic for ROM
  maxFrameToFrameDelta: 15, // degrees
  smoothnessThreshold: 0.75, // 75% smoothness minimum

  // Quality requirements
  minQualityScore: 0.7, // 70% quality minimum
  maxQualityDropouts: 2, // Allow max 2 sudden quality drops

  // Compensation requirements
  persistenceThreshold: 50, // Compensation in >50% of frames = persistent

  // Trajectory requirements
  minTrendConsistency: 0.8, // 80% consistency with expected pattern
  maxReversals: 2, // Max 2 direction changes for increasing/decreasing movements

  // General
  frameRate: 30, // 30 FPS standard
  minSequenceDuration: 2, // Minimum 2 seconds
  maxSequenceDuration: 10, // Maximum 10 seconds
};

/**
 * Movement trajectory patterns for different ROM tests
 */
export const EXPECTED_TRAJECTORIES: Record<string, 'increasing' | 'decreasing' | 'static' | 'oscillating'> = {
  // Increasing ROM (0° → max)
  'shoulder_flexion_active': 'increasing',
  'shoulder_abduction_active': 'increasing',
  'elbow_flexion_active': 'increasing',
  'knee_flexion_active': 'increasing',

  // Decreasing ROM (max → 0°)
  'shoulder_flexion_return': 'decreasing',
  'shoulder_abduction_return': 'decreasing',
  'elbow_extension': 'decreasing',
  'knee_extension': 'decreasing',

  // Static poses (isometric)
  'shoulder_flexion_hold': 'static',
  'plank_hold': 'static',

  // Oscillating (repetitions)
  'shoulder_flexion_reps': 'oscillating',
  'elbow_flexion_reps': 'oscillating',
};
