// Screenshots of the patient views with synthetic seeded state (web build).
// Usage: OUT=dir node web-screenshots.js '[[390,844]]' home,exercise,progress
// Steps: home, exercise, progress, setup, ready, practice, stop, scroll. FRESH=1: no history. AXE=1: axe-core.
const path = require('path');
const { playwright, OUT, launchOptions, seed } = require('./_browser');

const sizes = JSON.parse(process.argv[2] || '[[390,844]]');
const steps = (process.argv[3] || 'home,exercise,progress').split(',');
const today = new Date();
today.setHours(9, 0, 0, 0);
const day = (d) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString();
};
// Synthetic plan: illustrative numbers only, not a prescription
const plan = {
  joint: 'knee',
  side: 'left',
  extensionGoalDegrees: 5,
  goalDegrees: 100,
  version: 2,
  routine: [
    { exerciseId: 'heel-prop-extension', holdSeconds: 60 },
    { exerciseId: 'seated-knee-extension', reps: 12 },
    { exerciseId: 'seated-knee-flexion', reps: 10 },
  ],
};
const h = (id, name, date, extra) => ({
  id: id + date,
  exerciseId: id,
  exerciseName: name,
  date,
  reps: 10,
  duration: 90,
  formScore: 0.8,
  joint: 'left_knee',
  direction: 'toward',
  ...extra,
});
const history = process.env.FRESH
  ? []
  : [
      h('heel-prop-extension', 'Heel prop', day(0), {
        reps: 0,
        duration: 64,
        bestDegrees: 7,
        planVersion: 2,
        completion: 'completed',
      }),
      h('seated-knee-extension', 'Seated knee straightening', day(-1), {
        bestDegrees: 9,
        planVersion: 2,
        completion: 'completed',
      }),
      h('seated-knee-extension', 'Seated knee straightening', day(-3), {
        bestDegrees: 12,
        planVersion: 2,
        completion: 'completed',
      }),
      h('seated-knee-extension', 'Seated knee straightening', day(-6), {
        measured: false,
        planVersion: 2,
        completion: 'completed',
      }),
      h('seated-knee-extension', 'Seated knee straightening', day(-12), {
        bestDegrees: 18,
        planVersion: 1,
        completion: 'completed',
      }),
    ];

(async () => {
  const browser = await playwright().chromium.launch(launchOptions());
  for (const [w, hgt] of sizes) {
    const page = await browser.newPage({
      viewport: { width: w, height: hgt },
      deviceScaleFactor: 2,
    });
    await seed(page, { exercisePlan: plan }, history);
    for (const step of steps) {
      if (step === 'exercise') await page.getByTestId('tab-exercises').click();
      if (step === 'progress') await page.getByTestId('tab-progress').click();
      if (step === 'home') await page.getByTestId('tab-home').click();
      if (step === 'setup') await page.getByTestId('exercise-setup-open').click();
      if (step === 'ready') await page.getByTestId('start-routine-button').click();
      if (step === 'practice') {
        await page.waitForTimeout(1500);
        await page.getByTestId('use-practice-mode').click();
        await page.waitForTimeout(9000);
      }
      if (step === 'stop') await page.getByTestId('exercise-end').click();
      if (step === 'scroll') await page.mouse.wheel(0, 700);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(OUT, `${step}-${w}x${hgt}.png`) });
      if (process.env.AXE) {
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const res = await page.evaluate(async () =>
          (await axe.run(document, { resultTypes: ['violations'] })).violations.map(
            (v) => ({ id: v.id, impact: v.impact, n: v.nodes.length })
          )
        );
        console.log(step, w, JSON.stringify(res));
      }
    }
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
