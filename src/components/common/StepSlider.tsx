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
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  AccessibilityActionEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { colors, radii, touch, typography } from '../../theme';

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
      <Pressable
        style={({ pressed }) => [
          styles.stepButton,
          pressed && styles.stepButtonPressed,
          value <= minimumValue && styles.stepButtonDisabled,
        ]}
        onPress={() => commit(value - step)}
        disabled={value <= minimumValue}
        testID={testID ? `${testID}-decrement` : undefined}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ? `Less ${accessibilityLabel}` : 'Less'}
      >
        <Icon name="remove" size={30} color={colors.primary} />
      </Pressable>
      <Text style={styles.valueText} maxFontSizeMultiplier={1.6}>
        {formatValue(value)}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.stepButton,
          pressed && styles.stepButtonPressed,
          value >= maximumValue && styles.stepButtonDisabled,
        ]}
        onPress={() => commit(value + step)}
        disabled={value >= maximumValue}
        testID={testID ? `${testID}-increment` : undefined}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ? `More ${accessibilityLabel}` : 'More'}
      >
        <Icon name="add" size={30} color={colors.primary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepButton: {
    width: touch.min,
    height: touch.min,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: { backgroundColor: colors.primarySoft },
  stepButtonDisabled: { opacity: 0.4 },
  valueText: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
});

export default StepSlider;
