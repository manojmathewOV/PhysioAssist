import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ExerciseVideo from '../ExerciseVideo';
import FollowAlongVideo from '../FollowAlongVideo';
import { PLAYER_SCOPE } from '../playerDocument';
let mockProps: any;
const mockSend = jest.fn();
jest.mock('../VideoTransport', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    playerOrigin: () => 'https://org.example.physio',
    default: R.forwardRef((props: any, ref: any) => {
      mockProps = props;
      R.useImperativeHandle(ref, () => ({ send: mockSend }));
      return <View testID="transport" />;
    }),
  };
});
const ready = () =>
  act(() =>
    mockProps.onMessage(
      JSON.stringify({
        scope: PLAYER_SCOPE,
        channel: mockProps.channel,
        state: 'ready',
        seconds: 8,
      })
    )
  );
beforeEach(() => {
  jest.useFakeTimers();
  mockSend.mockClear();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
describe('actual reference presentation', () => {
  it('keeps the same source through pause, hide/show and enlargement', () => {
    const s = render(<ExerciseVideo videoId="M7lc1UVf-VE" start={8} />);
    ready();
    const html = mockProps.html;
    s.rerender(<ExerciseVideo videoId="M7lc1UVf-VE" start={8} paused hidden />);
    expect(mockSend).toHaveBeenLastCalledWith({ type: 'suspend', value: true });
    expect(mockProps.html).toBe(html);
    s.rerender(<ExerciseVideo videoId="M7lc1UVf-VE" start={8} />);
    expect(mockSend).toHaveBeenLastCalledWith({ type: 'suspend', value: false });
    fireEvent.press(s.getByTestId('reference-enlarge'));
    expect(mockProps.html).toBe(html);
    expect(s.getByLabelText('Smaller video')).toBeTruthy();
    s.unmount();
  });
  it('handles slow/error loading with an explicit retry, no false ready', () => {
    const s = render(<ExerciseVideo videoId="M7lc1UVf-VE" />);
    act(() => jest.advanceTimersByTime(15000));
    expect(s.getByText(/Video unavailable/)).toBeTruthy();
    const channel = mockProps.channel;
    fireEvent.press(s.getByTestId('reference-retry'));
    expect(mockProps.channel).not.toBe(channel);
    s.unmount();
  });
  it('ignores stale readiness and disallows playback while the exercise is paused', () => {
    const s = render(<ExerciseVideo videoId="M7lc1UVf-VE" paused />);
    const stale = mockProps.channel;
    s.rerender(<ExerciseVideo videoId="abcdefghijk" paused />);
    act(() =>
      mockProps.onMessage(
        JSON.stringify({
          scope: PLAYER_SCOPE,
          channel: stale,
          state: 'ready',
          seconds: 8,
        })
      )
    );
    expect(s.getByTestId('reference-play-pause')).toBeDisabled();
    ready();
    expect(s.getByTestId('reference-play-pause')).toBeDisabled();
    s.unmount();
  });
  it('does not load a hidden follow-along or destroy it on hide/show', () => {
    const s = render(<FollowAlongVideo videoId="M7lc1UVf-VE" />);
    expect(s.queryByTestId('transport')).toBeNull();
    fireEvent.press(s.getByTestId('follow-along-toggle'));
    ready();
    const html = mockProps.html;
    fireEvent.press(s.getByTestId('follow-along-toggle'));
    expect(s.getByTestId('transport', { includeHiddenElements: true })).toBeTruthy();
    expect(mockSend).toHaveBeenLastCalledWith({ type: 'suspend', value: true });
    fireEvent.press(s.getByTestId('follow-along-toggle'));
    expect(mockProps.html).toBe(html);
    s.unmount();
  });
});

it('keeps enlargement in preparation, not over the live safety instruction', () => {
  const s = render(<ExerciseVideo videoId="M7lc1UVf-VE" onHide={jest.fn()} />);
  ready();
  expect(s.queryByTestId('reference-enlarge')).toBeNull();
  expect(s.getByTestId('follow-along-toggle')).toBeTruthy();
  s.unmount();
});
