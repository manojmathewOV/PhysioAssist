/**
 * Clinical Measurement Service
 * Gate 10A: Clinical-grade joint ROM measurements
 *
 * Provides joint-specific measurement functions with:
 * - Primary/secondary joint architecture
 * - Compensation detection
 * - Quality assessment
 * - ISB-compliant measurement planes
 * - Clinical threshold comparison
 *
 * References:
 * - Norkin & White (2016): Measurement of Joint Motion: A Guide to Goniometry
 * - Wu et al. (2005): ISB recommendation on definitions of joint coordinate systems
 * - AAOS (American Academy of Orthopaedic Surgeons) clinical guidelines
 */

import { ProcessedPoseData } from '../../types/pose';
import { AnatomicalReferenceFrame, CompensationPattern } from '../../types/biomechanics';
import {
  ClinicalJointMeasurement,
  ClinicalThresholds,
  MeasurementQuality,
  DEFAULT_CLINICAL_THRESHOLDS,
  DEFAULT_COMPENSATION_CONFIG,
  CompensationDetectionConfig,
} from '../../types/clinicalMeasurement';
import { GoniometerServiceV2 } from '../goniometerService.v2';
import { AnatomicalReferenceService } from './AnatomicalReferenceService';
import { CompensationDetectionService } from './CompensationDetectionService';
import { Vector3D } from '../../types/common';
import { angleBetweenVectors, projectVectorOntoPlane } from '../../utils/vectorMath';

/**
 * Clinical-grade joint measurement service
 * Transforms raw joint angles into clinically meaningful measurements
 *
 * Gate 10A + 10B Integration:
 * - Uses CompensationDetectionService for ISB-compliant compensation detection
 * - Leverages cached anatomical frames from Gate 9B.5
 * - Schema-agnostic via Gate 9B.6 goniometer
 */
export class ClinicalMeasurementService {
  private goniometer: GoniometerServiceV2;
  private anatomicalService: AnatomicalReferenceService;
  private compensationDetector: CompensationDetectionService;
  private clinicalThresholds: ClinicalThresholds;
  private compensationConfig: CompensationDetectionConfig;

  constructor(
    thresholds?: Partial<ClinicalThresholds>,
    compensationConfig?: Partial<CompensationDetectionConfig>
  ) {
    this.goniometer = new GoniometerServiceV2();
    this.anatomicalService = new AnatomicalReferenceService();
    this.compensationConfig = {
      ...DEFAULT_COMPENSATION_CONFIG,
      ...compensationConfig,
    };
    this.compensationDetector = new CompensationDetectionService(this.compensationConfig);
    this.clinicalThresholds = {
      ...DEFAULT_CLINICAL_THRESHOLDS,
      ...thresholds,
    };
  }

  // =============================================================================
  // SHOULDER MEASUREMENTS
  // =============================================================================

  /**
   * Measure shoulder forward flexion in sagittal plane
   *
   * Clinical specification:
   * - Plane: Sagittal (arm raised forward)
   * - Reference: Humerus angle from vertical
   * - Target ROM: 160° (normal healthy adult)
   * - Required view: Sagittal or frontal
   * - Secondary joints: Elbow (should be extended ~180°)
   *
   * @param poseData - Processed pose data with cached anatomical frames
   * @param side - 'left' or 'right'
   * @returns Clinical joint measurement with compensations and quality assessment
   *
   * @throws Error if view orientation is incorrect or frames unavailable
   *
   * @example
   * const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');
   * console.log(`Flexion: ${measurement.primaryJoint.angle}° (${measurement.primaryJoint.percentOfTarget}% of target)`);
   * if (measurement.compensations.length > 0) {
   *   console.log(`Compensations detected: ${measurement.compensations.map(c => c.type).join(', ')}`);
   * }
   */
  public measureShoulderFlexion(
    poseData: ProcessedPoseData,
    side: 'left' | 'right'
  ): ClinicalJointMeasurement {
    // 1. Validate orientation
    if (!['sagittal', 'frontal'].includes(poseData.viewOrientation || '')) {
      throw new Error(
        `Shoulder flexion requires sagittal or frontal view. Current: ${poseData.viewOrientation || 'unknown'}`
      );
    }

    // 2. Get cached frames (from Gate 9B.5)
    if (!poseData.cachedAnatomicalFrames) {
      throw new Error(
        'cachedAnatomicalFrames not available. Ensure Gate 9B.5 frame caching is active.'
      );
    }

    const { global, thorax } = poseData.cachedAnatomicalFrames;
    const humerusFrame = poseData.cachedAnatomicalFrames[`${side}_humerus`];

    if (!humerusFrame) {
      throw new Error(`${side} humerus frame not available. Check landmark visibility.`);
    }

    // 3. Define sagittal plane
    const sagittalPlane = this.anatomicalService.calculateSagittalPlane(thorax);

    // 4. Project humerus Y-axis onto sagittal plane
    const humerusVector = humerusFrame.yAxis;
    const humerusProjected = projectVectorOntoPlane(humerusVector, sagittalPlane.normal);

    // 5. Calculate angle from vertical (thorax Y-axis)
    const angleFromUp = angleBetweenVectors(humerusProjected, thorax.yAxis);

    // Convert to clinical flexion angle (measured from arm-down position)
    // Clinical: 0° = arm down, 90° = horizontal, 180° = overhead
    // angleFromUp: 0° = overhead, 90° = horizontal, 180° = down
    const flexionAngle = 180 - angleFromUp;

    // 6. Measure secondary joints (elbow should be extended)
    // Handle low confidence gracefully - measurement can continue with degraded quality
    let elbowMeasurement;
    let elbowExtended = false;
    let elbowDeviation = 0;
    let hasLowConfidenceElbow = false;

    try {
      elbowMeasurement = this.goniometer.calculateJointAngle(poseData, `${side}_elbow`);
      elbowExtended = elbowMeasurement.angle >= 175; // Should be ~180° (fully extended)
      elbowDeviation = 180 - elbowMeasurement.angle;
    } catch (error) {
      // Low confidence elbow - use fallback estimation
      hasLowConfidenceElbow = true;
      elbowMeasurement = {
        angle: 180, // Assume extended for safety
        measurementPlane: {
          name: 'sagittal' as const,
          normal: { x: 0, y: 0, z: 1 },
          point: { x: 0, y: 0, z: 0 },
        },
      };
      elbowExtended = false; // Mark as uncertain
      elbowDeviation = 0;
    }

    const secondaryJoints = {
      [`${side}_elbow`]: {
        angle: elbowMeasurement.angle,
        withinTolerance: elbowExtended,
        tolerance: 5,
        purpose: 'validation' as const,
        deviation: elbowDeviation,
        warning: hasLowConfidenceElbow
          ? 'Elbow visibility too low for accurate validation. Measurement may be unreliable.'
          : !elbowExtended
            ? `Elbow not fully extended (${elbowMeasurement.angle.toFixed(1)}°). May affect measurement accuracy.`
            : undefined,
      },
    };

    // 7. Detect compensations (trunk lean, rotation, shoulder hiking)
    const compensations = this.detectCompensations(poseData, `${side}_shoulder_flexion`);

    // 8. Assess measurement quality
    const quality = this.assessMeasurementQuality(poseData, [
      `${side}_shoulder`,
      `${side}_elbow`,
      `${side}_wrist`,
      `${side}_hip`,
    ]);

    // 9. Compare to clinical target
    const targetAngle = this.clinicalThresholds.shoulder.forwardFlexion.target;
    const minAcceptable = this.clinicalThresholds.shoulder.forwardFlexion.minAcceptable;
    const percentOfTarget = (flexionAngle / targetAngle) * 100;

    // Determine clinical grade
    let clinicalGrade: 'excellent' | 'good' | 'fair' | 'limited';
    if (flexionAngle >= targetAngle) {
      clinicalGrade = 'excellent';
    } else if (flexionAngle >= minAcceptable) {
      clinicalGrade = 'good';
    } else if (flexionAngle > minAcceptable * 0.75) {
      clinicalGrade = 'fair';
    } else {
      clinicalGrade = 'limited';
    }

    return {
      primaryJoint: {
        name: `${side}_shoulder`,
        type: 'shoulder',
        angle: flexionAngle,
        angleType: 'flexion',
        targetAngle,
        percentOfTarget,
        clinicalGrade,
      },
      secondaryJoints,
      referenceFrames: {
        global,
        local: humerusFrame,
        measurementPlane: sagittalPlane,
      },
      compensations,
      quality,
      timestamp: poseData.timestamp,
    };
  }

  /**
   * Measure shoulder abduction with scapulohumeral rhythm analysis
   *
   * Clinical specification:
   * - Plane: Scapular plane (35° anterior to coronal)
   * - Primary: Total abduction (humerus angle from vertical)
   * - Advanced: Scapulohumeral rhythm (glenohumeral vs scapulothoracic ratio)
   * - Normal rhythm: 2:1 to 3:1
   * - Target ROM: 160° total abduction
   * - Required view: Frontal or posterior
   *
   * Scapulohumeral rhythm: At 160° total abduction:
   * - ~120° glenohumeral (true shoulder)
   * - ~40° scapulothoracic (scapular rotation)
   * - Ratio: 120/40 = 3:1
   *
   * @param poseData - Processed pose data
   * @param side - 'left' or 'right'
   * @returns Clinical measurement with scapulohumeral rhythm components
   */
  public measureShoulderAbduction(
    poseData: ProcessedPoseData,
    side: 'left' | 'right'
  ): ClinicalJointMeasurement {
    // 1. Validate orientation
    if (!['frontal', 'posterior'].includes(poseData.viewOrientation || '')) {
      throw new Error(
        `Shoulder abduction requires frontal or posterior view. Current: ${poseData.viewOrientation || 'unknown'}`
      );
    }

    // 2. Get cached frames
    if (!poseData.cachedAnatomicalFrames) {
      throw new Error('cachedAnatomicalFrames not available.');
    }

    const { global, thorax } = poseData.cachedAnatomicalFrames;
    const humerusFrame = poseData.cachedAnatomicalFrames[`${side}_humerus`];

    if (!humerusFrame) {
      throw new Error(`${side} humerus frame not available.`);
    }

    // 3. Define scapular plane (35° from coronal)
    const scapularPlane = this.anatomicalService.calculateScapularPlane(thorax, 35);

    // 4. Total abduction: Humerus angle from vertical in scapular plane
    const humerusProjected = projectVectorOntoPlane(
      humerusFrame.yAxis,
      scapularPlane.normal
    );
    const angleFromVertical = angleBetweenVectors(humerusProjected, thorax.yAxis);

    // Clinical abduction angle conversion
    // Humerus Y-axis points from shoulder to elbow (downward at 0° abduction)
    // Thorax Y-axis points upward (from hips to shoulders)
    // At 0° abduction: humerus points down, angle from thorax Y = 180°, clinical = 0°
    // At 90° abduction: humerus is perpendicular, angle = 90°, clinical = 90°
    // At 180° abduction: humerus points up, angle = 0°, clinical = 180°
    const totalAbduction = 180 - angleFromVertical;

    // 5. Scapular upward rotation (scapulothoracic contribution)
    const scapularRotation = this.calculateScapularUpwardRotation(poseData, thorax);

    // 6. Glenohumeral contribution (estimate)
    // Assumption: Total = glenohumeral + scapulothoracic
    const glenohumeralContribution = totalAbduction - scapularRotation;

    // 7. Calculate scapulohumeral rhythm ratio
    const rhythmRatio =
      scapularRotation > 0 ? glenohumeralContribution / scapularRotation : Infinity;

    // 8. Detect abnormal rhythm
    const rhythmNormal =
      rhythmRatio >= this.clinicalThresholds.shoulder.scapulohumeralRhythm.min &&
      rhythmRatio <= this.clinicalThresholds.shoulder.scapulohumeralRhythm.max;

    // 9. Build compensations
    const compensations: CompensationPattern[] = [];

    if (!rhythmNormal && scapularRotation > 0) {
      compensations.push({
        type: 'shoulder_hiking',
        severity: rhythmRatio < 2.0 ? 'moderate' : 'mild',
        magnitude: scapularRotation,
        affectsJoint: `${side}_shoulder`,
        clinicalNote: `Abnormal scapulohumeral rhythm (${rhythmRatio.toFixed(1)}:1). Normal range: 2:1 to 3:1. Excessive scapular movement may indicate glenohumeral restriction.`,
      });
    }

    // 10. Detect other compensations
    const otherCompensations = this.detectCompensations(
      poseData,
      `${side}_shoulder_abduction`
    );
    compensations.push(...otherCompensations);

    // 11. Compare to clinical target
    const targetAngle = this.clinicalThresholds.shoulder.abduction.target;
    const minAcceptable = this.clinicalThresholds.shoulder.abduction.minAcceptable;
    const percentOfTarget = (totalAbduction / targetAngle) * 100;

    let clinicalGrade: 'excellent' | 'good' | 'fair' | 'limited';
    if (totalAbduction >= targetAngle) {
      clinicalGrade = 'excellent';
    } else if (totalAbduction >= minAcceptable) {
      clinicalGrade = 'good';
    } else if (totalAbduction >= minAcceptable * 0.75) {
      clinicalGrade = 'fair';
    } else {
      clinicalGrade = 'limited';
    }

    return {
      primaryJoint: {
        name: `${side}_shoulder`,
        type: 'shoulder',
        angle: totalAbduction,
        angleType: 'abduction',
        targetAngle,
        percentOfTarget,
        clinicalGrade,
        components: {
          glenohumeral: glenohumeralContribution,
          scapulothoracic: scapularRotation,
          rhythm: rhythmRatio,
          rhythmNormal,
        },
      },
      secondaryJoints: {},
      referenceFrames: {
        global,
        local: humerusFrame,
        measurementPlane: scapularPlane,
      },
      compensations,
      quality: this.assessMeasurementQuality(poseData, [
        `${side}_shoulder`,
        `${side}_elbow`,
        'left_shoulder',
        'right_shoulder', // Need both shoulders for scapular tilt
      ]),
      timestamp: poseData.timestamp,
    };
  }

  /**
   * Measure shoulder external/internal rotation
   *
   * Clinical specification:
   * - CRITICAL GATING: Elbow must be at 90° flexion (±10° tolerance)
   * - Plane: Transverse (horizontal)
   * - Reference: Forearm axis angle from anterior
   * - Target ROM: 90° external, 70° internal
   * - Required view: Frontal
   *
   * This measurement is ONLY valid when elbow is at 90° to isolate shoulder rotation.
   *
   * @param poseData - Processed pose data
   * @param side - 'left' or 'right'
   * @param targetElbowAngle - Required elbow angle (default 90°)
   * @returns Clinical measurement with elbow gating validation
   */
  public measureShoulderRotation(
    poseData: ProcessedPoseData,
    side: 'left' | 'right',
    targetElbowAngle: number = 90
  ): ClinicalJointMeasurement {
    // 1. Measure elbow angle first (GATING CONDITION)
    const elbowMeasurement = this.goniometer.calculateJointAngle(
      poseData,
      `${side}_elbow`
    );
    const elbowDeviation = Math.abs(elbowMeasurement.angle - targetElbowAngle);
    const elbowTolerance =
      this.clinicalThresholds.shoulder.externalRotation.elbowAngleTolerance;
    const elbowInTolerance = elbowDeviation <= elbowTolerance;

    if (!elbowInTolerance) {
      console.warn(
        `[ClinicalMeasurementService] Elbow angle (${elbowMeasurement.angle.toFixed(1)}°) deviates from target (${targetElbowAngle}°) by ${elbowDeviation.toFixed(1)}°. Rotation measurement may be invalid.`
      );
    }

    // 2. Get frames
    if (!poseData.cachedAnatomicalFrames) {
      throw new Error('cachedAnatomicalFrames not available.');
    }

    const { global } = poseData.cachedAnatomicalFrames;
    const forearmFrame = poseData.cachedAnatomicalFrames[`${side}_forearm`];

    if (!forearmFrame) {
      throw new Error(`${side} forearm frame not available. Check landmark visibility.`);
    }

    // 3. Shoulder rotation measurement with arm abducted
    // Clinical setup: arm at 90° abduction, elbow at 90° flexion
    // At 0° rotation (neutral): forearm points upward (vertical)
    // At 90° external rotation: forearm points forward (anterior)
    // Rotation is measured as angle from vertical (neutral) position

    // Calculate forearm angle from vertical in the rotation plane
    // The rotation plane is perpendicular to the humerus (upper arm) axis
    const forearmVector = forearmFrame.yAxis;

    // Vertical reference (upward direction)
    const verticalRef = { x: 0, y: -1, z: 0 }; // Y+ is down, so -Y is up

    // Calculate angle from vertical
    const angleFromVertical = angleBetweenVectors(forearmVector, verticalRef);

    // Determine rotation direction using forearm's Z component (anterior-posterior)
    // Positive Z = forward/anterior = external rotation
    // Negative Z = backward/posterior = internal rotation
    const isExternalRotation = forearmVector.z > 0;

    // Rotation angle is the deviation from vertical
    // At 0° rotation: forearm vertical, angle from vertical = 0°
    // At 90° rotation: forearm horizontal, angle from vertical = 90°
    const rotationAngle = angleFromVertical;

    const signedRotation = isExternalRotation ? rotationAngle : -rotationAngle;

    // Define transverse plane for reference (perpendicular to humerus, contains vertical and anterior-posterior)
    const rotationPlane = {
      name: 'transverse' as const,
      normal: { x: 1, y: 0, z: 0 }, // Normal to YZ plane (lateral direction)
      point: forearmFrame.origin, // Plane passes through elbow joint center
    };

    // 7. Secondary joints (elbow gating)
    const secondaryJoints = {
      [`${side}_elbow`]: {
        angle: elbowMeasurement.angle,
        withinTolerance: elbowInTolerance,
        tolerance: elbowTolerance,
        purpose: 'gating' as const,
        deviation: elbowDeviation,
        warning: !elbowInTolerance
          ? `Elbow should be at ${targetElbowAngle}° for valid rotation measurement. Current: ${elbowMeasurement.angle.toFixed(1)}°`
          : undefined,
      },
    };

    // 8. Compensations
    const compensations: CompensationPattern[] = [];

    if (!elbowInTolerance) {
      compensations.push({
        type: 'elbow_flexion',
        severity: elbowDeviation > 20 ? 'moderate' : 'mild',
        magnitude: elbowDeviation,
        affectsJoint: `${side}_shoulder`,
        clinicalNote: `Elbow flexion deviates by ${elbowDeviation.toFixed(1)}° from required ${targetElbowAngle}°. This invalidates rotation measurement.`,
      });
    }

    // Detect trunk compensations
    const trunkCompensations = this.detectCompensations(
      poseData,
      `${side}_shoulder_rotation`
    );
    compensations.push(...trunkCompensations);

    // 9. Clinical target
    const targetAngle = isExternalRotation
      ? this.clinicalThresholds.shoulder.externalRotation.target
      : this.clinicalThresholds.shoulder.internalRotation.target;

    const percentOfTarget = (Math.abs(signedRotation) / targetAngle) * 100;

    return {
      primaryJoint: {
        name: `${side}_shoulder`,
        type: 'shoulder',
        angle: Math.abs(signedRotation),
        angleType: isExternalRotation ? 'external_rotation' : 'internal_rotation',
        targetAngle,
        percentOfTarget,
        signedAngle: signedRotation, // Preserve sign for direction
      },
      secondaryJoints,
      referenceFrames: {
        global,
        local: forearmFrame,
        measurementPlane: rotationPlane,
      },
      compensations,
      quality: this.assessMeasurementQuality(poseData, [
        `${side}_shoulder`,
        `${side}_elbow`,
        `${side}_wrist`,
      ]),
      timestamp: poseData.timestamp,
    };
  }

  // =============================================================================
  // ELBOW MEASUREMENTS
  // =============================================================================

  /**
   * Measure elbow flexion in sagittal plane
   *
   * Clinical specification:
   * - Plane: Sagittal
   * - Simple hinge joint (single axis)
   * - Target ROM: 150° flexion
   * - Extension: 0° (straight arm)
   *
   * @param poseData - Processed pose data
   * @param side - 'left' or 'right'
   * @returns Clinical elbow measurement
   */
  public measureElbowFlexion(
    poseData: ProcessedPoseData,
    side: 'left' | 'right'
  ): ClinicalJointMeasurement {
    // Use refactored goniometer (already plane-projected)
    const elbowMeasurement = this.goniometer.calculateJointAngle(
      poseData,
      `${side}_elbow`
    );

    // Convert geometric angle to clinical flexion angle
    // Geometric: 180° = straight, 30° = bent
    // Clinical flexion: 0° = straight, 150° = bent
    const flexionAngle = 180 - elbowMeasurement.angle;

    // Check shoulder stabilization
    const shoulderMeasurement = this.goniometer.calculateJointAngle(
      poseData,
      `${side}_shoulder`
    );

    if (!poseData.cachedAnatomicalFrames) {
      throw new Error('cachedAnatomicalFrames not available.');
    }

    const forearmFrame = poseData.cachedAnatomicalFrames[`${side}_forearm`];
    if (!forearmFrame) {
      throw new Error(`${side} forearm frame not available.`);
    }

    // Clinical target
    const targetAngle = this.clinicalThresholds.elbow.flexion.target;
    const minAcceptable = this.clinicalThresholds.elbow.flexion.minAcceptable;
    const percentOfTarget = (flexionAngle / targetAngle) * 100;

    let clinicalGrade: 'excellent' | 'good' | 'fair' | 'limited';
    if (flexionAngle >= targetAngle) {
      clinicalGrade = 'excellent';
    } else if (flexionAngle >= minAcceptable) {
      clinicalGrade = 'good';
    } else if (flexionAngle >= minAcceptable * 0.75) {
      clinicalGrade = 'fair';
    } else {
      clinicalGrade = 'limited';
    }

    return {
      primaryJoint: {
        name: `${side}_elbow`,
        type: 'elbow',
        angle: flexionAngle,
        angleType: 'flexion',
        targetAngle,
        percentOfTarget,
        clinicalGrade,
      },
      secondaryJoints: {
        [`${side}_shoulder`]: {
          angle: shoulderMeasurement.angle,
          withinTolerance: true, // For context only
          purpose: 'reference',
        },
      },
      referenceFrames: {
        global: poseData.cachedAnatomicalFrames.global,
        local: forearmFrame,
        measurementPlane: elbowMeasurement.measurementPlane,
      },
      compensations: this.detectCompensations(poseData, `${side}_elbow_flexion`),
      quality: this.assessMeasurementQuality(poseData, [
        `${side}_shoulder`,
        `${side}_elbow`,
        `${side}_wrist`,
      ]),
      timestamp: poseData.timestamp,
    };
  }

  // =============================================================================
  // KNEE MEASUREMENTS
  // =============================================================================

  /**
   * Measure knee flexion in sagittal plane
   *
   * Clinical specification:
   * - Plane: Sagittal
   * - Simple hinge joint (single axis)
   * - Target ROM: 135° flexion
   * - Extension: 0° (straight leg)
   *
   * @param poseData - Processed pose data
   * @param side - 'left' or 'right'
   * @returns Clinical knee measurement
   */
  public measureKneeFlexion(
    poseData: ProcessedPoseData,
    side: 'left' | 'right'
  ): ClinicalJointMeasurement {
    // Try to use refactored goniometer, but handle missing landmarks gracefully
    let kneeMeasurement;

    try {
      kneeMeasurement = this.goniometer.calculateJointAngle(poseData, `${side}_knee`);
    } catch (error) {
      // If landmarks are missing (e.g., ankle), use fallback calculation
      // This allows measurement to continue with degraded quality

      // Fallback: estimate knee angle using just hip-knee segment orientation
      // This is less accurate but still provides useful clinical information
      const hip = poseData.landmarks.find((lm) => lm.name === `${side}_hip`);
      const knee = poseData.landmarks.find((lm) => lm.name === `${side}_knee`);

      if (!hip || !knee) {
        throw new Error(
          `Critical landmarks (hip, knee) missing for ${side}_knee measurement`
        );
      }

      // Estimate interior angle based on vertical deviation
      // Vertical leg = 180° (straight), horizontal leg = 90°, etc.
      const legVector = { x: knee.x - hip.x, y: knee.y - hip.y, z: knee.z || 0 };
      const vertical = { x: 0, y: 1, z: 0 }; // Downward is positive Y
      const angleFromVertical = angleBetweenVectors(legVector, vertical);

      // Approximate interior angle (this is a simplified estimation)
      const estimatedAngle = 180 - angleFromVertical;

      kneeMeasurement = {
        angle: estimatedAngle,
        measurementPlane: {
          name: 'sagittal' as const,
          normal: { x: 0, y: 0, z: 1 },
          point: knee,
        },
      };
    }

    // Convert geometric angle to clinical flexion angle
    // Goniometer measures angle between bone segments (180° = straight, 90° = bent)
    // Clinical flexion: 0° = straight, 135° = fully flexed
    // Conversion: clinical = 180° - geometric
    const flexionAngle = 180 - kneeMeasurement.angle;

    if (!poseData.cachedAnatomicalFrames) {
      throw new Error('cachedAnatomicalFrames not available.');
    }

    // Clinical target
    const targetAngle = this.clinicalThresholds.knee.flexion.target;
    const minAcceptable = this.clinicalThresholds.knee.flexion.minAcceptable;
    const percentOfTarget = (flexionAngle / targetAngle) * 100;

    let clinicalGrade: 'excellent' | 'good' | 'fair' | 'limited';
    if (flexionAngle >= targetAngle) {
      clinicalGrade = 'excellent';
    } else if (flexionAngle >= minAcceptable) {
      clinicalGrade = 'good';
    } else if (flexionAngle >= minAcceptable * 0.75) {
      clinicalGrade = 'fair';
    } else {
      clinicalGrade = 'limited';
    }

    return {
      primaryJoint: {
        name: `${side}_knee`,
        type: 'knee',
        angle: flexionAngle,
        angleType: 'flexion',
        targetAngle,
        percentOfTarget,
        clinicalGrade,
      },
      secondaryJoints: {},
      referenceFrames: {
        global: poseData.cachedAnatomicalFrames.global,
        local: poseData.cachedAnatomicalFrames.global, // Simplified (no leg segment frames yet)
        measurementPlane: kneeMeasurement.measurementPlane,
      },
      compensations: this.detectCompensations(poseData, `${side}_knee_flexion`),
      quality: this.assessMeasurementQuality(poseData, [
        `${side}_hip`,
        `${side}_knee`,
        `${side}_ankle`,
      ]),
      timestamp: poseData.timestamp,
    };
  }

  // =============================================================================
  // QUALITY ASSESSMENT
  // =============================================================================

  /**
   * Assess measurement quality based on multiple factors
   *
   * Quality factors:
   * 1. Landmark visibility (weighted average of required landmarks)
   * 2. Frame stability (anatomical frame confidence)
   * 3. Orientation match (does view match requirements?)
   * 4. Depth reliability (higher if real depth data available)
   *
   * @param poseData - Processed pose data
   * @param requiredLandmarks - Landmark names required for this measurement
   * @returns Quality assessment with recommendations
   */
  private assessMeasurementQuality(
    poseData: ProcessedPoseData,
    requiredLandmarks: string[]
  ): MeasurementQuality {
    // Factor 1: Landmark visibility (weighted average)
    // Include missing landmarks (visibility = 0) in the average to properly degrade quality
    const visibilities = requiredLandmarks.map(
      (name) => poseData.landmarks.find((lm) => lm.name === name)?.visibility || 0
    );

    const landmarkVisibility =
      visibilities.length > 0
        ? visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length
        : 0;

    // Factor 2: Frame stability (check if cached frames have high confidence)
    const frameConfidences = [
      poseData.cachedAnatomicalFrames?.global.confidence || 0,
      poseData.cachedAnatomicalFrames?.thorax.confidence || 0,
    ];
    const frameStability =
      frameConfidences.reduce((sum, c) => sum + c, 0) / frameConfidences.length;

    // Factor 3: Orientation match
    const orientationMatch = poseData.viewOrientation ? 1.0 : 0.5;

    // Factor 4: Depth reliability
    const depthReliability = poseData.hasDepth ? 0.9 : 0.6;

    // Overall quality score (weighted average)
    const overallScore =
      0.5 * landmarkVisibility + 0.3 * frameStability + 0.2 * orientationMatch;

    // Determine overall grade
    // Use stricter thresholds to ensure low visibility properly degrades quality
    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallScore >= 0.85) {
      overall = 'excellent';
    } else if (overallScore >= 0.75) {
      overall = 'good';
    } else if (overallScore >= 0.6) {
      overall = 'fair';
    } else {
      overall = 'poor';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (landmarkVisibility < 0.7) {
      recommendations.push(
        'Improve lighting or camera position to increase landmark visibility.'
      );
    }
    if (frameStability < 0.7) {
      recommendations.push(
        'Reduce camera shake or body movement for more stable measurements.'
      );
    }
    if (!poseData.viewOrientation) {
      recommendations.push(
        'Ensure camera orientation is detected (frontal, sagittal, or posterior).'
      );
    }
    if (!poseData.hasDepth) {
      recommendations.push('Consider using depth sensor for improved 3D accuracy.');
    }

    return {
      overall,
      depthReliability,
      landmarkVisibility,
      frameStability,
      orientationMatch,
      recommendations,
    };
  }

  // =============================================================================
  // COMPENSATION DETECTION
  // =============================================================================

  /**
   * Detect compensation patterns during movement
   *
   * Gate 10B Integration: Uses CompensationDetectionService for comprehensive,
   * ISB-compliant compensation detection.
   *
   * Detects 6 compensation types:
   * - Trunk lean (lateral flexion)
   * - Trunk rotation (transverse plane)
   * - Shoulder hiking (scapular elevation)
   * - Elbow flexion drift (unintended flexion)
   * - Hip hike (pelvic elevation)
   * - Contralateral lean (opposite side lean)
   *
   * @param poseData - Processed pose data
   * @param jointName - Joint being measured (for context)
   * @returns Array of detected compensation patterns
   */
  private detectCompensations(
    poseData: ProcessedPoseData,
    jointName: string
  ): CompensationPattern[] {
    // Delegate to CompensationDetectionService (Gate 10B)
    const allCompensations = this.compensationDetector.detectCompensations(
      poseData,
      undefined, // No previous frame for static measurements
      jointName // Movement context for filtering relevant compensations
    );

    // Filter and adjust compensations based on ClinicalMeasurementService's thresholds
    // (may be different/looser than CompensationDetectionService's built-in thresholds)
    return allCompensations
      .filter((comp) => {
        // Convert snake_case to camelCase for config lookup
        const configKey = comp.type.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        const config =
          this.compensationConfig[configKey as keyof typeof this.compensationConfig];
        if (!config) return true; // Keep if no config defined

        // Check if magnitude exceeds the threshold
        return comp.magnitude >= config.threshold;
      })
      .map((comp) => {
        // Recalculate severity based on ClinicalMeasurementService's severityThresholds
        const configKey = comp.type.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        const config =
          this.compensationConfig[configKey as keyof typeof this.compensationConfig];

        if (config && config.severityThresholds) {
          const { minimal, mild, moderate } = config.severityThresholds;
          let newSeverity: 'minimal' | 'mild' | 'moderate' | 'severe';

          if (comp.magnitude < minimal) {
            newSeverity = 'minimal';
          } else if (comp.magnitude < mild) {
            newSeverity = 'mild';
          } else if (comp.magnitude < moderate) {
            newSeverity = 'moderate';
          } else {
            newSeverity = 'severe';
          }

          return { ...comp, severity: newSeverity };
        }

        return comp;
      });
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Calculate scapular upward rotation from shoulder line tilt
   * Approximates scapulothoracic contribution to shoulder abduction
   *
   * This is a 2D approximation based on shoulder landmark positions.
   * True 3D scapular tracking requires scapula-specific landmarks.
   *
   * @param poseData - Processed pose data
   * @param thoraxFrame - Thorax anatomical reference frame
   * @returns Scapular upward rotation angle (degrees)
   */
  private calculateScapularUpwardRotation(
    poseData: ProcessedPoseData,
    _thoraxFrame: AnatomicalReferenceFrame
  ): number {
    const leftShoulder = poseData.landmarks.find((lm) => lm.name === 'left_shoulder');
    const rightShoulder = poseData.landmarks.find((lm) => lm.name === 'right_shoulder');

    if (!leftShoulder || !rightShoulder) {
      return 0; // Cannot calculate without both shoulders
    }

    // Shoulder line vector (left to right shoulder)
    const shoulderLine: Vector3D = {
      x: rightShoulder.x - leftShoulder.x,
      y: rightShoulder.y - leftShoulder.y,
      z: (rightShoulder.z || 0) - (leftShoulder.z || 0),
    };

    // For frontal view, project onto XY plane (image plane, normal = Z-axis)
    // This preserves the visible left-right and up-down components
    const frontalPlaneNormal: Vector3D = { x: 0, y: 0, z: 1 };
    const shoulderLineProjected = projectVectorOntoPlane(
      shoulderLine,
      frontalPlaneNormal
    );

    // Horizontal reference (left-right direction in image)
    const horizontal: Vector3D = { x: 1, y: 0, z: 0 };

    // Angle from horizontal = scapular upward rotation
    const tiltAngle = angleBetweenVectors(shoulderLineProjected, horizontal);

    // Scapular upward rotation ≈ shoulder line tilt angle
    // 0° = horizontal (neutral), positive angle = upward rotation
    return tiltAngle;
  }

  /**
   * Update clinical thresholds configuration
   *
   * @param newThresholds - Partial threshold overrides
   */
  public updateThresholds(newThresholds: Partial<ClinicalThresholds>): void {
    this.clinicalThresholds = {
      ...this.clinicalThresholds,
      ...newThresholds,
    };
  }

  /**
   * Update compensation detection configuration
   *
   * @param newConfig - Partial compensation config overrides
   */
  public updateCompensationConfig(newConfig: Partial<CompensationDetectionConfig>): void {
    this.compensationConfig = {
      ...this.compensationConfig,
      ...newConfig,
    };
  }
}
