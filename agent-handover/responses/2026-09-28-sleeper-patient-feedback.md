# Patient-visible sleeper result — runbook decision

2026-09-28. Reviewed application/runbook basis: `89a57e4458a0a16c1f1e014a20d1c900551ba2b6`. This update changes the delivery contract and generated views, not application code or measurement activation.

## Owner selection

Manoj selects the approximate rotation number, a simple schematic, the previous comparable reading and a best recorded value for the patient. D08 display intent is therefore resolved for this composition; the numerical caudal allowance, measurement qualification, display precision, approved asset and remaining clinical dose/schedule decisions are not. The current shoulder-level/90-degree variant and caudal leeway remain unchanged.

The former clinician-only idea remains a historical reviewer proposal, not a new account requirement. The current contract is `runbook.json -> shoulder_capture.patient_feedback`, rendered in RUNBOOK.md under **Patient result**. The compact ACTIVE view still starts S2a camera-optional Do; no new roadmap/gates or acceptance ledger was created.

## Design and invariants

The proposed post-Check card has one large **About X degrees**, an elbow state such as **near shoulder level**, a same-interval schematic, smaller **Last comparable check** and **Best recorded in this recovery** rows with dates, a short variability note and one Done/Return action. Full explanation is optional. No repeat-to-beat prompt, trophy, target arc, recovery percentage or manufactured improvement.

The schematic uses a simple side-lying outline and separates forearm rotation from elbow alignment; it must not draw different anatomical planes as a single measured angle. Render from retained observations, not a camera still or generative reconstruction. If comparing visually, show at most one earlier compatible observation with labelled solid/dashed strokes; never combine its forearm with another interval's elbow. Unknown measured geometry is omitted, not filled with an ideal pose. It remains private health-derived information despite having no photo.

A valid but out-of-position estimate may appear only as a secondary observation with its exclusion reason, and only if that method remains valid for the actual position. An unreliable or unavailable angle is absent even in grey. Approximate status, warning, date and units remain readable; grey text is not the only indication. Unknown band or unassessable elbow never passes automatically. Small drift requires an explicitly approved allowance, not a perfection demand; no numeric band has been set.

Previous/best select only durable, eligible Checks in the same patient/episode/side/variant/assistance and compatible setup/reference/method/selection/allowance-policy series. Previous excludes current. The current value enters recorded best only after save acknowledgement. First/tied/unsaved/duplicate/corrected/deleted/partial-history records have explicit handling. Incomplete history says **Best in saved checks**, not all-time. Dose changes alone need not split a compatible method; an allowance change may. Older excluded attempts stay visible without corrupting the comparison.

The inspected `ExerciseSummary.tsx` suppresses a **score-based** personal-best banner and prior score in comfort mode; `sessionOutcome` also removes displayed target comparison. The new factual ROM history is a separate presentation policy. Retain those existing guards; do not remove `!coachingLimited`, reuse `previousBestScore`, or permit extra force/range/holds to expose the record. Safety and symptoms still outrank both visuals and selected speech.

## Scoped review and practical delivery

Claude's latest review is relayed by Manoj and corroborates the 15 caudal and original 20 synthetic tests at 89a57e4; it is not clinical accuracy or a reviewer-authored GitHub approval. No fresh full application test was run by this document task. Storage independent review/formal safety record remain separately pending.

Continue S2a guided activity, S2b durable records and explicit held-interval numerical observations, then S2c reopening/history. Build and test the result selector/schematic with synthetic input before the study. Study qualification controls real numerical activation, not whether we may implement the interface. Evaluate patient comprehension and native accessibility, not only attractive screenshots. Reuse local storage/dependencies, compact vector rendering and one owned workspace; no clinician backend, raw-video retention or new library required by this decision.

Verification: same 11 gates/83 criterion IDs, eight existing scenarios refined, no acceptance states changed. Portable structural/matrix/generated-view checks passed. Installed CCore definition inspection: zero structure errors, zero blocked axes, 121 dimensions; `DefinitionTopologyReadmissionRequired` and no execution/acceptance authority persist. See `runbooks/ios-patient-mvp/evidence/patient-feedback-20260928.json`.
