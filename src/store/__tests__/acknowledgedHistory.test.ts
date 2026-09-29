import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import {
  createAcknowledgedHistoryStorage,
  HistoryWriteEvent,
} from '../acknowledgedHistory';
import reducer, {
  recordGuidedActivity,
  historyWriteResult,
  retryGuidedActivity,
  ExerciseHistory,
} from '../slices/exerciseSlice';
import { todaysRoutine } from '../../services/pose/routine';
import { measurementSeries } from '../../utils/measurementSeries';

const activity = (id = 'event-A'): ExerciseHistory => ({
  id,
  exerciseId: 'arm-raise',
  exerciseName: 'Arm raise',
  date: '2026-09-28T01:00:00.000Z',
  activityDay: '2026-09-28',
  reps: 0,
  duration: 10,
  formScore: 0,
  joint: 'left_shoulder',
  profileId: 'person-A',
  kind: 'activity',
  completionBasis: 'patient_report',
  measured: false,
  completion: 'completed',
  durability: 'pending',
  writeRevision: 1,
  occurrenceKey: 'arm-raise#1',
});
const envelope = (records: ExerciseHistory[]) =>
  JSON.stringify({
    history: JSON.stringify(records),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
const memory = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
};
describe('acknowledged existing storage', () => {
  it('does not acknowledge until exact stored bytes are read back', async () => {
    const base = memory();
    const gate = deferred();
    base.setItem.mockImplementationOnce(async (key, value) => {
      await gate.promise;
      base.values.set(key, value);
    });
    const writer = createAcknowledgedHistoryStorage(base);
    const events: HistoryWriteEvent[] = [];
    writer.subscribe((e) => events.push(e));
    const original = activity();
    const pending = writer.storage.setItem('persist:exercise', envelope([original]));
    await Promise.resolve();
    expect(events).toEqual([]);
    gate.resolve();
    await pending;
    expect(events).toEqual([
      { outcome: 'saved', records: [{ id: 'event-A', writeRevision: 1 }] },
    ]);
    expect(original.durability).toBe('pending');
    expect(
      JSON.parse(JSON.parse(base.values.get('persist:exercise')!).history)[0].durability
    ).toBe('saved');
  });
  it('write failure preserves old records and produces no successful receipt', async () => {
    const base = memory();
    base.values.set('persist:exercise', 'old bytes');
    base.setItem.mockRejectedValueOnce(new Error('full'));
    const writer = createAcknowledgedHistoryStorage(base);
    const event = jest.fn();
    writer.subscribe(event);
    await expect(
      writer.storage.setItem('persist:exercise', envelope([activity()]))
    ).rejects.toThrow('full');
    expect(base.values.get('persist:exercise')).toBe('old bytes');
    expect(event).toHaveBeenCalledWith({
      outcome: 'failed',
      records: [{ id: 'event-A', writeRevision: 1 }],
    });
  });
  it('a fulfilled write is not enough when readback disagrees', async () => {
    const base = memory();
    base.getItem.mockResolvedValueOnce('different');
    const writer = createAcknowledgedHistoryStorage(base);
    const event = jest.fn();
    writer.subscribe(event);
    await expect(
      writer.storage.setItem('persist:exercise', envelope([activity()]))
    ).rejects.toThrow('verified');
    expect(event.mock.calls.map((x) => x[0].outcome)).toEqual(['failed']);
  });
  it('queues writes and deletion so an older write cannot finish after removal', async () => {
    const base = memory();
    const gate = deferred();
    base.setItem.mockImplementationOnce(async (key, value) => {
      await gate.promise;
      base.values.set(key, value);
    });
    const writer = createAcknowledgedHistoryStorage(base);
    const first = writer.storage.setItem('persist:exercise', envelope([activity()]));
    const next = writer.storage.setItem(
      'persist:exercise',
      envelope([activity(), activity('event-B')])
    );
    const remove = writer.storage.removeItem('persist:exercise');
    await Promise.resolve();
    expect(base.setItem).toHaveBeenCalledTimes(1);
    expect(base.removeItem).not.toHaveBeenCalled();
    gate.resolve();
    await Promise.all([first, next, remove]);
    expect(base.values.size).toBe(0);
  });
  it('allows retry after failure without poisoning the queue', async () => {
    const base = memory();
    base.setItem.mockRejectedValueOnce(new Error('locked'));
    const writer = createAcknowledgedHistoryStorage(base);
    await expect(
      writer.storage.setItem('persist:exercise', envelope([activity()]))
    ).rejects.toThrow();
    await writer.storage.setItem(
      'persist:exercise',
      envelope([{ ...activity(), writeRevision: 2 }])
    );
    expect(
      JSON.parse(JSON.parse(base.values.get('persist:exercise')!).history)
    ).toHaveLength(1);
  });
  it('does not let a broken observer undo a persisted write', async () => {
    const base = memory();
    const writer = createAcknowledgedHistoryStorage(base);
    writer.subscribe(() => {
      throw new Error('observer');
    });
    await expect(
      writer.storage.setItem('persist:exercise', envelope([activity()]))
    ).resolves.toBeUndefined();
  });
});

describe('guided history semantics', () => {
  const plan = {
    joint: 'shoulder' as const,
    side: 'left' as const,
    routine: [{ exerciseId: 'arm-raise' }],
  };
  const now = new Date('2026-09-28T02:00:00Z').getTime();
  it('pending does not count, saved does count, neither enters the measurement series', () => {
    let state = reducer(undefined, recordGuidedActivity(activity()));
    expect(todaysRoutine(plan, state.history, now).doneCount).toBe(0);
    state = reducer(
      state,
      historyWriteResult({
        outcome: 'saved',
        records: [{ id: 'event-A', writeRevision: 1 }],
      })
    );
    expect(todaysRoutine(plan, state.history, now).doneCount).toBe(1);
    expect(measurementSeries(state.history)).toEqual([]);
  });
  it('failed and stale receipts never grant credit; retry retains event identity', () => {
    let s = reducer(undefined, recordGuidedActivity(activity()));
    s = reducer(
      s,
      historyWriteResult({
        outcome: 'failed',
        records: [{ id: 'event-A', writeRevision: 1 }],
      })
    );
    s = reducer(s, retryGuidedActivity('event-A'));
    expect(s.history[0].writeRevision).toBe(2);
    s = reducer(
      s,
      historyWriteResult({
        outcome: 'saved',
        records: [{ id: 'event-A', writeRevision: 1 }],
      })
    );
    expect(s.history[0].durability).toBe('pending');
    s = reducer(
      s,
      historyWriteResult({
        outcome: 'saved',
        records: [{ id: 'event-A', writeRevision: 2 }],
      })
    );
    expect(s.history[0].durability).toBe('saved');
    expect(s.history).toHaveLength(1);
  });
  it('duplicate event does not create another repetition or occurrence', () => {
    let s = reducer(undefined, recordGuidedActivity(activity()));
    s = reducer(s, recordGuidedActivity(activity()));
    expect(s.history).toHaveLength(1);
    expect(s.history[0].reps).toBe(0);
    s = reducer(s, recordGuidedActivity({ ...activity(), duration: 999 }));
    expect(s.historySaveErrors['event-A']).toBe('conflict');
  });
  it('never accepts a fake angle or repetition count as a guided activity', () => {
    for (const change of [
      { reps: 3 },
      { measured: true },
      { bestDegrees: 42 },
      { profileId: '' },
      { duration: NaN },
    ])
      expect(
        reducer(undefined, recordGuidedActivity({ ...activity(), ...change })).history
      ).toEqual([]);
  });
});

it('real redux-persist path acknowledges, restarts and keeps exactly one unmeasured record', async () => {
  const base = memory();
  const writer = createAcknowledgedHistoryStorage(base);
  const create = async () => {
    const store = configureStore({
      reducer: persistReducer(
        { key: 'exercise', storage: writer.storage, whitelist: ['history'], timeout: 0 },
        reducer
      ),
      middleware: (getDefault) => getDefault({ serializableCheck: false }),
    });
    const unsubscribe = writer.subscribe((event) =>
      store.dispatch(historyWriteResult(event))
    );
    const persistor = persistStore(store);
    await new Promise<void>((resolve) => {
      const stop = persistor.subscribe(() => {
        if (persistor.getState().bootstrapped) {
          stop();
          resolve();
        }
      });
    });
    await persistor.flush();
    return {
      store,
      persistor,
      close: async () => {
        persistor.pause();
        await persistor.flush();
        unsubscribe();
      },
    };
  };
  const first = await create();
  const gate = deferred();
  base.setItem.mockImplementationOnce(async (key, value) => {
    await gate.promise;
    base.values.set(key, value);
  });
  first.store.dispatch(recordGuidedActivity(activity()));
  const saving = first.persistor.flush();
  await Promise.resolve();
  expect(first.store.getState().history[0].durability).toBe('pending');
  gate.resolve();
  await saving;
  await first.persistor.flush();
  expect(first.store.getState().history[0].durability).toBe('saved');
  await first.close();
  const restored = await create();
  expect(restored.store.getState().history).toHaveLength(1);
  expect(restored.store.getState().history[0]).toMatchObject({
    id: 'event-A',
    measured: false,
    durability: 'saved',
    completionBasis: 'patient_report',
  });
  await restored.close();
});

it('a persisted conflict cannot become saved on restart or stale acknowledgement', async () => {
  let state = reducer(undefined, recordGuidedActivity(activity()));
  state = reducer(state, recordGuidedActivity({ ...activity(), duration: 99 }));
  expect(state.history[0].recordConflict).toBe(true);
  const base = memory();
  const writer = createAcknowledgedHistoryStorage(base);
  const events = jest.fn();
  writer.subscribe(events);
  await writer.storage.setItem('persist:exercise', envelope(state.history));
  const restored = JSON.parse(JSON.parse(base.values.get('persist:exercise')!).history);
  expect(restored[0]).toMatchObject({ durability: 'pending', recordConflict: true });
  expect(events).not.toHaveBeenCalled();
  const fresh = { ...state, history: restored, historySaveErrors: {} };
  const acknowledged = reducer(
    fresh,
    historyWriteResult({
      outcome: 'saved',
      records: [{ id: 'event-A', writeRevision: 1 }],
    })
  );
  expect(acknowledged.history[0].durability).toBe('pending');
});
