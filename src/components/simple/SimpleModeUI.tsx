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
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Get simple tracking quality indicator
  const getTrackingQualityIndicator = (): { icon: string; color: string; text: string } => {
    switch (trackingQuality) {
      case 'excellent':
        return { icon: '✅', color: '#4CAF50', text: 'Tracking great' };
      case 'good':
        return { icon: '⚠️', color: '#FFC107', text: 'Tracking okay' };
      case 'poor':
        return { icon: '❌', color: '#F44336', text: 'Can\'t see you well' };
    }
  };

  const trackingIndicator = getTrackingQualityIndicator();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        {isDetecting && (
          <View
            style={[styles.statusIndicator, { backgroundColor: trackingIndicator.color }]}
            accessible={true}
            accessibilityLabel={`Tracking status: ${trackingIndicator.text}`}
            accessibilityRole="text"
          >
            <Text style={styles.statusIcon}>{trackingIndicator.icon}</Text>
            <Text style={styles.statusText}>{trackingIndicator.text}</Text>
          </View>
        )}
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Current Instruction - Large and Clear */}
        <View
          style={styles.instructionContainer}
          accessible={true}
          accessibilityLabel={`Exercise instruction: ${getCurrentInstruction()}`}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.instructionText}>
            {getCurrentInstruction()}
          </Text>
        </View>

        {/* Simple Visual Feedback */}
        {isDetecting && (
          <View style={styles.feedbackContainer}>
            <SimpleFeedback
              currentAngle={currentAngle}
              targetAngle={targetAngle}
            />
          </View>
        )}

        {/* Big Action Button */}
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.bigButton}
            onPress={handleMainAction}
            activeOpacity={0.8}
            disabled={currentStatus === 'initializing' || currentStatus === 'error'}
            accessibilityLabel={isDetecting ? 'Stop exercise' : 'Start exercise'}
            accessibilityHint={isDetecting ? 'Tap to stop tracking your movement' : 'Tap to begin exercise tracking'}
            accessibilityRole="button"
            accessible={true}
          >
            <LinearGradient
              colors={isDetecting ? ['#F44336', '#d32f2f'] : ['#4CAF50', '#45a049']}
              style={styles.bigButtonGradient}
            >
              <Text style={styles.bigButtonText}>
                {isDetecting ? 'Stop' : 'Start Exercise'}
              </Text>
              <Text style={styles.bigButtonSubtext}>
                {isDetecting ? 'Tap to stop' : 'Tap to begin'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Exercise Name (if provided) */}
        {exerciseName && !isDetecting && (
          <View style={styles.exerciseNameContainer}>
            <Text style={styles.exerciseNameText}>{exerciseName}</Text>
          </View>
        )}
      </View>

      {/* Bottom Area */}
      <View style={styles.bottomArea}>
        {/* Advanced Options (Hidden by Default) */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={handleToggleAdvanced}
          accessibilityLabel={showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
          accessibilityHint={showAdvanced ? 'Tap to hide detailed exercise information' : 'Tap to see detailed exercise information'}
          accessibilityRole="button"
          accessible={true}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? '▼ Hide Details' : '▶ Show Details'}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedPanel}>
            <AdvancedInfo
              currentAngle={currentAngle}
              targetAngle={targetAngle}
              trackingQuality={trackingQuality}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ============================================================================
// Simple Feedback Component
// ============================================================================

interface SimpleFeedbackProps {
  currentAngle: number;
  targetAngle: number;
}

const SimpleFeedback: React.FC<SimpleFeedbackProps> = ({
  currentAngle,
  targetAngle,
}) => {
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
      <Text style={[styles.bigAngle, isComplete && styles.bigAngleSuccess]}>
        {Math.round(currentAngle)}°
      </Text>

      {/* Simple Progress Bar */}
      <View style={styles.simpleProgressBar}>
        <View
          style={[
            styles.simpleProgressFill,
            {
              width: `${progress}%`,
              backgroundColor: isComplete ? '#4CAF50' : '#2196F3',
            },
          ]}
        />
      </View>

      {/* Target Label */}
      <Text style={styles.targetLabel}>Target: {targetAngle}°</Text>

      {/* Success Message */}
      {isComplete && (
        <View style={styles.successBadge}>
          <Text style={styles.successBadgeText}>✅ Great job!</Text>
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

  return (
    <View
      style={styles.advancedInfoContainer}
      accessible={true}
      accessibilityLabel={`Advanced details. Current angle: ${currentAngle.toFixed(1)} degrees. Target angle: ${targetAngle} degrees. Progress: ${progress.toFixed(1)} percent. Tracking quality: ${trackingQuality}`}
      accessibilityRole="text"
    >
      <View style={styles.advancedInfoRow}>
        <Text style={styles.advancedInfoLabel}>Current Angle:</Text>
        <Text style={styles.advancedInfoValue}>{currentAngle.toFixed(1)}°</Text>
      </View>

      <View style={styles.advancedInfoRow}>
        <Text style={styles.advancedInfoLabel}>Target Angle:</Text>
        <Text style={styles.advancedInfoValue}>{targetAngle}°</Text>
      </View>

      <View style={styles.advancedInfoRow}>
        <Text style={styles.advancedInfoLabel}>Progress:</Text>
        <Text style={styles.advancedInfoValue}>{progress.toFixed(1)}%</Text>
      </View>

      <View style={styles.advancedInfoRow}>
        <Text style={styles.advancedInfoLabel}>Tracking Quality:</Text>
        <Text style={styles.advancedInfoValue}>
          {trackingQuality.charAt(0).toUpperCase() + trackingQuality.slice(1)}
        </Text>
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionContainer: {
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 38,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  feedbackContainer: {
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  bigButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bigButtonGradient: {
    borderRadius: 60,
    paddingVertical: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  bigButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  bigButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  exerciseNameContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  exerciseNameText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  advancedToggle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  advancedToggleText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  advancedPanel: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 20,
  },
  simpleFeedbackContainer: {
    alignItems: 'center',
  },
  bigAngle: {
    fontSize: 80,
    fontWeight: '700',
    color: '#2196F3',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    marginBottom: 20,
  },
  bigAngleSuccess: {
    color: '#4CAF50',
  },
  simpleProgressBar: {
    width: 250,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  simpleProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  targetLabel: {
    fontSize: 16,
    color: '#CCC',
    fontWeight: '600',
  },
  successBadge: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  successBadgeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  advancedInfoContainer: {
    gap: 12,
  },
  advancedInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advancedInfoLabel: {
    fontSize: 14,
    color: '#888',
  },
  advancedInfoValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default SimpleModeUI;
