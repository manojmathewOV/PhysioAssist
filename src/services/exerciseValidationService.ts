import {
  Exercise,
  ExercisePhase,
  ValidationResult,
  RepetitionData,
  ExerciseMetrics,
} from '../types/exercise';
import { JointAngle, ProcessedPoseData } from '../types/pose';
import { goniometerService } from './goniometerService';
import {
  getMeasurementLandmarks,
  getOutOfPlaneJoints,
} from './pose/measurementLandmarks';

/**
 * A phase counts as reached only after its joint requirements hold continuously
 * for this long (or the phase's holdDuration, if longer). Debounces angle jitter
 * around range edges, which otherwise flips phases and double-counts reps.
 */
export const MIN_PHASE_DWELL_MS = 200;
/** Two reps can't complete closer together than this. */
export const MIN_REP_INTERVAL_MS = 500;

/**
 * Rep counting is a phase state machine (the approach used by open-source
 * trainers such as LearnOpenCV's squat analyser and Good-GYM): the patient must
 * reach every phase in order, each for its dwell time, and a rep completes on
 * returning to the first phase. Poses where a required joint can't be seen don't
 * advance or reset the machine, so briefly leaving the frame loses nothing.
 */
export class ExerciseValidationService {
  private currentExercise: Exercise | null = null;
  private currentPhase: ExercisePhase | null = null;
  private phaseStartTime: number = 0;
  /** When the current phase's requirements started holding (null = not holding). */
  private phaseValidSince: number | null = null;
  /** True once every later phase has been reached and we're heading back to the start. */
  private returningToStart: boolean = false;
  /** When the current repetition left the start position. */
  private repStartTime: number = 0;
  private lastRepTime: number = -Infinity;
  private repetitionCount: number = 0;
  private repetitionData: RepetitionData[] = [];
  private isInRestPosition: boolean = true;
  private lastValidationResult: ValidationResult | null = null;
  private hasMovedFromRest: boolean = false;

  /**
   * Start tracking a new exercise
   */
  startExercise(exercise: Exercise): void {
    this.currentExercise = exercise;
    this.currentPhase = exercise.phases[0];
    this.phaseStartTime = Date.now();
    this.phaseValidSince = null;
    this.returningToStart = false;
    this.repStartTime = 0;
    this.lastRepTime = -Infinity;
    this.repetitionCount = 0;
    this.repetitionData = [];
    this.isInRestPosition = true;
    this.hasMovedFromRest = false;

    // console.log(`Started exercise: ${exercise.name}`);
  }

  /**
   * Validate current pose against exercise requirements
   */
  validatePose(poseData: ProcessedPoseData): ValidationResult {
    if (!this.currentExercise || !this.currentPhase) {
      return {
        isValid: false,
        errors: ['No exercise selected'],
        phase: 'rest',
        feedback: [],
      };
    }

    // Frame time (real frames carry their capture time; fall back to now)
    const now = poseData.timestamp || Date.now();

    // Calculate all joint angles
    const jointAngles = goniometerService.calculateAllJointAngles(
      getMeasurementLandmarks(poseData)
    );

    // Validate against current phase requirements
    const validation = this.validatePhaseRequirements(jointAngles, now);

    // Flag required joints whose limb is out of the image plane (from world landmarks)
    const outOfPlane = getOutOfPlaneJoints(poseData);
    const estimatedJoints = this.currentPhase.jointRequirements
      .map((r) => r.joint)
      .filter((joint) => outOfPlane.has(joint));
    if (estimatedJoints.length > 0) {
      validation.estimatedJoints = estimatedJoints;
      validation.feedback.push('Turn side-on to the camera for an accurate reading');
    }

    this.advanceStateMachine(validation, jointAngles, now);

    this.lastValidationResult = validation;
    return validation;
  }

  /**
   * Validate joint angles against phase requirements
   */
  private validatePhaseRequirements(
    jointAngles: Map<string, JointAngle>,
    now: number = Date.now()
  ): ValidationResult {
    if (!this.currentPhase) {
      return {
        isValid: false,
        errors: ['No phase data'],
        phase: 'rest',
        feedback: [],
      };
    }

    const errors: string[] = [];
    const feedback: string[] = [];
    let isValid = true;

    // Check each joint requirement
    for (const requirement of this.currentPhase.jointRequirements) {
      const jointAngle = jointAngles.get(requirement.joint);

      if (!jointAngle || !jointAngle.isValid) {
        errors.push(`Cannot detect ${requirement.joint}`);
        isValid = false;
        continue;
      }

      const angle = jointAngle.angle;
      const { minAngle, maxAngle, targetAngle } = requirement;

      // Check if angle is within acceptable range
      if (angle < minAngle || angle > maxAngle) {
        isValid = false;
        const direction = angle < minAngle ? 'more' : 'less';
        errors.push(`Bend ${requirement.joint} ${direction}`);
      }

      // Provide feedback on how close to target
      if (targetAngle) {
        const difference = Math.abs(angle - targetAngle);
        if (difference < 5) {
          feedback.push(`Perfect ${requirement.joint} angle!`);
        } else if (difference < 15) {
          feedback.push(`Good ${requirement.joint} position`);
        }
      }
    }

    // Check hold duration if required (measured from when the position was reached)
    if (this.currentPhase.holdDuration && isValid) {
      const heldDuration = now - (this.phaseValidSince ?? now);
      const remainingTime = this.currentPhase.holdDuration - heldDuration;

      if (remainingTime > 0) {
        feedback.push(`Hold for ${Math.ceil(remainingTime / 1000)} more seconds`);
      }
    }

    return {
      isValid,
      errors,
      phase: this.currentPhase.name,
      feedback,
      jointAngles: Object.fromEntries(jointAngles),
      phaseProgress: this.calculatePhaseProgress(now, isValid),
    };
  }

  /** True when every joint the current phase needs was detected this frame. */
  private requiredJointsVisible(jointAngles: Map<string, JointAngle>): boolean {
    return (this.currentPhase?.jointRequirements ?? []).every(
      (r) => jointAngles.get(r.joint)?.isValid
    );
  }

  /**
   * Advance the phase state machine for one frame and count completed reps.
   */
  private advanceStateMachine(
    validation: ValidationResult,
    jointAngles: Map<string, JointAngle>,
    now: number
  ): void {
    const exercise = this.currentExercise;
    const phase = this.currentPhase;
    if (!exercise || !phase) return;

    // Out of view: freeze (keep progress, don't count this frame towards dwell)
    if (!this.requiredJointsVisible(jointAngles)) {
      this.phaseValidSince = null;
      return;
    }

    if (!validation.isValid) {
      this.phaseValidSince = null;
      return;
    }
    this.phaseValidSince ??= now;
    const dwell = Math.max(MIN_PHASE_DWELL_MS, phase.holdDuration ?? 0);
    if (now - this.phaseValidSince < dwell) {
      return;
    }

    const index = exercise.phases.findIndex((p) => p.name === phase.name);
    const isStart = index === 0;

    // Back at the start after reaching every phase: that's one repetition
    if (isStart && this.returningToStart) {
      this.returningToStart = false;
      if (now - this.lastRepTime >= MIN_REP_INTERVAL_MS) {
        this.completeRepetition(validation, now);
      }
    }

    if (exercise.phases.length < 2) {
      return;
    }
    if (isStart) {
      this.repStartTime = now;
    }
    if (index === exercise.phases.length - 1) {
      this.returningToStart = true;
    }
    this.currentPhase = exercise.phases[(index + 1) % exercise.phases.length];
    this.phaseStartTime = now;
    this.phaseValidSince = null;
  }

  /**
   * Record a completed repetition
   */
  private completeRepetition(validation: ValidationResult, now: number): void {
    this.repetitionCount++;
    this.lastRepTime = now;

    const repData: RepetitionData = {
      number: this.repetitionCount,
      timestamp: now,
      quality: this.calculateRepetitionQuality(validation),
      peakAngles: validation.jointAngles || {},
      duration: now - this.repStartTime,
    };

    this.repetitionData.push(repData);
  }

  /**
   * Calculate quality score for a repetition (0-100)
   */
  private calculateRepetitionQuality(validation: ValidationResult): number {
    if (!validation.jointAngles || !this.currentPhase) return 0;

    let totalScore = 0;
    let jointCount = 0;

    for (const requirement of this.currentPhase.jointRequirements) {
      const jointAngle = validation.jointAngles[requirement.joint];
      if (!jointAngle) continue;

      const angle = jointAngle.angle;
      const { targetAngle, minAngle, maxAngle } = requirement;

      if (targetAngle) {
        // Score based on proximity to target
        const difference = Math.abs(angle - targetAngle);
        const range = (maxAngle - minAngle) / 2;
        const score = Math.max(0, 100 - (difference / range) * 100);
        totalScore += score;
      } else {
        // Binary score - in range or not
        totalScore += angle >= minAngle && angle <= maxAngle ? 100 : 0;
      }

      jointCount++;
    }

    return jointCount > 0 ? totalScore / jointCount : 0;
  }

  /**
   * Calculate progress through current phase (0-1)
   */
  private calculatePhaseProgress(now: number, isValid: boolean): number {
    if (!this.currentPhase || !isValid) return 0;

    if (this.currentPhase.holdDuration) {
      const elapsed = now - (this.phaseValidSince ?? now);
      return Math.min(1, elapsed / this.currentPhase.holdDuration);
    }

    return 1;
  }

  /**
   * Get current exercise metrics
   */
  getExerciseMetrics(): ExerciseMetrics {
    const averageQuality =
      this.repetitionData.length > 0
        ? this.repetitionData.reduce((sum, rep) => sum + rep.quality, 0) /
          this.repetitionData.length
        : 0;

    const totalDuration = this.repetitionData.reduce((sum, rep) => sum + rep.duration, 0);

    return {
      exerciseName: this.currentExercise?.name || '',
      repetitionCount: this.repetitionCount,
      targetRepetitions: this.currentExercise?.targetRepetitions || 0,
      averageQuality,
      totalDuration,
      repetitionData: this.repetitionData,
      isComplete: this.repetitionCount >= (this.currentExercise?.targetRepetitions || 0),
    };
  }

  /**
   * Stop the current exercise
   */
  stopExercise(): ExerciseMetrics {
    const metrics = this.getExerciseMetrics();

    // Reset state
    this.currentExercise = null;
    this.currentPhase = null;
    this.repetitionCount = 0;
    this.repetitionData = [];

    return metrics;
  }

  /**
   * Get current exercise state
   */
  getCurrentState() {
    return {
      exercise: this.currentExercise,
      phase: this.currentPhase,
      repetitionCount: this.repetitionCount,
      isActive: this.currentExercise !== null,
    };
  }

  /**
   * Reset the current session (for testing)
   */
  resetSession(): void {
    this.currentExercise = null;
    this.currentPhase = null;
    this.phaseStartTime = 0;
    this.phaseValidSince = null;
    this.returningToStart = false;
    this.repStartTime = 0;
    this.lastRepTime = -Infinity;
    this.repetitionCount = 0;
    this.repetitionData = [];
    this.isInRestPosition = true;
    this.lastValidationResult = null;
    this.hasMovedFromRest = false;
  }
}

// Singleton instance
export const exerciseValidationService = new ExerciseValidationService();
