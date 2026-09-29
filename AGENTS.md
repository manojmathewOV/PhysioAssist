# PhysioAssist engineering pickup

Read `.agents/skills/physioassist-hybrid/SKILL.md` for the optional Mac/RDC/GitHub workflow. The patient app has no dependency on that tooling or Project Cosmos.

The owner-selected MVP is iPhone-first, patient-only and local-first. Clinician portals, monitored messaging and clinical cloud synchronisation are deferred. Preserve clinical restrictions, source ambiguity, measurement validity and historical evidence; do not invent clinical values.

Before changes, identify the exact application SHA, current PR/branch and task owner. Read the current `agent-handover/` on its review branch if not merged here. Do not infer the latest state from an old transcript or test archive. One writer owns each edit surface.

On the authorised Mac, use the configured permanent landing root containing `repo/` and `RDC/`; never embed its absolute home path in committed files. Reuse dependencies/caches. No extra full clones, blanket cleanup, forced Git operations, global upgrades or persistent background agents by default.

Changes require appropriate tests and ordinary commit/push hooks. Test logs must distinguish clean shutdown from forced-worker termination. Native simulator screenshots must actually be inspected; neither synthetic success nor an attractive screen establishes clinical accuracy or patient usability.

## Single-writer handoff

On RDC, consult the existing local writer/publication receipt before changing source, the Git index or branch heads. A generic label such as receiving_agent, an idle terminal, or a later chat is not an ownership transfer. Record the unique task/session owner, branch and expected base; transfer only on an explicit owner instruction or a recorded release. Shared-checkout concurrent editing is prohibited even on similarly named tasks. Separate worktrees are for explicitly partitioned work; never share mutable dependencies while installing/building different locks.

Publish a tested committed increment before advancing to a separate task. Reference exact SHAs in reviews; preserve earlier observations when later code differs. This is a workflow rule, not an OS lock; the existing guarded runner provides the managed-job lock.
