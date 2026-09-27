import { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { audioFeedbackService } from '../../services/audioFeedbackService';

/** iOS has no accessibilityLiveRegion. Keep count access when app speech is off.
 * App speech already announces reps when on: never add a competing count voice.
 * No timers, delayed queue, initial replay, or per-second hold announcements.
 */
export function useAccessibleRepCount({
  value,
  text,
  enabled,
  appSpeechEnabled,
}: {
  value: number;
  text: string;
  enabled: boolean;
  appSpeechEnabled: boolean;
}): void {
  const navigation = useContext(NavigationContext);
  const [reader, setReader] = useState(false);
  const previous = useRef(value);
  // Apply the persisted setting on entry, not only after opening Settings.
  useEffect(() => {
    audioFeedbackService.updateConfig({ enableSpeech: appSpeechEnabled });
  }, [appSpeechEnabled]);
  useEffect(() => {
    if (Platform.OS !== 'ios' || appSpeechEnabled) {
      setReader(false);
      return undefined;
    }
    let alive = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (on) => {
        changed = true;
        if (alive) setReader(on);
      }
    );
    AccessibilityInfo.isScreenReaderEnabled()
      .then((on) => {
        if (alive && !changed) setReader(on);
      })
      .catch(() => {
        /* Unknown reader state must not create unsolicited speech. */
      });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [appSpeechEnabled]);
  useEffect(() => {
    const increased = Number.isFinite(value) && value > previous.current;
    previous.current = value; // Consume even blocked changes: no catch-up on resume.
    if (Platform.OS !== 'ios' || !reader || !enabled || appSpeechEnabled || !increased)
      return;
    if (AppState.currentState !== 'active' || navigation?.isFocused() === false) return;
    // Do not queue a count that could be delivered after a newer precaution.
    AccessibilityInfo.announceForAccessibility(text);
  }, [value, text, enabled, appSpeechEnabled, reader, navigation]);
}
