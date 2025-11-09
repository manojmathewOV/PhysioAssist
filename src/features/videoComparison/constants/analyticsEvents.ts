/**
 * Analytics Events
 *
 * Centralized event definitions for video comparison feature.
 * All analytics events should be defined here for consistency.
 */

export const VideoComparisonEvents = {
  // Session events
  SESSION_STARTED: 'video_comparison_session_started',
  SESSION_COMPLETED: 'video_comparison_session_completed',
  SESSION_ABANDONED: 'video_comparison_session_abandoned',
  SESSION_SHARED: 'video_comparison_session_shared',

  // YouTube events
  YOUTUBE_URL_ENTERED: 'video_comparison_youtube_url_entered',
  YOUTUBE_DOWNLOAD_STARTED: 'video_comparison_youtube_download_started',
  YOUTUBE_DOWNLOAD_COMPLETED: 'video_comparison_youtube_download_completed',
  YOUTUBE_DOWNLOAD_FAILED: 'video_comparison_youtube_download_failed',
  YOUTUBE_CACHE_HIT: 'video_comparison_youtube_cache_hit',
  YOUTUBE_QUOTA_WARNING: 'video_comparison_youtube_quota_warning',
  YOUTUBE_QUOTA_EXCEEDED: 'video_comparison_youtube_quota_exceeded',

  // Recording events
  RECORDING_STARTED: 'video_comparison_recording_started',
  RECORDING_COMPLETED: 'video_comparison_recording_completed',
  RECORDING_CANCELLED: 'video_comparison_recording_cancelled',
  RECORDING_ERROR: 'video_comparison_recording_error',

  // Analysis events
  ANALYSIS_STARTED: 'video_comparison_analysis_started',
  ANALYSIS_COMPLETED: 'video_comparison_analysis_completed',
  ANALYSIS_FAILED: 'video_comparison_analysis_failed',

  // Error detection events
  ERROR_DETECTED: 'video_comparison_error_detected',
  CRITICAL_ERROR_DETECTED: 'video_comparison_critical_error_detected',
  NO_ERRORS_DETECTED: 'video_comparison_no_errors_detected',

  // Review events
  REVIEW_OPENED: 'video_comparison_review_opened',
  PLAYBACK_SPEED_CHANGED: 'video_comparison_playback_speed_changed',
  FRAME_STEPPED: 'video_comparison_frame_stepped',
  ERROR_TAPPED: 'video_comparison_error_tapped',

  // Report events
  REPORT_GENERATED: 'video_comparison_report_generated',
  REPORT_SHARED_EMAIL: 'video_comparison_report_shared_email',
  REPORT_SHARED_SMS: 'video_comparison_report_shared_sms',
  REPORT_FAVORITED: 'video_comparison_report_favorited',
  REPORT_DELETED: 'video_comparison_report_deleted',

  // Live mode events
  LIVE_MODE_STARTED: 'video_comparison_live_mode_started',
  LIVE_MODE_PAUSED: 'video_comparison_live_mode_paused',
  LIVE_MODE_RESUMED: 'video_comparison_live_mode_resumed',
  LIVE_MODE_COMPLETED: 'video_comparison_live_mode_completed',
  LIVE_FEEDBACK_GIVEN: 'video_comparison_live_feedback_given',

  // Performance events
  INFERENCE_SLOW: 'video_comparison_inference_slow',
  THERMAL_THROTTLE: 'video_comparison_thermal_throttle',
  MEMORY_WARNING: 'video_comparison_memory_warning',
  FRAME_DROP: 'video_comparison_frame_drop',

  // User actions
  SETTINGS_CHANGED: 'video_comparison_settings_changed',
  FEEDBACK_LEVEL_CHANGED: 'video_comparison_feedback_level_changed',
  EXERCISE_TYPE_SELECTED: 'video_comparison_exercise_type_selected',
  OFFLINE_LIBRARY_USED: 'video_comparison_offline_library_used',
} as const;

export type VideoComparisonEvent =
  (typeof VideoComparisonEvents)[keyof typeof VideoComparisonEvents];
