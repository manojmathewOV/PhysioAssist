/**
 * What the camera screen shows between pressing Start and counting reps
 * (see useSessionGate): a soft dashed full-body frame with a short checklist,
 * then a big 3-2-1-Go countdown.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText } from '../ui';
import { colors, radii, spacing } from '../../theme';
import type { FramingChecks } from './useFramingReadiness';

const ON_DARK = colors.textInverse;
const FRAME_IDLE = 'rgba(255, 255, 255, 0.78)';

/**
 * Dashed, rounded outline showing where the patient's whole body should be.
 * Turns green (with a tick) while the whole body is inside it.
 */
export const FramingGuide: React.FC<{ inFrame: boolean; testID?: string }> = ({
  inFrame,
  testID = 'framing-guide',
}) => (
  <View style={styles.guideArea} pointerEvents="none" testID={testID}>
    <View
      style={[
        styles.frame,
        { borderColor: inFrame ? colors.poseGood : FRAME_IDLE },
        inFrame && styles.frameGood,
      ]}
      accessible
      accessibilityLabel={
        inFrame ? 'Your whole body is in the frame' : 'Frame for your whole body'
      }
    >
      <Icon
        name={inFrame ? 'check-circle' : 'accessibility-new'}
        size={inFrame ? 72 : 140}
        color={inFrame ? colors.poseGood : 'rgba(255, 255, 255, 0.28)'}
      />
    </View>
  </View>
);

/** "Head visible / Feet visible" ticks for the top panel. */
export const FramingChecklist: React.FC<{
  checks: FramingChecks;
  /** 0-1 hold progress once the whole body is in view. */
  progress: number;
}> = ({ checks, progress }) => {
  const items = [
    { key: 'head', label: 'Head visible', ok: checks.head },
    { key: 'feet', label: 'Feet visible', ok: checks.feet },
  ];
  return (
    <View style={styles.checklist} testID="framing-checklist">
      <View style={styles.checkRow}>
        {items.map((item) => (
          <View
            key={item.key}
            style={[styles.check, item.ok && styles.checkOk]}
            accessible
            accessibilityLabel={`${item.label}: ${item.ok ? 'yes' : 'not yet'}`}
            testID={`framing-check-${item.key}`}
          >
            <Icon
              name={item.ok ? 'check-circle' : 'radio-button-unchecked'}
              size={22}
              color={item.ok ? colors.poseGood : 'rgba(255, 255, 255, 0.7)'}
            />
            <AppText variant="label" color={ON_DARK}>
              {item.label}
            </AppText>
          </View>
        ))}
      </View>
      {checks.fullBody ? (
        <View style={styles.hold} accessibilityLiveRegion="polite">
          <AppText variant="bodyStrong" color={colors.poseGood}>
            That's it. Hold still…
          </AppText>
          <View style={styles.holdTrack}>
            <View
              style={[
                styles.holdFill,
                { width: `${Math.round(Math.min(1, progress) * 100)}%` },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

/** Large centred 3, 2, 1, Go. */
export const CountdownBadge: React.FC<{ value: number | null }> = ({ value }) => {
  const go = value === 0;
  const text = value === null ? '' : go ? 'Go!' : String(value);
  return (
    <View style={styles.countdownArea} pointerEvents="none">
      <View
        style={[styles.countdown, go && styles.countdownGo]}
        testID="countdown"
        accessible
        accessibilityLabel={text || 'Get ready'}
        accessibilityLiveRegion="assertive"
      >
        <AppText
          color={go ? colors.text : ON_DARK}
          style={[styles.countdownText, go && styles.countdownGoText]}
          maxFontSizeMultiplier={1}
          testID="countdown-value"
        >
          {text}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  guideArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  frame: {
    flex: 1,
    width: '62%',
    maxWidth: 300,
    minHeight: 160,
    borderWidth: 4,
    borderStyle: 'dashed',
    borderRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  frameGood: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(74, 222, 128, 0.10)',
  },
  checklist: { gap: spacing.sm },
  checkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: spacing.sm,
    paddingRight: 12,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  checkOk: { backgroundColor: 'rgba(74, 222, 128, 0.18)' },
  hold: { gap: spacing.xs },
  holdTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  holdFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.poseGood,
  },
  countdownArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdown: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.cameraOverlay,
    borderWidth: 6,
    borderColor: colors.skeleton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownGo: { backgroundColor: colors.poseGood, borderColor: colors.poseGood },
  countdownText: {
    fontSize: 128,
    lineHeight: 140,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  countdownGoText: { fontSize: 84, lineHeight: 96 },
});
