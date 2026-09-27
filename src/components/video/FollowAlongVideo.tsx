/**
 * Picture-in-picture exercise video during a session: the patient follows the
 * physio's video while the camera watches them. One big pill hides or shows it.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText } from '../ui';
import { colors, radii, spacing } from '../../theme';
import ExerciseVideo from './ExerciseVideo';

const FollowAlongVideo: React.FC<{
  videoId: string;
  start?: number;
  paused?: boolean;
  onShownChange?: (shown: boolean) => void;
}> = ({ videoId, start, paused = false, onShownChange }) => {
  const small = useWindowDimensions().height < 740;
  const [shown, setShown] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => () => onShownChange?.(false), [onShownChange]);
  return (
    <View style={styles.wrap} pointerEvents="box-none" testID="follow-along">
      {loaded ? (
        <ExerciseVideo
          videoId={videoId}
          start={start}
          paused={paused}
          hidden={!shown}
          compact={small}
          onHide={() => {
            setShown(false);
            onShownChange?.(false);
          }}
          style={styles.video}
        />
      ) : null}
      {!shown && (
        <Pressable
          onPress={() => {
            setLoaded(true);
            setShown(!shown);
            onShownChange?.(!shown);
          }}
          accessibilityRole="button"
          accessibilityLabel={shown ? 'Hide video' : 'Show video'}
          testID="follow-along-toggle"
          style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        >
          <Icon
            name={shown ? 'close-fullscreen' : 'smart-display'}
            size={22}
            color="#FFF"
          />
          <AppText variant="bodyStrong" color="#FFF">
            {shown ? 'Hide video' : 'Show video'}
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: spacing.xs },
  video: {
    width: '100%',
    maxWidth: 420,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.cameraOverlay,
  },
  pillPressed: { opacity: 0.8 },
});

export default FollowAlongVideo;
