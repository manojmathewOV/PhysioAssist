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

## Runbook-only follow-up: no-entry phone architecture (2026-09-29)

Manoj requested ATAM, Six Hats, counterfactual review and further source checks for using phone capabilities without asking patients to enter stick length. Runbook revision 14 adds this to the existing `shoulder_capture.phone_assistance`; the detailed assessment lives in the existing `research.json` under `phone_architecture`. It does not create a second roadmap or accept any application gate. The application remains at the preceding tested code.

Ten elements were assessed individually: unknown equipment scale, coordinates/timestamps, OS motion/setup, optional depth, unmarked stick association, pose provider, capture-library integration, buffers/recovery, evaluation/history provenance and patient feedback. Each has an ATAM scenario with stimulus/source/environment/artifact/response/measure, sensitivity and trade-off; six explicit thinking perspectives; and two counterfactual interventions with held-fixed assumptions, expected responses and falsifiers. The utility tree prioritises truthful results and patient effort over optional information gain. This is a structured desk assessment, not a stakeholder-voted ATAM workshop or independent clinical review.

The key decisions are:

- No stick-length field, assumed fixed anatomy, mandatory markers, room scan, calibration exercise or sensor-selection menu. Stick size can remain unknown where scale-independent geometry is sufficient; no claim that two endpoints uniquely recover depth.
- One capture owner and one active production pose engine. Use actual active-format capabilities, explicit source clocks/transforms and bounded native buffers. Optional usable depth/motion/stick can enrich the same observation; absence or failure cannot stop permitted guided Do.
- Camera calibration is not clinical zero. Gravity alone does not establish unchanged phone translation or a bed plane. Depth describes surfaces, not automatically anatomical joint centres. More agreeing correlated estimates do not prove accuracy.
- Upstream now describes VisionCamera V4 as no longer actively maintained. Our locked version is 4.7.2, with RN0.73.2/MediaPipe0.6.0. Prioritise a bounded maintained-stack compatibility decision before a long-lived custom depth extension; V5's Nitro/worklet/depth documentation is not current-app integration evidence. No dependency was upgraded.
- Keep evaluation adapter, acknowledged isolated storage and reopening as the next implementation. Then establish capabilities/geometry/time, decide the capture route, and compare RGB versus added motion/calibration/depth/unmarked-stick information on matched reference-linked sequences. Patient methods stay unactivated.
- Judge both issued-result error and availability/false acceptance, repeat self-setup, physical latency/energy and patient effort. Existing RGB videos cannot validate depth or IMU streams they lack. Required clinical allowances, repeatability and display precision remain unresolved rather than defaulted.

Primary sources checked include SEI's ATAM method, de Bono's Six Hats, Apple camera calibration/depth/Core Motion/Vision documentation, VisionCamera V5 and maintenance documentation, and Google's MediaPipe iOS live-stream behaviour. Their supported facts and limits are embedded alongside the analysis; patient-feeling statements are explicitly hypotheses, not study results.

Verification: same 11 gates/83 criterion IDs and unchanged clinical settings/acceptance states; seven existing criteria sharpened. Portable structure, delivery and matrix checks passed. Seven additional in-memory consistency mutations were detected, but the 20 device counterfactuals are still planned oracles, not executed tests. CCore definition inspection found zero structure errors and zero blocked DoD dimensions; native topology/owner binding and execution acceptance remain absent. Amalgamate's JSON coverage was unavailable/partial, so no completeness claim was inferred.

An optional new Markdown-rendering helper was refused twice and remains absent. The existing generator was not changed or bypassed; the assessment stays in the existing JSON research record, linked by the active pickup. No new app suite, camera run, benchmark download, native build, dependency installation or patient study was performed. See `../runbooks/ios-patient-mvp/evidence/phone-architecture-20260929.json` for the bounded record.
