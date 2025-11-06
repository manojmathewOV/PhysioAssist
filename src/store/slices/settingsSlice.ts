import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  enableSound: boolean;
  enableHaptics: boolean;
  enableSpeech: boolean;
  speechRate: number;
  speechPitch: number;
  frameSkip: number;
  cameraPosition: 'front' | 'back';
  showAngleOverlay: boolean;
  showFormFeedback: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

const initialState: SettingsState = {
  enableSound: true,
  enableHaptics: true,
  enableSpeech: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  frameSkip: 3,
  cameraPosition: 'front',
  showAngleOverlay: true,
  showFormFeedback: true,
  theme: 'auto',
  language: 'en',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleSound: (state) => {
      state.enableSound = !state.enableSound;
    },
    toggleHaptics: (state) => {
      state.enableHaptics = !state.enableHaptics;
    },
    toggleSpeech: (state) => {
      state.enableSpeech = !state.enableSpeech;
    },
    setSpeechRate: (state, action: PayloadAction<number>) => {
      state.speechRate = action.payload;
    },
    setSpeechPitch: (state, action: PayloadAction<number>) => {
      state.speechPitch = action.payload;
    },
    setFrameSkip: (state, action: PayloadAction<number>) => {
      state.frameSkip = action.payload;
    },
    setCameraPosition: (state, action: PayloadAction<'front' | 'back'>) => {
      state.cameraPosition = action.payload;
    },
    toggleAngleOverlay: (state) => {
      state.showAngleOverlay = !state.showAngleOverlay;
    },
    toggleFormFeedback: (state) => {
      state.showFormFeedback = !state.showFormFeedback;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      Object.assign(state, action.payload);
    },
    resetSettings: () => initialState,
  },
});

export const {
  toggleSound,
  toggleHaptics,
  toggleSpeech,
  setSpeechRate,
  setSpeechPitch,
  setFrameSkip,
  setCameraPosition,
  toggleAngleOverlay,
  toggleFormFeedback,
  setTheme,
  setLanguage,
  updateSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
