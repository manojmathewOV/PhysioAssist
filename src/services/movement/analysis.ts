/**
 * Session analysis: repetitions, a movement profile, and findings compared with
 * a reference (the physio's demonstration) and/or the prescribed goal.
 *
 * Findings are reported only when seen in enough repetitions, prioritised
 * (safety first), and at most two patient cues are chosen per session.
 */
import { directionOf, movementOf, rangeViewOf } from './exerciseMovement';
import { segmentReps } from './repSegmentation';
import { StaticMeasurement, measureStaticHold } from './staticHold';
import type {
  CompensationHit,
  Finding,
  FindingId,
  MovementContext,
  MovementDirection,
  MovementFrame,
  Repetition,
} from './types';

/** A reference movement, e.g. from the physio's recorded demonstration. */
export interface MovementProfile {
  repCount: number;
  /** Typical (median) peak clinical angle. */
  peakDegrees: number;
  /** Best peak. */
  bestDegrees: number;
  /** Typical angle at rest between reps (how fully they return). */
  restDegrees: number;
  /** Typical repetition duration. */
  repDurationMs: number;
  /** Typical time held near the peak. */
  holdMs: number;
}

export interface SessionTargets {
  /** The physio's demonstration (or the patient's own supervised best). */
  reference?: MovementProfile | null;
  /** Prescribed goal, clinical degrees. */
  goalDegrees?: number;
  /** Prescribed hold, ms. */
  holdMs?: number;
}

export interface AnalysisOptions {
  /** Per-repetition compensation checks (services/movement/compensations). */
  detect?: (rep: Repetition, context: MovementContext) => CompensationHit[];
  /** Patient cue for each finding. */
  cues?: Partial<Record<FindingId, string>>;
}

export interface SessionAnalysis {
  /** For still measurements (e.g. heel-prop knee extension) the held angle. */
  hold?: StaticMeasurement | null;
  reps: Repetition[];
  profile: MovementProfile | null;
  /** All findings, most important first. */
  findings: Finding[];
  /** The one or two things to tell the patient. */
  cues: string[];
}

// Heuristic thresholds (tune with physios and the virtual-patient scenarios)
export const RANGE_WARN_RATIO = 0.85;
export const RANGE_FLAG_RATIO = 0.7;
// Healthy people vary ~10-15° in where they rest between repetitions (real recordings)
export const RETURN_SLACK_DEG = 15;
export const TOO_FAST_RATIO = 0.7;
export const HOLD_SLACK_MS = 1000;
/**
 * Towards-neutral movements (straightening a bent knee while sitting): the
 * active extension deficit (degrees short of straight, or of the goal or
 * demonstration) reported above these. Not "extension lag": lag is the
 * difference between passive and active extension and needs both measured.
 */
export const EXTENSION_DEFICIT_WARN_DEG = 10;
export const EXTENSION_DEFICIT_FLAG_DEG = 20;
/**
 * Passive extension deficit (knee resting with the heel propped): above these
 * it is reported. A few degrees of flexion contracture already affects gait.
 */
export const PASSIVE_DEFICIT_WARN_DEG = 5;
export const PASSIVE_DEFICIT_FLAG_DEG = 10;

/** Safety-related problems are raised before anything else. */
const PRIORITY: FindingId[] = [
  'camera_view',
  'back_arch',
  'knee_valgus',
  'trunk_side_lean',
  'trunk_forward_lean',
  'trunk_rotation',
  'shoulder_hike',
  'hip_hitch',
  'pelvic_shift',
  'lean_back',
  'thigh_lift',
  'elbow_bend',
  'heel_lift',
  'forward_head',
  'head_tilt',
  'reduced_range',
  'incomplete_return',
  'too_fast',
  'short_hold',
];

const DEFAULT_CUES: Record<FindingId, string> = {
  reduced_range: 'Try to go a little further, if it’s comfortable.',
  incomplete_return: 'Come all the way back to the start each time.',
  too_fast: 'Try moving a bit more slowly and smoothly.',
  short_hold: 'Hold the position a little longer.',
  shoulder_hike: 'Keep your shoulder relaxed and down, away from your ear.',
  trunk_side_lean: 'Stay tall and straight; try not to lean to the side.',
  trunk_rotation: 'Keep your chest facing the camera.',
  back_arch: 'Gently tighten your tummy and keep your back from arching.',
  elbow_bend: 'Keep your elbow straight, like a long arm.',
  knee_valgus: 'Your knee moved inward. Keep it in line with your toes.',
  hip_hitch: 'Keep your hips level as you move.',
  heel_lift: 'Keep your heels down on the floor.',
  forward_head: 'Keep your head tall, with your chin gently tucked.',
  head_tilt: 'Keep your head level and relaxed.',
  trunk_forward_lean: 'Keep your body upright; let your arm do the work.',
  pelvic_shift: 'Try to keep your weight evenly on both feet.',
  lean_back: 'Sit tall; try not to lean back as you straighten your knee.',
  thigh_lift: 'Keep the back of your thigh resting down; let your knee do the work.',
  camera_view: 'Turn so your side faces the camera, then we can measure your movement.',
};

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function profileOf(
  reps: Repetition[],
  direction: MovementDirection = 'away'
): MovementProfile | null {
  if (reps.length === 0) return null;
  const peaks = reps.map((r) => r.peakDegrees);
  return {
    repCount: reps.length,
    peakDegrees: Math.round(median(peaks)),
    bestDegrees: Math.round(
      direction === 'toward' ? Math.min(...peaks) : Math.max(...peaks)
    ),
    restDegrees: Math.round(median(reps.map((r) => r.restDegrees))),
    repDurationMs: Math.round(median(reps.map((r) => r.endT - r.startT))),
    holdMs: Math.round(median(reps.map((r) => r.holdMs))),
  };
}

/** A problem must show up in 2 reps (or the only rep) to be reported. */
const enoughReps = (seen: number, total: number) => seen >= Math.min(2, total);

/** Build a reference profile from a recorded demonstration. */
export const buildReference = (
  frames: MovementFrame[],
  direction: MovementDirection = 'away'
) => profileOf(segmentReps(frames, { direction }), direction);

export function analyseSession(
  frames: MovementFrame[],
  context: MovementContext,
  targets: SessionTargets = {},
  { detect, cues = {} }: AnalysisOptions = {}
): SessionAnalysis {
  const direction = directionOf(context);
  const movement = movementOf(context.exerciseId);
  if (movement.mode === 'hold') return analyseHold(frames, context, targets, cues);
  const lowerLimb = context.joint === 'knee' || context.joint === 'hip';
  const segmented = segmentReps(frames, {
    fallback: lowerLimb && direction === 'away' ? 'hipDrop' : undefined,
    direction,
  });
  // A seated exercise's repetitions start seated: movement after standing up
  // (or before sitting down) isn't a repetition
  const reps = (
    movement.posture === 'seated'
      ? segmented.filter((r) => !['standing', 'lying'].includes(r.baseline.posture ?? ''))
      : segmented
  ).map((r, index) => ({ ...r, index }));
  const profile = profileOf(reps, direction);

  // Side-view exercises: the patient's joint (e.g. the operated knee) must be
  // the one nearer the camera, or it is hidden behind the other
  const sideFrames = frames.filter((f) => f.view === 'side' && f.nearSide);
  const farSide =
    rangeViewOf(context.exerciseId) === 'side' &&
    sideFrames.length > 0 &&
    sideFrames.filter((f) => f.nearSide !== context.side).length > sideFrames.length / 2;
  const setup: Finding[] = farSide
    ? [
        {
          id: 'camera_view',
          severity: 'warn',
          cue: `Turn around so your ${context.side} ${
            context.joint === 'knee' || context.joint === 'hip' ? 'leg' : 'arm'
          } is closest to the phone.`,
          detail: `Your ${context.side} ${context.joint} was on the far side, hidden behind the other one.`,
          reps: reps.map((r) => r.index),
        },
      ]
    : [];
  const cueFor = (id: FindingId) => cues[id] ?? DEFAULT_CUES[id];
  const findings: Finding[] = [];
  findings.push(...setup);
  if (!profile) return { reps, profile, findings, cues: findings.map((f) => f.cue) };

  const joint = `${context.side} ${context.joint}`;
  const ref = targets.reference;
  const all = reps.map((r) => r.index);

  // Filmed from the wrong angle, the range can't be judged (a knee bending
  // towards the camera looks straighter than it is): say how to set up instead
  const views = reps.map((r) => r.baseline.view).filter((v) => v !== 'unknown');
  const inView = (v: string | undefined) =>
    v !== undefined &&
    views.length > 0 &&
    views.filter((x) => x === v).length >= views.length / 2;
  // Range needs its view; set-up guidance only when the whole exercise does
  const rangeView = rangeViewOf(context.exerciseId);
  const wrongView = rangeView !== undefined && views.length > 0 && !inView(rangeView);
  if (
    movement.view !== undefined &&
    views.length > 0 &&
    !inView(movement.view) &&
    !farSide
  ) {
    findings.push({
      id: 'camera_view',
      severity: 'warn',
      cue: cueFor('camera_view'),
      detail: `This exercise is measured from the ${movement.view}; it was filmed from ${
        views.includes('oblique') ? 'an angle' : `the ${views[0]}`
      }, so the range isn't judged.`,
      reps: all,
    });
  }

  // Towards neutral: how far short of straight (or of the goal/demonstration)
  if (direction === 'toward' && !wrongView) {
    const aim = ref?.peakDegrees ?? targets.goalDegrees ?? 0;
    const deficit = profile.peakDegrees - aim;
    if (deficit > EXTENSION_DEFICIT_WARN_DEG) {
      findings.push({
        id: 'reduced_range',
        severity: deficit > EXTENSION_DEFICIT_FLAG_DEG ? 'flag' : 'warn',
        cue: `Try to straighten your ${context.joint} a little more, if it's comfortable.`,
        detail: `Active extension deficit: your ${joint} straightened to about ${profile.peakDegrees}°; ${
          ref
            ? `the demonstration reached ${Math.round(aim)}°`
            : aim === 0
              ? 'fully straight is 0°'
              : `your goal is ${Math.round(aim)}°`
        }.`,
        reps: reps
          .filter((r) => r.peakDegrees - aim > EXTENSION_DEFICIT_WARN_DEG)
          .map((r) => r.index),
      });
    }
  }

  // Range: against the demonstration, else against the prescribed goal
  const target =
    direction === 'away' ? ref?.peakDegrees ?? targets.goalDegrees : undefined;
  if (target && profile.peakDegrees < target * RANGE_WARN_RATIO) {
    findings.push({
      id: 'reduced_range',
      severity: profile.peakDegrees < target * RANGE_FLAG_RATIO ? 'flag' : 'warn',
      cue: cueFor('reduced_range'),
      detail: `Your ${joint} reached about ${profile.peakDegrees}°; ${
        ref ? 'the demonstration reached' : 'your goal is'
      } ${Math.round(target)}°.`,
      reps: reps
        .filter((r) => r.peakDegrees < target * RANGE_WARN_RATIO)
        .map((r) => r.index),
    });
  }

  // Coming back to the start (e.g. fully straightening the knee or elbow)
  // Without a demonstration, compare with the patient's own usual return today
  // (a natural rest is rarely exactly 0°, and some exercises, like a press,
  // rest part-way: the median catches the repetitions that stopped short)
  const restTarget = ref?.restDegrees ?? median(reps.map((r) => r.restDegrees));
  // (Towards neutral, the start is a bent position: returning less is no fault)
  const shortReturns =
    direction === 'toward' || wrongView
      ? []
      : reps.filter((r) => r.restDegrees > restTarget + RETURN_SLACK_DEG);
  if (enoughReps(shortReturns.length, reps.length)) {
    const straighten = context.joint === 'knee' || context.joint === 'elbow';
    findings.push({
      id: 'incomplete_return',
      severity: 'warn',
      cue: straighten
        ? `Try to straighten your ${context.joint} all the way each time.`
        : cueFor('incomplete_return'),
      detail: `In ${shortReturns.length} of ${reps.length} repetitions your ${joint} stayed about ${Math.round(
        median(shortReturns.map((r) => r.restDegrees)) - restTarget
      )}° short of ${ref ? 'the starting position in the demonstration' : 'your usual starting position'}.`,
      reps: shortReturns.map((r) => r.index),
    });
  }

  // Tempo, compared with the demonstration
  if (ref && profile.repDurationMs < ref.repDurationMs * TOO_FAST_RATIO) {
    findings.push({
      id: 'too_fast',
      severity: 'warn',
      cue: cueFor('too_fast'),
      detail: `Each repetition took about ${(profile.repDurationMs / 1000).toFixed(
        1
      )} s; the demonstration took ${(ref.repDurationMs / 1000).toFixed(1)} s.`,
      reps: all,
    });
  }

  // Holding at the top
  const holdTarget = targets.holdMs ?? ref?.holdMs;
  if (
    holdTarget &&
    holdTarget > HOLD_SLACK_MS &&
    profile.holdMs < holdTarget - HOLD_SLACK_MS
  ) {
    findings.push({
      id: 'short_hold',
      severity: 'warn',
      cue: cueFor('short_hold'),
      detail: `You held for about ${(profile.holdMs / 1000).toFixed(1)} s; the aim is ${(
        holdTarget / 1000
      ).toFixed(0)} s.`,
      reps: all,
    });
  }

  // Compensations: per repetition, reported when they recur
  if (detect) {
    const byId = new Map<FindingId, { reps: number[]; worst: CompensationHit }>();
    for (const rep of reps) {
      for (const hit of detect(rep, context)) {
        const entry = byId.get(hit.id);
        if (!entry) byId.set(hit.id, { reps: [rep.index], worst: hit });
        else {
          entry.reps.push(rep.index);
          // Units differ per detector (for rotation lower is worse): rank by severity
          if (hit.severity === 'flag') entry.worst = hit;
        }
      }
    }
    byId.forEach(({ reps: seen, worst }, id) => {
      if (!enoughReps(seen.length, reps.length)) return;
      findings.push({
        id,
        severity: worst.severity,
        cue: cueFor(id),
        detail: `Seen in ${seen.length} of ${reps.length} repetitions.`,
        reps: seen,
      });
    });
  }

  findings.sort(
    (a, b) =>
      (a.severity === b.severity ? 0 : a.severity === 'flag' ? -1 : 1) ||
      PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id)
  );
  return { reps, profile, findings, cues: findings.slice(0, 2).map((f) => f.cue) };
}

/**
 * A still measurement: the knee (or other joint) held at rest, measured over
 * its steadiest stretch. For straightening, reported as a passive extension
 * deficit; never as "extension lag", which needs a passive and an active
 * measurement to compare.
 */
function analyseHold(
  frames: MovementFrame[],
  context: MovementContext,
  targets: SessionTargets,
  cues: Partial<Record<FindingId, string>>
): SessionAnalysis {
  const direction = directionOf(context);
  const movement = movementOf(context.exerciseId);
  const cueFor = (id: FindingId) => cues[id] ?? DEFAULT_CUES[id];
  const findings: Finding[] = [];
  const joint = `${context.side} ${context.joint}`;

  const views = frames.map((f) => f.view).filter((v) => v !== 'unknown');
  const sideFrames = frames.filter((f) => f.view === 'side' && f.nearSide);
  if (
    movement.view !== undefined &&
    views.length > 0 &&
    views.filter((v) => v === movement.view).length < views.length / 2
  ) {
    findings.push({
      id: 'camera_view',
      severity: 'warn',
      cue: cueFor('camera_view'),
      detail: `This is measured from the ${movement.view}.`,
      reps: [],
    });
  } else if (
    sideFrames.length > 0 &&
    sideFrames.filter((f) => f.nearSide !== context.side).length > sideFrames.length / 2
  ) {
    findings.push({
      id: 'camera_view',
      severity: 'warn',
      cue: `Turn around so your ${context.side} leg is closest to the phone.`,
      detail: `Your ${joint} was on the far side, hidden behind the other one.`,
      reps: [],
    });
  }

  const hold = findings.length ? null : measureStaticHold(frames, direction);
  if (!findings.length && !hold) {
    findings.push({
      id: 'short_hold',
      severity: 'warn',
      cue: 'Rest your leg still and relaxed for a few seconds so it can be measured.',
      detail: 'Your leg didn’t stay still long enough to measure.',
      reps: [],
    });
  }
  if (hold && direction === 'toward') {
    const aim = targets.goalDegrees ?? 0;
    const deficit = hold.degrees - aim;
    if (deficit > PASSIVE_DEFICIT_WARN_DEG) {
      findings.push({
        id: 'reduced_range',
        severity: deficit > PASSIVE_DEFICIT_FLAG_DEG ? 'flag' : 'warn',
        cue: 'Let your knee relax and sink towards straight.',
        detail: `Passive extension deficit: resting, your ${joint} was about ${Math.round(
          hold.degrees
        )}° short of straight${aim ? ` (your goal is ${Math.round(aim)}°)` : ''}.`,
        reps: [],
      });
    }
  }
  return { hold, reps: [], profile: null, findings, cues: findings.map((f) => f.cue) };
}
