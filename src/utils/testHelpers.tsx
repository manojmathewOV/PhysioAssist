import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Exercise } from '../types/exercise';
import { PoseLandmark } from '../types/pose';
import { NavigationContainer } from '@react-navigation/native';

// Import reducers
import poseReducer from '@store/slices/poseSlice';
import exerciseReducer from '@store/slices/exerciseSlice';
import userReducer from '@store/slices/userSlice';
import settingsReducer from '@store/slices/settingsSlice';
import networkReducer from '@store/slices/networkSlice';

const testRootReducer = combineReducers({
  pose: poseReducer,
  exercise: exerciseReducer,
  user: userReducer,
  settings: settingsReducer,
  network: networkReducer,
});

export type TestRootState = ReturnType<typeof testRootReducer>;

export function createTestStore(preloadedState?: Partial<TestRootState>) {
  return configureStore({
    reducer: testRootReducer,
    preloadedState,
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: {
    preloadedState?: Partial<TestRootState>;
    store?: ReturnType<typeof createTestStore>;
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
export const mockExercise: Exercise = {
  id: 'bicep_curl',
  name: 'Bicep Curl',
  description: 'Bicep curl',
  category: 'strength',
  targetMuscles: ['biceps'],
  equipment: [],
  difficulty: 'beginner',
  targetRepetitions: 10,
  targetSets: 1,
  restDuration: 0,
  phases: [
    {
      name: 'rest',
      description: 'rest',
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
      description: 'flexion',
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
      description: 'extension',
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
  warnings: [
    'Swinging the weights',
    'Moving elbows away from body',
    'Using momentum instead of muscle',
  ],
};

export const mockPoseLandmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
  x: 0.5,
  y: 0.5,
  z: 0,
  visibility: 0.9,
  index: i,
  name: `landmark_${i}`,
}));

// Specific landmarks for bicep curl
mockPoseLandmarks[11] = {
  x: 0.45,
  y: 0.3,
  z: 0,
  visibility: 0.9,
  index: 11,
  name: 'left_shoulder',
};
mockPoseLandmarks[12] = {
  x: 0.55,
  y: 0.3,
  z: 0,
  visibility: 0.9,
  index: 12,
  name: 'right_shoulder',
};
mockPoseLandmarks[13] = {
  x: 0.43,
  y: 0.4,
  z: 0,
  visibility: 0.9,
  index: 13,
  name: 'left_elbow',
};
mockPoseLandmarks[14] = {
  x: 0.57,
  y: 0.4,
  z: 0,
  visibility: 0.9,
  index: 14,
  name: 'right_elbow',
};
mockPoseLandmarks[15] = {
  x: 0.42,
  y: 0.5,
  z: 0,
  visibility: 0.9,
  index: 15,
  name: 'left_wrist',
};
mockPoseLandmarks[16] = {
  x: 0.58,
  y: 0.5,
  z: 0,
  visibility: 0.9,
  index: 16,
  name: 'right_wrist',
};
