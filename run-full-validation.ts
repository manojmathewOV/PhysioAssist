/**
 * Full validation suite runner
 * Executes all 114 validation test cases and generates comprehensive report
 */

import { ValidationPipeline } from './src/testing/ValidationPipeline';
import { DEFAULT_VALIDATION_CONFIG } from './src/types/validation';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('='.repeat(80));
  console.log('PhysioAssist Gate 10C - Clinical Validation Protocol');
  console.log('='.repeat(80));
  console.log('\nTarget Metrics:');
  console.log('  - MAE (Mean Absolute Error): ≤5°');
  console.log('  - RMSE (Root Mean Square Error): ≤7°');
  console.log('  - R² (Coefficient of Determination): ≥0.95');
  console.log('  - Pass Rate: >90%');
  console.log('  - Compensation Sensitivity: ≥80%');
  console.log('  - Compensation Specificity: ≥80%');
  console.log('\n' + '='.repeat(80) + '\n');

  const startTime = Date.now();

  // Create validation pipeline
  const pipeline = new ValidationPipeline(DEFAULT_VALIDATION_CONFIG);

  // Run full validation suite
  const report = await pipeline.runFullValidation();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print comprehensive report
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(80));

  console.log(`\n📊 Overall Statistics:`);
  console.log(`  Total Tests: ${report.totalTests}`);
  console.log(`  Passed: ${report.passed} (${report.passRate.toFixed(2)}%)`);
  console.log(`  Failed: ${report.failed}`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Status: ${report.status}`);

  console.log(`\n📐 Angle Measurement Accuracy:`);
  console.log(`  MAE (Mean Absolute Error): ${report.metrics.mae.toFixed(2)}° ${report.metrics.mae <= 5 ? '✓' : '✗ (target: ≤5°)'}`);
  console.log(`  RMSE (Root Mean Square Error): ${report.metrics.rmse.toFixed(2)}° ${report.metrics.rmse <= 7 ? '✓' : '✗ (target: ≤7°)'}`);
  console.log(`  R² (Coefficient): ${report.metrics.r2.toFixed(3)} ${report.metrics.r2 >= 0.95 ? '✓' : '✗ (target: ≥0.95)'}`);
  console.log(`  Max Error: ${report.metrics.maxError.toFixed(2)}°`);

  console.log(`\n🎯 Compensation Detection:`);
  console.log(`  Accuracy: ${report.compensationMetrics.accuracy.toFixed(2)}%`);
  console.log(`  Sensitivity: ${report.compensationMetrics.sensitivity.toFixed(2)}% ${report.compensationMetrics.sensitivity >= 80 ? '✓' : '✗ (target: ≥80%)'}`);
  console.log(`  Specificity: ${report.compensationMetrics.specificity.toFixed(2)}% ${report.compensationMetrics.specificity >= 80 ? '✓' : '✗ (target: ≥80%)'}`);
  console.log(`  Precision: ${report.compensationMetrics.precision?.toFixed(2)}%`);
  console.log(`  F1 Score: ${report.compensationMetrics.f1Score?.toFixed(3)}`);

  if (report.notes && report.notes.length > 0) {
    console.log(`\n📝 Notes:`);
    report.notes.forEach(note => console.log(`  - ${note}`));
  }

  // Save JSON report
  const reportsDir = path.join(__dirname, 'docs', 'validation');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const jsonPath = path.join(reportsDir, 'GATE_10C_VALIDATION_REPORT.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${jsonPath}`);

  // Generate summary by movement type
  const byMovement = new Map<string, { passed: number; total: number; errors: number[] }>();

  for (const result of report.detailedResults) {
    const movement = result.testCase.split('_').slice(0, 2).join('_'); // e.g., "shoulder_flexion"

    if (!byMovement.has(movement)) {
      byMovement.set(movement, { passed: 0, total: 0, errors: [] });
    }

    const stats = byMovement.get(movement)!;
    stats.total++;
    if (result.passed) stats.passed++;
    stats.errors.push(result.error);
  }

  console.log(`\n📈 Results by Movement Type:`);
  for (const [movement, stats] of byMovement.entries()) {
    const passRate = (stats.passed / stats.total * 100).toFixed(1);
    const avgError = (stats.errors.reduce((a, b) => a + b, 0) / stats.errors.length).toFixed(2);
    const status = stats.passed === stats.total ? '✓✓✓' : stats.passed / stats.total >= 0.9 ? '✓✓' : stats.passed / stats.total >= 0.7 ? '✓' : '✗';
    console.log(`  ${movement.padEnd(25)}: ${stats.passed}/${stats.total} (${passRate}%) - Avg error: ${avgError}° ${status}`);
  }

  console.log('\n' + '='.repeat(80));

  // Exit code based on status
  process.exit(report.status === 'PASS' ? 0 : 1);
}

main().catch((error) => {
  console.error('Validation failed with error:', error);
  process.exit(1);
});
