# Sleeper stretch: paired rotation and quantitative elbow drift

2026-09-28. Inspected app: `dc123553e3c1e8649ef9be14e91a1955624b0aa7`. Owner request: approximate IR is useful over time, and elbow drift must also be analysed and computed. Research only: no live estimator, clinical threshold/dose or prescription activated.

## Findings in the current code

`src/services/movement/compensations.ts` already has aspect-corrected inputs, torso-normalized distances, visibility checks, baseline/filter machinery and quantitative CompensationHit values. Reuse those ideas, not the standing ER rule.

- `elbow_from_side` applies only to front-view `shoulder-external-rotation`, not sleeper stretch. Do not transfer its elbow-at-side cue or 15/25-degree heuristics.
- `analyseSession` reduces quantitative detector hits to finding/severity/cue/repetition counts. The production probe supplies a synthetic 19.2-degree/450-ms hit over two reps: none of value/unit/duration survives that aggregate. This is a missing temporal-data capability, not evidence of actual patient error.
- `null` can mean not applicable, unobservable or below threshold. Continuous observation states must distinguish these.
- Each repetition can acquire its own rest baseline. Keep a confirmed session baseline too, or slow cumulative elbow migration can disappear through repeated resets.
- The held-assessment path does not invoke the supplied compensation detector: the synthetic heel-prop positive control measured an angle while calling it zero times. A future held sleeper Check must explicitly pair both channels.

## Quantities to compute independently

1. **Elbow location relative to the torso**, normalized to a defined body reference, with signed components and total displacement.
2. **Upper-arm direction change**, including the observable elevation/plane components, rather than elbow-to-shoulder distance alone.
3. **Shoulder position relative to the torso**, where observable. Shoulder and elbow may move together while their relative direction stays unchanged. This is not scapular or humeral-head tracking.
4. **Elbow bend and torso orientation change**, separately from the approximate IR number.

Using a valid torso origin O, orthonormal orientation R and consistent scale L:

`pE(t) = transpose(R(t)) * (E(t)-O(t)) / L(t)`

`elbowDriftVector(t) = 100 * (pE(t)-pE(setup))`

The magnitude and components are percent of that named torso reference. Without calibrated metric scale, do not label this centimetres. In 2-D retain only the observed, aspect-corrected projected components; do not silently fill depth. An elbow moving along the line of sight can remain in the same pixel location.

For the arm direction use `u=normalize(pE-pS)` and compare u(t) with u(setup). A rotating rigid upper arm retains its length, so length alone cannot detect elbow drift. Expressing elbow position only relative to the shoulder also misses the shoulder and elbow shifting together.

A torso frame must not fit itself to the drifting elbow/wrist. Preserve which reliable torso landmarks define it; do not swap bilateral centres for whichever side becomes visible. Using the affected shoulder as a torso anchor may absorb some motion: test that bias. Side-lying occlusion may make the full body frame unobservable. The prototype supplies exact axes; it does not solve that vision problem.

Keep torso roll as a separate observation even when registration removes it from elbow-relative geometry. A prescribed initial roll is not compensation. A support-plane distance needs an independently established mattress plane, not screen y. Camera/view changes require a new reference; never adapt the baseline to follow a drifting elbow silently.

Approximate IR should use a declared forearm-direction reference perpendicular to the upper-arm axis, not elbow flexion or hand height. A restricted arbitrary starting pose is not zero IR. Even an exact angle in a changed upper-arm position may not be clinically interchangeable with the original setup. Never compute corrected IR by subtracting elbow drift.

## Temporal record: pair the same contributing interval

The endpoint angle and elbow drift must come from the same interval, not the largest angle from one repetition and the steadiest elbow from another. Preserve:

- Approximate angle, method/reference, side, assistance, variant and camera/setup identity.
- Elbow drift vector/magnitude, upper-arm direction change and other separately observable changes.
- Endpoint interval and its per-output validity, coverage, baseline and dimensionality (projected 2-D versus qualified estimated 3-D).
- A summary of sustained drift and, if subsequently qualified, the angle when sustained drift starts. This is an observation, not a safety limit.

Retain small observed values even below an alert threshold; a warning-only record cannot distinguish stable technique from unobservable data or quantify improvement. The first/last setup positions must be retained so daily rebaselining cannot make a changed test look equivalent. Missing is not zero. Material position changes should annotate or separate comparison, not erase the historical attempt. A deliberately chosen endpoint-window rule must precede data inspection; do not search for the most favourable window.

Patient presentation proposal: approximate rotation plus elbow position (steady/moved/not clear); detailed review can show magnitude/direction. No rigid fixation instruction, more-force cue, tissue diagnosis or automatic improvement claim. Clinical selection/thresholds remain unresolved.

## Executed probes

`python3 sleeper_geometry_probe.py --output results.json` uses only Python's standard library. Twenty tests pass, including 500 deterministic transform/scale cases inside one test. The results reproduced byte-for-byte on the Mac and cloud. The initial run had one exact-floating-point assertion (42 vs 42.00000000000001); it was changed to numerical tolerance, not claimed as an app defect.

The production probe runs against a supplied checkout with its installed TypeScript: `node audit_current.cjs /path/to/repo`. It injects a synthetic detector result to inspect data preservation and uses a held-assessment positive control. No real patient/video or sleeper angle is measured by that probe. See production-probe.json.

| Known synthetic change | IR surrogate | Elbow/torso observation |
|---|---|---|
| Forearm rotation 30 to 50 degrees, fixed upper arm | 50 degrees | Zero elbow drift |
| Upper-arm swing 10 degrees, IR remains 30 | 30 degrees | 10-degree direction change and 10.46% torso-reference displacement despite unchanged arm length |
| Shoulder and elbow move together | 30 degrees | 5% torso-reference elbow shift; zero upper-arm direction change |
| Whole setup turns 20 degrees | 30 degrees | Zero torso-relative elbow drift; torso orientation change 20 degrees |
| Uniform scale 1.8 and translation | 30 degrees | Zero normalized drift under the supplied exact-frame assumptions |
| Wrist hidden, elbow/torso observable | Unavailable | Drift retained |
| Camera-reference ID changes | Unavailable | Old baseline rejected |

A projection counterexample has zero 2-D drift and nonzero depth movement. A reset-baseline case shows 5 degrees since the last repetition versus 10 degrees since the session setup. These are mathematical controls, NOT camera performance estimates. The values are not exercise targets or warning cutoffs. Supplied axes, visibility and camera-change flags still require their own real-world implementations.

## Evidence outside the repository

- Awan et al. (2002), 56 unimpaired high-school athletes: IR varied with measurement/scapular-control technique. https://pubmed.ncbi.nlm.nih.gov/12235602/
- Wilk et al. (2009): differing stabilization methods produce differing IR measurements and reproducibility. https://doi.org/10.1177/1941738108331201
- Optical tracking in 20 healthy subjects (2015): maximum IR depends on humeral position. Elbow repositioning changes the assessed position, not merely image noise. https://pubmed.ncbi.nlm.nih.gov/26410346/
- Wilk et al. (2013): modified sleeper positioning in overhead athletes; not a prescription for Manoj's frozen-shoulder patients. https://pubmed.ncbi.nlm.nih.gov/24175603/
- ISB segment-coordinate recommendations: https://pubmed.ncbi.nlm.nih.gov/15844264/ . This prototype is a geometric surrogate, not ISB-compliant bony-axis measurement.
- MediaPipe pose landmark definitions: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker . Estimated depth/visibility is not calibrated clinical angular certainty or scapular tracking.

No source establishes an acceptable elbow-drift threshold or test-retest error for this particular bedside method. Do not import the existing standing-ER thresholds.

## Return to implementation

This refines existing G05/G08 work without new gates. Keep S2a camera-optional Do as the active task. Develop continuous, per-output sleeper measurements independently from cue thresholds; carry their same-interval numerical record through history rather than only the warning list. Validate the exact variant with independent angle and elbow-position references, both sides, restricted movement, props, torso roll, shoulder-plus-elbow motion, camera nudges, missing timestamps and self-positioning on another day. No new bulk video collection is needed to establish the geometric contract.

## Publication/check boundary

The runbook has the same 11 gates and 83 criterion IDs. Portable checks passed; CCore definition inspection reported zero structure errors/blocked dimensions and 121 declared dimensions, but still requires topology/owner binding. No execution epoch or acceptance was created. See run.json. This research did not rerun the application suite, build iOS or activate a detector.
