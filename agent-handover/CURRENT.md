# Current handover state

Prepared: 2026-09-27.

Application reviewed: `c7ac7f3bdda47ab736553b25bdca6f4100a8f74b`.
Active implementation PR: #25.
Implementation branch at handover: `claude/task-b828413-details-f3cmpw`.

This file consolidates earlier SHA-bound reviews. Creating the handover is not a new full application test run. Read the current branch before carrying forward any status.

## Implemented at the reviewed baseline

The application contains a care-pathway/phase catalogue, programme confirmation, specialist gating, comfort-phase coaching, a shared session clock, explicit unknown-side handling, multiple daily occurrences, assistance/loading metadata and measurement-method grouping. The revised patient view separates the next activity from setup controls; Home uses routine progress; holds have a timer; measurements lead the Progress screen. See the original code at the pinned SHA, particularly `src/services/care/episode.ts`, `src/services/care/pathways.ts`, `src/services/pose/routine.ts`, `src/services/session/sessionClock.ts` and `src/services/movement/exerciseMovement.ts`.

The web focus view was reported by the implementation agent as tested with a public video used as a fake camera. This handover does not independently validate its clinical measurements, consent scope, real multi-person behavior or native-platform parity.

## Most recent independent results

- Existing suite: 1,550 passed, four skipped, using `--forceExit`.
- Additional protocol-fit probes: four passed; two failed.
- P01: replaying the same completed record filled a second daily occurrence. This is an injected duplicate, not evidence that a patient encountered it.
- P02: a frequency-only plan offered the next round one minute later. The current schema cannot express the requested two-to-three-hour spacing; this is a new requirement, not failure of an existing interval scheduler.
- A separate proposed Python model had 43 passing named checks in the earlier review. It is not application code or clinical validation and is not included here because it embeds private-source protocol rules.

## Next priorities

1. P01: durable occurrence/event identity and replay-safe completion.
2. P02: daytime mini-session windows, repetition ranges and no accumulated catch-up dose.
3. P03/P04: approved source revision and procedure-specific exercise variants, without generic clinical substitutions.
4. P05: separate Learn, Do and Check; everyday activity must not automatically become a standardized clinical assessment.
5. P06/P07: approved-reference playback, patient usability and native-device evidence.

## Superseded assumptions

- A generic shoulder elevation limit is not an external-rotation limit. Original reviewer tests using it as such are historical only. A future clinical restriction should name its quantity, position and verification limits.
- Dose/goal changes do not necessarily invalidate an otherwise compatible measurement series. Grouping solely by prescription version was superseded by method-based comparison.
- The b06be91 wall-time completion defect was addressed in subsequent implementation. Its original test reconstructs the old stop calculation and is not a valid regression against the new clock wiring without adaptation.
- An unavailable measurement is not a zero; no legacy fallback should resurrect it.

## Boundaries still open

The exact source-driven protocol layer, protected clinical-content delivery, Learn/Do/Check, clinical approval of templates, real approved-video journeys, enlarged text/native-device testing, test runner clean exit, measurement repeatability and supervised usability require further work or evidence. Programme confirmation in the prototype must not be confused with authenticated clinician authorization.

## Update: implementation response 2026-09-27 (a47ba14)

Implementation agent response: [responses/2026-09-27-a47ba14-claude.md](responses/2026-09-27-a47ba14-claude.md). Evidence: [evidence/2026-09-27-a47ba14/](evidence/2026-09-27-a47ba14/run.json). Author-reported; not an independent retest.

- Application now at `a47ba14cf7fb015fb66b891a3b62058baaa0c002` on PR #25 (baseline c7ac7f3 had no newer commits; P01/P02 reproduced there first).
- P01 implemented_pending_review: event-id de-duplication with surfaced conflicts, execution-time `occurrenceKey`, episode-scoped records.
- P02 implemented_pending_review as a generic contract only: explicit interval + waking window (no defaults), rounds, no catch-up, ranged repetitions. The archived frequency-only P02 probe still fails by design; replacement test uses the new contract with synthetic values. Frozen-shoulder draft remains inactive (C05 open; anchor needs confirming).
- Archived reviewer tests at a47ba14: 06e77dd 6/9 (3 superseded), 29e6e14 18/19 (wording), b06be91 0/1 (superseded clock formula), c7ac7f3 5/6 (P02 spec-gap probe). Mapping to current replacements is in the response.
- Full suite without `--forceExit`: 1,566 passed, 4 skipped, exit 0, but a worker was force-exited by Jest: P08 remains open.

## Update: implementation response 2026-09-27 (414b81b)

Response to the independent source review [reviews/2026-09-27-a47ba14-source-review](reviews/2026-09-27-a47ba14-source-review/REVIEW.md): [responses/2026-09-27-414b81b-claude.md](responses/2026-09-27-414b81b-claude.md), evidence [evidence/2026-09-27-414b81b/](evidence/2026-09-27-414b81b/run.json). Author-reported; not an independent retest.

- Application at `414b81b170a6205b9fcb3aca20f3cab89bb850a1` (PR #25).
- R01: disputed event ids earn no credit in either order; correction records (`resolves`) settle them; set-up warns. Corrects the a47ba14 response's wording.
- R02: schedule (canonical) is in the prescription version and confirmation coverage.
- R03: time-aware routine (next boundary, foreground, midnight; timer cleaned up); Start re-checks eligibility; sessions bound to their occurrence/episode at start.
- Begun mini-sessions close at the end of the waking window; new-episode action; blank-field schedule editor (drafts offer nothing).
- Full suite 1,585 passed, 4 skipped, exit 0 without --forceExit; P08 still open (worker force-exited).

## Scope revision: iPhone patient-only MVP runbook

See [runbooks/ios-patient-mvp/README.md](runbooks/ios-patient-mvp/README.md). This is a prospective plan based on application `414b81b170a6205b9fcb3aca20f3cab89bb850a1`, not a new app test run. It defers clinician portals/linkage, messaging and clinical cloud sync while retaining future-ready data boundaries. All 11 gates begin unaccepted. Native CCore Research/Runbook authoring did not complete; exact refusal/inspection results are retained alongside successful portable plan-structure checks. Start at G00; preserve prior evidence and recheck new code before treating older findings as current.

## Hybrid execution qualification: 2026-09-27

At app `414b81b`, the independent hybrid qualification ran typecheck, lint (0 errors/450 warnings), 1,585 passing tests with four skipped, and the ordinary pre-push checks (21 Integration tests). Jest still force-closed a worker. A production web journey and synthetic camera-device probe ran on the Mac. A native Release build succeeded after candidate Pod resolution; frozen deployment-mode setup had failed on the old lockfile. The app launched in a dedicated simulator, stayed running for 15 seconds, and its onboarding screenshot was actually inspected. Full native rehab journeys, real camera/device validation and current submission-toolchain qualification remain open. The dedicated simulator and local browser server were stopped. See [workflow/evidence](workflows/hybrid-mac-github/WORKFLOW.md). No app feature or protocol was changed by this task.

## Update: implementation response 2026-09-27 (6bc4d77)

Response to the [patient-experience research](research/2026-09-27-patient-experience/REVIEW.md) and G01/P08: [responses/2026-09-27-6bc4d77-claude.md](responses/2026-09-27-6bc4d77-claude.md), evidence [evidence/2026-09-27-6bc4d77/](evidence/2026-09-27-6bc4d77/run.json). Author-reported; not an independent retest. No gate accepted; STATUS.json unchanged.

- Application at `6bc4d77f9ee9bbe95ef181d50fbaf94cf2388f84` (PR #25).
- EX01–EX08 compared with the 414b81b code and mapped to G04–G07. Owner inputs needed: time-only transitions, the policy when a review date passes, frozen-shoulder group membership, and the default picture for assisted exercises.
- EX06 implemented: the focus view recedes the room without blurring it (a stick, helper or brace stays readable), and a Focus/Plain switch is available during the exercise. Web only.
- P08 implemented pending review. Two causes: the store was created at import, and the telemetry interval started in its constructor. Full suite exits 0 in parallel, in-band and `--detectOpenHandles` modes without `--forceExit` (1,593 passed, 4 skipped). At 414b81b, detect mode reported 6 open handles and did not finish.
- Data safety (G02): redux-persist's default 5 s rehydration timeout could save empty state over stored history after a slow Keychain read. Rehydration now waits for storage. The read-error path remains open for G02.

## Permanent landing and reusable hybrid skill

See [responses/2026-09-27-5cc5d5a-hybrid-setup.md](responses/2026-09-27-5cc5d5a-hybrid-setup.md) and PR #27, infrastructure commit `5cc5d5ae6657c4fbb3e9c24c88cc47e8c77a8f4a`. The configured Mac landing root now has one reusable `repo/` and separate `RDC/` metadata/tooling/cache. Source/evidence moved rather than re-cloned; obsolete generated caches inventoried and removed. P08 is independently verified on 6bc4d77 in the recorded parallel/open-handle runs. New native build/launch and actual screenshot inspection passed at the new location. Full native rehab journeys and release/clinical validation remain open. The CI hardening proposal was permission-blocked and is not applied; the rest of the skill/native-hygiene patch is published for review. No application branch or product scope was overwritten.

## CI permission resolution — 2026-09-27

The initial Mac OAuth workflow-scope refusal was resolved using the already-connected GitHub app, which had separately authorised workflow-write access. It published the exact two-line CI change in `343a400c115f347f7fcd46a97ac3a8953883cea5`; PR #27 now has head `0ca6dbe166df2cdba36477f8bae316fe56308aae`. No account scope or credential was changed. CI uses frozen Pod installation and pipefail. A controlled failing-Pod pipeline returned 7 with pipefail and 0 without it. The API workflow commit did not run local Git hooks at publication; the main patch and following docs commit did, including the 21 Integration tests. The earlier inactive patch was retired. These results do not claim hosted native CI has completed. This resolution note was published via a contents-API documentation update.
