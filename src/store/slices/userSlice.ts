import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserProfile {
  age?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  injuries?: string[];
  goals?: string[];
  height?: number;
  weight?: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  profile: UserProfile;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.currentUser = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.currentUser = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    completeOnboarding: (state) => {
      state.hasCompletedOnboarding = true;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.currentUser) {
        state.currentUser.profile = {
          ...state.currentUser.profile,
          ...action.payload,
        };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  completeOnboarding,
  updateProfile,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;
