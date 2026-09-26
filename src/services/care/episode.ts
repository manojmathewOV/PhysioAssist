/**
 * The care episode: which pathway and phase the patient is in, and whether the
 * treating team has confirmed the programme for it. Exercises are offered only
 * under a confirmed programme; a change of pathway or phase needs confirming
 * again, and an operation starts a fresh programme (nothing from before
 * surgery carries over silently).
 *
 * Plans made before episodes existed have none, and keep working as before.
 */
import type { ExercisePlan } from '../pose/exercisePlan';
import { PHASES, PhaseId, Pathway, pathwayOf } from './pathways';

export interface CareEpisode {
  pathway: string;
  phase: PhaseId;
  /** When the clinician confirmed the programme for this pathway and phase. */
  confirmedAt?: string;
  /** Specialist-only pathways: a specialist approved this patient's programme. */
  specialistApproved?: boolean;
}

export type EpisodeStatus =
  /** No episode (older plans): exercises as before. */
  | 'none'
  /** A specialist-only pathway without an approved programme. */
  | 'needs_specialist'
  /** The pathway or phase changed, or was never confirmed. */
  | 'needs_confirmation'
  | 'ready';

export function episodeStatus(plan: ExercisePlan | null | undefined): EpisodeStatus {
  const episode = plan?.episode;
  if (!episode) return 'none';
  const pathway = pathwayOf(episode.pathway);
  if (!pathway) return 'needs_confirmation';
  if (pathway.specialistOnly && !episode.specialistApproved) return 'needs_specialist';
  return episode.confirmedAt ? 'ready' : 'needs_confirmation';
}

/** Whether the patient may be offered exercises now. */
export const exercisesAllowed = (plan: ExercisePlan | null | undefined) => {
  const status = episodeStatus(plan);
  return status === 'none' || status === 'ready';
};

/**
 * Sets the pathway (and phase). Any change needs confirming again. Moving from
 * a before-surgery pathway to another one is the operation's handover: the
 * routine is cleared so the post-operative programme is chosen afresh.
 */
export function setEpisode(
  plan: ExercisePlan,
  pathwayId: string,
  phase?: PhaseId
): ExercisePlan {
  const pathway = pathwayOf(pathwayId);
  if (!pathway) return plan;
  const previous = plan.episode;
  const nextPhase =
    phase && pathway.phases.includes(phase)
      ? phase
      : previous?.pathway === pathwayId && pathway.phases.includes(previous.phase)
        ? previous.phase
        : pathway.phases[0];
  const samePathway = previous?.pathway === pathwayId;
  const unchanged = samePathway && previous?.phase === nextPhase;
  if (unchanged) return plan;
  const handover =
    !samePathway && pathwayOf(previous?.pathway)?.kind === 'before_surgery';
  return {
    ...plan,
    routine: handover ? [] : plan.routine,
    episode: {
      pathway: pathwayId,
      phase: nextPhase,
      confirmedAt: undefined,
      specialistApproved: samePathway ? previous?.specialistApproved : undefined,
    },
  };
}

/** The clinician confirms the programme for the current pathway and phase. */
export function confirmProgramme(
  plan: ExercisePlan,
  now: string = new Date().toISOString()
): ExercisePlan {
  return plan.episode
    ? { ...plan, episode: { ...plan.episode, confirmedAt: now } }
    : plan;
}

export function setSpecialistApproved(
  plan: ExercisePlan,
  approved: boolean
): ExercisePlan {
  return plan.episode
    ? {
        ...plan,
        episode: {
          ...plan.episode,
          specialistApproved: approved,
          confirmedAt: undefined,
        },
      }
    : plan;
}

/**
 * How live coaching behaves: in a comfort phase (protecting a repair,
 * symptom-limited mobility) the app doesn't push for range: no "raise higher"
 * or "bend more", only precautions and set-up.
 */
export function coachingOf(plan: ExercisePlan | null | undefined): 'comfort' | 'target' {
  const phase = plan?.episode?.phase;
  return phase ? PHASES[phase].coaching : 'target';
}

/** The episode's pathway, if any. */
export const pathwayOfPlan = (
  plan: ExercisePlan | null | undefined
): Pathway | undefined => pathwayOf(plan?.episode?.pathway);

/** What the confirmation covers: the exercises and their prescription. */
const confirmedContent = (plan: ExercisePlan) =>
  JSON.stringify([
    plan.joint,
    plan.side,
    plan.goalDegrees,
    plan.extensionGoalDegrees,
    plan.limitDegrees,
    plan.reps,
    plan.holdSeconds,
    plan.routine ?? [],
  ]);

/**
 * A confirmation covers the programme as it was confirmed: changing the
 * exercises or their prescription afterwards needs confirming again.
 */
export function keepConfirmationHonest(
  previous: ExercisePlan | null | undefined,
  next: ExercisePlan
): ExercisePlan {
  const confirmed = next.episode?.confirmedAt;
  if (
    !previous ||
    !confirmed ||
    previous.episode?.confirmedAt !== confirmed ||
    confirmedContent(previous) === confirmedContent(next)
  ) {
    return next;
  }
  return { ...next, episode: { ...next.episode!, confirmedAt: undefined } };
}
