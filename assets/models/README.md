# Pose Detection Models

Model files are not committed. `npm install` downloads them via
`scripts/download-models.sh` (also runnable as `npm run download-models`).

## MediaPipe BlazePose Full — primary (iOS/Android camera)

- **File:** `pose_landmarker_full.task` (float16, ~9MB)
- **Used by:** `src/screens/PoseDetectionScreen.tsx` through `react-native-mediapipe`
  (VisionCamera frame processor, GPU delegate, live-stream tracking)
- **Output:** 33 landmarks (normalized x/y, relative z, visibility) plus world
  landmarks in metres, converted to `ProcessedPoseData` with schema `mediapipe-33`
  by `src/services/pose/mediapipeLandmarks.ts`
- **Bundled:** iOS via the Xcode project's Resources phase; Android by copying into
  `android/app/src/main/assets/`
- **Source:** https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task

Chosen over MoveNet because physiotherapy measurements need landmarks MoveNet
doesn't have: heels and toes (ankle dorsiflexion/plantarflexion) and hand points,
and because the metric 3D world landmarks reduce angle error from camera
position. It is also the model family the web build uses (`@mediapipe/pose`), so
native and web measurements come from the same landmark definitions.

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
