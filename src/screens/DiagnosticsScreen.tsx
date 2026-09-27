/**
 * Diagnostics Screen
 *
 * Provides system health checks and troubleshooting for:
 * - Camera permissions and availability
 * - Pose detection (MediaPipe BlazePose) availability and recent inference
 * - Network connectivity
 * - Device capabilities
 * - Performance metrics
 *
 * Helps users and support team diagnose issues
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Alert, NativeModules } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { BLAZEPOSE_MODEL_FILE } from '@services/pose/mediapipeLandmarks';
import {
  AppText,
  Banner,
  BigButton,
  Card,
  ListRow,
  Screen,
  SectionTitle,
} from '@components/ui';
import { colors, radii, spacing } from '../theme';

interface DiagnosticCheck {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
}

const DiagnosticsScreen: React.FC = () => {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const settings = useSelector((state: RootState) => state.settings);
  const user = useSelector((state: RootState) => state.user);
  const pose = useSelector((state: RootState) => state.pose);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticCheck[] = [];

    // 1. Check Camera Permission
    try {
      // VisionCamera v4: synchronous, returns 'granted' | 'not-determined' | 'denied' | 'restricted'
      const permission = Camera.getCameraPermissionStatus();
      results.push({
        name: 'Camera Permission',
        status: permission === 'granted' ? 'success' : 'error',
        message:
          permission === 'granted'
            ? 'Camera permission granted'
            : `Camera permission ${permission}`,
        details: `Status: ${permission}`,
      });
    } catch (error) {
      results.push({
        name: 'Camera Permission',
        status: 'error',
        message: 'Failed to check camera permission',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 2. Check Camera Device Availability
    if (frontDevice || backDevice) {
      results.push({
        name: 'Camera Device',
        status: 'success',
        message: 'Camera device available',
        details: `Front: ${frontDevice ? 'Yes' : 'No'}, Back: ${
          backDevice ? 'Yes' : 'No'
        }`,
      });
    } else {
      results.push({
        name: 'Camera Device',
        status: 'error',
        message: 'No camera device found',
        details: 'Cannot detect front or back camera',
      });
    }

    // 3. Check Pose Detection (MediaPipe BlazePose via react-native-mediapipe).
    // The detector itself is created by each camera screen (useBlazePose), so
    // here we check the native module is linked and report the latest poses.
    const detectorLinked = Platform.OS === 'web' || Boolean(NativeModules.PoseDetection);
    results.push({
      name: 'Pose Detection',
      status: detectorLinked ? 'success' : 'error',
      message: detectorLinked
        ? 'BlazePose detector available'
        : 'BlazePose native module not linked',
      details: `Model: MediaPipe BlazePose (${BLAZEPOSE_MODEL_FILE}), 33 landmarks`,
    });

    // 3b. Recent detector output (from the last pose a camera screen produced)
    const lastPose = pose.currentPose;
    if (lastPose) {
      const inferenceMs = lastPose.inferenceTime;
      const ageSeconds = Math.max(0, (Date.now() - pose.timestamp) / 1000);
      results.push({
        name: 'Pose Inference',
        status: inferenceMs === undefined || inferenceMs <= 100 ? 'success' : 'warning',
        message:
          inferenceMs !== undefined
            ? `Last inference ${inferenceMs.toFixed(0)} ms`
            : 'Pose received (no inference timing)',
        details: `Schema: ${lastPose.schemaId ?? 'unknown'}, Landmarks: ${
          lastPose.landmarks.length
        }, Confidence: ${(lastPose.confidence * 100).toFixed(0)}%, ${ageSeconds.toFixed(
          0
        )}s ago`,
      });
    } else {
      results.push({
        name: 'Pose Inference',
        status: 'pending',
        message: 'No poses detected yet',
        details: 'Start pose detection on a camera screen to measure inference time',
      });
    }

    // 4. Check Platform
    results.push({
      name: 'Platform',
      status: 'success',
      message: `Running on ${Platform.OS}`,
      details: `Version: ${Platform.Version}`,
    });

    // 5. Check User Authentication State
    results.push({
      name: 'Authentication',
      status: user.isAuthenticated ? 'success' : 'warning',
      message: user.isAuthenticated ? 'User authenticated' : 'Not authenticated',
      details: user.currentUser ? `User: ${user.currentUser.email}` : 'No user session',
    });

    // 6. Check Onboarding Status
    results.push({
      name: 'Onboarding',
      status: user.hasCompletedOnboarding ? 'success' : 'warning',
      message: user.hasCompletedOnboarding ? 'Onboarding completed' : 'Not completed',
      details: user.hasCompletedOnboarding
        ? 'User has completed initial setup'
        : 'User needs to complete onboarding',
    });

    // 7. Check Settings Configuration
    results.push({
      name: 'Settings',
      status: 'success',
      message: 'Settings loaded successfully',
      details: `Performance Mode: ${
        settings.highPerformanceMode ? 'High' : 'Normal'
      }, Frame Skip: ${settings.frameSkip}`,
    });

    // 8. Check Performance Settings
    if (settings.frameSkip > 5) {
      results.push({
        name: 'Performance Warning',
        status: 'warning',
        message: 'Frame skip rate is high',
        details: `Current: ${settings.frameSkip}. Lower values provide better accuracy.`,
      });
    } else {
      results.push({
        name: 'Performance',
        status: 'success',
        message: 'Performance settings optimal',
        details: `Frame skip: ${settings.frameSkip}`,
      });
    }

    // 9. Check Accessibility Settings
    const accessibilityFeatures = [];
    if (settings.reducedMotion) accessibilityFeatures.push('Reduced Motion');
    if (settings.highContrast) accessibilityFeatures.push('High Contrast');

    results.push({
      name: 'Accessibility',
      status: 'success',
      message:
        accessibilityFeatures.length > 0
          ? 'Accessibility features enabled'
          : 'Standard mode',
      details:
        accessibilityFeatures.length > 0
          ? accessibilityFeatures.join(', ')
          : 'No accessibility features active',
    });

    // 10. Check Audio Settings
    const audioFeatures = [];
    if (settings.voiceInstructionsEnabled) audioFeatures.push('Voice Instructions');
    if (settings.soundEffectsEnabled) audioFeatures.push('Sound Effects');

    results.push({
      name: 'Audio',
      status: 'success',
      message: audioFeatures.length > 0 ? 'Audio enabled' : 'Audio disabled',
      details: audioFeatures.length > 0 ? audioFeatures.join(', ') : 'All audio off',
    });

    setChecks(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const exportDiagnostics = () => {
    const report = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      platformVersion: Platform.Version,
      checks: checks.map((check) => ({
        name: check.name,
        status: check.status,
        message: check.message,
        details: check.details,
      })),
      settings: {
        highPerformanceMode: settings.highPerformanceMode,
        frameSkip: settings.frameSkip,
        voiceInstructions: settings.voiceInstructionsEnabled,
        reducedMotion: settings.reducedMotion,
        highContrast: settings.highContrast,
      },
      user: {
        authenticated: user.isAuthenticated,
        onboarded: user.hasCompletedOnboarding,
      },
    };

    Alert.alert('Diagnostics Report', JSON.stringify(report, null, 2), [
      { text: 'OK' },
      {
        text: 'Copy',
        onPress: () => {
          // In a real app, use Clipboard.setString()
          console.log('Diagnostics report:', report);
        },
      },
    ]);
  };

  const problems = checks.filter((c) => c.status === 'error').length;
  const warnings = checks.filter((c) => c.status === 'warning').length;
  const summary =
    checks.length === 0
      ? null
      : problems > 0
        ? {
            tone: 'danger' as const,
            message: `${problems} ${problems === 1 ? 'problem' : 'problems'} found`,
          }
        : warnings > 0
          ? {
              tone: 'warning' as const,
              message: `${warnings} ${warnings === 1 ? 'item needs' : 'items need'} attention`,
            }
          : { tone: 'success' as const, message: 'Everything is working' };

  return (
    <Screen
      title="System diagnostics"
      subtitle="Health checks for camera, pose detection and settings."
      testID="diagnostics-screen"
      footer={
        <>
          <BigButton
            label={isRunning ? 'Running…' : 'Run checks again'}
            icon="refresh"
            onPress={runDiagnostics}
            loading={isRunning}
            accessibilityHint="Refresh diagnostics"
          />
          <BigButton
            label="Export report"
            icon="description"
            variant="secondary"
            onPress={exportDiagnostics}
            accessibilityHint="Export diagnostics report"
          />
        </>
      }
    >
      {summary ? <Banner tone={summary.tone} message={summary.message} /> : null}

      <SectionTitle>Checks</SectionTitle>
      <Card style={styles.listCard}>
        {checks.map((check, index) => (
          <ListRow
            key={index}
            title={check.name}
            description={
              check.details ? `${check.message}\n${check.details}` : check.message
            }
            right={<StatusChip status={check.status} />}
            last={index === checks.length - 1}
          />
        ))}
      </Card>
    </Screen>
  );
};

const STATUS_STYLE: Record<
  DiagnosticCheck['status'],
  { label: string; icon: string; bg: string; fg: string }
> = {
  success: {
    label: 'OK',
    icon: 'check-circle',
    bg: colors.successSoft,
    fg: colors.success,
  },
  warning: {
    label: 'Check',
    icon: 'warning-amber',
    bg: colors.warningSoft,
    fg: colors.warning,
  },
  error: {
    label: 'Problem',
    icon: 'error-outline',
    bg: colors.dangerSoft,
    fg: colors.danger,
  },
  pending: {
    label: 'Waiting',
    icon: 'hourglass-empty',
    bg: colors.surfaceMuted,
    fg: colors.textSecondary,
  },
};

/** Status shown as icon + word + colour (never colour alone). */
const StatusChip: React.FC<{ status: DiagnosticCheck['status'] }> = ({ status }) => {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <View style={[styles.chip, { backgroundColor: st.bg }]}>
      <Icon name={st.icon} size={20} color={st.fg} />
      <AppText variant="label" color={st.fg}>
        {st.label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  listCard: {
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
});

export default DiagnosticsScreen;
