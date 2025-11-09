/**
 * Analytics Service
 *
 * Centralized analytics tracking for video comparison feature.
 * Uses telemetry service for event emission.
 */

import { telemetryService } from './telemetryService';
import { VideoComparisonEvents } from '../constants/analyticsEvents';

export interface SessionAnalyticsData {
  sessionId: string;
  mode: 'async' | 'live';
  exerciseType: string;
  youtubeUrl?: string;
  duration_ms?: number;
  score?: number;
  errorCount?: number;
}

export interface ErrorAnalyticsData {
  sessionId: string;
  errorType: string;
  severity: 'warning' | 'critical';
  joint: string;
  deviation: number;
}

export interface PerformanceAnalyticsData {
  sessionId: string;
  metric: string;
  value: number;
  threshold?: number;
}

/**
 * Analytics Service for Video Comparison
 *
 * Provides typed, centralized analytics tracking.
 */
export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // ========== Session Events ==========

  trackSessionStarted(data: SessionAnalyticsData): void {
    telemetryService.trackSessionStart(data.sessionId, data.mode, data.exerciseType);
    this.trackEvent(VideoComparisonEvents.SESSION_STARTED, data);
  }

  trackSessionCompleted(data: SessionAnalyticsData): void {
    this.trackEvent(VideoComparisonEvents.SESSION_COMPLETED, data);
  }

  trackSessionAbandoned(data: SessionAnalyticsData): void {
    this.trackEvent(VideoComparisonEvents.SESSION_ABANDONED, data);
  }

  trackSessionShared(data: SessionAnalyticsData & { method: 'email' | 'sms' }): void {
    this.trackEvent(VideoComparisonEvents.SESSION_SHARED, data);
  }

  // ========== YouTube Events ==========

  trackYouTubeUrlEntered(url: string): void {
    this.trackEvent(VideoComparisonEvents.YOUTUBE_URL_ENTERED, { url });
  }

  trackYouTubeDownloadStarted(url: string, quality: string): void {
    this.trackEvent(VideoComparisonEvents.YOUTUBE_DOWNLOAD_STARTED, { url, quality });
  }

  trackYouTubeDownloadCompleted(url: string, duration_ms: number, size_mb: number): void {
    this.trackEvent(VideoComparisonEvents.YOUTUBE_DOWNLOAD_COMPLETED, {
      url,
      duration_ms,
      size_mb,
    });
  }

  trackYouTubeDownloadFailed(url: string, error: string): void {
    this.trackEvent(VideoComparisonEvents.YOUTUBE_DOWNLOAD_FAILED, { url, error });
  }

  trackYouTubeCacheHit(url: string): void {
    this.trackEvent(VideoComparisonEvents.YOUTUBE_CACHE_HIT, { url });
  }

  trackYouTubeQuotaWarning(percentUsed: number): void {
    this.trackEvent(VideoComparisonEvents.YOUTUBE_QUOTA_WARNING, { percentUsed });
  }

  trackYouTubeQuotaExceeded(): void {
    this.trackEvent(VideoComparisonEvents.YOUTUBE_QUOTA_EXCEEDED, {
      timestamp: Date.now(),
    });
  }

  // ========== Recording Events ==========

  trackRecordingStarted(sessionId: string, exerciseType: string): void {
    this.trackEvent(VideoComparisonEvents.RECORDING_STARTED, { sessionId, exerciseType });
  }

  trackRecordingCompleted(sessionId: string, duration_ms: number, size_mb: number): void {
    this.trackEvent(VideoComparisonEvents.RECORDING_COMPLETED, {
      sessionId,
      duration_ms,
      size_mb,
    });
  }

  trackRecordingCancelled(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.RECORDING_CANCELLED, { sessionId });
  }

  trackRecordingError(sessionId: string, error: string): void {
    this.trackEvent(VideoComparisonEvents.RECORDING_ERROR, { sessionId, error });
  }

  // ========== Analysis Events ==========

  trackAnalysisStarted(sessionId: string, mode: 'async' | 'live'): void {
    this.trackEvent(VideoComparisonEvents.ANALYSIS_STARTED, { sessionId, mode });
  }

  trackAnalysisCompleted(sessionId: string, duration_ms: number): void {
    this.trackEvent(VideoComparisonEvents.ANALYSIS_COMPLETED, { sessionId, duration_ms });
  }

  trackAnalysisFailed(sessionId: string, error: string): void {
    this.trackEvent(VideoComparisonEvents.ANALYSIS_FAILED, { sessionId, error });
  }

  // ========== Error Detection Events ==========

  trackErrorDetected(data: ErrorAnalyticsData): void {
    telemetryService.trackErrorDetected(data);

    if (data.severity === 'critical') {
      this.trackEvent(VideoComparisonEvents.CRITICAL_ERROR_DETECTED, data);
    } else {
      this.trackEvent(VideoComparisonEvents.ERROR_DETECTED, data);
    }
  }

  trackNoErrorsDetected(sessionId: string, score: number): void {
    this.trackEvent(VideoComparisonEvents.NO_ERRORS_DETECTED, { sessionId, score });
  }

  // ========== Review Events ==========

  trackReviewOpened(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.REVIEW_OPENED, { sessionId });
  }

  trackPlaybackSpeedChanged(speed: number): void {
    this.trackEvent(VideoComparisonEvents.PLAYBACK_SPEED_CHANGED, { speed });
  }

  trackFrameStepped(direction: 'forward' | 'backward'): void {
    this.trackEvent(VideoComparisonEvents.FRAME_STEPPED, { direction });
  }

  trackErrorTapped(errorType: string): void {
    this.trackEvent(VideoComparisonEvents.ERROR_TAPPED, { errorType });
  }

  // ========== Report Events ==========

  trackReportGenerated(sessionId: string, format: 'pdf' | 'json'): void {
    this.trackEvent(VideoComparisonEvents.REPORT_GENERATED, { sessionId, format });
  }

  trackReportSharedEmail(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.REPORT_SHARED_EMAIL, { sessionId });
  }

  trackReportSharedSMS(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.REPORT_SHARED_SMS, { sessionId });
  }

  trackReportFavorited(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.REPORT_FAVORITED, { sessionId });
  }

  trackReportDeleted(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.REPORT_DELETED, { sessionId });
  }

  // ========== Live Mode Events ==========

  trackLiveModeStarted(sessionId: string, youtubeUrl: string): void {
    this.trackEvent(VideoComparisonEvents.LIVE_MODE_STARTED, { sessionId, youtubeUrl });
  }

  trackLiveModePaused(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.LIVE_MODE_PAUSED, { sessionId });
  }

  trackLiveModeResumed(sessionId: string): void {
    this.trackEvent(VideoComparisonEvents.LIVE_MODE_RESUMED, { sessionId });
  }

  trackLiveModeCompleted(sessionId: string, reps: number, duration_ms: number): void {
    this.trackEvent(VideoComparisonEvents.LIVE_MODE_COMPLETED, {
      sessionId,
      reps,
      duration_ms,
    });
  }

  trackLiveFeedbackGiven(feedbackType: string, priority: string): void {
    this.trackEvent(VideoComparisonEvents.LIVE_FEEDBACK_GIVEN, {
      feedbackType,
      priority,
    });
  }

  // ========== Performance Events ==========

  trackInferenceSlow(data: PerformanceAnalyticsData): void {
    this.trackEvent(VideoComparisonEvents.INFERENCE_SLOW, data);
  }

  trackThermalThrottle(state: string): void {
    telemetryService.trackThermalThrottle(state);
    this.trackEvent(VideoComparisonEvents.THERMAL_THROTTLE, {
      state,
      timestamp: Date.now(),
    });
  }

  trackMemoryWarning(action: string): void {
    telemetryService.trackMemoryWarning(action);
    this.trackEvent(VideoComparisonEvents.MEMORY_WARNING, {
      action,
      timestamp: Date.now(),
    });
  }

  trackFrameDrop(count: number): void {
    this.trackEvent(VideoComparisonEvents.FRAME_DROP, { count, timestamp: Date.now() });
  }

  // ========== User Action Events ==========

  trackSettingsChanged(setting: string, value: any): void {
    this.trackEvent(VideoComparisonEvents.SETTINGS_CHANGED, { setting, value });
  }

  trackFeedbackLevelChanged(level: 'beginner' | 'intermediate' | 'advanced'): void {
    this.trackEvent(VideoComparisonEvents.FEEDBACK_LEVEL_CHANGED, { level });
  }

  trackExerciseTypeSelected(exerciseType: string): void {
    this.trackEvent(VideoComparisonEvents.EXERCISE_TYPE_SELECTED, { exerciseType });
  }

  trackOfflineLibraryUsed(videoId: string): void {
    this.trackEvent(VideoComparisonEvents.OFFLINE_LIBRARY_USED, { videoId });
  }

  // ========== Private Helpers ==========

  private trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    if (__DEV__) {
      console.log(`[Analytics] ${eventName}:`, properties);
    }

    // TODO: Integrate with actual analytics backend
    // Example integrations:

    // Segment
    // analytics.track(eventName, properties);

    // Firebase Analytics
    // analytics().logEvent(eventName, properties);

    // Amplitude
    // amplitude.logEvent(eventName, properties);
  }
}

// Singleton export
export const analyticsService = AnalyticsService.getInstance();
