/**
 * Analysis Session Interface
 *
 * Provides unified interface for both batch (async) and streaming (live)
 * pose analysis modes. Abstracts the difference between processing all
 * poses at once vs. processing them incrementally.
 */

import {
  PoseFrame,
  ComparisonResult,
  AngleDeviation,
  TemporalAlignment,
} from '../types/videoComparison.types';

/**
 * Base interface for analysis sessions
 */
export interface AnalysisSession {
  sessionId: string;
  mode: 'batch' | 'streaming';
  exerciseType: string;

  /**
   * Add a user pose to the analysis
   */
  addUserPose(pose: PoseFrame): void;

  /**
   * Get intermediate result (for streaming mode)
   * Returns null if not enough data yet
   */
  getIntermediateResult(): ComparisonResult | null;

  /**
   * Finalize analysis and get complete result
   */
  finalize(): ComparisonResult;

  /**
   * Get current progress (0-1)
   */
  getProgress(): number;

  /**
   * Clear all data
   */
  clear(): void;
}

/**
 * Batch Analysis Session (Mode 1: Async Comparison)
 *
 * Processes all poses at once after both videos are recorded.
 * Provides highest accuracy using full DTW synchronization.
 */
export class BatchAnalysisSession implements AnalysisSession {
  sessionId: string;
  mode: 'batch' = 'batch';
  exerciseType: string;

  private referencePoses: PoseFrame[] = [];
  private userPoses: PoseFrame[] = [];
  private result: ComparisonResult | null = null;

  constructor(sessionId: string, exerciseType: string, referencePoses: PoseFrame[]) {
    this.sessionId = sessionId;
    this.exerciseType = exerciseType;
    this.referencePoses = referencePoses;
  }

  addUserPose(pose: PoseFrame): void {
    this.userPoses.push(pose);
  }

  getIntermediateResult(): ComparisonResult | null {
    // Batch mode doesn't provide intermediate results
    return null;
  }

  finalize(): ComparisonResult {
    if (this.result) {
      return this.result;
    }

    // Import ComparisonAnalysisService to do actual analysis
    // This is just the interface - actual implementation delegates to service
    // For now, return placeholder
    this.result = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      exerciseType: this.exerciseType,
      mode: 'async',
      overallScore: 0,
      angleDeviations: [],
      temporalAlignment: {
        offset: 0,
        confidence: 0,
        speedRatio: 1.0,
        phaseAlignment: 0,
      },
      recommendations: [],
    };

    return this.result;
  }

  getProgress(): number {
    // Progress based on user poses collected
    if (this.referencePoses.length === 0) return 0;
    return Math.min(1.0, this.userPoses.length / this.referencePoses.length);
  }

  clear(): void {
    this.userPoses = [];
    this.result = null;
  }

  /**
   * Set all user poses at once (typical for batch mode)
   */
  setUserPoses(poses: PoseFrame[]): void {
    this.userPoses = poses;
  }

  /**
   * Get total frames expected
   */
  getExpectedFrames(): number {
    return this.referencePoses.length;
  }

  /**
   * Get frames collected so far
   */
  getCollectedFrames(): number {
    return this.userPoses.length;
  }
}

/**
 * Streaming Analysis Session (Mode 2: Live Split-Screen)
 *
 * Processes poses incrementally in real-time using windowed analysis.
 * Provides immediate feedback but with slightly lower accuracy than batch.
 */
export class StreamingAnalysisSession implements AnalysisSession {
  sessionId: string;
  mode: 'streaming' = 'streaming';
  exerciseType: string;

  private referencePoses: PoseFrame[] = [];
  private userPoseWindow: PoseFrame[] = [];
  private allUserPoses: PoseFrame[] = [];

  // Windowed analysis settings
  private readonly WINDOW_SIZE = 12; // ~500ms at 24 FPS
  private readonly MIN_WINDOW_SIZE = 6; // Minimum for analysis

  private currentResult: ComparisonResult | null = null;

  constructor(sessionId: string, exerciseType: string, referencePoses: PoseFrame[]) {
    this.sessionId = sessionId;
    this.exerciseType = exerciseType;
    this.referencePoses = referencePoses;
  }

  addUserPose(pose: PoseFrame): void {
    // Add to window
    this.userPoseWindow.push(pose);
    this.allUserPoses.push(pose);

    // Maintain window size
    if (this.userPoseWindow.length > this.WINDOW_SIZE) {
      this.userPoseWindow.shift();
    }

    // Update analysis if we have enough data
    if (this.userPoseWindow.length >= this.MIN_WINDOW_SIZE) {
      this.updateIntermediateResult();
    }
  }

  getIntermediateResult(): ComparisonResult | null {
    return this.currentResult;
  }

  finalize(): ComparisonResult {
    // Use all collected poses for final analysis
    if (this.allUserPoses.length === 0) {
      return this.getEmptyResult();
    }

    // Import ComparisonAnalysisService for actual analysis
    // For now, return placeholder with accumulated data
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      exerciseType: this.exerciseType,
      mode: 'live',
      overallScore: this.currentResult?.overallScore || 0,
      angleDeviations: this.currentResult?.angleDeviations || [],
      temporalAlignment: this.currentResult?.temporalAlignment || {
        offset: 0,
        confidence: 0,
        speedRatio: 1.0,
        phaseAlignment: 0,
      },
      recommendations: this.currentResult?.recommendations || [],
    };
  }

  getProgress(): number {
    if (this.referencePoses.length === 0) return 0;
    return Math.min(1.0, this.allUserPoses.length / this.referencePoses.length);
  }

  clear(): void {
    this.userPoseWindow = [];
    this.allUserPoses = [];
    this.currentResult = null;
  }

  /**
   * Update intermediate result based on current window
   */
  private updateIntermediateResult(): void {
    // Analyze current window against reference poses
    // This provides real-time feedback

    // Find corresponding reference window
    const userFrameIndex = this.allUserPoses.length - 1;
    const refFrameIndex = Math.min(
      Math.floor(
        (userFrameIndex / this.allUserPoses.length) * this.referencePoses.length
      ),
      this.referencePoses.length - 1
    );

    const refWindowStart = Math.max(0, refFrameIndex - Math.floor(this.WINDOW_SIZE / 2));
    const refWindowEnd = Math.min(
      this.referencePoses.length,
      refWindowStart + this.WINDOW_SIZE
    );
    const refWindow = this.referencePoses.slice(refWindowStart, refWindowEnd);

    // Compare windows
    // Actual implementation would use ComparisonAnalysisService
    // For now, update with placeholder
    this.currentResult = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      exerciseType: this.exerciseType,
      mode: 'live',
      overallScore: 0,
      angleDeviations: [],
      temporalAlignment: {
        offset: 0,
        confidence: 0,
        speedRatio: 1.0,
        phaseAlignment: 0,
      },
      recommendations: [],
    };
  }

  /**
   * Get empty result structure
   */
  private getEmptyResult(): ComparisonResult {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      exerciseType: this.exerciseType,
      mode: 'live',
      overallScore: 0,
      angleDeviations: [],
      temporalAlignment: {
        offset: 0,
        confidence: 0,
        speedRatio: 1.0,
        phaseAlignment: 0,
      },
      recommendations: [],
    };
  }

  /**
   * Get current window size
   */
  getWindowSize(): number {
    return this.userPoseWindow.length;
  }

  /**
   * Get total poses collected
   */
  getTotalPoses(): number {
    return this.allUserPoses.length;
  }

  /**
   * Check if enough data for analysis
   */
  hasEnoughData(): boolean {
    return this.userPoseWindow.length >= this.MIN_WINDOW_SIZE;
  }
}

/**
 * Factory for creating analysis sessions
 */
export class AnalysisSessionFactory {
  /**
   * Create a batch analysis session
   */
  static createBatchSession(
    sessionId: string,
    exerciseType: string,
    referencePoses: PoseFrame[]
  ): BatchAnalysisSession {
    return new BatchAnalysisSession(sessionId, exerciseType, referencePoses);
  }

  /**
   * Create a streaming analysis session
   */
  static createStreamingSession(
    sessionId: string,
    exerciseType: string,
    referencePoses: PoseFrame[]
  ): StreamingAnalysisSession {
    return new StreamingAnalysisSession(sessionId, exerciseType, referencePoses);
  }

  /**
   * Create session based on mode
   */
  static createSession(
    sessionId: string,
    mode: 'batch' | 'streaming',
    exerciseType: string,
    referencePoses: PoseFrame[]
  ): AnalysisSession {
    if (mode === 'batch') {
      return this.createBatchSession(sessionId, exerciseType, referencePoses);
    } else {
      return this.createStreamingSession(sessionId, exerciseType, referencePoses);
    }
  }
}
