/**
 * YouTubeQuotaManager Unit Tests
 */

import { YouTubeQuotaManager } from '../services/youtubeQuotaManager';
import EncryptedStorage from 'react-native-encrypted-storage';

// Mock EncryptedStorage
jest.mock('react-native-encrypted-storage');

describe('YouTubeQuotaManager', () => {
  let manager: YouTubeQuotaManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    manager = YouTubeQuotaManager.getInstance();
    await manager.clearQuotaData();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = YouTubeQuotaManager.getInstance();
      const instance2 = YouTubeQuotaManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Quota Status', () => {
    it('should initialize with default quota', async () => {
      const status = await manager.getStatus();
      expect(status.dailyLimit).toBe(10000);
      expect(status.used).toBe(0);
      expect(status.remaining).toBe(10000);
      expect(status.percentUsed).toBe(0);
    });

    it('should track quota usage', async () => {
      await manager.recordUsage('search'); // 100 units
      const status = await manager.getStatus();
      expect(status.used).toBe(100);
      expect(status.remaining).toBe(9900);
      expect(status.percentUsed).toBe(1);
    });

    it('should accumulate multiple operations', async () => {
      await manager.recordUsage('search'); // 100
      await manager.recordUsage('videoDetails'); // 1
      await manager.recordUsage('videoDetails'); // 1
      const status = await manager.getStatus();
      expect(status.used).toBe(102);
      expect(status.remaining).toBe(9898);
    });

    it('should calculate percent used correctly', async () => {
      await manager.setDailyLimit(1000);
      await manager.recordUsage('search'); // 100 units
      const status = await manager.getStatus();
      expect(status.percentUsed).toBe(10);
    });
  });

  describe('Availability Checks', () => {
    it('should allow operations under quota', async () => {
      const available = await manager.isAvailable('search');
      expect(available).toBe(true);
    });

    it('should block operations at 95% quota', async () => {
      await manager.setDailyLimit(1000);

      // Use 950 units (95%)
      for (let i = 0; i < 950; i++) {
        await manager.recordUsage('videoDetails');
      }

      const available = await manager.isAvailable('search');
      expect(available).toBe(false);
    });

    it('should allow operations just under threshold', async () => {
      await manager.setDailyLimit(1000);

      // Use 849 units (84.9%) - search costs 100, so 849+100=949 (just under 95% threshold of 950)
      for (let i = 0; i < 849; i++) {
        await manager.recordUsage('videoDetails');
      }

      const available = await manager.isAvailable('search');
      expect(available).toBe(true);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker at 95% usage', async () => {
      await manager.setDailyLimit(1000);

      // Use 950 units (95%)
      for (let i = 0; i < 950; i++) {
        await manager.recordUsage('videoDetails');
      }

      // Circuit breaker should be open
      const available = await manager.isAvailable('videoDetails');
      expect(available).toBe(false);
    });

    it('should recommend offline library when quota exceeded', async () => {
      await manager.setDailyLimit(1000);

      // Use 960 units (96%)
      for (let i = 0; i < 960; i++) {
        await manager.recordUsage('videoDetails');
      }

      const shouldUseOffline = await manager.shouldUseOfflineLibrary();
      expect(shouldUseOffline).toBe(true);
    });

    it('should not recommend offline library under threshold', async () => {
      await manager.setDailyLimit(1000);

      // Use 500 units (50%)
      for (let i = 0; i < 500; i++) {
        await manager.recordUsage('videoDetails');
      }

      const shouldUseOffline = await manager.shouldUseOfflineLibrary();
      expect(shouldUseOffline).toBe(false);
    });
  });

  describe('Quota Reset', () => {
    it('should reset quota to zero', async () => {
      await manager.recordUsage('search');
      await manager.recordUsage('videoDetails');

      await manager.resetQuota();

      const status = await manager.getStatus();
      expect(status.used).toBe(0);
      expect(status.remaining).toBe(10000);
      expect(status.percentUsed).toBe(0);
    });

    it('should set reset time to tomorrow', async () => {
      await manager.resetQuota();
      const status = await manager.getStatus();

      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);

      expect(status.resetTime).toBeGreaterThan(Date.now());
      expect(status.resetTime).toBeLessThanOrEqual(tomorrow.getTime());
    });
  });

  describe('Alert Tracking', () => {
    it('should store alerts when thresholds crossed', async () => {
      await manager.setDailyLimit(1000);

      // Cross 50% threshold
      for (let i = 0; i < 500; i++) {
        await manager.recordUsage('videoDetails');
      }

      const alerts = await manager.getRecentAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].level).toBe('warning');
    });

    it('should track critical alert at 80%', async () => {
      await manager.setDailyLimit(1000);

      // Cross 80% threshold
      for (let i = 0; i < 800; i++) {
        await manager.recordUsage('videoDetails');
      }

      const alerts = await manager.getRecentAlerts();
      const criticalAlert = alerts.find((a) => a.level === 'critical');
      expect(criticalAlert).toBeDefined();
    });

    it('should track exceeded alert at 95%', async () => {
      await manager.setDailyLimit(1000);

      // Cross 95% threshold
      for (let i = 0; i < 950; i++) {
        await manager.recordUsage('videoDetails');
      }

      const alerts = await manager.getRecentAlerts();
      const exceededAlert = alerts.find((a) => a.level === 'exceeded');
      expect(exceededAlert).toBeDefined();
    });

    it('should limit alerts to last 100', async () => {
      await manager.setDailyLimit(10000);

      // Generate 150 alerts by recording many operations
      for (let i = 0; i < 9500; i += 100) {
        for (let j = 0; j < 100; j++) {
          await manager.recordUsage('videoDetails');
        }
      }

      const alerts = await manager.getRecentAlerts();
      expect(alerts.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Custom Limits', () => {
    it('should allow setting custom daily limit', async () => {
      await manager.setDailyLimit(5000);
      const status = await manager.getStatus();
      expect(status.dailyLimit).toBe(5000);
    });

    it('should recalculate percentages with new limit', async () => {
      await manager.setDailyLimit(1000);
      for (let i = 0; i < 500; i++) {
        await manager.recordUsage('videoDetails');
      }

      let status = await manager.getStatus();
      expect(status.percentUsed).toBe(50);

      // Double the limit
      await manager.setDailyLimit(2000);
      status = await manager.getStatus();
      expect(status.percentUsed).toBe(25);
    });
  });

  describe('Operation Costs', () => {
    it('should charge correct cost for search operation', async () => {
      await manager.recordUsage('search');
      const status = await manager.getStatus();
      expect(status.used).toBe(100);
    });

    it('should charge correct cost for videoDetails operation', async () => {
      await manager.recordUsage('videoDetails');
      const status = await manager.getStatus();
      expect(status.used).toBe(1);
    });

    it('should charge correct cost for videoDownload operation', async () => {
      await manager.recordUsage('videoDownload');
      const status = await manager.getStatus();
      expect(status.used).toBe(1);
    });
  });
});
