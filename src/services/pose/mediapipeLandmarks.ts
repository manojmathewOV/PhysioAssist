/**
 * Converts MediaPipe Pose Landmarker (BlazePose) results from react-native-mediapipe
 * into the app's ProcessedPoseData format ('mediapipe-33' schema).
 */
import type { PoseLandmark, ProcessedPoseData } from '../../types/pose';
import { poseSchemaRegistry } from './PoseSchemaRegistry';

/** Default bundled model file (see scripts/download-models.sh and adaptiveModel). */
export { BLAZEPOSE_FULL_MODEL_FILE as BLAZEPOSE_MODEL_FILE } from './adaptiveModel';

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
  inputImageWidth?: number;
  inputImageHeight?: number;
}

export interface MediaPipeConversionOptions {
  timestamp?: number;
  /**
   * Map normalized image points into another normalized space, e.g. the mirrored,
   * cropped camera preview so the overlay lines up. Pass `aspectRatio` for that space.
   */
  mapPoint?: (point: { x: number; y: number }) => { x: number; y: number };
  /** Width / height of the space the (mapped) landmarks are normalized in. */
  aspectRatio?: number;
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

const toPoseLandmark = (
  lm: MediaPipeLandmark,
  index: number,
  point: { x: number; y: number } = lm
): PoseLandmark => ({
  x: point.x,
  y: point.y,
  z: lm.z,
  visibility: landmarkScore(lm),
  index,
  name: MEDIAPIPE_33_NAMES[index] ?? `landmark_${index}`,
});

/**
 * Convert the first detected pose in a result bundle. Returns null when no pose
 * was found. World landmarks (metres, hip-centred) keep the image landmarks'
 * names and visibility so they can be looked up the same way.
 */
export function mediapipeResultToPoseData(
  bundle: MediaPipePoseResultBundle,
  { timestamp = Date.now(), mapPoint, aspectRatio }: MediaPipeConversionOptions = {}
): ProcessedPoseData | null {
  const pose = bundle.results[0];
  const rawLandmarks = pose?.landmarks[0];
  if (!rawLandmarks || rawLandmarks.length === 0) {
    return null;
  }

  const landmarks = rawLandmarks.map((lm, index) =>
    toPoseLandmark(lm, index, mapPoint ? mapPoint(lm) : lm)
  );
  const rawWorld = pose.worldLandmarks[0];
  const worldLandmarks = rawWorld?.length
    ? rawWorld.map((lm, index) => ({
        ...toPoseLandmark(lm, index),
        visibility: landmarks[index]?.visibility ?? 0,
      }))
    : undefined;

  const confidence =
    landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;
  const imageAspect =
    bundle.inputImageWidth && bundle.inputImageHeight
      ? bundle.inputImageWidth / bundle.inputImageHeight
      : undefined;

  return {
    landmarks,
    worldLandmarks,
    aspectRatio: aspectRatio ?? (mapPoint ? undefined : imageAspect),
    timestamp,
    confidence,
    inferenceTime: bundle.inferenceTime,
    schemaId: 'mediapipe-33',
    zIsRelative: true,
    hasDepth: Boolean(worldLandmarks),
  };
}
