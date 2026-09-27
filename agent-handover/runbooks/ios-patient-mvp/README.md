# iPhone patient-only MVP — start here

**Scope:** one useful patient app, local-first records, registration/onboarding, approved instructions, activity and qualified progress. **Not in MVP:** clinician portals/linkage, monitored messaging, clinical cloud sync or Android release.

The owner explicitly requested use of Project Cosmos CCore Research/Runbook tools to help author this roadmap. See [tool provenance](evidence/CCORE_TOOLING.md) and [executed results](evidence/TOOL_EXECUTION.json). Native authoring/Research ingestion did not complete; definition inspection returned a typed refusal. This is a portable plan, not a native CCore-admitted execution epoch.

## Pickup in one minute

Application basis: `414b81b170a6205b9fcb3aca20f3cab89bb850a1`. Handover basis: `9aea33a895fa9f529771bc697d3f54f8663ab21a`. These are observations, not permanent latest-head pointers. Re-read PR #25 and #26 before acting.

1. Read [scope and decisions](DECISIONS.md), then [RUNBOOK.md](RUNBOOK.md).
2. Read [STATUS.json](STATUS.json): G00 is the first gate; no implementation gate is accepted here.
3. Consult only the active gate, its dependencies and required evidence. Detailed definitions live in [runbook.json](runbook.json); [ROADMAP.cnp](ROADMAP.cnp) is its deterministic CNP projection, not a second status store.
4. Add an implementation response in `../../responses/` and evidence under `../../evidence/`, with exact SHA, commands, results, omissions and independent review. Do not overwrite old findings.

[Research and blind spots](RESEARCH.md) · [Research sources](research.json) · [Acceptance matrix](TEST_MATRIX.md) · [CCore tool evidence](evidence/CCORE_TOOLING.md)

## Stable working rule

Keep intent, outcome, evidence and acceptance separate. A created runbook, successful source inspection, green build or synthetic test does not establish clinical safety, accuracy, usability or release readiness. Clinical values stay with the approved source/owner.

The patient app has **no Project Cosmos dependency**. Reading or executing the GitHub plan requires no access to the owner's Mac. CCore-native candidates/receipts, where present, are tooling evidence only; they cannot advance STATUS.json automatically.

## Structural checks (not acceptance)

```sh
python3 agent-handover/runbooks/ios-patient-mvp/tools/render_cnp.py --check
python3 agent-handover/runbooks/ios-patient-mvp/tools/check_runbook.py
```

This checks IDs, references, dependencies, required DoD fields and state consistency; it does not run the application or certify a gate.
