/**
 * Temporal Validation Tests
 * Gate 10D: Multi-frame temporal consistency validation tests
 *
 * Comprehensive testing of temporal validation framework
 */

import { TemporalValidationPipeline } from '../TemporalValidationPipeline';
import { MultiFrameSequenceGenerator } from '../MultiFrameSequenceGenerator';
import { TemporalConsistencyAnalyzer } from '../../services/biomechanics/TemporalConsistencyAnalyzer';
import { DEFAULT_TEMPORAL_CONFIG } from '../../types/temporalValidation';

describe('TemporalValidationPipeline - Gate 10D', () => {
  let pipeline: TemporalValidationPipeline;
  let generator: MultiFrameSequenceGenerator;
  let analyzer: TemporalConsistencyAnalyzer;

  beforeEach(() => {
    pipeline = new TemporalValidationPipeline(DEFAULT_TEMPORAL_CONFIG);
    generator = new MultiFrameSequenceGenerator();
    analyzer = new TemporalConsistencyAnalyzer(DEFAULT_TEMPORAL_CONFIG);
  });

  describe('Full Temporal Validation Suite', () => {
    it('should run full validation suite and generate comprehensive report', async () => {
      console.log('\n========================================');
      console.log('Running Gate 10D Full Temporal Validation');
      console.log('========================================\n');

      const startTime = Date.now();
      const report = await pipeline.runFullValidation();
      const endTime = Date.now();

      console.log(`\nValidation completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      // Print the report
      pipeline.printReport(report);

      // Assertions
      expect(report).toBeDefined();
      expect(report.totalSequences).toBeGreaterThan(40); // Should have ~52 sequences
      expect(report.status).toBe('PASS');
      expect(report.passRate).toBeGreaterThan(90); // >90% pass rate
      expect(report.aggregateMetrics.meanSmoothness).toBeGreaterThanOrEqual(0.75); // ≥75% smoothness
      expect(report.aggregateMetrics.meanQuality).toBeGreaterThanOrEqual(0.70); // ≥70% quality
    }, 60000); // 60 second timeout

    it('should achieve high pass rate (>90%)', async () => {
      const report = await pipeline.runFullValidation();

      expect(report.passRate).toBeGreaterThan(90);
      expect(report.failedSequences).toBeLessThan(5);
    }, 60000);

    it('should detect and reject sudden jumps', async () => {
      const report = await pipeline.runFullValidation();

      // Some sequences intentionally have jumps
      const jumpSequences = report.detailedResults.filter((r) => r.sequenceId.includes('with_jumps'));
      expect(jumpSequences.length).toBeGreaterThan(0);

      // These should be flagged
      const failedJumpSequences = jumpSequences.filter((r) => !r.passed);
      expect(failedJumpSequences.length).toBeGreaterThan(0);
    }, 60000);

    it('should track developing compensations over time', async () => {
      const report = await pipeline.runFullValidation();

      // Sequences with developing compensations
      const compensationSequences = report.detailedResults.filter((r) => r.sequenceId.includes('developing_compensation'));
      expect(compensationSequences.length).toBeGreaterThan(0);

      // Should detect persistent compensations
      const withPersistentComp = compensationSequences.filter((r) => r.compensations.some((c) => c.isPersistent));
      expect(withPersistentComp.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Smooth Movement Validation', () => {
    it('should validate smooth increasing shoulder flexion', async () => {
      const poseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      expect(result.passed).toBe(true);
      expect(result.consistency.suddenJumps).toBe(0);
      expect(result.consistency.smoothnessScore).toBeGreaterThan(0.8);
      expect(result.trajectory.observedPattern).toBe('increasing');
      expect(result.trajectory.patternMatch).toBe(true);
    });

    it('should validate smooth decreasing elbow flexion', async () => {
      const poseSequence = generator.generateSmoothDecreasing('elbow_flexion', 140, 0, 4, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'elbow_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'decreasing');

      expect(result.passed).toBe(true);
      expect(result.consistency.suddenJumps).toBe(0);
      expect(result.trajectory.observedPattern).toBe('decreasing');
      expect(result.trajectory.patternMatch).toBe(true);
    });

    it('should handle realistic noise in measurements', async () => {
      const poseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right', addNoise: true });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      // Should still pass with small noise
      expect(result.passed).toBe(true);
      expect(result.consistency.smoothnessScore).toBeGreaterThan(0.75);
    });
  });

  describe('Static Hold Validation', () => {
    it('should validate static shoulder hold', async () => {
      const poseSequence = generator.generateStaticHold('shoulder_flexion', 90, 3, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'static');

      expect(result.passed).toBe(true);
      expect(result.trajectory.observedPattern).toBe('static');
      expect(result.trajectory.totalRangeOfMotion).toBeLessThan(5); // Minimal movement
    });

    it('should handle natural tremor in static holds', async () => {
      const poseSequence = generator.generateStaticHold('shoulder_flexion', 90, 3, 30, { side: 'right', addTremor: true });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'static');

      // Should still recognize as static despite tremor
      expect(result.trajectory.observedPattern).toBe('static');
      expect(result.trajectory.totalRangeOfMotion).toBeLessThan(10); // Small oscillations OK
    });
  });

  describe('Oscillating Movement Validation', () => {
    it('should validate oscillating elbow repetitions', async () => {
      const poseSequence = generator.generateOscillating('elbow_flexion', 0, 120, 3, 6, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'elbow_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'oscillating');

      expect(result.passed).toBe(true);
      expect(result.trajectory.observedPattern).toBe('oscillating');
      expect(result.trajectory.reversals).toBeGreaterThan(2); // Multiple direction changes
    });

    it('should detect correct number of reversals', async () => {
      const poseSequence = generator.generateOscillating('shoulder_flexion', 0, 120, 4, 8, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'oscillating');

      // 4 reps = ~8 reversals (up-down for each rep)
      expect(result.trajectory.reversals).toBeGreaterThan(4);
      expect(result.trajectory.reversals).toBeLessThan(12);
    });
  });

  describe('Frame-to-Frame Consistency Analysis', () => {
    it('should detect sudden jumps in measurements', async () => {
      const baseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });
      const jumpSequence = generator.generateWithSuddenJumps('shoulder_flexion', baseSequence, 30, [75]);
      const measurementSequence = generator.convertToMeasurementSequence(jumpSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, jumpSequence.frames, 'increasing');

      expect(result.passed).toBe(false);
      expect(result.consistency.suddenJumps).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.includes('sudden jump'))).toBe(true);
    });

    it('should calculate smoothness score correctly', async () => {
      // Smooth sequence
      const smoothSequence = generator.generateSmoothIncreasing('elbow_flexion', 0, 140, 4, 30, { side: 'right' });
      const smoothMeasurements = generator.convertToMeasurementSequence(smoothSequence, 'elbow_flexion');
      const smoothAngles = smoothMeasurements.measurements.map((m) => m.primaryJoint.angle);
      const smoothScore = analyzer.calculateSmoothnessScore(smoothAngles);

      expect(smoothScore).toBeGreaterThan(0.85);

      // Noisy sequence
      const noisySequence = generator.generateSmoothIncreasing('elbow_flexion', 0, 140, 4, 30, { side: 'right', addNoise: true });
      const noisyMeasurements = generator.convertToMeasurementSequence(noisySequence, 'elbow_flexion');
      const noisyAngles = noisyMeasurements.measurements.map((m) => m.primaryJoint.angle);
      const noisyScore = analyzer.calculateSmoothnessScore(noisyAngles);

      // Noisy should be slightly lower but still acceptable
      expect(noisyScore).toBeLessThan(smoothScore);
      expect(noisyScore).toBeGreaterThan(0.7);
    });

    it('should detect anomalous frames', async () => {
      const baseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });
      const jumpSequence = generator.generateWithSuddenJumps('shoulder_flexion', baseSequence, 25, [50, 100]);
      const measurementSequence = generator.convertToMeasurementSequence(jumpSequence, 'shoulder_flexion');

      const angles = measurementSequence.measurements.map((m) => m.primaryJoint.angle);
      const qualities = jumpSequence.frames.map((f) => f.qualityScore || 0.95);
      const anomalies = analyzer.detectAnomalousFrames(angles, qualities);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies.some((a) => a.reason.includes('jump'))).toBe(true);
    });
  });

  describe('Trajectory Pattern Detection', () => {
    it('should detect increasing pattern', async () => {
      const poseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      expect(result.trajectory.observedPattern).toBe('increasing');
      expect(result.trajectory.patternMatch).toBe(true);
      expect(result.trajectory.trendConsistency).toBeGreaterThan(0.9);
    });

    it('should detect decreasing pattern', async () => {
      const poseSequence = generator.generateSmoothDecreasing('elbow_flexion', 140, 0, 4, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'elbow_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'decreasing');

      expect(result.trajectory.observedPattern).toBe('decreasing');
      expect(result.trajectory.patternMatch).toBe(true);
      expect(result.trajectory.trendConsistency).toBeGreaterThan(0.9);
    });

    it('should calculate velocity metrics correctly', async () => {
      const poseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      // 150° over 5 seconds = 30°/s average
      expect(result.trajectory.averageVelocity).toBeGreaterThan(20);
      expect(result.trajectory.averageVelocity).toBeLessThan(40);
      expect(result.trajectory.peakVelocity).toBeGreaterThan(result.trajectory.averageVelocity);
    });
  });

  describe('Compensation Tracking', () => {
    it('should detect persistent compensations', async () => {
      const poseSequence = generator.generateWithDevelopingCompensation('shoulder_flexion', 0, 150, 5, 'trunk_lean', 30, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      expect(result.compensations.length).toBeGreaterThan(0);

      const trunkLean = result.compensations.find((c) => c.compensationType === 'trunk_lean');
      expect(trunkLean).toBeDefined();
      expect(trunkLean!.isPersistent).toBe(true); // Present in >50% of frames
    });

    it('should detect progressive compensations', async () => {
      const poseSequence = generator.generateWithDevelopingCompensation('shoulder_abduction', 0, 150, 5, 'shoulder_hiking', 30, 30, {
        side: 'right',
      });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_abduction');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      const shoulderHiking = result.compensations.find((c) => c.compensationType === 'shoulder_hiking');
      expect(shoulderHiking).toBeDefined();
      expect(shoulderHiking!.isProgressive).toBe(true); // Severity increases over time
    });

    it('should calculate compensation persistence rate', async () => {
      const poseSequence = generator.generateWithDevelopingCompensation('elbow_flexion', 0, 140, 4, 'trunk_lean', 60, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'elbow_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      const compensation = result.compensations[0];
      expect(compensation.persistenceRate).toBeGreaterThan(0);
      expect(compensation.persistenceRate).toBeLessThanOrEqual(100);
      expect(compensation.totalFramesDetected).toBeLessThan(result.frameCount);
    });
  });

  describe('Quality Degradation Detection', () => {
    it('should detect linear quality degradation', async () => {
      const baseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });
      const degradedSequence = generator.generateWithQualityDegradation(baseSequence, 'linear');
      const measurementSequence = generator.convertToMeasurementSequence(degradedSequence, 'shoulder_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, degradedSequence.frames, 'increasing');

      expect(result.quality.degradationRate).toBeLessThan(0); // Negative = quality decreasing
      expect(result.quality.finalQuality).toBeLessThan(result.quality.initialQuality);
    });

    it('should detect sudden quality drops', async () => {
      const baseSequence = generator.generateSmoothIncreasing('elbow_flexion', 0, 140, 4, 30, { side: 'right' });
      const degradedSequence = generator.generateWithQualityDegradation(baseSequence, 'sudden');
      const measurementSequence = generator.convertToMeasurementSequence(degradedSequence, 'elbow_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, degradedSequence.frames, 'increasing');

      expect(result.quality.qualityDropouts).toBeGreaterThan(0);
      expect(result.quality.minQuality).toBeLessThan(result.quality.initialQuality);
    });

    it('should count frames below quality threshold', async () => {
      const baseSequence = generator.generateSmoothIncreasing('knee_flexion', 0, 130, 4, 30, { side: 'right' });
      const degradedSequence = generator.generateWithQualityDegradation(baseSequence, 'intermittent');
      const measurementSequence = generator.convertToMeasurementSequence(degradedSequence, 'knee_flexion');
      const result = analyzer.analyzeSequence(measurementSequence, degradedSequence.frames, 'increasing');

      expect(result.quality.framesBelowThreshold).toBeGreaterThan(0);
      expect(result.quality.meanQuality).toBeLessThan(result.quality.initialQuality);
    });
  });

  describe('Performance', () => {
    it('should complete full validation in reasonable time (<60s)', async () => {
      const startTime = Date.now();
      await pipeline.runFullValidation();
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Full temporal validation completed in ${(duration / 1000).toFixed(2)}s`);
      expect(duration).toBeLessThan(60000); // Should complete in <60 seconds
    }, 65000);

    it('should analyze single sequence efficiently (<100ms)', async () => {
      const poseSequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });
      const measurementSequence = generator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');

      const startTime = Date.now();
      analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Single sequence analysis: ${duration}ms`);
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });
  });
});

describe('MultiFrameSequenceGenerator', () => {
  let generator: MultiFrameSequenceGenerator;

  beforeEach(() => {
    generator = new MultiFrameSequenceGenerator();
  });

  describe('Sequence Generation', () => {
    it('should generate correct number of frames for duration and framerate', () => {
      const sequence = generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, 30, { side: 'right' });

      expect(sequence.frames.length).toBe(150); // 5 seconds × 30 FPS
      expect(sequence.duration).toBe(5);
      expect(sequence.frameRate).toBe(30);
    });

    it('should generate smooth angle progression', () => {
      const sequence = generator.generateSmoothIncreasing('elbow_flexion', 0, 120, 4, 30, { side: 'right' });
      const measurements = generator.convertToMeasurementSequence(sequence, 'elbow_flexion');
      const angles = measurements.measurements.map((m) => m.primaryJoint.angle);

      // Check smooth progression
      for (let i = 1; i < angles.length; i++) {
        const delta = Math.abs(angles[i] - angles[i - 1]);
        expect(delta).toBeLessThan(2); // Should not jump more than 2° per frame
      }

      // Check overall trend
      expect(angles[angles.length - 1]).toBeGreaterThan(angles[0]); // Should increase
    });

    it('should generate realistic oscillations', () => {
      const sequence = generator.generateOscillating('shoulder_flexion', 0, 120, 3, 6, 30, { side: 'right' });
      const measurements = generator.convertToMeasurementSequence(sequence, 'shoulder_flexion');
      const angles = measurements.measurements.map((m) => m.primaryJoint.angle);

      const minAngle = Math.min(...angles);
      const maxAngle = Math.max(...angles);

      expect(minAngle).toBeLessThan(20); // Should reach near minimum
      expect(maxAngle).toBeGreaterThan(100); // Should reach near maximum
    });
  });
});
