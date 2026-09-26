/**
 * A row of large, clearly labelled choices where exactly one is selected
 * (e.g. Left / Right, 7 days / 30 days). Selection is shown by fill, a check
 * icon and the accessibility "selected" state, never colour alone.
 */
import React from 'react';
import { Pressable, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText } from './index';
import { colors, radii, spacing, touch } from '../../theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  testID?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Spoken before each option, e.g. "Side" -> "Side: Left". */
  accessibilityLabel?: string;
  /** Use "dark" on camera overlays. */
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  tone = 'light',
  style,
  testID,
}: SegmentedControlProps<T>) {
  const dark = tone === 'dark';
  return (
    <View style={[styles.row, style]} accessibilityRole="radiogroup" testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        const fg = selected
          ? colors.onPrimary
          : dark
            ? colors.textInverse
            : colors.primary;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            testID={option.testID}
            accessibilityRole="radio"
            accessibilityLabel={
              accessibilityLabel ? `${accessibilityLabel}: ${option.label}` : option.label
            }
            accessibilityState={{ selected, checked: selected }}
            // Web: react-native-web doesn't turn the checked state into aria-checked
            aria-checked={selected}
            style={({ pressed }) => [
              styles.segment,
              dark ? styles.segmentDark : styles.segmentLight,
              selected && styles.segmentSelected,
              pressed && !selected && (dark ? styles.pressedDark : styles.pressedLight),
            ]}
          >
            {selected ? <Icon name="check" size={22} color={fg} /> : null}
            <AppText variant="label" color={fg} numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    minHeight: touch.min,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  segmentLight: { borderColor: colors.primary, backgroundColor: colors.surface },
  segmentDark: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'transparent',
  },
  segmentSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressedLight: { backgroundColor: colors.primarySoft },
  pressedDark: { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
});

export default SegmentedControl;
