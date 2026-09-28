# Current PhysioAssist work — read this, not the historical state log

## Latest clarification and relayed review — 2026-09-28

**Latest C05 partial resolution:** the upper arm is at shoulder level, approximately 90 degrees to the trunk, with the pillow-line teaching cue. Primary drift is caudal towards the waist; some drift is allowed. No numerical band or clinician-only display was approved. See [caudal specification and projection probe](research/2026-09-28-sleeper-elbow-drift/CAUDAL_RULE.md). S2a remains active; no live estimator or dose is enabled.

Manoj permits a conditional approximate sleeper internal-rotation estimate alongside drift checks, superseding current drift-only wording; the estimator and clinical details remain unqualified. Claude's latest owner-relayed review accepts compact accessibility and the Android note at `4c8b20d`, reporting 1,661 passing/four opt-in skipped tests; no reviewer-authored GitHub approval is inferred. Checks and iOS at `60fce34` are now observed green. Storage review and the formal safety record remain separate. S2 proceeds in three tested increments: camera-optional interaction -> durable acknowledged record -> reopen/progress. See [the scoped record](responses/2026-09-28-s2-sleeper-refinement.md) and regenerated ACTIVE. No whole gate is accepted.

Updated 2026-09-28. Scope: **iPhone patient-only, local-first MVP**. Surgeon/physio backend, monitoring and clinical cloud sync remain future scope.

## Ownership and basis

- Claude implementation is frozen at `6bc4d77f9ee9bbe95ef181d50fbaf94cf2388f84`. Its final handover is [here](responses/2026-09-27-6bc4d77-claude-final-handover.md). Claude is independent reviewer unless explicitly reassigned.
- Receiving implementer: ChatGPT via the authorised hybrid Mac/RDC/GitHub workflow. One writer per task and source surface.
- **Main is consolidated:** PR #28 merged at `aebfa1b7832a9de314c19d69d494339f82eea5bf`, preserving the exact application commits. Active follow-up: **PR #29**, `agent/native-camera-recovery-20260928`; see [BRANCHES.json](BRANCHES.json).
- PRs #25/#26/#27 are closed as superseded; their heads remain ancestry-contained and archive-tagged. No source branch was deleted.
- The owner authorised this development merge. Main is **not approved for patient use or release**; independent scoped review and unfinished acceptance criteria remain open.
- Reuse the owner's configured local landing `repo/` and `RDC/`. No extra clone/dependency install is needed.

## Latest scoped review and next delivery

[Claude's owner-relayed review](reviews/2026-09-28-owner-relayed-claude/REVIEW.md) accepts merged S1 code with two nonblocking follow-ups and corroborates PR29 no-camera code. It is not a new GitHub approval submitted by Claude. His independent 1,649-test run is reviewer-reported; storage containment still lacks independent review and formal safety acceptance is not fabricated. Prior PR29 hosted Checks/iOS are verified green at 970e98c.

The [compact-progress accessibility follow-up and Android identity note](responses/2026-09-28-review-shoulder.md) are implemented at 4c8b20d: 1,661 passing/four skipped tests and 22 real-web checks. Owner-relayed independent acceptance is recorded; physical VoiceOver observation remains open. S2/G05.W1 is the next implementation pickup: camera-optional, source-aware shoulder Do. Manoj's bedside elevation/sleeper and foot-end ER directions are in runbook.json `shoulder_capture`; sleeper permits qualified approximate internal rotation paired with caudal elbow drift, and visibility is per output. This neither approves an estimator/dose nor accepts S1's missing native-live cases.

## What is genuinely established

P08 was independently retested on 6bc4d77: 1,593 passed/four opt-in skipped, parallel and open-handle runs exited cleanly. Preserve the fix. R01-R03 and web EX06 have implementation evidence; not all have independent end-to-end acceptance. Native focus and complete patient journeys remain open.

The four skipped suites are recorded individually in Claude's final handover: one Detox-mode-only and three permission-cleared dataset-dependent benchmarks. Skipped is not a benchmark pass.

## Current implementation and review

**I01: hosted native portability is now corroborated at `707a6e7`.** Run 36304301981 passed frozen installation, build, smoke and selected Detox. Claude independently reviewed the source/hosted result on that revision; the review was supplied by the owner. Do not keep presenting the original Install pods failure as the current unfixed state. The remaining G01 criteria and newer commits still require scoped evidence/review.

**I02: failed-read overwrite is contained in published commits `dd7f504` and `1c539a5`.** Failed reads stay pending with explicit Retry; there is no empty-state reset. The newer code was absent from Claude's 707a6e7 review. Read [implementation/evidence](responses/2026-09-27-g01-g02-receiving-agent.md). Full transactional migration, durable-write acknowledgement and native fault testing remain open.

Latest [review reconciliation](responses/2026-09-27-independent-review-reconciliation.md) distinguishes filtered extrema from raw-frame noise experiments and records privacy/copy/CI-trigger findings. Four production characterisation tests cover the actual five-frame median and away/toward selection; they do not validate clinical accuracy.

**Next product slice:** [ACTIVE](runbooks/ios-patient-mvp/ACTIVE.md) names S2/G05.W1. Implement the real camera-optional shoulder activity path and use it to qualify native reference controls; do not add fake production pose input. Keep approved content, exact assistance and durable-save acknowledgement explicit. No new roadmap or bulk data acquisition.

## One roadmap and evidence ledger

Read [compact active pickup](runbooks/ios-patient-mvp/ACTIVE.md), then [runbook README](runbooks/ios-patient-mvp/README.md), [STATUS](runbooks/ios-patient-mvp/STATUS.json), [gate roadmap](runbooks/ios-patient-mvp/RUNBOOK.md), then only the active criterion in [validation matrix](runbooks/ios-patient-mvp/TEST_MATRIX.md). Do not mark a gate accepted from the existence of a plan, test count or CCore syntax receipt.

Latest reconciliation evidence: [record](reconciliation/2026-09-27/RECONCILIATION.md). Original reviews/responses/research are retained, not overwritten. Older CURRENT snapshots are [archived](archive/2026-09-27-before-reconciliation/README.md), not competing instructions.

## Useful tools and limits

- [.agents hybrid skill](../.agents/skills/physioassist-hybrid/SKILL.md): local bounded execution and cache policy.
- [Claude reusable scripts](tools/claude-cloud/README.md): inspect before use; stale seed-method fields are known; no included private media.
- [Original reviewer tests](tests/README.md): historical tests are not blindly installed in current Jest discovery.
- Private protocols, identifying videos and Claude's raw scratch logs were deliberately not published. Source inventory is not source approval.
- No inherited Claude schedules are active according to his final handover; this agent does not infer an unattended background worker.

## Latest bounded safety correction

See [reference/comfort response](responses/2026-09-27-reference-safety.md). Claude’s new review reproduced: demonstration-derived goals and missing summary-phase policy. Implementation `c3d4b7b` uses supplied goals only, preserves numeric observations and filters progression-seeking feedback in comfort stages. New wrong-view/hidden-side tests also withhold unsupported range advice. Full tests and synthetic browser evidence are recorded; independent review remains open. Hosted Checks (36316922628) and iOS (36316922623) succeeded at 74fe884; that does not establish a complete native rehabilitation journey or physical-patient evidence. That original video-control frontier is superseded by the implementation below; no extra roadmap or bulk dataset acquisition.

## S1 reference controls and native URL correction

Implemented at `2ca6c76` and `0024f87`; see [response](responses/2026-09-27-reference-controls.md) and [evidence](evidence/2026-09-27-reference-controls/run.json). The downloader/seven unused packages are removed; active local-upload and recorded comparisons remain. Real browser Pause/Hide/Show tests pass. Native setup/reference Play, Pause, Enlarge and Replay passed after reproducing/fixing a Hermes URL.hostname crash. Final committed suite: 1,645 passed/four opt-in skipped, clean exit. This is not full native treatment/Check, approved clinical content, physical-phone validation or independent acceptance. Continue with those bounded gaps, not another downloader audit.

Latest receiving pickup: `18f0139` fixes retry/overlapping interruptions; `12a4814` bounds Metro and avoids this project using machine-wide Watchman. Fresh tests: 1,649 passed/four opt-in skipped, clean exit. Real web controls plus blocked-script/retry/no-credit journey: 19 checks passed. Native preparation playback observed, but expanded live test failed at the missing Release-only practice entry; no live native or clinical pass is claimed. See [pickup evidence](evidence/2026-09-27-reference-controls/pickup.json). The first stalled native build is retained; the later project-configured build passed. Independent review, source-aware camera-optional Do, approved media and full native patient use remain open.

## Main integration and small native recovery follow-up

[Merge evidence](evidence/2026-09-28-main-integration/merge.json) records exact ancestry, fresh clean baseline tests and green hosted Checks/iOS. The older 0024f87 source remains unchanged in history; later retry/tooling changes are separate commits. No force, reset, branch deletion or fabricated independent approval was used.

PR #29 corrects the Release screen promising unavailable practice. [Response](responses/2026-09-28-no-camera-recovery.md) records 1,651 passing tests/four opt-in skipped and an actual native no-camera/Back test plus inspected screenshot. This does not complete camera-optional Do or the still-blocked full native live reference test. Claude may review the published safety, storage and player deltas now; the implementing agent has not accepted its own gates.

## Sleeper quantitative observation clarification

Approximate IR and elbow drift are paired temporal observations, not a single angle or a binary warning. See [computed geometry and source audit](research/2026-09-28-sleeper-elbow-drift/README.md). Known ideal-geometry tests are not camera accuracy. Runbook6 retains the same gates/criteria and S2a pickup; no clinical threshold or patient detector is activated.
