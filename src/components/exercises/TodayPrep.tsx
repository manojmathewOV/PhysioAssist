/**
 * The patient's Exercise screen when the physiotherapist has set a routine:
 * no choosing. It shows the next exercise, how to set up for it (and the
 * physio's video, if there is one), and one button: "I'm ready". Set-up
 * controls live behind "Physio set-up".
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, Banner, BigButton, Card, Screen } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import type { TodaysRoutine } from '../../services/pose/routine';
import ExerciseVideo from '../video/ExerciseVideo';
import { parseYouTubeId, parseYouTubeStart } from '../../utils/youtube';
import { findExerciseOption } from './exerciseCatalog';
import TodaysRoutineCard, { routineAmount } from './TodaysRoutineCard';

export interface TodayPrepProps {
  routine: TodaysRoutine;
  plan: ExercisePlan;
  /** Start the next exercise. */
  onReady: () => void;
  /** Start a particular exercise again (once today's are all done). */
  onRepeat: (exerciseId: string) => void;
  onOpenSetup: () => void;
  onHelp: () => void;
  starting?: boolean;
  notice?: React.ReactNode;
}

const TodayPrep: React.FC<TodayPrepProps> = ({
  routine,
  plan,
  onReady,
  onRepeat,
  onOpenSetup,
  onHelp,
  starting,
  notice,
}) => {
  const nextItem = routine.items.find((i) => i.exerciseId === routine.next);
  const option = nextItem ? findExerciseOption(nextItem.exerciseId) : undefined;
  const total = routine.items.length;
  const videoLink = option ? plan.videos?.[option.exercise.id] : undefined;
  const videoId = parseYouTubeId(videoLink);
  const position = nextItem ? routine.items.indexOf(nextItem) + 1 : 0;

  return (
    <Screen
      testID="today-prep"
      title="Today’s exercises"
      subtitle={`${routine.doneCount} of ${total} done`}
      footer={
        option ? (
          <BigButton
            label="I’m ready"
            icon="play-arrow"
            onPress={onReady}
            loading={starting}
            testID="start-routine-button"
            accessibilityHint={`Opens the camera for ${option.title.toLowerCase()}`}
          />
        ) : undefined
      }
    >
      {notice}
      {option && nextItem ? (
        <Card style={styles.card} testID="today-next">
          <AppText variant="label" color={colors.primary}>
            {`NEXT · ${position} OF ${total}`}
          </AppText>
          <AppText variant="heading" accessibilityRole="header" testID="today-next-title">
            {option.title}
          </AppText>
          <AppText variant="bodyStrong" color={colors.textSecondary}>
            {routineAmount(nextItem)}
          </AppText>
          {videoId ? (
            <View style={styles.video}>
              <ExerciseVideo
                videoId={videoId}
                start={parseYouTubeStart(videoLink)}
                testID="today-video"
              />
              <AppText variant="body" color={colors.textSecondary}>
                Watch how it’s done, then press I’m ready.
              </AppText>
            </View>
          ) : null}
          <AppText variant="label" color={colors.textSecondary} style={styles.section}>
            HOW TO SET UP
          </AppText>
          <View>
            {option.exercise.instructions.map((step, i) => (
              <View
                key={step}
                style={styles.step}
                accessible
                accessibilityLabel={`Step ${i + 1}. ${step}`}
              >
                <View style={styles.stepNumber}>
                  <AppText variant="bodyStrong" color={colors.primary}>
                    {`${i + 1}`}
                  </AppText>
                </View>
                <AppText variant="body" style={styles.flex}>
                  {step}
                </AppText>
              </View>
            ))}
          </View>
          {option.exercise.warnings?.[0] ? (
            <Banner tone="warning" message={option.exercise.warnings[0]} />
          ) : null}
        </Card>
      ) : (
        <Card style={styles.card} testID="today-all-done">
          <View style={styles.doneRow}>
            <View style={styles.doneIcon}>
              <Icon name="check" size={32} color={colors.onPrimary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" accessibilityRole="header">
                All done for today
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                Rest is part of getting better. To do one again, tap it below.
              </AppText>
            </View>
          </View>
        </Card>
      )}

      <TodaysRoutineCard
        routine={routine}
        onPressItem={routine.next ? undefined : onRepeat}
      />

      <View style={styles.links}>
        <BigButton
          variant="ghost"
          compact
          icon="help-outline"
          label="Where to put the phone"
          onPress={onHelp}
          testID="exercise-setup-help"
        />
        <BigButton
          variant="ghost"
          compact
          icon="tune"
          label="Physio set-up"
          onPress={onOpenSetup}
          testID="exercise-setup-open"
          accessibilityHint="For your physiotherapist or carer: exercises, goals and videos"
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.sm },
  section: { marginTop: spacing.sm },
  video: { gap: spacing.sm, marginTop: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doneIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: { alignItems: 'flex-start', gap: spacing.xs },
});

export default TodayPrep;
