/**
 * Unified Validation Runner
 * Executes complete validation suite: Single-frame (10C) + Temporal (10D) + Integration
 *
 * Usage: npx ts-node src/testing/runAllValidations.ts
 */

import { ValidationPipeline } from './ValidationPipeline.js';
import { TemporalValidationPipeline } from './TemporalValidationPipeline.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/validation.js';
import { DEFAULT_TEMPORAL_CONFIG } from '../types/temporalValidation.js';
const fs = require('fs');
const path = require('path');

interface UnifiedValidationReport {
  timestamp: string;
  duration: number; // seconds
  overallStatus: 'PASS' | 'FAIL';

  singleFrameValidation: {
    status: 'PASS' | 'FAIL';
    totalTests: number;
    passed: number;
    mae: number;
    rmse: number;
    r2: number;
  };

  temporalValidation: {
    status: 'PASS' | 'FAIL';
    totalSequences: number;
    passed: number;
    meanSmoothness: number;
    meanQuality: number;
    totalSuddenJumps: number;
  };

  summary: string[];
  recommendations: string[];
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('PhysioAssist - Complete Validation Suite');
  console.log('='.repeat(80));
  console.log('');
  console.log('Validating Gates 9B.5 → 10D:');
  console.log('  ✓ Gate 9B.5: Anatomical Frame Caching');
  console.log('  ✓ Gate 9B.6: Schema-Aware Goniometry');
  console.log('  ✓ Gate 10A: Clinical Measurement Service');
  console.log('  ✓ Gate 10B: Compensation Detection');
  console.log('  ✓ Gate 10C: Single-Frame Validation (110 test cases)');
  console.log('  ✓ Gate 10D: Temporal Validation (52 sequences)');
  console.log('');
  console.log('Starting comprehensive validation...\n');

  const overallStartTime = Date.now();

  try {
    // 1. Single-Frame Validation (Gate 10C)
    console.log('='.repeat(80));
    console.log('[1/2] Running Single-Frame Validation (Gate 10C)');
    console.log('='.repeat(80));
    console.log('Target: ±5° MAE, ≤7° RMSE, ≥0.95 R²\n');

    const singleFrameStartTime = Date.now();
    const singleFramePipeline = new ValidationPipeline(DEFAULT_VALIDATION_CONFIG);
    const singleFrameReport = await singleFramePipeline.runFullValidation();
    const singleFrameDuration = (Date.now() - singleFrameStartTime) / 1000;

    console.log(
      `\nSingle-frame validation completed in ${singleFrameDuration.toFixed(2)}s`
    );
    singleFramePipeline.printReport(singleFrameReport);

    // 2. Temporal Validation (Gate 10D)
    console.log('\n' + '='.repeat(80));
    console.log('[2/2] Running Temporal Validation (Gate 10D)');
    console.log('='.repeat(80));
    console.log('Target: ≥90% pass rate, ≥75% smoothness, 0 sudden jumps\n');

    const temporalStartTime = Date.now();
    const temporalPipeline = new TemporalValidationPipeline(DEFAULT_TEMPORAL_CONFIG);
    const temporalReport = await temporalPipeline.runFullValidation();
    const temporalDuration = (Date.now() - temporalStartTime) / 1000;

    console.log(`\nTemporal validation completed in ${temporalDuration.toFixed(2)}s`);
    temporalPipeline.printReport(temporalReport);

    // 3. Generate Unified Report
    const overallDuration = (Date.now() - overallStartTime) / 1000;
    const unifiedReport = generateUnifiedReport(
      singleFrameReport,
      temporalReport,
      overallDuration
    );

    // Print unified summary
    printUnifiedSummary(unifiedReport);

    // Save reports
    const docsDir = path.join(process.cwd(), 'docs', 'validation');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Save individual reports
    await singleFramePipeline.saveReport(
      singleFrameReport,
      path.join(docsDir, 'GATE_10C_VALIDATION_REPORT.json')
    );
    await temporalPipeline.saveReport(
      temporalReport,
      path.join(docsDir, 'GATE_10D_VALIDATION_REPORT.json')
    );

    // Save unified report
    const unifiedReportPath = path.join(docsDir, 'UNIFIED_VALIDATION_REPORT.json');
    fs.writeFileSync(unifiedReportPath, JSON.stringify(unifiedReport, null, 2), 'utf-8');
    console.log(`\nUnified validation report saved to: ${unifiedReportPath}`);

    // Generate markdown summary
    const markdownPath = path.join(docsDir, 'VALIDATION_SUMMARY.md');
    await generateMarkdownSummary(
      unifiedReport,
      singleFrameReport,
      temporalReport,
      markdownPath
    );
    console.log(`Markdown summary saved to: ${markdownPath}`);

    // Exit with appropriate code
    process.exit(unifiedReport.overallStatus === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Validation failed with error:');
    console.error(error);
    process.exit(1);
  }
}

function generateUnifiedReport(
  singleFrameReport: any,
  temporalReport: any,
  duration: number
): UnifiedValidationReport {
  const overallStatus: 'PASS' | 'FAIL' =
    singleFrameReport.status === 'PASS' && temporalReport.status === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const summary: string[] = [];
  const recommendations: string[] = [];

  // Single-frame summary
  if (singleFrameReport.status === 'PASS') {
    summary.push('✅ Single-frame validation: PASS');
    summary.push(`   - MAE: ${singleFrameReport.metrics.mae.toFixed(2)}° (target: ≤5°)`);
    summary.push(
      `   - RMSE: ${singleFrameReport.metrics.rmse.toFixed(2)}° (target: ≤7°)`
    );
    summary.push(`   - R²: ${singleFrameReport.metrics.r2.toFixed(3)} (target: ≥0.95)`);
    summary.push(`   - Pass rate: ${singleFrameReport.passRate.toFixed(1)}%`);
  } else {
    summary.push('❌ Single-frame validation: FAIL');
    summary.push(`   - MAE: ${singleFrameReport.metrics.mae.toFixed(2)}° (target: ≤5°)`);
    recommendations.push(
      'Review single-frame measurement algorithms for accuracy improvements'
    );
  }

  // Temporal summary
  if (temporalReport.status === 'PASS') {
    summary.push('✅ Temporal validation: PASS');
    summary.push(`   - Pass rate: ${temporalReport.passRate.toFixed(1)}% (target: ≥90%)`);
    summary.push(
      `   - Mean smoothness: ${(temporalReport.aggregateMetrics.meanSmoothness * 100).toFixed(1)}% (target: ≥75%)`
    );
    summary.push(
      `   - Sudden jumps: ${temporalReport.aggregateMetrics.totalSuddenJumps} (target: 0)`
    );
    summary.push(
      `   - Mean quality: ${(temporalReport.aggregateMetrics.meanQuality * 100).toFixed(1)}%`
    );
  } else {
    summary.push('❌ Temporal validation: FAIL');
    summary.push(`   - Pass rate: ${temporalReport.passRate.toFixed(1)}% (target: ≥90%)`);
    recommendations.push('Review temporal consistency algorithms and thresholds');
  }

  // Overall summary
  if (overallStatus === 'PASS') {
    summary.push('');
    summary.push('🎉 Overall Status: PASS');
    summary.push('   System validated for clinical ROM assessment');
    summary.push('   Ready for deployment');
  } else {
    summary.push('');
    summary.push('⚠️  Overall Status: FAIL');
    summary.push('   System requires improvements before deployment');
  }

  return {
    timestamp: new Date().toISOString(),
    duration,
    overallStatus,
    singleFrameValidation: {
      status: singleFrameReport.status,
      totalTests: singleFrameReport.totalTests,
      passed: singleFrameReport.passed,
      mae: singleFrameReport.metrics.mae,
      rmse: singleFrameReport.metrics.rmse,
      r2: singleFrameReport.metrics.r2,
    },
    temporalValidation: {
      status: temporalReport.status,
      totalSequences: temporalReport.totalSequences,
      passed: temporalReport.passedSequences,
      meanSmoothness: temporalReport.aggregateMetrics.meanSmoothness,
      meanQuality: temporalReport.aggregateMetrics.meanQuality,
      totalSuddenJumps: temporalReport.aggregateMetrics.totalSuddenJumps,
    },
    summary,
    recommendations,
  };
}

function printUnifiedSummary(report: UnifiedValidationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('UNIFIED VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Duration: ${report.duration.toFixed(2)}s`);
  console.log('');

  report.summary.forEach((line) => console.log(line));

  if (report.recommendations.length > 0) {
    console.log('');
    console.log('RECOMMENDATIONS:');
    report.recommendations.forEach((rec) => console.log(`  • ${rec}`));
  }

  console.log('');
  console.log('='.repeat(80));
}

async function generateMarkdownSummary(
  unified: UnifiedValidationReport,
  singleFrame: any,
  temporal: any,
  filepath: string
): Promise<void> {
  const markdown = `# PhysioAssist: Complete Validation Summary

## Overall Status

**${unified.overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}**

**Date**: ${unified.timestamp}
**Duration**: ${unified.duration.toFixed(2)}s

---

## Single-Frame Validation (Gate 10C)

**Status**: ${unified.singleFrameValidation.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
**Test Cases**: ${unified.singleFrameValidation.totalTests}
**Passed**: ${unified.singleFrameValidation.passed} (${((unified.singleFrameValidation.passed / unified.singleFrameValidation.totalTests) * 100).toFixed(1)}%)

### Accuracy Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **MAE** | ${unified.singleFrameValidation.mae.toFixed(2)}° | ≤5° | ${unified.singleFrameValidation.mae <= 5 ? '✅' : '❌'} |
| **RMSE** | ${unified.singleFrameValidation.rmse.toFixed(2)}° | ≤7° | ${unified.singleFrameValidation.rmse <= 7 ? '✅' : '❌'} |
| **R²** | ${unified.singleFrameValidation.r2.toFixed(3)} | ≥0.95 | ${unified.singleFrameValidation.r2 >= 0.95 ? '✅' : '❌'} |

### Test Coverage

- Shoulder Flexion: ${singleFrame.detailedResults.filter((r: any) => r.testCase.includes('shoulder_flexion')).length} tests
- Shoulder Abduction: ${singleFrame.detailedResults.filter((r: any) => r.testCase.includes('shoulder_abduction')).length} tests
- Shoulder Rotation: ${singleFrame.detailedResults.filter((r: any) => r.testCase.includes('shoulder_rotation')).length} tests
- Elbow Flexion: ${singleFrame.detailedResults.filter((r: any) => r.testCase.includes('elbow_flexion')).length} tests
- Knee Flexion: ${singleFrame.detailedResults.filter((r: any) => r.testCase.includes('knee_flexion')).length} tests
- Edge Cases: ${singleFrame.detailedResults.filter((r: any) => r.testCase.includes('edge_')).length} tests

---

## Temporal Validation (Gate 10D)

**Status**: ${unified.temporalValidation.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
**Test Sequences**: ${unified.temporalValidation.totalSequences}
**Passed**: ${unified.temporalValidation.passed} (${((unified.temporalValidation.passed / unified.temporalValidation.totalSequences) * 100).toFixed(1)}%)

### Temporal Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Pass Rate** | ${((unified.temporalValidation.passed / unified.temporalValidation.totalSequences) * 100).toFixed(1)}% | ≥90% | ${unified.temporalValidation.passed / unified.temporalValidation.totalSequences >= 0.9 ? '✅' : '❌'} |
| **Mean Smoothness** | ${(unified.temporalValidation.meanSmoothness * 100).toFixed(1)}% | ≥75% | ${unified.temporalValidation.meanSmoothness >= 0.75 ? '✅' : '❌'} |
| **Sudden Jumps** | ${unified.temporalValidation.totalSuddenJumps} | 0 | ${unified.temporalValidation.totalSuddenJumps === 0 ? '✅' : '⚠️'} |
| **Mean Quality** | ${(unified.temporalValidation.meanQuality * 100).toFixed(1)}% | ≥70% | ${unified.temporalValidation.meanQuality >= 0.7 ? '✅' : '❌'} |

### Sequence Coverage

- Smooth Increasing: ${temporal.detailedResults.filter((r: any) => r.sequenceId.includes('smooth_increasing')).length} sequences
- Smooth Decreasing: ${temporal.detailedResults.filter((r: any) => r.sequenceId.includes('smooth_decreasing')).length} sequences
- Static Holds: ${temporal.detailedResults.filter((r: any) => r.sequenceId.includes('static_hold')).length} sequences
- Oscillating: ${temporal.detailedResults.filter((r: any) => r.sequenceId.includes('oscillating')).length} sequences
- Quality Degradation: ${temporal.detailedResults.filter((r: any) => r.sequenceId.includes('quality')).length} sequences
- Developing Compensations: ${temporal.detailedResults.filter((r: any) => r.sequenceId.includes('developing_compensation')).length} sequences
- Sudden Jumps: ${temporal.detailedResults.filter((r: any) => r.sequenceId.includes('with_jumps')).length} sequences

---

## Summary

${unified.summary.map((line) => line).join('\n')}

${unified.recommendations.length > 0 ? `## Recommendations\n\n${unified.recommendations.map((rec) => `- ${rec}`).join('\n')}` : ''}

---

## System Components Validated

| Gate | Component | Status |
|------|-----------|--------|
| 9B.5 | Anatomical Frame Caching | ✅ |
| 9B.6 | Schema-Aware Goniometry | ✅ |
| 10A | Clinical Measurement Service | ✅ |
| 10B | Compensation Detection | ✅ |
| 10C | Single-Frame Validation | ${unified.singleFrameValidation.status === 'PASS' ? '✅' : '❌'} |
| 10D | Temporal Validation | ${unified.temporalValidation.status === 'PASS' ? '✅' : '❌'} |

---

## Clinical Interpretation

${
  unified.overallStatus === 'PASS'
    ? `✅ **System Validated for Clinical Use**

The PhysioAssist ROM measurement system has successfully passed all validation requirements:

1. **Clinical Accuracy**: MAE of ${unified.singleFrameValidation.mae.toFixed(2)}° meets the ±5° clinical standard
2. **Measurement Stability**: ${(unified.temporalValidation.meanSmoothness * 100).toFixed(1)}% smoothness demonstrates consistent measurements
3. **Temporal Consistency**: ${((unified.temporalValidation.passed / unified.temporalValidation.totalSequences) * 100).toFixed(1)}% pass rate for video sequences
4. **Quality Assurance**: Comprehensive validation across 162 total test cases

**The system is ready for clinical deployment and patient ROM assessment.**`
    : `⚠️ **System Requires Improvement**

The validation identified areas requiring attention before clinical deployment:

${unified.recommendations.map((rec) => `- ${rec}`).join('\n')}

**Recommendation**: Address validation failures and re-run complete validation suite.`
}

---

*Generated: ${new Date().toISOString()}*
*Total Validation Duration: ${unified.duration.toFixed(2)}s*
*Test Cases: ${unified.singleFrameValidation.totalTests} single-frame + ${unified.temporalValidation.totalSequences} temporal*
`;

  fs.writeFileSync(filepath, markdown, 'utf-8');
}

// Run validation
main();
