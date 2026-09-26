/**
 * Patient-facing exercise list and plain-language helpers shared by the native
 * and web Exercise screens (chooser, in-camera controls and summary).
 */
import { EXERCISES } from '../../constants/exercises';
import type { Exercise } from '../../types/exercise';
import type { ExercisePlan } from '../../services/pose/exercisePlan';

export type ExerciseKey = keyof typeof EXERCISES;

export interface ExerciseOption {
  key: ExerciseKey;
  exercise: Exercise;
  /** Short, friendly name. */
  title: string;
  /** One line explaining the movement in everyday words. */
  description: string;
  /** Goal shown on the card, e.g. "12 repetitions". */
  goal: string;
  /** MaterialIcons name. */
  icon: string;
}

export const EXERCISE_OPTIONS: ExerciseOption[] = [
  {
    key: 'bicepCurl',
    exercise: EXERCISES.bicepCurl,
    title: 'Bicep curl',
    description: 'Bend your elbows to bring your hands up to your shoulders',
    goal: `${EXERCISES.bicepCurl.targetRepetitions} repetitions`,
    icon: 'fitness-center',
  },
  {
    key: 'armRaise',
    exercise: EXERCISES.armRaise,
    title: 'Arm raise',
    description: 'Lift your arm forward and up, as high as is comfortable',
    goal: `${EXERCISES.armRaise.targetRepetitions} repetitions`,
    icon: 'pan-tool',
  },
  {
    key: 'shoulderPress',
    exercise: EXERCISES.shoulderPress,
    title: 'Shoulder press',
    description: 'Push your hands up above your head, then lower them',
    goal: `${EXERCISES.shoulderPress.targetRepetitions} repetitions`,
    icon: 'accessibility-new',
  },
  {
    key: 'shoulderExternalRotation',
    exercise: EXERCISES.shoulderExternalRotation,
    title: 'Shoulder turn-out',
    description: 'Face the phone, elbow at your side, and turn your forearm outward',
    goal: `${EXERCISES.shoulderExternalRotation.targetRepetitions} repetitions`,
    icon: 'rotate-right',
  },
  {
    key: 'squat',
    exercise: EXERCISES.squat,
    title: 'Squat',
    description: 'Bend your knees as if sitting down on a chair',
    goal: `${EXERCISES.squat.targetRepetitions} repetitions`,
    icon: 'event-seat',
  },
  {
    key: 'seatedKneeExtension',
    exercise: EXERCISES.seatedKneeExtension,
    title: 'Seated knee straightening',
    description: 'Sit side-on and straighten your knee as far as is comfortable',
    goal: `${EXERCISES.seatedKneeExtension.targetRepetitions} repetitions`,
    icon: 'airline-seat-legroom-extra',
  },
  {
    key: 'heelPropExtension',
    exercise: EXERCISES.heelPropExtension,
    title: 'Heel prop',
    description: 'Lie side-on, heel on a rolled towel, and let your knee relax straight',
    goal: 'Rest still for 30 seconds',
    icon: 'hotel',
  },
  {
    key: 'shortArcQuad',
    exercise: EXERCISES.shortArcQuad,
    title: 'Short-arc quad',
    description: 'Lie side-on, roll under your knee, and lift your heel to straighten it',
    goal: `${EXERCISES.shortArcQuad.targetRepetitions} repetitions`,
    icon: 'airline-seat-flat-angled',
  },
  {
    key: 'seatedKneeFlexion',
    exercise: EXERCISES.seatedKneeFlexion,
    title: 'Seated knee bend',
    description: 'Sit side-on and slide your foot back under the chair',
    goal: `${EXERCISES.seatedKneeFlexion.targetRepetitions} repetitions`,
    icon: 'airline-seat-legroom-reduced',
  },
  {
    key: 'hamstringStretch',
    exercise: EXERCISES.hamstringStretch,
    title: 'Hamstring stretch',
    description: 'Gently stretch the back of your leg',
    goal: 'Hold for 30 seconds',
    icon: 'self-improvement',
  },
];

/**
 * The exercise to start on: the routine's first, else the first that trains
 * the plan's joint (falls back to the bicep curl).
 */
export const firstKeyFor = (plan?: ExercisePlan | null): ExerciseKey =>
  findExerciseOption(plan?.routine?.[0]?.exerciseId)?.key ??
  EXERCISE_OPTIONS.find((o) => plan && o.exercise.primaryJoint === plan.joint)?.key ??
  'bicepCurl';

/**
 * After the plan changes: keep the chosen exercise while it still trains the
 * plan's joint (saving a video mustn't jump back to the first exercise).
 */
export const keepOrFirstKey = (current: ExerciseKey, plan: ExercisePlan): ExerciseKey =>
  EXERCISE_OPTIONS.find((o) => o.key === current)?.exercise.primaryJoint === plan.joint
    ? current
    : firstKeyFor(plan);

export const findExerciseOption = (idOrKey?: string | null): ExerciseOption | undefined =>
  EXERCISE_OPTIONS.find((o) => o.key === idOrKey || o.exercise.id === idOrKey);

/** The friendly tip shown before starting and when a reading is only an estimate. */
export const SIDE_ON_HINT = 'Turn side-on to the camera';

/**
 * Turns raw validation messages ("Bend left_elbow more", "Cannot detect
 * right_knee") into short instructions a patient can act on.
 */
export const friendlyInstruction = (message?: string | null): string => {
  if (!message) {
    return '';
  }
  if (/no exercise selected|no phase data/i.test(message)) {
    return '';
  }
  if (/^cannot detect/i.test(message)) {
    return 'Step back so your whole body is in view';
  }
  if (/turn side-on/i.test(message)) {
    return SIDE_ON_HINT;
  }
  return message.replace(/_/g, ' ');
};

/** Form score (0–1) in words. Never harsh: this is read by patients. */
export const formInWords = (score: number): string =>
  score >= 0.8 ? 'Excellent form' : score >= 0.6 ? 'Good form' : 'Check your form';

/** "45 seconds", "2 min 5 s". */
export const formatDuration = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) {
    return `${s} sec`;
  }
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m} min ${rest} s` : `${m} min`;
};
