// Mock for react-native Settings module
const settings = {};

const Settings = {
  get: jest.fn((key) => settings[key]),
  set: jest.fn((values) => {
    Object.assign(settings, values);
  }),
  watchKeys: jest.fn((keys, callback) => {
    // Return a subscription object
    return {
      remove: jest.fn(),
    };
  }),
};

module.exports = Settings;
