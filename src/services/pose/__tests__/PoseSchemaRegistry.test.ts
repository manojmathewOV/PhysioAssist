import { PoseSchemaRegistry } from '../PoseSchemaRegistry';
import { PoseSchema } from '../../../types/pose';

describe('PoseSchemaRegistry - Gate 9B.2', () => {
  let registry: PoseSchemaRegistry;

  beforeEach(() => {
    // Get singleton instance
    registry = PoseSchemaRegistry.getInstance();
  });

  afterEach(() => {
    // Clean up for isolation (though singleton persists)
    // Tests should be designed to work with pre-registered schemas
  });

  describe('Schema Registration', () => {
    it('should register a custom schema', () => {
      const customSchema: PoseSchema = {
        id: 'custom-test',
        modelName: 'Test Model',
        landmarkCount: 5,
        landmarks: [],
        groups: {},
        provides3D: false,
        defaultConfidenceThreshold: 0.6,
      };

      registry.register(customSchema);
      const retrieved = registry.get('custom-test');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('custom-test');
      expect(retrieved?.modelName).toBe('Test Model');
    });

    it('should allow overwriting existing schema', () => {
      const schema1: PoseSchema = {
        id: 'overwrite-test',
        modelName: 'Version 1',
        landmarkCount: 10,
        landmarks: [],
        groups: {},
        provides3D: false,
        defaultConfidenceThreshold: 0.5,
      };

      const schema2: PoseSchema = {
        id: 'overwrite-test',
        modelName: 'Version 2',
        landmarkCount: 20,
        landmarks: [],
        groups: {},
        provides3D: true,
        defaultConfidenceThreshold: 0.6,
      };

      registry.register(schema1);
      registry.register(schema2);

      const retrieved = registry.get('overwrite-test');
      expect(retrieved?.modelName).toBe('Version 2');
      expect(retrieved?.landmarkCount).toBe(20);
      expect(retrieved?.provides3D).toBe(true);
    });

    it('should have MoveNet and MediaPipe schemas pre-registered', () => {
      const registeredIds = registry.getRegisteredIds();

      expect(registeredIds).toContain('movenet-17');
      expect(registeredIds).toContain('mediapipe-33');
      expect(registeredIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Schema Retrieval', () => {
    it('should retrieve registered schema by ID', () => {
      const schema = registry.get('movenet-17');

      expect(schema).toBeDefined();
      expect(schema?.id).toBe('movenet-17');
    });

    it('should return undefined for unregistered schema', () => {
      const schema = registry.get('nonexistent-schema');

      expect(schema).toBeUndefined();
    });

    it('should return all registered schema IDs', () => {
      const ids = registry.getRegisteredIds();

      expect(Array.isArray(ids)).toBe(true);
      expect(ids).toContain('movenet-17');
      expect(ids).toContain('mediapipe-33');
    });
  });

  describe('Error Handling', () => {
    it('should handle has() check for registered schemas', () => {
      expect(registry.has('movenet-17')).toBe(true);
      expect(registry.has('mediapipe-33')).toBe(true);
    });

    it('should handle has() check for unregistered schemas', () => {
      expect(registry.has('nonexistent-schema')).toBe(false);
      expect(registry.has('')).toBe(false);
      expect(registry.has('random-id-123')).toBe(false);
    });
  });

  describe('MoveNet 17 Schema Validation', () => {
    let schema: PoseSchema;

    beforeEach(() => {
      const retrieved = registry.get('movenet-17');
      if (!retrieved) {
        throw new Error('MoveNet schema not found');
      }
      schema = retrieved;
    });

    it('should have correct schema metadata', () => {
      expect(schema.id).toBe('movenet-17');
      expect(schema.modelName).toBe('MoveNet Lightning');
      expect(schema.landmarkCount).toBe(17);
      expect(schema.provides3D).toBe(false);
      expect(schema.defaultConfidenceThreshold).toBe(0.5);
    });

    it('should have 17 landmarks', () => {
      expect(schema.landmarks).toHaveLength(17);
    });

    it('should have correct landmark indices (0-16)', () => {
      const indices = schema.landmarks.map((lm) => lm.index);
      expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    });

    it('should have anatomical groups', () => {
      expect(schema.groups.head).toBeDefined();
      expect(schema.groups.torso).toBeDefined();
      expect(schema.groups.leftArm).toBeDefined();
      expect(schema.groups.rightArm).toBeDefined();
      expect(schema.groups.leftLeg).toBeDefined();
      expect(schema.groups.rightLeg).toBeDefined();
    });

    it('should have correct landmark names', () => {
      const landmarkNames = schema.landmarks.map((lm) => lm.name);

      // Check key landmarks
      expect(landmarkNames[0]).toBe('nose');
      expect(landmarkNames[5]).toBe('left_shoulder');
      expect(landmarkNames[6]).toBe('right_shoulder');
      expect(landmarkNames[7]).toBe('left_elbow');
      expect(landmarkNames[11]).toBe('left_hip');
      expect(landmarkNames[13]).toBe('left_knee');
    });
  });

  describe('MediaPipe 33 Schema Validation', () => {
    let schema: PoseSchema;

    beforeEach(() => {
      const retrieved = registry.get('mediapipe-33');
      if (!retrieved) {
        throw new Error('MediaPipe schema not found');
      }
      schema = retrieved;
    });

    it('should have correct schema metadata', () => {
      expect(schema.id).toBe('mediapipe-33');
      expect(schema.modelName).toBe('MediaPipe Pose');
      expect(schema.landmarkCount).toBe(33);
      expect(schema.provides3D).toBe(true);
      expect(schema.defaultConfidenceThreshold).toBe(0.5);
    });

    it('should have 33 landmarks', () => {
      expect(schema.landmarks).toHaveLength(33);
    });

    it('should have correct landmark indices (0-32)', () => {
      const indices = schema.landmarks.map((lm) => lm.index);
      const expectedIndices = Array.from({ length: 33 }, (_, i) => i);
      expect(indices).toEqual(expectedIndices);
    });

    it('should have anatomical groups', () => {
      expect(schema.groups.head).toBeDefined();
      expect(schema.groups.torso).toBeDefined();
      expect(schema.groups.leftArm).toBeDefined();
      expect(schema.groups.rightArm).toBeDefined();
      expect(schema.groups.leftLeg).toBeDefined();
      expect(schema.groups.rightLeg).toBeDefined();
    });

    it('should have extended landmarks (hand/foot points)', () => {
      const landmarkNames = schema.landmarks.map((lm) => lm.name);

      // Hand points
      expect(landmarkNames).toContain('left_pinky');
      expect(landmarkNames).toContain('right_pinky');
      expect(landmarkNames).toContain('left_index');
      expect(landmarkNames).toContain('right_index');

      // Foot points
      expect(landmarkNames).toContain('left_heel');
      expect(landmarkNames).toContain('right_heel');
      expect(landmarkNames).toContain('left_foot_index');
      expect(landmarkNames).toContain('right_foot_index');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PoseSchemaRegistry.getInstance();
      const instance2 = PoseSchemaRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should persist registered schemas across getInstance calls', () => {
      const instance1 = PoseSchemaRegistry.getInstance();
      const customSchema: PoseSchema = {
        id: 'singleton-test',
        modelName: 'Singleton Test',
        landmarkCount: 1,
        landmarks: [],
        groups: {},
        provides3D: false,
        defaultConfidenceThreshold: 0.5,
      };

      instance1.register(customSchema);

      const instance2 = PoseSchemaRegistry.getInstance();
      const retrieved = instance2.get('singleton-test');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('singleton-test');
    });
  });

  describe('Anatomical Group Validation', () => {
    it('should have valid torso group for MoveNet', () => {
      const schema = registry.get('movenet-17');
      const torsoGroup = schema?.groups.torso;

      expect(torsoGroup).toBeDefined();
      expect(torsoGroup?.name).toBe('torso');
      expect(torsoGroup?.landmarkIndices).toContain(5); // left_shoulder
      expect(torsoGroup?.landmarkIndices).toContain(6); // right_shoulder
      expect(torsoGroup?.landmarkIndices).toContain(11); // left_hip
      expect(torsoGroup?.landmarkIndices).toContain(12); // right_hip
      expect(torsoGroup?.minVisibleForValid).toBeGreaterThan(0);
    });

    it('should have valid arm groups for MoveNet', () => {
      const schema = registry.get('movenet-17');
      const leftArm = schema?.groups.leftArm;
      const rightArm = schema?.groups.rightArm;

      expect(leftArm?.landmarkIndices).toContain(5); // left_shoulder
      expect(leftArm?.landmarkIndices).toContain(7); // left_elbow
      expect(leftArm?.landmarkIndices).toContain(9); // left_wrist

      expect(rightArm?.landmarkIndices).toContain(6); // right_shoulder
      expect(rightArm?.landmarkIndices).toContain(8); // right_elbow
      expect(rightArm?.landmarkIndices).toContain(10); // right_wrist
    });

    it('should have valid leg groups for MoveNet', () => {
      const schema = registry.get('movenet-17');
      const leftLeg = schema?.groups.leftLeg;
      const rightLeg = schema?.groups.rightLeg;

      expect(leftLeg?.landmarkIndices).toContain(11); // left_hip
      expect(leftLeg?.landmarkIndices).toContain(13); // left_knee
      expect(leftLeg?.landmarkIndices).toContain(15); // left_ankle

      expect(rightLeg?.landmarkIndices).toContain(12); // right_hip
      expect(rightLeg?.landmarkIndices).toContain(14); // right_knee
      expect(rightLeg?.landmarkIndices).toContain(16); // right_ankle
    });
  });

  describe('Landmark Aliases', () => {
    it('should have aliases for MoveNet landmarks', () => {
      const schema = registry.get('movenet-17');
      const leftShoulder = schema?.landmarks.find((lm) => lm.name === 'left_shoulder');

      expect(leftShoulder?.aliases).toBeDefined();
      expect(leftShoulder?.aliases).toContain('shoulder_left');
    });
  });

  describe('Schema Metadata', () => {
    it('should have metadata for MoveNet schema', () => {
      const schema = registry.get('movenet-17');

      expect(schema?.metadata).toBeDefined();
      expect(schema?.metadata?.version).toBeDefined();
      expect(schema?.metadata?.source).toBe('TensorFlow Hub');
    });

    it('should have metadata for MediaPipe schema', () => {
      const schema = registry.get('mediapipe-33');

      expect(schema?.metadata).toBeDefined();
      expect(schema?.metadata?.version).toBeDefined();
      expect(schema?.metadata?.source).toBe('Google MediaPipe');
      expect(schema?.metadata?.notes).toContain('Experimental');
    });
  });
});
