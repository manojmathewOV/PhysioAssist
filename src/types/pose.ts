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
  worldLandmarks?: any[];
  inferenceTime?: number; // V2: ML inference time in milliseconds
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

// Re-export Vector3D from common for backward compatibility
export type { Vector3D } from './common';
