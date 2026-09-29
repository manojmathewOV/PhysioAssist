# Guided shoulder implementation and real-video replay

2026-09-28. Resumes the same authorised S2 task after interrupted chat responses; existing commits, failed probes and candidate changes were preserved, not reset. Final tested code: `a8da5f5b630475144dfc12af1afd5cbc6a9d8516`. Previous public baseline: `2f2bec92c309e11896a2818c9015a3775881747a`. No main merge or independent acceptance is performed by this report.

## Product change

Camera-optional Do now has an actual entry on both web and native. An explicitly selected, confirmed programme supplies its side, dose, episode and occurrence. The three lying shoulder variants are distinct: supported supine elevation, stick-assisted external rotation at the side, and shoulder-level sleeper stretch. Local setup supplies no default clinical dose. The added variants are restricted to the frozen-shoulder route; they are not silently offered for protected repairs. Local confirmation is not authenticated clinician approval.

The patient can start, pause, background/return, inspect the demonstration and explicitly resume, then finish and report completion or an early stop. No pose, repetition count, ROM, camera quality score or inferred healing is manufactured. Watching is not active exercise time. A changed programme blocks resumption and current-routine credit; the historical attempt retains its original basis.

The summary first presents saving/saved/failed state. A guided record earns routine credit only after the existing encrypted persistence service accepts and reads back the exact payload. Failure remains visible after leaving the summary; Retry retains event identity and cannot duplicate activity. Restart recovers acknowledged records. Guided activity stays out of the numerical measurement series. This is a bounded acknowledged-write adapter, not completion of the planned transactional migration or backup/account system.

Native and browser tests exercised completed and early-stop reports, saved records, restart and new-episode isolation. Their doses/self-reports were synthetic UI inputs, not patient treatment. The latest native test uses the actual Release app and official YouTube sample during camera-free activity; no production simulation switch was enabled.

## Quantitative observation enablers

`1096a16` adds an explicit opt-in held-interval observer. It does not pass a hold through a repetition-only detector. Values, units, interval, coverage and method survive the actual session outcome/reducer/JSON round trip. Observed zero, unavailable and not-applicable remain distinct; failed or invalid observer output stays explicit. Detail payloads are bounded. Existing repetition findings now retain their numeric samples alongside the human cue. Thirteen new tests cover the path. No sleeper IR or caudal detector is installed or activated.

## Exact executed evidence

- Full suite rerun at clean `a8da5f5`: **1,707 passed; four opt-in skipped; zero failed**, 99 suites, exit0, no force-exit/teardown warning. The run lasted29.83seconds. No clinical conclusion follows from this count.
- Production web synthetic journey: **18 checks passed**, including no camera opened, correct variant order, pause accounting, early stop, save failure/retry, duplicate prevention and browser restart. Final failed-save control and readable status were checked at320px; saved/preparation/history screens also at390px. Earlier failed layouts are retained locally.
- Native camera-free journey passed at `1e669fa`; final native reference/restart/new-episode journey passed at `a8da5f5`. Both use actual Release simulator builds. Native saved activity, history and reference screenshots were actually opened and inspected. Only synthetic UI-only screenshots are public.
- Earlier native failures exposed the numeric keyboard covering setup controls. Browser failures exposed saving/failure status below the fixed action and a retained old scroll offset. Those causes were fixed and failed evidence retained; tests were not merely weakened.
- Structured results and hashes: `../evidence/2026-09-28-guided-implementation/run.json`. Pinned source differences and method limits are explicit there.

## Downloaded data and benchmark boundary

Downloaded ten individually selected MobiPhysio v3 files (263,219,206bytes) from the source API, after checking its CC0 record and unrestricted status. Source checksums and SHA256 values were checked, and SHA256/size were rechecked at publication. Files remain outside Git in the existing local benchmark store. Participants P05/P09 were already inspection participants; held-out participants remain untouched.

The web inference/movement replay at clean `1096a16` ran ten real clips plus mirrored and blank controls: **12 runs / 4,742 sampled frames / zero software errors**. The ten original videos contributed3,964 frames, with poses returned in3,957. This 99.82% detection coverage is NOT angle, repetition or technique accuracy. The blank control returned zero poses and unavailable results on both sides. The source-labelled front view sometimes classified as oblique, and per-clip median inference time reached156.9ms in this offline desktop test. These remain recorded limitations, not a passed camera-accuracy or realtime-iPhone claim.

The material covers active abduction/external rotation and selected lighting/occlusion/view changes, not the prescribed lying variants, older postoperative patients or clinical repeatability. Expert scores are not a per-frame goniometric reference. We did not add restricted REHAB24-6 footage to a commercial development pipeline: its source explicitly requires contacting the maintainers for commercial use. Historical results are retained but not treated as new validation.

Reproducible tools are committed: `scripts/fixtures/acquire_mobiphysio.py`, `scripts/fixtures/run_browser_replay.mjs`, `src/testing/videoPatient/browserReplay.ts`, `agent-handover/tools/claude-cloud/web-guided-activity.mjs`, and separate `GuidedActivityUITests.swift`/`GuidedReferenceUITests.swift` under native-reference. They use explicit local destinations and bounded runs. Private media, absolute home paths and raw identifying screenshots are not part of this publication.

Source context checked2026-09-28: MobiPhysio dataset DOI10.7910/DVN/XSI0QN and original article https://doi.org/10.1016/j.dib.2026.112635; REHAB24-6 source/terms https://zenodo.org/records/13305826. The MobiPhysio paper explicitly notes missing older/movement-impaired populations. No public dataset result replaces the exact sleeper rotation-plus-caudal reference study.

## Remaining runbook work

S2a/S2b/S2c now have a concrete scoped implementation candidate, not whole-gate acceptance. Next, independently review this activity/storage/observation delta and obtain hosted results at the published candidate; finish the patient result selector/schematic/compatible-history display with synthetic fixtures while leaving real numbers gated. The approved clinical assets, numeric caudal tolerance and exact remaining dosing/schedule decisions still require the owner and qualification evidence.

Also open: full transactional database/migration and long-history efficiency, true registration/backup policy, complete selected knee/postoperative programme delivery, native live-camera/focus parity, real-device resource/VoiceOver observation, older-user comprehension and the clinical/pilot/release requirements. No clinician portal, FHIR backend or model-training claim was added. A source-aware guided exercise is useful without its numerical Check, but local instruction entry alone does not approve real patient use.

The UI is functional rather than the final low-cognition result design: it still uses written instructions and optional technical sample playback in these tests. The accepted schematic/current/previous/episode-best design is not falsely described as implemented. Native reference screenshots show playback in a scrollable instruction screen, not proof of an ideal final bedside layout.

All work reuses the permanent checkout/dependency tree and primary native cache. The bounded tests and servers finished and the dedicated simulator was shut down. No full clone, model upgrade or dependency installation was required for the resumption. No gate or independent review was marked accepted by the implementing agent.
