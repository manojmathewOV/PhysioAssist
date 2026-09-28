# Current PhysioAssist implementation

Updated2026-09-28. Owner-selected scope: **iPhone-first, patient-only, local-first**. No clinician portal, monitoring, clinical cloud synchronisation or automatic progression. Read this current record, then the generated [ACTIVE.md](runbooks/ios-patient-mvp/ACTIVE.md); historical narratives remain pinned to their original revisions.

## Latest bounded implementation

**Tested candidate `a8da5f5b630475144dfc12af1afd5cbc6a9d8516`: guided shoulder activity, acknowledged local saving, reopening/history and quantitative observation enablers.** See [response](responses/2026-09-28-guided-implementation.md) and [source-bound results](evidence/2026-09-28-guided-implementation/run.json).

The exact lying variants now have a camera-free route with explicit programme dose and confirmation, start/pause/watch/finish, self-reported completion or early stop, acknowledged save/retry and preserved episode/side/occurrence identity. No fake pose, measured angle, inferred repetitions or clinical authority is fabricated. The held-interval observation provider is opt-in; numerical detail survives into records, but no sleeper detector is activated.

Evidence: 1,707 passing tests/four opt-in skipped, clean final source and shutdown; 18 actual web checks; actual Release native guided and reference/restart journeys with inspected screenshots. Ten acquired MobiPhysio inspection clips plus mirror/blank controls produced12 runs/4,742 samples. These establish pipeline operation and observed limitations, not clinical accuracy, older-user comprehension or the whole runbook.

Native video now runs inside real camera-free treatment without enabling production simulation. This resolves that specific test-route blocker; real-camera/native focus, physical-device and approved clinical-video validation remain separate. Raw videos and third-party screenshots stay outside Git; only synthetic UI captures and numeric metadata are published.

## Ownership and branches

- Main remains the development baseline merged through PR28 at `aebfa1b7832a9de314c19d69d494339f82eea5bf`; it is not patient/release approval.
- PR29 on `agent/native-camera-recovery-20260928` is the single receiving implementation branch. New source is submitted for independent review, not merged by this pickup.
- The S2 writer resumed the same interrupted task and preserved all inherited commits/failed probes. Consult the local unique writer receipt before any shared-checkout edit; no concurrent writer or force/reset operation.
- Claude remains independent reviewer. His owner-relayed S1/accessibility acceptances retain their exact earlier scope; they do not approve this new code. [Original handover](responses/2026-09-27-6bc4d77-claude-final-handover.md), [review](reviews/2026-09-28-owner-relayed-claude/REVIEW.md).

## Next code and review

Review this activity/save/observation delta and current hosted checks. The next bounded code should implement the patient result selector/schematic and compatible saved-history presentation using synthetic fixtures, without activating an unqualified sleeper result. Continue the existing gate requirements instead of creating another roadmap.

Remaining: full transaction/migration/backup/long-history storage, true registration policy, approved assets and remaining clinical programme decisions, selected knee/postoperative delivery, actual sleeper IR/caudal estimator and tolerance study, physical VoiceOver/resources, older-user comprehension and pilot/release requirements. Guided Do is useful without a numerical Check; a local configuration flag is not authenticated surgeon/physio approval.

Your selected sleeper intent remains: shoulder-level upper arm near90degrees, caudal drift with leeway, same-interval approximate IR and elbow observation, and a patient-visible schematic/current/previous/compatible episode-best without target chasing. The clinical band is unset. Details live in [runbook](runbooks/ios-patient-mvp/RUNBOOK.md), [decisions](runbooks/ios-patient-mvp/DECISIONS.md) and the existing sleeper research; no new blanket no-number rule.

The retired Pod-installation and P08 issues should not be re-investigated without new contradictory evidence. The independent storage-read review/formal safety record remain open. Software tests, RGB replay, native screenshots and patient/clinical studies are distinct evidence classes. Four opt-in suites are not silently called passed.
