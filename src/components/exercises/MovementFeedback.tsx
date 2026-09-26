/**
 * After a session: the one or two things to work on (kind, specific cues), with
 * the numbers behind them, or a reassuring "nothing to correct".
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, Card } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { Finding } from '../../services/movement/types';
import type { MovementProfile } from '../../services/movement/analysis';

export const MovementFeedback: React.FC<{
  findings: Finding[];
  /** Compared with the physio's demonstration (vs only the goal). */
  comparedWithDemo?: boolean;
  /** False when too little movement was seen to judge technique. */
  assessed?: boolean;
}> = ({ findings, comparedWithDemo, assessed = true }) => {
  const top = findings.slice(0, 2);
  return (
    <Card style={styles.card} testID="movement-feedback">
      <AppText variant="heading" accessibilityRole="header">
        {top.length ? 'What to work on' : 'How you moved'}
      </AppText>
      {comparedWithDemo ? (
        <AppText variant="body" color={colors.textSecondary}>
          Compared with your physiotherapist’s demonstration.
        </AppText>
      ) : null}
      {top.length === 0 && !assessed ? (
        <View style={styles.row} testID="movement-not-assessed">
          <View style={styles.icon}>
            <Icon name="visibility-off" size={22} color={colors.textSecondary} />
          </View>
          <AppText variant="bodyStrong" style={styles.flex}>
            Not enough movement was seen to judge your technique this time.
          </AppText>
        </View>
      ) : top.length === 0 ? (
        <View style={styles.row}>
          <View style={[styles.icon, styles.iconGood]}>
            <Icon name="check" size={22} color={colors.success} />
          </View>
          <AppText variant="bodyStrong" style={styles.flex}>
            Smooth and steady. Nothing to correct.
          </AppText>
        </View>
      ) : (
        top.map((f) => (
          <View key={f.id} style={styles.row} testID={`finding-${f.id}`}>
            <View style={styles.icon}>
              <Icon
                name={f.severity === 'flag' ? 'priority-high' : 'lightbulb-outline'}
                size={22}
                color={colors.warning}
              />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{f.cue}</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {f.detail}
              </AppText>
            </View>
          </View>
        ))
      )}
      {findings.length > 2 ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {`Also noticed: ${findings
            .slice(2)
            .map((f) => f.cue.replace(/\.$/, '').toLowerCase())
            .join('; ')}.`}
        </AppText>
      ) : null}
    </Card>
  );
};

export const DemonstrationSaved: React.FC<{ profile: MovementProfile }> = ({
  profile,
}) => (
  <Card style={styles.card} testID="demonstration-saved">
    <View style={styles.row}>
      <View style={[styles.icon, styles.iconGood]}>
        <Icon name="verified" size={22} color={colors.success} />
      </View>
      <AppText variant="heading" style={styles.flex} accessibilityRole="header">
        Demonstration saved
      </AppText>
    </View>
    <AppText variant="body" color={colors.textSecondary}>
      {`${profile.repCount} repetitions, reaching about ${profile.peakDegrees}°, ${(
        profile.repDurationMs / 1000
      ).toFixed(1)} s each. Future sessions of this exercise will be compared with it.`}
    </AppText>
  </Card>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGood: { backgroundColor: colors.successSoft },
});
