# iPhone patient MVP — execution runbook v3

One roadmap, continuous with G00-G10. Revision 3 converges the existing criteria into five delivery slices, prioritising dependable reference playback and one complete shoulder journey. The wider G00-G10 detail remains available behind the compact pickup. It does not implement the remaining features or approve clinical protocols.

**Start:** [ACTIVE.md](ACTIVE.md) is the compact generated pickup; [STATUS.json](STATUS.json) is its sole current-state source and names the current gate/work item. [RUNBOOK.md](RUNBOOK.md) is the readable progression. [TEST_MATRIX.md](TEST_MATRIX.md) binds every planned acceptance scenario to a stable ID and evidence class. [PROGRESSION.md](PROGRESSION.md) defines movement between states and endpoints.

The manifest is [runbook.json](runbook.json); criteria are [validation-matrix.json](validation-matrix.json). [DECISIONS.md](DECISIONS.md) remains authoritative for unresolved D decisions and links C01-C08. [RESEARCH.md](RESEARCH.md) and [research.json](research.json) retain alternatives, source limits and falsifiers.

## No false authority

A framework receipt can validate declaration shape, not patient utility, clinical accuracy or release readiness. See [current tool inspection](evidence/convergence-20260927.json) and the historical [CCore reconciliation](evidence/ccore-reconciliation.json) for exact tools/results. No native execution epoch or Research offer is invented. The patient application does not depend on Project Cosmos.

## Regenerate and check

```sh
python3 agent-handover/runbooks/ios-patient-mvp/tools/render_cnp.py
python3 agent-handover/runbooks/ios-patient-mvp/tools/render_cnp.py --check
python3 agent-handover/runbooks/ios-patient-mvp/tools/check_runbook.py
python3 agent-handover/runbooks/ios-patient-mvp/tools/check_matrix.py
```

These are portable structure checks, not application tests. Acceptance requires every applicable criterion, exact-basis evidence, independent review, scoped residual disposition and accepted closure prerequisites. Clinical/human/device evidence cannot be replaced by synthetic cases.

The active work item is **G07.W1 / S1**: remove disconnected downloader/unused capabilities after a usage audit and repair the reference-control defects. Latest 74fe884 hosted Checks and iOS are green; c3d4b7b safety and dd7f504 storage review remain distinct. Do not re-investigate the retired Pod failure or rewrite P08 without new contrary evidence.
