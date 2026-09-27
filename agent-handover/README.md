# PhysioAssist: start here

## Purpose

This is the shared handover and review point for Claude, independent reviewers and the project owner. All engineering material referenced below is in GitHub. A local computer path, chat attachment or temporary download URL is not a usable dependency for a cloud agent.

Initial handover: 2026-09-27. Application evidence is pinned to `c7ac7f3bdda47ab736553b25bdca6f4100a8f74b`, the then-current head of PR #25. This handover adds documentation and archived reviewer tests only. It does not merge PR #25, change application code, approve a clinical protocol or establish clinical readiness.

## Read in this order

1. [CURRENT.md](CURRENT.md): what is implemented, what remains, and the exact evidence baseline.
2. [Latest review](reviews/2026-09-27-c7ac7f3/REVIEW.md) and [finding register](reviews/2026-09-27-c7ac7f3/findings.json).
3. [Implementation priorities](design/NEXT_IMPLEMENTATION.md) and [clinical approval questions](protocols/APPROVALS.md).
4. [Reviewer test instructions](tests/README.md). Original test files are available, not merely descriptions to reproduce from memory.
5. [WORKFLOW.md](WORKFLOW.md): how to write back with evidence.

## What is here

| Location | Use |
|---|---|
| `CURRENT.md`, `backlog.json` | Compact orientation and stable task IDs |
| `reviews/` | SHA-bound independent findings and historical disposition |
| `tests/original-reviewer-tests.zip` | Four original reviewer test sources, preserved byte-for-byte |
| `tools/extract-reviewer-tests.py` | Verify the archive and extract tests outside normal application discovery |
| `protocols/` | Source-family index, missing approvals and the owner's new frozen-shoulder intent as an inactive draft |
| `design/` | Engineering requirements derived from the reviews, not an approved treatment protocol |
| `responses/` | Agent responses to findings, with implementation SHAs and test evidence |
| `templates/` | Reusable review and response templates |
| `evidence/` | Historical scope and guidance for portable future evidence |

## First action for the implementation agent

Record the current application SHA. Compare it with the reviewed SHA before accepting any finding as still current. Address P01 (completion replay) and P02 (interval scheduling requirement), and resolve clinical decisions through the owner rather than inventing missing doses or permissions. Preserve the fixes already made; several old tests encode superseded assumptions.

Use [templates/AGENT_RESPONSE.md](templates/AGENT_RESPONSE.md) to add a response under `responses/`. A response should explain each finding's disposition, implementation commit, actual command/result and remaining limitations. A green unit test is not evidence of real-patient usability or clinical measurement accuracy.

## Public repository boundary

This is a curated engineering handover, not a verbatim publication of every earlier report. Full private protocol originals, local source extracts, clinic contact details, private Dropbox links, raw conversation dumps and identifiable media have not been uploaded. The source index says what is unavailable. Do not claim to have read a private original from its filename or this summary. Source-dependent clinical activation remains blocked until the approved content is supplied through an appropriately authorized channel.
