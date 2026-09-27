# Evidence matrix — test the real boundary

This is a plan for tests, not their result. Synthetic numeric values represent test fixtures, not clinical prescriptions. Run narrow affected tests during a delta; run integrated/full checks at material gate joins. Preserve the original archived tests; adapt superseded APIs separately.

| Layer                             | What it can establish                                              | Required evidence                                                                  | What it cannot establish                                                |
| --------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Pure/property simulation          | Specified event, schedule, clock and comparison invariants         | Deterministic seed, independent expectation, actual failures/shrink cases          | Camera accuracy or clinical suitability                                 |
| Production reducer/hook/component | Domain result reaches stored and displayed state                   | Exact implementation imports; fake-clock lifecycle; visual/speech/store assertions | Native device layout or real sensor behaviour                           |
| Native iOS simulator              | Actual app navigation, native UI/persistence integration           | App SHA + OS/device + screenshot/video manifest; images actually inspected         | Physical camera/thermal/battery performance or older-user comprehension |
| Physical iPhone                   | Resource use, permissions, interruption and camera pipeline        | Release build, supported device, controlled script and actual measurements         | Broad clinical generalisation from one device/person                    |
| Reference measurement study       | Accuracy, coverage, abstention and repeatability for defined modes | Independent reference definition, participant-disjoint design, held-out evidence   | Healing/phase clearance or modes absent from the study                  |
| Supervised user study             | Whether intended patients complete/recover/understand tasks        | Task outcomes, assistance given, errors and clinician workload                     | Measurement validity by preference alone                                |

## High-value adversarial scenarios

| ID  | Scenario                                                                     | Required invariant                                                   | Gate        |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------- |
| T01 | Same event twice, conflict in reversed order, later resolution               | Replay once; conflict withheld; authorised resolution only           | G01/G02     |
| T02 | Same procedure but a new operation/episode; legacy unknown identity          | No accidental credit or relabelling                                  | G01/G04     |
| T03 | 5 s active / 70 s pause / 3 s active                                         | 8 active everywhere; observation continuity remains separate         | G01/G05     |
| T04 | Due boundary, window closure, midnight, foreground and time-zone change      | Current eligibility recomputed and rechecked at Start                | G01/G06     |
| T05 | Schedule only changes; stale notification opens old plan                     | New approval/version where required; no obsolete action              | G01/G06     |
| T06 | Camera failure and no exercise versus completed exercise with no measurement | Attempt/early stop/completion and measurement are independent        | G05         |
| T07 | Pose unavailable plus warning plus praise/rep event                          | One appropriate warning; no contradictory screen/speech              | G05/G07     |
| T08 | Long recorded plateau with missing frames                                    | No fabricated continuous hold                                        | G05/G08     |
| T09 | Crash or full disk during save/migration; repeat on restart                  | Transaction integrity, recoverable prior data, no duplicated events  | G02         |
| T10 | Large synthetic history at cold start                                        | No full history hydration; footprint measured, not assumed           | G02/G08     |
| T11 | Sign-out/reinstall/revocation/second user                                    | Ownership explicit; no cross-profile leakage or false backup promise | G03         |
| T12 | Reference absent, corrupt, wrong version, offline                            | Correct instructions or honest unavailability; no unsafe substitute  | G04/G07     |
| T13 | New model/posture/assistance with old measurement key                        | Different identity or explicit validated compatibility               | G04/G05/G08 |
| T14 | Repeated camera opens; background; low memory                                | Buffers/resources released; effects degrade before controls          | G08         |
| T15 | Native small screen, accessibility text, VoiceOver, one-handed/floor use     | Essential content/Stop/Pause usable                                  | G07/G09     |
| T16 | Independent user with no surgeon or physio                                   | No fictitious monitoring, no permanent awaiting-clinician dead end   | G03/G05     |

## Existing command anchors

At the pinned application baseline, package.json declares `npm run type-check`, `npm run lint`, `npm test`, `npm run build:web` and `npm run test:e2e:ios:release`. Read the current package, lockfile and workflows before execution. Dependency installation can trigger model downloads. No command printed here was executed merely by creating this document.

P08 investigation candidate: `npx jest --runInBand --detectOpenHandles` on the narrow affected suite before the full clean-exit run. `--forceExit`, exit zero after a killed worker, a silent run, or zero selected tests is not clean evidence.

## Every run record

Record: application SHA; data/source/method revisions; command; exit and worker status; pass/fail/skip counts; environment; device or synthetic source; expected invariant; actual observation; artifact paths + SHA-256; reviewer; known limitations. Keep names and raw health data out of logs. The structural runbook checker tests this plan's consistency only.
