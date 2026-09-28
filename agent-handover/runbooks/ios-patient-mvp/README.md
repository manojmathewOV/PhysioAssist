# iPhone patient MVP — execution runbook v11

One roadmap, continuous with G00-G10. Revision 11 narrows the sleeper requirement to the owner-confirmed shoulder-level/90-degree variant with caudal leeway, and retains the owner-relayed Claude review and practical lying-shoulder capture requirements within the existing five delivery slices. One complete shoulder journey is next. The wider G00-G10 detail remains available behind the compact pickup. It does not implement the remaining features or approve clinical protocols.

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

Quantitative sleeper refinement: [paired angle/elbow computation study](../../research/2026-09-28-sleeper-elbow-drift/README.md). Twenty synthetic geometry tests and a scoped production aggregation probe, not live measurement validation. The active S2a interaction task is unchanged.

Patient-result decision is selected: see the generated RUNBOOK section **Patient result** for approximate rotation, same-interval schematic, previous compatible Check and scoped best. It is passive information, not a treatment target. S2a code remains the next task; this is a narrow upgrade to existing criteria, not a new study or roadmap.

Patient presentation now has a comprehension-led contract within `patient_feedback.comprehension`: direct spatial labels, context-specific feedback, familiar navigation/alignment/current-value patterns, and tests of correct understanding rather than visual preference. It changes no clinical threshold or activation.

Implementation update: [guided activity, acknowledged storage and real-video replay](../../responses/2026-09-28-guided-implementation.md). The current candidate implements the first S2a/S2b/S2c path; it does not accept entire gates or activate sleeper measurements. Read current STATUS/ACTIVE rather than treating historical next-action prose as a fresh task.

Latest UX candidate e768304 adds Ready, prescribed-hold voice/timing and instruction-first recovery; actual web/full-suite evidence is in the guided-ux-review response. New native verification passed after AC was connected; its actual ready/hold/reference/restart screenshots and earlier failures are recorded separately. Physical listening and patient validation remain open.
