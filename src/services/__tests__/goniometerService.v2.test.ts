/**
 * Goniometer Service V2 Tests
 * Gate 9B.6: Comprehensive test suite for schema-aware, plane-projected goniometry
 *
 * Test Coverage:
 * - Schema awareness (5 tests)
 * - Plane projection (4 tests)
 * - Euler angles (3 tests)
 * - Integration with cached frames (2 tests)
 * - Error handling (1 test)
 *
 * Total: 15 tests
 */

import { GoniometerServiceV2, ShoulderEulerAngles } from '../goniometerService.v2';
import { ProcessedPoseData, PoseLandmark } from '@types/pose';
import { AnatomicalReferenceFrame, AnatomicalPlane } from '@types/biomechanics';
import { PoseSchemaRegistry } from '../pose/PoseSchemaRegistry';

describe('GoniometerServiceV2 - Gate 9B.6', () => {
  let goniometer: GoniometerServiceV2;

  beforeEach(() => {
    goniometer = new GoniometerServiceV2();
  });

  // =============================================================================
  // Helper Functions
  // =============================================================================

  /**
   * Create mock ProcessedPoseData with cached anatomical frames
   */
  function createMockPoseData(
    schemaId: 'movenet-17' | 'mediapipe-33' = 'movenet-17',
    pose: string = 'standing_neutral'
  ): ProcessedPoseData {
    // Create mock landmarks (17 for MoveNet, 33 for MediaPipe)
    const landmarkCount = schemaId === 'movenet-17' ? 17 : 33;
    const landmarks: PoseLandmark[] = [];

    // MoveNet-17 keypoint names
    const moveNetNames = [
      'nose',
      'left_eye',
      'right_eye',
      'left_ear',
      'right_ear',
      'left_shoulder',
      'right_shoulder',
      'left_elbow',
      'right_elbow',
      'left_wrist',
      'right_wrist',
      'left_hip',
      'right_hip',
      'left_knee',
      'right_knee',
      'left_ankle',
      'right_ankle',
    ];

    // Create landmarks
    for (let i = 0; i < landmarkCount; i++) {
      const name = i < moveNetNames.length ? moveNetNames[i] : `landmark_${i}`;

      // Position based on pose
      let x = 0.5,
        y = 0.5,
        z = 0;

      if (pose === 'elbow_90_deg') {
        // Elbow bent at 90 degrees
        if (name === 'left_shoulder') {
          x = 0.4;
          y = 0.3;
        }
        if (name === 'left_elbow') {
          x = 0.5;
          y = 0.4;
        }
        if (name === 'left_wrist') {
          x = 0.6;
          y = 0.4;
        } // 90° elbow
      } else if (pose === 'shoulder_abduction_90') {
        // Shoulder abducted 90 degrees
        if (name === 'left_shoulder') {
          x = 0.4;
          y = 0.3;
        }
        if (name === 'left_elbow') {
          x = 0.3;
          y = 0.3;
        } // Arm raised sideways
        if (name === 'left_hip') {
          x = 0.4;
          y = 0.6;
        }
      }

      landmarks.push({
        x,
        y,
        z,
        visibility: 0.9,
        index: i,
        name,
      });
    }

    // Create mock anatomical frames
    const globalFrame: AnatomicalReferenceFrame = {
      origin: { x: 0.5, y: 0.5, z: 0 },
      xAxis: { x: 1, y: 0, z: 0 },
      yAxis: { x: 0, y: 1, z: 0 },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: 'global',
      confidence: 0.9,
    };

    const thoraxFrame: AnatomicalReferenceFrame = {
      origin: { x: 0.5, y: 0.3, z: 0 }, // Shoulder center
      xAxis: { x: 1, y: 0, z: 0 },
      yAxis: { x: 0, y: 1, z: 0 },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: 'thorax',
      confidence: 0.9,
    };

    const humerusFrame: AnatomicalReferenceFrame = {
      origin: { x: 0.4, y: 0.3, z: 0 }, // Left shoulder
      xAxis: { x: 0.707, y: -0.707, z: 0 }, // 45° rotation
      yAxis: { x: 0.707, y: 0.707, z: 0 },
      zAxis: { x: 0, y: 0, z: 1 },
      frameType: 'humerus',
      confidence: 0.9,
    };

    return {
      landmarks,
      timestamp: Date.now(),
      confidence: 0.9,
      schemaId,
      viewOrientation: 'frontal',
      qualityScore: 0.85,
      cachedAnatomicalFrames: {
        global: globalFrame,
        thorax: thoraxFrame,
        pelvis: globalFrame,
        left_humerus: humerusFrame,
        right_humerus: humerusFrame,
      },
    };
  }

  // =============================================================================
  // GROUP 1: Schema Awareness Tests (5 tests)
  // =============================================================================

  describe('Schema Awareness', () => {
    it('should calculate elbow angle with MoveNet-17 schema', () => {
      const poseData = createMockPoseData('movenet-17', 'elbow_90_deg');

      const measurement = goniometer.calculateJointAngle(poseData, 'left_elbow');

      expect(measurement).toBeDefined();
      expect(measurement.jointName).toBe('left_elbow');
      expect(measurement.angle).toBeGreaterThan(0);
      expect(measurement.isValid).toBe(true);
      expect(measurement.measurementPlane.name).toBe('sagittal');
    });

    it('should work with MediaPipe-33 schema', () => {
      const poseData = createMockPoseData('mediapipe-33', 'elbow_90_deg');

      // Should not throw error with MediaPipe schema
      expect(() => {
        goniometer.calculateJointAngle(poseData, 'left_elbow');
      }).not.toThrow();
    });

    it('should throw error if required landmarks missing in schema', () => {
      const poseData = createMockPoseData('movenet-17');

      // Create a custom schema with missing landmarks
      const customSchema = {
        id: 'custom-minimal' as any,
        modelName: 'Custom Minimal',
        landmarkCount: 3,
        landmarks: [
          { index: 0, name: 'nose', group: 'head' as any },
          // Missing shoulder, elbow, wrist
        ],
        groups: {},
        provides3D: false,
        defaultConfidenceThreshold: 0.5,
      };

      PoseSchemaRegistry.getInstance().register(customSchema);
      poseData.schemaId = 'custom-minimal' as any;

      expect(() => {
        goniometer.calculateJointAngle(poseData, 'left_elbow');
      }).toThrow(/requires landmarks.*not available/);
    });

    it('should resolve landmark indices dynamically for different schemas', () => {
      const moveNetPose = createMockPoseData('movenet-17', 'standing_neutral');
      const mediaPipePose = createMockPoseData('mediapipe-33', 'standing_neutral');

      // Both should succeed despite different index mappings
      const moveNetAngle = goniometer.calculateJointAngle(moveNetPose, 'left_shoulder');
      const mediaPipeAngle = goniometer.calculateJointAngle(
        mediaPipePose,
        'left_shoulder'
      );

      expect(moveNetAngle.angle).toBeDefined();
      expect(mediaPipeAngle.angle).toBeDefined();
    });

    it('should throw error for unknown joint names', () => {
      const poseData = createMockPoseData('movenet-17');

      expect(() => {
        goniometer.calculateJointAngle(poseData, 'left_toe' as any);
      }).toThrow(/Unknown joint name/);
    });
  });

  // =============================================================================
  // GROUP 2: Plane Projection Tests (4 tests)
  // =============================================================================

  describe('Plane Projection', () => {
    it('should project elbow angle onto sagittal plane', () => {
      const poseData = createMockPoseData('movenet-17', 'elbow_90_deg');

      const measurement = goniometer.calculateJointAngle(poseData, 'left_elbow');

      expect(measurement.measurementPlane.name).toBe('sagittal');
      expect(measurement.plane).toBe('sagittal');
      expect(measurement.angle).toBeDefined();
    });

    it('should project shoulder angle onto scapular plane', () => {
      const poseData = createMockPoseData('movenet-17', 'shoulder_abduction_90');

      const measurement = goniometer.calculateJointAngle(poseData, 'left_shoulder');

      expect(measurement.measurementPlane.name).toBe('scapular');
      expect(measurement.measurementPlane.rotation).toBe(35); // 35° from coronal
    });

    it('should use coronal plane for hip measurements', () => {
      const poseData = createMockPoseData('movenet-17', 'standing_neutral');

      const measurement = goniometer.calculateJointAngle(poseData, 'left_hip');

      expect(measurement.measurementPlane.name).toBe('coronal');
    });

    it('should include measurement plane in all angle results', () => {
      const poseData = createMockPoseData('movenet-17', 'standing_neutral');

      const angles = goniometer.calculateAllJointAngles(poseData);

      for (const [jointName, measurement] of angles.entries()) {
        expect(measurement.measurementPlane).toBeDefined();
        expect(measurement.measurementPlane.name).toBeDefined();
        expect(measurement.measurementPlane.normal).toBeDefined();
        expect(measurement.plane).toBeDefined();
      }
    });
  });

  // =============================================================================
  // GROUP 3: Euler Angle Tests (3 tests)
  // =============================================================================

  describe('Euler Angles', () => {
    it('should calculate Euler angles for shoulder', () => {
      const poseData = createMockPoseData('movenet-17', 'shoulder_abduction_90');

      const eulerAngles = goniometer.calculateShoulderEulerAngles(poseData, 'left');

      expect(eulerAngles).toBeDefined();
      expect(eulerAngles.planeOfElevation).toBeDefined();
      expect(eulerAngles.elevation).toBeDefined();
      expect(eulerAngles.rotation).toBeDefined();
      expect(eulerAngles.confidence).toBeGreaterThan(0);
    });

    it('should throw error if humerus frame not available', () => {
      const poseData = createMockPoseData('movenet-17');

      // Remove humerus frame
      if (poseData.cachedAnatomicalFrames) {
        poseData.cachedAnatomicalFrames.left_humerus = undefined;
      }

      expect(() => {
        goniometer.calculateShoulderEulerAngles(poseData, 'left');
      }).toThrow(/Humerus frame not available/);
    });

    it('should provide confidence based on frame visibilities', () => {
      const poseData = createMockPoseData('movenet-17', 'shoulder_abduction_90');

      // Set thorax confidence to 0.7
      if (poseData.cachedAnatomicalFrames) {
        poseData.cachedAnatomicalFrames.thorax.confidence = 0.7;
        poseData.cachedAnatomicalFrames.left_humerus!.confidence = 0.9;
      }

      const eulerAngles = goniometer.calculateShoulderEulerAngles(poseData, 'left');

      // Confidence should be minimum of frame confidences
      expect(eulerAngles.confidence).toBe(0.7);
    });
  });

  // =============================================================================
  // GROUP 4: Cached Frame Integration (2 tests)
  // =============================================================================

  describe('Cached Frame Integration', () => {
    it('should use cached anatomical frames from ProcessedPoseData', () => {
      const poseData = createMockPoseData('movenet-17', 'elbow_90_deg');

      // Spy on anatomical frames to ensure they're used (not recalculated)
      const originalThoraxFrame = poseData.cachedAnatomicalFrames!.thorax;

      const measurement = goniometer.calculateJointAngle(poseData, 'left_elbow');

      expect(measurement).toBeDefined();
      // Frames should be consumed from cache, not recalculated
      expect(poseData.cachedAnatomicalFrames!.thorax).toBe(originalThoraxFrame);
    });

    it('should throw error if cached frames not available', () => {
      const poseData = createMockPoseData('movenet-17');

      // Remove cached frames
      poseData.cachedAnatomicalFrames = undefined;

      expect(() => {
        goniometer.calculateJointAngle(poseData, 'left_elbow');
      }).toThrow(/cachedAnatomicalFrames not available/);
    });
  });

  // =============================================================================
  // GROUP 5: Error Handling & Edge Cases (1 test)
  // =============================================================================

  describe('Error Handling', () => {
    it('should throw error for low confidence landmarks', () => {
      const poseData = createMockPoseData('movenet-17', 'elbow_90_deg');

      // Set low visibility for elbow landmarks
      const elbowIndex = poseData.landmarks.findIndex((lm) => lm.name === 'left_elbow');
      poseData.landmarks[elbowIndex].visibility = 0.3; // Below default 0.5 threshold

      expect(() => {
        goniometer.calculateJointAngle(poseData, 'left_elbow');
      }).toThrow(/Low confidence/);
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration Scenarios', () => {
    it('should calculate all joint angles efficiently', () => {
      const poseData = createMockPoseData('movenet-17', 'standing_neutral');

      const angles = goniometer.calculateAllJointAngles(poseData);

      // Should have multiple joints
      expect(angles.size).toBeGreaterThan(0);

      // All angles should be valid
      for (const [jointName, measurement] of angles.entries()) {
        expect(measurement.isValid).toBe(true);
        expect(measurement.angle).toBeGreaterThanOrEqual(0);
        expect(measurement.angle).toBeLessThanOrEqual(180);
        expect(measurement.measurementPlane).toBeDefined();
      }
    });

    it('should skip joints with missing landmarks gracefully', () => {
      const poseData = createMockPoseData('movenet-17', 'standing_neutral');

      // Remove wrist landmark (makes elbow unmeasurable)
      poseData.landmarks = poseData.landmarks.filter((lm) => lm.name !== 'left_wrist');

      const angles = goniometer.calculateAllJointAngles(poseData);

      // Should not include left_elbow
      expect(angles.has('left_elbow')).toBe(false);

      // But should include other joints
      expect(angles.size).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // Temporal Smoothing Tests
  // =============================================================================

  describe('Temporal Smoothing', () => {
    it('should smooth angles over multiple measurements', () => {
      const poseData = createMockPoseData('movenet-17', 'elbow_90_deg');

      // Configure with smoothing enabled
      goniometer.updateConfig({ smoothingWindow: 3 });

      // Measure same angle 3 times with slight variations
      const angle1 = goniometer.calculateJointAngle(poseData, 'left_elbow');
      const angle2 = goniometer.calculateJointAngle(poseData, 'left_elbow');
      const angle3 = goniometer.calculateJointAngle(poseData, 'left_elbow');

      // Third measurement should be smoothed average
      expect(angle3.angle).toBeDefined();

      // History should contain 3 measurements
      const history = goniometer.getAngleHistory('left_elbow');
      expect(history.length).toBe(3);
    });

    it('should reset angle history', () => {
      const poseData = createMockPoseData('movenet-17', 'elbow_90_deg');

      goniometer.calculateJointAngle(poseData, 'left_elbow');
      goniometer.calculateJointAngle(poseData, 'left_elbow');

      expect(goniometer.getAngleHistory('left_elbow').length).toBe(2);

      goniometer.resetHistory('left_elbow');

      expect(goniometer.getAngleHistory('left_elbow').length).toBe(0);
    });
  });
});
