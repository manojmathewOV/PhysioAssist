# Current PhysioAssist work — read this, not the historical state log

Updated 2026-09-27. Scope: **iPhone patient-only, local-first MVP**. Surgeon/physio backend, monitoring and clinical cloud sync remain future scope.

## Ownership and basis

- Claude implementation is frozen at `6bc4d77f9ee9bbe95ef181d50fbaf94cf2388f84`. Its final handover is [here](responses/2026-09-27-6bc4d77-claude-final-handover.md). Claude is independent reviewer unless explicitly reassigned.
- Receiving implementer: ChatGPT via the authorised hybrid Mac/RDC/GitHub workflow. One writer per task and source surface.
- Active consolidation: **draft PR #28**, `agent/mvp-integration-20260927`; exact predecessor refs and successor PR in [BRANCHES.json](BRANCHES.json).
- PRs #25/#26/#27 are closed as superseded; their heads remain ancestry-contained and archive-tagged. No source branch was deleted.
- `main` is **not changed or approved for release** by this reconciliation.
- Reuse the owner's configured local landing `repo/` and `RDC/`. No extra clone/dependency install is needed.

## What is genuinely established

P08 was independently retested on 6bc4d77: 1,593 passed/four opt-in skipped, parallel and open-handle runs exited cleanly. Preserve the fix. R01-R03 and web EX06 have implementation evidence; not all have independent end-to-end acceptance. Native focus and complete patient journeys remain open.

The four skipped suites are recorded individually in Claude's final handover: one Detox-mode-only and three permission-cleared dataset-dependent benchmarks. Skipped is not a benchmark pass.

## Next action and blockers

**Current engineering frontier: G01.W1 / I01 — native dependency portability.** PR27's hosted Install pods failed with a different CocoaPods generation/checksums. Preserve deployment-mode and pipefail; diagnose/pin and validate a clean hosted run. Local success is not enough.

**Next data-safety slice: G02.W1 / I02 — storage read-error overwrite.** Slow read was fixed; a rejected read was separately reported to permit empty-state overwrite. Reproduce before the larger transactional storage migration.

Source approvals C01-C08 and owner choices D01-D08 remain open only where relevant. Do not invent clinical timing, targets, source version or monitoring. Reversible framework/synthetic work can proceed without activating an unresolved prescription.

## One roadmap and evidence ledger

Read [runbook README](runbooks/ios-patient-mvp/README.md), [STATUS](runbooks/ios-patient-mvp/STATUS.json), [gate roadmap](runbooks/ios-patient-mvp/RUNBOOK.md), then only the active criterion in [validation matrix](runbooks/ios-patient-mvp/TEST_MATRIX.md). Do not mark a gate accepted from the existence of a plan, test count or CCore syntax receipt.

Latest reconciliation evidence: [record](reconciliation/2026-09-27/RECONCILIATION.md). Original reviews/responses/research are retained, not overwritten. Older CURRENT snapshots are [archived](archive/2026-09-27-before-reconciliation/README.md), not competing instructions.

## Useful tools and limits

- [.agents hybrid skill](../.agents/skills/physioassist-hybrid/SKILL.md): local bounded execution and cache policy.
- [Claude reusable scripts](tools/claude-cloud/README.md): inspect before use; stale seed-method fields are known; no included private media.
- [Original reviewer tests](tests/README.md): historical tests are not blindly installed in current Jest discovery.
- Private protocols, identifying videos and Claude's raw scratch logs were deliberately not published. Source inventory is not source approval.
- No inherited Claude schedules are active according to his final handover; this agent does not infer an unattended background worker.
