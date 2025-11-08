/**
 * One-Euro Filter Implementation
 *
 * Low-latency filter for smoothing noisy pose landmark data while maintaining
 * responsiveness to quick movements. Widely used in real-time tracking applications.
 *
 * Original paper: "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
 * by Géry Casiez, Nicolas Roussel, and Daniel Vogel (ACM CHI 2012)
 *
 * @see https://cristal.univ-lille.fr/~casiez/1euro/
 * @see docs/research/CLINICAL_FRAMEWORK_INTEGRATION.md
 *
 * @module smoothing
 */

/**
 * Low-pass filter with exponential smoothing.
 * Core building block of the One-Euro filter.
 */
class LowPassFilter {
  private hatxprev: number | null = null;
  private xprev: number | null = null;

  /**
   * Apply low-pass filter to new value.
   *
   * @param x - Raw input value
   * @param alpha - Smoothing factor (0 = maximum smoothing, 1 = no smoothing)
   * @returns Filtered value
   */
  filter(x: number, alpha: number): number {
    if (this.xprev === null) {
      // First value, no filtering
      this.xprev = x;
      this.hatxprev = x;
      return x;
    }

    // Exponential smoothing: hatx = alpha * x + (1 - alpha) * hatxprev
    const hatx = alpha * x + (1 - alpha) * this.hatxprev!;

    this.xprev = x;
    this.hatxprev = hatx;

    return hatx;
  }

  /**
   * Reset filter state.
   */
  reset(): void {
    this.hatxprev = null;
    this.xprev = null;
  }
}

/**
 * One-Euro Filter for pose landmark smoothing.
 *
 * Automatically adjusts smoothing based on movement speed:
 * - Slow movements → more smoothing (reduces jitter)
 * - Fast movements → less smoothing (maintains responsiveness)
 *
 * @example
 * const filter = new OneEuroFilter(1.0, 0.007, 1.0);
 * const smoothedX = filter.filter(noisyX, timestamp);
 * const smoothedY = filter.filter(noisyY, timestamp);
 */
export class OneEuroFilter {
  private x: LowPassFilter;
  private dx: LowPassFilter;
  private tprev: number | null = null;

  /**
   * Create a One-Euro filter.
   *
   * @param minCutoff - Minimum cutoff frequency (Hz). Lower = more smoothing. Default: 1.0 Hz
   * @param beta - Speed coefficient. Higher = more responsive to velocity. Default: 0.007
   * @param dCutoff - Cutoff frequency for velocity calculation. Default: 1.0 Hz
   *
   * Tuning guidelines:
   * - Decrease minCutoff to reduce jitter (but increases lag)
   * - Increase beta to reduce lag during fast movements (but may increase jitter)
   * - Keep dCutoff at 1.0 Hz for most applications
   *
   * @see CLINICAL_THRESHOLDS.filtering.oneEuro for recommended pose tracking values
   */
  constructor(
    private minCutoff: number = 1.0,
    private beta: number = 0.007,
    private dCutoff: number = 1.0
  ) {
    this.x = new LowPassFilter();
    this.dx = new LowPassFilter();
  }

  /**
   * Filter a new value.
   *
   * @param value - Raw input value (e.g., landmark x coordinate)
   * @param timestamp - Timestamp in seconds (use performance.now() / 1000)
   * @returns Smoothed value
   *
   * @example
   * const timestamp = performance.now() / 1000;
   * const smoothedElbowX = elbowFilter.filter(landmark.x, timestamp);
   */
  filter(value: number, timestamp: number): number {
    if (this.tprev === null) {
      // First value
      this.tprev = timestamp;
      return this.x.filter(value, this.alpha(0.0166, this.minCutoff)); // Assume 60fps initially
    }

    // Calculate time delta
    const dt = timestamp - this.tprev;
    this.tprev = timestamp;

    // Calculate velocity (dx/dt)
    const edx = (value - (this.x.xprev ?? value)) / dt;
    const edxHat = this.dx.filter(edx, this.alpha(dt, this.dCutoff));

    // Adjust cutoff frequency based on velocity (speed-based adaptation)
    const cutoff = this.minCutoff + this.beta * Math.abs(edxHat);

    // Apply low-pass filter with adaptive cutoff
    return this.x.filter(value, this.alpha(dt, cutoff));
  }

  /**
   * Calculate smoothing factor (alpha) from cutoff frequency.
   *
   * @param dt - Time delta in seconds
   * @param cutoff - Cutoff frequency in Hz
   * @returns Alpha value between 0 and 1
   */
  private alpha(dt: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  /**
   * Reset filter state. Call when tracking is lost or new patient session starts.
   */
  reset(): void {
    this.x.reset();
    this.dx.reset();
    this.tprev = null;
  }
}

/**
 * Multi-dimensional One-Euro filter for 2D/3D coordinates.
 *
 * Maintains separate filters for each dimension to preserve directional independence.
 *
 * @example
 * const filter = new OneEuroFilter2D(1.0, 0.007);
 * const smoothed = filter.filter({ x: noisyX, y: noisyY }, timestamp);
 */
export class OneEuroFilter2D {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  /**
   * Filter 2D coordinate.
   *
   * @param point - Raw 2D point { x, y }
   * @param timestamp - Timestamp in seconds
   * @returns Smoothed 2D point
   */
  filter(point: { x: number; y: number }, timestamp: number): { x: number; y: number } {
    return {
      x: this.filterX.filter(point.x, timestamp),
      y: this.filterY.filter(point.y, timestamp),
    };
  }

  reset(): void {
    this.filterX.reset();
    this.filterY.reset();
  }
}

/**
 * 3D One-Euro filter for MediaPipe pose landmarks (x, y, z).
 *
 * @example
 * const filter = new OneEuroFilter3D(1.0, 0.007);
 * const smoothed = filter.filter(
 *   { x: landmark.x, y: landmark.y, z: landmark.z },
 *   timestamp
 * );
 */
export class OneEuroFilter3D {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private filterZ: OneEuroFilter;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterZ = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  /**
   * Filter 3D coordinate.
   *
   * @param point - Raw 3D point { x, y, z }
   * @param timestamp - Timestamp in seconds
   * @returns Smoothed 3D point
   */
  filter(
    point: { x: number; y: number; z: number },
    timestamp: number
  ): { x: number; y: number; z: number } {
    return {
      x: this.filterX.filter(point.x, timestamp),
      y: this.filterY.filter(point.y, timestamp),
      z: this.filterZ.filter(point.z, timestamp),
    };
  }

  reset(): void {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }
}

/**
 * Pose landmark filter manager.
 *
 * Maintains separate One-Euro filters for all 33 MediaPipe pose landmarks.
 * Automatically handles visibility filtering and reset on tracking loss.
 *
 * @example
 * const poseFilter = new PoseLandmarkFilter();
 * const smoothedLandmarks = poseFilter.filterPose(rawLandmarks, timestamp);
 */
export class PoseLandmarkFilter {
  private filters: Map<number, OneEuroFilter3D>;
  private readonly minVisibility: number;

  /**
   * @param minCutoff - Base smoothing (default: 1.0 Hz from clinical thresholds)
   * @param beta - Speed responsiveness (default: 0.007 from clinical thresholds)
   * @param dCutoff - Velocity smoothing (default: 1.0 Hz)
   * @param minVisibility - Minimum MediaPipe visibility to trust landmark (default: 0.5)
   */
  constructor(
    minCutoff: number = 1.0,
    beta: number = 0.007,
    dCutoff: number = 1.0,
    minVisibility: number = 0.5
  ) {
    this.filters = new Map();
    this.minVisibility = minVisibility;

    // Pre-create filters for all 33 MediaPipe landmarks
    for (let i = 0; i < 33; i++) {
      this.filters.set(i, new OneEuroFilter3D(minCutoff, beta, dCutoff));
    }
  }

  /**
   * Filter all pose landmarks.
   *
   * @param landmarks - Array of 33 MediaPipe pose landmarks
   * @param timestamp - Timestamp in seconds (use performance.now() / 1000)
   * @returns Smoothed landmarks (same structure as input)
   *
   * Landmarks with visibility < minVisibility are returned unmodified.
   */
  filterPose(
    landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
    timestamp: number
  ): Array<{ x: number; y: number; z: number; visibility?: number }> {
    return landmarks.map((landmark, index) => {
      // Skip filtering if visibility too low (MediaPipe not confident)
      if (landmark.visibility !== undefined && landmark.visibility < this.minVisibility) {
        return landmark;
      }

      const filter = this.filters.get(index);
      if (!filter) {
        return landmark; // Should never happen (all 33 pre-created)
      }

      const smoothed = filter.filter(
        { x: landmark.x, y: landmark.y, z: landmark.z },
        timestamp
      );

      return {
        ...smoothed,
        visibility: landmark.visibility,
      };
    });
  }

  /**
   * Reset all filters. Call when:
   * - Patient moves out of frame (tracking lost)
   * - New exercise session starts
   * - Camera switches
   */
  reset(): void {
    this.filters.forEach((filter) => filter.reset());
  }

  /**
   * Reset specific landmark filter (e.g., if only one limb occludes briefly).
   *
   * @param landmarkIndex - MediaPipe landmark index (0-32)
   */
  resetLandmark(landmarkIndex: number): void {
    const filter = this.filters.get(landmarkIndex);
    if (filter) {
      filter.reset();
    }
  }
}

/**
 * Angle smoothing filter.
 *
 * Specialized for smoothing joint angles calculated from pose landmarks.
 * Handles angle wrapping (e.g., 359° to 1° is 2° change, not 358°).
 *
 * @example
 * const angleFilter = new AngleFilter(1.0, 0.007);
 * const smoothedElbowAngle = angleFilter.filter(noisyAngle, timestamp);
 */
export class AngleFilter {
  private filter: OneEuroFilter;
  private prevAngle: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.filter = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  /**
   * Filter joint angle with wrapping handling.
   *
   * @param angleDegrees - Raw angle in degrees
   * @param timestamp - Timestamp in seconds
   * @returns Smoothed angle in degrees
   */
  filter(angleDegrees: number, timestamp: number): number {
    // Normalize to [0, 360)
    const normalized = ((angleDegrees % 360) + 360) % 360;

    if (this.prevAngle === null) {
      this.prevAngle = normalized;
      return normalized;
    }

    // Handle angle wrapping (shortest path)
    let delta = normalized - this.prevAngle;
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    const unwrapped = this.prevAngle + delta;
    const smoothed = this.filter.filter(unwrapped, timestamp);

    // Normalize result back to [0, 360)
    const result = ((smoothed % 360) + 360) % 360;
    this.prevAngle = result;

    return result;
  }

  reset(): void {
    this.filter.reset();
    this.prevAngle = null;
  }
}

/**
 * Factory function to create pose filter with clinical defaults.
 *
 * @returns PoseLandmarkFilter configured with research-backed parameters
 *
 * @example
 * import { createClinicalPoseFilter } from '@/utils/smoothing';
 * const filter = createClinicalPoseFilter();
 * const smoothed = filter.filterPose(landmarks, timestamp);
 */
export function createClinicalPoseFilter(): PoseLandmarkFilter {
  // Values from CLINICAL_THRESHOLDS.filtering.oneEuro
  return new PoseLandmarkFilter(
    1.0, // minCutoff: reduces jitter on slow movements
    0.007, // beta: responsiveness to velocity changes
    1.0, // dCutoff: velocity calculation smoothing
    0.5 // minVisibility: MediaPipe confidence threshold
  );
}

/**
 * Factory function to create angle filter with clinical defaults.
 *
 * @returns AngleFilter configured for joint angle smoothing
 */
export function createClinicalAngleFilter(): AngleFilter {
  return new AngleFilter(1.0, 0.007, 1.0);
}
