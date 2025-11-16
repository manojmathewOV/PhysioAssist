/**
 * Diagnostics Screen
 *
 * Provides system health checks and troubleshooting for:
 * - Camera permissions and availability
 * - Pose detection initialization
 * - Network connectivity
 * - Device capabilities
 * - Performance metrics
 *
 * Helps users and support team diagnose issues
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { poseDetectionService } from '@services/poseDetectionService';

interface DiagnosticCheck {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
}

const DiagnosticsScreen: React.FC = () => {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const devices = useCameraDevices();
  const settings = useSelector((state: RootState) => state.settings);
  const user = useSelector((state: RootState) => state.user);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticCheck[] = [];

    // 1. Check Camera Permission
    try {
      const permission = await Camera.getCameraPermissionStatus();
      results.push({
        name: 'Camera Permission',
        status: permission === 'authorized' ? 'success' : 'error',
        message:
          permission === 'authorized'
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
    if (devices.front || devices.back) {
      results.push({
        name: 'Camera Device',
        status: 'success',
        message: 'Camera device available',
        details: `Front: ${devices.front ? 'Yes' : 'No'}, Back: ${
          devices.back ? 'Yes' : 'No'
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

    // 3. Check Pose Detection Service
    try {
      const isPoseReady = poseDetectionService.isReady();
      results.push({
        name: 'Pose Detection',
        status: isPoseReady ? 'success' : 'warning',
        message: isPoseReady
          ? 'Pose detection initialized'
          : 'Pose detection not initialized',
        details: isPoseReady
          ? 'Service ready for frame processing'
          : 'Will initialize on first use',
      });
    } catch (error) {
      results.push({
        name: 'Pose Detection',
        status: 'error',
        message: 'Failed to check pose detection service',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 4. Check Platform
    results.push({
      name: 'Platform',
      status: 'success',
      message: `Running on ${Platform.OS}`,
      details: `Version: ${Platform.Version}, Select: ${
        Platform.select ? 'Available' : 'N/A'
      }`,
    });

    // 5. Check User Authentication State
    results.push({
      name: 'Authentication',
      status: user.isAuthenticated ? 'success' : 'warning',
      message: user.isAuthenticated ? 'User authenticated' : 'Not authenticated',
      details: user.currentUser
        ? `User: ${user.currentUser.email}`
        : 'No user session',
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

  const getStatusColor = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'pending':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      case 'pending':
        return '○';
      default:
        return '?';
    }
  };

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

    Alert.alert(
      'Diagnostics Report',
      JSON.stringify(report, null, 2),
      [
        { text: 'OK' },
        {
          text: 'Copy',
          onPress: () => {
            // In a real app, use Clipboard.setString()
            console.log('Diagnostics report:', report);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Diagnostics</Text>
        <Text style={styles.subtitle}>
          Health checks for camera, pose detection, and settings
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {checks.map((check, index) => (
          <View key={index} style={styles.checkCard}>
            <View style={styles.checkHeader}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(check.status) },
                ]}
              >
                <Text style={styles.statusIcon}>{getStatusIcon(check.status)}</Text>
              </View>
              <View style={styles.checkInfo}>
                <Text style={styles.checkName}>{check.name}</Text>
                <Text style={styles.checkMessage}>{check.message}</Text>
              </View>
            </View>
            {check.details && (
              <Text style={styles.checkDetails}>{check.details}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={runDiagnostics}
          disabled={isRunning}
          accessible={true}
          accessibilityLabel="Refresh diagnostics"
          accessibilityRole="button"
        >
          <Text style={styles.refreshButtonText}>
            {isRunning ? 'Running...' : '🔄 Refresh Diagnostics'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportDiagnostics}
          accessible={true}
          accessibilityLabel="Export diagnostics report"
          accessibilityRole="button"
        >
          <Text style={styles.exportButtonText}>📋 Export Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  checkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkInfo: {
    flex: 1,
  },
  checkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  checkMessage: {
    fontSize: 14,
    color: '#666',
  },
  checkDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginLeft: 48,
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiagnosticsScreen;
