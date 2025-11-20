import { PoseLandmark } from '../../types/pose';
import { AnatomicalReferenceFrame, AnatomicalPlane } from '../../types/biomechanics';
import { Vector3D } from '../../types/common';
import {
  midpoint3D,
  subtract3D,
  normalize,
  crossProduct,
  projectVectorOntoPlane,
} from '../../utils/vectorMath';

/**
 * Anatomical Reference Frame Service
 *
 * Calculates ISB-compliant anatomical reference frames from pose landmarks.
 * Enables clinical-grade joint angle measurements in anatomical planes.
 *
 * Reference: Wu et al. (2005) - ISB recommendation on definitions of joint coordinate systems
 * Standard: X-anterior, Y-superior, Z-lateral (right-handed coordinate system)
 *
 * @example
 * const service = new AnatomicalReferenceService();
 * const globalFrame = service.calculateGlobalFrame(landmarks);
 * const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
 * const scapularPlane = service.calculateScapularPlane(thoraxFrame);
 */
export class AnatomicalReferenceService {
  /**
   * Calculate global reference frame (world coordinates)
   *
   * Origin: Midpoint of hips
   * Y-axis: Vertical (hip center to shoulder center) - superior direction
   * Z-axis: Lateral (left hip to right hip) - right lateral direction
   * X-axis: Anterior (Y × Z cross product) - forward direction
   *
   * This establishes the laboratory/world coordinate system for all measurements.
   *
   * @param landmarks - Pose landmarks from detection model
   * @returns Global anatomical reference frame
   *
   * @example
   * const globalFrame = service.calculateGlobalFrame(landmarks);
   * // globalFrame.yAxis points upward (superior)
   * // globalFrame.zAxis points right (lateral)
   * // globalFrame.xAxis points forward (anterior)
   */
  calculateGlobalFrame(landmarks: PoseLandmark[]): AnatomicalReferenceFrame {
    const leftHip = landmarks[11];
    const rightHip = landmarks[12];
    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];

    // Origin: midpoint of hips (pelvis center)
    const origin = midpoint3D(leftHip, rightHip);

    // Y-axis: hip center to shoulder center (vertical/superior)
    const hipCenter = origin;
    const shoulderCenter = midpoint3D(leftShoulder, rightShoulder);
    const yAxis = normalize(subtract3D(shoulderCenter, hipCenter));

    // Z-axis: left hip to right hip (lateral, pointing right)
    const zAxis = normalize(subtract3D(rightHip, leftHip));

    // X-axis: anterior direction (Y × Z cross product)
    const xAxis = normalize(crossProduct(yAxis, zAxis));

    // Recalculate Z to ensure perfect orthogonality (X × Y)
    const zAxisCorrected = normalize(crossProduct(xAxis, yAxis));

    const confidence = this.calculateFrameConfidence([
      leftHip,
      rightHip,
      leftShoulder,
      rightShoulder,
    ]);

    return {
      origin,
      xAxis,
      yAxis,
      zAxis: zAxisCorrected,
      frameType: 'global',
      confidence,
    };
  }

  /**
   * Calculate thorax (trunk) reference frame
   *
   * Origin: Midpoint of shoulders
   * Y-axis: Aligned with trunk vertical (hip to shoulder)
   * Z-axis: Left shoulder to right shoulder (lateral)
   * X-axis: Perpendicular to thorax (Y × Z)
   *
   * This frame moves with trunk rotation/lean, essential for detecting compensations.
   *
   * @param landmarks - Pose landmarks from detection model
   * @param globalFrame - Global reference frame for comparison
   * @returns Thorax anatomical reference frame
   *
   * @example
   * const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
   * // Compare thoraxFrame.yAxis to globalFrame.yAxis to detect trunk lean
   */
  calculateThoraxFrame(
    landmarks: PoseLandmark[],
    _globalFrame: AnatomicalReferenceFrame
  ): AnatomicalReferenceFrame {
    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];
    const leftHip = landmarks[11];
    const rightHip = landmarks[12];

    // Origin: midpoint of shoulders
    const origin = midpoint3D(leftShoulder, rightShoulder);

    // Y-axis: trunk vertical (hip center to shoulder center)
    const hipCenter = midpoint3D(leftHip, rightHip);
    const shoulderCenter = origin;
    const yAxis = normalize(subtract3D(shoulderCenter, hipCenter));

    // Z-axis: left shoulder to right shoulder (lateral)
    const zAxis = normalize(subtract3D(rightShoulder, leftShoulder));

    // X-axis: anterior direction (Y × Z)
    const xAxis = normalize(crossProduct(yAxis, zAxis));

    // Recalculate Z for orthogonality
    const zAxisCorrected = normalize(crossProduct(xAxis, yAxis));

    const confidence = this.calculateFrameConfidence([
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
    ]);

    return {
      origin,
      xAxis,
      yAxis,
      zAxis: zAxisCorrected,
      frameType: 'thorax',
      confidence,
    };
  }

  /**
   * Calculate scapular plane
   *
   * The scapular plane is ~30-40° anterior to the coronal plane.
   * This is the natural plane of shoulder motion and clinically preferred
   * for measuring shoulder abduction/elevation.
   *
   * Research: Scapular plane varies by individual (30-40° typical)
   * Reference: BMC Musculoskelet Disord (2020)
   *
   * @param thoraxFrame - Thorax reference frame
   * @param rotationAngle - Degrees anterior to coronal plane (default: 35°)
   * @returns Scapular plane definition
   *
   * @example
   * const scapularPlane = service.calculateScapularPlane(thoraxFrame, 35);
   * // Use this plane for shoulder abduction measurements
   */
  calculateScapularPlane(
    thoraxFrame: AnatomicalReferenceFrame,
    rotationAngle: number = 35
  ): AnatomicalPlane {
    // Start with coronal plane normal (X-axis in thorax frame)
    const coronalNormal = thoraxFrame.xAxis;

    // Rotate around Y-axis (superior) by specified angle
    const angleRad = rotationAngle * (Math.PI / 180);

    // Rotation matrix around Y-axis:
    // [cos(θ)  0  sin(θ)]
    // [0       1  0     ]
    // [-sin(θ) 0  cos(θ)]
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    const scapularNormal = normalize({
      x: coronalNormal.x * cosAngle + coronalNormal.z * sinAngle,
      y: coronalNormal.y,
      z: -coronalNormal.x * sinAngle + coronalNormal.z * cosAngle,
    });

    return {
      name: 'scapular',
      normal: scapularNormal,
      point: thoraxFrame.origin,
      rotation: rotationAngle,
    };
  }

  /**
   * Calculate humerus (upper arm) reference frame
   *
   * Origin: Shoulder joint center
   * Y-axis: Shoulder to elbow (longitudinal axis of humerus)
   * X-axis: Perpendicular to humerus in scapular plane
   * Z-axis: Perpendicular to X and Y (lateral)
   *
   * Used for measuring shoulder internal/external rotation and
   * glenohumeral joint angles.
   *
   * @param landmarks - Pose landmarks from detection model
   * @param side - Which shoulder ('left' or 'right')
   * @param thoraxFrame - Thorax reference for orientation
   * @returns Humerus anatomical reference frame
   *
   * @example
   * const humerusFrame = service.calculateHumerusFrame(landmarks, 'left', thoraxFrame);
   * // Measure shoulder ROM relative to this frame
   */
  calculateHumerusFrame(
    landmarks: PoseLandmark[],
    side: 'left' | 'right',
    thoraxFrame: AnatomicalReferenceFrame
  ): AnatomicalReferenceFrame {
    const shoulderIdx = side === 'left' ? 5 : 6;
    const elbowIdx = side === 'left' ? 7 : 8;

    const shoulder = landmarks[shoulderIdx];
    const elbow = landmarks[elbowIdx];

    // Origin: shoulder joint center
    const origin: Vector3D = { x: shoulder.x, y: shoulder.y, z: shoulder.z ?? 0 };

    // Y-axis: shoulder to elbow (longitudinal humerus axis)
    const yAxis = normalize(subtract3D(elbow, shoulder));

    // Z-axis: Use thorax lateral axis as reference, ensure perpendicular to Y
    // This maintains anatomical orientation
    const thoraxLateral = thoraxFrame.zAxis;
    const zAxisTemp = subtract3D(thoraxLateral, {
      x:
        yAxis.x *
        (yAxis.x * thoraxLateral.x +
          yAxis.y * thoraxLateral.y +
          yAxis.z * thoraxLateral.z),
      y:
        yAxis.y *
        (yAxis.x * thoraxLateral.x +
          yAxis.y * thoraxLateral.y +
          yAxis.z * thoraxLateral.z),
      z:
        yAxis.z *
        (yAxis.x * thoraxLateral.x +
          yAxis.y * thoraxLateral.y +
          yAxis.z * thoraxLateral.z),
    });
    const zAxis = normalize(zAxisTemp);

    // X-axis: anterior direction (Y × Z)
    const xAxis = normalize(crossProduct(yAxis, zAxis));

    // Recalculate Z for perfect orthogonality
    const zAxisCorrected = normalize(crossProduct(xAxis, yAxis));

    const confidence = this.calculateFrameConfidence([shoulder, elbow]);

    return {
      origin,
      xAxis,
      yAxis,
      zAxis: zAxisCorrected,
      frameType: 'humerus',
      confidence,
    };
  }

  /**
   * Calculate pelvis anatomical reference frame
   * ISB-compliant coordinate system for lower extremity measurements
   *
   * Based on ISB recommendations (Wu et al., 2002):
   * - Origin: Midpoint between left and right hip centers
   * - Y-axis: Superior direction (pelvis to thorax)
   * - Z-axis: Lateral direction (left hip to right hip)
   * - X-axis: Anterior direction (Y × Z)
   *
   * Used for measuring hip flexion, abduction, and rotation
   *
   * @param landmarks - Pose landmarks
   * @param schemaId - Pose schema identifier
   * @returns Pelvis anatomical reference frame
   */
  calculatePelvisFrame(
    landmarks: PoseLandmark[],
    _schemaId?: string
  ): AnatomicalReferenceFrame {
    const leftHip = landmarks.find((lm) => lm.name === 'left_hip');
    const rightHip = landmarks.find((lm) => lm.name === 'right_hip');
    const leftShoulder = landmarks.find((lm) => lm.name === 'left_shoulder');
    const rightShoulder = landmarks.find((lm) => lm.name === 'right_shoulder');

    if (!leftHip || !rightHip) {
      throw new Error('Hip landmarks required for pelvis frame calculation');
    }

    // Origin: midpoint between hip centers
    const origin = midpoint3D(leftHip, rightHip);

    // Z-axis: lateral direction (left to right)
    const zAxis = normalize(subtract3D(rightHip, leftHip));

    // Y-axis: superior direction (pelvis to trunk)
    // If shoulders available, use hip-to-shoulder vector
    // Otherwise, use vertical (global Y-axis)
    let yAxis: Vector3D;
    if (leftShoulder && rightShoulder) {
      const shoulderCenter = midpoint3D(leftShoulder, rightShoulder);
      yAxis = normalize(subtract3D(shoulderCenter, origin));
    } else {
      // Fallback: use global vertical, perpendicular to Z-axis
      const globalUp: Vector3D = { x: 0, y: -1, z: 0 }; // Negative Y is up in image coords
      // Project onto plane perpendicular to Z-axis
      yAxis = normalize(projectVectorOntoPlane(globalUp, zAxis));
    }

    // X-axis: anterior direction (Y × Z)
    const xAxis = normalize(crossProduct(yAxis, zAxis));

    // Recalculate Y for orthogonality (X × Z)
    const yAxisCorrected = normalize(crossProduct(zAxis, xAxis));

    const confidenceLandmarks =
      leftShoulder && rightShoulder
        ? [leftHip, rightHip, leftShoulder, rightShoulder]
        : [leftHip, rightHip];
    const confidence = this.calculateFrameConfidence(confidenceLandmarks);

    return {
      origin,
      xAxis,
      yAxis: yAxisCorrected,
      zAxis,
      frameType: 'pelvis',
      confidence,
    };
  }

  /**
   * Calculate forearm anatomical reference frame
   * ISB-compliant coordinate system for forearm measurements
   *
   * Based on ISB recommendations (Wu et al., 2005):
   * - Origin: Elbow joint center (medial-lateral midpoint)
   * - Y-axis: Longitudinal axis (elbow to wrist)
   * - X-axis: Anterior direction (perpendicular to forearm in sagittal plane)
   * - Z-axis: Lateral direction (perpendicular to X and Y)
   *
   * Used for measuring elbow flexion and forearm pronation/supination
   *
   * @param landmarks - Pose landmarks
   * @param side - Which forearm ('left' or 'right')
   * @param schemaId - Pose schema identifier
   * @returns Forearm anatomical reference frame
   */
  calculateForearmFrame(
    landmarks: PoseLandmark[],
    side: 'left' | 'right',
    _schemaId?: string
  ): AnatomicalReferenceFrame {
    const shoulder = landmarks.find((lm) => lm.name === `${side}_shoulder`);
    const elbow = landmarks.find((lm) => lm.name === `${side}_elbow`);
    const wrist = landmarks.find((lm) => lm.name === `${side}_wrist`);

    if (!elbow || !wrist) {
      throw new Error(`Elbow and wrist landmarks required for ${side} forearm frame`);
    }

    // Origin: elbow joint center
    const origin: Vector3D = { x: elbow.x, y: elbow.y, z: elbow.z ?? 0 };

    // Y-axis: longitudinal axis (elbow to wrist)
    const yAxis = normalize(subtract3D(wrist, elbow));

    // X-axis: anterior direction
    // Use upper arm direction (shoulder to elbow) to establish X-axis
    // in the plane perpendicular to the forearm
    let xAxis: Vector3D;
    if (shoulder) {
      const upperArmVector = normalize(subtract3D(elbow, shoulder));
      // X-axis perpendicular to forearm (Y-axis), in direction of upper arm
      // Project upper arm vector onto plane perpendicular to forearm
      xAxis = normalize(projectVectorOntoPlane(upperArmVector, yAxis));
    } else {
      // Fallback: use global anterior direction
      const globalAnterior: Vector3D = { x: 1, y: 0, z: 0 };
      xAxis = normalize(projectVectorOntoPlane(globalAnterior, yAxis));
    }

    // Z-axis: lateral direction (X × Y)
    const zAxis = normalize(crossProduct(xAxis, yAxis));

    // Recalculate X for perfect orthogonality (Y × Z)
    const xAxisCorrected = normalize(crossProduct(yAxis, zAxis));

    const confidenceLandmarks = shoulder ? [shoulder, elbow, wrist] : [elbow, wrist];
    const confidence = this.calculateFrameConfidence(confidenceLandmarks);

    return {
      origin,
      xAxis: xAxisCorrected,
      yAxis,
      zAxis,
      frameType: 'forearm',
      confidence,
    };
  }

  /**
   * Calculate sagittal plane (divides body left/right)
   *
   * Normal: Z-axis (lateral direction)
   * Used for measuring flexion/extension movements
   *
   * @param frame - Reference frame (global or thorax)
   * @returns Sagittal plane definition
   */
  calculateSagittalPlane(frame: AnatomicalReferenceFrame): AnatomicalPlane {
    return {
      name: 'sagittal',
      normal: frame.zAxis,
      point: frame.origin,
      rotation: 0,
    };
  }

  /**
   * Calculate coronal plane (divides body front/back)
   *
   * Normal: X-axis (anterior direction)
   * Used for measuring abduction/adduction movements
   *
   * @param frame - Reference frame (global or thorax)
   * @returns Coronal plane definition
   */
  calculateCoronalPlane(frame: AnatomicalReferenceFrame): AnatomicalPlane {
    return {
      name: 'coronal',
      normal: frame.xAxis,
      point: frame.origin,
      rotation: 0,
    };
  }

  /**
   * Calculate transverse plane (divides body top/bottom)
   *
   * Normal: Y-axis (superior direction)
   * Used for measuring rotation movements
   *
   * @param frame - Reference frame (global or thorax)
   * @returns Transverse plane definition
   */
  calculateTransversePlane(frame: AnatomicalReferenceFrame): AnatomicalPlane {
    return {
      name: 'transverse',
      normal: frame.yAxis,
      point: frame.origin,
      rotation: 0,
    };
  }

  /**
   * Calculate frame confidence based on landmark visibility
   *
   * Higher confidence when all landmarks are clearly visible.
   * Lower confidence indicates potential measurement errors.
   *
   * @param landmarks - Subset of landmarks used in frame calculation
   * @returns Confidence score [0, 1]
   */
  private calculateFrameConfidence(landmarks: PoseLandmark[]): number {
    if (landmarks.length === 0) return 0;

    const visibilities = landmarks.map((lm) => lm.visibility);
    const avgVisibility =
      visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;

    return avgVisibility;
  }
}
