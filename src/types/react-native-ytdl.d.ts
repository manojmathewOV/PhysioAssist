/**
 * Type definitions for react-native-ytdl
 * YouTube video downloader for React Native
 */

declare module 'react-native-ytdl' {
  export interface VideoDetails {
    title?: string;
    lengthSeconds?: string;
    author?: {
      name?: string;
    };
    thumbnails?: Array<{
      url: string;
      width?: number;
      height?: number;
    }>;
    videoId?: string;
    description?: string;
  }

  export interface VideoInfo {
    videoDetails: VideoDetails;
    formats?: VideoFormat[];
  }

  export interface VideoFormat {
    itag: number;
    url: string;
    mimeType: string;
    quality: string;
    qualityLabel?: string;
    container?: string;
    hasVideo: boolean;
    hasAudio: boolean;
  }

  export interface DownloadOptions {
    quality?: string | 'highest' | 'lowest';
    filter?: 'audioandvideo' | 'videoonly' | 'audioonly';
    format?: string;
  }

  function ytdl(url: string, options?: DownloadOptions): any;

  namespace ytdl {
    function getInfo(url: string): Promise<VideoInfo>;
    function validateURL(url: string): boolean;
    function validateID(id: string): boolean;
    function getURLVideoID(url: string): string;
    function getVideoID(url: string): string;
  }

  export default ytdl;
}
