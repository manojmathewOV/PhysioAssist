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
import { findExerciseOption } from './exerciseCatalog';

/** "10 times", "Rest still for 30 seconds". */
const amount = (item: TodaysRoutine['items'][number]) => {
  const option = findExerciseOption(item.exerciseId);
  if (item.reps !== undefined) return `${item.reps} times`;
  return option?.goal ?? '';
};

export const TodaysRoutineCard: React.FC<{ routine: TodaysRoutine }> = ({ routine }) => {
  const total = routine.items.length;
  const allDone = routine.doneCount === total;
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
              accessibilityLabel={`${i + 1}. ${option?.title ?? item.exerciseId}, ${amount(
                item
              )}. ${item.done ? 'Done today' : isNext ? 'Next' : 'To do'}`}
              testID={`todays-routine-item-${i}`}
            >
              <View
                style={[
                  styles.marker,
                  item.done && styles.markerDone,
                  isNext && styles.markerNext,
                ]}
              >
                {item.done ? (
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
                  {item.done ? 'Done today' : amount(item)}
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
  markerNext: { backgroundColor: colors.primary },
});

export default TodaysRoutineCard;
