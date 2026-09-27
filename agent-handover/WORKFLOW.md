# Two-way handover workflow

## Pickup

Read README.md, CURRENT.md, the latest review and backlog.json. Record your branch, `git rev-parse HEAD`, assigned task IDs and the intended scope. Inspect any newer commits before reproducing old findings. Do not reset, force-push or overwrite another agent's application branch to match a review baseline.

## Implementation

Work through the normal PR process. For each accepted finding, add a current regression test near the responsible subsystem, then exercise the full patient-facing path where applicable. Keep unchanged historical tests in the archive. When an expectation is superseded, document why and link the replacement; do not silently turn a failure green by weakening it.

## Evidence

Every run needs the application SHA, tool/runtime versions, command, exit status, counts, environment and limitations. Identify whether it exercised a pure rule model, actual production logic, rendered UI, recorded RGB, a real camera, a native simulator or a person. Store small public-safe logs/screenshots under `evidence/<date>-<sha>/`; record large authorized artifacts by durable location plus digest and access scope. Never rely on a computer-only path or expiring link.

## Respond

Add `responses/<date>-<implementation-sha>-<agent>.md` using the response template. For each finding use one of: accepted, reproduced, implemented_pending_review, verified_by_independent_reviewer, rejected_with_evidence, superseded, blocked_clinical_decision, blocked_source_access or not_tested. An implementer can claim implementation and tests; independent verification needs an actual independent review.

Update CURRENT.md and backlog.json with references to the response, preserving the original review. Keep clinical approval separate from software-test success. A source can be awaiting release permission while unrelated scheduler or UX work proceeds.

## Review

The next reviewer adds a new SHA-bound folder under reviews/. Retest changed behavior and a sample of previously fixed invariants. Add findings; do not rewrite prior observations. The application SHA, not this documentation commit alone, identifies the tested product.

## Source transfer

This repository is public. Publishing a clinical original or recognizable video requires an explicit decision about that material's publication and reuse rights. Until then the public handover carries only the necessary engineering summary and source availability. Do not claim private sources are accessible to Claude merely because they exist on the owner's computer or Dropbox.
