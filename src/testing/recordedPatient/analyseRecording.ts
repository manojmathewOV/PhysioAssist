/**
 * Runs a real recording through the same pipeline as a live session
 * (conversion, enrichment, joint-of-interest recorder, repetition
 * segmentation, compensation checks) and compares it with motion capture.
 */
import { analyseSession, SessionAnalysis } from '../../services/movement/analysis';
import { detectCompensations } from '../../services/movement/compensations';
import { MovementRecorder } from '../../services/movement/recorder';
import { segmentReps } from '../../services/movement/repSegmentation';
import type { CameraView, MovementContext } from '../../services/movement/types';
import type { JointKind } from '../../services/pose/exercisePlan';
import { RecordedFixture, RecordedPatient } from './RecordedPatient';

/** Dataset exercise -> the app's exercise id (for per-exercise check lists). */
export const APP_EXERCISE: Record<string, string> = {
  shoulder_flexion: 'arm-raise',
  shoulder_abduction: 'side-arm-raise',
  shoulder_press: 'shoulder-press',
  elbow_flexion: 'bicep-curl',
  squat: 'squat',
  hip_abduction: 'hip-abduction',
  march: 'march',
  seated_knee_extension: 'seated-knee-extension',
};

export interface RecordingResult {
  fixture: RecordedFixture;
  analysis: SessionAnalysis;
  /** Repetitions found in the motion-capture series by the same segmentation. */
  groundTruthReps: number;
  /** Median repetition peak (degrees): ours vs motion capture. */
  peak: number;
  groundTruthPeak: number;
  /** Most frequent camera view at rest. */
  view: CameraView;
}

const median = (a: number[]) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

export function analyseRecording(fixture: RecordedFixture): RecordingResult {
  const joint = fixture.evaluatedJoint.replace(/^(left|right)_/, '') as JointKind;
  const context: MovementContext = {
    joint,
    side: fixture.evaluatedJoint.startsWith('left') ? 'left' : 'right',
    exerciseId: APP_EXERCISE[fixture.exercise] ?? fixture.exercise,
  };
  const recorder = new MovementRecorder(context);
  for (const frame of new RecordedPatient(fixture).frames()) recorder.add(frame.pose);
  const analysis = analyseSession(
    recorder.frames,
    context,
    {},
    { detect: detectCompensations }
  );

  const step = 1000 / fixture.groundTruthHz;
  // The dataset's amplitude convention differs between recordings (for the
  // seated knee extension it rises in some and falls in others as the knee
  // straightens), so count repetitions away from wherever the series rests
  const gt = fixture.groundTruthDegrees.filter((a): a is number => a !== null);
  const restsHigh = median(gt.slice(0, 10)) > median(gt);
  const gtReps = segmentReps(
    fixture.groundTruthDegrees.map((angle, i) => ({
      t: 1_000_000 + i * step,
      angle,
      landmarks: [],
      view: 'unknown' as const,
    })),
    { direction: restsHigh ? 'toward' : 'away' }
  );
  const views = new Map<CameraView, number>();
  analysis.reps.forEach((r) =>
    views.set(r.baseline.view, (views.get(r.baseline.view) ?? 0) + 1)
  );
  const view = [...views.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
  return {
    fixture,
    analysis,
    groundTruthReps: gtReps.length,
    peak: median(analysis.reps.map((r) => r.peakDegrees)),
    groundTruthPeak: median(gtReps.map((r) => r.peakDegrees)),
    view,
  };
}
