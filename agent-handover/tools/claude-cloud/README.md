# Reusable check scripts from the Claude cloud session

These are copies of scripts used by the implementation agent in its temporary cloud container. They are published here so they survive that container. Absolute paths have been replaced by arguments and environment variables. **No media is included.** They are test aids, not application code. A passing run is not clinical, native or accessibility acceptance.

| Script | What it does | Used for |
|---|---|---|
| `jest-clean-exit.sh` | Runs typecheck, lint and the full Jest suite three ways: parallel, `--runInBand` and `--detectOpenHandles`. It never uses `--forceExit`. It reports exit status and counts of forced-worker, "did not exit", late-logging and open-handle warnings. With `PER_SUITE=1` it also runs every suite alone. | P08 evidence at 6bc4d77 |
| `web-screenshots.js` | Seeds a **synthetic** local profile, plan and history into the production web build's localStorage, walks the listed tabs/steps and takes screenshots. Optionally runs axe-core. | Patient-view and Progress layout checks |
| `web-fake-camera-focus.js` | Starts a routine exercise with a fake camera, captures the focus view, presses the Focus/Plain switch and captures the plain view. | EX06 check at 6bc4d77 |
| `make-fake-camera.py` | Converts a video into the `.y4m` file that Chromium's fake camera plays. | Input for the script above |
| `commons_license.py` | Searches Wikimedia Commons for videos and prints licence, author and URL metadata for chosen files. | Provenance of public test clips |

## Rules for use

- A fake-camera clip must be synthetic, consented, or licensed for this use. Keep it outside Git. Research datasets (for example REHAB24-6, CC BY-NC) are internal-only; never publish frames or screenshots derived from them.
- Screenshots of seeded synthetic state may be published. Screenshots showing a real person need the same consent as the clip.
- These run against the **web** build. They say nothing about native iOS rendering, Dynamic Type, VoiceOver or camera behaviour.

## Setup (any machine)

```sh
# From the repository root
npx webpack --mode production --config webpack.config.js      # builds ./dist
(cd dist && python3 -m http.server 8765) &                      # serve it
npm i --no-save playwright axe-core                             # or a global Playwright
# Chromium: Playwright's own, or pass CHROMIUM_PATH=/path/to/chrome
```

Examples:

```sh
OUT=/tmp/shots node agent-handover/tools/claude-cloud/web-screenshots.js '[[390,844],[1024,1366]]' home,exercise,progress
python3 agent-handover/tools/claude-cloud/make-fake-camera.py my-licensed-clip.mp4 /tmp/fakecam.y4m
OUT=/tmp/shots FAKE_CAMERA=/tmp/fakecam.y4m node agent-handover/tools/claude-cloud/web-fake-camera-focus.js
PER_SUITE=1 sh agent-handover/tools/claude-cloud/jest-clean-exit.sh /tmp/jest-logs
```

The camera script serves MediaPipe's model files from `node_modules/@mediapipe/pose` when `LOCAL_MEDIAPIPE=1` is set. The cloud container's proxy certificate was not trusted by headless Chrome, and this avoids the CDN without disabling TLS.

## Known limits (checked 2026-09-27 against application 6bc4d77)

- Both browser scripts were run from a repository checkout against a fresh production web build of 6bc4d77, with `CHROMIUM_PATH` set. Screenshots rendered; the fake-camera script found the switch and flipped it from Focus to Plain.
- `LOCAL_MEDIAPIPE=1` logs several 404s for optional MediaPipe files that the npm package does not ship. Detection still runs.
- `web-screenshots.js` seeds history **without** the `method` field introduced for method-based measurement series. Its Progress screen therefore shows the legacy "Measured differently before" state. Add `method` to the seed to exercise current-method series.
- `jest-clean-exit.sh` is the portable form of the command sequence behind `evidence/2026-09-27-6bc4d77/`; that evidence was produced by the equivalent inline commands.
