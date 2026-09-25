/**
 * MobiPhysio pilot: real smartphone video -> the app's pose model -> the app's
 * pipeline. Frozen benchmark (no tuning on this data). Needs the local pilot
 * directory (videos stay outside the repository):
 *
 *   MOBIPHYSIO_DIR=<dir with manifest.json, landmarks/, robustness/> \
 *   PILOT_OUT=docs/benchmarks/MOBIPHYSIO_PILOT_RESULTS.md \
 *     npx jest src/testing/videoPatient/__tests__/mobiphysioPilot.test.ts
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { analyseVideo, VideoMetrics } from '../analyseVideo';
import type { VideoLandmarks } from '../VideoPatient';

const dir = process.env.MOBIPHYSIO_DIR;

interface ManifestVideo {
  name: string;
  group: 'inspection' | 'validation' | 'test';
  exercise: string;
  participant: string;
  angle: 'F' | 'L' | 'R';
  variation: string;
  gender: string;
  expert: boolean;
  physioScore: number | null;
}

const EXERCISE: Record<string, { name: string; appId: string }> = {
  E01: { name: 'abduction', appId: 'side-arm-raise' },
  E03: { name: 'lateral rotation', appId: 'shoulder-rotation' },
  E05: { name: 'circumduction', appId: 'arm-circles' },
};
const VARIATION: Record<string, string> = {
  FL: 'full light',
  ML: 'medium light',
  LL: 'low light',
  LJ: 'low jitter',
  HJ: 'high jitter',
  O: 'occlusion',
  LR: 'low resolution',
};

const load = (file: string): VideoLandmarks =>
  JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
const pct = (x: number) => `${Math.round(x * 100)}%`;
const signedPct = (x: number) => (x > 0 ? `+${pct(x)}` : pct(x));
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a: number[]) => {
  const s = a.filter(Number.isFinite).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');
const table = (header: string[], rows: string[][]) =>
  [header, header.map(() => '---'), ...rows]
    .map((r) => `| ${r.join(' | ')} |`)
    .join('\n');

(dir ? it : it.skip)('MobiPhysio pilot', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir!, 'manifest.json'), 'utf8'));
  const videos: ManifestVideo[] = manifest.videos;
  const results: { v: ManifestVideo; m: VideoMetrics }[] = [];
  for (const v of videos) {
    const file = path.join(dir!, 'landmarks', `${v.name}.json.gz`);
    if (!fs.existsSync(file)) continue;
    results.push({
      v,
      m: analyseVideo(load(file), { exerciseId: EXERCISE[v.exercise]?.appId }),
    });
  }

  const flagged = (m: VideoMetrics) => m.findings.some((f) => f.severity === 'flag');
  const summarise = (label: string, rs: typeof results) => [
    label,
    String(rs.length),
    pct(mean(rs.map((r) => r.m.poseRate))),
    f1(mean(rs.map((r) => r.m.armVisibility))),
    pct(mean(rs.map((r) => r.m.unmeasuredRate))),
    pct(mean(rs.map((r) => r.m.estimatedRate))),
    f1(med(rs.map((r) => r.m.reps))),
    f1(med(rs.map((r) => r.m.peakDegrees ?? NaN))),
    f1(med(rs.map((r) => r.m.jitterDegrees ?? NaN))),
    `${rs.filter((r) => flagged(r.m)).length}/${rs.length}`,
    f1(med(rs.map((r) => r.m.medianInferenceMs))),
  ];
  const header = [
    'Subset',
    'Videos',
    'Frames with a pose',
    'Arm visibility',
    'Joint not measured',
    'Shown as estimate',
    'Median reps',
    'Median top of range (°)',
    'Median jitter (°)',
    'Sessions with a flagged compensation',
    'Inference ms (CPU)',
  ];
  const by = <K extends string>(key: (r: (typeof results)[0]) => K) => {
    const m = new Map<K, typeof results>();
    results.forEach((r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]));
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  };

  const clean = results.filter((r) => r.v.variation === 'FL');
  const e01 = results.filter((r) => r.v.exercise === 'E01');

  // Camera view: what the app detects for each labelled angle
  const viewRows = by((r) => `${r.v.angle}`)
    .filter(([, rs]) => rs.length)
    .map(([angle, rs]) => {
      const counts = new Map<string, number>();
      rs.forEach((r) => counts.set(r.m.view, (counts.get(r.m.view) ?? 0) + 1));
      return [
        { F: 'front', L: 'left side', R: 'right side' }[angle] ?? angle,
        String(rs.length),
        [...counts.entries()].map(([v, n]) => `${v} ${n}`).join(', '),
      ];
    });

  // Paired stress tests against the clean original
  const robustRows: string[][] = [];
  const robustPairs: { transform: string; base: VideoMetrics; m: VideoMetrics }[] = [];
  const robustDir = path.join(dir!, 'robustness');
  if (fs.existsSync(robustDir)) {
    const transforms = new Map<string, { base: VideoMetrics; m: VideoMetrics }[]>();
    for (const file of fs.readdirSync(robustDir).filter((f) => f.endsWith('.json.gz'))) {
      const [name, transform] = file.replace('.json.gz', '').split('.');
      const base = results.find((r) => r.v.name === name)?.m;
      if (!base) continue;
      const m = analyseVideo(load(path.join(robustDir, file)), {
        exerciseId: 'side-arm-raise',
      });
      transforms.set(transform, [...(transforms.get(transform) ?? []), { base, m }]);
      robustPairs.push({ transform, base, m });
    }
    for (const [t, pairs] of [...transforms.entries()].sort()) {
      const topChange = pairs.map((p) =>
        Math.abs((p.m.peakDegrees ?? NaN) - (p.base.peakDegrees ?? NaN))
      );
      robustRows.push([
        t,
        String(pairs.length),
        pct(mean(pairs.map((p) => p.m.poseRate))),
        signedPct(mean(pairs.map((p) => p.m.unmeasuredRate - p.base.unmeasuredRate))),
        `${pairs.filter((p) => p.m.reps === p.base.reps).length}/${pairs.length}`,
        f1(med(topChange)),
        f1(Math.max(...topChange.filter(Number.isFinite))),
        f1(
          mean(
            pairs.map((p) => (p.m.jitterDegrees ?? NaN) - (p.base.jitterDegrees ?? NaN))
          )
        ),
        `${pairs.filter((p) => p.m.view === p.base.view).length}/${pairs.length}`,
        `${pairs.filter((p) => p.m.side === p.base.side).length}/${pairs.length}`,
        `${pairs.filter((p) => flagged(p.m) && !flagged(p.base)).length}/${pairs.length}`,
      ]);
    }
  }

  const findingCounts = new Map<string, number>();
  clean
    .filter((r) => r.v.exercise === 'E01')
    .forEach((r) =>
      r.m.findings.forEach((f) =>
        findingCounts.set(
          `${f.id} (${f.severity})`,
          (findingCounts.get(`${f.id} (${f.severity})`) ?? 0) + 1
        )
      )
    );

  const md = `# MobiPhysio pilot results

Generated by \`src/testing/videoPatient/__tests__/mobiphysioPilot.test.ts\`. Frozen benchmark: no thresholds were changed on this data. ${results.length} real smartphone videos from 16 participants (MobiPhysio, CC0 1.0, doi:10.7910/DVN/XSI0QN), each run through the app's pose model (\`pose_landmarker_full.task\`, md5 ${results[0] ? load(path.join(dir!, 'landmarks', `${results[0].v.name}.json.gz`)).modelMd5 : ''}) and the app's session pipeline. Method and interpretation: MOBIPHYSIO_PILOT.md.

## By participant group
${table(
  header,
  by((r) => r.v.group).map(([g, rs]) => summarise(g, rs))
)}

## Shoulder abduction by capture condition
${table(
  header,
  by((r) => (r.v.exercise === 'E01' ? VARIATION[r.v.variation] ?? r.v.variation : ''))
    .filter(([k]) => k)
    .map(([k, rs]) => summarise(k, rs))
)}

## By exercise (clean, full light)
${table(
  header,
  by((r) => (r.v.variation === 'FL' ? EXERCISE[r.v.exercise]?.name ?? r.v.exercise : ''))
    .filter(([k]) => k)
    .map(([k, rs]) => summarise(k, rs))
)}

## Shoulder abduction by camera angle (clean)
${table(
  header,
  by((r) =>
    r.v.exercise === 'E01' && r.v.variation === 'FL'
      ? { F: 'front', L: 'left side', R: 'right side' }[r.v.angle]
      : ''
  )
    .filter(([k]) => k)
    .map(([k, rs]) => summarise(k, rs))
)}

## Expert vs non-expert performers (shoulder abduction, clean)
${table(
  header,
  by((r) =>
    r.v.exercise === 'E01' && r.v.variation === 'FL'
      ? r.v.expert
        ? 'expert'
        : 'non-expert'
      : ''
  )
    .filter(([k]) => k)
    .map(([k, rs]) => summarise(k, rs))
)}

## Camera view detected vs labelled angle (all videos)
${table(['Labelled angle', 'Videos', 'App detected'], viewRows)}

## Compensation findings on clean shoulder abduction
${
  findingCounts.size
    ? table(
        ['Finding', 'Sessions'],
        [...findingCounts.entries()].map(([k, n]) => [k, String(n)])
      )
    : 'None.'
}

## Paired stress tests (${robustRows.length ? 'clean front-view abduction clips, same movement, altered pixels' : 'not run'})
${robustRows.length ? table(['Transform', 'Pairs', 'Frames with a pose', 'Change in joint not measured', 'Same rep count', 'Median top-of-range change (°)', 'Largest change (°)', 'Jitter change (°)', 'Same view', 'Same working side', 'New flagged compensation'], robustRows) : ''}

Physiotherapist scores (EAAQ, 0-100) are session-level quality ratings, not angle ground truth; median score of scored clips here: ${f1(med(results.map((r) => r.v.physioScore ?? NaN)))}.
Degraded-condition abduction clips: ${e01.length - clean.filter((r) => r.v.exercise === 'E01').length} (summarised by condition above).
`;
  if (process.env.PILOT_OUT) fs.writeFileSync(process.env.PILOT_OUT, md);
  const jsonOut = process.env.PILOT_JSON;
  if (jsonOut)
    fs.writeFileSync(jsonOut, JSON.stringify({ results, robustPairs }, null, 1));
  console.log(md);
  expect(results.length).toBeGreaterThan(0);
});
