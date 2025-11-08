/**
 * User Authentication State Tests
 * Validates Redux authentication state transitions
 */

import userReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  completeOnboarding,
  updateProfile,
  clearError,
} from '../../src/store/slices/userSlice';

describe('userSlice - Authentication State Management', () => {
  const initialState = {
    currentUser: null,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    isLoading: false,
    error: null,
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = userReducer(undefined, { type: 'unknown' });

      expect(state).toEqual({
        currentUser: null,
        isAuthenticated: false,
        hasCompletedOnboarding: false,
        isLoading: false,
        error: null,
      });
    });

    it('should default isAuthenticated to false', () => {
      const state = userReducer(undefined, { type: 'unknown' });
      expect(state.isAuthenticated).toBe(false);
    });

    it('should default hasCompletedOnboarding to false', () => {
      const state = userReducer(undefined, { type: 'unknown' });
      expect(state.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('Login Flow', () => {
    it('should set loading state on loginStart', () => {
      const state = userReducer(initialState, loginStart());

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should set authenticated state on loginSuccess', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        profile: {},
      };

      const state = userReducer(
        { ...initialState, isLoading: true },
        loginSuccess(mockUser)
      );

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it('should clear state on loginFailure', () => {
      const errorMessage = 'Invalid credentials';

      const state = userReducer(
        { ...initialState, isLoading: true },
        loginFailure(errorMessage)
      );

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('Logout Flow', () => {
    it('should clear all user data on logout', () => {
      const authenticatedState = {
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
      };

      const state = userReducer(authenticatedState, logout());

      expect(state.currentUser).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should NOT reset hasCompletedOnboarding on logout', () => {
      const authenticatedState = {
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
      };

      const state = userReducer(authenticatedState, logout());

      // Onboarding status persists across logins
      expect(state.hasCompletedOnboarding).toBe(true);
    });
  });

  describe('Onboarding Flow', () => {
    it('should set hasCompletedOnboarding to true on completeOnboarding', () => {
      const state = userReducer(initialState, completeOnboarding());

      expect(state.hasCompletedOnboarding).toBe(true);
    });

    it('should persist onboarding status after logout', () => {
      let state = userReducer(initialState, completeOnboarding());
      expect(state.hasCompletedOnboarding).toBe(true);

      state = userReducer(
        {
          ...state,
          currentUser: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
            profile: {},
          },
          isAuthenticated: true,
        },
        logout()
      );

      expect(state.hasCompletedOnboarding).toBe(true); // Persists
      expect(state.isAuthenticated).toBe(false); // Cleared
    });
  });

  describe('Profile Updates', () => {
    it('should update user profile when authenticated', () => {
      const authenticatedState = {
        currentUser: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          profile: {
            age: 25,
            fitnessLevel: 'beginner' as const,
          },
        },
        isAuthenticated: true,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      };

      const profileUpdate = {
        age: 26,
        fitnessLevel: 'intermediate' as const,
        goals: ['strength', 'flexibility'],
      };

      const state = userReducer(authenticatedState, updateProfile(profileUpdate));

      expect(state.currentUser?.profile).toEqual({
        age: 26,
        fitnessLevel: 'intermediate',
        goals: ['strength', 'flexibility'],
      });
    });

    it('should NOT update profile when not authenticated', () => {
      const state = userReducer(
        initialState,
        updateProfile({
          age: 30,
          fitnessLevel: 'advanced' as const,
        })
      );

      expect(state.currentUser).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error state on clearError', () => {
      const errorState = {
        ...initialState,
        error: 'Some error occurred',
      };

      const state = userReducer(errorState, clearError());

      expect(state.error).toBeNull();
    });

    it('should clear previous error on loginStart', () => {
      const errorState = {
        ...initialState,
        error: 'Previous login failed',
      };

      const state = userReducer(errorState, loginStart());

      expect(state.error).toBeNull();
    });

    it('should clear error on loginSuccess', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        profile: {},
      };

      const errorState = {
        ...initialState,
        error: 'Previous error',
        isLoading: true,
      };

      const state = userReducer(errorState, loginSuccess(mockUser));

      expect(state.error).toBeNull();
    });
  });

  describe('HIPAA Compliance - Secure State Transitions', () => {
    it('should never expose credentials in state', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        profile: {},
      };

      const state = userReducer(initialState, loginSuccess(mockUser));

      // Should NOT have password or other credentials
      expect(state.currentUser).not.toHaveProperty('password');
      expect(state.currentUser).not.toHaveProperty('token');
    });

    it('should clear sensitive data on logout', () => {
      const authenticatedState = {
        currentUser: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          profile: {
            age: 30,
            injuries: ['knee injury'],
            goals: ['recovery'],
          },
        },
        isAuthenticated: true,
        hasCompletedOnboarding: true,
        isLoading: false,
        error: null,
      };

      const state = userReducer(authenticatedState, logout());

      expect(state.currentUser).toBeNull(); // All user data cleared
      expect(state.isAuthenticated).toBe(false);
    });

    it('should maintain hasCompletedOnboarding for UX (not sensitive)', () => {
      const authenticatedState = {
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
      };

      const state = userReducer(authenticatedState, logout());

      // Onboarding status is NOT sensitive, kept for UX
      expect(state.hasCompletedOnboarding).toBe(true);
    });
  });

  describe('State Consistency', () => {
    it('should never be authenticated without a currentUser', () => {
      const states = [
        userReducer(initialState, loginStart()),
        userReducer(initialState, loginFailure('Error')),
        userReducer(initialState, logout()),
        userReducer(initialState, completeOnboarding()),
      ];

      states.forEach((state) => {
        if (state.isAuthenticated) {
          expect(state.currentUser).not.toBeNull();
        }
      });
    });

    it('should clear loading state after login success', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        profile: {},
      };

      const loadingState = userReducer(initialState, loginStart());
      expect(loadingState.isLoading).toBe(true);

      const successState = userReducer(loadingState, loginSuccess(mockUser));
      expect(successState.isLoading).toBe(false);
    });

    it('should clear loading state after login failure', () => {
      const loadingState = userReducer(initialState, loginStart());
      expect(loadingState.isLoading).toBe(true);

      const failureState = userReducer(loadingState, loginFailure('Error'));
      expect(failureState.isLoading).toBe(false);
    });
  });
});
