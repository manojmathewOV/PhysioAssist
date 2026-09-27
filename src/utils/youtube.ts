/** Allowlisted YouTube links; no browser-only URL polyfill or downloaded video. */
const ID = /^[A-Za-z0-9_-]{11}$/;
interface YouTubeLink {
  host: string;
  path: string;
  query: string;
}
function link(input?: string | null): YouTubeLink | null {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text || /[\s\\]/.test(text)) return null;
  if (text.includes('://') && !/^https?:\/\//i.test(text)) return null;
  const match = text
    .replace(/^https?:\/\//i, '')
    .match(/^([a-z0-9.-]+)(?::(?:80|443))?(\/[^?#]*)?(?:\?([^#]*))?(?:#.*)?$/i);
  if (!match) return null;
  const host = match[1].toLowerCase().replace(/^(www|m|music)\./, '');
  return ['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)
    ? { host, path: match[2] ?? '/', query: match[3] ?? '' }
    : null;
}
function param(query: string, name: string): string | undefined {
  for (const pair of query.split('&')) {
    const split = pair.indexOf('=');
    try {
      const key = decodeURIComponent(
        (split < 0 ? pair : pair.slice(0, split)).replace(/\+/g, ' ')
      );
      if (key === name)
        return decodeURIComponent(
          (split < 0 ? '' : pair.slice(split + 1)).replace(/\+/g, ' ')
        );
    } catch {
      return undefined;
    }
  }
  return undefined;
}
/** Accept watch, short, live, embed and bare IDs; reject foreign hosts and credentials. */
export function parseYouTubeId(input?: string | null): string | null {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text) return null;
  if (ID.test(text)) return text;
  const url = link(text);
  if (!url) return null;
  const [, kind, value] = url.path.split('/');
  const id =
    url.host === 'youtu.be'
      ? kind
      : kind === 'watch'
        ? param(url.query, 'v')
        : ['shorts', 'embed', 'live', 'v'].includes(kind)
          ? value
          : undefined;
  return id && ID.test(id) ? id : null;
}

/** Seconds in a recognised link's t/start value; malformed values are not guessed. */
export function parseYouTubeStart(input?: string | null): number | undefined {
  const url = link(input);
  if (!url) return undefined;
  const raw = param(url.query, 't') ?? param(url.query, 'start');
  if (!raw) return undefined;
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!m) return undefined;
  const seconds = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : undefined;
}
/** Legacy pure URL builder. Controlled playback uses the official API document. */
export function youTubeEmbedUrl(
  id: string,
  { start, autoplay = false }: { start?: number; autoplay?: boolean } = {}
): string {
  if (!ID.test(id)) throw new Error('Invalid YouTube ID');
  const params: Record<string, string> = {
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    loop: '1',
    playlist: id,
    cc_load_policy: '1',
    ...(autoplay ? { autoplay: '1', mute: '1' } : {}),
    ...(Number.isFinite(start) && start! > 0
      ? { start: String(Math.floor(start!)) }
      : {}),
  };
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `https://www.youtube-nocookie.com/embed/${id}?${query}`;
}
