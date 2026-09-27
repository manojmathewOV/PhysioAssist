/**
 * The app store and slow encrypted storage: history already saved on the
 * phone must never be overwritten because reading it took a while.
 */
type StorageMock = {
  getItem: jest.Mock;
  setItem: jest.Mock;
};

const savedHistory = [
  { id: 'saved-1', exerciseId: 'arm-raise', date: '2026-09-20T10:00:00Z' },
];

/** A fresh app store whose storage reads wait until `reads[key]` is called. */
function appWithSlowStorage() {
  const reads: Record<string, (v: string | null) => void> = {};
  let storage!: StorageMock;
  let store!: typeof import('../appStore').store;
  jest.isolateModules(() => {
    storage = require('react-native-encrypted-storage');
    storage.getItem.mockImplementation(
      (key: string) => new Promise((resolve) => (reads[key] = resolve))
    );
    store = require('../appStore').store;
  });
  return { reads, storage, store };
}

describe('app store persistence', () => {
  afterEach(() => jest.useRealTimers());

  it('a slow storage read is waited for; nothing is written over saved history', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
    const { reads, storage, store } = appWithSlowStorage();
    expect(Object.keys(reads).sort()).toEqual(['persist:exercise', 'persist:root']);

    // Far longer than redux-persist's default 5 s give-up
    jest.advanceTimersByTime(60_000);
    await Promise.resolve();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(store.getState()._persist.rehydrated).toBe(false);

    // StorageMock answers: the saved history comes back, and only then is saving on
    reads['persist:root'](null);
    reads['persist:exercise'](
      JSON.stringify({ history: JSON.stringify(savedHistory), _persist: '{}' })
    );
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
      jest.advanceTimersByTime(10);
    }
    expect(store.getState()._persist.rehydrated).toBe(true);
    expect(store.getState().exercise.history.map((h) => h.id)).toEqual(['saved-1']);
    storage.setItem.mock.calls
      .filter(([key]) => key === 'persist:exercise')
      .forEach(([, value]) =>
        expect(JSON.parse(JSON.parse(value).history)).toHaveLength(1)
      );
  });

  it('importing the reducers does not start persistence (no pending timers)', () => {
    jest.isolateModules(() => {
      const storage: StorageMock = require('react-native-encrypted-storage');
      require('../index');
      expect(storage.getItem).not.toHaveBeenCalled();
    });
  });
});
