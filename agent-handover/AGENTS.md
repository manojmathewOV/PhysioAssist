# Working in this handover folder

- Read README.md and CURRENT.md first. Repository-wide instructions take precedence over this local guidance.
- Treat reviews as evidence pinned to their recorded application SHA, not as perpetual descriptions of the latest branch.
- Preserve original reviewer artifacts. Add adapted/current tests separately and explain semantic changes.
- Distinguish observed defect, new requirement, source ambiguity, implementation claim and independently verified result.
- Never fill a missing clinical dose, loading permission, phase transition or source-version choice with a generic assumption.
- Keep clinical restrictions even when the camera cannot verify them. Do not turn an approximate estimate into a guaranteed safety boundary.
- Do not publish private originals, patient data, identifying media, credentials, temporary download URLs or local absolute paths.
- Use relative repository paths and durable GitHub commit/PR links. Every referenced evidence artifact must exist or be explicitly marked unavailable.
- Save agent responses under responses/ using the template. Do not overwrite an independent review to mark your own fix verified.
- Do not install archived failing reviewer tests into the normal test suite wholesale. Check the historical assumptions and pinned revision first.
- Report tests actually run, failures, skipped checks and environment limits. Do not use force-exit results as proof of clean runner shutdown.
