import Tts from 'react-native-tts';
import { AudioFeedbackService } from '../audioFeedbackService';

afterEach(() => {
  jest.restoreAllMocks();
});
it('a late stop response cannot speak an instruction after cancellation', async () => {
  const audio = new AudioFeedbackService({ enableSound: false });
  let finish!: () => void;
  jest.spyOn(Tts, 'stop').mockImplementationOnce(
    () =>
      new Promise<void>((r) => {
        finish = r;
      }) as any
  );
  const speak = jest.spyOn(Tts, 'speak');
  speak.mockClear();
  const pending = audio.speakGuidance('Hold for the prescribed time.');
  await audio.stopAll();
  finish();
  expect(await pending).toBe(false);
  expect(speak).not.toHaveBeenCalled();
  audio.cleanup();
});
it('a later instruction wins over an older unresolved request', async () => {
  const audio = new AudioFeedbackService({ enableSound: false });
  let finish!: () => void;
  jest.spyOn(Tts, 'stop').mockImplementationOnce(
    () =>
      new Promise<void>((r) => {
        finish = r;
      }) as any
  );
  const speak = jest.spyOn(Tts, 'speak');
  speak.mockClear();
  const old = audio.speakGuidance('Start hold one.');
  expect(await audio.speakGuidance('Paused.')).toBe(true);
  finish();
  expect(await old).toBe(false);
  expect(speak).toHaveBeenCalledTimes(1);
  expect(speak).toHaveBeenCalledWith('Paused.');
  audio.cleanup();
});
it('disabled guidance does not start speech', async () => {
  const audio = new AudioFeedbackService({ enableSpeech: false, enableSound: false });
  const speak = jest.spyOn(Tts, 'speak');
  speak.mockClear();
  expect(await audio.speakGuidance('Hold.')).toBe(false);
  expect(speak).not.toHaveBeenCalled();
  audio.cleanup();
});
