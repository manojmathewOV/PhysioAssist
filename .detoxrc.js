/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/PhysioAssist.app',
      build: 'xcodebuild -workspace ios/PhysioAssist.xcworkspace -scheme PhysioAssist -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/PhysioAssist.app',
      build: 'xcodebuild -workspace ios/PhysioAssist.xcworkspace -scheme PhysioAssist -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    'simulator-iphone-14': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
      },
    },
    'simulator-ipad': {
      type: 'ios.simulator',
      device: {
        type: 'iPad Pro (12.9-inch) (6th generation)',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.iphone14.debug': {
      device: 'simulator-iphone-14',
      app: 'ios.debug',
    },
    'ios.ipad.debug': {
      device: 'simulator-ipad',
      app: 'ios.debug',
    },
  },
};
