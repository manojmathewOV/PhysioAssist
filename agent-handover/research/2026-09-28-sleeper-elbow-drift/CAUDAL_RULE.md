# Owner-specified sleeper variant: shoulder level, with caudal leeway

2026-09-28. Refines the existing paired angle/drift research, not a new clinical programme or live estimator. Basis: `24e565813931bf703dc53379a06ff4ea8c2f6eb7`.

## Settled by Manoj, versus reviewer proposals

Manoj specifies side-lying with the upper arm straight out approximately 90 degrees from the body, at shoulder level: “in line with the pillow” when a pillow is used. The pillow is a teaching cue, not an image-calibration landmark. The principal unwanted change is the elbow migrating caudally towards the waist during internal rotation. He explicitly requires leeway: perfect immobility is not the aim. His clinical observation is that this change can permit an apparently greater rotation than the intended shoulder-level position.

The drift-tolerance value is NOT specified. Claude's 10–15-degree suggestion is an unapproved study candidate, not a default. Numerical patient display versus an initial clinician-reviewed evaluation also remains undecided; do not silently adopt clinician-only display or restore the former categorical no-number ban. Exact reference asset, hold/rest, symptom rules and schedule anchor remain separate outstanding inputs. No rigid-fixation instruction or increased force is implied.

Claude's latest review, relayed by Manoj, independently corroborates the original 20-test prototype and its two production aggregation/held-path findings. This is not a formal GitHub approval or new clinical validation. Existing original reports and results are preserved.

## Primary computation and its reference

With a qualified support-plane definition, project the shoulder-to-elbow upper-arm direction and the caudally directed trunk axis into that plane. Let beta be their included angle. **Signed caudal deviation = 90 degrees - beta**: positive is towards the waist, negative towards the head. For example, beta=75 means 15 degrees caudal deviation. These numbers describe geometry, not an accepted tolerance.

Keep absolute deviation from the prescribed orientation AND change since the established session setup. Starting at beta=82 and later reaching 78 means 8 then 12 degrees of deviation, not merely an apparently acceptable 4 degrees of movement. A new repetition baseline must not erase accumulated movement. Unknown/rejected starting geometry cannot be turned into zero.

Keep elbow lift, torso roll and observable shoulder movement separate. This primary caudal measure narrows the problem; it does not prove that other substitutions are absent. Retain normalized, body-relative caudal displacement as a fallback where projected movement is observable but anatomical/support-plane degrees are not. Do not convert pixels, mattress height or a shortened upper arm into fabricated degrees or centimetres.

## Camera: practical candidate, not a geometric guarantee

A camera facing the chest approximately along the upper arm can see forearm rotation yet strongly foreshorten that upper arm. A raw shoulder-elbow/trunk angle drawn on the image is not the angle in the bed plane. The known-geometry probe shows true 10-degree caudal deviation appearing as 19.43 degrees for one 30-degree raised orthographic camera; exactly end-on, the baseline arm projection degenerates. These are illustrative projection effects, NOT a recommendation for a 30-degree placement or an app accuracy estimate.

Use one practical slightly raised bedside view for the initial study, with modest position variation assessed. Possible solutions are qualified 3-D estimation, sufficiently supported plane geometry or the observable normalized caudal displacement; selection needs evidence. Estimated world landmarks do not make an invisible joint a measured ground truth. No overhead rig or multi-camera patient setup is required by this rule.

## Same-interval endpoint and permissible movement

A candidate comparison endpoint is the largest robust endpoint estimate among a PREDECLARED set of assessment intervals that satisfy the approved caudal tolerance and other setup/visibility/reference conditions. Do not choose a single highest noisy frame or search arbitrary windows until the result looks best. Preserve candidate count, window rule and method: restricting to a band does not itself remove selection bias.

Also retain the overall observed endpoint and its actual paired drift, marked outside the comparison criterion when appropriate. Never combine an angle and elbow position from different moments and never subtract drift from rotation. No interval qualifies when tolerance/reference/observability is unspecified; preserve observations and explain why no comparable result is issued. This does not invalidate completion of an otherwise prescribed activity.

The tolerance is for the comparison method, not a licence to stretch farther. It is one-sided for caudal movement; separately qualify gross cranial or out-of-plane departures rather than inventing a symmetric band. Preserve tolerance-policy identity with each result. Changing the accepted band changes the eligible endpoint set, so future trends need an explicit compatibility decision, not a silent splice.

Separate physical leeway from tracking uncertainty. A near-boundary estimate with unresolved uncertainty is not confidently inside or outside the band. Quantify small movements continuously but avoid cues for every fluctuation. Debounce/hysteresis and quality margins need their own testing; they must not widen the clinical allowance silently. Symptoms and prescribed stop rules outrank position cues.

## Study and patient presentation

The study should assess rotation AND caudal upper-arm alignment, not only a forearm inclinometer. Forearm inclination alone does not establish shoulder rotation when arm/torso position changes. Use clinician-observed setup plus an independent reference for the upper-arm/trunk geometry and forearm direction, with two-day self-setup where appropriate. Healthy volunteers can expose feasibility/noise; they cannot alone set the acceptable tolerance for stiff shoulders. Patient inclusion needs appropriate approvals and exercises. Ten to fifteen volunteers is a proposed formative sample, not a validated sample-size calculation.

Assess whether the band is achievable AND whether admitting it materially changes the reported IR, alongside false cues, usable coverage and repeated-setup error. The decision combines clinical acceptability with measurement performance, not just a healthy-person percentile. Do not infer that any dataset or model is categorically incapable of side-lying estimation without a scoped evaluation.

Proposed patient wording: “Keep your elbow roughly level with your shoulder, in line with your pillow if you use one.” Show only qualified approximate rotation and a restrained position state; do not promise perfect technique or say push further. The confirmed 90-degree upper-arm reference is not an unconfirmed elbow-bend prescription.

## Verification and next work

`python3 caudal_geometry_probe.py --output caudal-results.json` adds 15 independent known-geometry/policy tests using the existing vector utilities. It covers signed caudal movement, headward distinction, lifting separately, mirrored sides, reference rotation/scale, off-target starting posture, degeneracy, camera projection and explicit unset/boundary tolerance states. Arbitrary test tolerance 12 degrees is not a clinical default. One initial acos roundoff assertion was relaxed to 1e-5 decimal tolerance; no app defect was inferred.

The prior 20 tests and result bytes are also rechecked. These are offline research tests, not a live estimator, RGB test, clinical approval or full-application regression. No additional media or model download is required.

Keep the active S2a/S2b/S2c flow. Two bounded engineering enablers support a later Check: an observation channel that preserves values/units/duration even below cue thresholds, and explicit paired observations during a held interval. Do NOT simply feed a hold through the repetition detector: baseline, continuity and hold-specific cues must remain correct. The wearer must never receive the existing standing ER elbow-at-side cue during sleeper stretch. No large generic drift framework or clinician backend is needed first.

### External evidence checked separately from owner instructions

- Humphries et al., 2015, 20 healthy subjects: IR depends on humeral position. Supports controlling position, not this exact caudal tolerance: https://pubmed.ncbi.nlm.nih.gov/26410346/
- Wilk et al., 2009: stabilization methods give different IR measurements; does not validate this bedside estimator: https://pubmed.ncbi.nlm.nih.gov/23015864/
- MediaPipe describes predicted 33-point world/image landmarks, not a validated sleeper-specific error bound: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker
