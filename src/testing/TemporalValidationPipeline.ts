/**
 * Temporal Validation Pipeline
 * Gate 10D: Multi-frame temporal consistency validation
 *
 * Runs comprehensive temporal validation across multiple test sequences
 * Validates measurement stability, trajectory consistency, and quality over time
 */

import {
  TemporalValidationResult,
  TemporalValidationReport,
  TemporalValidationConfig,
  DEFAULT_TEMPORAL_CONFIG,
} from '../types/temporalValidation';
import { MultiFrameSequenceGenerator } from './MultiFrameSequenceGenerator';
import { TemporalConsistencyAnalyzer } from '../services/biomechanics/TemporalConsistencyAnalyzer';

export class TemporalValidationPipeline {
  private generator: MultiFrameSequenceGenerator;
  private analyzer: TemporalConsistencyAnalyzer;
  private config: TemporalValidationConfig;

  constructor(config: TemporalValidationConfig = DEFAULT_TEMPORAL_CONFIG) {
    this.generator = new MultiFrameSequenceGenerator();
    this.analyzer = new TemporalConsistencyAnalyzer(config);
    this.config = config;
  }

  /**
   * Run full temporal validation suite
   * Tests: smooth movements, static holds, oscillations, quality degradation, developing compensations
   */
  public async runFullValidation(): Promise<TemporalValidationReport> {
    const results: TemporalValidationResult[] = [];

    console.log('\n========================================');
    console.log('Gate 10D: Temporal Validation Pipeline');
    console.log('========================================\n');

    // 1. Smooth increasing movements (10 sequences)
    console.log('[1/7] Testing smooth increasing movements...');
    const smoothIncreasingResults = await this.validateSmoothIncreasing();
    results.push(...smoothIncreasingResults);

    // 2. Smooth decreasing movements (10 sequences)
    console.log('[2/7] Testing smooth decreasing movements...');
    const smoothDecreasingResults = await this.validateSmoothDecreasing();
    results.push(...smoothDecreasingResults);

    // 3. Static holds (8 sequences)
    console.log('[3/7] Testing static holds...');
    const staticHoldResults = await this.validateStaticHolds();
    results.push(...staticHoldResults);

    // 4. Oscillating movements (6 sequences)
    console.log('[4/7] Testing oscillating movements...');
    const oscillatingResults = await this.validateOscillating();
    results.push(...oscillatingResults);

    // 5. Quality degradation scenarios (6 sequences)
    console.log('[5/7] Testing quality degradation scenarios...');
    const qualityDegradationResults = await this.validateQualityDegradation();
    results.push(...qualityDegradationResults);

    // 6. Developing compensations (8 sequences)
    console.log('[6/7] Testing developing compensations...');
    const developingCompensationResults = await this.validateDevelopingCompensations();
    results.push(...developingCompensationResults);

    // 7. Sudden jump detection (4 sequences)
    console.log('[7/7] Testing sudden jump detection...');
    const suddenJumpResults = await this.validateSuddenJumpDetection();
    results.push(...suddenJumpResults);

    // Generate comprehensive report
    console.log('\nGenerating temporal validation report...');
    const report = this.generateReport(results);

    return report;
  }

  /**
   * Validate smooth increasing movements
   */
  private async validateSmoothIncreasing(): Promise<TemporalValidationResult[]> {
    const results: TemporalValidationResult[] = [];

    const testCases = [
      { movement: 'shoulder_flexion' as const, start: 0, end: 150, duration: 5, side: 'left' as const },
      { movement: 'shoulder_flexion' as const, start: 0, end: 150, duration: 5, side: 'right' as const },
      { movement: 'shoulder_abduction' as const, start: 0, end: 150, duration: 5, side: 'left' as const },
      { movement: 'shoulder_abduction' as const, start: 0, end: 150, duration: 5, side: 'right' as const },
      { movement: 'elbow_flexion' as const, start: 0, end: 140, duration: 4, side: 'left' as const },
      { movement: 'elbow_flexion' as const, start: 0, end: 140, duration: 4, side: 'right' as const },
      { movement: 'knee_flexion' as const, start: 0, end: 130, duration: 4, side: 'left' as const },
      { movement: 'knee_flexion' as const, start: 0, end: 130, duration: 4, side: 'right' as const },
      // With realistic noise
      { movement: 'shoulder_flexion' as const, start: 0, end: 150, duration: 5, side: 'right' as const, noise: true },
      { movement: 'elbow_flexion' as const, start: 0, end: 140, duration: 4, side: 'right' as const, noise: true },
    ];

    for (const testCase of testCases) {
      const poseSequence = this.generator.generateSmoothIncreasing(
        testCase.movement,
        testCase.start,
        testCase.end,
        testCase.duration,
        this.config.frameRate,
        { side: testCase.side, addNoise: testCase.noise }
      );

      const measurementSequence = this.generator.convertToMeasurementSequence(poseSequence, testCase.movement);

      const result = this.analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      results.push(result);
    }

    return results;
  }

  /**
   * Validate smooth decreasing movements
   */
  private async validateSmoothDecreasing(): Promise<TemporalValidationResult[]> {
    const results: TemporalValidationResult[] = [];

    const testCases = [
      { movement: 'shoulder_flexion' as const, start: 150, end: 0, duration: 5, side: 'left' as const },
      { movement: 'shoulder_flexion' as const, start: 150, end: 0, duration: 5, side: 'right' as const },
      { movement: 'shoulder_abduction' as const, start: 150, end: 0, duration: 5, side: 'left' as const },
      { movement: 'shoulder_abduction' as const, start: 150, end: 0, duration: 5, side: 'right' as const },
      { movement: 'elbow_flexion' as const, start: 140, end: 0, duration: 4, side: 'left' as const },
      { movement: 'elbow_flexion' as const, start: 140, end: 0, duration: 4, side: 'right' as const },
      { movement: 'knee_flexion' as const, start: 130, end: 0, duration: 4, side: 'left' as const },
      { movement: 'knee_flexion' as const, start: 130, end: 0, duration: 4, side: 'right' as const },
      // With realistic noise
      { movement: 'shoulder_flexion' as const, start: 150, end: 0, duration: 5, side: 'right' as const, noise: true },
      { movement: 'elbow_flexion' as const, start: 140, end: 0, duration: 4, side: 'right' as const, noise: true },
    ];

    for (const testCase of testCases) {
      const poseSequence = this.generator.generateSmoothDecreasing(
        testCase.movement,
        testCase.start,
        testCase.end,
        testCase.duration,
        this.config.frameRate,
        { side: testCase.side, addNoise: testCase.noise }
      );

      const measurementSequence = this.generator.convertToMeasurementSequence(poseSequence, testCase.movement);

      const result = this.analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'decreasing');

      results.push(result);
    }

    return results;
  }

  /**
   * Validate static holds
   */
  private async validateStaticHolds(): Promise<TemporalValidationResult[]> {
    const results: TemporalValidationResult[] = [];

    const testCases = [
      { movement: 'shoulder_flexion' as const, angle: 90, duration: 3, side: 'left' as const },
      { movement: 'shoulder_flexion' as const, angle: 90, duration: 3, side: 'right' as const },
      { movement: 'shoulder_abduction' as const, angle: 90, duration: 3, side: 'left' as const },
      { movement: 'shoulder_abduction' as const, angle: 90, duration: 3, side: 'right' as const },
      { movement: 'elbow_flexion' as const, angle: 90, duration: 3, side: 'right' as const },
      { movement: 'knee_flexion' as const, angle: 90, duration: 3, side: 'right' as const },
      // With natural tremor
      { movement: 'shoulder_flexion' as const, angle: 90, duration: 3, side: 'right' as const, tremor: true },
      { movement: 'shoulder_abduction' as const, angle: 90, duration: 3, side: 'right' as const, tremor: true },
    ];

    for (const testCase of testCases) {
      const poseSequence = this.generator.generateStaticHold(
        testCase.movement,
        testCase.angle,
        testCase.duration,
        this.config.frameRate,
        { side: testCase.side, addTremor: testCase.tremor }
      );

      const measurementSequence = this.generator.convertToMeasurementSequence(poseSequence, testCase.movement);

      const result = this.analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'static');

      results.push(result);
    }

    return results;
  }

  /**
   * Validate oscillating movements
   */
  private async validateOscillating(): Promise<TemporalValidationResult[]> {
    const results: TemporalValidationResult[] = [];

    const testCases = [
      { movement: 'shoulder_flexion' as const, min: 0, max: 120, reps: 3, duration: 6, side: 'right' as const },
      { movement: 'shoulder_abduction' as const, min: 0, max: 120, reps: 3, duration: 6, side: 'right' as const },
      { movement: 'elbow_flexion' as const, min: 0, max: 120, reps: 5, duration: 5, side: 'right' as const },
      { movement: 'knee_flexion' as const, min: 0, max: 100, reps: 4, duration: 6, side: 'right' as const },
      // Different repetition counts
      { movement: 'elbow_flexion' as const, min: 0, max: 120, reps: 2, duration: 4, side: 'right' as const },
      { movement: 'shoulder_flexion' as const, min: 0, max: 120, reps: 4, duration: 8, side: 'right' as const },
    ];

    for (const testCase of testCases) {
      const poseSequence = this.generator.generateOscillating(
        testCase.movement,
        testCase.min,
        testCase.max,
        testCase.reps,
        testCase.duration,
        this.config.frameRate,
        { side: testCase.side }
      );

      const measurementSequence = this.generator.convertToMeasurementSequence(poseSequence, testCase.movement);

      const result = this.analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'oscillating');

      results.push(result);
    }

    return results;
  }

  /**
   * Validate quality degradation detection
   */
  private async validateQualityDegradation(): Promise<TemporalValidationResult[]> {
    const results: TemporalValidationResult[] = [];

    // Generate base sequences
    const baseSequence1 = this.generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, this.config.frameRate, { side: 'right' });
    const baseSequence2 = this.generator.generateSmoothIncreasing('elbow_flexion', 0, 140, 4, this.config.frameRate, { side: 'right' });

    const degradationPatterns: Array<'linear' | 'sudden' | 'intermittent'> = ['linear', 'sudden', 'intermittent'];

    for (const pattern of degradationPatterns) {
      // Test with shoulder flexion
      const degradedSequence1 = this.generator.generateWithQualityDegradation(baseSequence1, pattern);
      const measurementSequence1 = this.generator.convertToMeasurementSequence(degradedSequence1, 'shoulder_flexion');
      const result1 = this.analyzer.analyzeSequence(measurementSequence1, degradedSequence1.frames, 'increasing');
      results.push(result1);

      // Test with elbow flexion
      const degradedSequence2 = this.generator.generateWithQualityDegradation(baseSequence2, pattern);
      const measurementSequence2 = this.generator.convertToMeasurementSequence(degradedSequence2, 'elbow_flexion');
      const result2 = this.analyzer.analyzeSequence(measurementSequence2, degradedSequence2.frames, 'increasing');
      results.push(result2);
    }

    return results;
  }

  /**
   * Validate developing compensation detection
   */
  private async validateDevelopingCompensations(): Promise<TemporalValidationResult[]> {
    const results: TemporalValidationResult[] = [];

    const testCases = [
      { movement: 'shoulder_flexion' as const, compensation: 'trunk_lean' as const, startFrame: 60, side: 'right' as const },
      { movement: 'shoulder_flexion' as const, compensation: 'shoulder_hiking' as const, startFrame: 60, side: 'right' as const },
      { movement: 'shoulder_abduction' as const, compensation: 'trunk_lean' as const, startFrame: 60, side: 'right' as const },
      { movement: 'shoulder_abduction' as const, compensation: 'shoulder_hiking' as const, startFrame: 60, side: 'right' as const },
      { movement: 'elbow_flexion' as const, compensation: 'trunk_lean' as const, startFrame: 45, side: 'right' as const },
      { movement: 'knee_flexion' as const, compensation: 'hip_hike' as const, startFrame: 45, side: 'right' as const },
      // Early onset compensations
      { movement: 'shoulder_flexion' as const, compensation: 'trunk_lean' as const, startFrame: 30, side: 'right' as const },
      { movement: 'shoulder_abduction' as const, compensation: 'shoulder_hiking' as const, startFrame: 30, side: 'right' as const },
    ];

    for (const testCase of testCases) {
      const poseSequence = this.generator.generateWithDevelopingCompensation(
        testCase.movement,
        0,
        150,
        5,
        testCase.compensation,
        testCase.startFrame,
        this.config.frameRate,
        { side: testCase.side }
      );

      const measurementSequence = this.generator.convertToMeasurementSequence(poseSequence, testCase.movement);

      const result = this.analyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');

      results.push(result);
    }

    return results;
  }

  /**
   * Validate sudden jump detection
   */
  private async validateSuddenJumpDetection(): Promise<TemporalValidationResult[]> {
    const results: TemporalValidationResult[] = [];

    const baseSequence1 = this.generator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 5, this.config.frameRate, { side: 'right' });
    const baseSequence2 = this.generator.generateSmoothIncreasing('elbow_flexion', 0, 140, 4, this.config.frameRate, { side: 'right' });

    // Test case 1: Single large jump
    const jumpSequence1 = this.generator.generateWithSuddenJumps('shoulder_flexion', baseSequence1, 30, [75]);
    const measurementSequence1 = this.generator.convertToMeasurementSequence(jumpSequence1, 'shoulder_flexion');
    const result1 = this.analyzer.analyzeSequence(measurementSequence1, jumpSequence1.frames, 'increasing');
    results.push(result1);

    // Test case 2: Multiple moderate jumps
    const jumpSequence2 = this.generator.generateWithSuddenJumps('shoulder_flexion', baseSequence1, 20, [50, 100]);
    const measurementSequence2 = this.generator.convertToMeasurementSequence(jumpSequence2, 'shoulder_flexion');
    const result2 = this.analyzer.analyzeSequence(measurementSequence2, jumpSequence2.frames, 'increasing');
    results.push(result2);

    // Test case 3: Elbow with single jump
    const jumpSequence3 = this.generator.generateWithSuddenJumps('elbow_flexion', baseSequence2, 25, [60]);
    const measurementSequence3 = this.generator.convertToMeasurementSequence(jumpSequence3, 'elbow_flexion');
    const result3 = this.analyzer.analyzeSequence(measurementSequence3, jumpSequence3.frames, 'increasing');
    results.push(result3);

    // Test case 4: Multiple small jumps (should pass with threshold)
    const jumpSequence4 = this.generator.generateWithSuddenJumps('elbow_flexion', baseSequence2, 10, [30, 60, 90]);
    const measurementSequence4 = this.generator.convertToMeasurementSequence(jumpSequence4, 'elbow_flexion');
    const result4 = this.analyzer.analyzeSequence(measurementSequence4, jumpSequence4.frames, 'increasing');
    results.push(result4);

    return results;
  }

  /**
   * Generate comprehensive temporal validation report
   */
  private generateReport(results: TemporalValidationResult[]): TemporalValidationReport {
    const totalSequences = results.length;
    const passedSequences = results.filter((r) => r.passed).length;
    const failedSequences = totalSequences - passedSequences;
    const passRate = (passedSequences / totalSequences) * 100;

    // Calculate aggregate metrics
    const meanSmoothness = results.reduce((sum, r) => sum + r.consistency.smoothnessScore, 0) / totalSequences;
    const meanConsistency = results.reduce((sum, r) => sum + (r.consistency.suddenJumps === 0 ? 1 : 0), 0) / totalSequences;
    const meanQuality = results.reduce((sum, r) => sum + r.quality.meanQuality, 0) / totalSequences;
    const totalSuddenJumps = results.reduce((sum, r) => sum + r.consistency.suddenJumps, 0);
    const totalQualityDropouts = results.reduce((sum, r) => sum + r.quality.qualityDropouts, 0);
    const sequencesWithPersistentComp = results.filter((r) => r.compensations.some((c) => c.isPersistent)).length;
    const persistentCompensationRate = (sequencesWithPersistentComp / totalSequences) * 100;

    // Per-movement analysis
    const perMovementAnalysis: Record<string, any> = {};
    const movementGroups = new Map<string, TemporalValidationResult[]>();

    results.forEach((result) => {
      const movement = result.sequenceId.split('_').slice(2, 4).join('_'); // Extract movement type
      if (!movementGroups.has(movement)) {
        movementGroups.set(movement, []);
      }
      movementGroups.get(movement)!.push(result);
    });

    movementGroups.forEach((groupResults, movement) => {
      const sequences = groupResults.length;
      const passed = groupResults.filter((r) => r.passed).length;
      const avgSmoothness = groupResults.reduce((sum, r) => sum + r.consistency.smoothnessScore, 0) / sequences;
      const avgConsistency = groupResults.reduce((sum, r) => sum + (r.consistency.suddenJumps === 0 ? 1 : 0), 0) / sequences;

      // Collect common issues
      const issueMap = new Map<string, number>();
      groupResults.forEach((r) => {
        r.issues.forEach((issue) => {
          issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
        });
      });

      const commonIssues = Array.from(issueMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([issue]) => issue);

      perMovementAnalysis[movement] = {
        sequences,
        passed,
        avgSmoothness,
        avgConsistency,
        commonIssues,
      };
    });

    // Generate notes
    const notes: string[] = [];
    if (passRate >= 95) {
      notes.push('✓ Excellent temporal consistency across all test sequences');
    } else if (passRate >= 85) {
      notes.push('✓ Good temporal consistency with minor issues');
    } else {
      notes.push('⚠ Temporal consistency requires improvement');
    }

    if (meanSmoothness >= 0.85) {
      notes.push('✓ High smoothness scores indicate stable measurements');
    } else if (meanSmoothness >= 0.75) {
      notes.push('○ Acceptable smoothness but some jitter detected');
    } else {
      notes.push('⚠ Low smoothness scores indicate measurement instability');
    }

    if (totalSuddenJumps === 0) {
      notes.push('✓ No sudden measurement jumps detected');
    } else {
      notes.push(`⚠ ${totalSuddenJumps} sudden measurement jumps detected across sequences`);
    }

    if (meanQuality >= 0.85) {
      notes.push('✓ Quality remains high throughout sequences');
    } else {
      notes.push(`○ Average quality ${(meanQuality * 100).toFixed(0)}% - some degradation detected`);
    }

    const status: 'PASS' | 'FAIL' = passRate >= 90 && meanSmoothness >= 0.75 && meanQuality >= 0.7 ? 'PASS' : 'FAIL';

    return {
      totalSequences,
      passedSequences,
      failedSequences,
      passRate,
      aggregateMetrics: {
        meanSmoothness,
        meanConsistency,
        meanQuality,
        totalSuddenJumps,
        totalQualityDropouts,
        persistentCompensationRate,
      },
      perMovementAnalysis,
      detailedResults: results,
      timestamp: new Date().toISOString(),
      status,
      notes,
    };
  }

  /**
   * Print report to console
   */
  public printReport(report: TemporalValidationReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('TEMPORAL VALIDATION REPORT - Gate 10D');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Status: ${report.status}`);
    console.log('');

    console.log('OVERALL RESULTS:');
    console.log(`  Total Sequences: ${report.totalSequences}`);
    console.log(`  Passed: ${report.passedSequences} (${report.passRate.toFixed(1)}%)`);
    console.log(`  Failed: ${report.failedSequences}`);
    console.log('');

    console.log('AGGREGATE METRICS:');
    console.log(`  Mean Smoothness: ${(report.aggregateMetrics.meanSmoothness * 100).toFixed(1)}% (target: ≥75%)`);
    console.log(`  Mean Consistency: ${(report.aggregateMetrics.meanConsistency * 100).toFixed(1)}% (no sudden jumps)`);
    console.log(`  Mean Quality: ${(report.aggregateMetrics.meanQuality * 100).toFixed(1)}% (target: ≥70%)`);
    console.log(`  Total Sudden Jumps: ${report.aggregateMetrics.totalSuddenJumps} (target: 0)`);
    console.log(`  Total Quality Dropouts: ${report.aggregateMetrics.totalQualityDropouts}`);
    console.log(`  Persistent Compensation Rate: ${report.aggregateMetrics.persistentCompensationRate.toFixed(1)}%`);
    console.log('');

    console.log('PER-MOVEMENT ANALYSIS:');
    Object.entries(report.perMovementAnalysis).forEach(([movement, analysis]) => {
      console.log(`  ${movement}:`);
      console.log(`    Sequences: ${analysis.sequences}, Passed: ${analysis.passed}`);
      console.log(`    Avg Smoothness: ${(analysis.avgSmoothness * 100).toFixed(1)}%`);
      console.log(`    Avg Consistency: ${(analysis.avgConsistency * 100).toFixed(1)}%`);
      if (analysis.commonIssues.length > 0) {
        console.log(`    Common Issues: ${analysis.commonIssues.slice(0, 2).join(', ')}`);
      }
    });
    console.log('');

    console.log('VALIDATION NOTES:');
    report.notes.forEach((note) => console.log(`  ${note}`));
    console.log('');

    console.log('='.repeat(80));
  }

  /**
   * Save report to file
   */
  public async saveReport(report: TemporalValidationReport, filepath: string): Promise<void> {
    const fs = require('fs').promises;
    await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Temporal validation report saved to: ${filepath}`);
  }
}
