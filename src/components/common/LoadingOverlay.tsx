/**
 * LoadingOverlay Component
 *
 * A calm, full-screen "please wait" card with a spinner, a plain-language
 * message and an optional progress bar. Used during model initialisation,
 * downloads or other async operations.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Animated } from 'react-native';

import { AppText } from '../ui';
import { colors, radii, shadows, spacing } from '../../theme';

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Loading message to display */
  message?: string;
  /** Progress value (0-1) - if provided, shows progress bar */
  progress?: number;
  /** Estimated time remaining in seconds */
  estimatedTime?: number;
  /** Whether to show animated spinner */
  showSpinner?: boolean;
}

const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `About ${Math.ceil(seconds)} seconds left`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading…',
  progress,
  estimatedTime,
  showSpinner = true,
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View
          style={styles.card}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={
            progress !== undefined
              ? `${message} ${Math.round(progress * 100)} percent`
              : message
          }
          accessibilityLiveRegion="polite"
        >
          {showSpinner && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.spinner}
              testID="loading-spinner"
            />
          )}

          <AppText variant="heading" center>
            {message}
          </AppText>

          {progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <AppText variant="label" color={colors.primary}>
                {Math.round(progress * 100)}%
              </AppText>
            </View>
          )}

          {estimatedTime !== undefined && estimatedTime > 0 && (
            <AppText variant="caption" color={colors.textSecondary} center>
              {formatTimeRemaining(estimatedTime)}
            </AppText>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.cameraOverlay,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  spinner: { marginBottom: spacing.xs },
  progressContainer: { width: '100%', alignItems: 'center', gap: spacing.sm },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
});

export default LoadingOverlay;
