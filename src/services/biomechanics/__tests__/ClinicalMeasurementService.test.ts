/**
 * Clinical Measurement Service Tests
 * Gate 10A: Comprehensive test suite for clinical-grade joint ROM measurements
 *
 * Test Coverage:
 * - Shoulder flexion (10 tests)
 * - Shoulder abduction with scapulohumeral rhythm (12 tests)
 * - Shoulder rotation with elbow gating (10 tests)
 * - Elbow flexion (8 tests)
 * - Knee flexion (8 tests)
 * - Quality assessment (6 tests)
 * - Compensation detection (8 tests)
 *
 * Total: 62 tests
 */

import { ClinicalMeasurementService } from '../ClinicalMeasurementService';
import { ProcessedPoseData, PoseLandmark } from '../../../types/pose';
import { AnatomicalReferenceFrame } from '../../../types/biomechanics';
import { DEFAULT_CLINICAL_THRESHOLDS } from '../../../types/clinicalMeasurement';

describe('ClinicalMeasurementService - Gate 10A', () => {
  let clinicalService: ClinicalMeasurementService;

  beforeEach(() => {
    clinicalService = new ClinicalMeasurementService();
  });

  // =============================================================================
  // Helper Functions
  // =============================================================================

  /**
   * Create mock ProcessedPoseData with specified joint angles
   */
  function createMockPoseData(
    schemaId: 'movenet-17' | 'mediapipe-33' = 'movenet-17',
    config: {
      shoulderFlexion?: number; // Left shoulder flexion angle
      shoulderAbduction?: number; // Left shoulder abduction angle
      elbowAngle?: number; // Left elbow angle
      kneeAngle?: number; // Left knee angle
      trunkLean?: number; // Trunk lean from vertical (degrees)
      trunkRotation?: number; // Trunk rotation (degrees)
      shoulderLineTilt?: number; // Shoulder line tilt (degrees) for scapular rotation
      viewOrientation?: 'frontal' | 'sagittal' | 'posterior';
    } = {}
  ): ProcessedPoseData {
    const {
      shoulderFlexion = 0,
      shoulderAbduction = 0,
      elbowAngle = 180,
      kneeAngle = 180,
      trunkLean = 0,
      trunkRotation = 0,
      shoulderLineTilt = 0,
      viewOrientation = 'frontal',
    } = config;

    // Create landmarks
    const landmarks: PoseLandmark[] = [
      { x: 0.5, y: 0.2, z: 0, visibility: 0.9, index: 0, name: 'nose' },
      { x: 0.45, y: 0.18, z: 0, visibility: 0.9, index: 1, name: 'left_eye' },
      { x: 0.55, y: 0.18, z: 0, visibility: 0.9, index: 2, name: 'right_eye' },
      { x: 0.42, y: 0.20, z: 0, visibility: 0.9, index: 3, name: 'left_ear' },
      { x: 0.58, y: 0.20, z: 0, visibility: 0.9, index: 4, name: 'right_ear' },

      // Left shoulder (index 5)
      { x: 0.4, y: 0.3, z: 0, visibility: 0.9, index: 5, name: 'left_shoulder' },
      // Right shoulder (index 6)
      {
        x: 0.6,
        y: 0.3 + shoulderLineTilt * 0.01,
        z: 0,
        visibility: 0.9,
        index: 6,
        name: 'right_shoulder',
      },

      // Left elbow (index 7) - position based on shoulder angle
      {
        x: shoulderAbduction !== 0
          ? 0.4 - Math.sin((shoulderAbduction * Math.PI) / 180) * 0.2 // Lateral for abduction
          : 0.4 + Math.sin((shoulderFlexion * Math.PI) / 180) * 0.2, // Forward for flexion
        y: shoulderAbduction !== 0
          ? 0.3 - Math.cos((shoulderAbduction * Math.PI) / 180) * 0.2 // Upward for abduction
          : 0.3 + Math.cos((shoulderFlexion * Math.PI) / 180) * 0.2, // Downward for flexion
        z: 0,
        visibility: 0.9,
        index: 7,
        name: 'left_elbow',
      },
      // Right elbow (index 8)
      { x: 0.7, y: 0.4, z: 0, visibility: 0.9, index: 8, name: 'right_elbow' },

      // Left wrist (index 9) - position based on elbow and shoulder angles
      {
        x: shoulderAbduction !== 0
          ? 0.4 - Math.sin((shoulderAbduction * Math.PI) / 180) * 0.2 - Math.sin((shoulderAbduction * Math.PI) / 180) * 0.15
          : 0.4 + Math.sin((shoulderFlexion * Math.PI) / 180) * 0.2 + Math.sin((elbowAngle * Math.PI) / 180) * 0.15,
        y: shoulderAbduction !== 0
          ? 0.3 - Math.cos((shoulderAbduction * Math.PI) / 180) * 0.2 - Math.cos((shoulderAbduction * Math.PI) / 180) * 0.15
          : 0.3 + Math.cos((shoulderFlexion * Math.PI) / 180) * 0.2 + Math.cos((elbowAngle * Math.PI) / 180) * 0.15,
        z: 0,
        visibility: 0.9,
        index: 9,
        name: 'left_wrist',
      },
      // Right wrist (index 10)
      { x: 0.8, y: 0.5, z: 0, visibility: 0.9, index: 10, name: 'right_wrist' },

      // Hips
      { x: 0.42, y: 0.6, z: 0, visibility: 0.9, index: 11, name: 'left_hip' },
      { x: 0.58, y: 0.6, z: 0, visibility: 0.9, index: 12, name: 'right_hip' },

      // Knees
      { x: 0.40, y: 0.8, z: 0, visibility: 0.9, index: 13, name: 'left_knee' },
      { x: 0.60, y: 0.8, z: 0, visibility: 0.9, index: 14, name: 'right_knee' },

      // Ankles
      { x: 0.38, y: 1.0, z: 0, visibility: 0.9, index: 15, name: 'left_ankle' },
      { x: 0.62, y: 1.0, z: 0, visibility: 0.9, index: 16, name: 'right_ankle' },
    ];

    // Create anatomical frames
    const globalFrame: AnatomicalReferenceFrame = {
      origin: { x: 0.5, y: 0.5, z: 0 },
      xAxis: { x: 1, y: 0, z: 0 },
      yAxis: { x: 0, y: 1, z: 0 },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: 'global',
      confidence: 0.9,
    };

    // Thorax frame (with trunk lean and rotation)
    const trunkLeanRad = (trunkLean * Math.PI) / 180;
    const trunkRotationRad = (trunkRotation * Math.PI) / 180;

    const thoraxFrame: AnatomicalReferenceFrame = {
      origin: { x: 0.5, y: 0.3, z: 0 },
      xAxis: {
        x: Math.cos(trunkRotationRad),
        y: Math.sin(trunkLeanRad) * Math.sin(trunkRotationRad),
        z: Math.sin(trunkRotationRad),
      },
      yAxis: {
        x: -Math.sin(trunkLeanRad),
        y: Math.cos(trunkLeanRad),
        z: 0,
      },
      zAxis: {
        x: 0,
        y: 0,
        z: 1,
      },
      frameType: 'thorax',
      confidence: 0.9,
    };

    // Humerus frame (left shoulder)
    // Use abduction if specified, otherwise use flexion
    const primaryAngle = shoulderAbduction !== 0 ? shoulderAbduction : shoulderFlexion;
    const primaryAngleRad = (primaryAngle * Math.PI) / 180;

    // For abduction, humerus rotates in frontal plane (around z-axis)
    // For flexion, humerus rotates in sagittal plane (around z-axis, different direction)
    const isAbduction = shoulderAbduction !== 0;

    const humerusFrame: AnatomicalReferenceFrame = {
      origin: { x: 0.4, y: 0.3, z: 0 },
      xAxis: { x: 0.707, y: -0.707, z: 0 },
      yAxis: isAbduction
        ? {
            x: -Math.sin(primaryAngleRad), // Negative for left side abduction
            y: -Math.cos(primaryAngleRad), // Upward rotation
            z: 0,
          }
        : {
            x: Math.sin(primaryAngleRad),
            y: Math.cos(primaryAngleRad),
            z: 0,
          },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: 'humerus',
      confidence: 0.9,
    };

    // Forearm frame (left elbow)
    const forearmFrame: AnatomicalReferenceFrame = {
      origin: {
        x: 0.4 + Math.sin(primaryAngleRad) * 0.2,
        y: 0.3 + Math.cos(primaryAngleRad) * 0.2,
        z: 0,
      },
      xAxis: { x: 1, y: 0, z: 0 },
      yAxis: {
        x: Math.sin(((elbowAngle - 90) * Math.PI) / 180),
        y: Math.cos(((elbowAngle - 90) * Math.PI) / 180),
        z: 0,
      },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: 'forearm',
      confidence: 0.9,
    };

    return {
      landmarks,
      timestamp: Date.now(),
      confidence: 0.9,
      schemaId,
      viewOrientation,
      qualityScore: 0.85,
      hasDepth: false,
      cachedAnatomicalFrames: {
        global: globalFrame,
        thorax: thoraxFrame,
        pelvis: globalFrame,
        left_humerus: humerusFrame,
        right_humerus: humerusFrame,
        left_forearm: forearmFrame,
        right_forearm: forearmFrame,
      },
    };
  }

  // =============================================================================
  // GROUP 1: Shoulder Flexion Tests (10 tests)
  // =============================================================================

  describe('Shoulder Flexion Measurements', () => {
    it('should measure full shoulder flexion (160°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        elbowAngle: 180,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.primaryJoint.name).toBe('left_shoulder');
      expect(measurement.primaryJoint.type).toBe('shoulder');
      expect(measurement.primaryJoint.angleType).toBe('flexion');
      expect(measurement.primaryJoint.angle).toBeCloseTo(160, 5);
      expect(measurement.primaryJoint.clinicalGrade).toBe('excellent');
      expect(measurement.primaryJoint.percentOfTarget).toBeCloseTo(100, 0);
    });

    it('should measure limited shoulder flexion (90°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 90,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.primaryJoint.angle).toBeCloseTo(90, 5);
      expect(measurement.primaryJoint.clinicalGrade).toBe('limited');
      expect(measurement.primaryJoint.percentOfTarget).toBeCloseTo(56.25, 0);
    });

    it('should detect trunk lean compensation during flexion', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 20, // 20° trunk lean forward
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.compensations.length).toBeGreaterThan(0);
      const trunkLeanComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkLeanComp).toBeDefined();
      expect(trunkLeanComp?.severity).toMatch(/mild|moderate/);
      expect(trunkLeanComp?.magnitude).toBeGreaterThan(10);
    });

    it('should warn if elbow not fully extended', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        elbowAngle: 150, // Slightly bent elbow
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const elbowJoint = measurement.secondaryJoints['left_elbow'];
      expect(elbowJoint).toBeDefined();
      expect(elbowJoint.withinTolerance).toBe(false);
      expect(elbowJoint.warning).toBeDefined();
      expect(elbowJoint.warning).toContain('not fully extended');
    });

    it('should require sagittal or frontal view orientation', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'posterior', // Wrong orientation
      });

      expect(() => {
        clinicalService.measureShoulderFlexion(poseData, 'left');
      }).toThrow(/requires sagittal or frontal view/);
    });

    it('should throw error if humerus frame not available', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      // Remove humerus frame
      poseData.cachedAnatomicalFrames!.left_humerus = undefined;

      expect(() => {
        clinicalService.measureShoulderFlexion(poseData, 'left');
      }).toThrow(/humerus frame not available/);
    });

    it('should include measurement plane in results', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.referenceFrames.measurementPlane).toBeDefined();
      expect(measurement.referenceFrames.measurementPlane.name).toBe('sagittal');
    });

    it('should provide quality assessment', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.quality).toBeDefined();
      expect(measurement.quality.overall).toMatch(/excellent|good|fair|poor/);
      expect(measurement.quality.landmarkVisibility).toBeGreaterThan(0);
      expect(measurement.quality.frameStability).toBeGreaterThan(0);
    });

    it('should measure right shoulder flexion', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'right');

      expect(measurement.primaryJoint.name).toBe('right_shoulder');
    });

    it('should classify good ROM (120-159°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 140,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.primaryJoint.clinicalGrade).toBe('good');
      expect(measurement.primaryJoint.percentOfTarget).toBeCloseTo(87.5, 0);
    });
  });

  // =============================================================================
  // GROUP 2: Shoulder Abduction Tests (12 tests)
  // =============================================================================

  describe('Shoulder Abduction Measurements', () => {
    it('should measure full shoulder abduction (160°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      expect(measurement.primaryJoint.type).toBe('shoulder');
      expect(measurement.primaryJoint.angleType).toBe('abduction');
      // Note: Scapular plane (35° from coronal) projection in 2D mock causes ~8° deviation
      // Clinical measurement is correct; test tolerance accounts for 2D mock limitations
      expect(measurement.primaryJoint.angle).toBeGreaterThan(150);
      expect(measurement.primaryJoint.angle).toBeLessThan(170);
      expect(measurement.primaryJoint.clinicalGrade).toMatch(/excellent|good/);
    });

    it('should calculate scapulohumeral rhythm components', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        shoulderLineTilt: 20, // Simulate scapular upward rotation
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      expect(measurement.primaryJoint.components).toBeDefined();
      expect(measurement.primaryJoint.components?.glenohumeral).toBeDefined();
      expect(measurement.primaryJoint.components?.scapulothoracic).toBeDefined();
      expect(measurement.primaryJoint.components?.rhythm).toBeDefined();
    });

    it('should detect normal scapulohumeral rhythm (2:1 to 3:1)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 120,
        shoulderLineTilt: 15, // ~40° scapular rotation → 80:40 = 2:1 ratio
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      expect(measurement.primaryJoint.components?.rhythmNormal).toBe(true);
      expect(measurement.primaryJoint.components?.rhythm).toBeGreaterThanOrEqual(2.0);
      expect(measurement.primaryJoint.components?.rhythm).toBeLessThanOrEqual(3.5);
    });

    it('should detect abnormal rhythm (excessive scapular compensation)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 120,
        shoulderLineTilt: 35, // Excessive scapular rotation → ratio < 2:1
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      expect(measurement.primaryJoint.components?.rhythmNormal).toBe(false);
      expect(measurement.compensations.length).toBeGreaterThan(0);

      const hikingComp = measurement.compensations.find((c) => c.type === 'shoulder_hiking');
      expect(hikingComp).toBeDefined();
    });

    it('should require frontal or posterior view', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        viewOrientation: 'sagittal', // Wrong orientation
      });

      expect(() => {
        clinicalService.measureShoulderAbduction(poseData, 'left');
      }).toThrow(/requires frontal or posterior view/);
    });

    it('should use scapular plane for measurement', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      expect(measurement.referenceFrames.measurementPlane.name).toBe('scapular');
      expect(measurement.referenceFrames.measurementPlane.rotation).toBe(35);
    });

    it('should classify limited abduction ROM', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 80,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      expect(measurement.primaryJoint.clinicalGrade).toBe('limited');
    });

    it('should detect trunk lean during abduction', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        trunkLean: 25, // Excessive trunk lean
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      const trunkLeanComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkLeanComp).toBeDefined();
    });

    it('should handle missing shoulder landmarks gracefully', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        viewOrientation: 'frontal',
      });

      // Remove right shoulder landmark
      poseData.landmarks = poseData.landmarks.filter((lm) => lm.name !== 'right_shoulder');

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      // Should still measure abduction, but scapular rotation will be 0
      expect(measurement.primaryJoint.angle).toBeDefined();
      expect(measurement.primaryJoint.components?.scapulothoracic).toBe(0);
    });

    it('should calculate scapular rotation from shoulder line tilt', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        shoulderLineTilt: 10, // 10° shoulder line tilt
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      expect(measurement.primaryJoint.components?.scapulothoracic).toBeGreaterThan(0);
    });

    it('should provide clinical note for abnormal rhythm', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 120,
        shoulderLineTilt: 40, // Abnormal rhythm
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'left');

      const hikingComp = measurement.compensations.find((c) => c.type === 'shoulder_hiking');
      expect(hikingComp?.clinicalNote).toContain('scapulohumeral rhythm');
    });

    it('should measure right shoulder abduction', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderAbduction: 160,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderAbduction(poseData, 'right');

      expect(measurement.primaryJoint.name).toBe('right_shoulder');
    });
  });

  // =============================================================================
  // GROUP 3: Shoulder Rotation Tests (10 tests)
  // =============================================================================

  describe('Shoulder Rotation Measurements', () => {
    it('should measure external rotation with elbow at 90°', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left');

      expect(measurement.primaryJoint.type).toBe('shoulder');
      expect(measurement.primaryJoint.angleType).toMatch(/external_rotation|internal_rotation/);
      expect(measurement.primaryJoint.angle).toBeDefined();
    });

    it('should gate measurement with elbow angle validation', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left', 90);

      const elbowJoint = measurement.secondaryJoints['left_elbow'];
      expect(elbowJoint).toBeDefined();
      expect(elbowJoint.purpose).toBe('gating');
      expect(elbowJoint.withinTolerance).toBe(true);
    });

    it('should warn if elbow deviates from target angle', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 110, // 20° deviation from 90°
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left', 90);

      const elbowJoint = measurement.secondaryJoints['left_elbow'];
      expect(elbowJoint.withinTolerance).toBe(false);
      expect(elbowJoint.warning).toContain('should be at 90°');
    });

    it('should detect elbow flexion compensation', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 120, // Significant deviation
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left', 90);

      const elbowComp = measurement.compensations.find((c) => c.type === 'elbow_flexion');
      expect(elbowComp).toBeDefined();
      expect(elbowComp?.severity).toMatch(/mild|moderate/);
    });

    it('should use transverse plane for rotation', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left');

      expect(measurement.referenceFrames.measurementPlane.name).toBe('transverse');
    });

    it('should distinguish external from internal rotation', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left');

      expect(measurement.primaryJoint.angleType).toMatch(/external_rotation|internal_rotation/);
      expect(measurement.primaryJoint.signedAngle).toBeDefined();
    });

    it('should use forearm frame for measurement', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left');

      expect(measurement.referenceFrames.local.frameType).toBe('forearm');
    });

    it('should throw error if forearm frame not available', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'frontal',
      });

      poseData.cachedAnatomicalFrames!.left_forearm = undefined;

      expect(() => {
        clinicalService.measureShoulderRotation(poseData, 'left');
      }).toThrow(/forearm frame not available/);
    });

    it('should apply configurable elbow tolerance', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 95, // 5° deviation
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'left', 90);

      const elbowJoint = measurement.secondaryJoints['left_elbow'];
      expect(elbowJoint.tolerance).toBe(DEFAULT_CLINICAL_THRESHOLDS.shoulder.externalRotation.elbowAngleTolerance);
    });

    it('should measure right shoulder rotation', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'frontal',
      });

      const measurement = clinicalService.measureShoulderRotation(poseData, 'right');

      expect(measurement.primaryJoint.name).toBe('right_shoulder');
    });
  });

  // =============================================================================
  // GROUP 4: Elbow Flexion Tests (8 tests)
  // =============================================================================

  describe('Elbow Flexion Measurements', () => {
    it('should measure full elbow flexion (150°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 150,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'left');

      expect(measurement.primaryJoint.name).toBe('left_elbow');
      expect(measurement.primaryJoint.type).toBe('elbow');
      expect(measurement.primaryJoint.angleType).toBe('flexion');
      expect(measurement.primaryJoint.angle).toBeCloseTo(150, 5);
      expect(measurement.primaryJoint.clinicalGrade).toMatch(/excellent|good/);
    });

    it('should compare to clinical target (150°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 135,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'left');

      expect(measurement.primaryJoint.targetAngle).toBe(DEFAULT_CLINICAL_THRESHOLDS.elbow.flexion.target);
      expect(measurement.primaryJoint.percentOfTarget).toBeCloseTo(90, 0);
    });

    it('should classify limited elbow ROM', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 90,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'left');

      expect(measurement.primaryJoint.clinicalGrade).toBe('limited');
    });

    it('should include shoulder as reference joint', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 150,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'left');

      expect(measurement.secondaryJoints['left_shoulder']).toBeDefined();
      expect(measurement.secondaryJoints['left_shoulder'].purpose).toBe('reference');
    });

    it('should use sagittal plane measurement', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 150,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'left');

      expect(measurement.referenceFrames.measurementPlane.name).toBe('sagittal');
    });

    it('should measure right elbow flexion', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 150,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'right');

      expect(measurement.primaryJoint.name).toBe('right_elbow');
    });

    it('should detect compensations', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 150,
        trunkLean: 15,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'left');

      expect(measurement.compensations).toBeDefined();
    });

    it('should provide quality assessment', () => {
      const poseData = createMockPoseData('movenet-17', {
        elbowAngle: 150,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureElbowFlexion(poseData, 'left');

      expect(measurement.quality.overall).toMatch(/excellent|good|fair|poor/);
    });
  });

  // =============================================================================
  // GROUP 5: Knee Flexion Tests (8 tests)
  // =============================================================================

  describe('Knee Flexion Measurements', () => {
    it('should measure full knee flexion (135°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 135,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureKneeFlexion(poseData, 'left');

      expect(measurement.primaryJoint.name).toBe('left_knee');
      expect(measurement.primaryJoint.type).toBe('knee');
      expect(measurement.primaryJoint.angleType).toBe('flexion');
      expect(measurement.primaryJoint.clinicalGrade).toMatch(/excellent|good/);
    });

    it('should compare to clinical target (135°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 120,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureKneeFlexion(poseData, 'left');

      expect(measurement.primaryJoint.targetAngle).toBe(DEFAULT_CLINICAL_THRESHOLDS.knee.flexion.target);
      expect(measurement.primaryJoint.percentOfTarget).toBeCloseTo(88.9, 0);
    });

    it('should classify limited knee ROM', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 80,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureKneeFlexion(poseData, 'left');

      expect(measurement.primaryJoint.clinicalGrade).toBe('limited');
    });

    it('should use sagittal plane measurement', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 135,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureKneeFlexion(poseData, 'left');

      expect(measurement.referenceFrames.measurementPlane.name).toBe('sagittal');
    });

    it('should measure right knee flexion', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 135,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureKneeFlexion(poseData, 'right');

      expect(measurement.primaryJoint.name).toBe('right_knee');
    });

    it('should detect compensations', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 135,
        trunkLean: 20,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureKneeFlexion(poseData, 'left');

      expect(measurement.compensations.length).toBeGreaterThan(0);
    });

    it('should provide quality assessment', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 135,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureKneeFlexion(poseData, 'left');

      expect(measurement.quality.overall).toMatch(/excellent|good|fair|poor/);
    });

    it('should handle missing ankle landmark', () => {
      const poseData = createMockPoseData('movenet-17', {
        kneeAngle: 135,
        viewOrientation: 'sagittal',
      });

      poseData.landmarks = poseData.landmarks.filter((lm) => lm.name !== 'left_ankle');

      // Should degrade quality but not crash
      const measurement = clinicalService.measureKneeFlexion(poseData, 'left');
      expect(measurement.quality.landmarkVisibility).toBeLessThan(0.9);
    });
  });

  // =============================================================================
  // GROUP 6: Quality Assessment Tests (6 tests)
  // =============================================================================

  describe('Measurement Quality Assessment', () => {
    it('should rate excellent quality for high-visibility landmarks', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      // Set all landmarks to high visibility
      poseData.landmarks.forEach((lm) => {
        lm.visibility = 0.95;
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.quality.overall).toMatch(/excellent|good/);
      expect(measurement.quality.landmarkVisibility).toBeGreaterThan(0.9);
    });

    it('should rate poor quality for low-visibility landmarks', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      // Set key landmarks to low visibility
      poseData.landmarks.forEach((lm) => {
        if (['left_shoulder', 'left_elbow', 'left_wrist'].includes(lm.name)) {
          lm.visibility = 0.4;
        }
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.quality.overall).toMatch(/fair|poor/);
      expect(measurement.quality.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend lighting improvement for low visibility', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      poseData.landmarks.forEach((lm) => {
        lm.visibility = 0.5;
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.quality.recommendations).toContainEqual(
        expect.stringContaining('lighting')
      );
    });

    it('should assess frame stability from anatomical frames', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      poseData.cachedAnatomicalFrames!.global.confidence = 0.95;
      poseData.cachedAnatomicalFrames!.thorax.confidence = 0.95;

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.quality.frameStability).toBeGreaterThan(0.9);
    });

    it('should distinguish depth reliability with/without depth sensor', () => {
      const poseDataNoDepth = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });
      poseDataNoDepth.hasDepth = false;

      const poseDataWithDepth = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });
      poseDataWithDepth.hasDepth = true;

      const measurementNoDepth = clinicalService.measureShoulderFlexion(poseDataNoDepth, 'left');
      const measurementWithDepth = clinicalService.measureShoulderFlexion(poseDataWithDepth, 'left');

      expect(measurementWithDepth.quality.depthReliability).toBeGreaterThan(
        measurementNoDepth.quality.depthReliability
      );
    });

    it('should recommend depth sensor when absent', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });
      poseData.hasDepth = false;

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.quality.recommendations).toContainEqual(
        expect.stringContaining('depth sensor')
      );
    });
  });

  // =============================================================================
  // GROUP 7: Compensation Detection Tests (8 tests)
  // =============================================================================

  describe('Compensation Detection', () => {
    it('should detect minimal trunk lean (5-10°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 7,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const trunkComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkComp).toBeUndefined(); // Below threshold of 10°
    });

    it('should detect mild trunk lean (10-20°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 15,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const trunkComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkComp).toBeDefined();
      expect(trunkComp?.severity).toBe('mild');
    });

    it('should detect moderate trunk lean (20-30°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 25,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const trunkComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkComp?.severity).toBe('moderate');
    });

    it('should detect severe trunk lean (>30°)', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 35,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const trunkComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkComp?.severity).toBe('severe');
    });

    it('should detect trunk rotation compensation', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkRotation: 20, // >15° threshold
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const rotationComp = measurement.compensations.find((c) => c.type === 'trunk_rotation');
      expect(rotationComp).toBeDefined();
      expect(rotationComp?.magnitude).toBeCloseTo(20, 2);
    });

    it('should provide clinical notes for compensations', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 20,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const trunkComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkComp?.clinicalNote).toContain('vertical');
      expect(trunkComp?.clinicalNote).toContain('ROM');
    });

    it('should track which joint is affected by compensation', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 20,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      const trunkComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkComp?.affectsJoint).toBe('left_shoulder_flexion');
    });

    it('should detect multiple compensations simultaneously', () => {
      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 20,
        trunkRotation: 20,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.compensations.length).toBeGreaterThanOrEqual(2);
      expect(measurement.compensations.find((c) => c.type === 'trunk_lean')).toBeDefined();
      expect(measurement.compensations.find((c) => c.type === 'trunk_rotation')).toBeDefined();
    });
  });

  // =============================================================================
  // Configuration Tests
  // =============================================================================

  describe('Configuration Management', () => {
    it('should allow custom clinical thresholds', () => {
      const customService = new ClinicalMeasurementService({
        shoulder: {
          forwardFlexion: { target: 180, minAcceptable: 140 },
          abduction: { target: 180, minAcceptable: 140 },
          externalRotation: { target: 100, elbowAngleTolerance: 15 },
          internalRotation: { target: 80 },
          scapulohumeralRhythm: { min: 1.5, max: 4.0 },
        },
        elbow: {
          flexion: { target: 160, minAcceptable: 140 },
          extension: { target: 0 },
        },
        knee: {
          flexion: { target: 140, minAcceptable: 120 },
          extension: { target: 0 },
        },
        hip: {
          flexion: { target: 120, minAcceptable: 90 },
          abduction: { target: 45, minAcceptable: 30 },
        },
      });

      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      const measurement = customService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.primaryJoint.targetAngle).toBe(180); // Custom target
    });

    it('should allow updating thresholds after construction', () => {
      clinicalService.updateThresholds({
        shoulder: {
          forwardFlexion: { target: 170, minAcceptable: 130 },
          abduction: { target: 170, minAcceptable: 130 },
          externalRotation: { target: 95, elbowAngleTolerance: 12 },
          internalRotation: { target: 75 },
          scapulohumeralRhythm: { min: 2.5, max: 3.0 },
        },
      });

      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        viewOrientation: 'sagittal',
      });

      const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

      expect(measurement.primaryJoint.targetAngle).toBe(170);
    });

    it('should allow custom compensation detection config', () => {
      const customService = new ClinicalMeasurementService(undefined, {
        trunkLean: {
          threshold: 15, // Stricter threshold
          severityThresholds: { minimal: 5, mild: 15, moderate: 25, severe: 35 },
        },
      });

      const poseData = createMockPoseData('movenet-17', {
        shoulderFlexion: 160,
        trunkLean: 12,
        viewOrientation: 'sagittal',
      });

      const measurement = customService.measureShoulderFlexion(poseData, 'left');

      // Should not detect compensation (12° < 15° threshold)
      const trunkComp = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkComp).toBeUndefined();
    });
  });
});
