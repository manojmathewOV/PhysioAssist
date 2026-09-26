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
import { Camera } from 'react-native-vision-camera';
import { usePoseDetection } from 'react-native-mediapipe';

// Components
import PoseDetectionScreen from '../../screens/PoseDetectionScreenAccessible';
import ExerciseControls from '../exercises/ExerciseControls';
import PoseOverlay from '../pose/PoseOverlay';
import SettingsScreen from '../../screens/SettingsScreen';

// Services (camera screens run BlazePose through useBlazePose ->
// react-native-mediapipe, mocked in __tests__/setup.ts)
import { goniometerService } from '../../services/goniometerService';
import { exerciseValidationService } from '../../services/exerciseValidationService';
import { audioFeedbackService } from '../../services/audioFeedbackService';

// Store
import { rootReducer } from '../../store';
import { setPoseData } from '../../store/slices/poseSlice';
import { updateExerciseProgress } from '../../store/slices/exerciseSlice';
import { EXERCISES } from '../../constants/exercises';
import { PoseLandmark } from '../../types/pose';

// Mock services
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
    validatePose: jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
      phase: 'rest',
      feedback: [],
    }),
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
    requestCameraPermission: jest.fn().mockResolvedValue('granted'),
    getCameraDevice: jest.fn().mockReturnValue({ id: 'back', position: 'back' }),
    openSettings: jest.fn(),
  });

  return {
    Camera,
    useCameraDevices: () => [
      { id: 'front', position: 'front' },
      { id: 'back', position: 'back' },
    ],
    useCameraDevice: (position: string) => ({ id: position, position }),
    useFrameProcessor: (callback: any) => callback,
  };
});

type RootTestState = ReturnType<typeof rootReducer>;
type PartialTestState = { [K in keyof RootTestState]?: Partial<RootTestState[K]> };

// Helper to create test store. Partial slice state is merged over each slice's
// initial state so tests only need to specify the fields they care about.
const createTestStore = (preloadedState: PartialTestState = {}) => {
  const defaults = rootReducer(undefined, { type: '@@test/INIT' });
  const merged = Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [
      key,
      { ...value, ...(preloadedState[key as keyof RootTestState] ?? {}) },
    ])
  ) as RootTestState;
  return configureStore({
    reducer: rootReducer,
    preloadedState: merged,
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
      const { getByTestId, store } = renderWithProviders(<PoseDetectionScreen />);

      // The BlazePose detector is created natively (live-stream mode)
      expect(usePoseDetection).toHaveBeenCalled();

      // Camera permission is granted (mocked), so the start button appears
      const startButton = await waitFor(() => getByTestId('pose-start-detection'));

      // No frames are analysed until detection starts
      expect(getByTestId('pose-camera-view').props.frameProcessor).toBeUndefined();

      // Start detection
      await act(async () => {
        fireEvent.press(startButton);
      });

      // Verify detection started: BlazePose's frame processor is attached
      await waitFor(() => {
        expect(store.getState().pose.isDetecting).toBe(true);
        expect(getByTestId('pose-camera-view').props.frameProcessor).toBeDefined();
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
      expect(confidenceText).toHaveTextContent('90%');

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
          confidence: 0.9,
        },
      });

      const { getByTestId } = renderWithProviders(<ExerciseControls />, {
        store,
      });

      // Selecting bicep curl starts the exercise immediately
      const bicepCurlButton = getByTestId('exercise-bicep-curl');
      fireEvent.press(bicepCurlButton);

      // Verify exercise started in both the store and the validation service
      await waitFor(() => {
        expect(exerciseValidationService.startExercise).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'bicep-curl', name: 'Bicep Curl' })
        );
        expect(store.getState().exercise.isExercising).toBe(true);
      });

      // Simulate exercise validation
      act(() => {
        store.dispatch(
          updateExerciseProgress({
            reps: 5,
            formScore: 0.85,
          })
        );
      });

      // Verify UI updates
      expect(getByTestId('exercise-rep-counter')).toHaveTextContent('5');
      expect(getByTestId('exercise-form-quality')).toHaveTextContent('Excellent');
    });

    it('should provide real-time feedback during exercise', async () => {
      const store = createTestStore({
        pose: {
          isDetecting: true,
          confidence: 0.9,
        },
        exercise: {
          currentExercise: EXERCISES.bicepCurl,
          isExercising: true,
        },
      });

      // Mock validation results
      (exerciseValidationService.validatePose as jest.Mock).mockReturnValue({
        isValid: false,
        phase: 'flexion',
        errors: ['elbow_flare'],
        feedback: ['Keep your elbow closer to your body'],
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
      expect(feedbackText).toHaveTextContent('Keep your elbow closer to your body');
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

      // Changes save straight away (no Save button); a "Saved" toast confirms it
      await waitFor(() => {
        expect(getByTestId('toast-message')).toBeTruthy();
      });
    });

    it('should apply performance settings immediately', async () => {
      const store = createTestStore();

      const { getByTestId } = renderWithProviders(<SettingsScreen />, { store });

      // Frame skip lives in the collapsed "Advanced" section
      fireEvent.press(getByTestId('settings-advanced-toggle'));
      const frameSkipSlider = getByTestId('settings-frame-skip');
      fireEvent(frameSkipSlider, 'onSlidingComplete', 5);

      // Redux settings update immediately; useBlazePose reads settings.frameSkip
      await waitFor(() => {
        expect(store.getState().settings.frameSkip).toBe(5);
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle camera permission denial gracefully', async () => {
      // Mock permission denial
      (Camera.requestCameraPermission as jest.Mock).mockResolvedValueOnce('denied');

      const { getByTestId, queryByTestId } = renderWithProviders(<PoseDetectionScreen />);

      // Verify alert shown
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Camera Permission Required',
          expect.any(String),
          expect.any(Array),
          expect.anything()
        );
      });

      // Detection cannot be started; the permission prompt is shown instead
      expect(getByTestId('camera-permission-dialog')).toBeTruthy();
      expect(getByTestId('camera-permission-grant')).toBeTruthy();
      expect(queryByTestId('pose-start-detection')).toBeNull();
      expect(queryByTestId('pose-camera-view')).toBeNull();
    });

    it('should recover from pose detection failure', async () => {
      const { getByTestId, store } = renderWithProviders(<PoseDetectionScreen />);

      // Start detection
      const startButton = await waitFor(() => getByTestId('pose-start-detection'));
      await act(async () => {
        fireEvent.press(startButton);
      });
      await waitFor(() => {
        expect(store.getState().pose.isDetecting).toBe(true);
      });

      // The native detector reports a failure (e.g. model loading failed)
      const { onError } = (usePoseDetection as jest.Mock).mock.calls.at(-1)[0];
      await act(async () => {
        onError({ code: 1, message: 'Model loading failed' });
      });

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
      expect(store.getState().pose.isDetecting).toBe(false);

      // The user can try again
      await act(async () => {
        fireEvent.press(getByTestId('pose-start-detection'));
      });
      await waitFor(() => {
        expect(store.getState().pose.isDetecting).toBe(true);
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should maintain state during navigation', async () => {
      const store = createTestStore({
        exercise: {
          history: [
            {
              id: 'session-1',
              date: '2025-01-28',
              exerciseId: 'bicep-curl',
              exerciseName: 'Bicep Curl',
              reps: 30,
              duration: 600,
              formScore: 0.85,
            },
            {
              id: 'session-2',
              date: '2025-01-27',
              exerciseId: 'squat',
              exerciseName: 'Squat',
              reps: 20,
              duration: 480,
              formScore: 0.8,
            },
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
const mockLandmarks: PoseLandmark[] = Array(33)
  .fill(null)
  .map((_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: 0,
    visibility: 0.9,
    index: i,
    name: `landmark_${i}`,
  }));
