/**
 * Rep progress ring: a thick, rounded ring that fills toward the goal, with
 * the rep count in the middle and "of N" underneath. Turns green with a tick
 * once the goal is reached (colour is never the only signal).
 *
 * `tone="dark"` is for camera overlay panels; `tone="light"` for cards.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText } from './index';
import RingArc from './RingArc';
import { colors, spacing } from '../../theme';

export interface RepRingProps {
  value: number;
  /** Goal. Without one the ring shows only the count. */
  target?: number;
  size?: number;
  strokeWidth?: number;
  tone?: 'dark' | 'light';
  testID?: string;
  /** testID for the number itself (e.g. the existing rep-counter id). */
  valueTestID?: string;
  /**
   * Shows something other than a repetition count (e.g. a still hold's time):
   * the text in the middle, the caption under it, and what is announced.
   */
  display?: { value: string; caption: string; spoken: string };
}

const palette = {
  dark: {
    progress: colors.skeleton,
    done: colors.poseGood,
    track: 'rgba(255, 255, 255, 0.16)',
    text: colors.textInverse,
    soft: 'rgba(255, 255, 255, 0.82)',
  },
  light: {
    progress: colors.primary,
    done: colors.success,
    track: colors.surfaceMuted,
    text: colors.text,
    soft: colors.textSecondary,
  },
} as const;

export const RepRing: React.FC<RepRingProps> = ({
  value,
  target,
  size = 128,
  strokeWidth = 12,
  tone = 'dark',
  testID,
  valueTestID,
  display,
}) => {
  const p = palette[tone];
  const hasGoal = !!target && target > 0;
  const reached = hasGoal && value >= target!;
  const progress = hasGoal ? value / target! : 0;
  // Keep the number comfortably inside the ring as it gets smaller
  const numberSize = Math.round(size * 0.36);
  const unit = value === 1 ? 'rep' : 'reps';

  return (
    <View
      style={[styles.ring, { width: size, height: size }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={
        display
          ? display.spoken
          : hasGoal
            ? `${value} of ${target} repetitions${reached ? ', goal reached' : ''}`
            : `${value} ${value === 1 ? 'repetition' : 'repetitions'}`
      }
      accessibilityValue={hasGoal ? { min: 0, max: target, now: value } : undefined}
      testID={testID}
    >
      <RingArc
        size={size}
        strokeWidth={strokeWidth}
        progress={progress}
        color={reached ? p.done : p.progress}
        trackColor={p.track}
      />
      <View style={styles.center} pointerEvents="none">
        {reached ? (
          <Icon name="check-circle" size={Math.round(size * 0.14)} color={p.done} />
        ) : null}
        <AppText
          variant="metric"
          color={p.text}
          style={{ fontSize: numberSize, lineHeight: Math.round(numberSize * 1.1) }}
          maxFontSizeMultiplier={1.2}
          testID={valueTestID}
        >
          {display ? display.value : value}
        </AppText>
        <AppText
          variant="label"
          color={reached ? p.done : p.soft}
          maxFontSizeMultiplier={1.2}
          style={styles.caption}
        >
          {display ? display.caption : hasGoal ? `of ${target}` : unit}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { marginTop: -spacing.xs },
});

export default RepRing;
