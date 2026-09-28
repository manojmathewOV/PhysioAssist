# Sleeper result selection, synthetic presentation and repeated video benchmark

Implemented at `67d4bb3ca0cda8280c047ddeb643d6e3df0de91a`, building on published `f910967`. Three bounded code commits preserve the original, warning-precedence and baseline/geometry refinements. Main remains unchanged. This is not complete runbook or clinical acceptance.

## Implemented scope

A pure typed result selector and reusable React Native card now supply the approximate current reading, elbow status, previous comparable reading and compatible episode best. A simple frozen forearm-angle diagram uses the same selected observation. The explanation, unavailable/excluded states, save status and accessible labels are part of the component, not a separately drawn mockup.

Comparison requires explicit profile, episode, side, variant/assistance, setup/reference, method and endpoint-policy identity, and the same allowance value/version. Both initial and endpoint positional uncertainty must fit the supplied policy. Inputs are validated at runtime; zero, unknown, out-of-band, conflict, retracted and pending remain different. A record cannot register its own method. `PATIENT_SLEEPER_METHODS` is empty: no measured sleeper feature or clinical allowance is enabled.

Previous is the preceding eligible observation, not the last failed attempt. Best is calculated as of the selected Check, using acknowledged, non-retracted compatible records. Identical replay is deduplicated; conflicting copies are excluded; removed sources cannot remain cached best. Unsaved readings do not become recorded best. Ties use the oldest instant then event ID, including timezone-equivalent times. First readings avoid duplicate comparison tiles; incomplete history has a narrower label. A programme-owned blocking message suppresses numbers and comparison. No goal, improvement score, clinical permission or exercise credit is produced.

The graphic is deliberately a forearm-rotation plane with elbow-position text, not a full body reconstruction or an invented ideal upper-arm/scapular position. The numerical result is supplied; the renderer performs no camera estimation. The schematic's comprehension by older users remains to be demonstrated. The new card is exercised in isolated synthetic entries, **not yet wired into patient navigation, a live Check producer or a new storage path**. The ordinary guided routine is unchanged.

## Executed synthetic and visual evidence

- Fresh full suite at clean `67d4bb3`: **1,790 passed, four opt-in skipped, zero failed**, 104 passing suites; natural exit with no forced-worker warning. Managed command completed in28.62seconds. TypeScript passed.
- **65 new focused cases** pass, including153 band/uncertainty combinations and10,000 synthetic historical records. The grid values are arbitrary known inputs, not proposed patient tolerances. These cases test selection logic, not camera accuracy or population safety.
- The final isolated web preview uses actual production components and checks current/excluded/unavailable/uncertain/unsaved/first/partial-history/opposite-side/unregistered/blocked states at320,390 and820px. It checks accessible meaning, no false pose, no cross-series best, reachable explanation/Done and no horizontal overflow. No runtime errors; exact assertions in `web-results.json`.
- Actual screenshot inspection caught `About` splitting within a word under doubled text although overflow assertions passed. It now uses a separate readable qualifier and a smaller numerical glyph; a specific fragmentation assertion was added. Final320/390, unavailable and doubled-web-text images were opened and inspected. Doubled CSS is not native Dynamic Type.
- A contrary-input rendered test first failed because an expanded numerical explanation remained after the current result became unavailable; that is fixed. Further scrutiny added baseline-uncertainty checks, warning precedence and diagram-boundary tests0–180. Prior failure output/screens remain separate locally.

## Real-video replay, separately qualified

The existing ten MobiPhysio v3 inspection clips were reused from the local checksum-verified store; no new video or model package was downloaded. At `116deb2`, the real web pose/movement pipeline processed ten originals plus mirror and black controls: **12 completed runs,4,742 sampled frames**. The black control produced no pose and unavailable measurements on both sides. Per-clip outputs, raw/model hashes, source ID and timing are preserved in `rgb-results.json`.

This was a bounded replay of the existing standing shoulder material, not a validation of supine assistance, sleeper IR, caudal angles or older postoperative patients. Dataset capture labels and model view classification are recorded separately. No angle/rep ground truth is attached to this selection. Completion of all runs proves the selected processing/control assertions, not precision. No held-out participant, newly licensed research corpus or training run was added.

The final two result-only refinements do not change the movement/web/model/replay pipeline. The video result stays pinned to its actually executed116deb2 revision; it is not falsely relabelled as a67d4bb3 measurement study. Final result/UI tests were rerun at67d4bb3.

## Native boundary and honest scope

A separate native synthetic preview entry was prepared. Writing its new XCTest driver was blocked by the tool's safety-status check twice. That operation was not routed through another tool. No native preview bundle/build, copy, signing, simulator run or physical-device observation was performed for this card. Prior native guided-activity evidence is not evidence for this new display.

The production method registry remains empty and the normal app entry does not import the example fixtures. The synthetic registry's allowance and displayed numbers are explicitly example data, never clinical defaults. Native visual/VoiceOver and actual user-comprehension checks remain open. No clinical-quality claim follows from the test count or from an elegant-looking picture.

## Runbook continuation

Record this increment as implemented pending review within existing G05/G07/G08 scope, not a new accepted gate. Review the result contract and then qualify native presentation and connect the future accepted Check to it through an explicit adapter. Preserve a single acknowledged observation for text/diagram/history; do not make the UI derive a new endpoint or assign clinical validity. Storage migration, clinical sources/doses/schedule, actual sleeper method/allowance/repeatability, physical-device resource and patient studies remain separate.

The existing repo, model files, dependencies and browser were reused. Reports are in `../evidence/2026-09-28-result-display/`. Only synthetic UI images and numerical/provenance outputs are public; raw participant clips remain outside Git. Local browser/replay servers completed and closed. No merge, new clinician backend, package upgrade or automatic follow-up job was created.
