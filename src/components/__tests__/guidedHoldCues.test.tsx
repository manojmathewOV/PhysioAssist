import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import GuidedActivity from '../exercises/GuidedActivity';
import { GUIDED_SHOULDER } from '../../services/care/guidedShoulder';
import { audioFeedbackService as audio } from '../../services/audioFeedbackService';
let changed: (state: AppStateStatus) => void;
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
const props = {
  exercise: GUIDED_SHOULDER['sleeper-stretch'],
  side: 'left' as const,
  amount: '2–3 times · hold 4 sec each',
  holdSeconds: 4,
  minimumReps: 2,
  enableSpeech: true,
  allowed: true,
  onExit: jest.fn(),
};
const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
it('speaks supplied dose and position, times each hold, invents no rest or completion', async () => {
  const record = jest.fn();
  const ui = render(<GuidedActivity {...props} onRecord={record} />);
  await advance(30000);
  expect(ui.queryByTestId('guided-time')).toBeNull();
  expect(audio.speakGuidance).toHaveBeenCalledWith(expect.stringContaining('2–3 times'));
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(1000);
  const calls = (audio.speakGuidance as jest.Mock).mock.calls.length;
  await advance(2000);
  expect(audio.speakGuidance).toHaveBeenCalledTimes(calls);
  await advance(1000);
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('1 hold timer finished');
  expect(audio.speakGuidance).toHaveBeenLastCalledWith(
    expect.stringContaining('Release and rest')
  );
  await advance(60000);
  expect(ui.getByTestId('guided-time')).toHaveTextContent('4 sec');
  expect(record).not.toHaveBeenCalled();
  fireEvent.press(ui.getByTestId('guided-pause'));
  await advance(4000);
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('2 hold timers finished');
  expect(ui.queryByTestId('guided-pause')).toBeNull();
  expect(record).not.toHaveBeenCalled();
  fireEvent.press(ui.getByTestId('guided-stop'));
  fireEvent.press(ui.getByTestId('guided-completed'));
  expect(record).toHaveBeenCalledWith(
    expect.objectContaining({
      completionBasis: 'patient_report',
      measured: false,
      activeMilliseconds: 8000,
    })
  );
  expect(record.mock.calls[0][0]).not.toHaveProperty('reps');
  ui.unmount();
});
it('background/pause freezes the current hold and requires explicit resumption', async () => {
  const ui = render(<GuidedActivity {...props} />);
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(2000);
  act(() => changed('background'));
  await advance(10000);
  act(() => changed('active'));
  await advance(10000);
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('2 sec remaining');
  fireEvent.press(ui.getByTestId('guided-pause'));
  await advance(0);
  expect(audio.speakGuidance).toHaveBeenLastCalledWith(
    expect.stringContaining('2 seconds remaining')
  );
  await advance(2000);
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('1 hold timer finished');
  ui.unmount();
});
it('unknown hold duration produces no timer, release instruction or invented 30 seconds', async () => {
  const ui = render(
    <GuidedActivity {...props} holdSeconds={undefined} amount="2 times" />
  );
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(60000);
  expect(ui.queryByTestId('guided-hold-time')).toBeNull();
  expect((audio.speakGuidance as jest.Mock).mock.calls.flat().join(' ')).not.toMatch(
    /30 seconds|Release and rest/
  );
  ui.unmount();
});
it('hold timer can be turned off without changing the prescription', async () => {
  const ui = render(<GuidedActivity {...props} />);
  fireEvent.press(ui.getByTestId('guided-hold-toggle'));
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(10000);
  expect(ui.queryByTestId('guided-hold-time')).toBeNull();
  expect(ui.getByTestId('guided-dose')).toHaveTextContent('4 sec each');
  ui.unmount();
});
it('muting and watching cancel guidance; no queued hold cue appears on return', async () => {
  const ui = render(
    <GuidedActivity {...props} videoLink="https://youtu.be/M7lc1UVf-VE" />
  );
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(1000);
  fireEvent.press(ui.getByTestId('guided-watch'));
  await advance(10000);
  const calls = (audio.speakGuidance as jest.Mock).mock.calls.length;
  ui.rerender(
    <GuidedActivity
      {...props}
      enableSpeech={false}
      videoLink="https://youtu.be/M7lc1UVf-VE"
    />
  );
  await advance(10000);
  expect(audio.speakGuidance).toHaveBeenCalledTimes(calls);
  expect(audio.stopAll).toHaveBeenCalled();
  ui.unmount();
});
it('changed programme cancels the hold without cueing another repetition', async () => {
  const ui = render(<GuidedActivity {...props} />);
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(1000);
  ui.rerender(<GuidedActivity {...props} allowed={false} />);
  await advance(20000);
  expect(ui.getByTestId('guided-plan-changed')).toBeTruthy();
  expect(ui.getByTestId('guided-hold-time')).toHaveTextContent('3 sec remaining');
  expect(audio.speakGuidance).toHaveBeenLastCalledWith(
    expect.stringContaining('Stop here')
  );
  ui.unmount();
});
it('speech failure leaves a readable alternative', async () => {
  (audio.speakGuidance as jest.Mock).mockResolvedValue(false);
  const ui = render(<GuidedActivity {...props} />);
  await advance(0);
  expect(ui.getByTestId('guided-speech-unavailable')).toHaveTextContent(
    'written instructions'
  );
  ui.unmount();
});

it('turning speech on partway through a hold announces only remaining time', async () => {
  const Harness = () => {
    const [enabled, setEnabled] = React.useState(false);
    return (
      <GuidedActivity {...props} enableSpeech={enabled} onSpeechChange={setEnabled} />
    );
  };
  const ui = render(<Harness />);
  fireEvent.press(ui.getByTestId('guided-start'));
  await advance(2000);
  expect(audio.speakGuidance).not.toHaveBeenCalled();
  fireEvent.press(ui.getByTestId('guided-speech-toggle'));
  await advance(0);
  expect(audio.speakGuidance).toHaveBeenLastCalledWith(
    expect.stringContaining('2 seconds remaining')
  );
  ui.unmount();
});
