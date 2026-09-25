/**
 * REHAB24-6 benchmark: shoulder and knee exercises filmed by two cameras, with
 * motion capture and a physiotherapist's correct/incorrect label for every
 * repetition. Measures, per repetition and camera view: repetition counting,
 * angle error against motion capture, and how often the app raises a finding
 * on correct vs incorrect repetitions.
 *
 * The dataset is CC BY-NC 4.0: it stays outside the repository and is used for
 * internal benchmarking only. Needs the local directory prepared by
 * scripts/fixtures/rehab24_pilot.sh:
 *
 *   REHAB24_DIR=<dir> [REHAB24_GROUPS=inspection,validation] [REHAB24_OUT=out.md] \
 *     npx jest src/testing/videoPatient/__tests__/rehab24.test.ts
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { analyseSession } from '../../../services/movement/analysis';
import { detectCompensations } from '../../../services/movement/compensations';
import { MovementRecorder } from '../../../services/movement/recorder';
import type {
  CameraView,
  MovementContext,
  MovementFrame,
} from '../../../services/movement/types';
import type { BodySide, JointKind } from '../../../services/pose/exercisePlan';
import { VideoLandmarks, VideoPatient } from '../VideoPatient';

const dir = process.env.REHAB24_DIR;
const groups = process.env.REHAB24_GROUPS?.split(',');

/** Participant-disjoint groups (persons 1-9 appear in these exercises). */
export const REHAB24_GROUPS: Record<string, number[]> = {
  inspection: [1, 2, 3, 4],
  validation: [5, 6],
  test: [7, 8, 9],
};
const groupOf = (person: number) =>
  Object.keys(REHAB24_GROUPS).find((g) => REHAB24_GROUPS[g].includes(person)) ?? 'none';

interface Exercise {
  name: string;
  joint: JointKind;
  exerciseId: string;
  /** Working side from the labelled subtype (default right). */
  side: (subtype: string) => BodySide;
}
const EXERCISES: Record<string, Exercise> = {
  '1': {
    name: 'arm abduction',
    joint: 'shoulder',
    exerciseId: 'side-arm-raise',
    side: () => 'right',
  },
  '2': {
    name: 'arm V-W',
    joint: 'shoulder',
    exerciseId: 'shoulder-press',
    side: () => 'right',
  },
  '5': {
    name: 'lunge',
    joint: 'knee',
    exerciseId: 'lunge',
    side: (s) => (s.includes('left') ? 'left' : 'right'),
  },
  '6': { name: 'squat', joint: 'knee', exerciseId: 'squat', side: () => 'right' },
};

interface LabelledRep {
  video: string;
  exercise: string;
  person: number;
  first: number;
  last: number;
  cam17: string;
  subtype: string;
  lights: boolean;
  extra17: number;
  extra18: number;
  correct: boolean;
}

/** The view each camera had, in the app's vocabulary. */
const viewFor = (cam: 17 | 18, cam17: string): CameraView => {
  if (cam17 === 'half-profile') return 'oblique';
  const front = cam === 17 ? cam17 === 'front' : cam17 !== 'front';
  return front ? 'front' : 'side';
};

const START_MS = 1_000_000;
const FPS = 30;

export interface RepResult {
  video: string;
  cam: 17 | 18;
  exercise: string;
  person: number;
  group: string;
  labelledView: CameraView;
  appView: CameraView | null;
  correct: boolean;
  lights: boolean;
  extraPerson: number;
  /** An app repetition peaked inside this labelled repetition. */
  counted: boolean;
  appPeak: number | null;
  truePeak: number | null;
  findings: string[];
}

function loadReps(file: string): LabelledRep[] {
  const [head, ...lines] = fs.readFileSync(file, 'utf8').trim().split('\n');
  const cols = head.split(';');
  return lines.map((line) => {
    const v = Object.fromEntries(line.split(';').map((x, i) => [cols[i], x]));
    return {
      video: v.video_id,
      exercise: v.exercise_id,
      person: Number(v.person_id),
      first: Number(v.first_frame),
      last: Number(v.last_frame),
      cam17: v.cam17_orientation,
      subtype: v.exercise_subtype,
      lights: v.lights_on === '1',
      extra17: Number(v.extra_person_in_cam17),
      extra18: Number(v.extra_person_in_cam18),
      correct: v.correctness === '1',
    };
  });
}

function evaluate(
  data: VideoLandmarks,
  cam: 17 | 18,
  reps: LabelledRep[],
  truth: Record<string, (number | null)[]>
): RepResult[] {
  const ex = EXERCISES[reps[0].exercise];
  const results: RepResult[] = [];
  // One session per working side (lunges alternate the front leg)
  const bySide = new Map<BodySide, LabelledRep[]>();
  reps.forEach((r) => {
    const side = ex.side(r.subtype);
    bySide.set(side, [...(bySide.get(side) ?? []), r]);
  });
  for (const [side, sideReps] of bySide) {
    const context: MovementContext = { joint: ex.joint, side, exerciseId: ex.exerciseId };
    const recorder = new MovementRecorder(context);
    for (const f of new VideoPatient(data).frames()) if (f.pose) recorder.add(f.pose);
    const frames = recorder.frames;
    const analysis = analyseSession(frames, context, {}, { detect: detectCompensations });
    const truthSeries = truth[`${side}_${ex.joint}`] ?? [];
    for (const r of sideReps) {
      const from = START_MS + (r.first / FPS) * 1000;
      const to = START_MS + (r.last / FPS) * 1000;
      const inside = frames.filter((f: MovementFrame) => f.t >= from && f.t <= to);
      const angles = inside.map((f) => f.angle).filter((a): a is number => a !== null);
      const appRep = analysis.reps.find((a) => a.peakT >= from && a.peakT <= to);
      const views = new Map<CameraView, number>();
      inside.forEach((f) => views.set(f.view, (views.get(f.view) ?? 0) + 1));
      const trueAngles = truthSeries
        .slice(r.first, r.last + 1)
        .filter((a): a is number => a !== null);
      results.push({
        video: r.video,
        cam,
        exercise: r.exercise,
        person: r.person,
        group: groupOf(r.person),
        labelledView: viewFor(cam, r.cam17),
        appView: [...views.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
        correct: r.correct,
        lights: r.lights,
        extraPerson: cam === 17 ? r.extra17 : r.extra18,
        counted: appRep !== undefined,
        appPeak: angles.length ? Math.max(...angles) : null,
        truePeak: trueAngles.length ? Math.max(...trueAngles) : null,
        findings: appRep
          ? analysis.findings
              .filter((f) => f.reps.includes(appRep.index))
              .map((f) => `${f.id}:${f.severity}`)
          : [],
      });
    }
  }
  return results;
}

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : 'n/a');
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');
const table = (header: string[], rows: string[][]) =>
  [header, header.map(() => '---'), ...rows]
    .map((r) => `| ${r.join(' | ')} |`)
    .join('\n');

export function summarise(rs: RepResult[]): string[] {
  const good = rs.filter((r) => r.correct);
  const bad = rs.filter((r) => !r.correct);
  const any = (r: RepResult) => r.findings.length > 0;
  const flagged = (r: RepResult) => r.findings.some((f) => f.endsWith(':flag'));
  const errs = rs
    .filter((r) => r.appPeak !== null && r.truePeak !== null)
    .map((r) => (r.appPeak as number) - (r.truePeak as number));
  return [
    String(rs.length),
    pct(rs.filter((r) => r.counted).length, rs.length),
    pct(rs.filter((r) => r.appView === r.labelledView).length, rs.length),
    f1(median(errs)),
    f1(median(errs.map(Math.abs))),
    pct(good.filter(any).length, good.length),
    pct(bad.filter(any).length, bad.length),
    pct(good.filter(flagged).length, good.length),
    pct(bad.filter(flagged).length, bad.length),
  ];
}
export const SUMMARY_HEADER = [
  'Repetitions',
  'Counted',
  'View as labelled',
  'Peak bias vs mocap (°)',
  'Median abs error (°)',
  'Finding on correct reps',
  'Finding on incorrect reps',
  'Flag on correct reps',
  'Flag on incorrect reps',
];

(dir ? it : it.skip)('REHAB24-6 benchmark', () => {
  const labelled = loadReps(path.join(dir!, 'Segmentation.csv')).filter(
    (r) => EXERCISES[r.exercise] && (!groups || groups.includes(groupOf(r.person)))
  );
  const truth = JSON.parse(fs.readFileSync(path.join(dir!, 'truth.json'), 'utf8'))
    .videos as Record<string, Record<string, (number | null)[]>>;
  const byVideo = new Map<string, LabelledRep[]>();
  labelled.forEach((r) => byVideo.set(r.video, [...(byVideo.get(r.video) ?? []), r]));

  const results: RepResult[] = [];
  for (const [video, reps] of byVideo) {
    for (const cam of [17, 18] as const) {
      const file = path.join(dir!, 'landmarks', `${video}.c${cam}.json.gz`);
      if (!fs.existsSync(file)) continue;
      const data: VideoLandmarks = JSON.parse(
        zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')
      );
      results.push(...evaluate(data, cam, reps, truth[video] ?? {}));
    }
  }

  const rows = <K extends string>(key: (r: RepResult) => K | null) => {
    const m = new Map<K, RepResult[]>();
    results.forEach((r) => {
      const k = key(r);
      if (k !== null) m.set(k, [...(m.get(k) ?? []), r]);
    });
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, rs]) => [k, ...summarise(rs)]);
  };
  const H = ['Subset', ...SUMMARY_HEADER];
  const findingCounts = (correct: boolean) => {
    const m = new Map<string, number>();
    results
      .filter((r) => r.correct === correct)
      .forEach((r) => r.findings.forEach((f) => m.set(f, (m.get(f) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const correctFindings = new Map(findingCounts(true));
  const incorrectFindings = new Map(findingCounts(false));
  const ids = [
    ...new Set([...correctFindings.keys(), ...incorrectFindings.keys()]),
  ].sort();

  const md = `# REHAB24-6 benchmark results

Generated by \`src/testing/videoPatient/__tests__/rehab24.test.ts\`${groups ? ` (groups: ${groups.join(', ')})` : ''}. Every labelled repetition, seen by each of the two cameras (${results.length} repetition-views). REHAB24-6: Černek, Sedmidubsky, Budikova, SISAP 2024, CC BY-NC 4.0, used for non-commercial benchmarking only. Method: REHAB24_BENCHMARK.md.

## By exercise and camera view
${table(
  H,
  rows((r) => `${EXERCISES[r.exercise].name}, ${r.labelledView}`)
)}

## By exercise
${table(
  H,
  rows((r) => EXERCISES[r.exercise].name)
)}

## By participant group
${table(
  H,
  rows((r) => r.group)
)}

## Another person in the camera's view
${table(
  H,
  rows((r) => ['none', 'negligible', 'noticeable', 'large'][r.extraPerson] ?? null)
)}

## Lighting
${table(
  H,
  rows((r) => (r.lights ? 'lights on' : 'evening light'))
)}

## Findings raised (repetition-views)
${table(
  ['Finding', 'On correct reps', 'On incorrect reps'],
  ids.map((id) => [
    id,
    String(correctFindings.get(id) ?? 0),
    String(incorrectFindings.get(id) ?? 0),
  ])
)}
`;
  if (process.env.REHAB24_OUT) fs.writeFileSync(process.env.REHAB24_OUT, md);
  if (process.env.REHAB24_JSON)
    fs.writeFileSync(process.env.REHAB24_JSON, JSON.stringify(results));
  console.log(md);
  expect(results.length).toBeGreaterThan(0);
});
