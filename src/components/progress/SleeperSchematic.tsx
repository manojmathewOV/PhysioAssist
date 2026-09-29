import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppText } from '../ui';
import { colors, spacing } from '../../theme';
import type { SleeperResultView } from '../../services/checks/sleeperResult';
/** Illustration coordinates only; anatomical side changes display, never the measurement. */
export function forearmEndpoint(
  degrees: number | undefined,
  side: 'left' | 'right' = 'left'
) {
  if (degrees === undefined || !Number.isFinite(degrees) || degrees < 0 || degrees > 180)
    return null;
  const angle = (degrees * Math.PI) / 180;
  return {
    x: 112 + (side === 'left' ? 1 : -1) * 58 * Math.sin(angle),
    y: 75 - 58 * Math.cos(angle),
  };
}
export function SleeperSchematic({ view }: { view: SleeperResultView }) {
  const { width, fontScale } = useWindowDimensions();
  const stack = width < 360 || fontScale > 1.3;
  const point = forearmEndpoint(view.rotationDegrees, view.side);
  if (!point) return null;
  return (
    <View
      testID="sleeper-schematic"
      accessible
      accessibilityLabel={`${view.side} forearm turn, ${view.value}. Reference position is not a target or your measured starting position. ${view.elbowText}. Side-lying illustration, not a camera image.`}
    >
      <View style={styles.orientation}>
        <Svg width={64} height={32} viewBox="0 0 128 64" accessible={false}>
          <Line x1={6} y1={49} x2={122} y2={49} stroke={colors.border} strokeWidth={3} />
          <Circle
            cx={view.side === 'left' ? 22 : 106}
            cy={25}
            r={10}
            fill="none"
            stroke={colors.textSecondary}
            strokeWidth={3}
          />
          <Path
            d={
              view.side === 'left'
                ? 'M36 30 L66 30 L83 43 L109 43'
                : 'M92 30 L62 30 L45 43 L19 43'
            }
            fill="none"
            stroke={colors.textSecondary}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </Svg>
        <AppText variant="caption" style={styles.flex}>
          Side-lying illustration
        </AppText>
      </View>
      <View style={[styles.panels, stack && styles.stacked]}>
        <View style={styles.flex}>
          <AppText
            variant="caption"
            center
            style={styles.label}
            testID="sleeper-reference-label"
          >
            Reference position
          </AppText>
          <Svg width="100%" height={112} viewBox="0 0 224 150" accessible={false}>
            <Line
              x1={112}
              y1={75}
              x2={112}
              y2={17}
              stroke={colors.textSecondary}
              strokeWidth={5}
              strokeDasharray="7 5"
            />
            <Circle cx={112} cy={75} r={7} fill={colors.textSecondary} />
          </Svg>
          <AppText variant="caption" center>
            Not a target
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText
            variant="caption"
            center
            style={styles.label}
            testID="sleeper-reading-label"
          >
            This reading
          </AppText>
          <Svg width="100%" height={112} viewBox="0 0 224 150" accessible={false}>
            <Line
              x1={112}
              y1={75}
              x2={112}
              y2={17}
              stroke={colors.border}
              strokeWidth={3}
              strokeDasharray="7 5"
            />
            <Line
              testID="sleeper-current-ray"
              x1={112}
              y1={75}
              x2={point.x}
              y2={point.y}
              stroke={colors.primary}
              strokeWidth={10}
              strokeLinecap="round"
            />
            <Circle cx={112} cy={75} r={7} fill={colors.primary} />
          </Svg>
          <AppText variant="caption" center>
            Approximate
          </AppText>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  orientation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: { minHeight: 40 },
  stacked: { flexDirection: 'column' },
  panels: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
});
