import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppText, BigButton, Card } from '../ui';
import { colors, spacing } from '../../theme';
import type { SleeperResultView } from '../../services/checks/sleeperResult';

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
/** Frozen schematic of the reported forearm angle, not a reconstructed patient.
 * Elbow alignment is a different plane and is never drawn as this rotation. */
export function SleeperSchematic({ view }: { view: SleeperResultView }) {
  if (view.rotationDegrees === undefined) return null;
  const angle = (view.rotationDegrees * Math.PI) / 180;
  const x = 112 + 82 * Math.sin(angle),
    y = 115 - 82 * Math.cos(angle);
  return (
    <View
      testID="sleeper-schematic"
      accessible
      accessibilityLabel={`${view.side} forearm turn, ${view.value}. ${view.elbowText}. Simplified diagram, not a camera image.`}
    >
      <AppText variant="label">Forearm turn · simplified view</AppText>
      <Svg width="100%" height={124} viewBox="0 0 240 150" accessible={false}>
        <Line x1={20} y1={126} x2={220} y2={126} stroke={colors.border} strokeWidth={3} />
        <Path
          d="M25 112 Q45 103 65 114 L112 115"
          fill="none"
          stroke={colors.textSecondary}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <Line
          x1={112}
          y1={115}
          x2={112}
          y2={30}
          stroke={colors.border}
          strokeWidth={3}
          strokeDasharray="5 5"
        />
        <Line
          x1={112}
          y1={115}
          x2={x}
          y2={y}
          stroke={colors.primary}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <Circle cx={112} cy={115} r={8} fill={colors.primary} />
      </Svg>
    </View>
  );
}
export default function SleeperResultCard({
  view,
  onDone,
}: {
  view: SleeperResultView;
  onDone?: () => void;
}) {
  const [details, setDetails] = useState(false);
  const qualifier = view.state === 'comparable';
  const past = view.previous || view.best;
  return (
    <Card style={styles.card} testID="sleeper-result-card">
      {view.synthetic ? (
        <AppText variant="bodyStrong" testID="sleeper-synthetic">
          Example data — not your measurement
        </AppText>
      ) : null}
      <View>
        <AppText variant="heading" accessibilityRole="header">
          {view.title}
        </AppText>
        <AppText variant="body">
          {view.side === 'left' ? 'Left' : 'Right'} shoulder
          {view.date ? ` · ${dateLabel(view.date)}` : ''}
        </AppText>
      </View>
      {view.saveText ? (
        <AppText variant="bodyStrong" testID="sleeper-save-state">
          {view.saveText}
        </AppText>
      ) : null}
      {view.value ? (
        <View
          accessible
          accessibilityLabel={view.value}
          testID={qualifier ? 'sleeper-current' : 'sleeper-excluded'}
        >
          <AppText variant="bodyStrong" testID="sleeper-approx-label">
            {'About '}
          </AppText>
          <AppText
            variant={qualifier ? 'metric' : 'heading'}
            style={qualifier ? styles.resultValue : undefined}
            color={qualifier ? colors.primary : colors.text}
          >
            {view.value.replace(/^About /, '')}
          </AppText>
        </View>
      ) : null}
      <AppText variant="bodyStrong" testID="sleeper-result-reason">
        {view.message}
      </AppText>
      {view.state !== 'not_configured' &&
      view.state !== 'conflict' &&
      view.state !== 'retracted' ? (
        <AppText variant="body" testID="sleeper-elbow">
          {view.elbowText}
        </AppText>
      ) : null}
      <SleeperSchematic view={view} />
      {view.firstComparable ? (
        <AppText variant="body">First comparable check</AppText>
      ) : null}
      {past ? <AppText variant="label">Earlier saved checks</AppText> : null}
      {view.previous ? (
        <HistoryRow
          label="Previous comparable check"
          reading={view.previous}
          testID="sleeper-previous"
        />
      ) : null}
      {view.best ? (
        <HistoryRow label={view.bestLabel} reading={view.best} testID="sleeper-best" />
      ) : null}
      {view.value || past ? (
        <AppText variant="body">
          Small differences may not represent real change. A recorded best is not a
          target.
        </AppText>
      ) : null}
      {view.value ? (
        <BigButton
          label={details ? 'Hide explanation' : 'About this reading'}
          variant="ghost"
          compact
          testID="sleeper-details"
          onPress={() => setDetails(!details)}
        />
      ) : null}
      {details && view.value ? (
        <AppText variant="body" testID="sleeper-explanation">
          The drawing shows forearm turn, not a photograph. Its dashed line is the angle
          reference, not a target. Elbow position is checked separately. Only checks made
          the same way are compared.
        </AppText>
      ) : null}
      {onDone ? <BigButton label="Done" testID="sleeper-done" onPress={onDone} /> : null}
    </Card>
  );
}
function HistoryRow({
  label,
  reading,
  testID,
}: {
  label: string;
  reading: NonNullable<SleeperResultView['previous']>;
  testID: string;
}) {
  return (
    <View
      style={styles.history}
      testID={testID}
      accessible
      accessibilityLabel={`${label}: ${reading.text}, ${dateLabel(reading.date)}`}
    >
      <AppText variant="body">{label}</AppText>
      <AppText variant="bodyStrong">{reading.text}</AppText>
      <AppText variant="body">{dateLabel(reading.date)}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  resultValue: { fontSize: 44, lineHeight: 52 },
  history: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
});
