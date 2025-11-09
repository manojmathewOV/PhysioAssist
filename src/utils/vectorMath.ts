import { Vector3D } from '@types/common';

/**
 * Lightweight 3D vector math utilities for biomechanics calculations
 * Optimized for mobile performance (<1ms per operation)
 *
 * Based on ISB standards and clinical biomechanics requirements
 * Reference: Wu et al. (2005) - ISB recommendation on definitions of joint coordinate systems
 */

/**
 * Calculate midpoint between two 3D points
 * Used for finding joint centers and segment origins
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Midpoint in 3D space
 *
 * @example
 * const leftHip = { x: 0.3, y: 0.5, z: 0 };
 * const rightHip = { x: 0.7, y: 0.5, z: 0 };
 * const pelvisCenter = midpoint3D(leftHip, rightHip);
 * // Result: { x: 0.5, y: 0.5, z: 0 }
 */
export function midpoint3D(p1: Vector3D, p2: Vector3D): Vector3D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: (p1.z + p2.z) / 2,
  };
}

/**
 * Subtract one 3D vector from another (p1 - p2)
 * Creates directional vector between two points
 *
 * @param p1 - Point to subtract from
 * @param p2 - Point to subtract
 * @returns Resultant vector
 *
 * @example
 * const shoulder = { x: 0.5, y: 0.7, z: 0 };
 * const hip = { x: 0.5, y: 0.3, z: 0 };
 * const trunkVector = subtract3D(shoulder, hip);
 * // Result: { x: 0, y: 0.4, z: 0 } (pointing upward)
 */
export function subtract3D(p1: Vector3D, p2: Vector3D): Vector3D {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };
}

/**
 * Normalize a 3D vector to unit length
 * Essential for creating orthonormal reference frames
 *
 * @param v - Vector to normalize
 * @returns Unit vector in same direction (or original if magnitude is 0)
 *
 * @example
 * const vector = { x: 3, y: 4, z: 0 };
 * const unitVector = normalize(vector);
 * // Result: { x: 0.6, y: 0.8, z: 0 } (magnitude = 1)
 */
export function normalize(v: Vector3D): Vector3D {
  const mag = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  if (mag === 0) {
    return v; // Return original to avoid division by zero
  }
  return {
    x: v.x / mag,
    y: v.y / mag,
    z: v.z / mag,
  };
}

/**
 * Calculate cross product of two 3D vectors (v1 × v2)
 * Produces vector perpendicular to both inputs (right-hand rule)
 * Critical for establishing orthogonal axes in ISB reference frames
 *
 * @param v1 - First vector
 * @param v2 - Second vector
 * @returns Perpendicular vector
 *
 * @example
 * const xAxis = { x: 1, y: 0, z: 0 };
 * const yAxis = { x: 0, y: 1, z: 0 };
 * const zAxis = crossProduct(xAxis, yAxis);
 * // Result: { x: 0, y: 0, z: 1 }
 */
export function crossProduct(v1: Vector3D, v2: Vector3D): Vector3D {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
}

/**
 * Calculate dot product of two 3D vectors
 * Scalar value representing projection of one vector onto another
 * Used for angle calculations and plane projections
 *
 * @param v1 - First vector
 * @param v2 - Second vector
 * @returns Scalar dot product
 *
 * @example
 * const v1 = { x: 1, y: 0, z: 0 };
 * const v2 = { x: 0, y: 1, z: 0 };
 * const dot = dotProduct(v1, v2);
 * // Result: 0 (perpendicular vectors)
 */
export function dotProduct(v1: Vector3D, v2: Vector3D): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * Calculate magnitude (length) of a 3D vector
 * Euclidean distance from origin
 *
 * @param v - Vector
 * @returns Magnitude (always non-negative)
 *
 * @example
 * const vector = { x: 3, y: 4, z: 0 };
 * const length = magnitude(vector);
 * // Result: 5
 */
export function magnitude(v: Vector3D): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

/**
 * Calculate angle between two 3D vectors in degrees
 * Uses dot product formula: θ = arccos((v1·v2) / (|v1||v2|))
 * Clamped to avoid numerical errors in arccos
 *
 * @param v1 - First vector
 * @param v2 - Second vector
 * @returns Angle in degrees [0, 180]
 *
 * @example
 * const up = { x: 0, y: 1, z: 0 };
 * const right = { x: 1, y: 0, z: 0 };
 * const angle = angleBetweenVectors(up, right);
 * // Result: 90 degrees
 */
export function angleBetweenVectors(v1: Vector3D, v2: Vector3D): number {
  const dot = dotProduct(v1, v2);
  const mags = magnitude(v1) * magnitude(v2);

  if (mags === 0) {
    return 0; // Avoid division by zero
  }

  // Clamp to [-1, 1] to avoid numerical errors in Math.acos
  const cosAngle = Math.max(-1, Math.min(1, dot / mags));

  return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Project a 3D vector onto a plane defined by its normal
 * Removes component of vector perpendicular to plane
 * Essential for measuring angles in anatomical planes
 *
 * Formula: v_proj = v - (v·n)n where n is the plane normal
 *
 * @param vector - Vector to project
 * @param planeNormal - Normal vector of the plane (should be normalized)
 * @returns Projected vector lying in the plane
 *
 * @example
 * const humerusVector = { x: 0.5, y: 0.7, z: 0.3 };
 * const sagittalNormal = { x: 0, y: 0, z: 1 }; // Z-axis
 * const projected = projectVectorOntoPlane(humerusVector, sagittalNormal);
 * // Result: { x: 0.5, y: 0.7, z: 0 } (z-component removed)
 */
export function projectVectorOntoPlane(
  vector: Vector3D,
  planeNormal: Vector3D
): Vector3D {
  const dot = dotProduct(vector, planeNormal);
  const projected = {
    x: vector.x - dot * planeNormal.x,
    y: vector.y - dot * planeNormal.y,
    z: vector.z - dot * planeNormal.z,
  };
  return normalize(projected);
}
