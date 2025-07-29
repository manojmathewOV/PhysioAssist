/**
 * Component Verification Tests
 * Ensures every component works exactly as planned
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { Alert, Vibration, AccessibilityInfo } from 'react-native';

// Import ALL components
import PoseDetectionScreen from '../../screens/PoseDetectionScreenAccessible';
import ExerciseControls from '../exercises/ExerciseControls';
import PoseOverlay from '../pose/PoseOverlay';
import SettingsScreen from '../../screens/SettingsScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import OnboardingScreen from '../../screens/OnboardingScreen';
import LoginScreen from '../../screens/LoginScreen';
import ExerciseSelector from '../exercises/ExerciseSelector';
import ProgressChart from '../progress/ProgressChart';
import ExerciseSummary from '../exercises/ExerciseSummary';
import App from '../../App';
import ErrorBoundary from '../common/ErrorBoundary';
import NetworkStatusBar from '../common/NetworkStatusBar';

// Services and utilities
import { createTestStore } from '../../utils/testHelpers';
import * as testData from '../../__tests__/fixtures/testData';

// Mock all native modules
jest.mock('react-native-vision-camera');
jest.mock('react-native-tts');
jest.mock('react-native-sound');
jest.mock('react-native-haptic-feedback');
jest.mock('@react-native-async-storage/async-storage');

describe('Component Verification Tests - Complete System Check', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
    Vibration.vibrate = jest.fn();
    AccessibilityInfo.announceForAccessibility = jest.fn();
  });

  describe('1. Onboarding Components', () => {
    it('should render onboarding screen with all elements', () => {
      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <OnboardingScreen />
        </NavigationContainer>
      );

      // Verify all onboarding elements present
      expect(getByTestId('onboarding-welcome')).toBeTruthy();
      expect(getByTestId('onboarding-get-started')).toBeTruthy();
      expect(getByTestId('onboarding-skip')).toBeTruthy();
      expect(getByText(/Welcome to PhysioAssist/i)).toBeTruthy();
    });

    it('should handle privacy consent correctly', async () => {
      const onComplete = jest.fn();
      const { getByTestId } = render(
        <NavigationContainer>
          <OnboardingScreen onComplete={onComplete} />
        </NavigationContainer>
      );

      // Navigate to privacy screen
      fireEvent.press(getByTestId('onboarding-get-started'));
      
      await waitFor(() => {
        expect(getByTestId('onboarding-privacy-checkbox')).toBeTruthy();
      });

      // Try to continue without accepting
      fireEvent.press(getByTestId('onboarding-next'));
      
      // Should show alert
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('accept')
      );

      // Accept privacy and continue
      fireEvent.press(getByTestId('onboarding-privacy-checkbox'));
      fireEvent.press(getByTestId('onboarding-next'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('2. Authentication Components', () => {
    it('should validate login form correctly', async () => {
      const onLogin = jest.fn();
      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <LoginScreen onLogin={onLogin} />
        </NavigationContainer>
      );

      const emailInput = getByTestId('auth-email-input');
      const passwordInput = getByTestId('auth-password-input');
      const loginButton = getByTestId('auth-login-button');

      // Test empty fields
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(getByTestId('auth-error-message')).toBeTruthy();
      });

      // Test invalid email
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText(/valid email/i)).toBeTruthy();
      });

      // Test valid credentials
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'Test123!');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(onLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Test123!'
        });
      });
    });

    it('should toggle password visibility', () => {
      const { getByTestId } = render(
        <NavigationContainer>
          <LoginScreen />
        </NavigationContainer>
      );

      const passwordInput = getByTestId('auth-password-input');
      const toggleButton = getByTestId('password-toggle');

      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Toggle to show password
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Toggle back to hide
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('3. Pose Detection Components', () => {
    it('should handle camera permission flow correctly', async () => {
      const store = createTestStore();
      const { getByTestId } = render(
        <Provider store={store}>
          <NavigationContainer>
            <PoseDetectionScreen />
          </NavigationContainer>
        </Provider>
      );

      // Should show permission screen initially
      expect(getByTestId('camera-permission-dialog')).toBeTruthy();

      // Grant permission
      fireEvent.press(getByTestId('camera-permission-grant'));

      await waitFor(() => {
        expect(getByTestId('pose-camera-view')).toBeTruthy();
      });
    });

    it('should update confidence indicator in real-time', async () => {
      const store = createTestStore({
        pose: {
          isDetecting: true,
          confidence: 0.5
        }
      });

      const { getByTestId, rerender } = render(
        <Provider store={store}>
          <NavigationContainer>
            <PoseDetectionScreen />
          </NavigationContainer>
        </Provider>
      );

      const confidenceIndicator = getByTestId('pose-confidence');
      expect(confidenceIndicator).toBeTruthy();
      
      // Update confidence
      store.dispatch({
        type: 'pose/setConfidence',
        payload: 0.9
      });

      await waitFor(() => {
        expect(getByTestId('pose-confidence')).toHaveTextContent('90%');
      });
    });
  });

  describe('4. Exercise Components', () => {
    it('should track exercise phases correctly', async () => {
      const store = createTestStore();
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <ExerciseControls />
        </Provider>
      );

      // Select exercise
      fireEvent.press(getByTestId('exercise-bicep-curl'));
      
      // Start exercise
      fireEvent.press(getByTestId('exercise-start'));

      // Verify initial state
      expect(getByTestId('exercise-rep-counter')).toHaveTextContent('0');
      expect(getByTestId('exercise-phase-indicator')).toHaveTextContent('Ready');

      // Simulate pose updates for different phases
      const phases = ['start', 'flexion', 'extension'];
      
      for (const phase of phases) {
        store.dispatch({
          type: 'exercise/updatePhase',
          payload: phase
        });

        await waitFor(() => {
          expect(getByTestId('exercise-phase-indicator')).toHaveTextContent(phase);
        });
      }

      // Simulate rep completion
      store.dispatch({
        type: 'exercise/incrementReps',
        payload: 1
      });

      await waitFor(() => {
        expect(getByTestId('exercise-rep-counter')).toHaveTextContent('1');
      });
    });

    it('should provide form feedback appropriately', async () => {
      const store = createTestStore();
      const { getByTestId } = render(
        <Provider store={store}>
          <ExerciseControls />
        </Provider>
      );

      // Start exercise
      fireEvent.press(getByTestId('exercise-bicep-curl'));
      fireEvent.press(getByTestId('exercise-start'));

      // Simulate poor form
      store.dispatch({
        type: 'exercise/updateFormScore',
        payload: 0.4
      });

      store.dispatch({
        type: 'exercise/setFeedback',
        payload: 'Keep your elbow closer to your body'
      });

      await waitFor(() => {
        expect(getByTestId('exercise-form-quality')).toHaveTextContent('Poor');
        expect(getByTestId('exercise-feedback')).toHaveTextContent('Keep your elbow closer');
      });

      // Verify haptic feedback was triggered
      expect(Vibration.vibrate).toHaveBeenCalled();
    });
  });

  describe('5. Settings Components', () => {
    it('should persist all settings changes', async () => {
      const store = createTestStore();
      const { getByTestId } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      // Change all settings
      fireEvent(getByTestId('settings-sound-toggle'), 'onValueChange', false);
      fireEvent(getByTestId('settings-haptic-toggle'), 'onValueChange', false);
      fireEvent(getByTestId('settings-speech-rate'), 'onSlidingComplete', 1.5);
      fireEvent(getByTestId('settings-frame-skip'), 'onSlidingComplete', 5);

      // Save settings
      fireEvent.press(getByTestId('settings-save'));

      // Verify store updated
      await waitFor(() => {
        const state = store.getState().settings;
        expect(state.enableSound).toBe(false);
        expect(state.enableHaptics).toBe(false);
        expect(state.speechRate).toBe(1.5);
        expect(state.frameSkip).toBe(5);
      });

      // Verify toast message
      expect(getByTestId('toast-message')).toBeTruthy();
    });

    it('should reset settings to defaults', async () => {
      const store = createTestStore({
        settings: {
          enableSound: false,
          enableHaptics: false,
          speechRate: 2.0,
          frameSkip: 10
        }
      });

      const { getByTestId } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      // Reset settings
      fireEvent.press(getByTestId('settings-reset'));

      // Confirm reset
      const [, , confirmCallback] = Alert.alert.mock.calls[0];
      confirmCallback[0].onPress();

      await waitFor(() => {
        const state = store.getState().settings;
        expect(state.enableSound).toBe(true);
        expect(state.enableHaptics).toBe(true);
        expect(state.speechRate).toBe(1.0);
        expect(state.frameSkip).toBe(3);
      });
    });
  });

  describe('6. Progress Tracking Components', () => {
    it('should display progress charts correctly', () => {
      const progressData = testData.generateTimeSeriesData(7);
      
      const { getByTestId } = render(
        <ProgressChart data={progressData} />
      );

      // Verify chart elements
      expect(getByTestId('progress-chart')).toBeTruthy();
      expect(getByTestId('chart-legend')).toBeTruthy();
      
      // Verify data points
      progressData.forEach((_, index) => {
        expect(getByTestId(`data-point-${index}`)).toBeTruthy();
      });
    });

    it('should handle empty progress data gracefully', () => {
      const { getByTestId, getByText } = render(
        <ProgressChart data={[]} />
      );

      expect(getByTestId('empty-progress-message')).toBeTruthy();
      expect(getByText(/No data available/i)).toBeTruthy();
    });
  });

  describe('7. Accessibility Components', () => {
    it('should announce all important actions', async () => {
      const store = createTestStore();
      const { getByTestId } = render(
        <Provider store={store}>
          <PoseDetectionScreen />
        </Provider>
      );

      // Start detection
      fireEvent.press(getByTestId('pose-start-detection'));

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          'Pose detection started. Begin your exercise.'
        );
      });

      // Stop detection
      fireEvent.press(getByTestId('pose-stop-detection'));

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          'Pose detection stopped.'
        );
      });
    });

    it('should have proper accessibility labels on all interactive elements', () => {
      const store = createTestStore();
      const { getByLabelText, getByRole } = render(
        <Provider store={store}>
          <ExerciseControls />
        </Provider>
      );

      // Verify accessibility labels
      expect(getByLabelText('Select exercise type')).toBeTruthy();
      expect(getByLabelText('Start exercise')).toBeTruthy();
      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('8. Error Boundary Components', () => {
    it('should catch and display errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { getByTestId, getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByTestId('error-boundary-message')).toBeTruthy();
      expect(getByText(/Something went wrong/i)).toBeTruthy();
      expect(getByTestId('error-retry-button')).toBeTruthy();
    });
  });

  describe('9. Network Status Components', () => {
    it('should show offline indicator when disconnected', async () => {
      const store = createTestStore();
      
      // Simulate offline
      store.dispatch({
        type: 'network/setStatus',
        payload: { isConnected: false }
      });

      const { getByTestId } = render(
        <Provider store={store}>
          <NetworkStatusBar />
        </Provider>
      );

      expect(getByTestId('offline-indicator')).toBeTruthy();
      expect(getByTestId('offline-message')).toHaveTextContent('You are offline');
    });

    it('should queue actions when offline', async () => {
      const store = createTestStore({
        network: { isConnected: false }
      });

      const { getByTestId } = render(
        <Provider store={store}>
          <ProfileScreen />
        </Provider>
      );

      // Try to save profile while offline
      fireEvent.press(getByTestId('profile-save'));

      await waitFor(() => {
        expect(getByTestId('offline-queue-message')).toBeTruthy();
        expect(store.getState().network.queuedActions).toHaveLength(1);
      });
    });
  });

  describe('10. Integration Smoke Test', () => {
    it('should complete a full user journey without errors', async () => {
      const store = createTestStore();
      
      // Render main app
      const { getByTestId, getByText, queryByTestId } = render(
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
        </Provider>
      );

      // Complete onboarding
      if (queryByTestId('onboarding-skip')) {
        fireEvent.press(getByTestId('onboarding-skip'));
      }

      // Login
      if (queryByTestId('auth-email-input')) {
        fireEvent.changeText(getByTestId('auth-email-input'), 'test@example.com');
        fireEvent.changeText(getByTestId('auth-password-input'), 'Test123!');
        fireEvent.press(getByTestId('auth-login-button'));
      }

      // Wait for main screen
      await waitFor(() => {
        expect(getByTestId('pose-detection-screen')).toBeTruthy();
      });

      // Select and start exercise
      fireEvent.press(getByTestId('exercise-selector'));
      fireEvent.press(getByTestId('exercise-bicep-curl'));
      fireEvent.press(getByTestId('exercise-start'));

      // Verify exercise started
      await waitFor(() => {
        expect(getByTestId('exercise-rep-counter')).toBeTruthy();
      });

      // Stop exercise
      fireEvent.press(getByTestId('exercise-end'));

      // Verify summary
      await waitFor(() => {
        expect(getByTestId('exercise-summary')).toBeTruthy();
      });

      // No errors should have been thrown
      expect(true).toBe(true);
    });
  });
});