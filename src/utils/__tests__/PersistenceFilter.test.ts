/**
 * Unit Tests for PersistenceFilter
 *
 * Tests temporal validation of error detection to prevent false positives
 * from transient noise/jitter in pose tracking.
 *
 * @gate Gate 3 - Clinical Thresholds
 */

import PersistenceFilter, {
  MultiThresholdPersistenceFilter,
  createClinicalPersistenceFilter,
} from '../PersistenceFilter';

describe('PersistenceFilter', () => {
  // ========================================================================
  // Basic Functionality Tests
  // ========================================================================

  describe('Basic functionality', () => {
    it('should not confirm error on first detection', () => {
      const filter = new PersistenceFilter(400);
      const timestamp = 1000;

      const isConfirmed = filter.update('shoulder_shrug', true, timestamp);

      expect(isConfirmed).toBe(false);
      expect(filter.getConsecutiveFrames('shoulder_shrug')).toBe(1);
      expect(filter.getDuration('shoulder_shrug')).toBe(0);
    });

    it('should confirm error after persistence time', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      // First detection
      filter.update('shoulder_shrug', true, timestamp);
      expect(filter.isConfirmed('shoulder_shrug')).toBe(false);

      // Wait 200ms - still not confirmed
      timestamp += 200;
      filter.update('shoulder_shrug', true, timestamp);
      expect(filter.isConfirmed('shoulder_shrug')).toBe(false);

      // Wait 300ms more (total 500ms) - now confirmed
      timestamp += 300;
      const isConfirmed = filter.update('shoulder_shrug', true, timestamp);

      expect(isConfirmed).toBe(true);
      expect(filter.getDuration('shoulder_shrug')).toBe(500);
      expect(filter.getConsecutiveFrames('shoulder_shrug')).toBe(3);
    });

    it('should reset error state when not seen for timeout period', () => {
      const filter = new PersistenceFilter(400, 1000);
      let timestamp = 1000;

      // Detect error
      filter.update('shoulder_shrug', true, timestamp);

      // Error disappears
      timestamp += 500;
      filter.update('shoulder_shrug', false, timestamp);

      // Error still tracked (within 1000ms timeout)
      expect(filter.getConsecutiveFrames('shoulder_shrug')).toBe(1);

      // Wait past timeout (1500ms total)
      timestamp += 1500;
      filter.update('shoulder_shrug', false, timestamp);

      // Should be reset now
      expect(filter.getConsecutiveFrames('shoulder_shrug')).toBe(0);
      expect(filter.getDuration('shoulder_shrug')).toBe(0);
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle rapid on/off toggling', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      // Error appears and disappears quickly
      filter.update('knee_valgus', true, timestamp);
      timestamp += 50;
      filter.update('knee_valgus', false, timestamp);
      timestamp += 50;
      filter.update('knee_valgus', true, timestamp);

      // Should start tracking from second detection
      expect(filter.isConfirmed('knee_valgus')).toBe(false);

      // Continue for 400ms
      timestamp += 400;
      const isConfirmed = filter.update('knee_valgus', true, timestamp);

      expect(isConfirmed).toBe(true);
    });

    it('should handle multiple concurrent errors', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      // Detect multiple errors
      filter.update('shoulder_shrug', true, timestamp);
      filter.update('knee_valgus', true, timestamp);
      filter.update('trunk_lean', true, timestamp);

      // Wait 500ms
      timestamp += 500;
      filter.update('shoulder_shrug', true, timestamp);
      filter.update('knee_valgus', true, timestamp);
      filter.update('trunk_lean', true, timestamp);

      // All should be confirmed
      expect(filter.isConfirmed('shoulder_shrug')).toBe(true);
      expect(filter.isConfirmed('knee_valgus')).toBe(true);
      expect(filter.isConfirmed('trunk_lean')).toBe(true);

      expect(filter.getConfirmedErrors()).toEqual([
        'shoulder_shrug',
        'knee_valgus',
        'trunk_lean',
      ]);
    });

    it('should handle zero persistence time (instant confirmation)', () => {
      const filter = new PersistenceFilter(0);
      const timestamp = 1000;

      const isConfirmed = filter.update('immediate_error', true, timestamp);

      expect(isConfirmed).toBe(true); // Should confirm immediately
    });
  });

  // ========================================================================
  // Reset Functionality
  // ========================================================================

  describe('Reset functionality', () => {
    it('should reset specific error', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      filter.update('error_1', true, timestamp);
      filter.update('error_2', true, timestamp);

      timestamp += 500;
      filter.update('error_1', true, timestamp);
      filter.update('error_2', true, timestamp);

      expect(filter.isConfirmed('error_1')).toBe(true);
      expect(filter.isConfirmed('error_2')).toBe(true);

      // Reset only error_1
      filter.reset('error_1');

      expect(filter.isConfirmed('error_1')).toBe(false);
      expect(filter.isConfirmed('error_2')).toBe(true); // Should still be confirmed
    });

    it('should reset all errors', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      filter.update('error_1', true, timestamp);
      filter.update('error_2', true, timestamp);

      timestamp += 500;
      filter.update('error_1', true, timestamp);
      filter.update('error_2', true, timestamp);

      expect(filter.getTrackedErrors()).toHaveLength(2);

      filter.resetAll();

      expect(filter.getTrackedErrors()).toHaveLength(0);
      expect(filter.isConfirmed('error_1')).toBe(false);
      expect(filter.isConfirmed('error_2')).toBe(false);
    });
  });

  // ========================================================================
  // Multi-Threshold Filter Tests
  // ========================================================================

  describe('MultiThresholdPersistenceFilter', () => {
    it('should support different persistence times for different severities', () => {
      const filter = new MultiThresholdPersistenceFilter();
      filter.addFilter('warning', 500);
      filter.addFilter('critical', 200);

      let timestamp = 1000;

      // Detect both severities
      filter.update('error_1', 'warning', true, timestamp);
      filter.update('error_2', 'critical', true, timestamp);

      // Wait 300ms
      timestamp += 300;
      const warningConfirmed = filter.update('error_1', 'warning', true, timestamp);
      const criticalConfirmed = filter.update('error_2', 'critical', true, timestamp);

      // Critical should be confirmed (200ms persistence)
      // Warning should not yet (500ms persistence)
      expect(criticalConfirmed).toBe(true);
      expect(warningConfirmed).toBe(false);

      // Wait 300ms more (total 600ms)
      timestamp += 300;
      const warningConfirmedNow = filter.update('error_1', 'warning', true, timestamp);

      // Now warning should also be confirmed
      expect(warningConfirmedNow).toBe(true);
    });

    it('should warn when severity not configured', () => {
      const filter = new MultiThresholdPersistenceFilter();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      filter.update('error_1', 'unknown_severity', true, 1000);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No filter configured for severity: unknown_severity')
      );

      consoleSpy.mockRestore();
    });
  });

  // ========================================================================
  // Clinical Persistence Filter Tests
  // ========================================================================

  describe('createClinicalPersistenceFilter', () => {
    it('should create filter with clinical defaults', () => {
      const filter = createClinicalPersistenceFilter();
      let timestamp = 1000;

      // Test compensatory pattern (400ms)
      filter.update('shoulder_shrug', 'compensatory', true, timestamp);
      timestamp += 300;
      expect(filter.update('shoulder_shrug', 'compensatory', true, timestamp)).toBe(
        false
      );
      timestamp += 200;
      expect(filter.update('shoulder_shrug', 'compensatory', true, timestamp)).toBe(true);

      // Test high-risk pattern (300ms)
      timestamp = 2000;
      filter.update('knee_valgus', 'high_risk', true, timestamp);
      timestamp += 200;
      expect(filter.update('knee_valgus', 'high_risk', true, timestamp)).toBe(false);
      timestamp += 150;
      expect(filter.update('knee_valgus', 'high_risk', true, timestamp)).toBe(true);

      // Test subtle pattern (500ms)
      timestamp = 3000;
      filter.update('scapular_winging', 'subtle', true, timestamp);
      timestamp += 400;
      expect(filter.update('scapular_winging', 'subtle', true, timestamp)).toBe(false);
      timestamp += 150;
      expect(filter.update('scapular_winging', 'subtle', true, timestamp)).toBe(true);
    });
  });

  // ========================================================================
  // Integration Scenarios
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should prevent false positive from momentary noise', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      // Simulate jittery detection (noise)
      for (let i = 0; i < 5; i++) {
        const isPresent = Math.random() > 0.5; // Random noise
        const isConfirmed = filter.update('noisy_error', isPresent, timestamp);
        timestamp += 50;

        // Should never confirm with this short random pattern
        expect(isConfirmed).toBe(false);
      }
    });

    it('should confirm persistent compensatory pattern', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      // Simulate real shoulder shrug (persists for 600ms)
      for (let i = 0; i < 12; i++) {
        // 12 frames @ 50ms = 600ms
        const isConfirmed = filter.update('shoulder_shrug', true, timestamp);
        timestamp += 50;

        if (i < 8) {
          // First 400ms - not confirmed
          expect(isConfirmed).toBe(false);
        } else {
          // After 400ms - confirmed
          expect(isConfirmed).toBe(true);
        }
      }
    });

    it('should handle exercise rep cycle (error appears/disappears)', () => {
      const filter = new PersistenceFilter(400);
      let timestamp = 1000;

      // Rep 1: Error present for 500ms
      for (let i = 0; i < 10; i++) {
        filter.update('trunk_lean', true, timestamp);
        timestamp += 50;
      }
      expect(filter.isConfirmed('trunk_lean')).toBe(true);

      // Pause between reps (error disappears)
      for (let i = 0; i < 5; i++) {
        filter.update('trunk_lean', false, timestamp);
        timestamp += 50;
      }

      // Rep 2: Error reappears
      for (let i = 0; i < 10; i++) {
        filter.update('trunk_lean', true, timestamp);
        timestamp += 50;
      }

      // Should still be confirmed (pattern consistent across reps)
      expect(filter.isConfirmed('trunk_lean')).toBe(true);
    });
  });
});
