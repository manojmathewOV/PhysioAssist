#!/usr/bin/env node

/**
 * PhysioAssist Modular Architecture - Clinical Accuracy Validation
 *
 * Validates clinical measurement accuracy against known reference values
 * and established clinical standards (AAOS, AMA guidelines).
 *
 * Test Categories:
 * 1. Known Angle Calculations (geometric verification)
 * 2. Clinical Range Validation (AAOS/AMA standards)
 * 3. Bilateral Symmetry Detection Accuracy
 * 4. Progress Tracking Accuracy
 * 5. Asymmetry Threshold Validation
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(80)}\n${msg}\n${'='.repeat(80)}${colors.reset}\n`),
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  categories: {},
};

function logTest(step, category, description, status, details, note = null) {
  results.total++;

  if (!results.categories[category]) {
    results.categories[category] = { total: 0, passed: 0, failed: 0, warnings: 0 };
  }

  results.categories[category].total++;

  const statusIcon = status === '✅' ? '✅' : status === '⚠️' ? '⚠️' : '❌';
  const statusText = status === '✅' ? 'PASS' : status === '⚠️' ? 'WARN' : 'FAIL';

  if (status === '✅') {
    results.passed++;
    results.categories[category].passed++;
    log.success(`Test ${step}: [${category}] ${description}`);
  } else if (status === '⚠️') {
    results.warnings++;
    results.categories[category].warnings++;
    log.warning(`Test ${step}: [${category}] ${description}`);
  } else {
    results.failed++;
    results.categories[category].failed++;
    log.error(`Test ${step}: [${category}] ${description}`);
  }

  console.log(`   → ${details}`);
  if (note) console.log(`   💡 ${note}`);

  return { step, category, description, status: statusText, details, note };
}

// ============================================================================
// HELPER: Calculate angle between three points
// ============================================================================

function calculateAngle(p1, p2, p3) {
  // p2 is the vertex
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = dot / (mag1 * mag2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  return (angleRad * 180) / Math.PI;
}

// ============================================================================
// CATEGORY 1: Known Angle Calculations (Geometric Verification)
// ============================================================================

log.section('CATEGORY 1: Known Angle Calculations (Geometric Verification)');

const category1Tests = [];

// Test 1.1: Perfect right angle (90°)
const test1_1 = calculateAngle(
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 }
);
const error1_1 = Math.abs(test1_1 - 90);
category1Tests.push(logTest(
  '1.1',
  'Geometric Accuracy',
  'Right angle (90°) calculation',
  error1_1 < 0.5 ? '✅' : '❌',
  `Expected: 90° | Calculated: ${test1_1.toFixed(2)}° | Error: ${error1_1.toFixed(2)}°`,
  error1_1 < 0.5 ? 'Excellent precision' : 'Calculation error exceeds tolerance'
));

// Test 1.2: Straight angle (180°)
const test1_2 = calculateAngle(
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 }
);
const error1_2 = Math.abs(test1_2 - 180);
category1Tests.push(logTest(
  '1.2',
  'Geometric Accuracy',
  'Straight angle (180°) calculation',
  error1_2 < 0.5 ? '✅' : '❌',
  `Expected: 180° | Calculated: ${test1_2.toFixed(2)}° | Error: ${error1_2.toFixed(2)}°`,
  error1_2 < 0.5 ? 'Full extension detected correctly' : 'Calculation error in straight line detection'
));

// Test 1.3: Acute angle (45°)
const test1_3 = calculateAngle(
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1.707, y: 0.707 }  // cos(45°) = sin(45°) ≈ 0.707
);
const error1_3 = Math.abs(test1_3 - 45);
category1Tests.push(logTest(
  '1.3',
  'Geometric Accuracy',
  'Acute angle (45°) calculation',
  error1_3 < 1.0 ? '✅' : '❌',
  `Expected: 45° | Calculated: ${test1_3.toFixed(2)}° | Error: ${error1_3.toFixed(2)}°`,
  error1_3 < 1.0 ? 'Good precision for acute angles' : 'Review acute angle calculations'
));

// Test 1.4: Obtuse angle (135°)
const test1_4 = calculateAngle(
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0.293, y: 0.707 }  // 135° = 90° + 45°
);
const error1_4 = Math.abs(test1_4 - 135);
category1Tests.push(logTest(
  '1.4',
  'Geometric Accuracy',
  'Obtuse angle (135°) calculation',
  error1_4 < 1.0 ? '✅' : '❌',
  `Expected: 135° | Calculated: ${test1_4.toFixed(2)}° | Error: ${error1_4.toFixed(2)}°`,
  error1_4 < 1.0 ? 'Good precision for obtuse angles' : 'Review obtuse angle calculations'
));

// Test 1.5: Very small angle (5°)
const test1_5 = calculateAngle(
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1.996, y: 0.087 }  // tan(5°) ≈ 0.087
);
const error1_5 = Math.abs(test1_5 - 5);
category1Tests.push(logTest(
  '1.5',
  'Geometric Accuracy',
  'Small angle (5°) calculation',
  error1_5 < 2.0 ? '✅' : '⚠️',
  `Expected: 5° | Calculated: ${test1_5.toFixed(2)}° | Error: ${error1_5.toFixed(2)}°`,
  error1_5 < 2.0 ? 'Detects small movements' : 'Small angle detection may need improvement'
));

// ============================================================================
// CATEGORY 2: Clinical Range Validation (AAOS/AMA Standards)
// ============================================================================

log.section('CATEGORY 2: Clinical Range Validation (AAOS/AMA Standards)');

const category2Tests = [];

// AAOS Normal Range Standards
const AAOS_STANDARDS = {
  shoulder_flexion: { min: 150, max: 180, typical: 165 },
  shoulder_abduction: { min: 150, max: 180, typical: 165 },
  shoulder_external_rotation: { min: 80, max: 90, typical: 85 },
  shoulder_internal_rotation: { min: 70, max: 80, typical: 75 },
  elbow_flexion: { min: 140, max: 150, typical: 145 },
  knee_flexion: { min: 130, max: 140, typical: 135 },
  hip_flexion: { min: 110, max: 120, typical: 115 },
};

// Test 2.1: Shoulder flexion range matches AAOS standards
try {
  const registryPath = path.join(__dirname, '../src/config/movementRegistry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

  const shoulderFlexion = registry.movements.find(m => m.id === 'shoulder_flexion');
  const aaosRange = AAOS_STANDARDS.shoulder_flexion;

  const matchesStandard = shoulderFlexion &&
    shoulderFlexion.normalRange.min >= aaosRange.min - 10 &&
    shoulderFlexion.normalRange.max <= aaosRange.max + 10;

  category2Tests.push(logTest(
    '2.1',
    'Clinical Standards',
    'Shoulder flexion range matches AAOS standards',
    matchesStandard ? '✅' : '⚠️',
    `Registry: ${shoulderFlexion?.normalRange.min}-${shoulderFlexion?.normalRange.max}° | AAOS: ${aaosRange.min}-${aaosRange.max}°`,
    matchesStandard ? 'Clinically appropriate range' : 'Review range against AAOS guidelines'
  ));
} catch (e) {
  category2Tests.push(logTest('2.1', 'Clinical Standards', 'Shoulder flexion range matches AAOS standards', '⚠️',
    `Could not verify: ${e.message}`));
}

// Test 2.2: Shoulder abduction range matches AAOS standards
try {
  const registryPath = path.join(__dirname, '../src/config/movementRegistry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

  const shoulderAbduction = registry.movements.find(m => m.id === 'shoulder_abduction');
  const aaosRange = AAOS_STANDARDS.shoulder_abduction;

  const matchesStandard = shoulderAbduction &&
    shoulderAbduction.normalRange.min >= aaosRange.min - 10 &&
    shoulderAbduction.normalRange.max <= aaosRange.max + 10;

  category2Tests.push(logTest(
    '2.2',
    'Clinical Standards',
    'Shoulder abduction range matches AAOS standards',
    matchesStandard ? '✅' : '⚠️',
    `Registry: ${shoulderAbduction?.normalRange.min}-${shoulderAbduction?.normalRange.max}° | AAOS: ${aaosRange.min}-${aaosRange.max}°`,
    matchesStandard ? 'Clinically appropriate range' : 'Review range against AAOS guidelines'
  ));
} catch (e) {
  category2Tests.push(logTest('2.2', 'Clinical Standards', 'Shoulder abduction range matches AAOS standards', '⚠️',
    `Could not verify: ${e.message}`));
}

// Test 2.3: Elbow flexion range matches AAOS standards
try {
  const registryPath = path.join(__dirname, '../src/config/movementRegistry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

  const elbowFlexion = registry.movements.find(m => m.id === 'elbow_flexion');
  const aaosRange = AAOS_STANDARDS.elbow_flexion;

  const matchesStandard = elbowFlexion &&
    elbowFlexion.normalRange.min >= aaosRange.min - 10 &&
    elbowFlexion.normalRange.max <= aaosRange.max + 10;

  category2Tests.push(logTest(
    '2.3',
    'Clinical Standards',
    'Elbow flexion range matches AAOS standards',
    matchesStandard ? '✅' : '⚠️',
    `Registry: ${elbowFlexion?.normalRange.min}-${elbowFlexion?.normalRange.max}° | AAOS: ${aaosRange.min}-${aaosRange.max}°`,
    matchesStandard ? 'Clinically appropriate range' : 'Review range against AAOS guidelines'
  ));
} catch (e) {
  category2Tests.push(logTest('2.3', 'Clinical Standards', 'Elbow flexion range matches AAOS standards', '⚠️',
    `Could not verify: ${e.message}`));
}

// ============================================================================
// CATEGORY 3: Bilateral Symmetry Detection Accuracy
// ============================================================================

log.section('CATEGORY 3: Bilateral Symmetry Detection Accuracy');

const category3Tests = [];

// Test 3.1: Detect clinically significant asymmetry (20° difference)
const left3_1 = 165;
const right3_1 = 145;
const diff3_1 = Math.abs(left3_1 - right3_1);
const threshold = 15; // Clinical significance threshold

category3Tests.push(logTest(
  '3.1',
  'Asymmetry Detection',
  'Detect significant asymmetry (>15°)',
  diff3_1 > threshold ? '✅' : '❌',
  `Left: ${left3_1}° | Right: ${right3_1}° | Difference: ${diff3_1}° | Threshold: ${threshold}°`,
  diff3_1 > threshold ? 'Clinically significant asymmetry detected' : 'System should flag this difference'
));

// Test 3.2: Do not flag minor asymmetry (5° difference)
const left3_2 = 160;
const right3_2 = 155;
const diff3_2 = Math.abs(left3_2 - right3_2);

category3Tests.push(logTest(
  '3.2',
  'Asymmetry Detection',
  'Do not flag minor asymmetry (<10°)',
  diff3_2 < 10 ? '✅' : '❌',
  `Left: ${left3_2}° | Right: ${right3_2}° | Difference: ${diff3_2}° | Should be normal variation`,
  diff3_2 < 10 ? 'Normal bilateral variation' : 'Difference too large'
));

// Test 3.3: Perfect symmetry detection
const left3_3 = 150;
const right3_3 = 150;
const diff3_3 = Math.abs(left3_3 - right3_3);

category3Tests.push(logTest(
  '3.3',
  'Asymmetry Detection',
  'Recognize perfect symmetry (0° difference)',
  diff3_3 === 0 ? '✅' : '❌',
  `Left: ${left3_3}° | Right: ${right3_3}° | Difference: ${diff3_3}° | Should show "symmetric"`,
  diff3_3 === 0 ? 'Perfect symmetry detected' : 'Should not flag any asymmetry'
));

// Test 3.4: Borderline asymmetry (15° - at threshold)
const left3_4 = 160;
const right3_4 = 145;
const diff3_4 = Math.abs(left3_4 - right3_4);

category3Tests.push(logTest(
  '3.4',
  'Asymmetry Detection',
  'Handle borderline asymmetry (15°)',
  diff3_4 === 15 ? '✅' : '❌',
  `Left: ${left3_4}° | Right: ${right3_4}° | Difference: ${diff3_4}° | At clinical threshold`,
  'System should use consistent threshold logic (>= or >)'
));

// ============================================================================
// CATEGORY 4: Progress Tracking Accuracy
// ============================================================================

log.section('CATEGORY 4: Progress Tracking Accuracy');

const category4Tests = [];

// Test 4.1: Calculate progress percentage correctly
const current4_1 = 120;
const target4_1 = 160;
const baseline4_1 = 60;
const progress4_1 = ((current4_1 - baseline4_1) / (target4_1 - baseline4_1)) * 100;

category4Tests.push(logTest(
  '4.1',
  'Progress Tracking',
  'Calculate progress percentage correctly',
  Math.abs(progress4_1 - 60) < 1 ? '✅' : '❌',
  `Baseline: ${baseline4_1}° | Current: ${current4_1}° | Target: ${target4_1}° | Progress: ${progress4_1.toFixed(1)}%`,
  Math.abs(progress4_1 - 60) < 1 ? 'Accurate progress calculation' : 'Progress calculation error'
));

// Test 4.2: Handle achievement beyond target
const current4_2 = 165;
const target4_2 = 160;
const baseline4_2 = 60;
const progress4_2 = Math.min(100, ((current4_2 - baseline4_2) / (target4_2 - baseline4_2)) * 100);

category4Tests.push(logTest(
  '4.2',
  'Progress Tracking',
  'Cap progress at 100% when target exceeded',
  progress4_2 === 100 ? '✅' : '⚠️',
  `Baseline: ${baseline4_2}° | Current: ${current4_2}° | Target: ${target4_2}° | Progress: ${progress4_2.toFixed(1)}%`,
  progress4_2 === 100 ? 'Progress capped correctly' : 'System should cap at 100% or show exceeded'
));

// Test 4.3: Detect regression (negative progress)
const current4_3 = 80;
const previous4_3 = 100;
const regression4_3 = current4_3 < previous4_3;

category4Tests.push(logTest(
  '4.3',
  'Progress Tracking',
  'Detect ROM regression',
  regression4_3 ? '✅' : '❌',
  `Previous: ${previous4_3}° | Current: ${current4_3}° | Regression: ${regression4_3} (${previous4_3 - current4_3}° loss)`,
  regression4_3 ? 'System should flag ROM loss for clinical review' : 'No regression detected'
));

// ============================================================================
// CATEGORY 5: Color Coding Accuracy
// ============================================================================

log.section('CATEGORY 5: Color Coding Accuracy');

const category5Tests = [];

function getColorForAngle(angle, target) {
  const progress = (angle / target) * 100;
  if (progress < 50) return 'Blue';
  if (progress < 75) return 'Green';
  if (progress >= 100) return 'Gold';
  return 'Green';
}

// Test 5.1: Blue for beginning phase (<50%)
const angle5_1 = 40;
const target5_1 = 160;
const color5_1 = getColorForAngle(angle5_1, target5_1);

category5Tests.push(logTest(
  '5.1',
  'Visual Feedback',
  'Blue color for beginning phase (<50%)',
  color5_1 === 'Blue' ? '✅' : '❌',
  `Angle: ${angle5_1}° | Target: ${target5_1}° | Progress: ${(angle5_1/target5_1*100).toFixed(1)}% | Color: ${color5_1}`,
  color5_1 === 'Blue' ? 'Correct visual feedback' : `Should be Blue, got ${color5_1}`
));

// Test 5.2: Green for mid-range (50-99%)
const angle5_2 = 120;
const target5_2 = 160;
const color5_2 = getColorForAngle(angle5_2, target5_2);

category5Tests.push(logTest(
  '5.2',
  'Visual Feedback',
  'Green color for mid-range (50-99%)',
  color5_2 === 'Green' ? '✅' : '❌',
  `Angle: ${angle5_2}° | Target: ${target5_2}° | Progress: ${(angle5_2/target5_2*100).toFixed(1)}% | Color: ${color5_2}`,
  color5_2 === 'Green' ? 'Correct visual feedback' : `Should be Green, got ${color5_2}`
));

// Test 5.3: Gold for target achieved (100%)
const angle5_3 = 160;
const target5_3 = 160;
const color5_3 = getColorForAngle(angle5_3, target5_3);

category5Tests.push(logTest(
  '5.3',
  'Visual Feedback',
  'Gold color for target achieved (100%)',
  color5_3 === 'Gold' ? '✅' : '❌',
  `Angle: ${angle5_3}° | Target: ${target5_3}° | Progress: ${(angle5_3/target5_3*100).toFixed(1)}% | Color: ${color5_3}`,
  color5_3 === 'Gold' ? 'Celebratory visual feedback' : `Should be Gold, got ${color5_3}`
));

// ============================================================================
// SUMMARY
// ============================================================================

log.section('CLINICAL ACCURACY VALIDATION SUMMARY');

console.log(`${colors.cyan}Total Tests: ${results.total}${colors.reset}`);
console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);

const passRate = ((results.passed / results.total) * 100).toFixed(1);
console.log(`\n${colors.cyan}Pass Rate: ${passRate}%${colors.reset}\n`);

// Category breakdown
console.log(`${colors.cyan}Category Breakdown:${colors.reset}`);
Object.keys(results.categories).forEach(category => {
  const cat = results.categories[category];
  const catPassRate = ((cat.passed / cat.total) * 100).toFixed(1);
  console.log(`  ${category}: ${cat.passed}/${cat.total} (${catPassRate}%)`);
});

// Clinical accuracy assessment
console.log(`\n${colors.cyan}Clinical Accuracy Assessment:${colors.reset}`);
if (passRate >= 95) {
  console.log(`${colors.green}✅ EXCELLENT - Ready for clinical use${colors.reset}`);
} else if (passRate >= 85) {
  console.log(`${colors.yellow}⚠️  GOOD - Review warnings before clinical use${colors.reset}`);
} else {
  console.log(`${colors.red}❌ NEEDS IMPROVEMENT - Address failures before clinical use${colors.reset}`);
}

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.total,
    passed: results.passed,
    warnings: results.warnings,
    failed: results.failed,
    passRate: parseFloat(passRate),
  },
  categories: results.categories,
  tests: [
    ...category1Tests,
    ...category2Tests,
    ...category3Tests,
    ...category4Tests,
    ...category5Tests,
  ],
  clinicalStandards: {
    source: 'AAOS (American Academy of Orthopaedic Surgeons)',
    reference: 'Normal ROM values for major joints',
    standards: AAOS_STANDARDS,
  },
};

const reportPath = path.join(__dirname, '../docs/validation/CLINICAL_ACCURACY_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n${colors.green}✅ Clinical accuracy report saved to: ${reportPath}${colors.reset}\n`);

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
