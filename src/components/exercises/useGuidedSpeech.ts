import { useEffect, useState } from 'react';
import { audioFeedbackService as audio } from '../../services/audioFeedbackService';

/** One instruction on a state transition, never a spoken running stopwatch. */
export function useGuidedSpeech(
  enabled: boolean,
  suspended: boolean,
  text: string,
  rate?: number
) {
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let current = true;
    setUnavailable(false);
    audio.updateConfig({
      enableSpeech: enabled,
      ...(rate !== undefined ? { speechRate: rate } : {}),
    });
    if (enabled && !suspended && text) {
      void audio.speakGuidance(text).then((ok) => {
        if (current && !ok) setUnavailable(true);
      });
    } else void audio.stopAll().catch(() => undefined);
    return () => {
      current = false;
      void audio.stopAll().catch(() => undefined);
    };
  }, [enabled, suspended, text, rate]);
  return { unavailable };
}
