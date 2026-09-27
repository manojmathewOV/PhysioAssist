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
