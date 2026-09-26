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
  /** 'hold': a still measurement (no repetitions), e.g. passive knee extension. */
  mode?: 'reps' | 'hold';
  /**
   * What is measured, when it isn't the joint's usual angle: for the shoulder,
   * rotation with the elbow at the side instead of how high the arm is.
   */
  measure?: 'external_rotation';
  /**
   * Who moves the joint in this variant (declared by the exercise, not seen by
   * the camera): 'passive' (relaxed, e.g. resting on a roll), 'assisted', or
   * 'active' (the default).
   */
  assistance?: 'active' | 'assisted' | 'passive';
  /** Whether the limb takes body weight in this variant (default 'unloaded'). */
  loading?: 'unloaded' | 'weight_bearing';
  /**
   * Version of how this exercise's number is measured (angle definition,
   * estimator, set-up). Bump it when that changes: values measured
   * differently are not compared as one series. Default 1.
   */
  methodVersion?: number;
}

export const EXERCISE_MOVEMENT: Record<string, ExerciseMovement> = {
  // Facing the phone, elbow bent at the side, the forearm turns outward. The
  // angle is an approximate 3D estimate; the elbow staying at the side and the
  // trunk not turning are the dependable checks
  'shoulder-external-rotation': {
    direction: 'away',
    view: 'front',
    measure: 'external_rotation',
  },
  // Sitting, the knee straightens from about 90° towards 0°: the number that
  // matters is how close to straight it gets (active extension deficit)
  'seated-knee-extension': { direction: 'toward', posture: 'seated', view: 'side' },
  // Lying, heel on a roll, the knee relaxed: how straight it rests (passive
  // extension deficit), measured over a still window, not counted
  'heel-prop-extension': {
    direction: 'toward',
    posture: 'lying',
    view: 'side',
    mode: 'hold',
    assistance: 'passive',
  },
  // Lying, a roll under the knee: the heel lifts to straighten the knee while
  // the thigh stays on the roll
  'short-arc-quad': { direction: 'toward', posture: 'lying', view: 'side' },
  // Sitting, the foot slides back under the chair: bending past 90°
  'seated-knee-flexion': { direction: 'away', posture: 'seated', view: 'side' },
  // Knee flexion needs a side view: from the front the knee bends towards the
  // camera and reads 42-47° too straight (REHAB24-6); from the side 7-9° error
  squat: {
    direction: 'away',
    posture: 'standing',
    rangeView: 'side',
    loading: 'weight_bearing',
  },
  lunge: {
    direction: 'away',
    posture: 'standing',
    rangeView: 'side',
    loading: 'weight_bearing',
  },
  'sit-to-stand': { direction: 'away', loading: 'weight_bearing' },
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

/**
 * What a number from this exercise is: the exercise, who moved the joint and
 * the measurement method's version. Values are compared over time only within
 * one method; a change of dose or goal doesn't change it.
 */
export const measurementMethodOf = (exerciseId: string): string => {
  const m = movementOf(exerciseId);
  return `${exerciseId}|${m.measure ?? 'angle'}|${m.assistance ?? 'active'}|v${
    m.methodVersion ?? 1
  }`;
};
