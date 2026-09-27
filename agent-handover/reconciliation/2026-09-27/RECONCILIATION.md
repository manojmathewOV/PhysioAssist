# Reconciliation of frozen work and roadmap

## Exact inputs

Claude application: `6bc4d77f9ee9bbe95ef181d50fbaf94cf2388f84`. Infrastructure/skill: `0ca6dbe166df2cdba36477f8bae316fe56308aae`. Handover/research: `510e799c0676ced95de333dd55a59fbe26333f64`. Unchanged main: `d045d460800a9d50db30ab3df4b836e99406a0dd`. Ancestry-preserving local integration parent: `88918e77162a8491beb06c3e7615419a40b30630`.

All three inputs are ancestors, not copied patches. Original source/review/helper/test-archive blobs are retained. Historical CURRENT/README/backlog/plan snapshots were hash-preserved in `archive/2026-09-27-before-reconciliation`. Only mutable orientation and planning documents are revised. Original findings/responses remain intact.

## Dispositions

| Item                                                                 | Reconciled status                                                              | Next                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- |
| Claude pending work                                                  | Frozen; no uncommitted work or enabled actions according to his final handover | Claude independent review only unless assigned |
| P08                                                                  | Independently observed clean on 6bc4d77                                        | Preserve and rerun after integration           |
| R01-R03                                                              | Implemented; target-specific independent replay still needed                   | G01                                            |
| Strict native dependencies                                           | Hosted failure remains; local and hosted CocoaPods differ                      | G01/I01, do not remove strict check            |
| Slow storage read                                                    | Author fix; historical test evidence retained                                  | Preserve                                       |
| Failed storage read                                                  | Separate reported overwrite risk                                               | G02/I02 reproduce and contain                  |
| Clinician-relationship copy                                          | Inappropriate to independent patient MVP in listed places                      | G03/G05/I03                                    |
| Learn/Do/Check, variants, phases, session groups                     | Remaining capability, not a renamed old test                                   | G04-G07                                        |
| Native focus/full rehab, approved media and human accuracy/usability | Not validated by native onboarding or web images                               | G07-G10                                        |
| Dataset media and raw cloud logs                                     | Deliberately absent/private, not lost source code                              | Source/licence checks when needed              |

## Branch policy

`BRANCHES.json` is the current map. Publish one integration successor and preserve exact predecessor tags before closing superseded PRs. Keep the predecessor branches as read-only checkpoints by convention; no forced push or deletion of unique work. Unrelated old branches were not evaluated or removed. Main remains unchanged pending the combined CI/review/owner decision.

## Runbook change

G00-G10 identities are retained. Revision 2 adds stable criterion IDs, evidence kinds, targeted new failure cases, work-item start/stop conditions, explicit closure dependencies, independent acceptance and E0-E4 endpoints. Gate declarations, observed evidence and acceptance are different objects. No gate is accepted by this update.

## CCore boundary

The installed tools were invoked, not merely named. The old ROADMAP used a different header/row dialect and received `@:auth` refusal. The actual current definition grammar was inspected; its R3/semantic-authority header is a required declaration-shape token, with run nodes restricted to `declared` and terminal acceptance fixed to an independent meet. It is not a claim that clinical/implementation review has occurred. The new generated representation follows that grammar. Exact final response, including any remaining refusal, is in `runbooks/ios-patient-mvp/evidence/ccore-reconciliation.json`.

Native Research/TaskEpoch admission is not fabricated. The portable research register retains source/uncertainty/falsifier mapping without creating another runtime store. Project Cosmos source and its active lane runbooks were not modified.

## Validation record

See `validation.json` after execution. Structure/mutation tests are plan tests, not patient trials. Existing application suite results are reported only when actually rerun on the combined candidate. Hosted native failure is not erased by a green local unit run.
