/**
 * End-to-end metrics for one video: pose availability, landmark visibility,
 * camera view, repetitions, range, angle jitter, restraint (how often the
 * measurement is withheld) and compensation findings, computed with the same
 * code a live session uses.
 */
import { analyseSession, SessionAnalysis } from '../../services/movement/analysis';
import { detectCompensations } from '../../services/movement/compensations';
import { MovementRecorder } from '../../services/movement/recorder';
import type {
  CameraView,
  MovementContext,
  MovementFrame,
} from '../../services/movement/types';
import type { BodySide, JointKind } from '../../services/pose/exercisePlan';
import { findLandmark } from '../../services/pose/landmarkLookup';
import { getOutOfPlaneJoints } from '../../services/pose/measurementLandmarks';
import { VideoLandmarks, VideoPatient } from './VideoPatient';

export interface VideoMetrics {
  video: string;
  transform: string;
  frames: number;
  /** Share of frames where the model found a person. */
  poseRate: number;
  /** Mean visibility (frames with a pose) of the working arm and the trunk. */
  armVisibility: number;
  trunkVisibility: number;
  side: BodySide;
  /** Most frequent camera view over frames with a pose. */
  view: CameraView;
  viewShare: Partial<Record<CameraView, number>>;
  reps: number;
  /** Largest clinical angle reached, and the lowest (degrees). */
  peakDegrees: number | null;
  minDegrees: number | null;
  /** High-frequency angle noise: RMS difference from a 5-frame median (degrees). */
  jitterDegrees: number | null;
  /** Share of frames where the joint couldn't be measured (no pose or joint not seen). */
  unmeasuredRate: number;
  /** Share of measured frames flagged as out of the image plane (shown as estimates). */
  estimatedRate: number;
  findings: SessionAnalysis['findings'];
  medianInferenceMs: number;
}

const median = (a: number[]) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

function record(data: VideoLandmarks, context: MovementContext) {
  const recorder = new MovementRecorder(context);
  const frames: (MovementFrame | null)[] = [];
  let estimated = 0;
  for (const f of new VideoPatient(data).frames()) {
    if (!f.pose) {
      frames.push(null);
      continue;
    }
    frames.push(recorder.add(f.pose));
    if (getOutOfPlaneJoints(f.pose).has(`${context.side}_${context.joint}`)) estimated++;
  }
  return { recorder, frames, estimated };
}

const range = (frames: (MovementFrame | null)[]) => {
  const a = frames
    .map((f) => f?.angle)
    .filter((x): x is number => x !== null && x !== undefined)
    .sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length * 0.95)] - a[Math.floor(a.length * 0.05)] : 0;
};

export function analyseVideo(
  data: VideoLandmarks,
  { joint = 'shoulder', exerciseId }: { joint?: JointKind; exerciseId?: string } = {}
): VideoMetrics {
  // The working side is the one that moves (the dataset doesn't say which arm)
  const runs = (['left', 'right'] as BodySide[]).map((side) => {
    const context: MovementContext = { joint, side, exerciseId };
    return { context, ...record(data, context) };
  });
  const run = range(runs[0].frames) >= range(runs[1].frames) ? runs[0] : runs[1];
  const { context, recorder, frames, estimated } = run;
  const analysis = analyseSession(
    recorder.frames,
    context,
    {},
    { detect: detectCompensations }
  );

  const withPose = frames.filter((f): f is MovementFrame => f !== null);
  const measured = withPose.filter((f) => f.angle !== null);
  const vis = (names: string[]) =>
    withPose.length
      ? withPose.reduce(
          (s, f) =>
            s +
            names.reduce(
              (t, n) => t + (findLandmark(f.landmarks, n)?.visibility ?? 0),
              0
            ) /
              names.length,
          0
        ) / withPose.length
      : 0;
  const views = new Map<CameraView, number>();
  withPose.forEach((f) => views.set(f.view, (views.get(f.view) ?? 0) + 1));
  const angles = measured.map((f) => f.angle as number);
  const residuals = angles.map(
    (a, i) => a - median(angles.slice(Math.max(0, i - 2), i + 3))
  );
  const s = context.side;

  return {
    video: data.video,
    transform: data.transform,
    frames: frames.length,
    poseRate: withPose.length / Math.max(1, frames.length),
    armVisibility: vis([`${s}_shoulder`, `${s}_elbow`, `${s}_wrist`]),
    trunkVisibility: vis(['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip']),
    side: s,
    view: [...views.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown',
    viewShare: Object.fromEntries(
      [...views.entries()].map(([v, n]) => [v, n / Math.max(1, withPose.length)])
    ),
    reps: analysis.reps.length,
    peakDegrees: angles.length ? Math.max(...angles) : null,
    minDegrees: angles.length ? Math.min(...angles) : null,
    jitterDegrees: residuals.length
      ? Math.sqrt(residuals.reduce((t, r) => t + r * r, 0) / residuals.length)
      : null,
    unmeasuredRate: 1 - measured.length / Math.max(1, frames.length),
    estimatedRate: estimated / Math.max(1, measured.length),
    findings: analysis.findings,
    medianInferenceMs: median(data.frames.map((f) => f[1])),
  };
}
