/**
 * One measurement series on the Progress screen: the latest value under the
 * current plan as the main number, the earlier values under the same plan
 * beside it, values from an earlier plan kept apart and labelled, and
 * sessions that couldn't be measured counted. No "improved" claims.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { MeasurementSeries, SeriesPoint } from '../../utils/measurementSeries';
import { findExerciseOption } from '../exercises/exerciseCatalog';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** "8°" and what it is: "from straight", "rotation (estimate)", "". */
const valueOf = (s: MeasurementSeries, p: SeriesPoint) => ({
  number: `${p.approximate ? '~' : ''}${p.degrees}°`,
  unit: s.measure
    ? `${s.measure}${p.approximate ? ' (estimate)' : ''}`
    : s.direction === 'toward'
      ? 'from straight'
      : p.approximate
        ? 'estimate'
        : '',
});

/** Most recent values shown beside the main number. */
const RECENT = 4;

export const MeasurementCard: React.FC<{
  series: MeasurementSeries;
  testID?: string;
}> = ({ series: s, testID }) => {
  const title = findExerciseOption(s.exerciseId)?.title ?? s.exerciseName;
  const side = s.joint.replace(/_/g, ' ');
  const latest = s.comparable[s.comparable.length - 1];
  const earlier = s.comparable.slice(-RECENT - 1, -1);
  const before = s.measuredDifferently[s.measuredDifferently.length - 1];
  const main = latest ? valueOf(s, latest) : undefined;

  return (
    <Card style={styles.card} testID={testID}>
      <View>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {side.charAt(0).toUpperCase() + side.slice(1)}
        </AppText>
      </View>

      {latest && main ? (
        <View
          style={styles.latest}
          accessible
          accessibilityLabel={`Latest: ${main.number} ${main.unit}, ${shortDate(
            latest.date
          )}`}
          testID={testID && `${testID}-latest`}
        >
          <AppText variant="metric" color={colors.primary}>
            {main.number}
          </AppText>
          <View style={styles.flex}>
            {main.unit ? <AppText variant="bodyStrong">{main.unit}</AppText> : null}
            <AppText variant="body" color={colors.textSecondary}>
              {`Latest, ${shortDate(latest.date)}`}
            </AppText>
          </View>
        </View>
      ) : (
        <AppText
          variant="bodyStrong"
          color={colors.textSecondary}
          testID={testID && `${testID}-none`}
        >
          No measurement taken the current way yet.
        </AppText>
      )}

      {earlier.length ? (
        <View testID={testID && `${testID}-earlier`}>
          <AppText variant="label" color={colors.textSecondary}>
            EARLIER
          </AppText>
          <View style={styles.chips}>
            {earlier
              .slice()
              .reverse()
              .map((p) => (
                <View key={p.date} style={styles.chip}>
                  <AppText variant="bodyStrong">{valueOf(s, p).number}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {shortDate(p.date)}
                  </AppText>
                </View>
              ))}
          </View>
        </View>
      ) : null}

      {before ? (
        <AppText
          variant="body"
          color={colors.textSecondary}
          testID={testID && `${testID}-before`}
        >
          {`Measured differently before: ${valueOf(s, before).number} ${
            valueOf(s, before).unit
          } (${shortDate(before.date)})`.replace(/ +\(/, ' (')}
        </AppText>
      ) : null}

      {s.unmeasuredCount ? (
        <View style={styles.unmeasured} testID={testID && `${testID}-unmeasured`}>
          <AppText variant="body">
            {s.unmeasuredCount === 1
              ? '1 session couldn’t be measured'
              : `${s.unmeasuredCount} sessions couldn’t be measured`}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  flex: { flex: 1 },
  latest: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  unmeasured: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});

export default MeasurementCard;
