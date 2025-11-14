import { PoseLandmark } from '../../types/pose';

export interface OrientationResult {
  orientation: 'frontal' | 'sagittal' | 'posterior';
  confidence: number;
}

/**
 * Orientation Classifier
 *
 * Classifies subject orientation relative to camera using geometric heuristics.
 * Supports frontal, sagittal, and posterior view detection with temporal smoothing.
 *
 * Heuristics:
 * - Frontal: Wide shoulders/hips, face visible, symmetric landmark visibility
 * - Sagittal: Narrow body profile, asymmetric visibility, depth cues
 * - Posterior: Limited face visibility, visible back landmarks
 *
 * @example
 * const classifier = new OrientationClassifier();
 * const result = classifier.classify(landmarks);
 * console.log(result.orientation); // 'frontal'
 * console.log(result.confidence); // 0.85
 */
export class OrientationClassifier {
  private orientationHistory: OrientationResult[] = [];
  private readonly historyWindow: number;

  constructor(historyWindow: number = 5) {
    this.historyWindow = historyWindow;
  }

  /**
   * Classify orientation from landmarks (no temporal smoothing)
   *
   * @param landmarks - Pose landmarks
   * @returns Orientation and confidence
   */
  public classify(landmarks: PoseLandmark[]): OrientationResult {
    // Check if we have enough landmarks
    if (landmarks.length < 17) {
      return { orientation: 'frontal', confidence: 0.3 };
    }

    const frontalScore = this.calculateFrontalScore(landmarks);
    const sagittalScore = this.calculateSagittalScore(landmarks);
    const posteriorScore = this.calculatePosteriorScore(landmarks);

    // Determine orientation based on highest score
    const scores = [
      { orientation: 'frontal' as const, score: frontalScore },
      { orientation: 'sagittal' as const, score: sagittalScore },
      { orientation: 'posterior' as const, score: posteriorScore },
    ];

    scores.sort((a, b) => b.score - a.score);

    return {
      orientation: scores[0].orientation,
      confidence: Math.min(1.0, Math.max(0.0, scores[0].score)),
    };
  }

  /**
   * Classify orientation with temporal smoothing
   *
   * Uses sliding window to prevent rapid orientation flips.
   *
   * @param landmarks - Pose landmarks
   * @returns Smoothed orientation and confidence
   */
  public classifyWithHistory(landmarks: PoseLandmark[]): OrientationResult {
    const current = this.classify(landmarks);

    this.orientationHistory.push(current);

    // Maintain window size
    while (this.orientationHistory.length > this.historyWindow) {
      this.orientationHistory.shift();
    }

    return this.smoothOrientation();
  }

  /**
   * Calculate frontal view score
   *
   * Heuristics:
   * - Wide shoulder span (large x-distance between shoulders)
   * - Wide hip span
   * - Face landmarks visible (nose, eyes)
   * - Symmetric visibility (both left and right landmarks visible)
   *
   * @param landmarks - Pose landmarks
   * @returns Frontal score [0, 1]
   */
  private calculateFrontalScore(landmarks: PoseLandmark[]): number {
    let score = 0.0;

    // Check shoulder width (wider = more frontal)
    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];

    if (leftShoulder && rightShoulder) {
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

      // Wide shoulders (>0.2 normalized) indicate frontal view
      if (shoulderWidth > 0.2) {
        score += 0.3;
        // Bonus for very wide shoulders
        if (shoulderWidth > 0.3) {
          score += 0.1;
        }
      }

      // Symmetric visibility
      const visibilityDiff = Math.abs(leftShoulder.visibility - rightShoulder.visibility);
      if (visibilityDiff < 0.2) {
        score += 0.2;
      }
    }

    // Check hip width
    const leftHip = landmarks[11];
    const rightHip = landmarks[12];

    if (leftHip && rightHip) {
      const hipWidth = Math.abs(rightHip.x - leftHip.x);

      if (hipWidth > 0.15) {
        score += 0.2;
      }

      // Symmetric hip visibility
      const hipVisibilityDiff = Math.abs(leftHip.visibility - rightHip.visibility);
      if (hipVisibilityDiff < 0.2) {
        score += 0.1;
      }
    }

    // Face visibility (nose, eyes)
    const nose = landmarks[0];
    const leftEye = landmarks[1];
    const rightEye = landmarks[2];

    if (nose && nose.visibility > 0.5) {
      score += 0.1;
    }

    if (leftEye && rightEye) {
      if (leftEye.visibility > 0.5 && rightEye.visibility > 0.5) {
        score += 0.1;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate sagittal view score
   *
   * Heuristics:
   * - Narrow shoulder span (small x-distance)
   * - Narrow hip span
   * - Asymmetric visibility (one side more visible than other)
   * - Depth cues (z-coordinate variance if available)
   *
   * @param landmarks - Pose landmarks
   * @returns Sagittal score [0, 1]
   */
  private calculateSagittalScore(landmarks: PoseLandmark[]): number {
    let score = 0.0;

    // Check shoulder width (narrower = more sagittal)
    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];

    if (leftShoulder && rightShoulder) {
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

      // Narrow shoulders (<0.15 normalized) indicate sagittal view
      if (shoulderWidth < 0.15) {
        score += 0.4;
        // Bonus for very narrow shoulders
        if (shoulderWidth < 0.08) {
          score += 0.1;
        }
      }

      // Asymmetric visibility
      const visibilityDiff = Math.abs(leftShoulder.visibility - rightShoulder.visibility);
      if (visibilityDiff > 0.3) {
        score += 0.2;
      }
    }

    // Check hip width
    const leftHip = landmarks[11];
    const rightHip = landmarks[12];

    if (leftHip && rightHip) {
      const hipWidth = Math.abs(rightHip.x - leftHip.x);

      if (hipWidth < 0.1) {
        score += 0.2;
      }

      // Asymmetric hip visibility
      const hipVisibilityDiff = Math.abs(leftHip.visibility - rightHip.visibility);
      if (hipVisibilityDiff > 0.3) {
        score += 0.1;
      }
    }

    // Depth cues (if z-coordinates available)
    if (leftShoulder?.z !== undefined && rightShoulder?.z !== undefined) {
      const zDiff = Math.abs((leftShoulder.z || 0) - (rightShoulder.z || 0));

      // Significant z-difference indicates sagittal view
      if (zDiff > 0.1) {
        score += 0.1;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate posterior view score
   *
   * Heuristics:
   * - Limited face visibility (nose, eyes not visible)
   * - Back landmarks more visible than front
   * - Shoulder/hip alignment similar to frontal but with low face visibility
   *
   * @param landmarks - Pose landmarks
   * @returns Posterior score [0, 1]
   */
  private calculatePosteriorScore(landmarks: PoseLandmark[]): number {
    let score = 0.0;

    // Face NOT visible (key indicator of posterior)
    const nose = landmarks[0];
    const leftEye = landmarks[1];
    const rightEye = landmarks[2];

    let faceVisibilityCount = 0;
    if (nose && nose.visibility > 0.5) faceVisibilityCount++;
    if (leftEye && leftEye.visibility > 0.5) faceVisibilityCount++;
    if (rightEye && rightEye.visibility > 0.5) faceVisibilityCount++;

    // Low face visibility is strong posterior indicator
    if (faceVisibilityCount === 0) {
      score += 0.4;
    } else if (faceVisibilityCount === 1) {
      score += 0.2;
    }

    // Wide shoulders (similar to frontal, but with no face)
    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];

    if (leftShoulder && rightShoulder) {
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

      if (shoulderWidth > 0.2) {
        score += 0.2;
      }

      // Symmetric shoulder visibility (both visible from back)
      const visibilityDiff = Math.abs(leftShoulder.visibility - rightShoulder.visibility);
      if (visibilityDiff < 0.2) {
        score += 0.1;
      }
    }

    // Wide hips (visible from back)
    const leftHip = landmarks[11];
    const rightHip = landmarks[12];

    if (leftHip && rightHip) {
      const hipWidth = Math.abs(rightHip.x - leftHip.x);

      if (hipWidth > 0.15) {
        score += 0.2;
      }
    }

    // Ears more visible than eyes (looking away)
    const leftEar = landmarks[3];
    const rightEar = landmarks[4];

    if (leftEar && rightEar) {
      const earVisibility = (leftEar.visibility + rightEar.visibility) / 2;
      const eyeVisibility =
        ((leftEye?.visibility || 0) + (rightEye?.visibility || 0)) / 2;

      if (earVisibility > eyeVisibility + 0.2) {
        score += 0.1;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Smooth orientation using voting from history window
   *
   * Uses majority voting with confidence weighting.
   *
   * @returns Smoothed orientation result
   */
  private smoothOrientation(): OrientationResult {
    if (this.orientationHistory.length === 0) {
      return { orientation: 'frontal', confidence: 0.3 };
    }

    // Weighted voting
    const votes: Record<string, number> = {
      frontal: 0,
      sagittal: 0,
      posterior: 0,
    };

    let totalWeight = 0;

    for (const result of this.orientationHistory) {
      const weight = result.confidence;
      votes[result.orientation] += weight;
      totalWeight += weight;
    }

    // Normalize votes
    const frontalVote = votes.frontal / totalWeight;
    const sagittalVote = votes.sagittal / totalWeight;
    const posteriorVote = votes.posterior / totalWeight;

    // Determine winner
    const maxVote = Math.max(frontalVote, sagittalVote, posteriorVote);

    let orientation: 'frontal' | 'sagittal' | 'posterior' = 'frontal';
    if (maxVote === sagittalVote) {
      orientation = 'sagittal';
    } else if (maxVote === posteriorVote) {
      orientation = 'posterior';
    }

    return {
      orientation,
      confidence: maxVote,
    };
  }

  /**
   * Clear orientation history
   */
  public clearHistory(): void {
    this.orientationHistory = [];
  }

  /**
   * Get current history length
   */
  public getHistoryLength(): number {
    return this.orientationHistory.length;
  }
}

// Export singleton instance
export const orientationClassifier = new OrientationClassifier();
