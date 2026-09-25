/**
 * How each exercise moves: the direction of the working movement, the body
 * position it is done in, and the camera view that measures it best. Exercises
 * not listed move away from neutral, and their position isn't assumed.
 */
import type { CameraView, MovementContext, MovementDirection, Posture } from './types';

export interface ExerciseMovement {
  direction: MovementDirection;
  posture?: Posture;
  /** Where to put the phone. */
  view?: CameraView;
}

export const EXERCISE_MOVEMENT: Record<string, ExerciseMovement> = {
  // Sitting, the knee straightens from about 90° towards 0°: the number that
  // matters is how close to straight it gets (active extension deficit)
  'seated-knee-extension': { direction: 'toward', posture: 'seated', view: 'side' },
  // Sitting, the foot slides back under the chair: bending past 90°
  'seated-knee-flexion': { direction: 'away', posture: 'seated', view: 'side' },
  squat: { direction: 'away', posture: 'standing' },
  lunge: { direction: 'away', posture: 'standing' },
  'sit-to-stand': { direction: 'away' },
};

export const movementOf = (exerciseId?: string): ExerciseMovement =>
  (exerciseId && EXERCISE_MOVEMENT[exerciseId]) || { direction: 'away' };

export const directionOf = (context: Pick<MovementContext, 'direction' | 'exerciseId'>) =>
  context.direction ?? movementOf(context.exerciseId).direction;
