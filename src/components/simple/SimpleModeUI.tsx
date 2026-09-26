/**
 * Simple Mode UI
 *
 * Dramatically simplified interface for:
 * - Elderly patients
 * - Tech-averse users
 * - First-time users
 * - Patients with cognitive challenges
 *
 * Philosophy: ONE button, ONE instruction, ONE feedback
 * Target: 90% success rate on first use
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { AppText, BigButton } from '../ui';
import { CameraPanel } from '../ui/CameraPanel';
import { colors, radii, spacing, touch } from '../../theme';

interface SimpleModeUIProps {
  isDetecting: boolean;
  onStart: () => void;
  onStop: () => void;
  currentStatus: 'idle' | 'initializing' | 'ready' | 'detecting' | 'error';
  currentAngle?: number;
  targetAngle?: number;
  exerciseName?: string;
  trackingQuality: 'excellent' | 'good' | 'poor';
  errorMessage?: string;
}

const SimpleModeUI: React.FC<SimpleModeUIProps> = ({
  isDetecting,
  onStart,
  onStop,
  currentStatus,
  currentAngle = 0,
  targetAngle = 90,
  exerciseName = 'Exercise',
  trackingQuality,
  errorMessage,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for the main button
  useEffect(() => {
    if (!isDetecting && currentStatus === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isDetecting, currentStatus]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleMainAction = () => {
    ReactNativeHapticFeedback.trigger('impactMedium');

    if (isDetecting) {
      onStop();
    } else {
      if (currentStatus === 'ready' || currentStatus === 'idle') {
        onStart();
      }
    }
  };

  const handleToggleAdvanced = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    setShowAdvanced(!showAdvanced);
  };

  // Get current instruction
  const getCurrentInstruction = (): string => {
    switch (currentStatus) {
      case 'initializing':
        return 'Getting ready...';
      case 'ready':
        return 'Tap the button when ready';
      case 'detecting':
        if (currentAngle < targetAngle * 0.3) {
          return 'Bend further';
        } else if (currentAngle < targetAngle * 0.7) {
          return 'Keep going!';
        } else if (currentAngle < targetAngle) {
          return 'Almost there!';
        } else {
          return 'Perfect! Hold it there';
        }
      case 'error':
        return errorMessage || 'Something went wrong';
      default:
        return 'Ready to start';
    }
  };

  // Get simple tracking quality indicator (icon + words, never colour alone)
  const getTrackingQualityIndicator = (): {
    icon: string;
    color: string;
    text: string;
  } => {
    switch (trackingQuality) {
      case 'excellent':
        return { icon: 'check-circle', color: colors.skeleton, text: 'Tracking great' };
      case 'good':
        return { icon: 'info-outline', color: colors.accent, text: 'Tracking okay' };
      case 'poor':
        return {
          icon: 'error-outline',
          color: colors.accent,
          text: "Can't see you well",
        };
    }
  };

  const trackingIndicator = getTrackingQualityIndicator();
  const canStart = currentStatus !== 'initializing' && currentStatus !== 'error';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Top Status Bar */}
        <View style={styles.statusBar}>
          {isDetecting && (
            <View
              style={styles.statusIndicator}
              accessible={true}
              accessibilityLabel={`Tracking status: ${trackingIndicator.text}`}
              accessibilityRole="text"
            >
              <Icon
                name={trackingIndicator.icon}
                size={24}
                color={trackingIndicator.color}
              />
              <AppText variant="bodyStrong" color={colors.textInverse}>
                {trackingIndicator.text}
              </AppText>
            </View>
          )}
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Current Instruction - Large and Clear */}
          <CameraPanel style={styles.instructionContainer}>
            <View
              accessible={true}
              accessibilityLabel={`Exercise instruction: ${getCurrentInstruction()}`}
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
            >
              <AppText variant="title" color={colors.textInverse} center>
                {getCurrentInstruction()}
              </AppText>
            </View>

            {/* Exercise Name (if provided) */}
            {exerciseName && !isDetecting && (
              <AppText variant="bodyStrong" color={ON_DARK_SOFT} center>
                {exerciseName}
              </AppText>
            )}

            {/* Simple Visual Feedback */}
            {isDetecting && (
              <SimpleFeedback currentAngle={currentAngle} targetAngle={targetAngle} />
            )}
          </CameraPanel>
        </View>

        {/* Bottom Area */}
        <View style={styles.bottomArea}>
          {/* Big Action Button */}
          <CameraPanel>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <BigButton
                label={isDetecting ? 'Stop exercise' : 'Start exercise'}
                icon={isDetecting ? 'stop' : 'play-arrow'}
                variant={isDetecting ? 'danger' : 'primary'}
                onPress={handleMainAction}
                disabled={!canStart}
                accessibilityHint={
                  isDetecting
                    ? 'Tap to stop tracking your movement'
                    : 'Tap to begin exercise tracking'
                }
              />
            </Animated.View>

            {/* Advanced Options (Hidden by Default) */}
            <Pressable
              style={({ pressed }) => [styles.advancedToggle, pressed && styles.pressed]}
              onPress={handleToggleAdvanced}
              accessibilityLabel={
                showAdvanced ? 'Hide advanced details' : 'Show advanced details'
              }
              accessibilityHint={
                showAdvanced
                  ? 'Tap to hide detailed exercise information'
                  : 'Tap to see detailed exercise information'
              }
              accessibilityRole="button"
              accessibilityState={{ expanded: showAdvanced }}
              accessible={true}
            >
              <Icon
                name={showAdvanced ? 'expand-less' : 'expand-more'}
                size={26}
                color={colors.textInverse}
              />
              <AppText variant="label" color={colors.textInverse}>
                {showAdvanced ? 'Hide details' : 'Show details'}
              </AppText>
            </Pressable>

            {showAdvanced && (
              <AdvancedInfo
                currentAngle={currentAngle}
                targetAngle={targetAngle}
                trackingQuality={trackingQuality}
              />
            )}
          </CameraPanel>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const ON_DARK_SOFT = 'rgba(255, 255, 255, 0.85)';

// ============================================================================
// Simple Feedback Component
// ============================================================================

interface SimpleFeedbackProps {
  currentAngle: number;
  targetAngle: number;
}

const SimpleFeedback: React.FC<SimpleFeedbackProps> = ({ currentAngle, targetAngle }) => {
  const progress = Math.min((currentAngle / targetAngle) * 100, 100);
  const isComplete = progress >= 100;

  return (
    <View
      style={styles.simpleFeedbackContainer}
      accessible={true}
      accessibilityLabel={`Current angle: ${Math.round(currentAngle)} degrees. Target: ${targetAngle} degrees. Progress: ${Math.round(progress)} percent${isComplete ? '. Target achieved!' : ''}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: progress, min: 0, max: 100 }}
      accessibilityLiveRegion="polite"
    >
      {/* Big Angle Number */}
      <AppText variant="metric" color={colors.textInverse} center>
        {Math.round(currentAngle)}°
      </AppText>

      {/* Simple Progress Bar */}
      <View style={styles.simpleProgressBar}>
        <View style={[styles.simpleProgressFill, { width: `${progress}%` }]} />
      </View>

      {/* Target Label */}
      <AppText variant="bodyStrong" color={ON_DARK_SOFT} center>
        Target: {targetAngle}°
      </AppText>

      {/* Success Message */}
      {isComplete && (
        <View style={styles.successBadge}>
          <Icon name="check-circle" size={24} color={colors.success} />
          <AppText variant="bodyStrong" color={colors.success}>
            Great job!
          </AppText>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Advanced Info Component (Hidden by Default)
// ============================================================================

interface AdvancedInfoProps {
  currentAngle: number;
  targetAngle: number;
  trackingQuality: 'excellent' | 'good' | 'poor';
}

const AdvancedInfo: React.FC<AdvancedInfoProps> = ({
  currentAngle,
  targetAngle,
  trackingQuality,
}) => {
  const progress = Math.min((currentAngle / targetAngle) * 100, 100);
  const rows: [string, string][] = [
    ['Current angle', `${currentAngle.toFixed(1)}°`],
    ['Target angle', `${targetAngle}°`],
    ['Progress', `${progress.toFixed(1)}%`],
    [
      'Tracking quality',
      trackingQuality.charAt(0).toUpperCase() + trackingQuality.slice(1),
    ],
  ];

  return (
    <View
      style={styles.advancedInfoContainer}
      accessible={true}
      accessibilityLabel={`Advanced details. Current angle: ${currentAngle.toFixed(1)} degrees. Target angle: ${targetAngle} degrees. Progress: ${progress.toFixed(1)} percent. Tracking quality: ${trackingQuality}`}
      accessibilityRole="text"
    >
      {rows.map(([label, value]) => (
        <View key={label} style={styles.advancedInfoRow}>
          <AppText variant="body" color={ON_DARK_SOFT}>
            {label}
          </AppText>
          <AppText variant="bodyStrong" color={colors.textInverse}>
            {value}
          </AppText>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusBar: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    minHeight: touch.min,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.cameraOverlay,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  instructionContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  bottomArea: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: touch.min,
    borderRadius: radii.md,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  simpleFeedbackContainer: {
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  simpleProgressBar: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  simpleProgressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.skeleton,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
  },
  advancedInfoContainer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
  },
  advancedInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default SimpleModeUI;
