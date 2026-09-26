/**
 * Speaks a live validation result (native and web screens): the one selected
 * cue, with a precaution spoken first and repetitions not celebrated while
 * one applies.
 */
import { audioFeedbackService } from '../../services/audioFeedbackService';
import type { ValidationResult } from '../../types/exercise';
import { liveCue } from '../../utils/liveCue';
import { friendlyInstruction } from './exerciseCatalog';

/** Returns the message if one was spoken. */
export function speakLiveFeedback(
  validation: ValidationResult,
  {
    reps,
    previousReps,
    target,
    outOfView,
    lastSpoken,
  }: {
    reps: number;
    previousReps: number;
    target?: number;
    /** The screen already says "Step back into view". */
    outOfView: boolean;
    lastSpoken: string;
  }
): string | undefined {
  const cue = liveCue(validation);
  if (reps > previousReps && !cue.warning) {
    audioFeedbackService.announceRep(reps, target);
  }
  const message = outOfView ? '' : friendlyInstruction(cue.text);
  if (!message) return undefined;
  if (cue.warning) {
    return audioFeedbackService.speakWarning(message) ? message : undefined;
  }
  return message !== lastSpoken && audioFeedbackService.speakCorrection(message)
    ? message
    : undefined;
}
