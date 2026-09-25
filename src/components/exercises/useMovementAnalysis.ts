/**
 * Records a session for the joint of interest and analyses it at the end:
 * range, tempo, hold and compensations, compared with the physio's
 * demonstration (if one was saved for this exercise) or the prescribed goal.
 */
import { useCallback, useRef } from 'react';

import type { Exercise } from '../../types/exercise';
import type { ProcessedPoseData } from '../../types/pose';
import {
  ExercisePlan,
  PlanReference,
  goalDegreesOf,
  hasExtendedSupport,
} from '../../services/pose/exercisePlan';
import { MovementRecorder } from '../../services/movement/recorder';
import {
  MovementProfile,
  SessionAnalysis,
  analyseSession,
} from '../../services/movement/analysis';
import type { RangeResultProps } from './RangeResult';
import { parseYouTubeId } from '../../utils/youtube';
import { detectCompensations, PATIENT_CUES } from '../../services/movement/compensations';

/**
 * The demonstration to compare with: saved for this exercise, and (if it was
 * performed along with a video) for the video the exercise uses now.
 */
export function referenceFor(
  plan: ExercisePlan | null | undefined,
  exercise: Exercise
): PlanReference | undefined {
  const ref = plan?.reference;
  if (!ref || ref.exerciseId !== exercise.id) return undefined;
  const videoId = parseYouTubeId(plan?.videos?.[exercise.id]);
  return !ref.videoId || ref.videoId === videoId ? ref : undefined;
}

export function useMovementAnalysis(
  plan: ExercisePlan | null | undefined,
  exercise: Exercise
) {
  const recorder = useRef<MovementRecorder | null>(null);

  const start = useCallback(() => {
    recorder.current =
      plan && exercise.primaryJoint
        ? new MovementRecorder({
            joint: exercise.primaryJoint,
            side: plan.side,
            exerciseId: exercise.id,
          })
        : null;
  }, [plan, exercise]);

  const add = useCallback((pose: ProcessedPoseData | null | undefined) => {
    if (pose) recorder.current?.add(pose);
  }, []);

  /** Analyse what was recorded (null when nothing was). */
  const finish = useCallback((): SessionAnalysis | null => {
    const rec = recorder.current;
    recorder.current = null;
    if (!rec || rec.frames.length === 0) return null;
    const reference = referenceFor(plan, exercise);
    return analyseSession(
      rec.frames,
      rec.context,
      {
        reference,
        goalDegrees: goalDegreesOf(exercise),
        holdMs: plan?.holdSeconds !== undefined ? plan.holdSeconds * 1000 : undefined,
      },
      {
        // Compensation checks are part of the extended (shoulder, knee) support
        detect: hasExtendedSupport(rec.context.joint) ? detectCompensations : undefined,
        cues: PATIENT_CUES,
      }
    );
  }, [plan, exercise]);

  return { start, add, finish };
}

export interface SessionOutcome {
  /** Plan to save (when this session was the physio's demonstration). */
  planUpdate?: ExercisePlan;
  summary: {
    range: RangeResultProps | null;
    findings: SessionAnalysis['findings'] | null;
    comparedWithDemo: boolean;
    demoSaved: MovementProfile | null;
    notice?: string;
  };
  /** Said after "Well done" (the most important thing to work on). */
  spokenCue?: string;
}

/** What a finished session means for the summary and the plan. */
export function sessionOutcome(
  analysis: SessionAnalysis | null,
  {
    plan,
    exercise,
    recordingDemo,
    sessionRange,
  }: {
    plan: ExercisePlan | null | undefined;
    exercise: Exercise;
    recordingDemo: boolean;
    sessionRange: RangeResultProps | null;
  }
): SessionOutcome {
  const empty = { range: null, findings: null, comparedWithDemo: false, demoSaved: null };
  if (recordingDemo) {
    if (!plan || !analysis?.profile) {
      return {
        summary: {
          ...empty,
          notice:
            'No clear repetitions were seen, so the demonstration wasn’t saved. Please try again.',
        },
      };
    }
    const reference: PlanReference = {
      ...analysis.profile,
      exerciseId: exercise.id,
      source: 'demonstration',
      savedAt: new Date().toISOString(),
      videoId: parseYouTubeId(plan.videos?.[exercise.id]) ?? undefined,
    };
    return {
      planUpdate: { ...plan, reference },
      summary: { ...empty, demoSaved: analysis.profile },
    };
  }
  const reference = referenceFor(plan, exercise);
  const range = sessionRange
    ? reference
      ? {
          ...sessionRange,
          goalDegrees: reference.peakDegrees,
          goalLabel: 'the demonstration',
        }
      : sessionRange
    : null;
  return {
    summary: {
      ...empty,
      range,
      findings: analysis?.findings ?? null,
      comparedWithDemo: Boolean(reference),
    },
    spokenCue: analysis?.cues[0],
  };
}
