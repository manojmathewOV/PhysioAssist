#!/usr/bin/env node

/**
 * Gate 1 Validation: Comparison Analysis Bilateral Logic
 *
 * Validates that comparison analysis service correctly handles bilateral joints
 * and has no left-side bias.
 */

const fs = require('fs');
const path = require('path');

console.log('🚪 Validating GATE 1: Comparison Analysis Bilateral Logic\n');

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

// Read comparisonAnalysisService.ts
const servicePath = path.join(__dirname, '../src/features/videoComparison/services/comparisonAnalysisService.ts');

if (!fs.existsSync(servicePath)) {
  console.log('❌ CRITICAL: comparisonAnalysisService.ts not found');
  process.exit(1);
}

const serviceCode = fs.readFileSync(servicePath, 'utf8');

console.log('Checking bilateral joint handling...\n');

// Test 1: Verify CRITICAL_JOINTS uses bilateral names
const hasBilateralJoints =
  serviceCode.includes("'leftElbow'") &&
  serviceCode.includes("'rightElbow'") &&
  serviceCode.includes("'leftShoulder'") &&
  serviceCode.includes("'rightShoulder'") &&
  serviceCode.includes("'leftKnee'") &&
  serviceCode.includes("'rightKnee'") &&
  serviceCode.includes("'leftHip'") &&
  serviceCode.includes("'rightHip'");

checkCriterion(
  'CRITICAL_JOINTS array includes bilateral joint names',
  hasBilateralJoints,
  'Expected: leftElbow, rightElbow, leftShoulder, rightShoulder, leftKnee, rightKnee, leftHip, rightHip'
);

// Test 2: Verify extractJointAngles doesn't hard-code 'left' prefix
const noHardcodedLeft = !serviceCode.match(/left\$\{joint\.charAt/);

checkCriterion(
  'extractJointAngles does not hard-code "left" prefix',
  noHardcodedLeft,
  'extractJointAngles should use joint name directly, not prepend "left"'
);

// Test 3: Verify tempo ratio is not inverted
const noInvertedRatio = !serviceCode.includes('speedRatio: 1 / speedRatio');

checkCriterion(
  'Tempo speedRatio is not inverted',
  noInvertedRatio,
  'speedRatio should be userDuration / refDuration (not inverted with 1 / speedRatio)'
);

// Test 4: Verify tempo recommendations use correct logic
const correctTempoLogic =
  serviceCode.includes('speedRatio > 1.2') &&
  serviceCode.includes("message: 'Speed up your movement'") &&
  serviceCode.includes('speedRatio < 0.8') &&
  serviceCode.includes("message: 'Slow down your movement'");

checkCriterion(
  'Tempo recommendations use correct speedRatio logic',
  correctTempoLogic,
  'speedRatio > 1 should say "Speed up", speedRatio < 1 should say "Slow down"'
);

// Test 5: Verify calculatePoseSimilarity doesn't construct 'left' prefixed keys
const noLeftPrefixInSimilarity = !serviceCode.match(/const key = `left\$\{joint/);

checkCriterion(
  'calculatePoseSimilarity does not construct "left" prefixed keys',
  noLeftPrefixInSimilarity,
  'calculatePoseSimilarity should use joint names directly'
);

// Test 6: Verify detectMovementPhases doesn't only use leftElbow
const noOnlyLeftElbow = !serviceCode.match(/poses\[i - 1\]\.angles\?\.leftElbow \|\| 0;\s+const curr = poses\[i\]\.angles\?\.leftElbow/);

checkCriterion(
  'detectMovementPhases does not only use leftElbow',
  noOnlyLeftElbow,
  'detectMovementPhases should use multiple joints for phase detection'
);

// Test 7: Verify exercise-specific recommendations use bilateral joint checks
const bilateralExerciseChecks =
  serviceCode.includes("d.joint === 'leftKnee' || d.joint === 'rightKnee'") &&
  serviceCode.includes("d.joint === 'leftElbow' || d.joint === 'rightElbow'");

checkCriterion(
  'Exercise-specific recommendations check bilateral joints',
  bilateralExerciseChecks,
  'Squat and bicep curl checks should look for both left and right joints'
);

// Test 8: Verify getAngleCorrection handles bilateral joint names
const handlesBaseLookup = serviceCode.includes("deviation.joint.replace(/^(left|right)/, '')");

checkCriterion(
  'getAngleCorrection extracts base joint name for lookups',
  handlesBaseLookup,
  'Should strip left/right prefix to look up correction messages'
);

// Summary
console.log('\n' + '='.repeat(60));
console.log(`GATE 1 RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('✅ GATE 1 PASSED - Ready to proceed to Gate 2');
  process.exit(0);
} else {
  console.log('❌ GATE 1 FAILED - Fix issues before proceeding');
  console.log('\nRequired actions:');
  console.log('1. Fix bilateral joint handling in comparisonAnalysisService.ts');
  console.log('2. Remove any hard-coded "left" prefixes');
  console.log('3. Fix tempo ratio calculation and recommendations');
  console.log('4. Update exercise-specific logic to check both sides');
  console.log('5. Re-run: npm run gate:validate:1');
  process.exit(1);
}
