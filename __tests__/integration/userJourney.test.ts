/**
 * User Journey Integration Tests
 * Tests complete flows from first-run through authentication to main app
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';

import userReducer, {
  completeOnboarding,
  loginSuccess,
  logout,
} from '../../src/store/slices/userSlice';
import settingsReducer from '../../src/store/slices/settingsSlice';
import poseReducer from '../../src/store/slices/poseSlice';
import exerciseReducer from '../../src/store/slices/exerciseSlice';
import networkReducer from '../../src/store/slices/networkSlice';

describe('User Journey Integration Tests', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userReducer,
        settings: settingsReducer,
        pose: poseReducer,
        exercise: exerciseReducer,
        network: networkReducer,
      },
    });
  });

  describe('First-Time User Flow', () => {
    it('should start with onboarding incomplete and not authenticated', () => {
      const state = store.getState();

      expect(state.user.hasCompletedOnboarding).toBe(false);
      expect(state.user.isAuthenticated).toBe(false);
      expect(state.user.currentUser).toBeNull();
    });

    it('should complete onboarding and move to login', () => {
      // Initial state: onboarding not complete
      let state = store.getState();
      expect(state.user.hasCompletedOnboarding).toBe(false);

      // User completes onboarding
      store.dispatch(completeOnboarding());

      // Verify onboarding is complete
      state = store.getState();
      expect(state.user.hasCompletedOnboarding).toBe(true);
      expect(state.user.isAuthenticated).toBe(false); // Still not logged in
    });

    it('should login after onboarding and become authenticated', () => {
      // Complete onboarding first
      store.dispatch(completeOnboarding());

      // User logs in
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        name: 'New User',
        profile: {
          fitnessLevel: 'beginner' as const,
          goals: [],
          injuries: [],
        },
      };

      store.dispatch(loginSuccess(mockUser));

      // Verify authentication
      const state = store.getState();
      expect(state.user.isAuthenticated).toBe(true);
      expect(state.user.currentUser).toEqual(mockUser);
      expect(state.user.hasCompletedOnboarding).toBe(true);
    });
  });

  describe('Returning User Flow', () => {
    beforeEach(() => {
      // Simulate returning user: onboarding complete, but logged out
      store.dispatch(completeOnboarding());
    });

    it('should skip onboarding for returning users', () => {
      const state = store.getState();

      expect(state.user.hasCompletedOnboarding).toBe(true);
      expect(state.user.isAuthenticated).toBe(false);
    });

    it('should login directly without onboarding', () => {
      const mockUser = {
        id: 'returning-user-456',
        email: 'returning@example.com',
        name: 'Returning User',
        profile: {
          fitnessLevel: 'intermediate' as const,
          goals: ['strength', 'flexibility'],
          injuries: [],
        },
      };

      store.dispatch(loginSuccess(mockUser));

      const state = store.getState();
      expect(state.user.isAuthenticated).toBe(true);
      expect(state.user.currentUser).toEqual(mockUser);
      expect(state.user.hasCompletedOnboarding).toBe(true);
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Set up authenticated user
      store.dispatch(completeOnboarding());
      store.dispatch(
        loginSuccess({
          id: 'user-789',
          email: 'test@example.com',
          name: 'Test User',
          profile: {
            fitnessLevel: 'advanced' as const,
            goals: [],
            injuries: [],
          },
        })
      );
    });

    it('should clear user data on logout', () => {
      // Verify user is logged in
      let state = store.getState();
      expect(state.user.isAuthenticated).toBe(true);
      expect(state.user.currentUser).not.toBeNull();

      // User logs out
      store.dispatch(logout());

      // Verify user is logged out
      state = store.getState();
      expect(state.user.isAuthenticated).toBe(false);
      expect(state.user.currentUser).toBeNull();
    });

    it('should preserve onboarding completion after logout', () => {
      // User logs out
      store.dispatch(logout());

      // Verify onboarding is still complete
      const state = store.getState();
      expect(state.user.hasCompletedOnboarding).toBe(true);
      expect(state.user.isAuthenticated).toBe(false);
    });

    it('should allow re-login after logout', () => {
      // Logout
      store.dispatch(logout());

      // Re-login with different user
      const newMockUser = {
        id: 'new-session-999',
        email: 'newsession@example.com',
        name: 'New Session',
        profile: {
          fitnessLevel: 'beginner' as const,
          goals: [],
          injuries: [],
        },
      };

      store.dispatch(loginSuccess(newMockUser));

      // Verify new user is logged in
      const state = store.getState();
      expect(state.user.isAuthenticated).toBe(true);
      expect(state.user.currentUser).toEqual(newMockUser);
    });
  });

  describe('Security: State Validation', () => {
    it('should not allow main app access without authentication', () => {
      store.dispatch(completeOnboarding());

      const state = store.getState();
      expect(state.user.hasCompletedOnboarding).toBe(true);
      expect(state.user.isAuthenticated).toBe(false);

      // Navigator should show login, not main app
      // (This would be verified in RootNavigator tests)
    });

    it('should require both onboarding AND authentication for main app', () => {
      const state = store.getState();

      // Neither complete
      expect(state.user.hasCompletedOnboarding).toBe(false);
      expect(state.user.isAuthenticated).toBe(false);

      // Should show onboarding (verified in RootNavigator tests)
    });
  });

  describe('Error Handling', () => {
    it('should handle login errors gracefully', () => {
      const { loginFailure } = require('../../src/store/slices/userSlice');

      store.dispatch(loginFailure('Invalid credentials'));

      const state = store.getState();
      expect(state.user.isAuthenticated).toBe(false);
      expect(state.user.currentUser).toBeNull();
      expect(state.user.error).toBe('Invalid credentials');
    });

    it('should clear errors on successful login', () => {
      const { loginFailure } = require('../../src/store/slices/userSlice');

      // First, set an error
      store.dispatch(loginFailure('Network error'));
      let state = store.getState();
      expect(state.user.error).toBe('Network error');

      // Then login successfully
      store.dispatch(
        loginSuccess({
          id: 'recovery-user',
          email: 'recovery@example.com',
          name: 'Recovery User',
          profile: {},
        })
      );

      // Error should be cleared
      state = store.getState();
      expect(state.user.error).toBeNull();
      expect(state.user.isAuthenticated).toBe(true);
    });
  });
});
