/**
 * Home: a greeting, one obvious primary action, and a few large tiles.
 * Designed so a first-time or older user always knows what to do next.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

import type { RootState } from '../store';
import { ActionTile, AppText, Card, Screen } from '../components/ui';
import { colors, spacing } from '../theme';
import type { MainTabParamList } from '../navigation/types';
import { summarizeWeek } from '../utils/progressSummary';

const greeting = (hour: number) =>
  hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const name = useSelector((s: RootState) => s.user.currentUser?.name);
  const history = useSelector((s: RootState) => s.exercise.history);
  const week = summarizeWeek(history);
  const firstName = name?.split(' ')[0];

  return (
    <Screen
      testID="home-screen"
      title={`${greeting(new Date().getHours())}${firstName ? `, ${firstName}` : ''}`}
      subtitle="Ready for today's exercises?"
    >
      <ActionTile
        tone="primary"
        icon="play-circle-filled"
        title="Start exercises"
        description="The camera will guide you step by step"
        onPress={() => navigation.navigate('Exercise')}
        testID="home-start-exercises"
      />

      <Card testID="home-week-summary">
        <AppText variant="label" color={colors.textSecondary}>
          THIS WEEK
        </AppText>
        <View style={styles.weekRow}>
          <View style={styles.weekStat}>
            <AppText variant="title">{week.sessions}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {week.sessions === 1 ? 'session' : 'sessions'}
            </AppText>
          </View>
          <View style={styles.weekStat}>
            <AppText variant="title">{week.reps}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              repetitions
            </AppText>
          </View>
          <View style={styles.weekStat}>
            <AppText variant="title">{week.activeDays}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              active {week.activeDays === 1 ? 'day' : 'days'}
            </AppText>
          </View>
        </View>
        <AppText variant="body" color={colors.textSecondary}>
          {week.sessions === 0
            ? 'Your first session will show up here.'
            : 'Well done. Keep going at your own pace.'}
        </AppText>
      </Card>

      <ActionTile
        icon="insights"
        title="My progress"
        description="See how you are improving"
        onPress={() => navigation.navigate('Progress')}
        testID="home-progress"
      />
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
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  weekStat: { alignItems: 'center', flex: 1 },
});

export default HomeScreen;
