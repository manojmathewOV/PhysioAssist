/**
 * Progress Indicator
 *
 * Shows user progress through the assessment flow
 * Research: Users need to know "I'm on step 2 of 4"
 *
 * Usage:
 * <ProgressIndicator currentStep={2} totalSteps={4} />
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  color?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  color = '#fff',
}) => {
  return (
    <View
      style={styles.container}
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <Text
          key={index}
          style={[styles.dot, { color }, index < currentStep && styles.dotActive]}
        >
          {index < currentStep ? '●' : '○'}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  dot: {
    fontSize: 24,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
  },
});

export default ProgressIndicator;
