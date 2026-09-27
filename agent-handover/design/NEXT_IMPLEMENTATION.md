# Next implementation: precise underneath, simple for the patient

This is an engineering proposal derived from the prior review and the owner's stated goals. It is not a clinical prescription or approval to change patient care.

## 1. Preserve the existing patient interface

Keep one next activity, a large primary action, clear Pause/Stop, optional voice and reference playback, honest completion wording, and measurement-first Progress. Do not reintroduce the unrelated exercise start, generic repetition quota for a mixed routine, or clinician setup controls into the routine screen.

## 2. Put approved protocol identity underneath it

Use an explicit chain:

`source revision -> approved template -> patient episode + operative modifiers -> prescribed variant -> scheduled occurrence -> activity record -> qualified observation`

A source revision needs provenance, digest, approval state and resolved exceptions. A patient episode needs durable identity, side, condition/procedure and associated interventions. A confirmation flag is not authenticated clinician identity and does not validate each variant against clinical constraints.

A no-repair mobility source must not be selected merely because decompression appears in the operation name. Keep distinct accelerated/standard/large cuff, anterior/posterior/Latarjet, reverse fracture/non-fracture, isolated MPFL/TTO and procedure-specific knee families. The owner chooses clinical permissions from approved sources.

## 3. Variants, not labels

Represent posture, assistance, support/equipment, movement plane/quantity, permitted loading and relevant brace state. Assistance may change inside a repetition. Isometric muscle activation is not the same as active joint excursion. A passive resting observation is not a therapeutic stretch with manual force. Never infer passive assistance from a camera skeleton.

Clinical restrictions and measurement capability are separate fields. Retain a restriction even when the camera cannot verify it; show an honest verification limitation rather than false precision or silent omission.

## 4. Scheduling and replay

Daily counts are insufficient for mini-sessions separated by hours. Use an explicit interval or window contract with local time zone, approved waking window, anchor, due window, missed-window policy and any daily bounds. Do not invent exact clock times or hold durations for the clinical template.

Use durable `episodeId`, `prescriptionRevision`, `occurrenceId`, `eventId` and payload identity. A duplicate event must be idempotent; a conflicting reuse must be surfaced. Persist occurrence attribution at execution time, not reconstructed solely by counting earlier records. A new operation, device sync, corrected history or plan reorder must not silently move completion to another activity.

For the owner's ranged mini-session intent, the lower bound satisfies the dose; the upper bound is not automatically required. After all movements in one round, acknowledge completion and show the next eligible window. No immediate extra round, overnight notification or catch-up accumulation. Reminder delivery is an app capability to implement, not a task scheduled by this handover.

## 5. Learn / Do / Check

Learn: approved instructions; not completion or measurement.
Do: prescribed rehabilitation; measurement failure does not erase genuinely completed activity. Store whether completion is observed, timed or patient-confirmed.
Check: separately scheduled standardized assessment. Admit values to the primary clinical series only when the method/setup/assistance/side/episode are compatible and the result is qualified.

These are internal modes within one coherent Today journey, not necessarily three extra tabs. General educational access need not be blocked simply because an exercise is not yet cleared; the UI must not invite performance of an uncleared activity.

## 6. Measurement and feedback invariants

Use one authoritative result and cue selection through validator, store, rendered instruction, speech, summary, persistence and chart. A missing measurement remains unavailable, not zero. Keep active, paused, wall and observed-stable time separate. Share the same activity clock among display, completion and history.

Method compatibility differs from dose/version equality. Keep unknown historical provenance unknown. An empty technique-finding list is not a normal-technique conclusion when the movement could not be assessed. Synthetic consistency is not calibrated clinical uncertainty.

## 7. References and visual behavior

Reference identity should include variant, posture, assistance, preview/mirroring convention, approved revision and permitted reuse. The demonstrator explains technique; the prescription sets the patient's target. Test real approved assets before claiming playback readiness. Missing video can fall back to equivalent approved instructions; a wrong video cannot silently substitute.

Keep the focus overlay restrained: relevant limb and quantity, optional details, no claim that a segmentation mask excludes all bystanders without testing. Check low-end performance and native parity separately. Do not publish identifiable trial frames as public evidence without permission.

## 8. Finish with patient-journey evidence

A useful acceptance chain is:

`prescription -> setup -> input sequence -> accepted result -> selected cue -> rendered UI/speech -> save -> next eligible occurrence -> compatible Progress`

Cover pauses/backgrounding, camera denial/dropout, duplicate delivery, changed episode, second daily occurrence, method changes, symptom-limited coaching, unavailable/wrong reference, large text and small phone. Keep prerecorded RGB testing, live-camera accuracy, older-adult usability and clinical repeatability as separate evidence layers.

Implementation order: P01/P02 identity and schedule; P03/P04 approved source/variant layer; P05 Learn/Do/Check; then reference/device journeys and clinical validation. Unresolved clinical content should block its activation, not unrelated engineering work.
