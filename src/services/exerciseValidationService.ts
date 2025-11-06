import {
  Exercise,
  ExercisePhase,
  ValidationResult,
  RepetitionData,
  ExerciseMetrics,
} from '@types/exercise';
import { JointAngle, ProcessedPoseData } from '@types/pose';
import { goniometerService } from './goniometerService';

export class ExerciseValidationService {
  private currentExercise: Exercise | null = null;
  private currentPhase: ExercisePhase | null = null;
  private phaseStartTime: number = 0;
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

    // Calculate all joint angles
    const jointAngles = goniometerService.calculateAllJointAngles(poseData.landmarks);

    // Validate against current phase requirements
    const validation = this.validatePhaseRequirements(jointAngles);

    // Check for phase transition
    if (validation.isValid && this.shouldTransitionPhase()) {
      this.transitionToNextPhase();
    }

    // Track repetition completion
    if (this.detectRepetitionComplete(validation)) {
      this.completeRepetition(validation);
    }

    this.lastValidationResult = validation;
    return validation;
  }

  /**
   * Validate joint angles against phase requirements
   */
  private validatePhaseRequirements(
    jointAngles: Map<string, JointAngle>
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

    // Check hold duration if required
    if (this.currentPhase.holdDuration && isValid) {
      const heldDuration = Date.now() - this.phaseStartTime;
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
      phaseProgress: this.calculatePhaseProgress(),
    };
  }

  /**
   * Check if we should transition to the next phase
   */
  private shouldTransitionPhase(): boolean {
    if (!this.currentPhase) return false;

    const timeInPhase = Date.now() - this.phaseStartTime;

    // Check minimum hold duration
    if (this.currentPhase.holdDuration) {
      return timeInPhase >= this.currentPhase.holdDuration;
    }

    // For dynamic movements, transition immediately when valid
    return true;
  }

  /**
   * Transition to the next phase of the exercise
   */
  private transitionToNextPhase(): void {
    if (!this.currentExercise || !this.currentPhase) return;

    const currentIndex = this.currentExercise.phases.findIndex(
      (p) => p.name === this.currentPhase!.name
    );

    const nextIndex = (currentIndex + 1) % this.currentExercise.phases.length;
    this.currentPhase = this.currentExercise.phases[nextIndex];
    this.phaseStartTime = Date.now();

    // console.log(`Transitioned to phase: ${this.currentPhase.name}`);
  }

  /**
   * Detect if a repetition has been completed
   */
  private detectRepetitionComplete(validation: ValidationResult): boolean {
    if (!this.currentExercise || !this.currentPhase) return false;

    // For bicep curl: rest -> flexion -> extension (completes one rep)
    // We complete a rep when we've gone through all phases and returned to rest/extension
    const currentPhaseIndex = this.currentExercise.phases.findIndex(
      (p) => p.name === this.currentPhase.name
    );

    // If we're at the last phase (extension for bicep curl) and it's valid, complete a rep
    if (
      currentPhaseIndex === this.currentExercise.phases.length - 1 &&
      validation.isValid
    ) {
      return true;
    }

    return false;
  }

  /**
   * Record a completed repetition
   */
  private completeRepetition(validation: ValidationResult): void {
    this.repetitionCount++;

    const repData: RepetitionData = {
      number: this.repetitionCount,
      timestamp: Date.now(),
      quality: this.calculateRepetitionQuality(validation),
      peakAngles: validation.jointAngles || {},
      duration: Date.now() - this.phaseStartTime,
    };

    this.repetitionData.push(repData);

    // console.log(`Completed repetition ${this.repetitionCount}`);
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
  private calculatePhaseProgress(): number {
    if (!this.currentPhase) return 0;

    if (this.currentPhase.holdDuration) {
      const elapsed = Date.now() - this.phaseStartTime;
      return Math.min(1, elapsed / this.currentPhase.holdDuration);
    }

    return this.lastValidationResult?.isValid ? 1 : 0;
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
    this.repetitionCount = 0;
    this.repetitionData = [];
    this.isInRestPosition = true;
    this.lastValidationResult = null;
    this.hasMovedFromRest = false;
  }
}

// Singleton instance
export const exerciseValidationService = new ExerciseValidationService();
