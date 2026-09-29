import { guidedShoulderFor, isGuidedShoulder } from '../../services/care/guidedShoulder';
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
  onWithoutCamera?: () => void;
  /** Start a particular exercise again (once today's are all done). */
  onRepeat: (exerciseId: string) => void;
  onOpenSetup: () => void;
  onHelp: () => void;
  starting?: boolean;
  notice?: React.ReactNode;
  pendingActivity?: boolean;
}

/** "14:30" in the patient's own clock format. */
const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** What to say when nothing is due now. */
export function waitingWords(routine: TodaysRoutine): {
  title: string;
  body: string;
  done: boolean;
  testID: string;
} {
  if (routine.scheduleInvalid) {
    return {
      title: 'Your programme is being prepared',
      body: 'The timing of your mini-sessions needs checking in programme set-up.',
      done: false,
      testID: 'today-schedule-incomplete',
    };
  }
  if (routine.nextDueAt !== undefined) {
    return {
      title: `Next mini-session from ${timeOf(routine.nextDueAt)}`,
      body: routine.roundsDone
        ? `Mini-session ${routine.roundsDone} done. Rest until then; there is nothing to make up.`
        : 'Your first mini-session of the day starts then.',
      done: Boolean(routine.roundsDone),
      testID: 'today-next-round',
    };
  }
  if (routine.restOfDay) {
    return {
      title: 'That’s all for today',
      body: routine.roundsDone
        ? `${routine.roundsDone} mini-session${routine.roundsDone === 1 ? '' : 's'} done today. Missed ones aren’t made up; carry on tomorrow.`
        : 'Your mini-sessions start again tomorrow. Missed ones aren’t made up.',
      done: true,
      testID: 'today-rest-of-day',
    };
  }
  return {
    title:
      routine.items.length > 0 && routine.doneCount < routine.items.length
        ? 'Activities recorded for today'
        : 'All done for today',
    body: 'Follow your programme for what to do next. There is no need to repeat an exercise to get another measurement.',
    done: true,
    testID: 'today-all-done',
  };
}

const TodayPrep: React.FC<TodayPrepProps> = ({
  routine,
  plan,
  onReady,
  onWithoutCamera,
  onRepeat,
  onOpenSetup,
  onHelp,
  starting,
  notice,
  pendingActivity = false,
}) => {
  const nextItem = routine.nextIndex >= 0 ? routine.items[routine.nextIndex] : undefined;
  const regular = nextItem ? findExerciseOption(nextItem.exerciseId) : undefined;
  const guided = nextItem ? guidedShoulderFor(plan, nextItem.exerciseId) : undefined;
  const option = regular ?? guided;
  const needsGuidedSetup = nextItem && isGuidedShoulder(nextItem.exerciseId) && !guided;
  const total = routine.items.length;
  const videoLink = option ? plan.videos?.[option.exercise.id] : undefined;
  const videoId = parseYouTubeId(videoLink);
  const position = routine.nextIndex + 1;
  const waitState = waitingWords(routine);

  return (
    <Screen
      testID="today-prep"
      title="Today’s exercises"
      subtitle={
        routine.round
          ? `Mini-session ${routine.round} · ${routine.doneCount} of ${total} done`
          : `${routine.doneCount} of ${total} done`
      }
      footer={
        option ? (
          <>
            <BigButton
              label={
                pendingActivity
                  ? 'Activity awaiting save'
                  : guided
                    ? 'Get ready'
                    : 'I’m ready'
              }
              icon="play-arrow"
              onPress={() => {
                if (guided) onWithoutCamera?.();
                else onReady();
              }}
              loading={starting}
              disabled={pendingActivity || Boolean(guided && !onWithoutCamera)}
              testID="start-routine-button"
              accessibilityHint={
                guided
                  ? 'Opens preparation; the timer starts only when you are ready'
                  : `Opens the camera for ${option.title.toLowerCase()}`
              }
            />
            {onWithoutCamera && !guided ? (
              <BigButton
                label="Exercise without camera"
                variant="secondary"
                onPress={onWithoutCamera}
                disabled={pendingActivity}
                testID="start-without-camera"
              />
            ) : null}
          </>
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
                Watch how it’s done, then press {guided ? 'Get ready' : 'I’m ready'}.
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
        <Card style={styles.card} testID={waitState.testID}>
          <View style={styles.doneRow}>
            <View style={[styles.doneIcon, !waitState.done && styles.waitIcon]}>
              <Icon
                name={waitState.done ? 'check' : 'schedule'}
                size={32}
                color={waitState.done ? colors.onPrimary : colors.primary}
              />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" accessibilityRole="header">
                {needsGuidedSetup ? 'Check the exercise instructions' : waitState.title}
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {needsGuidedSetup
                  ? 'The prescribed amount or instruction version needs checking in programme set-up before this activity can start.'
                  : waitState.body}
              </AppText>
            </View>
          </View>
        </Card>
      )}

      <TodaysRoutineCard
        routine={routine}
        // Doing one again only once today's are all done (not while a timed
        // mini-session programme is waiting for its next round)
        onPressItem={
          routine.next ||
          routine.round ||
          routine.items.some((item) => isGuidedShoulder(item.exerciseId))
            ? undefined
            : onRepeat
        }
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
          label="Programme set-up"
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
  waitIcon: { backgroundColor: colors.primarySoft },
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

/**
 * The patient's screen while the programme isn't confirmed (new pathway or
 * phase, or a specialist programme awaited): no exercises, and why.
 */
export const ProgrammeWaiting: React.FC<{
  needsSpecialist: boolean;
  onOpenSetup: () => void;
  onHelp: () => void;
}> = ({ needsSpecialist, onOpenSetup, onHelp }) => (
  <Screen testID="programme-waiting" title="Today’s exercises">
    <Card style={waitingStyles.card}>
      <View style={waitingStyles.row}>
        <View style={waitingStyles.icon}>
          <Icon name="hourglass-empty" size={28} color={colors.primary} />
        </View>
        <AppText variant="heading" style={waitingStyles.flex} accessibilityRole="header">
          Your programme is being prepared
        </AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        {needsSpecialist
          ? 'This programme needs specialist approval before it is used. Follow the instructions you were given and confirm their details in programme set-up.'
          : 'Check the exercises for this stage against the programme you were given, then confirm those details in programme set-up. This app is not monitored by a clinician.'}
      </AppText>
    </Card>
    <View style={waitingStyles.links}>
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
        label="Programme set-up"
        onPress={onOpenSetup}
        testID="exercise-setup-open"
        accessibilityHint="For your physiotherapist or carer: exercises, goals and videos"
      />
    </View>
  </Screen>
);

const waitingStyles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: { alignItems: 'flex-start', gap: spacing.xs },
});
