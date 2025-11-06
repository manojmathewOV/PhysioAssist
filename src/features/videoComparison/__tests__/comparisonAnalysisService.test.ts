import { ComparisonAnalysisService } from '../services/comparisonAnalysisService';
import { PoseFrame, PoseLandmark } from '../types/videoComparison.types';

// Helper to create mock pose data
const createMockPoseFrame = (
  timestamp: number,
  angleOverrides?: Record<string, number>
): PoseFrame => {
  const landmarks: PoseLandmark[] = Array(33)
    .fill(null)
    .map((_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      visibility: 0.9,
    }));

  return {
    timestamp,
    landmarks,
    visibility: landmarks.map((l) => l.visibility || 0),
    angles: angleOverrides || {
      leftElbow: 90,
      rightElbow: 90,
      leftShoulder: 45,
      rightShoulder: 45,
      leftKnee: 170,
      rightKnee: 170,
    },
  };
};

describe('ComparisonAnalysisService', () => {
  describe('analyzeMovement', () => {
    it('should analyze movement and provide overall score', () => {
      const referencePoses = [
        createMockPoseFrame(0, { leftElbow: 90, rightElbow: 90 }),
        createMockPoseFrame(0.033, { leftElbow: 45, rightElbow: 45 }),
        createMockPoseFrame(0.066, { leftElbow: 90, rightElbow: 90 }),
      ];

      const userPoses = [
        createMockPoseFrame(0, { leftElbow: 85, rightElbow: 95 }),
        createMockPoseFrame(0.033, { leftElbow: 40, rightElbow: 50 }),
        createMockPoseFrame(0.066, { leftElbow: 85, rightElbow: 95 }),
      ];

      const result = ComparisonAnalysisService.analyzeMovement(
        referencePoses,
        userPoses,
        'bicep_curl'
      );

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.angleDeviations).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should detect angle deviations', () => {
      const referencePoses = [createMockPoseFrame(0, { leftElbow: 90 })];
      const userPoses = [createMockPoseFrame(0, { leftElbow: 110 })];

      const result = ComparisonAnalysisService.analyzeMovement(
        referencePoses,
        userPoses,
        'bicep_curl'
      );

      const elbowDeviation = result.angleDeviations.find((d) => d.joint === 'elbow');
      expect(elbowDeviation).toBeDefined();
      expect(elbowDeviation?.deviation).toBeCloseTo(20, 0);
      expect(elbowDeviation?.severity).toBe('critical');
    });

    it('should categorize deviation severity correctly', () => {
      const testCases = [
        { deviation: 3, expectedSeverity: 'good' },
        { deviation: 10, expectedSeverity: 'warning' },
        { deviation: 20, expectedSeverity: 'critical' },
      ];

      testCases.forEach(({ deviation, expectedSeverity }) => {
        const referencePoses = [createMockPoseFrame(0, { leftElbow: 90 })];
        const userPoses = [createMockPoseFrame(0, { leftElbow: 90 + deviation })];

        const result = ComparisonAnalysisService.analyzeMovement(
          referencePoses,
          userPoses,
          'bicep_curl'
        );

        const elbowDeviation = result.angleDeviations.find((d) => d.joint === 'elbow');
        expect(elbowDeviation?.severity).toBe(expectedSeverity);
      });
    });

    it('should analyze temporal alignment', () => {
      // Reference: slower movement
      const referencePoses = Array(10)
        .fill(null)
        .map((_, i) => createMockPoseFrame(i * 0.1, { leftElbow: 90 + i * 5 }));

      // User: faster movement (completes in half the time)
      const userPoses = Array(5)
        .fill(null)
        .map((_, i) => createMockPoseFrame(i * 0.1, { leftElbow: 90 + i * 10 }));

      const result = ComparisonAnalysisService.analyzeMovement(
        referencePoses,
        userPoses,
        'bicep_curl'
      );

      expect(result.temporalAlignment).toBeDefined();
      expect(result.temporalAlignment.speedRatio).toBeGreaterThan(1.5);
    });

    it('should generate appropriate recommendations', () => {
      const referencePoses = [createMockPoseFrame(0, { leftElbow: 90, rightElbow: 90 })];
      const userPoses = [createMockPoseFrame(0, { leftElbow: 110, rightElbow: 85 })];

      const result = ComparisonAnalysisService.analyzeMovement(
        referencePoses,
        userPoses,
        'bicep_curl'
      );

      expect(result.recommendations.length).toBeGreaterThan(0);

      const angleRec = result.recommendations.find((r) => r.type === 'angle');
      expect(angleRec).toBeDefined();
      expect(angleRec?.priority).toBe('high');
      expect(angleRec?.message).toContain('elbow');
    });

    it('should handle empty pose arrays gracefully', () => {
      const result = ComparisonAnalysisService.analyzeMovement([], [], 'bicep_curl');

      expect(result.overallScore).toBe(0);
      expect(result.angleDeviations).toEqual([]);
      expect(result.recommendations).toEqual([]);
    });
  });

  describe('performance analysis', () => {
    it('should complete analysis within performance threshold', () => {
      const largePoseSet = Array(300)
        .fill(null)
        .map((_, i) => createMockPoseFrame(i * 0.033));

      const startTime = Date.now();

      ComparisonAnalysisService.analyzeMovement(largePoseSet, largePoseSet, 'bicep_curl');

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('exercise-specific analysis', () => {
    it('should apply exercise-specific rules for squats', () => {
      const referencePoses = [createMockPoseFrame(0, { leftKnee: 90, rightKnee: 90 })];
      const userPoses = [createMockPoseFrame(0, { leftKnee: 120, rightKnee: 120 })];

      const result = ComparisonAnalysisService.analyzeMovement(
        referencePoses,
        userPoses,
        'squat'
      );

      const kneeRec = result.recommendations.find(
        (r) =>
          r.message.toLowerCase().includes('knee') ||
          r.message.toLowerCase().includes('deeper')
      );
      expect(kneeRec).toBeDefined();
    });

    it('should detect incomplete range of motion', () => {
      // Full range: 180° to 45°
      const referencePoses = [
        createMockPoseFrame(0, { leftElbow: 180 }),
        createMockPoseFrame(1, { leftElbow: 45 }),
        createMockPoseFrame(2, { leftElbow: 180 }),
      ];

      // Partial range: 180° to 90° only
      const userPoses = [
        createMockPoseFrame(0, { leftElbow: 180 }),
        createMockPoseFrame(1, { leftElbow: 90 }),
        createMockPoseFrame(2, { leftElbow: 180 }),
      ];

      const result = ComparisonAnalysisService.analyzeMovement(
        referencePoses,
        userPoses,
        'bicep_curl'
      );

      const romRec = result.recommendations.find(
        (r) =>
          r.message.toLowerCase().includes('range') ||
          r.message.toLowerCase().includes('full')
      );
      expect(romRec).toBeDefined();
    });
  });
});
