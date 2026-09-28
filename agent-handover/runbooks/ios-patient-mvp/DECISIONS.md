# Scope and decision register

## Authoritative scope change

The user narrowed the MVP from a connected clinician platform to an **iPhone-first patient app**, with registration and local saved progress, a small resource footprint, and appropriate native platform reuse. Preserve future linkability without building clinician backends now. Earlier clinician-portal proposals are future scope, not release prerequisites.

Retain React Native unless measured evidence justifies an explicitly approved change. SQLite, Apple-native pose alternatives and optional Sign in with Apple were recommendations, not settled owner decisions.

| ID  | Decision still needed                                                                                                                                                                 | What can proceed without it                                                                   | What must not be silently assumed                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Does MVP registration mean a local named profile, a true account, or both? If a true account, approve identity-only service and accessible optional/account-free route as applicable. | Local profile ownership, storage abstraction, synthetic onboarding.                           | Mock login is registration; Apple sign-in creates a health backup; three clinician account types belong in MVP.                    |
| D02 | Initial intended claims and distribution: controlled prototype, supervised TestFlight pilot, or public release; who owns regulatory/privacy review?                                   | Engineering with synthetic data.                                                              | Wellness wording settles intended medical use; software tests substitute for clinical evidence.                                    |
| D03 | Local-data recovery/transfer, deletion, sign-out and backup policy; explicit accepted consequence of loss of phone/app.                                                               | Document local-only behaviour and transactional storage.                                      | Sign-in restores history; iCloud health-record storage is permitted; backup exclusion alone resolves all transfer/keychain cases.  |
| D04 | Oldest supported physical iPhone and minimum iOS; supported Dynamic Type range and orientation.                                                                                       | Simulator layout work and profiling design.                                                   | Latest framework works on every supported phone; simulator performance represents older hardware.                                  |
| D05 | First approved programme/variant set, content rights and private source delivery; which source revision is authoritative.                                                             | Schema and synthetic fixtures, use already approved assets only if actual approval available. | All located documents are current; approximate standing measurements cover supine assisted variants.                               |
| D06 | Storage/native library choice and release resource budgets after baseline measurements.                                                                                               | Bounded-buffer, pagination and migration design.                                              | Arbitrary MB/FPS numbers are established requirements; account SDK needs a clinical cloud backend.                                 |
| D07 | Interval anchor and interrupted mini-session/window-close policy; confirm C05 interpretation and per-movement dose.                                                                   | Blank editor, schedule validation and synthetic tests.                                        | 2–3 hours means a fixed 2-hour reminder, holds inherited from older handout, make-up dose, or overnight reminders.                 |
| D08 | Which numerical observations can be shown for MVP and which remain guided-only; validation/reference protocol and repeatability.                                                      | Honest unavailable states, provenance and no-camera Do.                                       | Landmark visibility calibrates angle error; camera proves passivity or healing; a four-degree change is automatically improvement. |

## Clinical decisions are not settled by this runbook

Retain [C01–C08](../../protocols/APPROVALS.md), including protocol version conflicts, postoperative modifiers and the inactive frozen-shoulder draft. The latest owner wording is 2–3 self-directed repetitions every 2–3 daytime hours, primarily supported supine elevation, supine stick-assisted ER at the side and sleeper stretch. Its exact per-movement interpretation, hold/rest, positioning, waking window and symptom policy still require recorded confirmation. This text preserves user intent; it is not an activated prescription.

## Future connectivity seams only

Use durable local profile, episode, programme-revision, session, occurrence, event and method identities. Keep storage, optional identity, media, notifications and pose-source interfaces small. Origin, permissions and migrations must be explicit. Later care-team sharing needs new consent and real authorisation; local historical records are not automatically uploaded or retrospectively called supervised.

## Decisions and disagreement

Record decision ID, actor, date, alternatives, selected option, source/evidence, scope and reopen condition. An implementation agent may choose reversible code organisation; it may not choose missing clinical doses, source authority, data-publication permissions or release claims. Missing inputs block the affected feature/activation, not unrelated admitted work.

## Owner clarification: lying-shoulder capture (2026-09-28)

D05/D08 are partially specified: slightly raised bedside camera for supine assisted elevation and sleeper position drift; foot-end, slightly raised for supine stick-assisted ER with the affected elbow close to the body. No overhead rig is required. See `shoulder_capture` in runbook.json and its generated roadmap section. This is a capture-design direction, not validation, a new dose or permission to perform an exercise. Exact sleeper starting variant, hold/rest, schedule/window and symptom rules remain open.

## Owner clarification: approximate sleeper internal rotation

2026-09-28: Manoj clarified that sleeper stretch can provide an approximate internal-rotation number. This supersedes the earlier drift-only/no-number wording in current requirements. Approximate IR and visible compensation observations are complementary; numerical output remains conditional on method/view/reference qualification, while guidance can remain useful without a number. D08 now permits investigating this output, not claiming the estimator already works. Exact sleeper variant/reference asset, hold/rest and schedule anchor remain open. No dose or permitted clinical range changed.
