// Mock ytdl as a function with methods attached
const ytdl = jest.fn();
ytdl.getInfo = jest.fn().mockResolvedValue({
  videoDetails: {
    title: 'Test Video',
    videoId: 'test123',
    lengthSeconds: 120,
  },
  formats: [],
});
ytdl.downloadFromInfo = jest.fn();
ytdl.validateURL = jest.fn((url) => {
  return typeof url === 'string' && url.includes('youtube.com');
});
ytdl.validateID = jest.fn((id) => {
  return typeof id === 'string' && id.length === 11;
});
ytdl.getVideoID = jest.fn((url) => {
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : null;
});

module.exports = ytdl;
