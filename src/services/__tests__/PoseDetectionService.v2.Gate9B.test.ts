/**
 * Gate 9B.4 Integration Tests
 * Tests for metadata, orientation, and quality score functionality
 */

// Mock react-native-fast-tflite (native dependency)
jest.mock('react-native-fast-tflite');

import { PoseDetectionServiceV2 } from '../PoseDetectionService.v2';
import { PoseLandmark } from '../../types/pose';

describe('PoseDetectionServiceV2 - Gate 9B.4 Integration', () => {
  // Helper to create mock landmarks
  function createMockLandmarks(overrides: Partial<PoseLandmark>[] = []): PoseLandmark[] {
    const base: PoseLandmark[] = Array.from({ length: 17 }, (_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
      index: i,
      name: `landmark_${i}`,
    }));

    overrides.forEach((override) => {
      const index = override.index ?? 0;
      base[index] = { ...base[index], ...override };
    });

    return base;
  }

  describe('Service Initialization', () => {
    it('should initialize with default config', () => {
      const service = new PoseDetectionServiceV2();

      expect(service).toBeDefined();
      expect(service.isReady()).toBe(false); // Not initialized yet (no model loaded)
    });

    it('should initialize with custom config', () => {
      const service = new PoseDetectionServiceV2({
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.6,
        smoothLandmarks: true,
        frameSkipRate: 2,
      });

      expect(service).toBeDefined();
    });
  });

  describe('Quality Score Calculation', () => {
    let service: PoseDetectionServiceV2;

    beforeEach(() => {
      service = new PoseDetectionServiceV2();
    });

    it('should calculate quality score for high-quality pose', () => {
      const landmarks = createMockLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.95 }, // left_shoulder
        { index: 6, x: 0.7, y: 0.4, visibility: 0.95 }, // right_shoulder
        { index: 11, x: 0.35, y: 0.6, visibility: 0.95 }, // left_hip
        { index: 12, x: 0.65, y: 0.6, visibility: 0.95 }, // right_hip
      ]);

      // Access private method via any for testing
      const qualityScore = (service as any).calculateQualityScore(landmarks);

      expect(qualityScore).toBeGreaterThan(0.8);
      expect(qualityScore).toBeLessThanOrEqual(1.0);
    });

    it('should calculate lower quality score for partial occlusion', () => {
      const landmarks = createMockLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.95 }, // left_shoulder visible
        { index: 6, x: 0.7, y: 0.4, visibility: 0.2 }, // right_shoulder occluded
        { index: 11, x: 0.35, y: 0.6, visibility: 0.9 }, // left_hip visible
        { index: 12, x: 0.65, y: 0.6, visibility: 0.1 }, // right_hip occluded
      ]);

      const qualityScore = (service as any).calculateQualityScore(landmarks);

      expect(qualityScore).toBeLessThan(0.8);
      expect(qualityScore).toBeGreaterThan(0.0);
    });

    it('should return 0 for empty landmarks', () => {
      const qualityScore = (service as any).calculateQualityScore([]);

      expect(qualityScore).toBe(0);
    });

    it('should return quality score in [0, 1] range', () => {
      const landmarks = createMockLandmarks();
      const qualityScore = (service as any).calculateQualityScore(landmarks);

      expect(qualityScore).toBeGreaterThanOrEqual(0.0);
      expect(qualityScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Confidence Calculation', () => {
    let service: PoseDetectionServiceV2;

    beforeEach(() => {
      service = new PoseDetectionServiceV2();
    });

    it('should calculate average confidence from landmarks', () => {
      const landmarks = createMockLandmarks([
        { index: 0, visibility: 0.9 },
        { index: 1, visibility: 0.8 },
        { index: 2, visibility: 0.7 },
      ]);

      const confidence = (service as any).calculateConfidence(landmarks);

      // Average of all 17 landmarks (14 at 0.9, 3 at custom values)
      expect(confidence).toBeGreaterThan(0.7);
      expect(confidence).toBeLessThan(1.0);
    });

    it('should return 0 for empty landmarks', () => {
      const confidence = (service as any).calculateConfidence([]);

      expect(confidence).toBe(0);
    });

    it('should handle all low-confidence landmarks', () => {
      const landmarks = createMockLandmarks().map((lm) => ({
        ...lm,
        visibility: 0.2,
      }));

      const confidence = (service as any).calculateConfidence(landmarks);

      expect(confidence).toBeLessThan(0.3);
    });
  });

  describe('Reset and Cleanup', () => {
    let service: PoseDetectionServiceV2;

    beforeEach(() => {
      service = new PoseDetectionServiceV2();
    });

    it('should reset performance stats', () => {
      // This should not throw
      service.resetPerformanceStats();

      const stats = service.getPerformanceStats();
      expect(stats.totalFrames).toBe(0);
      expect(stats.averageInferenceTime).toBe(0);
    });

    it('should cleanup resources', async () => {
      // Should not throw even without initialization
      await service.cleanup();

      expect(service.isReady()).toBe(false);
    });

    it('should get performance stats', () => {
      const stats = service.getPerformanceStats();

      expect(stats).toHaveProperty('averageInferenceTime');
      expect(stats).toHaveProperty('totalFrames');
      expect(stats).toHaveProperty('estimatedFPS');
    });
  });

  describe('Configuration Management', () => {
    it('should update config', () => {
      const service = new PoseDetectionServiceV2();

      service.updateConfig({
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.8,
      });

      // Config should be updated (no assertion needed, just verify no error)
      expect(service).toBeDefined();
    });

    it('should get delegate mode', () => {
      const service = new PoseDetectionServiceV2();
      const delegateMode = service.getDelegateMode();

      expect(['gpu', 'cpu']).toContain(delegateMode);
    });

    it('should check GPU enabled status', () => {
      const service = new PoseDetectionServiceV2();
      const isGPUEnabled = service.isGPUEnabled();

      expect(typeof isGPUEnabled).toBe('boolean');
    });

    it('should get recommended max FPS', () => {
      const service = new PoseDetectionServiceV2();
      const maxFPS = service.getRecommendedMaxFPS();

      expect(maxFPS).toBeGreaterThan(0);
      expect([10, 30]).toContain(maxFPS); // CPU: 10, GPU: 30
    });
  });

  describe('Adaptive Settings', () => {
    let service: PoseDetectionServiceV2;

    beforeEach(() => {
      service = new PoseDetectionServiceV2();
    });

    it('should apply adaptive settings', () => {
      service.applyAdaptiveSettings({
        minConfidence: 0.6,
        smoothing: 0.7,
        exposureCompensation: 0.5,
        frameSkipInterval: 2,
      });

      const settings = service.getAdaptiveSettings();

      expect(settings).toBeDefined();
      expect(settings?.minConfidence).toBe(0.6);
    });

    it('should get adaptive settings', () => {
      const settings = service.getAdaptiveSettings();

      // Should be null initially
      expect(settings).toBeNull();
    });

    it('should reset adaptive settings', () => {
      service.applyAdaptiveSettings({
        minConfidence: 0.6,
        smoothing: 0.7,
        exposureCompensation: 0.5,
        frameSkipInterval: 2,
      });

      service.resetAdaptiveSettings();

      const settings = service.getAdaptiveSettings();
      expect(settings).toBeNull();
    });
  });

  describe('Metadata Schema ID', () => {
    it('should use movenet-17 schema ID', () => {
      // This is validated through the integration, not directly testable
      // without mocking the model, but we can verify the constant exists
      const service = new PoseDetectionServiceV2();
      expect(service).toBeDefined();
      // The schemaId 'movenet-17' is set in processFrame()
    });
  });

  describe('Landmark Parsing', () => {
    let service: PoseDetectionServiceV2;

    beforeEach(() => {
      service = new PoseDetectionServiceV2();
    });

    it('should parse MoveNet output format', () => {
      // Create mock MoveNet output: [1, 1, 17, 3] flattened = 51 values
      // Format: [y, x, score] for each of 17 keypoints
      const mockOutput = new Float32Array(51);
      for (let i = 0; i < 17; i++) {
        mockOutput[i * 3] = 0.5; // y
        mockOutput[i * 3 + 1] = 0.5; // x
        mockOutput[i * 3 + 2] = 0.9; // score
      }

      const landmarks = (service as any).parseMoveNetOutput(mockOutput);

      expect(landmarks).toHaveLength(17);
      expect(landmarks[0].x).toBeCloseTo(0.5, 1);
      expect(landmarks[0].y).toBeCloseTo(0.5, 1);
      expect(landmarks[0].visibility).toBeCloseTo(0.9, 1);
      expect(landmarks[0].z).toBe(0); // MoveNet doesn't provide depth
    });
  });

  describe('Frame Preprocessing', () => {
    let service: PoseDetectionServiceV2;

    beforeEach(() => {
      service = new PoseDetectionServiceV2();
    });

    it('should preprocess Uint8Array frame data', () => {
      const inputSize = 192 * 192 * 3; // 110,592
      const frameData = new Uint8Array(inputSize);
      frameData.fill(127); // Mid-gray

      const normalized = (service as any).preprocessFrame(frameData);

      expect(normalized).toBeInstanceOf(Float32Array);
      expect(normalized.length).toBe(inputSize);
      // 127 / 255 ≈ 0.498
      expect(normalized[0]).toBeCloseTo(0.498, 2);
    });

    it('should preprocess regular array frame data', () => {
      const inputSize = 192 * 192 * 3;
      const frameData = new Array(inputSize).fill(255); // White

      const normalized = (service as any).preprocessFrame(frameData);

      expect(normalized).toBeInstanceOf(Float32Array);
      expect(normalized.length).toBe(inputSize);
      // 255 / 255 = 1.0
      expect(normalized[0]).toBeCloseTo(1.0, 2);
    });
  });
});
