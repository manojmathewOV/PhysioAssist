import { findLandmark } from './landmarkLookup';
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
/**
 * Shoulder and hip width as a fraction of torso length (shoulder midpoint to
 * hip midpoint). Unlike widths in image units, these don't depend on how far
 * the patient stands from the camera. They depend on the landmark set: on
 * MediaPipe image landmarks from real smartphone video (MobiPhysio) people
 * facing the camera measured shoulders 0.64-0.73 and hips 0.35-0.39, and
 * turned 40-50° 0.39-0.46 / 0.21-0.30. Projected world landmarks (Clemente et
 * al. 2024) are wider at the hips (0.44-0.53 facing the camera), so prefer
 * bodyYawDegrees when world landmarks are available.
 */
export function bodyWidthRatios(
  landmarks: PoseLandmark[]
): { shoulder: number; hip: number } | null {
  const ls = findLandmark(landmarks, 'left_shoulder');
  const rs = findLandmark(landmarks, 'right_shoulder');
  const lh = findLandmark(landmarks, 'left_hip');
  const rh = findLandmark(landmarks, 'right_hip');
  if (!ls || !rs || !lh || !rh) return null;
  const torso = Math.hypot(
    (ls.x + rs.x - lh.x - rh.x) / 2,
    (ls.y + rs.y - lh.y - rh.y) / 2
  );
  if (torso < 1e-6) return null;
  return { shoulder: Math.abs(rs.x - ls.x) / torso, hip: Math.abs(rh.x - lh.x) / torso };
}

/** Shorter body lines have no reliable direction (metres). */
const MIN_LINE_METRES = 0.05;

/**
 * How far the body is turned from facing the camera, in degrees (0 = facing
 * it, 90 = side-on), from MediaPipe's 3D world landmarks: the angle of the
 * shoulder line and of the hip line out of the image plane, averaged.
 *
 * Unlike width ratios this doesn't depend on body proportions or on which
 * landmark set is used. On real smartphone video (MobiPhysio, inspection
 * participants) people facing the camera measured 0.5-8°, and clips filmed
 * from the side 37-74°. On the Clemente et al. recordings, frontal-plane
 * exercises measured 0.5-6° and the 35° camera 19-36°.
 */
export function bodyYawDegrees(world: PoseLandmark[] | undefined): number | null {
  if (!world?.length) return null;
  const lineYaw = (a: string, b: string): number | null => {
    const p = findLandmark(world, a);
    const q = findLandmark(world, b);
    if (!p || !q || p.z === undefined || q.z === undefined) return null;
    const dx = Math.abs(p.x - q.x);
    const dz = Math.abs(p.z - q.z);
    if (Math.hypot(dx, dz) < MIN_LINE_METRES) return null;
    return (Math.atan2(dz, dx) * 180) / Math.PI;
  };
  const yaws = [
    lineYaw('left_shoulder', 'right_shoulder'),
    lineYaw('left_hip', 'right_hip'),
  ].filter((y): y is number => y !== null);
  return yaws.length ? yaws.reduce((s, y) => s + y, 0) / yaws.length : null;
}

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
    const leftShoulder = findLandmark(landmarks, 'left_shoulder');
    const rightShoulder = findLandmark(landmarks, 'right_shoulder');

    const ratios = bodyWidthRatios(landmarks);

    if (leftShoulder && rightShoulder) {
      // Wide shoulders relative to the torso indicate a frontal view
      if (ratios && ratios.shoulder > 0.6) {
        score += 0.3;
        // Bonus for very wide shoulders
        if (ratios.shoulder > 0.68) {
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
    const leftHip = findLandmark(landmarks, 'left_hip');
    const rightHip = findLandmark(landmarks, 'right_hip');

    if (leftHip && rightHip) {
      if (ratios && ratios.hip > 0.42) {
        score += 0.2;
      }

      // Symmetric hip visibility
      const hipVisibilityDiff = Math.abs(leftHip.visibility - rightHip.visibility);
      if (hipVisibilityDiff < 0.2) {
        score += 0.1;
      }
    }

    // Face visibility (nose, eyes)
    const nose = findLandmark(landmarks, 'nose');
    const leftEye = findLandmark(landmarks, 'left_eye');
    const rightEye = findLandmark(landmarks, 'right_eye');

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
    const leftShoulder = findLandmark(landmarks, 'left_shoulder');
    const rightShoulder = findLandmark(landmarks, 'right_shoulder');

    const ratios = bodyWidthRatios(landmarks);

    if (leftShoulder && rightShoulder) {
      // Narrow shoulders relative to the torso indicate a sagittal view
      if (ratios && ratios.shoulder < 0.35) {
        score += 0.4;
        // Bonus for very narrow shoulders
        if (ratios.shoulder < 0.2) {
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
    const leftHip = findLandmark(landmarks, 'left_hip');
    const rightHip = findLandmark(landmarks, 'right_hip');

    if (leftHip && rightHip) {
      if (ratios && ratios.hip < 0.25) {
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
    const nose = findLandmark(landmarks, 'nose');
    const leftEye = findLandmark(landmarks, 'left_eye');
    const rightEye = findLandmark(landmarks, 'right_eye');

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
    const leftShoulder = findLandmark(landmarks, 'left_shoulder');
    const rightShoulder = findLandmark(landmarks, 'right_shoulder');

    const ratios = bodyWidthRatios(landmarks);

    if (leftShoulder && rightShoulder) {
      if (ratios && ratios.shoulder > 0.6) {
        score += 0.2;
      }

      // Symmetric shoulder visibility (both visible from back)
      const visibilityDiff = Math.abs(leftShoulder.visibility - rightShoulder.visibility);
      if (visibilityDiff < 0.2) {
        score += 0.1;
      }
    }

    // Wide hips (visible from back)
    const leftHip = findLandmark(landmarks, 'left_hip');
    const rightHip = findLandmark(landmarks, 'right_hip');

    if (leftHip && rightHip) {
      if (ratios && ratios.hip > 0.42) {
        score += 0.2;
      }
    }

    // Ears more visible than eyes (looking away)
    const leftEar = findLandmark(landmarks, 'left_ear');
    const rightEar = findLandmark(landmarks, 'right_ear');

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
