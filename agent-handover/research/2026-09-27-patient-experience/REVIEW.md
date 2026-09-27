# Patient experience, elegance and protocol phases

Research date: 2026-09-27. Application source inspected: `414b81b170a6205b9fcb3aca20f3cab89bb850a1` (PR #25). This is targeted research and proposed design, not a new application test run or clinical approval.

## Scope

Keep the **iPhone patient-only, local-first MVP**. The existing runbook at `agent-handover/runbooks/ios-patient-mvp/` remains the execution roadmap. This research informs G04–G09 and accepts no gate. Physiotherapist/surgeon preferences inform programme accuracy and a patient-owned appointment summary; they do not reintroduce clinician portals, messaging, monitored alerts or cloud clinical synchronisation.

Private protocols were read through authorised Dropbox access and actual local originals. The larger ACL and private TKR DOCX files exceeded the Dropbox extractor limit, so the local originals were read. The public TKR PDF was also read separately, not substituted for the private source. Full originals, clinical dose tables, private links and contact details are intentionally excluded from this public document. Source-dependent implementation still requires approved content through an authorised channel.

## Evidence and what it supports

**E01 — NHS PhysiApp service evaluation (2024):** 1,447 responses from 10,287 invitations, with 954 previously supplied the app. In the relevant 517-person perception subset, 82.2% found it easy to use and 77.18% felt videos helped technique. These are perceptions, not measured movement accuracy. Low response/online recruitment limit representativeness. Reduced app use sometimes reflected confidence exercising unaided or improvement, not failure to exercise. Therefore app engagement alone is not adherence.

**E02 — older-adult co-design (2026):** four groups, 18 adults aged 60–83. Clear videos, simpler navigation, credible/relatable content and configurable reminders were desired; gamification/social preferences varied. The generally younger/healthier older sample does not establish usability for frailty or cognitive impairment.

**E03 — observed tablet usability (2019):** 15 adults aged 69–99 found basic exercise tasks easier than tailoring a schedule. Separate initial setup from daily execution; this small laboratory study does not validate our phone app.

**E04 — orthopaedic-team interviews (2018):** ten participants valued meaningful data but raised accuracy and individual-tailoring concerns. The sample included physiotherapists, nursing staff, orthopaedic assistants and an occupational therapist; **no surgeon interviewees**. It is not a surgeon preference survey or outcome study.

**E05 — expert wearable implementation interviews (2026):** 16 experts, including surgeons and researchers, emphasised usability, data quality, clear team roles and actionable feedback over sophistication. Their cumulative practice experience is not a trial of thousands of patients and does not validate camera ROM.

### Product observations, not a popularity ranking

- **PhysiApp:** replayable instructions are valued in a December 2023 review; an October 2025 reviewer requests reminders for selected exercises rather than repeating the entire routine. Borrow dependable demonstrations and explicit session groups.
- **Hinge Health manual:** documents captions and camera-off continuation while retaining recorded progress. Borrow a graceful non-measuring exercise route, not mandatory tracking.
- **Medbridge GO:** a July 2023 review from a person exercising on the floor requests spoken movement names, dose and transitions instead of generic sounds. Borrow meaningful audio. This is a historical complaint, not a claim the issue persists.
- **mymobility:** some reviews value timely preparation; a May 2023 review reports conflict with the treating team's instructions. Borrow timely information while keeping the actual approved patient plan authoritative.

Selected reviews are anecdotes, not representative patient evidence. We did not enrol in authenticated competitor programmes. Do not copy their media, designs or clinical rules.

## Core design conclusion

Answer four questions: **What should I do now? Can you show me? What should I avoid? What has changed for me?**

Beauty should come from hierarchy, readable content and dependable behaviour. Remove decisions already made by the treating team. Do not remove safety or source distinctions just to reduce screen count.

### EX01 — Three destinations, not a catalogue

**Today:** the next due session group and one action. **My recovery:** recorded programme stage, compatible measurements, symptoms/function and activity. **Help:** instructions, practical setup, accessibility, programme source, privacy and concerns. Keep detailed setup away from daily Start. In the MVP a local setup checkbox is not authenticated clinician approval.

First setup may need demonstration and teach-back; a familiar mini-session should not repeat every setup screen. Keep Watch again and Hear instructions available. A patient who has learned the movement may reasonably use the app less.

### EX02 — Phase tracking needs separate meanings

Keep **elapsed time since surgery**, **authorised programme stage**, and **today's session schedule** separate. A date can make review due without authorising the next exercise. Clinical/milestone-gated transitions require the specified evidence and approval. A genuinely time-only transition may be pre-authorised by an approved protocol; never infer it from a week-number heading.

Avoid a percentage-healed ring, an automatic strength-work unlock or "behind schedule" labels. Show the current recorded stage, its purpose and what changes next. An expired/suspended plan must not be continued blindly. Unknown operation date, new operation, associated repair or corrected source revision requires reconciliation.

No clinician portal is necessary: a documented external instruction or authorised local programme package can supply the plan, with its actual origin recorded. A publisher signature proves content authenticity, not healing or patient suitability. Self-entered and verified-publisher information must remain distinct.

### EX03 — Your sources require exact variants

- Standard and large-cuff sources have materially different early movement permissions. Do not choose solely by broad "cuff repair" label.
- The accelerated-repair source has specific selection assumptions; the no-cuff-repair source also has "Accelerated" in its title. A filename fragment is not enough to route a patient.
- Posterior stabilisation restrictions conflict with some movements used in frozen-shoulder mobility. Do not transfer an exercise by visual similarity.
- Anterior stabilisation contains table/narrative and exercise-wording discrepancies. Retain an approval question rather than average values.
- MPFL with TTO distinguishes active knee extension from isometrics and brace-on from brace-off loading. A generic quadriceps/WB flag is inadequate.
- TKR includes changing assistance within an exercise. Its suggestions are not a command to prescribe every listed exercise in every session.
- Reverse fracture/non-fracture and ACL associated-procedure details need the correct source and modifier. Reverse master-version selection remains unresolved.
- The owner's current frozen-shoulder brief is a new draft relative to the old handouts. Do not silently inherit the old hold/rest values or relabel standing estimators as the selected lying assisted movements.

Preserve the source's goals, precautions, suggested exercises, milestones and therapist-only interventions as separate fields. Clinical restrictions remain even if the camera cannot verify them.

### EX04 — Session groups rather than one global interval

A patient can have frequent mobility rounds, strengthening on selected days and a different evening emphasis. Applying one interval to every item would change the treatment. Give each group its own explicit membership, dose and schedule. A repetition range can complete at its lower bound; the upper bound must not become a reward target. Missed windows must not accumulate a catch-up dose.

Grouping by posture may reduce transfers, but only where order changes are clinically permitted. Measure phone handling and bed/chair/standing changes, not just number of buttons.

### EX05 — Learn / Do / Check, one patient journey

**Learn:** the exact approved demonstration, support/assistance, understandable captions and meaningful narration. Watching does not count as exercise. **Do:** prescribed activity; camera optional when measurement is not necessary. Guided timing is not observed repetitions. Manual completion and stopped-early states remain explicit. **Check:** a deliberately standardised observation; unavailable results show a reason and recovery action, never zero or unrelated fallback praise.

A demonstrator's maximum is not the patient's target. Do not make routine treatment into a maximum-ROM competition. Do not claim the camera proves passive effort, healing or absence of pathology.

### EX06 — Preserve context in the focus view

Dimming background and highlighting the working limb can reduce clutter, but a helper's hand, stick, brace or chair may carry clinically important information. Do not erase it. Segmentation is not patient identification or anonymisation. Use an opaque readable cue surface, one relevant cue at a time and a plain-camera fallback. Unsupported readings must not become confident technique statements.

The supplied earlier transcript reports the effect on web, not native iOS. This review does not establish native parity.

### EX07 — Accessible, calm visual system

Proposed targets: system type, approximately 19–22 pt main instructions, 56–64 pt primary controls, generous spacing, one restrained accent and opaque surfaces. These are design targets, not measured user preferences. Test real Dynamic Type, VoiceOver, Voice Control, Reduce Motion/Transparency, high contrast and both appearances. Do not cap text scaling to preserve a card's geometry. CSS pixels are not native points.

Keep Pause and Stop clear; avoid gesture-only navigation and colour-only status. Use concise task labels instead of oversized motivational headings. Avoid punitive streaks and opaque recovery scores. Optional customisation is preferable to assuming that all older adults share the same preferences.

### EX08 — Progress that helps an appointment

Show a few meaningful functional/symptom observations alongside compatible movement checks. Keep self-report, observed completion, technical missingness and measurements distinct. Dose changes need not split otherwise comparable measurements; changed assistance or method may. Do not automatically claim degree-level improvement before repeatability evidence supports it.

The patient-owned appointment summary should show procedure/side, exact source revision, recorded stage and elapsed time, compatible trends with uncertainty, symptoms/difficulty, completion basis and personal questions. It can be shown on the phone or exported by the patient without a clinician backend. Never say a clinician is monitoring or has been notified when that relationship does not exist.

## Actual checks and limits

Cloud Linux executed **18 named tests of a proposed phase-policy model** and **24 layout combinations of a standalone illustrative HTML concept** (three viewport sizes, two text scales, four states), plus prototype navigation/pausing/completion wording. They passed after browser harness corrections and a visual simplification pass. The model uses synthetic values and is not production code. Browser checks covered nonempty rendering, horizontal overflow, named controls and 44-CSS-pixel button dimensions; they are not native accessibility certification.

The complete HTML/report/screenshots were generated as conversation attachments. They are optional design aids, not required Mac-only dependencies for implementing EX01–EX08. The model tests are supplied next to this document. No app suite, native iOS journey, real approved video, real camera, patient study or measurement-repeatability study was executed in this research task. No application source or gate acceptance changed.

## Next validation slice

Use the existing G04–G09 runbook. Build one source-backed programme/variant and local adoption flow, then one complete Learn/Do/Check journey with actual approved media. Include distinct session-group schedules and phase-review state. Keep unresolved clinical values inactive.

Required adversarial cases: wrong protocol/side/modifier; date crossing without approval; changed date or source; old plan suspended; repeated event; expired or missed mini-session; frequent-group tasks mixed with strength tasks; demonstration beyond prescription; helper obscured by segmentation; camera denied; unavailable/wrong-revision video; pause/app-kill; large text; incompatible measurement method; no connected clinician.

Then conduct formative observation with diverse older users, including people who do not normally choose apps, and separately with physiotherapists and surgeons. A proposed first round of 6–8 patients is a design starting point, not a sample-size calculation. Test understanding and actual tasks, not only satisfaction. Do not induce an unapproved exercise during a prototype session. Record assistance, errors, phone touches, posture changes, recovery after interruption and perceived confidence/burden. A high satisfaction average cannot compensate for wrong-protocol activation or inaccessible Stop.

## Public sources

- E01: https://journals.plos.org/digitalhealth/article?id=10.1371/journal.pdig.0000626
- E02: https://aging.jmir.org/2026/1/e87332
- E03: https://pubmed.ncbi.nlm.nih.gov/30707106/
- E04: https://bmjopen.bmj.com/content/8/10/e026326
- E05: https://pubmed.ncbi.nlm.nih.gov/42074830/
- PhysiApp: https://apps.apple.com/au/app/physiapp/id1047722007
- Hinge manual: https://www.hingehealth.com/user-manual/
- Medbridge GO: https://apps.apple.com/us/app/medbridge-go-for-patients/id1089747982
- mymobility: https://apps.apple.com/au/app/mymobility-patient-app/id1438566065
- Apple contrast evaluation: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/sufficient-contrast-evaluation-criteria
- Apple accessibility evaluation: https://developer.apple.com/videos/play/wwdc2025/224/
- W3C resize text: https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html

These sources inform design; private clinical originals and unresolved owner decisions remain separate authority.
