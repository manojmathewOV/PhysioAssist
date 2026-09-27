/**
 * Body position from the trunk and thighs: standing, seated or lying.
 *
 * Uses MediaPipe's 3D world landmarks when available, so a thigh pointing at
 * the camera (sitting, filmed from the front) still reads as horizontal;
 * otherwise the image landmarks, where a thigh much shorter than the torso is
 * taken to point at the camera.
 */
import type { PoseLandmark, ProcessedPoseData } from '../../types/pose';
import { findLandmark } from '../pose/landmarkLookup';
import type { Posture } from './types';

/** Trunk more than this far from vertical: lying. */
export const LYING_TRUNK_DEG = 60;
/** Trunk within this of vertical counts as upright. */
export const UPRIGHT_TRUNK_DEG = 45;
/**
 * Both thighs more than this far from vertical, trunk upright: seated. Both
 * within STANDING_THIGH_DEG: standing. MediaPipe's world landmarks put a
 * seated thigh at only 45-62° from vertical (the hip point sits high), and a
 * standing one within 14° at rest (Clemente et al. recordings, 16 sessions).
 */
export const SEATED_THIGH_DEG = 30;
export const STANDING_THIGH_DEG = 20;
/** In the image, a thigh shorter than this share of the torso points at the camera. */
const FORESHORTENED_THIGH = 0.45;

type P = { x: number; y: number; z?: number };
const DEG = 180 / Math.PI;

const mid = (a: P, b: P): P => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
});

/** Angle of a segment from vertical (degrees; direction doesn't matter). */
const fromVertical = (a: P, b: P, use3d: boolean) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = use3d ? (b.z ?? 0) - (a.z ?? 0) : 0;
  const len = Math.hypot(dx, dy, dz);
  return len ? Math.acos(Math.min(1, Math.abs(dy) / len)) * DEG : null;
};

function classify(lms: PoseLandmark[], use3d: boolean, torsoFromImage?: number): Posture {
  const get = (n: string) => {
    const p = findLandmark(lms, n);
    return p && p.visibility >= 0.5 ? p : undefined;
  };
  const ls = get('left_shoulder');
  const rs = get('right_shoulder');
  const lh = get('left_hip');
  const rh = get('right_hip');
  if (!ls || !rs || !lh || !rh) return 'unknown';
  const hip = mid(lh, rh);
  const trunk = fromVertical(hip, mid(ls, rs), use3d);
  if (trunk === null) return 'unknown';
  if (trunk > LYING_TRUNK_DEG) return 'lying';
  if (trunk > UPRIGHT_TRUNK_DEG) return 'unknown';

  const thighs = (['left', 'right'] as const).map((side) => {
    const h = get(`${side}_hip`);
    const k = get(`${side}_knee`);
    if (!h || !k) return null;
    if (!use3d && torsoFromImage) {
      const len = Math.hypot(k.x - h.x, k.y - h.y);
      if (len < FORESHORTENED_THIGH * torsoFromImage) return 90;
    }
    return fromVertical(h, k, use3d);
  });
  if (thighs.some((t) => t === null)) return 'unknown';
  const [l, r] = thighs as number[];
  if (l > SEATED_THIGH_DEG && r > SEATED_THIGH_DEG) return 'seated';
  if (l < STANDING_THIGH_DEG && r < STANDING_THIGH_DEG) return 'standing';
  return 'unknown';
}

/** Posture of one frame; `landmarks` are the measurement landmarks (aspect-corrected). */
export function postureOf(pose: ProcessedPoseData, landmarks: PoseLandmark[]): Posture {
  if (pose.worldLandmarks?.length) {
    const fromWorld = classify(pose.worldLandmarks, true);
    if (fromWorld !== 'unknown') return fromWorld;
  }
  const ls = findLandmark(landmarks, 'left_shoulder');
  const rs = findLandmark(landmarks, 'right_shoulder');
  const lh = findLandmark(landmarks, 'left_hip');
  const rh = findLandmark(landmarks, 'right_hip');
  const torso =
    ls && rs && lh && rh
      ? Math.hypot((ls.x + rs.x - lh.x - rh.x) / 2, (ls.y + rs.y - lh.y - rh.y) / 2)
      : undefined;
  return classify(landmarks, false, torso);
}
