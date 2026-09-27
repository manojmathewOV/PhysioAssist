# S1 / G07.W1 — reference playback implementation

Implementation commits: `2ca6c76` (controlled player and audited retirement), `0024f87` (native URL-runtime crash and tighter live layout). This is implementation evidence awaiting independent review, not whole-gate, clinical or release acceptance.

## Delivered

- One shared, official-IFrame-API document for web and native iOS. Explicit Play, Pause, Replay and preparation enlargement; initial follow-along stays unloaded until requested.
- App pause and tracking interruption suspend the reference. Hide/show retains its context and position; a manually paused video is not restarted merely by showing it.
- On small phone viewports, the live reference keeps the instruction, compact count/time and Pause/Stop visible. Enlargement stays on the preparation view rather than growing over live warnings.
- Readiness, stale instance messages, blocked playback, timeout/error and explicit retry are modelled. No playback action creates exercise or measurement credit.
- Native player identity is obtained from the actual installed bundle identifier, not a hardcoded YouTube origin. Web messages are checked for source, origin, scope and instance identity.
- Retired the disconnected downloader, its obsolete tests/types, react-native-ytdl and CameraRoll. Seven installed packages were removed with no retained package version changes. Active uploaded-file analysis, recorded-reference and comparison helpers remain.
- Removed unused microphone/photo-library usage descriptions and microphone grants in native test fixtures. No claim that an unwanted permission prompt was actually observed.

## Native failure found and repaired

A real native UI test reached the video-link editor and saving the sample crashed the app. Its native log reported `URL.hostname is not implemented` from `parseYouTubeId` in Hermes. A separate three-test reproduction failed before the fix. Link parsing and URL construction now use a small allowlisted implementation, without installing a URL polyfill. Tests also reject foreign/credential-bearing/malformed links, non-string stored data and invalid offsets.

The first native driver attempt had a scroll-direction error; the second exposed the application crash above. Those are separate failures and both remain recorded. Neither is called a playback success.

## Evidence and boundaries

See the adjacent evidence record for exact committed test totals, native results, artifact hashes and scope. Browser verification uses the official technical sample and synthetic practice, not a clinical demonstration. People-containing screenshots and raw native diagnostics remain local; no dataset was acquired or redistributed.

Full committed tests: 1645 passed, 4 opt-in skipped, clean exit. Native Release build passed. Native UI outcome: passed. Read the exact run record; prior failures are not erased.

Remaining: independent review, approved clinical assets, full live native pause/hide/error journeys, physical-device accessibility/performance and the complete source-aware shoulder programme. No gate was accepted and main was not merged.

The native screenshots were actually inspected: playing and paused/enlarged states are visible in the setup card, with part of the video above the scrolled viewport. This proves native reference-control observation, not a fully optimised patient layout. The final web 320px screenshot was also inspected after the anti-overlap checks passed.

Resource cleanup removed only the duplicate native diagnostics export after retaining the original result bundle and error excerpt; no user files, protocols or unique test evidence were deleted. The tiny UI-driver cache is retained for reuse. Metro worker/crawl limits remain a resource follow-up; Xcode compiler-job limits alone do not bound that pool.

## Receiving-agent completion pickup at 12a4814

The next pickup found `2ca6c76`/`0024f87` and their evidence locally but not published; incoming material was preserved and checked rather than overwritten. New commit `18f0139` adds four regressions and fixes retry/replay anchoring and overlapping pause/background transitions. Retry can reload at the last position while Replay still goes to the assigned linked start. A manually paused video stays paused.

Commit `12a4814` bounds Metro to two workers per worker pool, disables only this project's Watchman integration and makes pre-push run the exact Integration test path without `--passWithNoTests`. The first native attempt stalled in the bundler and was stopped through the verified owned child PID; that failure is retained. The next build passed with the no-Watchman project configuration and reused cache. Timings are observations, not an isolated performance experiment.

**Fresh verification:** 1,649 application tests passed, four opt-in skipped, natural exit and no teardown warning. The 48 focused reference/parser checks pass. Frozen Pods and native Release build passed. Nineteen real-browser checks passed, including blocked player-script failure, explicit Retry after restoring network access, position retention and no treatment credit from watching/practice/failure.

**Native boundary, not a pass:** the expanded XCTest passed preparation playback, pause/enlarge and replay assertions, then failed waiting for `use-practice-mode`. Release intentionally excludes the simulated body via `__DEV__`; the simulator has no camera. The test remains a recorded counterexample for the proposed test route. Do not enable fake measurements in production or silently skip the failure to get a green native journey. Preparation screenshots and the final no-camera state were actually inspected. The scrolled preparation screen clips the player top, so visual completeness is not established.

The live native Pause/Hide/Show assertions have not run. They need an explicitly isolated test/debug input lane or the real camera-optional Do journey. The Release no-camera message also misleadingly mentions a practice option which is absent; keep that copy issue with the camera-optional patient-flow work. S1 remains partial pending these gaps and independent review.

See [pickup.json](../evidence/2026-09-27-reference-controls/pickup.json) for exact bases, failures, observed boundaries and resources. The original `run.json` remains evidence for `0024f87`, not the new revision. No clinical permission, target, measurement estimator, patient footage or backend was added. No new repository, dependency package or benchmark download was needed for this pickup; native and browser jobs finished and the dedicated simulator was shut down.
