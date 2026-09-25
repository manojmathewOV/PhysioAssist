/**
 * ExerciseSummary: a calm, celebratory summary shown after the patient stops
 * an exercise. Reps, time and form (in words), an optional 0-10 pain check,
 * then "Done" and "Do another".
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, Banner, BigButton, Card, Metric, Screen } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { formatDuration } from './exerciseCatalog';
import PainScale from './PainScale';
import RangeResult, { RangeResultProps } from './RangeResult';
import { DemonstrationSaved, MovementFeedback } from './MovementFeedback';
import type { Finding } from '../../services/movement/types';
import type { MovementProfile } from '../../services/movement/analysis';

/** Pain at or above this (0-10) asks the patient to tell their physio. */
export const HIGH_PAIN = 7;

export interface ExerciseSummaryProps {
  exercise?: string;
  reps?: number;
  /** Seconds. */
  duration?: number;
  /** 0–100. */
  score?: number;
  /** 0–100. */
  formAccuracy?: number;
  calories?: number;
  targetReps?: number;
  previousBestScore?: number;
  /** Shown as the main action ("Done"). */
  onDone?: () => void;
  /** Shown as the secondary action ("Do another"). */
  onRepeat?: () => void;
  /** Practice mode: nothing was saved. */
  practice?: boolean;
  /**
   * Asks "How much pain did you feel?" (0-10) when set. Answering is optional.
   */
  onPainSelect?: (score: number) => void;
  /** Initial pain answer, if already given. */
  painScore?: number | null;
  /** Best range for the joint of interest vs the goal they were given. */
  range?: RangeResultProps | null;
  /** Things to work on, from the session analysis (null = not analysed). */
  findings?: Finding[] | null;
  comparedWithDemo?: boolean;
  /** Set when this session was the physio's demonstration. */
  demoSaved?: MovementProfile | null;
  /** A message to show at the top (e.g. the demonstration couldn't be saved). */
  notice?: string;
}

const formWords = (percent: number, reps: number) => {
  if (reps === 0 && percent === 0) {
    return 'Not measured';
  }
  return percent >= 80
    ? 'Excellent form'
    : percent >= 60
      ? 'Good form'
      : 'Keep practising';
};

const encouragement = (percent: number, reps: number, reachedGoal: boolean) => {
  if (reps === 0) {
    return 'No repetitions were counted this time. Check that your whole body is in view and try again when you are ready.';
  }
  if (reachedGoal) {
    return 'You reached your goal. Rest for a minute before your next exercise.';
  }
  if (percent >= 80) {
    return 'Your movements were smooth and steady. Keep it up.';
  }
  if (percent >= 60) {
    return 'Good effort. Move slowly and keep your posture steady.';
  }
  return 'Every session helps. Take it slowly and focus on steady movements.';
};

const ExerciseSummary: React.FC<ExerciseSummaryProps> = ({
  exercise = 'Exercise',
  reps = 0,
  duration = 0,
  score = 0,
  formAccuracy,
  calories = 0,
  targetReps,
  previousBestScore,
  onDone,
  onRepeat,
  practice,
  onPainSelect,
  painScore = null,
  range,
  findings,
  comparedWithDemo,
  demoSaved,
  notice,
}) => {
  const [pain, setPain] = useState<number | null>(painScore);
  const choosePain = (value: number) => {
    setPain(value);
    onPainSelect?.(value);
  };
  const percent = Math.round(formAccuracy ?? score);
  const reachedGoal = !!targetReps && reps >= targetReps;
  const isPersonalBest = previousBestScore !== undefined && score > previousBestScore;
  const didReps = reps > 0;

  const footer =
    onDone || onRepeat ? (
      <>
        {onDone ? (
          <BigButton label="Done" icon="check" onPress={onDone} testID="done-button" />
        ) : null}
        {onRepeat ? (
          <BigButton
            label="Do another"
            icon="replay"
            variant="secondary"
            onPress={onRepeat}
            testID="retry-button"
          />
        ) : null}
      </>
    ) : undefined;

  return (
    <Screen testID="exercise-summary" footer={footer}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, !didReps && styles.heroIconNeutral]}>
          <Icon
            name={didReps ? 'celebration' : 'self-improvement'}
            size={44}
            color={didReps ? colors.success : colors.primary}
          />
        </View>
        <AppText variant="display" center accessibilityRole="header">
          {didReps ? 'Well done!' : 'Good try'}
        </AppText>
        <AppText variant="body" color={colors.textSecondary} center>
          You finished: {exercise}
        </AppText>
      </View>

      {isPersonalBest ? <Banner tone="success" message="New personal best!" /> : null}

      <Card style={styles.card}>
        <View style={styles.statsRow}>
          <View style={styles.repsCol}>
            <Metric
              value={String(reps)}
              label={reps === 1 ? 'repetition' : 'repetitions'}
              color={colors.primary}
              testID="reps-completed"
            />
          </View>
          <View style={styles.statsCol}>
            <Stat
              icon="timer"
              label="Time"
              value={formatDuration(duration)}
              testID="exercise-duration"
            />
            <Stat
              icon="thumb-up"
              label="Form"
              value={formWords(percent, reps)}
              testID="form-accuracy"
            />
          </View>
        </View>

        {targetReps ? (
          <View style={[styles.goal, reachedGoal && styles.goalReached]}>
            <Icon
              name={reachedGoal ? 'check-circle' : 'flag'}
              size={22}
              color={reachedGoal ? colors.success : colors.textSecondary}
            />
            <AppText
              variant="bodyStrong"
              color={reachedGoal ? colors.success : colors.textSecondary}
            >
              {reachedGoal ? `Goal of ${targetReps} reached` : `Your goal: ${targetReps}`}
            </AppText>
          </View>
        ) : null}

        {calories > 0 ? (
          <Stat icon="local-fire-department" label="Energy" value={`${calories} kcal`} />
        ) : null}
        {previousBestScore !== undefined ? (
          <Stat
            icon="emoji-events"
            label="Previous best"
            value={`${previousBestScore} / 100`}
          />
        ) : null}
      </Card>

      {notice ? <Banner tone="warning" message={notice} testID="summary-notice" /> : null}
      {demoSaved ? <DemonstrationSaved profile={demoSaved} /> : null}
      {range ? <RangeResult {...range} /> : null}
      {findings ? (
        <MovementFeedback findings={findings} comparedWithDemo={comparedWithDemo} />
      ) : null}

      {onPainSelect ? (
        <Card style={styles.card} testID="pain-check">
          <View>
            <AppText variant="heading" accessibilityRole="header">
              How much pain did you feel?
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Tap a number. You can skip this.
            </AppText>
          </View>
          <PainScale value={pain} onChange={choosePain} />
          {pain !== null && pain >= HIGH_PAIN ? (
            <Banner
              tone="warning"
              message="Please tell your physiotherapist about this pain before your next session."
              testID="pain-warning"
            />
          ) : pain !== null ? (
            <View style={styles.painSaved} testID="pain-saved">
              <Icon name="check" size={22} color={colors.success} />
              <AppText variant="bodyStrong" color={colors.success}>
                Thank you. Pain {pain} out of 10{practice ? '' : ' saved'}.
              </AppText>
            </View>
          ) : null}
        </Card>
      ) : null}

      {practice ? (
        <Banner tone="info" message="Practice mode: this session was not saved." />
      ) : null}
      <View style={styles.note} testID="summary-encouragement">
        <Icon name="favorite-border" size={24} color={colors.warning} />
        <AppText variant="body" style={styles.flex}>
          {encouragement(percent, reps, reachedGoal)}
        </AppText>
      </View>
    </Screen>
  );
};

const Stat: React.FC<{
  icon: string;
  label: string;
  value: string;
  testID?: string;
}> = ({ icon, label, value, testID }) => (
  <View
    style={styles.stat}
    accessible
    accessibilityLabel={`${label}: ${value}`}
    testID={testID}
  >
    <View style={styles.statIcon}>
      <Icon name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.flex}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', gap: spacing.xs },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroIconNeutral: { backgroundColor: colors.primarySoft },
  card: { gap: spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  repsCol: { minWidth: 110, alignItems: 'center' },
  statsCol: { flex: 1, gap: spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  goalReached: { backgroundColor: colors.successSoft },
  painSaved: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  note: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.accentSoft,
  },
});

export default ExerciseSummary;
