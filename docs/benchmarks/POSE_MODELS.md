# Pose model benchmark and angle-method evaluation

Run on 2026-09-25. Reproduce with `benchmarks/pose-models/`:

```bash
pip install mediapipe ai-edge-litert opencv-python-headless   # Linux also needs libegl1 libgles2
cd benchmarks/pose-models
python3 prepare_data.py          # 150 COCO val2017 people + models
python3 bench_models.py          # accuracy + latency per model
python3 bench_angle_methods.py   # how angles should be computed
```

## Data and metrics

- 150 COCO val2017 images, each with exactly one annotated person, at least 15 of
  17 keypoints labelled and the person filling at least 15% of the frame. The
  images are in-the-wild photos (sport, occlusion, odd viewpoints), which is much
  harder than a clinic setup.
- **PCK@0.05 / @0.1:** share of visible keypoints predicted within 5% / 10% of
  the person's bounding-box size of the human annotation (17 COCO points).
- **Angle error:** |predicted − annotated| for elbow, knee, hip and shoulder
  angles, using only joints whose three points are all annotated as visible
  (1,033 joint angles). This is the goniometry-relevant metric.
- **Latency:** 4-core Xeon 2.1 GHz CPU. Only the relative numbers are
  meaningful; phones run these on the GPU/Neural Engine.
  - *Per image:* person detector + landmark model.
  - *Tracking:* per-frame cost in video mode once a person is being tracked.
    This is how the app runs (LIVE_STREAM).

## Results

| Model | Size | Detected | PCK@0.05 | PCK@0.1 | Mean angle error | Within 10° | Per image | Tracking |
|---|---|---|---|---|---|---|---|---|
| BlazePose Lite | 5.8 MB | 145/150 | 78.4% | 90.6% | 14.0° | 61% | 22 ms | 12 ms |
| **BlazePose Full** (shipped) | 9.4 MB | 145/150 | 84.6% | 93.9% | **11.7°** | 66% | 27 ms | 15 ms |
| BlazePose Heavy | 30.7 MB | 145/150 | 88.1% | 95.3% | 9.9° | 74% | 62 ms | 49 ms |
| MoveNet Lightning int8 (previous) | 2.9 MB | 150/150* | 74.2% | 89.5% | 18.6° | 54% | 3 ms | n/a |

\* MoveNet always outputs 17 points, even when it hasn't really found a person.

Median angle error per joint:

| Model | Elbow | Knee | Hip | Shoulder |
|---|---|---|---|---|
| BlazePose Lite | 8.5° | 7.7° | 7.6° | 6.3° |
| **BlazePose Full** | 7.8° | 5.8° | 6.9° | 5.4° |
| BlazePose Heavy | 5.8° | 4.5° | 5.7° | 5.2° |
| MoveNet Lightning | 13.3° | 8.7° | 8.4° | 8.0° |

**Choice:** BlazePose Full for live use. Compared with MoveNet Lightning, it:
- cuts the mean angle error by 37% (elbow median 13.3° → 7.8°);
- adds heel and toe landmarks (ankle angles) and world 3D landmarks;
- tracks at about 15 ms per frame even on CPU.

Heavy is about 1.7° more accurate but 3× slower and 3× larger. It's a candidate
for a "hold still and capture" measurement mode, not for live tracking. Lite
suits low-end Android devices.

## How angles are computed (important)

Same 150 images with BlazePose Full, varying only how angles are computed from
the landmarks (compared with angles from the human annotations):

| Method | Mean angle error |
|---|---|
| Normalized x/y + MediaPipe image z (**app behaviour before this change**) | **38.3°** |
| Normalized x/y, no aspect correction | 14.6° |
| World 3D landmarks | 19.9° |
| **Aspect-corrected 2D** (x scaled by width/height, z ignored) | **11.7°** |

- **Image-landmark z** is a relative depth guess on a different scale, and
  mixing it in more than triples the error.
- **Normalized x and y** are divided by different lengths (width vs height), so
  on any non-square frame every oblique angle is skewed.
- **World landmarks** get their depth from the same 2D output, and published
  evaluations report added error for distal joints (see the research notes
  below). They're used to *flag* limbs turned toward or away from the camera,
  not to compute the angle.

The app computes all joint angles from `getMeasurementLandmarks()` in
`src/services/pose/measurementLandmarks.ts` (aspect-corrected 2D) and uses
`getOutOfPlaneJoints()` to mark a reading as an estimate when a limb segment is
tilted more than 30° out of the image plane.

## Research notes (literature, as of 2026-09)

- **No lightweight pose model released in 2025–26 clearly beats BlazePose** for
  single-person, 33-point, commercially licensed mobile use.
  - RTMPose/RTMW is more accurate on paper but has no React Native path.
  - YOLO-pose models are AGPL-licensed.
  - ML Kit adds no accuracy over BlazePose.
  - MediaPipe 1.0.0 (Jul 2025) did not change the pose models.
- **Smartphone goniometry validity:**
  - Shoulder abduction with MediaPipe vs a universal goniometer: bias about 0°,
    limits of agreement ±6–7°, ICC 0.97–0.99.
  - Sagittal lower-limb and shoulder angles: typically 5–6°.
  - Elbow flexion is weakest (SEM around 12° in a BlazePose study), so treat it
    as an estimate.
  - Out-of-plane and rotation angles are not reliable from a single camera.
- **Filtering:** MediaPipe's LIVE_STREAM mode already applies One Euro smoothing
  to the landmarks, so the app doesn't add a second heavy filter.
- **Recommended next steps:**
  - A standard camera setup per movement: side-on for flexion, front-on for
    abduction.
  - MediaPipe Hand Landmarker as a separate wrist/finger mode.
  - Per-device model choice: Lite on low-end devices, and on thermal throttling.
  - Upgrade the native MediaPipe runtimes (Android tasks-vision 0.10.2 is from
    2023).
  - Web: move to `@mediapipe/tasks-vision` so web and mobile use the same model
    version.
