/**
 * Converts MediaPipe Pose Landmarker (BlazePose) results from react-native-mediapipe
 * into the app's ProcessedPoseData format ('mediapipe-33' schema).
 */
import type { PoseLandmark, ProcessedPoseData } from '../../types/pose';
import { poseSchemaRegistry } from './PoseSchemaRegistry';

/** Bundled model file (see scripts/download-models.sh). */
export const BLAZEPOSE_MODEL_FILE = 'pose_landmarker_full.task';

/** Shape of a MediaPipe landmark as delivered by react-native-mediapipe. */
export interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

/** Subset of react-native-mediapipe's PoseDetectionResultBundle that we consume. */
export interface MediaPipePoseResultBundle {
  results: {
    landmarks: MediaPipeLandmark[][];
    worldLandmarks: MediaPipeLandmark[][];
  }[];
  inferenceTime: number;
}

const MEDIAPIPE_33_NAMES: string[] = (() => {
  const schema = poseSchemaRegistry.get('mediapipe-33');
  const names: string[] = [];
  schema?.landmarks.forEach((def) => {
    names[def.index] = def.name;
  });
  return names;
})();

const landmarkScore = (landmark: MediaPipeLandmark): number =>
  landmark.visibility ?? landmark.presence ?? 0;

/**
 * Convert the first detected pose in a result bundle. Returns null when no pose
 * was found.
 *
 * x/y are normalized [0, 1] image coordinates unless `mapPoint` is given, e.g. to
 * map them into the (mirrored, cropped) camera preview so the overlay lines up.
 * World landmarks are metric 3D coordinates centred on the hips.
 */
export function mediapipeResultToPoseData(
  bundle: MediaPipePoseResultBundle,
  timestamp: number = Date.now(),
  mapPoint?: (point: { x: number; y: number }) => { x: number; y: number }
): ProcessedPoseData | null {
  const pose = bundle.results[0];
  const rawLandmarks = pose?.landmarks[0];
  if (!rawLandmarks || rawLandmarks.length === 0) {
    return null;
  }

  const landmarks: PoseLandmark[] = rawLandmarks.map((lm, index) => {
    const { x, y } = mapPoint ? mapPoint({ x: lm.x, y: lm.y }) : lm;
    return {
      x,
      y,
      z: lm.z,
      visibility: landmarkScore(lm),
      index,
      name: MEDIAPIPE_33_NAMES[index] ?? `landmark_${index}`,
    };
  });

  const confidence =
    landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;
  const worldLandmarks = pose.worldLandmarks[0];

  return {
    landmarks,
    worldLandmarks,
    timestamp,
    confidence,
    inferenceTime: bundle.inferenceTime,
    schemaId: 'mediapipe-33',
    hasDepth: Boolean(worldLandmarks && worldLandmarks.length > 0),
  };
}
