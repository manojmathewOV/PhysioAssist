/**
 * How each exercise moves: the direction of the working movement, the body
 * position it is done in, and the camera view that measures it best. Exercises
 * not listed move away from neutral, and their position isn't assumed.
 */
import type { CameraView, MovementContext, MovementDirection, Posture } from './types';

export interface ExerciseMovement {
  direction: MovementDirection;
  posture?: Posture;
  /** Where to put the phone: other views get set-up guidance instead of results. */
  view?: CameraView;
  /**
   * The only view the joint angle is valid from, when the exercise is still
   * useful from others (a squat from the front checks the knees tracking
   * over the toes, but its depth needs the side). Defaults to `view`.
   */
  rangeView?: CameraView;
}

export const EXERCISE_MOVEMENT: Record<string, ExerciseMovement> = {
  // Sitting, the knee straightens from about 90° towards 0°: the number that
  // matters is how close to straight it gets (active extension deficit)
  'seated-knee-extension': { direction: 'toward', posture: 'seated', view: 'side' },
  // Sitting, the foot slides back under the chair: bending past 90°
  'seated-knee-flexion': { direction: 'away', posture: 'seated', view: 'side' },
  // Knee flexion needs a side view: from the front the knee bends towards the
  // camera and reads 42-47° too straight (REHAB24-6); from the side 7-9° error
  squat: { direction: 'away', posture: 'standing', rangeView: 'side' },
  lunge: { direction: 'away', posture: 'standing', rangeView: 'side' },
  'sit-to-stand': { direction: 'away' },
};

export const movementOf = (exerciseId?: string): ExerciseMovement =>
  (exerciseId && EXERCISE_MOVEMENT[exerciseId]) || { direction: 'away' };

/** The view the joint angle is valid from, if the exercise has one. */
export const rangeViewOf = (exerciseId?: string): CameraView | undefined => {
  const m = movementOf(exerciseId);
  return m.rangeView ?? m.view;
};

export const directionOf = (context: Pick<MovementContext, 'direction' | 'exerciseId'>) =>
  context.direction ?? movementOf(context.exerciseId).direction;
