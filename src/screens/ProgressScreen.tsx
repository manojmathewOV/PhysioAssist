/**
 * Progress: streak, a simple 7-day bar chart and recent sessions, in plain
 * language with large numbers.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

import type { RootState } from '../store';
import {
  AppText,
  BigButton,
  Card,
  ListRow,
  Screen,
  SectionTitle,
} from '../components/ui';
import { colors, radii, spacing } from '../theme';
import type { MainTabParamList } from '../navigation/types';
import { currentStreak, dailyReps, summarizeWeek } from '../utils/progressSummary';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_HEIGHT = 140;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/** History stores form as 0-1 (very old sessions may hold 0-100). */
const formPercent = (score: number) => Math.round(score <= 1 ? score * 100 : score);

const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const history = useSelector((s: RootState) => s.exercise.history);
  const days = dailyReps(history, 7);
  const week = summarizeWeek(history);
  const streak = currentStreak(history);
  const max = Math.max(1, ...days.map((d) => d.value));

  if (history.length === 0) {
    return (
      <Screen testID="progress-screen" title="My progress">
        <Card>
          <AppText variant="heading">No sessions yet</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.gap}>
            After your first exercise session you will see your repetitions and how you
            are improving here.
          </AppText>
        </Card>
        <BigButton
          label="Start exercises"
          icon="play-arrow"
          onPress={() => navigation.navigate('Exercise')}
          testID="progress-start"
        />
      </Screen>
    );
  }

  return (
    <Screen testID="progress-screen" title="My progress">
      <Card style={styles.streakCard} testID="progress-streak">
        <AppText variant="metric" color={colors.primary}>
          {streak}
        </AppText>
        <View style={styles.flex}>
          <AppText variant="heading">
            {streak === 1 ? 'day in a row' : 'days in a row'}
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {week.sessions} {week.sessions === 1 ? 'session' : 'sessions'} and {week.reps}{' '}
            repetitions this week
          </AppText>
        </View>
      </Card>

      <Card testID="progress-chart">
        <AppText variant="heading">Repetitions per day</AppText>
        <View
          style={styles.chart}
          accessible
          accessibilityLabel={days
            .map((d) => `${WEEKDAY[new Date(`${d.date}T12:00:00`).getDay()]} ${d.value}`)
            .join(', ')}
        >
          {days.map((d) => (
            <View key={d.date} style={styles.barColumn}>
              <AppText variant="caption" color={colors.textSecondary}>
                {d.value > 0 ? d.value : ''}
              </AppText>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(6, (d.value / max) * CHART_HEIGHT),
                    backgroundColor: d.value > 0 ? colors.primary : colors.surfaceMuted,
                  },
                ]}
              />
              <AppText variant="label" color={colors.textSecondary}>
                {WEEKDAY[new Date(`${d.date}T12:00:00`).getDay()]}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle>Recent sessions</SectionTitle>
      <Card>
        {history.slice(0, 10).map((h, i, list) => (
          <ListRow
            key={h.id}
            icon="fitness-center"
            title={h.exerciseName}
            description={`${formatDate(h.date)} · ${h.reps} reps${
              h.formScore ? ` · form ${formPercent(h.formScore)}%` : ''
            }${
              h.bestDegrees !== undefined
                ? ` · ${h.bestDegrees}°${h.goalDegrees ? ` of ${h.goalDegrees}°` : ''}`
                : ''
            }${h.painScore !== undefined ? ` · pain ${h.painScore}/10` : ''}`}
            last={i === list.length - 1}
            testID={`progress-session-${i}`}
          />
        ))}
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { marginTop: spacing.sm },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 60,
    marginTop: spacing.md,
  },
  barColumn: { alignItems: 'center', flex: 1, gap: spacing.xs },
  bar: { width: 28, borderRadius: radii.sm },
});

export default ProgressScreen;
