#!/usr/bin/env node
// Isolated production components with explicit example records, never a patient input route.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const [repoArg, outArg, playwright, chrome] = process.argv.slice(2);
if (![repoArg, outArg, playwright, chrome].every(Boolean))
  throw Error('Usage: REPO OUTPUT PLAYWRIGHT CHROME');
const repo = path.resolve(repoArg),
  out = path.resolve(outArg),
  bundle = path.join(out, 'bundle');
if (out.startsWith(repo + path.sep)) throw Error('Output must be outside Git');
fs.mkdirSync(out, { recursive: true });
const load = createRequire(path.join(repo, 'package.json'));
const config = load(path.join(repo, 'webpack.config.js'))({}, { mode: 'production' });
config.mode = 'production';
config.entry = path.join(repo, 'src/testing/sleeperResultPreview.tsx');
config.output = { path: bundle, filename: 'preview.js', clean: true };
config.optimization = { minimize: false };
config.devtool = false;
await new Promise((resolve, reject) =>
  load('webpack')(config, (error, stats) => {
    if (error || stats.hasErrors())
      return reject(error || Error(stats.toString({ all: false, errors: true })));
    fs.writeFileSync(
      path.join(out, 'build.txt'),
      stats.toString({ all: false, warnings: true, assets: true })
    );
    resolve();
  })
);
const server = http.createServer((req, res) => {
  const name = req.url === '/' ? 'index.html' : path.basename(req.url.split('?')[0]);
  const file = path.join(bundle, name);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    name.endsWith('.js')
      ? 'text/javascript'
      : name.endsWith('.ttf')
        ? 'font/ttf'
        : 'text/html'
  );
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { chromium } = await import(pathToFileURL(path.join(playwright, 'index.mjs')).href);
let browser;
const report = {
  sourceSha: execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim(),
  scope:
    'Synthetic standalone production-component preview, not patient measurement or native visual validation',
  checks: [],
  errors: [],
  screens: [],
};
const check = (name, result) => {
  assert.ok(result, name);
  report.checks.push(name);
};
try {
  browser = await chromium.launch({ headless: true, executablePath: chrome });
  for (const width of [320, 390, 820]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 320 ? 568 : 900 },
    });
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByTestId('sleeper-current').waitFor();
    for (const scenario of [
      'current',
      'moved',
      'uncertain',
      'unavailable',
      'unsaved',
      'first',
      'partial-history',
      'right',
      'changed-method',
      'blocked',
    ]) {
      await page.evaluate((name) => window.showSleeperExample(name), scenario);
      await page.waitForTimeout(60);
      const hasNumber = [
        'current',
        'unsaved',
        'first',
        'partial-history',
        'right',
      ].includes(scenario);
      check(
        `${width}/${scenario}/headline`,
        (await page.getByTestId('sleeper-current').count()) > 0 === hasNumber
      );
      check(
        `${width}/${scenario}/synthetic-label`,
        await page.getByTestId('sleeper-synthetic').isVisible()
      );
      if (scenario === 'moved')
        check(
          `${width}/excluded-not-best`,
          (await page.getByTestId('sleeper-excluded').innerText()).includes('50') &&
            (await page.getByTestId('sleeper-best').innerText()).includes('45')
        );
      if (
        scenario === 'unavailable' ||
        scenario === 'uncertain' ||
        scenario === 'changed-method'
      )
        check(
          `${width}/${scenario}/no-false-pose`,
          (await page.getByTestId('sleeper-schematic').count()) === 0
        );
      if (scenario === 'first')
        check(
          `${width}/first-no-duplicate`,
          (await page.getByTestId('sleeper-best').count()) === 0
        );
      if (scenario === 'unsaved')
        check(
          `${width}/unsaved-not-best`,
          (await page.getByTestId('sleeper-best').innerText()).includes('45')
        );
      check(
        `${width}/${scenario}/no-horizontal-overflow`,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      );
      if (
        width < 400 &&
        ['current', 'unavailable', 'moved', 'unsaved'].includes(scenario)
      ) {
        const name = `${scenario}-${width}.png`;
        await page.screenshot({ path: path.join(out, name) });
        report.screens.push(name);
      }
    }
    await page.evaluate(() => window.showSleeperExample('current'));
    await page.getByTestId('sleeper-details').click();
    check(
      `${width}/explanation`,
      (await page.getByTestId('sleeper-explanation').innerText()).includes('not a target')
    );
    if (width === 320) {
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('[dir="auto"]')) {
          const style = getComputedStyle(el);
          const size = parseFloat(style.fontSize);
          el.style.fontSize = `${size * 2}px`;
          el.style.lineHeight = `${size * 2.7}px`;
        }
      });
      check(
        '320/doubled-web-text/no-horizontal-overflow',
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      );
      await page.getByTestId('sleeper-current').scrollIntoViewIfNeeded();
      check(
        '320/doubled-web-text/qualifier-not-fragmented',
        await page
          .getByTestId('sleeper-approx-label')
          .evaluate(
            (el) =>
              el.getBoundingClientRect().height <=
              parseFloat(getComputedStyle(el).lineHeight) * 1.2
          )
      );
      await page.screenshot({ path: path.join(out, 'current-large-web-text-320.png') });
      report.screens.push('current-large-web-text-320.png');
    }
    await page.getByTestId('sleeper-done').click();
    check(
      `${width}/Done-no-save`,
      (await page.getByTestId('example-done').innerText()).includes('No data saved')
    );
    await page.close();
  }
  check('no-runtime-errors', report.errors.length === 0);
  report.complete = true;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
