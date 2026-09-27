// Shared helpers for the web check scripts (Playwright + the production web build).
const fs = require('fs');
const path = require('path');

function playwright() {
  try {
    return require('playwright');
  } catch {
    const root = require('child_process').execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:8765/';
const OUT = process.env.OUT || './web-check-output';
fs.mkdirSync(OUT, { recursive: true });

function launchOptions(extraArgs = []) {
  const opts = { args: extraArgs };
  if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  return opts;
}

/** Serve MediaPipe files from node_modules instead of the CDN (LOCAL_MEDIAPIPE=1). */
async function routeMediapipe(page) {
  if (!process.env.LOCAL_MEDIAPIPE) return;
  const dir = path.resolve('node_modules/@mediapipe/pose');
  await page.route('https://cdn.jsdelivr.net/npm/@mediapipe/pose/**', (route) => {
    const file = path.join(dir, route.request().url().split('/').pop().split('?')[0]);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404 });
    const type = file.endsWith('.wasm')
      ? 'application/wasm'
      : file.endsWith('.js')
        ? 'text/javascript'
        : 'application/octet-stream';
    return route.fulfill({
      status: 200,
      body: fs.readFileSync(file),
      contentType: type,
      headers: { 'access-control-allow-origin': '*' },
    });
  });
}

/** Seeds a synthetic signed-in profile, settings patch and optional history, then reloads. */
async function seed(page, settingsPatch, history) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(2500);
  const root = JSON.parse(
    await page.evaluate(() => localStorage.getItem('persist:root'))
  );
  const user = {
    currentUser: { id: 'demo', name: 'Demo Patient', email: 'demo@example.com' },
    isAuthenticated: true,
    hasCompletedOnboarding: true,
    isLoading: false,
    error: null,
  };
  root.user = JSON.stringify(user);
  root.settings = JSON.stringify({ ...JSON.parse(root.settings), ...settingsPatch });
  await page.evaluate(
    ([r, hist]) => {
      localStorage.setItem('persist:root', r);
      if (hist)
        localStorage.setItem(
          'persist:exercise',
          JSON.stringify({
            history: JSON.stringify(hist),
            _persist: JSON.stringify({ version: -1, rehydrated: true }),
          })
        );
    },
    [JSON.stringify(root), history || null]
  );
  await page.reload();
  await page.waitForTimeout(2500);
}

module.exports = { playwright, BASE_URL, OUT, launchOptions, routeMediapipe, seed };
