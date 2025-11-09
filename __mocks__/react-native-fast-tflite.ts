// Mock for react-native-fast-tflite (native dependency)
export const TFLiteModel = {
  load: jest.fn().mockResolvedValue({
    inputs: [{ shape: [1, 192, 192, 3] }],
    outputs: [{ shape: [1, 1, 17, 3] }],
    run: jest.fn().mockReturnValue(new Float32Array(51).fill(0.5)),
    dispose: jest.fn(),
  }),
};
