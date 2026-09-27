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
