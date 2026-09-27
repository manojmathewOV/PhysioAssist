/** Official IFrame API only. No video bytes, pixels or YouTube downloads. */
export const PLAYER_SCOPE = 'physio-video/1';
export type PlayerState =
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'blocked'
  | 'error';
export type PlayerCommand =
  | { type: 'suspend'; value: boolean }
  | { type: 'play' | 'pause' | 'replay' };
export interface PlayerEvent {
  scope: string;
  channel: string;
  state: PlayerState;
  seconds: number;
  error?: number;
}
export function readPlayerEvent(raw: string, channel: string): PlayerEvent | null {
  try {
    const e = JSON.parse(raw);
    if (
      e?.scope !== PLAYER_SCOPE ||
      e.channel !== channel ||
      !['ready', 'playing', 'paused', 'ended', 'blocked', 'error'].includes(e.state) ||
      !Number.isFinite(e.seconds) ||
      e.seconds < 0
    )
      return null;
    return e;
  } catch {
    return null;
  }
}
export function playerHeight(width: number, expanded = false): number {
  return Math.max(200, Math.round(Math.max(200, width) * (expanded ? 3 / 4 : 9 / 16)));
}
export function playerDocument(
  videoId: string,
  start: number,
  origin: string,
  channel: string,
  resumeAt: number = start
): string {
  if (!/^[\w-]{11}$/.test(videoId) || !/^https?:\/\/[^\s/]+(?::\d+)?$/.test(origin))
    throw new Error('Invalid player identity');
  const config = JSON.stringify({
    videoId,
    start: Number.isFinite(start) && start >= 0 ? Math.floor(start) : 0,
    resumeAt: Number.isFinite(resumeAt) && resumeAt >= 0 ? Math.floor(resumeAt) : 0,
    origin,
    channel,
    scope: PLAYER_SCOPE,
  }).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;width:100%;height:100%;background:#000}#player,iframe{border:0;width:100%;height:100%}</style></head><body><div id="player"></div><script>
(function(c){
  var player,ready=false,externalPause=true,pageHidden=Boolean(document.hidden),resume=false,lastState='loading',timer;
  function blocked(){return externalPause || pageHidden;}
  function emit(state,error){lastState=state;var seconds=ready?player.getCurrentTime():c.start;
    var value=JSON.stringify({scope:c.scope,channel:c.channel,state:state,seconds:Number.isFinite(seconds)?seconds:0,error:error});
    if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(value);else window.parent.postMessage(value,c.origin);
  }
  function suspend(value){var before=blocked();externalPause=value;applySuspension(before);}
  function applySuspension(before){if(!ready)return;var now=blocked();
    if(now&&!before){resume=[1,3].indexOf(player.getPlayerState())>=0;player.pauseVideo();}
    else if(!now&&before&&resume){resume=false;player.playVideo();}
  }
  function command(cmd){
    if(!cmd)return;if(cmd.type==='suspend'&&typeof cmd.value==='boolean'){suspend(cmd.value);return;}
    if(!ready)return;
    if(cmd.type==='pause'){resume=false;player.pauseVideo();}
    if((cmd.type==='play'||cmd.type==='replay')&&!blocked()){
      if(cmd.type==='replay')player.seekTo(c.start,true);player.playVideo();
    }
  }
  window.physioVideo={command:command};
  window.addEventListener('message',function(e){
    if(e.source!==window.parent||e.origin!==c.origin)return;
    var data;try{data=typeof e.data==='string'?JSON.parse(e.data):e.data;}catch(_){return;}
    if(data&&data.scope===c.scope&&data.channel===c.channel)command(data.command);
  });
  document.addEventListener('visibilitychange',function(){
    var before=blocked();pageHidden=Boolean(document.hidden);applySuspension(before);
  });
  window.onYouTubeIframeAPIReady=function(){player=new YT.Player('player',{host:'https://www.youtube-nocookie.com',videoId:c.videoId,
    playerVars:{playsinline:1,rel:0,cc_load_policy:1,autoplay:0,origin:c.origin,start:c.resumeAt},
    events:{onReady:function(){ready=true;emit('ready');},onStateChange:function(e){
      if(e.data===1&&blocked()){player.pauseVideo();return;}
      var state={0:'ended',1:'playing',2:'paused',3:'loading',5:'ready'}[e.data];if(state&&state!=='loading')emit(state);
    },onError:function(e){emit('error',e.data);},onAutoplayBlocked:function(){emit('blocked');}}});};
  var script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=function(){emit('error');};document.head.appendChild(script);
  timer=setInterval(function(){if(ready&&lastState==='playing')emit('playing');},500);
  window.addEventListener('pagehide',function(){clearInterval(timer);ready=false;});
})(${config});</script></body></html>`;
}
