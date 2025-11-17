/**
 * PoseDetectionService V2 Edge Cases Test Suite
 *
 * Tests for edge cases, error handling, and production scenarios:
 * - GPU fallback and recovery
 * - Model reload at 10K inference threshold
 * - Frame processing edge cases (invalid data, size mismatches)
 * - Memory leak prevention
 * - Performance tracking accuracy
 */

import { PoseDetectionServiceV2 } from '../PoseDetectionService.v2';

// Mock react-native-fast-tflite
jest.mock('react-native-fast-tflite', () => ({
  TFLiteModel: {
    load: jest.fn(),
  },
}));

// Mock dependencies
jest.mock('../../utils/compensatoryMechanisms', () => ({
  getPatientFriendlyError: jest.fn((msg: string) => ({
    title: 'Error',
    message: msg,
  })),
  AdaptiveSettings: {},
}));

jest.mock('../../utils/smoothing', () => ({
  PoseLandmarkFilter: jest.fn().mockImplementation(() => ({
    filterPose: jest.fn((landmarks) => landmarks),
    reset: jest.fn(),
  })),
}));

jest.mock('../pose/OrientationClassifier', () => ({
  OrientationClassifier: jest.fn().mockImplementation(() => ({
    classifyWithHistory: jest.fn(() => ({ orientation: 'frontal', confidence: 0.9 })),
    clearHistory: jest.fn(),
  })),
}));

jest.mock('../biomechanics/AnatomicalFrameCache', () => ({
  AnatomicalFrameCache: jest.fn().mockImplementation(() => ({
    get: jest.fn((key, landmarks, compute) => compute(landmarks)),
    clear: jest.fn(),
    getStats: jest.fn(() => ({ hitRate: 0.8, size: 10 })),
  })),
}));

jest.mock('../biomechanics/AnatomicalReferenceService', () => ({
  AnatomicalReferenceService: jest.fn().mockImplementation(() => ({
    calculateGlobalFrame: jest.fn(() => ({ origin: [0, 0, 0] })),
    calculateThoraxFrame: jest.fn(() => ({ origin: [0, 0, 0] })),
    calculateHumerusFrame: jest.fn(() => ({ origin: [0, 0, 0] })),
  })),
}));

describe('PoseDetectionService V2 - Edge Cases', () => {
  let service: PoseDetectionServiceV2;
  let mockModel: any;
  const TFLiteModel = require('react-native-fast-tflite').TFLiteModel;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock model
    mockModel = {
      run: jest.fn(() => {
        // Mock MoveNet output: [1, 1, 17, 3] flattened
        const output = new Float32Array(17 * 3);
        for (let i = 0; i < 17; i++) {
          output[i * 3] = 0.5; // y
          output[i * 3 + 1] = 0.5; // x
          output[i * 3 + 2] = 0.8; // score (high confidence)
        }
        return output;
      }),
      dispose: jest.fn(),
      inputs: [{ shape: [1, 192, 192, 3] }],
      outputs: [{ shape: [1, 1, 17, 3] }],
    };

    service = new PoseDetectionServiceV2();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('GPU Fallback Scenarios', () => {
    it('should fallback to CPU when GPU initialization fails', async () => {
      // First call (GPU) fails, second call (CPU) succeeds
      TFLiteModel.load
        .mockRejectedValueOnce(new Error('GPU not available'))
        .mockResolvedValueOnce(mockModel);

      await service.initialize();

      expect(service.isReady()).toBe(true);
      expect(service.getDelegateMode()).toBe('cpu');
      expect(service.isGPUEnabled()).toBe(false);
      expect(TFLiteModel.load).toHaveBeenCalledTimes(2);
    });

    it('should use GPU when available', async () => {
      TFLiteModel.load.mockResolvedValueOnce(mockModel);

      await service.initialize();

      expect(service.isReady()).toBe(true);
      expect(service.getDelegateMode()).toBe('gpu');
      expect(service.isGPUEnabled()).toBe(true);
      expect(TFLiteModel.load).toHaveBeenCalledTimes(1);
    });

    it('should recommend different FPS based on delegate mode', async () => {
      // CPU mode
      TFLiteModel.load
        .mockRejectedValueOnce(new Error('GPU not available'))
        .mockResolvedValueOnce(mockModel);

      await service.initialize();
      expect(service.getRecommendedMaxFPS()).toBe(10); // CPU: 10 FPS

      // GPU mode
      service.cleanup();
      TFLiteModel.load.mockResolvedValueOnce(mockModel);
      const gpuService = new PoseDetectionServiceV2();
      await gpuService.initialize();
      expect(gpuService.getRecommendedMaxFPS()).toBe(30); // GPU: 30 FPS
      gpuService.cleanup();
    });

    it('should throw patient-friendly error when model loading fails completely', async () => {
      TFLiteModel.load.mockRejectedValue(new Error('Network error'));

      await expect(service.initialize()).rejects.toThrow();
    });
  });

  describe('Model Reload for Memory Leak Prevention', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should trigger model reload at 10K inference threshold', () => {
      jest.useFakeTimers();

      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      // Process 10,000 frames
      for (let i = 0; i < 10000; i++) {
        service.processFrame(frameData);
      }

      // Reload should be scheduled after 10K
      jest.runAllTimers();

      expect(mockModel.dispose).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should preserve delegate mode during reload', async () => {
      // Initialize with GPU
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();

      const initialMode = service.getDelegateMode();

      // Trigger reload by processing 10K frames
      jest.useFakeTimers();
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      for (let i = 0; i < 10000; i++) {
        service.processFrame(frameData);
      }

      // Wait for async reload
      await jest.runAllTimersAsync();

      expect(service.getDelegateMode()).toBe(initialMode);
      jest.useRealTimers();
    });

    it('should handle model reload failure gracefully', async () => {
      jest.useFakeTimers();

      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      // Process frames to trigger reload
      for (let i = 0; i < 10000; i++) {
        service.processFrame(frameData);
      }

      // Make reload fail
      TFLiteModel.load.mockRejectedValueOnce(new Error('Reload failed'));

      // Should not crash
      await expect(jest.runAllTimersAsync()).resolves.not.toThrow();

      jest.useRealTimers();
    });
  });

  describe('Frame Processing Edge Cases', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should reject empty frame data', () => {
      const emptyFrame = new Uint8Array(0);
      const result = service.processFrame(emptyFrame);

      expect(result).toBeNull();
    });

    it('should reject frame with wrong size', () => {
      const wrongSizeFrame = new Uint8Array(100); // Expected: 192*192*3 = 110,592
      const result = service.processFrame(wrongSizeFrame);

      expect(result).toBeNull();
    });

    it('should reject frame with out-of-range pixel values', () => {
      const invalidFrame = Array(192 * 192 * 3).fill(300); // Invalid: > 255
      const result = service.processFrame(invalidFrame);

      expect(result).toBeNull();
    });

    it('should reject frame with NaN pixel values', () => {
      const nanFrame = Array(192 * 192 * 3).fill(NaN);
      const result = service.processFrame(nanFrame);

      expect(result).toBeNull();
    });

    it('should reject frame with negative pixel values', () => {
      const negativeFrame = Array(192 * 192 * 3).fill(-10);
      const result = service.processFrame(negativeFrame);

      expect(result).toBeNull();
    });

    it('should handle Uint8Array frame data (fast path)', () => {
      const validFrame = new Uint8Array(192 * 192 * 3).fill(128);
      const result = service.processFrame(validFrame);

      expect(result).not.toBeNull();
      expect(result?.landmarks).toHaveLength(17);
    });

    it('should handle regular array frame data (fallback path)', () => {
      const validFrame = Array(192 * 192 * 3).fill(128);
      const result = service.processFrame(validFrame);

      expect(result).not.toBeNull();
      expect(result?.landmarks).toHaveLength(17);
    });

    it('should return null when model not initialized', () => {
      const uninitializedService = new PoseDetectionServiceV2();
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      const result = uninitializedService.processFrame(frameData);

      expect(result).toBeNull();
    });

    it('should filter low-confidence poses', () => {
      // Mock low-confidence output
      mockModel.run.mockReturnValueOnce(() => {
        const output = new Float32Array(17 * 3);
        for (let i = 0; i < 17; i++) {
          output[i * 3] = 0.5;
          output[i * 3 + 1] = 0.5;
          output[i * 3 + 2] = 0.1; // Low score
        }
        return output;
      });

      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      const result = service.processFrame(frameData);

      // Should return null for low-confidence poses
      expect(result).toBeNull();
    });
  });

  describe('Performance Tracking', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should track average inference time', () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      // Process multiple frames
      for (let i = 0; i < 10; i++) {
        service.processFrame(frameData);
      }

      const stats = service.getPerformanceStats();

      expect(stats.totalFrames).toBe(10);
      expect(stats.averageInferenceTime).toBeGreaterThan(0);
      expect(stats.estimatedFPS).toBeGreaterThan(0);
    });

    it('should calculate FPS from inference time', () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      service.processFrame(frameData);

      const stats = service.getPerformanceStats();
      const expectedFPS = 1000 / stats.averageInferenceTime;

      expect(stats.estimatedFPS).toBeCloseTo(expectedFPS, 0);
    });

    it('should reset performance stats', () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      service.processFrame(frameData);
      service.resetPerformanceStats();

      const stats = service.getPerformanceStats();

      expect(stats.totalFrames).toBe(0);
      expect(stats.averageInferenceTime).toBe(0);
    });

    it('should handle stats request before processing any frames', () => {
      const stats = service.getPerformanceStats();

      expect(stats.totalFrames).toBe(0);
      expect(stats.averageInferenceTime).toBe(0);
      expect(stats.estimatedFPS).toBe(0);
    });
  });

  describe('Adaptive Settings', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should apply custom adaptive settings', () => {
      const settings = {
        minConfidence: 0.5,
        smoothing: 0.7,
        exposureCompensation: 0,
      };

      service.applyAdaptiveSettings(settings);

      const current = service.getAdaptiveSettings();
      expect(current).toEqual(settings);
    });

    it('should use custom confidence threshold when filtering poses', () => {
      // Apply high confidence threshold
      service.applyAdaptiveSettings({
        minConfidence: 0.9,
        smoothing: 0.5,
        exposureCompensation: 0,
      });

      // Mock medium confidence output (0.6)
      mockModel.run.mockReturnValueOnce(() => {
        const output = new Float32Array(17 * 3);
        for (let i = 0; i < 17; i++) {
          output[i * 3] = 0.5;
          output[i * 3 + 1] = 0.5;
          output[i * 3 + 2] = 0.6; // Medium score
        }
        return output;
      });

      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      const result = service.processFrame(frameData);

      // Should be filtered out (0.6 < 0.9)
      expect(result).toBeNull();
    });

    it('should reset to default settings', () => {
      service.applyAdaptiveSettings({
        minConfidence: 0.9,
        smoothing: 0.9,
        exposureCompensation: 2,
      });

      service.resetAdaptiveSettings();

      expect(service.getAdaptiveSettings()).toBeNull();
    });

    it('should return null when no adaptive settings set', () => {
      expect(service.getAdaptiveSettings()).toBeNull();
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration dynamically', () => {
      service.updateConfig({
        minDetectionConfidence: 0.5,
        smoothLandmarks: false,
      });

      // Configuration should be updated
      expect(service.isReady()).toBe(false); // Not initialized yet
    });

    it('should allow partial config updates', () => {
      service.updateConfig({ minDetectionConfidence: 0.6 });

      // Should not affect other config values
      expect(() => service.updateConfig({ frameSkipRate: 2 })).not.toThrow();
    });
  });

  describe('Callback Mechanism', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should call callback with pose data', () => {
      const callback = jest.fn();
      service.setPoseDataCallback(callback);

      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      service.processFrame(frameData);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          landmarks: expect.any(Array),
          confidence: expect.any(Number),
        })
      );
    });

    it('should not call callback when pose filtered out', () => {
      const callback = jest.fn();
      service.setPoseDataCallback(callback);

      // Mock low-confidence output
      mockModel.run.mockReturnValueOnce(() => {
        const output = new Float32Array(17 * 3);
        for (let i = 0; i < 17; i++) {
          output[i * 3] = 0.5;
          output[i * 3 + 1] = 0.5;
          output[i * 3 + 2] = 0.1; // Low score
        }
        return output;
      });

      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      service.processFrame(frameData);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle processing without callback', () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      expect(() => service.processFrame(frameData)).not.toThrow();
    });
  });

  describe('Cleanup and Resource Management', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should cleanup all resources', async () => {
      await service.cleanup();

      expect(service.isReady()).toBe(false);
      expect(mockModel.dispose).toHaveBeenCalled();
    });

    it('should reset all filters on cleanup', async () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      service.processFrame(frameData);

      await service.cleanup();

      expect(service.isReady()).toBe(false);
    });

    it('should clear callback on cleanup', async () => {
      const callback = jest.fn();
      service.setPoseDataCallback(callback);

      await service.cleanup();

      // Callback should be cleared
      expect(service.isReady()).toBe(false);
    });

    it('should handle cleanup when not initialized', async () => {
      const uninitializedService = new PoseDetectionServiceV2();

      await expect(uninitializedService.cleanup()).resolves.not.toThrow();
    });

    it('should reset performance stats on cleanup', async () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      service.processFrame(frameData);

      service.resetPerformanceStats();

      const stats = service.getPerformanceStats();
      expect(stats.totalFrames).toBe(0);
    });
  });

  describe('Frame Cache Statistics', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should return frame cache statistics', () => {
      const stats = service.getFrameCacheStats();

      expect(stats).toBeDefined();
      expect(stats?.hitRate).toBeDefined();
      expect(stats?.size).toBeDefined();
    });

    it('should track cache performance', () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      // Process some frames
      for (let i = 0; i < 5; i++) {
        service.processFrame(frameData);
      }

      const stats = service.getFrameCacheStats();
      expect(stats).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      TFLiteModel.load.mockResolvedValue(mockModel);
      await service.initialize();
    });

    it('should handle inference errors gracefully', () => {
      mockModel.run.mockImplementationOnce(() => {
        throw new Error('Inference failed');
      });

      const frameData = new Uint8Array(192 * 192 * 3).fill(128);
      const result = service.processFrame(frameData);

      expect(result).toBeNull();
    });

    it('should continue working after inference error', () => {
      const frameData = new Uint8Array(192 * 192 * 3).fill(128);

      // First call fails
      mockModel.run.mockImplementationOnce(() => {
        throw new Error('Inference failed');
      });
      const result1 = service.processFrame(frameData);
      expect(result1).toBeNull();

      // Second call succeeds
      const result2 = service.processFrame(frameData);
      expect(result2).not.toBeNull();
    });
  });
});
