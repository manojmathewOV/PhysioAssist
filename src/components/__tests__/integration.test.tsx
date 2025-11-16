/**
 * Component Integration Tests
 * Tests how components work together in real scenarios
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

// Components
import PoseDetectionScreen from '../../screens/PoseDetectionScreenAccessible';
import ExerciseControls from '../exercises/ExerciseControls';
import PoseOverlay from '../pose/PoseOverlay';
import SettingsScreen from '../../screens/SettingsScreen';

// Services
import { poseDetectionService } from '../../services/poseDetectionService';
import { goniometerService } from '../../services/goniometerService';
import { exerciseValidationService } from '../../services/exerciseValidationService';
import { audioFeedbackService } from '../../services/audioFeedbackService';

// Store
import { rootReducer } from '../../store';
import { setPoseData, setDetecting } from '../../store/slices/poseSlice';
import { updateExerciseProgress } from '../../store/slices/exerciseSlice';

// Mock services
jest.mock('../../services/poseDetectionService', () => ({
  poseDetectionService: {
    initialize: jest.fn().mockResolvedValue(true),
    startDetection: jest.fn().mockResolvedValue(true),
    stopDetection: jest.fn().mockResolvedValue(undefined),
    processFrame: jest.fn().mockReturnValue({
      landmarks: [],
      confidence: 0.9,
    }),
    cleanup: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

jest.mock('../../services/audioFeedbackService', () => ({
  audioFeedbackService: {
    speak: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    setRate: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

jest.mock('../../services/goniometerService');
jest.mock('../../services/exerciseValidationService', () => ({
  exerciseValidationService: {
    startExercise: jest.fn(),
    validateExercise: jest.fn(),
    stopExercise: jest.fn(),
  },
}));

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => {
  const MockCamera = ({ children, ...props }: any) => (
    <view testID="mock-camera" {...props}>
      {children}
    </view>
  );

  const Camera = Object.assign(MockCamera, {
    requestCameraPermission: jest.fn().mockResolvedValue('authorized'),
    getCameraDevice: jest.fn().mockReturnValue({ id: 'back', position: 'back' }),
    openSettings: jest.fn(),
  });

  return {
    Camera,
    useCameraDevices: () => ({ front: { id: 'front' }, back: { id: 'back' } }),
    useFrameProcessor: (callback: any) => callback,
  };
});

// Helper to create test store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

// Helper to render with providers
const renderWithProviders = (
  component: React.ReactElement,
  { store = createTestStore(), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <NavigationContainer>{children}</NavigationContainer>
    </Provider>
  );

  return {
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
};

describe('Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
  });

  describe('Pose Detection Flow Integration', () => {
    it('should complete full exercise session workflow', async () => {
      // Mock service responses
      (poseDetectionService.initialize as jest.Mock).mockResolvedValue(true);
      (poseDetectionService.startDetection as jest.Mock).mockResolvedValue(true);
      (poseDetectionService.processFrame as jest.Mock).mockReturnValue({
        landmarks: mockLandmarks,
        confidence: 0.9,
      });

      const { getByTestId, getByText, store } = renderWithProviders(
        <PoseDetectionScreen />
      );

      // Wait for initialization
      await waitFor(() => {
        expect(poseDetectionService.initialize).toHaveBeenCalled();
      });

      // Grant camera permission (mocked)
      const startButton = getByTestId('pose-start-detection');
      expect(startButton).toBeTruthy();

      // Start detection
      await act(async () => {
        fireEvent.press(startButton);
      });

      // Verify detection started
      await waitFor(() => {
        expect(poseDetectionService.startDetection).toHaveBeenCalled();
        expect(store.getState().pose.isDetecting).toBe(true);
      });

      // Verify UI updates
      expect(getByTestId('pose-stop-detection')).toBeTruthy();
      expect(getByTestId('pose-confidence')).toBeTruthy();

      // Simulate pose data updates
      act(() => {
        store.dispatch(
          setPoseData({
            landmarks: mockLandmarks,
            timestamp: Date.now(),
            confidence: 0.9,
          })
        );
      });

      // Verify confidence display
      const confidenceText = getByTestId('pose-confidence');
      expect(confidenceText).toBeTruthy();

      // Stop detection
      const stopButton = getByTestId('pose-stop-detection');
      await act(async () => {
        fireEvent.press(stopButton);
      });

      // Verify detection stopped
      await waitFor(() => {
        expect(store.getState().pose.isDetecting).toBe(false);
      });
    });

    it('should handle exercise selection and validation', async () => {
      const store = createTestStore({
        pose: {
          isDetecting: true,
          landmarks: mockLandmarks,
          confidence: 0.9,
        },
      });

      const { getByTestId, getByText } = renderWithProviders(<ExerciseControls />, {
        store,
      });

      // Select bicep curl exercise
      const bicepCurlButton = getByTestId('exercise-bicep-curl');
      fireEvent.press(bicepCurlButton);

      // Start exercise
      const startExerciseButton = getByTestId('exercise-start');
      fireEvent.press(startExerciseButton);

      // Verify exercise started
      await waitFor(() => {
        expect(exerciseValidationService.startExercise).toHaveBeenCalledWith(
          'bicep_curl',
          expect.any(Object)
        );
      });

      // Simulate exercise validation
      act(() => {
        store.dispatch(
          updateExerciseProgress({
            exerciseId: 'bicep_curl',
            repetitions: 5,
            quality: 0.85,
          })
        );
      });

      // Verify UI updates
      const repCounter = getByTestId('exercise-rep-counter');
      expect(repCounter).toBeTruthy();

      const formQuality = getByTestId('exercise-form-quality');
      expect(formQuality).toBeTruthy();
    });

    it('should provide real-time feedback during exercise', async () => {
      // Mock audio feedback
      (audioFeedbackService.speak as jest.Mock).mockImplementation(() => {});

      const store = createTestStore({
        pose: {
          isDetecting: true,
          landmarks: mockLandmarks,
          confidence: 0.9,
        },
        exercise: {
          currentExercise: 'bicep_curl',
          isActive: true,
        },
      });

      // Mock validation results
      (exerciseValidationService.validateExercise as jest.Mock).mockReturnValue({
        isValid: false,
        phase: 'flexion',
        formScore: 0.6,
        errors: ['elbow_flare'],
        feedbackMessage: 'Keep your elbow closer to your body',
        repetitions: 3,
      });

      const { getByTestId } = renderWithProviders(<PoseDetectionScreen />, { store });

      // Trigger pose update
      act(() => {
        store.dispatch(
          setPoseData({
            landmarks: mockLandmarks,
            timestamp: Date.now(),
            confidence: 0.9,
          })
        );
      });

      // Verify feedback was provided
      await waitFor(() => {
        expect(audioFeedbackService.speak).toHaveBeenCalledWith(
          'Keep your elbow closer to your body'
        );
      });

      // Verify feedback text display
      const feedbackText = getByTestId('exercise-feedback');
      expect(feedbackText).toBeTruthy();
    });
  });

  describe('Settings Integration', () => {
    it('should persist settings changes across app', async () => {
      const store = createTestStore();

      const { getByTestId } = renderWithProviders(<SettingsScreen />, { store });

      // Toggle sound setting
      const soundToggle = getByTestId('settings-sound-toggle');
      const initialSoundState = store.getState().settings.enableSound;

      fireEvent(soundToggle, 'onValueChange', !initialSoundState);

      // Verify state updated
      await waitFor(() => {
        expect(store.getState().settings.enableSound).toBe(!initialSoundState);
      });

      // Verify audio service updated
      expect(audioFeedbackService.updateConfig).toHaveBeenCalledWith({
        enableSound: !initialSoundState,
      });

      // Save settings
      const saveButton = getByTestId('settings-save');
      fireEvent.press(saveButton);

      // Verify settings persisted
      await waitFor(() => {
        expect(getByTestId('toast-message')).toBeTruthy();
      });
    });

    it('should apply performance settings immediately', async () => {
      const store = createTestStore();

      const { getByTestId } = renderWithProviders(<SettingsScreen />, { store });

      // Adjust frame skip setting
      const frameSkipSlider = getByTestId('settings-frame-skip');
      fireEvent(frameSkipSlider, 'onSlidingComplete', 5);

      // Verify pose detection service updated
      await waitFor(() => {
        expect(poseDetectionService.updateConfig).toHaveBeenCalledWith({
          frameSkip: 5,
        });
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle camera permission denial gracefully', async () => {
      // Mock permission denial
      (Camera.requestCameraPermission as jest.Mock).mockResolvedValue('denied');

      const { getByTestId, getByText } = renderWithProviders(<PoseDetectionScreen />);

      // Try to start detection
      const startButton = getByTestId('pose-start-detection');
      fireEvent.press(startButton);

      // Verify alert shown
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Camera Permission Required',
          expect.any(String),
          expect.any(Array)
        );
      });
    });

    it('should recover from pose detection failure', async () => {
      // Mock detection failure
      (poseDetectionService.startDetection as jest.Mock).mockRejectedValue(
        new Error('Model loading failed')
      );

      const { getByTestId, getByText } = renderWithProviders(<PoseDetectionScreen />);

      // Try to start detection
      const startButton = getByTestId('pose-start-detection');
      fireEvent.press(startButton);

      // Verify error handling
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Failed to start'),
          expect.any(Array)
        );
      });

      // Verify UI returned to initial state
      expect(getByTestId('pose-start-detection')).toBeTruthy();
    });
  });

  describe('Navigation Integration', () => {
    it('should maintain state during navigation', async () => {
      const store = createTestStore({
        exercise: {
          history: [
            { date: '2025-01-28', exerciseId: 'bicep_curl', reps: 30 },
            { date: '2025-01-27', exerciseId: 'squat', reps: 20 },
          ],
        },
      });

      // Create wrapper without nested NavigationContainer
      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      // Render main screen
      const { rerender } = render(
        <NavigationContainer>
          <PoseDetectionScreen />
        </NavigationContainer>,
        { wrapper: Wrapper }
      );

      // Navigate to settings (simulated)
      rerender(
        <NavigationContainer independent={true}>
          <SettingsScreen />
        </NavigationContainer>
      );

      // Navigate back to main screen
      rerender(
        <NavigationContainer independent={true}>
          <PoseDetectionScreen />
        </NavigationContainer>
      );

      // Verify state preserved
      expect(store.getState().exercise.history).toHaveLength(2);
    });
  });

  describe('Performance Monitoring', () => {
    it('should handle rapid pose updates efficiently', async () => {
      const store = createTestStore({
        pose: { isDetecting: true },
      });

      const { rerender } = renderWithProviders(<PoseOverlay />, { store });

      const updateCount = 100;
      const startTime = Date.now();

      // Simulate rapid pose updates
      for (let i = 0; i < updateCount; i++) {
        act(() => {
          store.dispatch(
            setPoseData({
              landmarks: mockLandmarks,
              timestamp: Date.now(),
              confidence: 0.9,
            })
          );
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should handle 100 updates in less than 1 second
      expect(totalTime).toBeLessThan(1000);
    });
  });
});

// Mock data
const mockLandmarks = Array(33)
  .fill(null)
  .map((_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: 0,
    visibility: 0.9,
    name: `landmark_${i}`,
  }));
