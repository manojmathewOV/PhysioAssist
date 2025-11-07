#!/usr/bin/env node

/**
 * Gate 0 Validation: Baseline Pose Integrity
 *
 * Validates that MoveNet keypoint indices are correct and
 * no MediaPipe indices remain in the codebase.
 */

const fs = require('fs');
const path = require('path');

console.log('🚪 Validating GATE 0: Baseline Pose Integrity\n');

let passed = 0;
let failed = 0;

function checkCriterion(name, condition, errorMsg) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${name}`);
    if (errorMsg) console.log(`   ${errorMsg}`);
    failed++;
    return false;
  }
}

// Read goniometerService.ts
const goniometerPath = path.join(__dirname, '../src/services/goniometerService.ts');

if (!fs.existsSync(goniometerPath)) {
  console.log('❌ CRITICAL: goniometerService.ts not found');
  process.exit(1);
}

const goniometerCode = fs.readFileSync(goniometerPath, 'utf8');

console.log('Checking MoveNet keypoint indices...\n');

// Test 1: Verify correct elbow indices
const hasCorrectLeftElbow = goniometerCode.includes("{ name: 'left_elbow', indices: [5, 7, 9] }");
const hasCorrectRightElbow = goniometerCode.includes("{ name: 'right_elbow', indices: [6, 8, 10] }");

checkCriterion(
  'Left elbow uses correct MoveNet indices [5, 7, 9]',
  hasCorrectLeftElbow,
  'Expected: [5, 7, 9] (shoulder-elbow-wrist)'
);

checkCriterion(
  'Right elbow uses correct MoveNet indices [6, 8, 10]',
  hasCorrectRightElbow,
  'Expected: [6, 8, 10] (shoulder-elbow-wrist)'
);

// Test 2: Verify correct shoulder indices
const hasCorrectLeftShoulder = goniometerCode.includes("{ name: 'left_shoulder', indices: [7, 5, 11] }");
const hasCorrectRightShoulder = goniometerCode.includes("{ name: 'right_shoulder', indices: [8, 6, 12] }");

checkCriterion(
  'Left shoulder uses correct MoveNet indices [7, 5, 11]',
  hasCorrectLeftShoulder,
  'Expected: [7, 5, 11] (elbow-shoulder-hip)'
);

checkCriterion(
  'Right shoulder uses correct MoveNet indices [8, 6, 12]',
  hasCorrectRightShoulder,
  'Expected: [8, 6, 12] (elbow-shoulder-hip)'
);

// Test 3: Verify correct knee indices
const hasCorrectLeftKnee = goniometerCode.includes("{ name: 'left_knee', indices: [11, 13, 15] }");
const hasCorrectRightKnee = goniometerCode.includes("{ name: 'right_knee', indices: [12, 14, 16] }");

checkCriterion(
  'Left knee uses correct MoveNet indices [11, 13, 15]',
  hasCorrectLeftKnee,
  'Expected: [11, 13, 15] (hip-knee-ankle)'
);

checkCriterion(
  'Right knee uses correct MoveNet indices [12, 14, 16]',
  hasCorrectRightKnee,
  'Expected: [12, 14, 16] (hip-knee-ankle)'
);

// Test 4: Verify no invalid indices (MediaPipe indices like 23, 24, 25, etc.)
const invalidIndices = [23, 24, 25, 26, 27, 28, 31, 32];
let foundInvalidIndices = [];

for (const idx of invalidIndices) {
  const regex = new RegExp(`indices:\\s*\\[[^\\]]*${idx}[^\\]]*\\]`, 'g');
  if (regex.test(goniometerCode)) {
    foundInvalidIndices.push(idx);
  }
}

checkCriterion(
  'No invalid MoveNet indices found (max is 16)',
  foundInvalidIndices.length === 0,
  foundInvalidIndices.length > 0 ? `Found invalid indices: ${foundInvalidIndices.join(', ')}` : null
);

// Test 5: Verify hip and ankle are removed (not supported by MoveNet)
const hasHipJoint = goniometerCode.includes("{ name: 'left_hip'") || goniometerCode.includes("{ name: 'right_hip'");
const hasAnkleJoint = goniometerCode.includes("{ name: 'left_ankle'") || goniometerCode.includes("{ name: 'right_ankle'");

checkCriterion(
  'Unsupported hip joints removed',
  !hasHipJoint,
  'Hip joints should be removed (MoveNet lacks required keypoints)'
);

checkCriterion(
  'Unsupported ankle joints removed',
  !hasAnkleJoint,
  'Ankle joints should be removed (MoveNet lacks required keypoints)'
);

// Summary
console.log('\n' + '='.repeat(60));
console.log(`GATE 0 RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('✅ GATE 0 PASSED - Ready to proceed to Gate 1');
  process.exit(0);
} else {
  console.log('❌ GATE 0 FAILED - Fix issues before proceeding');
  console.log('\nRequired actions:');
  console.log('1. Fix keypoint indices in src/services/goniometerService.ts');
  console.log('2. Ensure all indices are 0-16 (MoveNet 17-keypoint model)');
  console.log('3. Remove unsupported joint configurations');
  console.log('4. Re-run: npm run gate:validate:0');
  process.exit(1);
}
