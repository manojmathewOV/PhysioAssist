import { dayKey, localDay } from '../utils/progressSummary';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

/** Known-owner records never appear under another local profile. Legacy ownership is not invented. */
export const selectVisibleHistory = createSelector(
  [(s: RootState) => s.exercise.history, (s: RootState) => s.user.currentUser?.id],
  (history, profileId) =>
    history.filter((h) => h.profileId === undefined || h.profileId === profileId)
);

/** Routine/progress read acknowledged activity, not an optimistic pending save. */
export const selectDurableHistory = createSelector(selectVisibleHistory, (history) =>
  history.filter((h) => h.durability !== 'pending')
);

export const selectPendingActivities = createSelector(selectVisibleHistory, (history) =>
  history.filter((h) => h.kind === 'activity' && h.durability === 'pending')
);

/** An unsaved report blocks only its own programme occurrence, not other care. */
export function pendingForOccurrence(
  history: readonly RootState['exercise']['history'][number][],
  plan: import('../services/pose/exercisePlan').ExercisePlan | null | undefined,
  key: string | undefined,
  now: number = Date.now()
): boolean {
  return (
    !!plan &&
    !!key &&
    history.some(
      (h) =>
        h.kind === 'activity' &&
        h.durability === 'pending' &&
        h.occurrenceKey === key &&
        (h.activityDay ?? dayKey(h.date)) === localDay(now) &&
        h.joint === `${plan.side}_${plan.joint}` &&
        h.episodeId === plan.episode?.id &&
        h.planVersion === plan.version
    )
  );
}
