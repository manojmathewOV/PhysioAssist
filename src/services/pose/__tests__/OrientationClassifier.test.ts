import { OrientationClassifier } from '../OrientationClassifier';
import { PoseLandmark } from '../../../types/pose';

describe('OrientationClassifier - Gate 9B.3', () => {
  let classifier: OrientationClassifier;

  beforeEach(() => {
    classifier = new OrientationClassifier(5);
  });

  /**
   * Helper to create mock landmarks
   */
  function createLandmarks(overrides: Partial<PoseLandmark>[] = []): PoseLandmark[] {
    const base: PoseLandmark[] = Array.from({ length: 17 }, (_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
      index: i,
      name: `landmark_${i}`,
    }));

    overrides.forEach((override) => {
      const index = override.index ?? 0;
      base[index] = { ...base[index], ...override };
    });

    return base;
  }

  describe('Frontal View Detection', () => {
    it('should detect frontal view with wide shoulders', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 }, // left_shoulder (wide)
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 }, // right_shoulder (wide)
        { index: 11, x: 0.35, y: 0.6, visibility: 0.9 }, // left_hip
        { index: 12, x: 0.65, y: 0.6, visibility: 0.9 }, // right_hip
        { index: 0, x: 0.5, y: 0.3, visibility: 0.9 }, // nose
        { index: 1, x: 0.45, y: 0.3, visibility: 0.9 }, // left_eye
        { index: 2, x: 0.55, y: 0.3, visibility: 0.9 }, // right_eye
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('frontal');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should have higher confidence with symmetric visibility', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 }, // left_shoulder
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 }, // right_shoulder (symmetric)
        { index: 11, x: 0.35, y: 0.6, visibility: 0.9 }, // left_hip
        { index: 12, x: 0.65, y: 0.6, visibility: 0.9 }, // right_hip (symmetric)
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('frontal');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect frontal with visible face landmarks', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 },
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
        { index: 0, x: 0.5, y: 0.3, visibility: 0.95 }, // nose visible
        { index: 1, x: 0.45, y: 0.3, visibility: 0.95 }, // left_eye visible
        { index: 2, x: 0.55, y: 0.3, visibility: 0.95 }, // right_eye visible
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('frontal');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect frontal with wide hips', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.35, y: 0.4, visibility: 0.9 },
        { index: 6, x: 0.65, y: 0.4, visibility: 0.9 },
        { index: 11, x: 0.3, y: 0.6, visibility: 0.9 }, // wide hips
        { index: 12, x: 0.7, y: 0.6, visibility: 0.9 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('frontal');
    });

    it('should have very high confidence for perfect frontal pose', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.25, y: 0.4, visibility: 0.95 }, // very wide shoulders
        { index: 6, x: 0.75, y: 0.4, visibility: 0.95 },
        { index: 11, x: 0.3, y: 0.6, visibility: 0.95 },
        { index: 12, x: 0.7, y: 0.6, visibility: 0.95 },
        { index: 0, x: 0.5, y: 0.3, visibility: 0.95 }, // all face visible
        { index: 1, x: 0.45, y: 0.3, visibility: 0.95 },
        { index: 2, x: 0.55, y: 0.3, visibility: 0.95 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('frontal');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Sagittal View Detection', () => {
    it('should detect sagittal view with narrow shoulders', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.48, y: 0.4, visibility: 0.9 }, // narrow shoulders
        { index: 6, x: 0.52, y: 0.4, visibility: 0.3 }, // right less visible
        { index: 11, x: 0.49, y: 0.6, visibility: 0.9 },
        { index: 12, x: 0.51, y: 0.6, visibility: 0.3 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('sagittal');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect sagittal with asymmetric visibility', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.48, y: 0.4, visibility: 0.95 }, // left visible
        { index: 6, x: 0.52, y: 0.4, visibility: 0.2 }, // right hidden
        { index: 11, x: 0.49, y: 0.6, visibility: 0.9 },
        { index: 12, x: 0.51, y: 0.6, visibility: 0.2 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('sagittal');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect sagittal with depth cues', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.48, y: 0.4, z: 0.0, visibility: 0.9 }, // front shoulder
        { index: 6, x: 0.52, y: 0.4, z: 0.3, visibility: 0.5 }, // back shoulder (z-diff)
        { index: 11, x: 0.49, y: 0.6, z: 0.05, visibility: 0.9 },
        { index: 12, x: 0.51, y: 0.6, z: 0.25, visibility: 0.5 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('sagittal');
    });

    it('should detect sagittal with very narrow profile', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.495, y: 0.4, visibility: 0.95 }, // very narrow
        { index: 6, x: 0.505, y: 0.4, visibility: 0.3 },
        { index: 11, x: 0.495, y: 0.6, visibility: 0.9 },
        { index: 12, x: 0.505, y: 0.6, visibility: 0.3 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('sagittal');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should have high confidence for clear sagittal pose', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.49, y: 0.4, z: 0.0, visibility: 0.95 },
        { index: 6, x: 0.51, y: 0.4, z: 0.3, visibility: 0.2 }, // hidden + depth
        { index: 11, x: 0.49, y: 0.6, z: 0.05, visibility: 0.9 },
        { index: 12, x: 0.51, y: 0.6, z: 0.25, visibility: 0.2 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('sagittal');
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Posterior View Detection', () => {
    it('should detect posterior view with no face visibility', () => {
      const landmarks = createLandmarks([
        { index: 0, x: 0.5, y: 0.3, visibility: 0.1 }, // nose not visible
        { index: 1, x: 0.45, y: 0.3, visibility: 0.1 }, // left_eye not visible
        { index: 2, x: 0.55, y: 0.3, visibility: 0.1 }, // right_eye not visible
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 }, // wide shoulders
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
        { index: 11, x: 0.35, y: 0.6, visibility: 0.9 },
        { index: 12, x: 0.65, y: 0.6, visibility: 0.9 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('posterior');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect posterior with ears more visible than eyes', () => {
      const landmarks = createLandmarks([
        { index: 0, x: 0.5, y: 0.3, visibility: 0.1 }, // nose not visible
        { index: 1, x: 0.45, y: 0.3, visibility: 0.2 }, // eyes low visibility
        { index: 2, x: 0.55, y: 0.3, visibility: 0.2 },
        { index: 3, x: 0.4, y: 0.3, visibility: 0.9 }, // ears high visibility
        { index: 4, x: 0.6, y: 0.3, visibility: 0.9 },
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 }, // wide shoulders
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('posterior');
    });

    it('should detect posterior with wide shoulders but no face', () => {
      const landmarks = createLandmarks([
        { index: 0, x: 0.5, y: 0.3, visibility: 0.0 }, // no face
        { index: 1, x: 0.45, y: 0.3, visibility: 0.0 },
        { index: 2, x: 0.55, y: 0.3, visibility: 0.0 },
        { index: 5, x: 0.25, y: 0.4, visibility: 0.9 }, // very wide shoulders
        { index: 6, x: 0.75, y: 0.4, visibility: 0.9 },
        { index: 11, x: 0.3, y: 0.6, visibility: 0.9 },
        { index: 12, x: 0.7, y: 0.6, visibility: 0.9 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('posterior');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect posterior with partial face occlusion', () => {
      const landmarks = createLandmarks([
        { index: 0, x: 0.5, y: 0.3, visibility: 0.1 }, // minimal nose visibility
        { index: 1, x: 0.45, y: 0.3, visibility: 0.1 },
        { index: 2, x: 0.55, y: 0.3, visibility: 0.1 },
        { index: 3, x: 0.4, y: 0.3, visibility: 0.8 }, // ears visible
        { index: 4, x: 0.6, y: 0.3, visibility: 0.8 },
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 }, // wide shoulders
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('posterior');
    });

    it('should have high confidence for clear posterior pose', () => {
      const landmarks = createLandmarks([
        { index: 0, x: 0.5, y: 0.3, visibility: 0.0 }, // no face at all
        { index: 1, x: 0.45, y: 0.3, visibility: 0.0 },
        { index: 2, x: 0.55, y: 0.3, visibility: 0.0 },
        { index: 3, x: 0.4, y: 0.3, visibility: 0.95 }, // ears visible
        { index: 4, x: 0.6, y: 0.3, visibility: 0.95 },
        { index: 5, x: 0.25, y: 0.4, visibility: 0.95 }, // wide, visible shoulders
        { index: 6, x: 0.75, y: 0.4, visibility: 0.95 },
        { index: 11, x: 0.3, y: 0.6, visibility: 0.95 }, // wide hips
        { index: 12, x: 0.7, y: 0.6, visibility: 0.95 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.orientation).toBe('posterior');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Confidence Scoring', () => {
    it('should return confidence in [0, 1] range', () => {
      const landmarks = createLandmarks();
      const result = classifier.classify(landmarks);

      expect(result.confidence).toBeGreaterThanOrEqual(0.0);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should have low confidence for ambiguous pose', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.4, y: 0.4, visibility: 0.5 }, // medium shoulder width
        { index: 6, x: 0.6, y: 0.4, visibility: 0.5 }, // medium visibility
        { index: 11, x: 0.42, y: 0.6, visibility: 0.5 },
        { index: 12, x: 0.58, y: 0.6, visibility: 0.5 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should have higher confidence for clear pose', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.25, y: 0.4, visibility: 0.95 }, // clear frontal
        { index: 6, x: 0.75, y: 0.4, visibility: 0.95 },
        { index: 0, x: 0.5, y: 0.3, visibility: 0.95 },
        { index: 1, x: 0.45, y: 0.3, visibility: 0.95 },
        { index: 2, x: 0.55, y: 0.3, visibility: 0.95 },
      ]);

      const result = classifier.classify(landmarks);

      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Temporal Smoothing', () => {
    it('should smooth orientation over multiple frames', () => {
      const frontalLandmarks = createLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 },
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
      ]);

      // Add 5 frontal frames
      for (let i = 0; i < 5; i++) {
        classifier.classifyWithHistory(frontalLandmarks);
      }

      const result = classifier.classifyWithHistory(frontalLandmarks);

      expect(result.orientation).toBe('frontal');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should prevent rapid flipping with noisy data', () => {
      const frontalLandmarks = createLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 },
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
      ]);

      const sagittalLandmarks = createLandmarks([
        { index: 5, x: 0.48, y: 0.4, visibility: 0.9 },
        { index: 6, x: 0.52, y: 0.4, visibility: 0.3 },
      ]);

      // Build frontal history
      for (let i = 0; i < 4; i++) {
        classifier.classifyWithHistory(frontalLandmarks);
      }

      // Single noisy sagittal frame
      const result = classifier.classifyWithHistory(sagittalLandmarks);

      // Should still be frontal due to history
      expect(result.orientation).toBe('frontal');
    });

    it('should adapt to consistent orientation change', () => {
      const frontalLandmarks = createLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 },
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
      ]);

      const sagittalLandmarks = createLandmarks([
        { index: 5, x: 0.48, y: 0.4, visibility: 0.95 },
        { index: 6, x: 0.52, y: 0.4, visibility: 0.2 },
      ]);

      // Start with frontal
      for (let i = 0; i < 3; i++) {
        classifier.classifyWithHistory(frontalLandmarks);
      }

      // Switch to sagittal consistently
      let result;
      for (let i = 0; i < 5; i++) {
        result = classifier.classifyWithHistory(sagittalLandmarks);
      }

      // Should eventually switch to sagittal
      expect(result?.orientation).toBe('sagittal');
    });

    it('should maintain history window size', () => {
      const landmarks = createLandmarks();

      for (let i = 0; i < 10; i++) {
        classifier.classifyWithHistory(landmarks);
      }

      expect(classifier.getHistoryLength()).toBeLessThanOrEqual(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle insufficient landmarks gracefully', () => {
      const landmarks = createLandmarks().slice(0, 10); // Only 10 landmarks

      const result = classifier.classify(landmarks);

      expect(result).toBeDefined();
      expect(result.orientation).toBe('frontal'); // Default fallback
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle occluded shoulders', () => {
      const landmarks = createLandmarks([
        { index: 5, x: 0.3, y: 0.4, visibility: 0.1 }, // left shoulder occluded
        { index: 6, x: 0.7, y: 0.4, visibility: 0.1 }, // right shoulder occluded
        { index: 0, x: 0.5, y: 0.3, visibility: 0.9 }, // face visible
      ]);

      const result = classifier.classify(landmarks);

      expect(result).toBeDefined();
      // With shoulders occluded, we still have face landmarks giving some confidence
      expect(result.confidence).toBeGreaterThan(0.0);
    });

    it('should handle occluded face landmarks', () => {
      const landmarks = createLandmarks([
        { index: 0, x: 0.5, y: 0.3, visibility: 0.0 }, // no face
        { index: 1, x: 0.45, y: 0.3, visibility: 0.0 },
        { index: 2, x: 0.55, y: 0.3, visibility: 0.0 },
        { index: 5, x: 0.3, y: 0.4, visibility: 0.9 }, // shoulders visible
        { index: 6, x: 0.7, y: 0.4, visibility: 0.9 },
      ]);

      const result = classifier.classify(landmarks);

      // Should detect as posterior (no face but wide shoulders)
      expect(result.orientation).toBe('posterior');
    });
  });

  describe('Utility Methods', () => {
    it('should clear history', () => {
      const landmarks = createLandmarks();

      for (let i = 0; i < 5; i++) {
        classifier.classifyWithHistory(landmarks);
      }

      expect(classifier.getHistoryLength()).toBeGreaterThan(0);

      classifier.clearHistory();

      expect(classifier.getHistoryLength()).toBe(0);
    });

    it('should return correct history length', () => {
      const landmarks = createLandmarks();

      expect(classifier.getHistoryLength()).toBe(0);

      classifier.classifyWithHistory(landmarks);
      expect(classifier.getHistoryLength()).toBe(1);

      classifier.classifyWithHistory(landmarks);
      classifier.classifyWithHistory(landmarks);
      expect(classifier.getHistoryLength()).toBe(3);
    });
  });
});
