/**
 * Pure geometry for the pose overlay, shared by the native SVG overlay
 * (PoseOverlay) and the web canvas overlay (WebPoseOverlay) so both look the same.
 *
 * Visual language:
 * - A simplified body (torso, arms, legs, feet, head ring); no face or finger dots
 * - Limbs the current exercise measures are highlighted
 * - For each measured joint, a gauge: the goal range as a wide translucent track and
 *   the current angle as a solid arc with a knob, green inside the range, amber outside
 */
import type { PoseLandmark } from '../../types/pose';
import { findLandmark } from '../../services/pose/landmarkLookup';
import { jointPoints } from '../../services/pose/jointPoints';

export interface Point {
  x: number;
  y: number;
}

/** A joint the exercise measures, with its goal range in degrees. */
export interface JointFocus {
  joint: string; // snake_case, e.g. 'left_elbow'
  min?: number;
  max?: number;
}

export type AngleStatus = 'good' | 'adjust' | 'neutral';

export interface OverlaySegment {
  from: Point;
  to: Point;
  focus: boolean;
  opacity: number;
}

export interface OverlayJoint {
  name: string;
  at: Point;
  focus: boolean;
  opacity: number;
}

export interface OverlayAngle {
  joint: string;
  vertex: Point;
  degrees: number;
  status: AngleStatus;
  /** SVG path of the current-angle arc (open arc, stroke it). */
  arcPath: string;
  /** SVG path of the goal range as an open arc on the same radius (stroke it wide). */
  targetPath?: string;
  /** End of the current-angle arc (draw a knob here). */
  knobAt: Point;
  /** Where to centre the label. */
  labelAt: Point;
}

export interface OverlayModel {
  segments: OverlaySegment[];
  joints: OverlayJoint[];
  head?: { at: Point; radius: number; opacity: number };
  angles: OverlayAngle[];
}

/** Minimum visibility to draw anything. */
export const MIN_VISIBILITY = 0.3;

/** Half the widest angle label plus a gap, so labels are never clipped. */
const LABEL_MARGIN_X = 33;
const LABEL_MARGIN_Y = 19;

const BONES: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['left_ankle', 'left_heel'],
  ['left_heel', 'left_foot_index'],
  ['left_ankle', 'left_foot_index'],
  ['right_ankle', 'right_heel'],
  ['right_heel', 'right_foot_index'],
  ['right_ankle', 'right_foot_index'],
];

const BODY_JOINTS = [
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_foot_index',
  'right_foot_index',
];

/** [proximal, vertex, distal] landmarks for each measurable joint. */
export const JOINT_TRIPLETS: Record<string, [string, string, string]> = {
  left_elbow: ['left_shoulder', 'left_elbow', 'left_wrist'],
  right_elbow: ['right_shoulder', 'right_elbow', 'right_wrist'],
  left_shoulder: ['left_elbow', 'left_shoulder', 'left_hip'],
  right_shoulder: ['right_elbow', 'right_shoulder', 'right_hip'],
  left_hip: ['left_shoulder', 'left_hip', 'left_knee'],
  right_hip: ['right_shoulder', 'right_hip', 'right_knee'],
  left_knee: ['left_hip', 'left_knee', 'left_ankle'],
  right_knee: ['right_hip', 'right_knee', 'right_ankle'],
  left_ankle: ['left_knee', 'left_ankle', 'left_foot_index'],
  right_ankle: ['right_knee', 'right_ankle', 'right_foot_index'],
};

/** 'leftElbow' | 'left_elbow' -> 'left_elbow' */
export const toJointKey = (name: string): string =>
  name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const polar = (c: Point, radius: number, rad: number): Point => ({
  x: c.x + radius * Math.cos(rad),
  y: c.y + radius * Math.sin(rad),
});

const fmt = (n: number) => n.toFixed(1);

/** Arc from `startRad` sweeping `sweepRad` (positive = clockwise on screen). */
function arc(
  c: Point,
  radius: number,
  startRad: number,
  sweepRad: number,
  closed: boolean
) {
  const start = polar(c, radius, startRad);
  const end = polar(c, radius, startRad + sweepRad);
  const large = Math.abs(sweepRad) > Math.PI ? 1 : 0;
  const sweep = sweepRad >= 0 ? 1 : 0;
  const body = `A ${fmt(radius)} ${fmt(radius)} 0 ${large} ${sweep} ${fmt(end.x)} ${fmt(end.y)}`;
  return closed
    ? `M ${fmt(c.x)} ${fmt(c.y)} L ${fmt(start.x)} ${fmt(start.y)} ${body} Z`
    : `M ${fmt(start.x)} ${fmt(start.y)} ${body}`;
}

export function angleStatus(degrees: number, focus?: JointFocus): AngleStatus {
  if (!focus || (focus.min === undefined && focus.max === undefined)) {
    return 'neutral';
  }
  const aboveMin = focus.min === undefined || degrees >= focus.min;
  const belowMax = focus.max === undefined || degrees <= focus.max;
  return aboveMin && belowMax ? 'good' : 'adjust';
}

export interface BuildOverlayOptions {
  width: number;
  height: number;
  focus?: JointFocus[];
  /** Extra joints to draw angles for (names in camelCase or snake_case). */
  angleJoints?: string[];
  /** Pre-computed angles to display instead of measuring from landmarks. */
  angleValues?: Record<string, number>;
  highlightJoints?: string[];
  /** Arc radius in px; scales with the body size by default. */
  arcRadius?: number;
}

/**
 * Build everything the overlay draws. Landmarks are normalized to the overlay
 * area, so angles measured here in pixels are aspect-correct.
 */
export function buildOverlayModel(
  landmarks: PoseLandmark[],
  {
    width,
    height,
    focus = [],
    angleJoints = [],
    angleValues,
    highlightJoints = [],
    arcRadius,
  }: BuildOverlayOptions
): OverlayModel {
  const px = (lm: PoseLandmark): Point => ({ x: lm.x * width, y: lm.y * height });
  const get = (name: string) => {
    const lm = findLandmark(landmarks, name);
    return lm && lm.visibility >= MIN_VISIBILITY ? lm : undefined;
  };

  const focusByJoint = new Map(focus.map((f) => [toJointKey(f.joint), f]));
  const focusLandmarks = new Set<string>(highlightJoints);
  focusByJoint.forEach((_, joint) =>
    JOINT_TRIPLETS[joint]?.forEach((n) => focusLandmarks.add(n))
  );

  const segments: OverlaySegment[] = [];
  for (const [a, b] of BONES) {
    const la = get(a);
    const lb = get(b);
    if (la && lb) {
      segments.push({
        from: px(la),
        to: px(lb),
        focus: focusLandmarks.has(a) && focusLandmarks.has(b),
        opacity: Math.min(la.visibility, lb.visibility),
      });
    }
  }

  const joints: OverlayJoint[] = [];
  for (const name of BODY_JOINTS) {
    const lm = get(name);
    if (lm) {
      joints.push({
        name,
        at: px(lm),
        focus: focusLandmarks.has(name),
        opacity: lm.visibility,
      });
    }
  }

  // Head: a ring around the nose sized from the shoulder width
  let head: OverlayModel['head'];
  const nose = get('nose');
  const ls = get('left_shoulder');
  const rs = get('right_shoulder');
  if (nose && ls && rs) {
    const shoulderWidth = Math.hypot(px(ls).x - px(rs).x, px(ls).y - px(rs).y);
    head = {
      at: px(nose),
      radius: Math.max(14, shoulderWidth * 0.32),
      opacity: nose.visibility,
    };
  }

  // Arc radius scales with the person on screen (torso length), within sensible bounds
  const lh = get('left_hip');
  const torso =
    ls && lh ? Math.hypot(px(ls).x - px(lh).x, px(ls).y - px(lh).y) : height * 0.25;
  const radius = arcRadius ?? Math.min(48, Math.max(22, torso * 0.22));

  const angles: OverlayAngle[] = [];
  const wanted = new Set<string>([
    ...focusByJoint.keys(),
    ...angleJoints.map(toJointKey),
  ]);
  if (angleValues) {
    Object.keys(angleValues).forEach((k) => wanted.add(toJointKey(k)));
  }
  for (const joint of wanted) {
    const points = jointPoints(landmarks, joint);
    if (!points) continue;
    const [pa, pb, pc] = points;
    if (Math.min(...points.map((p) => p.visibility)) < MIN_VISIBILITY) continue;
    const A = px(pa);
    const B = px(pb);
    const C = px(pc);
    const startRad = Math.atan2(A.y - B.y, A.x - B.x);
    const endRad = Math.atan2(C.y - B.y, C.x - B.x);
    let sweep = endRad - startRad;
    if (sweep > Math.PI) sweep -= 2 * Math.PI;
    if (sweep < -Math.PI) sweep += 2 * Math.PI;
    const direction = sweep >= 0 ? 1 : -1;

    const given = angleValues
      ? angleValues[joint] ??
        angleValues[joint.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())]
      : undefined;
    const degrees = given ?? (Math.abs(sweep) * 180) / Math.PI;
    const f = focusByJoint.get(joint);

    let targetPath: string | undefined;
    if (f && (f.min !== undefined || f.max !== undefined)) {
      const lo = ((f.min ?? 0) * Math.PI) / 180;
      const hi = ((f.max ?? 180) * Math.PI) / 180;
      targetPath = arc(
        B,
        radius * 1.35,
        startRad + direction * lo,
        direction * (hi - lo),
        true
      );
    }

    // Label sits inside the bend, just beyond the goal wedge (the one area no limb
    // crosses), kept fully on screen
    const mid = startRad + sweep / 2;
    const raw = polar(B, radius + 30, mid);
    const labelAt = {
      x: Math.min(width - LABEL_MARGIN_X, Math.max(LABEL_MARGIN_X, raw.x)),
      y: Math.min(height - LABEL_MARGIN_Y, Math.max(LABEL_MARGIN_Y, raw.y)),
    };
    angles.push({
      joint,
      vertex: B,
      degrees,
      status: angleStatus(degrees, f),
      arcPath: arc(B, radius, startRad, sweep, false),
      targetPath,
      knobAt: polar(B, radius, startRad + sweep),
      labelAt,
    });
  }

  return { segments, joints, head, angles };
}

/** Goal ranges for the joints the current exercise phase measures. */
export function focusFromExercise(
  exercise:
    | {
        phases: {
          name: string;
          jointRequirements: { joint: string; minAngle: number; maxAngle: number }[];
        }[];
      }
    | null
    | undefined,
  phaseName?: string
): JointFocus[] {
  if (!exercise) {
    return [];
  }
  const phase =
    exercise.phases.find((p) => p.name === phaseName && p.jointRequirements.length > 0) ??
    exercise.phases.find((p) => p.jointRequirements.length > 0);
  return (phase?.jointRequirements ?? []).map((r) => ({
    joint: toJointKey(r.joint),
    min: r.minAngle,
    max: r.maxAngle,
  }));
}
