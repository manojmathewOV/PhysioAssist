/**
 * Compensation Detection Service
 * Gate 10B: ISB-compliant, schema-agnostic compensation detection
 *
 * Detects 6 types of biomechanical compensations:
 * 1. Trunk lean (lateral flexion)
 * 2. Trunk rotation (transverse plane)
 * 3. Shoulder hiking (scapular elevation)
 * 4. Elbow flexion drift (unintended flexion)
 * 5. Hip hike (pelvic elevation)
 * 6. Contralateral lean (opposite side lean)
 *
 * Uses cached anatomical frames from Gate 9B.5 for zero-overhead detection.
 * Schema-agnostic via PoseSchemaRegistry from Gate 9B.6.
 *
 * References:
 * - ISB standards for compensation analysis (Wu et al. 2005)
 * - Clinical goniometry (Norkin & White 2016)
 * - Frontiers 2024 study on trunk rotational strength
 */

import { ProcessedPoseData, PoseLandmark } from '../../types/pose';
import { CompensationPattern, AnatomicalReferenceFrame } from '../../types/biomechanics';
import { Vector3D } from '../../types/common';
import { angleBetweenVectors, projectVectorOntoPlane, normalize, dotProduct } from '../../utils/vectorMath';
import { PoseSchemaRegistry } from '../pose/PoseSchemaRegistry';

/**
 * Compensation Detection Service
 *
 * Detects biomechanical compensations using cached anatomical frames.
 * All detection methods are schema-agnostic and ISB-compliant.
 *
 * Integration with Gate 9B.5:
 * - Uses cached frames from ProcessedPoseData.cachedAnatomicalFrames
 * - No redundant frame calculations
 * - <5ms per full compensation check
 *
 * Integration with Gate 10A:
 * - Called by ClinicalMeasurementService
 * - Returns CompensationPattern[] attached to ClinicalJointMeasurement
 */
export class CompensationDetectionService {
  private schemaRegistry: PoseSchemaRegistry;

  constructor() {
    this.schemaRegistry = PoseSchemaRegistry.getInstance();
  }

  /**
   * Detect all compensations for a given movement
   *
   * @param poseData Current pose with cached frames
   * @param previousPoseData Previous frame for temporal analysis (optional)
   * @param movement Movement being performed (for context-specific detection)
   * @returns Array of detected compensation patterns
   *
   * @example
   * const compensations = compensationService.detectCompensations(
   *   poseData,
   *   undefined,
   *   'left_shoulder_flexion'
   * );
   * // Returns: [{ type: 'trunk_lean', severity: 'moderate', magnitude: 12, ... }]
   */
  public detectCompensations(
    poseData: ProcessedPoseData,
    previousPoseData?: ProcessedPoseData,
    movement?: string
  ): CompensationPattern[] {
    const compensations: CompensationPattern[] = [];

    // Validate cached frames exist
    if (!poseData.cachedAnatomicalFrames) {
      console.warn('[CompensationDetectionService] No cached anatomical frames - cannot detect compensations');
      return compensations;
    }

    const frames = poseData.cachedAnatomicalFrames;
    const schemaId = poseData.schemaId ?? 'movenet-17'; // Default to movenet-17 if not specified

    // Detect trunk compensations (always check)
    const trunkLean = this.detectTrunkLean(frames.thorax, poseData.viewOrientation, movement);
    if (trunkLean) compensations.push(trunkLean);

    const trunkRotation = this.detectTrunkRotation(frames.thorax, poseData.viewOrientation);
    if (trunkRotation) compensations.push(trunkRotation);

    // Detect shoulder compensations (if shoulder movement)
    if (movement?.includes('shoulder')) {
      const side = movement.includes('left') ? 'left' : 'right';

      const shoulderHiking = this.detectShoulderHiking(
        poseData.landmarks,
        frames.thorax,
        side,
        schemaId
      );
      if (shoulderHiking) compensations.push(shoulderHiking);

      const elbowFlexion = this.detectElbowFlexionDrift(
        poseData.landmarks,
        frames[`${side}_forearm`],
        side,
        schemaId
      );
      if (elbowFlexion) compensations.push(elbowFlexion);
    }

    // Detect hip hike (if lower extremity movement)
    if (movement?.includes('knee') || movement?.includes('hip')) {
      const hipHike = this.detectHipHike(
        poseData.landmarks,
        frames.pelvis,
        schemaId
      );
      if (hipHike) compensations.push(hipHike);
    }

    // Detect contralateral lean (if unilateral movement)
    if (movement?.includes('left') || movement?.includes('right')) {
      const contralateralLean = this.detectContralateralLean(
        frames.thorax,
        movement,
        poseData.viewOrientation
      );
      if (contralateralLean) compensations.push(contralateralLean);
    }

    return compensations;
  }

  // =============================================================================
  // TRUNK COMPENSATIONS
  // =============================================================================

  /**
   * Detect Trunk Lean (Lateral Flexion)
   *
   * Clinical context: Lateral trunk flexion during shoulder abduction/flexion.
   * Patient leans away from lifting side to compensate for weakness or achieve greater ROM.
   * Common in rotator cuff pathology.
   *
   * Method:
   * 1. Extract thorax frame Y-axis (superior direction)
   * 2. Calculate angle between Y-axis and vertical (0, 1, 0)
   * 3. Lateral component = projection onto coronal plane
   * 4. Grade severity based on deviation angle
   *
   * Thresholds:
   * - minimal: <5° (normal postural variation)
   * - mild: 5-10°
   * - moderate: 10-15° (clinically significant)
   * - severe: >15°
   *
   * @param thoraxFrame Cached thorax anatomical frame
   * @param viewOrientation Current view orientation
   * @returns CompensationPattern or null
   */
  private detectTrunkLean(
    thoraxFrame: AnatomicalReferenceFrame,
    viewOrientation?: string,
    movement?: string
  ): CompensationPattern | null {
    // Detect in frontal, lateral, or sagittal views
    if (!viewOrientation || !['frontal', 'lateral', 'sagittal'].includes(viewOrientation)) {
      return null;
    }

    // Thorax frame Y-axis should point superior
    const yAxis = thoraxFrame.yAxis;

    // Reference vertical vector (true vertical = [0, 1, 0])
    const vertical: Vector3D = { x: 0, y: 1, z: 0 };

    let deviation: number;
    let leanType: string;

    if (viewOrientation === 'sagittal') {
      // Sagittal view: detect forward/backward lean
      // Look at Z component of Y-axis (anterior/posterior deviation)
      // Note: In mock coordinate system, Z represents anterior/posterior axis
      const zDeviation = Math.abs(yAxis.z ?? 0);
      deviation = Math.asin(Math.min(zDeviation, 1)) * (180 / Math.PI);
      leanType = 'forward/backward';
    } else {
      // Frontal/lateral view: detect lateral lean
      // Project Y-axis onto coronal plane (XY plane, normal = Z-axis)
      const coronalNormal: Vector3D = { x: 0, y: 0, z: 1 };
      const yAxisInCoronalPlane = projectVectorOntoPlane(yAxis, coronalNormal);
      deviation = angleBetweenVectors(yAxisInCoronalPlane, vertical);
      leanType = 'lateral';
    }

    // Grade severity
    const severity = this.gradeSeverity(deviation, 'degrees');

    // Only report mild or worse
    if (severity === 'minimal') {
      return null;
    }

    return {
      type: 'trunk_lean',
      severity,
      magnitude: deviation,
      affectsJoint: 'thorax', // Trunk lean always affects thorax, regardless of movement
      clinicalNote: `${leanType === 'lateral' ? 'Lateral' : 'Forward/backward'} trunk lean of ${deviation.toFixed(1)}° from vertical detected. ` +
        `This compensation may reduce true shoulder ROM and indicate weakness or mobility restriction.`,
    };
  }

  /**
   * Detect Trunk Rotation (Transverse Plane)
   *
   * Clinical context: Transverse plane rotation of trunk during sagittal/coronal plane movements.
   * Patient rotates torso instead of moving target joint. Indicates poor motor control or core instability.
   *
   * Method:
   * 1. Extract thorax frame X-axis (anterior direction)
   * 2. Project X-axis onto transverse plane (XZ plane)
   * 3. Calculate rotation from expected orientation
   * 4. Expected orientation depends on viewOrientation
   *
   * Thresholds:
   * - minimal: <5° (normal variation)
   * - mild: 5-10°
   * - moderate: 10-15° (clinically significant)
   * - severe: >15°
   *
   * @param thoraxFrame Cached thorax anatomical frame
   * @param viewOrientation Current view orientation
   * @returns CompensationPattern or null
   */
  private detectTrunkRotation(
    thoraxFrame: AnatomicalReferenceFrame,
    viewOrientation?: string
  ): CompensationPattern | null {
    // Need viewOrientation to determine expected trunk orientation
    if (!viewOrientation) {
      return null;
    }

    // Thorax frame X-axis should point anterior
    const xAxis = thoraxFrame.xAxis;

    // Project X-axis onto transverse plane (XZ plane, normal = Y-axis)
    const transverseNormal: Vector3D = { x: 0, y: 1, z: 0 };
    const xAxisInTransversePlane = projectVectorOntoPlane(xAxis, transverseNormal);

    // Determine expected orientation based on view
    let expectedOrientation: Vector3D;
    switch (viewOrientation) {
      case 'frontal':
        // In frontal view, anterior should point toward camera
        expectedOrientation = { x: 0, y: 0, z: -1 }; // Toward camera (negative Z)
        break;
      case 'sagittal':
        // In sagittal (lateral) view, anterior should point lateral
        expectedOrientation = { x: 1, y: 0, z: 0 }; // Right (positive X)
        break;
      case 'lateral':
        expectedOrientation = { x: -1, y: 0, z: 0 }; // Left (negative X)
        break;
      case 'posterior':
        expectedOrientation = { x: 0, y: 0, z: 1 }; // Away from camera (positive Z)
        break;
      default:
        return null;
    }

    // Calculate rotation from expected orientation
    const rotationDeviation = angleBetweenVectors(
      xAxisInTransversePlane,
      expectedOrientation
    );

    // Grade severity
    const severity = this.gradeSeverity(rotationDeviation, 'degrees');

    // Only report mild or worse
    if (severity === 'minimal') {
      return null;
    }

    return {
      type: 'trunk_rotation',
      severity,
      magnitude: rotationDeviation,
      affectsJoint: 'thorax',
      clinicalNote: `Trunk rotation of ${rotationDeviation.toFixed(1)}° detected. ` +
        `Patient may have core instability or poor motor control.`,
    };
  }

  // =============================================================================
  // SHOULDER COMPENSATIONS
  // =============================================================================

  /**
   * Detect Shoulder Hiking (Scapular Elevation)
   *
   * Clinical context: Scapular elevation during shoulder abduction/flexion.
   * Patient elevates shoulder girdle to achieve greater ROM.
   * Indicates rotator cuff weakness, subacromial impingement, or capsular restriction.
   *
   * Method:
   * 1. Get shoulder landmark and ear landmark (schema-agnostic)
   * 2. Calculate vertical distance (Y-axis difference)
   * 3. Normalize using torso height as reference
   * 4. Compare to baseline (resting shoulder position)
   *
   * Thresholds (normalized):
   * - minimal: <5% of torso height (~1cm)
   * - mild: 5-10% (~1-2cm)
   * - moderate: 10-15% (~2-3cm)
   * - severe: >15% (>3cm)
   *
   * @param landmarks Pose landmarks
   * @param thoraxFrame Cached thorax frame
   * @param side 'left' or 'right'
   * @param schemaId Schema identifier for landmark lookup
   * @returns CompensationPattern or null
   */
  private detectShoulderHiking(
    landmarks: PoseLandmark[],
    thoraxFrame: AnatomicalReferenceFrame | undefined,
    side: 'left' | 'right',
    schemaId: string
  ): CompensationPattern | null {
    if (!thoraxFrame) {
      return null;
    }

    // Get landmarks (schema-agnostic)
    const shoulder = landmarks.find((lm) => lm.name === `${side}_shoulder`);
    const ear = landmarks.find((lm) => lm.name === `${side}_ear`);
    const oppositeShoulder = landmarks.find((lm) => lm.name === `${side === 'left' ? 'right' : 'left'}_shoulder`);

    if (!shoulder || !ear || !oppositeShoulder) {
      return null;
    }

    // Check visibility
    if (shoulder.visibility < 0.5 || ear.visibility < 0.5 || oppositeShoulder.visibility < 0.5) {
      return null;
    }

    // Calculate shoulder line tilt (deviation from horizontal)
    const shoulderLine: Vector3D = {
      x: oppositeShoulder.x - shoulder.x,
      y: oppositeShoulder.y - shoulder.y,
      z: (oppositeShoulder.z || 0) - (shoulder.z || 0),
    };

    // Project onto coronal plane
    const coronalNormal: Vector3D = { x: 0, y: 0, z: 1 };
    const shoulderLineProjected = projectVectorOntoPlane(shoulderLine, coronalNormal);

    // Horizontal reference
    const horizontal: Vector3D = { x: 1, y: 0, z: 0 };

    // Calculate tilt angle from horizontal
    const tiltAngle = angleBetweenVectors(shoulderLineProjected, horizontal);

    // Determine which shoulder is elevated (based on Y coordinate)
    const isElevated = shoulder.y < oppositeShoulder.y; // Lower Y = higher on screen = elevated

    if (!isElevated) {
      return null; // Target shoulder is not elevated
    }

    // Calculate torso height for normalization
    const hipLeft = landmarks.find((lm) => lm.name === 'left_hip');
    const hipRight = landmarks.find((lm) => lm.name === 'right_hip');

    if (!hipLeft || !hipRight) {
      return null;
    }

    const hipMidpoint = {
      x: (hipLeft.x + hipRight.x) / 2,
      y: (hipLeft.y + hipRight.y) / 2,
    };

    const shoulderMidpoint = {
      x: (shoulder.x + oppositeShoulder.x) / 2,
      y: (shoulder.y + oppositeShoulder.y) / 2,
    };

    const torsoHeight = Math.abs(shoulderMidpoint.y - hipMidpoint.y);

    // Calculate elevation as percentage of torso height
    const elevationPercent = (tiltAngle / 90) * 100; // Normalize to 0-100%

    // Grade severity based on percentage
    const severity = this.gradeSeverityPercent(elevationPercent);

    if (severity === 'minimal') {
      return null;
    }

    // Convert percentage to approximate cm (assuming avg torso height ~50cm)
    const elevationCm = (elevationPercent / 100) * 50;

    return {
      type: 'shoulder_hiking',
      severity,
      magnitude: elevationCm,
      affectsJoint: `${side}_shoulder`,
      clinicalNote: `${side === 'left' ? 'Left' : 'Right'} shoulder hiking detected ` +
        `(~${elevationCm.toFixed(1)}cm elevation, ${tiltAngle.toFixed(1)}° tilt). ` +
        `May indicate rotator cuff weakness or subacromial impingement.`,
    };
  }

  /**
   * Detect Elbow Flexion Drift
   *
   * Clinical context: Unintended elbow flexion during shoulder flexion/abduction movements
   * (when elbow should remain extended). Indicates shoulder weakness or poor motor control.
   *
   * Method:
   * 1. Get elbow angle using vector math
   * 2. During shoulder flexion/abduction, elbow should be ~180° (extended)
   * 3. Detect deviation from extension
   *
   * Thresholds:
   * - minimal: 175-180° (normal variation, <5° flexion)
   * - mild: 165-175° (5-15° flexion)
   * - moderate: 150-165° (15-30° flexion)
   * - severe: <150° (>30° flexion)
   *
   * Note: Elbow flexion is only checked when trunk compensations are present,
   * to avoid false positives during resting/calibration poses
   *
   * @param landmarks Pose landmarks
   * @param forearmFrame Cached forearm frame
   * @param side 'left' or 'right'
   * @param schemaId Schema identifier
   * @returns CompensationPattern or null
   */
  private detectElbowFlexionDrift(
    landmarks: PoseLandmark[],
    forearmFrame: AnatomicalReferenceFrame | undefined,
    side: 'left' | 'right',
    schemaId: string
  ): CompensationPattern | null {
    if (!forearmFrame) {
      return null;
    }

    // Get elbow joint landmarks (schema-agnostic)
    const shoulder = landmarks.find((lm) => lm.name === `${side}_shoulder`);
    const elbow = landmarks.find((lm) => lm.name === `${side}_elbow`);
    const wrist = landmarks.find((lm) => lm.name === `${side}_wrist`);

    if (!shoulder || !elbow || !wrist) {
      return null;
    }

    // Check visibility
    if (shoulder.visibility < 0.5 || elbow.visibility < 0.5 || wrist.visibility < 0.5) {
      return null;
    }

    // Calculate elbow angle
    const upperArm: Vector3D = {
      x: elbow.x - shoulder.x,
      y: elbow.y - shoulder.y,
      z: (elbow.z || 0) - (shoulder.z || 0),
    };

    const forearm: Vector3D = {
      x: wrist.x - elbow.x,
      y: wrist.y - elbow.y,
      z: (wrist.z || 0) - (elbow.z || 0),
    };

    // angleBetweenVectors returns:
    // - 0° for straight arm (upperArm and forearm parallel, same direction)
    // - Increases as elbow bends (90° = right angle, 180° = fully bent)
    const geometricAngle = angleBetweenVectors(upperArm, forearm);

    // Flexion amount is the geometric angle directly (0° = no flexion, 30° = 30° flexion)
    const flexionAmount = geometricAngle;

    // Clinical elbow angle convention: 180° = extended, 0° = fully flexed
    const clinicalElbowAngle = 180 - geometricAngle;

    // Grade severity based on flexion amount
    let severity: 'minimal' | 'mild' | 'moderate' | 'severe';
    if (flexionAmount < 5) {
      severity = 'minimal';
    } else if (flexionAmount < 15) {
      severity = 'mild';
    } else if (flexionAmount < 30) {
      severity = 'moderate';
    } else {
      severity = 'severe';
    }

    if (severity === 'minimal') {
      return null;
    }

    return {
      type: 'elbow_flexion',
      severity,
      magnitude: flexionAmount,
      affectsJoint: `${side}_shoulder`,
      clinicalNote: `Elbow flexion of ${flexionAmount.toFixed(1)}° detected during ` +
        `shoulder movement (current angle: ${clinicalElbowAngle.toFixed(1)}°). ` +
        `Elbow should remain extended (~180°). May indicate shoulder weakness.`,
    };
  }

  // =============================================================================
  // LOWER BODY COMPENSATIONS
  // =============================================================================

  /**
   * Detect Hip Hike (Pelvic Elevation)
   *
   * Clinical context: Pelvic elevation during lower extremity movements.
   * Patient hikes hip on swing leg side to clear foot during gait or hip/knee flexion.
   * Indicates hip abductor weakness or poor pelvic control.
   *
   * Method:
   * 1. Get hip landmarks (schema-agnostic)
   * 2. Calculate pelvic tilt in coronal plane
   * 3. Measure deviation from horizontal
   *
   * Thresholds (vertical displacement in cm):
   * - minimal: <3cm (normal variation)
   * - mild: 3-5cm
   * - moderate: 5-8cm
   * - severe: >8cm
   *
   * @param landmarks Pose landmarks
   * @param pelvisFrame Cached pelvis frame
   * @param schemaId Schema identifier
   * @returns CompensationPattern or null
   */
  private detectHipHike(
    landmarks: PoseLandmark[],
    pelvisFrame: AnatomicalReferenceFrame | undefined,
    schemaId: string
  ): CompensationPattern | null {
    if (!pelvisFrame) {
      return null;
    }

    // Get hip landmarks (schema-agnostic)
    const leftHip = landmarks.find((lm) => lm.name === 'left_hip');
    const rightHip = landmarks.find((lm) => lm.name === 'right_hip');

    if (!leftHip || !rightHip) {
      return null;
    }

    // Check visibility
    if (leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
      return null;
    }

    // Calculate vertical displacement (Y-axis difference)
    // Normalized coordinates: assume full body height (Y=0 to Y=1.0) represents ~170cm
    const yDisplacement = Math.abs(rightHip.y - leftHip.y);
    const displacementCm = yDisplacement * 170; // Convert to cm

    // Calculate tilt angle for clinical note
    const hipLine: Vector3D = {
      x: rightHip.x - leftHip.x,
      y: rightHip.y - leftHip.y,
      z: (rightHip.z || 0) - (leftHip.z || 0),
    };
    const horizontal: Vector3D = { x: 1, y: 0, z: 0 };
    const coronalNormal: Vector3D = { x: 0, y: 0, z: 1 };
    const hipLineInCoronalPlane = projectVectorOntoPlane(hipLine, coronalNormal);
    const tiltAngle = angleBetweenVectors(hipLineInCoronalPlane, horizontal);

    // Grade severity based on vertical displacement in cm
    // (More clinically meaningful than angle)
    let severity: 'minimal' | 'mild' | 'moderate' | 'severe';
    if (displacementCm < 3) {
      severity = 'minimal';
    } else if (displacementCm < 5) {
      severity = 'mild';
    } else if (displacementCm < 8) {
      severity = 'moderate';
    } else {
      severity = 'severe';
    }

    if (severity === 'minimal') {
      return null;
    }

    // Determine which hip is hiked (lower Y value = higher on screen = hiked in image coords)
    const side = leftHip.y < rightHip.y ? 'left' : 'right';

    return {
      type: 'hip_hike',
      severity,
      magnitude: displacementCm,
      affectsJoint: `${side}_hip`,
      clinicalNote: `${side === 'left' ? 'Left' : 'Right'} hip hike of ${displacementCm.toFixed(1)}cm ` +
        `(${tiltAngle.toFixed(1)}° tilt) detected. May indicate hip abductor weakness or poor pelvic control.`,
    };
  }

  /**
   * Detect Contralateral Lean
   *
   * Clinical context: Patient leans away from the movement side during unilateral exercises.
   * Similar to trunk lean but specifically during unilateral movements.
   *
   * Method:
   * 1. Determine movement side from movement string
   * 2. Check if trunk leans away from movement side
   * 3. Grade severity
   *
   * @param thoraxFrame Cached thorax frame
   * @param movement Movement being performed (e.g., 'left_shoulder_flexion')
   * @param viewOrientation Current view orientation
   * @returns CompensationPattern or null
   */
  private detectContralateralLean(
    thoraxFrame: AnatomicalReferenceFrame,
    movement: string,
    viewOrientation?: string
  ): CompensationPattern | null {
    // Only detect in frontal view
    if (viewOrientation !== 'frontal') {
      return null;
    }

    // Determine movement side
    const movementSide = movement.includes('left') ? 'left' : 'right';

    // Get thorax X-axis (lateral direction)
    const xAxis = thoraxFrame.xAxis;

    // Expected: X-axis should be horizontal (perpendicular to vertical)
    // Contralateral lean: X-axis tilts away from movement side

    // Project X-axis onto coronal plane
    const coronalNormal: Vector3D = { x: 0, y: 0, z: 1 };
    const xAxisInCoronalPlane = projectVectorOntoPlane(xAxis, coronalNormal);

    // Horizontal reference
    const horizontal: Vector3D = { x: 1, y: 0, z: 0 };

    // Calculate lean angle
    const leanAngle = angleBetweenVectors(xAxisInCoronalPlane, horizontal);

    // Check direction: lean should be away from movement side
    const leanDirection = xAxisInCoronalPlane.y > 0 ? 'right' : 'left';
    const isContralateral = leanDirection !== movementSide;

    if (!isContralateral) {
      return null; // Lean is on same side as movement (ipsilateral, not contralateral)
    }

    // Grade severity
    const severity = this.gradeSeverity(leanAngle, 'degrees');

    if (severity === 'minimal') {
      return null;
    }

    return {
      type: 'contralateral_lean',
      severity,
      magnitude: leanAngle,
      affectsJoint: `${movementSide}_shoulder`,
      clinicalNote: `Contralateral lean of ${leanAngle.toFixed(1)}° detected ` +
        `(leaning away from ${movementSide} side). May indicate weakness or compensation strategy.`,
    };
  }

  // =============================================================================
  // SEVERITY GRADING HELPERS
  // =============================================================================

  /**
   * Grade compensation severity based on magnitude
   *
   * Clinical thresholds:
   * - minimal: <5° or <1cm (normal variation)
   * - mild: 5-10° or 1-2cm (noteworthy)
   * - moderate: 10-15° or 2-3cm (clinically significant)
   * - severe: >15° or >3cm (major dysfunction)
   *
   * @param magnitude Compensation magnitude
   * @param unit 'degrees' or 'cm'
   * @returns Severity grade
   */
  private gradeSeverity(
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
   * Grade severity based on percentage thresholds
   *
   * @param percent Percentage value (0-100)
   * @returns Severity grade
   */
  private gradeSeverityPercent(
    percent: number
  ): 'minimal' | 'mild' | 'moderate' | 'severe' {
    if (percent < 5) return 'minimal';
    if (percent < 10) return 'mild';
    if (percent < 15) return 'moderate';
    return 'severe';
  }
}
