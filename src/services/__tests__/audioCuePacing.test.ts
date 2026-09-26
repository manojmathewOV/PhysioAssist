import {
  AudioFeedbackService,
  CORRECTION_MIN_GAP_MS,
  CORRECTION_REPEAT_GAP_MS,
} from '../audioFeedbackService';

describe('spoken correction pacing', () => {
  const t0 = 1_000_000;

  it('speaks a correction, then holds off others for the minimum gap', () => {
    const audio = new AudioFeedbackService();
    expect(audio.speakCorrection('Bend your knees more', t0)).toBe(true);
    expect(audio.speakCorrection('Keep your back straight', t0 + 1000)).toBe(false);
    expect(
      audio.speakCorrection('Keep your back straight', t0 + CORRECTION_MIN_GAP_MS)
    ).toBe(true);
  });

  it('does not repeat the same correction too soon', () => {
    const audio = new AudioFeedbackService();
    expect(audio.speakCorrection('Slow down', t0)).toBe(true);
    expect(audio.speakCorrection('Slow down', t0 + CORRECTION_MIN_GAP_MS + 1)).toBe(
      false
    );
    expect(audio.speakCorrection('Slow down', t0 + CORRECTION_REPEAT_GAP_MS)).toBe(true);
  });

  it('stays silent when voice guidance is off', () => {
    const audio = new AudioFeedbackService({ enableSpeech: false });
    expect(audio.speakCorrection('Bend your knees more', t0)).toBe(false);
  });
});
