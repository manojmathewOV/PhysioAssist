/**
 * StepSlider
 *
 * A dependency-free, accessible stepper that exposes the same value callbacks as
 * @react-native-community/slider (onValueChange / onSlidingComplete), so it can be
 * swapped for a real slider later without touching callers. Each step is a discrete
 * commit, so onSlidingComplete fires after every increment/decrement.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  AccessibilityActionEvent,
} from 'react-native';

export interface StepSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  formatValue?: (value: number) => string;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const StepSlider: React.FC<StepSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  onSlidingComplete,
  formatValue = (v) => String(v),
  accessibilityLabel,
  testID,
  style,
}) => {
  const commit = (next: number) => {
    // Round to the step precision to avoid float drift (e.g. 0.1 + 0.2)
    const decimals = (String(step).split('.')[1] || '').length;
    const clamped = Math.min(maximumValue, Math.max(minimumValue, next));
    const rounded = Number(clamped.toFixed(decimals));
    if (rounded === value) {
      return;
    }
    onValueChange?.(rounded);
    onSlidingComplete?.(rounded);
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') {
      commit(value + step);
    } else if (event.nativeEvent.actionName === 'decrement') {
      commit(value - step);
    }
  };

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min: minimumValue,
        max: maximumValue,
        now: value,
        text: formatValue(value),
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      <TouchableOpacity
        style={styles.stepButton}
        onPress={() => commit(value - step)}
        disabled={value <= minimumValue}
        testID={testID ? `${testID}-decrement` : undefined}
      >
        <Text style={styles.stepButtonText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.valueText}>{formatValue(value)}</Text>
      <TouchableOpacity
        style={styles.stepButton}
        onPress={() => commit(value + step)}
        disabled={value >= maximumValue}
        testID={testID ? `${testID}-increment` : undefined}
      >
        <Text style={styles.stepButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: '600',
  },
  valueText: {
    fontSize: 16,
    minWidth: 48,
    textAlign: 'center',
  },
});

export default StepSlider;
