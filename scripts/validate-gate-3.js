#!/usr/bin/env node

/**
 * Gate 3 Validation: Audio Feedback Cleanup
 *
 * Validates that audio feedback service properly stores and removes
 * event listeners without calling non-existent removeAllListeners API.
 */

const fs = require('fs');
const path = require('path');

console.log('🚪 Validating GATE 3: Audio Feedback Cleanup\n');

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

// Read audioFeedbackService.ts
const servicePath = path.join(__dirname, '../src/services/audioFeedbackService.ts');

if (!fs.existsSync(servicePath)) {
  console.log('❌ CRITICAL: audioFeedbackService.ts not found');
  process.exit(1);
}

const serviceCode = fs.readFileSync(servicePath, 'utf8');

console.log('Checking audio feedback listener management...\n');

// Test 1: Verify listener references are stored
const hasListenerReferences =
  serviceCode.includes('private ttsStartListener') &&
  serviceCode.includes('private ttsFinishListener') &&
  serviceCode.includes('private ttsCancelListener');

checkCriterion(
  'Stores references to TTS event listeners',
  hasListenerReferences,
  'Should have private fields for ttsStartListener, ttsFinishListener, ttsCancelListener'
);

// Test 2: Verify listeners are arrow functions stored in fields
const assignsListenerFunctions =
  serviceCode.includes('this.ttsStartListener = () =>') &&
  serviceCode.includes('this.ttsFinishListener = () =>') &&
  serviceCode.includes('this.ttsCancelListener = () =>');

checkCriterion(
  'Assigns listener functions to private fields',
  assignsListenerFunctions,
  'Should assign arrow functions to listener fields in initializeTTS'
);

// Test 3: Verify addEventListener uses stored references
const usesStoredReferences =
  serviceCode.includes("Tts.addEventListener('tts-start', this.ttsStartListener)") &&
  serviceCode.includes("Tts.addEventListener('tts-finish', this.ttsFinishListener)") &&
  serviceCode.includes("Tts.addEventListener('tts-cancel', this.ttsCancelListener)");

checkCriterion(
  'addEventListener uses stored listener references',
  usesStoredReferences,
  'Should pass stored listener references to addEventListener'
);

// Test 4: Verify removeAllListeners is NOT called
const noRemoveAllListeners = !serviceCode.includes('Tts.removeAllListeners()');

checkCriterion(
  'Does not call Tts.removeAllListeners()',
  noRemoveAllListeners,
  'removeAllListeners() API does not exist - must use removeEventListener'
);

// Test 5: Verify removeEventListener is called for each listener
const removesIndividualListeners =
  serviceCode.includes("Tts.removeEventListener('tts-start', this.ttsStartListener)") &&
  serviceCode.includes("Tts.removeEventListener('tts-finish', this.ttsFinishListener)") &&
  serviceCode.includes("Tts.removeEventListener('tts-cancel', this.ttsCancelListener)");

checkCriterion(
  'Removes listeners individually with removeEventListener',
  removesIndividualListeners,
  'cleanup() should call removeEventListener for each listener'
);

// Test 6: Verify null checks before removing
const hasNullChecks =
  serviceCode.includes('if (this.ttsStartListener)') &&
  serviceCode.includes('if (this.ttsFinishListener)') &&
  serviceCode.includes('if (this.ttsCancelListener)');

checkCriterion(
  'Checks for null before removing listeners',
  hasNullChecks,
  'Should check if listeners exist before calling removeEventListener'
);

// Test 7: Verify listeners are set to null after removal
const setsToNull =
  serviceCode.includes('this.ttsStartListener = null') &&
  serviceCode.includes('this.ttsFinishListener = null') &&
  serviceCode.includes('this.ttsCancelListener = null');

checkCriterion(
  'Sets listener references to null after removal',
  setsToNull,
  'Should set listener fields to null after removeEventListener to prevent double removal'
);

// Summary
console.log('\n' + '='.repeat(60));
console.log(`GATE 3 RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('✅ GATE 3 PASSED - Ready to proceed to Gate 4');
  process.exit(0);
} else {
  console.log('❌ GATE 3 FAILED - Fix issues before proceeding');
  console.log('\nRequired actions:');
  console.log('1. Store listener references as private fields');
  console.log('2. Assign arrow functions to these fields in initializeTTS');
  console.log('3. Remove Tts.removeAllListeners() call');
  console.log('4. Add individual removeEventListener calls in cleanup');
  console.log('5. Set listener references to null after removal');
  console.log('6. Re-run: npm run gate:validate:3');
  process.exit(1);
}
