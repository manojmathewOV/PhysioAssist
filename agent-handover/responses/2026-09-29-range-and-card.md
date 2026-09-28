# Range and directly labelled result — receiving-agent increment

Basis: `0995723419a5f8e6b650cd2c035e5d375e3d6d29`. Manoj supplied Claude's review of that revision and authorised the runbook update and implementation. This is a receiving-agent response, not a reviewer-authored GitHub approval. No main merge or clinical activation.

## Reproduced and implemented

The new guided range tests first produced eight failures and three passing controls. The hook now supplies both prescribed bounds; a 2–3 timed prescription permits the optional third hold. Finish is primary after the minimum, further timing ends at the maximum, and completion still requires the patient's report. Invalid explicitly supplied upper bounds do not silently fall back to the minimum. Existing exact-count calls remain exact; the displayed amount is not parsed as a prescription. Pauses, programme-change stops, due-occurrence checks and save acknowledgement remain intact.

Three new card tests initially failed. The result now has directly visible Reference position and This reading labels, an explicitly illustrative side-lying/bed cue, anatomical-side presentation mirroring, patient-facing forearm-turn wording and the same full date formatter as detailed activity history. The reference is NOT labelled Start: it is not necessarily the observed starting position. The bed cue does not prove measured elbow contact, bed-plane geometry or scapular fixation. The same selector supplies the angle and elbow status; no new numerical method or patient registry entry exists.

The prior mechanics/selector review and all historical evidence retain their scope. The normal patient entry still does not import the synthetic result preview. The evaluation adapter, isolated persistence and live capture qualification are next increments, not features implemented by this patch.

## Runbook direction

Existing G05/G07/G08/G09 criteria were refined, not multiplied into new gates. The order is: range/card completion; a narrow receipt-aware evaluation adapter and isolated storage/reopen; reference-linked capture and physical use; targeted setup/model/timestamp/device qualification; independent numerical activation. The adapter cannot register a method from incoming data, calculate another endpoint or treat a supplied saved flag as a storage receipt.

Origin (synthetic/replay/live study), evaluation purpose and validity/disposition remain distinct. Approximate is not the opposite of accepted. Unvalidated measurement stays in consented evaluation builds, not hidden patient sessions. Model switches and stale/missing observations require explicit interval handling. Gravity alone is not unchanged-placement evidence. No new governor, second model, clinician portal, dose, tolerance or study sample-size claim was introduced.

## Evidence status

Candidate-focused tests and both TypeScript configurations passed. The real web preview was exercised and its left/right/default/large-text screenshots inspected. At 320 pixels the two diagram states currently stack and require scrolling; actual patient comprehension and native Dynamic Type remain open. A further compact-layout/README edit was refused by the tool safety-status check and did not execute; it was not routed through another tool. The prior native result-driver restriction also remains separate from the existing guided-activity native route.

Final committed regression, actual guided browser/native results and publication receipts are recorded below when completed. Current evidence is not clinical accuracy, physical audibility, patient usability or whole-runbook acceptance. The existing standing-video benchmark is unchanged and is not rerun or re-labelled as validation of this UI/range-only patch.

## Final executed verification

Tested committed application and native driver: `2d5455c688cb8da34db367f3757dd6291149e746`. The managed full suite passed with exit0, clean source and no force-exit/teardown warning; its command/log hash is in `run.json`. Ninety-six focused cases passed across five suites, including the 16 added review cases. Both TypeScript configurations and targeted lint passed (zero errors/warnings).

The actual production-web guided journey passed through preparation, two timed holds, normal Finish plus optional third, no fourth, manual report, saved record and reopening. Existing failure/retry and real official-player checks also passed. The separate synthetic result preview passed at320/390/820px, including direct labels and side presentation. The default/small/large-text and left/right images were inspected. This is rendering/interaction evidence, not proof of older-user comprehension.

Frozen Pods verification and the Release build passed using the existing dependency/cache tree. The existing native guided XCTest passed in173.48seconds. It explicitly saw the optional third action after two timers, then its absence after three, and continued through saved status and reopening. The minimum, maximum, saved and reopened captures were opened and inspected. The native fixture supplied six-second holds; active-time displays were13seconds after two and19seconds after three, not an invented multiplication of repetitions and dose. These are actual elapsed-timer observations, not a precision claim about physical holding.

No native result-card test, physical VoiceOver/audio assessment, live sleeper estimator, method registration or study was performed. The earlier native result-card restriction is retained. Source RGB benchmarks are unchanged and were not repeated for labels or dose propagation. Prior successful CI belongs to0995723; this new application has its own pending publication/CI/review status.

The installed CCore Runbook definition inspection returned zero structure errors and zero blocked DoD dimensions across11 members/121 dimensions, with `DefinitionTopologyReadmissionRequired` and no epoch or acceptance authority. Portable criteria/archive checks passed; all gate-acceptance states remain unchanged. See `../evidence/2026-09-29-range-and-card/` for the bounded receipt and synthetic UI captures.
