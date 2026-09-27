// EX06 check: focus view, then the Focus/Plain switch, with Chromium's fake camera (web build).
// Usage: OUT=dir FAKE_CAMERA=clip.y4m [LOCAL_MEDIAPIPE=1] node web-fake-camera-focus.js
// The clip must be synthetic, consented or licensed; keep it and any screenshots of a person out of Git.
const path = require('path');
const { playwright, OUT, launchOptions, routeMediapipe, seed } = require('./_browser');

if (!process.env.FAKE_CAMERA) throw new Error('Set FAKE_CAMERA to a .y4m file (see make-fake-camera.py)');

(async () => {
  const browser = await playwright().chromium.launch(launchOptions([
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    `--use-file-for-fake-video-capture=${path.resolve(process.env.FAKE_CAMERA)}`,
    '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
  ]));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['camera'] });
  const page = await ctx.newPage();
  await routeMediapipe(page);
  page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text().slice(0, 200)); });
  await seed(page, {
    showJointAngles: true, cameraFocus: true, enableSpeech: false,
    exercisePlan: { joint: 'shoulder', side: 'left', version: 1, routine: [{ exerciseId: 'arm-raise', reps: 10 }] },
  });
  await page.getByTestId('tab-exercises').click();
  await page.waitForTimeout(1000);
  await page.getByTestId('start-routine-button').click();
  await page.waitForTimeout(9000);
  await page.screenshot({ path: path.join(OUT, 'focus.png') });
  const sw = page.getByTestId('camera-focus-switch');
  console.log('switch present:', await sw.count(), 'checked:', await sw.getAttribute('aria-checked'));
  await sw.click();
  await page.waitForTimeout(3000);
  console.log('after press checked:', await sw.getAttribute('aria-checked'), 'label:', await sw.innerText());
  await page.screenshot({ path: path.join(OUT, 'plain.png') });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
