import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    requestCameraPermission: jest.fn(() => Promise.resolve('authorized')),
    getCameraDevice: jest.fn(),
  },
  useCameraDevices: jest.fn(() => ({
    back: { id: 'back', position: 'back' },
    front: { id: 'front', position: 'front' },
  })),
  useFrameProcessor: jest.fn(),
}));

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn(() => Promise.resolve()),
  tensor: jest.fn(),
  dispose: jest.fn(),
}));

// Mock TensorFlow.js React Native is in __mocks__ directory

// Mock MediaPipe
jest.mock('@mediapipe/pose', () => ({
  Pose: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock React Native TTS
jest.mock('react-native-tts', () => ({
  default: {
    speak: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    setDefaultRate: jest.fn(() => Promise.resolve()),
    setDefaultPitch: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock React Native Sound
jest.mock('react-native-sound', () => {
  class Sound {
    constructor() {}
    play = jest.fn((callback) => callback && callback(true));
    stop = jest.fn((callback) => callback && callback());
    release = jest.fn();
    setVolume = jest.fn();
    static setCategory = jest.fn();
    static MAIN_BUNDLE = 'MAIN_BUNDLE';
  }
  return Sound;
});

// Mock Haptic Feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useIsFocused: () => true,
  };
});

// Global test utilities
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  setTimeout(callback, 0);
  return 0;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};