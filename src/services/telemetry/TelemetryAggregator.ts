/**
 * Telemetry Aggregator
 *
 * On-device aggregation of telemetry metrics to reduce network traffic,
 * improve privacy, and provide statistical summaries for production monitoring.
 *
 * @module TelemetryAggregator
 * @gate Gate 5 - Telemetry
 */

export interface AggregationWindow {
  /** Window start timestamp */
  startTime: number;
  /** Window end timestamp */
  endTime: number;
  /** Window duration (ms) */
  duration: number;
}

export interface PerformanceMetrics {
  /** Inference latency stats (ms) */
  inference: {
    count: number;
    mean: number;
    median: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    stddev: number;
  };

  /** Frame processing stats */
  frameProcessing: {
    totalFrames: number;
    droppedFrames: number;
    averageFPS: number;
    averageConfidence: number;
  };

  /** Network stats */
  network: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalBytesTransferred: number;
    averageDuration_ms: number;
  };
}

export interface ErrorMetrics {
  /** Error counts by type */
  errorsByType: Record<string, number>;
  /** Error counts by severity */
  errorsBySeverity: {
    warning: number;
    critical: number;
  };
  /** Top 5 errors */
  topErrors: Array<{ type: string; count: number }>;
  /** Errors by joint */
  errorsByJoint: Record<string, number>;
}

export interface DeviceMetrics {
  /** Device model distribution */
  deviceModels: Record<string, number>;
  /** OS version distribution */
  osVersions: Record<string, number>;
  /** Thermal state distribution */
  thermalStates: Record<string, number>;
  /** Average battery level */
  averageBatteryLevel: number;
  /** Thermal throttling events */
  thermalThrottleCount: number;
  /** Memory warnings */
  memoryWarningCount: number;
}

export interface SessionMetrics {
  /** Total sessions */
  totalSessions: number;
  /** Sessions by exercise type */
  sessionsByExercise: Record<string, number>;
  /** Sessions by mode */
  sessionsByMode: {
    async: number;
    live: number;
  };
  /** Average session metrics */
  averageMetrics: {
    overallScore: number;
    syncConfidence: number;
    speedRatio: number;
    processingTime_ms: number;
  };
}

export interface AggregatedTelemetry {
  /** Aggregation window */
  window: AggregationWindow;
  /** Performance metrics */
  performance: PerformanceMetrics;
  /** Error metrics */
  errors: ErrorMetrics;
  /** Device metrics */
  device: DeviceMetrics;
  /** Session metrics */
  sessions: SessionMetrics;
  /** Raw event count */
  rawEventCount: number;
  /** Compression ratio */
  compressionRatio: number;
}

/**
 * Telemetry Aggregator
 *
 * Collects raw telemetry events and produces aggregated statistical summaries.
 */
export class TelemetryAggregator {
  private windowDuration: number; // Aggregation window (ms)
  private currentWindow: AggregationWindow | null = null;

  // Raw data collectors
  private inferenceTimes: number[] = [];
  private frameCounts = { total: 0, dropped: 0 };
  private networkOps: Array<{ duration: number; success: boolean; bytes: number }> = [];
  private errors: Array<{ type: string; severity: string; joint: string }> = [];
  private deviceData: Array<{
    model: string;
    osVersion: string;
    thermal: string;
    battery: number;
  }> = [];
  private sessions: Array<{
    exerciseType: string;
    mode: string;
    score: number;
    confidence: number;
    speed: number;
    processingTime: number;
  }> = [];
  private thermalThrottles = 0;
  private memoryWarnings = 0;

  constructor(windowDuration: number = 3600000) {
    // 1 hour default
    this.windowDuration = windowDuration;
    this.startNewWindow();
  }

  /**
   * Add inference time measurement
   */
  addInferenceTime(duration_ms: number): void {
    this.ensureWindow();
    this.inferenceTimes.push(duration_ms);
  }

  /**
   * Add frame processing event
   */
  addFrameProcessed(dropped: boolean = false): void {
    this.ensureWindow();
    this.frameCounts.total++;
    if (dropped) {
      this.frameCounts.dropped++;
    }
  }

  /**
   * Add network operation
   */
  addNetworkOperation(duration_ms: number, success: boolean, bytes: number): void {
    this.ensureWindow();
    this.networkOps.push({ duration: duration_ms, success, bytes });
  }

  /**
   * Add error event
   */
  addError(errorType: string, severity: 'warning' | 'critical', joint: string): void {
    this.ensureWindow();
    this.errors.push({ type: errorType, severity, joint });
  }

  /**
   * Add device context
   */
  addDeviceContext(
    model: string,
    osVersion: string,
    thermal: string,
    battery: number
  ): void {
    this.ensureWindow();
    this.deviceData.push({ model, osVersion, thermal, battery });
  }

  /**
   * Add session completion
   */
  addSession(
    exerciseType: string,
    mode: 'async' | 'live',
    score: number,
    confidence: number,
    speedRatio: number,
    processingTime_ms: number
  ): void {
    this.ensureWindow();
    this.sessions.push({
      exerciseType,
      mode,
      score,
      confidence,
      speed: speedRatio,
      processingTime: processingTime_ms,
    });
  }

  /**
   * Add thermal throttle event
   */
  addThermalThrottle(): void {
    this.ensureWindow();
    this.thermalThrottles++;
  }

  /**
   * Add memory warning
   */
  addMemoryWarning(): void {
    this.ensureWindow();
    this.memoryWarnings++;
  }

  /**
   * Get aggregated metrics
   */
  aggregate(): AggregatedTelemetry {
    const rawEventCount = this.getRawEventCount();

    return {
      window: this.currentWindow!,
      performance: this.aggregatePerformance(),
      errors: this.aggregateErrors(),
      device: this.aggregateDevice(),
      sessions: this.aggregateSessions(),
      rawEventCount,
      compressionRatio: this.calculateCompressionRatio(rawEventCount),
    };
  }

  /**
   * Reset aggregator and start new window
   */
  reset(): void {
    this.inferenceTimes = [];
    this.frameCounts = { total: 0, dropped: 0 };
    this.networkOps = [];
    this.errors = [];
    this.deviceData = [];
    this.sessions = [];
    this.thermalThrottles = 0;
    this.memoryWarnings = 0;
    this.startNewWindow();
  }

  /**
   * Get current window
   */
  getCurrentWindow(): AggregationWindow | null {
    return this.currentWindow;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Ensure window is active, start new if expired
   */
  private ensureWindow(): void {
    const now = Date.now();
    if (!this.currentWindow || now > this.currentWindow.endTime) {
      this.startNewWindow();
    }
  }

  /**
   * Start new aggregation window
   */
  private startNewWindow(): void {
    const now = Date.now();
    this.currentWindow = {
      startTime: now,
      endTime: now + this.windowDuration,
      duration: this.windowDuration,
    };
  }

  /**
   * Aggregate performance metrics
   */
  private aggregatePerformance(): PerformanceMetrics {
    // Inference stats
    const sortedInference = [...this.inferenceTimes].sort((a, b) => a - b);
    const inferenceStats = {
      count: this.inferenceTimes.length,
      mean: this.mean(this.inferenceTimes),
      median: this.percentile(sortedInference, 50),
      p50: this.percentile(sortedInference, 50),
      p95: this.percentile(sortedInference, 95),
      p99: this.percentile(sortedInference, 99),
      min: sortedInference[0] || 0,
      max: sortedInference[sortedInference.length - 1] || 0,
      stddev: this.stddev(this.inferenceTimes),
    };

    // Frame processing stats
    const windowDurationSec = this.windowDuration / 1000;
    const avgFPS = this.frameCounts.total / windowDurationSec;

    // Network stats
    const successfulOps = this.networkOps.filter((op) => op.success).length;
    const totalBytes = this.networkOps.reduce((sum, op) => sum + op.bytes, 0);
    const avgNetworkDuration = this.mean(this.networkOps.map((op) => op.duration));

    return {
      inference: inferenceStats,
      frameProcessing: {
        totalFrames: this.frameCounts.total,
        droppedFrames: this.frameCounts.dropped,
        averageFPS: avgFPS,
        averageConfidence: 0, // TODO: Collect confidence from frames
      },
      network: {
        totalRequests: this.networkOps.length,
        successfulRequests: successfulOps,
        failedRequests: this.networkOps.length - successfulOps,
        totalBytesTransferred: totalBytes,
        averageDuration_ms: avgNetworkDuration,
      },
    };
  }

  /**
   * Aggregate error metrics
   */
  private aggregateErrors(): ErrorMetrics {
    // Count by type
    const errorsByType: Record<string, number> = {};
    const errorsByJoint: Record<string, number> = {};
    let warningCount = 0;
    let criticalCount = 0;

    for (const error of this.errors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsByJoint[error.joint] = (errorsByJoint[error.joint] || 0) + 1;

      if (error.severity === 'warning') warningCount++;
      if (error.severity === 'critical') criticalCount++;
    }

    // Top 5 errors
    const topErrors = Object.entries(errorsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      errorsByType,
      errorsBySeverity: {
        warning: warningCount,
        critical: criticalCount,
      },
      topErrors,
      errorsByJoint,
    };
  }

  /**
   * Aggregate device metrics
   */
  private aggregateDevice(): DeviceMetrics {
    const deviceModels: Record<string, number> = {};
    const osVersions: Record<string, number> = {};
    const thermalStates: Record<string, number> = {};
    const batteryLevels: number[] = [];

    for (const device of this.deviceData) {
      deviceModels[device.model] = (deviceModels[device.model] || 0) + 1;
      osVersions[device.osVersion] = (osVersions[device.osVersion] || 0) + 1;
      thermalStates[device.thermal] = (thermalStates[device.thermal] || 0) + 1;
      batteryLevels.push(device.battery);
    }

    return {
      deviceModels,
      osVersions,
      thermalStates,
      averageBatteryLevel: this.mean(batteryLevels),
      thermalThrottleCount: this.thermalThrottles,
      memoryWarningCount: this.memoryWarnings,
    };
  }

  /**
   * Aggregate session metrics
   */
  private aggregateSessions(): SessionMetrics {
    const sessionsByExercise: Record<string, number> = {};
    let asyncCount = 0;
    let liveCount = 0;
    const scores: number[] = [];
    const confidences: number[] = [];
    const speeds: number[] = [];
    const processingTimes: number[] = [];

    for (const session of this.sessions) {
      sessionsByExercise[session.exerciseType] =
        (sessionsByExercise[session.exerciseType] || 0) + 1;

      if (session.mode === 'async') asyncCount++;
      if (session.mode === 'live') liveCount++;

      scores.push(session.score);
      confidences.push(session.confidence);
      speeds.push(session.speed);
      processingTimes.push(session.processingTime);
    }

    return {
      totalSessions: this.sessions.length,
      sessionsByExercise,
      sessionsByMode: {
        async: asyncCount,
        live: liveCount,
      },
      averageMetrics: {
        overallScore: this.mean(scores),
        syncConfidence: this.mean(confidences),
        speedRatio: this.mean(speeds),
        processingTime_ms: this.mean(processingTimes),
      },
    };
  }

  /**
   * Calculate total raw event count
   */
  private getRawEventCount(): number {
    return (
      this.inferenceTimes.length +
      this.frameCounts.total +
      this.networkOps.length +
      this.errors.length +
      this.deviceData.length +
      this.sessions.length +
      this.thermalThrottles +
      this.memoryWarnings
    );
  }

  /**
   * Calculate compression ratio (raw events vs aggregated size)
   */
  private calculateCompressionRatio(rawEventCount: number): number {
    if (rawEventCount === 0) return 1;

    // Aggregated telemetry is a single object with summary stats
    // Compression ratio = raw events / 1 aggregated object
    return rawEventCount / 1;
  }

  // ========================================================================
  // Statistical Helpers
  // ========================================================================

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Calculate standard deviation
   */
  private stddev(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }
}

export default TelemetryAggregator;
