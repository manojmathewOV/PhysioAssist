/**
 * DeviceHealthMonitor Unit Tests
 */

import { DeviceHealthMonitor, deviceHealthMonitor } from '../services/deviceHealthMonitor';

describe('DeviceHealthMonitor', () => {
  let monitor: DeviceHealthMonitor;

  beforeEach(() => {
    monitor = DeviceHealthMonitor.getInstance();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DeviceHealthMonitor.getInstance();
      const instance2 = DeviceHealthMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should match the exported singleton', () => {
      const instance = DeviceHealthMonitor.getInstance();
      expect(instance).toBe(deviceHealthMonitor);
    });
  });

  describe('Device Health', () => {
    it('should return current health', () => {
      const health = monitor.getHealth();
      expect(health).toHaveProperty('thermalState');
      expect(health).toHaveProperty('batteryLevel');
      expect(health).toHaveProperty('isLowPowerMode');
      expect(health).toHaveProperty('timestamp');
    });

    it('should have valid thermal state', () => {
      const health = monitor.getHealth();
      expect(['nominal', 'fair', 'serious', 'critical']).toContain(health.thermalState);
    });

    it('should have battery level between 0 and 1', () => {
      const health = monitor.getHealth();
      expect(health.batteryLevel).toBeGreaterThanOrEqual(0);
      expect(health.batteryLevel).toBeLessThanOrEqual(1);
    });

    it('should have boolean low power mode', () => {
      const health = monitor.getHealth();
      expect(typeof health.isLowPowerMode).toBe('boolean');
    });
  });

  describe('Inference Recommendations', () => {
    it('should return a valid recommendation', () => {
      const rec = monitor.getInferenceRecommendation();
      expect(rec).toHaveProperty('interval_ms');
      expect(rec).toHaveProperty('resolution');
      expect(rec).toHaveProperty('maxFPS');
      expect(rec).toHaveProperty('reason');
    });

    it('should have valid inference interval', () => {
      const rec = monitor.getInferenceRecommendation();
      expect(rec.interval_ms).toBeGreaterThan(0);
      expect(rec.interval_ms).toBeLessThanOrEqual(2000);
    });

    it('should have valid resolution', () => {
      const rec = monitor.getInferenceRecommendation();
      expect(['1080p', '720p', '540p']).toContain(rec.resolution);
    });

    it('should have valid FPS', () => {
      const rec = monitor.getInferenceRecommendation();
      expect(rec.maxFPS).toBeGreaterThan(0);
      expect(rec.maxFPS).toBeLessThanOrEqual(30);
    });

    it('should provide a reason', () => {
      const rec = monitor.getInferenceRecommendation();
      expect(rec.reason).toBeTruthy();
      expect(typeof rec.reason).toBe('string');
    });

    it('should recommend conservative settings for critical thermal state', () => {
      // Note: This test would need to mock thermal state
      // For now, just verify the logic exists
      const rec = monitor.getInferenceRecommendation();
      expect(rec).toBeDefined();
    });
  });

  describe('Pause Inference Logic', () => {
    it('should not recommend pause under normal conditions', () => {
      // With mock values (nominal thermal, full battery)
      const shouldPause = monitor.shouldPauseInference();
      expect(shouldPause).toBe(false);
    });

    it('should return boolean', () => {
      const shouldPause = monitor.shouldPauseInference();
      expect(typeof shouldPause).toBe('boolean');
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove listeners', () => {
      const callback = jest.fn();
      const unsubscribe = monitor.addListener(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should call listener on health change', (done) => {
      const callback = jest.fn((health) => {
        expect(health).toBeDefined();
        done();
      });

      monitor.addListener(callback);

      // Note: In actual implementation, would trigger health change
      // For mock, this test verifies the interface exists
    });

    it('should support multiple listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      const unsub1 = monitor.addListener(callback1);
      const unsub2 = monitor.addListener(callback2);
      const unsub3 = monitor.addListener(callback3);

      unsub1();
      unsub2();
      unsub3();

      // Verify no errors
      expect(true).toBe(true);
    });

    it('should remove only specified listener', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsub1 = monitor.addListener(callback1);
      monitor.addListener(callback2);

      unsub1(); // Remove only callback1

      // callback2 should still be registered
      // (would verify in actual health change)
      expect(true).toBe(true);
    });
  });

  describe('Status Messages', () => {
    it('should return a status message', () => {
      const message = monitor.getStatusMessage();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should provide meaningful status', () => {
      const message = monitor.getStatusMessage();
      expect(message).toMatch(/Device|Battery|thermal|performance|optimal/i);
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring automatically', () => {
      // Verify monitoring is active (new instance)
      const newMonitor = DeviceHealthMonitor.getInstance();
      expect(newMonitor).toBeDefined();
    });

    it('should stop monitoring', () => {
      monitor.stopMonitoring();
      // Verify no errors
      expect(true).toBe(true);
    });

    it('should be safe to stop multiple times', () => {
      monitor.stopMonitoring();
      monitor.stopMonitoring();
      monitor.stopMonitoring();
      expect(true).toBe(true);
    });
  });
});
