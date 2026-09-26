# Pose Detection Models

Model files are not committed. `npm install` downloads them via
`scripts/download-models.sh` (also runnable as `npm run download-models`).

## MediaPipe BlazePose Full + Lite (iOS/Android camera)

- **Files:** `pose_landmarker_full.task` (float16, ~9MB, default) and
  `pose_landmarker_lite.task` (~6MB). `src/hooks/useBlazePose.ts` starts on Full and
  steps down to Lite once if measured inference times exceed the frame budget
  (`src/services/pose/adaptiveModel.ts`)
- **Used by:** every native camera screen through `src/hooks/useBlazePose.ts`
  (`react-native-mediapipe` VisionCamera frame processor, GPU delegate, live-stream tracking)
- **Benchmark:** docs/benchmarks/POSE_MODELS.md
- **Output:** 33 landmarks (normalized x/y, relative z, visibility) plus world
  landmarks in metres, converted to `ProcessedPoseData` with schema `mediapipe-33`
  by `src/services/pose/mediapipeLandmarks.ts`
- **Bundled:** iOS via the Xcode project's Resources phase; Android by copying into
  `android/app/src/main/assets/`
- **Source:** https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task

Chosen over MoveNet: 37% lower joint-angle error on the COCO benchmark, plus heels
and toes (ankle dorsiflexion/plantarflexion) and hand points that MoveNet doesn't
have. It is also the model family the web build uses (`@mediapipe/pose`), so native
and web use the same landmark definitions. Angles are computed from
aspect-corrected 2D landmarks; world landmarks only flag limbs turned out of the
image plane (see `src/services/pose/measurementLandmarks.ts`).

## MoveNet Lightning INT8 — legacy

- **File:** `movenet_lightning_int8.tflite` (~3MB)
- **Used by:** `src/services/PoseDetectionService.v2.ts` (react-native-fast-tflite),
  which native screens other than the main pose screen still import
- **Output:** 17 keypoints, schema `movenet-17`
- **Source:** https://www.kaggle.com/models/google/movenet (TF Hub links are retired)

## Landmark schemas

Both schemas are defined in `src/services/pose/PoseSchemaRegistry.ts` and share
snake_case landmark names (`left_knee`, `right_ankle`, ...), so the goniometer
looks joints up by name and works with either. Ankle angles need
`left_foot_index`/`right_foot_index`, which only `mediapipe-33` provides.
