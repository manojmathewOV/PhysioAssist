import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock SettingsManager before any other mocks to prevent native module errors
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(),
  set: jest.fn(),
  watchKeys: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    requestCameraPermission: jest.fn(() => Promise.resolve('granted')),
    getCameraDevice: jest.fn(),
  },
  useCameraDevices: jest.fn(() => [
    { id: 'back', position: 'back' },
    { id: 'front', position: 'front' },
  ]),
  useCameraDevice: jest.fn((position: string) => ({ id: position, position })),
  useFrameProcessor: jest.fn(),
}));

// Mock react-native-worklets-core (VisionCamera frame processor runtime)
jest.mock('react-native-worklets-core', () => ({
  Worklets: {
    createRunOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    createRunOnJSFunction: (fn: (...args: unknown[]) => unknown) => fn,
  },
  useSharedValue: (value: unknown) => ({ value }),
}));

// Mock react-native-mediapipe (native BlazePose detector + frame processor plugin)
jest.mock('react-native-mediapipe', () => ({
  usePoseDetection: jest.fn(() => ({
    frameProcessor: jest.fn(),
    cameraViewLayoutChangeHandler: jest.fn(),
    cameraDeviceChangeHandler: jest.fn(),
    cameraOrientationChangedHandler: jest.fn(),
    resizeModeChangeHandler: jest.fn(),
    cameraViewDimensions: { width: 1, height: 1 },
  })),
  RunningMode: { IMAGE: 0, VIDEO: 1, LIVE_STREAM: 2 },
  Delegate: { CPU: 0, GPU: 1 },
}));

// Mock TensorFlow.js - using __mocks__/@tensorflow/tfjs.js
// Mock MediaPipe - using __mocks__/@mediapipe/pose.js
// Mock TensorFlow.js React Native is in __mocks__ directory

// Mock MediaPipe camera utils
jest.mock('@mediapipe/camera_utils', () => ({
  Camera: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock React Native TTS
jest.mock('react-native-tts', () => ({
  __esModule: true,
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

// Mock ImageData for Node environment (needed for video frame processing tests)
if (typeof ImageData === 'undefined') {
  (global as any).ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(
      dataOrWidth: Uint8ClampedArray | number,
      widthOrHeight: number,
      height?: number
    ) {
      if (dataOrWidth instanceof Uint8ClampedArray) {
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = height!;
      } else {
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4);
      }
    }
  };
}

// Cleanup handlers to prevent worker process failures
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});

// Allow async cleanup before exit
afterAll((done) => {
  setTimeout(done, 100);
});
