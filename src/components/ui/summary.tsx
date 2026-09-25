/**
 * Calm summary building blocks, in the spirit of health/fitness dashboards:
 * - SummaryCard: coloured category header, one big value with a small unit, one
 *   plain-language sentence
 * - ProgressRing: a single goal ring with the value in the middle
 * - WeekStrip: Monday-Sunday dots that fill in on active days
 * - Highlight: a short, plain-language observation with an icon
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { colors, radii, shadows, spacing } from '../../theme';
import { AppText } from './index';

// ---------------------------------------------------------------------------
// SummaryCard
// ---------------------------------------------------------------------------

export interface SummaryCardProps {
  icon: string;
  category: string;
  /** Category accent (header icon + label). */
  tint: string;
  /** Right side of the header, e.g. "Today" or "This week". */
  when?: string;
  value?: string;
  unit?: string;
  description?: string;
  onPress?: () => void;
  testID?: string;
  children?: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  category,
  tint,
  when,
  value,
  unit,
  description,
  onPress,
  testID,
  children,
}) => {
  const body = (
    <>
      <View style={styles.header}>
        <Icon name={icon} size={22} color={tint} />
        <AppText variant="label" color={tint} style={styles.flex}>
          {category}
        </AppText>
        {when ? (
          <AppText variant="caption" color={colors.textMuted}>
            {when}
          </AppText>
        ) : null}
        {onPress ? (
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        ) : null}
      </View>
      {value !== undefined ? (
        <View style={styles.valueRow}>
          <AppText variant="value">{value}</AppText>
          {unit ? (
            <AppText variant="unit" color={colors.textSecondary} style={styles.unit}>
              {unit}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {description ? (
        <AppText variant="body" color={colors.textSecondary}>
          {description}
        </AppText>
      ) : null}
      {children}
    </>
  );
  const a11yLabel = [category, when, value && `${value} ${unit ?? ''}`, description]
    .filter(Boolean)
    .join(', ');

  return onPress ? (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  ) : (
    <View style={styles.card} testID={testID} accessible accessibilityLabel={a11yLabel}>
      {body}
    </View>
  );
};

// ---------------------------------------------------------------------------
// ProgressRing
// ---------------------------------------------------------------------------

export interface ProgressRingProps {
  /** 0..1 (values above 1 show a full ring). */
  progress: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 140,
  thickness = 16,
  color = colors.category.exercise,
  trackColor = colors.surfaceMuted,
  children,
  testID,
  accessibilityLabel,
}) => {
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={{ width: size, height: size }}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference * clamped} ${circumference}`}
            // Start at 12 o'clock
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.ringCenter]}>{children}</View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// WeekStrip
// ---------------------------------------------------------------------------

export interface WeekDay {
  /** Short label, e.g. "M". */
  label: string;
  active: boolean;
  isToday?: boolean;
  /** Screen-reader name, e.g. "Monday". */
  name: string;
}

export const WeekStrip: React.FC<{ days: WeekDay[]; tint?: string; testID?: string }> = ({
  days,
  tint = colors.category.exercise,
  testID,
}) => (
  <View
    style={styles.week}
    testID={testID}
    accessible
    accessibilityLabel={`Active days: ${
      days
        .filter((d) => d.active)
        .map((d) => d.name)
        .join(', ') || 'none yet'
    }`}
  >
    {days.map((d) => (
      <View key={d.name} style={styles.day}>
        <AppText variant="label" color={d.isToday ? colors.text : colors.textMuted}>
          {d.label}
        </AppText>
        <View
          style={[
            styles.dot,
            d.active ? { backgroundColor: tint, borderColor: tint } : null,
            d.isToday && !d.active ? { borderColor: colors.text } : null,
          ]}
        >
          {d.active ? <Icon name="check" size={18} color={colors.onPrimary} /> : null}
        </View>
      </View>
    ))}
  </View>
);

// ---------------------------------------------------------------------------
// Highlight
// ---------------------------------------------------------------------------

export const Highlight: React.FC<{
  icon: string;
  tint: string;
  text: string;
  testID?: string;
}> = ({ icon, tint, text, testID }) => (
  <View style={styles.highlight} testID={testID}>
    <View style={[styles.highlightIcon, { backgroundColor: `${tint}1A` }]}>
      <Icon name={icon} size={22} color={tint} />
    </View>
    <AppText variant="body" style={styles.flex}>
      {text}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  unit: { marginLeft: 2 },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: spacing.xs },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
