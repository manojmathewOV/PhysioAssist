> **Historical initial qualification.** The revision-2 [CCore inspection](ccore-reconciliation.json) supersedes the initial declaration-format refusal below: structural errors and blocked DoD axes are now zero; native topology/TaskEpoch binding and acceptance remain unestablished.

# CCore authoring and research tooling — execution boundary

Tool session: 2026-09-27, authorised Remote Desktop Commander connection. The SDK is Project Cosmos; the target is a separate PhysioAssist snapshot. No Cosmos source, existing runbook, peer task or clinical protocol was changed.

## Observed tool contracts

Actual calls reached `ccore.starbase.handshake`, `ccore.registry.describe`, `ccore.filelens.scan` and `ccore.cnp.assist`. The installed registry exposes Runbook author/compile/next/apply and Research ingest/query/mutate/offer. The contracts distinguish evidence organisation from runbook candidate creation and both from implementation/clinical acceptance.

The loaded provider contract (RunbookProductContract 0.56) supports declaration-only `ccore.runbook.compile` with explicit `mode=inspect_definition` for a `μrunbook0.4` source. The earlier main source tree was not identical to the installed provider; the appropriate provider contracts were read rather than treating old source as current.

## Important limitation

Initial native `ccore.runbook.author` and `ccore.research.ingest/query` requests reached typed shape refusals; the generic Markdown handover was not a native authoritative CNP source. Native authoring additionally requires the exact source/TaskEpoch/selection context; no context or acceptance receipt was fabricated to make it pass. Some exploratory calls were blocked by the tool safety boundary and were not bypassed.

Therefore this handover must not claim a successfully ingested native Research body, a minted Research offer, an admitted Runbook epoch or an accepted gate unless a subsequent recorded receipt specifically establishes it. `research.json` is an explicitly authored portable register, not a simulated native success result.

## Actual declaration-inspection result

See [TOOL_EXECUTION.json](TOOL_EXECUTION.json). The first read-only inspection identified a missing `ops` header field. After adding the declared syntax version, the native tool returned `disposition=refuse`, `reason=runbook_definition_value_refused:@:auth`, `writer=no_writer` and `effect=no_compile_effect`. Its process exit was 0: the semantic result is nevertheless a refusal. The declaration remains R2; it was not relabelled to manufacture higher authority.

This is a portable authored runbook shaped by the inspected CCore contracts, **not** a successfully compiled/admitted native Runbook or ingested native Research body. A future CCore-equipped author may resolve the exact source/authority/TaskEpoch shape through the supported owner route. That optional tooling qualification is not a prerequisite for a cloud coding agent to read this plan.

The separate portable checker passed in cloud Linux and on the Mac: 11 gates, 45 planned acceptance scenarios, 11 DoD axes, eight research questions and seven detected negative structural mutations. Zero implementation gates were accepted. These are plan-structure tests, not application tests.

## Portability

`runbook.json` owns the declared gate definitions; `ROADMAP.cnp` is a deterministic projection for CCore inspection. `STATUS.json` tracks actual accepted progress under the GitHub review workflow. There is no automatic cross-system acceptance, second active control loop, Project Cosmos build dependency or requirement that a cloud coding agent access the owner's Mac.

Internal source files, raw private SDK logs and local absolute paths are deliberately not published. Sanitised tool outputs preserve statuses and limits; redaction must never change a refusal to success.
