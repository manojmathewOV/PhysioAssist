// Mock for @tensorflow/tfjs

// Track tensors for memory management
let tensorCount = 0;
const activeTensors = new Set();

const createMockTensor = (values, shape) => {
  const tensor = {
    id: tensorCount++,
    dataSync: jest.fn(() => new Float32Array(values)),
    data: jest.fn(() => Promise.resolve(new Float32Array(values))),
    dispose: jest.fn(() => {
      activeTensors.delete(tensor);
    }),
    shape: shape || [values.length],
    dtype: 'float32',
  };
  activeTensors.add(tensor);
  return tensor;
};

module.exports = {
  ready: jest.fn(() => Promise.resolve()),
  tensor: jest.fn((values) =>
    createMockTensor(values, values.length ? [values.length] : [])
  ),
  tensor1d: jest.fn((values) => createMockTensor(values, [values.length])),
  tensor2d: jest.fn((values) =>
    createMockTensor(values.flat(), [values.length, values[0]?.length || 0])
  ),
  dispose: jest.fn((tensor) => {
    if (tensor && typeof tensor.dispose === 'function') {
      tensor.dispose();
    }
  }),
  add: jest.fn((a, b) => {
    const aData = a.dataSync();
    const bData = b.dataSync();
    const result = aData.map((val, i) => val + bData[i]);
    return createMockTensor(result, a.shape);
  }),
  mul: jest.fn((a, b) => {
    const aData = a.dataSync();
    const bData = b.dataSync();
    const result = aData.map((val, i) => val * bData[i]);
    return createMockTensor(result, a.shape);
  }),
  matMul: jest.fn((a, _b) => createMockTensor([1, 2, 3, 4], a.shape)),
  memory: jest.fn(() => ({
    numTensors: activeTensors.size,
    numDataBuffers: activeTensors.size,
    numBytes: activeTensors.size * 16, // Assuming 4 floats per tensor
    unreliable: false,
  })),
  loadGraphModel: jest.fn(),
  image: {
    resizeBilinear: jest.fn(),
  },
};
