import { PoseLandmark, JointAngle, AngleCalculationConfig } from '../types/pose';
import { Vector3D } from '../types/common';
import { AnatomicalPlane } from '../types/biomechanics';
import { angleBetweenVectors, projectVectorOntoPlane } from '@utils/vectorMath';
import { findLandmark } from './pose/landmarkLookup';

type LandmarkTriplet = [proximal: string, vertex: string, distal: string];

/**
 * Joints as [proximal, vertex, distal] landmark names. MoveNet-17 and MediaPipe-33
 * share these names; heel/foot_index (ankle angles) exist only in MediaPipe-33.
 */
const JOINT_LANDMARKS: Record<string, LandmarkTriplet> = {
  left_elbow: ['left_shoulder', 'left_elbow', 'left_wrist'],
  right_elbow: ['right_shoulder', 'right_elbow', 'right_wrist'],
  left_shoulder: ['left_elbow', 'left_shoulder', 'left_hip'],
  right_shoulder: ['right_elbow', 'right_shoulder', 'right_hip'],
  left_hip: ['left_shoulder', 'left_hip', 'left_knee'],
  right_hip: ['right_shoulder', 'right_hip', 'right_knee'],
  left_knee: ['left_hip', 'left_knee', 'left_ankle'],
  right_knee: ['right_hip', 'right_knee', 'right_ankle'],
  left_ankle: ['left_knee', 'left_ankle', 'left_foot_index'],
  right_ankle: ['right_knee', 'right_ankle', 'right_foot_index'],
};

/** camelCase joint names accepted by getJointAngle (e.g. 'leftElbow' -> 'left_elbow') */
const toSnakeCase = (jointName: string): string =>
  jointName.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export class GoniometerService {
  private readonly config: Required<AngleCalculationConfig>;
  private angleHistory: Map<string, number[]> = new Map();

  constructor(config: AngleCalculationConfig = {}) {
    this.config = {
      smoothingWindow: 5,
      minConfidence: 0.5,
      use3D: true, // ✅ Enable 3D calculations by default for Gate 9
      ...config,
    };
  }

  /**
   * Calculate angle between three points (in degrees)
   */
  calculateAngle(
    pointA: PoseLandmark,
    pointB: PoseLandmark, // Joint/vertex point
    pointC: PoseLandmark,
    jointName: string
  ): JointAngle {
    // Check confidence thresholds
    const minVisibility = Math.min(
      pointA.visibility,
      pointB.visibility,
      pointC.visibility
    );

    if (minVisibility < this.config.minConfidence) {
      return {
        jointName,
        angle: 0,
        confidence: minVisibility,
        isValid: false,
      };
    }

    let angle: number;

    if (this.config.use3D && pointA.z !== undefined) {
      angle = this.calculate3DAngle(pointA, pointB, pointC);
    } else {
      angle = this.calculate2DAngle(pointA, pointB, pointC);
    }

    // Apply smoothing only if enabled (smoothingWindow > 1)
    if (this.config.smoothingWindow && this.config.smoothingWindow > 1) {
      angle = this.smoothAngle(jointName, angle);
    }

    return {
      jointName,
      angle,
      confidence: minVisibility,
      isValid: true,
      vectors: {
        BA: this.createVector(pointB, pointA),
        BC: this.createVector(pointB, pointC),
      },
    };
  }

  /**
   * Calculate 2D angle between three points
   */
  private calculate2DAngle(
    pointA: PoseLandmark,
    pointB: PoseLandmark,
    pointC: PoseLandmark
  ): number {
    const vectorBA = {
      x: pointA.x - pointB.x,
      y: pointA.y - pointB.y,
    };

    const vectorBC = {
      x: pointC.x - pointB.x,
      y: pointC.y - pointB.y,
    };

    const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;

    const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2);
    const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2);

    const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
    const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return (angleRadians * 180) / Math.PI;
  }

  /**
   * Calculate 3D angle between three points
   */
  private calculate3DAngle(
    pointA: PoseLandmark,
    pointB: PoseLandmark,
    pointC: PoseLandmark
  ): number {
    const vectorBA: Vector3D = {
      x: pointA.x - pointB.x,
      y: pointA.y - pointB.y,
      z: (pointA.z || 0) - (pointB.z || 0),
    };

    const vectorBC: Vector3D = {
      x: pointC.x - pointB.x,
      y: pointC.y - pointB.y,
      z: (pointC.z || 0) - (pointB.z || 0),
    };

    const dotProduct =
      vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y + vectorBA.z * vectorBC.z;

    const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2 + vectorBA.z ** 2);
    const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2 + vectorBC.z ** 2);

    const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
    const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return (angleRadians * 180) / Math.PI;
  }

  /**
   * Calculate angle between two vectors in a specific anatomical plane
   * Projects vectors onto the plane before calculating the angle
   *
   * @param vector1 - First 3D vector
   * @param vector2 - Second 3D vector
   * @param plane - Anatomical plane for measurement
   * @param jointName - Name of the joint being measured
   * @returns Joint angle with plane information
   *
   * @example
   * const humerusVector = subtract3D(elbow, shoulder);
   * const thoraxVector = subtract3D(shoulderCenter, hipCenter);
   * const angle = goniometer.calculateAngleInPlane(
   *   humerusVector,
   *   thoraxVector,
   *   scapularPlane,
   *   'left_shoulder_abduction'
   * );
   */
  calculateAngleInPlane(
    vector1: Vector3D,
    vector2: Vector3D,
    plane: AnatomicalPlane,
    jointName: string
  ): JointAngle {
    // Project vectors onto the anatomical plane
    const v1Projected = projectVectorOntoPlane(vector1, plane.normal);
    const v2Projected = projectVectorOntoPlane(vector2, plane.normal);

    // Calculate angle between projected vectors
    const angle = angleBetweenVectors(v1Projected, v2Projected);

    return {
      jointName,
      angle,
      confidence: 0.9, // High confidence for plane-projected angles
      isValid: true,
      vectors: {
        BA: v1Projected,
        BC: v2Projected,
      },
      plane: plane.name,
    };
  }

  /**
   * Apply smoothing to angle measurements
   */
  smoothAngle(jointName: string, newAngle: number, windowSize?: number): number {
    if (!this.angleHistory.has(jointName)) {
      this.angleHistory.set(jointName, []);
    }

    const history = this.angleHistory.get(jointName)!;
    history.push(newAngle);

    const window = windowSize ?? this.config.smoothingWindow;

    // Keep only the last N measurements
    while (history.length > window) {
      history.shift();
    }

    // Calculate moving average
    const sum = history.reduce((acc, val) => acc + val, 0);
    return sum / history.length;
  }

  /**
   * Create a vector from two points
   */
  private createVector(from: PoseLandmark, to: PoseLandmark): Vector3D {
    return {
      x: to.x - from.x,
      y: to.y - from.y,
      z: (to.z || 0) - (from.z || 0),
    };
  }

  /**
   * Calculate all major joint angles from pose landmarks
   */
  calculateAllJointAngles(landmarks: PoseLandmark[]): Map<string, JointAngle> {
    const angles = new Map<string, JointAngle>();

    for (const [jointName, names] of Object.entries(JOINT_LANDMARKS)) {
      const [proximal, vertex, distal] = names.map((name) =>
        findLandmark(landmarks, name)
      );
      if (proximal && vertex && distal) {
        angles.set(jointName, this.calculateAngle(proximal, vertex, distal, jointName));
      }
    }

    return angles;
  }

  /**
   * Get joint angle by name
   */
  getJointAngle(jointName: string, landmarks: PoseLandmark[]): number | null {
    const names = JOINT_LANDMARKS[toSnakeCase(jointName)];
    if (!names) {
      return null;
    }
    const [proximal, vertex, distal] = names.map((name) => findLandmark(landmarks, name));
    if (!proximal || !vertex || !distal) {
      return null;
    }

    const angle = this.calculateAngle(proximal, vertex, distal, jointName);

    return angle.isValid ? angle.angle : null;
  }

  /**
   * Get all joint angles
   */
  getAllJointAngles(landmarks: PoseLandmark[]): Record<string, number> {
    // Ankle angles need heel/foot landmarks, so they're only returned for MediaPipe-33 poses
    const joints = [
      'leftElbow',
      'rightElbow',
      'leftKnee',
      'rightKnee',
      'leftShoulder',
      'rightShoulder',
      'leftHip',
      'rightHip',
      'leftAnkle',
      'rightAnkle',
    ];
    const angles: Record<string, number> = {};

    for (const joint of joints) {
      const angle = this.getJointAngle(joint, landmarks);
      if (angle !== null) {
        angles[joint] = angle;
      }
    }

    return angles;
  }

  /**
   * Clear angle history (alias for resetHistory)
   */
  clearAngleHistory(jointName?: string): void {
    this.resetHistory(jointName);
  }

  /**
   * Reset angle history for all or specific joints
   */
  resetHistory(jointName?: string): void {
    if (jointName) {
      this.angleHistory.delete(jointName);
    } else {
      this.angleHistory.clear();
    }
  }

  /**
   * Get angle history for a specific joint
   */
  getAngleHistory(jointName: string): number[] {
    return this.angleHistory.get(jointName) || [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AngleCalculationConfig>): void {
    Object.assign(this.config, newConfig);
  }
}

// Singleton instance
export const goniometerService = new GoniometerService();
