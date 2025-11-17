/**
 * Pose Utilities Test Suite
 *
 * Comprehensive tests for pose transformation and analysis utilities:
 * - Confidence calculation
 * - Landmark visibility checks
 * - Distance calculations
 * - Pose normalization
 * - Stability detection
 * - Bounding box calculation
 * - Pose mirroring
 * - Camera orientation detection
 */

import {
  calculateConfidenceScore,
  areKeyLandmarksVisible,
  calculateDistance,
  normalizePose,
  isPoseStable,
  getPoseBoundingBox,
  mirrorPose,
  isFacingCamera,
} from '../poseUtils';
import { PoseLandmark } from '../../types/pose';

describe('Pose Utils', () => {
  // Helper function to create mock landmarks
  const createMockLandmark = (
    x: number,
    y: number,
    z: number = 0,
    visibility: number = 0.9,
    index: number = 0,
    name: string = 'test'
  ): PoseLandmark => ({
    x,
    y,
    z,
    visibility,
    index,
    name,
  });

  // Helper to create MoveNet-17 skeleton
  const createMoveNetSkeleton = (): PoseLandmark[] => [
    createMockLandmark(0.5, 0.2, 0, 0.9, 0, 'nose'),
    createMockLandmark(0.48, 0.18, 0, 0.9, 1, 'left_eye'),
    createMockLandmark(0.52, 0.18, 0, 0.9, 2, 'right_eye'),
    createMockLandmark(0.46, 0.19, 0, 0.9, 3, 'left_ear'),
    createMockLandmark(0.54, 0.19, 0, 0.9, 4, 'right_ear'),
    createMockLandmark(0.4, 0.3, 0, 0.9, 5, 'left_shoulder'),
    createMockLandmark(0.6, 0.3, 0, 0.9, 6, 'right_shoulder'),
    createMockLandmark(0.35, 0.4, 0, 0.9, 7, 'left_elbow'),
    createMockLandmark(0.65, 0.4, 0, 0.9, 8, 'right_elbow'),
    createMockLandmark(0.32, 0.5, 0, 0.9, 9, 'left_wrist'),
    createMockLandmark(0.68, 0.5, 0, 0.9, 10, 'right_wrist'),
    createMockLandmark(0.42, 0.6, 0, 0.9, 11, 'left_hip'),
    createMockLandmark(0.58, 0.6, 0, 0.9, 12, 'right_hip'),
    createMockLandmark(0.41, 0.75, 0, 0.9, 13, 'left_knee'),
    createMockLandmark(0.59, 0.75, 0, 0.9, 14, 'right_knee'),
    createMockLandmark(0.4, 0.9, 0, 0.9, 15, 'left_ankle'),
    createMockLandmark(0.6, 0.9, 0, 0.9, 16, 'right_ankle'),
  ];

  describe('calculateConfidenceScore', () => {
    it('should calculate average visibility from landmarks', () => {
      const landmarks = [
        createMockLandmark(0, 0, 0, 1.0),
        createMockLandmark(0, 0, 0, 0.8),
        createMockLandmark(0, 0, 0, 0.6),
      ];

      const score = calculateConfidenceScore(landmarks);

      // (1.0 + 0.8 + 0.6) / 3 = 0.8
      expect(score).toBeCloseTo(0.8, 2);
    });

    it('should return 0 for empty array', () => {
      const score = calculateConfidenceScore([]);

      expect(score).toBe(0);
    });

    it('should return 0 for null input', () => {
      const score = calculateConfidenceScore(null);

      expect(score).toBe(0);
    });

    it('should handle landmarks without visibility', () => {
      const landmarks = [
        { x: 0.5, y: 0.5, z: 0 }, // No visibility field
      ];

      const score = calculateConfidenceScore(landmarks);

      expect(score).toBe(0);
    });

    it('should handle mixed visibility values', () => {
      const landmarks = [
        createMockLandmark(0, 0, 0, 1.0),
        createMockLandmark(0, 0, 0, 0.0), // Zero visibility
        createMockLandmark(0, 0, 0, 0.5),
      ];

      const score = calculateConfidenceScore(landmarks);

      expect(score).toBeCloseTo(0.5, 2);
    });
  });

  describe('areKeyLandmarksVisible', () => {
    it('should return true when all required landmarks visible', () => {
      const landmarks = createMoveNetSkeleton();

      const result = areKeyLandmarksVisible(landmarks, [5, 6, 7, 8], 0.5);

      expect(result).toBe(true);
    });

    it('should return false when one landmark below threshold', () => {
      const landmarks = createMoveNetSkeleton();
      landmarks[5].visibility = 0.3; // Below 0.5 threshold

      const result = areKeyLandmarksVisible(landmarks, [5, 6], 0.5);

      expect(result).toBe(false);
    });

    it('should return false when landmark missing', () => {
      const landmarks: PoseLandmark[] = [];

      const result = areKeyLandmarksVisible(landmarks, [5, 6], 0.5);

      expect(result).toBe(false);
    });

    it('should use custom visibility threshold', () => {
      const landmarks = createMoveNetSkeleton();
      landmarks[5].visibility = 0.7;

      // Should pass with 0.5 threshold
      expect(areKeyLandmarksVisible(landmarks, [5], 0.5)).toBe(true);

      // Should fail with 0.8 threshold
      expect(areKeyLandmarksVisible(landmarks, [5], 0.8)).toBe(false);
    });

    it('should handle empty required landmarks', () => {
      const landmarks = createMoveNetSkeleton();

      const result = areKeyLandmarksVisible(landmarks, [], 0.5);

      expect(result).toBe(true); // Vacuous truth
    });
  });

  describe('calculateDistance', () => {
    it('should calculate 2D distance correctly', () => {
      const landmark1 = createMockLandmark(0, 0);
      const landmark2 = createMockLandmark(3, 4);

      const distance = calculateDistance(landmark1, landmark2);

      // 3-4-5 triangle
      expect(distance).toBeCloseTo(5, 2);
    });

    it('should calculate 3D distance correctly', () => {
      const landmark1 = createMockLandmark(0, 0, 0);
      const landmark2 = createMockLandmark(1, 1, 1);

      const distance = calculateDistance(landmark1, landmark2);

      // sqrt(1^2 + 1^2 + 1^2) = sqrt(3)
      expect(distance).toBeCloseTo(Math.sqrt(3), 2);
    });

    it('should handle zero distance', () => {
      const landmark = createMockLandmark(5, 10, 2);

      const distance = calculateDistance(landmark, landmark);

      expect(distance).toBe(0);
    });

    it('should handle missing z coordinates', () => {
      const landmark1 = { x: 0, y: 0, visibility: 0.9, index: 0, name: 'test' };
      const landmark2 = { x: 3, y: 4, visibility: 0.9, index: 1, name: 'test' };

      const distance = calculateDistance(landmark1 as any, landmark2 as any);

      expect(distance).toBeCloseTo(5, 2);
    });

    it('should handle negative coordinates', () => {
      const landmark1 = createMockLandmark(-3, -4, -5);
      const landmark2 = createMockLandmark(0, 0, 0);

      const distance = calculateDistance(landmark1, landmark2);

      expect(distance).toBeCloseTo(Math.sqrt(50), 2);
    });
  });

  describe('normalizePose', () => {
    it('should normalize pose based on shoulder distance', () => {
      const landmarks = createMoveNetSkeleton();

      const normalized = normalizePose(landmarks);

      // After normalization, center should be at (0, 0)
      const centerX = (normalized[5].x + normalized[6].x) / 2;
      const centerY = (normalized[5].y + normalized[6].y) / 2;

      expect(centerX).toBeCloseTo(0, 2);
      expect(centerY).toBeCloseTo(0, 2);

      // Shoulder distance should be normalized to 1.0
      const shoulderDist = calculateDistance(normalized[5], normalized[6]);
      expect(shoulderDist).toBeCloseTo(1.0, 2);
    });

    it('should return original landmarks when shoulders missing', () => {
      const landmarks = [
        createMockLandmark(0, 0, 0, 0.9, 0, 'nose'),
        createMockLandmark(1, 1, 0, 0.9, 1, 'left_eye'),
      ];

      const normalized = normalizePose(landmarks);

      expect(normalized).toEqual(landmarks);
    });

    it('should return original landmarks when shoulder distance is zero', () => {
      const landmarks = createMoveNetSkeleton();
      // Place shoulders at same point
      landmarks[5] = createMockLandmark(0.5, 0.3, 0, 0.9, 5, 'left_shoulder');
      landmarks[6] = createMockLandmark(0.5, 0.3, 0, 0.9, 6, 'right_shoulder');

      const normalized = normalizePose(landmarks);

      expect(normalized).toEqual(landmarks);
    });

    it('should scale all landmarks proportionally', () => {
      const landmarks = createMoveNetSkeleton();
      const originalShoulderDist = calculateDistance(landmarks[5], landmarks[6]);
      const originalElbowDist = calculateDistance(landmarks[7], landmarks[9]);

      const normalized = normalizePose(landmarks);
      const normalizedElbowDist = calculateDistance(normalized[7], normalized[9]);

      // Elbow distance should be scaled by same factor
      const expectedNormalizedDist = originalElbowDist / originalShoulderDist;
      expect(normalizedElbowDist).toBeCloseTo(expectedNormalizedDist, 2);
    });

    it('should normalize z coordinates', () => {
      const landmarks = createMoveNetSkeleton();
      landmarks[0].z = 0.5;

      const normalized = normalizePose(landmarks);

      expect(normalized[0].z).not.toBe(0.5); // Should be scaled
    });
  });

  describe('isPoseStable', () => {
    it('should return true for nearly identical poses', () => {
      const pose1 = createMoveNetSkeleton();
      const pose2 = createMoveNetSkeleton();

      const stable = isPoseStable(pose1, pose2, 0.02);

      expect(stable).toBe(true);
    });

    it('should return false for significantly different poses', () => {
      const pose1 = createMoveNetSkeleton();
      const pose2 = createMoveNetSkeleton();

      // Move all landmarks significantly
      pose2.forEach((landmark) => {
        landmark.x += 0.1;
        landmark.y += 0.1;
      });

      const stable = isPoseStable(pose1, pose2, 0.02);

      expect(stable).toBe(false);
    });

    it('should return false when no previous landmarks', () => {
      const pose1 = createMoveNetSkeleton();

      const stable = isPoseStable(pose1, [], 0.02);

      expect(stable).toBe(false);
    });

    it('should use custom threshold', () => {
      const pose1 = createMoveNetSkeleton();
      const pose2 = createMoveNetSkeleton();

      // Small movement across multiple landmarks
      pose2.forEach((landmark, i) => {
        if (i % 2 === 0) {
          landmark.x += 0.01;
        }
      });

      // Should be stable with 0.02 threshold
      expect(isPoseStable(pose1, pose2, 0.02)).toBe(true);

      // Should be unstable with 0.005 threshold (average movement ~0.01 > 0.005)
      expect(isPoseStable(pose1, pose2, 0.008)).toBe(false);
    });

    it('should ignore low visibility landmarks', () => {
      const pose1 = createMoveNetSkeleton();
      const pose2 = createMoveNetSkeleton();

      // Large movement but low visibility
      pose2[0].visibility = 0.3;
      pose2[0].x += 0.5;

      const stable = isPoseStable(pose1, pose2, 0.02);

      // Should still be stable (low visibility landmark ignored)
      expect(stable).toBe(true);
    });

    it('should return false when no valid comparisons', () => {
      const pose1 = createMoveNetSkeleton();
      const pose2 = createMoveNetSkeleton();

      // Set all to low visibility
      pose1.forEach((l) => (l.visibility = 0.3));
      pose2.forEach((l) => (l.visibility = 0.3));

      const stable = isPoseStable(pose1, pose2, 0.02);

      expect(stable).toBe(false);
    });
  });

  describe('getPoseBoundingBox', () => {
    it('should calculate bounding box for visible landmarks', () => {
      const landmarks = [
        createMockLandmark(0.2, 0.3, 0, 0.9),
        createMockLandmark(0.8, 0.7, 0, 0.9),
        createMockLandmark(0.5, 0.5, 0, 0.9),
      ];

      const bbox = getPoseBoundingBox(landmarks);

      expect(bbox?.x).toBeCloseTo(0.2, 2);
      expect(bbox?.y).toBeCloseTo(0.3, 2);
      expect(bbox?.width).toBeCloseTo(0.6, 2); // 0.8 - 0.2
      expect(bbox?.height).toBeCloseTo(0.4, 2); // 0.7 - 0.3
    });

    it('should exclude low visibility landmarks', () => {
      const landmarks = [
        createMockLandmark(0.2, 0.3, 0, 0.9),
        createMockLandmark(0.8, 0.7, 0, 0.9),
        createMockLandmark(1.0, 1.0, 0, 0.3), // Low visibility - should be excluded
      ];

      const bbox = getPoseBoundingBox(landmarks);

      // Should not include the (1.0, 1.0) landmark
      expect(bbox?.width).toBeCloseTo(0.6, 2);
      expect(bbox?.height).toBeCloseTo(0.4, 2);
    });

    it('should return null for no visible landmarks', () => {
      const landmarks = [createMockLandmark(0.5, 0.5, 0, 0.3)]; // Low visibility

      const bbox = getPoseBoundingBox(landmarks);

      expect(bbox).toBeNull();
    });

    it('should handle single visible landmark', () => {
      const landmarks = [createMockLandmark(0.5, 0.5, 0, 0.9)];

      const bbox = getPoseBoundingBox(landmarks);

      expect(bbox).toEqual({
        x: 0.5,
        y: 0.5,
        width: 0,
        height: 0,
      });
    });

    it('should handle landmarks at edges', () => {
      const landmarks = [
        createMockLandmark(0, 0, 0, 0.9),
        createMockLandmark(1, 1, 0, 0.9),
      ];

      const bbox = getPoseBoundingBox(landmarks);

      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });
    });
  });

  describe('mirrorPose', () => {
    it('should mirror x coordinates', () => {
      const landmarks = [createMockLandmark(0.2, 0.5), createMockLandmark(0.8, 0.5)];

      const mirrored = mirrorPose(landmarks);

      expect(mirrored[0].x).toBeCloseTo(0.8, 2); // 1 - 0.2
      expect(mirrored[1].x).toBeCloseTo(0.2, 2); // 1 - 0.8
    });

    it('should preserve y and z coordinates', () => {
      const landmarks = [createMockLandmark(0.5, 0.6, 0.7)];

      const mirrored = mirrorPose(landmarks);

      expect(mirrored[0].y).toBe(0.6);
      expect(mirrored[0].z).toBe(0.7);
    });

    it('should preserve visibility', () => {
      const landmarks = [createMockLandmark(0.5, 0.5, 0, 0.75)];

      const mirrored = mirrorPose(landmarks);

      expect(mirrored[0].visibility).toBe(0.75);
    });

    it('should handle center point', () => {
      const landmarks = [createMockLandmark(0.5, 0.5)];

      const mirrored = mirrorPose(landmarks);

      expect(mirrored[0].x).toBeCloseTo(0.5, 2);
    });

    it('should handle edge cases (0 and 1)', () => {
      const landmarks = [createMockLandmark(0, 0.5), createMockLandmark(1, 0.5)];

      const mirrored = mirrorPose(landmarks);

      expect(mirrored[0].x).toBe(1);
      expect(mirrored[1].x).toBe(0);
    });
  });

  describe('isFacingCamera', () => {
    it('should return true for frontal pose', () => {
      const landmarks = createMoveNetSkeleton(); // Default is frontal

      const facing = isFacingCamera(landmarks);

      expect(facing).toBe(true);
    });

    it('should return false for tilted pose', () => {
      const landmarks = createMoveNetSkeleton();

      // Tilt shoulders significantly
      landmarks[5].y = 0.2; // Left shoulder higher
      landmarks[6].y = 0.4; // Right shoulder lower

      const facing = isFacingCamera(landmarks);

      expect(facing).toBe(false);
    });

    it('should return false when shoulders missing', () => {
      const landmarks = createMoveNetSkeleton();
      landmarks[5] = null as any;

      const facing = isFacingCamera(landmarks);

      expect(facing).toBe(false);
    });

    it('should return false when hips missing', () => {
      const landmarks = createMoveNetSkeleton();
      landmarks[11] = null as any;

      const facing = isFacingCamera(landmarks);

      expect(facing).toBe(false);
    });

    it('should handle slight deviation', () => {
      const landmarks = createMoveNetSkeleton();

      // Small tilt (within 10% tolerance)
      landmarks[5].y = 0.3;
      landmarks[6].y = 0.31; // 0.01 difference

      const facing = isFacingCamera(landmarks);

      expect(facing).toBe(true);
    });

    it('should return false for side view', () => {
      const landmarks = createMoveNetSkeleton();

      // Shoulders at very different y positions (side view)
      landmarks[5].y = 0.3;
      landmarks[6].y = 0.5;

      const facing = isFacingCamera(landmarks);

      expect(facing).toBe(false);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle empty landmark arrays consistently', () => {
      expect(calculateConfidenceScore([])).toBe(0);
      expect(getPoseBoundingBox([])).toBeNull();
      expect(mirrorPose([])).toEqual([]);
    });

    it('should handle normalization then mirroring', () => {
      const landmarks = createMoveNetSkeleton();

      const normalized = normalizePose(landmarks);
      const mirrored = mirrorPose(normalized);

      // Should not crash
      expect(mirrored).toHaveLength(17);
    });

    it('should handle stability check with normalized poses', () => {
      const pose1 = createMoveNetSkeleton();
      const pose2 = createMoveNetSkeleton();

      const norm1 = normalizePose(pose1);
      const norm2 = normalizePose(pose2);

      const stable = isPoseStable(norm1, norm2, 0.02);

      expect(stable).toBe(true);
    });

    it('should calculate confidence from full MoveNet skeleton', () => {
      const landmarks = createMoveNetSkeleton();

      const confidence = calculateConfidenceScore(landmarks);

      expect(confidence).toBeCloseTo(0.9, 1);
    });

    it('should detect key landmarks in typical exercise pose', () => {
      const landmarks = createMoveNetSkeleton();

      // Bicep curl landmarks: shoulders, elbows, wrists
      const visible = areKeyLandmarksVisible(landmarks, [5, 6, 7, 8, 9, 10], 0.5);

      expect(visible).toBe(true);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle large number of landmarks efficiently', () => {
      const landmarks = Array(100)
        .fill(null)
        .map((_, i) =>
          createMockLandmark(
            Math.random(),
            Math.random(),
            Math.random(),
            0.9,
            i,
            `landmark_${i}`
          )
        );

      const start = performance.now();
      calculateConfidenceScore(landmarks);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Should be very fast
    });

    it('should handle repeated normalization without drift', () => {
      let landmarks = createMoveNetSkeleton();

      // Normalize 100 times
      for (let i = 0; i < 100; i++) {
        landmarks = normalizePose(landmarks);
      }

      // Shoulder distance should still be 1.0 (no accumulated error)
      const shoulderDist = calculateDistance(landmarks[5], landmarks[6]);
      expect(shoulderDist).toBeCloseTo(1.0, 1);
    });
  });
});
