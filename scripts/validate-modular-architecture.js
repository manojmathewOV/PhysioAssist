#!/usr/bin/env node
/**
 * Validation Runner Script (JavaScript version)
 *
 * Runs comprehensive validation of the modular architecture
 * and generates a JSON report.
 *
 * Usage:
 *   npm run validate:architecture
 *   or
 *   node scripts/validate-modular-architecture.js
 */

const fs = require('fs');
const path = require('path');

// Mock validation for now - will import actual when TypeScript is resolved
async function runValidation() {
  console.log('🚀 PhysioAssist Modular Architecture Validation');
  console.log('================================================\n');

  const results = [];
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // Helper to add result
  function addResult(category, test, status, message) {
    results.push({ category, test, status, message });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`  ${icon} ${test}: ${message}`);
    if (status === 'PASS') passed++;
    else if (status === 'FAIL') failed++;
    else warnings++;
  }

  // ========== SECTION 1: File Existence Tests ==========
  console.log('1️⃣  Testing File Existence...');

  const requiredFiles = [
    'src/config/movements.config.ts',
    'src/config/protocols.config.ts',
    'src/services/DemoManager.ts',
    'src/components/clinical/JointSelectionPanelV2.tsx',
    'src/components/clinical/MovementSelectionPanelV2.tsx',
    'src/components/clinical/MovementDemoScreen.tsx',
  ];

  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      addResult('File Existence', file, 'PASS', 'File exists');
    } else {
      addResult('File Existence', file, 'FAIL', 'File missing');
    }
  });

  // ========== SECTION 2: Config File Parsing ==========
  console.log('\n2️⃣  Testing Config File Parsing...');

  try {
    const movementsPath = path.join(__dirname, '..', 'src/config/movements.config.ts');
    const content = fs.readFileSync(movementsPath, 'utf8');

    // Check for key exports
    if (content.includes('export const MOVEMENT_REGISTRY')) {
      addResult('Config Parsing', 'MOVEMENT_REGISTRY export', 'PASS', 'Export found');
    } else {
      addResult('Config Parsing', 'MOVEMENT_REGISTRY export', 'FAIL', 'Export not found');
    }

    if (content.includes('export const JOINT_METADATA')) {
      addResult('Config Parsing', 'JOINT_METADATA export', 'PASS', 'Export found');
    } else {
      addResult('Config Parsing', 'JOINT_METADATA export', 'FAIL', 'Export not found');
    }

    if (content.includes('export const AVAILABLE_JOINTS')) {
      addResult('Config Parsing', 'AVAILABLE_JOINTS export', 'PASS', 'Export found');
    } else {
      addResult('Config Parsing', 'AVAILABLE_JOINTS export', 'FAIL', 'Export not found');
    }

    if (content.includes('export class MovementRegistry')) {
      addResult('Config Parsing', 'MovementRegistry class', 'PASS', 'Class found');
    } else {
      addResult('Config Parsing', 'MovementRegistry class', 'FAIL', 'Class not found');
    }

    // Count movements in registry
    const movementMatches = content.match(/\{\s*id:\s*'[^']+'/g);
    if (movementMatches) {
      const count = movementMatches.length;
      if (count >= 10) {
        addResult('Config Parsing', 'Movement count', 'PASS', `${count} movements defined`);
      } else {
        addResult('Config Parsing', 'Movement count', 'WARN', `Only ${count} movements defined`);
      }
    }
  } catch (e) {
    addResult('Config Parsing', 'Parse movements.config.ts', 'FAIL', e.message);
  }

  // ========== SECTION 3: Protocol Config Parsing ==========
  console.log('\n3️⃣  Testing Protocol Config...');

  try {
    const protocolsPath = path.join(__dirname, '..', 'src/config/protocols.config.ts');
    const content = fs.readFileSync(protocolsPath, 'utf8');

    if (content.includes('export const PROTOCOL_REGISTRY')) {
      addResult('Protocol Parsing', 'PROTOCOL_REGISTRY export', 'PASS', 'Export found');
    } else {
      addResult('Protocol Parsing', 'PROTOCOL_REGISTRY export', 'FAIL', 'Export not found');
    }

    if (content.includes('export class ProtocolManager')) {
      addResult('Protocol Parsing', 'ProtocolManager class', 'PASS', 'Class found');
    } else {
      addResult('Protocol Parsing', 'ProtocolManager class', 'FAIL', 'Class not found');
    }

    // Count protocols
    const protocolMatches = content.match(/\{\s*id:\s*'[^']+',/g);
    if (protocolMatches) {
      const count = protocolMatches.length;
      if (count >= 6) {
        addResult('Protocol Parsing', 'Protocol count', 'PASS', `${count} protocols defined`);
      } else {
        addResult('Protocol Parsing', 'Protocol count', 'WARN', `Only ${count} protocols defined`);
      }
    }
  } catch (e) {
    addResult('Protocol Parsing', 'Parse protocols.config.ts', 'FAIL', e.message);
  }

  // ========== SECTION 4: Component Integration ==========
  console.log('\n4️⃣  Testing Component Integration...');

  const components = [
    'src/components/clinical/JointSelectionPanelV2.tsx',
    'src/components/clinical/MovementSelectionPanelV2.tsx',
    'src/components/clinical/MovementDemoScreen.tsx',
  ];

  components.forEach(file => {
    try {
      const fullPath = path.join(__dirname, '..', file);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for @config imports
      if (content.includes('@config/movements.config')) {
        addResult('Component Integration', `${path.basename(file)} imports`, 'PASS', 'Uses @config imports');
      } else {
        addResult('Component Integration', `${path.basename(file)} imports`, 'FAIL', 'Missing @config imports');
      }

      // Check for registry usage
      if (content.includes('MovementRegistry') || content.includes('JOINT_METADATA')) {
        addResult('Component Integration', `${path.basename(file)} registry usage`, 'PASS', 'Uses registry');
      } else {
        addResult('Component Integration', `${path.basename(file)} registry usage`, 'FAIL', 'Not using registry');
      }
    } catch (e) {
      addResult('Component Integration', `Parse ${path.basename(file)}`, 'FAIL', e.message);
    }
  });

  // ========== SECTION 5: TypeScript Configuration ==========
  console.log('\n5️⃣  Testing TypeScript Configuration...');

  try {
    const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
    const content = fs.readFileSync(tsconfigPath, 'utf8');
    const config = JSON.parse(content);

    if (config.compilerOptions?.paths?.['@config/*']) {
      addResult('TypeScript Config', 'Path alias @config/*', 'PASS', 'Configured');
    } else {
      addResult('TypeScript Config', 'Path alias @config/*', 'FAIL', 'Not configured');
    }
  } catch (e) {
    addResult('TypeScript Config', 'Parse tsconfig.json', 'FAIL', e.message);
  }

  try {
    const babelPath = path.join(__dirname, '..', 'babel.config.js');
    const content = fs.readFileSync(babelPath, 'utf8');

    if (content.includes("'@config': './src/config'")) {
      addResult('Babel Config', 'Path alias @config', 'PASS', 'Configured');
    } else {
      addResult('Babel Config', 'Path alias @config', 'FAIL', 'Not configured');
    }
  } catch (e) {
    addResult('Babel Config', 'Parse babel.config.js', 'FAIL', e.message);
  }

  // ========== SECTION 6: Documentation ==========
  console.log('\n6️⃣  Testing Documentation...');

  const docs = [
    'docs/MODULAR_ARCHITECTURE.md',
    'docs/WORKFLOW_ANALYSIS_COMPLETE.md',
    'docs/SESSION_SUMMARY_MODULAR_ARCHITECTURE.md',
  ];

  docs.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      addResult('Documentation', path.basename(file), 'PASS', `${lines} lines`);
    } else {
      addResult('Documentation', path.basename(file), 'FAIL', 'File missing');
    }
  });

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed:   ${passed}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📝 Total:    ${results.length}`);
  console.log('='.repeat(80) + '\n');

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      warnings,
      passRate: ((passed / results.length) * 100).toFixed(2) + '%',
    },
    results,
  };

  // Save report
  const reportPath = path.join(__dirname, '..', 'docs', 'validation', 'MODULAR_ARCHITECTURE_VALIDATION.json');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Validation report saved to: ${reportPath}\n`);

  // Exit with appropriate code
  if (failed > 0) {
    console.log('❌ Validation FAILED');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  Validation PASSED with warnings');
    process.exit(0);
  } else {
    console.log('✅ Validation PASSED');
    process.exit(0);
  }
}

// Run validation
runValidation().catch(error => {
  console.error('\n❌ Fatal error during validation:');
  console.error(error);
  process.exit(1);
});
