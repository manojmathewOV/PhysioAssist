/**
 * Standalone Validation Runner
 * Gate 10C: Runs validation pipeline and generates report
 *
 * Usage: npx ts-node src/testing/runValidation.ts
 */

import { ValidationPipeline } from './ValidationPipeline.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/validation.js';
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('PhysioAssist Gate 10C - Clinical Validation Protocol');
  console.log('='.repeat(80));
  console.log('');
  console.log('Target Metrics:');
  console.log('  • MAE (Mean Absolute Error): ≤5°');
  console.log('  • RMSE (Root Mean Square Error): ≤7°');
  console.log('  • R² (Coefficient of Determination): ≥0.95');
  console.log('  • Compensation Sensitivity: ≥80%');
  console.log('  • Compensation Specificity: ≥80%');
  console.log('');
  console.log('Test Cases: 110 total');
  console.log('  • Shoulder Flexion: 20 cases');
  console.log('  • Shoulder Abduction: 20 cases');
  console.log('  • Shoulder Rotation: 20 cases');
  console.log('  • Elbow Flexion: 15 cases');
  console.log('  • Knee Flexion: 15 cases');
  console.log('  • Edge Cases: 20 cases');
  console.log('');
  console.log('Starting validation...\n');

  // Create validation pipeline
  const pipeline = new ValidationPipeline(DEFAULT_VALIDATION_CONFIG);

  try {
    // Run full validation
    const startTime = Date.now();
    const report = await pipeline.runFullValidation();
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\nValidation completed in ${duration.toFixed(2)}s`);

    // Print report to console
    pipeline.printReport(report);

    // Ensure output directory exists
    const docsDir = path.join(process.cwd(), 'docs', 'validation');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(docsDir, 'GATE_10C_VALIDATION_REPORT.json');
    await pipeline.saveReport(report, jsonPath);

    // Generate markdown summary
    const markdownPath = path.join(docsDir, 'GATE_10C_VALIDATION_SUMMARY.md');
    await generateMarkdownSummary(report, markdownPath, duration);

    console.log(`\nMarkdown summary saved to: ${markdownPath}`);

    // Exit with appropriate code
    process.exit(report.status === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Validation failed with error:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Generate markdown summary of validation report
 */
async function generateMarkdownSummary(report: any, filepath: string, duration: number): Promise<void> {
  const markdown = `# Gate 10C: Clinical Validation Report

## Summary

**Status**: ${report.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
**Date**: ${report.timestamp}
**Duration**: ${duration.toFixed(2)}s
**Total Tests**: ${report.totalTests}
**Pass Rate**: ${report.passRate.toFixed(1)}%

---

## Angle Measurement Accuracy

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **MAE** (Mean Absolute Error) | ${report.metrics.mae.toFixed(2)}° | ≤5° | ${report.metrics.mae <= 5 ? '✅' : '❌'} |
| **RMSE** (Root Mean Square Error) | ${report.metrics.rmse.toFixed(2)}° | ≤7° | ${report.metrics.rmse <= 7 ? '✅' : '❌'} |
| **Max Error** | ${report.metrics.maxError.toFixed(2)}° | ≤10° | ${report.metrics.maxError <= 10 ? '✅' : '❌'} |
| **R²** (Coefficient of Determination) | ${report.metrics.r2.toFixed(3)} | ≥0.95 | ${report.metrics.r2 >= 0.95 ? '✅' : '❌'} |

### Key Insights

- **MAE of ${report.metrics.mae.toFixed(2)}°** indicates ${report.metrics.mae <= 3 ? 'excellent' : report.metrics.mae <= 5 ? 'good' : 'marginal'} clinical accuracy
- **RMSE of ${report.metrics.rmse.toFixed(2)}°** shows ${report.metrics.rmse <= 5 ? 'low' : report.metrics.rmse <= 7 ? 'acceptable' : 'high'} measurement variance
- **R² of ${report.metrics.r2.toFixed(3)}** demonstrates ${report.metrics.r2 >= 0.97 ? 'excellent' : report.metrics.r2 >= 0.95 ? 'strong' : 'moderate'} correlation with ground truth

---

## Compensation Detection Accuracy

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Accuracy** | ${report.compensationMetrics.accuracy.toFixed(1)}% | - | - |
| **Sensitivity** (True Positive Rate) | ${(report.compensationMetrics.sensitivity * 100).toFixed(1)}% | ≥80% | ${report.compensationMetrics.sensitivity >= 0.80 ? '✅' : '❌'} |
| **Specificity** (True Negative Rate) | ${(report.compensationMetrics.specificity * 100).toFixed(1)}% | ≥80% | ${report.compensationMetrics.specificity >= 0.80 ? '✅' : '❌'} |
| **Precision** | ${(report.compensationMetrics.precision * 100).toFixed(1)}% | ≥75% | ${report.compensationMetrics.precision >= 0.75 ? '✅' : '❌'} |
| **F1 Score** | ${report.compensationMetrics.f1Score.toFixed(3)} | ≥0.77 | ${report.compensationMetrics.f1Score >= 0.77 ? '✅' : '❌'} |

### Clinical Interpretation

${report.compensationMetrics.sensitivity >= 0.80 && report.compensationMetrics.specificity >= 0.80
    ? '✅ **Compensation detection meets clinical standards** - High sensitivity and specificity ensure reliable compensation identification for clinical decision-making.'
    : '⚠️ **Compensation detection requires improvement** - Review detection thresholds and algorithms to improve clinical reliability.'}

---

## Test Coverage

### Movement Types Tested

- **Shoulder Flexion**: ${report.detailedResults.filter((r: any) => r.testCase.includes('shoulder_flexion')).length} tests
- **Shoulder Abduction**: ${report.detailedResults.filter((r: any) => r.testCase.includes('shoulder_abduction')).length} tests
- **Shoulder Rotation**: ${report.detailedResults.filter((r: any) => r.testCase.includes('shoulder_rotation')).length} tests
- **Elbow Flexion**: ${report.detailedResults.filter((r: any) => r.testCase.includes('elbow_flexion')).length} tests
- **Knee Flexion**: ${report.detailedResults.filter((r: any) => r.testCase.includes('knee_flexion')).length} tests
- **Edge Cases**: ${report.detailedResults.filter((r: any) => r.testCase.includes('edge_')).length} tests

### Compensation Types Tested

- Trunk Lean
- Trunk Rotation
- Shoulder Hiking
- Elbow Flexion Drift
- Hip Hike
- Contralateral Lean

### Angle Ranges Tested

- **Near-zero angles** (0-5°): Testing minimum ROM detection
- **Low angles** (30-60°): Testing early range measurements
- **Mid angles** (60-120°): Testing functional range measurements
- **High angles** (120-180°): Testing maximum ROM measurements

---

## Validation Notes

${report.notes && report.notes.length > 0 ? report.notes.map((note: string) => `- ${note}`).join('\n') : '- No additional notes'}

---

## Conclusion

${report.status === 'PASS'
    ? `✅ **Gate 10C Validation: PASS**

The PhysioAssist clinical measurement system has successfully achieved all validation targets:

1. **Clinical Accuracy**: MAE of ${report.metrics.mae.toFixed(2)}° meets the ±5° clinical accuracy requirement
2. **Measurement Reliability**: RMSE of ${report.metrics.rmse.toFixed(2)}° demonstrates consistent measurements
3. **High Correlation**: R² of ${report.metrics.r2.toFixed(3)} shows excellent agreement with ground truth
4. **Compensation Detection**: ${(report.compensationMetrics.sensitivity * 100).toFixed(1)}% sensitivity and ${(report.compensationMetrics.specificity * 100).toFixed(1)}% specificity meet clinical standards

**System is validated for clinical ROM assessment and ready for deployment.**`
    : `❌ **Gate 10C Validation: FAIL**

The validation identified areas requiring improvement:

${report.notes && report.notes.length > 0 ? report.notes.map((note: string) => `- ${note}`).join('\n') : ''}

**Recommendations**:
1. Review measurement algorithms for accuracy improvements
2. Analyze failed test cases to identify systematic errors
3. Adjust compensation detection thresholds if needed
4. Rerun validation after improvements`}

---

## Detailed Results

Full validation results with all ${report.totalTests} test cases are available in:
\`docs/validation/GATE_10C_VALIDATION_REPORT.json\`

---

*Generated by PhysioAssist Validation Pipeline*
*Gate 10C: Clinical Validation Protocol*
`;

  fs.writeFileSync(filepath, markdown, 'utf-8');
}

// Run validation
main();
