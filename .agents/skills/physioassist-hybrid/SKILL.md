---
name: physioassist-hybrid
description: Develop, test and review PhysioAssist through an authorised Mac via RDC and GitHub. Use for local setup, native iOS builds, regression tests, screenshot review, handovers and scoped cache maintenance.
compatibility: Python 3.9+, Git, authorised RDC or local shell. Application checks require the repo-pinned Node; native checks require macOS, CocoaPods and Xcode. GitHub publication requires existing authorised access.
metadata:
  version: '1.1'
---

# PhysioAssist hybrid workflow

## Read first

Use the owner's configured landing root. On Manoj's current Mac it is resolved from `RDC/metadata/workspace.json` beneath the authorised landing folder; do not guess or create another dated clone. The root contains `repo/` and `RDC/`. Preserve pre-existing `.claude*` material.

Read the local `AGENTS.md`, `RDC/metadata/STATE.md`, the repository's current GitHub handover and the active iPhone MVP gate. The handover may live on its review branch until merged; absence from the application branch is not permission to invent its contents. Record both the application SHA and the independent handover revision.

Read [operations](references/OPERATIONS.md) for exact commands and [resource policy](references/RESOURCES.md) before provisioning or cleanup. Load detailed research only for the active task. No patient data, clinician portal, automatic clinical progression or signing setup is added by this skill.

## Mechanism

1. Inspect current branches, dirty files and running jobs. Claim one bounded task/edit surface before writing. Never overwrite Claude's active branch or uncommitted work. Local files are not a security sandbox.
2. Reuse `repo/`, its one `node_modules`, one Pods tree and one Xcode build cache. Fetch a revision, do not clone repeatedly. If absent, clone into `repo/` only after verifying the empty destination and repository identity.
3. Verify `.nvmrc`, manifests, tool versions and free disk. Preserve dirty generated/native changes as a hash-bound patch before intentional restoration. A shell exit of zero cannot override semantic refusal or a forced-worker warning.
4. Reproduce the selected problem, then implement on an owned feature branch. Use the guarded runner below; source/config changes under test are candidate evidence, not a clean committed reproduction.
5. Run focused tests first, both TypeScript configurations where relevant, lint and the full relevant regression. Diagnose leaks; never hide them with `--forceExit`, warning suppression or blanket timer disabling.
6. Run `pod install --deployment` for native work. If it refuses, stop and reconcile the dependency contract on a branch. Do not silently fall back to unconstrained resolution and call it reproducible.
7. Use Xcode's CLI and one dedicated simulator. Test the native patient journeys, capture images, and actually inspect them. Browser screenshots, simulator pictures, real-camera measurements and physical-device performance are different evidence classes.
8. Publish bounded code changes through normal hooks. Add a SHA-bound handover response with commands, results, omissions and independent-review status. Do not call your own implementation independently verified.
9. Shut down only the owned simulator, close only the owned browser/server, and release the job lock. Leave no watcher or daemon running. Keep logs and a small next-action record; do not append whole conversations.

## Guarded commands

Pass the explicit landing root and full expected Git SHA. `ROOT` is local shell configuration, not a value embedded in public code.

```sh
python3 "$SKILL/scripts/workspace.py" --root "$ROOT" status
python3 "$SKILL/scripts/workspace.py" --root "$ROOT" disk
python3 "$SKILL/scripts/workspace.py" --root "$ROOT" test --expect-sha "$SHA"
python3 "$SKILL/scripts/workspace.py" --root "$ROOT" pods --expect-sha "$SHA"
python3 "$SKILL/scripts/workspace.py" --root "$ROOT" ios-build --expect-sha "$SHA"
```

For reviewed uncommitted changes add `--allow-dirty`. The run records the tracked diff hash and explicitly does not attest untracked inputs. Check all inputs before a final release claim.

The runner has an exclusive advisory lock, explicit command allowlist, time/log/disk limits, two Jest workers, two compiler jobs and reduced scheduling priority. Node heap is capped at 2 GiB **per process**, not total application/RSS. It does not enforce clinical approvals or protect against arbitrary code already trusted on the Mac.

## Failure and resumption

If RDC disconnects, reconnect and inspect `last-run.json` and the referenced immutable run. A `running` record is not success: verify its PID/command and source before resuming. Never re-run blindly while a previous process might still own the workspace. This skill is not a background agent and does not promise later messages. Deliberate unattended work requires a reviewed bounded process and explicit scheduling arrangements.

Timeouts, interruptions, unexpected dirty files, source movement, missing prerequisites and invalid schedules remain blocked or unknown. Do not grant authority, weaken tests or fabricate clinical values to get green. Resolve a cause before repeating a heavy command.

## Space and privacy rules

Metadata and Git evidence are durable; dependencies and build products are reconstructable. Never purge user documents, protocols, historical reviewer tests, raw evidence, secrets, `.git`, unknown files or shared macOS caches as a space-saving shortcut.

`prune` is dry-run by default and permits only five named generated paths. Apply requires the freshly observed plan digest, unchanged observed metadata, no tracked member and no workspace process. It does not remove historical evidence, node_modules or Pods. Old dated reviewer caches need a separate explicit inventory and ownership check.

Use compact public-safe summaries and synthetic screenshots. Keep private source originals and raw identifying clips outside GitHub. Never copy Keychain credentials or signing keys into chat or the repo. A local path or expired CI URL is not a cloud handover.

## Qualification boundary

Consult the latest verification record rather than freezing test totals in this skill. The host's Xcode may qualify an older simulator lane while failing current App Store upload requirements. No global OS/Xcode upgrade, Homebrew tap, permanent self-hosted runner or administrator setting change is implicit in this skill.
