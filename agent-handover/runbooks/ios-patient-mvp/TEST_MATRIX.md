# Validation matrix — planned versus observed

83 named scenarios. All entries are planned for this runbook revision unless an exact evidence reference explicitly records a result. This count is not a count of executed application tests.

| ID | Gate | Evidence class | Required scenario |
|---|---|---|---|
| G00.V01 | G00 | repository_structure | Fresh checkout can navigate all local links and identify absent private evidence honestly. |
| G00.V02 | G00 | repository_structure | An agent resuming after context loss reconstructs next gate and blockers using this folder alone. |
| G00.V03 | G00 | repository_structure | A changing PR head invalidates only affected evidence, not the whole history. |
| G00.V04 | G00 | repository_structure | All three frozen input heads are ancestors of the published integration candidate; protected source/history blobs are unchanged. |
| G00.V05 | G00 | repository_structure | Exactly one active consolidation PR is designated; predecessor PRs point to it and retained checkpoints restore all original heads. |
| G00.V06 | G00 | repository_structure | No unresolved clinical decision is relabelled approved during document consolidation. |
| G01.V01 | G01 | logic_and_hosted_native | Exact replay counts once; reversed conflicting inputs produce identical withheld credit; an explicit correction restores only intended credit. |
| G01.V02 | G01 | logic_and_hosted_native | Schedule-only edits require new prescription revision and applicable local confirmation; equivalent serialisation does not. |
| G01.V03 | G01 | logic_and_hosted_native | Mounted screen updates at due/window/midnight boundaries, foreground refreshes, Start rechecks and unmount removes timers. |
| G01.V04 | G01 | logic_and_hosted_native | Five seconds active, seventy paused, three active yields eight active seconds consistently in ring, completion and history. |
| G01.V05 | G01 | logic_and_hosted_native | Full relevant Jest suite exits naturally with no force-killed worker, unexplained timer or skipped new coverage. |
| G01.V06 | G01 | logic_and_hosted_native | Fresh hosted native dependency install preserves the approved lock and completes build/smoke/selected Detox; capture Ruby, CocoaPods, Node, Xcode and input hashes. |
| G01.V07 | G01 | logic_and_hosted_native | A deliberately failing Pod command remains a failing job despite log piping; changed lock or missing tool version refuses. |
| G01.V08 | G01 | logic_and_hosted_native | Old reviewer failures are mapped to actual replacement coverage or reopened; wording-only and superseded assumptions are not restored. |
| G02.V01 | G02 | fault_injection_and_native_files | Restart and force-termination at every migration boundary leave either a valid prior store or fully committed new store, without duplicate records. |
| G02.V02 | G02 | fault_injection_and_native_files | Stress fixture with 10,000 synthetic history records: only requested pages/aggregates enter app state; compare startup, memory and writes against baseline. |
| G02.V03 | G02 | fault_injection_and_native_files | Two local profiles never see each other records; sign-out/account changes cannot silently reassign the database. |
| G02.V04 | G02 | fault_injection_and_native_files | Disk-full and corrupt-record injection give recoverable errors and preserve unaffected records. |
| G02.V05 | G02 | fault_injection_and_native_files | Enumerate actual files after writes to verify protection, backup disposition and absence of raw video. |
| G02.V06 | G02 | fault_injection_and_native_files | Seed existing history then reject its read: no empty overwrite occurs on navigation, retry, app background or another update; the original bytes remain recoverable. |
| G02.V07 | G02 | fault_injection_and_native_files | Power-loss/write-error at each migration step preserves either the old store or committed new store; a repeated recovery is idempotent. |
| G02.V08 | G02 | fault_injection_and_native_files | Commit acknowledgement occurs only after durability; a failed write is visible and never counted as saved. |
| G03.V01 | G03 | native_identity_journey | Onboard, restart in airplane mode, complete an activity and recover its record. |
| G03.V02 | G03 | native_identity_journey | Cancelled sign-in, revoked credential, hidden email, account change and repeated login do not expose or silently transfer another profile data. |
| G03.V03 | G03 | native_identity_journey | Deletion removes the approved local assets/notifications and, only if accounts exist, performs the documented account deletion path. |
| G03.V04 | G03 | native_identity_journey | The screen never promises cloud recovery or monitoring which the MVP does not implement. |
| G03.V05 | G03 | native_identity_journey | No clinician assigned: patient can use approved independent features without a false waiting/monitoring claim. |
| G03.V06 | G03 | native_identity_journey | Sign-in cancellation or identity change cannot reassign another local database; same email alone never merges owners. |
| G04.V01 | G04 | synthetic_policy_and_source_approval | Frozen-shoulder sleeper variant never leaks into a disallowing protected-repair programme. The ER elbow-at-side rule never leaks into sleeper setup; lying assisted variants never use standing-activity identities. |
| G04.V02 | G04 | synthetic_policy_and_source_approval | Isolated MPFL and MPFL with TTO do not collapse into one knee permission; assistance and loaded/unloaded/braced distinctions survive import/export. |
| G04.V03 | G04 | synthetic_policy_and_source_approval | A changed reference or package cannot silently change an active patient prescription. |
| G04.V04 | G04 | synthetic_policy_and_source_approval | Missing/contradictory source or unknown procedure yields explanation plus safe available functions, never invented permissions. |
| G04.V05 | G04 | synthetic_policy_and_source_approval | Changing only dose preserves comparable observation identity; changing assistance/posture/estimator separates incompatible series. |
| G04.V06 | G04 | synthetic_policy_and_source_approval | Passing a calendar date does not satisfy a clinical milestone; missing prerequisite remains unknown, not met. |
| G04.V07 | G04 | synthetic_policy_and_source_approval | Expired/suspended programme has appropriate education/records/review route without indefinite treatment continuation or guessed replacement. |
| G04.V08 | G04 | synthetic_policy_and_source_approval | Therapist-only tasks and manual force/load escalation cannot become patient self-instructions through template import. |
| G05.V01 | G05 | native_patient_journey | Learn -> Do -> interrupted Do -> incomplete Check -> valid Check -> later compatible comparison, using the same profile/episode. |
| G05.V02 | G05 | native_patient_journey | Unavailable Check shows no numeric result and no normal-technique claim; completed unmeasured Do is not failed rehabilitation. Sleeper can issue clearly approximate IR only with a qualified method, known angle reference and sufficient view/interval; otherwise no number, not zero. Approximate result and drift observability are separate. Stable but wrong setup does not prove technique; an arbitrary starting pose is not zero IR. Continuous elbow data distinguish measured-zero/below-alert, unobservable and not-applicable; unknown depth or missing wrist cannot manufacture a normal paired result. Caudal drift is judged relative to the prescribed near-90-degree setup, not zeroed at an arbitrary start. Keep the qualified robust endpoint and overall endpoint with their own paired positions; unspecified tolerance never becomes zero-tolerance or automatic pass. No extra-exercise prompt follows rejected measurement. |
| G05.V03 | G05 | native_patient_journey | Dose/schedule changes preserve compatible methods; assistance/method changes separate comparison or mark incompatibility. |
| G05.V04 | G05 | native_patient_journey | Goal, clinical restriction and demonstrator endpoint remain three separate quantities. |
| G05.V05 | G05 | native_patient_journey | Watching or a simulated demonstration never becomes completed treatment or a clinical measurement. |
| G05.V06 | G05 | native_patient_journey | Patient-confirmed completion is labelled self-reported, not camera-observed or clinician-supervised. |
| G05.V07 | G05 | native_patient_journey | Appointment summary identifies episode, source/version, method, support, date, unmeasured attempts and questions without implying notification of a care team. |
| G05.V08 | G05 | native_patient_journey | Reaching a demonstration's maximum never silently substitutes for a lower prescribed target or relaxes a precaution. |
| G06.V01 | G06 | clock_and_native_notifications | Due time changes without history edits; foreground after a missed boundary; midnight and timezone/DST transitions. |
| G06.V02 | G06 | clock_and_native_notifications | Notification denied, delayed, duplicated or tapped after a plan change: in-app truth stays correct and no record is completed. |
| G06.V03 | G06 | clock_and_native_notifications | A 2-3 synthetic repetition range accepts its lower bound; a missed mini-session does not add later repetitions. |
| G06.V04 | G06 | clock_and_native_notifications | Old notifications disappear after schedule revision or profile deletion; one device state does not count repeated notifications as exercise. |
| G06.V05 | G06 | clock_and_native_notifications | Morning mobility, separate strength and evening group cannot complete or schedule one another accidentally. |
| G06.V06 | G06 | clock_and_native_notifications | Review/correction/reorder/profile switch cannot reassign a previous event's execution-time occurrence. |
| G06.V07 | G06 | clock_and_native_notifications | Device clock/timezone moves backward or forward: record chronology and no duplicate completion; policy-bound eligibility recomputes. |
| G07.V01 | G07 | native_media_accessibility_and_human | Real approved asset plays through Watch -> enlarge -> Do -> pause/call -> resume -> summary in native iOS; missing/corrupt/offline asset has a useful fallback. App Pause also pauses the player; Hide/Show preserves position; the viewport and native identity satisfy the selected provider contract; unavailable/blocked/autoplay-denied states recover truthfully. Separately qualify the three reference paths and forbid YouTube-frame extraction. |
| G07.V02 | G07 | native_media_accessibility_and_human | Speech identifies the next movement and dose without forcing a floor-exercising patient to reach for the phone. |
| G07.V03 | G07 | native_media_accessibility_and_human | Small supported iPhone and largest supported accessibility text: all essential instructions and controls remain reachable without clipped meaning. |
| G07.V04 | G07 | native_media_accessibility_and_human | Camera problem plus precaution plus praise selects one correct visual/spoken message consistently. |
| G07.V05 | G07 | native_media_accessibility_and_human | Corrupt, missing, wrong-variant or unavailable video cannot silently substitute another movement; approved text/audio fallback is clear. |
| G07.V06 | G07 | native_media_accessibility_and_human | Dynamic Type, VoiceOver and Voice Control traverse a complete native routine with reachable Stop/Pause. Compact counts retain accessible role/value; iOS requires its native announcement route, not Android liveRegion alone. Test app speech on/off, warnings, pause/background, listener cleanup and no per-second hold chatter. |
| G07.V07 | G07 | native_media_accessibility_and_human | All important props/helper context remain legible in selected focus/plain fixtures; person tracking transfer withholds/reconfirms rather than silently measuring a helper. |
| G07.V08 | G07 | native_media_accessibility_and_human | Meaningful audio and captions remain correct through calls, mute, pause and resume without queued contradictory praise. |
| G08.V01 | G08 | reference_measurement_and_physical_device | Thirty synthetic open/start/pause/stop/close cycles as a stress fixture: no sustained retained-memory growth; include background/memory pressure. |
| G08.V02 | G08 | reference_measurement_and_physical_device | Cold offline first use with required model/media present; low-storage model failure returns honest unmeasured state. |
| G08.V03 | G08 | reference_measurement_and_physical_device | Independent video/reference tests report issued-angle error AND coverage, false withholding, wrong-side cases and unsupported conditions. Test the owner-selected bedside elevation/sleeper and foot-end ER capture separately. Forearm rotation visibility must not validate an unseen elbow; dependent shoulder occlusion prevents unsupported claims. Sleeper approximate IR requires independent reference testing of its exact angle definition and practical bedside view; check camera pitch/roll, both sides, elbow/wrist substitutes, torso drift, occlusion and repositioning. Distinguish absolute IR from change relative to setup; no unvalidated numeric error claim. For the chosen sleeper variant test caudal upper-arm angle and IR against independent references together. A raw image angle must not masquerade as a bed-plane angle; test foreshortening, body roll, lift, near-boundary uncertainty, baseline creep and tolerance-policy changes. Healthy feasibility alone does not determine clinical leeway. |
| G08.V04 | G08 | reference_measurement_and_physical_device | A method change cannot silently present the same measurement-method version or turn simulation success into clinical accuracy. |
| G08.V05 | G08 | reference_measurement_and_physical_device | More noisy repetitions without changed true endpoints cannot justify an automatic improvement claim; report selection policy and sample basis. |
| G08.V06 | G08 | reference_measurement_and_physical_device | Repeated phone positioning and between-day reference comparisons separate setup bias, within-session variance and clinically meaningful change. Include stand movement, mattress compression, mirrored sides, initial prescribed roll, assistance and partial occlusion; rebaseline camera movement rather than label it patient drift. Match the initial upper-arm/torso setup across days as well as within-session drift. A session baseline must catch cumulative elbow migration that per-repetition resetting hides. Include pure rotation, combined shoulder/elbow translation and camera/torso motion controls. |
| G08.V07 | G08 | reference_measurement_and_physical_device | Chosen endpoint with poor tracking is withheld even if the rest of the session has high visibility. Pair the endpoint IR with elbow displacement and upper-arm direction from that same interval, not independent maxima/minima. Preserve numerical values/units/coverage through history, including held Checks; below-alert observations do not disappear into the warning list. |
| G08.V08 | G08 | reference_measurement_and_physical_device | Thirty repeated camera cycles release resources; memory/low-storage/model failure gives an honest safe fallback, not another app reload loop. |
| G08.V09 | G08 | reference_measurement_and_physical_device | Structured synthetic appointment export round-trips meaning, units, unknowns, correction links and version; unavailable is not zero. |
| G09.V01 | G09 | native_artifact_review | Cloud build -> simulator -> authored journey -> screenshot/video artifacts -> image retrieval -> recorded visual review is demonstrated end-to-end. |
| G09.V02 | G09 | native_artifact_review | Local profile, routine preparation, reference, live exercise, paused state, unmeasured result and progress all appear in the artifact manifest. |
| G09.V03 | G09 | native_artifact_review | Restart simulator and re-open local records; large text and smaller-device states are not replaced by web screenshots. |
| G09.V04 | G09 | native_artifact_review | All artifact links are durable or explicitly expire; public artifacts contain synthetic/non-identifying material only. |
| G09.V05 | G09 | native_artifact_review | Each native image/video is tied to exact tested source, dependency/toolchain, fixture, screen state and reviewer finding. |
| G09.V06 | G09 | native_artifact_review | Native required journey cannot pass using a web image, an old artifact or an unexecuted UI-test specification. |
| G09.V07 | G09 | native_artifact_review | Clean simulator run and persisted-session restart both exercise the intended paths, without consuming unrelated personal device data. |
| G10.V01 | G10 | claim_traceability_and_pilot | Trace each release claim to matching version-bound evidence and clinical approval; missing human/device evidence cannot be marked passed by a software model. |
| G10.V02 | G10 | claim_traceability_and_pilot | Independent patient completes approved offline workflow after setup without selecting camera geometry or editing clinical phase. |
| G10.V03 | G10 | claim_traceability_and_pilot | Deletion/reinstall/lost-device information matches actual recovery capability; Sign in with Apple alone is never described as clinical backup. |
| G10.V04 | G10 | claim_traceability_and_pilot | Audit build and network/file outputs: no unexpected clinical upload, tracking, public identifiable media or unapproved iCloud health-data backup. |
| G10.V05 | G10 | claim_traceability_and_pilot | No open high-severity safety, data-loss, identity or privacy defect at the selected endpoint; other residuals require an explicit owner and scoped disposition. |
| G10.V06 | G10 | claim_traceability_and_pilot | An older/low-digital-confidence user completes the permitted journey and explains its outcome; supervised human evidence is recorded separately from simulation. |
| G10.V07 | G10 | claim_traceability_and_pilot | Surgeon and physiotherapist independently interpret synthetic appointment summaries correctly without needing future portal infrastructure. |
| G10.V08 | G10 | claim_traceability_and_pilot | Distribution uses the then-current required signing/SDK/policy checks; a legacy local simulator pass never substitutes. |

Required evidence: source SHA, criterion ID, fixture/protocol identity, command or observed task, result, evidence type, recorder and limits. Native and human evidence have additional fields in `validation-matrix.json`.

An unavailable/opt-in dataset does not validate a clinical endpoint. A method/endpoint change reopens affected observation comparisons. Historical evidence stays pinned rather than being copied into new pass states.
