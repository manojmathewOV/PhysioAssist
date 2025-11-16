/**
 * Quick validation test to check basic geometry fixes
 */

import { SyntheticPoseDataGenerator } from './src/testing/SyntheticPoseDataGenerator';
import { ClinicalMeasurementService } from './src/services/biomechanics/ClinicalMeasurementService';
import { AnatomicalReferenceService } from './src/services/biomechanics/AnatomicalReferenceService';
import { AnatomicalFrameCache } from './src/services/biomechanics/AnatomicalFrameCache';

const generator = new SyntheticPoseDataGenerator();
// Disable temporal smoothing for validation tests by creating a fresh service for each measurement
const anatomicalService = new AnatomicalReferenceService();

function addAnatomicalFrames(poseData: any): any {
  // Create fresh cache for each pose to avoid cross-contamination
  const frameCache = new AnatomicalFrameCache();
  const landmarks = poseData.landmarks;

  const global = frameCache.get('global', landmarks, (lms) =>
    anatomicalService.calculateGlobalFrame(lms)
  );

  const thorax = frameCache.get('thorax', landmarks, (lms) =>
    anatomicalService.calculateThoraxFrame(lms, global)
  );

  const pelvis = frameCache.get('pelvis', landmarks, (lms) =>
    anatomicalService.calculatePelvisFrame(lms, poseData.schemaId)
  );

  const left_humerus = frameCache.get('left_humerus', landmarks, (lms) =>
    anatomicalService.calculateHumerusFrame(lms, 'left', thorax)
  );

  const right_humerus = frameCache.get('right_humerus', landmarks, (lms) =>
    anatomicalService.calculateHumerusFrame(lms, 'right', thorax)
  );

  const left_forearm = frameCache.get('left_forearm', landmarks, (lms) =>
    anatomicalService.calculateForearmFrame(lms, 'left', poseData.schemaId)
  );

  const right_forearm = frameCache.get('right_forearm', landmarks, (lms) =>
    anatomicalService.calculateForearmFrame(lms, 'right', poseData.schemaId)
  );

  return {
    ...poseData,
    cachedAnatomicalFrames: {
      global,
      thorax,
      pelvis,
      left_humerus,
      right_humerus,
      left_forearm,
      right_forearm,
    },
  };
}

console.log('Testing validation fixes...\n');

// Test 1: Elbow flexion
console.log('=== ELBOW FLEXION ===');
for (const angle of [0, 30, 60, 90, 120, 150]) {
  const measurementService = new ClinicalMeasurementService(); // Fresh service to avoid temporal smoothing
  const { poseData, groundTruth } = generator.generateElbowFlexion(angle, 'movenet-17', {
    side: 'left',
  });
  const enrichedPose = addAnatomicalFrames(poseData);
  const measurement = measurementService.measureElbowFlexion(enrichedPose, 'left');
  const error = Math.abs(measurement.primaryJoint.angle - angle);
  const passed = error <= 5;
  console.log(
    `  ${angle}° → ${measurement.primaryJoint.angle.toFixed(1)}° (error: ${error.toFixed(1)}°) ${passed ? '✓' : '✗'}`
  );
}

// Test 2: Knee flexion
console.log('\n=== KNEE FLEXION ===');
for (const angle of [0, 30, 60, 90, 120, 135]) {
  const measurementService = new ClinicalMeasurementService();
  const { poseData, groundTruth } = generator.generateKneeFlexion(angle, 'movenet-17', {
    side: 'left',
  });
  const enrichedPose = addAnatomicalFrames(poseData);
  const measurement = measurementService.measureKneeFlexion(enrichedPose, 'left');
  const error = Math.abs(measurement.primaryJoint.angle - angle);
  const passed = error <= 5;
  console.log(
    `  ${angle}° → ${measurement.primaryJoint.angle.toFixed(1)}° (error: ${error.toFixed(1)}°) ${passed ? '✓' : '✗'}`
  );
}

// Test 3: Shoulder abduction
console.log('\n=== SHOULDER ABDUCTION ===');
for (const angle of [0, 30, 60, 90, 120, 150, 180]) {
  const measurementService = new ClinicalMeasurementService();
  const { poseData, groundTruth } = generator.generateShoulderAbduction(
    angle,
    'movenet-17',
    { side: 'left' }
  );
  const enrichedPose = addAnatomicalFrames(poseData);
  const measurement = measurementService.measureShoulderAbduction(enrichedPose, 'left');
  const error = Math.abs(measurement.primaryJoint.angle - angle);
  const passed = error <= 5;
  console.log(
    `  ${angle}° → ${measurement.primaryJoint.angle.toFixed(1)}° (error: ${error.toFixed(1)}°) ${passed ? '✓' : '✗'}`
  );
}

// Test 4: Shoulder flexion
console.log('\n=== SHOULDER FLEXION ===');
for (const angle of [0, 30, 60, 90, 120, 150, 180]) {
  try {
    const measurementService = new ClinicalMeasurementService();
    const { poseData, groundTruth } = generator.generateShoulderFlexion(
      angle,
      'movenet-17',
      { side: 'left' }
    );
    const enrichedPose = addAnatomicalFrames(poseData);
    const measurement = measurementService.measureShoulderFlexion(enrichedPose, 'left');
    const error = Math.abs(measurement.primaryJoint.angle - angle);
    const passed = error <= 5;
    console.log(
      `  ${angle}° → ${measurement.primaryJoint.angle.toFixed(1)}° (error: ${error.toFixed(1)}°) ${passed ? '✓' : '✗'}`
    );
  } catch (e: any) {
    console.log(`  ${angle}° → ERROR: ${e.message}`);
  }
}

// Test 5: Shoulder rotation
console.log('\n=== SHOULDER ROTATION ===');
for (const angle of [-60, -30, 0, 30, 60, 90]) {
  try {
    const measurementService = new ClinicalMeasurementService();
    const { poseData, groundTruth } = generator.generateShoulderRotation(
      angle,
      'movenet-17',
      { side: 'left', elbowAngle: 90 }
    );
    const enrichedPose = addAnatomicalFrames(poseData);
    const measurement = measurementService.measureShoulderRotation(enrichedPose, 'left');
    const error = Math.abs(measurement.primaryJoint.angle - Math.abs(angle));
    const passed = error <= 5;
    console.log(
      `  ${angle}° → ${measurement.primaryJoint.angle.toFixed(1)}° (error: ${error.toFixed(1)}°) ${passed ? '✓' : '✗'}`
    );
  } catch (e: any) {
    console.log(`  ${angle}° → ERROR: ${e.message}`);
  }
}

console.log('\nTest complete!');
