/**
 * Picture-in-picture exercise video during a session: the patient follows the
 * physio's video while the camera watches them. One big pill hides or shows it.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText } from '../ui';
import { colors, radii, spacing } from '../../theme';
import ExerciseVideo from './ExerciseVideo';

const FollowAlongVideo: React.FC<{ videoId: string; start?: number }> = ({
  videoId,
  start,
}) => {
  const [shown, setShown] = useState(true);
  return (
    <View style={styles.wrap} pointerEvents="box-none" testID="follow-along">
      {shown ? (
        <ExerciseVideo videoId={videoId} start={start} autoplay style={styles.video} />
      ) : null}
      <Pressable
        onPress={() => setShown((s) => !s)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: spacing.xs },
  video: {
    width: '55%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
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
