/**
 * Step 1 of the Exercise tab (native and web): pick one exercise from large
 * cards, glance at the set-up reminder, then press the one big Start button.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, BigButton, Card, Screen } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { MainTabParamList } from '../../navigation/types';
import ExerciseSelector from './ExerciseSelector';
import { EXERCISE_OPTIONS, ExerciseKey, ExerciseOption } from './exerciseCatalog';

interface ExerciseChooserProps {
  selectedKey: ExerciseKey;
  onSelect: (key: ExerciseKey) => void;
  onStart: () => void;
  /** Shows a spinner on Start (e.g. while the camera opens). */
  starting?: boolean;
  /** Optional message above the list (e.g. a Banner). */
  notice?: React.ReactNode;
}

const TIPS = [
  { icon: 'social-distance', text: 'Stand about 2 metres away' },
  { icon: 'accessibility', text: 'Make sure your whole body is in view' },
];

const ExerciseChooser: React.FC<ExerciseChooserProps> = ({
  selectedKey,
  onSelect,
  onStart,
  starting,
  notice,
}) => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const selected = EXERCISE_OPTIONS.find((o) => o.key === selectedKey);
  const items = EXERCISE_OPTIONS.map((o) => ({
    ...o,
    id: o.exercise.id,
    name: o.title,
  }));

  return (
    <Screen
      testID="exercise-chooser"
      title="Choose an exercise"
      subtitle="Tap one, then press Start."
      footer={
        <BigButton
          label={selected ? `Start ${selected.title.toLowerCase()}` : 'Start'}
          icon="play-arrow"
          onPress={onStart}
          loading={starting}
          testID="start-exercise-button"
          accessibilityHint="Opens the camera and starts counting your repetitions"
        />
      }
    >
      {notice}
      <ExerciseSelector
        exercises={items}
        selectedExercise={items.find((i) => i.key === selectedKey)}
        onExerciseSelect={(item: ExerciseOption) => onSelect(item.key)}
      />

      <Card style={styles.setup} testID="exercise-setup-tips">
        <AppText variant="label" color={colors.textSecondary} accessibilityRole="header">
          BEFORE YOU START
        </AppText>
        {TIPS.map((tip) => (
          <View key={tip.icon} style={styles.tip}>
            <View style={styles.tipIcon}>
              <Icon name={tip.icon} size={24} color={colors.warning} />
            </View>
            <AppText variant="bodyStrong" style={styles.flex}>
              {tip.text}
            </AppText>
          </View>
        ))}
        <BigButton
          variant="ghost"
          compact
          icon="help-outline"
          label="How to set up"
          onPress={() => navigation.navigate('HomeTab', { screen: 'Help' })}
          testID="exercise-setup-help"
          style={styles.helpLink}
        />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  setup: { gap: spacing.md, marginTop: spacing.sm },
  tip: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLink: { alignSelf: 'flex-start', marginLeft: -spacing.md },
});

export default ExerciseChooser;
