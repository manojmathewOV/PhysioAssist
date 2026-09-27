# PhysioAssist engineering pickup

Read `.agents/skills/physioassist-hybrid/SKILL.md` for the optional Mac/RDC/GitHub workflow. The patient app has no dependency on that tooling or Project Cosmos.

The owner-selected MVP is iPhone-first, patient-only and local-first. Clinician portals, monitored messaging and clinical cloud synchronisation are deferred. Preserve clinical restrictions, source ambiguity, measurement validity and historical evidence; do not invent clinical values.

Before changes, identify the exact application SHA, current PR/branch and task owner. Read the current `agent-handover/` on its review branch if not merged here. Do not infer the latest state from an old transcript or test archive. One writer owns each edit surface.

On the authorised Mac, use the configured permanent landing root containing `repo/` and `RDC/`; never embed its absolute home path in committed files. Reuse dependencies/caches. No extra full clones, blanket cleanup, forced Git operations, global upgrades or persistent background agents by default.

Changes require appropriate tests and ordinary commit/push hooks. Test logs must distinguish clean shutdown from forced-worker termination. Native simulator screenshots must actually be inspected; neither synthetic success nor an attractive screen establishes clinical accuracy or patient usability.
