import { runInNewContext } from 'vm';
import {
  playerDocument,
  playerHeight,
  readPlayerEvent,
  PLAYER_SCOPE,
} from '../playerDocument';
const ORIGIN = 'https://org.example.physio';
const ID = 'M7lc1UVf-VE';
function harness(html = playerDocument(ID, 8, ORIGIN, 'test')) {
  const events: any[] = [];
  const handlers: Record<string, (e?: any) => void> = {};
  const docHandlers: Record<string, () => void> = {};
  let yt: any;
  let state = 2;
  let seconds = 8;
  let interval: (() => void) | undefined;
  const parent = { postMessage: (raw: string) => events.push(JSON.parse(raw)) };
  const window: any = {
    parent,
    addEventListener: (n: string, fn: any) => {
      handlers[n] = fn;
    },
  };
  const player = {
    getCurrentTime: () => seconds,
    getPlayerState: () => state,
    playVideo: jest.fn(() => {
      state = 1;
      yt.events.onStateChange({ data: 1 });
    }),
    pauseVideo: jest.fn(() => {
      state = 2;
      yt.events.onStateChange({ data: 2 });
    }),
    seekTo: jest.fn((t: number) => {
      seconds = t;
    }),
    destroy: jest.fn(),
  };
  const document = {
    hidden: false,
    createElement: () => ({}),
    head: { appendChild: jest.fn() },
    addEventListener: (n: string, fn: () => void) => {
      docHandlers[n] = fn;
    },
  };
  const script = html.match(/<script>([\s\S]*)<\/script>/)![1];
  runInNewContext(script, {
    window,
    document,
    YT: {
      Player: function (_: any, config: any) {
        yt = config;
        return player;
      },
    },
    setInterval: (fn: () => void) => {
      interval = fn;
      return 1;
    },
    clearInterval: () => {
      interval = undefined;
    },
  });
  window.onYouTubeIframeAPIReady();
  return {
    ready: () => yt.events.onReady(),
    command: window.physioVideo.command,
    player,
    events,
    document,
    visibility: docHandlers.visibilitychange,
    message: handlers.message,
    parent,
    close: handlers.pagehide,
    tick: () => interval?.(),
    error: (code: number) => yt.events.onError({ data: code }),
    denied: () => yt.events.onAutoplayBlocked(),
    options: () => yt,
    advance: (t: number) => {
      seconds = t;
    },
  };
}
describe('official player control contract (synthetic API)', () => {
  it('does not autoplay or turn readiness into activity', () => {
    const h = harness();
    h.ready();
    expect(h.player.playVideo).not.toHaveBeenCalled();
    expect(h.events[0].state).toBe('ready');
    expect(h.options().playerVars.autoplay).toBe(0);
  });
  it('applies Pause before readiness without a late start', () => {
    const h = harness();
    h.command({ type: 'suspend', value: true });
    h.ready();
    h.command({ type: 'play' });
    expect(h.player.playVideo).not.toHaveBeenCalled();
  });
  it('pauses and resumes at the same point without loading or seeking again', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'play' });
    h.advance(19);
    h.command({ type: 'suspend', value: true });
    expect(h.player.pauseVideo).toHaveBeenCalledTimes(1);
    h.command({ type: 'suspend', value: false });
    expect(h.player.playVideo).toHaveBeenCalledTimes(2);
    expect(h.player.seekTo).not.toHaveBeenCalled();
    expect(h.events.at(-1).seconds).toBe(19);
  });
  it('does not restart a manually paused video on show or resume', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'play' });
    h.command({ type: 'pause' });
    h.command({ type: 'suspend', value: true });
    h.command({ type: 'suspend', value: false });
    expect(h.player.playVideo).toHaveBeenCalledTimes(1);
  });
  it('blocks Play and Replay during app pause', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'play' });
    h.command({ type: 'replay' });
    expect(h.player.playVideo).not.toHaveBeenCalled();
    expect(h.player.seekTo).not.toHaveBeenCalled();
  });
  it('replays only on explicit action and uses the linked start', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'replay' });
    expect(h.player.seekTo).toHaveBeenCalledWith(8, true);
  });
  it('backgrounding pauses; app pause prevents foreground restart', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'play' });
    h.document.hidden = true;
    h.visibility();
    expect(h.player.pauseVideo).toHaveBeenCalled();
    h.command({ type: 'suspend', value: true });
    h.document.hidden = false;
    h.visibility();
    expect(h.player.playVideo).toHaveBeenCalledTimes(1);
  });
  it('rejects foreign-window, foreign-origin and wrong-channel commands', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    const data = { scope: PLAYER_SCOPE, channel: 'test', command: { type: 'play' } };
    h.message({ source: {}, origin: ORIGIN, data });
    h.message({ source: h.parent, origin: 'https://foreign.test', data });
    h.message({ source: h.parent, origin: ORIGIN, data: { ...data, channel: 'stale' } });
    expect(h.player.playVideo).not.toHaveBeenCalled();
    h.message({ source: h.parent, origin: ORIGIN, data });
    expect(h.player.playVideo).toHaveBeenCalledTimes(1);
  });
  it('reports actual errors and autoplay denial instead of a successful play', () => {
    const h = harness();
    h.error(153);
    h.denied();
    expect(h.events.map((e) => e.state)).toEqual(['error', 'blocked']);
  });
  it('releases its timer and ignores commands once the document exits', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'play' });
    h.close();
    const n = h.events.length;
    h.tick();
    expect(h.events).toHaveLength(n);
    h.command({ type: 'play' });
    expect(h.player.playVideo).toHaveBeenCalledTimes(1);
  });
  it.each([200, 224, 294, 390, 820])(
    'does not shrink player height below 200 at width %i',
    (width) => {
      expect(playerHeight(width)).toBeGreaterThanOrEqual(200);
      expect(playerHeight(width, true)).toBeGreaterThanOrEqual(playerHeight(width));
    }
  );
  it('rejects malformed identity and cross-instance bridge results', () => {
    expect(() => playerDocument('bad', 0, ORIGIN, 'test')).toThrow();
    expect(() => playerDocument(ID, 0, 'javascript:alert(1)', 'test')).toThrow();
    const raw = JSON.stringify({
      scope: PLAYER_SCOPE,
      channel: 'test',
      state: 'playing',
      seconds: 8,
    });
    expect(readPlayerEvent(raw, 'test')?.seconds).toBe(8);
    expect(readPlayerEvent(raw, 'old')).toBeNull();
    expect(readPlayerEvent('{}', 'test')).toBeNull();
  });
});

describe('retry and overlapping interruptions', () => {
  it('resumes a retry at the last observation but replays from the assigned start', () => {
    const h = harness(playerDocument(ID, 8, ORIGIN, 'test', 31));
    h.ready();
    expect(h.options().playerVars.start).toBe(31);
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'replay' });
    expect(h.player.seekTo).toHaveBeenCalledWith(8, true);
  });
  it('remembers playing intent across app pause followed by backgrounding', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'play' });
    h.command({ type: 'suspend', value: true });
    h.document.hidden = true;
    h.visibility();
    h.document.hidden = false;
    h.visibility();
    expect(h.player.playVideo).toHaveBeenCalledTimes(1);
    h.command({ type: 'suspend', value: false });
    expect(h.player.playVideo).toHaveBeenCalledTimes(2);
  });
  it('duplicate hidden observations cannot clear a pending resume', () => {
    const h = harness();
    h.ready();
    h.command({ type: 'suspend', value: false });
    h.command({ type: 'play' });
    h.document.hidden = true;
    h.visibility();
    h.visibility();
    h.document.hidden = false;
    h.visibility();
    expect(h.player.playVideo).toHaveBeenCalledTimes(2);
  });
});
