# Reference authority and end-of-session coaching correction

Basis: `7542688a7c809ecef2832b473cce4f5de2609ee3`; implementation: `c3d4b7bda383a75fd6d70209a7ee73d2f888acc6`.

The owner supplied a read-only Claude review of the frozen web implementation. This is a receiving-agent response, not an impersonated reviewer approval. Work maps to existing G05.V04/V08 and does not create a new roadmap or clinical programme.

## Reproduced

A synthetic 164-degree demonstration overrode a supplied 90-degree range goal in `analyseSession`, while the numerical summary could still display 90. Its `reduced_range` finding and spoken cue reached the patient. Lower demonstration targets could also hide a missed prescription; toward-neutral selection had the same precedence issue. Comfort-stage policy was applied live but not to the end-of-session analysis.

The existing rejected-view/far-side result could also retain a range-increase cue. The summary additionally inferred a target from a reference when no target was supplied. The initial 14-case acceptance file had 13 failures and one passing still-setup control. Early wrong-view test fixtures were corrected to a knee variant whose view restriction is explicitly defined; that correction is not claimed as a production fix.

## Changed

- Range coaching uses only a finite, nonnegative supplied goal, including an explicit zero. A demonstration neither overrides nor fills in range goals. Endpoint measurements themselves are unchanged.
- Rejected measurement views and hidden-side cases do not produce range/hold-increase prompts.
- A shared comfort-stage filter runs in the recording/analysis path and again at the outcome boundary. It removes range-increase, extra-return and longer-hold advice, preserving setup and remaining findings. A still-measurement setup cue is not confused with therapeutic hold progression.
- Comfort summaries omit the numerical target comparison but preserve the supplied target with the measurement in history. Limited coaching is labelled; it is not turned into 'nothing to correct', 'excellent form' or a generic rest-time prescription.
- A demonstration no longer supplies a return-position target or therapeutic hold duration. Existing tempo comparison and variant-specific compensation checks remain; this patch does not validate them clinically.

## Tests and interpretation

See `../evidence/2026-09-27-reference-safety/run.json` for executed results and exact scope. New tests cover production analysis, actual recording-hook policy, rendered summary, selected speech string and reducer history. Speech-device output, native fault injection and real patients were not tested.

Eight pre-existing expectations needed reconciliation: the range example now supplies its intended goal; the hold example supplies its intended hold; the return example no longer requires matching another person's rest; and five straightening examples explicitly supply their synthetic zero goal. No detection thresholds or endpoint estimator changed. The historical input remains in Git.

## What the independent review adds (not conflated with our observations)

Claude reports testing an uploaded local reference video on the web: four repetitions were detected, compared with four labelled repetitions. He deliberately used an abduction clip under the arm-raise catalogue entry for a mechanics test. That does not validate the angle, exact variant, native upload, or phone processing speed. The earlier receiving-agent answer omitted this web-upload path; a local file as well as a live camera demonstration can supply the numerical reference. The YouTube embed itself is not the analysed source.

Basic playback success does not contradict the preceding web audit's pause, hide/show, size and error-handling findings. Those controls remain unfixed here. No new licence permission, dataset download, proxy trust alteration or performance claim follows from either browser test.

## Next work

Submit this narrow safety correction for independent review and current hosted CI. Retire the disconnected YouTube downloader and dependency after a usage audit; preserve usable comparison helpers and tests rather than deleting an entire feature folder blindly. Then repair the existing video-control findings within the first source-aware shoulder journey. No additional desk-research programme is required.

The source-aware programme, variant-specific clinical rules, numerical-check validation, patient-only wording, real approved demonstrations and native patient journey remain open. This patch does not validate a protected postoperative activity or authenticate programme approval. No main merge or complete-gate acceptance.
