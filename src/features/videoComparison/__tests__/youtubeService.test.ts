// Mock modules before imports
const mockGetInfo = jest.fn().mockResolvedValue({
  videoDetails: {
    title: 'Test Exercise Video',
    lengthSeconds: '300',
    author: { name: 'FitnessExpert' },
    thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
  },
});

jest.mock('react-native-ytdl', () => ({
  getInfo: mockGetInfo,
  default: {
    getInfo: mockGetInfo,
  },
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  writeFile: jest.fn().mockResolvedValue(true),
}));

// Mock EncryptedStorage
jest.mock('react-native-encrypted-storage', () => ({
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

import { YouTubeService } from '../services/youtubeService';

describe('YouTubeService', () => {
  let service: YouTubeService;

  beforeEach(() => {
    service = YouTubeService.getInstance();
    jest.clearAllMocks();
    // Reset mock to default resolved value
    mockGetInfo.mockResolvedValue({
      videoDetails: {
        title: 'Test Exercise Video',
        lengthSeconds: '300',
        author: { name: 'FitnessExpert' },
        thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
      },
    });
  });

  describe('validateUrl', () => {
    it('should validate correct YouTube URLs', async () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'www.youtube.com/watch?v=dQw4w9WgXcQ',
      ];

      for (const url of validUrls) {
        expect(await service.validateUrl(url)).toBe(true);
      }
    });

    it('should reject invalid URLs', async () => {
      const invalidUrls = [
        'https://vimeo.com/123456',
        'https://example.com',
        'not-a-url',
        'https://youtube.com/',
        '',
      ];

      for (const url of invalidUrls) {
        expect(await service.validateUrl(url)).toBe(false);
      }
    });
  });

  describe('getVideoInfo', () => {
    it('should fetch video information', async () => {
      const url = 'https://youtube.com/watch?v=test123';
      const info = await service.getVideoInfo(url);

      expect(info).toEqual({
        url,
        title: 'Test Exercise Video',
        duration: 300,
        thumbnail: 'https://example.com/thumb.jpg',
        author: 'FitnessExpert',
      });
    });

    it('should cache video information', async () => {
      const url = 'https://youtube.com/watch?v=test123';

      // First call
      await service.getVideoInfo(url);

      // Second call should use cache
      const callCountBefore = mockGetInfo.mock.calls.length;

      await service.getVideoInfo(url);

      expect(mockGetInfo.mock.calls.length).toBe(callCountBefore);
    });

    it('should handle fetch errors', async () => {
      mockGetInfo.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.getVideoInfo('https://youtube.com/watch?v=fail')
      ).rejects.toThrow('Network connection failed');
    });
  });

  describe('downloadVideo', () => {
    it('should download video with specified quality', async () => {
      const RNFS = require('react-native-fs');
      const url = 'https://youtube.com/watch?v=test123';

      const path = await service.downloadVideo(url, 'high');

      expect(path).toMatch(/\/cache\/youtube_\d+\.mp4/);
      expect(RNFS.writeFile).toHaveBeenCalled();
    });

    it('should handle different quality settings', async () => {
      const qualities = ['low', 'medium', 'high'] as const;

      for (const quality of qualities) {
        const path = await service.downloadVideo(
          'https://youtube.com/watch?v=test',
          quality
        );
        expect(path).toBeTruthy();
      }
    });
  });
});
