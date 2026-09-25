/**
 * REHAB24-6 benchmark report: shoulder (arm abduction, arm V-W) and knee
 * (lunge, squat) exercises filmed by two cameras, run through the app's pose
 * model and session pipeline, against motion capture and the
 * physiotherapist's correct/incorrect labels. Internal exploratory
 * benchmarking only (CC BY-NC 4.0; data never committed).
 *
 *   scripts/fixtures/rehab24_pilot.sh <dir>
 *   REHAB24_DIR=<dir> [REHAB24_GROUPS=inspection,validation] \
 *   [REHAB24_OUT=out.md] [REHAB24_JSON=reps.json] \
 *     npx jest src/testing/videoPatient/__tests__/rehab24.test.ts
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import {
  CameraRecord,
  FrameRecord,
  LabelledRep,
  REHAB24_EXERCISES,
  RepRecord,
  Truth,
  evaluateCamera,
  groupOf,
  parseSegmentation,
} from '../rehab24';
import type { VideoLandmarks } from '../VideoPatient';

const dir = process.env.REHAB24_DIR;
const groups = process.env.REHAB24_GROUPS?.split(',');

const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : 'n/a');
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const quantile = (a: number[], q: number) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : NaN;
};
const table = (header: string[], rows: string[][]) =>
  [header, header.map(() => '---'), ...rows]
    .map((r) => `| ${r.join(' | ')} |`)
    .join('\n');
const exName = (id: string) => REHAB24_EXERCISES[id].name;

/** Errors (measured - truth) over frames where both exist. */
const errors = (frames: FrameRecord[], pick: (f: FrameRecord) => number | null) =>
  frames
    .map((f) => {
      const m = pick(f);
      return m !== null && f.truth !== null ? m - f.truth : null;
    })
    .filter((e): e is number => e !== null);
const errorCells = (e: number[]) => [
  String(e.length),
  f1(mean(e)),
  f1(mean(e.map(Math.abs))),
  f1(quantile(e.map(Math.abs), 0.95)),
];

/** Seeded RNG so bootstrap intervals are reproducible. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
/** 95% interval of the mean over participants, resampling participants. */
function bootstrap(values: number[], n = 2000): [number, number] {
  if (values.length < 2) return [NaN, NaN];
  const r = rng(24);
  const means = Array.from({ length: n }, () =>
    mean(values.map(() => values[Math.floor(r() * values.length)]))
  );
  return [quantile(means, 0.025), quantile(means, 0.975)];
}

function groupBy<T>(items: T[], key: (t: T) => string | null): [string, T[]][] {
  const m = new Map<string, T[]>();
  items.forEach((t) => {
    const k = key(t);
    if (k !== null) m.set(k, [...(m.get(k) ?? []), t]);
  });
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
}

(dir ? it : it.skip)('REHAB24-6 benchmark', () => {
  const labelled = parseSegmentation(
    fs.readFileSync(path.join(dir!, 'Segmentation.csv'), 'utf8')
  ).filter(
    (r) =>
      REHAB24_EXERCISES[r.exercise] && (!groups || groups.includes(groupOf(r.person)))
  );
  const truth = JSON.parse(fs.readFileSync(path.join(dir!, 'truth.json'), 'utf8'))
    .videos as Record<string, Truth>;
  const byVideo = new Map<string, LabelledRep[]>();
  labelled.forEach((r) => byVideo.set(r.video, [...(byVideo.get(r.video) ?? []), r]));

  const cameras: CameraRecord[] = [];
  for (const [video, reps] of byVideo) {
    for (const cam of [17, 18] as const) {
      const file = path.join(dir!, 'landmarks', `${video}.c${cam}.json.gz`);
      if (!fs.existsSync(file)) continue;
      const data: VideoLandmarks = JSON.parse(
        zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')
      );
      cameras.push(...evaluateCamera(data, cam, reps, truth[video] ?? {}));
    }
  }
  const reps = cameras.flatMap((c) => c.reps);
  const frames = (rs: RepRecord[]) => rs.flatMap((r) => r.frames);
  const byExView = (r: RepRecord) => `${exName(r.exercise)}, ${r.labelledView}`;
  const isShoulder = (r: RepRecord) => REHAB24_EXERCISES[r.exercise].joint === 'shoulder';

  // 1. Coverage
  const coverage = groupBy(reps, byExView).map(([k, rs]) => {
    const fs_ = frames(rs);
    return [
      k,
      String(fs_.length),
      pct(fs_.filter((f) => f.pose).length, fs_.length),
      pct(fs_.filter((f) => f.visibility >= 0.5).length, fs_.length),
      pct(fs_.filter((f) => f.app !== null).length, fs_.length),
      pct(
        fs_.filter((f) => f.estimated && f.app !== null).length,
        fs_.filter((f) => f.app !== null).length
      ),
    ];
  });

  // 2. Frame-by-frame angle agreement: app (2D) vs pose-model 3D world
  const agreement = groupBy(reps, byExView).map(([k, rs]) => {
    const fs_ = frames(rs);
    const jointDef = rs.some(isShoulder)
      ? f1(
          mean(
            fs_
              .filter((f) => f.app !== null && f.truthJoint !== null)
              .map((f) => Math.abs((f.app as number) - (f.truthJoint as number)))
          )
        )
      : '—';
    return [
      k,
      ...errorCells(errors(fs_, (f) => f.app)),
      ...errorCells(errors(fs_, (f) => (f.pose ? f.world : null))).slice(1),
      jointDef,
    ];
  });

  // 3. Per participant (all views), with a participant-level bootstrap
  const perPerson = groupBy(reps, (r) => exName(r.exercise)).map(([k, rs]) => {
    const people = groupBy(rs, (r) => String(r.person));
    const maes = people.map(([, pr]) =>
      mean(errors(frames(pr), (f) => f.app).map(Math.abs))
    );
    const [lo, hi] = bootstrap(maes.filter(Number.isFinite));
    return [
      k,
      people.map(([p], i) => `P${p} ${f1(maes[i])}`).join(', '),
      `${f1(mean(maes.filter(Number.isFinite)))} (${f1(lo)}–${f1(hi)})`,
    ];
  });

  // 4. Repetitions: counting, timing, peak and bottom of range
  const repRows = groupBy(reps, byExView).map(([k, rs]) => {
    const peak = rs
      .filter((r) => r.appPeak !== null && r.truePeak !== null)
      .map((r) => (r.appPeak as number) - (r.truePeak as number));
    const low = rs
      .filter((r) => r.appMin !== null && r.trueMin !== null)
      .map((r) => (r.appMin as number) - (r.trueMin as number));
    const timing = rs
      .flatMap((r) => [r.startErrorMs, r.endErrorMs])
      .filter((x): x is number => x !== null)
      .map(Math.abs);
    return [
      k,
      String(rs.length),
      pct(rs.filter((r) => r.counted).length, rs.length),
      `${Math.round(quantile(timing, 0.5))} / ${Math.round(quantile(timing, 0.9))}`,
      f1(mean(peak)),
      f1(mean(peak.map(Math.abs))),
      f1(mean(low)),
      f1(mean(low.map(Math.abs))),
    ];
  });
  const countRows = groupBy(cameras, (c) =>
    c.reps.length ? `${exName(c.exercise)}, ${c.reps[0].labelledView}` : null
  ).map(([k, cs]) => {
    const diff = cs.map((c) => c.appReps - c.labelledReps);
    return [
      k,
      String(cs.length),
      pct(diff.filter((d) => d === 0).length, cs.length),
      pct(diff.filter((d) => Math.abs(d) <= 1).length, cs.length),
      f1(mean(diff)),
    ];
  });

  // 5. View classification
  const viewRows = groupBy(reps, byExView).map(([k, rs]) => {
    const got = groupBy(rs, (r) => r.appView ?? 'none')
      .map(([v, n]) => `${v} ${n.length}`)
      .join(', ');
    return [
      k,
      String(rs.length),
      pct(rs.filter((r) => r.appView === r.labelledView).length, rs.length),
      got,
    ];
  });

  // 6. Does confidence predict error?
  const measured = frames(reps).filter((f) => f.app !== null && f.truth !== null);
  const bins: [string, (f: FrameRecord) => boolean][] = [
    ['visibility < 0.5', (f) => f.visibility < 0.5],
    ['0.5–0.8', (f) => f.visibility >= 0.5 && f.visibility < 0.8],
    ['0.8–0.95', (f) => f.visibility >= 0.8 && f.visibility < 0.95],
    ['≥ 0.95', (f) => f.visibility >= 0.95],
    ['shown as estimate', (f) => f.estimated],
    ['not an estimate', (f) => !f.estimated],
  ];
  const confidenceRows = (joint: 'shoulder' | 'knee') => {
    const fs_ = reps
      .filter((r) => REHAB24_EXERCISES[r.exercise].joint === joint)
      .flatMap((r) => r.frames)
      .filter((f) => f.app !== null && f.truth !== null);
    return bins.map(([label, test]) => {
      const e = errors(fs_.filter(test), (f) => f.app).map(Math.abs);
      return [`${joint}: ${label}`, String(e.length), f1(mean(e)), f1(quantile(e, 0.95))];
    });
  };

  // 7. Findings on correct vs incorrect repetitions (exploratory)
  const anyF = (r: RepRecord) => r.findings.length > 0;
  const flagF = (r: RepRecord) => r.findings.some((f) => f.endsWith(':flag'));
  const findingRows = groupBy(reps, byExView).map(([k, rs]) => {
    const good = rs.filter((r) => r.correct);
    const bad = rs.filter((r) => !r.correct);
    return [
      k,
      `${good.length} / ${bad.length}`,
      pct(good.filter(anyF).length, good.length),
      pct(bad.filter(anyF).length, bad.length),
      pct(good.filter(flagF).length, good.length),
      pct(bad.filter(flagF).length, bad.length),
    ];
  });
  const findingIds = groupBy(
    reps.flatMap((r) => r.findings.map((f) => ({ f, r }))),
    ({ f, r }) => `${exName(r.exercise)}: ${f}`
  ).map(([k, xs]) => [
    k,
    String(xs.filter((x) => x.r.correct).length),
    String(xs.filter((x) => !x.r.correct).length),
  ]);

  // 8. Conditions
  const conditionRows = [
    ...groupBy(
      reps,
      (r) =>
        ['no other person', 'negligible', 'noticeable', 'large'][r.extraPerson] ?? null
    ).map(([k, rs]) => [`other person in view: ${k}`, rs] as const),
    ...groupBy(reps, (r) => (r.lights ? 'lights on' : 'evening light')).map(
      ([k, rs]) => [k, rs] as const
    ),
  ].map(([k, rs]) => [
    k,
    String(rs.length),
    pct(frames(rs).filter((f) => f.pose).length, frames(rs).length),
    pct(rs.filter((r) => r.counted).length, rs.length),
    f1(mean(errors(frames(rs), (f) => f.app).map(Math.abs))),
  ]);

  // 9. Worst repetitions by peak error
  const worst = reps
    .filter((r) => r.appPeak !== null && r.truePeak !== null)
    .map((r) => ({ r, err: (r.appPeak as number) - (r.truePeak as number) }))
    .sort((a, b) => Math.abs(b.err) - Math.abs(a.err))
    .slice(0, 20)
    .map(({ r, err }) => [
      `${r.video} c${r.cam} #${r.rep}`,
      exName(r.exercise),
      `${r.labelledView} → ${r.appView ?? 'none'}`,
      f1(err),
      f1(
        quantile(
          r.frames.map((f) => f.visibility),
          0.5
        )
      ),
      pct(r.frames.filter((f) => f.estimated).length, r.frames.length),
      String(r.extraPerson),
      r.lights ? 'on' : 'evening',
      r.correct ? 'correct' : 'incorrect',
    ]);

  const EX_VIEW = 'Exercise, labelled view';
  const md = `# REHAB24-6 benchmark results

Internal exploratory benchmarking, not product or clinical validation. Generated by \`src/testing/videoPatient/__tests__/rehab24.test.ts\`${groups ? ` (groups: ${groups.join(', ')})` : ' (all participants)'}: ${reps.length} labelled repetitions × camera views from ${cameras.length} camera sessions. REHAB24-6: Černek, Sedmidubsky, Budikova, SISAP 2024, CC BY-NC 4.0. Method: REHAB24_BENCHMARK.md.

## 1. Coverage (frames inside labelled repetitions)
${table([EX_VIEW, 'Frames', 'Person found', 'Needed landmarks visible', 'Angle measured', 'Measured shown as estimate'], coverage)}

## 2. Frame-by-frame angle vs motion capture
App = the angle the app shows (2D, aspect-corrected). 3D = the same angle from MediaPipe's world landmarks. Errors in degrees (measured − motion capture).
${table([EX_VIEW, 'Frames', 'App bias', 'App MAE', 'App 95th pct |error|', '3D bias', '3D MAE', '3D 95th pct |error|', 'App MAE vs joint-angle definition'], agreement)}

## 3. App MAE per participant (all views), mean with participant-bootstrap 95% interval
${table(['Exercise', 'Per participant (°)', 'Mean (95% CI)'], perPerson)}

## 4. Repetitions
${table([EX_VIEW, 'Labelled reps', 'Counted', 'Start/end timing error, median / 90th pct (ms)', 'Peak bias', 'Peak MAE', 'Bottom-of-range bias', 'Bottom-of-range MAE'], repRows)}

Rep count per camera session:
${table([EX_VIEW, 'Sessions', 'Exact', 'Within ±1', 'Mean difference'], countRows)}

## 5. Camera view
${table([EX_VIEW, 'Reps', 'Detected as labelled', 'App detected'], viewRows)}

## 6. Does confidence predict error?
${table(['Frames', 'n', 'MAE', '95th pct |error|'], [...confidenceRows('shoulder'), ...confidenceRows('knee')])}

## 7. Findings on correct vs incorrect repetitions (exploratory: the label is broad)
${table([EX_VIEW, 'Correct / incorrect reps', 'Any finding, correct', 'Any finding, incorrect', 'Flag, correct', 'Flag, incorrect'], findingRows)}

${table(['Finding', 'On correct reps', 'On incorrect reps'], findingIds)}

## 8. Conditions
${table(['Condition', 'Reps', 'Person found', 'Counted', 'App MAE'], conditionRows)}

## 9. Twenty worst repetitions by peak error
${table(['Repetition', 'Exercise', 'View (labelled → app)', 'Peak error', 'Median visibility', 'Estimate frames', 'Other person (0–3)', 'Light', 'Label'], worst)}

Median inference ${f1(
    quantile(
      cameras.map((c) => c.medianInferenceMs),
      0.5
    )
  )} ms per frame (desktop CPU).
`;
  if (process.env.REHAB24_OUT) fs.writeFileSync(process.env.REHAB24_OUT, md);
  if (process.env.REHAB24_JSON)
    fs.writeFileSync(
      process.env.REHAB24_JSON,
      JSON.stringify(
        cameras.map((c) => ({ ...c, reps: c.reps.map(({ frames: _f, ...r }) => r) }))
      )
    );
  console.log(md);
  expect(reps.length).toBeGreaterThan(0);
});
