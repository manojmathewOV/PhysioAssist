/**
 * Compensation detectors: visible ways a movement is helped along in a home
 * exercise (shrugging, leaning, twisting, arching, bending the elbow, the knee
 * moving inward, the pelvis tipping or shifting, rising onto the toes, the head
 * poking forward or tilting). They describe what was seen, never a cause.
 *
 * Every check compares a repetition with the patient's own rest posture at its
 * start (never with a model body or an absolute norm), in distances normalised
 * by their torso length (shoulder width for the shrug), and only reports a problem that held for a while (not a one-frame
 * tracking glitch). Each check needs the camera view it can actually see:
 * sideways movements need the camera in front, forward/backward ones need it
 * side-on; with the wrong view or hidden landmarks a detector returns null.
 *
 * All thresholds are heuristic starting points, to be tuned with a physio.
 */
import type { PoseLandmark } from '../../types/pose';
import { findLandmark } from '../pose/landmarkLookup';
import type { BodySide, JointKind } from '../pose/exercisePlan';
import type {
  CameraView,
  CompensationDetector,
  CompensationHit,
  FindingId,
  MovementContext,
  MovementFrame,
  Repetition,
} from './types';

/** Landmarks below this visibility are treated as not seen. */
export const MIN_VISIBILITY = 0.5;
/** A compensation must hold continuously this long within a rep. Heuristic. */
export const MIN_DURATION_MS = 300;
/** Rest frames right after the rep starts that are pooled with the baseline. */
export const BASELINE_WINDOW_MS = 150;
/** Per-frame values are median-filtered over this many frames (tracking noise). */
const SMOOTHING_FRAMES = 5;

// Thresholds (heuristic; tune with physio). Distances in % of torso length
// unless stated otherwise.
/**
 * Shoulder hike: rise of the working shoulder beyond the normal rise for the
 * arm angle (NORMAL_SHOULDER_RISE), as a share of the rest shoulder width.
 */
export const SHOULDER_HIKE_WARN = 0.08;
export const SHOULDER_HIKE_FLAG = 0.12;
/**
 * Normal rise of the working shoulder with arm elevation (the shoulder girdle
 * elevates as the arm goes up), as a share of the rest shoulder width, by
 * clinical shoulder angle: the median over 7,108 frames of healthy expert
 * performers facing the camera (MobiPhysio inspection participants,
 * physiotherapist scores 64-100). The 97th percentile sat 0.08-0.11 above it,
 * so the thresholds above only catch rises outside the healthy range.
 */
export const NORMAL_SHOULDER_RISE: [number, number][] = [
  [0, 0],
  [45, 0.035],
  [75, 0.084],
  [105, 0.126],
  [135, 0.159],
  [165, 0.189],
];

/** Normal shoulder rise at a clinical shoulder angle (linear between points). */
export function normalShoulderRise(angle: number): number {
  const table = NORMAL_SHOULDER_RISE;
  if (angle <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [a1, r1] = table[i];
    if (angle <= a1) {
      const [a0, r0] = table[i - 1];
      return r0 + ((r1 - r0) * (angle - a0)) / (a1 - a0);
    }
  }
  return table[table.length - 1][1];
}
export const TRUNK_SIDE_LEAN_WARN_DEG = 8;
export const TRUNK_SIDE_LEAN_FLAG_DEG = 12;
/** Shoulder width (relative to hip width) as a share of the rest width. */
export const TRUNK_ROTATION_WARN_RATIO = 0.85;
export const TRUNK_ROTATION_FLAG_RATIO = 0.75;
/**
 * Above this shoulder angle MediaPipe's shoulder points slide towards the neck
 * (the shoulder girdle elevates), which reads as the trunk turning: healthy
 * people pressing overhead were flagged. Such frames are skipped.
 */
export const TRUNK_ROTATION_MAX_ARM_DEG = 100;
export const BACK_ARCH_WARN_DEG = 10;
export const BACK_ARCH_FLAG_DEG = 15;
export const TRUNK_FORWARD_LEAN_WARN_DEG = 10;
export const TRUNK_FORWARD_LEAN_FLAG_DEG = 15;
export const HEAD_TILT_WARN_DEG = 8;
export const HEAD_TILT_FLAG_DEG = 12;
export const ELBOW_BEND_WARN_DEG = 20;
export const ELBOW_BEND_FLAG_DEG = 35;
/** Forearms shorter than this share of their rest length point at the camera. */
export const FOREARM_FORESHORTENED_RATIO = 0.8;
export const KNEE_VALGUS_WARN = 5;
export const KNEE_VALGUS_FLAG = 8;
export const HIP_HITCH_WARN = 5;
export const HIP_HITCH_FLAG = 8;
export const PELVIC_SHIFT_WARN = 6;
export const PELVIC_SHIFT_FLAG = 10;
export const HEEL_LIFT_WARN = 3;
export const HEEL_LIFT_FLAG = 5;
/** Toes must stay within this of their rest height (else it isn't a heel lift). */
export const HEEL_LIFT_MAX_TOE_MOVE = 2;
export const FORWARD_HEAD_WARN = 8;
export const FORWARD_HEAD_FLAG = 12;

/** Short, kind cues for the patient (read aloud and shown on screen). */
export const PATIENT_CUES: Record<FindingId, string> = {
  reduced_range: "Try to go a little further, if it's comfortable.",
  incomplete_return: 'Come all the way back to the start each time.',
  too_fast: 'Try moving a bit more slowly and smoothly.',
  short_hold: 'Hold the position a little longer.',
  shoulder_hike: 'Keep your shoulder relaxed and down, away from your ear.',
  trunk_side_lean: 'Try to keep your body upright, without leaning to the side.',
  trunk_rotation: 'Keep your chest facing forward, without twisting.',
  back_arch: 'Keep your back straight and your tummy gently tight.',
  elbow_bend: 'Keep your arm straight as you lift it.',
  knee_valgus: 'Your knee moved inward. Keep it in line with your toes.',
  hip_hitch: 'Keep your hips level as you move.',
  heel_lift: 'Keep your heels on the floor.',
  forward_head: 'Keep your head tall, with your chin gently tucked in.',
  head_tilt: 'Keep your head level and relaxed.',
  trunk_forward_lean: 'Keep your body upright; let your arm do the work.',
  pelvic_shift: 'Try to keep your weight evenly on both feet.',
};

const LEG_CHECKS: FindingId[] = [
  'trunk_side_lean',
  'trunk_rotation',
  'knee_valgus',
  'hip_hitch',
  'pelvic_shift',
  'heel_lift',
];

/**
 * Which checks apply to each joint's exercises: only movements that are a
 * compensation there (e.g. leaning forward is part of a squat, not an error).
 */
export const DETECTORS_FOR: Record<JointKind, FindingId[]> = {
  shoulder: [
    'shoulder_hike',
    'trunk_side_lean',
    'trunk_rotation',
    'back_arch',
    'trunk_forward_lean',
    'elbow_bend',
    'forward_head',
    'head_tilt',
  ],
  elbow: [
    'trunk_side_lean',
    'trunk_rotation',
    'trunk_forward_lean',
    'forward_head',
    'head_tilt',
  ],
  hip: LEG_CHECKS,
  knee: LEG_CHECKS,
};

/** Per-exercise exceptions: checks that are part of that exercise's movement. */
export const NOT_FOR_EXERCISE: Record<string, FindingId[]> = {
  // The leg is lifted onto a step, so the heel leaves the floor by design
  'hamstring-stretch': ['heel_lift'],
  // Bending the elbows is part of a press
  'shoulder-press': ['elbow_bend'],
};

/**
 * Exercises with both feet planted. The knee and pelvis checks need that: on
 * real recordings of healthy people (Clemente et al. 2024) a moving leg drags
 * the ankle midpoint and MediaPipe's hip point with it, so in hip abduction
 * "pelvis shifting" measured a median 62% of torso length and "pelvis not
 * level" 11%, flagging nearly every repetition.
 */
export const WEIGHT_BEARING_EXERCISES = ['squat', 'sit-to-stand', 'lunge', 'step-up'];
const NEEDS_PLANTED_FEET: FindingId[] = ['knee_valgus', 'hip_hitch', 'pelvic_shift'];

/** Whether a check applies to this exercise. */
export const appliesTo = (id: FindingId, { joint, exerciseId }: MovementContext) =>
  DETECTORS_FOR[joint].includes(id) &&
  !(exerciseId && NOT_FOR_EXERCISE[exerciseId]?.includes(id)) &&
  !(
    NEEDS_PLANTED_FEET.includes(id) &&
    exerciseId &&
    !WEIGHT_BEARING_EXERCISES.includes(exerciseId)
  );

type Pt = { x: number; y: number };
type Level = 0 | 1 | 2;

const DEG = 180 / Math.PI;
const other = (side: BodySide): BodySide => (side === 'left' ? 'right' : 'left');

/** A landmark the model actually saw. */
function seen(lms: PoseLandmark[], name: string): Pt | undefined {
  const lm = findLandmark(lms, name);
  return lm && lm.visibility >= MIN_VISIBILITY ? lm : undefined;
}

/** Both landmarks of a left/right pair (needed for widths and levels). */
function pair(lms: PoseLandmark[], part: string): [Pt, Pt] | undefined {
  const l = seen(lms, `left_${part}`);
  const r = seen(lms, `right_${part}`);
  return l && r ? [l, r] : undefined;
}

/** Centre of the visible landmarks of a pair (side-on, one side may be hidden). */
function centre(lms: PoseLandmark[], part: string): Pt | undefined {
  const pts = [seen(lms, `left_${part}`), seen(lms, `right_${part}`)].filter(
    (p): p is Pt => p !== undefined
  );
  if (pts.length === 0) return undefined;
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Interior angle at b (degrees). */
function interior(a: Pt, b: Pt, c: Pt): number | null {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const n = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (n === 0) return null;
  const cos = (v1.x * v2.x + v1.y * v2.y) / n;
  return Math.acos(Math.max(-1, Math.min(1, cos))) * DEG;
}

/** Unit vector from mid-hip up to mid-shoulder (the trunk's own "up"). */
function trunkUp(lms: PoseLandmark[]): Pt | undefined {
  const s = centre(lms, 'shoulder');
  const h = centre(lms, 'hip');
  if (!s || !h) return undefined;
  const len = dist(s, h);
  return len > 0 ? { x: (s.x - h.x) / len, y: (s.y - h.y) / len } : undefined;
}

/** Mid-shoulder to mid-hip length: the unit for distances. */
function torsoLength(lms: PoseLandmark[]): number | undefined {
  const s = centre(lms, 'shoulder');
  const h = centre(lms, 'hip');
  const len = s && h ? dist(s, h) : 0;
  return len > 0 ? len : undefined;
}

/** +1 when the patient faces +x in the image, -1 for -x (side view). */
function facing(lms: PoseLandmark[]): 1 | -1 | undefined {
  for (const side of ['left', 'right']) {
    const heel = seen(lms, `${side}_heel`);
    const toe = seen(lms, `${side}_foot_index`);
    if (heel && toe && toe.x !== heel.x) return toe.x > heel.x ? 1 : -1;
  }
  const nose = seen(lms, 'nose');
  const s = centre(lms, 'shoulder');
  if (nose && s && nose.x !== s.x) return nose.x > s.x ? 1 : -1;
  return undefined;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1; // eslint-disable-line no-bitwise
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * The rest posture: the baseline frame pooled with the first rest frames of the
 * rep (landmark-wise median), so one noisy frame doesn't shift every check.
 */
function restLandmarks(rep: Repetition): PoseLandmark[] {
  const pool = [
    rep.baseline,
    ...rep.frames.filter(
      (f) =>
        f !== rep.baseline &&
        f.view === rep.baseline.view &&
        f.t <= rep.startT + BASELINE_WINDOW_MS
    ),
  ];
  if (pool.length === 1) return rep.baseline.landmarks;
  return rep.baseline.landmarks.map((lm) => {
    if (!lm || lm.visibility < MIN_VISIBILITY) return lm;
    const pts = pool
      .map((f) => seen(f.landmarks, lm.name))
      .filter((p): p is Pt => p !== undefined);
    return { ...lm, x: median(pts.map((p) => p.x)), y: median(pts.map((p) => p.y)) };
  });
}

/**
 * The camera view the rep was filmed from: the view at rest (where the camera
 * was set up), else the view of most frames. Per-frame views aren't used
 * because a compensation can fool them: a trunk turned 45° looks side-on.
 */
function repView(rep: Repetition): CameraView {
  if (rep.baseline.view !== 'unknown') return rep.baseline.view;
  const counts = new Map<CameraView, number>();
  for (const f of rep.frames) counts.set(f.view, (counts.get(f.view) ?? 0) + 1);
  let best: CameraView = rep.baseline.view;
  for (const [view, n] of counts) {
    if (n > (counts.get(best) ?? 0)) best = view;
  }
  return best;
}

interface Check {
  id: FindingId;
  unit: CompensationHit['unit'];
  views: CameraView[];
  /**
   * Per-rep setup from the rest posture. Returns the per-frame measurement
   * (bigger = worse, in `unit`, null when it can't be measured), or null when
   * the rest posture itself can't be measured.
   */
  setup: (
    rest: PoseLandmark[],
    ctx: MovementContext
  ) => ((frame: MovementFrame) => number | null) | null;
  /** Severity of a value in a frame. */
  level: (value: number, frame: MovementFrame, ctx: MovementContext) => Level;
  /** Value to report (defaults to the measurement). */
  report?: (value: number) => number;
}

const byThreshold =
  (warn: number, flag: number) =>
  (v: number): Level =>
    v > flag ? 2 : v > warn ? 1 : 0;

/** Running median over consecutive measured frames (nulls split the runs). */
function smooth(values: (number | null)[]): (number | null)[] {
  const half = SMOOTHING_FRAMES >> 1; // eslint-disable-line no-bitwise
  return values.map((v, i) => {
    if (v === null) return null;
    const win: number[] = [v];
    for (let j = i - 1; j >= i - half && values[j] != null; j--) win.push(values[j]!);
    for (let j = i + 1; j <= i + half && values[j] != null; j++) win.push(values[j]!);
    return median(win);
  });
}

/** Longest run of frames at or above `min` level: duration and worst value. */
function longestRun(
  frames: MovementFrame[],
  values: (number | null)[],
  levels: Level[],
  min: Level
): { durationMs: number; peak: number } | null {
  let best: { durationMs: number; peak: number } | null = null;
  let start = -1;
  let peak = -Infinity;
  for (let i = 0; i <= frames.length; i++) {
    const on = i < frames.length && values[i] !== null && levels[i] >= min;
    if (on) {
      if (start < 0) start = i;
      peak = Math.max(peak, values[i]!);
    } else if (start >= 0) {
      const durationMs = frames[i - 1].t - frames[start].t;
      if (!best || durationMs > best.durationMs) best = { durationMs, peak };
      start = -1;
      peak = -Infinity;
    }
  }
  return best;
}

function makeDetector(check: Check): CompensationDetector {
  return (rep, ctx) => {
    if (!appliesTo(check.id, ctx)) return null;
    const view = repView(rep);
    if (!check.views.includes(view) || rep.frames.length === 0) return null;
    const measure = check.setup(restLandmarks(rep), ctx);
    if (!measure) return null;
    const values = smooth(rep.frames.map((f) => measure(f)));
    const levels = values.map((v, i) =>
      v === null ? 0 : check.level(v, rep.frames[i], ctx)
    );
    for (const severity of ['flag', 'warn'] as const) {
      const run = longestRun(rep.frames, values, levels, severity === 'flag' ? 2 : 1);
      if (run && run.durationMs >= MIN_DURATION_MS) {
        const value = check.report ? check.report(run.peak) : run.peak;
        return {
          id: check.id,
          severity,
          value: Math.round(value * 100) / 100,
          unit: check.unit,
          durationMs: Math.round(run.durationMs),
        };
      }
    }
    return null;
  };
}

/** Clinical shoulder angle (elbow-shoulder-hip) of the frame's working arm. */
function shoulderAngle(frame: MovementFrame, ctx: MovementContext): number | null {
  if (ctx.joint === 'shoulder' && frame.angle !== null) return frame.angle;
  const e = seen(frame.landmarks, `${ctx.side}_elbow`);
  const s = seen(frame.landmarks, `${ctx.side}_shoulder`);
  const h = seen(frame.landmarks, `${ctx.side}_hip`);
  return e && s && h ? interior(e, s, h) : null;
}

/**
 * Shoulder hike (front): the working shoulder shrugs up towards the ear. To
 * avoid false alarms, all three must agree (the smallest counts), in shares of
 * the rest shoulder width:
 *  - the ear-to-shoulder gap shrinks (along the trunk, so a side lean isn't a shrug),
 *  - the shoulder rises relative to the other shoulder,
 *  - the shoulder rises relative to the mid-hip (so moving the whole body isn't).
 * The normal rise for the arm angle is subtracted: raising the arm overhead
 * lifts a healthy shoulder by about 0.19 of its width.
 */
export const detectShoulderHike = makeDetector({
  id: 'shoulder_hike',
  unit: 'ratio',
  views: ['front'],
  setup: (rest, ctx) => {
    const { side } = ctx;
    const heights = (lms: PoseLandmark[]) => {
      const ear = seen(lms, `${side}_ear`);
      const work = seen(lms, `${side}_shoulder`);
      const otherShoulder = seen(lms, `${other(side)}_shoulder`);
      const hip = centre(lms, 'hip');
      const up = trunkUp(lms);
      if (!ear || !work || !otherShoulder || !hip || !up) return null;
      return {
        earGap: (ear.x - work.x) * up.x + (ear.y - work.y) * up.y,
        overOther: otherShoulder.y - work.y,
        overHip: hip.y - work.y,
      };
    };
    const shoulders = pair(rest, 'shoulder');
    const width = shoulders ? dist(shoulders[0], shoulders[1]) : 0;
    const base = heights(rest);
    if (!width || !base) return null;
    return (f) => {
      const h = heights(f.landmarks);
      const angle = shoulderAngle(f, ctx);
      if (!h || angle === null) return null;
      const rise =
        Math.min(
          base.earGap - h.earGap,
          h.overOther - base.overOther,
          h.overHip - base.overHip
        ) / width;
      return rise - normalShoulderRise(angle);
    };
  },
  level: byThreshold(SHOULDER_HIKE_WARN, SHOULDER_HIKE_FLAG),
});

/**
 * Head tilt (front): the ear-to-ear line (or eye-to-eye, if the ears are
 * hidden) tips from its rest angle.
 */
export const detectHeadTilt = makeDetector({
  id: 'head_tilt',
  unit: 'deg',
  views: ['front'],
  setup: (rest) => {
    const part = pair(rest, 'ear') ? 'ear' : 'eye';
    const tilt = (lms: PoseLandmark[]) => {
      const p = pair(lms, part);
      if (!p) return null;
      const [l, r] = p;
      // Left minus right, so the angle is continuous around level
      return Math.atan2(l.y - r.y, l.x - r.x) * DEG;
    };
    const base = tilt(rest);
    if (base === null) return null;
    return (f) => {
      const a = tilt(f.landmarks);
      if (a === null) return null;
      const d = Math.abs(a - base) % 360;
      return d > 180 ? 360 - d : d;
    };
  },
  level: byThreshold(HEAD_TILT_WARN_DEG, HEAD_TILT_FLAG_DEG),
});

/** Trunk side lean (front): mid-hip -> mid-shoulder tilts from its rest angle. */
export const detectTrunkSideLean = makeDetector({
  id: 'trunk_side_lean',
  unit: 'deg',
  views: ['front'],
  setup: (rest) => {
    const tilt = (lms: PoseLandmark[]) => {
      const up = trunkUp(lms);
      return up ? Math.atan2(up.x, -up.y) * DEG : null;
    };
    const base = tilt(rest);
    if (base === null) return null;
    return (f) => {
      const a = tilt(f.landmarks);
      return a === null ? null : Math.abs(a - base);
    };
  },
  level: byThreshold(TRUNK_SIDE_LEAN_WARN_DEG, TRUNK_SIDE_LEAN_FLAG_DEG),
});

/**
 * Trunk rotation (front): the shoulders look narrower than at rest. Divided by
 * the hips' change, so stepping towards or away from the camera cancels out
 * (and turning the whole body is not a trunk twist).
 */
export const detectTrunkRotation = makeDetector({
  id: 'trunk_rotation',
  unit: 'ratio',
  views: ['front'],
  setup: (rest, ctx) => {
    const widths = (lms: PoseLandmark[]) => {
      const s = pair(lms, 'shoulder');
      const h = pair(lms, 'hip');
      if (!s || !h) return null;
      const sw = Math.abs(s[0].x - s[1].x);
      const hw = Math.abs(h[0].x - h[1].x);
      return sw > 0 && hw > 0 ? { sw, hw } : null;
    };
    const base = widths(rest);
    if (!base) return null;
    // Measured as the lost share (1 - ratio), so bigger is worse
    return (f) => {
      if (
        f.angle !== null &&
        f.angle > TRUNK_ROTATION_MAX_ARM_DEG &&
        ctx.joint === 'shoulder'
      ) {
        return null;
      }
      const w = widths(f.landmarks);
      return w ? 1 - w.sw / base.sw / (w.hw / base.hw) : null;
    };
  },
  level: byThreshold(1 - TRUNK_ROTATION_WARN_RATIO, 1 - TRUNK_ROTATION_FLAG_RATIO),
  report: (lost) => 1 - lost,
});

/** Side view: trunk tilt towards the way the patient faces, minus rest (degrees). */
function forwardTiltChange(
  rest: PoseLandmark[]
): ((frame: MovementFrame) => number | null) | null {
  const dirn = facing(rest);
  if (!dirn) return null;
  const tilt = (lms: PoseLandmark[]) => {
    const up = trunkUp(lms);
    return up ? Math.atan2(up.x * dirn, -up.y) * DEG : null;
  };
  const base = tilt(rest);
  if (base === null) return null;
  return (f) => {
    const a = tilt(f.landmarks);
    return a === null ? null : a - base;
  };
}

/**
 * Back arch (side, overhead arm work): the trunk tips backward, away from the
 * way the patient faces, to get the arm higher.
 */
export const detectBackArch = makeDetector({
  id: 'back_arch',
  unit: 'deg',
  views: ['side'],
  setup: (rest) => {
    const change = forwardTiltChange(rest);
    return change
      ? (f) => {
          const c = change(f);
          return c === null ? null : -c;
        }
      : null;
  },
  level: byThreshold(BACK_ARCH_WARN_DEG, BACK_ARCH_FLAG_DEG),
});

/** Trunk forward lean (side, arm exercises): bending forward to help the arm. */
export const detectTrunkForwardLean = makeDetector({
  id: 'trunk_forward_lean',
  unit: 'deg',
  views: ['side'],
  setup: forwardTiltChange,
  level: byThreshold(TRUNK_FORWARD_LEAN_WARN_DEG, TRUNK_FORWARD_LEAN_FLAG_DEG),
});

/**
 * Elbow bend (shoulder raises, either view): the arm should stay straight.
 * Frames where the forearm points at the camera (foreshortened) are skipped.
 */
export const detectElbowBend = makeDetector({
  id: 'elbow_bend',
  unit: 'deg',
  views: ['side', 'front'],
  setup: (rest, { side }) => {
    const arm = (lms: PoseLandmark[]) => {
      const s = seen(lms, `${side}_shoulder`);
      const e = seen(lms, `${side}_elbow`);
      const w = seen(lms, `${side}_wrist`);
      const inner = s && e && w ? interior(s, e, w) : null;
      return inner === null ? null : { flexion: 180 - inner, forearm: dist(e!, w!) };
    };
    const base = arm(rest);
    if (!base || base.forearm === 0) return null;
    return (f) => {
      const a = arm(f.landmarks);
      if (!a || a.forearm < FOREARM_FORESHORTENED_RATIO * base.forearm) return null;
      return a.flexion - base.flexion;
    };
  },
  level: byThreshold(ELBOW_BEND_WARN_DEG, ELBOW_BEND_FLAG_DEG),
});

/**
 * Knee valgus (front): the working knee drifts inward, towards the body's
 * midline, off the hip-ankle line, compared with its own starting track (not an
 * absolute valgus angle). Drifting outward is not reported.
 */
export const detectKneeValgus = makeDetector({
  id: 'knee_valgus',
  unit: '%torso',
  views: ['front'],
  setup: (rest, { side }) => {
    const T = torsoLength(rest);
    const inward = (lms: PoseLandmark[]) => {
      const hip = seen(lms, `${side}_hip`);
      const knee = seen(lms, `${side}_knee`);
      const ankle = seen(lms, `${side}_ankle`);
      const mid = centre(lms, 'hip');
      if (!hip || !knee || !ankle || !mid || ankle.y === hip.y || hip.x === mid.x) {
        return null;
      }
      const lineX = hip.x + ((ankle.x - hip.x) * (knee.y - hip.y)) / (ankle.y - hip.y);
      const outward = hip.x > mid.x ? 1 : -1;
      return (lineX - knee.x) * outward;
    };
    const base = inward(rest);
    if (!T || base === null) return null;
    return (f) => {
      const d = inward(f.landmarks);
      return d === null ? null : ((d - base) / T) * 100;
    };
  },
  level: byThreshold(KNEE_VALGUS_WARN, KNEE_VALGUS_FLAG),
});

/** Hip hitch (front): the pelvis tips out of level (working hip up or down). */
export const detectHipHitch = makeDetector({
  id: 'hip_hitch',
  unit: '%torso',
  views: ['front'],
  setup: (rest, { side }) => {
    const T = torsoLength(rest);
    const rise = (lms: PoseLandmark[]) => {
      const work = seen(lms, `${side}_hip`);
      const otherHip = seen(lms, `${other(side)}_hip`);
      return work && otherHip ? otherHip.y - work.y : null;
    };
    const base = rise(rest);
    if (!T || base === null) return null;
    return (f) => {
      const r = rise(f.landmarks);
      return r === null ? null : (Math.abs(r - base) / T) * 100;
    };
  },
  level: byThreshold(HIP_HITCH_WARN, HIP_HITCH_FLAG),
});

/**
 * Pelvic shift (front): the mid-hip moves sideways over the feet, a visible
 * sign of shifting onto one leg (we don't measure weight itself).
 */
export const detectPelvicShift = makeDetector({
  id: 'pelvic_shift',
  unit: '%torso',
  views: ['front'],
  setup: (rest) => {
    const T = torsoLength(rest);
    const offset = (lms: PoseLandmark[]) => {
      const hips = pair(lms, 'hip');
      const ankles = pair(lms, 'ankle');
      if (!hips || !ankles) return null;
      return (hips[0].x + hips[1].x) / 2 - (ankles[0].x + ankles[1].x) / 2;
    };
    const base = offset(rest);
    if (!T || base === null) return null;
    return (f) => {
      const o = offset(f.landmarks);
      return o === null ? null : (Math.abs(o - base) / T) * 100;
    };
  },
  level: byThreshold(PELVIC_SHIFT_WARN, PELVIC_SHIFT_FLAG),
});

/** Heel lift (side): the working heel rises while the toes stay down. */
export const detectHeelLift = makeDetector({
  id: 'heel_lift',
  unit: '%torso',
  views: ['side'],
  setup: (rest, { side }) => {
    const T = torsoLength(rest);
    const heel0 = seen(rest, `${side}_heel`);
    const toe0 = seen(rest, `${side}_foot_index`);
    if (!T || !heel0 || !toe0) return null;
    return (f) => {
      const heel = seen(f.landmarks, `${side}_heel`);
      const toe = seen(f.landmarks, `${side}_foot_index`);
      // The whole foot moving (a step) is not a heel lift
      if (
        !heel ||
        !toe ||
        (Math.abs(toe.y - toe0.y) / T) * 100 >= HEEL_LIFT_MAX_TOE_MOVE
      ) {
        return null;
      }
      return ((heel0.y - heel.y) / T) * 100;
    };
  },
  level: byThreshold(HEEL_LIFT_WARN, HEEL_LIFT_FLAG),
});

/**
 * Forward head (side): the ear moves ahead of the shoulders. Measured across
 * the trunk's axis, so bending forward (e.g. in a squat) isn't counted.
 */
export const detectForwardHead = makeDetector({
  id: 'forward_head',
  unit: '%torso',
  views: ['side'],
  setup: (rest) => {
    const T = torsoLength(rest);
    const dirn = facing(rest);
    if (!T || !dirn) return null;
    const ahead = (lms: PoseLandmark[]) => {
      const ear = centre(lms, 'ear');
      const shoulder = centre(lms, 'shoulder');
      const up = trunkUp(lms);
      if (!ear || !shoulder || !up) return null;
      // Perpendicular to the trunk, pointing the way the patient faces
      const fwd = dirn > 0 ? { x: -up.y, y: up.x } : { x: up.y, y: -up.x };
      return (ear.x - shoulder.x) * fwd.x + (ear.y - shoulder.y) * fwd.y;
    };
    const base = ahead(rest);
    if (base === null) return null;
    return (f) => {
      const a = ahead(f.landmarks);
      return a === null ? null : ((a - base) / T) * 100;
    };
  },
  level: byThreshold(FORWARD_HEAD_WARN, FORWARD_HEAD_FLAG),
});

export const COMPENSATION_DETECTORS: Partial<Record<FindingId, CompensationDetector>> = {
  shoulder_hike: detectShoulderHike,
  trunk_side_lean: detectTrunkSideLean,
  trunk_rotation: detectTrunkRotation,
  back_arch: detectBackArch,
  trunk_forward_lean: detectTrunkForwardLean,
  elbow_bend: detectElbowBend,
  knee_valgus: detectKneeValgus,
  hip_hitch: detectHipHitch,
  pelvic_shift: detectPelvicShift,
  heel_lift: detectHeelLift,
  forward_head: detectForwardHead,
  head_tilt: detectHeadTilt,
};

/** Every compensation seen in one repetition. */
export function detectCompensations(
  rep: Repetition,
  context: MovementContext
): CompensationHit[] {
  const hits: CompensationHit[] = [];
  for (const detector of Object.values(COMPENSATION_DETECTORS)) {
    const hit = detector?.(rep, context);
    if (hit) hits.push(hit);
  }
  return hits;
}
