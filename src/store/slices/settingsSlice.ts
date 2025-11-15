import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  // Audio Settings
  enableSound: boolean;
  enableHaptics: boolean;
  enableSpeech: boolean;
  voiceInstructionsEnabled: boolean;
  soundEffectsEnabled: boolean;
  speechRate: number;
  speechPitch: number;

  // Visual Settings
  showAngleOverlay: boolean;
  showFormFeedback: boolean;
  showJointAngles: boolean;
  showPoseOverlay: boolean;

  // Performance Settings
  frameSkip: number;
  highPerformanceMode: boolean;

  // Accessibility Settings
  reducedMotion: boolean;
  highContrast: boolean;

  // General Settings
  cameraPosition: 'front' | 'back';
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

const initialState: SettingsState = {
  // Audio Settings
  enableSound: true,
  enableHaptics: true,
  enableSpeech: true,
  voiceInstructionsEnabled: true,
  soundEffectsEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,

  // Visual Settings
  showAngleOverlay: true,
  showFormFeedback: true,
  showJointAngles: true,
  showPoseOverlay: true,

  // Performance Settings
  frameSkip: 3,
  highPerformanceMode: false,

  // Accessibility Settings
  reducedMotion: false,
  highContrast: false,

  // General Settings
  cameraPosition: 'front',
  theme: 'auto',
  language: 'en',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Audio toggles
    toggleSound: (state) => {
      state.enableSound = !state.enableSound;
    },
    toggleHaptics: (state) => {
      state.enableHaptics = !state.enableHaptics;
    },
    toggleSpeech: (state) => {
      state.enableSpeech = !state.enableSpeech;
    },
    toggleVoiceInstructions: (state) => {
      state.voiceInstructionsEnabled = !state.voiceInstructionsEnabled;
    },
    toggleSoundEffects: (state) => {
      state.soundEffectsEnabled = !state.soundEffectsEnabled;
    },

    // Visual toggles
    toggleAngleOverlay: (state) => {
      state.showAngleOverlay = !state.showAngleOverlay;
    },
    toggleFormFeedback: (state) => {
      state.showFormFeedback = !state.showFormFeedback;
    },
    toggleJointAngles: (state) => {
      state.showJointAngles = !state.showJointAngles;
    },
    togglePoseOverlay: (state) => {
      state.showPoseOverlay = !state.showPoseOverlay;
    },

    // Performance toggles
    toggleHighPerformanceMode: (state) => {
      state.highPerformanceMode = !state.highPerformanceMode;
      // Adjust frameSkip based on performance mode
      state.frameSkip = state.highPerformanceMode ? 1 : 3;
    },

    // Accessibility toggles
    toggleReducedMotion: (state) => {
      state.reducedMotion = !state.reducedMotion;
    },
    toggleHighContrast: (state) => {
      state.highContrast = !state.highContrast;
    },

    // Setters
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
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },

    // Bulk update
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
  toggleVoiceInstructions,
  toggleSoundEffects,
  toggleAngleOverlay,
  toggleFormFeedback,
  toggleJointAngles,
  togglePoseOverlay,
  toggleHighPerformanceMode,
  toggleReducedMotion,
  toggleHighContrast,
  setSpeechRate,
  setSpeechPitch,
  setFrameSkip,
  setCameraPosition,
  setTheme,
  setLanguage,
  updateSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
