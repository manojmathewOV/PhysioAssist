# Progression, DoD and endpoints

## State transitions

`planned -> in_progress -> implemented_pending_review -> accepted` is the normal engineering path. Any active state may become `blocked` with a named owner, exact missing condition, safe next action and wake event. Accepted work becomes `reopened` when its basis or contradictory evidence invalidates the accepted claim. `deferred` means explicit scope removal, never a disguised pass.

The independent acceptor checks the exact implementation/evidence version. The implementer submits; it does not self-accept. Clinical authority and product-release decisions are separate from engineering review. `main` merge is not a clinical milestone.

## Dependencies without paralysis

`depends_on` constrains gate closure. Nonmutating research, test design and reversible candidate slices may start earlier when their named inputs are known. That does not grant acceptance or activate clinical content. Unresolved D/C decisions block only their dependent irreversible/clinical behaviour, not every unrelated task. G00 can establish the scope and decision register without pretending D01-D08 are answered.

At pickup, reconcile head/dirty jobs, read STATUS, select one next_work_item, state its input basis and failure case, and stop when it is submitted or genuinely blocked. A green test is a checkpoint; continue to the defined outcome or hard blocker. More than two attempts with no new discriminating evidence requires RCA/replanning, not another identical heavy build.

## Eleven-axis DoD

Every gate carries outcome predicate, material invariants, known failure modes, consequences, irreversibility, owner constraints, composition boundary, falsifier classes, unknown policy, residual tolerance and reopen triggers. The readable goal alone is not the DoD. Each gate also names expected deliverables, exact validation IDs, independent acceptor and recovery.

The validation matrix records planned tests separately from observed results. Required records include source SHA, fixture/protocol identity, command or observation, outcome, evidence kind, recorder and limits. Native runs also bind toolchain/runtime/dependency and artifact digest. Human studies require the approved protocol/consent basis without public patient identifiers.

No acceptance with missing mandatory evidence, failing criteria, unresolved critical data/safety/privacy defects, a self-acceptor or unaccepted prerequisites. A lower-scope guided-only feature can be explicitly chosen, but it must revise the claims/criteria and retain the previous definition. Never mark an untested numerical function safe by hiding the test.

## Endpoints

**E0 — Integrated engineering baseline:** one active branch, recoverable predecessors, reproducible local/hosted dependencies and correctly scoped regression evidence.

**E1 — Useful local patient product:** approved local programme, registration/profile semantics, durable records, clear real demonstrations, low-burden activity, native reminders and accessible controls. No clinician backend required.

**E2 — Qualified measurement capabilities:** only supported variant/method/view results issued; proper repeatability/coverage evidence, explicit unknowns and native journeys. Guided-only content remains useful.

**E3 — Supervised-pilot candidate:** specified content and engineering claims approved, privacy/recovery and appropriate human evaluation arrangements in place. It is not a declaration of successful patient outcomes.

**E4 — Distribution decision:** a separate owner decision about release after applicable pilot, platform, intended-use, privacy/regulatory and support evidence. Not implied by E0-E3.

## Recovery and continuity

Preserve the last exact passing input and counterexample. A storage migration retains recoverable source bytes. Source-version conflicts return to the clinical owner. A native toolchain drift returns to G01. A measurement-method change reopens the affected G08/G09 evidence, not unrelated old events. Private source/dataset access is not repaired by publishing identifying files.

A child investigation must have a bounded question, responsible owner, return gate and assimilation outcome. Do not start a second permanent roadmap or state store for each research idea. Keep one concise current record and immutable evidence references; archive stale orientation text.
