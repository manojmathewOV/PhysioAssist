# Evidence availability and future uploads

Included now: original reviewer test sources and their cryptographic manifest, plus SHA-bound historical summaries in reviews/ and CURRENT.md.

Not included: full private clinical originals, local source extracts, historical raw browser dumps, identifiable video frames, and private-source policy-model payloads. The handover deliberately does not depend on those unavailable files for basic engineering pickup. It is not a complete migration of all earlier audit archives.

For a new run, create `<date>-<application-sha>/` with public-safe `run.json`, a short log and any approved screenshots. Include application SHA, command, runtime/tool versions, input provenance, exit code, assertions/counts, evidence layer and exclusions. Distinguish observation from inference and author-reported results from independent retests.

Use durable repository paths or authorized artifact references with hashes. Local computer paths, temporary signed download links and chat-only attachments are not cloud-agent handover locations. Do not fill in an artifact link until the artifact exists.
