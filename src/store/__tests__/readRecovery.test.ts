/** G02/I02: a rejected read must not replace existing history with defaults. */
const historyBytes = JSON.stringify({
  history: JSON.stringify([{ id: 'retained-session', date: '2026-09-20T10:00:00Z' }]),
  _persist: JSON.stringify({ version: -1, rehydrated: true }),
});

const settle = async () => {
  for (let i = 0; i < 12; i++) {
    await Promise.resolve();
    jest.advanceTimersByTime(10);
  }
};

function failingApp(failedKey = 'persist:exercise', saved = historyBytes) {
  const disk: Record<string, string> = {
    'persist:exercise': saved,
    'persist:root': JSON.stringify({
      user: JSON.stringify({ isAuthenticated: false }),
      settings: '{}',
      _persist: '{}',
    }),
  };
  const failures = new Set(failedKey ? [failedKey] : []);
  let recovery!: typeof import('../index').persistenceRecovery;
  let storage: { getItem: jest.Mock; setItem: jest.Mock };
  let app: typeof import('../appStore');
  jest.isolateModules(() => {
    storage = require('react-native-encrypted-storage');
    storage.getItem.mockImplementation((key: string) =>
      failures.has(key)
        ? Promise.reject(new Error('test read unavailable'))
        : Promise.resolve(disk[key] ?? null)
    );
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      disk[key] = value;
    });
    app = require('../appStore');
    recovery = require('../index').persistenceRecovery;
  });
  return { disk, failures, recovery, storage: storage!, app: app! };
}

describe('persisted read recovery', () => {
  beforeEach(() =>
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] })
  );
  afterEach(() => jest.useRealTimers());

  it('preserves exact saved bytes after a rejected history read', async () => {
    const { disk, app, storage } = failingApp();
    await settle();
    await app.persistor.flush();
    expect(disk['persist:exercise']).toBe(historyBytes);
    expect(
      storage.setItem.mock.calls.filter(([key]) => key === 'persist:exercise')
    ).toHaveLength(0);
    expect(app.persistor.getState().bootstrapped).toBe(false);
    app.persistor.pause();
  });

  it('retries the failed read and restores saved history before enabling the app', async () => {
    const { disk, failures, recovery, app } = failingApp();
    await settle();
    expect(recovery.getSnapshot().status).toBe('blocked');
    await recovery.retry(); // Still failing: do not clear or initialise the record.
    expect(disk['persist:exercise']).toBe(historyBytes);
    expect(app.persistor.getState().bootstrapped).toBe(false);
    failures.clear();
    await recovery.retry();
    await settle();
    expect(recovery.getSnapshot().status).toBe('ready');
    expect(app.persistor.getState().bootstrapped).toBe(true);
    expect(app.store.getState().exercise.history.map((h) => h.id)).toEqual([
      'retained-session',
    ]);
    await app.persistor.flush();
    expect(JSON.parse(JSON.parse(disk['persist:exercise']).history)[0].id).toBe(
      'retained-session'
    );
    app.persistor.pause();
  });

  it('a root-profile read error also preserves that record and withholds bootstrap', async () => {
    const { disk, storage, recovery, app } = failingApp('persist:root');
    const original = disk['persist:root'];
    await settle();
    await app.persistor.flush();
    expect(disk['persist:root']).toBe(original);
    expect(
      storage.setItem.mock.calls.filter(([key]) => key === 'persist:root')
    ).toHaveLength(0);
    expect(recovery.getSnapshot().failedKeys).toEqual(['root']);
    expect(app.persistor.getState().bootstrapped).toBe(false);
    app.persistor.pause();
  });

  it('keeps invalid saved history unchanged rather than replacing it', async () => {
    const bytes = JSON.stringify({ history: JSON.stringify({ invalid: true }) });
    const { disk, app, recovery } = failingApp('', bytes);
    await settle();
    await app.persistor.flush();
    expect(disk['persist:exercise']).toBe(bytes);
    expect(recovery.getSnapshot().status).toBe('blocked');
    expect(app.persistor.getState().bootstrapped).toBe(false);
    app.persistor.pause();
  });

  it('allows a genuinely absent record to finish initialisation', async () => {
    let app!: typeof import('../appStore');
    jest.isolateModules(() => {
      const storage = require('react-native-encrypted-storage');
      storage.getItem.mockResolvedValue(null);
      app = require('../appStore');
    });
    await settle();
    expect(app.persistor.getState().bootstrapped).toBe(true);
    expect(app.store.getState().exercise.history).toEqual([]);
    app.persistor.pause();
  });
});
