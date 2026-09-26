/**
 * The patient's exercise plan: the joint of interest (and side) plus the
 * standard their physiotherapist set: a goal range, an optional "don't go past"
 * limit, repetitions and hold time.
 *
 * `applyPlan` turns a generic exercise into the patient's version: only the
 * joint of interest is tracked, and its goal phase uses the prescribed range.
 *
 * Angles: exercise rules use the interior angle at the joint (a straight elbow
 * or knee is 180°). Plans and patient-facing numbers use clinical goniometry,
 * 0° = anatomical neutral (as Sports2D/Pose2Sim compute them):
 *   - elbow, knee flexion = 180 - interior
 *   - hip flexion = 180 - interior(shoulder, hip, knee)
 *   - shoulder flexion/abduction = interior(elbow, shoulder, hip)
 */
import type {
  BodySide,
  Exercise,
  ExercisePhase,
  JointKind,
  JointRequirement,
} from '../../types/exercise';

import type { MovementProfile } from '../movement/analysis';
import type { CareEpisode } from '../care/episode';
import { movementOf } from '../movement/exerciseMovement';
import type { MovementDirection } from '../movement/types';

export type { BodySide, JointKind };

/** The standard to compare against: a recorded demonstration's movement profile. */
export interface PlanReference extends MovementProfile {
  exerciseId: string;
  /** Recorded in the app, or taken from a video file. */
  source: 'demonstration' | 'video';
  /** ISO date. */
  savedAt: string;
  /** e.g. the video's file name. */
  label?: string;
  /** YouTube video the demonstration was performed along with. */
  videoId?: string;
}

/**
 * One exercise the physiotherapist assigned, in the order it is done. Its own
 * repetitions, hold and goal replace the plan's when set; the goal is in the
 * exercise's own measure (how far to bend or raise, or how close to straight
 * for a straightening exercise) and never applies to rotation.
 */
export interface PrescribedExercise {
  exerciseId: string;
  /** Separate sessions a day (default 1): each is its own occurrence. */
  timesPerDay?: number;
  reps?: number;
  holdSeconds?: number;
  goalDegrees?: number;
}

export interface ExercisePlan {
  joint: JointKind;
  side: BodySide;
  /**
   * Clinical degrees to reach when moving the joint away from neutral: arm
   * raise for the shoulder, bend for the knee, elbow and hip (e.g. 120).
   * Not used for straightening or rotation exercises.
   */
  goalDegrees?: number;
  /**
   * Straightening exercises (seated knee extension, heel prop, short-arc
   * quad): straighten to within this many degrees of straight. Kept apart
   * from `goalDegrees`, a bend goal, so neither can stand in for the other.
   */
  extensionGoalDegrees?: number;
  /**
   * Clinical degrees not to go past (post-operative precautions), in the
   * joint's usual measure: how far the arm is raised, or the knee, elbow or
   * hip bent (see limitMovement). Not a rotation limit: rotation is only
   * estimated, so the app doesn't pose as a safety boundary for it.
   */
  limitDegrees?: number;
  reps?: number;
  holdSeconds?: number;
  /** The physio's demonstration to compare each session with. */
  reference?: PlanReference;
  /** YouTube links for exercise videos, by exercise id (shown, never analysed). */
  videos?: Record<string, string>;
  /** Today's exercises, in order (empty or missing: the patient chooses). */
  routine?: PrescribedExercise[];
  /**
   * Starts at 1 and goes up whenever the prescription changes (joint, side,
   * goals, limit, repetitions, hold or routine), so sessions done under
   * different prescriptions aren't compared as one series.
   */
  version?: number;
  /** When this version was prescribed (ISO date). */
  prescribedAt?: string;
  /** What is being treated, the phase, and whether the programme is confirmed. */
  episode?: CareEpisode;
}

export const JOINT_KINDS: { kind: JointKind; label: string; movement: string }[] = [
  { kind: 'shoulder', label: 'Shoulder', movement: 'Lifting the arm' },
  { kind: 'elbow', label: 'Elbow', movement: 'Bending the arm' },
  { kind: 'hip', label: 'Hip', movement: 'Bending at the hip' },
  { kind: 'knee', label: 'Knee', movement: 'Bending the knee' },
];

/**
 * Joints with extended support in this version: compensation checks (e.g.
 * shoulder hiking, knee moving inward) on top of the counting, range and goal
 * tracking every joint gets.
 */
export const EXTENDED_SUPPORT_JOINTS: JointKind[] = ['shoulder', 'knee'];

/** What a plan's limit restricts, in the patient's words ("raise your arm"). */
export const limitMovement = (kind: JointKind): string =>
  kind === 'shoulder' ? 'raise your arm' : `bend your ${kind}`;

export const hasExtendedSupport = (kind: JointKind) =>
  EXTENDED_SUPPORT_JOINTS.includes(kind);

export const jointKey = (side: BodySide, kind: JointKind) => `${side}_${kind}`;

/** "Left shoulder". */
export const jointLabel = (side: BodySide, kind: JointKind) =>
  `${side === 'left' ? 'Left' : 'Right'} ${kind}`;

/** The kind of joint a key like 'left_shoulder' refers to. */
export const jointKindOf = (joint: string): JointKind | undefined => {
  const kind = joint.replace(/^(left|right)_/, '');
  return JOINT_KINDS.some((j) => j.kind === kind) ? (kind as JointKind) : undefined;
};

/** Clinical angle (0 = neutral) from the interior angle. */
export const clinicalAngle = (kind: JointKind, interior: number): number =>
  kind === 'shoulder' ? interior : 180 - interior;

/** Interior angle from a clinical angle (the conversion is its own inverse). */
export const interiorAngle = (kind: JointKind, clinical: number): number =>
  kind === 'shoulder' ? clinical : 180 - clinical;

/**
 * Interior-angle range for "at least `goal`, at most `limit`" clinical degrees,
 * or for movements towards neutral "at most `goal`" (e.g. a seated knee
 * extension within 5° of straight).
 */
const goalRange = (
  kind: JointKind,
  goal: number,
  limit = 180,
  direction: MovementDirection = 'away'
) => {
  const a = interiorAngle(kind, goal);
  const b =
    direction === 'toward'
      ? interiorAngle(kind, 0)
      : interiorAngle(kind, Math.max(goal, limit));
  return { minAngle: Math.min(a, b), maxAngle: Math.max(a, b) };
};

/**
 * This phase's requirement for the joint of interest on the chosen side. A
 * one-sided rule (e.g. left hip only) is mirrored to the chosen side.
 */
const focusRequirement = (
  phase: ExercisePhase,
  kind: JointKind,
  side: BodySide
): JointRequirement | undefined => {
  const key = jointKey(side, kind);
  const same = phase.jointRequirements.find((r) => r.joint === key);
  if (same) return same;
  const other = phase.jointRequirements.find((r) => jointKindOf(r.joint) === kind);
  return other ? { ...other, joint: key } : undefined;
};

/**
 * The patient's version of an exercise. Tracks only the exercise's primary joint
 * on the plan's side; if the exercise trains the plan's joint, its goal phase
 * (the last phase) takes the prescribed range, reps and hold.
 */
export function applyPlan(exercise: Exercise, plan?: ExercisePlan | null): Exercise {
  const kind = exercise.primaryJoint;
  if (!plan || !kind) return exercise;
  const key = jointKey(plan.side, kind);
  const prescribed = kind === plan.joint;
  const goalIndex = exercise.phases.length - 1;
  // This exercise's own prescription, where the routine sets one
  const item = prescribed ? routineItem(plan, exercise.id) : undefined;
  const reps = item?.reps ?? plan.reps;
  const holdSeconds = item?.holdSeconds ?? plan.holdSeconds;

  const phases = exercise.phases.map((phase, index) => {
    const req = focusRequirement(phase, kind, plan.side);
    if (!req) return phase; // no rule for this joint: keep the phase as written
    let requirement = req;
    let holdDuration = phase.holdDuration;
    // The goal phase: the last of several, or a still hold's only phase
    if (prescribed && index === goalIndex && hasGoalPhase(exercise)) {
      // Each goal applies only to its kind of exercise: a bend goal isn't a
      // straightening goal, and neither applies to rotation
      const movement = movementOf(exercise.id);
      const goal = movement.measure
        ? undefined
        : item?.goalDegrees ??
          (movement.direction === 'toward'
            ? plan.extensionGoalDegrees
            : plan.goalDegrees);
      if (goal !== undefined) {
        const range = goalRange(kind, goal, plan.limitDegrees, movement.direction);
        requirement = {
          ...req,
          ...range,
          targetAngle: interiorAngle(kind, goal),
        };
      }
      if (holdSeconds !== undefined) holdDuration = holdSeconds * 1000;
    }
    return { ...phase, jointRequirements: [requirement], holdDuration };
  });

  return {
    ...exercise,
    phases,
    targetRepetitions: prescribed && reps ? reps : exercise.targetRepetitions,
    safetyLimit:
      prescribed && plan.limitDegrees !== undefined
        ? { joint: key, kind, maxDegrees: plan.limitDegrees }
        : undefined,
  };
}

/**
 * Whether the exercise has a phase a goal applies to: the last of several
 * (the working position), or the only phase of a still hold (heel prop). A
 * single-phase stretch without a measured hold has none.
 */
const hasGoalPhase = (exercise: Exercise) =>
  exercise.phases.length > 1 || movementOf(exercise.id).mode === 'hold';

/** The routine's prescription for an exercise, if it is in the routine. */
export const routineItem = (
  plan: ExercisePlan | null | undefined,
  exerciseId: string
): PrescribedExercise | undefined =>
  plan?.routine?.find((i) => i.exerciseId === exerciseId);

/** The joint an exercise tracks (first primary-joint rule), e.g. 'left_elbow'. */
export const trackedJoint = (exercise: Exercise): string | undefined => {
  const kind = exercise.primaryJoint;
  if (!kind) return undefined;
  for (const phase of exercise.phases) {
    const req = phase.jointRequirements.find((r) => jointKindOf(r.joint) === kind);
    if (req) return req.joint;
  }
  return undefined;
};

/** The clinical goal of an exercise's goal phase for its tracked joint. */
export const goalDegreesOf = (exercise: Exercise): number | undefined => {
  const joint = trackedJoint(exercise);
  const kind = exercise.primaryJoint;
  const goal = exercise.phases[exercise.phases.length - 1];
  const req = goal?.jointRequirements.find((r) => r.joint === joint);
  if (!req || !kind || !hasGoalPhase(exercise)) return undefined;
  const ends = [clinicalAngle(kind, req.minAngle), clinicalAngle(kind, req.maxAngle)];
  // Away from neutral, the end nearest neutral is the minimum to reach; towards
  // neutral (straightening), the end furthest from it is the most to stay at
  return movementOf(exercise.id).direction === 'toward'
    ? Math.max(...ends)
    : Math.min(...ends);
};
