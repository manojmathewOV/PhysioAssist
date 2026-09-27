import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { PLAYER_SCOPE } from './playerDocument';
import type { VideoTransportHandle, VideoTransportProps } from './VideoTransport';

export const playerOrigin = (): string =>
  typeof window === 'undefined' ? '' : window.location.origin;
const VideoTransport = forwardRef<VideoTransportHandle, VideoTransportProps>(
  (props, ref) => {
    const frame = useRef<HTMLIFrameElement>(null);
    const callbacks = useRef(props);
    callbacks.current = props;
    useImperativeHandle(
      ref,
      () => ({
        send(command) {
          frame.current?.contentWindow?.postMessage(
            { scope: PLAYER_SCOPE, channel: props.channel, command },
            props.origin
          );
        },
      }),
      [props.channel, props.origin]
    );
    useEffect(() => {
      const receive = (event: MessageEvent) => {
        if (
          event.source !== frame.current?.contentWindow ||
          event.origin !== props.origin ||
          typeof event.data !== 'string'
        )
          return;
        callbacks.current.onMessage(event.data);
      };
      window.addEventListener('message', receive);
      return () => window.removeEventListener('message', receive);
    }, [props.origin]);
    return React.createElement('iframe', {
      ref: frame,
      srcDoc: props.html,
      title: 'Exercise reference video',
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
      allowFullScreen: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      onError: props.onError,
      style: { border: 0, width: '100%', height: '100%', display: 'block' },
      'data-testid': 'reference-webview',
    });
  }
);
VideoTransport.displayName = 'VideoTransport';
export default VideoTransport;
