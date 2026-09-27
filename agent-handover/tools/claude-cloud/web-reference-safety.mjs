// Synthetic production-web regression. No footage, patient data or real camera.
// Required env: PLAYWRIGHT_MODULE, CHROMIUM_PATH, OUT, BASE_URL, SOURCE_SHA.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const out = process.env.OUT;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
const result = { source_sha: process.env.SOURCE_SHA, scope: 'synthetic practice, production web; no native or clinical validation', screens: [], errors: [] };
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(20000);
page.on('pageerror', error => result.errors.push(error.message));
try {
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('persist:root'));
    root.user = JSON.stringify({ currentUser: { id: 'synthetic', name: 'Synthetic test', email: 'test@example.com' }, isAuthenticated: true, hasCompletedOnboarding: true, isLoading: false, error: null });
    root.settings = JSON.stringify({ ...JSON.parse(root.settings), exercisePlan: {
      joint: 'shoulder', side: 'left', version: 1, goalDegrees: 90, reps: 2,
      episode: { id: 'synthetic-episode', pathway: 'frozen_shoulder', phase: 'symptom_limited', confirmedAt: '2026-09-27' },
      routine: [{ exerciseId: 'arm-raise', reps: 2, goalDegrees: 90 }],
      reference: { exerciseId: 'arm-raise', source: 'demonstration', savedAt: '2026-09-27', repCount: 3, peakDegrees: 164, bestDegrees: 164, restDegrees: 0, repDurationMs: 1000, holdMs: 0 }
    } });
    localStorage.setItem('persist:root', JSON.stringify(root));
    localStorage.setItem('persist:exercise', JSON.stringify({ history: '[]', _persist: JSON.stringify({ version: -1, rehydrated: true }) }));
  });
  await page.reload();
  await page.getByTestId('tab-exercises').click();
  await page.getByTestId('start-routine-button').click();
  await page.getByTestId('use-practice-mode').click();
  await page.getByTestId('exercise-end').waitFor();
  await page.waitForTimeout(11500);
  await page.getByTestId('exercise-end').click();
  await page.getByTestId('movement-coaching-limited').waitFor();
  for (const [width, height] of [[390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const text = await page.locator('body').innerText();
    assert.doesNotMatch(text, /go a little further|straighten.*more|all the way back|hold.*longer|nothing to correct/i);
    assert.equal(await page.getByTestId('finding-reduced_range').count(), 0);
    assert.doesNotMatch(text, /Excellent form|Rest for a minute|New personal best/i);
    await page.getByTestId('movement-coaching-limited').scrollIntoViewIfNeeded();
    assert.equal(await page.getByTestId('movement-coaching-limited').isVisible(), true);
    const name = `comfort-summary-${width}.png`;
    await page.screenshot({ path: path.join(out, name), fullPage: true });
    result.screens.push({ name, text });
  }
  const history = await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('persist:exercise')).history));
  assert.equal(history.length, 0, 'Practice must not create treatment history');
  assert.equal(result.errors.length, 0, 'No app runtime errors');
  result.status = 'passed';
} catch (error) {
  result.status = 'failed'; result.error = String(error);
  await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'passed') process.exitCode = 1;
}
