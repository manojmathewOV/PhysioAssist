# Native no-camera recovery — small S1 follow-up

Application change: `7d717f92e4e3b31663a9516a4a8087b7664da151`.
Native test source/build: `7cbafe4a057b531eacf8dc6804ebc20368fd62d9`.
Parent integration basis: `d910a8cbee07169e28a2b8c0014932f67d4a6c3f`.

The prior native live-reference test found a Release screen promising a practice option which was compiled out. This patch makes the no-camera explanation and actions derive from the same optional practice action. In Release, it explains that tracking is unavailable and offers Back to exercises. It does not enable the simulator in production or turn a failed camera check into exercise permission/completion.

## Executed evidence

- Two rendered component tests cover absence/presence of the actual practice action and the Back callback. No practice callback runs automatically.
- Full suite on clean `7d717f9`: **1,651 passed, four opt-in skipped, zero failures**, 93 suites, natural exit with no teardown warning. TypeScript passed.
- `7cbafe4` adds only the separate native UI test source. Its Release simulator build passed using existing dependencies and caches.
- The actual native XCTest passed: exercise start -> no-camera screen -> no nonexistent practice offer -> clear tracking-unavailable explanation -> Back -> exercise selection. The attached native screenshot was opened and inspected.
- The older expanded `ReferenceUITests` failure remains an open test-input boundary. This new test is not a substitute for native live Pause/Hide/Show or camera-free treatment acceptance.

Read [no-camera.json](../evidence/2026-09-28-main-integration/no-camera.json) and [the actual native screen](../evidence/2026-09-28-main-integration/release-no-camera-truthful.png). They contain source identities, test/build log hashes and limitations. Raw logs/result bundles stay local.

## Limits and next work

No clinical target, exercise dose, angle method, protocol source, persistence semantics or care-team capability changed. No patient footage, new dependency, global setting or benchmark download was introduced. The dedicated simulator was shut down; there is no persistent test service.

Independent review remains pending. The next product work is camera-optional, source-aware Do plus approved demonstration content and qualified native live-reference coverage. This patch closes misleading copy, not that larger journey or an entire runbook gate.
