import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { NativeModules } from 'react-native';
import { WebView } from 'react-native-webview';
import type { PlayerCommand } from './playerDocument';

// iOS MVP: PhysioAppIdentity is implemented only on iOS. Android must add an
// application-ID bridge before this player works; missing identity fails closed
// as unavailable. Never substitute YouTube's origin or an invented bundle ID.
export const playerOrigin = (): string => {
  const id = NativeModules.PhysioAppIdentity?.bundleIdentifier;
  return typeof id === 'string' ? `https://${id.toLowerCase()}` : '';
};
export interface VideoTransportHandle {
  send(command: PlayerCommand): void;
}
export interface VideoTransportProps {
  html: string;
  origin: string;
  channel: string;
  onMessage(raw: string): void;
  onError(): void;
}
const VideoTransport = forwardRef<VideoTransportHandle, VideoTransportProps>(
  (props, ref) => {
    const view = useRef<WebView>(null);
    // Keep the native source object stable through parent playback-state updates.
    const source = useMemo(
      () => ({ html: props.html, baseUrl: props.origin }),
      [props.html, props.origin]
    );
    useImperativeHandle(
      ref,
      () => ({
        send(command) {
          view.current?.injectJavaScript(
            `window.physioVideo&&window.physioVideo.command(${JSON.stringify(command)});true;`
          );
        },
      }),
      []
    );
    return (
      <WebView
        ref={view}
        source={source}
        style={{ flex: 1, backgroundColor: '#000' }}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        onMessage={(e) => props.onMessage(e.nativeEvent.data)}
        onError={props.onError}
        onHttpError={props.onError}
        onContentProcessDidTerminate={props.onError}
        testID="reference-webview"
      />
    );
  }
);
VideoTransport.displayName = 'VideoTransport';
export default VideoTransport;
