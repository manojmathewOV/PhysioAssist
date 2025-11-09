/**
 * Smoke tests for TensorFlow.js
 * Validates that TensorFlow.js can be imported and initialized
 */

import * as tf from '@tensorflow/tfjs';

describe('TensorFlow.js Smoke Tests', () => {
  it('should import TensorFlow.js successfully', () => {
    expect(tf).toBeDefined();
    expect(tf.ready).toBeDefined();
    expect(tf.tensor).toBeDefined();
  });

  it('should have core tensor operations', () => {
    expect(tf.tensor).toBeDefined();
    expect(tf.add).toBeDefined();
    expect(tf.mul).toBeDefined();
    expect(tf.matMul).toBeDefined();
  });

  it('should be able to create and dispose tensors', () => {
    const tensor = tf.tensor([1, 2, 3, 4]);
    expect(tensor).toBeDefined();
    expect(tensor.shape).toEqual([4]);

    const data = tensor.dataSync();
    expect(data).toEqual(new Float32Array([1, 2, 3, 4]));

    tensor.dispose();
  });

  it('should be able to perform basic math operations', () => {
    const a = tf.tensor1d([1, 2, 3]);
    const b = tf.tensor1d([4, 5, 6]);

    const sum = tf.add(a, b);
    expect(sum.shape).toEqual([3]);
    expect(sum.dataSync()).toEqual(new Float32Array([5, 7, 9]));

    a.dispose();
    b.dispose();
    sum.dispose();
  });

  it('should track memory correctly', () => {
    const initialMemory = tf.memory();
    expect(initialMemory).toBeDefined();
    expect(initialMemory.numTensors).toBeDefined();

    const tensors = [
      tf.tensor1d([1, 2, 3]),
      tf.tensor1d([4, 5, 6]),
      tf.tensor1d([7, 8, 9]),
    ];

    const afterCreation = tf.memory();
    expect(afterCreation.numTensors).toBeGreaterThanOrEqual(initialMemory.numTensors + 3);

    tensors.forEach((t) => t.dispose());

    const afterDisposal = tf.memory();
    expect(afterDisposal.numTensors).toBeLessThanOrEqual(afterCreation.numTensors);
  });
});
