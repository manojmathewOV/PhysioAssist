/**
 * Anatomical Frame Cache Service
 *
 * LRU cache with TTL for anatomical reference frames to eliminate redundant computation.
 * Gate 9B.5: Performance optimization for clinical measurements.
 *
 * Key Features:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) expiration (16ms for 60fps target)
 * - Spatial bucketing (small movements share cache entries)
 * - Thread-safe for async pose detection
 * - Performance monitoring (hit/miss tracking)
 *
 * Performance Targets:
 * - Cache hit rate: >80% for typical multi-joint measurements
 * - Cache lookup time: <0.1ms (hash map O(1))
 * - Memory footprint: <1MB for 60-frame cache
 *
 * @example
 * const cache = new AnatomicalFrameCache();
 * const thoraxFrame = cache.get(
 *   'thorax',
 *   landmarks,
 *   (lm) => anatomicalService.calculateThoraxFrame(lm, globalFrame)
 * );
 */

import { PoseLandmark } from '../../types/pose';
import { AnatomicalReferenceFrame } from '../../types/biomechanics';

/**
 * Cached frame entry with timestamp for TTL
 */
interface CachedFrameEntry {
  frame: AnatomicalReferenceFrame;
  timestamp: number;
  accessCount: number; // For LRU tracking
}

/**
 * Cache statistics for performance monitoring
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  averageLookupTime: number;
  memoryUsage: number; // Estimated memory in bytes
}

export class AnatomicalFrameCache {
  private cache: Map<string, CachedFrameEntry>;
  private readonly maxSize: number;
  private readonly ttl: number; // milliseconds

  // Performance tracking
  private hits: number = 0;
  private misses: number = 0;
  private lookupTimes: number[] = [];

  // Configuration
  private spatialBucketingPrecision: number = 2; // Decimal places for bucketing

  // Counter for ensuring unique keys when landmarks are missing
  private keyCounter: number = 0;

  /**
   * Create a new anatomical frame cache
   *
   * @param maxSize - Maximum number of frames to cache (default: 60)
   * @param ttl - Time to live in milliseconds (default: 16ms for 60fps)
   * @param spatialBucketingPrecision - Decimal places for position bucketing (default: 2)
   */
  constructor(
    maxSize: number = 60,
    ttl: number = 16,
    spatialBucketingPrecision: number = 2
  ) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.spatialBucketingPrecision = spatialBucketingPrecision;
  }

  /**
   * Get cached frame or compute if cache miss
   *
   * This is the primary method for consuming the cache. It handles:
   * 1. Cache key generation (with spatial bucketing)
   * 2. Cache hit validation (TTL check)
   * 3. Cache miss computation and storage
   * 4. LRU eviction when cache is full
   *
   * @param frameType - Type of frame ('global', 'thorax', 'left_humerus', etc.)
   * @param landmarks - Current pose landmarks
   * @param calculator - Function to compute frame if cache miss
   * @returns Anatomical reference frame (cached or freshly computed)
   *
   * @example
   * const thoraxFrame = cache.get('thorax', landmarks, (lm) =>
   *   anatomicalService.calculateThoraxFrame(lm, globalFrame)
   * );
   */
  public get(
    frameType: string,
    landmarks: PoseLandmark[],
    calculator: (landmarks: PoseLandmark[]) => AnatomicalReferenceFrame
  ): AnatomicalReferenceFrame {
    const startTime = performance.now();

    // Generate cache key with spatial bucketing
    const key = this.generateKey(frameType, landmarks);

    // Check for cache hit
    const cached = this.cache.get(key);
    const now = Date.now();

    // Cache hit: Return cached frame if still valid (within TTL)
    if (cached && now - cached.timestamp < this.ttl) {
      // Update access tracking for LRU
      cached.accessCount++;
      this.hits++;

      const lookupTime = performance.now() - startTime;
      this.trackLookupTime(lookupTime);

      return cached.frame;
    }

    // Cache miss: Calculate, store, and return
    this.misses++;
    const frame = calculator(landmarks);

    // Store in cache
    this.cache.set(key, {
      frame,
      timestamp: now,
      accessCount: 1,
    });

    // LRU eviction if cache exceeds max size
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }

    const lookupTime = performance.now() - startTime;
    this.trackLookupTime(lookupTime);

    return frame;
  }

  /**
   * Generate cache key from frame type + landmark positions
   *
   * Uses spatial bucketing: rounds landmark positions to fixed precision
   * so small movements (< threshold) share the same cache entry.
   *
   * Key format: "frameType_lsX_lsY_rsX_rsY"
   * Example: "thorax_0.45_0.32_0.55_0.34"
   *
   * Bucketing: Rounds to spatialBucketingPrecision decimal places
   * - Precision 2: 0.01 units (~10px at 1080p) -> shared within ~1cm movement
   * - Precision 1: 0.1 units (~100px at 1080p) -> more aggressive bucketing
   *
   * @param frameType - Type of frame
   * @param landmarks - Current pose landmarks
   * @returns Cache key string
   */
  private generateKey(frameType: string, landmarks: PoseLandmark[]): string {
    // Use shoulder landmarks as reference points for spatial bucketing
    // These are stable and present in all frames requiring anatomical frames
    const leftShoulder = landmarks.find((lm) => lm.name === 'left_shoulder');
    const rightShoulder = landmarks.find((lm) => lm.name === 'right_shoulder');

    // Fallback if shoulders not found (edge case: occlusion)
    if (!leftShoulder || !rightShoulder) {
      // Use counter-based key to force cache miss (each call gets unique key)
      // This ensures we don't share frames across poses where key landmarks are missing
      return `${frameType}_missing_${this.keyCounter++}`;
    }

    // Round positions to spatialBucketingPrecision for bucketing
    // Use Math.floor for consistent bucketing (not toFixed which rounds to nearest)
    const multiplier = Math.pow(10, this.spatialBucketingPrecision);
    const bucket = (val: number) => Math.floor(val * multiplier) / multiplier;

    const lsX = bucket(leftShoulder.x).toFixed(this.spatialBucketingPrecision);
    const lsY = bucket(leftShoulder.y).toFixed(this.spatialBucketingPrecision);
    const lsZ = bucket(leftShoulder.z ?? 0).toFixed(this.spatialBucketingPrecision);
    const rsX = bucket(rightShoulder.x).toFixed(this.spatialBucketingPrecision);
    const rsY = bucket(rightShoulder.y).toFixed(this.spatialBucketingPrecision);
    const rsZ = bucket(rightShoulder.z ?? 0).toFixed(this.spatialBucketingPrecision);

    // For humerus/forearm frames, include elbow/wrist positions to capture arm pose
    // This prevents cache collisions when proximal joints are static but distal joints move
    const leftElbow = landmarks.find((lm) => lm.name === 'left_elbow');
    const rightElbow = landmarks.find((lm) => lm.name === 'right_elbow');
    const leftWrist = landmarks.find((lm) => lm.name === 'left_wrist');
    const rightWrist = landmarks.find((lm) => lm.name === 'right_wrist');

    let distalKey = '';
    if (frameType.includes('humerus')) {
      // Humerus: shoulder→elbow, so include elbow position
      if (frameType.includes('left') && leftElbow) {
        const leX = bucket(leftElbow.x).toFixed(this.spatialBucketingPrecision);
        const leY = bucket(leftElbow.y).toFixed(this.spatialBucketingPrecision);
        const leZ = bucket(leftElbow.z ?? 0).toFixed(this.spatialBucketingPrecision);
        distalKey = `_${leX}_${leY}_${leZ}`;
      } else if (frameType.includes('right') && rightElbow) {
        const reX = bucket(rightElbow.x).toFixed(this.spatialBucketingPrecision);
        const reY = bucket(rightElbow.y).toFixed(this.spatialBucketingPrecision);
        const reZ = bucket(rightElbow.z ?? 0).toFixed(this.spatialBucketingPrecision);
        distalKey = `_${reX}_${reY}_${reZ}`;
      }
    } else if (frameType.includes('forearm')) {
      // Forearm: elbow→wrist, so include wrist position
      if (frameType.includes('left') && leftWrist) {
        const lwX = bucket(leftWrist.x).toFixed(this.spatialBucketingPrecision);
        const lwY = bucket(leftWrist.y).toFixed(this.spatialBucketingPrecision);
        const lwZ = bucket(leftWrist.z ?? 0).toFixed(this.spatialBucketingPrecision);
        distalKey = `_${lwX}_${lwY}_${lwZ}`;
      } else if (frameType.includes('right') && rightWrist) {
        const rwX = bucket(rightWrist.x).toFixed(this.spatialBucketingPrecision);
        const rwY = bucket(rightWrist.y).toFixed(this.spatialBucketingPrecision);
        const rwZ = bucket(rightWrist.z ?? 0).toFixed(this.spatialBucketingPrecision);
        distalKey = `_${rwX}_${rwY}_${rwZ}`;
      }
    }

    // Include Z coordinates to handle sagittal/frontal view orientations
    // where shoulders differ in depth rather than lateral position
    return `${frameType}_${lsX}_${lsY}_${lsZ}_${rsX}_${rsY}_${rsZ}${distalKey}`;
  }

  /**
   * Evict least recently used entry from cache
   *
   * LRU policy: Remove the entry with lowest accessCount
   * This ensures frequently-used frames stay cached longer
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruAccessCount = Infinity;

    // Find entry with lowest access count
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lruAccessCount) {
        lruAccessCount = entry.accessCount;
        lruKey = key;
      }
    }

    // Remove LRU entry
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Track lookup time for performance monitoring
   */
  private trackLookupTime(time: number): void {
    this.lookupTimes.push(time);

    // Keep only last 100 lookups to avoid memory growth
    if (this.lookupTimes.length > 100) {
      this.lookupTimes.shift();
    }
  }

  /**
   * Clear all cached frames
   *
   * Call when:
   * - New exercise session starts
   * - Patient moves out of frame
   * - Camera switches
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.lookupTimes = [];
  }

  /**
   * Get cache statistics for performance monitoring
   *
   * @returns Cache statistics including hit rate and memory usage
   */
  public getStats(): CacheStats {
    const totalLookups = this.hits + this.misses;
    const hitRate = totalLookups > 0 ? this.hits / totalLookups : 0;

    const averageLookupTime =
      this.lookupTimes.length > 0
        ? this.lookupTimes.reduce((sum, t) => sum + t, 0) / this.lookupTimes.length
        : 0;

    // Estimate memory usage
    // Each frame: ~200 bytes (origin: 24 bytes, 3 axes: 72 bytes, metadata: ~100 bytes)
    const bytesPerFrame = 200;
    const memoryUsage = this.cache.size * bytesPerFrame;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: 0, // TODO: Track evictions when LRU eviction is implemented
      hitRate,
      averageLookupTime,
      memoryUsage,
    };
  }

  /**
   * Check if a specific frame type is cached for given landmarks
   *
   * Useful for testing and diagnostics
   *
   * @param frameType - Type of frame to check
   * @param landmarks - Pose landmarks
   * @returns True if frame is cached and valid (within TTL)
   */
  public has(frameType: string, landmarks: PoseLandmark[]): boolean {
    const key = this.generateKey(frameType, landmarks);
    const cached = this.cache.get(key);

    if (!cached) {
      return false;
    }

    const now = Date.now();
    return now - cached.timestamp < this.ttl;
  }

  /**
   * Manually invalidate a specific frame type
   *
   * Useful for testing or when specific landmarks change significantly
   *
   * @param frameType - Type of frame to invalidate
   * @param landmarks - Pose landmarks
   */
  public invalidate(frameType: string, landmarks: PoseLandmark[]): void {
    const key = this.generateKey(frameType, landmarks);
    this.cache.delete(key);
  }

  /**
   * Get current cache size
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Get maximum cache size
   */
  public getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Get TTL in milliseconds
   */
  public getTTL(): number {
    return this.ttl;
  }

  /**
   * Update spatial bucketing precision
   *
   * Higher precision (more decimal places) = less aggressive bucketing
   * Lower precision (fewer decimal places) = more aggressive bucketing
   *
   * @param precision - Number of decimal places for position rounding
   */
  public setSpatialBucketingPrecision(precision: number): void {
    if (precision < 0 || precision > 5) {
      throw new Error('Spatial bucketing precision must be between 0 and 5');
    }
    this.spatialBucketingPrecision = precision;
  }
}
