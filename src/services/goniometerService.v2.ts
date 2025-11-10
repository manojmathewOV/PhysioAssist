/**
 * Goniometer Service V2
 * Gate 9B.6: Schema-aware, plane-projected, ISB-compliant joint angle measurement
 *
 * Key Improvements over V1:
 * - ✅ Schema-aware: Works with MoveNet-17, MediaPipe-33, and future schemas
 * - ✅ Systematic plane projection: ALL measurements use anatomical planes
 * - ✅ Euler angles: Shoulder measurements with Y-X-Y decomposition (ISB standard)
 * - ✅ Cached frames: Consumes pre-computed anatomical frames (no redundant calculation)
 * - ✅ Clinical accuracy: Plane projection eliminates camera perspective errors
 *
 * Research Foundation:
 * - Wu et al. (2005): ISB standards for joint coordinate systems
 * - Nature Scientific Reports (2025): Plane projection achieves ±5° accuracy
 *
 * @example
 * const goniometer = new GoniometerServiceV2();
 * const elbowAngle = goniometer.calculateJointAngle(poseData, 'left_elbow');
 * const shoulderEuler = goniometer.calculateShoulderEulerAngles(poseData, 'left');
 */

import {
  PoseLandmark,
  JointAngle,
  AngleCalculationConfig,
  ProcessedPoseData,
} from '@types/pose';
import { Vector3D } from '@types/common';
import { AnatomicalPlane, AnatomicalReferenceFrame } from '@types/biomechanics';
import {
  angleBetweenVectors,
  projectVectorOntoPlane,
  dotProduct,
  normalize,
  crossProduct,
} from '@utils/vectorMath';
import { PoseSchemaRegistry } from './pose/PoseSchemaRegistry';
import { AnatomicalReferenceService } from './biomechanics/AnatomicalReferenceService';

/**
 * Joint angle measurement with additional metadata
 * Extended from base JointAngle type
 */
export interface JointAngleMeasurement extends JointAngle {
  /** Measurement plane used for angle calculation */
  measurementPlane: AnatomicalPlane;
  /** Timestamp of measurement */
  timestamp: number;
  /** For shoulder: Euler angle components */
  eulerComponents?: ShoulderEulerAngles;
}

/**
 * Shoulder Euler angles (ISB Y-X-Y sequence)
 * Represents 3 degrees of freedom in shoulder movement
 */
export interface ShoulderEulerAngles {
  /** Plane of elevation: 0° = sagittal (forward), 90° = coronal (sideways) */
  planeOfElevation: number;
  /** Elevation angle: 0° = arm down, 180° = arm overhead */
  elevation: number;
  /** Axial rotation: -90° = internal rotation, +90° = external rotation */
  rotation: number;
  /** Confidence based on landmark visibility */
  confidence: number;
}

/**
 * Rotation matrix (3x3) representing frame orientation
 */
type RotationMatrix = number[][];

export class GoniometerServiceV2 {
  private readonly config: AngleCalculationConfig;
  private angleHistory: Map<string, number[]> = new Map();
  private schemaRegistry: PoseSchemaRegistry;
  private anatomicalService: AnatomicalReferenceService;

  constructor(config: AngleCalculationConfig = {}) {
    this.config = {
      smoothingWindow: 5,
      minConfidence: 0.5,
      use3D: true, // Always use 3D for Gate 9B.6
      ...config,
    };

    this.schemaRegistry = PoseSchemaRegistry.getInstance();
    this.anatomicalService = new AnatomicalReferenceService();
  }

  /**
   * Calculate joint angle using schema-aware, plane-projected method
   * Gate 9B.6: Primary measurement method with systematic plane projection
   *
   * @param poseData - ProcessedPoseData with cached anatomical frames
   * @param jointName - Joint name (e.g., 'left_elbow', 'right_shoulder')
   * @returns Joint angle measurement with plane information
   *
   * @example
   * const elbowAngle = goniometer.calculateJointAngle(poseData, 'left_elbow');
   * console.log(`Elbow angle: ${elbowAngle.angle}° in ${elbowAngle.measurementPlane.name} plane`);
   */
  public calculateJointAngle(
    poseData: ProcessedPoseData,
    jointName: string
  ): JointAngleMeasurement {
    // 1. Get schema-aware landmark indices
    const indices = this.getJointLandmarkIndices(jointName, poseData.schemaId || 'movenet-17');

    // 2. Get landmarks
    const pointA = poseData.landmarks[indices.point1];
    const pointB = poseData.landmarks[indices.joint];
    const pointC = poseData.landmarks[indices.point2];

    // 3. Check confidence
    if (!this.meetsConfidenceThreshold([pointA, pointB, pointC])) {
      throw new Error(
        `Low confidence for ${jointName}: visibility < ${this.config.minConfidence}`
      );
    }

    // 4. Get cached anatomical frames
    const frames = poseData.cachedAnatomicalFrames;
    if (!frames) {
      throw new Error(
        'cachedAnatomicalFrames not available. Ensure Gate 9B.5 is complete and PoseDetectionServiceV2 is in use.'
      );
    }

    // 5. Determine measurement plane based on joint type
    const measurementPlane = this.getMeasurementPlane(jointName, frames.thorax);

    // 6. Create joint vectors
    const vector1 = this.createVector(pointB, pointA);
    const vector2 = this.createVector(pointB, pointC);

    // 7. ✅ ALWAYS project onto plane before calculating angle
    const angle = this.calculateAngleInPlane(vector1, vector2, measurementPlane);

    // 8. Temporal smoothing (if enabled)
    const smoothedAngle =
      this.config.smoothingWindow > 1
        ? this.smoothAngle(jointName, angle)
        : angle;

    return {
      jointName,
      angle: smoothedAngle,
      confidence: this.calculateConfidence([pointA, pointB, pointC]),
      isValid: true,
      vectors: {
        BA: vector1,
        BC: vector2,
      },
      plane: measurementPlane.name,
      measurementPlane,
      timestamp: poseData.timestamp,
    };
  }

  /**
   * Calculate shoulder Euler angles (ISB Y-X-Y sequence)
   * Gate 9B.6: Implements ISB standard for 3-DOF shoulder measurement
   *
   * Euler Decomposition:
   * - Y₁ rotation (planeOfElevation): Which plane arm is moving in
   * - X rotation (elevation): How high arm is raised
   * - Y₂ rotation (rotation): Internal/external rotation about humerus axis
   *
   * @param poseData - ProcessedPoseData with cached anatomical frames
   * @param side - Which shoulder ('left' or 'right')
   * @returns Shoulder Euler angles with confidence
   *
   * @example
   * const shoulderAngles = goniometer.calculateShoulderEulerAngles(poseData, 'left');
   * console.log(`Shoulder elevation: ${shoulderAngles.elevation}° in ${shoulderAngles.planeOfElevation}° plane`);
   * console.log(`Rotation: ${shoulderAngles.rotation}° (+ = external, - = internal)`);
   *
   * @see Wu et al. (2005) - ISB recommendation on joint coordinate systems
   */
  public calculateShoulderEulerAngles(
    poseData: ProcessedPoseData,
    side: 'left' | 'right'
  ): ShoulderEulerAngles {
    const frames = poseData.cachedAnatomicalFrames;
    if (!frames) {
      throw new Error('cachedAnatomicalFrames not available');
    }

    const thoraxFrame = frames.thorax;
    const humerusFrame = frames[`${side}_humerus`];

    if (!humerusFrame) {
      throw new Error(`Humerus frame not available for ${side} side. Check landmark visibility.`);
    }

    // Construct rotation matrix: R_humerus_wrt_thorax
    // This represents how humerus frame is rotated relative to thorax frame
    const R = this.constructRotationMatrix(thoraxFrame, humerusFrame);

    // Extract Y-X-Y Euler angles from rotation matrix
    // Based on ISB standard (Wu et al. 2005)

    // X rotation (elevation): angle about intermediate X-axis
    // Range: 0° (arm down) to 180° (arm overhead)
    const elevation = Math.acos(Math.max(-1, Math.min(1, R[1][1]))) * (180 / Math.PI);

    // Y1 rotation (plane of elevation): first rotation about Y-axis
    // 0° = sagittal plane (forward flexion)
    // 90° = coronal plane (abduction)
    // 180° = posterior plane (backward extension)
    const planeOfElevation = Math.atan2(R[0][1], R[2][1]) * (180 / Math.PI);

    // Y2 rotation (axial rotation): second rotation about Y-axis
    // Positive = external rotation, Negative = internal rotation
    // Range: -90° to +90°
    const rotation = Math.atan2(R[1][0], -R[1][2]) * (180 / Math.PI);

    // Confidence: Minimum of thorax and humerus frame confidences
    const confidence = Math.min(thoraxFrame.confidence, humerusFrame.confidence);

    return {
      planeOfElevation,
      elevation,
      rotation,
      confidence,
    };
  }

  /**
   * Construct 3x3 rotation matrix from two reference frames
   * Returns R_child_wrt_parent (how child frame is rotated relative to parent)
   *
   * @param parentFrame - Parent reference frame (e.g., thorax)
   * @param childFrame - Child reference frame (e.g., humerus)
   * @returns 3x3 rotation matrix
   *
   * @internal
   */
  private constructRotationMatrix(
    parentFrame: AnatomicalReferenceFrame,
    childFrame: AnatomicalReferenceFrame
  ): RotationMatrix {
    // Each frame has 3 orthonormal axes (x, y, z)
    // Rotation matrix columns are child axes expressed in parent coordinates
    // R[i][j] = dot product of child axis j with parent axis i

    const R: RotationMatrix = [
      [
        dotProduct(childFrame.xAxis, parentFrame.xAxis),
        dotProduct(childFrame.yAxis, parentFrame.xAxis),
        dotProduct(childFrame.zAxis, parentFrame.xAxis),
      ],
      [
        dotProduct(childFrame.xAxis, parentFrame.yAxis),
        dotProduct(childFrame.yAxis, parentFrame.yAxis),
        dotProduct(childFrame.zAxis, parentFrame.yAxis),
      ],
      [
        dotProduct(childFrame.xAxis, parentFrame.zAxis),
        dotProduct(childFrame.yAxis, parentFrame.zAxis),
        dotProduct(childFrame.zAxis, parentFrame.zAxis),
      ],
    ];

    return R;
  }

  /**
   * Calculate angle between two vectors projected onto a plane
   * Gate 9B.6: Core method for plane-projected angle calculation
   *
   * @param vector1 - First 3D vector
   * @param vector2 - Second 3D vector
   * @param plane - Anatomical plane for projection
   * @returns Angle in degrees (0-180°)
   *
   * @internal
   */
  private calculateAngleInPlane(
    vector1: Vector3D,
    vector2: Vector3D,
    plane: AnatomicalPlane
  ): number {
    // Project vectors onto the anatomical plane
    const v1Projected = projectVectorOntoPlane(vector1, plane.normal);
    const v2Projected = projectVectorOntoPlane(vector2, plane.normal);

    // Calculate angle between projected vectors
    const angle = angleBetweenVectors(v1Projected, v2Projected);

    return angle;
  }

  /**
   * Determine appropriate measurement plane for each joint
   * Gate 9B.6: Automatic plane selection based on ISB standards
   *
   * Joint-to-plane mapping:
   * - Shoulder: Scapular plane (35° from coronal)
   * - Elbow/Knee: Sagittal plane (flexion/extension)
   * - Hip: Coronal plane (abduction/adduction)
   *
   * @param jointName - Name of joint being measured
   * @param thoraxFrame - Thorax reference frame for plane definitions
   * @returns Anatomical plane for measurement
   *
   * @internal
   */
  private getMeasurementPlane(
    jointName: string,
    thoraxFrame: AnatomicalReferenceFrame
  ): AnatomicalPlane {
    // Shoulder: Measure in scapular plane (35° from coronal)
    // Clinically validated functional plane for shoulder abduction
    if (jointName.includes('shoulder')) {
      return this.anatomicalService.calculateScapularPlane(thoraxFrame);
    }

    // Elbow/Knee: Measure in sagittal plane (flexion/extension)
    if (jointName.includes('elbow') || jointName.includes('knee')) {
      return this.anatomicalService.calculateSagittalPlane(thoraxFrame);
    }

    // Hip: Measure in coronal plane (abduction/adduction)
    if (jointName.includes('hip')) {
      return this.anatomicalService.calculateCoronalPlane(thoraxFrame);
    }

    // Default: Sagittal plane
    return this.anatomicalService.calculateSagittalPlane(thoraxFrame);
  }

  /**
   * Resolve landmark indices dynamically from schema
   * Gate 9B.6: Schema-aware landmark resolution
   *
   * Works with any schema (MoveNet-17, MediaPipe-33, future models)
   * that has required landmarks with standardized anatomical names
   *
   * @param jointName - Joint name (e.g., 'left_elbow')
   * @param schemaId - Schema identifier ('movenet-17' | 'mediapipe-33')
   * @returns Landmark indices for 3-point angle calculation
   *
   * @throws Error if required landmarks not available in schema
   *
   * @internal
   */
  private getJointLandmarkIndices(
    jointName: string,
    schemaId: string
  ): { point1: number; joint: number; point2: number } {
    const schema = this.schemaRegistry.get(schemaId);

    // Define joint-to-landmark mapping (schema-agnostic anatomical names)
    const jointDefinitions: Record<string, [string, string, string]> = {
      left_elbow: ['left_shoulder', 'left_elbow', 'left_wrist'],
      right_elbow: ['right_shoulder', 'right_elbow', 'right_wrist'],
      left_knee: ['left_hip', 'left_knee', 'left_ankle'],
      right_knee: ['right_hip', 'right_knee', 'right_ankle'],
      left_shoulder: ['left_hip', 'left_shoulder', 'left_elbow'],
      right_shoulder: ['right_hip', 'right_shoulder', 'right_elbow'],
      left_hip: ['left_shoulder', 'left_hip', 'left_knee'],
      right_hip: ['right_shoulder', 'right_hip', 'right_knee'],
    };

    const landmarkNames = jointDefinitions[jointName];
    if (!landmarkNames) {
      throw new Error(`Unknown joint name: ${jointName}`);
    }

    const [lm1Name, lm2Name, lm3Name] = landmarkNames;

    // Look up indices in schema
    const lm1 = schema.landmarks.find((lm) => lm.name === lm1Name);
    const lm2 = schema.landmarks.find((lm) => lm.name === lm2Name);
    const lm3 = schema.landmarks.find((lm) => lm.name === lm3Name);

    if (!lm1 || !lm2 || !lm3) {
      throw new Error(
        `Joint "${jointName}" requires landmarks [${lm1Name}, ${lm2Name}, ${lm3Name}] ` +
          `which are not available in schema "${schemaId}"`
      );
    }

    return {
      point1: lm1.index,
      joint: lm2.index,
      point2: lm3.index,
    };
  }

  /**
   * Check if landmarks meet confidence threshold
   * @internal
   */
  private meetsConfidenceThreshold(landmarks: PoseLandmark[]): boolean {
    return landmarks.every((lm) => lm && lm.visibility >= this.config.minConfidence);
  }

  /**
   * Calculate overall confidence from landmark visibilities
   * @internal
   */
  private calculateConfidence(landmarks: PoseLandmark[]): number {
    const visibilities = landmarks.map((lm) => lm.visibility);
    return visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
  }

  /**
   * Create a vector from two points
   * @internal
   */
  private createVector(from: PoseLandmark, to: PoseLandmark): Vector3D {
    return {
      x: to.x - from.x,
      y: to.y - from.y,
      z: (to.z || 0) - (from.z || 0),
    };
  }

  /**
   * Apply temporal smoothing to angle measurements
   * Uses moving average over configurable window
   *
   * @param jointName - Joint name for history tracking
   * @param newAngle - New angle measurement
   * @returns Smoothed angle
   *
   * @internal
   */
  private smoothAngle(jointName: string, newAngle: number): number {
    if (!this.angleHistory.has(jointName)) {
      this.angleHistory.set(jointName, []);
    }

    const history = this.angleHistory.get(jointName)!;
    history.push(newAngle);

    // Keep only the last N measurements
    const window = this.config.smoothingWindow || 5;
    while (history.length > window) {
      history.shift();
    }

    // Calculate moving average
    const sum = history.reduce((acc, val) => acc + val, 0);
    return sum / history.length;
  }

  /**
   * Calculate all major joint angles from pose data
   * Gate 9B.6: Schema-aware batch calculation
   *
   * @param poseData - ProcessedPoseData with cached frames
   * @returns Map of joint names to angle measurements
   *
   * @example
   * const angles = goniometer.calculateAllJointAngles(poseData);
   * for (const [jointName, measurement] of angles.entries()) {
   *   console.log(`${jointName}: ${measurement.angle}°`);
   * }
   */
  public calculateAllJointAngles(
    poseData: ProcessedPoseData
  ): Map<string, JointAngleMeasurement> {
    const angles = new Map<string, JointAngleMeasurement>();

    // Define all joints to measure (schema-agnostic)
    const jointNames = [
      'left_elbow',
      'right_elbow',
      'left_knee',
      'right_knee',
      'left_shoulder',
      'right_shoulder',
      'left_hip',
      'right_hip',
    ];

    for (const jointName of jointNames) {
      try {
        const angle = this.calculateJointAngle(poseData, jointName);
        angles.set(jointName, angle);
      } catch (error) {
        // Skip joints with missing landmarks or low confidence
        continue;
      }
    }

    return angles;
  }

  /**
   * Reset angle history for all or specific joints
   */
  public resetHistory(jointName?: string): void {
    if (jointName) {
      this.angleHistory.delete(jointName);
    } else {
      this.angleHistory.clear();
    }
  }

  /**
   * Get angle history for a specific joint
   */
  public getAngleHistory(jointName: string): number[] {
    return this.angleHistory.get(jointName) || [];
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AngleCalculationConfig>): void {
    Object.assign(this.config, newConfig);
  }
}

// Export singleton instance
export const goniometerServiceV2 = new GoniometerServiceV2();
