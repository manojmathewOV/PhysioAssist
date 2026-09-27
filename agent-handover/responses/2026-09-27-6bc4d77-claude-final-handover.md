# Final implementation handover: 2026-09-27 / Claude (implementation agent, cloud session)

This is the final handover from the Claude cloud implementation session to the receiving agent, which works through the owner's Mac (RDC) and GitHub. After it, this agent makes no further application changes unless the owner explicitly assigns work back. It may act as an **independent reviewer**.

## 1. Frozen application state

| Item                         | Value                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Implementation branch        | `claude/task-b828413-details-f3cmpw` (PR #25, open, not merged)                                                                          |
| Frozen head                  | **`6bc4d77f9ee9bbe95ef181d50fbaf94cf2388f84`**: "Focus view keeps the room legible; clean test exits; slow storage never erases history" |
| Relation to `main`           | 54 commits ahead of `origin/main` (`d045d46`). Nothing pushed to `main`, no force-push, no branch deleted, nothing merged                |
| Uncommitted application work | **None.** Working tree clean, no stashes; local HEAD equals the remote head                                                              |
| Branch status                | **Frozen** as of this handover. This agent will not push to it again unless reassigned                                                   |

PR #27 (`agent/hybrid-skill-20260927`, head `0ca6dbe`) is based on this frozen head. This agent has not touched it.

## 2. What the frozen head contains (latest three increments)

All are **implemented pending independent review**. Details are in the linked responses.

- **414b81b: R01–R03** ([response](2026-09-27-414b81b-claude.md)):
  - disputed event IDs earn no credit until a correction record settles them;
  - the schedule is part of the prescription version and of what confirmation covers;
  - eligibility follows the clock on screen, Start re-checks it, and sessions are bound to their occurrence and episode at start.
- **6bc4d77: EX06, P08 and the persistence fix** ([response](2026-09-27-6bc4d77-claude.md)):
  - EX06 (web focus view): the room is dimmed but no longer blurred, and a Focus/Plain switch is available during the exercise;
  - P08: clean test exits, by creating the store only in App and making the telemetry timer lazy;
  - redux-persist no longer times out and overwrites stored history.
- Earlier work: P01/P02 at a47ba14 ([response](2026-09-27-a47ba14-claude.md)) and the history in CURRENT.md.

## 3. Checks actually run on 6bc4d77

Environment: Linux cloud container, Node v22.22.2, Jest 29.7.0, TypeScript 5.3.3. Layer: synthetic logic and rendered React Native components under Jest. There was no native device, real camera or human testing. Logs: [evidence/2026-09-27-6bc4d77/](../evidence/2026-09-27-6bc4d77/run.json).

| Command                                                                                                          | Exit  | Result                                                                        |
| ---------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------- |
| `npx tsc --noEmit -p .` and `npx tsc --noEmit --project tsconfig.prepush.json`                                   | 0     | No errors                                                                     |
| `npx eslint src __tests__/setup.ts --quiet`                                                                      | 0     | 0 errors. Warnings exist; the independent Mac run counted 450                 |
| `./node_modules/.bin/jest --ci` (no `--forceExit`)                                                               | 0     | 1,593 passed, 4 skipped. No forced worker, no "did not exit", no late logging |
| `./node_modules/.bin/jest --ci --runInBand`                                                                      | 0     | Same counts; none of the three warnings                                       |
| `./node_modules/.bin/jest --ci --detectOpenHandles`                                                              | 0     | Same counts; 0 open handles                                                   |
| Each of the 91 suites alone (`--runTestsByPath <file> --runInBand`)                                              | all 0 | None kept Jest alive                                                          |
| Pre-push Integration file (`src/testing/__tests__/Integration.test.ts`)                                          | 0     | 21 tests actually ran                                                         |
| `persistence.test.ts` with the old 5 s timeout restored (falsifier)                                              | 1     | Fails as intended; passes with the fix                                        |
| Headless-Chromium web check of EX06, with a dataset clip as the fake camera (clip and screenshots not published) | 0     | Room legible; the switch flips Focus to Plain live                            |

**The 4 skipped suites are opt-in, not failures:**

- `src/__tests__/e2e/userWorkflows.test.ts` runs only under `DETOX_MODE`.
- These three need a local dataset folder and are skipped without one:
  - `src/testing/recordedPatient/__tests__/benchmark.test.ts` (`RECORDED_DIR`)
  - `src/testing/videoPatient/__tests__/mobiphysioPilot.test.ts` (`MOBIPHYSIO_DIR`)
  - `src/testing/videoPatient/__tests__/rehab24.test.ts` (`REHAB24_DIR`)
- The datasets are internal-only and not in Git.

**Independent confirmation:** the owner's Mac qualification (see CURRENT.md, "Permanent landing and reusable hybrid skill") retested P08 at 6bc4d77. Parallel and `--detectOpenHandles` runs gave 1,593 passed, 4 skipped, exit 0, and no forced-worker or open-handle warning.

## 4. CI results

| Revision                                   | Workflow runs                                                                                             | Result                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **6bc4d77** (PR #25)                       | `checks` 36290716007 and 36290713330; `ios-simulator` incl. Detox launch test 36290715989 and 36290713112 | **All success**                                                               |
| 414b81b and a47ba14 (PR #25)               | See `evidence/2026-09-27-414b81b/run.json` and `evidence/2026-09-27-a47ba14/run.json`                     | All success                                                                   |
| **PR #27 head 0ca6dbe** (not this agent's) | `ios-simulator` 36295560714 (job 108553768978)                                                            | **Failure.** The owner reports the failing step is **"Install pods"**. See §5 |

CI runs the Jest suite and an iOS-simulator smoke/Detox first-run flow. It does not exercise patient journeys, the focus view, or anything on a device.

## 5. Remaining failures and open integration issues

1. **PR #27 hosted iOS failure at "Install pods": open integration issue.** A local Mac build of the same change passed. That local build does **not** resolve the hosted failure. This agent has not investigated or changed it, and will not work on it concurrently unless the owner assigns it back.
   - Also on PR #27: the third-party "Sourcery review" check reports failure.
   - `checks` passed on PR #27.
2. **Storage read error (G02):** a _failed_ read from encrypted storage still rehydrates the empty state, and the next save can overwrite stored data. Only the _slow_-read case was fixed. This needs the G02 transactional storage work.
3. **Wording that implies a clinician relationship:** written for a clinician-linked product, it can wrongly imply monitoring or a waiting clinician in the patient-only MVP (EX08 / G05 / G10). Found during the final tool check; **not changed**, because the branch is frozen. Occurrences at 6bc4d77:
   - `src/screens/ProgressScreen.tsx:83`: "Your physiotherapist will look at the trend with you".
   - `src/screens/HomeScreen.tsx:109` and `src/components/exercises/TodayPrep.tsx:278`: "Your physiotherapist will confirm your exercises…" (the programme-waiting state). EX01 and the runbook say independent use must not display waiting for an absent clinician.
   - Set-up copy in `ExerciseChooser.tsx`, `PlanEditor.tsx` and `ExerciseSummary.tsx` ("Your physio…") needs rewording once D01/D05 settle who configures the programme.
4. **Lint warnings:** 0 errors, and the Mac run counted 450 warnings. They are pre-existing and not addressed.

## 6. Unfinished features (not started or partial; nothing silently discarded)

| Item                                                                                                                                                                                          | State at 6bc4d77                                                          | Gate    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------- |
| EX01: Today / My recovery / Help navigation                                                                                                                                                   | Not started (four tabs remain)                                            | G05/G07 |
| EX02: operation date, elapsed time, review/expiry state, transition modes                                                                                                                     | Not started; policy needs the owner                                       | G04     |
| EX03 / P03 / P04: exact source-bound variants (standard vs large-cuff vs accelerated repair; posterior vs anterior stabilisation; MPFL vs MPFL+TTO; assistance, posture and brace dimensions) | Not started; specialist-only gating prevents exposure; needs D05          | G04     |
| EX04: per-group sessions (membership, dose, schedule)                                                                                                                                         | Not started; the current single interval applies to all items             | G06     |
| EX05 / P05: Learn / Do / Check; camera-off Do; separate qualified Check                                                                                                                       | Not started ("I'm ready" still opens the camera)                          | G05     |
| EX07: type scale, Dynamic Type and VoiceOver verification                                                                                                                                     | Touch targets meet targets; text and assistive-technology checks not done | G07     |
| EX08: patient-owned appointment summary                                                                                                                                                       | Not started; needs G02 records                                            | G05     |
| G02: SQLite or transactional storage, migration, file protection, profile isolation                                                                                                           | Not started (only the persist timeout fixed)                              | G02     |
| G03: registration / onboarding semantics                                                                                                                                                      | Not started; needs D01/D03                                                | G03     |
| G06: native local reminders                                                                                                                                                                   | Not started                                                               | G06     |
| Native iOS focus view (segmentation)                                                                                                                                                          | Web only; native shows the plain camera                                   | G07/G09 |
| In-app correction of disputed records                                                                                                                                                         | Data mechanism only (`resolves`); no UI; authorisation question P11       | P11     |
| P06, P07, P10: approved-video journey, native and older-user usability, measurement repeatability                                                                                             | Not tested                                                                | G07–G10 |

## 7. Unresolved clinical and owner decisions

No clinical approval was obtained or implied. A development merge is not clinical approval or an App Store release.

- **C01–C08** ([protocols/APPROVALS.md](../protocols/APPROVALS.md)) are all open. In particular, **C05** covers the frozen-shoulder interval anchor, the per-movement dose, the rule that a begun mini-session closes when the waking window ends, and holds/rest. The frozen-shoulder draft is inactive.
- **D01–D08** ([runbooks/ios-patient-mvp/DECISIONS.md](../runbooks/ios-patient-mvp/DECISIONS.md)) are all open.
- From the EX review:
  - which phase transitions an approved source allows to be time-only;
  - whether activity continues or pauses once a review date passes;
  - the frozen-shoulder session-group membership;
  - the default picture (focus or plain) for assisted and lying-down exercises.
- **P11:** who may resolve disputed records.

## 8. Reusable test and browser scripts

All are published on this branch. None contains media, private paths or credentials.

- **[tools/claude-cloud/](../tools/claude-cloud/README.md)**:
  - `jest-clean-exit.sh` (three-mode clean-exit check);
  - `web-screenshots.js` (synthetic seeded patient screens, with optional axe-core);
  - `web-fake-camera-focus.js` and `make-fake-camera.py` (EX06 fake-camera check);
  - `commons_license.py` (licence lookup for public clips).
  - At handover both browser scripts were re-run from a checkout against a fresh 6bc4d77 web build, and they worked. The README records their limits, including a seed without the `method` field.
- Already in the application repository:
  - `scripts/fixtures/rehab24_pilot.sh` and `scripts/fixtures/rehab24_truth.py`;
  - the video-patient harnesses under `src/testing/videoPatient/` and `src/testing/recordedPatient/`;
  - benchmark reports in `docs/benchmarks/`.
- Archived reviewer tests: `tests/original-reviewer-tests.zip` with `tools/extract-reviewer-tests.py`.

## 9. What exists only in the temporary cloud environment (will be lost)

- **Not published, deliberately:**

  - research-dataset clips and derived files (REHAB24-6, MobiPhysio, KIMORE, stroke/telerehab samples, Zenodo downloads);
  - the `.y4m` fake-camera clip made from one of them;
  - screenshots of people.

  These are internal-only or licence-restricted. They can be re-obtained from their sources under their licences.

- **Raw logs:** full Jest logs (about 268k lines each). Their summaries and pass/fail lists are in the evidence folders. The web builds and local browser output were regenerated for checks only.
- **Superseded scratch copies:** the original un-cleaned versions of the §8 scripts.
- **No application code, test or handover document remains uncommitted.**

## 10. Scheduled actions and subscriptions

- All check-ins this session created were one-shot routines that have already fired and are disabled. **None is enabled**, so none can make further changes.
- This session unsubscribed from PR #25 activity events. It was never subscribed to PR #27.

## 11. Suggested pickup for the receiving agent

1. Read CURRENT.md, this file, and the iOS MVP runbook's STATUS.json. G00 is still the current gate, and no gate is accepted.
2. Treat 6bc4d77 as the application basis. Rebase or merge PR #27's infrastructure on top only through your own reviewed branch.
3. Resolve PR #27's hosted "Install pods" failure as an integration task. A local Mac success is not evidence for the hosted runner.
4. Test the combined revision: the three Jest modes with `tools/claude-cloud/jest-clean-exit.sh`, hosted CI, and a native simulator journey. Then seek the owner's merge decision.
5. Next product scope remains the iPhone patient-only, local-first MVP: G01 independent retest, then G02 storage (including the read-error path in §5) and the clinician-wording fix before any pilot.

Independent verification of R01–R03, EX06 and the persistence fix is still pending. P08 has one independent confirmation (§3).
