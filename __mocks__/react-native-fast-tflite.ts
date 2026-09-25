// Mock for react-native-fast-tflite (native dependency), matching its real API:
// loadTensorflowModel(source, delegate) -> TensorflowModel with run/runSync.
const createModel = () => ({
  delegate: 'default',
  inputs: [{ name: 'input', dataType: 'uint8', shape: [1, 192, 192, 3] }],
  outputs: [{ name: 'output', dataType: 'float32', shape: [1, 1, 17, 3] }],
  run: jest.fn().mockResolvedValue([new Float32Array(51).fill(0.5)]),
  runSync: jest.fn().mockReturnValue([new Float32Array(51).fill(0.5)]),
});

export const loadTensorflowModel = jest
  .fn()
  .mockImplementation(() => Promise.resolve(createModel()));

export const useTensorflowModel = jest.fn(() => ({
  state: 'loaded',
  model: createModel(),
}));
