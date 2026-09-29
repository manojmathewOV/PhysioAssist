/**
 * Acknowledges guided records only after the existing encrypted store accepts
 * and reads back their exact payload. This is not a new database or a migration.
 * redux-persist swallows setItem rejection; its flush alone is not a save receipt.
 */
export interface HistoryStoragePort {
  getItem(key: string): Promise<string | null | undefined>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}
export interface HistoryWriteEvent {
  outcome: 'saved' | 'failed';
  records: { id: string; writeRevision: number }[];
}

function prepare(value: string) {
  const outer = JSON.parse(value) as Record<string, string>;
  if (!outer || typeof outer !== 'object' || Array.isArray(outer))
    throw new Error('Invalid history envelope');
  if (outer.history === undefined) return { value, records: [] };
  const history = JSON.parse(outer.history) as Record<string, unknown>[];
  if (!Array.isArray(history)) throw new Error('Invalid history list');
  const records: HistoryWriteEvent['records'] = [];
  const next = history.map((record) => {
    if (
      !record ||
      typeof record !== 'object' ||
      record.durability !== 'pending' ||
      record.recordConflict
    )
      return record;
    if (
      record.kind !== 'activity' ||
      record.completionBasis !== 'patient_report' ||
      record.measured !== false ||
      record.bestDegrees !== undefined ||
      typeof record.profileId !== 'string' ||
      !record.profileId ||
      typeof record.id !== 'string' ||
      !record.id ||
      !Number.isInteger(record.writeRevision) ||
      Number(record.writeRevision) < 1
    )
      throw new Error('Invalid pending activity record');
    records.push({ id: record.id, writeRevision: Number(record.writeRevision) });
    return { ...record, durability: 'saved' };
  });
  return { value: JSON.stringify({ ...outer, history: JSON.stringify(next) }), records };
}

export function createAcknowledgedHistoryStorage(base: HistoryStoragePort) {
  const listeners = new Set<(event: HistoryWriteEvent) => void>();
  let tail: Promise<unknown> | undefined;
  const notify = (event: HistoryWriteEvent) => {
    // A broken observer must not turn an actual successful write into a failure.
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {
        /* no payload logging */
      }
    }
  };
  return {
    subscribe(listener: (event: HistoryWriteEvent) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    storage: {
      getItem: (key: string) =>
        tail ? tail.then(() => base.getItem(key)) : base.getItem(key),
      removeItem: (key: string) => {
        const result = tail
          ? tail.then(() => base.removeItem(key))
          : base.removeItem(key);
        tail = result.catch(() => undefined);
        return result;
      },
      async setItem(key: string, raw: string): Promise<unknown> {
        const prepared = prepare(raw);
        const write = async () => {
          try {
            await base.setItem(key, prepared.value);
            if (prepared.records.length && (await base.getItem(key)) !== prepared.value)
              throw new Error('History save could not be verified');
            if (prepared.records.length)
              notify({ outcome: 'saved', records: prepared.records });
          } catch (error) {
            if (prepared.records.length)
              notify({ outcome: 'failed', records: prepared.records });
            throw error;
          }
        };
        const result = (tail ?? Promise.resolve()).then(write, write);
        tail = result.catch(() => undefined);
        return result;
      },
    },
  };
}
