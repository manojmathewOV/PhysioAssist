/**
 * Schema-independent landmark lookup.
 *
 * MoveNet-17 and MediaPipe-33 share snake_case landmark names ('left_shoulder', ...)
 * but not indices (left_hip is 11 in MoveNet, 23 in MediaPipe), so code that reads
 * specific joints must look them up by name, never by a hard-coded index.
 */
import type { PoseLandmark } from '../../types/pose';
import { poseSchemaRegistry } from './PoseSchemaRegistry';

const indexCache = new Map<string, Map<string, number>>();

/** Landmark index for `name` in a schema ('movenet-17' | 'mediapipe-33'). */
function schemaIndex(schemaId: string, name: string): number | undefined {
  let byName = indexCache.get(schemaId);
  if (!byName) {
    byName = new Map(
      poseSchemaRegistry.get(schemaId)?.landmarks.map((d) => [d.name, d.index])
    );
    indexCache.set(schemaId, byName);
  }
  return byName.get(name);
}

/**
 * Find a landmark by name. Falls back to the index in the schema implied by the
 * landmark count (>= 33 = MediaPipe, else MoveNet) for data without landmark names.
 */
export function findLandmark(
  landmarks: PoseLandmark[],
  name: string
): PoseLandmark | undefined {
  // Fast path: named landmarks are normally stored at their schema index
  const schemaId = landmarks.length >= 33 ? 'mediapipe-33' : 'movenet-17';
  const index = schemaIndex(schemaId, name);
  const atIndex = index !== undefined ? landmarks[index] : undefined;
  if (
    atIndex &&
    (atIndex.name === name || !atIndex.name || atIndex.name.startsWith('landmark_'))
  ) {
    return atIndex;
  }
  // Named landmarks at unexpected positions (never fall back to one with another name)
  return landmarks.find((lm) => lm?.name === name);
}
