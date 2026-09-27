# Accuracy, patient confidence and future surgeon/physiotherapist integration

Research date: 2026-09-27. Application basis inspected: `6bc4d77f9ee9bbe95ef181d50fbaf94cf2388f84`, specifically `src/services/movement/analysis.ts`. Research only: no application edits, new Mac checkout/dependencies, clinical approvals or accepted MVP gates. Claude's final handover now records the implementation branch as frozen; this addendum does not change ownership or the integration/CI status.

## Scope and decisions

Retain the **iPhone patient-only, local-first MVP** and its existing runbook. Future integration means **surgeons and physiotherapists**, not a new clinician backend in the MVP. Prioritise defensible observations, appropriate exercise with low burden, and records a treating clinician can interpret later.

1. Standardise the observation protocol before assuming a better pose model solves accuracy.
2. Investigate the reported endpoint and selection bias, not just framewise landmark accuracy.
3. Build confidence and autonomy, not streaks, extra movement or permanent app dependence.
4. Keep clinical/content, local-data and future-integration scalability separate.
5. Create a patient-owned appointment summary and small structured records before remote accounts.

## Evidence synthesis

- **Shoulder:** van den Hoorn et al. studied 17 people without shoulder problems. The Apple-Vision-based mymobility method correlated strongly with 3D motion capture but overestimated higher ROM by 2–25 degrees, with anatomical-frame and thoracic contributions. This does not validate PhysioAssist or establish interchangeable values. [S1]
- **Knee:** Langley et al. evaluated a different single-camera system in 15 people with knee OA, reporting favourable validity and **within-session** repeatability. Do not infer between-day home setup or postoperative ACL/MPFL/TKA validation. The retrieved abstract, not unavailable publisher full text, supports this summary. [S2]
- **Engagement:** a 110-person knee-OA/obesity trial improved self-reported adherence with behaviour-informed messages without evidence of better secondary clinical outcomes. An 80-person app trial also supplied calls/messages, so it cannot isolate software from support. [S3–S4]
- **Patient experience:** the NHS PhysiApp evaluation identified explanation/access/relevance barriers; some reduced app use reflected confidence exercising unaided or improvement. Low response limits generalisation. Older-adult co-design favoured clear instruction and controllable reminders, with mixed gamification preferences. [S5–S6]
- **Clinical interpretation:** clinician interviews identify accuracy, individualisation, usability and meaningful information as implementation concerns. The 2018 ten-person team study had no surgeon interviewees; the later 16-expert study included surgeons but is not a patient-outcome or camera-validation trial. [S7–S8]

## Measurement design

Define quantity, side, assistance/resting status, posture/support, reference frame, angle convention, permitted view and endpoint rule. Keep the prescribed restriction even when camera verification is unavailable. Do not confuse active deficit, passive/resting measurement and extension lag, or general arm elevation and isolated glenohumeral movement.

Bind validity to the **actual repetition or held interval contributing the reported value**. Retain timestamp continuity, model/algorithm/aggregation version, relevant view/landmark status and origin of assistance information. MediaPipe visibility means likelihood of visibility, not calibrated clinical-angle accuracy; its live stream can discard input while busy. Use actual timestamps. [S9]

Current code already calculates a median repetition peak and best peak. The accepted repetitive result uses `profile.bestDegrees`. This is a research target, not a newly reproduced defect: compare predeclared typical, best-valid and stable-endpoint estimators on the same independent evidence. Never replace the clinical maximum-ROM concept with the median of an entire changing movement.

Display smoothing must not delay warnings, bridge tracking gaps or leave a stale value appearing current. If tracking switches to a helper, withhold/reconfirm rather than assume identity. Compare Apple-native/current models on identical permission-cleared target variants; do not silently mix estimator versions in a longitudinal series. Apple's initial 3D-pose revision described selection of the most prominent person; version-specific constraints require testing, not assumptions about all later revisions. [S10]

## Cloud experiments actually executed

Run `python3 measurement_experiments.py --test`, then `python3 measurement_experiments.py --output simulation-results.json`. Standard library only. Eight code checks passed. No production modules, RGB videos, patient records or clinical accuracy tests were run by this experiment.

With unchanged true endpoints and independent zero-mean 2-degree-SD noise, 10,000 synthetic trials per condition produced mean optimistic best-endpoint errors of **+1.153 degrees for two observations, +1.694 for three and +3.079 for ten**. These counts are not prescriptions. Median endpoints had approximately zero mean error in this constructed symmetric model; real attempts may differ through pain, fatigue, learning and genuine variability.

A simple orthographic 60-degree segment projected to 50.8 degrees after 45-degree plane rotation. This is illustrative geometry, not a universal correction formula. Correlated-frame experiments reduced the precision benefit of more frames; a session-specific setup offset with 3-degree SD left about 3-degree RMSE after median aggregation over 300 frames. Therefore a smooth trace or many frames cannot prove cross-day repeatability.

## Patient experience

Use a confidence loop: understand purpose, see the exact variant, perform the approved amount, receive an intelligible acknowledgement and know the next step. Personal functional goals are context, not permission to perform restricted tasks. Avoid streak loss, catch-up dose, maximum-angle rewards and equating app opens with adherence.

Adapt explanation and reminder presentation, **not clinical permission**. First use may need fuller teaching; familiar use can be brief with immediate replay. Provide meaningful audio for lying-down or one-handed users, captions and visible Pause/Stop. A camera-free treatment session is not a simulated-body practice session.

Preserve helpful stick/helper/chair/brace context in the focus picture. Prioritise approved replayable demonstrations over synchronised ghost overlays that could disguise speed or hold differences. Test real native tasks with larger text, VoiceOver/Voice Control, contrast and reduced motion; screenshot appearance alone does not establish accessibility. [S11]

## Scalable local design and later integration

Clinical scalability comes from approved source-to-variant mappings, amendments and separate session groups. Device scalability comes from transactional local records, bounded live buffers, queried history and a separate media cache. Do not retain every video/frame or create many services. Do not show success before the record is durably saved.

Retain stable profile/episode/prescription/occurrence/observation identifiers; clinical effective time separately from recording/sync time; side, method, units, source revision, value or absence reason; and whether information is patient-reported, clinician-entered or algorithm-derived. Dose changes do not necessarily split an otherwise compatible measurement series. A change in what/how we measure can.

The immediate bridge is a **patient-owned appointment view**, not remote monitoring: programme and restrictions, activity, compatible measurements, symptoms, unavailable checks and patient questions. It works without clinician login.

Prepare a future translator, not a FHIR server in the phone. The current published AU Core 2.0.0 guide is based on FHIR R4; it is a starting point, not a complete rehabilitation profile. Candidate mappings: CarePlan/Goal for the plan, Observation for qualified ROM, QuestionnaireResponse for answers, Provenance for derivation, and an agreed document representation for the appointment summary. Do not encode an unavailable value as zero or interpret FHIR `final` as clinical certainty. Terminology, local extensions, instrument licensing and receiver capability need explicit validation. [S12–S15]

SMART supplies OAuth/launch patterns, not professional verification, blanket patient access or universal write-back. Future episode-specific permissions should separate viewing, adjusting dose, changing protective restrictions and acknowledging concerns. Conservative care can be physio-led; not every episode needs a surgeon. Consent and accepted care relationships are prerequisites to later sharing, never silently inferred from local history. [S16]

## Research acceptance work and existing gates

| Requirement                                  | Existing gates | Next evidence                                                           |
| -------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| PRD-R01 Qualified observation/endpoint       | G04–G05        | Contributing-interval provenance and predeclared aggregation comparison |
| PRD-R02 Repeatable Check separate from Do    | G05, G09–G10   | Same-setup, repositioning and between-day assessment studies            |
| PRD-R03 Accessible confidence-first teaching | G05, G07, G09  | Approved-video/audio tasks; novice/familiar/older-user observation      |
| PRD-R04 Resilient resource-efficient history | G02, G08       | Save failure, migration, low storage, bounded memory/cache tests        |
| PRD-R05 Portable clinical semantics          | G02–G04        | Patient summary comprehension and loss-aware translation tests          |
| PRD-R06 Source and stage authority           | G04, G10       | Reviewed source/amendment rules; no inferred clinical milestone         |

For measurement studies report bias, error distribution/limits of agreement, coverage, false warnings and cross-day repeatability with participant-level uncertainty. Freeze methods before untouched validation. For usability measure comprehension, phone touches, setup/repositioning burden and interruption recovery, not only satisfaction. For future integration ask surgeons and physiotherapists to interpret synthetic records independently, then test whether translation loses any clinical distinction. Pilot feasibility does not establish outcome superiority or patient safety.

## Sources

S1 https://pubmed.ncbi.nlm.nih.gov/40787239/
S2 https://pubmed.ncbi.nlm.nih.gov/41275724/
S3 https://pubmed.ncbi.nlm.nih.gov/32985994/
S4 https://pubmed.ncbi.nlm.nih.gov/28662834/
S5 https://pmc.ncbi.nlm.nih.gov/articles/PMC11458024/
S6 https://aging.jmir.org/2026/1/e87332
S7 https://doi.org/10.1136/bmjopen-2018-026326
S8 https://doi.org/10.3390/jcm15083009
S9 https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/ios
S10 https://developer.apple.com/videos/play/wwdc2023/111241/
S11 https://developer.apple.com/videos/play/wwdc2025/224/
S12 https://hl7.org.au/fhir/core/
S13 https://hl7.org/fhir/R4/observation.html
S14 https://hl7.org/fhir/R4/careplan.html
S15 https://hl7.org/fhir/R4/provenance.html
S16 https://hl7.org/fhir/smart-app-launch/

Publication: documentation through the GitHub contents API; no local Git hooks or application tests implied. Existing reviews, CURRENT and runbook status remain unchanged.
