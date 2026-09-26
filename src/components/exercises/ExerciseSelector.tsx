/**
 * Large, radio-style exercise cards: icon, name, one line of explanation and
 * the goal. The selected card is marked with a border, tint and a tick (never
 * colour alone).
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText } from '../ui';
import { colors, radii, shadows, spacing } from '../../theme';

export interface SelectableExercise {
  id: string;
  name: string;
  description: string;
  /** MaterialIcons name. */
  icon?: string;
  /** e.g. "12 repetitions". */
  goal?: string;
}

interface ExerciseSelectorProps<T extends SelectableExercise> {
  exercises: T[];
  onExerciseSelect: (exercise: T) => void;
  selectedExercise?: T;
}

function ExerciseSelector<T extends SelectableExercise>({
  exercises,
  onExerciseSelect,
  selectedExercise,
}: ExerciseSelectorProps<T>) {
  return (
    <View
      style={styles.list}
      testID="exercise-selector"
      accessibilityRole="radiogroup"
      accessibilityLabel="Choose an exercise"
    >
      {exercises.map((item) => {
        const selected = selectedExercise?.id === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onExerciseSelect(item)}
            testID={`exercise-${item.id}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            // Web: react-native-web doesn't turn the checked state into aria-checked
            aria-checked={selected}
            accessibilityLabel={`${item.name}. ${item.description}${
              item.goal ? `. ${item.goal}` : ''
            }`}
            style={({ pressed }) => [
              styles.card,
              selected && styles.cardSelected,
              pressed && !selected && styles.cardPressed,
            ]}
          >
            <View style={[styles.icon, selected && styles.iconSelected]}>
              <Icon
                name={item.icon ?? 'directions-run'}
                size={32}
                color={selected ? colors.onPrimary : colors.primary}
              />
            </View>
            <View style={styles.text}>
              <AppText variant="heading">{item.name}</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {item.description}
              </AppText>
              {item.goal ? (
                <View style={styles.goal}>
                  <Icon name="flag" size={18} color={colors.textMuted} />
                  <AppText variant="caption" color={colors.textMuted}>
                    {item.goal}
                  </AppText>
                </View>
              ) : null}
            </View>
            <Icon
              name={selected ? 'check-circle' : 'radio-button-unchecked'}
              size={30}
              color={selected ? colors.primary : colors.border}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 104,
    padding: spacing.md + spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardPressed: { backgroundColor: colors.surfaceMuted },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: { backgroundColor: colors.primary },
  text: { flex: 1, gap: 2 },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});

export default ExerciseSelector;
