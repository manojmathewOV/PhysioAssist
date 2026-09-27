/**
 * Progress Indicator
 *
 * Shows user progress through the assessment flow
 * Research: Users need to know "I'm on step 2 of 4"
 *
 * Usage:
 * <ProgressIndicator currentStep={2} totalSteps={4} />
 * <ProgressIndicator currentStep={4} totalSteps={4} tone="dark" /> // on camera
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText } from '../ui';
import { colors, radii, spacing } from '../../theme';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  /** Colour of completed steps (defaults to the primary colour, or white on dark). */
  color?: string;
  /** "dark" for use on camera overlays. */
  tone?: 'light' | 'dark';
  /** Show the "Step X of Y" text next to the dots. */
  showLabel?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  color,
  tone = 'light',
  showLabel = true,
}) => {
  const dark = tone === 'dark';
  const activeColor = color ?? (dark ? colors.textInverse : colors.primary);
  const inactiveColor = dark ? 'rgba(255, 255, 255, 0.35)' : colors.border;
  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
    >
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index + 1 === currentStep && styles.dotCurrent,
              { backgroundColor: index < currentStep ? activeColor : inactiveColor },
            ]}
          />
        ))}
      </View>
      {showLabel ? (
        <AppText
          variant="label"
          color={dark ? colors.textInverse : colors.textSecondary}
          importantForAccessibility="no"
        >
          Step {currentStep} of {totalSteps}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
  },
  dotCurrent: {
    width: 28,
  },
});

export default ProgressIndicator;
