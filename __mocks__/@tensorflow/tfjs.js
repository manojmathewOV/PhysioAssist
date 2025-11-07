// Mock for @tensorflow/tfjs

module.exports = {
  ready: jest.fn(() => Promise.resolve()),
  tensor: jest.fn(),
  dispose: jest.fn(),
  loadGraphModel: jest.fn(),
  image: {
    resizeBilinear: jest.fn(),
  },
};
