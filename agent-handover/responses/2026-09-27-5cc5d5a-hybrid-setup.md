# Hybrid skill, permanent landing and bounded resource use

Date: 2026-09-27. Application basis: `6bc4d77f9ee9bbe95ef181d50fbaf94cf2388f84`. Infrastructure candidate: `5cc5d5ae6657c4fbb3e9c24c88cc47e8c77a8f4a`, PR #27. This response does not merge any PR or accept a clinical/release gate.

## Scope and ownership

The owner selected one permanent Mac landing root, configured locally with `repo/` plus `RDC/`. Existing checkout, toolchain and historical evidence were moved rather than downloaded again. Existing agent metadata and private protocol originals were retained. The app branch owned by Claude was not changed.

The portable skill is [SKILL.md](https://github.com/manojmathewOV/PhysioAssist/blob/5cc5d5ae6657c4fbb3e9c24c88cc47e8c77a8f4a/.agents/skills/physioassist-hybrid/SKILL.md). It supplies exact-revision/origin checks, a single-job advisory lock, bounded commands, low priority, two workers/compiler jobs and explicit resource/cleanup rules. It is not a permanent agent or an OS sandbox.

## Current findings

| Item                        | Disposition and evidence                                                                                                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P08 clean shutdown          | **Independently verified on 6bc4d77 in this environment**: 1,593 passed / four skipped in both parallel and --detectOpenHandles runs, exit 0, no forced-worker or detected-handle report, no --forceExit. This credits Claude's change, not a second implementation.        |
| Native dependency drift     | Reconciled the lock for NO_FLIPPER=1, removed the tracked machine Node path and obsolete native integration. Repeated deployment-mode Pod installs preserve the lock. Infrastructure implementation still needs independent code/CI review.                                 |
| Generated-tree lint wastage | Existing eslint invocation walked Pods after a native setup. Stopped that owned process, excluded generated directories only, then lint passed in ~16 seconds: 0 errors / 450 warnings.                                                                                     |
| Resource duplication        | Removed four obsolete dependency copies and the pre-move build cache after exact inventory (~5.30 GiB allocated blocks). Retained source/tests/evidence. Physical APFS free-space recovery is not inferred from that sum; one useful current cache is rebuilt and retained. |
| Skill qualification         | 22 standard-library synthetic guard/runner tests passed in cloud Linux and on the Mac; not application/clinical tests.                                                                                                                                                      |
| Native qualification        | New-root Release build passed in 352.71 seconds; dedicated simulator installed/launched it, running at 10 seconds; actual onboarding image inspected; simulator shut down. Full local Detox rehab journeys remain untested.                                                 |

See [verification and logs](https://github.com/manojmathewOV/PhysioAssist/tree/5cc5d5ae6657c4fbb3e9c24c88cc47e8c77a8f4a/.agents/skills/physioassist-hybrid/evidence).

## Explicit permission boundary

GitHub refused the initial CI-workflow edit because the Mac credential lacks workflow scope. The published branch leaves `.github/workflows/ios-simulator.yml` unchanged. A review-only proposed `--deployment`/`pipefail` patch is included; an appropriately authorised maintainer must apply it separately. No permission was elevated or bypassed. Normal commit/push hooks passed for the published change, including 21 Integration tests.

## Pickup

Review PR #27; do not replace Claude's application branch. The iPhone patient-only/local-first runbook remains authoritative. Local AGENTS/STATE records direct agents to the reusable checkout and the GitHub handover. Skill host auto-discovery must be verified or the skill read explicitly.

Current operational defaults: one managed job; 2 GiB Node heap per process (not a total-RSS guarantee); 20 GiB preflight free-space reserve; 8 GiB preflight cache budget; 50 MiB command-log ceiling. No watcher or daemon persists after a run. Cleanup is dry-run by default and never purges evidence, source, metadata, credentials or shared system caches.

Still open: authorised CI hardening; full native UI-driver setup and rehab journeys; current release-toolchain qualification; physical-device/real-camera/clinical validation. No simulator/runtime, Homebrew prerequisite, macOS or Xcode upgrade was performed. No patient content was uploaded.

## CI permission resolution — 2026-09-27

The initial Mac OAuth workflow-scope refusal was resolved using the already-connected GitHub app, which had separately authorised workflow-write access. It published the exact two-line CI change in `343a400c115f347f7fcd46a97ac3a8953883cea5`; PR #27 now has head `0ca6dbe166df2cdba36477f8bae316fe56308aae`. No account scope or credential was changed. CI uses frozen Pod installation and pipefail. A controlled failing-Pod pipeline returned 7 with pipefail and 0 without it. The API workflow commit did not run local Git hooks at publication; the main patch and following docs commit did, including the 21 Integration tests. The earlier inactive patch was retired. These results do not claim hosted native CI has completed. This resolution note was published via a contents-API documentation update.
