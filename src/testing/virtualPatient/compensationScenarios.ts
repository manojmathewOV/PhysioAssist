/**
 * Compensation scenarios for the virtual patient: one repetition each, clean or
 * with a compensation growing with the movement, and the compensation checks
 * (services/movement/compensations) the app must report for it.
 *
 * Magnitudes are chosen clearly inside the warn or flag band of each check
 * (torso = 150 px, shoulder width = 124 px in the body model).
 */
import { BodyPose, FrameEffects, MEDIAPIPE_ORDER, STANDING } from './body';
import { JointAngles, Keyframe, gaussian, repetitions } from './timeline';
import type { Scenario } from './scenarios';
import type {
  CompensationHit,
  FindingId,
  MovementContext,
} from '../../services/movement/types';

export interface ExpectedHit {
  id: FindingId;
  severity: CompensationHit['severity'];
}

export interface CompensationScenario extends Scenario {
  context: MovementContext;
  /** When the repetition starts and ends (ms). */
  rep: { startT: number; endT: number };
  /** Compensations that must be reported (and nothing else). */
  hits: ExpectedHit[];
}

const SIDE: BodyPose = { ...STANDING, view: 'side' };
const FRONT: BodyPose = { ...STANDING, view: 'front' };

const LEAD_MS = 500;
const MOVE_MS = 1200;
const HOLD_MS = 1500;
const REP = { startT: LEAD_MS, endT: LEAD_MS + 2 * MOVE_MS + HOLD_MS };

/** One repetition: rest -> target (held) -> rest (compensations back to none). */
const oneRep = (rest: JointAngles, target: JointAngles): Keyframe[] =>
  repetitions({
    rest: { ...pick(STANDING, Object.keys(target) as (keyof JointAngles)[]), ...rest },
    target,
    reps: 1,
    moveMs: MOVE_MS,
    holdMs: HOLD_MS,
    restMs: 500,
    leadInMs: LEAD_MS,
  });

const pick = (pose: BodyPose, keys: (keyof JointAngles)[]): JointAngles =>
  Object.fromEntries(keys.map((k) => [k, pose[k]]));

/** Every landmark jitters by a seeded Gaussian of `sd` pixels. */
export const jitter =
  (sd: number) =>
  (_t: number, rand: () => number): FrameEffects => {
    const offsets: FrameEffects['offsets'] = {};
    for (const name of MEDIAPIPE_ORDER) {
      offsets[name] = { x: gaussian(rand) * sd, y: gaussian(rand) * sd };
    }
    return { offsets };
  };

/** `landmark` jumps by `dy` px during [from, from + ms) (a tracking glitch or a twitch). */
export const spike =
  (landmark: string, dy: number, from: number, ms: number) =>
  (t: number): FrameEffects =>
    t >= from && t < from + ms ? { offsets: { [landmark]: { x: 0, y: dy } } } : {};

/** Middle of the hold at the top of the repetition. */
export const HOLD_MID = LEAD_MS + MOVE_MS + HOLD_MS / 2;

const SHOULDER: MovementContext = {
  joint: 'shoulder',
  side: 'left',
  exerciseId: 'arm-raise',
};
const KNEE: MovementContext = { joint: 'knee', side: 'left', exerciseId: 'squat' };
const HIP: MovementContext = { joint: 'hip', side: 'left', exerciseId: 'squat' };

const scenario = (
  id: string,
  title: string,
  base: BodyPose,
  context: MovementContext,
  timeline: Keyframe[],
  hits: ExpectedHit[],
  effects?: Scenario['effects']
): CompensationScenario => ({
  id,
  exerciseId: context.exerciseId ?? 'arm-raise',
  title,
  description: title,
  base,
  timeline,
  effects,
  context,
  rep: REP,
  hits,
  expect: { reps: 1 },
});

// Arm raise forward, side-on (flexion 10 -> 150)
const RAISE_REST = { leftShoulder: 10 };
const raiseSide = (extra: JointAngles = {}) =>
  oneRep(RAISE_REST, { leftShoulder: 150, ...extra });

// Arm raise sideways, facing the camera (abduction 10 -> 100)
const raiseFront = (extra: JointAngles = {}, top = 100) =>
  oneRep(RAISE_REST, { leftShoulder: top, ...extra });

// Squats (bottom 100°)
const SQUAT_REST = { leftKnee: 176, rightKnee: 176, leftHip: 176, rightHip: 176 };
const squat = (extra: JointAngles = {}, depth = 100) =>
  oneRep(SQUAT_REST, {
    leftKnee: depth,
    rightKnee: depth,
    leftHip: depth,
    rightHip: depth,
    ...extra,
  });

export const COMPENSATION_SCENARIOS: CompensationScenario[] = [
  // Arm raise, side-on
  scenario(
    'raise-side-clean',
    'Arm raise side-on, good form',
    SIDE,
    SHOULDER,
    raiseSide(),
    []
  ),
  scenario(
    'raise-side-back-arch-warn',
    'Arm raise, arching back 12°',
    SIDE,
    SHOULDER,
    raiseSide({ trunkLeanBack: 12 }),
    [{ id: 'back_arch', severity: 'warn' }]
  ),
  scenario(
    'raise-side-back-arch-flag',
    'Arm raise, arching back 20°',
    SIDE,
    SHOULDER,
    raiseSide({ trunkLeanBack: 20 }),
    [{ id: 'back_arch', severity: 'flag' }]
  ),
  scenario(
    'raise-side-forward-lean-warn',
    'Arm raise, leaning forward 12°',
    SIDE,
    SHOULDER,
    raiseSide({ trunkLeanBack: -12 }),
    [{ id: 'trunk_forward_lean', severity: 'warn' }]
  ),
  scenario(
    'raise-side-forward-lean-flag',
    'Arm raise, leaning forward 20°',
    SIDE,
    SHOULDER,
    raiseSide({ trunkLeanBack: -20 }),
    [{ id: 'trunk_forward_lean', severity: 'flag' }]
  ),
  scenario(
    'raise-side-elbow-warn',
    'Arm raise, elbow bends 27°',
    SIDE,
    SHOULDER,
    raiseSide({ leftElbow: 145 }),
    [{ id: 'elbow_bend', severity: 'warn' }]
  ),
  scenario(
    'raise-side-elbow-flag',
    'Arm raise, elbow bends 47°',
    SIDE,
    SHOULDER,
    raiseSide({ leftElbow: 125 }),
    [{ id: 'elbow_bend', severity: 'flag' }]
  ),
  scenario(
    'raise-side-forward-head-warn',
    'Arm raise, head pokes forward 15 px (10% torso)',
    SIDE,
    SHOULDER,
    raiseSide({ forwardHead: 15 }),
    [{ id: 'forward_head', severity: 'warn' }]
  ),
  scenario(
    'raise-side-forward-head-flag',
    'Arm raise, head pokes forward 24 px (16% torso)',
    SIDE,
    SHOULDER,
    raiseSide({ forwardHead: 24 }),
    [{ id: 'forward_head', severity: 'flag' }]
  ),

  // Arm raise, facing the camera
  scenario(
    'raise-front-clean',
    'Arm raise facing the camera, good form',
    FRONT,
    SHOULDER,
    raiseFront(),
    []
  ),
  scenario(
    'raise-front-hike-warn',
    'Arm raise, shoulder hikes 12 px (10% width)',
    FRONT,
    SHOULDER,
    raiseFront({ shoulderHike: 12 }),
    [{ id: 'shoulder_hike', severity: 'warn' }]
  ),
  scenario(
    'raise-front-hike-flag',
    'Arm raise, shoulder hikes 18 px (15% width)',
    FRONT,
    SHOULDER,
    raiseFront({ shoulderHike: 18 }),
    [{ id: 'shoulder_hike', severity: 'flag' }]
  ),
  scenario(
    'raise-front-overhead-elevation',
    'Arm raise to 150° with 12 px of normal shoulder elevation',
    FRONT,
    SHOULDER,
    raiseFront({ shoulderHike: 12 }, 150),
    []
  ),
  scenario(
    'raise-front-side-lean-warn',
    'Arm raise, leaning sideways 10°',
    FRONT,
    SHOULDER,
    raiseFront({ trunkSideLean: 10 }),
    [{ id: 'trunk_side_lean', severity: 'warn' }]
  ),
  scenario(
    'raise-front-side-lean-flag',
    'Arm raise, leaning sideways 16°',
    FRONT,
    SHOULDER,
    raiseFront({ trunkSideLean: 16 }),
    [{ id: 'trunk_side_lean', severity: 'flag' }]
  ),
  scenario(
    'raise-front-rotation-warn',
    'Arm raise, trunk turns 35°',
    FRONT,
    SHOULDER,
    raiseFront({ trunkRotation: 35 }),
    [{ id: 'trunk_rotation', severity: 'warn' }]
  ),
  scenario(
    'raise-front-rotation-flag',
    'Arm raise, trunk turns 45°',
    FRONT,
    SHOULDER,
    raiseFront({ trunkRotation: 45 }),
    [{ id: 'trunk_rotation', severity: 'flag' }]
  ),
  scenario(
    'raise-front-head-tilt-warn',
    'Arm raise, head tilts 10°',
    FRONT,
    SHOULDER,
    raiseFront({ headTilt: 10 }),
    [{ id: 'head_tilt', severity: 'warn' }]
  ),
  scenario(
    'raise-front-head-tilt-flag',
    'Arm raise, head tilts 16°',
    FRONT,
    SHOULDER,
    raiseFront({ headTilt: 16 }),
    [{ id: 'head_tilt', severity: 'flag' }]
  ),

  // Squat, facing the camera
  scenario(
    'squat-front-clean',
    'Squat facing the camera, good form',
    FRONT,
    KNEE,
    squat(),
    []
  ),
  scenario(
    'squat-front-valgus-warn',
    'Squat, left knee caves in 10 px (6.7% torso)',
    FRONT,
    KNEE,
    squat({ kneeValgus: 10 }),
    [{ id: 'knee_valgus', severity: 'warn' }]
  ),
  scenario(
    'squat-front-valgus-flag',
    'Squat, left knee caves in 15 px (10% torso)',
    FRONT,
    KNEE,
    squat({ kneeValgus: 15 }),
    [{ id: 'knee_valgus', severity: 'flag' }]
  ),
  scenario(
    'squat-front-knee-out',
    'Squat, left knee pushes outward 15 px (not valgus)',
    FRONT,
    KNEE,
    squat({ kneeValgus: -15 }),
    []
  ),

  // Hip exercise (mini squat, hip as the joint of interest), facing the camera
  scenario(
    'mini-squat-front-clean',
    'Mini squat, hips level',
    FRONT,
    HIP,
    squat({}, 130),
    []
  ),
  scenario(
    'mini-squat-front-hitch-warn',
    'Mini squat, left hip hitches 10 px (6.7% torso)',
    FRONT,
    HIP,
    squat({ hipHitch: 10 }, 130),
    [{ id: 'hip_hitch', severity: 'warn' }]
  ),
  scenario(
    'mini-squat-front-hip-drop-flag',
    'Mini squat, left hip drops 15 px (10% torso)',
    FRONT,
    HIP,
    squat({ hipHitch: -15 }, 130),
    [{ id: 'hip_hitch', severity: 'flag' }]
  ),
  scenario(
    'squat-front-pelvic-shift-warn',
    'Squat, pelvis shifts 12 px sideways (8% torso)',
    FRONT,
    KNEE,
    squat({ pelvicShift: 12 }),
    [{ id: 'pelvic_shift', severity: 'warn' }]
  ),
  scenario(
    'squat-front-pelvic-shift-flag',
    'Squat, pelvis shifts 20 px sideways (13% torso)',
    FRONT,
    KNEE,
    squat({ pelvicShift: -20 }),
    [{ id: 'pelvic_shift', severity: 'flag' }]
  ),
  scenario(
    'mini-squat-front-hitch-flag',
    'Mini squat, left hip hitches 15 px (10% torso)',
    FRONT,
    HIP,
    squat({ hipHitch: 15 }, 130),
    [{ id: 'hip_hitch', severity: 'flag' }]
  ),

  // Squat, side-on
  scenario('squat-side-clean', 'Squat side-on, good form', SIDE, KNEE, squat(), []),
  scenario(
    'squat-side-heel-warn',
    'Squat, left heel lifts 6 px (4% torso)',
    SIDE,
    KNEE,
    squat({ heelLift: 6 }),
    [{ id: 'heel_lift', severity: 'warn' }]
  ),
  scenario(
    'squat-side-heel-flag',
    'Squat, left heel lifts 10 px (6.7% torso)',
    SIDE,
    KNEE,
    squat({ heelLift: 10 }),
    [{ id: 'heel_lift', severity: 'flag' }]
  ),
];

/** Clean movements replayed with 3 px of tracking noise: must stay clean. */
export const JITTER_SCENARIOS: CompensationScenario[] = COMPENSATION_SCENARIOS.filter(
  (s) => s.hits.length === 0 && s.id !== 'squat-front-knee-out'
).map((s) => ({ ...s, id: `${s.id}-jitter`, effects: jitter(3) }));
