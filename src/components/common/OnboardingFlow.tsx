/**
 * OnboardingFlow Component
 *
 * Interactive onboarding tutorial for first-time users
 * Guides users through app setup and explains key features
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  title: string;
  description: string;
  icon?: string;
  tips?: string[];
}

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: () => void;
  steps?: OnboardingStep[];
}

const defaultSteps: OnboardingStep[] = [
  {
    title: '👋 Welcome to PhysioAssist',
    description:
      'AI-powered physiotherapy assistant that helps you exercise correctly and track your progress.',
    tips: [
      'Real-time pose detection',
      'Accurate angle measurements',
      'Exercise form validation',
    ],
  },
  {
    title: '📸 Camera Setup',
    description: 'Position yourself so your entire body is visible in the camera frame.',
    tips: [
      'Stand 6-8 feet from camera',
      'Ensure good lighting',
      'Avoid busy backgrounds',
      'Use front-facing camera for best results',
    ],
  },
  {
    title: '🎯 Pose Detection',
    description:
      'Green indicators show high confidence tracking. Yellow means you may need to adjust your position.',
    tips: [
      'Green overlay = Good tracking (>70% confidence)',
      'Yellow overlay = Moderate tracking (40-70%)',
      'Orange overlay = Poor tracking (<40%)',
    ],
  },
  {
    title: '📐 Goniometer',
    description:
      'Measure joint angles accurately in real-time. Perfect for ROM (Range of Motion) assessment.',
    tips: [
      'Select three points: start, vertex, end',
      'Keep joints clearly visible',
      'Measurements update in real-time',
    ],
  },
  {
    title: '🏋️ Exercises',
    description:
      'Choose from guided exercises with real-time feedback on your form and range of motion.',
    tips: [
      'Follow the on-screen guide',
      'Listen for audio feedback',
      'Track your progress over time',
    ],
  },
  {
    title: '✅ Ready to Start!',
    description:
      "You're all set! Grant camera permission to begin your physiotherapy session.",
    tips: [
      'Tap "Start Detection" when ready',
      'Adjust your position as needed',
      'Take breaks between exercises',
    ],
  },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  visible,
  onComplete,
  steps = defaultSteps,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    ReactNativeHapticFeedback.trigger('impactLight');

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      onComplete();
    }
  };

  const handleBack = () => {
    ReactNativeHapticFeedback.trigger('impactLight');

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    onComplete();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      transparent={false}
      testID="onboarding-welcome"
    >
      <LinearGradient colors={['#1a1a1a', '#0d0d0d']} style={styles.container}>
        {/* Skip Button */}
        {!isLastStep && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            testID="onboarding-skip"
            accessible={true}
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>{step.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{step.description}</Text>

          {/* Tips */}
          {step.tips && step.tips.length > 0 && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Tips:</Text>
              {step.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          {/* Back Button */}
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Next/Get Started Button */}
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
            onPress={handleNext}
            testID="onboarding-get-started"
            accessible={true}
            accessibilityLabel={
              isLastStep ? 'Get started with PhysioAssist' : 'Next step'
            }
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextText}>
                {isLastStep ? '🚀 Get Started' : 'Next →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    color: '#CCC',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  tipsContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    color: '#4CAF50',
    fontSize: 20,
    marginRight: 12,
    lineHeight: 24,
  },
  tipText: {
    flex: 1,
    color: '#DDD',
    fontSize: 15,
    lineHeight: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  backText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
  nextButtonFull: {
    flex: 1,
    marginLeft: 0,
  },
  nextButtonGradient: {
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default OnboardingFlow;
