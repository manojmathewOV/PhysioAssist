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
}

export interface AngleCalculationConfig {
  smoothingWindow?: number;
  minConfidence?: number;
  use3D?: boolean;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}
