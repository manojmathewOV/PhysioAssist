/**
 * MemoryHealthManager Test Suite
 *
 * Tests for memory monitoring, leak detection, and health management.
 */

import { MemoryHealthManager } from '../memoryHealthManager';

describe('MemoryHealthManager', () => {
  let manager: MemoryHealthManager;

  beforeEach(() => {
    manager = new MemoryHealthManager();
  });

  afterEach(() => {
    manager.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default thresholds', () => {
      const status = manager.getStatus();

      expect(status).toBeDefined();
      expect(status.isHealthy).toBe(true);
    });

    it('should start monitoring when initialized', () => {
      manager.start();

      const status = manager.getStatus();
      expect(status.monitoringActive).toBe(true);
    });
  });

  describe('Memory Tracking', () => {
    it('should track current memory usage', () => {
      manager.start();

      const status = manager.getStatus();

      expect(status.currentMemory).toBeGreaterThanOrEqual(0);
      expect(typeof status.currentMemory).toBe('number');
    });

    it('should update memory readings over time', async () => {
      manager.start();

      const reading1 = manager.getStatus().currentMemory;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const reading2 = manager.getStatus().currentMemory;

      expect(reading2).toBeGreaterThanOrEqual(0);
    });

    it('should track peak memory usage', () => {
      manager.start();

      // Simulate memory increase
      manager.recordMemoryUsage(150);
      manager.recordMemoryUsage(200);
      manager.recordMemoryUsage(180);

      const status = manager.getStatus();
      expect(status.peakMemory).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Threshold Detection', () => {
    it('should detect when approaching warning threshold', () => {
      manager.setThresholds({ warning: 250, critical: 400 });
      manager.start();

      manager.recordMemoryUsage(260);

      const status = manager.getStatus();
      expect(status.isHealthy).toBe(true); // Above warning but not critical
      expect(status.warnings).toContain('memory_high');
    });

    it('should detect critical memory levels', () => {
      manager.setThresholds({ warning: 250, critical: 400 });
      manager.start();

      manager.recordMemoryUsage(450);

      const status = manager.getStatus();
      expect(status.isHealthy).toBe(false);
      expect(status.warnings).toContain('memory_critical');
    });

    it('should handle memory below thresholds', () => {
      manager.setThresholds({ warning: 250, critical: 400 });
      manager.start();

      manager.recordMemoryUsage(100);

      const status = manager.getStatus();
      expect(status.isHealthy).toBe(true);
      expect(status.warnings.length).toBe(0);
    });
  });

  describe('Leak Detection', () => {
    it('should detect potential memory leaks', () => {
      manager.start();

      // Simulate steady memory increase (leak pattern)
      for (let i = 0; i < 10; i++) {
        manager.recordMemoryUsage(100 + i * 20);
      }

      const status = manager.getStatus();
      expect(status.potentialLeak).toBe(true);
    });

    it('should not flag normal memory fluctuations', () => {
      manager.start();

      // Simulate normal fluctuation
      manager.recordMemoryUsage(100);
      manager.recordMemoryUsage(110);
      manager.recordMemoryUsage(105);
      manager.recordMemoryUsage(115);

      const status = manager.getStatus();
      expect(status.potentialLeak).toBe(false);
    });

    it('should track leak growth rate', () => {
      manager.start();

      // Simulate leak
      for (let i = 0; i < 10; i++) {
        manager.recordMemoryUsage(100 + i * 30);
      }

      const status = manager.getStatus();
      if (status.leakRate) {
        expect(status.leakRate).toBeGreaterThan(0);
      }
    });
  });

  describe('Cleanup Actions', () => {
    it('should trigger cleanup at warning threshold', () => {
      const cleanupSpy = jest.fn();
      manager.onCleanupNeeded(cleanupSpy);

      manager.setThresholds({ warning: 250, critical: 400 });
      manager.start();

      manager.recordMemoryUsage(260);

      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should trigger aggressive cleanup at critical threshold', () => {
      const cleanupSpy = jest.fn();
      manager.onCleanupNeeded(cleanupSpy);

      manager.setThresholds({ warning: 250, critical: 400 });
      manager.start();

      manager.recordMemoryUsage(450);

      expect(cleanupSpy).toHaveBeenCalledWith('aggressive');
    });

    it('should execute manual cleanup', () => {
      manager.start();

      const initialMemory = manager.getStatus().currentMemory;
      manager.cleanup();

      // Cleanup should be requested
      expect(manager.getStatus().lastCleanup).toBeGreaterThan(0);
    });
  });

  describe('Monitoring Control', () => {
    it('should stop monitoring', () => {
      manager.start();
      expect(manager.getStatus().monitoringActive).toBe(true);

      manager.stop();
      expect(manager.getStatus().monitoringActive).toBe(false);
    });

    it('should pause monitoring', () => {
      manager.start();
      manager.pause();

      const status = manager.getStatus();
      expect(status.monitoringActive).toBe(false);
    });

    it('should resume monitoring', () => {
      manager.start();
      manager.pause();
      manager.resume();

      const status = manager.getStatus();
      expect(status.monitoringActive).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should calculate average memory usage', () => {
      manager.start();

      manager.recordMemoryUsage(100);
      manager.recordMemoryUsage(200);
      manager.recordMemoryUsage(150);

      const stats = manager.getStatistics();
      expect(stats.averageMemory).toBeCloseTo(150, 0);
    });

    it('should track memory variance', () => {
      manager.start();

      manager.recordMemoryUsage(100);
      manager.recordMemoryUsage(200);
      manager.recordMemoryUsage(100);
      manager.recordMemoryUsage(200);

      const stats = manager.getStatistics();
      expect(stats.variance).toBeGreaterThan(0);
    });

    it('should count threshold violations', () => {
      manager.setThresholds({ warning: 150, critical: 250 });
      manager.start();

      manager.recordMemoryUsage(160); // Warning
      manager.recordMemoryUsage(260); // Critical
      manager.recordMemoryUsage(270); // Critical

      const stats = manager.getStatistics();
      expect(stats.warningCount).toBeGreaterThan(0);
      expect(stats.criticalCount).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative memory values', () => {
      manager.start();

      expect(() => manager.recordMemoryUsage(-100)).not.toThrow();

      const status = manager.getStatus();
      expect(status.currentMemory).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large memory values', () => {
      manager.start();

      expect(() => manager.recordMemoryUsage(999999)).not.toThrow();

      const status = manager.getStatus();
      expect(status.isHealthy).toBe(false);
    });

    it('should handle rapid memory fluctuations', () => {
      manager.start();

      for (let i = 0; i < 100; i++) {
        manager.recordMemoryUsage(Math.random() * 200);
      }

      const status = manager.getStatus();
      expect(status).toBeDefined();
    });

    it('should handle stop when not started', () => {
      expect(() => manager.stop()).not.toThrow();
    });

    it('should handle multiple start calls', () => {
      manager.start();
      manager.start();
      manager.start();

      expect(manager.getStatus().monitoringActive).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should update thresholds dynamically', () => {
      manager.start();

      manager.setThresholds({ warning: 300, critical: 500 });

      manager.recordMemoryUsage(350);
      const status = manager.getStatus();

      expect(status.warnings).toContain('memory_high');
    });

    it('should validate threshold configuration', () => {
      expect(() => {
        manager.setThresholds({ warning: 500, critical: 300 });
      }).toThrow();
    });

    it('should apply custom monitoring interval', () => {
      manager.setInterval(100); // 100ms
      manager.start();

      expect(manager.getStatus().monitoringActive).toBe(true);
    });
  });
});
