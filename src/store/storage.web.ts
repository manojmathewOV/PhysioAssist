/**
 * Persisted-state storage for the web build. react-native-encrypted-storage is
 * native-only (the store failed to load on web), so use the browser's
 * localStorage. Note: unlike the native apps this is not encrypted at rest, so
 * the web build is for demonstration rather than real patient data.
 */
const storage = {
  getItem: async (key: string): Promise<string | null> =>
    window.localStorage.getItem(key),
  setItem: async (key: string, value: string): Promise<void> =>
    window.localStorage.setItem(key, value),
  removeItem: async (key: string): Promise<void> => window.localStorage.removeItem(key),
};

export default storage;
