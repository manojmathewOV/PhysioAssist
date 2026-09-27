# Independent source review of the P01/P02 implementation

Date: 2026-09-27
Application inspected: `a47ba14cf7fb015fb66b891a3b62058baaa0c002` (PR #25).
Implementation response inspected: `c4010271a051d1060c524dbdbeeca6e35b1acb3d` on PR #26, `agent-handover/responses/2026-09-27-a47ba14-claude.md`.

## Scope and disposition

This is source inspection and a review of the implementation agent's evidence. It is NOT a new execution of the full suite, the archived probes, a rendered patient journey, or a native simulator. The reported 1,566 passing / 4 skipped tests remain implementation-agent evidence. At the CI read during this review, the pull-request Checks run (36282081946) was successful and the iOS Simulator run (36282081959) was still in progress. Re-read current status before release decisions.

The handover process is working: the original baseline was reproduced, original reviewer sources were used, historical expectations were classified, and clinical content was not activated. Exact duplicate IDs now have a deduplication path. Explicit interval scheduling rather than inventing a gap for frequency-only plans is appropriate. Keep P01/P02 under review pending the issues below and fresh end-to-end evidence.

## R01 — Conflicting IDs are flagged, but the first payload still counts

Related finding: P01.
Sources: `src/services/pose/routine.ts` (`dedupe`, `todaysRoutine`) and `src/services/pose/__tests__/routineIdentity.test.tsx`.

`dedupe` puts the first record for an ID into `records`. A later different payload adds the ID to `conflicts`, but does not remove the first record. `todaysRoutine` subsequently counts those records without excluding conflicting IDs. The new conflict test explicitly expects `doneCount === 1`.

This is different from the response's statement that conflicting records are not counted. If the same ID represents a completed record and an attempted record, which one is counted depends on input order. The exact-duplicate fix should not be confused with resolution of this different-payload case.

Required resolution: define the policy explicitly. Prefer withholding disputed completion credit until an authorized resolution, or implement a documented authoritative-revision policy. Do not silently adopt arrival order as clinical truth.

Required tests: completed/attempted conflict in both input orders; same ID across different occurrence and episode payloads; exact replay remains idempotent; resolved conflicts regain only the appropriate credit. Verify patient and clinician handling, not merely the presence of an array of conflict IDs.

## R02 — Schedule changes are outside prescription-version and confirmation coverage

Related finding: P02 / prescription integrity.
Sources: `src/services/pose/routine.ts` (`PRESCRIPTION_KEYS`), `src/services/care/episode.ts` (`confirmedContent`, `keepConfirmationHonest`), and `src/store/slices/settingsSlice.ts` (`setExercisePlan`).

Neither the versioned prescription fields nor the confirmed-content comparison contains `plan.schedule`. The settings reducer composes these existing functions. Consequently a schedule-only change (interval or waking window) can retain both the old version and the existing programme confirmation.

Add the schedule to the canonical prescription identity and approval coverage. Exercise timing is part of the prescription even before an editing UI exists. Keep measurement-method comparability separate: a scheduling change need not split otherwise comparable angle observations.

Required tests: through the settings reducer, change only minimum interval, maximum interval, window start, window end, add/remove schedule and introduce an incomplete schedule. Substantive prescription changes need a new version and renewed confirmation. Semantically unchanged schedules should not create spurious revisions.

## R03 — Time-dependent eligibility is memoized without a time dependency

Related finding: P02 / patient journey.
Source: `src/components/exercises/useRoutineFlow.ts`.

The hook uses `useMemo(() => todaysRoutine(plan, history), [plan, history])`. The calculation now depends on current time, but the memo dependencies do not. No due-time or foreground refresh is present in this hook. A mounted screen can retain an earlier not-due result while time passes and plan/history remain unchanged. This is a source-level integration concern, not a claim that a device journey was executed in this review.

Use an explicit clock/eligibility invalidation mechanism, including next-due and window boundaries, midnight and app foregrounding. Prefer scheduling the next relevant boundary over unnecessary permanent rapid polling. Revalidate eligibility when Start is pressed. Clean up timers on unmount; do not compound P08.

Required tests: render at one minute before eligibility; advance a fake clock without modifying plan/history; verify the visible action becomes available. Also test foreground return after due time, window closure, midnight and teardown. Calling the pure function again with a new `now` is insufficient to prove UI refresh.

## Other limits to keep visible

- A new episode ID is created on a pathway change, not inherently for every new operation of the same type. Retain this as an explicit episode-lifecycle requirement.
- Unknown episode IDs are permitted by the current compatibility filter when either side lacks an ID. Do not describe this as proof that all legacy records are safely scoped to a new operation.
- Occurrence attribution is computed at stop from current history. Test prescription edits, midnight and interruption during activity; eventually bind a session to a validated occurrence identity at start.
- The `started` round exception permits unfinished rounds outside the window. The existing test intentionally covers a short overrun. Separately define prolonged abandonment/resumption rather than accidentally giving an old failed attempt an unlimited exemption.
- A blank-field schedule editor can be implemented without choosing clinical values. Validation should prevent activation until required values are explicitly supplied; lack of approved values does not itself prevent building the editor.
- P08 remains open despite exit code 0, as the implementation agent correctly reports.
- The archived table contains 3 + 1 + 1 + 1 = 6 failing assertions, rather than the narrative's five. Treat this as reporting arithmetic, not six current product regressions.

## Product-experience benchmarks requested by the owner

The owner asked which well-liked rehabilitation apps can inform instructional clarity, visual feedback and practical use. This is a public-document/review comparison, not first-hand authenticated use, a systematic review sample, or evidence of clinical accuracy.

- **PhysiApp (Physitrack)**: assigned exercise demonstrations, narration, offline videos and feedback to the treating clinician. A patient review describes replaying instructions and receiving changes between appointments. Borrow clear demonstrations and exercise-specific questions. Source: https://apps.apple.com/au/app/physiapp/id1047722007
- **Hinge Health**: guided exercise with camera feedback and human support. Its official manual includes demonstration/self-view, captions, pause and continuing without camera while retaining progress. Borrow a graceful camera-off pathway, not mandatory tracking. Sources: https://apps.apple.com/us/app/hinge-health/id1429270372 and https://www.hingehealth.com/user-manual/
- **Sword Health / Thrive**: real-time guidance paired with clinician support. Reviews also raise readability and tracking frustrations. Borrow the feedback-to-clinician loop; do not treat a high rating as validation of a camera-derived safety limit. Source: https://apps.apple.com/us/app/sword-health-ai-care/id1468523447
- **Medbridge GO**: one-action follow-along prescribed exercise. A historical patient review asks for spoken exercise names and transitions when exercising on the floor. Borrow audio that carries meaning without looking at the screen. Source: https://apps.apple.com/us/app/medbridge-go-for-patients/id1089747982
- **Zimmer Biomet mymobility**: pre/postoperative instructions, exercises and care-team connection. Reviews include both valued preparation and complaints when app instructions conflict with the treating team's plan. Borrow timely education while retaining the patient's approved protocol as authority. Source: https://apps.apple.com/au/app/mymobility-patient-app/id1438566065

Ratings/reviews differ by country and release. Historical complaints are hypotheses for testing, not claims that a defect persists today. Do not copy proprietary media or visual assets.

## Next implementation slice

Address R01–R03, then build one complete approved-variant journey through Learn / Do / Check. Include the minimum assistance/posture/permission identity before feeding Check into clinical progress; the rest of the variant catalogue can follow. Test an approved reference asset, meaningful audio, optional camera use where clinically appropriate, one evidence-supported cue at a time, interruption recovery, saved provenance and a later compatible comparison. Keep the three intended frozen-shoulder variants distinct from existing standing active estimators. Clinical values and the inactive template still require owner approval.

Record responses with implementation SHA, actual commands/results and limitations in `agent-handover/responses/`. Do not overwrite the prior SHA-bound review or label these source observations as independently executed regression tests.
