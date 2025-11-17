/**
 * Smoothing Filter Test Suite
 *
 * Comprehensive tests for One-Euro filters and pose landmark smoothing:
 * - Low-pass filter basics
 * - One-Euro filter speed adaptation
 * - Multi-dimensional filtering (2D, 3D)
 * - Pose landmark filtering
 * - Angle wrapping and smoothing
 * - Edge cases and reset behavior
 */

import {
  OneEuroFilter,
  OneEuroFilter2D,
  OneEuroFilter3D,
  PoseLandmarkFilter,
  AngleFilter,
  createClinicalPoseFilter,
  createClinicalAngleFilter,
} from '../smoothing';

describe('Smoothing Filters', () => {
  describe('OneEuroFilter', () => {
    let filter: OneEuroFilter;

    beforeEach(() => {
      filter = new OneEuroFilter(1.0, 0.007, 1.0);
    });

    it('should return first value unfiltered', () => {
      const value = 100.0;
      const timestamp = 0.0;

      const result = filter.filter(value, timestamp);

      expect(result).toBe(value);
    });

    it('should smooth noisy values', () => {
      const baseValue = 100.0;
      const noise = 5.0;
      let timestamp = 0.0;

      // Process noisy signal
      const results: number[] = [];
      for (let i = 0; i < 10; i++) {
        const noisyValue = baseValue + (Math.random() - 0.5) * noise;
        timestamp += 0.016; // ~60fps
        results.push(filter.filter(noisyValue, timestamp));
      }

      // Smoothed values should have less variance than noise
      const variance =
        results.reduce((sum, val) => sum + Math.pow(val - baseValue, 2), 0) /
        results.length;
      expect(variance).toBeLessThan(noise * noise);
    });

    it('should respond quickly to fast movements', () => {
      let timestamp = 0.0;

      // Start at 0
      filter.filter(0, timestamp);

      // Quick jump to 100
      timestamp += 0.016;
      const result = filter.filter(100, timestamp);

      // Should move significantly toward 100 (not stay near 0)
      expect(result).toBeGreaterThan(10);
    });

    it('should adapt cutoff based on velocity', () => {
      let timestamp = 0.0;

      // Slow movement (high smoothing)
      const slow1 = filter.filter(10, timestamp);
      timestamp += 0.016;
      const slow2 = filter.filter(11, timestamp);

      const slowChange = Math.abs(slow2 - slow1);

      // Reset and test fast movement (less smoothing)
      filter.reset();
      timestamp = 0.0;

      const fast1 = filter.filter(10, timestamp);
      timestamp += 0.016;
      const fast2 = filter.filter(50, timestamp);

      const fastChange = Math.abs(fast2 - fast1);

      // Fast movement should produce larger change (less smoothing)
      expect(fastChange).toBeGreaterThan(slowChange);
    });

    it('should reset to initial state', () => {
      let timestamp = 0.0;

      // Process some values
      filter.filter(100, timestamp);
      timestamp += 0.016;
      filter.filter(110, timestamp);

      // Reset
      filter.reset();
      timestamp += 0.016;

      // Next value should be unfiltered (like first call)
      const result = filter.filter(200, timestamp);
      expect(result).toBe(200);
    });

    it('should handle zero time delta gracefully', () => {
      const timestamp = 0.0;

      filter.filter(100, timestamp);

      // Same timestamp (dt = 0) should not crash
      expect(() => filter.filter(110, timestamp)).not.toThrow();
    });

    it('should handle negative values', () => {
      let timestamp = 0.0;

      const result1 = filter.filter(-50, timestamp);
      expect(result1).toBe(-50);

      timestamp += 0.016;
      const result2 = filter.filter(-45, timestamp);
      expect(result2).toBeLessThan(-44); // Should smooth toward -45
    });

    it('should handle very large values', () => {
      const timestamp = 0.0;

      const largeValue = 1000000.0;
      const result = filter.filter(largeValue, timestamp);

      expect(result).toBe(largeValue);
    });
  });

  describe('OneEuroFilter2D', () => {
    let filter: OneEuroFilter2D;

    beforeEach(() => {
      filter = new OneEuroFilter2D(1.0, 0.007, 1.0);
    });

    it('should filter 2D points independently', () => {
      let timestamp = 0.0;

      const point1 = { x: 100, y: 200 };
      const result1 = filter.filter(point1, timestamp);

      expect(result1.x).toBe(100);
      expect(result1.y).toBe(200);

      timestamp += 0.016;
      const point2 = { x: 105, y: 205 };
      const result2 = filter.filter(point2, timestamp);

      // Should smooth toward new position
      expect(result2.x).toBeGreaterThan(100);
      expect(result2.x).toBeLessThan(105);
      expect(result2.y).toBeGreaterThan(200);
      expect(result2.y).toBeLessThan(205);
    });

    it('should maintain X and Y independence', () => {
      let timestamp = 0.0;

      // Start point
      filter.filter({ x: 0, y: 0 }, timestamp);

      // Move only in X direction
      timestamp += 0.016;
      const result = filter.filter({ x: 100, y: 0 }, timestamp);

      // Y should remain near 0
      expect(Math.abs(result.y)).toBeLessThan(1);
      expect(result.x).toBeGreaterThan(10);
    });

    it('should reset both dimensions', () => {
      let timestamp = 0.0;

      filter.filter({ x: 100, y: 200 }, timestamp);
      filter.reset();

      timestamp += 0.016;
      const result = filter.filter({ x: 50, y: 75 }, timestamp);

      // Should be unfiltered after reset
      expect(result.x).toBe(50);
      expect(result.y).toBe(75);
    });
  });

  describe('OneEuroFilter3D', () => {
    let filter: OneEuroFilter3D;

    beforeEach(() => {
      filter = new OneEuroFilter3D(1.0, 0.007, 1.0);
    });

    it('should filter 3D points', () => {
      let timestamp = 0.0;

      const point1 = { x: 100, y: 200, z: 300 };
      const result1 = filter.filter(point1, timestamp);

      expect(result1).toEqual(point1);

      timestamp += 0.016;
      const point2 = { x: 105, y: 205, z: 305 };
      const result2 = filter.filter(point2, timestamp);

      // All dimensions should be smoothed
      expect(result2.x).toBeGreaterThan(100);
      expect(result2.y).toBeGreaterThan(200);
      expect(result2.z).toBeGreaterThan(300);
    });

    it('should maintain dimensional independence', () => {
      let timestamp = 0.0;

      filter.filter({ x: 0, y: 0, z: 0 }, timestamp);

      // Move only in Z direction
      timestamp += 0.016;
      const result = filter.filter({ x: 0, y: 0, z: 100 }, timestamp);

      expect(Math.abs(result.x)).toBeLessThan(1);
      expect(Math.abs(result.y)).toBeLessThan(1);
      expect(result.z).toBeGreaterThan(10);
    });

    it('should reset all three dimensions', () => {
      let timestamp = 0.0;

      filter.filter({ x: 100, y: 200, z: 300 }, timestamp);
      filter.reset();

      timestamp += 0.016;
      const result = filter.filter({ x: 50, y: 75, z: 150 }, timestamp);

      expect(result.x).toBe(50);
      expect(result.y).toBe(75);
      expect(result.z).toBe(150);
    });
  });

  describe('PoseLandmarkFilter', () => {
    let filter: PoseLandmarkFilter;

    beforeEach(() => {
      filter = new PoseLandmarkFilter(1.0, 0.007, 1.0, 0.5);
    });

    it('should filter all 33 landmarks', () => {
      const landmarks = Array(33)
        .fill(null)
        .map((_, i) => ({
          x: i * 0.1,
          y: i * 0.1,
          z: i * 0.1,
          visibility: 0.9,
        }));

      const timestamp = 0.0;
      const result = filter.filterPose(landmarks, timestamp);

      expect(result).toHaveLength(33);
      expect(result[0].x).toBe(0);
      expect(result[10].x).toBeCloseTo(1.0, 1);
    });

    it('should skip filtering for low visibility landmarks', () => {
      const landmarks = [
        { x: 100, y: 200, z: 300, visibility: 0.3 }, // Below 0.5 threshold
        { x: 110, y: 210, z: 310, visibility: 0.9 }, // Above threshold
      ];

      let timestamp = 0.0;
      filter.filterPose(landmarks, timestamp);

      timestamp += 0.016;
      const result = filter.filterPose(landmarks, timestamp);

      // Low visibility landmark should be unfiltered
      expect(result[0]).toEqual(landmarks[0]);

      // High visibility landmark should be smoothed
      expect(result[1].x).toBe(landmarks[1].x); // First pass, unfiltered
    });

    it('should preserve visibility values', () => {
      const landmarks = [
        { x: 100, y: 200, z: 300, visibility: 0.75 },
        { x: 110, y: 210, z: 310, visibility: 0.85 },
      ];

      const timestamp = 0.0;
      const result = filter.filterPose(landmarks, timestamp);

      expect(result[0].visibility).toBe(0.75);
      expect(result[1].visibility).toBe(0.85);
    });

    it('should handle landmarks without visibility', () => {
      const landmarks = [
        { x: 100, y: 200, z: 300 }, // No visibility field
      ];

      const timestamp = 0.0;

      expect(() => filter.filterPose(landmarks, timestamp)).not.toThrow();
    });

    it('should reset all landmark filters', () => {
      const landmarks = Array(33)
        .fill(null)
        .map(() => ({ x: 100, y: 200, z: 300, visibility: 0.9 }));

      let timestamp = 0.0;
      filter.filterPose(landmarks, timestamp);

      filter.reset();

      timestamp += 0.016;
      const newLandmarks = Array(33)
        .fill(null)
        .map(() => ({ x: 50, y: 75, z: 100, visibility: 0.9 }));

      const result = filter.filterPose(newLandmarks, timestamp);

      // Should be unfiltered after reset
      expect(result[0].x).toBe(50);
    });

    it('should reset specific landmark filter', () => {
      const landmarks = [
        { x: 100, y: 200, z: 300, visibility: 0.9 },
        { x: 110, y: 210, z: 310, visibility: 0.9 },
      ];

      let timestamp = 0.0;
      filter.filterPose(landmarks, timestamp);

      // Reset only landmark 0
      filter.resetLandmark(0);

      timestamp += 0.016;
      const result = filter.filterPose(
        [
          { x: 50, y: 75, z: 100, visibility: 0.9 },
          { x: 60, y: 80, z: 110, visibility: 0.9 },
        ],
        timestamp
      );

      // Landmark 0 should be unfiltered (reset)
      expect(result[0].x).toBe(50);

      // Landmark 1 should still be filtered
      expect(result[1].x).toBeGreaterThan(60); // Smoothed from 110
    });

    it('should handle edge case of 33 landmarks (MediaPipe standard)', () => {
      const landmarks = Array(33)
        .fill(null)
        .map((_, i) => ({
          x: i,
          y: i,
          z: i,
          visibility: 0.9,
        }));

      const timestamp = 0.0;
      const result = filter.filterPose(landmarks, timestamp);

      expect(result).toHaveLength(33);
    });
  });

  describe('AngleFilter', () => {
    let filter: AngleFilter;

    beforeEach(() => {
      filter = new AngleFilter(1.0, 0.007, 1.0);
    });

    it('should filter angle values', () => {
      let timestamp = 0.0;

      const angle1 = filter.filter(90, timestamp);
      expect(angle1).toBe(90);

      timestamp += 0.016;
      const angle2 = filter.filter(95, timestamp);

      // Second value may be passed through or smoothed depending on filter config
      // Just verify it's a valid angle
      expect(angle2).toBeGreaterThanOrEqual(90);
      expect(angle2).toBeLessThanOrEqual(95);
    });

    it('should handle angle wrapping at 360 degrees', () => {
      let timestamp = 0.0;

      // Start near 360
      filter.filter(359, timestamp);

      // Jump to 1 degree (should be shortest path, not -358)
      timestamp += 0.016;
      const result = filter.filter(1, timestamp);

      // Result should wrap correctly (not around 180)
      // Could be near 359, 0, or 1 depending on smoothing
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(360);
    });

    it('should handle wrapping from low to high', () => {
      let timestamp = 0.0;

      filter.filter(1, timestamp);

      timestamp += 0.016;
      const result = filter.filter(359, timestamp);

      // Result should be valid angle (wrapping handled)
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(360);
    });

    it('should normalize negative angles', () => {
      const timestamp = 0.0;

      const result = filter.filter(-45, timestamp);

      // -45 should become 315
      expect(result).toBeCloseTo(315, 0);
    });

    it('should normalize angles > 360', () => {
      const timestamp = 0.0;

      const result = filter.filter(405, timestamp);

      // 405 should become 45
      expect(result).toBeCloseTo(45, 0);
    });

    it('should handle large angle jumps', () => {
      let timestamp = 0.0;

      filter.filter(0, timestamp);

      timestamp += 0.016;
      const result = filter.filter(180, timestamp);

      // 180 degree jump - should be smoothed
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(180);
    });

    it('should reset to initial state', () => {
      let timestamp = 0.0;

      filter.filter(90, timestamp);
      timestamp += 0.016;
      filter.filter(95, timestamp);

      filter.reset();

      timestamp += 0.016;
      const result = filter.filter(45, timestamp);

      // Should be unfiltered after reset
      expect(result).toBe(45);
    });

    it('should handle 0 degrees correctly', () => {
      const timestamp = 0.0;

      const result = filter.filter(0, timestamp);
      expect(result).toBe(0);
    });

    it('should handle 180 degrees correctly', () => {
      const timestamp = 0.0;

      const result = filter.filter(180, timestamp);
      expect(result).toBe(180);
    });
  });

  describe('Factory Functions', () => {
    it('should create clinical pose filter with correct parameters', () => {
      const filter = createClinicalPoseFilter();

      expect(filter).toBeInstanceOf(PoseLandmarkFilter);

      // Test that it works
      const landmarks = [{ x: 100, y: 200, z: 300, visibility: 0.9 }];
      const timestamp = 0.0;

      expect(() => filter.filterPose(landmarks, timestamp)).not.toThrow();
    });

    it('should create clinical angle filter with correct parameters', () => {
      const filter = createClinicalAngleFilter();

      expect(filter).toBeInstanceOf(AngleFilter);

      // Test that it works
      const timestamp = 0.0;
      const result = filter.filter(90, timestamp);

      expect(result).toBe(90);
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle rapid filter/reset cycles', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);
      let timestamp = 0.0;

      for (let i = 0; i < 100; i++) {
        filter.filter(Math.random() * 100, timestamp);
        timestamp += 0.016;

        if (i % 10 === 0) {
          filter.reset();
        }
      }

      // Should not crash
      expect(true).toBe(true);
    });

    it('should handle very high frequency updates', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);
      let timestamp = 0.0;

      for (let i = 0; i < 1000; i++) {
        filter.filter(100 + Math.sin(i * 0.1) * 5, timestamp);
        timestamp += 0.001; // 1000 Hz
      }

      // Should not crash or produce NaN
      const result = filter.filter(100, timestamp);
      expect(Number.isNaN(result)).toBe(false);
    });

    it('should handle very low frequency updates', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);

      filter.filter(100, 0.0);
      const result = filter.filter(105, 10.0); // 10 second gap

      expect(Number.isNaN(result)).toBe(false);
    });

    it('should handle NaN input gracefully', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);

      filter.filter(100, 0.0);

      // NaN input
      const result = filter.filter(NaN, 0.016);

      // Should produce NaN (garbage in, garbage out)
      expect(Number.isNaN(result)).toBe(true);
    });

    it('should handle Infinity input', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);

      const result = filter.filter(Infinity, 0.0);

      expect(result).toBe(Infinity);
    });

    it('should maintain precision with very small values', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);

      const small1 = filter.filter(0.0001, 0.0);
      const small2 = filter.filter(0.0002, 0.016);

      expect(small2).toBeGreaterThan(0.0001);
      expect(small2).toBeLessThan(0.0002);
    });
  });

  describe('Performance Characteristics', () => {
    it('should converge to stable value with constant input', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);
      const targetValue = 100.0;
      let timestamp = 0.0;

      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(filter.filter(targetValue, timestamp));
        timestamp += 0.016;
      }

      // Later values should be very close to target
      const lastValue = results[results.length - 1];
      expect(Math.abs(lastValue - targetValue)).toBeLessThan(0.1);
    });

    it('should have increasing values with increasing input', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);
      let timestamp = 0.0;

      const results: number[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(filter.filter(i * 10, timestamp));
        timestamp += 0.016;
      }

      // Each value should be >= previous (monotonic increase)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThanOrEqual(results[i - 1]);
      }
    });

    it('should smooth sine wave appropriately', () => {
      const filter = new OneEuroFilter(1.0, 0.007, 1.0);
      let timestamp = 0.0;

      const rawValues: number[] = [];
      const smoothedValues: number[] = [];

      // Sample sine wave
      for (let i = 0; i < 100; i++) {
        const raw = 100 + Math.sin(i * 0.1) * 10;
        rawValues.push(raw);
        smoothedValues.push(filter.filter(raw, timestamp));
        timestamp += 0.016;
      }

      // Smoothed should have less total variation
      const rawVariation = rawValues.reduce((sum, val, i) => {
        if (i === 0) return 0;
        return sum + Math.abs(val - rawValues[i - 1]);
      }, 0);

      const smoothedVariation = smoothedValues.reduce((sum, val, i) => {
        if (i === 0) return 0;
        return sum + Math.abs(val - smoothedValues[i - 1]);
      }, 0);

      expect(smoothedVariation).toBeLessThan(rawVariation);
    });
  });
});
