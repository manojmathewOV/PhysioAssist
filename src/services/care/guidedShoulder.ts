import { pathwayOf } from './pathways';
/** Owner-described lying variants. Instruction identity is not clinical authorisation. */
import type { Exercise } from '../../types/exercise';
import type { ExercisePlan } from '../pose/exercisePlan';
import { validRangeMin } from '../pose/exercisePlan';
import { exercisesAllowed } from './episode';

export type GuidedExercise = Pick<
  Exercise,
  'id' | 'name' | 'primaryJoint' | 'instructions' | 'warnings'
> & {
  /** Short presentation of the same instructions, not a new prescription. */ cue?: string;
};
export const GUIDED_SHOULDER_REVISION = 'manoj-lying-shoulder-20260928-v1';
export const GUIDED_SHOULDER: Record<string, GuidedExercise> = {
  'supine-assisted-elevation': {
    id: 'supine-assisted-elevation',
    name: 'Lying assisted arm raise',
    cue: 'Support the working arm with your other arm.',
    primaryJoint: 'shoulder',
    instructions: [
      'Lie on your back.',
      'Use your other arm to support the arm you are exercising as you lift it forwards and upwards.',
      'Use the movement and amount in your programme.',
    ],
    warnings: [
      'Keep the assistance prescribed in your programme. This activity does not measure your movement.',
    ],
  },
  'supine-stick-external-rotation': {
    id: 'supine-stick-external-rotation',
    name: 'Lying stick-assisted turn-out',
    cue: 'Keep the working elbow close to your body.',
    primaryJoint: 'shoulder',
    instructions: [
      'Lie on your back with the stick.',
      'Keep the elbow of the arm you are exercising close to your body.',
      'Use your other arm to guide the stick as the forearm turns outwards.',
    ],
    warnings: [
      'Keep your prescribed support and elbow position. Follow your programme rather than forcing more range.',
    ],
  },
  'sleeper-stretch': {
    id: 'sleeper-stretch',
    name: 'Sleeper stretch',
    cue: 'Keep your elbow roughly level with your shoulder.',
    primaryJoint: 'shoulder',
    instructions: [
      'Use the side-lying position in your programme.',
      'Bring the upper arm out at shoulder level, approximately at right angles to your body.',
      'Keep your elbow roughly level with your shoulder, in line with your pillow if you use one.',
      'Use your other hand to guide the forearm towards the bed as shown in your programme.',
    ],
    warnings: [
      'Some elbow movement is expected; do not force perfect stillness. Follow your programme’s symptom and stopping instructions.',
    ],
  },
};
export const isGuidedShoulder = (id?: string): boolean =>
  !!id && Object.prototype.hasOwnProperty.call(GUIDED_SHOULDER, id);
export const guidedShoulderTitle = (id: string): string | undefined =>
  isGuidedShoulder(id) ? GUIDED_SHOULDER[id].name : undefined;

/** No catalogue-default dose and no transfer into a protected postoperative plan. */
export function guidedShoulderFor(plan: ExercisePlan | null | undefined, id?: string) {
  if (
    !id ||
    !isGuidedShoulder(id) ||
    !plan ||
    plan.joint !== 'shoulder' ||
    !['left', 'right'].includes(plan.side) ||
    plan.episode?.pathway !== 'frozen_shoulder' ||
    !plan.episode.id ||
    !pathwayOf(plan.episode.pathway)?.phases.includes(plan.episode.phase) ||
    !exercisesAllowed(plan) ||
    !Array.isArray(plan.routine)
  )
    return undefined;
  const item = plan.routine.find((x) => x.exerciseId === id);
  const reps = item?.reps ?? validRangeMin(item?.repRange);
  if (
    item?.instructionRevision !== GUIDED_SHOULDER_REVISION ||
    !Number.isInteger(reps) ||
    reps! <= 0 ||
    (item.holdSeconds !== undefined &&
      (!Number.isFinite(item.holdSeconds) || item.holdSeconds <= 0))
  )
    return undefined;
  return {
    title: GUIDED_SHOULDER[id].name,
    exercise: GUIDED_SHOULDER[id],
    guidedOnly: true as const,
  };
}
