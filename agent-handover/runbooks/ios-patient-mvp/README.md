# iPhone patient MVP — execution runbook v5

One roadmap, continuous with G00-G10. Revision 5 records the owner-relayed Claude review and practical lying-shoulder capture requirements within the existing five delivery slices. One complete shoulder journey is next. The wider G00-G10 detail remains available behind the compact pickup. It does not implement the remaining features or approve clinical protocols.

**Start:** [ACTIVE.md](ACTIVE.md) is the compact generated pickup; [STATUS.json](STATUS.json) is its sole current-state source and names the current gate/work item. [RUNBOOK.md](RUNBOOK.md) is the readable progression. [TEST_MATRIX.md](TEST_MATRIX.md) binds every planned acceptance scenario to a stable ID and evidence class. [PROGRESSION.md](PROGRESSION.md) defines movement between states and endpoints.

The manifest is [runbook.json](runbook.json); criteria are [validation-matrix.json](validation-matrix.json). [DECISIONS.md](DECISIONS.md) remains authoritative for unresolved D decisions and links C01-C08. [RESEARCH.md](RESEARCH.md) and [research.json](research.json) retain alternatives, source limits and falsifiers.

## No false authority

A framework receipt can validate declaration shape, not patient utility, clinical accuracy or release readiness. See [current tool inspection](../../evidence/2026-09-28-review-shoulder/run.json) and the historical [CCore reconciliation](evidence/ccore-reconciliation.json) for exact tools/results. No native execution epoch or Research offer is invented. The patient application does not depend on Project Cosmos.

## Regenerate and check

```sh
python3 agent-handover/runbooks/ios-patient-mvp/tools/render_cnp.py
python3 agent-handover/runbooks/ios-patient-mvp/tools/render_cnp.py --check
python3 agent-handover/runbooks/ios-patient-mvp/tools/check_runbook.py
python3 agent-handover/runbooks/ios-patient-mvp/tools/check_matrix.py
```

These are portable structure checks, not application tests. Acceptance requires every applicable criterion, exact-basis evidence, independent review, scoped residual disposition and accepted closure prerequisites. Clinical/human/device evidence cannot be replaced by synthetic cases.

The active work item is **G05.W1 / S2**: one source-aware camera-optional shoulder journey. Read `shoulder_capture` in runbook.json and the generated roadmap for bedside versus foot-end guidance and per-output visibility. S1 code review is owner-relayed; native live, physical accessibility and clinical measurement validation remain open. A prior green CI result does not cover new changes automatically.

Latest scope correction: approximate sleeper IR is a conditional measurement target alongside drift, not prohibited. S2 is implemented as camera-optional interaction, then acknowledged storage, then reopening/progress; these reuse the existing gates and criteria.
