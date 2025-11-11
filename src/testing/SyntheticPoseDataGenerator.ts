/**
 * Synthetic Pose Data Generator
 * Gate 10C: Generate poses with mathematically precise ground truth angles
 *
 * Creates ProcessedPoseData with landmarks positioned at known anatomical
 * configurations for validation testing.
 *
 * Use cases:
 * - Validate goniometer accuracy (±5° MAE target)
 * - Test clinical measurement functions
 * - Verify compensation detection (>80% sensitivity)
 * - Generate test data for edge cases
 */

import { ProcessedPoseData, PoseLandmark } from '../types/pose';
import { Vector3D } from '../types/common';
import { GroundTruth, GroundTruthCompensation } from '../types/validation';

export class SyntheticPoseDataGenerator {
  /**
   * Generate shoulder flexion pose at specified angle
   *
   * Ground truth: Shoulder flexion angle in sagittal plane
   *
   * @param angle Target flexion angle (0-180°)
   * @param schemaId 'movenet-17' or 'mediapipe-33'
   * @param options Additional options (elbow angle, trunk lean, etc.)
   * @returns ProcessedPoseData with known ground truth
   */
  public generateShoulderFlexion(
    angle: number,
    schemaId: 'movenet-17' | 'mediapipe-33' = 'movenet-17',
    options: {
      elbowAngle?: number; // Default: 180° (extended)
      trunkLean?: number; // Lateral trunk lean in degrees (default: 0)
      shoulderHiking?: number; // Shoulder elevation in cm (default: 0)
      side?: 'left' | 'right'; // Default: 'right'
      viewOrientation?: 'frontal' | 'sagittal' | 'posterior'; // Default: 'sagittal'
    } = {}
  ): { poseData: ProcessedPoseData; groundTruth: GroundTruth } {
    const {
      elbowAngle = 180,
      trunkLean = 0,
      shoulderHiking = 0,
      side = 'right',
      viewOrientation = 'sagittal',
    } = options;

    // Define anatomical reference points in normalized coordinates [0-1]
    const hipMidpoint: Vector3D = { x: 0.5, y: 0.6, z: 0.5 }; // Center of frame
    const shoulderHeight = 0.4; // 40cm above hip in normalized space
    const upperArmLength = 0.25; // 25cm
    const forearmLength = 0.25; // 25cm

    // Calculate shoulder position (with optional hiking)
    const shoulderY = hipMidpoint.y - shoulderHeight - (shoulderHiking / 100);
    const shoulder: Vector3D = {
      x: side === 'right' ? hipMidpoint.x + 0.15 : hipMidpoint.x - 0.15,
      y: shoulderY,
      z: hipMidpoint.z,
    };

    // Calculate elbow position based on shoulder flexion angle
    // Flexion is rotation in sagittal plane (around Z-axis)
    const flexionRad = (angle * Math.PI) / 180;
    const elbow: Vector3D = {
      x: shoulder.x + upperArmLength * Math.sin(flexionRad),
      y: shoulder.y - upperArmLength * Math.cos(flexionRad),
      z: shoulder.z,
    };

    // Calculate wrist position based on elbow angle
    const elbowFlexionRad = ((180 - elbowAngle) * Math.PI) / 180;
    const wrist: Vector3D = {
      x: elbow.x + forearmLength * Math.sin(flexionRad + elbowFlexionRad),
      y: elbow.y - forearmLength * Math.cos(flexionRad + elbowFlexionRad),
      z: elbow.z,
    };

    // Generate full skeleton
    const landmarks = this.generateFullSkeleton(schemaId, {
      shoulder,
      elbow,
      wrist,
      hipMidpoint,
      trunkLean,
      side,
    });

    const poseData: ProcessedPoseData = {
      landmarks,
      timestamp: Date.now(),
      schemaId,
      viewOrientation,
      qualityScore: 0.95,
      hasDepth: false,
      confidence: 0.95,
    };

    const groundTruth: GroundTruth = {
      primaryMeasurement: {
        joint: `${side}_shoulder`,
        angle,
        plane: 'sagittal',
        movement: 'flexion',
      },
      secondaryMeasurements: [
        {
          joint: `${side}_elbow`,
          angle: elbowAngle,
          expectedDeviation: Math.abs(elbowAngle - 180),
        },
      ],
      compensations: this.generateCompensationGroundTruth(trunkLean, shoulderHiking),
      testCase: `shoulder_flexion_${angle}deg_${side}`,
    };

    return { poseData, groundTruth };
  }

  /**
   * Generate shoulder abduction pose at specified angle
   *
   * @param angle Target abduction angle (0-180°)
   * @param schemaId 'movenet-17' or 'mediapipe-33'
   * @param options Additional options
   * @returns ProcessedPoseData with known ground truth
   */
  public generateShoulderAbduction(
    angle: number,
    schemaId: 'movenet-17' | 'mediapipe-33' = 'movenet-17',
    options: {
      scapularRotation?: number; // Scapular upward rotation (default: auto-calculated)
      trunkLean?: number;
      side?: 'left' | 'right';
      viewOrientation?: 'frontal' | 'posterior';
    } = {}
  ): { poseData: ProcessedPoseData; groundTruth: GroundTruth } {
    const {
      scapularRotation = angle * 0.33, // Approximate 2:1 ratio (glenohumeral:scapulothoracic)
      trunkLean = 0,
      side = 'right',
      viewOrientation = 'frontal',
    } = options;

    const hipMidpoint: Vector3D = { x: 0.5, y: 0.6, z: 0.5 };
    const shoulderHeight = 0.4;
    const upperArmLength = 0.25;
    const forearmLength = 0.25;

    // Shoulder position (adjusted for hiking based on scapular rotation)
    const shoulderY = hipMidpoint.y - shoulderHeight - (scapularRotation * 0.01); // Approximate elevation
    const shoulderX = side === 'right' ? hipMidpoint.x + 0.15 : hipMidpoint.x - 0.15;

    const shoulder: Vector3D = {
      x: shoulderX,
      y: shoulderY,
      z: hipMidpoint.z,
    };

    // Abduction is in scapular plane (35° anterior to coronal)
    // For simplicity, approximate as coronal plane rotation
    const abductionRad = (angle * Math.PI) / 180;
    const lateralMultiplier = side === 'right' ? 1 : -1;

    const elbow: Vector3D = {
      x: shoulder.x + lateralMultiplier * upperArmLength * Math.sin(abductionRad),
      y: shoulder.y - upperArmLength * Math.cos(abductionRad),
      z: shoulder.z,
    };

    // Forearm extended
    const wrist: Vector3D = {
      x: elbow.x + lateralMultiplier * forearmLength * Math.sin(abductionRad),
      y: elbow.y - forearmLength * Math.cos(abductionRad),
      z: elbow.z,
    };

    const landmarks = this.generateFullSkeleton(schemaId, {
      shoulder,
      elbow,
      wrist,
      hipMidpoint,
      trunkLean,
      side,
      scapularRotation, // Add scapular rotation to skeleton generator
    });

    const poseData: ProcessedPoseData = {
      landmarks,
      timestamp: Date.now(),
      schemaId,
      viewOrientation,
      qualityScore: 0.95,
      hasDepth: false,
      confidence: 0.95,
    };

    const groundTruth: GroundTruth = {
      primaryMeasurement: {
        joint: `${side}_shoulder`,
        angle,
        plane: 'scapular',
        movement: 'abduction',
      },
      secondaryMeasurements: [
        {
          joint: 'scapular_rotation',
          angle: scapularRotation,
        },
      ],
      compensations: this.generateCompensationGroundTruth(trunkLean, scapularRotation / 10), // Convert to cm
      testCase: `shoulder_abduction_${angle}deg_${side}`,
    };

    return { poseData, groundTruth };
  }

  /**
   * Generate elbow flexion pose at specified angle
   *
   * @param angle Target flexion angle (0-150°)
   * @param schemaId Schema identifier
   * @param options Additional options
   * @returns ProcessedPoseData with known ground truth
   */
  public generateElbowFlexion(
    angle: number,
    schemaId: 'movenet-17' | 'mediapipe-33' = 'movenet-17',
    options: {
      side?: 'left' | 'right';
      viewOrientation?: 'sagittal' | 'frontal';
    } = {}
  ): { poseData: ProcessedPoseData; groundTruth: GroundTruth } {
    const {
      side = 'right',
      viewOrientation = 'sagittal',
    } = options;

    const hipMidpoint: Vector3D = { x: 0.5, y: 0.6, z: 0.5 };
    const shoulderHeight = 0.4;
    const upperArmLength = 0.25;
    const forearmLength = 0.25;

    const shoulder: Vector3D = {
      x: side === 'right' ? hipMidpoint.x + 0.15 : hipMidpoint.x - 0.15,
      y: hipMidpoint.y - shoulderHeight,
      z: hipMidpoint.z,
    };

    // Elbow hanging down (shoulder at ~0° flexion)
    const elbow: Vector3D = {
      x: shoulder.x,
      y: shoulder.y + upperArmLength,
      z: shoulder.z,
    };

    // Wrist position based on elbow flexion
    const flexionRad = (angle * Math.PI) / 180;
    const wrist: Vector3D = {
      x: elbow.x + forearmLength * Math.sin(flexionRad),
      y: elbow.y - forearmLength * Math.cos(flexionRad),
      z: elbow.z,
    };

    const landmarks = this.generateFullSkeleton(schemaId, {
      shoulder,
      elbow,
      wrist,
      hipMidpoint,
      trunkLean: 0,
      side,
    });

    const poseData: ProcessedPoseData = {
      landmarks,
      timestamp: Date.now(),
      schemaId,
      viewOrientation,
      qualityScore: 0.95,
      hasDepth: false,
      confidence: 0.95,
    };

    const groundTruth: GroundTruth = {
      primaryMeasurement: {
        joint: `${side}_elbow`,
        angle,
        plane: 'sagittal',
        movement: 'flexion',
      },
      secondaryMeasurements: [],
      compensations: [],
      testCase: `elbow_flexion_${angle}deg_${side}`,
    };

    return { poseData, groundTruth };
  }

  /**
   * Generate knee flexion pose at specified angle
   *
   * @param angle Target flexion angle (0-135°)
   * @param schemaId Schema identifier
   * @param options Additional options
   * @returns ProcessedPoseData with known ground truth
   */
  public generateKneeFlexion(
    angle: number,
    schemaId: 'movenet-17' | 'mediapipe-33' = 'movenet-17',
    options: {
      side?: 'left' | 'right';
      hipHike?: number; // Hip hike in degrees
    } = {}
  ): { poseData: ProcessedPoseData; groundTruth: GroundTruth } {
    const {
      side = 'right',
      hipHike = 0,
    } = options;

    const hipMidpoint: Vector3D = { x: 0.5, y: 0.6, z: 0.5 };
    const thighLength = 0.35;
    const shinLength = 0.35;

    // Hip position (with optional hike)
    const hipY = hipMidpoint.y + (hipHike * 0.01);
    const hip: Vector3D = {
      x: side === 'right' ? hipMidpoint.x + 0.08 : hipMidpoint.x - 0.08,
      y: hipY,
      z: hipMidpoint.z,
    };

    // Knee hanging down (hip at 0° flexion, standing position)
    const knee: Vector3D = {
      x: hip.x,
      y: hip.y + thighLength,
      z: hip.z,
    };

    // Ankle position based on knee flexion
    const flexionRad = (angle * Math.PI) / 180;
    const ankle: Vector3D = {
      x: knee.x + shinLength * Math.sin(flexionRad),
      y: knee.y + shinLength * Math.cos(flexionRad),
      z: knee.z,
    };

    const landmarks = this.generateKneeSkeleton(schemaId, {
      hip,
      knee,
      ankle,
      hipMidpoint,
      side,
      hipHike,
    });

    const poseData: ProcessedPoseData = {
      landmarks,
      timestamp: Date.now(),
      schemaId,
      viewOrientation: 'sagittal',
      qualityScore: 0.95,
      hasDepth: false,
      confidence: 0.95,
    };

    const groundTruth: GroundTruth = {
      primaryMeasurement: {
        joint: `${side}_knee`,
        angle,
        plane: 'sagittal',
        movement: 'flexion',
      },
      secondaryMeasurements: [],
      compensations: hipHike > 0 ? this.generateCompensationGroundTruth(0, 0, hipHike) : [],
      testCase: `knee_flexion_${angle}deg_${side}`,
    };

    return { poseData, groundTruth };
  }

  /**
   * Generate full skeleton from key joint positions
   *
   * Fills in all required landmarks (head, torso, hips, legs) based on
   * provided shoulder/elbow/wrist positions and trunk configuration.
   */
  private generateFullSkeleton(
    schemaId: string,
    config: {
      shoulder: Vector3D;
      elbow: Vector3D;
      wrist: Vector3D;
      hipMidpoint: Vector3D;
      trunkLean: number;
      side: 'left' | 'right';
      scapularRotation?: number;
    }
  ): PoseLandmark[] {
    const { shoulder, elbow, wrist, hipMidpoint, trunkLean, side, scapularRotation = 0 } = config;

    const landmarks: PoseLandmark[] = [];

    // Calculate opposite shoulder position
    const oppositeShoulderX = side === 'right'
      ? hipMidpoint.x - 0.15
      : hipMidpoint.x + 0.15;

    // Apply scapular rotation (shoulder line tilt)
    const scapularTiltRad = (scapularRotation * Math.PI) / 180;
    const oppositeShoulderY = shoulder.y + (0.3 * Math.tan(scapularTiltRad));

    const oppositeShoulder: Vector3D = {
      x: oppositeShoulderX,
      y: oppositeShoulderY,
      z: shoulder.z,
    };

    // MoveNet-17 keypoints
    if (schemaId === 'movenet-17') {
      landmarks.push(
        // 0: nose
        { x: hipMidpoint.x, y: hipMidpoint.y - 0.5, z: 0.5, visibility: 0.98, index: 0, name: 'nose' },
        // 1: left_eye
        { x: hipMidpoint.x - 0.02, y: hipMidpoint.y - 0.52, z: 0.5, visibility: 0.97, index: 1, name: 'left_eye' },
        // 2: right_eye
        { x: hipMidpoint.x + 0.02, y: hipMidpoint.y - 0.52, z: 0.5, visibility: 0.97, index: 2, name: 'right_eye' },
        // 3: left_ear
        { x: hipMidpoint.x - 0.04, y: hipMidpoint.y - 0.50, z: 0.5, visibility: 0.96, index: 3, name: 'left_ear' },
        // 4: right_ear
        { x: hipMidpoint.x + 0.04, y: hipMidpoint.y - 0.50, z: 0.5, visibility: 0.96, index: 4, name: 'right_ear' },
        // 5: left_shoulder
        side === 'left'
          ? { x: shoulder.x, y: shoulder.y, z: shoulder.z, visibility: 0.95, index: 5, name: 'left_shoulder' }
          : { x: oppositeShoulder.x, y: oppositeShoulder.y, z: oppositeShoulder.z, visibility: 0.95, index: 5, name: 'left_shoulder' },
        // 6: right_shoulder
        side === 'right'
          ? { x: shoulder.x, y: shoulder.y, z: shoulder.z, visibility: 0.95, index: 6, name: 'right_shoulder' }
          : { x: oppositeShoulder.x, y: oppositeShoulder.y, z: oppositeShoulder.z, visibility: 0.95, index: 6, name: 'right_shoulder' },
        // 7: left_elbow
        side === 'left'
          ? { x: elbow.x, y: elbow.y, z: elbow.z, visibility: 0.94, index: 7, name: 'left_elbow' }
          : { x: oppositeShoulder.x, y: oppositeShoulder.y + 0.15, z: oppositeShoulder.z, visibility: 0.94, index: 7, name: 'left_elbow' },
        // 8: right_elbow
        side === 'right'
          ? { x: elbow.x, y: elbow.y, z: elbow.z, visibility: 0.94, index: 8, name: 'right_elbow' }
          : { x: oppositeShoulder.x, y: oppositeShoulder.y + 0.15, z: oppositeShoulder.z, visibility: 0.94, index: 8, name: 'right_elbow' },
        // 9: left_wrist
        side === 'left'
          ? { x: wrist.x, y: wrist.y, z: wrist.z, visibility: 0.93, index: 9, name: 'left_wrist' }
          : { x: oppositeShoulder.x, y: oppositeShoulder.y + 0.30, z: oppositeShoulder.z, visibility: 0.93, index: 9, name: 'left_wrist' },
        // 10: right_wrist
        side === 'right'
          ? { x: wrist.x, y: wrist.y, z: wrist.z, visibility: 0.93, index: 10, name: 'right_wrist' }
          : { x: oppositeShoulder.x, y: oppositeShoulder.y + 0.30, z: oppositeShoulder.z, visibility: 0.93, index: 10, name: 'right_wrist' },
        // 11: left_hip
        { x: hipMidpoint.x - 0.08, y: hipMidpoint.y, z: 0.5, visibility: 0.95, index: 11, name: 'left_hip' },
        // 12: right_hip
        { x: hipMidpoint.x + 0.08, y: hipMidpoint.y, z: 0.5, visibility: 0.95, index: 12, name: 'right_hip' },
        // 13: left_knee
        { x: hipMidpoint.x - 0.08, y: hipMidpoint.y + 0.35, z: 0.5, visibility: 0.94, index: 13, name: 'left_knee' },
        // 14: right_knee
        { x: hipMidpoint.x + 0.08, y: hipMidpoint.y + 0.35, z: 0.5, visibility: 0.94, index: 14, name: 'right_knee' },
        // 15: left_ankle
        { x: hipMidpoint.x - 0.08, y: hipMidpoint.y + 0.70, z: 0.5, visibility: 0.93, index: 15, name: 'left_ankle' },
        // 16: right_ankle
        { x: hipMidpoint.x + 0.08, y: hipMidpoint.y + 0.70, z: 0.5, visibility: 0.93, index: 16, name: 'right_ankle' }
      );
    }

    // Apply trunk lean if specified
    if (trunkLean !== 0) {
      this.applyTrunkLean(landmarks, trunkLean, hipMidpoint);
    }

    return landmarks;
  }

  /**
   * Generate skeleton for knee flexion tests
   */
  private generateKneeSkeleton(
    schemaId: string,
    config: {
      hip: Vector3D;
      knee: Vector3D;
      ankle: Vector3D;
      hipMidpoint: Vector3D;
      side: 'left' | 'right';
      hipHike: number;
    }
  ): PoseLandmark[] {
    const { hip, knee, ankle, hipMidpoint, side, hipHike } = config;

    const landmarks: PoseLandmark[] = [];

    // Calculate opposite hip position (with hip hike)
    const oppositeHipY = side === 'right'
      ? hip.y - (hipHike * 0.01)
      : hip.y + (hipHike * 0.01);

    const oppositeHip: Vector3D = {
      x: side === 'right' ? hipMidpoint.x - 0.08 : hipMidpoint.x + 0.08,
      y: oppositeHipY,
      z: hip.z,
    };

    // MoveNet-17 keypoints (simplified for knee testing)
    if (schemaId === 'movenet-17') {
      landmarks.push(
        { x: hipMidpoint.x, y: hipMidpoint.y - 0.5, z: 0.5, visibility: 0.98, index: 0, name: 'nose' },
        { x: hipMidpoint.x - 0.02, y: hipMidpoint.y - 0.52, z: 0.5, visibility: 0.97, index: 1, name: 'left_eye' },
        { x: hipMidpoint.x + 0.02, y: hipMidpoint.y - 0.52, z: 0.5, visibility: 0.97, index: 2, name: 'right_eye' },
        { x: hipMidpoint.x - 0.04, y: hipMidpoint.y - 0.50, z: 0.5, visibility: 0.96, index: 3, name: 'left_ear' },
        { x: hipMidpoint.x + 0.04, y: hipMidpoint.y - 0.50, z: 0.5, visibility: 0.96, index: 4, name: 'right_ear' },
        { x: hipMidpoint.x - 0.15, y: hipMidpoint.y - 0.4, z: 0.5, visibility: 0.95, index: 5, name: 'left_shoulder' },
        { x: hipMidpoint.x + 0.15, y: hipMidpoint.y - 0.4, z: 0.5, visibility: 0.95, index: 6, name: 'right_shoulder' },
        { x: hipMidpoint.x - 0.15, y: hipMidpoint.y - 0.25, z: 0.5, visibility: 0.94, index: 7, name: 'left_elbow' },
        { x: hipMidpoint.x + 0.15, y: hipMidpoint.y - 0.25, z: 0.5, visibility: 0.94, index: 8, name: 'right_elbow' },
        { x: hipMidpoint.x - 0.15, y: hipMidpoint.y - 0.10, z: 0.5, visibility: 0.93, index: 9, name: 'left_wrist' },
        { x: hipMidpoint.x + 0.15, y: hipMidpoint.y - 0.10, z: 0.5, visibility: 0.93, index: 10, name: 'right_wrist' },
        // Hips
        side === 'left'
          ? { x: hip.x, y: hip.y, z: hip.z, visibility: 0.95, index: 11, name: 'left_hip' }
          : { x: oppositeHip.x, y: oppositeHip.y, z: oppositeHip.z, visibility: 0.95, index: 11, name: 'left_hip' },
        side === 'right'
          ? { x: hip.x, y: hip.y, z: hip.z, visibility: 0.95, index: 12, name: 'right_hip' }
          : { x: oppositeHip.x, y: oppositeHip.y, z: oppositeHip.z, visibility: 0.95, index: 12, name: 'right_hip' },
        // Knees
        side === 'left'
          ? { x: knee.x, y: knee.y, z: knee.z, visibility: 0.94, index: 13, name: 'left_knee' }
          : { x: oppositeHip.x, y: oppositeHip.y + 0.35, z: oppositeHip.z, visibility: 0.94, index: 13, name: 'left_knee' },
        side === 'right'
          ? { x: knee.x, y: knee.y, z: knee.z, visibility: 0.94, index: 14, name: 'right_knee' }
          : { x: oppositeHip.x, y: oppositeHip.y + 0.35, z: oppositeHip.z, visibility: 0.94, index: 14, name: 'right_knee' },
        // Ankles
        side === 'left'
          ? { x: ankle.x, y: ankle.y, z: ankle.z, visibility: 0.93, index: 15, name: 'left_ankle' }
          : { x: oppositeHip.x, y: oppositeHip.y + 0.70, z: oppositeHip.z, visibility: 0.93, index: 15, name: 'left_ankle' },
        side === 'right'
          ? { x: ankle.x, y: ankle.y, z: ankle.z, visibility: 0.93, index: 16, name: 'right_ankle' }
          : { x: oppositeHip.x, y: oppositeHip.y + 0.70, z: oppositeHip.z, visibility: 0.93, index: 16, name: 'right_ankle' }
      );
    }

    return landmarks;
  }

  /**
   * Apply trunk lean transformation to landmarks
   */
  private applyTrunkLean(landmarks: PoseLandmark[], leanAngle: number, pivot: Vector3D): void {
    // Rotate torso landmarks (shoulders, elbows, wrists) around hip midpoint
    const leanRad = (leanAngle * Math.PI) / 180;

    // Landmarks to rotate: nose, eyes, ears, shoulders, elbows, wrists (indices 0-10)
    for (let i = 0; i <= 10; i++) {
      const lm = landmarks[i];
      if (!lm) continue;

      // Translate to origin (pivot point)
      const dx = lm.x - pivot.x;
      const dy = lm.y - pivot.y;

      // Rotate in XY plane (lean is lateral)
      lm.x = pivot.x + dx * Math.cos(leanRad) - dy * Math.sin(leanRad);
      lm.y = pivot.y + dx * Math.sin(leanRad) + dy * Math.cos(leanRad);
    }
  }

  /**
   * Generate ground truth for compensations
   */
  private generateCompensationGroundTruth(
    trunkLean: number,
    shoulderHiking: number,
    hipHike?: number
  ): GroundTruthCompensation[] {
    const compensations: GroundTruthCompensation[] = [];

    if (trunkLean > 0) {
      compensations.push({
        type: 'trunk_lean',
        magnitude: trunkLean,
        expectedSeverity: this.classifySeverity(trunkLean, 'degrees'),
      });
    }

    if (shoulderHiking > 0) {
      compensations.push({
        type: 'shoulder_hiking',
        magnitude: shoulderHiking,
        expectedSeverity: this.classifySeverity(shoulderHiking, 'cm'),
      });
    }

    if (hipHike && hipHike > 0) {
      compensations.push({
        type: 'hip_hike',
        magnitude: hipHike,
        expectedSeverity: this.classifySeverityHipHike(hipHike),
      });
    }

    return compensations;
  }

  /**
   * Classify severity based on magnitude
   */
  private classifySeverity(
    magnitude: number,
    unit: 'degrees' | 'cm'
  ): 'minimal' | 'mild' | 'moderate' | 'severe' {
    const thresholds = unit === 'degrees'
      ? { mild: 5, moderate: 10, severe: 15 }
      : { mild: 1, moderate: 2, severe: 3 };

    if (magnitude < thresholds.mild) return 'minimal';
    if (magnitude < thresholds.moderate) return 'mild';
    if (magnitude < thresholds.severe) return 'moderate';
    return 'severe';
  }

  /**
   * Classify hip hike severity (stricter thresholds)
   */
  private classifySeverityHipHike(magnitude: number): 'minimal' | 'mild' | 'moderate' | 'severe' {
    if (magnitude < 3) return 'minimal';
    if (magnitude < 5) return 'mild';
    if (magnitude < 8) return 'moderate';
    return 'severe';
  }
}
