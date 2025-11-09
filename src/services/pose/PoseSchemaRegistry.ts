import { PoseSchema, LandmarkDefinition, AnatomicalGroup } from '@types/pose';

/**
 * Pose Schema Registry
 *
 * Central registry for pose detection model schemas.
 * Provides pluggable architecture for MoveNet 17, MediaPipe 33, and future models.
 *
 * @example
 * const registry = PoseSchemaRegistry.getInstance();
 * const schema = registry.get('movenet-17');
 * console.log(schema.landmarkCount); // 17
 */
export class PoseSchemaRegistry {
  private static instance: PoseSchemaRegistry;
  private schemas: Map<string, PoseSchema> = new Map();

  private constructor() {
    this.registerDefaultSchemas();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PoseSchemaRegistry {
    if (!PoseSchemaRegistry.instance) {
      PoseSchemaRegistry.instance = new PoseSchemaRegistry();
    }
    return PoseSchemaRegistry.instance;
  }

  /**
   * Register a pose schema
   *
   * @param schema - Pose schema to register
   */
  public register(schema: PoseSchema): void {
    this.schemas.set(schema.id, schema);
  }

  /**
   * Get schema by ID
   *
   * @param id - Schema identifier
   * @returns Schema if found, undefined otherwise
   */
  public get(id: string): PoseSchema | undefined {
    return this.schemas.get(id);
  }

  /**
   * Get all registered schema IDs
   */
  public getRegisteredIds(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Check if schema is registered
   */
  public has(id: string): boolean {
    return this.schemas.has(id);
  }

  /**
   * Clear all schemas (for testing)
   */
  public clear(): void {
    this.schemas.clear();
  }

  /**
   * Register default schemas (MoveNet 17, MediaPipe 33)
   */
  private registerDefaultSchemas(): void {
    this.register(this.createMoveNetSchema());
    this.register(this.createMediaPipeSchema());
  }

  /**
   * Create MoveNet 17 keypoint schema
   *
   * MoveNet detects 17 keypoints in COCO format:
   * 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear,
   * 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow,
   * 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip,
   * 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
   *
   * Reference: https://www.tensorflow.org/lite/examples/pose_estimation/overview
   */
  private createMoveNetSchema(): PoseSchema {
    const landmarks: LandmarkDefinition[] = [
      { index: 0, name: 'nose', group: 'head' },
      { index: 1, name: 'left_eye', group: 'head' },
      { index: 2, name: 'right_eye', group: 'head' },
      { index: 3, name: 'left_ear', group: 'head' },
      { index: 4, name: 'right_ear', group: 'head' },
      { index: 5, name: 'left_shoulder', aliases: ['shoulder_left'], group: 'torso' },
      { index: 6, name: 'right_shoulder', aliases: ['shoulder_right'], group: 'torso' },
      { index: 7, name: 'left_elbow', aliases: ['elbow_left'], group: 'leftArm' },
      { index: 8, name: 'right_elbow', aliases: ['elbow_right'], group: 'rightArm' },
      { index: 9, name: 'left_wrist', aliases: ['wrist_left'], group: 'leftArm' },
      { index: 10, name: 'right_wrist', aliases: ['wrist_right'], group: 'rightArm' },
      { index: 11, name: 'left_hip', aliases: ['hip_left'], group: 'torso' },
      { index: 12, name: 'right_hip', aliases: ['hip_right'], group: 'torso' },
      { index: 13, name: 'left_knee', aliases: ['knee_left'], group: 'leftLeg' },
      { index: 14, name: 'right_knee', aliases: ['knee_right'], group: 'rightLeg' },
      { index: 15, name: 'left_ankle', aliases: ['ankle_left'], group: 'leftLeg' },
      { index: 16, name: 'right_ankle', aliases: ['ankle_right'], group: 'rightLeg' },
    ];

    const headGroup: AnatomicalGroup = {
      name: 'head',
      landmarkIndices: [0, 1, 2, 3, 4],
      minVisibleForValid: 1, // At least nose visible
    };

    const torsoGroup: AnatomicalGroup = {
      name: 'torso',
      landmarkIndices: [5, 6, 11, 12],
      minVisibleForValid: 3, // Both shoulders + one hip minimum
    };

    const leftArmGroup: AnatomicalGroup = {
      name: 'leftArm',
      landmarkIndices: [5, 7, 9], // shoulder, elbow, wrist
      minVisibleForValid: 2,
    };

    const rightArmGroup: AnatomicalGroup = {
      name: 'rightArm',
      landmarkIndices: [6, 8, 10],
      minVisibleForValid: 2,
    };

    const leftLegGroup: AnatomicalGroup = {
      name: 'leftLeg',
      landmarkIndices: [11, 13, 15], // hip, knee, ankle
      minVisibleForValid: 2,
    };

    const rightLegGroup: AnatomicalGroup = {
      name: 'rightLeg',
      landmarkIndices: [12, 14, 16],
      minVisibleForValid: 2,
    };

    return {
      id: 'movenet-17',
      modelName: 'MoveNet Lightning',
      landmarkCount: 17,
      landmarks,
      groups: {
        head: headGroup,
        torso: torsoGroup,
        leftArm: leftArmGroup,
        rightArm: rightArmGroup,
        leftLeg: leftLegGroup,
        rightLeg: rightLegGroup,
      },
      provides3D: false,
      defaultConfidenceThreshold: 0.5,
      metadata: {
        version: '1.0.0',
        source: 'TensorFlow Hub',
        notes: 'Optimized for real-time detection on mobile devices',
      },
    };
  }

  /**
   * Create MediaPipe 33 keypoint schema (stub)
   *
   * MediaPipe Pose detects 33 landmarks including detailed hand/foot points.
   * This is a stub implementation - full schema will be completed in later gates.
   *
   * Note: MediaPipe provides 3D world coordinates for more accurate measurements.
   *
   * Reference: https://google.github.io/mediapipe/solutions/pose
   */
  private createMediaPipeSchema(): PoseSchema {
    // Stub landmarks - includes MoveNet 17 + additional points
    const landmarks: LandmarkDefinition[] = [
      // Core 17 (compatible with MoveNet)
      { index: 0, name: 'nose', group: 'head' },
      { index: 1, name: 'left_eye_inner', group: 'head' },
      { index: 2, name: 'left_eye', group: 'head' },
      { index: 3, name: 'left_eye_outer', group: 'head' },
      { index: 4, name: 'right_eye_inner', group: 'head' },
      { index: 5, name: 'right_eye', group: 'head' },
      { index: 6, name: 'right_eye_outer', group: 'head' },
      { index: 7, name: 'left_ear', group: 'head' },
      { index: 8, name: 'right_ear', group: 'head' },
      { index: 9, name: 'mouth_left', group: 'head' },
      { index: 10, name: 'mouth_right', group: 'head' },
      { index: 11, name: 'left_shoulder', group: 'torso' },
      { index: 12, name: 'right_shoulder', group: 'torso' },
      { index: 13, name: 'left_elbow', group: 'leftArm' },
      { index: 14, name: 'right_elbow', group: 'rightArm' },
      { index: 15, name: 'left_wrist', group: 'leftArm' },
      { index: 16, name: 'right_wrist', group: 'rightArm' },
      { index: 17, name: 'left_pinky', group: 'leftArm' },
      { index: 18, name: 'right_pinky', group: 'rightArm' },
      { index: 19, name: 'left_index', group: 'leftArm' },
      { index: 20, name: 'right_index', group: 'rightArm' },
      { index: 21, name: 'left_thumb', group: 'leftArm' },
      { index: 22, name: 'right_thumb', group: 'rightArm' },
      { index: 23, name: 'left_hip', group: 'torso' },
      { index: 24, name: 'right_hip', group: 'torso' },
      { index: 25, name: 'left_knee', group: 'leftLeg' },
      { index: 26, name: 'right_knee', group: 'rightLeg' },
      { index: 27, name: 'left_ankle', group: 'leftLeg' },
      { index: 28, name: 'right_ankle', group: 'rightLeg' },
      { index: 29, name: 'left_heel', group: 'leftLeg' },
      { index: 30, name: 'right_heel', group: 'rightLeg' },
      { index: 31, name: 'left_foot_index', group: 'leftLeg' },
      { index: 32, name: 'right_foot_index', group: 'rightLeg' },
    ];

    const headGroup: AnatomicalGroup = {
      name: 'head',
      landmarkIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      minVisibleForValid: 1,
    };

    const torsoGroup: AnatomicalGroup = {
      name: 'torso',
      landmarkIndices: [11, 12, 23, 24],
      minVisibleForValid: 3,
    };

    const leftArmGroup: AnatomicalGroup = {
      name: 'leftArm',
      landmarkIndices: [11, 13, 15, 17, 19, 21],
      minVisibleForValid: 3,
    };

    const rightArmGroup: AnatomicalGroup = {
      name: 'rightArm',
      landmarkIndices: [12, 14, 16, 18, 20, 22],
      minVisibleForValid: 3,
    };

    const leftLegGroup: AnatomicalGroup = {
      name: 'leftLeg',
      landmarkIndices: [23, 25, 27, 29, 31],
      minVisibleForValid: 3,
    };

    const rightLegGroup: AnatomicalGroup = {
      name: 'rightLeg',
      landmarkIndices: [24, 26, 28, 30, 32],
      minVisibleForValid: 3,
    };

    return {
      id: 'mediapipe-33',
      modelName: 'MediaPipe Pose',
      landmarkCount: 33,
      landmarks,
      groups: {
        head: headGroup,
        torso: torsoGroup,
        leftArm: leftArmGroup,
        rightArm: rightArmGroup,
        leftLeg: leftLegGroup,
        rightLeg: rightLegGroup,
      },
      provides3D: true,
      defaultConfidenceThreshold: 0.5,
      metadata: {
        version: '0.1.0',
        source: 'Google MediaPipe',
        notes:
          'Experimental - full implementation pending. Provides 3D world coordinates.',
      },
    };
  }
}

// Export singleton instance
export const poseSchemaRegistry = PoseSchemaRegistry.getInstance();
