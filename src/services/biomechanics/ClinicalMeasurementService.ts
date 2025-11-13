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
import { AnatomicalReferenceFrame } from '../../types/biomechanics';
import {
  ClinicalJointMeasurement,
  ClinicalThresholds,
  CompensationPattern,
  MeasurementQuality,
  DEFAULT_CLINICAL_THRESHOLDS,
  DEFAULT_COMPENSATION_CONFIG,
  CompensationDetectionConfig,
} from '../../types/clinicalMeasurement';
import { GoniometerServiceV2 } from '../goniometerService.v2';
import { AnatomicalReferenceService } from './AnatomicalReferenceService';
import { CompensationDetectionService } from './CompensationDetectionService';
import { Vector3D } from '../../types/common';
import {
  angleBetweenVectors,
  projectVectorOntoPlane,
  crossProduct,
  dotProduct,
} from '../../utils/vectorMath';

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
    compensationConfig?: Partial<CompensationDetectionConfig>,
    goniometerConfig?: {
      smoothingWindow?: number;
      minConfidence?: number;
      use3D?: boolean;
    }
  ) {
    this.goniometer = new GoniometerServiceV2(goniometerConfig);
    this.anatomicalService = new AnatomicalReferenceService();
    this.compensationDetector = new CompensationDetectionService();
    this.clinicalThresholds = {
      ...DEFAULT_CLINICAL_THRESHOLDS,
      ...thresholds,
    };
    this.compensationConfig = {
      ...DEFAULT_COMPENSATION_CONFIG,
      ...compensationConfig,
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
    let elbowMeasurement;
    let secondaryJoints = {};
    try {
      elbowMeasurement = this.goniometer.calculateJointAngle(poseData, `${side}_elbow`);
      const elbowExtended = elbowMeasurement.angle >= 175; // Should be ~180° (fully extended)
      const elbowDeviation = 180 - elbowMeasurement.angle;

      secondaryJoints = {
        [`${side}_elbow`]: {
          angle: elbowMeasurement.angle,
          withinTolerance: elbowExtended,
          tolerance: 5,
          purpose: 'validation' as const,
          deviation: elbowDeviation,
          warning: !elbowExtended
            ? `Elbow not fully extended (${elbowMeasurement.angle.toFixed(1)}°). May affect measurement accuracy.`
            : undefined,
        },
      };
    } catch (error) {
      // Elbow measurement failed (missing landmarks or low confidence)
      // Continue with primary measurement but note degraded quality
    }

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

    // angleFromVertical already represents clinical abduction:
    // 0° = arm down (humerus || thorax yAxis)
    // 180° = arm overhead (humerus antiparallel to thorax yAxis)
    const totalAbduction = angleFromVertical;

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
    const elbowGoniometerResult = this.goniometer.calculateJointAngle(
      poseData,
      `${side}_elbow`
    );
    // Convert interior angle to clinical flexion (same as measureElbowFlexion)
    const elbowFlexionAngle = 180 - elbowGoniometerResult.angle;
    const elbowDeviation = Math.abs(elbowFlexionAngle - targetElbowAngle);
    const elbowTolerance =
      this.clinicalThresholds.shoulder.externalRotation.elbowAngleTolerance;
    const elbowInTolerance = elbowDeviation <= elbowTolerance;

    if (!elbowInTolerance) {
      console.warn(
        `[ClinicalMeasurementService] Elbow angle (${elbowFlexionAngle.toFixed(1)}°) deviates from target (${targetElbowAngle}°) by ${elbowDeviation.toFixed(1)}°. Rotation measurement may be invalid.`
      );
    }

    // 2. Get frames
    if (!poseData.cachedAnatomicalFrames) {
      throw new Error('cachedAnatomicalFrames not available.');
    }

    const { global, thorax } = poseData.cachedAnatomicalFrames;
    const forearmFrame = poseData.cachedAnatomicalFrames[`${side}_forearm`];

    if (!forearmFrame) {
      throw new Error(`${side} forearm frame not available. Check landmark visibility.`);
    }

    // 3. Define transverse plane
    const transversePlane = this.anatomicalService.calculateTransversePlane(thorax);

    // 4. Project forearm Y-axis onto transverse plane
    const forearmProjected = projectVectorOntoPlane(
      forearmFrame.yAxis,
      transversePlane.normal
    );

    // 5. Calculate rotation angle from anterior (thorax X-axis)
    const rotationAngle = angleBetweenVectors(forearmProjected, thorax.xAxis);

    // 6. Determine rotation direction (internal vs external)
    const cross = crossProduct(forearmProjected, thorax.xAxis);
    const dotWithY = dotProduct(cross, thorax.yAxis);
    const isExternalRotation = side === 'left' ? dotWithY > 0 : dotWithY < 0;

    const signedRotation = isExternalRotation ? rotationAngle : -rotationAngle;

    // 7. Secondary joints (elbow gating)
    const secondaryJoints = {
      [`${side}_elbow`]: {
        angle: elbowFlexionAngle,
        withinTolerance: elbowInTolerance,
        tolerance: elbowTolerance,
        purpose: 'gating' as const,
        deviation: elbowDeviation,
        warning: !elbowInTolerance
          ? `Elbow should be at ${targetElbowAngle}° for valid rotation measurement. Current: ${elbowFlexionAngle.toFixed(1)}°`
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

    // 10. Assess quality and add elbow gating warnings if needed
    const quality = this.assessMeasurementQuality(poseData, [
      `${side}_shoulder`,
      `${side}_elbow`,
      `${side}_wrist`,
    ]);

    // Add elbow gating warning to quality object
    if (!elbowInTolerance) {
      quality.warnings = quality.warnings || [];
      quality.warnings.push(
        `Elbow angle (${elbowFlexionAngle.toFixed(1)}°) deviates from required ${targetElbowAngle}° by ${elbowDeviation.toFixed(1)}°. Rotation measurement may be invalid.`
      );
    }

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
        measurementPlane: transversePlane,
      },
      compensations,
      quality,
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

    // Elbow flexion: Convert interior angle to clinical flexion
    // Interior angle: 180° = straight (antiparallel vectors), 30° = fully flexed
    // Clinical flexion: 0° = straight, 150° = fully flexed
    // Conversion: clinical = 180 - interior
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
    // Use refactored goniometer
    let flexionAngle = 0;
    let measurementPlane;
    let lowQuality = false;

    try {
      const kneeMeasurement = this.goniometer.calculateJointAngle(
        poseData,
        `${side}_knee`
      );
      // The goniometer returns the interior angle between femur and tibia segments
      // Interior angle: 180° = straight leg, 45° = fully flexed
      // Clinical flexion: 0° = straight leg, 135° = fully flexed
      // Conversion: clinical_flexion = 180° - interior_angle
      flexionAngle = 180 - kneeMeasurement.angle;
      measurementPlane = kneeMeasurement.measurementPlane;
    } catch (error) {
      // Goniometer failed (missing landmarks or low confidence)
      // Return measurement with degraded quality
      lowQuality = true;
      flexionAngle = 0; // Fallback value
    }

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

    const quality = this.assessMeasurementQuality(poseData, [
      `${side}_hip`,
      `${side}_knee`,
      `${side}_ankle`,
    ]);

    // Override quality if measurement failed
    if (lowQuality) {
      quality.overall = 'poor';
      quality.landmarkVisibility = quality.landmarkVisibility * 0.8; // Degrade visibility score
      if (!quality.recommendations.includes('Improve landmark visibility')) {
        quality.recommendations.push('Improve landmark visibility');
      }
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
        measurementPlane: measurementPlane || {
          name: 'sagittal',
          normal: { x: 0, y: 0, z: 1 },
          point: { x: 0, y: 0, z: 0 },
        },
      },
      compensations: this.detectCompensations(poseData, `${side}_knee_flexion`),
      quality,
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
    const visibilities = requiredLandmarks
      .map((name) => poseData.landmarks.find((lm) => lm.name === name)?.visibility || 0)
      .filter((v) => v > 0);

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
    // Special case: if landmarks are below acceptable threshold, quality is poor/fair
    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (landmarkVisibility < 0.6) {
      overall = landmarkVisibility < 0.5 ? 'poor' : 'fair';
    } else if (overallScore >= 0.85) {
      overall = 'excellent';
    } else if (overallScore >= 0.7) {
      overall = 'good';
    } else if (overallScore >= 0.5) {
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
          const { mild, moderate, severe } = config.severityThresholds;
          let newSeverity: 'minimal' | 'mild' | 'moderate' | 'severe';

          if (comp.magnitude < mild) {
            newSeverity = 'minimal';
          } else if (comp.magnitude < moderate) {
            newSeverity = 'mild';
          } else if (comp.magnitude < severe) {
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
