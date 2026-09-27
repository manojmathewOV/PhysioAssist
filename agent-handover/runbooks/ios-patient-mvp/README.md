# iPhone patient MVP — execution runbook v2

One roadmap, continuous with G00-G10. This revision reconciles the frozen Claude handover, hybrid skill, patient-experience research and accuracy/integration research. It does not implement the remaining features or approve clinical protocols.

**Start:** [STATUS.json](STATUS.json) names the current gate and work item. [RUNBOOK.md](RUNBOOK.md) is the readable progression. [TEST_MATRIX.md](TEST_MATRIX.md) binds every planned acceptance scenario to a stable ID and evidence class. [PROGRESSION.md](PROGRESSION.md) defines movement between states and endpoints.

The manifest is [runbook.json](runbook.json); criteria are [validation-matrix.json](validation-matrix.json). [DECISIONS.md](DECISIONS.md) remains authoritative for unresolved D decisions and links C01-C08. [RESEARCH.md](RESEARCH.md) and [research.json](research.json) retain alternatives, source limits and falsifiers.

## No false authority

A framework receipt can validate declaration shape, not patient utility, clinical accuracy or release readiness. See [CCore reconciliation](evidence/ccore-reconciliation.json) for exact tools/results. No native execution epoch or Research offer is invented. The patient application does not depend on Project Cosmos.

## Regenerate and check

```sh
python3 agent-handover/runbooks/ios-patient-mvp/tools/render_cnp.py
python3 agent-handover/runbooks/ios-patient-mvp/tools/render_cnp.py --check
python3 agent-handover/runbooks/ios-patient-mvp/tools/check_runbook.py
```

These are portable structure checks, not application tests. Acceptance requires every applicable criterion, exact-basis evidence, independent review, scoped residual disposition and accepted closure prerequisites. Clinical/human/device evidence cannot be replaced by synthetic cases.

The current blocking engineering item is native dependency portability (G01/I01), not the independently closed P08 teardown case. Storage read-error containment (G02/I02) follows; Do/Learn/Check, approved variants/media, reminders, accessibility and qualified measurements follow their dependencies.
