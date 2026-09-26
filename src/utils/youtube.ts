/**
 * YouTube links for exercise videos. Videos are only ever shown through
 * YouTube's official embeddable player (never downloaded or analysed), which
 * is what YouTube's terms allow.
 */

const ID = /^[A-Za-z0-9_-]{11}$/;

/** The video id from a watch, youtu.be, shorts, embed or live link (or a bare id). */
export function parseYouTubeId(input?: string | null): string | null {
  const text = input?.trim();
  if (!text) return null;
  if (ID.test(text)) return text;
  let url: URL;
  try {
    url = new URL(text.includes('://') ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, value] = url.pathname.split('/');
    id =
      kind === 'watch'
        ? url.searchParams.get('v')
        : ['shorts', 'embed', 'live', 'v'].includes(kind)
          ? value ?? null
          : null;
  }
  return id && ID.test(id) ? id : null;
}

/** The start time in seconds from a link's t= / start= parameter, if any. */
export function parseYouTubeStart(input?: string | null): number | undefined {
  try {
    const url = new URL(input?.includes('://') ? input : `https://${input}`);
    const raw = url.searchParams.get('t') ?? url.searchParams.get('start');
    if (!raw) return undefined;
    const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    if (!m) return undefined;
    const seconds = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
    return seconds || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Official embed URL (privacy-enhanced domain). Plays inline, muted, looping,
 * with captions and without related videos from other channels.
 */
export function youTubeEmbedUrl(
  id: string,
  { start, autoplay = false }: { start?: number; autoplay?: boolean } = {}
): string {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    loop: '1',
    playlist: id,
    cc_load_policy: '1',
    ...(autoplay ? { autoplay: '1', mute: '1' } : {}),
    ...(start ? { start: String(start) } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
