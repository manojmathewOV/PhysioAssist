# Current PhysioAssist implementation

Owner scope: **iPhone-first, patient-only, local-first**. No clinician portal, monitoring, automatic progression or clinical cloud synchronisation. Read this record, then [ACTIVE.md](runbooks/ios-patient-mvp/ACTIVE.md). Historical reports retain their original source and evidence limits.

## Latest result-display increment

**Result selector/card `67d4bb3ca0cda8280c047ddeb643d6e3df0de91a`**: approximate value, same-interval schematic/status and compatible previous/episode-best with strict unknown/save/retraction/method rules. Synthetic components only; not patient navigation/live Check/persistence. [Response](responses/2026-09-28-result-display.md), [evidence](evidence/2026-09-28-result-display/run.json). Full suite1790/four skipped;65 focused cases and real-web visual checks. Existing10 clips replayed in12 runs at116deb2; pipeline coverage is not clinical precision. Native driver write blocked; no new native result-screen test.

## Latest bounded implementation

**Tested application `e768304831ea52ea39a59d26535ca45606c0c7cb`: untimed preparation, spoken prescribed-hold guidance, instruction-first layout and pending-save recovery.** See [response](responses/2026-09-28-guided-ux-review.md) and [results](evidence/2026-09-28-guided-ux-review/run.json).

The patient explicitly starts after preparation. Optional holds use only supplied duration/repetition values and pause between intervals; no rest prescription or observed completion is invented. One short cue leads; timing is secondary. Watching suspends activity/audio and retains the paused player. Failed writes offer recovery, not repeating the same occurrence, and yesterday's pending event does not block today.

Clean final suite: **1,725 passed, four opt-in skipped, zero failures**, natural exit. TypeScript passed; targeted lint has zero errors/seven warnings. **39 real-web/synthetic-programme checks** passed, with actual official-player playback, speech-request observation and visually inspected320/390px screenshots. This is not actual audible VoiceOver, clinical video approval or patient-camera accuracy.

**Native verified at its stated scope:** after AC power became available, frozen Pods and the Release build passed. Updated XCTest `33cf7914` exercised Ready, reference, holds/rest, pause/background/Resume, saved self-report and reopening on application `e768304`. Screenshots were inspected. The initial power refusal and two failed fixture/synchronisation runs remain recorded; physical audibility/VoiceOver and patient use are not thereby qualified.

## Preserved foundation

The prior `a8da5f5` guided activity/acknowledged-write/quantitative-observation implementation remains intact; [its record](responses/2026-09-28-guided-implementation.md) carries1,707 tests, prior actual native journeys and the ten-video MobiPhysio development replay. The movement/RGB estimator is unchanged by this UX patch. Detection coverage was never clinical accuracy. No new videos/dependencies were downloaded.

Claude's supplied review corroborated the previous mechanics and required these UX corrections before patient use. It is recorded as an owner-relayed review, not a GitHub approval by Claude. The previous identical native history/reopen pictures have two distinct original capture events; [provenance](evidence/2026-09-28-guided-ux-review/historical-capture-provenance.json) explains why pixels alone do not prove restart. Originals are untouched.

## Ownership, review and continuation

- Main remains `aebfa1b7832a9de314c19d69d494339f82eea5bf`. PR29/`agent/native-camera-recovery-20260928` is the single receiving branch; no merge or gate acceptance occurs in this task.
- Continue only from the exact current head and local unique writer receipt. This task resumed its own interrupted work; no parallel writer, reset or force-push was used.
- Review the new timing/audio/pending-state delta and obtain the remaining physical-audio/accessibility observations. Then implement the specified patient result selector/schematic/compatible history using synthetic fixtures, with real numerical activation still gated.
- The previous8da4977 hosted Checks/iOS were confirmed green; the new candidate needs its own hosted result. The runbook distinguishes those bases.

Still open: independent new-code and earlier storage-read review/formal safety record; full database migration/scale and registration/backup policy; approved clinical assets and remaining dose/schedule decisions; selected knee/postoperative rollout; actual sleeper IR/caudal method, allowance and reference-repeatability qualification; physical accessibility/resources, patient comprehension and pilot/release gates. No new research roadmap is needed to resume code.

The owner-selected sleeper intent is unchanged: shoulder-level near90-degree upper arm, caudal leeway, same-interval approximate IR and elbow observation, and patient-visible current/previous/compatible episode-best plus a simple schematic without target chasing. Numerical allowance remains unset. Four opt-in suites and unperformed native/human checks are not silently counted as passes.
