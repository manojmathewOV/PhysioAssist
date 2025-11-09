/**
 * Type definitions for TensorFlow.js
 * Extends the official @tensorflow/tfjs types with React Native specific functionality
 */

declare module '@tensorflow/tfjs-react-native' {
  import * as tf from '@tensorflow/tfjs';

  export function ready(): Promise<void>;
  export function bundleResourceIO(modelJson: any, modelWeights: any): tf.io.IOHandler;
  export function asyncStorageIO(modelPath: string): tf.io.IOHandler;

  export * from '@tensorflow/tfjs';
}
