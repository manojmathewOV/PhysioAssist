import { goniometerService, GoniometerService } from '../goniometerService';
import { PoseLandmark } from '../../types/pose';
import { AnatomicalPlane } from '../../types/biomechanics';
import { Vector3D } from '../../types/common';

describe('GoniometerService', () => {
  beforeEach(() => {
    // Clear angle history before each test
    goniometerService.clearAngleHistory();
  });

  describe('calculateAngle', () => {
    it('should calculate 90 degrees for right angle', () => {
      const pointA: PoseLandmark = { x: 0, y: 1, z: 0, visibility: 1, name: 'pointA', index: 0 };
      const pointB: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointB', index: 1 };
      const pointC: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1, name: 'pointC', index: 2 };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC);
      expect(result.angle).toBeCloseTo(90, 0);
      expect(result.isValid).toBe(true);
    });

    it('should calculate 180 degrees for straight line', () => {
      const pointA: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointA', index: 0 };
      const pointB: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1, name: 'pointB', index: 1 };
      const pointC: PoseLandmark = { x: 2, y: 0, z: 0, visibility: 1, name: 'pointC', index: 2 };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC);
      expect(result.angle).toBeCloseTo(180, 0);
      expect(result.isValid).toBe(true);
    });

    it('should calculate 45 degrees for diagonal', () => {
      const pointA: PoseLandmark = { x: 0, y: 1, z: 0, visibility: 1, name: 'pointA', index: 0 };
      const pointB: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointB', index: 1 };
      const pointC: PoseLandmark = { x: 1, y: 1, z: 0, visibility: 1, name: 'pointC', index: 2 };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC);
      expect(result.angle).toBeCloseTo(45, 0);
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculateAngle3D', () => {
    it('should calculate 3D angles correctly', () => {
      // Enable 3D mode
      goniometerService.updateConfig({ use3D: true });

      const pointA: PoseLandmark = { x: 0, y: 0, z: 1, visibility: 1, name: 'pointA', index: 0 };
      const pointB: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointB', index: 1 };
      const pointC: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1, name: 'pointC', index: 2 };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC, 'test3D');
      expect(result.angle).toBeCloseTo(90, 0);
      expect(result.isValid).toBe(true);

      // Reset to 2D mode
      goniometerService.updateConfig({ use3D: false });
    });
  });

  describe('getJointAngle', () => {
    it('should calculate elbow angle correctly', () => {
      const landmarks: PoseLandmark[] = new Array(17).fill(null).map((_, i) => ({
        x: 0,
        y: 0,
        z: 0,
        visibility: 1,
        name: `landmark_${i}`,
      }));

      // Set up right arm in 90-degree position (MoveNet keypoints: 6=shoulder, 8=elbow, 10=wrist)
      landmarks[6] = { x: 0, y: 0, z: 0, visibility: 1, name: 'right_shoulder', index: 6 }; // shoulder
      landmarks[8] = { x: 1, y: 0, z: 0, visibility: 1, name: 'right_elbow', index: 8 }; // elbow
      landmarks[10] = { x: 1, y: 1, z: 0, visibility: 1, name: 'right_wrist', index: 10 }; // wrist

      const angle = goniometerService.getJointAngle('rightElbow', landmarks);
      expect(angle).toBeCloseTo(90, 0);
    });

    it('should return null for invalid joint name', () => {
      const landmarks: PoseLandmark[] = [];
      const angle = goniometerService.getJointAngle('invalidJoint' as any, landmarks);
      expect(angle).toBeNull();
    });
  });

  describe('getAllJointAngles', () => {
    it('should calculate all joint angles', () => {
      const landmarks: PoseLandmark[] = new Array(17).fill(null).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: 0,
        visibility: 1,
        name: `landmark_${i}`,
      }));

      const angles = goniometerService.getAllJointAngles(landmarks);

      // Expect all MoveNet-supported angles
      expect(angles).toHaveProperty('leftElbow');
      expect(angles).toHaveProperty('rightElbow');
      expect(angles).toHaveProperty('leftKnee');
      expect(angles).toHaveProperty('rightKnee');
      expect(angles).toHaveProperty('leftShoulder');
      expect(angles).toHaveProperty('rightShoulder');
      expect(angles).toHaveProperty('leftHip');
      expect(angles).toHaveProperty('rightHip');
      // Note: Ankle angles not supported (MoveNet lacks toe keypoints needed for ankle angle)
    });
  });

  describe('smoothAngle', () => {
    beforeEach(() => {
      goniometerService.clearAngleHistory();
    });

    it('should smooth angle values over time', () => {
      const jointName = 'rightElbow';

      // Add multiple angle readings
      goniometerService.smoothAngle(jointName, 90);
      goniometerService.smoothAngle(jointName, 92);
      goniometerService.smoothAngle(jointName, 88);
      goniometerService.smoothAngle(jointName, 91);
      const angle5 = goniometerService.smoothAngle(jointName, 89);

      // The smoothed angle should be close to the average
      expect(angle5).toBeCloseTo(90, 1);
    });

    it('should use window size correctly', () => {
      const jointName = 'leftKnee';

      // Add more readings than window size
      for (let i = 0; i < 10; i++) {
        goniometerService.smoothAngle(jointName, 100 + i, 3);
      }

      // Should only consider last 3 values (108, 109, and the new 110)
      const smoothed = goniometerService.smoothAngle(jointName, 110, 3);
      expect(smoothed).toBeCloseTo(109, 1); // Average of 108, 109, 110
    });
  });

  describe('clearAngleHistory', () => {
    it('should clear all angle history', () => {
      // Add some angle history
      goniometerService.smoothAngle('rightElbow', 90);
      goniometerService.smoothAngle('leftKnee', 120);

      // Clear history
      goniometerService.clearAngleHistory();

      // New readings should not be affected by previous ones
      const angle1 = goniometerService.smoothAngle('rightElbow', 45);
      const angle2 = goniometerService.smoothAngle('leftKnee', 60);

      expect(angle1).toBe(45);
      expect(angle2).toBe(60);
    });

    it('should clear specific joint history', () => {
      // Add angle history for multiple joints
      goniometerService.smoothAngle('rightElbow', 90);
      goniometerService.smoothAngle('rightElbow', 91);
      goniometerService.smoothAngle('leftKnee', 120);
      goniometerService.smoothAngle('leftKnee', 121);

      // Clear only right elbow history
      goniometerService.clearAngleHistory('rightElbow');

      // Right elbow should reset, left knee should maintain history
      const elbowAngle = goniometerService.smoothAngle('rightElbow', 45);
      const kneeAngle = goniometerService.smoothAngle('leftKnee', 122);

      expect(elbowAngle).toBe(45);
      expect(kneeAngle).toBeCloseTo(121, 1); // Should be smoothed with history
    });
  });

  describe('Gate 9 Enhancements: 3D Mode and Plane-Aware Calculations', () => {
    describe('Default 3D Mode', () => {
      it('should enable 3D mode by default', () => {
        const freshService = new GoniometerService();
        const pointA: PoseLandmark = {
          x: 0,
          y: 0,
          z: 1,
          visibility: 1,
          name: 'pointA',
          index: 0,
        };
        const pointB: PoseLandmark = {
          x: 0,
          y: 0,
          z: 0,
          visibility: 1,
          name: 'pointB',
          index: 1,
        };
        const pointC: PoseLandmark = {
          x: 1,
          y: 0,
          z: 0,
          visibility: 1,
          name: 'pointC',
          index: 2,
        };

        const result = freshService.calculateAngle(pointA, pointB, pointC, 'test3D');

        // Should calculate 3D angle (90 degrees in 3D space)
        expect(result.angle).toBeCloseTo(90, 0);
        expect(result.isValid).toBe(true);
      });

      it('should allow 2D mode via configuration override', () => {
        const service2D = new GoniometerService({ use3D: false });
        const pointA: PoseLandmark = {
          x: 0,
          y: 1,
          z: 0,
          visibility: 1,
          name: 'pointA',
          index: 0,
        };
        const pointB: PoseLandmark = {
          x: 0,
          y: 0,
          z: 0,
          visibility: 1,
          name: 'pointB',
          index: 1,
        };
        const pointC: PoseLandmark = {
          x: 1,
          y: 0,
          z: 0,
          visibility: 1,
          name: 'pointC',
          index: 2,
        };

        const result = service2D.calculateAngle(pointA, pointB, pointC, 'test2D');

        expect(result.angle).toBeCloseTo(90, 0); // Still works in 2D
      });
    });

    describe('calculateAngleInPlane', () => {
      const service = new GoniometerService();

      it('should calculate angle in sagittal plane (flexion/extension)', () => {
        // Sagittal plane: normal is Z-axis (lateral direction)
        const sagittalPlane: AnatomicalPlane = {
          name: 'sagittal',
          normal: { x: 0, y: 0, z: 1 },
          point: { x: 0, y: 0, z: 0 },
        };

        // Two vectors in XY plane (sagittal plane)
        const vector1: Vector3D = { x: 0, y: 1, z: 0 }; // Superior
        const vector2: Vector3D = { x: 1, y: 0, z: 0 }; // Anterior

        const result = service.calculateAngleInPlane(
          vector1,
          vector2,
          sagittalPlane,
          'sagittal_test'
        );

        expect(result.angle).toBeCloseTo(90, 1);
        expect(result.plane).toBe('sagittal');
        expect(result.isValid).toBe(true);
      });

      it('should calculate angle in coronal plane (abduction/adduction)', () => {
        // Coronal plane: normal is X-axis (anterior direction)
        const coronalPlane: AnatomicalPlane = {
          name: 'coronal',
          normal: { x: 1, y: 0, z: 0 },
          point: { x: 0, y: 0, z: 0 },
        };

        // Two vectors in YZ plane (coronal plane)
        const vector1: Vector3D = { x: 0, y: 1, z: 0 }; // Superior
        const vector2: Vector3D = { x: 0, y: 0, z: 1 }; // Lateral

        const result = service.calculateAngleInPlane(
          vector1,
          vector2,
          coronalPlane,
          'coronal_test'
        );

        expect(result.angle).toBeCloseTo(90, 1);
        expect(result.plane).toBe('coronal');
      });

      it('should calculate angle in scapular plane (30-40° from coronal)', () => {
        // Scapular plane: 35° anterior to coronal
        const angle35 = 35 * (Math.PI / 180);
        const scapularPlane: AnatomicalPlane = {
          name: 'scapular',
          normal: {
            x: Math.sin(angle35),
            y: 0,
            z: Math.cos(angle35),
          },
          point: { x: 0, y: 0, z: 0 },
          rotation: 35,
        };

        // Humerus vector (arm raised)
        const humerusVector: Vector3D = { x: 0.5, y: 0.8, z: 0.3 };
        // Thorax vertical
        const thoraxVector: Vector3D = { x: 0, y: 1, z: 0 };

        const result = service.calculateAngleInPlane(
          humerusVector,
          thoraxVector,
          scapularPlane,
          'shoulder_abduction_scapular'
        );

        expect(result.plane).toBe('scapular');
        expect(result.isValid).toBe(true);
        expect(result.angle).toBeGreaterThan(0);
        expect(result.angle).toBeLessThan(180);
      });

      it('should project 3D vectors onto plane before calculation', () => {
        const sagittalPlane: AnatomicalPlane = {
          name: 'sagittal',
          normal: { x: 0, y: 0, z: 1 },
          point: { x: 0, y: 0, z: 0 },
        };

        // Vectors with Z components (out of sagittal plane)
        const vector1: Vector3D = { x: 1, y: 1, z: 0.5 };
        const vector2: Vector3D = { x: 1, y: -1, z: 0.8 };

        const result = service.calculateAngleInPlane(
          vector1,
          vector2,
          sagittalPlane,
          'projected_test'
        );

        // Z components should be projected out, leaving XY angle calculation
        expect(result.isValid).toBe(true);
        expect(result.vectors?.BA.z).toBeCloseTo(0, 5); // Projected vector should have no Z
        expect(result.vectors?.BC.z).toBeCloseTo(0, 5);
      });

      it('should return high confidence for plane-projected angles', () => {
        const coronalPlane: AnatomicalPlane = {
          name: 'coronal',
          normal: { x: 1, y: 0, z: 0 },
          point: { x: 0, y: 0, z: 0 },
        };

        const vector1: Vector3D = { x: 0, y: 1, z: 0 };
        const vector2: Vector3D = { x: 0, y: 0, z: 1 };

        const result = service.calculateAngleInPlane(
          vector1,
          vector2,
          coronalPlane,
          'confidence_test'
        );

        expect(result.confidence).toBe(0.9); // High confidence for plane calculations
      });

      it('should handle parallel vectors correctly', () => {
        const sagittalPlane: AnatomicalPlane = {
          name: 'sagittal',
          normal: { x: 0, y: 0, z: 1 },
          point: { x: 0, y: 0, z: 0 },
        };

        // Parallel vectors
        const vector1: Vector3D = { x: 1, y: 2, z: 0 };
        const vector2: Vector3D = { x: 2, y: 4, z: 0 };

        const result = service.calculateAngleInPlane(
          vector1,
          vector2,
          sagittalPlane,
          'parallel_test'
        );

        expect(result.angle).toBeCloseTo(0, 1); // 0 degrees for parallel
      });

      it('should handle perpendicular vectors correctly', () => {
        const transversePlane: AnatomicalPlane = {
          name: 'transverse',
          normal: { x: 0, y: 1, z: 0 },
          point: { x: 0, y: 0, z: 0 },
        };

        // Perpendicular vectors in transverse plane
        const vector1: Vector3D = { x: 1, y: 0, z: 0 };
        const vector2: Vector3D = { x: 0, y: 0, z: 1 };

        const result = service.calculateAngleInPlane(
          vector1,
          vector2,
          transversePlane,
          'perpendicular_test'
        );

        expect(result.angle).toBeCloseTo(90, 1); // 90 degrees for perpendicular
      });

      it('should include vectors in result for validation', () => {
        const coronalPlane: AnatomicalPlane = {
          name: 'coronal',
          normal: { x: 1, y: 0, z: 0 },
          point: { x: 0, y: 0, z: 0 },
        };

        const vector1: Vector3D = { x: 0.5, y: 1, z: 0.5 };
        const vector2: Vector3D = { x: 0.3, y: 0, z: 1 };

        const result = service.calculateAngleInPlane(
          vector1,
          vector2,
          coronalPlane,
          'vectors_test'
        );

        expect(result.vectors).toBeDefined();
        expect(result.vectors?.BA).toBeDefined();
        expect(result.vectors?.BC).toBeDefined();
        // Vectors should be normalized (magnitude ~1)
        const mag1 = Math.sqrt(
          result.vectors!.BA.x ** 2 +
            result.vectors!.BA.y ** 2 +
            result.vectors!.BA.z ** 2
        );
        const mag2 = Math.sqrt(
          result.vectors!.BC.x ** 2 +
            result.vectors!.BC.y ** 2 +
            result.vectors!.BC.z ** 2
        );
        expect(mag1).toBeCloseTo(1, 1);
        expect(mag2).toBeCloseTo(1, 1);
      });
    });

    describe('Integration: 3D + Plane-Aware Calculations', () => {
      it('should work with both calculateAngle (3D) and calculateAngleInPlane', () => {
        const service = new GoniometerService();

        // Test 3D angle calculation
        const pointA: PoseLandmark = {
          x: 0,
          y: 0,
          z: 1,
          visibility: 1,
          name: 'pointA',
          index: 0,
        };
        const pointB: PoseLandmark = {
          x: 0,
          y: 0,
          z: 0,
          visibility: 1,
          name: 'pointB',
          index: 1,
        };
        const pointC: PoseLandmark = {
          x: 1,
          y: 0,
          z: 0,
          visibility: 1,
          name: 'pointC',
          index: 2,
        };

        const angle3D = service.calculateAngle(pointA, pointB, pointC, 'test3D');
        expect(angle3D.angle).toBeCloseTo(90, 0);

        // Test plane-aware calculation
        const sagittalPlane: AnatomicalPlane = {
          name: 'sagittal',
          normal: { x: 0, y: 0, z: 1 },
          point: { x: 0, y: 0, z: 0 },
        };
        const vector1: Vector3D = { x: 0, y: 1, z: 0 };
        const vector2: Vector3D = { x: 1, y: 0, z: 0 };

        const angleInPlane = service.calculateAngleInPlane(
          vector1,
          vector2,
          sagittalPlane,
          'testPlane'
        );
        expect(angleInPlane.angle).toBeCloseTo(90, 0);

        // Both should work correctly
        expect(angle3D.isValid).toBe(true);
        expect(angleInPlane.isValid).toBe(true);
        expect(angleInPlane.plane).toBe('sagittal');
      });
    });
  });
});
