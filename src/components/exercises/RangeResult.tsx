/**
 * "How far did I move?": the best range reached for the joint of interest,
 * compared with the goal the patient was given, as one number and one bar.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, Card } from '../ui';
import { colors, radii, spacing } from '../../theme';

export interface RangeResultProps {
  /** e.g. 'left_shoulder'. */
  joint: string;
  bestDegrees: number;
  goalDegrees?: number;
  /** What the goal is called, e.g. "your goal" or "the video". */
  goalLabel?: string;
}

const title = (joint: string) => {
  const text = joint.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const RangeResult: React.FC<RangeResultProps> = ({
  joint,
  bestDegrees,
  goalDegrees,
  goalLabel = 'your goal',
}) => {
  const hasGoal = goalDegrees !== undefined && goalDegrees > 0;
  const reached = hasGoal && bestDegrees >= goalDegrees;
  const fraction = hasGoal ? Math.min(1, Math.max(0, bestDegrees / goalDegrees)) : 1;
  const tint = reached ? colors.success : colors.category.progress;
  const sentence = !hasGoal
    ? 'Your best range today.'
    : reached
      ? `You reached ${goalLabel} of ${goalDegrees}°.`
      : `${goalDegrees - bestDegrees}° short of ${goalLabel} (${goalDegrees}°). It often takes a few weeks.`;

  return (
    <Card style={styles.card} testID="range-result">
      <View
        style={styles.header}
        accessible
        accessibilityLabel={`${title(joint)} range: ${bestDegrees} degrees. ${sentence}`}
      >
        <Icon name="straighten" size={22} color={tint} />
        <AppText variant="label" color={tint} style={styles.flex}>
          {`${title(joint).toUpperCase()} RANGE`}
        </AppText>
        {reached ? <Icon name="check-circle" size={22} color={colors.success} /> : null}
      </View>
      <View style={styles.valueRow}>
        <AppText variant="value" testID="range-best">{`${bestDegrees}°`}</AppText>
        {hasGoal ? (
          <AppText variant="unit" color={colors.textSecondary}>
            {`of ${goalDegrees}°`}
          </AppText>
        ) : null}
      </View>
      {hasGoal ? (
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: tint }]}
          />
        </View>
      ) : null}
      <AppText variant="body" color={colors.textSecondary}>
        {sentence}
      </AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  track: {
    height: 14,
    borderRadius: radii.pill ?? 7,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill ?? 7 },
});

export default RangeResult;
