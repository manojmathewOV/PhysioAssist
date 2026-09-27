# Independent review reconciliation and resumed implementation

2026-09-27. This records Claude's read-only review supplied by Manoj in chat, anchored to **707a6e7**. It is not a GitHub approval posted by Claude, and does not cover later local commits. Receiving-agent observations and tests below are separate from that review.

## Review accepted at its stated scope

Claude corroborated the frozen application/source preservation, archive tags, unmerged predecessor PR closure, pinned native toolchain, frozen Pod installation/failure propagation and green hosted CI at 707a6e7. He reproduced the published synthetic noise experiment and its eight self-tests. This supports I01 on that revision; it does not accept every G01 criterion or later storage changes.

The receiving-agent storage guard (`dd7f504`) and simulator-only signing/Ruby correction (`1c539a5`) were local and unpublished when he reviewed. Their original evidence is [here](2026-09-27-g01-g02-receiving-agent.md). Publish them with their evidence, run current CI and request review of the delta rather than asking Claude to review 707a6e7 again.

## Measurement correction: important, but not a numerical accuracy claim

Source inspection confirms session results select `profile.bestDegrees`. For away-from-neutral movement this is the maximum of repetition peaks; for toward-neutral movement it is a minimum. `repSegmentation.ts` first applies a median window of up to five frames. The peak is therefore not an unfiltered raw-frame maximum.

Nested maxima over fixed retained groups equal a maximum over the pooled values. They do not create two independent error terms to add together. The synthetic +4 to +7 degree examples assume a particular noise/observation process; they are not measured production error. Smoothing, temporal correlation, true motion, repetition selection and missing observations matter.

Four new production-code characterisation tests passed in `src/services/movement/__tests__/peakReview.test.ts`: an isolated raw spike is removed; a sustained perturbation remains; straightening retains minimum selection; best and typical endpoints stay distinct. They do not establish clinical accuracy or change the displayed metric.

The current `approximate` flag uses all retained repetition frames. That is not necessarily the quality of the interval that produced the result. Future provenance should retain best and typical endpoints, direction, selected repetition/time, contributing filter window, method and quality of that interval. Median-of-repetition-peaks remains an extreme-derived statistic, not an unbiased clinical reference. Do not backfill missing provenance into old history.

A standardised Check with a predefined, permissible stable endpoint interval and a robust summary is a candidate to validate. It must not select the luckiest plateau, bridge tracking gaps, demand an unapproved end-range hold or silently mix method versions. No hold length, pain threshold or clinical dose is chosen here.

## Permissions, copy and CI triggers

The source search confirmed microphone and both photo-library purpose strings in Info.plist, an installed CameraRoll dependency, and no use of those capabilities in authored application code. A purpose string is not evidence that an OS prompt was actually shown. Remove unused declarations/native dependency in a small tested cleanup, retaining camera capture and reference playback. Check motion permission use separately. No size saving has been measured.

The progress text and programme-waiting screens still imply an attached physiotherapist. Replace that implication while retaining restrictions and appropriate instructions to seek clinical advice. Rewording does not authorise a patient to self-approve a protected programme. Broader source-specific language belongs in the shoulder journey, not a blind global string replacement.

The iOS workflow runs for qualifying pull-request changes and claude/** pushes, not all agent-branch pushes. The open PR supplies current coverage. Prefer deliberate PR runs and a main-branch check after consolidation over adding a duplicate native run to every feature push. No workflow trigger was changed by this response.

## Product-first execution, under the existing runbook

No new roadmap, gate count, CCore binding project or governance subsystem is added. The 121 DoD dimensions are repeated declarations across 11 gates, not 121 implementation tasks. Use only the active work item and necessary acceptance cases.

1. Publish/review the existing foundation fixes and refresh their hosted evidence.
2. Do the small patient-only copy/privacy cleanup and preserve record provenance without changing measurement meaning.
3. Build one complete source-aware shoulder journey: correct variant, approved reference, camera-optional Do, pause/stop, truthful durable record and recovery screen. Native screenshots must be inspected. Real-iPhone/human validation remains separate.
4. Implement only the additional local storage/protocol machinery needed for that journey safely. Keep migration, write-error, privacy and safety acceptance intact; do not use product focus to bypass them.
5. Add the selected knee journey using the same implementation; keep future surgeon/physio portals out of MVP.

Work in bounded implementation batches. More than two attempts without new diagnostic evidence triggers a smaller experiment/RCA, not another identical heavy build. Owner clinical decisions block the relevant activation, not unrelated reversible work. A public main merge or gate acceptance is not performed here.

## Evidence boundaries

This pickup reused the permanent checkout and installed dependencies. Its four new tests are synthetic production-code characterisation. It does not add a new camera accuracy study, native exercise journey or patient trial. Earlier native/storage screenshots and logs remain explicitly tied to their earlier versions. Current suite and publication details are recorded in the accompanying pickup run record.
