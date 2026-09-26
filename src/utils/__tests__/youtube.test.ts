import { parseYouTubeId, parseYouTubeStart, youTubeEmbedUrl } from '../youtube';

describe('YouTube links', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('reads the id from %s', (link, id) => {
    expect(parseYouTubeId(link)).toBe(id);
  });

  it.each(['', 'hello', 'https://vimeo.com/123456', 'https://youtube.com/watch?v=short'])(
    'rejects %p',
    (link) => {
      expect(parseYouTubeId(link)).toBeNull();
    }
  );

  it('reads start times', () => {
    expect(parseYouTubeStart('https://youtu.be/dQw4w9WgXcQ?t=90')).toBe(90);
    expect(parseYouTubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&t=1m5s')).toBe(65);
    expect(parseYouTubeStart('https://youtu.be/dQw4w9WgXcQ')).toBeUndefined();
  });

  it('builds a privacy-enhanced, inline, looping embed URL', () => {
    const url = youTubeEmbedUrl('dQw4w9WgXcQ', { start: 30 });
    expect(url).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
    expect(url).toContain('playsinline=1');
    expect(url).toContain('loop=1');
    expect(url).toContain('playlist=dQw4w9WgXcQ');
    expect(url).toContain('start=30');
  });
});
