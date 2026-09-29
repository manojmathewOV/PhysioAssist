import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { selectPendingActivities } from '../../store/historySelectors';
import { retryGuidedActivity } from '../../store/slices/exerciseSlice';
import { AppText, BigButton, Card } from '../ui';

/** Saving trouble must not disappear when the patient returns to instructions. */
export default function PendingActivityNotice() {
  const pending = useSelector(selectPendingActivities);
  const errors = useSelector((s: RootState) => s.exercise.historySaveErrors);
  const dispatch = useDispatch();
  if (!pending.length) return null;
  return (
    <Card testID="pending-activity-notice">
      <AppText variant="heading">
        {pending.length === 1
          ? 'An activity is not saved yet'
          : `${pending.length} activities are not saved yet`}
      </AppText>
      <AppText variant="body">
        They are not counted in your routine until saving is confirmed. You do not need to
        repeat the exercise to save it.
      </AppText>
      {pending.slice(0, 3).map((record) => (
        <React.Fragment key={record.id}>
          <AppText variant="bodyStrong">{record.exerciseName}</AppText>
          {record.recordConflict || errors?.[record.id] === 'conflict' ? (
            <AppText variant="body">
              This record conflicts with another copy and needs review. It has not been
              replaced.
            </AppText>
          ) : errors?.[record.id] !== undefined ? (
            <BigButton
              label="Try saving again"
              variant="secondary"
              compact
              onPress={() => dispatch(retryGuidedActivity(record.id))}
              testID={`retry-pending-${record.id}`}
            />
          ) : (
            <AppText variant="body">Waiting for saving to finish…</AppText>
          )}
        </React.Fragment>
      ))}
    </Card>
  );
}
