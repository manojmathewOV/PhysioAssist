import { PoseLandmark, JointAngle, AngleCalculationConfig } from '@types/pose';
import { Vector3D } from '@types/common';

export class GoniometerService {
  private readonly config: AngleCalculationConfig;
  private angleHistory: Map<string, number[]> = new Map();

  constructor(config: AngleCalculationConfig = {}) {
    this.config = {
      smoothingWindow: 5,
      minConfidence: 0.5,
      use3D: false,
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

    // Define joint configurations (MoveNet 17 keypoints: 0-16)
    const jointConfigs = [
      // Arms
      { name: 'left_elbow', indices: [5, 7, 9] }, // shoulder-elbow-wrist
      { name: 'right_elbow', indices: [6, 8, 10] },
      { name: 'left_shoulder', indices: [7, 5, 11] }, // elbow-shoulder-hip
      { name: 'right_shoulder', indices: [8, 6, 12] },

      // Legs
      { name: 'left_knee', indices: [11, 13, 15] }, // hip-knee-ankle
      { name: 'right_knee', indices: [12, 14, 16] },
      { name: 'left_hip', indices: [5, 11, 13] }, // shoulder-hip-knee
      { name: 'right_hip', indices: [6, 12, 14] }, // shoulder-hip-knee
      // Note: Ankle angles not supported (MoveNet lacks toe keypoints)
    ];

    for (const config of jointConfigs) {
      if (
        landmarks[config.indices[0]] &&
        landmarks[config.indices[1]] &&
        landmarks[config.indices[2]]
      ) {
        const angle = this.calculateAngle(
          landmarks[config.indices[0]],
          landmarks[config.indices[1]],
          landmarks[config.indices[2]],
          config.name
        );
        angles.set(config.name, angle);
      }
    }

    return angles;
  }

  /**
   * Get joint angle by name
   */
  getJointAngle(jointName: string, landmarks: PoseLandmark[]): number | null {
    // MoveNet 17 keypoints (0-16 only)
    const jointConfigs: Record<string, number[]> = {
      leftElbow: [5, 7, 9],
      rightElbow: [6, 8, 10],
      leftKnee: [11, 13, 15],
      rightKnee: [12, 14, 16],
      leftShoulder: [7, 5, 11],
      rightShoulder: [8, 6, 12],
      leftHip: [5, 11, 13], // shoulder-hip-knee
      rightHip: [6, 12, 14], // shoulder-hip-knee
      // Note: Ankle angles not supported (MoveNet lacks toe keypoints)
    };

    const indices = jointConfigs[jointName];
    if (
      !indices ||
      !landmarks[indices[0]] ||
      !landmarks[indices[1]] ||
      !landmarks[indices[2]]
    ) {
      return null;
    }

    const angle = this.calculateAngle(
      landmarks[indices[0]],
      landmarks[indices[1]],
      landmarks[indices[2]],
      jointName
    );

    return angle.isValid ? angle.angle : null;
  }

  /**
   * Get all joint angles
   */
  getAllJointAngles(landmarks: PoseLandmark[]): Record<string, number> {
    // All joints supported by MoveNet (17 keypoints)
    const joints = [
      'leftElbow',
      'rightElbow',
      'leftKnee',
      'rightKnee',
      'leftShoulder',
      'rightShoulder',
      'leftHip',
      'rightHip',
      // Note: Ankle angles not supported (MoveNet lacks toe keypoints)
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
