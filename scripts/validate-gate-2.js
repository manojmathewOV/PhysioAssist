#!/usr/bin/env node

/**
 * Gate 2 Validation: YouTube Service Import Fix
 *
 * Validates that YouTube service correctly imports ytdl and properly
 * simulates download progress.
 */

const fs = require('fs');
const path = require('path');

console.log('🚪 Validating GATE 2: YouTube Service Import Fix\n');

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

// Read youtubeService.ts
const servicePath = path.join(
  __dirname,
  '../src/features/videoComparison/services/youtubeService.ts'
);

if (!fs.existsSync(servicePath)) {
  console.log('❌ CRITICAL: youtubeService.ts not found');
  process.exit(1);
}

const serviceCode = fs.readFileSync(servicePath, 'utf8');

console.log('Checking YouTube service import handling...\n');

// Test 1: Verify ytdl import doesn't use incorrect optional chaining
const noIncorrectOptionalChaining = !serviceCode.includes(
  "require('react-native-ytdl')?.ytdl"
);

checkCriterion(
  'ytdl import does not use incorrect optional chaining',
  noIncorrectOptionalChaining,
  "Should not use require('react-native-ytdl')?.ytdl pattern"
);

// Test 2: Verify proper try-catch for import
const hasTryCatchImport =
  serviceCode.includes('try {') &&
  serviceCode.includes("ytdl = require('react-native-ytdl')") &&
  serviceCode.includes('} catch (error)');

checkCriterion(
  'ytdl import wrapped in try-catch block',
  hasTryCatchImport,
  'Should use try-catch to safely import ytdl with fallback'
);

// Test 3: Verify fallback mock exists
const hasFallbackMock =
  serviceCode.includes('getInfo: async () =>') &&
  serviceCode.includes('videoDetails: {}');

checkCriterion(
  'Fallback mock implementation exists',
  hasFallbackMock,
  'Should provide mock implementation for development/testing'
);

// Test 4: Verify progress simulation doesn't use random values
const noRandomProgress = !serviceCode.includes('Math.random()');

checkCriterion(
  'Progress simulation does not use Math.random()',
  noRandomProgress,
  'Progress should increment predictably, not randomly'
);

// Test 5: Verify progress increments properly
const hasIncrementalProgress =
  serviceCode.includes('currentProgress = 0') &&
  serviceCode.includes('currentProgress += 0.1');

checkCriterion(
  'Progress increments with fixed step (0.1)',
  hasIncrementalProgress,
  'Progress should start at 0 and increment by 0.1'
);

// Test 6: Verify progress cleanup happens
const hasProperCleanup =
  serviceCode.includes('if (currentProgress >= 1)') &&
  serviceCode.includes('clearInterval(progressInterval)');

checkCriterion(
  'Progress interval properly cleaned up',
  hasProperCleanup,
  'Should clear interval when progress reaches 1'
);

// Test 7: Verify ytdl.default handling
const handlesDefaultExport = serviceCode.includes('if (ytdl.default)');

checkCriterion(
  'Handles ytdl.default export correctly',
  handlesDefaultExport,
  'Should check for and use .default export if present'
);

// Summary
console.log('\n' + '='.repeat(60));
console.log(`GATE 2 RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('✅ GATE 2 PASSED - Ready to proceed to Gate 3');
  process.exit(0);
} else {
  console.log('❌ GATE 2 FAILED - Fix issues before proceeding');
  console.log('\nRequired actions:');
  console.log('1. Fix ytdl import in youtubeService.ts');
  console.log('2. Use proper try-catch with fallback mock');
  console.log('3. Fix progress simulation to use incremental values');
  console.log('4. Ensure proper cleanup of progress interval');
  console.log('5. Re-run: npm run gate:validate:2');
  process.exit(1);
}
