# Video reference and benchmark audit — 2026-09-27

Basis: `7f4532c6fdba5114bce56c8e67410a3a623f7a7a`. This is a focused G05/G07/G08 finding, not another roadmap. No application source, clinical dose or permissions were changed.

## Actual YouTube result

A fresh production web build was exercised on the authorised Mac using YouTube's official player sample `M7lc1UVf-VE`, starting at eight seconds. This is a technical fixture, not a clinical exercise. Fourteen existing URL/reference tests passed; the full application suite was not rerun. `observations.json` contains the measurements; `probe.mjs` reproduces the browser observation with environment-supplied paths.

- Real embedded video played in preparation and beside the simulated exercise. This establishes web playback, not native iOS or automatic video analysis.
- **App Pause does not pause the reference.** While the screen said Paused, playback advanced from 8.414 to 10.618 seconds during a 2.2-second observation and remained unpaused.
- **Hide/Show discards playback position.** Hide removes the iframe; Show creates another player and restarts at the link's configured start.
- **The player is undersized.** Preparation: 294×165 px at 390px width; 224×126 at 320px. Live: approximately 193×107. YouTube requires an embedded viewport of at least 200×200. It played despite this; playback alone does not establish compliance/usability.
- Source inspection: native WebView uses YouTube's domain as `baseUrl`, rather than the app's identity as specified by YouTube's current embedding requirements. No native Error 153 or playback failure was reproduced here.
- Source inspection: no app-level player ready/error/playback bridge; native and web wrappers are separate implementations. Fullscreen permissions are not evidence that enlarged playback/resumption works.
- Current numerical reference is a separately camera-recorded `PlanReference`. Pasting a YouTube link does not extract the video's skeleton or create an automatic clinical comparison. Old `features/videoComparison` documents/mock services are not proof of the active patient flow.

## Next implementation, within existing G07/G05

Use the official player API and native message bridge: ready/buffering/playing/paused/ended/failed states, app Pause/Resume coordination, pause on hide, restore position on Show, and stop on leaving the session. Never keep a hidden YouTube player playing. Test external-browser escape and offline/unavailable/non-embeddable recovery without losing the prescribed activity. Meet minimum viewport size using an appropriate layout/letterboxing or a dedicated Watch screen; do not shrink controls to fit a tiny overlay. Native identity, captions, fullscreen, return, backgrounding and audio interaction require their own iOS tests.

For primary offline instructions, prefer original or separately licensed approved demonstration files. YouTube remains an optional streaming reference. Do not download/cache YouTube media or modify its video/player as a shortcut. A locally owned video and patient-camera overlay can have separately approved controls/effects. Benchmark media is not patient education by default.

## Benchmark acquisition decision

The repo already documents an 89-clip/16-participant MobiPhysio pilot plus 48 transformed runs. Its manifest describes 2,266,719,687 raw bytes. The historical REHAB24 after-report contains 86 camera sessions and 1,510 repetition-camera observations, not 86 independent participants. These reports were read, not rerun. A scoped search of the landing and prior review workspaces found the portable landmark fixtures but not the raw benchmark MP4 corpus; this is not a claim about the entire computer. Claude's handover explicitly excluded his raw research media.

Do not bulk redownload several archives. First restore 12–24 relevant development clips from the existing manifest after confirming the source terms; keep one content-hashed copy outside Git, process serially or with at most two workers, and reuse compressed landmark output keyed by source/model/options/version. Reserve independent participants for later holdout use and keep all views/transforms of each participant together. Repeatedly adapting to a previous test set makes it development evidence, not a fresh external validation.

Priority additions are exact supine assisted elevation, elbow-at-side assisted external rotation, selected sleeper setup and the selected early knee activities, plus limited range, occlusion by supports/helper, interrupted motion and repeat capture setup. More standing abduction clips do not validate those variants. Independent clinical/reference angles are needed for accuracy; pose-derived labels or session-quality ratings are not angle truth. Purpose-recorded consented demonstrations/assessment data may be more useful than additional generic exercise footage.

Rights: REHAB24's public record restricts use to academic/nonprofit non-commercial research and asks commercial users to contact the maintainers. Earlier repository wording 'internal-only' must NOT be read as automatic permission for internal commercial product development. Keep any existing analysis historical and do not start additional use without resolving permission. MobiPhysio's existing manifest records CC0; verify the current source and rights before acquiring additional media. UCOPhyRehab++ provides motion-capture-derived trajectories and processed modalities; its paper says raw RGB is omitted for privacy. These serve different purposes.

No new benchmark videos or archives were downloaded in this audit. An attempted metadata-only direct request was refused by the tool safety gate; it was not retried through another route. A guided product need not wait for every numerical benchmark.

## Public app evidence -> concrete design choices

- PhysiApp: Australian store shows 4.7/5; selected positive reviews value replayable instruction and clinician-adjusted programmes. Version notes describe independent video/timer audio controls, landscape support and preparation time during side changes. Borrow replay clarity and patient-paced transitions, not automatic extra dose.
- Hinge manual: video+camera guidance, captions, pausing, reviewing instructions and continuing without camera while retaining progress. Implement those recoveries within our approved programme, not Hinge's exercise progression rules.
- Medbridge GO: a 2023 review wants meaningful spoken exercise/repetition/hold transitions while lying down. A 2025 review struggles to find a single video; the developer explains the existing Program-tab path. This is a discoverability lesson, not evidence that the function is absent.
- Sword: a 2024 reviewer values convenience and clinician response when tracking fails; a 2025 reviewer complains about text size. These are selected personal reports, not representative patient statistics or verification of current bugs.

Use one large Watch again action, plain support/side instructions, meaningful speech, optional camera, a unified Pause and honest completion. The primary demo should match the exact variant, not the demonstrator's maximal range. Comparison timing must not push a patient to keep up with a healthy demonstrator. A clinician portal remains deferred.

## Sources and replay

Primary/public sources reviewed 2026-09-27; app-store reviews are dated individual reports, not a representative survey. No enrolled-patient competitor app was operated.

- YouTube player API and sample: https://developers.google.com/youtube/iframe_api_reference
- Identity, size and playback requirements: https://developers.google.com/youtube/terms/required-minimum-functionality
- Parameters and deprecated controls: https://developers.google.com/youtube/player_parameters
- Media-use restrictions: https://developers.google.com/youtube/terms/developer-policies
- MobiPhysio paper (3,686 videos across nine exercises, not five): https://doi.org/10.1016/j.dib.2026.112635
- REHAB24-6 original terms: https://zenodo.org/records/13305826
- UCOPhyRehab++ modalities/limits: https://www.nature.com/articles/s41597-026-07362-5
- PhysiApp listing/reviews/version notes: https://apps.apple.com/au/app/physiapp/id1047722007
- Hinge user manual: https://www.hingehealth.com/user-manual/
- Medbridge GO reviews: https://apps.apple.com/us/app/medbridge-go-for-patients/id1089747982
- Sword reviews: https://apps.apple.com/us/app/sword-health-ai-care/id1468523447

Replay: build the pinned app's web version, serve `dist` on a private loopback port, and run `probe.mjs` with `SOURCE_SHA`, `BASE_URL`, `OUT`, `CHROMIUM_PATH` and `PLAYWRIGHT_MODULE` (the installed Playwright core index module) explicitly supplied. It uses a synthetic localStorage profile and simulated body; no real camera. The newer Node used for the browser driver is separate from the application pin. Output is observational: process exit zero is not an assertion that all behaviours pass. Inspect `browser-results.json`, including the elapsed video time after app Pause. Close the server after the probe; no watcher is installed.

Screenshots include third-party video content and remain local. Only scrubbed numerical observations and the parameterized probe are published. Existing checkout, dependencies and browser were reused; no native build, new dependency tree or media corpus was created. Native approved-video acceptance remains open under G07/G09.
