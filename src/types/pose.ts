import { Vector3D } from './common';

export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility: number;
  index: number;
  name: string;
}

export interface ProcessedPoseData {
  landmarks: PoseLandmark[];
  timestamp: number;
  confidence: number;
  /** World-space 3D landmarks (raw model output, type depends on ML framework) */
  worldLandmarks?: unknown[];
  inferenceTime?: number; // V2: ML inference time in milliseconds

  // Gate 9B: Metadata for schema, orientation, and quality
  /** Schema identifier for the pose detection model */
  schemaId?: 'movenet-17' | 'mediapipe-33';
  /** Detected orientation of the subject relative to camera */
  viewOrientation?: 'frontal' | 'sagittal' | 'posterior';
  /** Estimated camera azimuth angle in degrees (0-360) */
  cameraAzimuth?: number;
  /** True if depth (z-coordinate) data is available */
  hasDepth?: boolean;
  /** Quality score for the pose detection [0, 1] */
  qualityScore?: number;
}

export interface PoseDetectionConfig {
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  smoothLandmarks?: boolean;
  enableSegmentation?: boolean;
  frameSkipRate?: number;
}

export interface JointAngle {
  jointName: string;
  angle: number;
  confidence: number;
  isValid: boolean;
  vectors?: {
    BA: Vector3D;
    BC: Vector3D;
  };
  /** Optional: Anatomical plane in which angle was measured */
  plane?: 'sagittal' | 'coronal' | 'transverse' | 'scapular';
}

export interface AngleCalculationConfig {
  smoothingWindow?: number;
  minConfidence?: number;
  use3D?: boolean;
}

/**
 * Landmark definition in a pose schema
 * Maps model-specific indices to anatomical names
 */
export interface LandmarkDefinition {
  /** Landmark index in the model output */
  index: number;
  /** Anatomical name (e.g., 'left_shoulder', 'right_knee') */
  name: string;
  /** Alternative names for the landmark */
  aliases?: string[];
  /** Anatomical group this landmark belongs to */
  group: 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
}

/**
 * Anatomical group definition
 * Groups related landmarks for efficient processing
 */
export interface AnatomicalGroup {
  /** Group name */
  name: string;
  /** Landmark indices in this group */
  landmarkIndices: number[];
  /** Minimum number of visible landmarks for valid group */
  minVisibleForValid: number;
}

/**
 * Pose detection schema
 * Defines the structure and metadata for a specific pose detection model
 *
 * @example MoveNet 17 Schema
 * {
 *   id: 'movenet-17',
 *   modelName: 'MoveNet Lightning',
 *   landmarkCount: 17,
 *   landmarks: [...],
 *   groups: {...}
 * }
 */
export interface PoseSchema {
  /** Unique identifier for this schema */
  id: 'movenet-17' | 'mediapipe-33';
  /** Human-readable model name */
  modelName: string;
  /** Total number of landmarks */
  landmarkCount: number;
  /** Landmark definitions with indices and names */
  landmarks: LandmarkDefinition[];
  /** Anatomical groups for efficient processing */
  groups: Record<string, AnatomicalGroup>;
  /** Whether this schema provides 3D world coordinates */
  provides3D: boolean;
  /** Default confidence threshold for this model */
  defaultConfidenceThreshold: number;
  /** Additional metadata about the model */
  metadata?: {
    version?: string;
    source?: string;
    notes?: string;
  };
}

// Re-export Vector3D from common for backward compatibility
export type { Vector3D } from './common';
