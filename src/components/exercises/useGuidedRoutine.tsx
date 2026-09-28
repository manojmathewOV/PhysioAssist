import PendingActivityNotice from './PendingActivityNotice';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { selectDurableHistory, selectVisibleHistory } from '../../store/historySelectors';
import {
  recordGuidedActivity,
  retryGuidedActivity,
} from '../../store/slices/exerciseSlice';
import { exercisesAllowed } from '../../services/care/episode';
import { applyPlan, ExercisePlan } from '../../services/pose/exercisePlan';
import { todaysRoutine, occurrenceFor } from '../../services/pose/routine';
import { localDay } from '../../utils/progressSummary';
import { guidedShoulderFor, GuidedExercise } from '../../services/care/guidedShoulder';
import type { GuidedActivityOutcome } from '../../services/session/guidedActivity';
import { findExerciseOption } from './exerciseCatalog';
import { routineAmount } from './TodaysRoutineCard';
import GuidedActivity from './GuidedActivity';

interface Selection {
  id: string;
  exercise: GuidedExercise;
  startedAt: number;
  plan: ExercisePlan;
  profileId: string;
  fingerprint: string;
  occurrenceKey: string;
  amount: string;
  day: string;
}
/** Shared entry on web/native: a due permitted routine activity, never synthetic pose. */
export function useGuidedRoutine() {
  const dispatch = useDispatch();
  const plan = useSelector((s: RootState) => s.settings.exercisePlan);
  const history = useSelector(selectDurableHistory);
  const visibleHistory = useSelector(selectVisibleHistory);
  const errors = useSelector((s: RootState) => s.exercise.historySaveErrors);
  const profileId = useSelector((s: RootState) => s.user.currentUser?.id);
  const [selection, setSelection] = useState<Selection | null>(null);
  const fingerprint = JSON.stringify(plan);
  const start = () => {
    if (!plan || !profileId || !exercisesAllowed(plan)) return;
    const now = Date.now();
    const fresh = todaysRoutine(plan, history, now);
    const item = fresh.items[fresh.nextIndex];
    const regular = findExerciseOption(fresh.next);
    const option = regular ?? guidedShoulderFor(plan, fresh.next);
    if (!item || !option || option.exercise.primaryJoint !== plan.joint) return;
    setSelection({
      id: `guided-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      exercise: regular ? applyPlan(regular.exercise, plan) : option.exercise,
      startedAt: now,
      plan,
      profileId,
      fingerprint,
      occurrenceKey: item.key,
      amount: routineAmount(item),
      day: localDay(now),
    });
  };
  const sameUser = selection?.profileId === profileId;
  useEffect(() => {
    if (selection && !sameUser) setSelection(null);
  }, [selection, sameUser]);
  const onRecord = (outcome: GuidedActivityOutcome) => {
    if (!selection || !sameUser) return;
    dispatch(
      recordGuidedActivity({
        id: selection.id,
        exerciseId: selection.exercise.id,
        exerciseName: selection.exercise.name,
        profileId: selection.profileId,
        joint: `${selection.plan.side}_${selection.plan.joint}`,
        episodeId: selection.plan.episode?.id,
        occurrenceKey: selection.occurrenceKey,
        planVersion: selection.plan.version,
        instructionRevision: selection.plan.routine?.find(
          (x) => x.exerciseId === selection.exercise.id
        )?.instructionRevision,
        date: new Date(outcome.endedAt).toISOString(),
        activityDay: localDay(outcome.startedAt),
        duration: Math.floor(outcome.activeMilliseconds / 1000),
        wallSeconds: Math.floor(outcome.wallMilliseconds / 1000),
        pausedSeconds: Math.floor(outcome.pausedMilliseconds / 1000),
        reps: 0,
        formScore: 0,
        measured: false,
        unavailableReason: 'camera_not_used',
        kind: 'activity',
        routineCreditEligible: outcome.routineCreditEligible,
        completionBasis: 'patient_report',
        completion: outcome.completion,
        confirmedByPatient: outcome.completion === 'completed',
        durability: 'pending',
        writeRevision: 1,
      })
    );
  };
  const record = visibleHistory.find((h) => h.id === selection?.id);
  const saveStatus = !record
    ? undefined
    : errors?.[record.id] !== undefined
      ? 'failed'
      : record.durability === 'saved'
        ? 'saved'
        : 'saving';
  return {
    start,
    notice: <PendingActivityNotice />,
    content:
      selection && sameUser ? (
        <GuidedActivity
          key={selection.id}
          exercise={selection.exercise}
          startedAt={selection.startedAt}
          side={selection.plan.side}
          amount={selection.amount}
          videoLink={selection.plan.videos?.[selection.exercise.id]}
          allowed={fingerprint === selection.fingerprint && exercisesAllowed(plan)}
          onStartAllowed={() => {
            const now = Date.now();
            const fresh = todaysRoutine(plan, history, now);
            return (
              fingerprint === selection.fingerprint &&
              exercisesAllowed(plan) &&
              localDay(now) === selection.day &&
              fresh.next === selection.exercise.id &&
              occurrenceFor(fresh, selection.exercise.id) === selection.occurrenceKey
            );
          }}
          onRecord={onRecord}
          saveStatus={saveStatus}
          onRetrySave={() => dispatch(retryGuidedActivity(selection.id))}
          onExit={() => setSelection(null)}
        />
      ) : null,
  };
}
