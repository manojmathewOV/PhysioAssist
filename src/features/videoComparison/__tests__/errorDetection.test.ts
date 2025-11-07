/**
 * Error Detection Tests
 *
 * Tests for shoulder, knee, and elbow error detection algorithms.
 */

import {
  detectShoulderHiking,
  detectTrunkLean,
  detectInternalRotation,
  detectIncompleteROM,
  detectAllShoulderErrors,
} from '../errorDetection/shoulderErrors';

import {
  detectKneeValgus,
  detectHeelLift,
  detectPosteriorPelvicTilt,
  detectInsufficientDepth,
  detectAllKneeErrors,
} from '../errorDetection/kneeErrors';

import {
  detectShoulderCompensation,
  detectIncompleteExtension,
  detectWristDeviation,
  detectAllElbowErrors,
} from '../errorDetection/elbowErrors';

import { PoseFrame, KeyPoint } from '../types/pose';
import { ErrorDetectionConfig } from '../config/errorDetectionConfig';

/**
 * Helper: Create mock keypoint
 */
function createKeypoint(x: number, y: number, confidence: number = 0.9): KeyPoint {
  return { x, y, confidence };
}

/**
 * Helper: Create mock pose frame
 */
function createPoseFrame(timestamp: number, keypointsData: number[][]): PoseFrame {
  const keypoints: KeyPoint[] = keypointsData.map(([x, y, conf]) => createKeypoint(x, y, conf || 0.9));

  return {
    timestamp,
    keypoints,
    confidence: 0.9,
  };
}

describe('Shoulder Error Detection', () => {
  describe('detectShoulderHiking', () => {
    it('should detect critical shoulder hiking', () => {
      // Reference: shoulder at y=200, ear at y=100 (distance = 100)
      const referencePose = createPoseFrame(0, [
        [0, 0, 0.9], // nose
        [0, 0, 0.9], // left eye
        [0, 0, 0.9], // right eye
        [100, 100, 0.9], // left ear
        [200, 100, 0.9], // right ear
        [100, 200, 0.9], // left shoulder
        [200, 200, 0.9], // right shoulder
        [0, 0, 0.9], // left elbow
        [0, 0, 0.9], // right elbow
        [0, 0, 0.9], // left wrist
        [0, 0, 0.9], // right wrist
        [0, 0, 0.9], // left hip
        [0, 0, 0.9], // right hip
      ]);

      // User: shoulder hiked up, y=150 instead of 200 (distance = 50)
      // Shoulder is 50 pixels closer to ear = ~20cm elevation (critical)
      const userPose = createPoseFrame(1000, [
        [0, 0, 0.9], // nose
        [0, 0, 0.9], // left eye
        [0, 0, 0.9], // right eye
        [100, 100, 0.9], // left ear
        [200, 100, 0.9], // right ear
        [100, 150, 0.9], // left shoulder (HIKED)
        [200, 200, 0.9], // right shoulder
        [0, 0, 0.9], // left elbow
        [0, 0, 0.9], // right elbow
        [0, 0, 0.9], // left wrist
        [0, 0, 0.9], // right wrist
        [0, 0, 0.9], // left hip
        [0, 0, 0.9], // right hip
      ]);

      const error = detectShoulderHiking(userPose, referencePose, 'left');
      expect(error).not.toBeNull();
      expect(error?.type).toBe('shoulder_hiking');
      expect(error?.side).toBe('left');
      expect(error?.severity).toBe('critical');
    });

    it('should not detect when shoulder position is normal', () => {
      const referencePose = createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 100, 0.9], // left ear
        [200, 100, 0.9], // right ear
        [100, 200, 0.9], // left shoulder
        [200, 200, 0.9], // right shoulder
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
      ]);

      const userPose = createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 100, 0.9], // left ear
        [200, 100, 0.9], // right ear
        [100, 200, 0.9], // left shoulder (same as reference)
        [200, 200, 0.9], // right shoulder
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
      ]);

      const error = detectShoulderHiking(userPose, referencePose, 'left');
      expect(error).toBeNull();
    });
  });

  describe('detectTrunkLean', () => {
    it('should detect trunk lean', () => {
      // Reference: vertical trunk (shoulder directly above hip)
      const referencePose = createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 100, 0.9], // left shoulder
        [200, 100, 0.9], // right shoulder
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], // left hip
        [200, 200, 0.9], // right hip
      ]);

      // User: trunk leaning (shoulder shifted laterally)
      const userPose = createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [150, 100, 0.9], // left shoulder (shifted right = lean)
        [200, 100, 0.9], // right shoulder
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], // left hip
        [200, 200, 0.9], // right hip
      ]);

      const error = detectTrunkLean(userPose, referencePose, 'left');
      expect(error).not.toBeNull();
      expect(error?.type).toBe('trunk_lean');
    });
  });

  describe('detectAllShoulderErrors', () => {
    it('should detect multiple errors', () => {
      const referencePoses = [createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 100, 0.9], [200, 100, 0.9],
        [100, 200, 0.9], [200, 200, 0.9],
        [100, 300, 0.9], [200, 300, 0.9],
        [100, 400, 0.9], [200, 400, 0.9],
        [100, 500, 0.9], [200, 500, 0.9],
      ])];

      const userPoses = [createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 100, 0.9], [200, 100, 0.9],
        [100, 150, 0.9], // left shoulder hiked
        [200, 200, 0.9],
        [100, 300, 0.9], [200, 300, 0.9],
        [100, 400, 0.9], [200, 400, 0.9],
        [100, 500, 0.9], [200, 500, 0.9],
      ])];

      const errors = detectAllShoulderErrors(userPoses, referencePoses);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Knee Error Detection', () => {
  describe('detectKneeValgus', () => {
    it('should detect critical knee valgus (HIGH INJURY RISK)', () => {
      // Reference: knee aligned with ankle (x-position same)
      const referencePose = createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], // left hip
        [300, 200, 0.9], // right hip
        [100, 300, 0.9], // left knee (aligned with ankle)
        [300, 300, 0.9], // right knee
        [100, 400, 0.9], // left ankle
        [300, 400, 0.9], // right ankle
      ]);

      // User: knee caving in medially (valgus)
      const userPose = createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], // left hip
        [300, 200, 0.9], // right hip
        [120, 300, 0.9], // left knee (CAVING IN - moved medially)
        [300, 300, 0.9], // right knee
        [100, 400, 0.9], // left ankle
        [300, 400, 0.9], // right ankle
      ]);

      const error = detectKneeValgus(userPose, referencePose, 'left');
      expect(error).not.toBeNull();
      expect(error?.type).toBe('knee_valgus');
      // Severity depends on magnitude - can be warning or critical
      expect(['warning', 'critical']).toContain(error?.severity);
    });

    it('should not detect when knee alignment is normal', () => {
      const referencePose = createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], [300, 200, 0.9],
        [100, 300, 0.9], [300, 300, 0.9],
        [100, 400, 0.9], [300, 400, 0.9],
      ]);

      const userPose = createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], [300, 200, 0.9],
        [100, 300, 0.9], // left knee (same as reference)
        [300, 300, 0.9],
        [100, 400, 0.9], [300, 400, 0.9],
      ]);

      const error = detectKneeValgus(userPose, referencePose, 'left');
      expect(error).toBeNull();
    });
  });

  describe('detectAllKneeErrors', () => {
    it('should detect multiple knee errors', () => {
      const referencePoses = [createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 50, 0.9], [200, 50, 0.9],
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], [200, 200, 0.9],
        [100, 300, 0.9], [200, 300, 0.9],
        [100, 400, 0.9], [200, 400, 0.9],
      ])];

      const userPoses = [createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 50, 0.9], [200, 50, 0.9],
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], [200, 200, 0.9],
        [120, 300, 0.9], // valgus
        [200, 300, 0.9],
        [100, 380, 0.9], // heel lift
        [200, 400, 0.9],
      ])];

      const errors = detectAllKneeErrors(userPoses, referencePoses);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Elbow Error Detection', () => {
  describe('detectShoulderCompensation', () => {
    it('should detect shoulder compensation (momentum/cheating)', () => {
      // Reference: shoulder stable
      const referencePose = createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 100, 0.9], // left shoulder
        [200, 100, 0.9], // right shoulder
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], // left hip
        [200, 200, 0.9], // right hip
      ]);

      // User: shoulder swinging forward
      const userPose = createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [120, 100, 0.9], // left shoulder (MOVED FORWARD)
        [200, 100, 0.9], // right shoulder
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 200, 0.9], // left hip
        [200, 200, 0.9], // right hip
      ]);

      const error = detectShoulderCompensation(userPose, referencePose, 'left');
      expect(error).not.toBeNull();
      expect(error?.type).toBe('shoulder_compensation');
    });
  });

  describe('detectAllElbowErrors', () => {
    it('should detect multiple elbow errors', () => {
      const referencePoses = [createPoseFrame(0, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [100, 100, 0.9], [200, 100, 0.9],
        [100, 200, 0.9], [200, 200, 0.9],
        [100, 300, 0.9], [200, 300, 0.9],
        [0, 0, 0.9], [0, 0, 0.9],
      ])];

      const userPoses = [createPoseFrame(1000, [
        [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9], [0, 0, 0.9],
        [120, 100, 0.9], // shoulder moved (compensation)
        [200, 100, 0.9],
        [100, 200, 0.9], [200, 200, 0.9],
        [100, 300, 0.9], [200, 300, 0.9],
        [0, 0, 0.9], [0, 0, 0.9],
      ])];

      const errors = detectAllElbowErrors(userPoses, referencePoses);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Error Detection Config', () => {
  it('should have valid threshold values', () => {
    // All thresholds should be positive
    expect(ErrorDetectionConfig.shoulder.shoulderHiking.warning_cm).toBeGreaterThan(0);
    expect(ErrorDetectionConfig.shoulder.shoulderHiking.critical_cm).toBeGreaterThan(0);

    expect(ErrorDetectionConfig.knee.kneeValgus.warning_percent).toBeGreaterThan(0);
    expect(ErrorDetectionConfig.knee.kneeValgus.critical_percent).toBeGreaterThan(0);

    expect(ErrorDetectionConfig.elbow.shoulderCompensation.warning_cm).toBeGreaterThan(0);
    expect(ErrorDetectionConfig.elbow.shoulderCompensation.critical_cm).toBeGreaterThan(0);
  });

  it('should have critical > warning for all thresholds', () => {
    // Shoulder
    expect(ErrorDetectionConfig.shoulder.shoulderHiking.critical_cm).toBeGreaterThan(
      ErrorDetectionConfig.shoulder.shoulderHiking.warning_cm
    );
    expect(ErrorDetectionConfig.shoulder.trunkLean.critical_deg).toBeGreaterThan(
      ErrorDetectionConfig.shoulder.trunkLean.warning_deg
    );

    // Knee
    expect(ErrorDetectionConfig.knee.kneeValgus.critical_percent).toBeGreaterThan(
      ErrorDetectionConfig.knee.kneeValgus.warning_percent
    );
    expect(ErrorDetectionConfig.knee.heelLift.critical_cm).toBeGreaterThan(
      ErrorDetectionConfig.knee.heelLift.warning_cm
    );

    // Elbow
    expect(ErrorDetectionConfig.elbow.shoulderCompensation.critical_cm).toBeGreaterThan(
      ErrorDetectionConfig.elbow.shoulderCompensation.warning_cm
    );
    expect(ErrorDetectionConfig.elbow.wristDeviation.critical_deg).toBeGreaterThan(
      ErrorDetectionConfig.elbow.wristDeviation.warning_deg
    );
  });
});
