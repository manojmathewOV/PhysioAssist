# Resource policy

The owner's landing root is not itself the application checkout. Keep `repo/` for the single development tree; `RDC/metadata` for host identity, state, run pointers and migration inventory; `RDC/runs` for evidence; `RDC/cache` for disposable results; `RDC/toolchain` for the exact Node version; `RDC/skills` for the small active copy of this skill. Existing `.claude*` folders remain untouched.

One main `node_modules` and one Pods tree. Temporary documentation worktrees may use the main installed dependency directory only when package and lock hashes are identical and no install/build modifies it. Remove the temporary worktree after a clean published commit. Do not use shared mutable dependencies for differing locks or simultaneous application branches.

Operational defaults (not measured app performance claims): two compiler jobs, two Jest workers, nice +10, 2 GiB Node heap per process, 20 GiB pre-run free-disk reserve, 8 GiB pre-run owned-cache budget, 50 MiB maximum single command log, no watcher. These disk checks are preflight gates, not filesystem quotas; a completed build can grow the cache and will be checked before the next job. Native builds require AC power. One heavy task at a time via an advisory lock. Direct commands outside the runner can bypass these safeguards; check existing processes first.

Reuse one DerivedData path only while toolchain/architecture and source identity are understood. After moving an Xcode project, old paths may invalidate intermediates. Rebuild once; do not preserve multiple multi-gigabyte dated build trees. Keep the most recent useful cache rather than deleting it after every small test. Disk budgets are engineering defaults adjustable with owner approval, not application clinical settings.

Measure folder allocation with `disk`. APFS shared/cloned blocks, snapshots and concurrent activity mean the sum of folder sizes is not necessarily the change in physical free space. Report those separately. File bytes and RAM usage are different. No claim of reduced running memory follows from deleting disk caches.

Metadata should remain small (target under 10 MiB excluding evidence). Keep run summaries and unresolved failure evidence. Raw logs/result bundles may be compressed after completion; delete unique evidence only after a verified durable archive and an explicit retention decision. Do not create one copy of the repository per review. Never automatically delete a failed run to enforce a cosmetic budget.

## Cleanup

```sh
python3 "$SKILL/scripts/workspace.py" --root "$ROOT" prune
# Inspect exact paths and current plan_sha256, confirm no job is using them:
python3 "$SKILL/scripts/workspace.py" --root "$ROOT" prune --apply-digest '<current digest>'
```

Allowlisted targets: `RDC/cache/DerivedData`, `RDC/cache/DerivedData-pre-move`, `RDC/cache/jest`, `repo/dist`, `repo/coverage`. A stale digest, symlink, tracked file or detected workspace process refuses cleanup. Dependencies, Pods and evidence are not touched by this operation.
