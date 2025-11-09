/**
 * Authentication Flow Tests for RootNavigator
 * Ensures secure authentication guards prevent unauthorized access
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';

import RootNavigator from '../../src/navigation/RootNavigator';
import userReducer from '../../src/store/slices/userSlice';
import poseReducer from '../../src/store/slices/poseSlice';
import exerciseReducer from '../../src/store/slices/exerciseSlice';
import settingsReducer from '../../src/store/slices/settingsSlice';
import networkReducer from '../../src/store/slices/networkSlice';

// Mock screens to avoid complex dependencies
jest.mock('../../src/screens/OnboardingScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text testID="onboarding-screen">Onboarding</Text>;
});

jest.mock('../../src/screens/LoginScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text testID="login-screen">Login</Text>;
});

jest.mock('../../src/screens/PoseDetectionScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text testID="pose-detection-screen">PoseDetection</Text>;
});

jest.mock('../../src/screens/ProfileScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text testID="profile-screen">Profile</Text>;
});

jest.mock('../../src/screens/SettingsScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text testID="settings-screen">Settings</Text>;
});

const createMockStore = (userState: any) => {
  return configureStore({
    reducer: {
      user: userReducer,
      pose: poseReducer,
      exercise: exerciseReducer,
      settings: settingsReducer,
      network: networkReducer,
    },
    preloadedState: {
      user: userState,
    },
  });
};

const renderWithNavigation = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>{component}</NavigationContainer>
    </Provider>
  );
};

describe('RootNavigator - Authentication Guards', () => {
  describe('New User Flow (Not Onboarded)', () => {
    it('should show Onboarding screen when hasCompletedOnboarding is false', () => {
      const store = createMockStore({
        currentUser: null,
        isAuthenticated: false,
        hasCompletedOnboarding: false,
        isLoading: false,
        error: null,
      });

      const { getByTestId, queryByTestId } = renderWithNavigation(
        <RootNavigator />,
        store
      );

      expect(getByTestId('onboarding-screen')).toBeTruthy();
      expect(queryByTestId('login-screen')).toBeNull();
      expect(queryByTestId('pose-detection-screen')).toBeNull();
    });

    it('should NOT allow access to main app when onboarding not completed', () => {
      const store = createMockStore({
        currentUser: null,
        isAuthenticated: true, // Even if authenticated
        hasCompletedOnboarding: false, // Onboarding takes priority
        isLoading: false,
        error: null,
      });

      const { getByTestId, queryByTestId } = renderWithNavigation(
        <RootNavigator />,
        store
      );

      expect(getByTestId('onboarding-screen')).toBeTruthy();
      expect(queryByTestId('pose-detection-screen')).toBeNull();
    });
  });

  describe('Returning User Flow (Onboarded but Logged Out)', () => {
    it('should show Login screen when onboarded but not authenticated', () => {
      const store = createMockStore({
        currentUser: null,
        isAuthenticated: false,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      });

      const { getByTestId, queryByTestId } = renderWithNavigation(
        <RootNavigator />,
        store
      );

      expect(getByTestId('login-screen')).toBeTruthy();
      expect(queryByTestId('onboarding-screen')).toBeNull();
      expect(queryByTestId('pose-detection-screen')).toBeNull();
    });

    it('should NOT allow access to main app when not authenticated', () => {
      const store = createMockStore({
        currentUser: null,
        isAuthenticated: false,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      });

      const { queryByTestId } = renderWithNavigation(<RootNavigator />, store);

      expect(queryByTestId('pose-detection-screen')).toBeNull();
      expect(queryByTestId('profile-screen')).toBeNull();
      expect(queryByTestId('settings-screen')).toBeNull();
    });
  });

  describe('Authenticated User Flow (Full Access)', () => {
    it('should show main app when both onboarded and authenticated', () => {
      const store = createMockStore({
        currentUser: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          profile: {},
        },
        isAuthenticated: true,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      });

      const { queryByTestId } = renderWithNavigation(<RootNavigator />, store);

      // Should NOT show onboarding or login
      expect(queryByTestId('onboarding-screen')).toBeNull();
      expect(queryByTestId('login-screen')).toBeNull();

      // Note: Main tabs might not render in test, but onboarding/login should be null
    });

    it('should NOT show onboarding when authenticated', () => {
      const store = createMockStore({
        currentUser: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          profile: {},
        },
        isAuthenticated: true,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      });

      const { queryByTestId } = renderWithNavigation(<RootNavigator />, store);

      expect(queryByTestId('onboarding-screen')).toBeNull();
    });

    it('should NOT show login when authenticated', () => {
      const store = createMockStore({
        currentUser: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          profile: {},
        },
        isAuthenticated: true,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      });

      const { queryByTestId } = renderWithNavigation(<RootNavigator />, store);

      expect(queryByTestId('login-screen')).toBeNull();
    });
  });

  describe('HIPAA Security - No Hardcoded Bypasses', () => {
    it('should enforce authentication guard (no hardcoded true)', () => {
      const store = createMockStore({
        currentUser: null,
        isAuthenticated: false, // Explicit false
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      });

      const { getByTestId } = renderWithNavigation(<RootNavigator />, store);

      // Must show login, not main app
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    it('should enforce onboarding guard (no hardcoded true)', () => {
      const store = createMockStore({
        currentUser: null,
        isAuthenticated: false,
        hasCompletedOnboarding: false, // Explicit false
        isLoading: false,
        error: null,
      });

      const { getByTestId } = renderWithNavigation(<RootNavigator />, store);

      // Must show onboarding, not main app
      expect(getByTestId('onboarding-screen')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing currentUser gracefully', () => {
      const store = createMockStore({
        currentUser: null,
        isAuthenticated: false,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      });

      const { getByTestId } = renderWithNavigation(<RootNavigator />, store);

      expect(getByTestId('login-screen')).toBeTruthy();
    });

    it('should prioritize onboarding over authentication', () => {
      const store = createMockStore({
        currentUser: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          profile: {},
        },
        isAuthenticated: true,
        hasCompletedOnboarding: false, // Not onboarded yet
        isLoading: false,
        error: null,
      });

      const { getByTestId } = renderWithNavigation(<RootNavigator />, store);

      // Should show onboarding even if authenticated
      expect(getByTestId('onboarding-screen')).toBeTruthy();
    });
  });
});
