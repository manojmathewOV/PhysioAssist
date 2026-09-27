import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import StorageRestoreBoundary from '../common/StorageRestoreBoundary';
import { createReadRecovery } from '../../store/readRecovery';

function fixture() {
  const recovery = createReadRecovery(['exercise']);
  const listeners = new Set<() => void>();
  let bootstrapped = false;
  const persistor = {
    getState: () => ({ registry: [] as string[], bootstrapped }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  const storage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
  return {
    recovery,
    persistor,
    listeners,
    storage,
    finishRedux: () => {
      bootstrapped = true;
      listeners.forEach((f) => f());
    },
    view: () =>
      render(
        <StorageRestoreBoundary recovery={recovery} persistor={persistor}>
          <Text testID="patient-content">Patient programme</Text>
        </StorageRestoreBoundary>
      ),
  };
}

describe('saved-progress restoration boundary', () => {
  it('waits for both reading and Redux rehydration before showing the programme', async () => {
    const f = fixture();
    const view = f.view();
    expect(view.queryByTestId('patient-content')).toBeNull();
    f.storage.getItem.mockResolvedValue(null);
    await act(async () => {
      await f.recovery.read({ key: 'exercise', storage: f.storage });
    });
    expect(f.recovery.getSnapshot().status).toBe('ready');
    expect(view.queryByTestId('patient-content')).toBeNull();
    act(f.finishRedux);
    expect(view.getByTestId('patient-content')).toBeTruthy();
    view.unmount();
    expect(f.listeners.size).toBe(0);
  });

  it('shows a non-destructive retry and recovers through the original read', async () => {
    const f = fixture();
    const view = f.view();
    f.storage.getItem.mockRejectedValue(new Error('test-only read failure'));
    let read!: ReturnType<typeof f.recovery.read>;
    await act(async () => {
      read = f.recovery.read({ key: 'exercise', storage: f.storage });
    });
    expect(view.getByText('Your saved progress could not be opened')).toBeTruthy();
    expect(view.queryByTestId('patient-content')).toBeNull();
    f.storage.getItem.mockResolvedValue(null);
    await act(async () => {
      fireEvent.press(view.getByTestId('storage-retry'));
      await read;
    });
    act(f.finishRedux);
    expect(view.getByTestId('patient-content')).toBeTruthy();
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.storage.removeItem).not.toHaveBeenCalled();
  });

  it('coalesces duplicate pending reads and double retries without background timers', async () => {
    const f = fixture();
    const config = { key: 'exercise', storage: f.storage };
    f.storage.getItem.mockRejectedValueOnce(new Error('test read failure'));
    const first = f.recovery.read(config);
    expect(f.recovery.read(config)).toBe(first);
    for (let i = 0; i < 6; i++) await Promise.resolve();
    expect(f.recovery.getSnapshot().status).toBe('blocked');
    let complete!: (value: null) => void;
    f.storage.getItem.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
    const retry = f.recovery.retry();
    await f.recovery.retry();
    expect(f.storage.getItem).toHaveBeenCalledTimes(2);
    complete(null);
    await retry;
    await first;
    expect(f.recovery.getSnapshot().status).toBe('ready');
  });
});
