# MobiPhysio pilot: real smartphone video, frozen benchmark

The recorded-patient layer ([REAL_HUMAN_VALIDATION.md](REAL_HUMAN_VALIDATION.md)) replays
MediaPipe output that someone else produced. This layer starts from **real smartphone
video** and runs it through **the app's own pose model** and then the unchanged session
pipeline. It is a frozen inference benchmark: nothing is trained on it, and no threshold was
changed before the baseline below was recorded. Two fixes followed. Each was designed on the
inspection group, checked on the validation group, and then run once on the untouched test
group (see [Fixes after the baseline](#fixes-after-the-baseline)).

## Data

Iqbal M.T.B., Mostafa M.T., Ahmed M.T., Fahim M.F., Ahmed M.S., Ahamad A., Islam K.R., Ryu
B., Song G., Hossain M.Z. _MobiPhysio: A 2D video dataset of physiotherapy exercises for
AI-driven assessment and monitoring._ Data in Brief 65 (2026) 112635.
https://doi.org/10.1016/j.dib.2026.112635. Data: Harvard Dataverse,
https://doi.org/10.7910/DVN/XSI0QN, version 3.0, **CC0 1.0**.

- Smartphone video from 8 phone models on a tripod at about 1100 mm height, portrait and
  landscape, 25–30 fps.
- Camera angle labelled Front / Left / Right. The dataset doesn't give the side angle in
  degrees.
- Capture conditions: full, medium and low light; low and high jitter; occlusion; low
  resolution.
- Expert performers filmed full sets of about 30 s, scored by physiotherapists (EAAQ,
  0–100, a session-level quality rating). Non-expert performers filmed short
  demonstrations of 1–5 s, mostly single repetitions, without scores.

### Pilot selection

The selection rule is fixed in
[mobiphysio-pilot-manifest.json](mobiphysio-pilot-manifest.json), which lists file IDs,
MD5 checksums and the reason each clip was chosen.

- **Participant-disjoint groups:**
  - inspection: P02, P05, P09, P13, P18, P26, P29, P53
  - validation: P03, P10, P30, P35
  - untouched test: P07, P14, P32, P58
- **Clips (89 in total):**
  - Shoulder abduction (E01), full light, front/left/right for all 16 participants (48 clips).
  - For the inspection group only: front-view abduction under every other available
    condition (25 clips), plus lateral rotation (E03) and circumduction (E05), front, full
    light (16 clips).
- **Paired stress tests** on 6 clean front abduction clips from the inspection group,
  each run with 8 transforms (48 runs). Only the pixels change; the movement is the same.
  The transforms are 720p, 480p, 3 stops under-exposed with noise, backlit, JPEG quality 12,
  handheld shake, legs cropped out, and mirrored.

The raw videos show identifiable people. They are never committed and stay outside the
repository. [scripts/fixtures/mobiphysio_pilot.sh](../../scripts/fixtures/mobiphysio_pilot.sh)
downloads them from the manifest (MD5-checked) and extracts landmarks.

## Pipeline under test

```
phone video (15 fps sample)
  -> MediaPipe Tasks Pose Landmarker, VIDEO mode, assets/models/pose_landmarker_full.task
     (md5 83879689d373d143be094c972355e48e), 1 pose, 0.5 confidences (the app's options)
  -> VideoPatient (the result contract the app's bridge delivers: image + world landmarks,
     frame size)
  -> mediapipeResultToPoseData -> PoseEnricher
  -> MovementRecorder -> segmentReps -> analyseSession + compensation checks
```

`src/testing/videoPatient/analyseVideo.ts` computes the following for each clip:

- pose availability;
- visibility of the working arm and trunk;
- camera view;
- repetitions;
- top and bottom of the range (95th and 5th percentile);
- angle jitter (RMS difference from a 5-frame median);
- share of frames where the joint was withheld;
- share shown as an estimate (out of the image plane);
- compensation findings;
- inference time.

The working arm is the one with the larger range, because the dataset doesn't say.

## Baseline results (frozen)

Full tables: [MOBIPHYSIO_PILOT_BASELINE.md](MOBIPHYSIO_PILOT_BASELINE.md).

### 1. The app never recognised a front view (critical)

**0 of 89 clips** were classified as a front view. The 57 front-labelled clips came out as
oblique (52) or side (5).

Consequence: the seven checks that need a front view never ran on any of them:
shoulder hike, head tilt, trunk side lean, trunk rotation, knee valgus, hip hitch and
pelvic shift. So **"0 sessions with a flagged compensation" here means the checks were
silent, not that they are specific.** On a real phone, "you were hiking your shoulder"
would never be said.

The cause is the front-view rule: shoulders ≥ 0.62 and hips ≥ 0.44 of torso length. It was
calibrated on the Clemente dataset, which provides _world_ landmarks projected onto the
image, and there the hips measure 0.47–0.53 of torso length. The app uses MediaPipe's
_image_ landmarks. In the inspection group, people squarely facing the camera measure hips
0.35–0.39 and shoulders 0.64–0.73. This is consistent with anthropometry: the distance
between hip-joint centres is about 17–18 cm against a torso of about 45–50 cm. The unit tests
missed this because the virtual patient copied the Clemente proportions.

The front labels are also unreliable. By measured body yaw (below), 6 of the 17 front-labelled
inspection clips were filmed at 40–60°, so some "front" clips really are oblique.

### 2. Pose availability, speed and range

- **Pose availability:** a person was found in 99–100% of frames in every group and
  condition, including low light, jitter and occlusion.
- **Speed:** median inference was 22–27 ms per frame on a 4-core Xeon CPU. This is not a
  phone measurement.
- **Expert abduction sets:** median 10 repetitions, top of range 170°, jitter 0.8°.
  The dataset has no repetition ground truth, so counts are descriptive. The roughly 30 s
  sets are consistent with 10 repetitions.
- **Non-expert clips:** median 1 repetition and top of range 128°. These are short
  single demonstrations, so they aren't comparable with the expert sets.
- **Circumduction:** median 10 repetitions and top of range 165°. The app tracks arm
  elevation, which circumduction includes.
- **Lateral rotation:** top of range 82°, which is the arm held out while rotating. The app
  measures elevation, not rotation, so it cannot assess this exercise. It still counted
  a median of 2 "repetitions" from small elevation changes. Rotation needs its own
  measurement before it can be offered.

### 3. Restraint

- **Withheld measurements:** the joint was withheld in 6% of frames in the inspection
  group, 19% in validation and 2% in test. Withheld frames cluster in clips where the
  working arm is on the far side of the body. Two validation clips (P30 front, P03 right)
  withheld 100% and 73%; the app did not guess.
- **Estimates:** 15–18% of measured frames were shown as estimates because the arm was
  turned towards or away from the camera.

### 4. Paired stress tests

| Transform      | Median top-of-range change | Same rep count | Notes                                                        |
| -------------- | -------------------------- | -------------- | ------------------------------------------------------------ |
| 720p           | 0.7°                       | 6/6            |                                                              |
| 480p           | 0.6°                       | 5/6            |                                                              |
| Handheld shake | 0.5°                       | 6/6            |                                                              |
| JPEG q12       | 1.7°                       | 6/6            |                                                              |
| Backlit        | 2.5°                       | 5/6            |                                                              |
| Legs cropped   | 2.6°                       | 4/6            | 1 new flagged compensation                                   |
| Dark           | 6.3°                       | 3/6            | Withheld frames rise (e.g. 49% → 80%), so fewer reps counted |
| Mirror         | 2.1°                       | 4/6            | Working side flips on 6/6, as it should                      |

One clip (E01_P02_AF_VFL) accounts for every change larger than 15°. It is a 4 s
landscape clip with a single repetition, filmed at about 57°, and 37% of its frames are
withheld even when clean. The other five clips are stable under every transform.
Darkness mainly makes the app withhold measurement, which is the safe way to fail.

**Not yet tested:** a second person in the frame.

## Fixes after the baseline

Final tables: [MOBIPHYSIO_PILOT_AFTER.md](MOBIPHYSIO_PILOT_AFTER.md).

### Camera view from body yaw

The view now comes from how far the body is turned, measured in MediaPipe's 3D world
landmarks: the angle of the shoulder line and the hip line out of the image plane,
averaged. The view is front up to 15°, side from 60°, and oblique in between. This
measurement doesn't depend on body proportions or on which landmark set is used.

| Source (rest posture)                         | Measured yaw |
| --------------------------------------------- | ------------ |
| MobiPhysio, facing the camera (inspection)    | 0.5–8°       |
| Clemente, frontal-plane exercises             | 0.5–6°       |
| Clemente, 35° camera                          | 19–36°       |
| MobiPhysio, filmed from the side (inspection) | 37–74°       |

- **Fallback without world landmarks:** the width-ratio rule now uses image-landmark
  proportions (front if shoulders ≥ 0.58 and hips ≥ 0.33 of torso length).
- **Virtual patient:** its world landmarks now carry depth for each side of the body, so
  it exercises the same code.
- **Label noise:** yaw and image proportions agree on which clips face the camera, and
  they often disagree with the dataset's angle label. For example, 10 of 16
  "right"-labelled clips read as facing the camera (within 15°).
- **Clemente side effect:** the 35° recordings are now all oblique (seated knee
  extension had read as front in 7 of 8, shoulder flexion in 1 of 7), and a false flag on
  seated knee extension disappeared. See [REAL_HUMAN_RESULTS.md](REAL_HUMAN_RESULTS.md).

### Shoulder hike measured against the normal rise

Once front views were recognised, shoulder hike fired on almost every repetition from
**expert** performers, including clips scored 100/100. When the arm rises, the shoulder
girdle elevates normally (scapulohumeral rhythm), and the model's shoulder point moves
with it. The previous thresholds were set on the virtual patient, which had no such
movement.

The normal rise was measured on the inspection experts (7,108 frames, facing the camera,
scores 64–100), as a share of shoulder width:

| Arm angle | 30–60° | 60–90° | 90–120° | 120–150° | 150°+ |
| --------- | ------ | ------ | ------- | -------- | ----- |
| Median    | 0.035  | 0.084  | 0.126   | 0.159    | 0.189 |
| 97th pct  | 0.115  | 0.170  | 0.229   | 0.280    | 0.297 |

- **New rule:** the detector subtracts the median curve (`NORMAL_SHOULDER_RISE`) and flags
  a rise more than 0.12 of shoulder width above normal (warns above 0.08). That is above
  the healthy 97th percentile at every arm angle.
- **Virtual patient:** its shoulders now rise along the same curve, so its hike scenarios
  must exceed the normal rise to be detected.

### Before and after

| Group                            | Clips | Front view recognised | Sessions flagged | Sessions warned |
| -------------------------------- | ----- | --------------------- | ---------------- | --------------- |
| Inspection (fixes designed here) | 65    | 0 → 41                | 0 → 4            | 0 → 6           |
| Validation                       | 12    | 0 → 6                 | 0 → 0            | 0 → 0           |
| Untouched test (run once)        | 12    | 0 → 7                 | 0 → 1            | 0 → 0           |

Between the two fixes, a compensation (almost always shoulder hike) was flagged in 21 of
65 inspection sessions and 4 of 12 validation sessions. The remaining flags are:

- **Inspection:**
  - shoulder hike on one circumduction clip (3 repetitions), where the shoulder
    legitimately rises more than in abduction;
  - shoulder hike on one high-jitter abduction clip scored 70;
  - elbow bend on two lateral-rotation clips, where the elbow is held at 90° by design.
    The app doesn't offer that exercise.
- **Test:** shoulder hike and head tilt on one front abduction clip (P07, scored 84). With
  no frame-level labels it can't be called right or wrong, and it was not tuned on.

## What this does not show

- **Correct detection of real compensations.** The dataset has no frame-level
  compensation labels, and the performers are healthy. This pilot measures false alarms
  on correct performances. Detection of actual hiking is still shown only on the virtual
  patient.
- **The normal-rise curve beyond young healthy adults.** It comes from 5 expert
  performers. Older adults and people with shoulder pathology may differ, which needs
  clinical review.
- **Angle accuracy.** There is no motion capture. The EAAQ physiotherapist score is a
  session-level quality rating, **not angle ground truth**. Angle accuracy is covered by
  the Clemente benchmark.
- **Repetition accuracy.** There is no repetition ground truth.
- **Clinical populations.** The participants are healthy adults.
- **Live phone conditions.** Inference ran on a desktop CPU with the MediaPipe Python
  package and the same model file, sampled at 15 fps. On a phone it runs at the camera
  rate.

## Protocol notes

- **The test group** was run twice: in the frozen baseline and once after both fixes. The
  fixes were designed on the inspection group and checked on the validation group only.
- **Disclosure:** while the harness was being checked, one diagnostic printout of
  shoulder and hip width ratios included the front clips of three participants outside
  the inspection group (P03, P07, P10). Those numbers are not used for any calibration.
