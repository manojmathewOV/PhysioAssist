import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import GuidedActivity from '../exercises/GuidedActivity';
import { GUIDED_SHOULDER } from '../../services/care/guidedShoulder';
import { audioFeedbackService as audio } from '../../services/audioFeedbackService';
let changed: (state: AppStateStatus) => void;
const props = {
  exercise: GUIDED_SHOULDER['sleeper-stretch'],
  side: 'left' as const,
  amount: '2–3 times · hold 4 sec each',
  holdSeconds: 4,
  minimumReps: 2,
  maximumReps: 3,
  enableSpeech: true,
  allowed: true,
  onExit: jest.fn(),
};
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1000);
  Object.defineProperty(AppState, 'currentState', {
    value: 'active',
    configurable: true,
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, fn) => {
    changed = fn;
    return { remove: jest.fn() };
  });
  jest.spyOn(audio, 'speakGuidance').mockResolvedValue(true);
  jest.spyOn(audio, 'stopAll').mockResolvedValue();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
async function reachMinimum(ui: ReturnType<typeof render>) {
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(4000);
  fireEvent.press(ui.getByTestId('guided-pause'));
  await advance(4000);
}
it('prescribed 2–3 permits an optional third, never a fourth or automatic completion', async () => {
  const record = jest.fn();
  const ui = render(<GuidedActivity {...props} onRecord={record} />);
  await reachMinimum(ui);
  expect(ui.getByTestId('guided-minimum-reached')).toHaveTextContent(
    'You can finish here'
  );
  expect(ui.getByTestId('guided-pause')).toHaveTextContent('Time optional hold 3');
  expect(record).not.toHaveBeenCalled();
  fireEvent.press(ui.getByTestId('guided-pause'));
  await advance(4000);
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('3 hold timers finished');
  expect(ui.queryByTestId('guided-pause')).toBeNull();
  expect(record).not.toHaveBeenCalled();
  fireEvent.press(ui.getByTestId('guided-stop'));
  fireEvent.press(ui.getByTestId('guided-completed'));
  expect(record).toHaveBeenCalledWith(
    expect.objectContaining({
      activeMilliseconds: 12000,
      measured: false,
      completionBasis: 'patient_report',
    })
  );
  expect(record.mock.calls[0][0]).not.toHaveProperty('reps');
  ui.unmount();
});
it('finishing at the minimum is a normal patient-reported completion', async () => {
  const record = jest.fn();
  const ui = render(<GuidedActivity {...props} onRecord={record} />);
  await reachMinimum(ui);
  fireEvent.press(ui.getByTestId('guided-stop'));
  fireEvent.press(ui.getByTestId('guided-completed'));
  expect(record).toHaveBeenCalledWith(
    expect.objectContaining({ completion: 'completed', activeMilliseconds: 8000 })
  );
  ui.unmount();
});
it('an exact count offers no extra timer', async () => {
  const ui = render(<GuidedActivity {...props} maximumReps={2} amount="2 times" />);
  await reachMinimum(ui);
  expect(ui.queryByTestId('guided-pause')).toBeNull();
  ui.unmount();
});
it('an optional hold preserves remaining time across backgrounding', async () => {
  const ui = render(<GuidedActivity {...props} />);
  await reachMinimum(ui);
  fireEvent.press(ui.getByTestId('guided-pause'));
  await advance(1000);
  act(() => changed('background'));
  await advance(20000);
  act(() => changed('active'));
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('3 sec remaining');
  fireEvent.press(ui.getByTestId('guided-pause'));
  await advance(0);
  expect(audio.speakGuidance).toHaveBeenLastCalledWith(
    expect.stringContaining('3 seconds remaining')
  );
  await advance(3000);
  expect(ui.queryByTestId('guided-pause')).toBeNull();
  ui.unmount();
});
it('a changed programme blocks the optional hold even if its old values return', async () => {
  const ui = render(<GuidedActivity {...props} />);
  await reachMinimum(ui);
  ui.rerender(<GuidedActivity {...props} allowed={false} />);
  ui.rerender(<GuidedActivity {...props} />);
  expect(ui.getByTestId('guided-pause')).toBeDisabled();
  fireEvent.press(ui.getByTestId('guided-pause'));
  await advance(10000);
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('2 hold timers finished');
  ui.unmount();
});
it('stopping before the minimum remains available and is not auto-completed', async () => {
  const record = jest.fn();
  const ui = render(<GuidedActivity {...props} onRecord={record} />);
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(1000);
  fireEvent.press(ui.getByTestId('guided-stop'));
  fireEvent.press(ui.getByTestId('guided-stopped-early'));
  expect(record).toHaveBeenCalledWith(
    expect.objectContaining({ completion: 'stopped_early', activeMilliseconds: 1000 })
  );
  ui.unmount();
});
it.each([0, 1, 2.5, NaN, Infinity])(
  'invalid explicit maximum %s does not silently use the minimum',
  async (maximumReps) => {
    const ui = render(<GuidedActivity {...props} maximumReps={maximumReps} />);
    expect(ui.queryByTestId('guided-hold-toggle')).toBeNull();
    fireEvent.press(ui.getByTestId('guided-start'));
    await advance(10000);
    expect(ui.queryByTestId('guided-hold-time')).toBeNull();
    ui.unmount();
  }
);
