/**
 * MacBook Video Test Harness Tests
 * Validates the testing infrastructure for MacBook camera integration
 */

import { MacBookVideoTestHarness } from '../MacBookVideoTestHarness';

describe('MacBookVideoTestHarness', () => {
  let harness: MacBookVideoTestHarness;

  beforeEach(() => {
    harness = new MacBookVideoTestHarness();
  });

  describe('Video File Testing', () => {
    it('should process synthetic video sequence and calculate accuracy', async () => {
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://shoulder_flexion_60_120',
        targetFPS: 30,
        maxFrames: 150,
        enableBenchmarking: true,
        accuracyTolerance: 5,
      });

      // Validate results
      expect(results.framesProcessed).toBe(150);
      expect(results.avgFPS).toBeGreaterThan(0);
      expect(results.avgProcessingTime).toBeGreaterThan(0);
      expect(results.measurements.length).toBe(150);

      // Check accuracy
      expect(results.meanAbsoluteError).toBeDefined();
      expect(results.meanAbsoluteError!).toBeLessThan(5); // ±5° tolerance

      // Check performance metrics
      expect(results.performance.minFPS).toBeGreaterThan(0);
      expect(results.performance.maxFPS).toBeGreaterThan(results.performance.minFPS);
      expect(results.performance.p50Latency).toBeGreaterThan(0);
      expect(results.performance.p95Latency).toBeGreaterThanOrEqual(
        results.performance.p50Latency
      );
    });

    it('should track measurements frame-by-frame', async () => {
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://shoulder_flexion_0_180',
        maxFrames: 30,
      });

      expect(results.measurements.length).toBe(30);

      // Each measurement should have required fields
      results.measurements.forEach((m) => {
        expect(m.frame).toBeGreaterThanOrEqual(0);
        expect(m.timestamp).toBeGreaterThan(0);
        expect(m.joint).toBeDefined();
        expect(m.angle).toBeGreaterThanOrEqual(0);
        expect(m.angle).toBeLessThanOrEqual(180);
      });
    });

    it('should calculate error against ground truth', async () => {
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://shoulder_flexion_90',
        maxFrames: 10,
      });

      // All measurements should have ground truth and error
      results.measurements.forEach((m) => {
        expect(m.groundTruth).toBeDefined();
        expect(m.error).toBeDefined();
        expect(m.error).toBeGreaterThanOrEqual(0);
      });

      // MAE should be calculated
      expect(results.meanAbsoluteError).toBeDefined();
    });

    it('should detect compensations during movement', async () => {
      // This would test with synthetic data that includes compensations
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://shoulder_flexion_with_trunk_lean',
        maxFrames: 50,
      });

      // Some compensations should be detected
      // (implementation depends on synthetic data generator)
      expect(results.compensations).toBeDefined();
    });
  });

  describe('Benchmark Suite', () => {
    it('should run comprehensive benchmark across movement types', async () => {
      const results = await harness.runBenchmarkSuite();

      // Should test all four movement types
      expect(results.shoulder_flexion).toBeDefined();
      expect(results.shoulder_abduction).toBeDefined();
      expect(results.elbow_flexion).toBeDefined();
      expect(results.knee_flexion).toBeDefined();

      // Each should have valid results
      Object.values(results).forEach((result) => {
        expect(result.framesProcessed).toBeGreaterThan(0);
        expect(result.avgFPS).toBeGreaterThan(0);
        expect(result.meanAbsoluteError).toBeDefined();
        expect(result.meanAbsoluteError!).toBeLessThan(5); // ±5° target
      });
    });

    it('should achieve target accuracy for shoulder flexion', async () => {
      const results = await harness.runBenchmarkSuite();
      expect(results.shoulder_flexion.meanAbsoluteError!).toBeLessThan(5);
    });

    it('should achieve target accuracy for shoulder abduction', async () => {
      const results = await harness.runBenchmarkSuite();
      expect(results.shoulder_abduction.meanAbsoluteError!).toBeLessThan(5);
    });

    it('should achieve target accuracy for elbow flexion', async () => {
      const results = await harness.runBenchmarkSuite();
      expect(results.elbow_flexion.meanAbsoluteError!).toBeLessThan(5);
    });

    it('should achieve target accuracy for knee flexion', async () => {
      const results = await harness.runBenchmarkSuite();
      expect(results.knee_flexion.meanAbsoluteError!).toBeLessThan(5);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate FPS statistics', async () => {
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://test',
        maxFrames: 100,
        enableBenchmarking: true,
      });

      expect(results.avgFPS).toBeGreaterThan(0);
      expect(results.performance.minFPS).toBeGreaterThan(0);
      expect(results.performance.maxFPS).toBeGreaterThanOrEqual(
        results.performance.minFPS
      );
    });

    it('should calculate latency percentiles', async () => {
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://test',
        maxFrames: 100,
        enableBenchmarking: true,
      });

      // P50 <= P95 <= P99
      expect(results.performance.p50Latency).toBeGreaterThan(0);
      expect(results.performance.p95Latency).toBeGreaterThanOrEqual(
        results.performance.p50Latency
      );
      expect(results.performance.p99Latency).toBeGreaterThanOrEqual(
        results.performance.p95Latency
      );
    });

    it('should achieve real-time performance (>30 FPS target)', async () => {
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://test',
        maxFrames: 100,
        enableBenchmarking: true,
      });

      // For synthetic data processing, should easily exceed 30 FPS
      expect(results.avgFPS).toBeGreaterThan(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle short sequences (single frame)', async () => {
      const results = await harness.testWithVideoFile({
        videoPath: 'synthetic://test',
        maxFrames: 1,
      });

      expect(results.framesProcessed).toBe(1);
      expect(results.measurements.length).toBe(1);
    });

    it('should handle empty video path gracefully', async () => {
      await expect(
        harness.testWithVideoFile({
          videoPath: '',
        })
      ).rejects.toThrow('videoPath is required');
    });

    it('should handle undefined video path gracefully', async () => {
      await expect(harness.testWithVideoFile({})).rejects.toThrow(
        'videoPath is required'
      );
    });
  });
});
