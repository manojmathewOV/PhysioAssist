/**
 * The one way camera screens run pose detection on iOS/Android.
 *
 * Wraps react-native-mediapipe's BlazePose landmarker (VisionCamera frame
 * processor, GPU delegate, live-stream tracking) and turns each result into
 * enriched ProcessedPoseData:
 *   MediaPipe result -> preview-space landmarks (+ world landmarks, aspect ratio)
 *   -> PoseEnricher (orientation, quality, anatomical frames) -> Redux / onPose
 *
 * Usage:
 *   const { cameraProps, error } = useBlazePose({ device, enabled: isDetecting });
 *   <Camera device={device} isActive {...cameraProps} />
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { CameraDevice, CameraProps } from 'react-native-vision-camera';
import {
  usePoseDetection,
  RunningMode,
  Delegate,
  type PoseDetectionResultBundle,
  type ViewCoordinator,
} from 'react-native-mediapipe';

import type { ProcessedPoseData } from '../types/pose';
import { setPoseData } from '../store/slices/poseSlice';
import { mediapipeResultToPoseData } from '../services/pose/mediapipeLandmarks';
import { PoseEnricher } from '../services/pose/PoseEnricher';
import {
  BLAZEPOSE_FULL_MODEL_FILE,
  BLAZEPOSE_LITE_MODEL_FILE,
  MODEL_DECISION_SAMPLES,
  inferenceBudgetMs,
  shouldStepDownModel,
} from '../services/pose/adaptiveModel';

/** Camera frame rate; detection runs at CAMERA_FPS / frameSkip. */
export const CAMERA_FPS = 30;

export interface UseBlazePoseOptions {
  /** Camera device in use (needed to know whether the preview is mirrored). */
  device: CameraDevice | undefined;
  /** Attach the frame processor. When false no frames are analysed at all. */
  enabled: boolean;
  /** Analyse every Nth frame (from settings). Defaults to 1 (every frame). */
  frameSkip?: number;
  /** Dispatch each pose to the Redux pose slice. Defaults to true. */
  dispatchToStore?: boolean;
  /** Extra per-pose consumer (e.g. a screen's own measurement logic). */
  onPose?: (pose: ProcessedPoseData) => void;
  /**
   * Bundled model file. Omit for automatic selection: BlazePose Full, stepping
   * down to Lite once if the device can't keep up (see adaptiveModel).
   */
  model?: string;
}

export type BlazePoseCameraProps = Pick<
  CameraProps,
  'pixelFormat' | 'onLayout' | 'onOutputOrientationChanged' | 'frameProcessor'
>;

export interface UseBlazePoseResult {
  /** Spread onto <Camera>. */
  cameraProps: BlazePoseCameraProps;
  /** Detector error message, if the native detector failed. */
  error: string | null;
  /** Model file currently running. */
  activeModel: string;
}

export function useBlazePose({
  device,
  enabled,
  frameSkip = 1,
  dispatchToStore = true,
  onPose,
  model,
}: UseBlazePoseOptions): UseBlazePoseResult {
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);
  const [autoModel, setAutoModel] = useState(BLAZEPOSE_FULL_MODEL_FILE);
  const activeModel = model ?? autoModel;
  const targetFps = CAMERA_FPS / Math.max(1, frameSkip);
  const enricherRef = useRef<PoseEnricher>();
  enricherRef.current ??= new PoseEnricher();

  // Latest values for the result callback, which the native side holds on to
  const latest = useRef({
    enabled,
    dispatchToStore,
    onPose,
    view: { width: 1, height: 1 },
    canStepDown: false,
    budgetMs: 0,
    inferenceTimes: [] as number[],
  });
  latest.current.enabled = enabled;
  latest.current.canStepDown =
    model === undefined && autoModel === BLAZEPOSE_FULL_MODEL_FILE;
  latest.current.budgetMs = inferenceBudgetMs(targetFps);
  latest.current.dispatchToStore = dispatchToStore;
  latest.current.onPose = onPose;

  const onResults = useCallback(
    (bundle: PoseDetectionResultBundle, viewCoordinator: ViewCoordinator) => {
      const { enabled: active, view } = latest.current;
      if (!active) {
        return;
      }
      // Automatic model selection from measured inference times
      if (latest.current.canStepDown) {
        const times = latest.current.inferenceTimes;
        times.push(bundle.inferenceTime);
        if (times.length >= MODEL_DECISION_SAMPLES) {
          if (shouldStepDownModel(times, latest.current.budgetMs)) {
            latest.current.canStepDown = false;
            setAutoModel(BLAZEPOSE_LITE_MODEL_FILE);
          }
          times.length = 0;
        }
      }
      const frameDims = viewCoordinator.getFrameDims(bundle);
      const pose = mediapipeResultToPoseData(bundle, {
        // Map into the mirrored, cropped preview so overlays line up with the image
        mapPoint: (point) => {
          const mapped = viewCoordinator.convertPoint(frameDims, point);
          return { x: mapped.x / view.width, y: mapped.y / view.height };
        },
        aspectRatio: view.width / view.height,
      });
      if (!pose) {
        return;
      }
      const enriched = enricherRef.current!.enrich(pose);
      if (latest.current.dispatchToStore) {
        dispatch(setPoseData(enriched));
      }
      latest.current.onPose?.(enriched);
    },
    [dispatch]
  );

  const onError = useCallback((e: { code: number; message: string }) => {
    console.error('Pose detection error:', e.message);
    setError(e.message);
  }, []);

  const solution = usePoseDetection(
    { onResults, onError },
    RunningMode.LIVE_STREAM,
    activeModel,
    {
      delegate: Delegate.GPU,
      fpsMode: Math.max(1, Math.round(targetFps)),
    }
  );
  latest.current.view = solution.cameraViewDimensions;

  useEffect(() => {
    solution.cameraDeviceChangeHandler(device);
  }, [device, solution]);

  // Fresh orientation history / frame cache whenever detection restarts
  useEffect(() => {
    if (enabled) {
      enricherRef.current?.reset();
    }
  }, [enabled]);

  return {
    cameraProps: {
      pixelFormat: 'rgb',
      onLayout: solution.cameraViewLayoutChangeHandler,
      onOutputOrientationChanged: solution.cameraOrientationChangedHandler,
      frameProcessor: enabled ? solution.frameProcessor : undefined,
    },
    error,
    activeModel,
  };
}
