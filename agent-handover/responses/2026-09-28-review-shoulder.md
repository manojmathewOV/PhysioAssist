# Reviewer follow-ups and lying-shoulder runbook convergence

Implementation: `a11b117` followed by `4c8b20d`. Source at `4c8b20d14cf923d1501e54f2700376f9fcb9870d` is the final tested application revision. Documentation-only evidence/state publication follows. No new main merge, clinical activation or gate acceptance.

## Review recorded with its actual authority

[Owner-relayed Claude review](../reviews/2026-09-28-owner-relayed-claude/REVIEW.md) records S1 acceptance with nonblocking follow-ups and corroboration of prior PR29 code. It is not a new GitHub APPROVE submitted by Claude. The storage-read protection remains without independent review. Safety acceptance is reviewer-reported and awaits its formal reviewer-authored record; this writer does not impersonate it.

## Implemented

- Compact count/hold text retains accessible progress role, label and meaningful value. An unknown target is represented by the count alone; holds remain time, not repetitions.
- Android/web live updates are distinct from the iOS screen-reader API. iOS has an explicit count-announcement route when VoiceOver is enabled and app speech is disabled. The persisted app-speech flag is applied on entry so the two count channels use the same setting.
- No new count is requested while paused, framing, out of view, withheld or over limit. Blocked increments are consumed, not replayed later. No added timers, per-second hold narration or stale count queue. Listener lifetime and late reader-state answers have tests.
- Android's missing native identity bridge is documented in VideoTransport; no fabricated identity or Android implementation was added.
- A real-browser run caught that the native accessibilityValue object was not mapped to DOM aria-valuetext. The shared explicit value fixed it; the same existing portable browser harness now checks role, value and live-region output.

## Runbook4, without another roadmap

The same eleven gates and 83 criterion IDs remain. S2/G05.W1 is the active implementation: source-aware camera-optional shoulder Do, with durable recorded participation. Remaining S1 native-live checks can be reached through that real route rather than enabling fake input in Release. Review is scoped; moving the work focus does not accept S1 or a whole gate.

The `shoulder_capture` source in runbook.json and generated RUNBOOK section retain Manoj's directions: slightly raised bedside elevation/sleeper, foot-end external rotation, affected elbow near the body for ER only, sleeper visible drift rather than a claimed internal-rotation angle, per-output visibility and rebaselining after camera movement. Missing dose, precise sleeper setup and numerical qualification remain open. No detector or instruction package is activated by this metadata.

## Actual evidence

[Run record](../evidence/2026-09-28-review-shoulder/run.json): final clean committed suite **1,661 passed / four opt-in skipped**, natural exit, no forced-worker warning; 33 focused checks including ten new cases; TypeScript and targeted lint passed (two existing inline-style warnings). Real production-web player/semantic assertions: **22 passed**, including failure/retry; small-screen and unavailable-state screenshots were opened. Third-party imagery remains local.

CCore Runbook definition inspection: zero structure errors, zero blocked dimensions, 121 declared dimensions/11 members. `DefinitionTopologyReadmissionRequired`, eleven owner-construction gaps and unbound execution context remain; no epoch or acceptance was created. Portable structural/matrix/delivery checks passed.

No physical VoiceOver hearing test, native live exercise, new Xcode build, clinical reference validation or patient study occurred here. Native API behaviour is tested with contract mocks, not asserted as a complete accessible iPhone journey. Earlier fixture/mock errors are retained and not called production reproductions. The first real browser value failure is also retained separately from its passing rerun. Existing checkout, toolchain and caches were reused; browser/server stopped; no dependency or benchmark download.
