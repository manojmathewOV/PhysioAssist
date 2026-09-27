# PhysioAssist — one active handover

Start with [CURRENT.md](CURRENT.md). The current product scope is an **iPhone patient-only local-first app**. Clinical permissions and measurement claims still require the relevant evidence; future surgeon/physio linkage is not a clinician-platform MVP.

## Read only what is needed

1. [Current state and next action](CURRENT.md), then [branch/archive map](BRANCHES.json).
2. [The existing MVP runbook, revision 2](runbooks/ios-patient-mvp/README.md): gate dependencies, exact validation, DoD, progression and endpoints.
3. [Frozen Claude handover](responses/2026-09-27-6bc4d77-claude-final-handover.md) and [current integration record](reconciliation/2026-09-27/RECONCILIATION.md).
4. For the chosen work item, drill into [backlog](backlog.json), [clinical approvals](protocols/APPROVALS.md), sources and original reviewer evidence.

The active consolidation branch is in `BRANCHES.json`. Predecessor refs are retained as checkpoints, not parallel implementation targets. `main` is unchanged until explicit integration approval.

## Durable evidence, not competing roadmaps

`reviews/` and `responses/` are immutable historical evidence at their named SHAs. `research/` contains proposals and qualified experiments, not approvals. `archive/` contains superseded entry-point snapshots. The runbook's JSON manifest is the plan; STATUS and evidence record progress. Its Markdown/CNP/matrix presentations are generated or checked against those records.

Portable tools are in `tools/claude-cloud/` and the root hybrid skill. No Mac absolute path, expired artifact URL or private cloud scratch file is a required GitHub handover dependency. Full source protocols are not included merely because their filenames are known.

Use [the response template](templates/AGENT_RESPONSE.md) for new implementation evidence. Do not rewrite an independent finding into a self-approved result. Do not broaden this work into clinical accounts, messages or cloud record storage.
