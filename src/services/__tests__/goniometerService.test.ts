import { goniometerService } from '../goniometerService';
import { PoseLandmark } from '../../types/pose';

describe('GoniometerService', () => {
  beforeEach(() => {
    // Clear angle history before each test
    goniometerService.clearAngleHistory();
  });

  describe('calculateAngle', () => {
    it('should calculate 90 degrees for right angle', () => {
      const pointA: PoseLandmark = { x: 0, y: 1, z: 0, visibility: 1, name: 'pointA' };
      const pointB: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointB' };
      const pointC: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1, name: 'pointC' };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC);
      expect(result.angle).toBeCloseTo(90, 0);
      expect(result.isValid).toBe(true);
    });

    it('should calculate 180 degrees for straight line', () => {
      const pointA: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointA' };
      const pointB: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1, name: 'pointB' };
      const pointC: PoseLandmark = { x: 2, y: 0, z: 0, visibility: 1, name: 'pointC' };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC);
      expect(result.angle).toBeCloseTo(180, 0);
      expect(result.isValid).toBe(true);
    });

    it('should calculate 45 degrees for diagonal', () => {
      const pointA: PoseLandmark = { x: 0, y: 1, z: 0, visibility: 1, name: 'pointA' };
      const pointB: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointB' };
      const pointC: PoseLandmark = { x: 1, y: 1, z: 0, visibility: 1, name: 'pointC' };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC);
      expect(result.angle).toBeCloseTo(45, 0);
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculateAngle3D', () => {
    it('should calculate 3D angles correctly', () => {
      // Enable 3D mode
      goniometerService.updateConfig({ use3D: true });
      
      const pointA: PoseLandmark = { x: 0, y: 0, z: 1, visibility: 1, name: 'pointA' };
      const pointB: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1, name: 'pointB' };
      const pointC: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1, name: 'pointC' };

      const result = goniometerService.calculateAngle(pointA, pointB, pointC, 'test3D');
      expect(result.angle).toBeCloseTo(90, 0);
      expect(result.isValid).toBe(true);
      
      // Reset to 2D mode
      goniometerService.updateConfig({ use3D: false });
    });
  });

  describe('getJointAngle', () => {
    it('should calculate elbow angle correctly', () => {
      const landmarks: PoseLandmark[] = new Array(33).fill(null).map((_, i) => ({
        x: 0,
        y: 0,
        z: 0,
        visibility: 1,
        name: `landmark_${i}`
      }));

      // Set up right arm in 90-degree position
      landmarks[12] = { x: 0, y: 0, z: 0, visibility: 1, name: 'right_shoulder' }; // shoulder
      landmarks[14] = { x: 1, y: 0, z: 0, visibility: 1, name: 'right_elbow' }; // elbow
      landmarks[16] = { x: 1, y: 1, z: 0, visibility: 1, name: 'right_wrist' }; // wrist

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
      const landmarks: PoseLandmark[] = new Array(33).fill(null).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: 0,
        visibility: 1,
        name: `landmark_${i}`
      }));

      const angles = goniometerService.getAllJointAngles(landmarks);
      
      expect(angles).toHaveProperty('leftElbow');
      expect(angles).toHaveProperty('rightElbow');
      expect(angles).toHaveProperty('leftKnee');
      expect(angles).toHaveProperty('rightKnee');
      expect(angles).toHaveProperty('leftShoulder');
      expect(angles).toHaveProperty('rightShoulder');
      expect(angles).toHaveProperty('leftHip');
      expect(angles).toHaveProperty('rightHip');
      expect(angles).toHaveProperty('leftAnkle');
      expect(angles).toHaveProperty('rightAnkle');
    });
  });

  describe('smoothAngle', () => {
    beforeEach(() => {
      goniometerService.clearAngleHistory();
    });

    it('should smooth angle values over time', () => {
      const jointName = 'rightElbow';
      
      // Add multiple angle readings
      const angle1 = goniometerService.smoothAngle(jointName, 90);
      const angle2 = goniometerService.smoothAngle(jointName, 92);
      const angle3 = goniometerService.smoothAngle(jointName, 88);
      const angle4 = goniometerService.smoothAngle(jointName, 91);
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
});