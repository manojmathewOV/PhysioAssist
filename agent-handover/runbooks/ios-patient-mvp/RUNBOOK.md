# Execution runbook: iPhone patient-only MVP

This is an engineering plan, not a treatment protocol. Gate definitions are maintained in `runbook.json`; this document is the readable navigation and execution guide. `STATUS.json` is the single current progress record. All gates start unaccepted.

## Current basis

Application: `414b81b170a6205b9fcb3aca20f3cab89bb850a1`; handover: `9aea33a895fa9f529771bc697d3f54f8663ab21a`. The latest implementation agent reports R01–R03 addressed and 1,585 passing tests / four skipped, while P08 remains open because Jest killed a worker. This planning task has not independently repeated those tests. Source: [latest implementation response](../../responses/2026-09-27-414b81b-claude.md).

## Dependency map

```text
G00 Scope / baseline
 ├─ G01 Correctness / clean exits ─ G02 Local records ─ G03 Onboarding
 │                                    └─ G04 Programme variants (also G00)
 │                                          └─ G05 Learn / Do / Check (also G03)
 │                                                ├─ G06 Native reminders
 │                                                └─ G07 Media / accessibility
 │                                                       └─ G08 Device resources
 │                                                G06 + G07 ─ G09 Native cloud visual QA
 └────────────────────────────────── all required gates ─ G10 Release/pilot
```

Parallelism: source approval and read-only research may proceed while implementation gates are blocked. Two agents must not own the same edit surface simultaneously. Native visual fixtures can be designed early; G09 acceptance needs integrated journeys. G10 is a join, not a sum of green unit tests.

## At each gate

Reconcile the exact code and prerequisites; write a small implementation plan and falsifiers; implement one bounded outcome; run affected tests; inspect the patient-facing result; publish code/evidence; obtain independent review; then update status. A code change, successful command, witness file and accepted outcome are four different events.

A gate should fit one coherent reasoning/validation boundary. If it grows too large, split work into named tasks with a return to the same gate; only create a separate child runbook when it truly has independent ownership/lifecycle. Never close the parent just because a child passed.

On repeated failure: stop repeating unchanged commands, state competing causes, run the cheapest discriminating check, fix the cause and replay the failed boundary. Preserve a last-known-good code/data checkpoint. Do not invent missing evidence or weaken a clinical constraint to get green.

## G00 — Scope, current baseline and acceptance contract

**Depends on:** entry · **Owner role:** implementation_lead · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** A cloud implementer can identify the current app, authoritative MVP scope, open decisions and next executable slice without accessing the owner computer.

**Work:**

1. Read root AGENT_HANDOVER.md, CURRENT.md, both latest responses and this runbook. Re-read PR heads; record any advance beyond the pinned baseline.
2. Retain React Native application and existing fixes. Agree one writer per code branch, independent reviewer and how documentation changes are integrated.
3. Record iPhone/device support, registration semantics, recovery stance and initial content scope as decisions; do not treat earlier suggestions as owner approval.
4. Keep older reviews immutable; map P01/P02 and R01-R03 to their reported 414b81b replacements, not old fixture wording.

**Acceptance/falsifiers:**

- Fresh checkout can navigate all local links and identify absent private evidence honestly.
- An agent resuming after context loss reconstructs next gate and blockers using this folder alone.
- A changing PR head invalidates only affected evidence, not the whole history.

**Deliver:** baseline manifest with application SHA, handover SHA, toolchain and branch owner; resolved or explicitly blocked DECISIONS.md entries; portable pickup response.

**Open decisions:** D01, D02, D04, D05.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G01 — Reconcile correctness and establish clean test exits

**Depends on:** G00 · **Owner role:** implementation_lead · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** Current event, timing, approval and scheduling behaviour is independently checked end-to-end, and test runs exit without killing workers.

**Work:**

1. Retest the current R01 conflict-resolution, R02 schedule-approval and R03 eligibility-refresh changes against the actual current reducers/hooks/screens.
2. Inspect same-operation new episode, unidentified legacy episode, malformed or duplicate IDs and mid-session prescription changes.
3. Investigate P08 with focused open-handle detection. Dispose timers, subscriptions, audio and camera mocks; do not hide leaks with force-exit or relaxed timeouts.
4. Bind records to the start-time profile, episode, prescription and occurrence; separate activity, pause, wall and continuously observed time.

**Acceptance/falsifiers:**

- Exact replay counts once; reversed conflicting inputs produce identical withheld credit; an explicit correction restores only intended credit.
- Schedule-only edits require new prescription revision and applicable local confirmation; equivalent serialisation does not.
- Mounted screen updates at due/window/midnight boundaries, foreground refreshes, Start rechecks and unmount removes timers.
- Five seconds active, seventy paused, three active yields eight active seconds consistently in ring, completion and history.
- Full relevant Jest suite exits naturally with no force-killed worker, unexplained timer or skipped new coverage.

**Deliver:** SHA-bound independent reproduction log; current test-to-finding map; clean-exit evidence.

**Open decisions:** none newly introduced; retain applicable prior constraints.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G02 — Small, transactional local records and safe migration

**Depends on:** G01 · **Owner role:** storage_implementer · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** Patient history survives restart and migration without whole-history loading, cap-driven loss, cross-profile leakage or silent failure under storage pressure.

**Work:**

1. Evaluate a small SQLite adapter against current Redux persistence; document the selected native library, supported deployment targets and maintenance risk before installation.
2. Separate UI state from paginated persistent profiles, episodes, plan revisions, events, observations, media index and preferences. Stable IDs are platform-neutral.
3. Specify an idempotent transactional migration from current JSON history; preserve unknown legacy fields/meaning without inventing episode or method identity.
4. Use platform file protection; cover database, WAL/SHM, media and recovery files. Keep credentials in Keychain, not health history.
5. No raw patient video or per-frame skeleton archive by default; keep sufficient observation provenance and bounded optional trajectories.
6. Handle low disk, failed commit, duplicate save and interrupted migration visibly. Do not clear data to fix a corrupt store.

**Acceptance/falsifiers:**

- Restart and force-termination at every migration boundary leave either a valid prior store or fully committed new store, without duplicate records.
- Stress fixture with 10,000 synthetic history records: only requested pages/aggregates enter app state; compare startup, memory and writes against baseline.
- Two local profiles never see each other records; sign-out/account changes cannot silently reassign the database.
- Disk-full and corrupt-record injection give recoverable errors and preserve unaffected records.
- Enumerate actual files after writes to verify protection, backup disposition and absence of raw video.

**Deliver:** storage ADR and schema; migration/recovery fixtures and logs; file-protection and backup inventory; before/after footprint measurements.

**Open decisions:** D03, D06.

**Recovery:** Do not destroy the prior store until migration verification and the approved recovery policy permit it; roll back with explicit schema/version evidence.

## G03 — Patient onboarding, registration and local ownership

**Depends on:** G02 · **Owner role:** identity_implementer · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** The patient can set up the iPhone and own their local records; registration, local identity, device unlocking and backup are accurately distinguished.

**Work:**

1. Resolve D01: on-device profile registration versus an optional real Sign in with Apple account. Do not label a mock login or unverified token as a real account.
2. Implement only the selected scope. If a true account is required, use a minimal identity-only service with token verification, deletion and revocation; never silently introduce clinical uploads.
3. Core approved local use works offline after setup. Design accessible recovery and any account-free route required by the intended feature set.
4. Retain a provider-independent local profile identifier; future account linking requires explicit authenticated migration, not email/name matching.
5. Explain app deletion/device-loss consequences and implement the selected local deletion/transfer behaviour. Optional biometrics do not imply backup.

**Acceptance/falsifiers:**

- Onboard, restart in airplane mode, complete an activity and recover its record.
- Cancelled sign-in, revoked credential, hidden email, account change and repeated login do not expose or silently transfer another profile data.
- Deletion removes the approved local assets/notifications and, only if accounts exist, performs the documented account deletion path.
- The screen never promises cloud recovery or monitoring which the MVP does not implement.

**Deliver:** onboarding native journey screenshots; identity threat cases; data-loss/recovery wording and approved policy.

**Open decisions:** D01, D03.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G04 — Source-backed programme packages and real exercise variants

**Depends on:** G00, G02 · **Owner role:** content_and_domain_implementer · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** An approved programme can be used locally with its source revision, posture, assistance and restrictions preserved; unapproved variants remain inactive.

**Work:**

1. Use existing protocols/APPROVALS.md and source-index.json. Acquire approved content through an authorised private channel; filenames and previous summaries are not source substitutes.
2. Define reusable variants by movement, posture, assistance, support/equipment, load/brace context, side and observation method; do not infer unknown assistance as active.
3. Support source-derived constraints separately from what the camera can verify. A numeric estimate cannot certify compliance with a protection limit.
4. Support an owner-approved local setup/programme package without surgeon/physio accounts. Record patient-entered versus source-approved versus professionally prescribed origin accurately.
5. Implement the three intended supine/side-lying assisted shoulder variants as distinct definitions and instructions, not renamed standing estimators. Keep doses/positions inactive where C05 remains unresolved.
6. Signed or hashed package integrity proves origin/bytes, not patient eligibility or clinical approval; clinical changes require explicit programme revision.

**Acceptance/falsifiers:**

- Frozen-shoulder sleeper variant never leaks into a disallowing protected-repair programme.
- Isolated MPFL and MPFL with TTO do not collapse into one knee permission; assistance and loaded/unloaded/braced distinctions survive import/export.
- A changed reference or package cannot silently change an active patient prescription.
- Missing/contradictory source or unknown procedure yields explanation plus safe available functions, never invented permissions.

**Deliver:** variant/package schema and synthetic fixtures; source-to-rule mapping with approvals; local programme-selection journey.

**Open decisions:** D05, C01-C08.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G05 — Learn, Do and Check in one patient journey

**Depends on:** G02, G03, G04 · **Owner role:** patient_experience_implementer · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** Education, exercise completion and a qualified measurement check have distinct saved meanings while daily navigation stays simple.

**Work:**

1. Learn replays approved instructions without exercise credit. Do records activity with or without usable camera output when the activity is otherwise authorised.
2. Check uses an explicit assessment protocol and valid method identity; only eligible Check observations enter the primary clinical measurement series.
3. Preserve unavailable, approximate and measured states through visual cues, speech, summary, storage and graphs. No zero/default/legacy fallback.
4. Patient-confirmed completion records its basis; demo/practice is never saved as patient measurement. Early stopping is retained without praise implying a full dose.
5. Independent patient use must not display waiting for an absent clinician, yet must not unlock arbitrary protected postoperative routines.

**Acceptance/falsifiers:**

- Learn -> Do -> interrupted Do -> incomplete Check -> valid Check -> later compatible comparison, using the same profile/episode.
- Unavailable Check shows no numeric result and no normal-technique claim; completed unmeasured Do is not treated as failed rehabilitation.
- Dose/schedule changes preserve compatible methods; assistance/method changes separate comparison or mark incompatibility.
- Goal, clinical restriction and demonstrator endpoint remain three separate quantities.

**Deliver:** two complete synthetic patient journeys (shoulder and knee); saved-record assertions and native screenshots; measurement comparability table.

**Open decisions:** none newly introduced; retain applicable prior constraints.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G06 — Daytime schedule and native local reminders

**Depends on:** G01, G03, G05 · **Owner role:** schedule_implementer · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** The schedule remains correct offline across time boundaries and interruptions; optional OS reminders never create adherence credit or catch-up dose.

**Work:**

1. Use current explicit interval/waking-window and repetition-range contract; resolve the anchor decision before activating the clinical draft.
2. Implement native local notification scheduling, cancellation, replacement and permissions. Recompute at meaningful boundaries rather than continuous rapid polling.
3. Revalidate deep-link/Start eligibility against current programme. Cancelling/changing a schedule cancels obsolete reminders.
4. Define timezone/DST/date change, window-close, interrupted-round expiry and no-catch-up policy explicitly.
5. Show what is due now, next window and rest-of-day; missing clinical parameters remain an unfinished schedule, not a daily-count fallback.

**Acceptance/falsifiers:**

- Due time changes without history edits; foreground after a missed boundary; midnight and timezone/DST transitions.
- Notification denied, delayed, duplicated or tapped after a plan change: in-app truth stays correct and no record is completed.
- A 2-3 synthetic repetition range accepts its lower bound; a missed mini-session does not add later repetitions.
- Old notifications disappear after schedule revision or profile deletion; one device state does not count repeated notifications as exercise.

**Deliver:** native notification tests and OS setting cases; timer lifecycle evidence; approved scheduling policy.

**Open decisions:** C05, D07.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G07 — Reference media, meaningful speech and elderly-friendly controls

**Depends on:** G03, G04, G05 · **Owner role:** patient_experience_implementer · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** A patient can understand and perform the selected routine with readable controls, meaningful audio and dependable approved media, including offline recovery.

**Work:**

1. Use approved licensed demonstrations with variant/side/version metadata. Download only relevant assets; keep an active offline programme available unless the patient deliberately frees it.
2. Bound optional cache separately from protected history. Display storage use and preserve instructions if media cannot load.
3. Use native speech and audio interruption handling; one evidence-supported cue at a time. Precautions suppress conflicting praise and rep celebration.
4. Test Watch again, captions, enlargement, returning to movement and reference versus personal-history comparison. Never scrape/download YouTube through unsupported paths.
5. Retain the calm design; large labelled Stop/Pause, no gesture-only essentials, Dynamic Type/VoiceOver, contrast not colour-only, one-handed and lying-down use.

**Acceptance/falsifiers:**

- Real approved asset plays through Watch -> enlarge -> Do -> pause/call -> resume -> summary in native iOS; missing/corrupt/offline asset has a useful fallback.
- Speech identifies the next movement and dose without forcing a floor-exercising patient to reach for the phone.
- Small supported iPhone and largest supported accessibility text: all essential instructions and controls remain reachable without clipped meaning.
- Camera problem plus precaution plus praise selects one correct visual/spoken message consistently.

**Deliver:** asset permission/provenance manifest; native screenshot/video contact sheet and annotated findings; VoiceOver/audio and interruption checklist.

**Open decisions:** D04, D05.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G08 — On-device analysis and measured resource budgets

**Depends on:** G02, G05, G07 · **Owner role:** native_performance_implementer · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** The release build has bounded memory, disk growth and processing work, while every published measurement retains its evidence-defined validity.

**Work:**

1. Measure installed size, persistent storage, peak RAM, startup, interaction latency, disk writes, power and thermal behaviour separately on supported physical devices.
2. Profile the existing estimator before proposing Apple Vision/Core ML. Compare landmark/coordinate meaning, assisted/supine support, error, coverage and abstention on held-out material.
3. Keep one active estimator, bounded frame buffers and appropriate resolution/rate. Release camera/model/audio resources on pause, screen exit and background according to the chosen lifecycle.
4. Treat focus/segmentation as optional presentation; degrade or disable effects before compromising control latency or feedback.
5. No raw video or per-frame history persistence by default. Redact operational logs; telemetry is minimal and non-identifying.
6. Set numerical release budgets only after baseline and owner/device selection; attach baselines and decisions, not invented universal MB/FPS thresholds.

**Acceptance/falsifiers:**

- Thirty synthetic open/start/pause/stop/close cycles as a stress fixture: no sustained retained-memory growth; include background/memory pressure.
- Cold offline first use with required model/media present; low-storage model failure returns honest unmeasured state.
- Independent video/reference tests report issued-angle error AND coverage, false withholding, wrong-side cases and unsupported conditions.
- A method change cannot silently present the same measurement-method version or turn simulation success into clinical accuracy.

**Deliver:** release Instruments/MetricKit or equivalent device report; estimator decision record; footprint budget baseline and pass/fail evidence.

**Open decisions:** D04, D06, D08.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G09 — Cloud-native iOS simulation and visual evidence

**Depends on:** G05, G06, G07 · **Owner role:** validation_owner · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** A GitHub-connected cloud implementer can run the actual iOS app and retrieve, inspect and archive meaningful native patient-journey evidence without the owner Mac.

**Work:**

1. Extend the existing macOS GitHub Actions/Detox lane from first-run smoke to selected shoulder/knee patient journeys, including profile persistence and schedule boundaries.
2. Capture every critical native state; bind app SHA, build settings, simulator device/OS, fixture, text scale and image/video hashes in one manifest.
3. Download and visually inspect the images; record concrete findings and corrections. A green selector assertion is not visual acceptance.
4. Use synthetic pose injection or authorised prerecorded material for UI determinism, explicitly separating it from real native camera performance.
5. Exercise error paths, interruptions and build/artifact retrieval failures. Workflow permission or missing artifacts remain blockers; no promised background execution.

**Acceptance/falsifiers:**

- Cloud build -> simulator -> authored journey -> screenshot/video artifacts -> image retrieval -> recorded visual review is demonstrated end-to-end.
- Local profile, routine preparation, reference, live exercise, paused state, unmeasured result and progress all appear in the artifact manifest.
- Restart simulator and re-open local records; large text and smaller-device states are not replaced by web screenshots.
- All artifact links are durable or explicitly expire; public artifacts contain synthetic/non-identifying material only.

**Deliver:** native evidence manifest with actual images; annotated independent visual review; CI command/run IDs and unresolved device-only limits.

**Open decisions:** none newly introduced; retain applicable prior constraints.

**Recovery:** Keep the last passing checkpoint; diagnose the failing invariant and retest the affected path before advancing.

## G10 — Local-first release and supervised pilot readiness

**Depends on:** G00, G01, G02, G03, G04, G05, G06, G07, G08, G09 · **Owner role:** release_owner · **Acceptance:** independent reviewer; clinical/release decisions require owner.

**Outcome:** A release candidate has an explicit supported scope, approved content, privacy/recovery behaviour and evidence appropriate to every claim, with no false clinician monitoring.

**Work:**

1. Confirm intended use, applicable regulatory/privacy assessment, App Store disclosures, account rules, permissions, backup exclusions and secure deletion with responsible owners.
2. Demonstrate device-level offline persistence, resource budgets, account/profile isolation and interruption recovery.
3. Obtain source-owner approval for published programme content. No unresolved clinical ambiguity is hidden by generic defaults.
4. Perform supervised older-adult usability and separate test-retest/reference measurement work where measurement claims require it; record exclusions and failures.
5. Prepare TestFlight/release/rollback procedure and support path. Explicitly say no attached monitoring service exists.
6. List future Android, care-team roles, linking, consent/sync and hosted clinical storage as deferred. Keep identifiers/interfaces; do not ship dormant portals.

**Acceptance/falsifiers:**

- Trace each release claim to matching version-bound evidence and clinical approval; missing human/device evidence cannot be marked passed by a software model.
- Independent patient completes approved offline workflow after setup without selecting camera geometry or editing clinical phase.
- Deletion/reinstall/lost-device information matches actual recovery capability; Sign in with Apple alone is never described as clinical backup.
- Audit build and network/file outputs: no unexpected clinical upload, tracking, public identifiable media or unapproved iCloud health-data backup.

**Deliver:** release evidence/claim matrix; clinical and privacy approval records; pilot findings and release disposition.

**Open decisions:** D01, D02, D03, D04, D05, D06, D07, D08, C01-C08.

**Recovery:** Keep the release blocked or explicitly narrow its claims/features with owner approval; preserve the last approved build and data-compatible recovery procedure.

## Completion evidence and restart contract

Every accepted gate needs an exact implementation SHA, actual commands/results, environment, evidence paths/digests, covered assumptions, remaining limitations and an independent acceptance record. An unavailable gate remains open/blocked, with its owner and wake condition.

Use `../../templates/AGENT_RESPONSE.md`. Update `STATUS.json` only after evidence and reviewer disposition exist. Keep historical records immutable. On restart, read README -> STATUS -> active gate -> changed basis, not the full chat or every source. Reopen only affected gates after a schema, method, permission, source or platform change.

The portable plan deliberately does not pretend to be a CCore-admitted runtime controller. A CCore declaration inspection or schema check cannot create application, clinical or release acceptance.
