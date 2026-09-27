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

## Pending CI permission

The local frozen dependency installation is qualified. Publishing the two-line CI hardening was refused by GitHub because the current credential lacks workflow scope. [Proposed CI patch](ci-hardening.patch) is review-only, not applied by this skill. The published branch leaves `.github/workflows/ios-simulator.yml` unchanged. An appropriately authorised maintainer must separately approve/apply it; do not change credentials or bypass permissions.

The review-only patch has zero context; an authorised maintainer can validate it with `git apply --check --unidiff-zero <patch>` before explicitly applying it. No automatic application is performed.
