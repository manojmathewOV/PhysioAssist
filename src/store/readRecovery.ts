import { getStoredState, PersistConfig, PersistedState } from 'redux-persist';

export type ReadStatus = 'loading' | 'blocked' | 'ready';
export type ReadSnapshot = { status: ReadStatus; failedKeys: readonly string[] };

/**
 * A failed read must stay pending: redux-persist otherwise saves defaults over it.
 * Retry resolves the original read, without a purge, reset or background loop.
 * No native operation or timer starts on import. Raw patient data is never logged.
 */
export function createReadRecovery(expectedKeys: readonly string[]) {
  const remaining = new Set(expectedKeys);
  const pending = new Map<string, Promise<PersistedState>>();
  const attempts = new Map<
    string,
    { failed: boolean; running: boolean; run: () => Promise<void> }
  >();
  const listeners = new Set<() => void>();
  let snapshot: ReadSnapshot = { status: 'loading', failedKeys: [] };
  const publish = () => {
    const failedKeys = [...attempts]
      .filter(([, a]) => a.failed)
      .map(([key]) => key)
      .sort();
    const status: ReadStatus = failedKeys.length
      ? 'blocked'
      : remaining.size
        ? 'loading'
        : 'ready';
    snapshot = { status, failedKeys };
    listeners.forEach((listener) => listener());
  };

  const read = <S>(config: PersistConfig<S>): Promise<PersistedState> => {
    const existing = pending.get(config.key);
    if (existing) return existing;
    remaining.add(config.key);
    const promise = new Promise<PersistedState>((resolve) => {
      const attempt = {
        failed: false,
        running: false,
        run: async (): Promise<void> => {},
      };
      attempt.run = async () => {
        if (attempt.running) return;
        attempt.running = true;
        attempt.failed = false;
        publish();
        try {
          const state = await getStoredState({
            ...config,
            storage: {
              ...config.storage,
              getItem: async (key: string) => {
                const raw: unknown = await config.storage.getItem(key);
                if (raw === null || raw === undefined) return null;
                if (typeof raw !== 'string' || !raw.trim())
                  throw new Error('Invalid saved state');
                const outer: unknown = JSON.parse(raw);
                if (!outer || typeof outer !== 'object' || Array.isArray(outer)) {
                  throw new Error('Invalid saved state');
                }
                return raw;
              },
            },
          });
          validateShape(config.key, state);
          remaining.delete(config.key);
          attempts.delete(config.key);
          pending.delete(config.key);
          // Decoder typings are broader than the persistence hook contract.
          resolve(state as PersistedState);
        } catch {
          // Failure/corruption does not establish that the saved record is absent.
          attempt.failed = true;
        } finally {
          attempt.running = false;
          publish();
        }
      };
      attempts.set(config.key, attempt);
      void attempt.run();
    });
    pending.set(config.key, promise);
    return promise;
  };

  return {
    read,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    retry: async () => {
      await Promise.all(
        [...attempts.values()].filter((a) => a.failed).map((a) => a.run())
      );
    },
  };
}

function validateShape(key: string, value: object | undefined): void {
  if (value === undefined) return; // Only a successful absent read takes this path.
  const state = value as unknown as Record<string, unknown>;
  if (key === 'exercise' && !Array.isArray(state.history))
    throw new Error('Invalid history');
  for (const field of key === 'root' ? ['user', 'settings'] : []) {
    if (
      field in state &&
      (!state[field] || typeof state[field] !== 'object' || Array.isArray(state[field]))
    ) {
      throw new Error('Invalid profile state');
    }
  }
}
