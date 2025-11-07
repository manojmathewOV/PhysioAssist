// Mock for @mediapipe/pose

module.exports = {
  Pose: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
  })),
};
