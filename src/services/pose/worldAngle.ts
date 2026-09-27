/**
 * Clinical joint angles from MediaPipe's 3D world landmarks. In a view
 * turned 30-60° from the movement plane these beat the 2D image angle: on
 * REHAB24-6 (motion capture, inspection and validation participants) shoulder
 * error fell from 16-17° to 11° and knee from 18-20° to 14-18°. Face-on to the
 * movement plane the 2D angle is better (abduction from the front 6° vs 7°).
 */
import type { PoseLandmark } from '../../types/pose';
import type { BodySide, JointKind } from './exercisePlan';
import { findLandmark } from './landmarkLookup';

const DEG = 180 / Math.PI;
type P = { x: number; y: number; z?: number };
const sub = (a: P, b: P) => ({ x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) });
const angleBetween = (u: P, v: P) => {
  const dot = u.x * v.x + u.y * v.y + (u.z ?? 0) * (v.z ?? 0);
  const nu = Math.hypot(u.x, u.y, u.z ?? 0);
  const nv = Math.hypot(v.x, v.y, v.z ?? 0);
  return nu && nv ? Math.acos(Math.max(-1, Math.min(1, dot / (nu * nv)))) * DEG : null;
};
const mid = (a: P, b: P) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
});

/**
 * The same clinical angle from MediaPipe's 3D world landmarks: shoulder as
 * the upper arm against the trunk midline, knee as 180 - hip-knee-ankle.
 */
export function worldAngle(
  world: PoseLandmark[] | undefined,
  joint: JointKind,
  side: BodySide
): number | null {
  if (!world?.length) return null;
  const get = (n: string) => findLandmark(world, n);
  if (joint === 'shoulder') {
    const s = get(`${side}_shoulder`);
    const e = get(`${side}_elbow`);
    const ls = get('left_shoulder');
    const rs = get('right_shoulder');
    const lh = get('left_hip');
    const rh = get('right_hip');
    if (!s || !e || !ls || !rs || !lh || !rh) return null;
    return angleBetween(sub(e, s), sub(mid(lh, rh), mid(ls, rs)));
  }
  if (joint === 'knee') {
    const h = get(`${side}_hip`);
    const k = get(`${side}_knee`);
    const a = get(`${side}_ankle`);
    if (!h || !k || !a) return null;
    const interior = angleBetween(sub(h, k), sub(a, k));
    return interior === null ? null : 180 - interior;
  }
  return null;
}
