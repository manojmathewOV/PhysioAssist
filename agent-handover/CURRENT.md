# Current PhysioAssist implementation

Owner scope: **iPhone-first, patient-only, local-first**. No clinician portal, monitoring, automatic progression or clinical cloud synchronisation. Read this record, then [ACTIVE.md](runbooks/ios-patient-mvp/ACTIVE.md). Historical reports retain their original source and evidence limits.

## Latest bounded implementation

**Tested application `d38b9cb4d05f3c8f5b721b4b411025d90b8daf88`: untimed preparation, spoken prescribed-hold guidance, instruction-first layout and pending-save recovery.** See [response](responses/2026-09-28-guided-ux-review.md) and [results](evidence/2026-09-28-guided-ux-review/run.json).

The patient explicitly starts after preparation. Optional holds use only supplied duration/repetition values and pause between intervals; no rest prescription or observed completion is invented. One short cue leads; timing is secondary. Watching suspends activity/audio and retains the paused player. Failed writes offer recovery, not repeating the same occurrence, and yesterday's pending event does not block today.

Clean final suite: **1,724 passed, four opt-in skipped, zero failures**, natural exit. TypeScript passed; targeted lint has zero errors/seven warnings. **39 real-web/synthetic-programme checks** passed, with actual official-player playback, speech-request observation and visually inspected320/390px screenshots. This is not actual audible VoiceOver, clinical video approval or patient-camera accuracy.

**Native pending:** the new managed build refused before launch because the Mac is on battery. The updated native test covers ready/hold/reference/restart but has not run at this source. Connect AC power, run the guarded build and updated journey, retrieve attachments and inspect them. Prior native/hosted successes must not be reused as current native acceptance.

## Preserved foundation

The prior `a8da5f5` guided activity/acknowledged-write/quantitative-observation implementation remains intact; [its record](responses/2026-09-28-guided-implementation.md) carries1,707 tests, prior actual native journeys and the ten-video MobiPhysio development replay. The movement/RGB estimator is unchanged by this UX patch. Detection coverage was never clinical accuracy. No new videos/dependencies were downloaded.

Claude's supplied review corroborated the previous mechanics and required these UX corrections before patient use. It is recorded as an owner-relayed review, not a GitHub approval by Claude. The previous identical native history/reopen pictures have two distinct original capture events; [provenance](evidence/2026-09-28-guided-ux-review/historical-capture-provenance.json) explains why pixels alone do not prove restart. Originals are untouched.

## Ownership, review and continuation

- Main remains `aebfa1b7832a9de314c19d69d494339f82eea5bf`. PR29/`agent/native-camera-recovery-20260928` is the single receiving branch; no merge or gate acceptance occurs in this task.
- Continue only from the exact current head and local unique writer receipt. This task resumed its own interrupted work; no parallel writer, reset or force-push was used.
- Review the new timing/audio/pending-state delta and complete the native/physical-audio observations. Then implement the specified patient result selector/schematic/compatible history using synthetic fixtures, with real numerical activation still gated.
- The previous8da4977 hosted Checks/iOS were confirmed green; the new candidate needs its own hosted result. The runbook distinguishes those bases.

Still open: independent new-code and earlier storage-read review/formal safety record; full database migration/scale and registration/backup policy; approved clinical assets and remaining dose/schedule decisions; selected knee/postoperative rollout; actual sleeper IR/caudal method, allowance and reference-repeatability qualification; physical accessibility/resources, patient comprehension and pilot/release gates. No new research roadmap is needed to resume code.

The owner-selected sleeper intent is unchanged: shoulder-level near90-degree upper arm, caudal leeway, same-interval approximate IR and elbow observation, and patient-visible current/previous/compatible episode-best plus a simple schematic without target chasing. Numerical allowance remains unset. Four opt-in suites and unperformed native/human checks are not silently counted as passes.
