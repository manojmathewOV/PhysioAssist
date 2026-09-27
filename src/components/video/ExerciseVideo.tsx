/** Patient-controlled reference. Playback is never exercise or measurement credit. */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { AppText } from '../ui';
import { colors, spacing } from '../../theme';
import VideoTransport, { playerOrigin, VideoTransportHandle } from './VideoTransport';
import {
  PlayerCommand,
  PlayerState,
  playerDocument,
  playerHeight,
  readPlayerEvent,
} from './playerDocument';
export interface ExerciseVideoProps {
  videoId: string;
  start?: number;
  paused?: boolean;
  hidden?: boolean;
  compact?: boolean;
  onHide?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
let playerSequence = 0;
const ExerciseVideo: React.FC<ExerciseVideoProps> = ({
  videoId,
  start = 0,
  paused = false,
  hidden = false,
  compact = false,
  onHide,
  style,
  testID = 'exercise-video',
}) => {
  const nav = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => nav?.isFocused() ?? true);
  const [active, setActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
  );
  const [state, setState] = useState<PlayerState>('loading');
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(320);
  const lastTime = useRef(start);
  const transport = useRef<VideoTransportHandle>(null);
  const ready = useRef(false);
  const suspended = paused || hidden || !active || !focused;
  const suspendedRef = useRef(suspended);
  suspendedRef.current = suspended;
  const sourceKey = `${videoId}|${start}`;
  const priorSource = useRef(sourceKey);
  if (priorSource.current !== sourceKey) {
    lastTime.current = start;
    priorSource.current = sourceKey;
  }
  const origin = playerOrigin();
  const page = useMemo(() => {
    const channel = `reference-${++playerSequence}`;
    try {
      return {
        channel,
        html: playerDocument(videoId, retry ? lastTime.current : start, origin, channel),
      };
    } catch {
      return { channel, html: '' };
    }
  }, [videoId, start, origin, retry]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (value) =>
      setActive(value === 'active')
    );
    const blur = nav?.addListener('blur', () => setFocused(false));
    const focus = nav?.addListener('focus', () => setFocused(true));
    return () => {
      sub.remove();
      blur?.();
      focus?.();
    };
  }, [nav]);
  useEffect(() => {
    ready.current = false;
    setState(page.html ? 'loading' : 'error');
    const timeout = setTimeout(() => {
      if (!ready.current) setState('error');
    }, 15000);
    return () => clearTimeout(timeout);
  }, [page]);
  useEffect(() => {
    transport.current?.send({ type: 'suspend', value: suspended });
  }, [suspended]);
  const receive = (raw: string) => {
    const event = readPlayerEvent(raw, page.channel);
    if (!event) return;
    lastTime.current = event.seconds;
    if (event.state === 'ready') {
      ready.current = true;
      transport.current?.send({ type: 'suspend', value: suspendedRef.current });
    }
    setState(event.state);
  };
  const send = (command: PlayerCommand) => transport.current?.send(command);
  const failed = state === 'error';
  const disabled = !ready.current || suspended || failed;
  const button = (label: string, id: string, onPress: () => void, blocked = false) => (
    <Pressable
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={onPress}
      style={[styles.button, blocked && styles.disabled]}
    >
      <AppText variant="bodyStrong" color={colors.primary}>
        {label}
      </AppText>
    </Pressable>
  );
  return (
    <View
      style={[styles.wrap, style, hidden && styles.hidden]}
      testID={testID}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      onLayout={(e) => {
        if (e.nativeEvent.layout.width > 0) setWidth(e.nativeEvent.layout.width);
      }}
    >
      <View
        style={{
          height: failed ? 0 : playerHeight(width, expanded),
          minWidth: 200,
          backgroundColor: '#000',
        }}
        testID="reference-player-viewport"
      >
        {page.html && !failed ? (
          <VideoTransport
            key={page.channel}
            ref={transport}
            html={page.html}
            origin={origin}
            channel={page.channel}
            onMessage={receive}
            onError={() => setState('error')}
          />
        ) : null}
      </View>
      <AppText
        variant="caption"
        color={colors.textSecondary}
        accessibilityLiveRegion="polite"
        testID="reference-player-state"
      >
        {failed
          ? 'Video unavailable. Check your connection and try again. Use your programme’s written instructions; do not substitute another exercise.'
          : suspended
            ? 'Video paused with your session.'
            : state === 'loading'
              ? 'Loading reference video…'
              : state === 'blocked'
                ? 'Tap Play in the video to start.'
                : state === 'playing'
                  ? 'Reference video playing'
                  : state === 'ended'
                    ? 'Video finished. Watching does not complete your exercise.'
                    : 'Reference video ready'}
      </AppText>
      <View style={styles.buttons}>
        {!hidden && onHide && button('Hide video', 'follow-along-toggle', onHide)}
        {failed
          ? button('Try video again', 'reference-retry', () => {
              ready.current = false;
              setRetry((n) => n + 1);
            })
          : button(
              state === 'playing' ? 'Pause video' : 'Play video',
              'reference-play-pause',
              () => send({ type: state === 'playing' ? 'pause' : 'play' }),
              disabled
            )}
        {!compact &&
          button('Replay', 'reference-replay', () => send({ type: 'replay' }), disabled)}
        {!compact &&
          !onHide &&
          button(expanded ? 'Smaller video' : 'Enlarge video', 'reference-enlarge', () =>
            setExpanded((x) => !x)
          )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minWidth: 200,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  hidden: { position: 'absolute', left: -10000, opacity: 0 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.sm },
  disabled: { opacity: 0.5 },
});
export default ExerciseVideo;
