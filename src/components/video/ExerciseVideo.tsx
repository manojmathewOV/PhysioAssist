/**
 * The physio's exercise video, shown with YouTube's official embeddable player
 * (inside a WebView on phones). Nothing is downloaded or analysed.
 */
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { radii } from '../../theme';
import { youTubeEmbedUrl } from '../../utils/youtube';

export interface ExerciseVideoProps {
  videoId: string;
  /** Seconds to start from. */
  start?: number;
  /** Start playing (muted) straight away, e.g. during a follow-along session. */
  autoplay?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const page = (src: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style>
</head><body><iframe src="${src}" title="Exercise video"
allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></body></html>`;

const ExerciseVideo: React.FC<ExerciseVideoProps> = ({
  videoId,
  start,
  autoplay,
  style,
  testID = 'exercise-video',
}) => (
  <View style={[styles.frame, style]} testID={testID} accessibilityLabel="Exercise video">
    <WebView
      source={{
        html: page(youTubeEmbedUrl(videoId, { start, autoplay })),
        // The player needs a web origin to identify the embedding page
        baseUrl: 'https://www.youtube-nocookie.com',
      }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={!autoplay}
      javaScriptEnabled
      scrollEnabled={false}
      style={styles.web}
    />
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
  web: { flex: 1, backgroundColor: '#000' },
});

export default ExerciseVideo;
