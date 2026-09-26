/**
 * Today's session: the exercises the physiotherapist assigned, in order, with
 * the ones done today ticked. The patient doesn't choose: Start goes to the
 * next one.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, Card } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { TodaysRoutine } from '../../services/pose/routine';
import { findExerciseOption, formatDuration } from './exerciseCatalog';
import { movementOf } from '../../services/movement/exerciseMovement';
import type { PrescribedExercise } from '../../services/pose/exercisePlan';
import type { Completion } from '../../services/pose/routine';

/** "10 times", "Rest still for 1 min": the prescription, else the exercise's default. */
export const routineAmount = (item: PrescribedExercise): string => {
  const option = findExerciseOption(item.exerciseId);
  if (movementOf(item.exerciseId).mode === 'hold') {
    const ms = item.holdSeconds
      ? item.holdSeconds * 1000
      : option?.exercise.phases[0]?.holdDuration;
    return ms ? `Rest still for ${formatDuration(ms / 1000)}` : option?.goal ?? '';
  }
  const reps = item.reps ?? option?.exercise.targetRepetitions;
  return reps ? `${reps} times` : option?.goal ?? '';
};

const STATUS_WORDS: Record<Completion, string> = {
  completed: 'Done today',
  stopped_early: 'Stopped early today',
  attempted: 'Tried today, not finished',
};

export const TodaysRoutineCard: React.FC<{ routine: TodaysRoutine }> = ({ routine }) => {
  const total = routine.items.length;
  const allDone = routine.finishedCount === total;
  return (
    <Card style={styles.card} testID="todays-routine">
      <AppText variant="label" color={colors.textSecondary} accessibilityRole="header">
        TODAY’S SESSION
      </AppText>
      <AppText variant="heading" testID="todays-routine-status">
        {allDone
          ? 'All done for today'
          : `${routine.doneCount} of ${total} ${total === 1 ? 'exercise' : 'exercises'} done`}
      </AppText>
      <View accessibilityRole="list">
        {routine.items.map((item, i) => {
          const option = findExerciseOption(item.exerciseId);
          const isNext = item.exerciseId === routine.next;
          return (
            <View
              key={item.exerciseId}
              style={[styles.row, i > 0 && styles.divider]}
              accessible
              accessibilityLabel={`${i + 1}. ${option?.title ?? item.exerciseId}, ${routineAmount(
                item
              )}. ${item.status ? STATUS_WORDS[item.status] : isNext ? 'Next' : 'To do'}`}
              testID={`todays-routine-item-${i}`}
            >
              <View
                style={[
                  styles.marker,
                  item.done && styles.markerDone,
                  item.status === 'stopped_early' && styles.markerStopped,
                  isNext && styles.markerNext,
                ]}
              >
                {item.finished ? (
                  <Icon name="check" size={22} color={colors.onPrimary} />
                ) : (
                  <AppText
                    variant="bodyStrong"
                    color={isNext ? colors.onPrimary : colors.textSecondary}
                  >
                    {`${i + 1}`}
                  </AppText>
                )}
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{option?.title ?? item.exerciseId}</AppText>
                <AppText variant="body" color={colors.textSecondary}>
                  {item.status && item.status !== 'attempted'
                    ? STATUS_WORDS[item.status]
                    : routineAmount(item)}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  marker: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: { backgroundColor: colors.success },
  markerStopped: { backgroundColor: colors.textSecondary },
  markerNext: { backgroundColor: colors.primary },
});

export default TodaysRoutineCard;
