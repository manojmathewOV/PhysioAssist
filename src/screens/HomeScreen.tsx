import PendingActivityNotice from '../components/exercises/PendingActivityNotice';
import { guidedShoulderTitle } from '../services/care/guidedShoulder';
import { selectDurableHistory } from '../store/historySelectors';
/**
 * Home: a calm daily summary with one obvious action.
 *
 * Fitness-style: one goal ring for today's repetitions and a week of day dots.
 * Health-style: flat summary cards with a coloured category header, one big
 * number and a plain-language sentence.
 */
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

import type { RootState } from '../store';
import { ActionTile, AppText, BigButton, Screen } from '../components/ui';
import {
  Highlight,
  ProgressRing,
  SummaryCard,
  WeekStrip,
} from '../components/ui/summary';
import { colors, spacing } from '../theme';
import type { MainTabParamList } from '../navigation/types';
import {
  currentStreak,
  currentWeek,
  repsToday,
  weeklyHighlight,
} from '../utils/progressSummary';
import { exercisesAllowed } from '../services/care/episode';
import { waitingWords } from '../components/exercises/TodayPrep';
import { useRoutineClock } from '../components/exercises/useRoutineClock';
import {
  findExerciseOption,
  formatDuration,
} from '../components/exercises/exerciseCatalog';
import { movementOf } from '../services/movement/exerciseMovement';

const greeting = (hour: number) =>
  hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'long' });

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const name = useSelector((s: RootState) => s.user.currentUser?.name);
  const history = useSelector(selectDurableHistory);
  const goal = useSelector((s: RootState) => s.settings.dailyRepGoal ?? 30);
  const plan = useSelector((s: RootState) => s.settings.exercisePlan);
  // The physio's routine, when one is set, is what "today" means
  // Kept current as time passes (a mini-session becoming due, midnight)
  const { routine } = useRoutineClock(plan, history);
  const hasRoutine = routine.items.length > 0;
  // Not confirmed for this stage of recovery: no exercises offered
  const waiting = !exercisesAllowed(plan);
  // Timed mini-sessions: between rounds, or an unfinished schedule
  const roundWait =
    !waiting && routine.nextIndex < 0 && (routine.round || routine.scheduleInvalid)
      ? waitingWords(routine)
      : undefined;
  const routineLeft = routine.items.length - routine.finishedCount;
  // Small phones: the ring above the words, so words aren't broken up
  const narrow = useWindowDimensions().width < 360;
  const nextTitle = routine.next
    ? (
        findExerciseOption(routine.next)?.title ??
        guidedShoulderTitle(routine.next) ??
        ''
      ).toLowerCase()
    : '';

  const firstName = name?.split(' ')[0];
  const today = repsToday(history);
  const remaining = Math.max(0, goal - today);
  const week = currentWeek(history);
  const activeDays = week.filter((d) => d.active).length;
  const streak = currentStreak(history);
  const highlight = weeklyHighlight(history);
  const last = history[0];
  const lastIsHold = last ? movementOf(last.exerciseId).mode === 'hold' : false;
  const startExercises = () => navigation.navigate('Exercise');

  return (
    <Screen
      testID="home-screen"
      title={`${greeting(new Date().getHours())}${firstName ? `, ${firstName}` : ''}`}
      subtitle={new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}
    >
      <PendingActivityNotice />
      {/* Today: one ring, one sentence, one button */}
      <SummaryCard
        icon="directions-run"
        category="Exercise"
        tint={colors.category.exercise}
        when="Today"
        testID="home-today"
      >
        {roundWait ? (
          <View style={styles.waiting} testID="home-round-wait">
            <AppText variant="heading">{roundWait.title}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {roundWait.body}
            </AppText>
          </View>
        ) : waiting ? (
          <View style={styles.waiting} testID="home-waiting">
            <AppText variant="heading">Your programme is being prepared</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Your programme needs confirmation for this stage. Check it against the
              instructions you were given before starting.
            </AppText>
          </View>
        ) : hasRoutine ? (
          <View
            style={[styles.todayRow, narrow && styles.todayStack]}
            testID="home-routine"
          >
            <ProgressRing
              progress={routine.doneCount / routine.items.length}
              size={132}
              thickness={16}
              testID="home-goal-ring"
              accessibilityLabel={`${routine.doneCount} of ${routine.items.length} exercises done today`}
            >
              <AppText variant="value">{routine.doneCount}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {`of ${routine.items.length}`}
              </AppText>
            </ProgressRing>
            <View style={narrow ? undefined : styles.flex}>
              <AppText variant="heading">
                {routineLeft === 0
                  ? routine.doneCount === routine.items.length
                    ? 'Today’s exercises done'
                    : 'Today’s activities recorded'
                  : `${routineLeft} ${routineLeft === 1 ? 'exercise' : 'exercises'} to go`}
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {routineLeft === 0
                  ? routine.doneCount === routine.items.length
                    ? 'Lovely work today. Rest is part of getting better.'
                    : 'Some activities were stopped early. They are recorded separately.'
                  : `Next: ${nextTitle}`}
              </AppText>
            </View>
          </View>
        ) : (
          <View style={[styles.todayRow, narrow && styles.todayStack]}>
            <ProgressRing
              progress={today / goal}
              size={132}
              thickness={16}
              testID="home-goal-ring"
              accessibilityLabel={`${today} of ${goal} repetitions today`}
            >
              <AppText variant="value">{today}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                of {goal}
              </AppText>
            </ProgressRing>
            <View style={narrow ? undefined : styles.flex}>
              <AppText variant="heading">
                {remaining === 0 ? 'Goal reached' : `${remaining} to go`}
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {remaining === 0
                  ? 'Lovely work today. Rest is part of getting better.'
                  : 'repetitions to reach today’s goal'}
              </AppText>
            </View>
          </View>
        )}
        {waiting || roundWait ? null : hasRoutine && routineLeft === 0 ? (
          <BigButton
            variant="secondary"
            label="See my progress"
            icon="insights"
            onPress={() => navigation.navigate('Progress')}
            testID="home-see-progress"
          />
        ) : (
          <BigButton
            label={
              hasRoutine
                ? routine.items.some((i) => i.status)
                  ? 'Next exercise'
                  : 'Start exercises'
                : today === 0
                  ? 'Start exercises'
                  : 'Continue exercises'
            }
            icon="play-arrow"
            onPress={startExercises}
            testID="home-start-exercises"
          />
        )}
      </SummaryCard>

      {/* This week: day dots, like an activity history */}
      <SummaryCard
        icon="event-available"
        category="This week"
        tint={colors.category.time}
        when={`${activeDays} of 7 days`}
        onPress={() => navigation.navigate('Progress')}
        testID="home-week-summary"
      >
        <WeekStrip days={week} testID="home-week-strip" />
        {highlight && !hasRoutine ? (
          <Highlight
            icon="auto-awesome"
            tint={colors.category.time}
            text={highlight}
            testID="home-highlight"
          />
        ) : (
          <AppText variant="body" color={colors.textSecondary}>
            Each day you exercise gets a tick.
          </AppText>
        )}
      </SummaryCard>

      {streak > 1 ? (
        <SummaryCard
          icon="local-fire-department"
          category="Streak"
          tint={colors.category.pain}
          value={`${streak}`}
          unit="days in a row"
          testID="home-streak"
        />
      ) : null}

      {last ? (
        <SummaryCard
          icon="fitness-center"
          category="Last session"
          tint={colors.category.progress}
          when={shortDate(last.date)}
          // A still hold is timed, not counted
          value={
            last.kind === 'activity' || lastIsHold
              ? formatDuration(last.duration)
              : `${last.reps}`
          }
          unit={`${last.kind === 'activity' ? 'reported activity' : lastIsHold ? 'resting still' : 'reps'} · ${
            findExerciseOption(last.exerciseId)?.title ?? last.exerciseName
          }`}
          onPress={() => navigation.navigate('Progress')}
          testID="home-progress"
        />
      ) : (
        <SummaryCard
          icon="insights"
          category="My progress"
          tint={colors.category.progress}
          description="See your saved activity and measurement history."
          onPress={() => navigation.navigate('Progress')}
          testID="home-progress"
        />
      )}

      <ActionTile
        tone="accent"
        icon="help-outline"
        title="How to set up"
        description="Preparing for your exercises and optional camera checks"
        onPress={() => navigation.navigate('HomeTab', { screen: 'Help' })}
        testID="home-help"
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  waiting: { gap: spacing.xs, marginVertical: spacing.sm },
  todayStack: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.md },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginVertical: spacing.sm,
  },
});

export default HomeScreen;
