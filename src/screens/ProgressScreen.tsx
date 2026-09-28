import PendingActivityNotice from '../components/exercises/PendingActivityNotice';
import { selectDurableHistory } from '../store/historySelectors';
/**
 * Progress: streak, a simple 7-day bar chart and recent sessions, in plain
 * language with large numbers.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

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
import {
  currentStreak,
  dailyReps,
  summarizeWeek,
  dayKey,
} from '../utils/progressSummary';
import { measurementSeries } from '../utils/measurementSeries';
import MeasurementCard from '../components/progress/MeasurementCard';

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
  const history = useSelector(selectDurableHistory);
  const hasGuided = history.some((h) => h.kind === 'activity');
  const days = dailyReps(history, 7).map((d) =>
    hasGuided
      ? {
          ...d,
          value: history.filter((h) => (h.activityDay ?? dayKey(h.date)) === d.date)
            .length,
        }
      : d
  );
  const week = summarizeWeek(history);
  const streak = currentStreak(history);
  const max = Math.max(1, ...days.map((d) => d.value));
  const series = measurementSeries(history);

  if (history.length === 0) {
    return (
      <Screen testID="progress-screen" title="My progress">
        <PendingActivityNotice />
        <Card>
          <AppText variant="heading">No sessions yet</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.gap}>
            Your saved activity and any available measurements will appear here.
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
      <PendingActivityNotice />
      {series.length ? (
        <>
          <SectionTitle>Measurements</SectionTitle>
          {series.map((x, i) => (
            <MeasurementCard key={x.key} series={x} testID={`progress-series-${i}`} />
          ))}
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={styles.note}
            testID="progress-series-note"
          >
            Small differences in home camera readings may not be real changes. Keep these
            readings for your records or show them at an appointment. They are not
            monitored through this app.
          </AppText>
          <SectionTitle>Activity</SectionTitle>
        </>
      ) : null}

      <Card style={styles.streakCard} testID="progress-streak">
        <AppText variant="metric" color={colors.primary}>
          {hasGuided ? week.sessions : streak}
        </AppText>
        <View style={styles.flex}>
          <AppText variant="heading">
            {hasGuided
              ? week.sessions === 1
                ? 'activity recorded this week'
                : 'activities recorded this week'
              : streak === 1
                ? 'day in a row'
                : 'days in a row'}
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {hasGuided
              ? 'Completed and stopped-early activities are kept separate.'
              : `${week.sessions} ${week.sessions === 1 ? 'session' : 'sessions'} and ${week.reps} repetitions this week`}
          </AppText>
        </View>
      </Card>

      {!hasGuided || history.length >= 7 ? (
        <Card testID="progress-chart">
          <AppText variant="heading">
            {hasGuided ? 'Activity records per day' : 'Repetitions per day'}
          </AppText>
          <View
            style={styles.chart}
            accessible
            accessibilityLabel={days
              .map(
                (d) => `${WEEKDAY[new Date(`${d.date}T12:00:00`).getDay()]} ${d.value}`
              )
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
      ) : null}

      <SectionTitle>Recent sessions</SectionTitle>
      <Card>
        {history.slice(0, 10).map((h, i, list) => (
          <ListRow
            key={h.id}
            icon="fitness-center"
            title={h.exerciseName}
            description={
              h.kind === 'activity'
                ? `${formatDate(h.date)} · ${h.completion === 'completed' ? 'Completed' : h.completion === 'stopped_early' ? 'Stopped early' : 'Attempted'} · reported by you · not measured`
                : `${formatDate(h.date)} · ${h.reps} reps${
                    h.formScore ? ` · form ${formPercent(h.formScore)}%` : ''
                  }${sessionMeasurement(h)}${h.painScore !== undefined ? ` · pain ${h.painScore}/10` : ''}`
            }
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
  note: { marginHorizontal: spacing.xs },
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

/**
 * The measurement part of a history row: "not measured" when it couldn't be
 * measured, "~60° rotation" for an estimate, "8° from straight" for
 * straightening, else "95° of 120°".
 */
export function sessionMeasurement(h: {
  bestDegrees?: number;
  goalDegrees?: number;
  measured?: boolean;
  approximate?: boolean;
  direction?: 'away' | 'toward';
  measure?: string;
}): string {
  if (h.measured === false) return ' · not measured';
  if (h.bestDegrees === undefined) return '';
  const value = `${h.approximate ? '~' : ''}${h.bestDegrees}°`;
  if (h.measure) return ` · ${value} ${h.measure}`;
  if (h.direction === 'toward') return ` · ${value} from straight`;
  return ` · ${value}${h.goalDegrees ? ` of ${h.goalDegrees}°` : ''}`;
}
