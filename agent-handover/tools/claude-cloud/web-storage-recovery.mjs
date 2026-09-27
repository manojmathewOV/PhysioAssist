// G02/I02: real web app, synthetic storage fault; no camera or patient data.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

for (const key of ['PLAYWRIGHT_MODULE', 'CHROMIUM_PATH', 'BASE_URL', 'OUT']) {
  if (!process.env[key]) throw new Error(`Set ${key} explicitly`);
}
const { chromium } = await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)));
const out = path.resolve(process.env.OUT);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const saved = JSON.stringify({ history: JSON.stringify([{ id: 'synthetic-retained-session' }]), _persist: '{}' });
const result = { fixture: 'synthetic read exception followed by success', status: 'running', assertions: [] };
try {
  await page.addInitScript((bytes) => {
    localStorage.setItem('persist:exercise', bytes);
    const original = Storage.prototype.getItem;
    let failOnce = true;
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && key === 'persist:exercise' && failOnce) {
        failOnce = false;
        throw new Error('Synthetic saved-state read failure');
      }
      return original.call(this, key);
    };
  }, saved);
  await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('storage-retry').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('persist:exercise')), saved);
  result.assertions.push('failed read preserves exact saved bytes');
  assert.equal(await page.getByTestId('onboarding-get-started').count(), 0);
  result.assertions.push('ordinary app navigation withheld on failure');
  await page.screenshot({ path: path.join(out, 'storage-read-blocked-390.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 568 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await page.screenshot({ path: path.join(out, 'storage-read-blocked-320.png'), fullPage: true });
  await page.getByTestId('storage-retry').click();
  await page.getByTestId('onboarding-get-started').waitFor();
  const retained = await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('persist:exercise')).history));
  assert.equal(retained[0].id, 'synthetic-retained-session');
  result.assertions.push('retry restores saved record before normal navigation');
  await page.screenshot({ path: path.join(out, 'storage-read-recovered.png'), fullPage: true });
  result.status = 'passed';
} catch (error) {
  result.status = 'failed';
  result.error = String(error);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2));
  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}
