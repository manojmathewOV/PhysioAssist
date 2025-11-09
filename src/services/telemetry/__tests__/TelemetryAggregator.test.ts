/**
 * Unit Tests for TelemetryAggregator
 *
 * Tests on-device metric aggregation, statistical calculations,
 * and compression efficiency.
 *
 * @gate Gate 5 - Telemetry
 */

import TelemetryAggregator from '../TelemetryAggregator';

describe('TelemetryAggregator', () => {
  let aggregator: TelemetryAggregator;

  beforeEach(() => {
    // Use short window for testing (1 second)
    aggregator = new TelemetryAggregator(1000);
  });

  // ========================================================================
  // Window Management
  // ========================================================================

  describe('Window management', () => {
    it('should initialize with active window', () => {
      const window = aggregator.getCurrentWindow();

      expect(window).toBeTruthy();
      expect(window!.startTime).toBeLessThanOrEqual(Date.now());
      expect(window!.endTime).toBeGreaterThan(window!.startTime);
      expect(window!.duration).toBe(1000);
    });

    it('should create new window after expiration', () => {
      const window1 = aggregator.getCurrentWindow();

      // Wait for window to expire
      jest.useFakeTimers();
      jest.advanceTimersByTime(2000);

      aggregator.addInferenceTime(50);

      const window2 = aggregator.getCurrentWindow();

      expect(window2!.startTime).toBeGreaterThan(window1!.startTime);

      jest.useRealTimers();
    });
  });

  // ========================================================================
  // Performance Aggregation
  // ========================================================================

  describe('Performance aggregation', () => {
    it('should aggregate inference times with statistics', () => {
      // Add various inference times
      [50, 75, 100, 80, 90, 60, 70, 85, 95, 110].forEach((time) => {
        aggregator.addInferenceTime(time);
      });

      const result = aggregator.aggregate();

      expect(result.performance.inference.count).toBe(10);
      expect(result.performance.inference.mean).toBeCloseTo(81.5, 1);
      expect(result.performance.inference.min).toBe(50);
      expect(result.performance.inference.max).toBe(110);
      expect(result.performance.inference.p50).toBeGreaterThan(0);
      expect(result.performance.inference.p95).toBeGreaterThan(
        result.performance.inference.p50
      );
      expect(result.performance.inference.stddev).toBeGreaterThan(0);
    });

    it('should track frame processing stats', () => {
      for (let i = 0; i < 100; i++) {
        aggregator.addFrameProcessed(i % 10 === 0); // 10% drop rate
      }

      const result = aggregator.aggregate();

      expect(result.performance.frameProcessing.totalFrames).toBe(100);
      expect(result.performance.frameProcessing.droppedFrames).toBe(10);
    });

    it('should aggregate network operations', () => {
      aggregator.addNetworkOperation(1000, true, 5000000);
      aggregator.addNetworkOperation(1500, true, 3000000);
      aggregator.addNetworkOperation(2000, false, 0);

      const result = aggregator.aggregate();

      expect(result.performance.network.totalRequests).toBe(3);
      expect(result.performance.network.successfulRequests).toBe(2);
      expect(result.performance.network.failedRequests).toBe(1);
      expect(result.performance.network.totalBytesTransferred).toBe(8000000);
      expect(result.performance.network.averageDuration_ms).toBeCloseTo(1500, 0);
    });
  });

  // ========================================================================
  // Error Aggregation
  // ========================================================================

  describe('Error aggregation', () => {
    it('should count errors by type', () => {
      aggregator.addError('knee_valgus', 'critical', 'leftKnee');
      aggregator.addError('knee_valgus', 'warning', 'rightKnee');
      aggregator.addError('shoulder_hiking', 'warning', 'leftShoulder');
      aggregator.addError('knee_valgus', 'critical', 'leftKnee');

      const result = aggregator.aggregate();

      expect(result.errors.errorsByType.knee_valgus).toBe(3);
      expect(result.errors.errorsByType.shoulder_hiking).toBe(1);
    });

    it('should count errors by severity', () => {
      aggregator.addError('error1', 'critical', 'joint1');
      aggregator.addError('error2', 'critical', 'joint2');
      aggregator.addError('error3', 'warning', 'joint3');

      const result = aggregator.aggregate();

      expect(result.errors.errorsBySeverity.critical).toBe(2);
      expect(result.errors.errorsBySeverity.warning).toBe(1);
    });

    it('should identify top 5 errors', () => {
      // Create various error frequencies
      for (let i = 0; i < 10; i++) aggregator.addError('error_a', 'warning', 'joint');
      for (let i = 0; i < 8; i++) aggregator.addError('error_b', 'warning', 'joint');
      for (let i = 0; i < 6; i++) aggregator.addError('error_c', 'warning', 'joint');
      for (let i = 0; i < 4; i++) aggregator.addError('error_d', 'warning', 'joint');
      for (let i = 0; i < 2; i++) aggregator.addError('error_e', 'warning', 'joint');
      aggregator.addError('error_f', 'warning', 'joint');

      const result = aggregator.aggregate();

      expect(result.errors.topErrors).toHaveLength(5);
      expect(result.errors.topErrors[0].type).toBe('error_a');
      expect(result.errors.topErrors[0].count).toBe(10);
      expect(result.errors.topErrors[4].type).toBe('error_e');
    });

    it('should count errors by joint', () => {
      aggregator.addError('error', 'warning', 'leftKnee');
      aggregator.addError('error', 'warning', 'leftKnee');
      aggregator.addError('error', 'warning', 'rightKnee');

      const result = aggregator.aggregate();

      expect(result.errors.errorsByJoint.leftKnee).toBe(2);
      expect(result.errors.errorsByJoint.rightKnee).toBe(1);
    });
  });

  // ========================================================================
  // Device Metrics Aggregation
  // ========================================================================

  describe('Device metrics aggregation', () => {
    it('should aggregate device models', () => {
      aggregator.addDeviceContext('iPhone 14', '17.0', 'nominal', 0.8);
      aggregator.addDeviceContext('iPhone 14', '17.0', 'nominal', 0.7);
      aggregator.addDeviceContext('Pixel 7', '14.0', 'fair', 0.6);

      const result = aggregator.aggregate();

      expect(result.device.deviceModels['iPhone 14']).toBe(2);
      expect(result.device.deviceModels['Pixel 7']).toBe(1);
    });

    it('should aggregate OS versions', () => {
      aggregator.addDeviceContext('iPhone 14', '17.0', 'nominal', 0.8);
      aggregator.addDeviceContext('iPhone 15', '17.1', 'nominal', 0.7);
      aggregator.addDeviceContext('iPhone 15', '17.1', 'nominal', 0.9);

      const result = aggregator.aggregate();

      expect(result.device.osVersions['17.0']).toBe(1);
      expect(result.device.osVersions['17.1']).toBe(2);
    });

    it('should aggregate thermal states', () => {
      aggregator.addDeviceContext('iPhone', '17.0', 'nominal', 0.8);
      aggregator.addDeviceContext('iPhone', '17.0', 'fair', 0.7);
      aggregator.addDeviceContext('iPhone', '17.0', 'serious', 0.5);

      const result = aggregator.aggregate();

      expect(result.device.thermalStates.nominal).toBe(1);
      expect(result.device.thermalStates.fair).toBe(1);
      expect(result.device.thermalStates.serious).toBe(1);
    });

    it('should calculate average battery level', () => {
      aggregator.addDeviceContext('iPhone', '17.0', 'nominal', 0.8);
      aggregator.addDeviceContext('iPhone', '17.0', 'nominal', 0.6);
      aggregator.addDeviceContext('iPhone', '17.0', 'nominal', 0.7);

      const result = aggregator.aggregate();

      expect(result.device.averageBatteryLevel).toBeCloseTo(0.7, 1);
    });

    it('should count thermal throttles and memory warnings', () => {
      aggregator.addThermalThrottle();
      aggregator.addThermalThrottle();
      aggregator.addMemoryWarning();

      const result = aggregator.aggregate();

      expect(result.device.thermalThrottleCount).toBe(2);
      expect(result.device.memoryWarningCount).toBe(1);
    });
  });

  // ========================================================================
  // Session Metrics Aggregation
  // ========================================================================

  describe('Session metrics aggregation', () => {
    it('should count sessions by exercise type', () => {
      aggregator.addSession('squat', 'async', 85, 0.9, 1.0, 150);
      aggregator.addSession('squat', 'async', 80, 0.85, 1.0, 160);
      aggregator.addSession('shoulder_abduction', 'live', 90, 0.95, 1.1, 120);

      const result = aggregator.aggregate();

      expect(result.sessions.sessionsByExercise.squat).toBe(2);
      expect(result.sessions.sessionsByExercise.shoulder_abduction).toBe(1);
    });

    it('should count sessions by mode', () => {
      aggregator.addSession('squat', 'async', 85, 0.9, 1.0, 150);
      aggregator.addSession('squat', 'async', 80, 0.85, 1.0, 160);
      aggregator.addSession('shoulder', 'live', 90, 0.95, 1.1, 120);

      const result = aggregator.aggregate();

      expect(result.sessions.sessionsByMode.async).toBe(2);
      expect(result.sessions.sessionsByMode.live).toBe(1);
      expect(result.sessions.totalSessions).toBe(3);
    });

    it('should calculate average metrics', () => {
      aggregator.addSession('squat', 'async', 80, 0.9, 1.0, 150);
      aggregator.addSession('squat', 'async', 90, 0.95, 1.1, 160);

      const result = aggregator.aggregate();

      expect(result.sessions.averageMetrics.overallScore).toBeCloseTo(85, 0);
      expect(result.sessions.averageMetrics.syncConfidence).toBeCloseTo(0.925, 2);
      expect(result.sessions.averageMetrics.speedRatio).toBeCloseTo(1.05, 2);
      expect(result.sessions.averageMetrics.processingTime_ms).toBeCloseTo(155, 0);
    });
  });

  // ========================================================================
  // Compression Ratio
  // ========================================================================

  describe('Compression ratio', () => {
    it('should calculate compression ratio', () => {
      // Add 100 raw events
      for (let i = 0; i < 50; i++) {
        aggregator.addInferenceTime(100);
      }
      for (let i = 0; i < 30; i++) {
        aggregator.addFrameProcessed(false);
      }
      for (let i = 0; i < 20; i++) {
        aggregator.addError('test', 'warning', 'joint');
      }

      const result = aggregator.aggregate();

      expect(result.rawEventCount).toBe(100);
      expect(result.compressionRatio).toBe(100); // 100 events → 1 aggregated object
    });

    it('should handle empty aggregation', () => {
      const result = aggregator.aggregate();

      expect(result.rawEventCount).toBe(0);
      expect(result.compressionRatio).toBe(1);
    });
  });

  // ========================================================================
  // Reset Functionality
  // ========================================================================

  describe('Reset functionality', () => {
    it('should reset all metrics', () => {
      aggregator.addInferenceTime(100);
      aggregator.addFrameProcessed(true);
      aggregator.addError('test', 'warning', 'joint');
      aggregator.addSession('squat', 'async', 80, 0.9, 1.0, 150);

      aggregator.reset();

      const result = aggregator.aggregate();

      expect(result.rawEventCount).toBe(0);
      expect(result.performance.inference.count).toBe(0);
      expect(result.performance.frameProcessing.totalFrames).toBe(0);
      expect(result.errors.errorsByType).toEqual({});
      expect(result.sessions.totalSessions).toBe(0);
    });

    it('should start new window after reset', () => {
      const window1 = aggregator.getCurrentWindow();

      aggregator.reset();

      const window2 = aggregator.getCurrentWindow();

      expect(window2!.startTime).toBeGreaterThanOrEqual(window1!.startTime);
    });
  });

  // ========================================================================
  // Statistical Functions
  // ========================================================================

  describe('Statistical calculations', () => {
    it('should calculate percentiles correctly', () => {
      const times = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
      times.forEach((t) => aggregator.addInferenceTime(t));

      const result = aggregator.aggregate();

      expect(result.performance.inference.p50).toBeGreaterThan(80);
      expect(result.performance.inference.p50).toBeLessThan(100);
      expect(result.performance.inference.p95).toBeGreaterThan(120);
    });

    it('should calculate standard deviation', () => {
      // Add values with high variance
      [10, 50, 90].forEach((t) => aggregator.addInferenceTime(t));

      const result = aggregator.aggregate();

      expect(result.performance.inference.stddev).toBeGreaterThan(0);
    });

    it('should handle edge case with single value', () => {
      aggregator.addInferenceTime(100);

      const result = aggregator.aggregate();

      expect(result.performance.inference.mean).toBe(100);
      expect(result.performance.inference.min).toBe(100);
      expect(result.performance.inference.max).toBe(100);
      expect(result.performance.inference.stddev).toBe(0);
    });
  });

  // ========================================================================
  // Integration Scenarios
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should handle complete telemetry cycle', () => {
      // Simulate 1 hour of telemetry data
      for (let i = 0; i < 100; i++) {
        aggregator.addInferenceTime(50 + Math.random() * 50);
      }

      for (let i = 0; i < 1000; i++) {
        aggregator.addFrameProcessed(Math.random() > 0.95); // 5% drop rate
      }

      for (let i = 0; i < 10; i++) {
        aggregator.addNetworkOperation(
          1000 + Math.random() * 1000,
          Math.random() > 0.1,
          5000000
        );
      }

      for (let i = 0; i < 25; i++) {
        aggregator.addError('knee_valgus', 'warning', 'leftKnee');
      }

      for (let i = 0; i < 5; i++) {
        aggregator.addSession(
          'squat',
          'async',
          80 + Math.random() * 20,
          0.85 + Math.random() * 0.1,
          1.0,
          150
        );
      }

      aggregator.addThermalThrottle();
      aggregator.addMemoryWarning();

      const result = aggregator.aggregate();

      expect(result.performance.inference.count).toBe(100);
      expect(result.performance.frameProcessing.totalFrames).toBe(1000);
      expect(result.performance.network.totalRequests).toBe(10);
      expect(result.sessions.totalSessions).toBe(5);
      expect(result.device.thermalThrottleCount).toBe(1);
      expect(result.rawEventCount).toBeGreaterThan(1000);
      expect(result.compressionRatio).toBeGreaterThan(1000); // Excellent compression
    });
  });
});
