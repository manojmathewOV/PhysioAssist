import {
  ProcessedPoseData,
  PoseSchema,
  LandmarkDefinition,
  AnatomicalGroup,
} from '../pose';

describe('Pose Types - Gate 9B.1 Type Compatibility', () => {
  describe('ProcessedPoseData metadata fields', () => {
    it('should accept metadata fields with correct types', () => {
      const poseData: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        schemaId: 'movenet-17',
        viewOrientation: 'frontal',
        cameraAzimuth: 45,
        hasDepth: false,
        qualityScore: 0.85,
      };

      expect(poseData.schemaId).toBe('movenet-17');
      expect(poseData.viewOrientation).toBe('frontal');
      expect(poseData.cameraAzimuth).toBe(45);
      expect(poseData.hasDepth).toBe(false);
      expect(poseData.qualityScore).toBe(0.85);
    });

    it('should allow metadata fields to be optional', () => {
      const poseData: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
      };

      expect(poseData.schemaId).toBeUndefined();
      expect(poseData.viewOrientation).toBeUndefined();
      expect(poseData.cameraAzimuth).toBeUndefined();
      expect(poseData.hasDepth).toBeUndefined();
      expect(poseData.qualityScore).toBeUndefined();
    });

    it('should enforce schemaId type constraints', () => {
      const movenetData: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        schemaId: 'movenet-17',
      };

      const mediapipeData: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        schemaId: 'mediapipe-33',
      };

      expect(movenetData.schemaId).toBe('movenet-17');
      expect(mediapipeData.schemaId).toBe('mediapipe-33');
    });

    it('should enforce viewOrientation type constraints', () => {
      const frontalPose: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        viewOrientation: 'frontal',
      };

      const sagittalPose: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        viewOrientation: 'sagittal',
      };

      const posteriorPose: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        viewOrientation: 'posterior',
      };

      expect(frontalPose.viewOrientation).toBe('frontal');
      expect(sagittalPose.viewOrientation).toBe('sagittal');
      expect(posteriorPose.viewOrientation).toBe('posterior');
    });

    it('should maintain backward compatibility with existing ProcessedPoseData usage', () => {
      // Legacy usage without metadata should still work
      const legacyData: ProcessedPoseData = {
        landmarks: [
          {
            x: 0.5,
            y: 0.5,
            z: 0,
            visibility: 0.95,
            index: 0,
            name: 'nose',
          },
        ],
        timestamp: Date.now(),
        confidence: 0.9,
        worldLandmarks: [],
        inferenceTime: 15,
      };

      expect(legacyData.landmarks.length).toBe(1);
      expect(legacyData.confidence).toBe(0.9);
      expect(legacyData.schemaId).toBeUndefined();
    });
  });

  describe('PoseSchema and related types', () => {
    it('should create valid LandmarkDefinition', () => {
      const landmark: LandmarkDefinition = {
        index: 0,
        name: 'left_shoulder',
        aliases: ['shoulder_left', 'l_shoulder'],
        group: 'leftArm',
      };

      expect(landmark.index).toBe(0);
      expect(landmark.name).toBe('left_shoulder');
      expect(landmark.group).toBe('leftArm');
      expect(landmark.aliases).toHaveLength(2);
    });

    it('should create valid AnatomicalGroup', () => {
      const torsoGroup: AnatomicalGroup = {
        name: 'torso',
        landmarkIndices: [0, 1, 2, 3],
        minVisibleForValid: 2,
      };

      expect(torsoGroup.name).toBe('torso');
      expect(torsoGroup.landmarkIndices).toHaveLength(4);
      expect(torsoGroup.minVisibleForValid).toBe(2);
    });

    it('should create valid PoseSchema for MoveNet', () => {
      const landmarks: LandmarkDefinition[] = [
        { index: 0, name: 'nose', group: 'head' },
        { index: 5, name: 'left_shoulder', group: 'torso' },
        { index: 6, name: 'right_shoulder', group: 'torso' },
      ];

      const torsoGroup: AnatomicalGroup = {
        name: 'torso',
        landmarkIndices: [5, 6],
        minVisibleForValid: 2,
      };

      const schema: PoseSchema = {
        id: 'movenet-17',
        modelName: 'MoveNet Lightning',
        landmarkCount: 17,
        landmarks,
        groups: { torso: torsoGroup },
        provides3D: false,
        defaultConfidenceThreshold: 0.5,
        metadata: {
          version: '1.0.0',
          source: 'TensorFlow Hub',
          notes: 'Optimized for real-time detection',
        },
      };

      expect(schema.id).toBe('movenet-17');
      expect(schema.modelName).toBe('MoveNet Lightning');
      expect(schema.landmarkCount).toBe(17);
      expect(schema.provides3D).toBe(false);
      expect(schema.landmarks).toHaveLength(3);
      expect(schema.groups.torso).toBeDefined();
      expect(schema.metadata?.version).toBe('1.0.0');
    });

    it('should create valid PoseSchema for MediaPipe', () => {
      const schema: PoseSchema = {
        id: 'mediapipe-33',
        modelName: 'MediaPipe Pose',
        landmarkCount: 33,
        landmarks: [],
        groups: {},
        provides3D: true,
        defaultConfidenceThreshold: 0.5,
      };

      expect(schema.id).toBe('mediapipe-33');
      expect(schema.provides3D).toBe(true);
      expect(schema.landmarkCount).toBe(33);
    });

    it('should enforce anatomical group type constraints', () => {
      const groups: Array<LandmarkDefinition['group']> = [
        'head',
        'torso',
        'leftArm',
        'rightArm',
        'leftLeg',
        'rightLeg',
      ];

      groups.forEach((group) => {
        const landmark: LandmarkDefinition = {
          index: 0,
          name: 'test',
          group,
        };
        expect(landmark.group).toBe(group);
      });
    });

    it('should allow PoseSchema without optional metadata', () => {
      const minimalSchema: PoseSchema = {
        id: 'movenet-17',
        modelName: 'MoveNet',
        landmarkCount: 17,
        landmarks: [],
        groups: {},
        provides3D: false,
        defaultConfidenceThreshold: 0.5,
      };

      expect(minimalSchema.metadata).toBeUndefined();
    });

    it('should allow LandmarkDefinition without optional aliases', () => {
      const landmark: LandmarkDefinition = {
        index: 0,
        name: 'nose',
        group: 'head',
      };

      expect(landmark.aliases).toBeUndefined();
    });
  });

  describe('Type integration tests', () => {
    it('should integrate ProcessedPoseData with PoseSchema', () => {
      const schema: PoseSchema = {
        id: 'movenet-17',
        modelName: 'MoveNet',
        landmarkCount: 17,
        landmarks: [{ index: 0, name: 'nose', group: 'head' }],
        groups: {},
        provides3D: false,
        defaultConfidenceThreshold: 0.5,
      };

      const poseData: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        schemaId: schema.id,
        hasDepth: schema.provides3D,
      };

      expect(poseData.schemaId).toBe(schema.id);
      expect(poseData.hasDepth).toBe(schema.provides3D);
    });

    it('should create ProcessedPoseData with all new metadata fields', () => {
      const fullMetadata: ProcessedPoseData = {
        landmarks: [],
        timestamp: Date.now(),
        confidence: 0.9,
        worldLandmarks: [],
        inferenceTime: 12,
        schemaId: 'movenet-17',
        viewOrientation: 'frontal',
        cameraAzimuth: 90,
        hasDepth: true,
        qualityScore: 0.92,
      };

      // Verify all fields are accessible
      expect(fullMetadata.landmarks).toBeDefined();
      expect(fullMetadata.timestamp).toBeDefined();
      expect(fullMetadata.confidence).toBe(0.9);
      expect(fullMetadata.worldLandmarks).toBeDefined();
      expect(fullMetadata.inferenceTime).toBe(12);
      expect(fullMetadata.schemaId).toBe('movenet-17');
      expect(fullMetadata.viewOrientation).toBe('frontal');
      expect(fullMetadata.cameraAzimuth).toBe(90);
      expect(fullMetadata.hasDepth).toBe(true);
      expect(fullMetadata.qualityScore).toBe(0.92);
    });
  });
});
