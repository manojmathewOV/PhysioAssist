/**
 * Mock for react-native-encrypted-storage
 * Used in tests to avoid native module dependency
 */

const storage = {};

const EncryptedStorage = {
  setItem: jest.fn((key, value) => {
    storage[key] = value;
    return Promise.resolve();
  }),

  getItem: jest.fn((key) => {
    return Promise.resolve(storage[key] || null);
  }),

  removeItem: jest.fn((key) => {
    delete storage[key];
    return Promise.resolve();
  }),

  clear: jest.fn(() => {
    Object.keys(storage).forEach((key) => delete storage[key]);
    return Promise.resolve();
  }),

  // Helper to reset mock between tests
  __reset: () => {
    Object.keys(storage).forEach((key) => delete storage[key]);
    EncryptedStorage.setItem.mockClear();
    EncryptedStorage.getItem.mockClear();
    EncryptedStorage.removeItem.mockClear();
    EncryptedStorage.clear.mockClear();
  },
};

module.exports = EncryptedStorage;
