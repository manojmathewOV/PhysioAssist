/**
 * "How much pain did you feel?" on a 0-10 numeric rating scale (NPRS), the
 * standard patient-reported pain measure. Eleven large number buttons in two
 * rows (0-5, 6-10) with "No pain" / "Worst pain" anchors. Answering is
 * optional. The chosen number is shown by fill, a bold border and the
 * "selected" accessibility state, not by colour alone.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../ui';
import { colors, radii, spacing, touch } from '../../theme';

const ROWS = [
  [0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
];

const optionLabel = (n: number) =>
  n === 0 ? '0, no pain' : n === 10 ? '10, worst pain' : `${n} out of 10`;

export interface PainScaleProps {
  value?: number | null;
  onChange: (score: number) => void;
  testID?: string;
}

const PainScale: React.FC<PainScaleProps> = ({
  value = null,
  onChange,
  testID = 'pain-scale',
}) => (
  <View
    style={styles.scale}
    accessibilityRole="radiogroup"
    accessibilityLabel="Pain from 0, no pain, to 10, worst pain"
    testID={testID}
  >
    {ROWS.map((row, r) => (
      <View key={r} style={styles.row}>
        {row.map((n) => {
          const selected = value === n;
          return (
            // Each cell is a sixth of the width, so the second row of five
            // centres neatly under the first row of six
            <View key={n} style={styles.cell}>
              <Pressable
                onPress={() => onChange(n)}
                testID={`pain-option-${n}`}
                accessibilityRole="radio"
                accessibilityLabel={optionLabel(n)}
                accessibilityState={{ selected, checked: selected }}
                // Web: react-native-web doesn't turn the checked state into aria-checked
                aria-checked={selected}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && !selected && styles.optionPressed,
                ]}
              >
                <AppText
                  variant="heading"
                  color={selected ? colors.onPrimary : colors.text}
                  maxFontSizeMultiplier={1.3}
                  style={styles.number}
                >
                  {n}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </View>
    ))}
    <View style={styles.anchors} importantForAccessibility="no-hide-descendants">
      <AppText variant="label" color={colors.textSecondary}>
        0 = No pain
      </AppText>
      <AppText variant="label" color={colors.textSecondary}>
        10 = Worst pain
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scale: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: -spacing.xs,
  },
  cell: { width: `${100 / 6}%`, paddingHorizontal: spacing.xs },
  option: {
    minHeight: touch.primary,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
    borderWidth: 3,
  },
  optionPressed: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  number: { fontVariant: ['tabular-nums'] },
  anchors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
});

export default PainScale;
