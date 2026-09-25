/**
 * Virtual patient body model: joint angles in, MediaPipe-shaped landmarks out.
 *
 * A deterministic stick figure posed by forward kinematics in a 480x640 portrait
 * frame (adult proportions). Angles use the same convention as the goniometer:
 * the interior angle at the joint (a straight elbow/knee/hip is 180°; for the
 * shoulder, the angle between upper arm and trunk, arm by the side ≈ 0-10°).
 *
 * Output is a MediaPipe Pose Landmarker result (33 image landmarks normalized to
 * the frame, plus world landmarks in metres centred on the hips), so simulated
 * frames go through exactly the same conversion and enrichment code as camera
 * frames.
 */
import { normalShoulderRise } from '../../services/movement/compensations';
import type {
  MediaPipeLandmark,
  MediaPipePoseResultBundle,
} from '../../services/pose/mediapipeLandmarks';

export const FRAME_WIDTH = 480;
export const FRAME_HEIGHT = 640;
/** Pixels per metre, so the 150px torso is ~0.45m. */
const PX_PER_M = 330;

export interface BodyPose {
  view: 'side' | 'front';
  leftElbow: number;
  rightElbow: number;
  leftShoulder: number;
  rightShoulder: number;
  leftHip: number;
  rightHip: number;
  leftKnee: number;
  rightKnee: number;
  // Compensations (0 = none). Required so timeline interpolation stays typed;
  // STANDING sets them to 0, so keyframes may leave them out.
  // They move landmarks only; the requested joint angles stay exact.
  /** Front: px the left shoulder rises (shrug towards the ear). */
  shoulderHike: number;
  /** Front: degrees the trunk leans sideways (+ = towards the patient's right). */
  trunkSideLean: number;
  /** Front: degrees the trunk turns; shoulder width narrows by cos. */
  trunkRotation: number;
  /** Side: degrees the trunk leans backward (arching the back); negative = forward. */
  trunkLeanBack: number;
  /** Front: px the left knee moves towards the midline (negative = outward). */
  kneeValgus: number;
  /** Front: px the left hip rises (negative = drops). */
  hipHitch: number;
  /** Front: px the pelvis shifts sideways over the feet (+ = towards the patient's left). */
  pelvicShift: number;
  /** Side: px the left heel rises off the floor. */
  heelLift: number;
  /** Side: px the head pokes forward. */
  forwardHead: number;
  /** Front: degrees the head tilts (ear towards shoulder), about the nose. */
  headTilt: number;
}

export const STANDING: BodyPose = {
  view: 'side',
  leftElbow: 172,
  rightElbow: 172,
  leftShoulder: 8,
  rightShoulder: 8,
  leftHip: 178,
  rightHip: 178,
  leftKnee: 178,
  rightKnee: 178,
  shoulderHike: 0,
  trunkSideLean: 0,
  trunkRotation: 0,
  trunkLeanBack: 0,
  kneeValgus: 0,
  hipHitch: 0,
  pelvicShift: 0,
  heelLift: 0,
  forwardHead: 0,
  headTilt: 0,
};

type P = { x: number; y: number; z?: number };

const L = { torso: 150, upperArm: 90, forearm: 80, thigh: 130, shank: 120, neck: 55 };
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Unit vector at `deg` from straight down, rotating towards +x (image y is down). */
const dir = (deg: number): P => ({ x: Math.sin(rad(deg)), y: Math.cos(rad(deg)) });
const add = (a: P, d: P, len: number): P => ({ x: a.x + d.x * len, y: a.y + d.y * len });

function sidePose(pose: BodyPose): Record<string, P> {
  const pts: Record<string, P> = {};
  // Build from the floor up so the feet stay planted when knees/hips bend
  const sideOf = (side: 'left' | 'right', offset: number) => {
    const knee = side === 'left' ? pose.leftKnee : pose.rightKnee;
    const hip = side === 'left' ? pose.leftHip : pose.rightHip;
    const bend = 180 - knee;
    const shankTilt = bend * 0.45; // knee travels forward
    const thighTilt = bend - shankTilt; // hip travels back
    const ankle = { x: 240 + offset, y: 590 };
    const kneeP = add(ankle, dir(180 - shankTilt), L.shank);
    const hipP = add(kneeP, dir(180 + thighTilt), L.thigh);
    // Trunk lean (from vertical, forward) that yields the requested hip angle
    const lean = 180 - hip - thighTilt;
    return { ankle, knee: kneeP, hip: hipP, lean };
  };
  const left = sideOf('left', 6); // far side, slightly offset
  const right = sideOf('right', 0);
  // Arching back tilts the trunk; the arm is placed relative to it, so the
  // shoulder angle is unchanged (the hip angle opens by the same amount)
  const lean = (left.lean + right.lean) / 2 - pose.trunkLeanBack;
  for (const [side, s] of [
    ['left', left],
    ['right', right],
  ] as const) {
    pts[`${side}_ankle`] = s.ankle;
    pts[`${side}_knee`] = s.knee;
    pts[`${side}_hip`] = s.hip;
    const heelLift = side === 'left' ? pose.heelLift : 0;
    pts[`${side}_heel`] = { x: s.ankle.x - 14, y: s.ankle.y + 12 - heelLift };
    pts[`${side}_foot_index`] = { x: s.ankle.x + 42, y: s.ankle.y + 14 };
    const shoulder = add(s.hip, dir(180 - lean), L.torso);
    pts[`${side}_shoulder`] = shoulder;
    const shoulderAngle = side === 'left' ? pose.leftShoulder : pose.rightShoulder;
    const elbowAngle = side === 'left' ? pose.leftElbow : pose.rightElbow;
    // Upper arm: from "down along the trunk", rotated forward by the shoulder angle
    const upperArmDeg = shoulderAngle - lean;
    const elbow = add(shoulder, dir(upperArmDeg), L.upperArm);
    const wrist = add(elbow, dir(upperArmDeg + (180 - elbowAngle)), L.forearm);
    pts[`${side}_elbow`] = elbow;
    pts[`${side}_wrist`] = wrist;
  }
  const midShoulder = {
    x: (pts.left_shoulder.x + pts.right_shoulder.x) / 2,
    y: (pts.left_shoulder.y + pts.right_shoulder.y) / 2,
  };
  const head = add(midShoulder, dir(180 - lean), L.neck);
  head.x += pose.forwardHead; // facing +x
  pts.nose = { x: head.x + 22, y: head.y };
  return pts;
}

/** Vertical drop (px) of the knee and hip when the legs bend, seen from the front. */
function legDrop(knee: number) {
  const bend = 180 - knee;
  const shankTilt = bend * 0.45; // same split as the side view
  const thighTilt = bend - shankTilt;
  const kneeRise = L.shank * Math.cos(rad(shankTilt));
  const hipRise = kneeRise + L.thigh * Math.cos(rad(thighTilt));
  return { knee: L.shank - kneeRise, hip: L.shank + L.thigh - hipRise };
}

function frontPose(pose: BodyPose): Record<string, P> {
  const pts: Record<string, P> = {};
  // Legs: bending lowers knee and hip (foreshortened towards the camera);
  // measured from STANDING so the standing figure is unchanged
  const stand = legDrop(STANDING.leftKnee);
  // Facing the camera: the person's left appears on the image's right (+x)
  for (const [side, sign] of [
    ['left', 1],
    ['right', -1],
  ] as const) {
    const isLeft = side === 'left';
    const drop = legDrop(isLeft ? pose.leftKnee : pose.rightKnee);
    // Hip width 0.51 and shoulder width 0.72 of the torso length: the median
    // proportions of real people facing the camera (Clemente et al. 2024)
    const ankle = { x: 240 + sign * 38, y: 330 + L.thigh + L.shank };
    const hip = {
      x: ankle.x + pose.pelvicShift,
      y: 330 + drop.hip - stand.hip - (isLeft ? pose.hipHitch : 0),
    };
    // The knee sits on the hip-ankle line, then valgus moves it towards the midline
    const kneeY = 330 + L.thigh + drop.knee - stand.knee;
    const onLine = hip.x + ((ankle.x - hip.x) * (kneeY - hip.y)) / (ankle.y - hip.y);
    const knee = { x: onLine - (isLeft ? pose.kneeValgus : 0) * sign, y: kneeY };
    pts[`${side}_hip`] = hip;
    pts[`${side}_knee`] = knee;
    pts[`${side}_ankle`] = ankle;
    pts[`${side}_heel`] = { x: ankle.x, y: ankle.y + 12 };
    pts[`${side}_foot_index`] = { x: ankle.x + sign * 18, y: ankle.y + 20 };
  }
  // Trunk: shoulders and head above the mid-hip, narrowed by rotation, then
  // tilted sideways about the mid-hip
  const hipMid = {
    x: (pts.left_hip.x + pts.right_hip.x) / 2,
    y: (pts.left_hip.y + pts.right_hip.y) / 2,
  };
  const tilt = rad(pose.trunkSideLean);
  const place = (dx: number, dy: number): P => ({
    x: hipMid.x + dx * Math.cos(tilt) + dy * Math.sin(tilt),
    y: hipMid.y - dx * Math.sin(tilt) + dy * Math.cos(tilt),
  });
  const halfWidth = 54 * Math.cos(rad(pose.trunkRotation));
  pts.nose = place(0, -L.torso - L.neck);
  // Each shoulder rises as its arm goes up, as real shoulders do (the normal
  // rise measured on real video, as a share of the 108 px rest shoulder
  // width), plus any hike on the left
  const lift = {
    left: normalShoulderRise(pose.leftShoulder) * 108 + pose.shoulderHike,
    right: normalShoulderRise(pose.rightShoulder) * 108,
  };
  for (const [side, sign] of [
    ['left', 1],
    ['right', -1],
  ] as const) {
    const shoulder = place(sign * halfWidth, -L.torso - lift[side]);
    pts[`${side}_shoulder`] = shoulder;
    const shoulderAngle = side === 'left' ? pose.leftShoulder : pose.rightShoulder;
    const elbowAngle = side === 'left' ? pose.leftElbow : pose.rightElbow;
    // Abduction: rotate outward from the trunk midline (shoulder midpoint ->
    // hip midpoint), the line the shoulder angle is measured against
    const lsh = place(halfWidth, -L.torso - lift.left);
    const rsh = place(-halfWidth, -L.torso - lift.right);
    const trunk =
      Math.atan2(hipMid.x - (lsh.x + rsh.x) / 2, hipMid.y - (lsh.y + rsh.y) / 2) *
      (180 / Math.PI);
    const upper = trunk + sign * shoulderAngle;
    const elbow = add(shoulder, dir(upper), L.upperArm);
    const wrist = add(elbow, dir(upper + sign * (180 - elbowAngle)), L.forearm);
    pts[`${side}_elbow`] = elbow;
    pts[`${side}_wrist`] = wrist;
  }
  return pts;
}

/** Face and hand points MediaPipe also reports, placed near their anchors. */
function addDetail(pts: Record<string, P>): void {
  const n = pts.nose;
  pts.left_eye_inner = { x: n.x + 4, y: n.y - 8 };
  pts.left_eye = { x: n.x + 8, y: n.y - 9 };
  pts.left_eye_outer = { x: n.x + 12, y: n.y - 8 };
  pts.right_eye_inner = { x: n.x - 4, y: n.y - 8 };
  pts.right_eye = { x: n.x - 8, y: n.y - 9 };
  pts.right_eye_outer = { x: n.x - 12, y: n.y - 8 };
  pts.left_ear = { x: n.x + 20, y: n.y - 4 };
  pts.right_ear = { x: n.x - 20, y: n.y - 4 };
  pts.mouth_left = { x: n.x + 6, y: n.y + 12 };
  pts.mouth_right = { x: n.x - 6, y: n.y + 12 };
  for (const side of ['left', 'right']) {
    const w = pts[`${side}_wrist`];
    pts[`${side}_pinky`] = { x: w.x + 4, y: w.y + 10 };
    pts[`${side}_index`] = { x: w.x + 8, y: w.y + 8 };
    pts[`${side}_thumb`] = { x: w.x + 6, y: w.y + 4 };
  }
}

const FACE = ['eye_inner', 'eye', 'eye_outer', 'ear'].flatMap((p) => [
  `left_${p}`,
  `right_${p}`,
]);

/** Rotate the face points about the nose (front view head tilt). */
function tiltHead(pts: Record<string, P>, deg: number): void {
  const n = pts.nose;
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  for (const name of [...FACE, 'mouth_left', 'mouth_right']) {
    const dx = pts[name].x - n.x;
    const dy = pts[name].y - n.y;
    pts[name] = { x: n.x + dx * c - dy * s, y: n.y + dx * s + dy * c };
  }
}

/** MediaPipe landmark order (index = position). */
export const MEDIAPIPE_ORDER = [
  'nose',
  'left_eye_inner',
  'left_eye',
  'left_eye_outer',
  'right_eye_inner',
  'right_eye',
  'right_eye_outer',
  'left_ear',
  'right_ear',
  'mouth_left',
  'mouth_right',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_pinky',
  'right_pinky',
  'left_index',
  'right_index',
  'left_thumb',
  'right_thumb',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
  'left_foot_index',
  'right_foot_index',
];

export interface FrameEffects {
  /** Pixel offsets per landmark name (e.g. jitter). */
  offsets?: Record<string, { x: number; y: number }>;
  /** Landmarks the model can't see this frame. */
  hidden?: Set<string>;
  /** Depth (metres, towards camera negative) added per landmark in world space. */
  depth?: Record<string, number>;
}

/** Half the shoulder and hip widths in metres (front view proportions). */
const SHOULDER_HALF_M = 54 / PX_PER_M;
const HIP_HALF_M = 38 / PX_PER_M;

/**
 * Depth of a point in world landmarks (metres, positive = away from the
 * camera), so the world landmarks show how far the body is turned, as
 * MediaPipe's do. Each side of the body moves as one piece, which keeps limb
 * segments in the image plane.
 */
function sideDepth(name: string, pose: BodyPose): number {
  const sign = name.startsWith('left_') ? 1 : name.startsWith('right_') ? -1 : 0;
  const part = name.replace(/^(left|right)_/, '');
  const upper = ['shoulder', 'elbow', 'wrist', 'pinky', 'index', 'thumb'].includes(part);
  const lower = ['hip', 'knee', 'ankle', 'heel', 'foot_index'].includes(part);
  if (pose.view === 'side') {
    // Far (left) side away from the camera
    return sign * (upper ? SHOULDER_HALF_M : lower ? HIP_HALF_M : 0);
  }
  return upper ? sign * SHOULDER_HALF_M * Math.sin(rad(pose.trunkRotation)) : 0;
}

/** Pose a body and return it as a MediaPipe Pose Landmarker result bundle. */
export function renderBody(
  pose: BodyPose,
  effects: FrameEffects = {}
): MediaPipePoseResultBundle {
  const pts = pose.view === 'front' ? frontPose(pose) : sidePose(pose);
  addDetail(pts);
  if (pose.view === 'front' && pose.headTilt) tiltHead(pts, pose.headTilt);
  const hipMid = {
    x: (pts.left_hip.x + pts.right_hip.x) / 2,
    y: (pts.left_hip.y + pts.right_hip.y) / 2,
  };
  const farSide = pose.view === 'side' ? 'left_' : null;

  const image: MediaPipeLandmark[] = [];
  const world: MediaPipeLandmark[] = [];
  for (const name of MEDIAPIPE_ORDER) {
    const p = pts[name];
    const o = effects.offsets?.[name] ?? { x: 0, y: 0 };
    const hidden = effects.hidden?.has(name);
    const visibility = hidden ? 0.05 : farSide && name.startsWith(farSide) ? 0.8 : 0.97;
    image.push({
      x: (p.x + o.x) / FRAME_WIDTH,
      y: (p.y + o.y) / FRAME_HEIGHT,
      z: 0,
      visibility,
      presence: hidden ? 0.1 : 0.99,
    });
    world.push({
      x: (p.x - hipMid.x) / PX_PER_M,
      y: (p.y - hipMid.y) / PX_PER_M,
      z: sideDepth(name, pose) + (effects.depth?.[name] ?? 0),
      visibility,
    });
  }
  return {
    results: [{ landmarks: [image], worldLandmarks: [world] }],
    inferenceTime: 12,
    inputImageWidth: FRAME_WIDTH,
    inputImageHeight: FRAME_HEIGHT,
  };
}
