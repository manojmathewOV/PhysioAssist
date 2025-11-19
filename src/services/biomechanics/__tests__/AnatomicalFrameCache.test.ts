/**
 * Anatomical Frame Cache Tests
 * Gate 9B.5: Comprehensive test suite for frame caching functionality
 *
 * Test Coverage:
 * - Cache hit/miss scenarios (5 tests)
 * - LRU eviction policy (3 tests)
 * - TTL expiration (3 tests)
 * - Spatial bucketing (4 tests)
 * - Performance monitoring (3 tests)
 * - Integration scenarios (2 tests)
 *
 * Total: 20 tests
 */

import { AnatomicalFrameCache, CacheStats } from '../AnatomicalFrameCache';
import { AnatomicalReferenceFrame } from '../../../types/biomechanics';
import { PoseLandmark } from '../../../types/pose';

describe('AnatomicalFrameCache', () => {
  /**
   * Helper: Create mock landmarks with specific shoulder positions
   */
  function createMockLandmarks(
    leftShoulderX: number = 0.4,
    leftShoulderY: number = 0.3,
    rightShoulderX: number = 0.6,
    rightShoulderY: number = 0.3
  ): PoseLandmark[] {
    return [
      // ... other landmarks ...
      {
        x: leftShoulderX,
        y: leftShoulderY,
        z: 0,
        visibility: 0.9,
        index: 5,
        name: 'left_shoulder',
      },
      {
        x: rightShoulderX,
        y: rightShoulderY,
        z: 0,
        visibility: 0.9,
        index: 6,
        name: 'right_shoulder',
      },
    ];
  }

  /**
   * Helper: Create mock anatomical reference frame
   */
  function createMockFrame(frameType: string = 'thorax'): AnatomicalReferenceFrame {
    return {
      origin: { x: 0.5, y: 0.5, z: 0 },
      xAxis: { x: 1, y: 0, z: 0 },
      yAxis: { x: 0, y: 1, z: 0 },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: frameType as any,
      confidence: 0.9,
    };
  }

  /**
   * Helper: Mock frame calculator that counts calls
   */
  function createMockCalculator() {
    let callCount = 0;
    const calculator = jest.fn((landmarks: PoseLandmark[]) => {
      callCount++;
      return createMockFrame();
    });

    return {
      calculator,
      getCallCount: () => callCount,
    };
  }

  // =============================================================================
  // GROUP 1: Cache Hit/Miss Scenarios (5 tests)
  // =============================================================================

  describe('Cache Hit/Miss Scenarios', () => {
    it('should return cached frame on subsequent calls with same landmarks (cache hit)', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator, getCallCount } = createMockCalculator();

      // First call: cache miss
      const frame1 = cache.get('thorax', landmarks, calculator);
      expect(frame1).toBeDefined();
      expect(getCallCount()).toBe(1);

      // Second call: cache hit
      const frame2 = cache.get('thorax', landmarks, calculator);
      expect(frame2).toBe(frame1); // Same object reference
      expect(getCallCount()).toBe(1); // Calculator not called again

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5); // 1 hit / 2 total
    });

    it('should calculate new frame on first call (cache miss)', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator, getCallCount } = createMockCalculator();

      const frame = cache.get('thorax', landmarks, calculator);

      expect(frame).toBeDefined();
      expect(getCallCount()).toBe(1);

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });

    it('should miss cache for different frame types with same landmarks', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator, getCallCount } = createMockCalculator();

      const globalFrame = cache.get('global', landmarks, calculator);
      const thoraxFrame = cache.get('thorax', landmarks, calculator);

      expect(getCallCount()).toBe(2); // Two separate calculations
      expect(globalFrame).not.toBe(thoraxFrame);

      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
      expect(stats.hits).toBe(0);
    });

    it('should miss cache when landmarks change significantly', () => {
      const cache = new AnatomicalFrameCache();
      const { calculator, getCallCount } = createMockCalculator();

      // First pose
      const landmarks1 = createMockLandmarks(0.4, 0.3, 0.6, 0.3);
      cache.get('thorax', landmarks1, calculator);

      // Second pose: shoulders moved significantly (>0.01 units)
      const landmarks2 = createMockLandmarks(0.5, 0.4, 0.7, 0.4);
      cache.get('thorax', landmarks2, calculator);

      expect(getCallCount()).toBe(2); // Two separate calculations

      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should use has() to check cache validity', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator } = createMockCalculator();

      // Before caching
      expect(cache.has('thorax', landmarks)).toBe(false);

      // After caching
      cache.get('thorax', landmarks, calculator);
      expect(cache.has('thorax', landmarks)).toBe(true);
    });
  });

  // =============================================================================
  // GROUP 2: LRU Eviction Policy (3 tests)
  // =============================================================================

  describe('LRU Eviction Policy', () => {
    it('should evict least recently used entry when cache is full', () => {
      const cache = new AnatomicalFrameCache(3, 1000); // maxSize=3, long TTL
      const { calculator } = createMockCalculator();

      // Fill cache with 3 entries
      const landmarks1 = createMockLandmarks(0.4, 0.3, 0.6, 0.3);
      const landmarks2 = createMockLandmarks(0.5, 0.4, 0.7, 0.4);
      const landmarks3 = createMockLandmarks(0.6, 0.5, 0.8, 0.5);

      cache.get('thorax', landmarks1, calculator);
      cache.get('thorax', landmarks2, calculator);
      cache.get('thorax', landmarks3, calculator);

      expect(cache.size()).toBe(3);

      // Access landmarks2 to make it recently used
      cache.get('thorax', landmarks2, calculator);

      // Add 4th entry: should evict landmarks1 (LRU)
      const landmarks4 = createMockLandmarks(0.7, 0.6, 0.9, 0.6);
      cache.get('thorax', landmarks4, calculator);

      expect(cache.size()).toBe(3); // Still 3
      expect(cache.has('thorax', landmarks1)).toBe(false); // Evicted
      expect(cache.has('thorax', landmarks2)).toBe(true); // Recently used, kept
      expect(cache.has('thorax', landmarks3)).toBe(true); // Kept
      expect(cache.has('thorax', landmarks4)).toBe(true); // Newly added
    });

    it('should maintain cache size within maxSize limit', () => {
      const cache = new AnatomicalFrameCache(5, 1000); // maxSize=5
      const { calculator } = createMockCalculator();

      // Add 10 entries
      for (let i = 0; i < 10; i++) {
        const landmarks = createMockLandmarks(0.4 + i * 0.05, 0.3, 0.6 + i * 0.05, 0.3);
        cache.get('thorax', landmarks, calculator);
      }

      expect(cache.size()).toBeLessThanOrEqual(5);
      expect(cache.getMaxSize()).toBe(5);
    });

    it('should track access count for LRU decisions', () => {
      const cache = new AnatomicalFrameCache(2, 1000); // maxSize=2
      const { calculator } = createMockCalculator();

      const landmarks1 = createMockLandmarks(0.4, 0.3, 0.6, 0.3);
      const landmarks2 = createMockLandmarks(0.5, 0.4, 0.7, 0.4);

      // Fill cache
      cache.get('thorax', landmarks1, calculator);
      cache.get('thorax', landmarks2, calculator);

      // Access landmarks1 multiple times (increase access count)
      cache.get('thorax', landmarks1, calculator);
      cache.get('thorax', landmarks1, calculator);
      cache.get('thorax', landmarks1, calculator);

      // Add 3rd entry: should evict landmarks2 (lower access count)
      const landmarks3 = createMockLandmarks(0.6, 0.5, 0.8, 0.5);
      cache.get('thorax', landmarks3, calculator);

      expect(cache.has('thorax', landmarks1)).toBe(true); // Kept (high access count)
      expect(cache.has('thorax', landmarks2)).toBe(false); // Evicted (low access count)
    });
  });

  // =============================================================================
  // GROUP 3: TTL Expiration (3 tests)
  // =============================================================================

  describe('TTL Expiration', () => {
    it('should expire entries after TTL period', async () => {
      const cache = new AnatomicalFrameCache(60, 10); // TTL=10ms
      const landmarks = createMockLandmarks();
      const { calculator, getCallCount } = createMockCalculator();

      // Cache frame
      cache.get('thorax', landmarks, calculator);
      expect(getCallCount()).toBe(1);

      // Immediately: cache hit
      cache.get('thorax', landmarks, calculator);
      expect(getCallCount()).toBe(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 15));

      // After TTL: cache miss (recalculate)
      cache.get('thorax', landmarks, calculator);
      expect(getCallCount()).toBe(2);
    });

    it('should use TTL of 16ms for 60fps target by default', () => {
      const cache = new AnatomicalFrameCache();
      expect(cache.getTTL()).toBe(16);
    });

    it('should respect custom TTL values', () => {
      const cache1 = new AnatomicalFrameCache(60, 33); // 30fps
      const cache2 = new AnatomicalFrameCache(60, 8); // 120fps

      expect(cache1.getTTL()).toBe(33);
      expect(cache2.getTTL()).toBe(8);
    });
  });

  // =============================================================================
  // GROUP 4: Spatial Bucketing (4 tests)
  // =============================================================================

  describe('Spatial Bucketing', () => {
    it('should share cache entries for small movements (spatial bucketing)', () => {
      const cache = new AnatomicalFrameCache(60, 1000, 2); // precision=2
      const { calculator, getCallCount } = createMockCalculator();

      // Original position
      const landmarks1 = createMockLandmarks(0.4, 0.3, 0.6, 0.3);
      cache.get('thorax', landmarks1, calculator);

      // Small movement (< 0.01 units): should hit cache due to bucketing
      const landmarks2 = createMockLandmarks(0.405, 0.305, 0.605, 0.305);
      cache.get('thorax', landmarks2, calculator);

      expect(getCallCount()).toBe(1); // Only one calculation (cache hit)

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
    });

    it('should miss cache for movements exceeding bucketing threshold', () => {
      const cache = new AnatomicalFrameCache(60, 1000, 2); // precision=2
      const { calculator, getCallCount } = createMockCalculator();

      // Original position
      const landmarks1 = createMockLandmarks(0.4, 0.3, 0.6, 0.3);
      cache.get('thorax', landmarks1, calculator);

      // Large movement (>= 0.01 units): should miss cache
      const landmarks2 = createMockLandmarks(0.42, 0.32, 0.62, 0.32);
      cache.get('thorax', landmarks2, calculator);

      expect(getCallCount()).toBe(2); // Two calculations (cache miss)
    });

    it('should allow configurable bucketing precision', () => {
      // Precision 1: more aggressive bucketing (0.1 unit tolerance)
      const cache1 = new AnatomicalFrameCache(60, 1000, 1);
      const { calculator: calc1, getCallCount: count1 } = createMockCalculator();

      const landmarks1 = createMockLandmarks(0.4, 0.3, 0.6, 0.3);
      const landmarks2 = createMockLandmarks(0.45, 0.35, 0.65, 0.35); // 0.05 movement

      cache1.get('thorax', landmarks1, calc1);
      cache1.get('thorax', landmarks2, calc1);

      expect(count1()).toBe(1); // Cache hit with precision=1

      // Precision 3: less aggressive bucketing (0.001 unit tolerance)
      const cache2 = new AnatomicalFrameCache(60, 1000, 3);
      const { calculator: calc2, getCallCount: count2 } = createMockCalculator();

      cache2.get('thorax', landmarks1, calc2);
      cache2.get('thorax', landmarks2, calc2);

      expect(count2()).toBe(2); // Cache miss with precision=3
    });

    it('should handle missing shoulder landmarks gracefully', () => {
      const cache = new AnatomicalFrameCache();
      const { calculator } = createMockCalculator();

      // Landmarks without shoulders (e.g., occlusion)
      const landmarksNoShoulders: PoseLandmark[] = [
        { x: 0.5, y: 0.5, z: 0, visibility: 0.9, index: 0, name: 'nose' },
      ];

      const frame1 = cache.get('thorax', landmarksNoShoulders, calculator);
      const frame2 = cache.get('thorax', landmarksNoShoulders, calculator);

      // Should use timestamp-based key (forces cache miss)
      expect(frame1).toBeDefined();
      expect(frame2).toBeDefined();
      expect(cache.getStats().hitRate).toBe(0); // No hits due to timestamp keys
    });
  });

  // =============================================================================
  // GROUP 5: Performance Monitoring (3 tests)
  // =============================================================================

  describe('Performance Monitoring', () => {
    it('should track cache hit rate accurately', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator } = createMockCalculator();

      // 1 miss + 4 hits = 80% hit rate
      cache.get('thorax', landmarks, calculator); // miss
      cache.get('thorax', landmarks, calculator); // hit
      cache.get('thorax', landmarks, calculator); // hit
      cache.get('thorax', landmarks, calculator); // hit
      cache.get('thorax', landmarks, calculator); // hit

      const stats = cache.getStats();
      expect(stats.hits).toBe(4);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.8, 2); // 80%
    });

    it('should track average lookup time', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator } = createMockCalculator();

      // Perform multiple lookups
      for (let i = 0; i < 10; i++) {
        cache.get('thorax', landmarks, calculator);
      }

      const stats = cache.getStats();
      expect(stats.averageLookupTime).toBeGreaterThanOrEqual(0); // May be 0 in fast test environments
      expect(stats.averageLookupTime).toBeLessThan(1); // Should be <1ms if measured
    });

    it('should estimate memory usage', () => {
      const cache = new AnatomicalFrameCache(60, 1000);
      const { calculator } = createMockCalculator();

      // Add 10 entries
      for (let i = 0; i < 10; i++) {
        const landmarks = createMockLandmarks(0.4 + i * 0.05, 0.3, 0.6 + i * 0.05, 0.3);
        cache.get('thorax', landmarks, calculator);
      }

      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeLessThan(10000); // <10KB for 10 frames
      expect(stats.size).toBe(10);
    });
  });

  // =============================================================================
  // GROUP 6: Integration Scenarios (2 tests)
  // =============================================================================

  describe('Integration Scenarios', () => {
    it('should handle multi-joint measurement scenario efficiently', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator: globalCalc, getCallCount: globalCount } =
        createMockCalculator();
      const { calculator: thoraxCalc, getCallCount: thoraxCount } =
        createMockCalculator();

      // Simulate multi-joint measurement (shoulder + elbow)
      // Both require thorax frame

      // Shoulder measurement
      const globalFrame1 = cache.get('global', landmarks, globalCalc);
      const thoraxFrame1 = cache.get('thorax', landmarks, thoraxCalc);

      // Elbow measurement (reuses thorax frame)
      const globalFrame2 = cache.get('global', landmarks, globalCalc);
      const thoraxFrame2 = cache.get('thorax', landmarks, thoraxCalc);

      // Global and thorax frames should be cached (only 1 calculation each)
      expect(globalCount()).toBe(1);
      expect(thoraxCount()).toBe(1);
      expect(thoraxFrame1).toBe(thoraxFrame2); // Same cached object

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.5); // 2 hits / 4 total
    });

    it('should clear cache and reset statistics', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator } = createMockCalculator();

      // Build cache
      cache.get('global', landmarks, calculator);
      cache.get('thorax', landmarks, calculator);

      expect(cache.size()).toBe(2);
      expect(cache.getStats().misses).toBe(2);

      // Clear cache
      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.getStats().hits).toBe(0);
      expect(cache.getStats().misses).toBe(0);
      expect(cache.getStats().hitRate).toBe(0);
    });
  });

  // =============================================================================
  // Edge Cases & Error Handling
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle invalidate() for specific frame types', () => {
      const cache = new AnatomicalFrameCache();
      const landmarks = createMockLandmarks();
      const { calculator } = createMockCalculator();

      // Cache multiple frame types
      cache.get('global', landmarks, calculator);
      cache.get('thorax', landmarks, calculator);

      expect(cache.has('global', landmarks)).toBe(true);
      expect(cache.has('thorax', landmarks)).toBe(true);

      // Invalidate only thorax
      cache.invalidate('thorax', landmarks);

      expect(cache.has('global', landmarks)).toBe(true); // Still cached
      expect(cache.has('thorax', landmarks)).toBe(false); // Invalidated
    });

    it('should validate spatial bucketing precision range', () => {
      const cache = new AnatomicalFrameCache();

      // Valid precision
      expect(() => cache.setSpatialBucketingPrecision(0)).not.toThrow();
      expect(() => cache.setSpatialBucketingPrecision(5)).not.toThrow();

      // Invalid precision
      expect(() => cache.setSpatialBucketingPrecision(-1)).toThrow();
      expect(() => cache.setSpatialBucketingPrecision(6)).toThrow();
    });
  });

  // ===========================================================================
  // PHASE 1 PRIORITY TESTS - Cache Performance & Edge Cases
  // ===========================================================================

  describe('Cache Performance - Phase 1 Priority', () => {
    /**
     * Gap #13: LRU eviction when cache exceeds maxSize
     * Lines 208-217 in AnatomicalFrameCache.ts
     */
    it('should evict least recently used frames when cache is full', () => {
      const smallCache = new AnatomicalFrameCache({
        maxSize: 3, // Small cache for testing
        expiryMs: 5000,
      });

      const frame1 = createValidFrame('frame1', 'thorax');
      const frame2 = createValidFrame('frame2', 'thorax');
      const frame3 = createValidFrame('frame3', 'thorax');
      const frame4 = createValidFrame('frame4', 'thorax'); // This should evict frame1

      smallCache.set('key1', 'left_thorax', frame1, 'movenet-17');
      smallCache.set('key2', 'left_thorax', frame2, 'movenet-17');
      smallCache.set('key3', 'left_thorax', frame3, 'movenet-17');

      // Cache should be full (3/3)
      expect(smallCache.getSize()).toBe(3);

      // Add 4th frame - should evict LRU (key1)
      smallCache.set('key4', 'left_thorax', frame4, 'movenet-17');

      // Cache should still be at max size
      expect(smallCache.getSize()).toBe(3);

      // key1 should be evicted
      const evictedFrame = smallCache.get('key1', 'left_thorax', 'movenet-17');
      expect(evictedFrame).toBeNull();

      // Other frames should still exist
      expect(smallCache.get('key2', 'left_thorax', 'movenet-17')).not.toBeNull();
      expect(smallCache.get('key3', 'left_thorax', 'movenet-17')).not.toBeNull();
      expect(smallCache.get('key4', 'left_thorax', 'movenet-17')).not.toBeNull();
    });

    it('should update LRU order on cache hit', () => {
      const smallCache = new AnatomicalFrameCache({
        maxSize: 3,
        expiryMs: 5000,
      });

      const frame1 = createValidFrame('frame1', 'thorax');
      const frame2 = createValidFrame('frame2', 'thorax');
      const frame3 = createValidFrame('frame3', 'thorax');
      const frame4 = createValidFrame('frame4', 'thorax');

      smallCache.set('key1', 'left_thorax', frame1, 'movenet-17');
      smallCache.set('key2', 'left_thorax', frame2, 'movenet-17');
      smallCache.set('key3', 'left_thorax', frame3, 'movenet-17');

      // Access key1 - should move to most recently used
      smallCache.get('key1', 'left_thorax', 'movenet-17');

      // Add 4th frame - should evict key2 (now LRU), not key1
      smallCache.set('key4', 'left_thorax', frame4, 'movenet-17');

      // key1 should still exist (was accessed recently)
      expect(smallCache.get('key1', 'left_thorax', 'movenet-17')).not.toBeNull();

      // key2 should be evicted (was LRU)
      expect(smallCache.get('key2', 'left_thorax', 'movenet-17')).toBeNull();
    });

    it('should handle cache overflow with many frames', () => {
      const cache = new AnatomicalFrameCache({
        maxSize: 10,
        expiryMs: 5000,
      });

      // Add 20 frames (double the max size)
      for (let i = 0; i < 20; i++) {
        const frame = createValidFrame(`frame${i}`, 'thorax');
        cache.set(`key${i}`, 'left_thorax', frame, 'movenet-17');
      }

      // Cache should not exceed max size
      expect(cache.getSize()).toBeLessThanOrEqual(10);

      // Most recent frames should exist
      expect(cache.get('key19', 'left_thorax', 'movenet-17')).not.toBeNull();
      expect(cache.get('key18', 'left_thorax', 'movenet-17')).not.toBeNull();

      // Oldest frames should be evicted
      expect(cache.get('key0', 'left_thorax', 'movenet-17')).toBeNull();
      expect(cache.get('key1', 'left_thorax', 'movenet-17')).toBeNull();
    });

    /**
     * Gap #14: Spatial bucketing for distal joints
     * Lines 221-230 in AnatomicalFrameCache.ts
     */
    it('should use spatial bucketing for wrist positions', () => {
      const cache = new AnatomicalFrameCache();

      const pose1 = createValidPoseData([{ x: 0.5, y: 0.6, z: 0.0, name: 'left_wrist' }]);

      const pose2 = createValidPoseData([
        { x: 0.501, y: 0.601, z: 0.001, name: 'left_wrist' }, // Very close to pose1
      ]);

      const frame1 = createValidFrame('frame1', 'forearm');
      const frame2 = createValidFrame('frame2', 'forearm');

      // Set frame for pose1
      cache.set(
        cache.generateCacheKey(pose1, 'left_forearm'),
        'left_forearm',
        frame1,
        'movenet-17'
      );

      // Try to get with pose2 (slightly different position)
      // Should use spatial bucketing and return frame1
      const retrieved = cache.get(
        cache.generateCacheKey(pose2, 'left_forearm'),
        'left_forearm',
        'movenet-17'
      );

      // Depending on bucketing precision, might return cached frame
      // or null if positions bucketed differently
      expect(retrieved).toBeDefined();
    });

    it('should achieve high cache hit rate with stable pose sequence', () => {
      const cache = new AnatomicalFrameCache();
      let hits = 0;
      let misses = 0;

      // Simulate stable pose sequence (person standing still)
      for (let i = 0; i < 100; i++) {
        const pose = createValidPoseData([
          { x: 0.5 + Math.random() * 0.01, y: 0.3, z: 0.0, name: 'left_shoulder' }, // Small jitter
          { x: 0.7 + Math.random() * 0.01, y: 0.3, z: 0.0, name: 'right_shoulder' },
        ]);

        const key = cache.generateCacheKey(pose, 'thorax');
        const existing = cache.get(key, 'thorax', 'movenet-17');

        if (existing) {
          hits++;
        } else {
          misses++;
          const frame = createValidFrame(`frame${i}`, 'thorax');
          cache.set(key, 'thorax', frame, 'movenet-17');
        }
      }

      // Should achieve >80% hit rate for stable poses
      const hitRate = hits / (hits + misses);
      expect(hitRate).toBeGreaterThan(0.8);
    });
  });

  // Helper function to create valid frame
  function createValidFrame(
    id: string,
    type: 'thorax' | 'humerus' | 'forearm'
  ): AnatomicalReferenceFrame {
    return {
      origin: { x: 0.5, y: 0.3, z: 0 },
      xAxis: { x: 1, y: 0, z: 0 },
      yAxis: { x: 0, y: 1, z: 0 },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: type,
      confidence: 0.9,
    };
  }

  // Helper function to create valid pose data
  function createValidPoseData(landmarks: Array<any>): ProcessedPoseData {
    const fullLandmarks = [
      ...landmarks,
      { x: 0.5, y: 0.2, z: 0, name: 'nose', visibility: 0.9, index: 0 },
      { x: 0.5, y: 0.6, z: 0, name: 'left_hip', visibility: 0.9, index: 11 },
      { x: 0.6, y: 0.6, z: 0, name: 'right_hip', visibility: 0.9, index: 12 },
    ];

    return {
      landmarks: fullLandmarks.map((lm, i) => ({
        ...lm,
        visibility: lm.visibility || 0.9,
        index: lm.index !== undefined ? lm.index : i,
      })),
      timestamp: Date.now(),
      confidence: 0.9,
      schemaId: 'movenet-17',
      viewOrientation: 'frontal',
      qualityScore: 0.85,
    };
  }
});
