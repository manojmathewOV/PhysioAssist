/**
 * Web: the physio's exercise video in YouTube's official embeddable player.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { radii } from '../../theme';
import { youTubeEmbedUrl } from '../../utils/youtube';
import type { ExerciseVideoProps } from './ExerciseVideo';

const ExerciseVideo: React.FC<ExerciseVideoProps> = ({
  videoId,
  start,
  autoplay,
  style,
  testID = 'exercise-video',
}) => (
  <View style={[styles.frame, style]} testID={testID}>
    {React.createElement('iframe', {
      src: youTubeEmbedUrl(videoId, { start, autoplay }),
      title: 'Exercise video',
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
      allowFullScreen: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      style: { border: 0, width: '100%', height: '100%' },
    })}
  </View>
);

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    width: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});

export default ExerciseVideo;
