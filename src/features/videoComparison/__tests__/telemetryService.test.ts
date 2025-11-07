/**
 * TelemetryService Unit Tests
 */

import { TelemetryService, telemetryService } from '../services/telemetryService';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(() => {
    service = TelemetryService.getInstance();
    service.clear();
  });

  afterEach(() => {
    service.stopFlushTimer();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TelemetryService.getInstance();
      const instance2 = TelemetryService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should match the exported singleton', () => {
      const instance = TelemetryService.getInstance();
      expect(instance).toBe(telemetryService);
    });
  });

  describe('Event Emission', () => {
    it('should emit session start event', () => {
      service.trackSessionStart('test-123', 'async', 'shoulder_abduction');
      expect(service.getPendingCount()).toBe(1);
    });

    it('should emit session complete event', () => {
      service.trackSessionComplete({
        sessionId: 'test-123',
        timestamp: Date.now(),
        exerciseType: 'squat',
        mode: 'live',
        inferenceDuration_ms: 100,
        dtwSyncDuration_ms: 50,
        totalProcessingTime_ms: 150,
        syncConfidence: 0.95,
        speedRatio: 1.0,
        overallScore: 85,
        youtubeVideoSize_mb: 5.2,
        patientVideoSize_mb: 3.1,
        cacheHit: true,
        deviceModel: 'iPhone 14',
        iosVersion: '17.0',
        batteryLevel: 0.8,
        thermalState: 'nominal',
        errorCount: 0,
        criticalErrorCount: 0,
        topError: null,
      });
      expect(service.getPendingCount()).toBe(1);
    });

    it('should emit frame processed event', () => {
      service.trackFrameProcessed({
        sessionId: 'test-123',
        frameIndex: 10,
        timestamp: Date.now(),
        inferenceTime_ms: 45,
        poseConfidence: 0.92,
        droppedFrames: 0,
        thermalThrottling: false,
      });
      expect(service.getPendingCount()).toBe(1);
    });

    it('should emit network operation event', () => {
      service.trackNetworkOperation({
        operation: 'youtube_download',
        duration_ms: 5000,
        bytesTransferred: 5242880,
        success: true,
        retryCount: 0,
      });
      expect(service.getPendingCount()).toBe(1);
    });

    it('should emit error detection event', () => {
      service.trackErrorDetected({
        sessionId: 'test-123',
        errorType: 'knee_valgus',
        severity: 'critical',
        joint: 'leftKnee',
        deviation: 12,
        timestamp: Date.now(),
      });
      expect(service.getPendingCount()).toBe(1);
    });

    it('should emit quota usage event', () => {
      service.trackQuotaUsed(100, 9900);
      expect(service.getPendingCount()).toBe(1);
    });

    it('should emit memory warning event', () => {
      service.trackMemoryWarning('resolution_downgraded');
      expect(service.getPendingCount()).toBe(1);
    });

    it('should emit thermal throttle event', () => {
      service.trackThermalThrottle('serious');
      expect(service.getPendingCount()).toBe(1);
    });
  });

  describe('Batching', () => {
    it('should batch events before flush threshold', () => {
      for (let i = 0; i < 5; i++) {
        service.trackSessionStart(`test-${i}`, 'async', 'squat');
      }
      expect(service.getPendingCount()).toBe(5);
    });

    it('should auto-flush when batch size reached', async () => {
      for (let i = 0; i < 10; i++) {
        service.trackSessionStart(`test-${i}`, 'async', 'squat');
      }
      // After 10 events, should auto-flush
      expect(service.getPendingCount()).toBe(0);
    });

    it('should clear all pending events', () => {
      for (let i = 0; i < 5; i++) {
        service.trackSessionStart(`test-${i}`, 'async', 'squat');
      }
      expect(service.getPendingCount()).toBe(5);

      service.clear();
      expect(service.getPendingCount()).toBe(0);
    });

    it('should force flush immediately', async () => {
      for (let i = 0; i < 5; i++) {
        service.trackSessionStart(`test-${i}`, 'async', 'squat');
      }
      expect(service.getPendingCount()).toBe(5);

      await service.forceFlush();
      expect(service.getPendingCount()).toBe(0);
    });
  });

  describe('Event Types', () => {
    it('should handle all event types', () => {
      const eventTypes = [
        { type: 'session_start', data: { sessionId: 'test', mode: 'async', exerciseType: 'squat' } },
        { type: 'session_complete', data: {} },
        { type: 'frame_processed', data: {} },
        { type: 'network_operation', data: {} },
        { type: 'error_detected', data: {} },
        { type: 'quota_used', data: { units: 100, remaining: 9900 } },
        { type: 'memory_warning', data: { timestamp: Date.now(), action: 'test' } },
        { type: 'thermal_throttle', data: { timestamp: Date.now(), state: 'nominal' } },
      ];

      eventTypes.forEach(event => {
        service.emit(event as any);
      });

      expect(service.getPendingCount()).toBe(eventTypes.length);
    });
  });
});
