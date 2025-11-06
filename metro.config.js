const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Add .tflite as recognized asset extension for TensorFlow Lite models
    assetExts: ['tflite', 'txt', 'jpg', 'png', 'ttf', 'otf', 'mp4'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);