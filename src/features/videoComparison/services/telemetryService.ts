/**
 * Telemetry Service
 *
 * Tracks and emits analytics events for video comparison feature.
 * Integrates with analytics backend (Segment/LaunchDarkly/Firebase).
 */

export interface SessionTelemetry {
  sessionId: string;
  timestamp: number;
  exerciseType: string;
  mode: 'async' | 'live';

  // Performance metrics
  inferenceDuration_ms: number;
  dtwSyncDuration_ms: number;
  totalProcessingTime_ms: number;

  // Accuracy metrics
  syncConfidence: number; // 0-1
  speedRatio: number;
  overallScore: number;

  // Storage metrics
  youtubeVideoSize_mb: number;
  patientVideoSize_mb: number;
  cacheHit: boolean;

  // Device context
  deviceModel: string;
  iosVersion: string;
  batteryLevel: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';

  // Error tracking
  errorCount: number;
  criticalErrorCount: number;
  topError: string | null;
}

export interface FrameTelemetry {
  sessionId: string;
  frameIndex: number;
  timestamp: number;

  // Performance
  inferenceTime_ms: number;
  poseConfidence: number;
  droppedFrames: number;

  // Device health
  thermalThrottling: boolean;
}

export interface NetworkTelemetry {
  operation: 'youtube_download' | 'video_upload' | 'report_share';
  duration_ms: number;
  bytesTransferred: number;
  success: boolean;
  errorCode?: string;
  retryCount: number;
}

export interface ErrorTelemetry {
  sessionId: string;
  errorType: string;
  severity: 'warning' | 'critical';
  joint: string;
  deviation: number;
  timestamp: number;
}

export type TelemetryEvent =
  | { type: 'session_start'; data: Partial<SessionTelemetry> }
  | { type: 'session_complete'; data: SessionTelemetry }
  | { type: 'frame_processed'; data: FrameTelemetry }
  | { type: 'network_operation'; data: NetworkTelemetry }
  | { type: 'error_detected'; data: ErrorTelemetry }
  | { type: 'quota_used'; data: { units: number; remaining: number } }
  | { type: 'memory_warning'; data: { timestamp: number; action: string } }
  | { type: 'thermal_throttle'; data: { timestamp: number; state: string } };

export class TelemetryService {
  private static instance: TelemetryService;
  private eventQueue: TelemetryEvent[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startFlushTimer();
  }

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Emit a telemetry event
   */
  emit(event: TelemetryEvent): void {
    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track session start
   */
  trackSessionStart(sessionId: string, mode: 'async' | 'live', exerciseType: string): void {
    this.emit({
      type: 'session_start',
      data: {
        sessionId,
        mode,
        exerciseType,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track session completion
   */
  trackSessionComplete(data: SessionTelemetry): void {
    this.emit({
      type: 'session_complete',
      data,
    });
  }

  /**
   * Track frame processing (live mode)
   */
  trackFrameProcessed(data: FrameTelemetry): void {
    this.emit({
      type: 'frame_processed',
      data,
    });
  }

  /**
   * Track network operation
   */
  trackNetworkOperation(data: NetworkTelemetry): void {
    this.emit({
      type: 'network_operation',
      data,
    });
  }

  /**
   * Track error detection
   */
  trackErrorDetected(data: ErrorTelemetry): void {
    this.emit({
      type: 'error_detected',
      data,
    });
  }

  /**
   * Track quota usage
   */
  trackQuotaUsed(units: number, remaining: number): void {
    this.emit({
      type: 'quota_used',
      data: { units, remaining },
    });
  }

  /**
   * Track memory warning
   */
  trackMemoryWarning(action: string): void {
    this.emit({
      type: 'memory_warning',
      data: { timestamp: Date.now(), action },
    });
  }

  /**
   * Track thermal throttling
   */
  trackThermalThrottle(state: string): void {
    this.emit({
      type: 'thermal_throttle',
      data: { timestamp: Date.now(), state },
    });
  }

  /**
   * Flush events to backend
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // TODO: Replace with actual analytics backend
      // await analytics.track(events);

      // For now, log to console in development
      if (__DEV__) {
        console.log('[Telemetry] Flushing events:', events.length);
        events.forEach(event => {
          console.log(`  - ${event.type}:`, event.data);
        });
      }

      // In production, send to analytics service:
      // Example: Segment
      // await analytics.track('batch_events', { events });

      // Example: Firebase Analytics
      // await analytics().logEvent('batch_events', { events });

    } catch (error) {
      console.error('[Telemetry] Failed to flush events:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop automatic flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Force immediate flush
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Clear all pending events
   */
  clear(): void {
    this.eventQueue = [];
  }

  /**
   * Get pending event count
   */
  getPendingCount(): number {
    return this.eventQueue.length;
  }
}

// Singleton export
export const telemetryService = TelemetryService.getInstance();
