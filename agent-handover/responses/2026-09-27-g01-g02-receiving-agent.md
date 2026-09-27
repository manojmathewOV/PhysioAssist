# G01 native portability and G02 saved-progress recovery

Implementation by receiving agent, 2026-09-27. PR #28 remains draft; no main merge, clinical approval or gate acceptance.

## Delivered

**I01 / G01.W1:** pinned Ruby 3.4.5, CocoaPods 1.16.2, JSON 2.9.1, Xcodeproj 1.27.0 and transitive gems. Both local execution and hosted CI use the same frozen wrapper; neither lock is silently regenerated and pipeline failures remain failures. The runner reuses the existing local Ruby/gems rather than installing another copy.

Commits: `4064e80` (toolchain/wrapper) and `707a6e7` (hosted workflow). The workflow edit used the separately authorised GitHub connection because the Mac credential lacks workflow scope. That API write did not run local hooks; code commits did. No scopes or credentials were changed.

Hosted run [36304301981](https://github.com/manojmathewOV/PhysioAssist/actions/runs/36304301981) on 707a6e7 passed installation, Release build, launch smoke and selected Detox. Downloaded artifact 10926459954 in the cloud, verified its supplied SHA-256, and inspected its native Home screenshot. It is the no-routine demo state, not an approved treatment journey. Gem/Pod lock hashes in its log exactly match the Mac. The artifact expires 2026-10-11; the compact record retains its identity/digest, not an expiring signed URL.

**I02 / G02.W1:** first reproduced the production defect: a rejected history read replaced an existing synthetic record with an empty history. Commit `dd7f504` holds failed reads pending, provides an explicit retry, and gates navigation until both persistence branches finish restoring. It does not purge/reset, auto-retry or log raw stored data. A genuinely absent record may initialise normally; invalid saved history remains blocked. This is read-error containment, not the database migration or a claim that write failures are solved.

The recovery screen has a large labelled Retry action, a plain explanation, and warns against deleting/reinstalling as a repair. A real production-web journey with a synthetic storage exception preserved the exact bytes, blocked normal navigation and restored the same record after Retry. Its 320-pixel screen was actually inspected.

## Native scrutiny found a second local-workflow issue

The first local simulator process stayed running but displayed the recovery screen: this was **not** accepted as an ordinary-start success. A temporary diagnostic emitted no patient values or exception text and was retired; it did not yield a numeric Keychain error code, so none is asserted.

With identical committed application code and Xcode's simulator-only ad-hoc signing instead of signing disabled, the app reached normal onboarding. `1c539a5` updates the local build command to `CODE_SIGN_IDENTITY=-` and enables signing for the simulator. No developer certificate, device provisioning, distribution signing or global setting was used. The unsigned and ad-hoc screenshots remain in evidence; no error was relabelled as an absent record to bypass the guard.

The reusable skill is now 1.1, with explicitly configured local Ruby paths and 25 passing runner tests. Local install hashes were checked before replacing the skill files. The installed `pods` command was then retested successfully without manual environment overrides.

## Executed evidence

See [the run record](../evidence/2026-09-27-g01-g02/run.json).

| Check | Result and boundary |
|---|---|
| Exact committed-code full suite at 1c539a5 | 1,601 passed, four opt-in skipped, 89 suites passed, exit 0, no forceExit or teardown warning |
| Focused persistence and rendered-boundary tests | 10 passed, including eight new tests |
| Omit the read guard (prior production wiring) | The saved-byte regression fails as intended; source restored before further checks |
| TypeScript | Normal and pre-push configurations passed |
| Lint | 0 errors, 456 warnings in the recorded full scan; not described as warning-free |
| Native-wrapper checks | Four passed: frozen success, original failure propagation, missing bundle and lock mutation |
| Workflow runner | 25 passed, including explicit simulator-only signing and missing/configured Ruby behaviour |
| Browser | Synthetic exception -> blocked screen -> retry -> original record -> normal onboarding; no real camera/patient |
| Local native | Release build and native screenshot inspection; initial unsigned blocked state and corrected ad-hoc onboarding both retained |
| Hosted native at 707a6e7 | Install/build/smoke/Detox passed; later application changes need their own hosted run |

No dependency tree or repository was cloned, and no new local gems were installed. One existing native cache was reused. Simulator/server jobs were shut down. Five pre-existing web sound-file 404s were observed and are not fixed by this patch.

## Progress, limitations and next slice

I01 and the I02 containment implementation are submitted for independent review, not self-accepted. G01 and G02 remain open gates. Clinical/owner C/D decisions are unchanged. No native storage-fault injection, physical-device evaluation, measurement study or approved clinical video was performed.

Next: complete the latest hosted check and independent review, then G02 transactional/paginated storage with migration rollback, explicit durable-write acknowledgement, file protection/backup policy and profile ownership. Do not replace the current store until its recoverable migration and D03/D06 decisions are established. Existing read-error protection must be retained and adapted through that migration.
