import AsyncStorage from '@react-native-async-storage/async-storage';
import { YouTubeVideoInfo, VideoComparisonError } from '../types/videoComparison.types';

// Mock implementations for testing
const ytdl = require('react-native-ytdl')?.ytdl || {
  getInfo: async () => ({ videoDetails: {} })
};

const RNFS = require('react-native-fs') || {
  CachesDirectoryPath: '/cache',
  writeFile: async () => true
};

export class YouTubeService {
  private static instance: YouTubeService;
  private cache: Map<string, YouTubeVideoInfo> = new Map();
  private readonly MAX_CACHE_SIZE = 10;
  private readonly MAX_VIDEO_DURATION = 600; // 10 minutes

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  async validateUrl(url: string): Promise<boolean> {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  }

  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Check persistent cache
    const cachedInfo = await this.loadFromPersistentCache(url);
    if (cachedInfo) {
      this.cache.set(url, cachedInfo);
      return cachedInfo;
    }

    try {
      const info = await ytdl.getInfo(url);
      const duration = parseInt(info.videoDetails.lengthSeconds || '0');

      if (duration > this.MAX_VIDEO_DURATION) {
        throw new Error(VideoComparisonError.VIDEO_TOO_LONG);
      }

      const videoInfo: YouTubeVideoInfo = {
        url,
        title: info.videoDetails.title || 'Unknown Title',
        duration,
        thumbnail: info.videoDetails.thumbnails?.[0]?.url || '',
        author: info.videoDetails.author?.name || 'Unknown Author'
      };

      // Update caches
      this.updateCache(url, videoInfo);
      await this.saveToPersistentCache(url, videoInfo);

      return videoInfo;
    } catch (error: any) {
      if (error.message === VideoComparisonError.VIDEO_TOO_LONG) {
        throw error;
      }
      throw new Error(VideoComparisonError.NETWORK_ERROR);
    }
  }

  async downloadVideo(
    url: string, 
    quality: 'low' | 'medium' | 'high' = 'medium',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const qualityMap = {
      low: '360p',
      medium: '720p',
      high: '1080p'
    };

    try {
      const videoPath = `${RNFS.CachesDirectoryPath}/youtube_${Date.now()}.mp4`;
      
      // In a real implementation, this would use ytdl-core or similar
      // For now, we'll simulate the download
      const stream = await ytdl(url, { quality: qualityMap[quality] });
      
      // Simulate progress updates
      if (onProgress) {
        const progressInterval = setInterval(() => {
          const progress = Math.random();
          onProgress(progress);
          if (progress >= 1) {
            clearInterval(progressInterval);
          }
        }, 100);
      }

      await RNFS.writeFile(videoPath, stream, 'base64');
      return videoPath;
    } catch (error) {
      throw new Error(VideoComparisonError.NETWORK_ERROR);
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('youtube_video_cache');
  }

  private updateCache(url: string, info: YouTubeVideoInfo): void {
    // LRU cache implementation
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(url, info);
  }

  private async saveToPersistentCache(url: string, info: YouTubeVideoInfo): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('youtube_video_cache');
      const cache = cacheData ? JSON.parse(cacheData) : {};
      
      cache[url] = {
        ...info,
        cachedAt: Date.now()
      };

      // Keep only recent items
      const sortedKeys = Object.keys(cache).sort((a, b) => 
        cache[b].cachedAt - cache[a].cachedAt
      );
      
      const limitedCache = sortedKeys.slice(0, 50).reduce((acc, key) => {
        acc[key] = cache[key];
        return acc;
      }, {} as any);

      await AsyncStorage.setItem('youtube_video_cache', JSON.stringify(limitedCache));
    } catch (error) {
      console.warn('Failed to save to persistent cache:', error);
    }
  }

  private async loadFromPersistentCache(url: string): Promise<YouTubeVideoInfo | null> {
    try {
      const cacheData = await AsyncStorage.getItem('youtube_video_cache');
      if (!cacheData) return null;

      const cache = JSON.parse(cacheData);
      const cachedInfo = cache[url];

      if (cachedInfo) {
        // Check if cache is still valid (24 hours)
        const age = Date.now() - cachedInfo.cachedAt;
        if (age < 24 * 60 * 60 * 1000) {
          return cachedInfo;
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to load from persistent cache:', error);
      return null;
    }
  }
}