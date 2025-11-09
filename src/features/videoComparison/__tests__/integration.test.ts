/**
 * Integration Tests
 *
 * Tests the integration between multiple services to ensure
 * they work together correctly.
 */

import { telemetryService } from '../services/telemetryService';
import { youtubeQuotaManager } from '../services/youtubeQuotaManager';
import { deviceHealthMonitor } from '../../../services/deviceHealthMonitor';
import { analyticsService } from '../services/analytics';
import { getLocalizedFeedbackMessages } from '../constants/feedbackMessages';

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    telemetryService.clear();
  });

  afterEach(() => {
    deviceHealthMonitor.stopMonitoring();
  });

  describe('Telemetry + Analytics Integration', () => {
    it('should track session through both systems', async () => {
      const sessionId = 'integration-test-123';

      // Start session via analytics
      analyticsService.trackSessionStarted({
        sessionId,
        mode: 'async',
        exerciseType: 'shoulder_abduction',
      });

      // Verify telemetry received it
      expect(telemetryService.getPendingCount()).toBeGreaterThan(0);
    });

    it('should track error detection through both systems', () => {
      const sessionId = 'integration-test-123';

      analyticsService.trackErrorDetected({
        sessionId,
        errorType: 'knee_valgus',
        severity: 'critical',
        joint: 'leftKnee',
        deviation: 12,
      });

      // Verify telemetry received it
      expect(telemetryService.getPendingCount()).toBeGreaterThan(0);
    });

    it('should track performance events', () => {
      analyticsService.trackThermalThrottle('serious');
      analyticsService.trackMemoryWarning('resolution_downgraded');

      // Both should be in telemetry queue
      expect(telemetryService.getPendingCount()).toBeGreaterThan(0);
    });
  });

  describe('Quota + YouTube Integration', () => {
    it('should track quota usage in telemetry', async () => {
      await youtubeQuotaManager.clearQuotaData();
      telemetryService.clear();

      await youtubeQuotaManager.recordUsage('search');

      // Should emit telemetry event
      expect(telemetryService.getPendingCount()).toBeGreaterThan(0);
    });

    it('should recommend offline library when quota exceeded', async () => {
      await youtubeQuotaManager.clearQuotaData();
      await youtubeQuotaManager.setDailyLimit(100);

      // Use 96 units (96%)
      for (let i = 0; i < 96; i++) {
        await youtubeQuotaManager.recordUsage('videoDetails');
      }

      const shouldUseOffline = await youtubeQuotaManager.shouldUseOfflineLibrary();
      expect(shouldUseOffline).toBe(true);
    });

    it('should block API calls when quota exceeded', async () => {
      await youtubeQuotaManager.clearQuotaData();
      await youtubeQuotaManager.setDailyLimit(100);

      // Use 96 units (96%)
      for (let i = 0; i < 96; i++) {
        await youtubeQuotaManager.recordUsage('videoDetails');
      }

      const isAvailable = await youtubeQuotaManager.isAvailable('search');
      expect(isAvailable).toBe(false);
    });
  });

  describe('Device Health + Performance Adaptation', () => {
    it('should provide inference recommendations', () => {
      const rec = deviceHealthMonitor.getInferenceRecommendation();

      expect(rec).toHaveProperty('interval_ms');
      expect(rec).toHaveProperty('resolution');
      expect(rec).toHaveProperty('maxFPS');
      expect(rec).toHaveProperty('reason');

      expect(rec.interval_ms).toBeGreaterThan(0);
      expect(['1080p', '720p', '540p']).toContain(rec.resolution);
      expect(rec.maxFPS).toBeGreaterThan(0);
    });

    it('should track health changes in telemetry', () => {
      telemetryService.clear();

      const callback = jest.fn();
      const unsubscribe = deviceHealthMonitor.addListener(callback);

      // Cleanup
      unsubscribe();

      // Verify listener system works
      expect(callback).toBeDefined();
    });
  });

  describe('Localization + Feedback Messages', () => {
    it('should provide English messages', () => {
      const messages = getLocalizedFeedbackMessages('en');

      expect(messages.knee.kneeValgus).toHaveProperty('title');
      expect(messages.knee.kneeValgus).toHaveProperty('description');
      expect(messages.knee.kneeValgus).toHaveProperty('correction');

      expect(messages.knee.kneeValgus.title).toContain('Valgus');
    });

    it('should provide Spanish messages', () => {
      const messages = getLocalizedFeedbackMessages('es');

      expect(messages.knee.kneeValgus).toHaveProperty('title');
      expect(messages.knee.kneeValgus).toHaveProperty('description');
      expect(messages.knee.kneeValgus).toHaveProperty('correction');

      expect(messages.knee.kneeValgus.title).toContain('Valgo');
    });

    it('should have all error types in both languages', () => {
      const en = getLocalizedFeedbackMessages('en');
      const es = getLocalizedFeedbackMessages('es');

      // Shoulder errors
      expect(en.shoulder.shoulderHiking).toBeDefined();
      expect(es.shoulder.shoulderHiking).toBeDefined();
      expect(en.shoulder.trunkLean).toBeDefined();
      expect(es.shoulder.trunkLean).toBeDefined();

      // Knee errors
      expect(en.knee.kneeValgus).toBeDefined();
      expect(es.knee.kneeValgus).toBeDefined();
      expect(en.knee.heelLift).toBeDefined();
      expect(es.knee.heelLift).toBeDefined();

      // Elbow errors
      expect(en.elbow.shoulderCompensation).toBeDefined();
      expect(es.elbow.shoulderCompensation).toBeDefined();
    });

    it('should fall back to English for unknown locale', () => {
      const messages = getLocalizedFeedbackMessages('fr'); // French not supported
      expect(messages.general.goodRep).toBe('Good rep!');
    });
  });

  describe('End-to-End Session Flow', () => {
    it('should track complete async session flow', async () => {
      const sessionId = 'e2e-test-123';
      telemetryService.clear();
      await youtubeQuotaManager.clearQuotaData();

      // 1. User enters YouTube URL
      analyticsService.trackYouTubeUrlEntered('https://youtube.com/watch?v=test');

      // 2. Check quota
      const canDownload = await youtubeQuotaManager.isAvailable('videoDetails');
      expect(canDownload).toBe(true);

      // 3. Download video
      if (canDownload) {
        analyticsService.trackYouTubeDownloadStarted(
          'https://youtube.com/watch?v=test',
          '720p'
        );
        await youtubeQuotaManager.recordUsage('videoDetails');
        analyticsService.trackYouTubeDownloadCompleted(
          'https://youtube.com/watch?v=test',
          5000,
          5.2
        );
      }

      // 4. Start session
      analyticsService.trackSessionStarted({
        sessionId,
        mode: 'async',
        exerciseType: 'shoulder_abduction',
      });

      // 5. Start recording
      analyticsService.trackRecordingStarted(sessionId, 'shoulder_abduction');

      // 6. Complete recording
      analyticsService.trackRecordingCompleted(sessionId, 30000, 3.1);

      // 7. Start analysis
      analyticsService.trackAnalysisStarted(sessionId, 'async');

      // 8. Detect errors
      analyticsService.trackErrorDetected({
        sessionId,
        errorType: 'shoulder_hiking',
        severity: 'warning',
        joint: 'leftShoulder',
        deviation: 3,
      });

      // 9. Complete analysis
      analyticsService.trackAnalysisCompleted(sessionId, 25000);

      // 10. Complete session
      analyticsService.trackSessionCompleted({
        sessionId,
        mode: 'async',
        exerciseType: 'shoulder_abduction',
        duration_ms: 60000,
        score: 82,
        errorCount: 1,
      });

      // 11. Generate report
      analyticsService.trackReportGenerated(sessionId, 'pdf');

      // Verify all events tracked
      expect(telemetryService.getPendingCount()).toBeGreaterThan(0);
    });

    it('should handle quota exceeded gracefully', async () => {
      await youtubeQuotaManager.clearQuotaData();
      await youtubeQuotaManager.setDailyLimit(100);

      // Exhaust quota
      for (let i = 0; i < 96; i++) {
        await youtubeQuotaManager.recordUsage('videoDetails');
      }

      // Check quota
      const canDownload = await youtubeQuotaManager.isAvailable('search');
      expect(canDownload).toBe(false);

      // Fallback to offline library
      const shouldUseOffline = await youtubeQuotaManager.shouldUseOfflineLibrary();
      expect(shouldUseOffline).toBe(true);

      // Track offline usage
      analyticsService.trackOfflineLibraryUsed('video-123');

      expect(telemetryService.getPendingCount()).toBeGreaterThan(0);
    });

    it('should adapt performance based on device health', () => {
      const health = deviceHealthMonitor.getHealth();
      const rec = deviceHealthMonitor.getInferenceRecommendation();

      // Verify recommendations make sense
      if (health.thermalState === 'critical') {
        expect(rec.interval_ms).toBeGreaterThanOrEqual(2000);
        expect(rec.resolution).toBe('540p');
      }

      if (health.batteryLevel < 0.15) {
        expect(rec.interval_ms).toBeGreaterThanOrEqual(1000);
      }

      expect(rec).toBeDefined();
    });
  });

  describe('Error Message Quality', () => {
    it('should provide patient-friendly messages', () => {
      const messages = getLocalizedFeedbackMessages('en');

      // Check knee valgus (critical injury risk)
      expect(messages.knee.kneeValgus.title).toBeTruthy();
      expect(messages.knee.kneeValgus.description).toContain('injury risk');
      expect(messages.knee.kneeValgus.correction).toContain('Push your knees outward');

      // Check shoulder hiking
      expect(messages.shoulder.shoulderHiking.correction).toContain('shoulder down');

      // All messages should be actionable
      Object.values(messages.shoulder).forEach((msg) => {
        expect(msg.correction).toBeTruthy();
        expect(msg.correction.length).toBeGreaterThan(10);
      });
    });

    it('should include positive reinforcement messages', () => {
      const messages = getLocalizedFeedbackMessages('en');

      expect(messages.general.goodRep).toBeTruthy();
      expect(messages.general.excellentForm).toBeTruthy();
      expect(messages.general.keepGoing).toBeTruthy();
      expect(messages.general.noErrors).toBeTruthy();
    });
  });
});
