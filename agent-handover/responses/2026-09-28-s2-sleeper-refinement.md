# S2 clarification: approximate sleeper rotation and bounded delivery

## Owner correction, not a new measurement claim

On 2026-09-28 Manoj clarified: "sleeper stretch can give an approximate internal rotation number". The earlier categorical drift-only/no-number restriction was the implementer's overconstraint. Current requirements now permit a clearly labelled approximate internal-rotation estimate alongside independently observable position drift. Historical reviews are preserved as historical, not edited to erase the change.

Candidate geometry: forearm orientation in the prescribed sleeper position, from a bedside view sufficiently aligned with the upper-arm axis to expose the rotation plane. No overhead rig is mandated. This is a design hypothesis to evaluate, not evidence that any slightly raised side view already measures accurately. Define the angle reference and direction; a restricted arbitrary starting pose is not zero internal rotation. Elbow flexion, hand height and wrist bending must not be substituted for shoulder rotation.

The display can be approximate IR, separately labelled movement from setup, or unavailable according to the qualified method/reference. Number and drift observations can have different visibility. Material body/camera movement can invalidate the measurement basis; unavailable is never zero, stable appearance is not proof of correct setup, and an old reading is not presented as current. Keep method/view/assistance provenance in later comparisons. No claimed error bound, clinical dose, range escalation, scapular fixation or force measurement is added.

This update changes the runbook contract; it does not implement or activate a sleeper estimator. D05/C05 exact variant and approved asset and D07/C05 schedule anchor remain open, as do the other unconfirmed dose details. They block the affected prescription, not synthetic interaction development.

## Independent review relayed by the owner

Manoj supplied Claude's latest read-only review accepting both compact-progress accessibility and the Android identity note at `4c8b20d14cf923d1501e54f2700376f9fcb9870d`. Claude reports clean TypeScript and 1,661 passed/four opt-in skipped tests with natural exit. The iOS VoiceOver route is API-contract tested, not a physical listening test. This is a relayed review record, not an APPROVE submitted as Claude by this writer.

The receiving agent separately read the hosted run results at `60fce34542cc6eaa8f08bc2252e5ca4239eb85ad`: Checks 36360528579 and iOS Simulator 36360528611 both succeeded. This is the prior application/documentation head, not a new feature's validation. Storage-read containment still awaits independent review; the reviewer-authored safety acceptance record remains separately pending.

## Three implementation increments, one existing S2

1. **S2a: camera-optional interaction.** Explicit start, pause, interruption/resume and finish of the prescribed activity, without creating poses or numerical assessment. Until durable storage is integrated, an unsaved attempt is explicitly unsaved and earns no routine credit.
2. **S2b: durable recording.** Correct completion basis, persistent acknowledgement, failed-write/read handling and replay-safe retry. The read-recovery guard remains intact.
3. **S2c: reopening/progress.** Recover the correct patient/episode/side/occurrence record, show participation and the next eligible session. Unmeasured activity is not a failed or zero measurement.

These are scoped commits and evidence within the same 11 gates/83 criteria, not new gates or another state ledger. The active work remains S2/G05.W1; whole-gate acceptance and patient-use requirements are unchanged.

## Verification boundary

The existing portable runbook checks passed: 7 structural, 6 delivery and 14 matrix negative controls; 11 gates and 83 criterion IDs remain. The installed CCore definition inspector returned zero structure errors and zero blocked dimensions across 121 dimensions, with declaration hash `ffd3a1a679a8d25c35d0a87b19aa595b247634414464d9a94d5980678e0feb69`. `DefinitionTopologyReadmissionRequired`, 11 owner-construction gaps and unbound native execution remain; no gate was accepted.

No application source, estimator, clinical prescription, dependency, dataset or native build was changed by this clarification. Prior application tests are not represented as a new run. Historical review text was preserved. Use the next bounded S2a increment, not another planning project.
