/**
 * Records a session for the joint of interest and analyses it at the end:
 * range, tempo, hold and compensations, compared with the physio's
 * demonstration (if one was saved for this exercise) or the prescribed goal.
 */
import { movementOf } from '../../services/movement/exerciseMovement';
import type { SessionResult } from '../../store/slices/exerciseSlice';
import { useCallback, useRef } from 'react';

import type { Exercise } from '../../types/exercise';
import type { ProcessedPoseData } from '../../types/pose';
import {
  ExercisePlan,
  PlanReference,
  goalDegreesOf,
  hasExtendedSupport,
  routineItem,
} from '../../services/pose/exercisePlan';
import { MovementRecorder } from '../../services/movement/recorder';
import {
  MeasurementResult,
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
    const holdSeconds = routineItem(plan, exercise.id)?.holdSeconds ?? plan?.holdSeconds;
    return analyseSession(
      rec.frames,
      rec.context,
      {
        reference,
        goalDegrees: goalDegreesOf(exercise),
        holdMs: holdSeconds !== undefined ? holdSeconds * 1000 : undefined,
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
    /** Repetitions from the movement analysis, when the live counter can't count them. */
    reps?: number;
  };
  /** Said after "Well done" (the most important thing to work on). */
  spokenCue?: string;
  /**
   * What to save in the history, when the live counter's result is wrong for
   * this exercise (rotation, still measurements); otherwise its own is used.
   */
  historyResult?: SessionResult;
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
  const movement = movementOf(exercise.id);
  const joint =
    sessionRange?.joint ??
    (plan && exercise.primaryJoint ? `${plan.side}_${exercise.primaryJoint}` : undefined);
  // Repetitions the live counter can't count (it tracks a different quantity)
  const reps = movement.measure && analysis ? analysis.reps.length : undefined;
  // The clinician's prescription sets the goal; a demonstration explains the
  // movement and only stands in when nothing was prescribed. (A goal set for
  // the joint's usual range doesn't apply to rotation.)
  const prescribed = movement.measure ? undefined : sessionRange?.goalDegrees;

  let range: RangeResultProps | null = null;
  let notice: string | undefined;
  let historyResult: SessionResult | undefined;
  if (analysis && joint) {
    // With the movement analysis, its result is the only one: an unavailable
    // measurement stays unavailable (never a live reading, never zero)
    const r = analysis.result;
    const measured = r.status === 'measured' && r.degrees !== undefined;
    const common = {
      joint,
      direction: movement.direction,
      measure: movement.measure ? 'rotation' : undefined,
      approximate: measured ? r.approximate : undefined,
    };
    if (measured) {
      const useDemo = prescribed === undefined && reference && !movement.measure;
      range = {
        ...common,
        bestDegrees: Math.round(r.degrees as number),
        goalDegrees: useDemo ? reference.peakDegrees : prescribed,
        goalLabel: useDemo ? 'the demonstration' : undefined,
      };
    } else {
      notice = unavailableNotice(joint, r.reason);
    }
    historyResult = {
      ...common,
      bestDegrees: measured ? Math.round(r.degrees as number) : undefined,
      goalDegrees: prescribed,
      measured,
      unavailableReason: measured ? undefined : r.reason,
      reps,
      planVersion: plan?.version,
    };
  } else if (sessionRange) {
    // No movement analysis (no plan): the live counter's range
    range = reference
      ? {
          ...sessionRange,
          goalDegrees: sessionRange.goalDegrees ?? reference.peakDegrees,
        }
      : sessionRange;
  }
  return {
    historyResult,
    summary: {
      ...empty,
      range,
      findings: analysis?.findings ?? null,
      comparedWithDemo: Boolean(reference),
      reps,
      notice,
    },
    spokenCue: analysis?.cues[0],
  };
}

const REASON_TEXT: Record<NonNullable<MeasurementResult['reason']>, string> = {
  camera_view: 'the camera couldn’t see it from the right angle',
  not_seen: 'it wasn’t clearly in view',
  no_repetitions: 'no complete repetitions were seen',
  not_still: 'it didn’t stay still long enough to measure',
};

/** "We couldn't measure your left knee today: ..." (the session still counts). */
export function unavailableNotice(
  joint: string,
  reason: MeasurementResult['reason']
): string {
  const name = joint.replace(/_/g, ' ');
  return `We couldn’t measure your ${name} today${
    reason ? `: ${REASON_TEXT[reason]}` : ''
  }. Your exercise still counts.`;
}
