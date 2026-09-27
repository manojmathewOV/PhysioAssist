# Original reviewer tests

`original-reviewer-tests.zip` contains four test sources copied byte-for-byte from the earlier review bundles, plus MANIFEST.json. Its SHA-256 is `a5741c2217071272157c57e7825298e42a84e63b5bf614891a681647fd8e7d23`.

| Member | Original application SHA |
|---|---|
| `06e77dd/review.acceptance.test.ts` | `06e77ddcbf6a49c043423d98035f130120b7effe` |
| `29e6e14/review.followup.test.tsx` | `29e6e1477139105eb4f0ea86eb73ef7fc58f1848` |
| `b06be91/review.clinicalJourney.test.tsx` | `b06be91e88472d43ac362b983d3b773a4c8409a2` |
| `c7ac7f3/review.protocols.test.ts` | `c7ac7f3bdda47ab736553b25bdca6f4100a8f74b` |

The archive keeps historical failing tests out of automatic Jest, TypeScript and lint discovery. Do not unpack it into the normal source tree wholesale. Read ../reviews/HISTORY.md first: some expectations have been superseded.

## Verify and read without installing dependencies

From the repository root:

```sh
python3 agent-handover/tools/extract-reviewer-tests.py --verify-only
python3 agent-handover/tools/extract-reviewer-tests.py --dest /tmp/physioassist-reviewer-tests
```

The helper refuses to overwrite an existing destination. It verifies both the archive hash and the four original source hashes before extraction. No network or access to the owner's computer is needed.

## Reproduce a historical result

Use a separate worktree at the SHA from the table; do not reset the active implementation branch. After extraction, copy the single chosen test into that worktree's `__tests__/` directory (its imports are relative to that location). Install dependencies using the repository's documented CI/runtime settings, then run, for example:

```sh
./node_modules/.bin/jest --runTestsByPath __tests__/review.protocols.test.ts --runInBand --watchman=false
```

A nonzero exit is expected for documented failing probes on their original revision. Capture the actual command/exit; do not suppress it with `|| true`. Earlier runs used `--forceExit` because of open handles. Using it again must be disclosed and does not demonstrate clean shutdown.

## Add a current regression

Read the original case and its disposition. Adapt to current APIs in a NEW file near the responsible subsystem. Test the actual reducer, UI, speech selector, clock consumer and persistence path where relevant. Reference the original finding ID and explain changes. Preserve the archived bytes.

Only the original source files are transferred here. Full raw historical browser logs/screenshots and the private-source simulation models are not represented as available when they are not in this folder.
