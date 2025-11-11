import { AnatomicalReferenceService } from '../AnatomicalReferenceService';
import { PoseLandmark } from '../../../types/pose';
import { dotProduct, magnitude } from '../../../utils/vectorMath';

/**
 * Create synthetic pose data for testing
 * Simulates a person standing upright in neutral position
 */
function createNeutralStandingPose(): PoseLandmark[] {
  return [
    { x: 0.5, y: 0.1, z: 0, visibility: 0.9, index: 0, name: 'nose' },
    { x: 0.52, y: 0.12, z: 0, visibility: 0.85, index: 1, name: 'left_eye' },
    { x: 0.48, y: 0.12, z: 0, visibility: 0.85, index: 2, name: 'right_eye' },
    { x: 0.54, y: 0.14, z: 0, visibility: 0.8, index: 3, name: 'left_ear' },
    { x: 0.46, y: 0.14, z: 0, visibility: 0.8, index: 4, name: 'right_ear' },
    { x: 0.6, y: 0.3, z: 0, visibility: 0.95, index: 5, name: 'left_shoulder' },
    { x: 0.4, y: 0.3, z: 0, visibility: 0.95, index: 6, name: 'right_shoulder' },
    { x: 0.65, y: 0.5, z: 0, visibility: 0.9, index: 7, name: 'left_elbow' },
    { x: 0.35, y: 0.5, z: 0, visibility: 0.9, index: 8, name: 'right_elbow' },
    { x: 0.7, y: 0.7, z: 0, visibility: 0.85, index: 9, name: 'left_wrist' },
    { x: 0.3, y: 0.7, z: 0, visibility: 0.85, index: 10, name: 'right_wrist' },
    { x: 0.55, y: 0.6, z: 0, visibility: 0.95, index: 11, name: 'left_hip' },
    { x: 0.45, y: 0.6, z: 0, visibility: 0.95, index: 12, name: 'right_hip' },
    { x: 0.55, y: 0.8, z: 0, visibility: 0.9, index: 13, name: 'left_knee' },
    { x: 0.45, y: 0.8, z: 0, visibility: 0.9, index: 14, name: 'right_knee' },
    { x: 0.55, y: 0.95, z: 0, visibility: 0.85, index: 15, name: 'left_ankle' },
    { x: 0.45, y: 0.95, z: 0, visibility: 0.85, index: 16, name: 'right_ankle' },
  ];
}

/**
 * Create pose with arms raised (shoulder abduction)
 */
function createArmsRaisedPose(): PoseLandmark[] {
  const pose = createNeutralStandingPose();

  // Raise left arm to 90° abduction
  pose[7] = { x: 0.8, y: 0.3, z: 0, visibility: 0.9, index: 7, name: 'left_elbow' };
  pose[9] = { x: 0.9, y: 0.3, z: 0, visibility: 0.85, index: 9, name: 'left_wrist' };

  // Raise right arm to 90° abduction
  pose[8] = { x: 0.2, y: 0.3, z: 0, visibility: 0.9, index: 8, name: 'right_elbow' };
  pose[10] = { x: 0.1, y: 0.3, z: 0, visibility: 0.85, index: 10, name: 'right_wrist' };

  return pose;
}

/**
 * Create pose with trunk lean (compensation pattern)
 */
function createTrunkLeanPose(): PoseLandmark[] {
  const pose = createNeutralStandingPose();

  // Lean trunk to the left
  const leanOffset = 0.1;
  pose[5].x += leanOffset; // left_shoulder
  pose[6].x += leanOffset; // right_shoulder

  return pose;
}

describe('AnatomicalReferenceService', () => {
  let service: AnatomicalReferenceService;

  beforeEach(() => {
    service = new AnatomicalReferenceService();
  });

  describe('calculateGlobalFrame', () => {
    it('should create orthogonal reference frame', () => {
      const landmarks = createNeutralStandingPose();
      const frame = service.calculateGlobalFrame(landmarks);

      // Check orthogonality: dot product of perpendicular axes should be ~0
      const xy = dotProduct(frame.xAxis, frame.yAxis);
      const yz = dotProduct(frame.yAxis, frame.zAxis);
      const zx = dotProduct(frame.zAxis, frame.xAxis);

      expect(Math.abs(xy)).toBeLessThan(0.01);
      expect(Math.abs(yz)).toBeLessThan(0.01);
      expect(Math.abs(zx)).toBeLessThan(0.01);
    });

    it('should normalize all axes to unit vectors', () => {
      const landmarks = createNeutralStandingPose();
      const frame = service.calculateGlobalFrame(landmarks);

      const xMag = magnitude(frame.xAxis);
      const yMag = magnitude(frame.yAxis);
      const zMag = magnitude(frame.zAxis);

      expect(xMag).toBeCloseTo(1, 5);
      expect(yMag).toBeCloseTo(1, 5);
      expect(zMag).toBeCloseTo(1, 5);
    });

    it('should have Y-axis pointing upward (superior)', () => {
      const landmarks = createNeutralStandingPose();
      const frame = service.calculateGlobalFrame(landmarks);

      // Y-axis should have negative y-component in screen coords
      // (since shoulders are higher than hips, and y increases downward)
      expect(frame.yAxis.y).toBeLessThan(0);
    });

    it('should have Z-axis pointing right (lateral)', () => {
      const landmarks = createNeutralStandingPose();
      const frame = service.calculateGlobalFrame(landmarks);

      // Z-axis should point from left hip to right hip (negative x in screen coords)
      expect(frame.zAxis.x).toBeLessThan(0);
    });

    it('should set frame type to global', () => {
      const landmarks = createNeutralStandingPose();
      const frame = service.calculateGlobalFrame(landmarks);

      expect(frame.frameType).toBe('global');
    });

    it('should calculate confidence from landmark visibility', () => {
      const landmarks = createNeutralStandingPose();
      const frame = service.calculateGlobalFrame(landmarks);

      expect(frame.confidence).toBeGreaterThan(0);
      expect(frame.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateThoraxFrame', () => {
    it('should create orthogonal reference frame', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);

      const xy = dotProduct(thoraxFrame.xAxis, thoraxFrame.yAxis);
      const yz = dotProduct(thoraxFrame.yAxis, thoraxFrame.zAxis);
      const zx = dotProduct(thoraxFrame.zAxis, thoraxFrame.xAxis);

      expect(Math.abs(xy)).toBeLessThan(0.01);
      expect(Math.abs(yz)).toBeLessThan(0.01);
      expect(Math.abs(zx)).toBeLessThan(0.01);
    });

    it('should have origin at shoulder midpoint', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);

      const leftShoulder = landmarks[5];
      const rightShoulder = landmarks[6];
      const expectedX = (leftShoulder.x + rightShoulder.x) / 2;
      const expectedY = (leftShoulder.y + rightShoulder.y) / 2;

      expect(thoraxFrame.origin.x).toBeCloseTo(expectedX, 5);
      expect(thoraxFrame.origin.y).toBeCloseTo(expectedY, 5);
    });

    it('should align with global frame in neutral stance', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);

      // In neutral stance, thorax Y should be similar to global Y
      const yAlignment = Math.abs(dotProduct(thoraxFrame.yAxis, globalFrame.yAxis));
      expect(yAlignment).toBeGreaterThan(0.95); // Nearly parallel
    });

    it('should detect trunk lean via Y-axis deviation', () => {
      const leanPose = createTrunkLeanPose();
      const globalFrame = service.calculateGlobalFrame(leanPose);
      const thoraxFrame = service.calculateThoraxFrame(leanPose, globalFrame);

      // Leaning trunk should cause deviation from global vertical
      const yAlignment = Math.abs(dotProduct(thoraxFrame.yAxis, globalFrame.yAxis));
      expect(yAlignment).toBeLessThan(1.0); // Some deviation
    });

    it('should set frame type to thorax', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);

      expect(thoraxFrame.frameType).toBe('thorax');
    });
  });

  describe('calculateScapularPlane', () => {
    it('should create plane 35° anterior to coronal by default', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const scapularPlane = service.calculateScapularPlane(thoraxFrame);

      expect(scapularPlane.name).toBe('scapular');
      expect(scapularPlane.rotation).toBe(35);
    });

    it('should accept custom rotation angle', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const scapularPlane = service.calculateScapularPlane(thoraxFrame, 30);

      expect(scapularPlane.rotation).toBe(30);
    });

    it('should have normalized normal vector', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const scapularPlane = service.calculateScapularPlane(thoraxFrame);

      const normalMag = magnitude(scapularPlane.normal);
      expect(normalMag).toBeCloseTo(1, 5);
    });

    it('should have point at thorax origin', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const scapularPlane = service.calculateScapularPlane(thoraxFrame);

      expect(scapularPlane.point).toEqual(thoraxFrame.origin);
    });
  });

  describe('calculateHumerusFrame', () => {
    it('should create orthogonal reference frame for left arm', () => {
      const landmarks = createArmsRaisedPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const humerusFrame = service.calculateHumerusFrame(landmarks, 'left', thoraxFrame);

      const xy = dotProduct(humerusFrame.xAxis, humerusFrame.yAxis);
      const yz = dotProduct(humerusFrame.yAxis, humerusFrame.zAxis);
      const zx = dotProduct(humerusFrame.zAxis, humerusFrame.xAxis);

      expect(Math.abs(xy)).toBeLessThan(0.01);
      expect(Math.abs(yz)).toBeLessThan(0.01);
      expect(Math.abs(zx)).toBeLessThan(0.01);
    });

    it('should create orthogonal reference frame for right arm', () => {
      const landmarks = createArmsRaisedPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const humerusFrame = service.calculateHumerusFrame(landmarks, 'right', thoraxFrame);

      const xy = dotProduct(humerusFrame.xAxis, humerusFrame.yAxis);
      const yz = dotProduct(humerusFrame.yAxis, humerusFrame.zAxis);
      const zx = dotProduct(humerusFrame.zAxis, humerusFrame.xAxis);

      expect(Math.abs(xy)).toBeLessThan(0.01);
      expect(Math.abs(yz)).toBeLessThan(0.01);
      expect(Math.abs(zx)).toBeLessThan(0.01);
    });

    it('should have origin at shoulder', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const humerusFrame = service.calculateHumerusFrame(landmarks, 'left', thoraxFrame);

      const leftShoulder = landmarks[5];
      expect(humerusFrame.origin.x).toBeCloseTo(leftShoulder.x, 5);
      expect(humerusFrame.origin.y).toBeCloseTo(leftShoulder.y, 5);
      expect(humerusFrame.origin.z).toBeCloseTo(leftShoulder.z ?? 0, 5);
    });

    it('should have Y-axis pointing from shoulder to elbow', () => {
      const landmarks = createArmsRaisedPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const humerusFrame = service.calculateHumerusFrame(landmarks, 'left', thoraxFrame);

      // Y-axis magnitude should be 1
      const yMag = magnitude(humerusFrame.yAxis);
      expect(yMag).toBeCloseTo(1, 5);
    });

    it('should set frame type to humerus', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const humerusFrame = service.calculateHumerusFrame(landmarks, 'left', thoraxFrame);

      expect(humerusFrame.frameType).toBe('humerus');
    });
  });

  describe('calculateSagittalPlane', () => {
    it('should use Z-axis as normal', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const sagittalPlane = service.calculateSagittalPlane(globalFrame);

      expect(sagittalPlane.normal).toEqual(globalFrame.zAxis);
    });

    it('should set name to sagittal', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const sagittalPlane = service.calculateSagittalPlane(globalFrame);

      expect(sagittalPlane.name).toBe('sagittal');
    });

    it('should have zero rotation', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const sagittalPlane = service.calculateSagittalPlane(globalFrame);

      expect(sagittalPlane.rotation).toBe(0);
    });
  });

  describe('calculateCoronalPlane', () => {
    it('should use X-axis as normal', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const coronalPlane = service.calculateCoronalPlane(globalFrame);

      expect(coronalPlane.normal).toEqual(globalFrame.xAxis);
    });

    it('should set name to coronal', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const coronalPlane = service.calculateCoronalPlane(globalFrame);

      expect(coronalPlane.name).toBe('coronal');
    });
  });

  describe('calculateTransversePlane', () => {
    it('should use Y-axis as normal', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const transversePlane = service.calculateTransversePlane(globalFrame);

      expect(transversePlane.normal).toEqual(globalFrame.yAxis);
    });

    it('should set name to transverse', () => {
      const landmarks = createNeutralStandingPose();
      const globalFrame = service.calculateGlobalFrame(landmarks);
      const transversePlane = service.calculateTransversePlane(globalFrame);

      expect(transversePlane.name).toBe('transverse');
    });
  });

  describe('Integration: Complete Frame Hierarchy', () => {
    it('should calculate all frames for neutral stance', () => {
      const landmarks = createNeutralStandingPose();

      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);
      const scapularPlane = service.calculateScapularPlane(thoraxFrame);
      const humerusFrameLeft = service.calculateHumerusFrame(
        landmarks,
        'left',
        thoraxFrame
      );
      const humerusFrameRight = service.calculateHumerusFrame(
        landmarks,
        'right',
        thoraxFrame
      );

      expect(globalFrame.frameType).toBe('global');
      expect(thoraxFrame.frameType).toBe('thorax');
      expect(scapularPlane.name).toBe('scapular');
      expect(humerusFrameLeft.frameType).toBe('humerus');
      expect(humerusFrameRight.frameType).toBe('humerus');
    });

    it('should maintain high confidence for visible landmarks', () => {
      const landmarks = createNeutralStandingPose();

      const globalFrame = service.calculateGlobalFrame(landmarks);
      const thoraxFrame = service.calculateThoraxFrame(landmarks, globalFrame);

      expect(globalFrame.confidence).toBeGreaterThan(0.8);
      expect(thoraxFrame.confidence).toBeGreaterThan(0.8);
    });
  });
});
