/**
 * AnalyticsService Unit Tests
 */

import { AnalyticsService, analyticsService } from '../services/analytics';

// Mock telemetry service
jest.mock('../services/telemetryService');

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = AnalyticsService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AnalyticsService.getInstance();
      const instance2 = AnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should match the exported singleton', () => {
      const instance = AnalyticsService.getInstance();
      expect(instance).toBe(analyticsService);
    });
  });

  describe('Session Events', () => {
    it('should track session started', () => {
      expect(() => {
        service.trackSessionStarted({
          sessionId: 'test-123',
          mode: 'async',
          exerciseType: 'shoulder_abduction',
        });
      }).not.toThrow();
    });

    it('should track session completed', () => {
      expect(() => {
        service.trackSessionCompleted({
          sessionId: 'test-123',
          mode: 'async',
          exerciseType: 'squat',
          duration_ms: 30000,
          score: 85,
          errorCount: 2,
        });
      }).not.toThrow();
    });

    it('should track session abandoned', () => {
      expect(() => {
        service.trackSessionAbandoned({
          sessionId: 'test-123',
          mode: 'live',
          exerciseType: 'bicep_curl',
        });
      }).not.toThrow();
    });

    it('should track session shared', () => {
      expect(() => {
        service.trackSessionShared({
          sessionId: 'test-123',
          mode: 'async',
          exerciseType: 'squat',
          method: 'email',
        });
      }).not.toThrow();
    });
  });

  describe('YouTube Events', () => {
    it('should track URL entered', () => {
      expect(() => {
        service.trackYouTubeUrlEntered('https://youtube.com/watch?v=test');
      }).not.toThrow();
    });

    it('should track download started', () => {
      expect(() => {
        service.trackYouTubeDownloadStarted('https://youtube.com/watch?v=test', '720p');
      }).not.toThrow();
    });

    it('should track download completed', () => {
      expect(() => {
        service.trackYouTubeDownloadCompleted('https://youtube.com/watch?v=test', 5000, 5.2);
      }).not.toThrow();
    });

    it('should track download failed', () => {
      expect(() => {
        service.trackYouTubeDownloadFailed('https://youtube.com/watch?v=test', 'Network timeout');
      }).not.toThrow();
    });

    it('should track cache hit', () => {
      expect(() => {
        service.trackYouTubeCacheHit('https://youtube.com/watch?v=test');
      }).not.toThrow();
    });

    it('should track quota warning', () => {
      expect(() => {
        service.trackYouTubeQuotaWarning(75);
      }).not.toThrow();
    });

    it('should track quota exceeded', () => {
      expect(() => {
        service.trackYouTubeQuotaExceeded();
      }).not.toThrow();
    });
  });

  describe('Recording Events', () => {
    it('should track recording started', () => {
      expect(() => {
        service.trackRecordingStarted('test-123', 'squat');
      }).not.toThrow();
    });

    it('should track recording completed', () => {
      expect(() => {
        service.trackRecordingCompleted('test-123', 30000, 3.1);
      }).not.toThrow();
    });

    it('should track recording cancelled', () => {
      expect(() => {
        service.trackRecordingCancelled('test-123');
      }).not.toThrow();
    });

    it('should track recording error', () => {
      expect(() => {
        service.trackRecordingError('test-123', 'Camera permission denied');
      }).not.toThrow();
    });
  });

  describe('Analysis Events', () => {
    it('should track analysis started', () => {
      expect(() => {
        service.trackAnalysisStarted('test-123', 'async');
      }).not.toThrow();
    });

    it('should track analysis completed', () => {
      expect(() => {
        service.trackAnalysisCompleted('test-123', 25000);
      }).not.toThrow();
    });

    it('should track analysis failed', () => {
      expect(() => {
        service.trackAnalysisFailed('test-123', 'Pose detection failed');
      }).not.toThrow();
    });
  });

  describe('Error Detection Events', () => {
    it('should track error detected', () => {
      expect(() => {
        service.trackErrorDetected({
          sessionId: 'test-123',
          errorType: 'knee_valgus',
          severity: 'critical',
          joint: 'leftKnee',
          deviation: 12,
        });
      }).not.toThrow();
    });

    it('should track warning severity errors', () => {
      expect(() => {
        service.trackErrorDetected({
          sessionId: 'test-123',
          errorType: 'shoulder_hiking',
          severity: 'warning',
          joint: 'leftShoulder',
          deviation: 3,
        });
      }).not.toThrow();
    });

    it('should track no errors detected', () => {
      expect(() => {
        service.trackNoErrorsDetected('test-123', 95);
      }).not.toThrow();
    });
  });

  describe('Review Events', () => {
    it('should track review opened', () => {
      expect(() => {
        service.trackReviewOpened('test-123');
      }).not.toThrow();
    });

    it('should track playback speed changed', () => {
      expect(() => {
        service.trackPlaybackSpeedChanged(0.5);
        service.trackPlaybackSpeedChanged(0.75);
        service.trackPlaybackSpeedChanged(1.0);
      }).not.toThrow();
    });

    it('should track frame stepped', () => {
      expect(() => {
        service.trackFrameStepped('forward');
        service.trackFrameStepped('backward');
      }).not.toThrow();
    });

    it('should track error tapped', () => {
      expect(() => {
        service.trackErrorTapped('knee_valgus');
      }).not.toThrow();
    });
  });

  describe('Report Events', () => {
    it('should track report generated', () => {
      expect(() => {
        service.trackReportGenerated('test-123', 'pdf');
        service.trackReportGenerated('test-123', 'json');
      }).not.toThrow();
    });

    it('should track report shared via email', () => {
      expect(() => {
        service.trackReportSharedEmail('test-123');
      }).not.toThrow();
    });

    it('should track report shared via SMS', () => {
      expect(() => {
        service.trackReportSharedSMS('test-123');
      }).not.toThrow();
    });

    it('should track report favorited', () => {
      expect(() => {
        service.trackReportFavorited('test-123');
      }).not.toThrow();
    });

    it('should track report deleted', () => {
      expect(() => {
        service.trackReportDeleted('test-123');
      }).not.toThrow();
    });
  });

  describe('Live Mode Events', () => {
    it('should track live mode started', () => {
      expect(() => {
        service.trackLiveModeStarted('test-123', 'https://youtube.com/watch?v=test');
      }).not.toThrow();
    });

    it('should track live mode paused', () => {
      expect(() => {
        service.trackLiveModePaused('test-123');
      }).not.toThrow();
    });

    it('should track live mode resumed', () => {
      expect(() => {
        service.trackLiveModeResumed('test-123');
      }).not.toThrow();
    });

    it('should track live mode completed', () => {
      expect(() => {
        service.trackLiveModeCompleted('test-123', 10, 120000);
      }).not.toThrow();
    });

    it('should track live feedback given', () => {
      expect(() => {
        service.trackLiveFeedbackGiven('knee_valgus', 'high');
      }).not.toThrow();
    });
  });

  describe('Performance Events', () => {
    it('should track inference slow', () => {
      expect(() => {
        service.trackInferenceSlow({
          sessionId: 'test-123',
          metric: 'inference_time',
          value: 250,
          threshold: 100,
        });
      }).not.toThrow();
    });

    it('should track thermal throttle', () => {
      expect(() => {
        service.trackThermalThrottle('serious');
        service.trackThermalThrottle('critical');
      }).not.toThrow();
    });

    it('should track memory warning', () => {
      expect(() => {
        service.trackMemoryWarning('resolution_downgraded');
      }).not.toThrow();
    });

    it('should track frame drop', () => {
      expect(() => {
        service.trackFrameDrop(5);
      }).not.toThrow();
    });
  });

  describe('User Action Events', () => {
    it('should track settings changed', () => {
      expect(() => {
        service.trackSettingsChanged('audio_enabled', true);
        service.trackSettingsChanged('volume', 0.8);
      }).not.toThrow();
    });

    it('should track feedback level changed', () => {
      expect(() => {
        service.trackFeedbackLevelChanged('beginner');
        service.trackFeedbackLevelChanged('intermediate');
        service.trackFeedbackLevelChanged('advanced');
      }).not.toThrow();
    });

    it('should track exercise type selected', () => {
      expect(() => {
        service.trackExerciseTypeSelected('shoulder_abduction');
        service.trackExerciseTypeSelected('squat');
        service.trackExerciseTypeSelected('bicep_curl');
      }).not.toThrow();
    });

    it('should track offline library used', () => {
      expect(() => {
        service.trackOfflineLibraryUsed('video-123');
      }).not.toThrow();
    });
  });
});
