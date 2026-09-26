/**
 * What the camera must see for an exercise: the landmarks its measurement and
 * checks use, on the working side, rather than always the whole body. A
 * shoulder exercise can't be measured without the elbow and wrist, and a
 * seated knee exercise doesn't need the head or the other foot.
 */
import type { Exercise } from '../../types/exercise';
import type { BodySide } from '../../services/pose/exercisePlan';
import { movementOf } from '../../services/movement/exerciseMovement';
import type { FramingRequirement } from './useFramingReadiness';

const BOTH = (part: string) => [`left_${part}`, `right_${part}`];

/** Parts to show and check for this exercise (undefined: the whole body). */
export function framingRequirement(
  exercise: Exercise | null | undefined,
  side: BodySide | undefined
): FramingRequirement | undefined {
  if (!exercise?.primaryJoint || !side) return undefined;
  const at = (part: string) => `${side}_${part}`;
  const movement = movementOf(exercise.id);
  switch (exercise.primaryJoint) {
    case 'shoulder':
    case 'elbow':
      return [
        { label: 'Head visible', landmarks: ['nose'] },
        { label: 'Shoulders visible', landmarks: BOTH('shoulder') },
        { label: 'Arm visible', landmarks: [at('elbow'), at('wrist')] },
        { label: 'Hips visible', landmarks: BOTH('hip') },
      ];
    case 'knee':
    case 'hip':
      if (movement.posture === 'seated' || movement.posture === 'lying') {
        return [
          { label: 'Shoulders visible', landmarks: BOTH('shoulder') },
          { label: 'Hip visible', landmarks: [at('hip')] },
          { label: 'Knee visible', landmarks: [at('knee')] },
          { label: 'Foot visible', landmarks: [at('ankle')] },
        ];
      }
      return undefined; // Standing: the whole body
    default:
      return undefined;
  }
}
