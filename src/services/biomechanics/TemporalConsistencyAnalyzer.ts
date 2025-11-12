/**
 * Temporal Consistency Analyzer
 * Gate 10D: Multi-frame temporal consistency validation
 *
 * Analyzes measurement stability and consistency across video sequences
 * Detects frame-to-frame anomalies, validates trajectories, tracks compensations
 */

import {
  TemporalMeasurementSequence,
  FrameToFrameConsistency,
  TrajectoryValidation,
  TemporalCompensationTracking,
  QualityDegradation,
  TemporalValidationResult,
  TemporalValidationConfig,
  DEFAULT_TEMPORAL_CONFIG,
} from '../../types/temporalValidation';
import { ClinicalJointMeasurement } from '../../types/clinicalMeasurement';
import { ProcessedPoseData } from '../../types/pose';

export class TemporalConsistencyAnalyzer {
  private config: TemporalValidationConfig;

  constructor(config: TemporalValidationConfig = DEFAULT_TEMPORAL_CONFIG) {
    this.config = config;
  }

  /**
   * Analyze temporal consistency of a measurement sequence
   */
  public analyzeSequence(
    sequence: TemporalMeasurementSequence,
    poseFrames: ProcessedPoseData[],
    expectedPattern?: 'increasing' | 'decreasing' | 'static' | 'oscillating'
  ): TemporalValidationResult {
    // Extract angles from measurements
    const angles = sequence.measurements.map((m) => m.primaryJoint.angle);

    // 1. Frame-to-frame consistency analysis
    const consistency = this.analyzeFrameToFrameConsistency(angles, sequence.frameRate);

    // 2. Trajectory validation
    const trajectory = this.analyzeTrajectory(angles, sequence.frameRate, expectedPattern);

    // 3. Compensation tracking
    const compensations = this.trackCompensations(sequence.measurements);

    // 4. Quality degradation
    const quality = this.analyzeQualityDegradation(poseFrames);

    // 5. Overall assessment
    const issues: string[] = [];
    if (!consistency.passed) {
      issues.push(`Frame-to-frame inconsistency: ${consistency.suddenJumps} sudden jumps detected`);
    }
    if (!trajectory.patternMatch && expectedPattern) {
      issues.push(`Trajectory mismatch: expected ${expectedPattern}, observed ${trajectory.observedPattern}`);
    }
    if (!quality.passed) {
      issues.push(`Quality degradation: ${quality.qualityDropouts} dropouts, ${quality.framesBelowThreshold} low-quality frames`);
    }

    const persistentCompensations = compensations.filter((c) => c.isPersistent);
    if (persistentCompensations.length > 0) {
      issues.push(
        `Persistent compensations: ${persistentCompensations.map((c) => c.compensationType).join(', ')}`
      );
    }

    const passed = consistency.passed && quality.passed && issues.length === 0;

    return {
      sequenceId: sequence.sequenceId,
      frameCount: sequence.measurements.length,
      duration: sequence.duration,
      frameRate: sequence.frameRate,
      consistency,
      trajectory,
      compensations,
      quality,
      passed,
      issues,
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze frame-to-frame consistency
   */
  private analyzeFrameToFrameConsistency(angles: number[], frameRate: number): FrameToFrameConsistency {
    if (angles.length < 2) {
      return {
        meanDelta: 0,
        maxDelta: 0,
        stdDevDelta: 0,
        suddenJumps: 0,
        smoothnessScore: 1.0,
        passed: true,
      };
    }

    // Calculate frame-to-frame deltas
    const deltas: number[] = [];
    for (let i = 1; i < angles.length; i++) {
      deltas.push(Math.abs(angles[i] - angles[i - 1]));
    }

    // Calculate statistics
    const meanDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const maxDelta = Math.max(...deltas);

    // Standard deviation
    const variance = deltas.reduce((sum, d) => sum + (d - meanDelta) ** 2, 0) / deltas.length;
    const stdDevDelta = Math.sqrt(variance);

    // Count sudden jumps (exceeding threshold)
    const suddenJumps = deltas.filter((d) => d > this.config.maxFrameToFrameDelta).length;

    // Smoothness score (0-1, higher = smoother)
    // Normalize stdDev to 0-1 range (assuming max stdDev of 10° for typical movements)
    const normalizedStdDev = Math.min(stdDevDelta / 10, 1);
    const smoothnessScore = 1 - normalizedStdDev;

    const passed = suddenJumps === 0 && smoothnessScore >= this.config.smoothnessThreshold;

    return {
      meanDelta,
      maxDelta,
      stdDevDelta,
      suddenJumps,
      smoothnessScore,
      passed,
    };
  }

  /**
   * Analyze movement trajectory
   */
  private analyzeTrajectory(
    angles: number[],
    frameRate: number,
    expectedPattern?: 'increasing' | 'decreasing' | 'static' | 'oscillating'
  ): TrajectoryValidation {
    if (angles.length < 3) {
      return {
        expectedPattern: expectedPattern || 'static',
        observedPattern: 'static',
        patternMatch: true,
        trendConsistency: 1.0,
        reversals: 0,
        totalRangeOfMotion: 0,
        averageVelocity: 0,
        peakVelocity: 0,
        notes: ['Insufficient frames for trajectory analysis'],
      };
    }

    // Calculate velocities (degrees per second)
    const velocities: number[] = [];
    for (let i = 1; i < angles.length; i++) {
      const angleDiff = angles[i] - angles[i - 1];
      const timeDiff = 1 / frameRate; // Time between frames in seconds
      velocities.push(angleDiff / timeDiff);
    }

    // Detect pattern
    const observedPattern = this.detectPattern(angles, velocities);

    // Count reversals (direction changes)
    let reversals = 0;
    for (let i = 1; i < velocities.length; i++) {
      if ((velocities[i] > 0 && velocities[i - 1] < 0) || (velocities[i] < 0 && velocities[i - 1] > 0)) {
        reversals++;
      }
    }

    // Calculate ROM
    const minAngle = Math.min(...angles);
    const maxAngle = Math.max(...angles);
    const totalRangeOfMotion = maxAngle - minAngle;

    // Calculate velocities
    const averageVelocity = Math.abs(velocities.reduce((sum, v) => sum + v, 0) / velocities.length);
    const peakVelocity = Math.max(...velocities.map(Math.abs));

    // Trend consistency (how well observed matches expected)
    let trendConsistency = 1.0;
    let patternMatch = true;
    const notes: string[] = [];

    if (expectedPattern) {
      if (expectedPattern === 'increasing' || expectedPattern === 'decreasing') {
        // Should have minimal reversals
        if (reversals > this.config.maxReversals) {
          trendConsistency = Math.max(0, 1 - reversals / angles.length);
          patternMatch = false;
          notes.push(`Too many reversals (${reversals}) for ${expectedPattern} movement`);
        }

        // Check overall trend
        const overallTrend = angles[angles.length - 1] - angles[0];
        if (expectedPattern === 'increasing' && overallTrend < 0) {
          trendConsistency *= 0.5;
          patternMatch = false;
          notes.push('Expected increasing trajectory but observed decreasing overall trend');
        } else if (expectedPattern === 'decreasing' && overallTrend > 0) {
          trendConsistency *= 0.5;
          patternMatch = false;
          notes.push('Expected decreasing trajectory but observed increasing overall trend');
        }
      } else if (expectedPattern === 'static') {
        // Should have minimal ROM
        if (totalRangeOfMotion > 10) {
          trendConsistency = Math.max(0, 1 - totalRangeOfMotion / 50);
          patternMatch = false;
          notes.push(`Excessive motion (${totalRangeOfMotion.toFixed(1)}°) for static hold`);
        }
      } else if (expectedPattern === 'oscillating') {
        // Should have multiple reversals
        if (reversals < 2) {
          trendConsistency = 0.5;
          patternMatch = false;
          notes.push('Insufficient reversals for oscillating movement');
        }
      }

      patternMatch = patternMatch && observedPattern === expectedPattern;
    }

    // Check for erratic movement
    if (observedPattern === 'erratic') {
      notes.push('Erratic movement detected - high variability in velocity');
    }

    return {
      expectedPattern: expectedPattern || 'static',
      observedPattern,
      patternMatch,
      trendConsistency,
      reversals,
      totalRangeOfMotion,
      averageVelocity,
      peakVelocity,
      notes,
    };
  }

  /**
   * Detect movement pattern from angles and velocities
   */
  private detectPattern(
    angles: number[],
    velocities: number[]
  ): 'increasing' | 'decreasing' | 'static' | 'oscillating' | 'erratic' {
    const minAngle = Math.min(...angles);
    const maxAngle = Math.max(...angles);
    const totalROM = maxAngle - minAngle;

    // Static: minimal ROM
    if (totalROM < 5) {
      return 'static';
    }

    // Count positive and negative velocities
    const positiveVel = velocities.filter((v) => v > 0).length;
    const negativeVel = velocities.filter((v) => v < 0).length;
    const totalVel = velocities.length;

    // Calculate velocity standard deviation
    const meanVel = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const velStdDev = Math.sqrt(velocities.reduce((sum, v) => sum + (v - meanVel) ** 2, 0) / velocities.length);

    // Erratic: very high velocity variance
    if (velStdDev > 100) {
      // >100°/s variance = erratic
      return 'erratic';
    }

    // Increasing: mostly positive velocities
    if (positiveVel > 0.7 * totalVel) {
      return 'increasing';
    }

    // Decreasing: mostly negative velocities
    if (negativeVel > 0.7 * totalVel) {
      return 'decreasing';
    }

    // Oscillating: balanced positive/negative velocities
    return 'oscillating';
  }

  /**
   * Track compensations across frames
   */
  private trackCompensations(measurements: ClinicalJointMeasurement[]): TemporalCompensationTracking[] {
    // Group compensations by type
    const compensationMap = new Map<string, number[]>();

    measurements.forEach((m, frameIndex) => {
      m.compensations.forEach((comp) => {
        if (!compensationMap.has(comp.type)) {
          compensationMap.set(comp.type, []);
        }
        compensationMap.get(comp.type)!.push(frameIndex);
      });
    });

    // Build temporal tracking for each compensation type
    const trackingResults: TemporalCompensationTracking[] = [];

    compensationMap.forEach((frames, compType) => {
      const firstDetectedFrame = frames[0];
      const lastDetectedFrame = frames[frames.length - 1];
      const totalFramesDetected = frames.length;
      const persistenceRate = (totalFramesDetected / measurements.length) * 100;

      // Build severity progression
      const severityProgression = frames.map((frameIndex) => {
        const measurement = measurements[frameIndex];
        const comp = measurement.compensations.find((c) => c.type === compType)!;
        return {
          frame: frameIndex,
          severity: comp.severity,
          magnitude: comp.magnitude,
        };
      });

      // Check if persistent (>50% of frames)
      const isPersistent = persistenceRate > this.config.persistenceThreshold;

      // Check if progressive (severity increasing)
      const isProgressive = this.isSeverityProgressive(severityProgression);

      trackingResults.push({
        compensationType: compType,
        firstDetectedFrame,
        lastDetectedFrame,
        totalFramesDetected,
        persistenceRate,
        severityProgression,
        isPersistent,
        isProgressive,
      });
    });

    return trackingResults;
  }

  /**
   * Check if compensation severity is increasing over time
   */
  private isSeverityProgressive(
    progression: Array<{ frame: number; severity: string; magnitude: number }>
  ): boolean {
    if (progression.length < 3) {
      return false;
    }

    // Map severity to numeric levels
    const severityLevels: Record<string, number> = {
      minimal: 1,
      mild: 2,
      moderate: 3,
      severe: 4,
    };

    const levels = progression.map((p) => severityLevels[p.severity]);

    // Check if levels are generally increasing
    let increases = 0;
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1]) {
        increases++;
      }
    }

    // Progressive if >60% of transitions are increases
    return increases / (levels.length - 1) > 0.6;
  }

  /**
   * Analyze quality degradation over sequence
   */
  private analyzeQualityDegradation(poseFrames: ProcessedPoseData[]): QualityDegradation {
    if (poseFrames.length === 0) {
      return {
        initialQuality: 1.0,
        finalQuality: 1.0,
        meanQuality: 1.0,
        minQuality: 1.0,
        degradationRate: 0,
        framesBelowThreshold: 0,
        qualityDropouts: 0,
        passed: true,
      };
    }

    const qualities = poseFrames.map((f) => f.qualityScore || 1.0);

    const initialQuality = qualities[0];
    const finalQuality = qualities[qualities.length - 1];
    const meanQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
    const minQuality = Math.min(...qualities);

    // Calculate degradation rate (change per second)
    const duration = poseFrames.length / 30; // Assuming 30 FPS
    const totalDegradation = finalQuality - initialQuality;
    const degradationRate = totalDegradation / duration;

    // Count frames below threshold
    const framesBelowThreshold = qualities.filter((q) => q < this.config.minQualityScore).length;

    // Count quality dropouts (sudden drops >0.2)
    let qualityDropouts = 0;
    for (let i = 1; i < qualities.length; i++) {
      if (qualities[i - 1] - qualities[i] > 0.2) {
        qualityDropouts++;
      }
    }

    const passed =
      framesBelowThreshold === 0 && qualityDropouts <= this.config.maxQualityDropouts && meanQuality >= this.config.minQualityScore;

    return {
      initialQuality,
      finalQuality,
      meanQuality,
      minQuality,
      degradationRate,
      framesBelowThreshold,
      qualityDropouts,
      passed,
    };
  }

  /**
   * Calculate smoothness score for a sequence
   * Higher score = smoother movement (less jitter)
   */
  public calculateSmoothnessScore(angles: number[]): number {
    if (angles.length < 3) {
      return 1.0;
    }

    // Calculate second derivative (acceleration)
    const accelerations: number[] = [];
    for (let i = 2; i < angles.length; i++) {
      const accel = (angles[i] - angles[i - 1]) - (angles[i - 1] - angles[i - 2]);
      accelerations.push(Math.abs(accel));
    }

    // Mean absolute acceleration
    const meanAccel = accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length;

    // Normalize to 0-1 score (assuming max acceptable acceleration of 5°/frame²)
    const smoothnessScore = Math.max(0, 1 - meanAccel / 5);

    return smoothnessScore;
  }

  /**
   * Detect anomalous frames in sequence
   * Returns indices of frames with sudden jumps or quality issues
   */
  public detectAnomalousFrames(
    angles: number[],
    qualities: number[]
  ): Array<{ frame: number; reason: string; severity: 'low' | 'medium' | 'high' }> {
    const anomalies: Array<{ frame: number; reason: string; severity: 'low' | 'medium' | 'high' }> = [];

    // Check frame-to-frame jumps
    for (let i = 1; i < angles.length; i++) {
      const delta = Math.abs(angles[i] - angles[i - 1]);
      if (delta > this.config.maxFrameToFrameDelta) {
        const severity = delta > 30 ? 'high' : delta > 20 ? 'medium' : 'low';
        anomalies.push({
          frame: i,
          reason: `Sudden angle jump: ${delta.toFixed(1)}°`,
          severity,
        });
      }
    }

    // Check quality drops
    for (let i = 0; i < qualities.length; i++) {
      if (qualities[i] < this.config.minQualityScore) {
        const severity = qualities[i] < 0.5 ? 'high' : qualities[i] < 0.6 ? 'medium' : 'low';
        anomalies.push({
          frame: i,
          reason: `Low quality: ${(qualities[i] * 100).toFixed(0)}%`,
          severity,
        });
      }
    }

    return anomalies;
  }
}
