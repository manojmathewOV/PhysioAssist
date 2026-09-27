# Operations and recovery

## Landing configuration

`RDC/metadata/workspace.json` uses this schema, with no credential values:

```json
{
  "schema": 1,
  "owner": "physioassist-hybrid-v1",
  "repo": "repo",
  "runs": "RDC/runs",
  "cache": "RDC/cache",
  "toolchain": "RDC/toolchain",
  "minimum_free_gib": 20,
  "cache_budget_gib": 8
}
```

The stable local skill copy is `RDC/skills/physioassist-hybrid/`. `SKILL.md` at the landing root is a pointer, and optional host-specific discovery links point to that same copy. GitHub is the versioned source. Installing this file does not automatically register a skill in every agent; verify host discovery or explicitly read it.

## Setup once, then reuse

Inspect `.nvmrc`, package scripts and locked dependencies. Use the exact Node version; verify the upstream download checksum. Do not expose a credential or change the global default Node. A browser driver may need a newer Node than the application: keep the driver environment separate and do not regenerate the application lockfile just to satisfy it.

`npm ci --legacy-peer-deps` executes project lifecycle hooks; inspect them before use. Do not run `npm ci` every session. Record package/lock/toolchain fingerprints in metadata after successful installation, and invalidate when inputs change. The local `ios/.xcode.env.local` must be ignored by Git and recreated for this machine. Never commit an absolute Node path.

The app's native lane uses `NO_FLIPPER=1`. With its reviewed lockfile, run deployment-mode Pod installation and compare the lock before/after. `pod update` is a dependency upgrade, not routine setup. Type/lint/test commands run against authored source; generated Pods and build directories should be excluded, not application components.

## Native observation

Use the dedicated simulator identity recorded in metadata. Create it only if absent. `xcrun simctl list` establishes availability; `boot`, `bootstatus -b`, `install`, `launch` and `io screenshot` establish a native launch observation. Do not erase existing devices or use `shutdown all`. A missing runtime is a prerequisite decision, not reason for an unapproved multi-gigabyte SDK download.

Full interaction requires qualified Detox/XCTest setup. `simctl` alone is not a full patient-journey driver. Existing `scripts/ci/ios-smoke-test.sh` is a historical smoke route; inspect side effects before running it. No broad permissions or real-camera access are needed to verify synthetic onboarding.

## Publication

Use an owned feature branch and normal hooks. Pre-push uses a distinct TypeScript config and the Integration test file; confirm it runs tests, not an empty `--passWithNoTests` result. On hook failure inspect cause; no blanket `--no-verify`. Do not stage machine paths, raw logs, Pods, models, DerivedData, patient data or source originals. Review staged diff and the public-safe manifest before non-forced push.

Update the shared GitHub handover with a response and exact commit, not an absolute Mac evidence path. Preserve original findings and classify changed expectations. A manually supplied local programme is not authenticated surgeon approval. Engineering task completion cannot accept a clinical gate.

## Open platform work is not hidden

A native dependency lock can be stable locally yet still need a fresh hosted-CI check. Passing UI tests does not verify pose accuracy. Xcode 16.2 is an older-runtime lane: Apple currently requires Xcode 26+ SDKs for uploads (re-check at release). Global upgrades, signing, TestFlight and physical-patient tests require separately scoped work.

Primary references checked 2026-09-27:

- Agent Skills format: https://agentskills.io/specification
- CocoaPods `--deployment`: https://guides.cocoapods.org/terminal/commands.html
- Jest 29.7 diagnostics: https://jestjs.io/docs/29.7/cli
- Apple submission requirements: https://developer.apple.com/news/upcoming-requirements/

## Publication routes and the resolved CI permission case

The Mac OAuth credential refused the CI workflow update because it lacks workflow scope. The already-connected GitHub app had its own authorised workflow permission and published the exact two-line change in commit `343a400c115f347f7fcd46a97ac3a8953883cea5`. No credentials or account scopes were changed.

CI now uses deployment-mode Pods and pipefail. A controlled failing-Pod probe returned exit 7 with the new pipeline and exit 0 without pipefail. This tests failure propagation, not a hosted native run. The main infrastructure/skill patch used ordinary local commit/push hooks; the small workflow edit used the GitHub API and therefore did not run local hooks at publication. Record that distinction; never imply an API write ran Git hooks.

Use only currently authorised tool actions. A denial in one credential is not permission to escalate it. An independently authorised connection may be used within its declared scope, with exact file-SHA checks and readback. Preserve failed attempts and later resolutions separately.

## Pinned native toolchain (G01/I01)

The repository now declares Ruby in `.ruby-version` and CocoaPods/JSON/Xcodeproj plus transitive dependencies in `Gemfile.lock`. Use `scripts/ci/install-pods.sh`; the guarded `pods` action delegates to it. It sets Bundler frozen mode, checks installed gems and preserves deployment mode and the Pod lock digest. Do not use the host-global `pod` directly. Provision once, reuse gems, and use the selected Ruby on PATH for native commands. An existing matching gem installation can be reused via local GEM_HOME without copying it or changing global defaults. Hosting uses ruby/setup-ruby with the committed bundle. Record local provisioning outside Git; a missing bundle is a prerequisite error, not permission to regenerate either lock.

## Simulator storage parity

The iOS build action targets only `iphonesimulator` and uses Xcode ad-hoc signing (`CODE_SIGN_IDENTITY=-`). It does not select a developer identity or provision/sign a device or distribution build. Disabling signing altogether can remove the simulator app entitlement used by Keychain; a running process alone therefore cannot qualify storage. Inspect the actual first-run screen and preserve unexpected recovery states as failures to investigate. Never treat a Keychain permission error as an absent record to get past the screen.

Optional `ruby_bin` and `gem_home` in local workspace.json select an existing owner-approved Ruby/gem installation. They are absolute host paths in local metadata only, never committed. The runner validates their existence and the frozen install validates declared versions. Missing tooling blocks the command rather than causing a global installation.
