# Protocol-fit review: c7ac7f3

Review baseline: `c7ac7f3bdda47ab736553b25bdca6f4100a8f74b`.
This is a public-safe engineering synthesis of the independent review, not the private source protocols themselves.

## Intent

The owner wants a practical shoulder/knee recovery application for conservative, preoperative and postoperative use: clinician-configured, simple for older patients, easy reference-video access, and meaningful longitudinal comparisons. The next content layer should use the owner's approved protocol revisions rather than substitute a generic catalogue.

## Current foundation

The implementation already includes pathway/phase selection, programme confirmation, specialist gating, comfort coaching, a shared clock, unknown-side handling, multiple daily occurrences and method-based series grouping. It also contains patient/setup separation, a hold timer and a measurement-first Progress screen. Preserve these improvements.

The episode model does not yet bind a programme to an approved clinical source revision or validate every assigned variant against procedure-specific permissions. Existing plans without an episode remain allowed by the current compatibility policy. This is not evidence that such legacy plans are cleared for postoperative clinical use.

## Executed production-code probes

### P01: duplicate completion advances another occurrence

Fixture: one completed record with the same event ID, exercise, side, time and payload is supplied twice. The current routine fills two slots instead of one.

Expected: duplicate delivery is idempotent. A scheduled occurrence has durable identity. A second real occurrence requires its own event; a conflicting duplicate is surfaced rather than silently accepted.

Scope: synthetic record replay injected into actual production routine logic. No claim that real sync currently produces the duplicate.

### P02: frequency is not interval scheduling

Fixture: a multi-occurrence plan and one completed session; the clock is only one minute later. `nextAfter` offers the next round. The existing schema has a daily count but no spacing/waking-window specification.

Expected new capability: complete the movements in the current mini-session, then show a next eligible daytime window rather than inviting the next round immediately. The requested interval is in the owner's intent draft; its anchor and wake/sleep boundaries need approval.

Scope: requirement probe. Do not describe this as a regression in a scheduler that never existed.

### Passing controls

Unconfirmed programmes are blocked; a confirmed frozen-shoulder programme is allowed; the generic specialist knee pathway requires specialist approval; unknown-side history does not complete the prescribed limb.

Existing suite at this SHA: 1,550 passed, four skipped, with forced exit. Six additional probes: four passed, two failed. Creating this handover did not rerun these application tests.

## Clinical library fit

Keep separate source families for accelerated, standard and large cuff repair; ROM-focused postoperative shoulder without a protected repair; anterior and posterior stabilisation; Latarjet; anatomic replacement; reverse non-fracture and fracture; ACL; TKR; isolated MPFL; MPFL with TTO; and uncomplicated arthroscopy as an extension requiring a specified exercise prescription.

These names do not imply that each source has been approved for production. Several version/terminology questions remain. See ../../protocols/APPROVALS.md. A no-repair mobility programme must not be selected simply because a decompression was one part of an operation that also included a repair.

A variant needs movement, position, assistance, support, permitted loading and context. Isometric activation differs from active joint excursion. Brace-locked ambulation differs from brace-off loading. A relaxed resting observation differs from a therapeutic stretch with active/manual assistance. A generic exercise ID cannot safely replace these distinctions.

## Frozen-shoulder mini-session

Preserve the owner's new low-repetition, daytime interval intent as a new draft, not a blend of older handout doses. The specified movements are supine opposite-arm-supported elevation, supine stick-assisted ER with the affected elbow beside the body, and sleeper stretch. A per-movement reading of the repetition range remains an interpretation to confirm. Hold/rest durations and exact sleeper positioning are unresolved.

Do not relabel the standing arm raise or front-view active rotation estimator as these supine assisted variants. Ordinary mini-sessions should not require repeated camera calibration. A qualified Check can use a separately validated capture protocol.

## Cross-cutting rules to retain

- Precautions outrank praise on screen, in speech and in repetition announcements.
- Unavailable remains unavailable in summaries, storage and charts.
- Treatment time, pause time, wall time and observed stable-window time are different.
- Clinical restrictions remain explicit even when the camera cannot verify them.
- An operation or changed method cannot silently reuse incompatible history.
- Dose changes alone need not split a valid measurement series.
- An empty findings array is not proof that technique was normal.
- Stopping early and patient-confirmed completion must have honest wording and provenance.
- Patient setup and clinician configuration remain distinct, with real authorization still required for deployment.

## Next evidence

Reproduce P01 at the current SHA, implement P02 from an explicit schedule contract, and test source-approved variants through rendered patient journeys. Later evidence must separately cover real approved-video playback, native devices, large text, recorded RGB, real-camera measurement, repeatability and supervised older-user use. Rule-model passing counts are not patient counts.
