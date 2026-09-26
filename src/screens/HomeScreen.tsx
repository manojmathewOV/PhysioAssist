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
import { todaysRoutine } from '../services/pose/routine';
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
  const history = useSelector((s: RootState) => s.exercise.history);
  const goal = useSelector((s: RootState) => s.settings.dailyRepGoal ?? 30);
  const plan = useSelector((s: RootState) => s.settings.exercisePlan);
  // The physio's routine, when one is set, is what "today" means
  const routine = todaysRoutine(plan, history);
  const hasRoutine = routine.items.length > 0;
  const routineLeft = routine.items.length - routine.finishedCount;
  // Small phones: the ring above the words, so words aren't broken up
  const narrow = useWindowDimensions().width < 360;
  const nextTitle = routine.next
    ? findExerciseOption(routine.next)?.title.toLowerCase() ?? ''
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
      {/* Today: one ring, one sentence, one button */}
      <SummaryCard
        icon="directions-run"
        category="Exercise"
        tint={colors.category.exercise}
        when="Today"
        testID="home-today"
      >
        {hasRoutine ? (
          <View
            style={[styles.todayRow, narrow && styles.todayStack]}
            testID="home-routine"
          >
            <ProgressRing
              progress={routine.finishedCount / routine.items.length}
              size={132}
              thickness={16}
              testID="home-goal-ring"
              accessibilityLabel={`${routine.finishedCount} of ${routine.items.length} exercises done today`}
            >
              <AppText variant="value">{routine.finishedCount}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {`of ${routine.items.length}`}
              </AppText>
            </ProgressRing>
            <View style={narrow ? undefined : styles.flex}>
              <AppText variant="heading">
                {routineLeft === 0
                  ? 'Today’s exercises done'
                  : `${routineLeft} ${routineLeft === 1 ? 'exercise' : 'exercises'} to go`}
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {routineLeft === 0
                  ? 'Lovely work today. Rest is part of getting better.'
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
        {hasRoutine && routineLeft === 0 ? (
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
          value={lastIsHold ? formatDuration(last.duration) : `${last.reps}`}
          unit={`${lastIsHold ? 'resting still' : 'reps'} · ${
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
          description="See how you are improving, week by week."
          onPress={() => navigation.navigate('Progress')}
          testID="home-progress"
        />
      )}

      <ActionTile
        tone="accent"
        icon="help-outline"
        title="How to set up"
        description="Where to put your phone and how to stand"
        onPress={() => navigation.navigate('HomeTab', { screen: 'Help' })}
        testID="home-help"
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  todayStack: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.md },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginVertical: spacing.sm,
  },
});

export default HomeScreen;
