/**
 * REHAB24-6 evaluation: runs one camera's video of a labelled recording
 * through the app's session pipeline and lines the result up, frame by frame
 * and repetition by repetition, with motion capture and the physiotherapist's
 * labels. Records only; the report is built in __tests__/rehab24.test.ts.
 *
 * REHAB24-6 (Černek, Sedmidubsky, Budikova, SISAP 2024) is CC BY-NC 4.0: used
 * for internal, non-commercial benchmarking only, never committed.
 */
import { analyseSession } from '../../services/movement/analysis';
import { detectCompensations } from '../../services/movement/compensations';
import { MovementRecorder } from '../../services/movement/recorder';
import type { CameraView, MovementContext } from '../../services/movement/types';
import type { BodySide, JointKind } from '../../services/pose/exercisePlan';
import { findLandmark } from '../../services/pose/landmarkLookup';
import { worldAngle } from '../../services/pose/worldAngle';
import { getOutOfPlaneJoints } from '../../services/pose/measurementLandmarks';
import type { ProcessedPoseData } from '../../types/pose';
import { VideoLandmarks, VideoPatient } from './VideoPatient';

/** Participant-disjoint groups; persons 1-9 appear in these exercises. */
export const REHAB24_GROUPS: Record<string, number[]> = {
  inspection: [1, 2, 3, 4],
  validation: [5, 6],
  test: [7, 8, 9],
};
export const groupOf = (person: number) =>
  Object.keys(REHAB24_GROUPS).find((g) => REHAB24_GROUPS[g].includes(person)) ?? 'none';

export interface Rehab24Exercise {
  name: string;
  joint: JointKind;
  exerciseId: string;
  /** Working side from the labelled subtype. */
  side: (subtype: string) => BodySide;
}
export const REHAB24_EXERCISES: Record<string, Rehab24Exercise> = {
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

export interface LabelledRep {
  video: string;
  index: number;
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

export function parseSegmentation(csv: string): LabelledRep[] {
  const [head, ...lines] = csv.trim().split(/\r?\n/);
  const cols = head.split(';');
  return lines.map((line) => {
    const v = Object.fromEntries(line.split(';').map((x, i) => [cols[i], x]));
    return {
      video: v.video_id,
      index: Number(v.repetition_number),
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

/** The view each camera had, in the app's vocabulary (cameras are orthogonal). */
export const viewFor = (cam: 17 | 18, cam17: string): CameraView => {
  if (cam17 === 'half-profile') return 'oblique';
  const front = cam === 17 ? cam17 === 'front' : cam17 !== 'front';
  return front ? 'front' : 'side';
};

/** Motion-capture truth per video: series at 30 fps, degrees. */
export type Truth = Record<string, (number | null)[]>;

export interface FrameRecord {
  /** Labelled repetition this frame belongs to. */
  rep: number;
  /** A person was found in this frame. */
  pose: boolean;
  /** The app's angle (null when it withheld the measurement). */
  app: number | null;
  /** The same joint angle from MediaPipe's 3D world landmarks. */
  world: number | null;
  /** Motion capture, app definition (and for the shoulder the joint-angle one). */
  truth: number | null;
  truthJoint: number | null;
  /** Lowest visibility of the three landmarks the angle needs. */
  visibility: number;
  /** The app marked the angle as an estimate (limb out of the image plane). */
  estimated: boolean;
  view: CameraView | null;
}

export interface RepRecord {
  video: string;
  cam: 17 | 18;
  rep: number;
  exercise: string;
  person: number;
  group: string;
  side: BodySide;
  labelledView: CameraView;
  appView: CameraView | null;
  correct: boolean;
  lights: boolean;
  extraPerson: number;
  /** An app repetition peaked inside this labelled repetition. */
  counted: boolean;
  /** Start/end of the matched app repetition minus the labelled ones (ms). */
  startErrorMs: number | null;
  endErrorMs: number | null;
  appPeak: number | null;
  truePeak: number | null;
  appMin: number | null;
  trueMin: number | null;
  findings: string[];
  frames: FrameRecord[];
}

export interface CameraRecord {
  video: string;
  cam: 17 | 18;
  exercise: string;
  person: number;
  side: BodySide;
  labelledReps: number;
  /** App repetitions peaking between the first labelled start and last labelled end. */
  appReps: number;
  medianInferenceMs: number;
  reps: RepRecord[];
}

const START_MS = 1_000_000;
const FPS = 30;

/** The landmarks an angle needs (shoulder: arm and trunk; knee: leg). */
const NEEDED: Record<string, (s: BodySide) => string[]> = {
  shoulder: (s) => [`${s}_shoulder`, `${s}_elbow`, 'left_hip', 'right_hip'],
  knee: (s) => [`${s}_hip`, `${s}_knee`, `${s}_ankle`],
};

const minVisibility = (pose: ProcessedPoseData, names: string[]) =>
  Math.min(...names.map((n) => findLandmark(pose.landmarks, n)?.visibility ?? 0));

const truthAt = (series: (number | null)[] | undefined, t: number) =>
  series?.[Math.round(((t - START_MS) / 1000) * FPS)] ?? null;

/** Evaluate one camera's video of one recording. */
export function evaluateCamera(
  data: VideoLandmarks,
  cam: 17 | 18,
  reps: LabelledRep[],
  truth: Truth
): CameraRecord[] {
  const ex = REHAB24_EXERCISES[reps[0].exercise];
  const out: CameraRecord[] = [];
  // One session per working side (lunges alternate the front leg)
  const bySide = new Map<BodySide, LabelledRep[]>();
  reps.forEach((r) => {
    const side = ex.side(r.subtype);
    bySide.set(side, [...(bySide.get(side) ?? []), r]);
  });
  const inference = data.frames.map((f) => f[1]).sort((a, b) => a - b);

  for (const [side, sideReps] of bySide) {
    const context: MovementContext = {
      joint: ex.joint,
      side,
      exerciseId: ex.exerciseId,
    };
    const recorder = new MovementRecorder(context);
    const key = `${side}_${ex.joint}`;
    const needed = NEEDED[ex.joint](side);
    // Per video frame: what the app saw (null = no person found)
    const seen: {
      t: number;
      frame: ReturnType<MovementRecorder['add']>;
      pose: ProcessedPoseData | null;
    }[] = [];
    for (const f of new VideoPatient(data).frames()) {
      seen.push({
        t: START_MS + f.t,
        frame: f.pose ? recorder.add(f.pose) : null,
        pose: f.pose,
      });
    }
    const analysis = analyseSession(
      recorder.frames,
      context,
      {},
      {
        detect: detectCompensations,
      }
    );

    const records: RepRecord[] = sideReps.map((r) => {
      const from = START_MS + (r.first / FPS) * 1000;
      const to = START_MS + (r.last / FPS) * 1000;
      const frames: FrameRecord[] = seen
        .filter((s) => s.t >= from && s.t <= to)
        .map((s) => ({
          rep: r.index,
          pose: s.pose !== null,
          app: s.frame?.angle ?? null,
          world: s.pose ? worldAngle(s.pose.worldLandmarks, ex.joint, side) : null,
          truth: truthAt(truth[key], s.t),
          truthJoint:
            ex.joint === 'shoulder' ? truthAt(truth[`${key}_joint`], s.t) : null,
          visibility: s.pose ? minVisibility(s.pose, needed) : 0,
          estimated: s.pose ? getOutOfPlaneJoints(s.pose).has(key) : false,
          view: s.frame?.view ?? null,
        }));
      const appAngles = frames.map((f) => f.app).filter((a): a is number => a !== null);
      const trueAngles = (truth[key] ?? [])
        .slice(r.first, r.last + 1)
        .filter((a): a is number => a !== null);
      const appRep = analysis.reps.find((a) => a.peakT >= from && a.peakT <= to);
      const views = new Map<CameraView, number>();
      frames.forEach((f) => f.view && views.set(f.view, (views.get(f.view) ?? 0) + 1));
      return {
        video: r.video,
        cam,
        rep: r.index,
        exercise: r.exercise,
        person: r.person,
        group: groupOf(r.person),
        side,
        labelledView: viewFor(cam, r.cam17),
        appView: [...views.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
        correct: r.correct,
        lights: r.lights,
        extraPerson: cam === 17 ? r.extra17 : r.extra18,
        counted: appRep !== undefined,
        startErrorMs: appRep ? appRep.startT - from : null,
        endErrorMs: appRep ? appRep.endT - to : null,
        appPeak: appAngles.length ? Math.max(...appAngles) : null,
        truePeak: trueAngles.length ? Math.max(...trueAngles) : null,
        appMin: appAngles.length ? Math.min(...appAngles) : null,
        trueMin: trueAngles.length ? Math.min(...trueAngles) : null,
        findings: appRep
          ? analysis.findings
              .filter((f) => f.reps.includes(appRep.index))
              .map((f) => `${f.id}:${f.severity}`)
          : [],
        frames,
      };
    });
    const spanFrom = START_MS + (Math.min(...sideReps.map((r) => r.first)) / FPS) * 1000;
    const spanTo = START_MS + (Math.max(...sideReps.map((r) => r.last)) / FPS) * 1000;
    out.push({
      video: sideReps[0].video,
      cam,
      exercise: sideReps[0].exercise,
      person: sideReps[0].person,
      side,
      labelledReps: sideReps.length,
      appReps: analysis.reps.filter((a) => a.peakT >= spanFrom && a.peakT <= spanTo)
        .length,
      medianInferenceMs: inference[Math.floor(inference.length / 2)] ?? NaN,
      reps: records,
    });
  }
  return out;
}
