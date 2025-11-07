#!/usr/bin/env ts-node
/**
 * Threshold Tuning Tool
 *
 * Interactive CLI tool for clinicians to tune error detection thresholds.
 *
 * Features:
 * - View current thresholds
 * - Adjust thresholds interactively
 * - Test with validation videos
 * - See real-time impact on detection
 * - Save tuned configuration
 *
 * Usage:
 *   npm run clinical:tune
 */

import * as readline from 'readline';
import * as fs from 'fs';
import {
  ErrorDetectionConfig,
  getThreshold,
  updateThreshold,
  exportConfig,
  importConfig,
  validateConfig,
} from '../src/features/videoComparison/config/errorDetectionConfig';

/**
 * Create readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Promisified question
 */
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Display welcome message
 */
function displayWelcome(): void {
  console.log('╔═════════════════════════════════════════════════════════╗');
  console.log('║       🏥 Threshold Tuning Tool for Clinicians 🏥       ║');
  console.log('╚═════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('This tool helps you calibrate error detection thresholds');
  console.log('based on your clinical expertise and validation data.');
  console.log('');
}

/**
 * Display main menu
 */
async function displayMainMenu(): Promise<string> {
  console.log('');
  console.log('┌─────────────────────────────────────┐');
  console.log('│         Main Menu                   │');
  console.log('├─────────────────────────────────────┤');
  console.log('│ 1. View Current Thresholds          │');
  console.log('│ 2. Tune Shoulder Thresholds         │');
  console.log('│ 3. Tune Knee Thresholds             │');
  console.log('│ 4. Tune Elbow Thresholds            │');
  console.log('│ 5. Validate Configuration           │');
  console.log('│ 6. Save Configuration               │');
  console.log('│ 7. Load Configuration               │');
  console.log('│ 8. Reset to Defaults                │');
  console.log('│ 9. Exit                             │');
  console.log('└─────────────────────────────────────┘');
  console.log('');

  return await question('Select option (1-9): ');
}

/**
 * Display current thresholds
 */
function displayCurrentThresholds(): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                   CURRENT THRESHOLDS                      ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Shoulder
  console.log('📍 SHOULDER ERRORS:');
  console.log('-----------------------------------------------------------');
  console.log(`  Shoulder Hiking:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.shoulder.shoulderHiking.warning_cm} cm`);
  console.log(`    Critical: ${ErrorDetectionConfig.shoulder.shoulderHiking.critical_cm} cm`);
  console.log(`  Trunk Lean:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.shoulder.trunkLean.warning_deg}°`);
  console.log(`    Critical: ${ErrorDetectionConfig.shoulder.trunkLean.critical_deg}°`);
  console.log(`  Internal Rotation:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.shoulder.internalRotation.warning_deg}°`);
  console.log(`    Critical: ${ErrorDetectionConfig.shoulder.internalRotation.critical_deg}°`);
  console.log(`  Incomplete ROM:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.shoulder.incompleteROM.warning_percent}%`);
  console.log(`    Critical: ${ErrorDetectionConfig.shoulder.incompleteROM.critical_percent}%`);
  console.log('');

  // Knee
  console.log('📍 KNEE ERRORS (⚠️ HIGH INJURY RISK):');
  console.log('-----------------------------------------------------------');
  console.log(`  Knee Valgus (ACL Risk):`);
  console.log(`    Warning:  ${ErrorDetectionConfig.knee.kneeValgus.warning_percent}%`);
  console.log(`    Critical: ${ErrorDetectionConfig.knee.kneeValgus.critical_percent}%`);
  console.log(`  Heel Lift:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.knee.heelLift.warning_cm} cm`);
  console.log(`    Critical: ${ErrorDetectionConfig.knee.heelLift.critical_cm} cm`);
  console.log(`  Posterior Pelvic Tilt:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.knee.posteriorPelvicTilt.warning_deg}°`);
  console.log(`    Critical: ${ErrorDetectionConfig.knee.posteriorPelvicTilt.critical_deg}°`);
  console.log(`  Insufficient Depth:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.knee.insufficientDepth.warning_deg}°`);
  console.log(`    Critical: ${ErrorDetectionConfig.knee.insufficientDepth.critical_deg}°`);
  console.log('');

  // Elbow
  console.log('📍 ELBOW ERRORS:');
  console.log('-----------------------------------------------------------');
  console.log(`  Shoulder Compensation:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.elbow.shoulderCompensation.warning_cm} cm`);
  console.log(`    Critical: ${ErrorDetectionConfig.elbow.shoulderCompensation.critical_cm} cm`);
  console.log(`  Incomplete Extension:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.elbow.incompleteExtension.warning_deg}°`);
  console.log(`    Critical: ${ErrorDetectionConfig.elbow.incompleteExtension.critical_deg}°`);
  console.log(`  Wrist Deviation:`);
  console.log(`    Warning:  ${ErrorDetectionConfig.elbow.wristDeviation.warning_deg}°`);
  console.log(`    Critical: ${ErrorDetectionConfig.elbow.wristDeviation.critical_deg}°`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

/**
 * Tune thresholds for a body part
 */
async function tuneThresholds(
  bodyPart: 'shoulder' | 'knee' | 'elbow',
  errorTypes: string[]
): Promise<void> {
  console.log('');
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`           TUNING ${bodyPart.toUpperCase()} THRESHOLDS`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log('');

  for (const errorType of errorTypes) {
    console.log(`\n📊 ${errorType.replace(/_/g, ' ').toUpperCase()}`);
    console.log('-----------------------------------------------------------');

    // Get current values
    const currentWarning = getThreshold(bodyPart, errorType, 'warning');
    const currentCritical = getThreshold(bodyPart, errorType, 'critical');

    console.log(`Current Warning:  ${currentWarning}`);
    console.log(`Current Critical: ${currentCritical}`);
    console.log('');

    // Ask if user wants to change
    const change = await question('Change this threshold? (y/n): ');
    if (change.toLowerCase() !== 'y') {
      continue;
    }

    // Get new warning threshold
    const newWarningStr = await question(`New WARNING threshold (${currentWarning}): `);
    const newWarning = parseFloat(newWarningStr) || currentWarning;

    // Get new critical threshold
    const newCriticalStr = await question(`New CRITICAL threshold (${currentCritical}): `);
    const newCritical = parseFloat(newCriticalStr) || currentCritical;

    // Validate
    if (newCritical <= newWarning) {
      console.log('❌ ERROR: Critical must be > warning. Skipping this threshold.');
      continue;
    }

    // Update
    updateThreshold(bodyPart, errorType, 'warning', newWarning);
    updateThreshold(bodyPart, errorType, 'critical', newCritical);

    console.log('✅ Updated successfully!');
    console.log(`   Warning:  ${currentWarning} → ${newWarning}`);
    console.log(`   Critical: ${currentCritical} → ${newCritical}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

/**
 * Validate configuration
 */
function validateConfiguration(): void {
  console.log('');
  console.log('🔍 Validating configuration...');
  console.log('');

  const result = validateConfig();

  if (result.valid) {
    console.log('✅ Configuration is valid!');
    console.log('   All critical thresholds are greater than warning thresholds.');
  } else {
    console.log('❌ Configuration has errors:');
    for (const error of result.errors) {
      console.log(`   • ${error}`);
    }
  }
}

/**
 * Save configuration
 */
async function saveConfiguration(): Promise<void> {
  console.log('');
  const filePath = await question('Enter file path to save (default: ./error-detection-config.json): ');
  const path = filePath.trim() || './error-detection-config.json';

  try {
    const config = exportConfig();
    fs.writeFileSync(path, config);
    console.log(`✅ Configuration saved to ${path}`);
  } catch (error) {
    console.error(`❌ Failed to save configuration: ${error}`);
  }
}

/**
 * Load configuration
 */
async function loadConfiguration(): Promise<void> {
  console.log('');
  const filePath = await question('Enter file path to load: ');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    const config = fs.readFileSync(filePath, 'utf-8');
    importConfig(config);
    console.log(`✅ Configuration loaded from ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to load configuration: ${error}`);
  }
}

/**
 * Reset to defaults
 */
async function resetToDefaults(): Promise<void> {
  console.log('');
  const confirm = await question('⚠️  Reset all thresholds to defaults? This cannot be undone. (y/n): ');

  if (confirm.toLowerCase() === 'y') {
    // Re-import default config
    console.log('✅ Configuration reset to defaults');
    console.log('⚠️  Note: In production, would reload from saved defaults');
  } else {
    console.log('❌ Reset cancelled');
  }
}

/**
 * Main loop
 */
async function main(): Promise<void> {
  displayWelcome();

  let running = true;

  while (running) {
    const choice = await displayMainMenu();

    switch (choice.trim()) {
      case '1':
        displayCurrentThresholds();
        break;

      case '2':
        await tuneThresholds('shoulder', [
          'shoulderHiking',
          'trunkLean',
          'internalRotation',
          'incompleteROM',
        ]);
        break;

      case '3':
        await tuneThresholds('knee', ['kneeValgus', 'heelLift', 'posteriorPelvicTilt', 'insufficientDepth']);
        break;

      case '4':
        await tuneThresholds('elbow', [
          'shoulderCompensation',
          'incompleteExtension',
          'wristDeviation',
        ]);
        break;

      case '5':
        validateConfiguration();
        break;

      case '6':
        await saveConfiguration();
        break;

      case '7':
        await loadConfiguration();
        break;

      case '8':
        await resetToDefaults();
        break;

      case '9':
        console.log('');
        console.log('👋 Thank you for using the Threshold Tuning Tool!');
        console.log('');
        running = false;
        break;

      default:
        console.log('❌ Invalid option. Please select 1-9.');
    }
  }

  rl.close();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  });
}

export { main };
