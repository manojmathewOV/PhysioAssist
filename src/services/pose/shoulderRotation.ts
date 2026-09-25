/**
 * Shoulder external rotation with the elbow bent at the side, from MediaPipe's
 * 3D world landmarks, in a frame built from the body itself:
 *   up      = mid-hip -> mid-shoulder
 *   outward = mid-shoulder -> this arm's shoulder (across the body)
 *   forward = perpendicular to both, on the side the nose is
 * The forearm (elbow -> wrist), flattened onto the plane at right angles to
 * the trunk, is 0° pointing forward and positive rotating outward (negative
 * inward, towards the belly).
 *
 * Approximate by nature: facing the camera, a forearm pointing forward points
 * straight at the lens, so its direction comes from the model's depth guess.
 * Camera-based systems are known to be least reliable for rotation. Always
 * shown as an estimate; the exercise's quality checks (elbow at the side,
 * trunk not turning) are the dependable feedback.
 */
import type { PoseLandmark } from '../../types/pose';
import type { BodySide } from './exercisePlan';
import { findLandmark } from './landmarkLookup';

type V = { x: number; y: number; z: number };
const v = (p: PoseLandmark): V => ({ x: p.x, y: p.y, z: p.z ?? 0 });
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z;
const scale = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const cross = (a: V, b: V): V => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const unit = (a: V): V | null => {
  const n = Math.hypot(a.x, a.y, a.z);
  return n > 1e-6 ? scale(a, 1 / n) : null;
};
const mid = (a: V, b: V): V => scale({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }, 0.5);
/** `a` with its component along unit `n` removed. */
const flatten = (a: V, n: V): V => sub(a, scale(n, dot(a, n)));

/** External rotation (degrees), or null when the landmarks aren't there. */
export function externalRotationDegrees(
  world: PoseLandmark[] | undefined,
  side: BodySide
): number | null {
  if (!world?.length) return null;
  const get = (n: string) => {
    const p = findLandmark(world, n);
    return p ? v(p) : null;
  };
  const ls = get('left_shoulder');
  const rs = get('right_shoulder');
  const lh = get('left_hip');
  const rh = get('right_hip');
  const elbow = get(`${side}_elbow`);
  const wrist = get(`${side}_wrist`);
  const nose = get('nose');
  if (!ls || !rs || !lh || !rh || !elbow || !wrist || !nose) return null;

  const midShoulder = mid(ls, rs);
  const up = unit(sub(midShoulder, mid(lh, rh)));
  if (!up) return null;
  const outward = unit(flatten(sub(side === 'left' ? ls : rs, midShoulder), up));
  if (!outward) return null;
  let forward = unit(cross(up, outward));
  if (!forward) return null;
  if (dot(sub(nose, midShoulder), forward) < 0) forward = scale(forward, -1);

  const forearm = flatten(sub(wrist, elbow), up);
  if (Math.hypot(forearm.x, forearm.y, forearm.z) < 1e-6) return null;
  return (Math.atan2(dot(forearm, outward), dot(forearm, forward)) * 180) / Math.PI;
}
