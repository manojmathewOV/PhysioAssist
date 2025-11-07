import {
  PoseFrame,
  AngleDeviation,
  TemporalAlignment,
  Recommendation,
  ComparisonResult,
} from '../types/videoComparison.types';

interface JointAngles {
  elbow: number;
  shoulder: number;
  knee: number;
  hip: number;
}

export class ComparisonAnalysisService {
  private static readonly ANGLE_TOLERANCE = {
    good: 5,
    warning: 15,
    critical: 30,
  };

  // Changed to bilateral - analyze both left and right sides
  private static readonly CRITICAL_JOINTS = [
    'leftElbow',
    'rightElbow',
    'leftShoulder',
    'rightShoulder',
    'leftKnee',
    'rightKnee',
    'leftHip',
    'rightHip',
  ];

  static analyzeMovement(
    referencePoses: PoseFrame[],
    userPoses: PoseFrame[],
    exerciseType: string
  ): ComparisonResult {
    if (referencePoses.length === 0 || userPoses.length === 0) {
      return {
        overallScore: 0,
        angleDeviations: [],
        temporalAlignment: {
          offset: 0,
          confidence: 0,
          speedRatio: 1,
          phaseAlignment: 0,
        },
        recommendations: [],
      };
    }

    const angleDeviations = this.compareAngles(referencePoses, userPoses);
    const temporalAlignment = this.analyzeTempo(referencePoses, userPoses);
    const overallScore = this.calculateOverallScore(angleDeviations, temporalAlignment);
    const recommendations = this.generateRecommendations(
      angleDeviations,
      temporalAlignment,
      exerciseType
    );

    return {
      overallScore,
      angleDeviations,
      temporalAlignment,
      recommendations,
    };
  }

  private static compareAngles(
    reference: PoseFrame[],
    user: PoseFrame[]
  ): AngleDeviation[] {
    const deviations: AngleDeviation[] = [];

    this.CRITICAL_JOINTS.forEach((joint) => {
      const refAngles = this.extractJointAngles(reference, joint);
      const userAngles = this.extractJointAngles(user, joint);

      if (refAngles.length === 0 || userAngles.length === 0) return;

      // For range of motion analysis, we need to check min/max values too
      const refMin = Math.min(...refAngles);
      const refMax = Math.max(...refAngles);
      const refRange = refMax - refMin;

      const userMin = Math.min(...userAngles);
      const userMax = Math.max(...userAngles);
      const userRange = userMax - userMin;

      const refAvg = this.calculateAverage(refAngles);
      const userAvg = this.calculateAverage(userAngles);
      const deviation = Math.abs(refAvg - userAvg);

      // Check if user's range of motion is significantly less
      const rangeDeviation = Math.abs(refRange - userRange);

      deviations.push({
        joint,
        referenceAngle: refAvg,
        userAngle: userAvg,
        deviation,
        severity: this.getSeverity(deviation),
        rangeDeviation, // Add this for ROM analysis
        referenceRange: refRange,
        userRange: userRange,
      } as AngleDeviation);
    });

    return deviations;
  }

  private static extractJointAngles(poses: PoseFrame[], joint: string): number[] {
    // Joint is now full name like 'leftElbow', 'rightKnee', etc. - no more hard-coded 'left' prefix
    return poses
      .filter((pose) => pose.angles && pose.angles[joint])
      .map((pose) => pose.angles![joint]);
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static getSeverity(deviation: number): 'good' | 'warning' | 'critical' {
    if (deviation <= this.ANGLE_TOLERANCE.good) return 'good';
    if (deviation <= this.ANGLE_TOLERANCE.warning) return 'warning';
    return 'critical';
  }

  private static analyzeTempo(
    reference: PoseFrame[],
    user: PoseFrame[]
  ): TemporalAlignment {
    const refDuration =
      reference[reference.length - 1].timestamp - reference[0].timestamp;
    const userDuration = user[user.length - 1].timestamp - user[0].timestamp;

    const speedRatio = refDuration > 0 ? userDuration / refDuration : 1;

    // Calculate phase alignment
    const phaseAlignment = this.calculatePhaseAlignment(reference, user);

    // Calculate confidence based on how well the movements match
    const confidence = this.calculateAlignmentConfidence(reference, user);

    return {
      offset: 0, // Simplified for now
      confidence,
      // Fixed: Remove inversion. Now speedRatio = userDuration / refDuration
      // speedRatio > 1 means user is SLOWER (took more time)
      // speedRatio < 1 means user is FASTER (took less time)
      speedRatio,
      phaseAlignment,
    };
  }

  private static calculatePhaseAlignment(
    reference: PoseFrame[],
    user: PoseFrame[]
  ): number {
    // Simplified phase alignment calculation
    // In production, use DTW or similar algorithm
    const refPhases = this.detectMovementPhases(reference);
    const userPhases = this.detectMovementPhases(user);

    if (refPhases.length === 0 || userPhases.length === 0) return 0;

    const phaseMatches = refPhases.filter(
      (phase, i) => userPhases[i] && Math.abs(phase - userPhases[i]) < 0.1
    ).length;

    return phaseMatches / refPhases.length;
  }

  private static detectMovementPhases(poses: PoseFrame[]): number[] {
    // Detect key phases in movement (peaks, valleys, transitions)
    const phases: number[] = [];

    // Fixed: Use multiple joints to detect phases, not just leftElbow
    // This works for all exercise types (shoulder, knee, elbow)
    const primaryJoints = ['leftElbow', 'rightElbow', 'leftKnee', 'rightKnee', 'leftShoulder', 'rightShoulder'];

    for (let i = 1; i < poses.length - 1; i++) {
      // Check for peaks/valleys across any primary joint
      for (const joint of primaryJoints) {
        const prev = poses[i - 1].angles?.[joint] || 0;
        const curr = poses[i].angles?.[joint] || 0;
        const next = poses[i + 1].angles?.[joint] || 0;

        // Detect peaks and valleys
        if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
          phases.push(poses[i].timestamp);
          break; // Only add timestamp once per frame
        }
      }
    }

    return phases;
  }

  private static calculateAlignmentConfidence(
    reference: PoseFrame[],
    user: PoseFrame[]
  ): number {
    // Simple confidence calculation based on pose similarity
    let totalSimilarity = 0;
    let comparisons = 0;

    const minLength = Math.min(reference.length, user.length);
    for (let i = 0; i < minLength; i++) {
      const similarity = this.calculatePoseSimilarity(reference[i], user[i]);
      totalSimilarity += similarity;
      comparisons++;
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private static calculatePoseSimilarity(pose1: PoseFrame, pose2: PoseFrame): number {
    if (!pose1.angles || !pose2.angles) return 0;

    // Fixed: Use full joint names directly (e.g., 'leftElbow', 'rightKnee')
    const angleDiffs = this.CRITICAL_JOINTS.map((joint) => {
      const angle1 = pose1.angles![joint] || 0;
      const angle2 = pose2.angles![joint] || 0;
      return Math.abs(angle1 - angle2);
    });

    const avgDiff = angleDiffs.reduce((sum, diff) => sum + diff, 0) / angleDiffs.length;

    // Convert to similarity score (0-1)
    return Math.max(0, 1 - avgDiff / 180);
  }

  private static calculateOverallScore(
    angleDeviations: AngleDeviation[],
    temporalAlignment: TemporalAlignment
  ): number {
    // Weight factors
    const angleWeight = 0.7;
    const tempoWeight = 0.3;

    // Calculate angle score
    const angleScores = angleDeviations.map((dev) => {
      switch (dev.severity) {
        case 'good':
          return 100;
        case 'warning':
          return 70;
        case 'critical':
          return 40;
      }
    });

    const angleScore =
      angleScores.length > 0
        ? angleScores.reduce((sum, score) => sum + score, 0) / angleScores.length
        : 100;

    // Calculate tempo score
    const tempoScore = Math.max(
      0,
      100 - Math.abs(1 - temporalAlignment.speedRatio) * 100
    );

    // Combine scores
    return Math.round(angleScore * angleWeight + tempoScore * tempoWeight);
  }

  private static generateRecommendations(
    angleDeviations: AngleDeviation[],
    temporalAlignment: TemporalAlignment,
    exerciseType: string
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Angle-based recommendations
    angleDeviations.forEach((deviation) => {
      if (deviation.severity !== 'good') {
        recommendations.push({
          type: 'angle',
          priority: deviation.severity === 'critical' ? 'high' : 'medium',
          message: `Adjust your ${deviation.joint} angle by ${deviation.deviation.toFixed(0)}°`,
          detail: this.getAngleCorrection(deviation, exerciseType),
        });
      }
    });

    // Tempo-based recommendations
    // Fixed: speedRatio > 1 means user is SLOWER (took more time)
    // speedRatio < 1 means user is FASTER (took less time)
    if (temporalAlignment.speedRatio > 1.2) {
      recommendations.push({
        type: 'tempo',
        priority: 'medium',
        message: 'Speed up your movement',
        detail: `You're moving ${((temporalAlignment.speedRatio - 1) * 100).toFixed(0)}% slower than the reference`,
      });
    } else if (temporalAlignment.speedRatio < 0.8) {
      recommendations.push({
        type: 'tempo',
        priority: 'medium',
        message: 'Slow down your movement',
        detail: `You're moving ${((1 - temporalAlignment.speedRatio) * 100).toFixed(0)}% faster than the reference`,
      });
    }

    // Exercise-specific recommendations
    // Fixed: Use bilateral joint names (leftKnee, rightKnee, leftElbow, rightElbow)
    if (exerciseType === 'squat') {
      const kneeDeviation = angleDeviations.find((d) => d.joint === 'leftKnee' || d.joint === 'rightKnee');
      if (kneeDeviation && kneeDeviation.userAngle > 100) {
        recommendations.push({
          type: 'range',
          priority: 'high',
          message: 'Go deeper into your squat',
          detail: 'Aim for a 90-degree knee angle at the bottom of the movement',
        });
      }
    } else if (exerciseType === 'bicep_curl') {
      // Check for incomplete range of motion in bicep curls
      const elbowDeviation = angleDeviations.find((d) => d.joint === 'leftElbow' || d.joint === 'rightElbow');
      if (elbowDeviation) {
        // Check if user's range is significantly less than reference
        const rangeRatio =
          (elbowDeviation as any).userRange / (elbowDeviation as any).referenceRange;

        // If user's range is less than 80% of reference, suggest full ROM
        if (rangeRatio < 0.8 || (elbowDeviation as any).rangeDeviation > 30) {
          recommendations.push({
            type: 'range',
            priority: 'high',
            message: 'Complete the full range of motion',
            detail: 'Extend your arm fully at the bottom and curl completely at the top',
          });
        }
      }
    }

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations;
  }

  private static getAngleCorrection(
    deviation: AngleDeviation,
    exerciseType: string
  ): string {
    // Fixed: Support bilateral joint names (leftElbow, rightElbow, etc.)
    // Extract base joint name for lookups (e.g., 'leftElbow' -> 'elbow')
    const baseJoint = deviation.joint.replace(/^(left|right)/, '').toLowerCase();

    const corrections: Record<string, Record<string, string>> = {
      bicep_curl: {
        elbow:
          deviation.userAngle > deviation.referenceAngle
            ? 'Bend your elbow more during the curl'
            : "Don't bend your elbow as much",
        shoulder: 'Keep your upper arms stationary at your sides',
      },
      squat: {
        knee: 'Focus on sitting back with your hips',
        hip: 'Keep your chest up and core engaged',
      },
    };

    return (
      corrections[exerciseType]?.[baseJoint] ||
      `Adjust your ${deviation.joint} to match the reference angle`
    );
  }
}
