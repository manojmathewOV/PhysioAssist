# Guided readiness, hold guidance and recovery — implementation

Resumed the exact interrupted task on the existing checkout. Public reviewed basis: `8da497777266441155e50b5a4f28cf47873a72c9`. Final tested application: `e768304831ea52ea39a59d26535ca45606c0c7cb`; native driver `33cf7914ad5bcd79537a50aaf2da5bf19927c5b1`. No main merge, clinical dose, sleeper estimator or whole-gate acceptance.

## Reviewer basis and delivered correction

Claude's owner-provided review independently corroborated 1,707 tests and the prior recording mechanics, then required preparation, spoken prescribed-hold guidance and instruction-first layout before patient use. This is a receiving-agent transcription, not a GitHub APPROVE by Claude. Prior mechanics acceptance does not approve the new code.

Today now opens untimed preparation. Only **I'm ready — start** begins the activity, after rechecking the programme, due occurrence, local day and pending-save state. The patient can read/watch and get into position without the clock running.

When a hold duration and repetition amount are explicitly supplied, an optional timer uses those values. It announces the movement/side and prescribed amount, gives a short position cue, pauses at each timed interval, and asks for explicit continuation after rest. It announces remaining time after an interruption, never a fresh full interval or every passing second. There is no default therapeutic hold/rest, forced extra repetition, camera count or automatic completion. The minimum of an explicitly prescribed range controls the prompted timer sequence; the recorded completion remains the patient's report.

Spoken guidance uses the existing audio service and respects the speech setting. Cancellation/versioning prevents a late asynchronous request speaking stale instructions after pause/mute/programme change. While the patient reviews the video, activity timing and guidance are suspended. Starting/resuming hides and pauses the retained player instead of mixing video audio with the exercise cue. A failed speech request leaves written instructions. API acceptance is not proof that the patient heard the message.

During activity the short current cue is primary; the hold timer is secondary. Full owner-authored instructions remain available, including the pillow cue. Watch is above the long instruction list, and the demonstration view moves the player into view without destroying it. Scroll reset is tied to meaningful transitions, not frame updates.

Before reporting, the summary asks **Tell us how it went to save it**. A failed save is a separate state. Home offers **Review unsaved activity** and the same occurrence cannot be restarted while pending. A new contrary-input test exposed that a key reused tomorrow could be blocked by yesterday's pending event; the guard now includes the activity day. Historical recovery remains available. Singular activity wording and completion-status Home headings replace the plural-one and elapsed-seconds headlines.

## Tests and observations

- Full suite at clean committed `e768304`: **1,725 passed, four opt-in skipped, zero failures**, 102 suites, exit0, no force-exit or worker-shutdown warning. Existing synthetic accuracy test names are not clinical claims.
- TypeScript and ordinary commit/push hooks passed. Focused readiness/hold/source/cancellation cases passed. Six original new cases failed before their corrections; a separate yesterday-pending case reproduced and was fixed.
- Production web: **39 checks passed** on the same source at320/390px, including ready/start, pauses/rest, prescribed timer/voice requests, manual report, save failure/retry, pending-duplicate guard, restart, singular history and actual YouTube playback/control observations.
- The initial geometry assertion missed a clipped long cue because it compared with the lower Stop button. Actual screenshot inspection caught it. The concise same-meaning cue and removal of duplicated active dose fixed it; the final test checks both cue and hold time against the top of the fixed footer. Old screenshot/results remain separate.
- A hidden-player wait initially timed out. Direct video inspection showed paused=true with the original iframe connected. The test was using animation-frame polling offscreen and an isHidden check unsuitable for an opacity/offscreen wrapper. Timer polling and explicit paused/position/accessibility assertions now verify the intended behaviour. Explicit aria-hidden was added for the retained web player. No behavioural pause assertion was discarded.
- The final ready, active-hold, resting-hold, save-failure and reference images were opened and inspected. Only synthetic UI-only images are published; the official YouTube sample screenshot remains local.

## Native and physical evidence boundary

The initial managed build refused on battery with exit2; that refusal is preserved. AC power subsequently became available. Deployment-mode Pods verification and the Release build then passed with unchanged dependencies.

The updated native XCTest passed at driver `33cf7914` using the application built at `e768304` (application code equivalence checked). It exercises untimed Ready, explicit Start, real reference Play/Pause/Hide/Show, timed holds/rest, pause/background/explicit Resume, manual completion, saved status, reopening and episode isolation. Its synthetic six-second holds are test values, not a clinical default. The ready, hold-active/rest/saved, reopened and reference images were actually inspected; only synthetic UI-only images are published.

Two failed native runs are retained. The first exposed a fixture helper appending an already retained URL and tapping disabled Apply; the corrected helper verifies values, reuses an identical fixture and checks the first variant. The second showed a hold still safely paused after the driver tapped during foreground restoration; the driver now waits for an enabled Resume and checks the actual transition to Pause. No app foreground safeguard or completion assertion was relaxed. The final run passed these exact checks.

An additional unit counterexample showed that enabling speech partway through a hold could announce the original duration. The toggle now snapshots the remaining time; the added test passes. The final full/web checks were rerun after this code change.

Physical-device audibility, VoiceOver interaction, one-handed/lying use and patient comprehension remain separate observations. Native UI success is not an actual listening or clinical-accuracy study. The dedicated simulator was shut down and no unattended job was scheduled.

## Historical screenshot provenance

The previous native-history/native-reopened files have identical pixels. The original XCResult manifest contains distinct captures: history at1790584441.725 and reopened at1790584445.861; each original independently hashes to `5475811b497d523ee038303e67a9bfdd38ca2e9ea8b4c84dcba3d4d3b1da9a21`. The collector copies each corresponding file. The XCTest performs terminate/launch and reopened assertions between those captures. Thus two capture events show the same state; their identical images alone do not prove restart. The original evidence is untouched; `historical-capture-provenance.json` supplies the previously missing provenance.

## Scope, resources and next work

The movement estimator, held-observation computation, RGB replay/model and package locks were unchanged. The prior ten-file MobiPhysio replay remains pinned to1096a16; it was not relabelled as validation of this UI/audio patch. No further benchmark-video download, model or dependency upgrade, or clone was required. Frozen Pods installation reused the existing tree. The existing code/dependency/cache tree and bounded test runner were reused. This work cannot establish patient camera accuracy or activate sleeper numbers.

Review this candidate, obtain physical-device audio/accessibility observations, and continue the existing synthetic result selector/schematic/compatible-history implementation. No new roadmap or clinical band is needed for that code. Full storage migration, permissioned clinical assets, protocol activation, physical-device performance and human/clinical acceptance remain open.

Evidence: `../evidence/2026-09-28-guided-ux-review/run.json`, `web-journey.json`, capture provenance and synthetic UI screenshots. Failed runs remain in the existing local task evidence; no success was manufactured by erasing them.
