// Mock modules before imports
jest.mock('react-native-ytdl', () => {
  const mockGetInfo = jest.fn().mockResolvedValue({
    videoDetails: {
      title: 'Test Exercise Video',
      lengthSeconds: '300',
      author: { name: 'FitnessExpert' },
      thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
    },
  });

  // Create a callable mock that also has getInfo
  const mockYtdl = jest.fn().mockResolvedValue('mock-stream-data');
  mockYtdl.getInfo = mockGetInfo;

  return {
    __esModule: true,
    default: mockYtdl,
    getInfo: mockGetInfo,
  };
});

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  writeFile: jest.fn().mockResolvedValue(true),
}));

// EncryptedStorage mock is in __mocks__/react-native-encrypted-storage.js

import { YouTubeService } from '../services/youtubeService';

describe('YouTubeService', () => {
  let service: YouTubeService;

  beforeEach(() => {
    service = YouTubeService.getInstance();
    jest.clearAllMocks();

    // Get the mocked module and reset it
    const ytdl = require('react-native-ytdl');

    // Reset ytdl.default (which is the callable function with getInfo)
    if (ytdl.default) {
      ytdl.default.mockResolvedValue('mock-stream-data');
      if (ytdl.default.getInfo) {
        ytdl.default.getInfo.mockResolvedValue({
          videoDetails: {
            title: 'Test Exercise Video',
            lengthSeconds: '300',
            author: { name: 'FitnessExpert' },
            thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
          },
        });
      }
    }

    // Reset ytdl.getInfo (top level)
    if (ytdl.getInfo) {
      ytdl.getInfo.mockResolvedValue({
        videoDetails: {
          title: 'Test Exercise Video',
          lengthSeconds: '300',
          author: { name: 'FitnessExpert' },
          thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
        },
      });
    }
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
      const ytdl = require('react-native-ytdl');
      const mockFn = ytdl.default?.getInfo || ytdl.getInfo;

      // First call
      await service.getVideoInfo(url);

      // Second call should use cache
      const callCountBefore = mockFn.mock.calls.length;

      await service.getVideoInfo(url);

      expect(mockFn.mock.calls.length).toBe(callCountBefore);
    });

    it('should handle fetch errors', async () => {
      const ytdl = require('react-native-ytdl');
      const mockFn = ytdl.default?.getInfo || ytdl.getInfo;

      mockFn.mockRejectedValueOnce(new Error('Network error'));

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
