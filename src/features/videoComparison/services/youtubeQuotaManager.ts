/**
 * YouTube Quota Manager
 *
 * Manages YouTube API quota to prevent exceeding daily limits.
 * Implements circuit breaker pattern and fallback to offline library.
 */

import { telemetryService } from './telemetryService';
import EncryptedStorage from 'react-native-encrypted-storage';

export interface QuotaStatus {
  dailyLimit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  resetTime: number; // Unix timestamp
}

export interface QuotaAlert {
  level: 'warning' | 'critical' | 'exceeded';
  message: string;
  percentUsed: number;
}

export class YouTubeQuotaManager {
  private static instance: YouTubeQuotaManager;

  // YouTube API costs (in quota units)
  private readonly COSTS = {
    search: 100,
    videoDetails: 1,
    videoDownload: 1, // Actual download doesn't cost quota, but we track it
  };

  // Quota thresholds
  private readonly DAILY_LIMIT = 10000; // YouTube API default
  private readonly WARNING_THRESHOLD = 0.5; // 50%
  private readonly CRITICAL_THRESHOLD = 0.8; // 80%
  private readonly EXCEEDED_THRESHOLD = 0.95; // 95%

  // Circuit breaker state
  private circuitOpen = false;
  private circuitOpenUntil = 0;

  private constructor() {
    this.initializeQuota();
  }

  static getInstance(): YouTubeQuotaManager {
    if (!YouTubeQuotaManager.instance) {
      YouTubeQuotaManager.instance = new YouTubeQuotaManager();
    }
    return YouTubeQuotaManager.instance;
  }

  /**
   * Initialize quota from storage
   */
  private async initializeQuota(): Promise<void> {
    try {
      const stored = await EncryptedStorage.getItem('youtube_quota_status');
      if (stored) {
        const status: QuotaStatus = JSON.parse(stored);

        // Reset if past reset time
        if (Date.now() > status.resetTime) {
          await this.resetQuota();
        }
      } else {
        // First time - initialize
        await this.resetQuota();
      }
    } catch (error) {
      console.error('[QuotaManager] Failed to initialize:', error);
      await this.resetQuota();
    }
  }

  /**
   * Get current quota status
   */
  async getStatus(): Promise<QuotaStatus> {
    const stored = await EncryptedStorage.getItem('youtube_quota_status');
    if (!stored) {
      return this.createDefaultStatus();
    }
    return JSON.parse(stored);
  }

  /**
   * Check if quota is available for operation
   */
  async isAvailable(operation: 'search' | 'videoDetails' | 'videoDownload'): Promise<boolean> {
    // Check circuit breaker
    if (this.circuitOpen) {
      if (Date.now() < this.circuitOpenUntil) {
        console.warn('[QuotaManager] Circuit breaker is open - quota exceeded');
        return false;
      } else {
        // Reset circuit breaker
        this.circuitOpen = false;
      }
    }

    const status = await this.getStatus();
    const cost = this.COSTS[operation];

    // Check if adding this operation would exceed limit
    if (status.used + cost > status.dailyLimit * this.EXCEEDED_THRESHOLD) {
      this.openCircuitBreaker();
      return false;
    }

    return true;
  }

  /**
   * Record quota usage
   */
  async recordUsage(operation: 'search' | 'videoDetails' | 'videoDownload'): Promise<void> {
    const status = await this.getStatus();
    const cost = this.COSTS[operation];

    status.used += cost;
    status.remaining = status.dailyLimit - status.used;
    status.percentUsed = (status.used / status.dailyLimit) * 100;

    await this.saveStatus(status);

    // Emit telemetry
    telemetryService.trackQuotaUsed(cost, status.remaining);

    // Check for alerts
    await this.checkAlerts(status);
  }

  /**
   * Reset quota (called at midnight UTC)
   */
  async resetQuota(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);

    const status: QuotaStatus = {
      dailyLimit: this.DAILY_LIMIT,
      used: 0,
      remaining: this.DAILY_LIMIT,
      percentUsed: 0,
      resetTime: tomorrow.getTime(),
    };

    await this.saveStatus(status);
    this.circuitOpen = false;

    console.log('[QuotaManager] Quota reset successful');
  }

  /**
   * Check quota status and emit alerts if needed
   */
  private async checkAlerts(status: QuotaStatus): Promise<void> {
    const percentUsed = status.percentUsed / 100;

    let alert: QuotaAlert | null = null;

    if (percentUsed >= this.EXCEEDED_THRESHOLD) {
      alert = {
        level: 'exceeded',
        message: 'YouTube quota exceeded! Falling back to offline library.',
        percentUsed: status.percentUsed,
      };
      this.openCircuitBreaker();
    } else if (percentUsed >= this.CRITICAL_THRESHOLD) {
      alert = {
        level: 'critical',
        message: `YouTube quota at ${status.percentUsed.toFixed(0)}%! Consider using offline library.`,
        percentUsed: status.percentUsed,
      };
    } else if (percentUsed >= this.WARNING_THRESHOLD) {
      alert = {
        level: 'warning',
        message: `YouTube quota at ${status.percentUsed.toFixed(0)}%. Monitoring usage.`,
        percentUsed: status.percentUsed,
      };
    }

    if (alert) {
      console.warn(`[QuotaManager] ${alert.level.toUpperCase()}: ${alert.message}`);
      await this.saveAlert(alert);

      // TODO: Emit push notification or email alert
      // await notificationService.send(alert.message);
    }
  }

  /**
   * Open circuit breaker (block YouTube API calls)
   */
  private openCircuitBreaker(): void {
    this.circuitOpen = true;

    // Keep circuit open until quota resets
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    this.circuitOpenUntil = tomorrow.getTime();

    console.error('[QuotaManager] Circuit breaker OPEN - blocking YouTube API calls until quota reset');
  }

  /**
   * Check if should use offline library instead of YouTube
   */
  async shouldUseOfflineLibrary(): Promise<boolean> {
    if (this.circuitOpen) {
      return true;
    }

    const status = await this.getStatus();
    return status.percentUsed >= this.EXCEEDED_THRESHOLD * 100;
  }

  /**
   * Save quota status to storage
   */
  private async saveStatus(status: QuotaStatus): Promise<void> {
    await EncryptedStorage.setItem('youtube_quota_status', JSON.stringify(status));
  }

  /**
   * Save alert to storage for later review
   */
  private async saveAlert(alert: QuotaAlert): Promise<void> {
    try {
      const stored = await EncryptedStorage.getItem('youtube_quota_alerts');
      const alerts: Array<QuotaAlert & { timestamp: number }> = stored ? JSON.parse(stored) : [];

      alerts.push({
        ...alert,
        timestamp: Date.now(),
      });

      // Keep last 100 alerts
      const recentAlerts = alerts.slice(-100);

      await EncryptedStorage.setItem('youtube_quota_alerts', JSON.stringify(recentAlerts));
    } catch (error) {
      console.error('[QuotaManager] Failed to save alert:', error);
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(): Promise<Array<QuotaAlert & { timestamp: number }>> {
    try {
      const stored = await EncryptedStorage.getItem('youtube_quota_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[QuotaManager] Failed to get alerts:', error);
      return [];
    }
  }

  /**
   * Create default quota status
   */
  private createDefaultStatus(): QuotaStatus {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);

    return {
      dailyLimit: this.DAILY_LIMIT,
      used: 0,
      remaining: this.DAILY_LIMIT,
      percentUsed: 0,
      resetTime: tomorrow.getTime(),
    };
  }

  /**
   * Manually adjust quota (for testing or quota increases)
   */
  async setDailyLimit(limit: number): Promise<void> {
    const status = await this.getStatus();
    status.dailyLimit = limit;
    status.remaining = limit - status.used;
    status.percentUsed = (status.used / limit) * 100;
    await this.saveStatus(status);
  }

  /**
   * Clear all quota data (for testing)
   */
  async clearQuotaData(): Promise<void> {
    await EncryptedStorage.removeItem('youtube_quota_status');
    await EncryptedStorage.removeItem('youtube_quota_alerts');
    this.circuitOpen = false;
    await this.resetQuota();
  }
}

// Singleton export
export const youtubeQuotaManager = YouTubeQuotaManager.getInstance();
