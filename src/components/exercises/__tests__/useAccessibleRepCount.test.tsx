import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { audioFeedbackService } from '../../../services/audioFeedbackService';
import { useAccessibleRepCount } from '../useAccessibleRepCount';

const initial = {
  value: 2,
  text: '2 of 10 repetitions',
  enabled: true,
  appSpeechEnabled: false,
};
const remove = jest.fn();
const originalAppState = AppState.currentState;
let changed: (enabled: boolean) => void;
let announce: jest.SpyInstance;
beforeEach(() => {
  jest.spyOn(audioFeedbackService, 'updateConfig').mockImplementation(() => {});
  jest.replaceProperty(Platform, 'OS', 'ios');
  AppState.currentState = 'active';
  announce = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(() => {});
  jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_event: string, listener: unknown) => {
      changed = listener as (enabled: boolean) => void;
      // Native emitter internals are not exercised; preserve its consumed cleanup API.
      return { remove } as unknown as ReturnType<
        typeof AccessibilityInfo.addEventListener
      >;
    });
  remove.mockClear();
});
afterEach(() => {
  AppState.currentState = originalAppState;
  jest.restoreAllMocks();
});
const settle = () =>
  act(async () => {
    await Promise.resolve();
  });

it('announces a new count on iOS with VoiceOver and app speech off, not on mount', async () => {
  const view = renderHook(useAccessibleRepCount, { initialProps: initial });
  await settle();
  expect(announce).not.toHaveBeenCalled();
  expect(audioFeedbackService.updateConfig).toHaveBeenLastCalledWith({
    enableSpeech: false,
  });
  view.rerender({ ...initial, value: 3, text: '3 of 10 repetitions' });
  expect(announce).toHaveBeenCalledTimes(1);
  expect(announce).toHaveBeenLastCalledWith('3 of 10 repetitions');
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

it('does not duplicate the app speech channel or announce old counts on switching it off', async () => {
  const view = renderHook(useAccessibleRepCount, {
    initialProps: { ...initial, appSpeechEnabled: true },
  });
  await settle();
  view.rerender({ ...initial, value: 3, appSpeechEnabled: true });
  view.rerender({ ...initial, value: 3, appSpeechEnabled: false });
  await settle();
  expect(announce).not.toHaveBeenCalled();
});

it('consumes blocked changes without a delayed count after warning/pause/framing clears', async () => {
  const view = renderHook(useAccessibleRepCount, { initialProps: initial });
  await settle();
  view.rerender({ ...initial, value: 3, enabled: false });
  view.rerender({ ...initial, value: 3 });
  expect(announce).not.toHaveBeenCalled();
  view.rerender({ ...initial, value: 4, text: '4 of 10 repetitions' });
  expect(announce).toHaveBeenCalledTimes(1);
});

it('does not announce background or reset counts, or replay on foreground', async () => {
  const view = renderHook(useAccessibleRepCount, { initialProps: initial });
  await settle();
  AppState.currentState = 'background';
  view.rerender({ ...initial, value: 3 });
  AppState.currentState = 'active';
  view.rerender({ ...initial, value: 3 });
  view.rerender({ ...initial, value: 0 });
  expect(announce).not.toHaveBeenCalled();
});

it('a live reader-off event wins over a late initial reader-on query', async () => {
  let resolve!: (value: boolean) => void;
  jest.mocked(AccessibilityInfo.isScreenReaderEnabled).mockReturnValue(
    new Promise((r) => {
      resolve = r;
    })
  );
  const view = renderHook(useAccessibleRepCount, { initialProps: initial });
  act(() => changed(false));
  await act(async () => {
    resolve(true);
    await Promise.resolve();
  });
  view.rerender({ ...initial, value: 3 });
  expect(announce).not.toHaveBeenCalled();
});

it('does not use an iOS announcement on Android', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const view = renderHook(useAccessibleRepCount, { initialProps: initial });
  await settle();
  view.rerender({ ...initial, value: 3 });
  expect(announce).not.toHaveBeenCalled();
  expect(AccessibilityInfo.isScreenReaderEnabled).not.toHaveBeenCalled();
});

it('reader query failure stays silent and removes the listener on unmount', async () => {
  jest
    .mocked(AccessibilityInfo.isScreenReaderEnabled)
    .mockRejectedValue(new Error('Unavailable'));
  const view = renderHook(useAccessibleRepCount, { initialProps: initial });
  await settle();
  view.rerender({ ...initial, value: 3 });
  expect(announce).not.toHaveBeenCalled();
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});
