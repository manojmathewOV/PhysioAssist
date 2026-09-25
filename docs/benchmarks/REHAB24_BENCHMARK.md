# REHAB24-6 benchmark (internal, exploratory)

**Status:** internal, non-commercial technical benchmarking only. This is not product,
clinical or post-operative validation. The dataset is CC BY-NC 4.0: it stays outside the
repository, and only this method and aggregate numbers are committed. Before using it for
a commercial product, for validation claims or for regulatory evidence, get written
permission from the maintainers (info@visioncraft.ai).

Černek A., Sedmidubsky J., Budikova P. _REHAB24-6: Physical Therapy Dataset for
Analyzing Pose Estimation Methods._ SISAP 2024. Data: https://doi.org/10.5281/zenodo.13305825.

## What it tests

The full pipeline runs on real RGB video: frame → the app's MediaPipe model
(`pose_landmarker_full.task`, VIDEO mode, the app's options) → the app's landmark
handling → camera view → joint angle → repetitions → compensation findings. Results are
compared with:

- **motion capture:** OptiTrack skeleton, frame-aligned at 30 fps;
- **the physiotherapist's labels:** repetition boundaries and a correct/incorrect label
  per repetition.

Two synchronised cameras see the same performance from different views. The camera labels
say front, side or half-profile ("oblique" here), relative to the direction the subject faced.

| Exercise                      | App joint (definition)               | App exercise id |
| ----------------------------- | ------------------------------------ | --------------- |
| Ex1 arm abduction (right arm) | shoulder: upper arm vs trunk midline | side-arm-raise  |
| Ex2 arm V-W                   | shoulder (right)                     | shoulder-press  |
| Ex5 lunge                     | knee flexion (front leg)             | lunge           |
| Ex6 squat                     | knee flexion (right)                 | squat           |

**Ground truth** (`scripts/fixtures/rehab24_truth.py`), computed in 3D:

- **Shoulder, app definition:** upper arm (Arm→ForeArm) against the trunk pointing down
  (Spine1→Hips).
- **Shoulder, joint-angle definition:** elbow–shoulder–hip, shown alongside for
  comparison. The two definitions differ by about 9° with the arm down and about 1° at
  the top.
- **Knee:** 180 − hip–knee–ankle.

**Participant-disjoint groups:** inspection 1–4, validation 5–6, untouched test 7–9. Both
cameras of a participant always stay in the same group. Nothing was tuned for this
baseline. Its tables pool all nine participants and also show each participant separately.

**Reproduce:**

```bash
scripts/fixtures/rehab24_pilot.sh ~/rehab24
REHAB24_DIR=~/rehab24 REHAB24_OUT=out.md npx jest src/testing/videoPatient/__tests__/rehab24.test.ts
```

## Baseline results

Frozen at commit c886d58, with a CSV line-ending fix to the harness only. Full tables:
[REHAB24_BASELINE.md](REHAB24_BASELINE.md).

### 1. Knee flexion must be filmed from the side

| Knee flexion, frame by frame        | Front     | Oblique   | Side        |
| ----------------------------------- | --------- | --------- | ----------- |
| Squat: app MAE (bias)               | 42° (−42) | 17° (−17) | 7.4° (−2.9) |
| Lunge: app MAE (bias)               | 47° (−47) | 18° (−18) | 9.2° (−6.7) |
| Squat: MediaPipe 3D world angle MAE | 21°       | 13°       | 6.9°        |

- **Front view:** the knee bends towards the camera, so the 2D angle reads nearly
  straight at the bottom of a squat. All 20 worst repetitions are front-view squats or
  lunges, off by 94–113° at the peak.
- **3D world angle:** it halves the front-view error but is still far too large to show.

**Implication:** knee flexion needs the side-view gate that seated knee extension now has.
From the front, the app should give set-up guidance, not numbers.

### 2. Bilateral exercises: pick the leg the camera can see

In the squat's side view, the benchmark's fixed "right knee" was often the far leg, so the
angle was withheld in 88% of frames and only 20% of repetitions were counted. The app
withheld correctly rather than guessing, but a bilateral exercise should measure the near
leg.

### 3. Shoulder

**Arm abduction from the front:**

- **Angle:** MAE 6.3°, bias −3°, 95th percentile 14°.
- **Peak and bottom of range:** peak MAE 6.4°, bottom-of-range MAE 3.9°.
- **Rep counting:** within ±1 in 9/9 sessions.

**Oblique view:** MAE 16°. Here the MediaPipe 3D world angle is better (12°).

**Side view:** the app withholds the angle, which is correct for a frontal-plane movement.

**Arm V-W:** repetitions don't return to a neutral rest, and the timing errors were
2–3 s. This exercise isn't a good fit for the current repetition model.

### 4. Confidence

- **The "estimate" marker works:**
  - shoulder: 23° MAE on frames marked as estimates, against 10.5° on the rest;
  - knee: 41° against 20°.
- **Landmark visibility doesn't predict angle error.** Knee frames with visibility ≥ 0.95
  had the largest errors, because front-view foreshortening doesn't lower visibility.
  Visibility is not a geometric confidence measure.

### 5. Correct vs incorrect repetitions (exploratory)

- **Arm abduction from the front:**
  - any finding: 68% of incorrect repetitions against 28% of correct ones;
  - flags only: 46% against 11%.
- **Squat, lunge and V-W:** discrimination is near chance, and there are false alarms on
  correct repetitions. For example, heel lift was flagged on 8 correct squats, and pelvic
  shift and trunk lean on 5 each.
- **What the label is:** the physiotherapist gave each subject different mistakes, and
  the mistake type isn't recorded. So no named compensation can be scored against it.

### 6. Robustness

- **Another person in view:** no measurable harm. MAE was 11.9–20.7° across the four
  levels, against 17.3° with no one else in view.
- **Lighting:** evening light was no worse than lights on (15.8° against 18.8°).
- **Detection and speed:** a person was found in 100% of frames. Median inference was
  31 ms per frame on a desktop CPU.

## What this doesn't validate

- Post-operative exercises: passive or active-assisted motion, heel slides, straight-leg
  raises, seated knee extension, or external rotation. See UCO Physical Rehabilitation.
- Named compensations.
- Pain, tissue loading, or readiness to progress.

## Fixes after the baseline

The fixes were designed on the inspection participants (1–4) and checked on validation
(5–6), then run once on the test participants (7–9). The choice to use the 3D angle at
oblique views was first read from the pooled baseline, which included the test group. So
for that rule the test group isn't strictly untouched: it held on inspection and on
validation separately before it was adopted.

1. **3D angle at oblique views, shown as an estimate.** For the shoulder and knee, when
   the camera is at an angle to the movement, the angle comes from MediaPipe's world
   landmarks (`services/pose/worldAngle.ts`).
2. **Knee angle withheld from the front for squat and lunge.** Repetitions are timed by
   the hips dropping when most frames have no angle. Set-up guidance is not given from the
   front, because the front view is right for the knee-tracking checks.
3. **Far-leg set-up guidance.** When the measured joint is behind the other one in a
   side-view exercise, the app asks the patient to bring that leg or arm closest to the
   phone. It does not silently measure the other leg, because after surgery the operated
   side is the one that matters.
4. **Benchmark reporting.** Set-up guidance is now reported separately from movement
   findings.

| Test group: app MAE vs motion capture | Frozen baseline | After fixes   |
| ------------------------------------- | --------------- | ------------- |
| Arm abduction, oblique                | 16.6°           | 15.1°         |
| Arm V-W, oblique                      | 18.9°           | 11.0°         |
| Squat, oblique                        | 16.5°           | 12.1°         |
| Lunge, oblique                        | 16.2°           | 11.8°         |
| Squat, front: frames given a number   | 100% (MAE 46°)  | 0% (withheld) |
| Lunge, front: frames given a number   | 100% (MAE 43°)  | 35% (MAE 14°) |

Inspection and validation groups together:

- **Oblique abduction:** 16° → 10.9°.
- **Side-view squat, rep count exactly right:** 11% → 67% of sessions (baseline pooled
  over all participants).

Full tables: [REHAB24_AFTER.md](REHAB24_AFTER.md).

## Open problems (not tuned: seen on the test group, or needing more data)

- **Far-leg guidance on the test group's side-view squats.** It fired on only 3% of
  repetitions, while the angle was withheld on 99% of frames. The app held back safely but
  didn't say why. In the development groups it fired on 70%.
- **Hip-drop counting for front-view squats.** It failed in all 3 test sessions.
- **Heel-lift false alarms on correct side-view squats.** They were flagged on 31% of
  correct repetitions in the development groups, now that more side-view repetitions are
  measured.
- **Arm V-W.** It doesn't fit the away-and-back repetition model (timing errors of 2–3 s).
