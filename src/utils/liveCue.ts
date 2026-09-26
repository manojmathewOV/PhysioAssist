/**
 * The one instruction shown and spoken for a live validation result. A
 * precaution (past the physio's limit) or a set-up block (angle withheld from
 * this view) wins over everything: praise, target-seeking ("bend more") and
 * hold countdowns never appear alongside it.
 */
import type { ValidationResult } from '../types/exercise';

export interface LiveCue {
  text: string;
  /** A precaution: shown and spoken first, and repetitions aren't celebrated. */
  warning: boolean;
}

/**
 * `hold`: a still exercise (heel prop). The patient relaxes, so there is no
 * "straighten more" or countdown coaching; only precautions, set-up blocks
 * and "can't see you" come through.
 */
export function liveCue(
  result: ValidationResult | null | undefined,
  { hold = false }: { hold?: boolean } = {}
): LiveCue {
  if (!result) return { text: '', warning: false };
  if (result.overLimit || result.withheld) {
    return { text: result.errors[0] ?? '', warning: Boolean(result.overLimit) };
  }
  if (hold) {
    return {
      text: result.errors.find((e) => /^Cannot detect/.test(e)) ?? '',
      warning: false,
    };
  }
  return { text: result.feedback[0] ?? result.errors[0] ?? '', warning: false };
}
