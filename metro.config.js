const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Bound both transform/file-map worker pools on shared development Macs and CI.
  maxWorkers: 2,
  resolver: {
    // Keep this project independent of an unrelated machine-wide Watchman watch.
    useWatchman: false,
    // Add .tflite as recognized asset extension for TensorFlow Lite models
    assetExts: ['tflite', 'txt', 'jpg', 'png', 'ttf', 'otf', 'mp4'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
