import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Import reducers
import poseReducer from '@store/slices/poseSlice';
import exerciseReducer from '@store/slices/exerciseSlice';
import userReducer from '@store/slices/userSlice';
import settingsReducer from '@store/slices/settingsSlice';
import networkReducer from '@store/slices/networkSlice';

export function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      pose: poseReducer,
      exercise: exerciseReducer,
      user: userReducer,
      settings: settingsReducer,
      network: networkReducer,
    },
    preloadedState,
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <NavigationContainer>{children}</NavigationContainer>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock exercise data for tests
export const mockExercise = {
  id: 'bicep_curl',
  name: 'Bicep Curl',
  category: 'strength',
  targetMuscles: ['biceps'],
  difficulty: 'beginner',
  targetRepetitions: 10,
  phases: [
    {
      name: 'rest',
      jointRequirements: [
        {
          joint: 'left_elbow',
          minAngle: 160,
          maxAngle: 180,
          targetAngle: 170,
        },
        {
          joint: 'right_elbow',
          minAngle: 160,
          maxAngle: 180,
          targetAngle: 170,
        },
      ],
      holdDuration: 0,
    },
    {
      name: 'flexion',
      jointRequirements: [
        {
          joint: 'left_elbow',
          minAngle: 30,
          maxAngle: 60,
          targetAngle: 45,
        },
        {
          joint: 'right_elbow',
          minAngle: 30,
          maxAngle: 60,
          targetAngle: 45,
        },
      ],
      holdDuration: 500,
    },
    {
      name: 'extension',
      jointRequirements: [
        {
          joint: 'left_elbow',
          minAngle: 140,
          maxAngle: 180,
          targetAngle: 170,
        },
        {
          joint: 'right_elbow',
          minAngle: 140,
          maxAngle: 180,
          targetAngle: 170,
        },
      ],
      holdDuration: 0,
    },
  ],
  instructions: [
    'Stand with feet shoulder-width apart',
    'Keep elbows close to your body',
    'Curl weights up slowly',
    'Lower weights with control',
  ],
  commonMistakes: [
    'Swinging the weights',
    'Moving elbows away from body',
    'Using momentum instead of muscle',
  ],
};

export const mockPoseLandmarks = Array(33).fill(null).map((_, i) => ({
  x: 0.5,
  y: 0.5,
  z: 0,
  visibility: 0.9,
  name: `landmark_${i}`,
}));

// Specific landmarks for bicep curl
mockPoseLandmarks[11] = { x: 0.45, y: 0.3, z: 0, visibility: 0.9, name: 'left_shoulder' };
mockPoseLandmarks[12] = { x: 0.55, y: 0.3, z: 0, visibility: 0.9, name: 'right_shoulder' };
mockPoseLandmarks[13] = { x: 0.43, y: 0.4, z: 0, visibility: 0.9, name: 'left_elbow' };
mockPoseLandmarks[14] = { x: 0.57, y: 0.4, z: 0, visibility: 0.9, name: 'right_elbow' };
mockPoseLandmarks[15] = { x: 0.42, y: 0.5, z: 0, visibility: 0.9, name: 'left_wrist' };
mockPoseLandmarks[16] = { x: 0.58, y: 0.5, z: 0, visibility: 0.9, name: 'right_wrist' };