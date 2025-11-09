/**
 * Persistence Filter for Temporal Validation
 *
 * Prevents false positive error detection by requiring errors to persist
 * for a minimum duration before being reported. This is critical for
 * distinguishing real compensatory patterns from momentary noise/jitter.
 *
 * Example: A shoulder shrug that lasts only 100ms is likely noise.
 *          A shoulder shrug that persists for 400ms+ is a real compensation.
 *
 * @module PersistenceFilter
 * @gate Gate 3 - Clinical Thresholds
 */

export interface PersistenceState {
  /** When this error was first detected (timestamp in ms) */
  firstDetectedAt: number;
  /** When this error was last seen (timestamp in ms) */
  lastSeenAt: number;
  /** Number of consecutive frames this error has been present */
  consecutiveFrames: number;
  /** Whether this error has persisted long enough to confirm */
  isConfirmed: boolean;
}

/**
 * Persistence Filter for Error Detection
 *
 * Tracks errors over time and only confirms them after they've persisted
 * for the required duration. This prevents transient noise from triggering
 * false warnings.
 */
export class PersistenceFilter {
  private states: Map<string, PersistenceState> = new Map();
  private readonly persistenceMs: number;
  private readonly resetTimeoutMs: number;

  /**
   * @param persistenceMs - Minimum duration (ms) error must persist to confirm
   * @param resetTimeoutMs - Time (ms) after which to reset if error not seen (default: 1000ms)
   */
  constructor(persistenceMs: number = 400, resetTimeoutMs: number = 1000) {
    this.persistenceMs = persistenceMs;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  /**
   * Update filter with current frame's error detections
   *
   * @param errorKey - Unique identifier for this error (e.g., "shoulder_shrug")
   * @param isPresent - Whether error is detected in current frame
   * @param timestamp - Current timestamp in milliseconds
   * @returns Whether error is confirmed (persisted long enough)
   */
  update(errorKey: string, isPresent: boolean, timestamp: number): boolean {
    const state = this.states.get(errorKey);

    if (isPresent) {
      if (!state) {
        // First detection of this error
        this.states.set(errorKey, {
          firstDetectedAt: timestamp,
          lastSeenAt: timestamp,
          consecutiveFrames: 1,
          isConfirmed: false,
        });
        return false; // Not confirmed yet
      } else {
        // Error continues
        state.lastSeenAt = timestamp;
        state.consecutiveFrames++;

        // Check if error has persisted long enough
        const duration = timestamp - state.firstDetectedAt;
        if (duration >= this.persistenceMs) {
          state.isConfirmed = true;
          return true; // ✅ Confirmed error
        }

        return false; // Still waiting for confirmation
      }
    } else {
      // Error not present in current frame
      if (state) {
        // Check if we should reset (error has been gone too long)
        const timeSinceLastSeen = timestamp - state.lastSeenAt;
        if (timeSinceLastSeen > this.resetTimeoutMs) {
          this.states.delete(errorKey);
        }
      }
      return false;
    }
  }

  /**
   * Check if error is currently confirmed without updating state
   */
  isConfirmed(errorKey: string): boolean {
    const state = this.states.get(errorKey);
    return state?.isConfirmed || false;
  }

  /**
   * Get current persistence duration for an error
   */
  getDuration(errorKey: string): number {
    const state = this.states.get(errorKey);
    if (!state) return 0;
    return state.lastSeenAt - state.firstDetectedAt;
  }

  /**
   * Get number of consecutive frames error has been present
   */
  getConsecutiveFrames(errorKey: string): number {
    const state = this.states.get(errorKey);
    return state?.consecutiveFrames || 0;
  }

  /**
   * Reset specific error state
   */
  reset(errorKey: string): void {
    this.states.delete(errorKey);
  }

  /**
   * Reset all error states
   */
  resetAll(): void {
    this.states.clear();
  }

  /**
   * Get all currently tracked errors
   */
  getTrackedErrors(): string[] {
    return Array.from(this.states.keys());
  }

  /**
   * Get all confirmed errors
   */
  getConfirmedErrors(): string[] {
    return Array.from(this.states.entries())
      .filter(([_, state]) => state.isConfirmed)
      .map(([key, _]) => key);
  }
}

/**
 * Multi-threshold persistence filter
 *
 * Supports different persistence requirements for different severity levels.
 * Example: Warning errors might require 400ms, critical errors only 200ms.
 */
export class MultiThresholdPersistenceFilter {
  private filters: Map<string, PersistenceFilter> = new Map();

  /**
   * Add a filter for a specific severity level
   */
  addFilter(severity: string, persistenceMs: number, resetTimeoutMs?: number): void {
    this.filters.set(severity, new PersistenceFilter(persistenceMs, resetTimeoutMs));
  }

  /**
   * Update filter for specific severity
   */
  update(
    errorKey: string,
    severity: string,
    isPresent: boolean,
    timestamp: number
  ): boolean {
    const filter = this.filters.get(severity);
    if (!filter) {
      console.warn(`No filter configured for severity: ${severity}`);
      return false;
    }
    return filter.update(errorKey, isPresent, timestamp);
  }

  /**
   * Reset all filters
   */
  resetAll(): void {
    this.filters.forEach(filter => filter.resetAll());
  }
}

/**
 * Helper function to create standard clinical persistence filter
 *
 * Uses research-backed persistence thresholds:
 * - 400ms for compensatory patterns (shoulder shrug, trunk lean, etc.)
 * - 500ms for more subtle patterns (scapular winging)
 * - 300ms for high-risk patterns (knee valgus - faster detection needed)
 */
export const createClinicalPersistenceFilter = (): MultiThresholdPersistenceFilter => {
  const filter = new MultiThresholdPersistenceFilter();

  // Standard compensatory patterns (400ms)
  filter.addFilter('compensatory', 400, 1000);

  // High-risk patterns - faster detection (300ms)
  filter.addFilter('high_risk', 300, 800);

  // Subtle patterns - longer confirmation (500ms)
  filter.addFilter('subtle', 500, 1200);

  return filter;
};

export default PersistenceFilter;
