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
