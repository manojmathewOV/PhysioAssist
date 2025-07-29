/**
 * Accessibility identifiers for UI testing and screen readers
 * These constants ensure consistent test targeting across platforms
 */

export const AccessibilityIds = {
  // Navigation
  navigation: {
    mainTab: 'main-tab-navigator',
    homeTab: 'home-tab',
    exercisesTab: 'exercises-tab',
    profileTab: 'profile-tab',
    settingsTab: 'settings-tab',
  },

  // Onboarding screens
  onboarding: {
    welcomeScreen: 'onboarding-welcome',
    getStartedButton: 'onboarding-get-started',
    skipButton: 'onboarding-skip',
    nextButton: 'onboarding-next',
    privacyCheckbox: 'onboarding-privacy-checkbox',
    termsLink: 'onboarding-terms-link',
  },

  // Authentication
  auth: {
    loginScreen: 'auth-login-screen',
    emailInput: 'auth-email-input',
    passwordInput: 'auth-password-input',
    loginButton: 'auth-login-button',
    signupButton: 'auth-signup-button',
    forgotPasswordLink: 'auth-forgot-password',
    errorMessage: 'auth-error-message',
    loadingIndicator: 'auth-loading',
  },

  // Pose Detection
  poseDetection: {
    screen: 'pose-detection-screen',
    cameraView: 'pose-camera-view',
    startButton: 'pose-start-detection',
    stopButton: 'pose-stop-detection',
    confidenceIndicator: 'pose-confidence',
    poseOverlay: 'pose-overlay',
    permissionDialog: 'camera-permission-dialog',
    permissionGrantButton: 'camera-permission-grant',
    permissionDenyButton: 'camera-permission-deny',
  },

  // Exercise Controls
  exercise: {
    selector: 'exercise-selector',
    bicepCurlOption: 'exercise-bicep-curl',
    shoulderPressOption: 'exercise-shoulder-press',
    squatOption: 'exercise-squat',
    hamstringStretchOption: 'exercise-hamstring-stretch',
    repCounter: 'exercise-rep-counter',
    formQuality: 'exercise-form-quality',
    feedbackText: 'exercise-feedback',
    startExerciseButton: 'exercise-start',
    pauseExerciseButton: 'exercise-pause',
    endExerciseButton: 'exercise-end',
  },

  // Settings
  settings: {
    screen: 'settings-screen',
    soundToggle: 'settings-sound-toggle',
    hapticToggle: 'settings-haptic-toggle',
    speechRateSlider: 'settings-speech-rate',
    frameSkipSlider: 'settings-frame-skip',
    saveButton: 'settings-save',
    resetButton: 'settings-reset',
  },

  // Common UI Elements
  common: {
    loadingSpinner: 'loading-spinner',
    errorView: 'error-view',
    retryButton: 'retry-button',
    backButton: 'back-button',
    modalOverlay: 'modal-overlay',
    modalCloseButton: 'modal-close',
    toastMessage: 'toast-message',
  },

  // Accessibility specific
  a11y: {
    skipToContent: 'a11y-skip-to-content',
    screenReaderAnnouncement: 'a11y-announcement',
    focusTrap: 'a11y-focus-trap',
  },
};