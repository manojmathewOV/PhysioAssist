#!/usr/bin/env ts-node
/**
 * Validation Runner Script
 *
 * Runs comprehensive validation of the modular architecture
 * and generates a JSON report.
 *
 * Usage:
 *   npm run validate:architecture
 *   or
 *   ts-node scripts/validate-modular-architecture.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { runModularArchitectureValidation } from '../src/testing/ModularArchitectureValidation';

async function main() {
  console.log('🚀 PhysioAssist Modular Architecture Validation');
  console.log('================================================\n');

  try {
    // Run validation
    const report = await runModularArchitectureValidation();

    // Save report to file
    const reportPath = path.join(
      __dirname,
      '..',
      'docs',
      'validation',
      'MODULAR_ARCHITECTURE_VALIDATION.json'
    );
    const reportDir = path.dirname(reportPath);

    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Validation report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (report.summary.failed > 0) {
      console.log('\n❌ Validation FAILED');
      process.exit(1);
    } else if (report.summary.warnings > 0) {
      console.log('\n⚠️  Validation PASSED with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ Validation PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during validation:');
    console.error(error);
    process.exit(1);
  }
}

main();
