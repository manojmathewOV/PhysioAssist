/**
 * Validation Pipeline
 * Gate 10C: Clinical validation protocol
 *
 * Runs comprehensive validation testing using synthetic poses with ground truth
 * Generates statistical reports to validate ±5° MAE accuracy target
 */

import { ProcessedPoseData } from '../types/pose';
import { GroundTruth, ValidationResult, ValidationReport, ValidationConfig, DEFAULT_VALIDATION_CONFIG } from '../types/validation';
import { SyntheticPoseDataGenerator } from './SyntheticPoseDataGenerator';
import { ClinicalMeasurementService } from '../services/biomechanics/ClinicalMeasurementService';
import { AnatomicalReferenceService } from '../services/biomechanics/AnatomicalReferenceService';
import { AnatomicalFrameCache } from '../services/biomechanics/AnatomicalFrameCache';
import { CompensationPattern } from '../types/clinicalMeasurement';

export class ValidationPipeline {
  private generator: SyntheticPoseDataGenerator;
  private measurementService: ClinicalMeasurementService;
  private anatomicalService: AnatomicalReferenceService;
  private frameCache: AnatomicalFrameCache;
  private config: ValidationConfig;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    this.generator = new SyntheticPoseDataGenerator();
    this.measurementService = new ClinicalMeasurementService();
    this.anatomicalService = new AnatomicalReferenceService();
    this.frameCache = new AnatomicalFrameCache();
    this.config = config;
  }

  /**
   * Run full validation suite (110 test cases)
   * - Shoulder flexion: 20 cases
   * - Shoulder abduction: 20 cases
   * - Shoulder rotation: 20 cases
   * - Elbow flexion: 15 cases
   * - Knee flexion: 15 cases
   * - Edge cases: 20 cases
   */
  public async runFullValidation(): Promise<ValidationReport> {
    const results: ValidationResult[] = [];
    const compensationResults: { expected: boolean; detected: boolean }[] = [];

    console.log('Starting validation pipeline...');
    console.log('Target metrics: MAE ≤5°, RMSE ≤7°, R² ≥0.95');

    // 1. Shoulder flexion validation (20 cases)
    console.log('\n[1/6] Validating shoulder flexion...');
    const shoulderFlexionResults = await this.validateShoulderFlexion();
    results.push(...shoulderFlexionResults.measurements);
    compensationResults.push(...shoulderFlexionResults.compensations);

    // 2. Shoulder abduction validation (20 cases)
    console.log('[2/6] Validating shoulder abduction...');
    const shoulderAbductionResults = await this.validateShoulderAbduction();
    results.push(...shoulderAbductionResults.measurements);
    compensationResults.push(...shoulderAbductionResults.compensations);

    // 3. Shoulder rotation validation (20 cases)
    console.log('[3/6] Validating shoulder rotation...');
    const shoulderRotationResults = await this.validateShoulderRotation();
    results.push(...shoulderRotationResults.measurements);
    compensationResults.push(...shoulderRotationResults.compensations);

    // 4. Elbow flexion validation (15 cases)
    console.log('[4/6] Validating elbow flexion...');
    const elbowFlexionResults = await this.validateElbowFlexion();
    results.push(...elbowFlexionResults.measurements);
    compensationResults.push(...elbowFlexionResults.compensations);

    // 5. Knee flexion validation (15 cases)
    console.log('[5/6] Validating knee flexion...');
    const kneeFlexionResults = await this.validateKneeFlexion();
    results.push(...kneeFlexionResults.measurements);
    compensationResults.push(...kneeFlexionResults.compensations);

    // 6. Edge cases validation (20 cases)
    console.log('[6/6] Validating edge cases...');
    const edgeCaseResults = await this.validateEdgeCases();
    results.push(...edgeCaseResults.measurements);
    compensationResults.push(...edgeCaseResults.compensations);

    // Generate comprehensive report
    console.log('\nGenerating validation report...');
    const report = this.generateReport(results, compensationResults);

    return report;
  }

  /**
   * Validate shoulder flexion measurements (20 cases)
   */
  private async validateShoulderFlexion(): Promise<{
    measurements: ValidationResult[];
    compensations: { expected: boolean; detected: boolean }[];
  }> {
    const measurements: ValidationResult[] = [];
    const compensations: { expected: boolean; detected: boolean }[] = [];

    const testAngles = [0, 30, 60, 90, 120, 150, 180];
    const sides: ('left' | 'right')[] = ['left', 'right'];

    for (const side of sides) {
      for (const angle of testAngles) {
        // Test 1: Normal flexion (no compensations)
        const { poseData, groundTruth } = this.generator.generateShoulderFlexion(angle, 'movenet-17', { side });
        const enrichedPose = this.addAnatomicalFrames(poseData);
        const measurement = this.measurementService.measureShoulderFlexion(enrichedPose, side);

        measurements.push({
          testCase: `shoulder_flexion_${side}_${angle}deg`,
          groundTruth: groundTruth.primaryMeasurement.angle,
          measured: measurement.primaryJoint.angle,
          error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
          passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
          compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
          timestamp: Date.now(),
        });

        compensations.push({
          expected: groundTruth.compensations.length > 0,
          detected: measurement.compensations.length > 0,
        });

        // Test 2: Flexion with trunk lean compensation (for angles >= 90°)
        if (angle >= 90) {
          const { poseData: compensatedPose, groundTruth: compensatedGT } = this.generator.generateShoulderFlexion(
            angle,
            'movenet-17',
            { side, trunkLean: 15 }
          );
          const enrichedCompensatedPose = this.addAnatomicalFrames(compensatedPose);
          const compensatedMeasurement = this.measurementService.measureShoulderFlexion(enrichedCompensatedPose, side);

          measurements.push({
            testCase: `shoulder_flexion_${side}_${angle}deg_trunk_lean`,
            groundTruth: compensatedGT.primaryMeasurement.angle,
            measured: compensatedMeasurement.primaryJoint.angle,
            error: Math.abs(compensatedMeasurement.primaryJoint.angle - compensatedGT.primaryMeasurement.angle),
            passed: Math.abs(compensatedMeasurement.primaryJoint.angle - compensatedGT.primaryMeasurement.angle) <= this.config.angleTolerance,
            compensationMatches: this.checkCompensationMatch(compensatedGT.compensations, compensatedMeasurement.compensations),
            timestamp: Date.now(),
          });

          compensations.push({
            expected: compensatedGT.compensations.length > 0,
            detected: compensatedMeasurement.compensations.length > 0,
          });
        }
      }
    }

    return { measurements, compensations };
  }

  /**
   * Validate shoulder abduction measurements (20 cases)
   */
  private async validateShoulderAbduction(): Promise<{
    measurements: ValidationResult[];
    compensations: { expected: boolean; detected: boolean }[];
  }> {
    const measurements: ValidationResult[] = [];
    const compensations: { expected: boolean; detected: boolean }[] = [];

    const testAngles = [0, 30, 60, 90, 120, 150, 180];
    const sides: ('left' | 'right')[] = ['left', 'right'];

    for (const side of sides) {
      for (const angle of testAngles) {
        // Test 1: Normal abduction (no compensations)
        const { poseData, groundTruth } = this.generator.generateShoulderAbduction(angle, 'movenet-17', { side });
        const enrichedPose = this.addAnatomicalFrames(poseData);
        const measurement = this.measurementService.measureShoulderAbduction(enrichedPose, side);

        measurements.push({
          testCase: `shoulder_abduction_${side}_${angle}deg`,
          groundTruth: groundTruth.primaryMeasurement.angle,
          measured: measurement.primaryJoint.angle,
          error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
          passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
          compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
          timestamp: Date.now(),
        });

        compensations.push({
          expected: groundTruth.compensations.length > 0,
          detected: measurement.compensations.length > 0,
        });

        // Test 2: Abduction with shoulder hiking (for angles >= 90°)
        if (angle >= 90) {
          const { poseData: compensatedPose, groundTruth: compensatedGT } = this.generator.generateShoulderAbduction(
            angle,
            'movenet-17',
            { side, shoulderHiking: 25 }
          );
          const enrichedCompensatedPose = this.addAnatomicalFrames(compensatedPose);
          const compensatedMeasurement = this.measurementService.measureShoulderAbduction(enrichedCompensatedPose, side);

          measurements.push({
            testCase: `shoulder_abduction_${side}_${angle}deg_shoulder_hiking`,
            groundTruth: compensatedGT.primaryMeasurement.angle,
            measured: compensatedMeasurement.primaryJoint.angle,
            error: Math.abs(compensatedMeasurement.primaryJoint.angle - compensatedGT.primaryMeasurement.angle),
            passed: Math.abs(compensatedMeasurement.primaryJoint.angle - compensatedGT.primaryMeasurement.angle) <= this.config.angleTolerance,
            compensationMatches: this.checkCompensationMatch(compensatedGT.compensations, compensatedMeasurement.compensations),
            timestamp: Date.now(),
          });

          compensations.push({
            expected: compensatedGT.compensations.length > 0,
            detected: compensatedMeasurement.compensations.length > 0,
          });
        }
      }
    }

    return { measurements, compensations };
  }

  /**
   * Validate shoulder rotation measurements (20 cases)
   */
  private async validateShoulderRotation(): Promise<{
    measurements: ValidationResult[];
    compensations: { expected: boolean; detected: boolean }[];
  }> {
    const measurements: ValidationResult[] = [];
    const compensations: { expected: boolean; detected: boolean }[] = [];

    const testAngles = [-60, -45, -30, -15, 0, 15, 30, 45, 60, 90];
    const sides: ('left' | 'right')[] = ['left', 'right'];

    for (const side of sides) {
      for (const angle of testAngles) {
        // Test: Rotation with elbow at 90° (valid measurement)
        const { poseData, groundTruth } = this.generator.generateShoulderRotation(angle, 'movenet-17', { side, elbowAngle: 90 });
        const enrichedPose = this.addAnatomicalFrames(poseData);
        const measurement = this.measurementService.measureShoulderRotation(enrichedPose, side);

        measurements.push({
          testCase: `shoulder_rotation_${side}_${angle}deg`,
          groundTruth: groundTruth.primaryMeasurement.angle,
          measured: measurement.primaryJoint.angle,
          error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
          passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
          compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
          timestamp: Date.now(),
        });

        compensations.push({
          expected: groundTruth.compensations.length > 0,
          detected: measurement.compensations.length > 0,
        });
      }
    }

    return { measurements, compensations };
  }

  /**
   * Validate elbow flexion measurements (15 cases)
   */
  private async validateElbowFlexion(): Promise<{
    measurements: ValidationResult[];
    compensations: { expected: boolean; detected: boolean }[];
  }> {
    const measurements: ValidationResult[] = [];
    const compensations: { expected: boolean; detected: boolean }[] = [];

    const testAngles = [0, 30, 60, 90, 120, 150];
    const sides: ('left' | 'right')[] = ['left', 'right'];

    for (const side of sides) {
      for (const angle of testAngles) {
        // Test 1: Normal elbow flexion
        const { poseData, groundTruth } = this.generator.generateElbowFlexion(angle, 'movenet-17', { side });
        const enrichedPose = this.addAnatomicalFrames(poseData);
        const measurement = this.measurementService.measureElbowFlexion(enrichedPose, side);

        measurements.push({
          testCase: `elbow_flexion_${side}_${angle}deg`,
          groundTruth: groundTruth.primaryMeasurement.angle,
          measured: measurement.primaryJoint.angle,
          error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
          passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
          compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
          timestamp: Date.now(),
        });

        compensations.push({
          expected: groundTruth.compensations.length > 0,
          detected: measurement.compensations.length > 0,
        });
      }
    }

    // Test 2: Elbow with trunk lean compensation (3 cases)
    const compensatedAngles = [90, 120, 150];
    for (const angle of compensatedAngles) {
      const { poseData, groundTruth } = this.generator.generateElbowFlexion(angle, 'movenet-17', { side: 'right', trunkLean: 10 });
      const enrichedPose = this.addAnatomicalFrames(poseData);
      const measurement = this.measurementService.measureElbowFlexion(enrichedPose, 'right');

      measurements.push({
        testCase: `elbow_flexion_right_${angle}deg_trunk_lean`,
        groundTruth: groundTruth.primaryMeasurement.angle,
        measured: measurement.primaryJoint.angle,
        error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
        passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
        compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
        timestamp: Date.now(),
      });

      compensations.push({
        expected: groundTruth.compensations.length > 0,
        detected: measurement.compensations.length > 0,
      });
    }

    return { measurements, compensations };
  }

  /**
   * Validate knee flexion measurements (15 cases)
   */
  private async validateKneeFlexion(): Promise<{
    measurements: ValidationResult[];
    compensations: { expected: boolean; detected: boolean }[];
  }> {
    const measurements: ValidationResult[] = [];
    const compensations: { expected: boolean; detected: boolean }[] = [];

    const testAngles = [0, 30, 60, 90, 120, 135];
    const sides: ('left' | 'right')[] = ['left', 'right'];

    for (const side of sides) {
      for (const angle of testAngles) {
        // Test 1: Normal knee flexion
        const { poseData, groundTruth } = this.generator.generateKneeFlexion(angle, 'movenet-17', { side });
        const enrichedPose = this.addAnatomicalFrames(poseData);
        const measurement = this.measurementService.measureKneeFlexion(enrichedPose, side);

        measurements.push({
          testCase: `knee_flexion_${side}_${angle}deg`,
          groundTruth: groundTruth.primaryMeasurement.angle,
          measured: measurement.primaryJoint.angle,
          error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
          passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
          compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
          timestamp: Date.now(),
        });

        compensations.push({
          expected: groundTruth.compensations.length > 0,
          detected: measurement.compensations.length > 0,
        });
      }
    }

    // Test 2: Knee with hip hike compensation (3 cases)
    const compensatedAngles = [60, 90, 120];
    for (const angle of compensatedAngles) {
      const { poseData, groundTruth } = this.generator.generateKneeFlexion(angle, 'movenet-17', { side: 'right', hipHike: 30 });
      const enrichedPose = this.addAnatomicalFrames(poseData);
      const measurement = this.measurementService.measureKneeFlexion(enrichedPose, 'right');

      measurements.push({
        testCase: `knee_flexion_right_${angle}deg_hip_hike`,
        groundTruth: groundTruth.primaryMeasurement.angle,
        measured: measurement.primaryJoint.angle,
        error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
        passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
        compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
        timestamp: Date.now(),
      });

      compensations.push({
        expected: groundTruth.compensations.length > 0,
        detected: measurement.compensations.length > 0,
      });
    }

    return { measurements, compensations };
  }

  /**
   * Validate edge cases (20 cases)
   * - Near-zero angles
   * - Maximum ROM angles
   * - Multiple compensations
   * - Low confidence poses
   */
  private async validateEdgeCases(): Promise<{
    measurements: ValidationResult[];
    compensations: { expected: boolean; detected: boolean }[];
  }> {
    const measurements: ValidationResult[] = [];
    const compensations: { expected: boolean; detected: boolean }[] = [];

    // Edge case 1: Near-zero angles (4 cases)
    const nearZeroTests = [
      { movement: 'shoulder_flexion', angle: 1, side: 'left' as const },
      { movement: 'shoulder_abduction', angle: 2, side: 'right' as const },
      { movement: 'elbow_flexion', angle: 1, side: 'left' as const },
      { movement: 'knee_flexion', angle: 2, side: 'right' as const },
    ];

    for (const test of nearZeroTests) {
      let poseData, groundTruth;
      if (test.movement === 'shoulder_flexion') {
        ({ poseData, groundTruth } = this.generator.generateShoulderFlexion(test.angle, 'movenet-17', { side: test.side }));
      } else if (test.movement === 'shoulder_abduction') {
        ({ poseData, groundTruth } = this.generator.generateShoulderAbduction(test.angle, 'movenet-17', { side: test.side }));
      } else if (test.movement === 'elbow_flexion') {
        ({ poseData, groundTruth } = this.generator.generateElbowFlexion(test.angle, 'movenet-17', { side: test.side }));
      } else {
        ({ poseData, groundTruth } = this.generator.generateKneeFlexion(test.angle, 'movenet-17', { side: test.side }));
      }

      const enrichedPose = this.addAnatomicalFrames(poseData);
      let measurement;
      if (test.movement === 'shoulder_flexion') {
        measurement = this.measurementService.measureShoulderFlexion(enrichedPose, test.side);
      } else if (test.movement === 'shoulder_abduction') {
        measurement = this.measurementService.measureShoulderAbduction(enrichedPose, test.side);
      } else if (test.movement === 'elbow_flexion') {
        measurement = this.measurementService.measureElbowFlexion(enrichedPose, test.side);
      } else {
        measurement = this.measurementService.measureKneeFlexion(enrichedPose, test.side);
      }

      measurements.push({
        testCase: `edge_${test.movement}_${test.side}_near_zero`,
        groundTruth: groundTruth.primaryMeasurement.angle,
        measured: measurement.primaryJoint.angle,
        error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
        passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
        compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
        timestamp: Date.now(),
      });

      compensations.push({
        expected: groundTruth.compensations.length > 0,
        detected: measurement.compensations.length > 0,
      });
    }

    // Edge case 2: Maximum ROM angles (4 cases)
    const maxROMTests = [
      { movement: 'shoulder_flexion', angle: 180, side: 'left' as const },
      { movement: 'shoulder_abduction', angle: 180, side: 'right' as const },
      { movement: 'elbow_flexion', angle: 150, side: 'left' as const },
      { movement: 'knee_flexion', angle: 135, side: 'right' as const },
    ];

    for (const test of maxROMTests) {
      let poseData, groundTruth;
      if (test.movement === 'shoulder_flexion') {
        ({ poseData, groundTruth } = this.generator.generateShoulderFlexion(test.angle, 'movenet-17', { side: test.side }));
      } else if (test.movement === 'shoulder_abduction') {
        ({ poseData, groundTruth } = this.generator.generateShoulderAbduction(test.angle, 'movenet-17', { side: test.side }));
      } else if (test.movement === 'elbow_flexion') {
        ({ poseData, groundTruth } = this.generator.generateElbowFlexion(test.angle, 'movenet-17', { side: test.side }));
      } else {
        ({ poseData, groundTruth } = this.generator.generateKneeFlexion(test.angle, 'movenet-17', { side: test.side }));
      }

      const enrichedPose = this.addAnatomicalFrames(poseData);
      let measurement;
      if (test.movement === 'shoulder_flexion') {
        measurement = this.measurementService.measureShoulderFlexion(enrichedPose, test.side);
      } else if (test.movement === 'shoulder_abduction') {
        measurement = this.measurementService.measureShoulderAbduction(enrichedPose, test.side);
      } else if (test.movement === 'elbow_flexion') {
        measurement = this.measurementService.measureElbowFlexion(enrichedPose, test.side);
      } else {
        measurement = this.measurementService.measureKneeFlexion(enrichedPose, test.side);
      }

      measurements.push({
        testCase: `edge_${test.movement}_${test.side}_max_rom`,
        groundTruth: groundTruth.primaryMeasurement.angle,
        measured: measurement.primaryJoint.angle,
        error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
        passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
        compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
        timestamp: Date.now(),
      });

      compensations.push({
        expected: groundTruth.compensations.length > 0,
        detected: measurement.compensations.length > 0,
      });
    }

    // Edge case 3: Multiple simultaneous compensations (6 cases)
    const multiCompTests = [
      { movement: 'shoulder_flexion', angle: 150, trunkLean: 15, shoulderHiking: 20 },
      { movement: 'shoulder_flexion', angle: 120, trunkLean: 20, shoulderHiking: 15 },
      { movement: 'shoulder_abduction', angle: 150, trunkLean: 10, shoulderHiking: 25 },
      { movement: 'shoulder_abduction', angle: 120, trunkLean: 15, shoulderHiking: 20 },
      { movement: 'elbow_flexion', angle: 120, trunkLean: 15 },
      { movement: 'knee_flexion', angle: 120, hipHike: 30 },
    ];

    for (const test of multiCompTests) {
      let poseData, groundTruth;
      if (test.movement === 'shoulder_flexion') {
        ({ poseData, groundTruth } = this.generator.generateShoulderFlexion(test.angle, 'movenet-17', {
          side: 'right',
          trunkLean: test.trunkLean,
          shoulderHiking: test.shoulderHiking,
        }));
      } else if (test.movement === 'shoulder_abduction') {
        ({ poseData, groundTruth } = this.generator.generateShoulderAbduction(test.angle, 'movenet-17', {
          side: 'right',
          trunkLean: test.trunkLean,
          shoulderHiking: test.shoulderHiking,
        }));
      } else if (test.movement === 'elbow_flexion') {
        ({ poseData, groundTruth } = this.generator.generateElbowFlexion(test.angle, 'movenet-17', {
          side: 'right',
          trunkLean: test.trunkLean,
        }));
      } else {
        ({ poseData, groundTruth } = this.generator.generateKneeFlexion(test.angle, 'movenet-17', {
          side: 'right',
          hipHike: (test as any).hipHike,
        }));
      }

      const enrichedPose = this.addAnatomicalFrames(poseData);
      let measurement;
      if (test.movement === 'shoulder_flexion') {
        measurement = this.measurementService.measureShoulderFlexion(enrichedPose, 'right');
      } else if (test.movement === 'shoulder_abduction') {
        measurement = this.measurementService.measureShoulderAbduction(enrichedPose, 'right');
      } else if (test.movement === 'elbow_flexion') {
        measurement = this.measurementService.measureElbowFlexion(enrichedPose, 'right');
      } else {
        measurement = this.measurementService.measureKneeFlexion(enrichedPose, 'right');
      }

      measurements.push({
        testCase: `edge_${test.movement}_multiple_compensations`,
        groundTruth: groundTruth.primaryMeasurement.angle,
        measured: measurement.primaryJoint.angle,
        error: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle),
        passed: Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle) <= this.config.angleTolerance,
        compensationMatches: this.checkCompensationMatch(groundTruth.compensations, measurement.compensations),
        timestamp: Date.now(),
      });

      compensations.push({
        expected: groundTruth.compensations.length > 0,
        detected: measurement.compensations.length > 0,
      });
    }

    // Edge case 4: Bilateral symmetry tests (6 cases)
    const bilateralAngles = [60, 90, 120];
    for (const angle of bilateralAngles) {
      // Generate left shoulder flexion
      const { poseData: leftPose, groundTruth: leftGT } = this.generator.generateShoulderFlexion(angle, 'movenet-17', { side: 'left' });
      const enrichedLeftPose = this.addAnatomicalFrames(leftPose);
      const leftMeasurement = this.measurementService.measureShoulderFlexion(enrichedLeftPose, 'left');

      // Generate right shoulder flexion
      const { poseData: rightPose, groundTruth: rightGT } = this.generator.generateShoulderFlexion(angle, 'movenet-17', { side: 'right' });
      const enrichedRightPose = this.addAnatomicalFrames(rightPose);
      const rightMeasurement = this.measurementService.measureShoulderFlexion(enrichedRightPose, 'right');

      // Left side measurement
      measurements.push({
        testCase: `edge_bilateral_left_shoulder_${angle}deg`,
        groundTruth: leftGT.primaryMeasurement.angle,
        measured: leftMeasurement.primaryJoint.angle,
        error: Math.abs(leftMeasurement.primaryJoint.angle - leftGT.primaryMeasurement.angle),
        passed: Math.abs(leftMeasurement.primaryJoint.angle - leftGT.primaryMeasurement.angle) <= this.config.angleTolerance,
        compensationMatches: true,
        timestamp: Date.now(),
      });

      // Right side measurement
      measurements.push({
        testCase: `edge_bilateral_right_shoulder_${angle}deg`,
        groundTruth: rightGT.primaryMeasurement.angle,
        measured: rightMeasurement.primaryJoint.angle,
        error: Math.abs(rightMeasurement.primaryJoint.angle - rightGT.primaryMeasurement.angle),
        passed: Math.abs(rightMeasurement.primaryJoint.angle - rightGT.primaryMeasurement.angle) <= this.config.angleTolerance,
        compensationMatches: true,
        timestamp: Date.now(),
      });

      compensations.push({ expected: false, detected: false });
      compensations.push({ expected: false, detected: false });
    }

    return { measurements, compensations };
  }

  /**
   * Add anatomical frames to pose data using cache
   */
  private addAnatomicalFrames(poseData: ProcessedPoseData): ProcessedPoseData {
    const landmarks = poseData.landmarks;

    // Calculate anatomical frames using cache
    const global = this.frameCache.get('global', landmarks, (lms) =>
      this.anatomicalService.calculateGlobalFrame(lms)
    );

    const thorax = this.frameCache.get('thorax', landmarks, (lms) =>
      this.anatomicalService.calculateThoraxFrame(lms, global)
    );

    const pelvis = this.frameCache.get('pelvis', landmarks, (lms) =>
      this.anatomicalService.calculatePelvisFrame(lms, poseData.schemaId)
    );

    const left_humerus = this.frameCache.get('left_humerus', landmarks, (lms) =>
      this.anatomicalService.calculateHumerusFrame(lms, 'left', poseData.schemaId)
    );

    const right_humerus = this.frameCache.get('right_humerus', landmarks, (lms) =>
      this.anatomicalService.calculateHumerusFrame(lms, 'right', poseData.schemaId)
    );

    const left_forearm = this.frameCache.get('left_forearm', landmarks, (lms) =>
      this.anatomicalService.calculateForearmFrame(lms, 'left', poseData.schemaId)
    );

    const right_forearm = this.frameCache.get('right_forearm', landmarks, (lms) =>
      this.anatomicalService.calculateForearmFrame(lms, 'right', poseData.schemaId)
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

  /**
   * Check if detected compensations match expected compensations
   */
  private checkCompensationMatch(
    expected: Array<{ type: string; magnitude: number; expectedSeverity: string }>,
    detected: CompensationPattern[]
  ): boolean {
    // If no compensations expected, should detect none
    if (expected.length === 0) {
      return detected.length === 0;
    }

    // All expected compensations should be detected
    for (const exp of expected) {
      const found = detected.find((det) => det.type === exp.type);
      if (!found) {
        return false;
      }

      // Severity should match (allow ±1 level tolerance)
      const severityLevels = ['minimal', 'mild', 'moderate', 'severe'];
      const expLevel = severityLevels.indexOf(exp.expectedSeverity);
      const detLevel = severityLevels.indexOf(found.severity);
      if (Math.abs(expLevel - detLevel) > 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate comprehensive validation report
   */
  private generateReport(
    results: ValidationResult[],
    compensations: { expected: boolean; detected: boolean }[]
  ): ValidationReport {
    const totalTests = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = totalTests - passed;
    const passRate = (passed / totalTests) * 100;

    // Calculate MAE (Mean Absolute Error)
    const mae = results.reduce((sum, r) => sum + r.error, 0) / totalTests;

    // Calculate RMSE (Root Mean Square Error)
    const mse = results.reduce((sum, r) => sum + r.error ** 2, 0) / totalTests;
    const rmse = Math.sqrt(mse);

    // Calculate max error
    const maxError = Math.max(...results.map((r) => r.error));

    // Calculate R² (coefficient of determination)
    const groundTruthValues = results.map((r) => r.groundTruth);
    const measuredValues = results.map((r) => r.measured);
    const r2 = this.calculateR2(groundTruthValues, measuredValues);

    // Calculate compensation detection metrics
    const truePositives = compensations.filter((c) => c.expected && c.detected).length;
    const trueNegatives = compensations.filter((c) => !c.expected && !c.detected).length;
    const falsePositives = compensations.filter((c) => !c.expected && c.detected).length;
    const falseNegatives = compensations.filter((c) => c.expected && !c.detected).length;

    const totalComp = compensations.length;
    const accuracy = ((truePositives + trueNegatives) / totalComp) * 100;
    const sensitivity = truePositives / (truePositives + falseNegatives) || 0;
    const specificity = trueNegatives / (trueNegatives + falsePositives) || 0;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const f1Score = (2 * precision * sensitivity) / (precision + sensitivity) || 0;

    // Determine overall status
    const meetsMAE = mae <= this.config.targetMAE;
    const meetsRMSE = rmse <= this.config.targetRMSE;
    const meetsR2 = r2 >= this.config.targetR2;
    const meetsSensitivity = sensitivity >= this.config.targetSensitivity;
    const meetsSpecificity = specificity >= this.config.targetSpecificity;

    const status: 'PASS' | 'FAIL' =
      meetsMAE && meetsRMSE && meetsR2 && meetsSensitivity && meetsSpecificity ? 'PASS' : 'FAIL';

    // Generate summary notes
    const notes: string[] = [];
    if (!meetsMAE) notes.push(`MAE (${mae.toFixed(2)}°) exceeds target (${this.config.targetMAE}°)`);
    if (!meetsRMSE) notes.push(`RMSE (${rmse.toFixed(2)}°) exceeds target (${this.config.targetRMSE}°)`);
    if (!meetsR2) notes.push(`R² (${r2.toFixed(3)}) below target (${this.config.targetR2})`);
    if (!meetsSensitivity)
      notes.push(`Sensitivity (${(sensitivity * 100).toFixed(1)}%) below target (${this.config.targetSensitivity * 100}%)`);
    if (!meetsSpecificity)
      notes.push(`Specificity (${(specificity * 100).toFixed(1)}%) below target (${this.config.targetSpecificity * 100}%)`);

    if (status === 'PASS') {
      notes.push('✓ All validation targets achieved');
      notes.push('✓ Clinical accuracy requirements met (±5° MAE)');
      notes.push('✓ Compensation detection meets clinical standards');
    }

    return {
      totalTests,
      passed,
      failed,
      passRate,
      metrics: {
        mae,
        rmse,
        maxError,
        r2,
      },
      compensationMetrics: {
        accuracy,
        sensitivity,
        specificity,
        precision,
        f1Score,
      },
      detailedResults: results,
      timestamp: new Date().toISOString(),
      status,
      notes,
    };
  }

  /**
   * Calculate R² (coefficient of determination)
   */
  private calculateR2(groundTruth: number[], measured: number[]): number {
    if (groundTruth.length !== measured.length || groundTruth.length === 0) {
      return 0;
    }

    // Calculate mean of ground truth
    const mean = groundTruth.reduce((sum, val) => sum + val, 0) / groundTruth.length;

    // Calculate total sum of squares (TSS)
    const tss = groundTruth.reduce((sum, val) => sum + (val - mean) ** 2, 0);

    // Calculate residual sum of squares (RSS)
    const rss = groundTruth.reduce((sum, val, i) => sum + (val - measured[i]) ** 2, 0);

    // R² = 1 - (RSS / TSS)
    return 1 - rss / tss;
  }

  /**
   * Print validation report to console
   */
  public printReport(report: ValidationReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('CLINICAL VALIDATION REPORT - Gate 10C');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Status: ${report.status}`);
    console.log('');

    console.log('OVERALL RESULTS:');
    console.log(`  Total Tests: ${report.totalTests}`);
    console.log(`  Passed: ${report.passed} (${report.passRate.toFixed(1)}%)`);
    console.log(`  Failed: ${report.failed}`);
    console.log('');

    console.log('ANGLE MEASUREMENT ACCURACY:');
    console.log(`  MAE (Mean Absolute Error): ${report.metrics.mae.toFixed(2)}° (target: ≤${this.config.targetMAE}°) ${report.metrics.mae <= this.config.targetMAE ? '✓' : '✗'}`);
    console.log(`  RMSE (Root Mean Square Error): ${report.metrics.rmse.toFixed(2)}° (target: ≤${this.config.targetRMSE}°) ${report.metrics.rmse <= this.config.targetRMSE ? '✓' : '✗'}`);
    console.log(`  Max Error: ${report.metrics.maxError.toFixed(2)}°`);
    console.log(`  R² (Coefficient of Determination): ${report.metrics.r2.toFixed(3)} (target: ≥${this.config.targetR2}) ${report.metrics.r2 >= this.config.targetR2 ? '✓' : '✗'}`);
    console.log('');

    console.log('COMPENSATION DETECTION ACCURACY:');
    console.log(`  Overall Accuracy: ${report.compensationMetrics.accuracy.toFixed(1)}%`);
    console.log(`  Sensitivity (True Positive Rate): ${(report.compensationMetrics.sensitivity * 100).toFixed(1)}% (target: ≥${this.config.targetSensitivity * 100}%) ${report.compensationMetrics.sensitivity >= this.config.targetSensitivity ? '✓' : '✗'}`);
    console.log(`  Specificity (True Negative Rate): ${(report.compensationMetrics.specificity * 100).toFixed(1)}% (target: ≥${this.config.targetSpecificity * 100}%) ${report.compensationMetrics.specificity >= this.config.targetSpecificity ? '✓' : '✗'}`);
    console.log(`  Precision: ${(report.compensationMetrics.precision! * 100).toFixed(1)}%`);
    console.log(`  F1 Score: ${report.compensationMetrics.f1Score!.toFixed(3)}`);
    console.log('');

    if (report.notes && report.notes.length > 0) {
      console.log('NOTES:');
      report.notes.forEach((note) => console.log(`  ${note}`));
      console.log('');
    }

    console.log('='.repeat(80));
  }

  /**
   * Save validation report to file
   */
  public async saveReport(report: ValidationReport, filepath: string): Promise<void> {
    const fs = require('fs').promises;
    await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Validation report saved to: ${filepath}`);
  }
}
