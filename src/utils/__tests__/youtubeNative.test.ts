import { parseYouTubeId, parseYouTubeStart, youTubeEmbedUrl } from '../youtube';

describe('YouTube helpers on the installed native URL runtime', () => {
  const ID = 'M7lc1UVf-VE';
  const input = `https://www.youtube.com/watch?v=${ID}&t=8s`;
  const originalURL = global.URL;
  const originalParams = global.URLSearchParams;
  beforeEach(() => {
    global.URL = class {
      get hostname() {
        throw new Error('URL.hostname is not implemented');
      }
      get searchParams() {
        throw new Error('URL.searchParams is not implemented');
      }
    } as unknown as typeof URL;
    global.URLSearchParams = class {
      constructor() {
        throw new Error('URLSearchParams not implemented');
      }
    } as unknown as typeof URLSearchParams;
  });
  afterEach(() => {
    global.URL = originalURL;
    global.URLSearchParams = originalParams;
  });
  it('accepts a real watch link without browser-only URL properties', () => {
    expect(parseYouTubeId(input)).toBe(ID);
  });
  it('keeps the start offset on native rather than silently starting at zero', () => {
    expect(parseYouTubeStart(input)).toBe(8);
  });
  it('constructs an encoded embed URL without URLSearchParams', () => {
    expect(youTubeEmbedUrl(ID, { start: 8 })).toContain(`embed/${ID}?`);
    expect(youTubeEmbedUrl(ID, { start: 8 })).toContain('start=8');
  });
});

describe('YouTube link allowlist', () => {
  it.each([
    'https://youtube.com.evil.example/watch?v=M7lc1UVf-VE',
    'https://youtube.com@evil.example/watch?v=M7lc1UVf-VE',
    'https://user@youtube.com/watch?v=M7lc1UVf-VE',
    'ftp://youtube.com/watch?v=M7lc1UVf-VE',
    'https://youtube.com\\@evil.example/watch?v=M7lc1UVf-VE',
    'https://youtube.com/watch?v=%ZZ',
  ])('rejects untrusted or malformed input %s', (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
  it('accepts recognised case-insensitive hosts and an encoded query value', () => {
    expect(parseYouTubeId('HTTPS://WWW.YOUTUBE.COM/watch?v=%4D7lc1UVf-VE')).toBe(
      'M7lc1UVf-VE'
    );
    expect(parseYouTubeStart('youtu.be/M7lc1UVf-VE?t=1m8s')).toBe(68);
  });
  it('rejects non-string stored data and nonfinite start offsets without crashing', () => {
    expect(parseYouTubeId(42 as unknown as string)).toBeNull();
    expect(
      parseYouTubeStart('https://youtu.be/M7lc1UVf-VE?t=' + '9'.repeat(400))
    ).toBeUndefined();
  });
});
