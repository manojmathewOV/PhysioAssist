#!/usr/bin/env ts-node
/**
 * Clinical Validation Harness
 *
 * Tool for clinicians to validate error detection algorithms with real videos.
 *
 * Usage:
 *   npm run clinical:validate -- --reference ./videos/ref.mp4 --user ./videos/user.mp4 --exercise shoulder_abduction
 *
 * Output:
 *   - Detected errors with timestamps
 *   - False positive/negative analysis (if ground truth provided)
 *   - Accuracy metrics
 *   - Suggested threshold adjustments
 */

import * as fs from 'fs';
import * as path from 'path';
import { detectAllShoulderErrors, ShoulderError } from '../src/features/videoComparison/errorDetection/shoulderErrors';
import { detectAllKneeErrors, KneeError } from '../src/features/videoComparison/errorDetection/kneeErrors';
import { detectAllElbowErrors, ElbowError } from '../src/features/videoComparison/errorDetection/elbowErrors';
import { SmartFeedbackGenerator } from '../src/features/videoComparison/services/smartFeedbackGenerator';
import { ErrorDetectionConfig } from '../src/features/videoComparison/config/errorDetectionConfig';
import { PoseFrame } from '../src/features/videoComparison/types/pose';

/**
 * Exercise types
 */
type ExerciseType = 'shoulder_abduction' | 'squat' | 'bicep_curl';

/**
 * Ground truth annotation
 */
interface GroundTruthError {
  type: string;
  severity: 'warning' | 'critical';
  side: 'left' | 'right' | 'bilateral';
  timestampStart: number;
  timestampEnd: number;
  notes?: string;
}

/**
 * Validation results
 */
interface ValidationResult {
  detectedErrors: any[];
  groundTruthErrors?: GroundTruthError[];
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  feedback: any;
  recommendations: string[];
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  referenceVideo: string;
  userVideo: string;
  exerciseType: ExerciseType;
  groundTruthFile?: string;
  outputFile?: string;
} {
  const args = process.argv.slice(2);
  const parsed: any = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reference' && args[i + 1]) {
      parsed.referenceVideo = args[i + 1];
      i++;
    } else if (args[i] === '--user' && args[i + 1]) {
      parsed.userVideo = args[i + 1];
      i++;
    } else if (args[i] === '--exercise' && args[i + 1]) {
      parsed.exerciseType = args[i + 1] as ExerciseType;
      i++;
    } else if (args[i] === '--ground-truth' && args[i + 1]) {
      parsed.groundTruthFile = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      parsed.outputFile = args[i + 1];
      i++;
    }
  }

  if (!parsed.referenceVideo || !parsed.userVideo || !parsed.exerciseType) {
    console.error('Usage: npm run clinical:validate -- --reference <path> --user <path> --exercise <type>');
    console.error('Options:');
    console.error('  --reference       Path to reference video');
    console.error('  --user            Path to user video');
    console.error('  --exercise        Exercise type (shoulder_abduction, squat, bicep_curl)');
    console.error('  --ground-truth    Optional: Path to ground truth JSON file');
    console.error('  --output          Optional: Path to save results JSON');
    process.exit(1);
  }

  return parsed;
}

/**
 * Load ground truth annotations
 */
function loadGroundTruth(filePath: string): GroundTruthError[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load ground truth file: ${error}`);
    return [];
  }
}

/**
 * Placeholder: Extract poses from video
 *
 * In real implementation, this would:
 * 1. Load video using react-native-video or ffmpeg
 * 2. Extract frames
 * 3. Run MoveNet pose detection on each frame
 * 4. Return array of PoseFrame objects
 *
 * For now, this is a stub that returns mock data.
 */
async function extractPosesFromVideo(videoPath: string): Promise<PoseFrame[]> {
  console.log(`⚠️  STUB: Would extract poses from ${videoPath}`);
  console.log('⚠️  In production, this would run MoveNet pose detection');
  console.log('⚠️  For now, returning mock pose data for testing\n');

  // Return mock data for testing the harness
  // In real implementation, this would call pose detection service
  return [];
}

/**
 * Match detected error to ground truth
 */
function matchErrorToGroundTruth(
  detected: any,
  groundTruth: GroundTruthError[]
): GroundTruthError | null {
  for (const gt of groundTruth) {
    // Match by type and time overlap
    if (
      detected.type === gt.type &&
      detected.timestamp >= gt.timestampStart &&
      detected.timestamp <= gt.timestampEnd
    ) {
      // Check if side matches (if applicable)
      if (gt.side !== 'bilateral' && detected.side !== gt.side) {
        continue;
      }
      return gt;
    }
  }
  return null;
}

/**
 * Calculate accuracy metrics
 */
function calculateMetrics(
  detectedErrors: any[],
  groundTruth: GroundTruthError[]
): {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
} {
  let truePositives = 0;
  let falsePositives = 0;

  const matchedGroundTruth = new Set<GroundTruthError>();

  // Check each detected error
  for (const detected of detectedErrors) {
    const match = matchErrorToGroundTruth(detected, groundTruth);
    if (match) {
      truePositives++;
      matchedGroundTruth.add(match);
    } else {
      falsePositives++;
    }
  }

  // False negatives = ground truth errors not detected
  const falseNegatives = groundTruth.length - matchedGroundTruth.size;

  // Calculate metrics
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = (2 * precision * recall) / (precision + recall) || 0;

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    f1Score,
  };
}

/**
 * Generate threshold adjustment recommendations
 */
function generateRecommendations(
  detectedErrors: any[],
  groundTruth: GroundTruthError[],
  metrics: any
): string[] {
  const recommendations: string[] = [];

  // High false positive rate
  if (metrics.falsePositives > metrics.truePositives) {
    recommendations.push(
      '⚠️  High false positive rate detected. Consider increasing thresholds to reduce oversensitivity.'
    );
  }

  // High false negative rate
  if (metrics.falseNegatives > metrics.truePositives) {
    recommendations.push(
      '⚠️  High false negative rate detected. Consider decreasing thresholds to catch more errors.'
    );
  }

  // Good balance
  if (metrics.f1Score >= 0.85) {
    recommendations.push('✅ Good threshold balance - thresholds appear well-calibrated.');
  }

  // Analyze specific error types
  const errorTypeCounts: Record<string, { detected: number; groundTruth: number }> = {};

  for (const error of detectedErrors) {
    if (!errorTypeCounts[error.type]) {
      errorTypeCounts[error.type] = { detected: 0, groundTruth: 0 };
    }
    errorTypeCounts[error.type].detected++;
  }

  for (const error of groundTruth) {
    if (!errorTypeCounts[error.type]) {
      errorTypeCounts[error.type] = { detected: 0, groundTruth: 0 };
    }
    errorTypeCounts[error.type].groundTruth++;
  }

  // Recommend adjustments for specific error types
  for (const [errorType, counts] of Object.entries(errorTypeCounts)) {
    if (counts.detected > counts.groundTruth * 2) {
      recommendations.push(
        `📊 ${errorType}: Detected ${counts.detected} times vs ${counts.groundTruth} expected. Consider increasing threshold.`
      );
    } else if (counts.detected < counts.groundTruth * 0.5) {
      recommendations.push(
        `📊 ${errorType}: Detected ${counts.detected} times vs ${counts.groundTruth} expected. Consider decreasing threshold.`
      );
    }
  }

  return recommendations;
}

/**
 * Run validation
 */
async function runValidation(): Promise<void> {
  console.log('🏥 Clinical Validation Harness');
  console.log('==============================\n');

  // Parse arguments
  const args = parseArgs();

  console.log('Configuration:');
  console.log(`  Reference Video: ${args.referenceVideo}`);
  console.log(`  User Video: ${args.userVideo}`);
  console.log(`  Exercise Type: ${args.exerciseType}`);
  console.log(`  Ground Truth: ${args.groundTruthFile || 'None (will report detected errors only)'}`);
  console.log('');

  // Check files exist
  if (!fs.existsSync(args.referenceVideo)) {
    console.error(`❌ Reference video not found: ${args.referenceVideo}`);
    process.exit(1);
  }

  if (!fs.existsSync(args.userVideo)) {
    console.error(`❌ User video not found: ${args.userVideo}`);
    process.exit(1);
  }

  // Load ground truth if provided
  let groundTruth: GroundTruthError[] = [];
  if (args.groundTruthFile) {
    if (!fs.existsSync(args.groundTruthFile)) {
      console.error(`❌ Ground truth file not found: ${args.groundTruthFile}`);
      process.exit(1);
    }
    groundTruth = loadGroundTruth(args.groundTruthFile);
    console.log(`✅ Loaded ${groundTruth.length} ground truth annotations\n`);
  }

  // Extract poses from videos
  console.log('🎥 Extracting poses from videos...');
  const referencePoses = await extractPosesFromVideo(args.referenceVideo);
  const userPoses = await extractPosesFromVideo(args.userVideo);
  console.log(`   Reference: ${referencePoses.length} frames`);
  console.log(`   User: ${userPoses.length} frames\n`);

  // Run error detection
  console.log('🔍 Running error detection algorithms...');
  let detectedErrors: any[] = [];

  if (args.exerciseType === 'shoulder_abduction') {
    detectedErrors = detectAllShoulderErrors(userPoses, referencePoses);
  } else if (args.exerciseType === 'squat') {
    detectedErrors = detectAllKneeErrors(userPoses, referencePoses);
  } else if (args.exerciseType === 'bicep_curl') {
    detectedErrors = detectAllElbowErrors(userPoses, referencePoses);
  }

  console.log(`   Detected ${detectedErrors.length} errors\n`);

  // Display detected errors
  console.log('📊 Detected Errors:');
  console.log('-------------------');
  if (detectedErrors.length === 0) {
    console.log('   No errors detected\n');
  } else {
    for (const error of detectedErrors) {
      console.log(
        `   • ${error.type} (${error.severity}) - ${error.side} side - ${error.value}${error.unit} @ ${error.timestamp}ms`
      );
    }
    console.log('');
  }

  // Generate smart feedback
  console.log('💬 Smart Feedback:');
  console.log('------------------');
  const feedback = SmartFeedbackGenerator.generate(detectedErrors, 'intermediate', 'en');
  console.log(`   Overall Score: ${feedback.overallScore}/100`);
  console.log(`   Summary: ${feedback.summary}`);
  if (feedback.positiveReinforcement) {
    console.log(`   Reinforcement: ${feedback.positiveReinforcement}`);
  }
  console.log(`\n   Priority Errors (Top ${feedback.errors.length}):`);
  for (const error of feedback.errors) {
    console.log(`     ${error.priority.toFixed(0)} - ${error.message.title}`);
    console.log(`          ${error.message.correction}`);
  }
  console.log('');

  // Calculate accuracy metrics if ground truth provided
  let metrics = null;
  let recommendations: string[] = [];

  if (groundTruth.length > 0) {
    console.log('📈 Accuracy Metrics:');
    console.log('-------------------');
    metrics = calculateMetrics(detectedErrors, groundTruth);
    console.log(`   True Positives: ${metrics.truePositives}`);
    console.log(`   False Positives: ${metrics.falsePositives}`);
    console.log(`   False Negatives: ${metrics.falseNegatives}`);
    console.log(`   Precision: ${(metrics.precision * 100).toFixed(1)}%`);
    console.log(`   Recall: ${(metrics.recall * 100).toFixed(1)}%`);
    console.log(`   F1 Score: ${(metrics.f1Score * 100).toFixed(1)}%\n`);

    // Generate recommendations
    recommendations = generateRecommendations(detectedErrors, groundTruth, metrics);
    console.log('💡 Recommendations:');
    console.log('------------------');
    for (const rec of recommendations) {
      console.log(`   ${rec}`);
    }
    console.log('');
  }

  // Save results if output file specified
  if (args.outputFile) {
    const result: ValidationResult = {
      detectedErrors,
      groundTruthErrors: groundTruth.length > 0 ? groundTruth : undefined,
      truePositives: metrics?.truePositives || 0,
      falsePositives: metrics?.falsePositives || 0,
      falseNegatives: metrics?.falseNegatives || 0,
      precision: metrics?.precision || 0,
      recall: metrics?.recall || 0,
      f1Score: metrics?.f1Score || 0,
      feedback,
      recommendations,
    };

    fs.writeFileSync(args.outputFile, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to ${args.outputFile}\n`);
  }

  console.log('✅ Validation complete!\n');
}

// Run if called directly
if (require.main === module) {
  runValidation().catch((error) => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { runValidation, ValidationResult, GroundTruthError };
