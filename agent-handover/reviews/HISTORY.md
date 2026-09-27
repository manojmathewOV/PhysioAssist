# Review history and superseded expectations

These are historical observations, not current CI status.

| Application | Existing suite | Independent review | Later disposition |
|---|---|---|---|
| 06e77dd | 1,465 passed; 4 skipped | 2 controls passed; 7 checks failed | Measurement fallback, discontinuous holds, framing and media preservation were subsequently addressed; the rotation-limit assumption was refined. |
| 29e6e14 | 1,502 passed; 4 skipped | 12 passed; 7 failed | Warning precedence, side/completion, static prescription propagation, wording and Progress were addressed by later changes; reverify at the current SHA. |
| b06be91 | 1,524 passed; 4 skipped | Pause/display-versus-completion integration failed | Subsequent implementation introduced one shared clock. The old test reconstructs the old wall-time calculation. |
| c7ac7f3 | 1,550 passed; 4 skipped | Protocol-fit: 4 passed; 2 failed | Replay handling and interval scheduling remain open in the pinned review. |

The b06be91 cloud review also recorded 14,008 actual-module cases (14,000 pass, 8 fail), a proposed policy model with 36,878 passing cases and 13 detected omitted-guard mutations, and 29 refined checks. Those full models and logs are not part of this public transfer. Counts do not establish clinical correctness; they are retained here only as reported historical scope.

The later protocol-specific Python model recorded 43 named passing checks. It was a separate proposed model, not the production implementation. Its private-source rule payload is not published here.

## Do not regress the refinements

The original 06e77dd test treated a generic shoulder limit as an external-rotation limit. Later requirements make the quantity explicit and separate a clinical restriction from camera verifiability. Do not restore the ambiguous limit to satisfy that old test.

The 29e6e14 plan-version baseline test predates method-based comparison. Current interpretation is that a dose change alone need not split a series; assistance, method, side and appropriate episode context determine compatibility.

The original b06be91 clock test computes wall time itself. A valid current regression must use the actual shared-clock consumers, not deliberately reinsert the old formula and claim a new failure.

The c7ac7f3 interval test is a specification-gap demonstration. It does not encode a schedule because the reviewed application had no interval schema. Retain the original, then create a current acceptance test against the approved new schedule contract.
