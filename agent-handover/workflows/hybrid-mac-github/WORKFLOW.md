# PhysioAssist: hybrid Mac + GitHub + RDC workflow

Date: 2026-09-27. Application basis: `414b81b170a6205b9fcb3aca20f3cab89bb850a1`.

This is an operational guide beneath the [existing iPhone MVP runbook](../../runbooks/ios-patient-mvp/README.md). It does not change the patient-only/local-first scope, create a second product roadmap or accept an implementation gate. Project Cosmos remains an optional planning aid, not an application dependency.

## Responsibility map

| Component                | Role                                                                              | Boundary                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| ChatGPT                  | Plan, edit, investigate, select tests, inspect images, publish evidence           | Not independently reviewing its own implementation; not an always-running background agent |
| Remote Desktop Commander | Explicit command/file/image transport to the authorised Mac                       | Not a cloud Mac or security sandbox                                                        |
| Isolated Mac checkout    | Pinned tools, dependencies, source edits, tests, web browser, Xcode and simulator | Never modify Claude's active checkout or Cosmos source/lanes                               |
| GitHub                   | Durable source, PR review, handover and independently hosted CI                   | Green CI is not visual or clinical acceptance                                              |
| Clinical owner           | Protocol/source choices, permissions, pilot/release decisions                     | An app confirmation flag is not authenticated clinical approval                            |

## Complete delivery loop

```text
Current MVP gate + exact source SHA + ownership acknowledgement
 -> isolated checkout; inspect source and dependency scripts
 -> minimal reproduction; intended outcome and falsifiers
 -> bounded implementation on an owned feature branch
 -> typecheck + lint + focused tests + relevant full regression
 -> local browser and controlled synthetic/permission-cleared camera input
 -> native Release simulator build with recorded dependency/toolchain roots
 -> scripted native journeys and screenshots/result bundle
 -> actual visual review; defects return to implementation
 -> ordinary commit hooks and pre-push checks
 -> push owned branch; GitHub-hosted CI; download and verify artifacts
 -> independent review; update existing handover/status with exact evidence
```

## Workspace and ownership

Use a separate PhysioAssist workspace outside Project Cosmos: `app/` for the isolated app checkout, `handover/` for documentation, and `RDC/` for toolchains, per-run logs and DerivedData. The runtime path belongs in local configuration, never in public evidence. Caches are replaceable; source and accepted evidence are durable in GitHub.

Start an implementation branch such as `agent/<task-id>-<name>` from the acknowledged SHA. One writer owns a task/edit surface. Do not overwrite `claude/**` while Claude is working. Separate branches still require semantic coordination. Claude's uncommitted cloud changes are unavailable until committed and pushed; never assume an unchanged GitHub SHA means no work is in progress.

Do not reset dirty worktrees, force-push, kill broad process names, erase existing simulators or delete another agent's artifacts. Record generated native dependency changes separately. A resolved Podfile lock differs from a frozen-lock reproduction even if the source SHA is unchanged.

## Background operation without a visible Xcode window

Use `xcodebuild` and `xcrun simctl`; no need to open the Xcode GUI or take over the keyboard/mouse. Create one dedicated, named simulator and save its UDID. Install, launch, capture and shut down only that device. UI interaction requires Detox/XCTest or another explicitly qualified driver; `simctl` alone is not a complete patient-journey driver.

Launch a reviewed, bounded batch through RDC. Its supervisor writes an atomic status file, captures command/exit/duration/logs, enforces a per-step timeout and stops on failure. A job-specific `caffeinate -i -w <pid>` may prevent idle sleep during the run; it does not make lid closure, shutdown, power/network loss or logout irrelevant. No global sleep-setting change or permanent daemon is required.

The OS process may keep running after connection loss. ChatGPT does not keep autonomously reasoning or repairing after a response ends. On reconnection, inspect the recorded status and verify PID, command and start time before acting. Unknown/interrupted results stay unknown; do not blindly duplicate a still-running job. A future check-in needs an explicitly scheduled task, not a promise in prose.

Initial resource policy: AC power, adequate free storage, one native build, two compiler jobs, low process priority and one audit simulator. Check competing workloads first. These reduce contention but do not guarantee a particular temperature or response time. Retain useful caches; clean only owned disposable output after preserving evidence.

## Security

Do **not** register this personal Mac as an automatic GitHub self-hosted runner for the public repository. GitHub warns that untrusted PR code can persistently compromise such a runner. RDC should execute only an explicitly reviewed revision/task, not a generic queue supplied by any PR. A separate folder is not an OS security boundary; a dedicated development account/machine is optional later hardening, not configured here.

Keep the Mac's GitHub and signing credentials on the Mac. Never paste tokens into chat or transfer them to the cloud sandbox. No public inbound shell service, unattended PR watcher or broad privileged automation is installed.

## Validation tiers

**Production logic:** clocks, replay identities, schedules, phase permissions, measurement admissibility and result wording. A zero Jest exit with a forced-worker warning is not clean teardown. Test both the normal and pre-push TypeScript configurations; confirm the intended Integration file actually ran despite the hook's `--passWithNoTests` flag.

**Web integration:** production web build, private loopback server on an unused port, headless Chromium, stable test/accessibility IDs and responsive layouts. Use synthetic camera input first. A fake device being available proves a browser capability, not exercise recognition. Permission-cleared research clips stay local with provenance. Never disable certificate verification as a shortcut.

**Native simulator:** Release build with embedded JS avoids a shared Metro server. Run actual React Native screens with synthetic programme/history fixtures via the existing Detox lane or XCTest/XCUIAutomation. Record simulator/runtime/SDK, tests, screenshots and result bundle. Do not assume browser appearance equals native appearance. Missing UI-driver prerequisites are explicit gaps; do not silently make global installs.

**Physical iPhone:** real camera, thermal/memory/battery behaviour, VoiceOver/Dynamic Type, interruption/offline recovery and older-user interaction. Signing, selected devices and TestFlight publication need owner-approved setup. Simulator success is not a substitute.

## Required patient-journey visual checks

| Journey                        | Evidence required                                                       |
| ------------------------------ | ----------------------------------------------------------------------- |
| First run / local profile      | Honest registration and backup language; no compulsory clinician portal |
| Prescribed shoulder / knee     | Correct side, variant, support and current permission                   |
| Reference playback             | Actual approved video; enlarge/replay/captions/audio/return             |
| Hold with pause/background     | Same active time in live display, summary and history                   |
| Due-time crossing              | Mounted screen updates; foreground/midnight/schedule revision handled   |
| Invalid measurement            | No fallback number, contradictory praise or misleading saved result     |
| Focus/plain camera             | Relevant stick, helper hand, chair and brace remain understandable      |
| Offline / interrupted save     | No duplicated completion, invented dose or loss of old history          |
| Small screen / enlarged text   | Essential controls reachable; meaningful assistive labels               |
| Recovery / appointment summary | Measured, approximate, self-reported and unavailable remain distinct    |

Capture the fixture, source SHA and assertions, then record actual visual observations. A screenshot existing is not proof it was inspected; an attractive screen is not clinical accuracy. Keep testing mocks and patient-owned data separate.

## Publishing and recovery

Use normal pre-commit and pre-push checks for application changes. Do not blanket-disable hooks. If a hook fails, inspect the actual output/configuration before changing code. Preserve old reviewer tests; classify superseded expectations explicitly and link their current replacement.

Publish documentation from a separate handover checkout. Refresh the branch head before a non-forced push and reconcile concurrent updates. Keep the application branch untouched during documentation publication. Git Data API publication, if used, must be labelled as such and not represented as a normal hook-checked push.

Retain large raw logs, `.xcresult`, app binaries and private media locally or in appropriately restricted artifacts. Public evidence contains only reviewed synthetic images, scrubbed logs and hashes. No private protocols, patient video, contact lists, tokens, signing material, absolute home paths or temporary signed URLs. Record artifact IDs/digests/expiry because CI artifacts expire.

## Existing runbook mapping

- G00: current SHA, task ownership, environment and scope.
- G01: correctness, clean test shutdown, exact dependency reproducibility.
- G04-G07: programme/activity/measurement behaviour, reminders, media and accessibility.
- G08: measured device efficiency; no inference from desktop RAM or simulator timing.
- G09: native builds, scripted journeys, artifact retrieval and actual visual review.
- G10: separately approved clinical pilot/release with a current submission toolchain.

The current Mac was observed running macOS 14.5, Xcode 16.2 and an iOS 18.3 simulator runtime. This is an older-platform test lane, not current App Store qualification. Apple's stated upload requirement since 28 April 2026 is Xcode 26 or later with the specified SDK generation. Use a qualified current GitHub-hosted toolchain, or obtain owner approval for a local OS/Xcode upgrade. Neither upgrade nor release signing was performed by this task.

## Evidence

Read `evidence/qualification.json` for exact observed successes, failures and untested boundaries. Raw logs remain under the dedicated local workspace. No full application feature was implemented by this workflow-qualification task. No MVP gate or clinical claim is accepted here.

## Platform sources (checked 2026-09-27)

- Apple command-line builds/tests: https://developer.apple.com/library/archive/technotes/tn2339/_index.html
- Apple XCTest / UI automation: https://developer.apple.com/documentation/xctest/
- Current submission requirements: https://developer.apple.com/news/upcoming-requirements/
- Xcode 16.2 compatibility: https://developer.apple.com/documentation/xcode-release-notes/xcode-16_2-release-notes/
- GitHub self-hosted runner security: https://docs.github.com/en/actions/reference/security/secure-use
- Repository basis: `.github/workflows/ios-simulator.yml` at `414b81b170a6205b9fcb3aca20f3cab89bb850a1`.
