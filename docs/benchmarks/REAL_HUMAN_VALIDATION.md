# Real-human validation

The virtual patient (src/testing/virtualPatient) proves the logic with exact, scripted
landmarks. This layer runs **real MediaPipe Pose output from real people** through the
unchanged session pipeline and compares it with **motion capture**. That's where tracking
noise, depth ambiguity and real movement show up.

## Data

Clemente C., Chambel G., Silva D.C.F., Mesquita Montes A., Pinto J.F., Plácido da Silva H.
_Feasibility of 3D Body Tracking from Monocular 2D Video Feeds in Musculoskeletal
Telerehabilitation._ Sensors 2024, 24(1):206. https://doi.org/10.3390/s24010206.
Data: https://doi.org/10.5281/zenodo.10408307, licensed **CC BY 4.0**.

- 8 healthy adults, 8 exercises, 2 sets × 7 repetitions each, performed correctly under a
  physiotherapist's supervision.
- 1280×720 video at 30 fps, run through MediaPipe Pose (12 body joints in world
  coordinates).
- Qualisys motion capture at 100 Hz, with the markers placed by a physiotherapist, as
  ground truth.
- Camera placement:
  - Frontal-plane exercises: filmed from the front.
  - Sagittal-plane exercises: filmed **at 35°** to the body, not side-on.
- The dataset contains no video or images, only numbers.

`scripts/fixtures/telerehab_prepare.py` downloads the record, verifies its MD5 and
writes compact fixtures:

- world landmarks at 15 fps;
- ground-truth joint amplitude at 10 Hz, computed as in the paper's Table 3, with
  markers identified by anatomy because their order varies between files.

Subjects 1–2 are committed: 16 files, 680 KB, in
src/testing/recordedPatient/fixtures. The full set is regenerated on demand.

## Pipeline under test

```
fixture frame
  -> RecordedPatient (MediaPipe result contract; missing points get visibility 0)
  -> mediapipeResultToPoseData
  -> PoseEnricher
  -> MovementRecorder (joint-of-interest clinical angle, camera view)
  -> segmentReps
  -> analyseSession (range, return, tempo, compensation checks)
```

The same segmentation runs on the motion-capture angle series, so repetition counts are
compared like for like.

## What it found and what changed

| Problem found on real data                                                                                                            | Cause                                                                                                                                          | Fix                                                                                                                                                                               | Before → after                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Every recording classified as side view, including front-facing ones                                                                  | Orientation thresholds were absolute fractions of image width. At the recommended 2 m, a real person's shoulders cover about 10% of the frame. | Shoulder and hip width as a share of torso length (scale-free)                                                                                                                    | 0/24 front-facing seen as front → 24/24                                               |
| 35° recordings treated as front, with front-only checks running on them                                                               | No oblique class                                                                                                                               | `viewOf`: front if shoulders ≥ 0.62 and hips ≥ 0.44 of torso length, side if shoulders ≤ 0.35, oblique otherwise. Hip ratio was 0.47–0.53 facing the camera and 0.38–0.44 at 35°. | Squat sessions with a false alarm: 8/8 → 0/8                                          |
| Shoulder press counted 2–9 repetitions instead of about 14                                                                            | Fixed session-wide thresholds; a press rests at "goalpost", not neutral                                                                        | Prominence-based repetition detection (as in `scipy.signal.find_peaks`)                                                                                                           | 8/8 within ±1 of motion capture                                                       |
| "Pelvis shifting", "pelvis not level" and "knee inward" flagged in almost every rep of hip abduction, march and seated knee extension | A moving leg drags the ankle midpoint and MediaPipe's hip point (median 62% of torso length for pelvis shift)                                  | These checks run only in weight-bearing exercises (squat, sit-to-stand, lunge, step-up)                                                                                           | Hip abduction sessions flagged 8/8 → 2/8 (trunk lean, a real Trendelenburg-type sign) |
| "Elbow bending" flagged on every shoulder press                                                                                       | Bending the elbows is part of a press                                                                                                          | Per-exercise exclusion                                                                                                                                                            | 8/8 → 0/8                                                                             |
| "Trunk turning" in presses                                                                                                            | With arms overhead, MediaPipe's shoulder points slide inward                                                                                   | Frames with the arm above 100° are skipped                                                                                                                                        | 3/8 sessions → 0/8                                                                    |
| "Not coming back fully" on most press repetitions                                                                                     | Compared with the single lowest rest; a press rests part-way by design                                                                         | Compare with the median rest, with 15° slack (healthy rest varies 10–15°)                                                                                                         | Warnings only, no flags                                                               |
| Shoulder angles about 15° high                                                                                                        | Arm measured against the same-side shoulder→hip line, which slopes inward                                                                      | Measure against the trunk midline (clinical goniometry and Sports2D convention)                                                                                                   | Bias +14.9/+19.4/+15.1° → +11.2/+13.2/+11.3° (abduction / flexion / press)            |
| Virtual patient's front-view proportions unrealistic                                                                                  | Synthetic hips 0.43 of torso length (real: 0.47–0.53)                                                                                          | Hips 0.51 and shoulders 0.72, the real medians                                                                                                                                    | —                                                                                     |

The current numbers are in [REAL_HUMAN_RESULTS.md](REAL_HUMAN_RESULTS.md). The gate test,
`src/testing/recordedPatient/__tests__/recordedPatient.test.ts`, runs on every CI build.

## Accuracy: what to tell clinicians

- **Front-facing shoulder abduction and press** read about 11° higher than motion
  capture. This is consistent with the authors' own MediaPipe error (MAE 13° and 14° on
  peaks). It is a model bias, not something to calibrate away with 8 young healthy
  subjects.
- **Squat knee flexion at 35°** reads about 16° low, because a 2D angle loses depth
  when the camera isn't square to the movement. Knee flexion needs a **true side
  view**; the app now detects the oblique view.
- **Elbow flexion at 35°** reads about 30° low, for the same reason as the squat.
- **Shoulder flexion at 35°** reads about 13° high: depth ambiguity, the dataset's
  worst exercise.
- **Seated knee extension** is not supported yet. It moves the knee _towards_ neutral,
  while repetition analysis assumes movement away from it. Supporting it is the next
  step for the knee.

Report measured ranges as **approximate**, and only from the recommended camera view.

## Limits of this validation

- **Participants:** 8 young, healthy adults (7 female, 1 male) doing correct repetitions.
  This validates counting, view handling and false-alarm rates, not detection of real
  compensations in patients.
- **Input:** MediaPipe world landmarks projected onto the camera plane (the dataset has
  no image landmarks). This is close to, but not identical to, the image landmarks the
  app uses.
- **Model version:** the dataset's own MediaPipe Pose from 2023, not the app's
  `pose_landmarker_full.task`.
- **Detection of real compensations:** still validated only on the virtual patient.
  Real-video datasets (MobiPhysio; REHAB24-6 for internal benchmarking only, CC BY-NC)
  are the next layer.
