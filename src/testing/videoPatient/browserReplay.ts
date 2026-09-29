/** Real RGB replay of the shipped WEB model and movement code, not native accuracy. */
import { WebPoseDetectionService } from '../../services/web/WebPoseDetectionService';
import { MovementRecorder } from '../../services/movement/recorder';
import { analyseSession } from '../../services/movement/analysis';
import { detectCompensations } from '../../services/movement/compensations';
import type { ProcessedPoseData } from '../../types/pose';
import type { BodySide } from '../../types/exercise';

interface ReplayOptions {
  url: string;
  fps: number;
  transform: 'none' | 'mirror' | 'black';
  exerciseId: 'side-arm-raise' | 'shoulder-external-rotation';
}
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
const waitFor = (target: EventTarget, event: string) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out: ${event}`));
    }, 15000);
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error(`Media error: ${event}`));
    };
    function cleanup() {
      clearTimeout(timer);
      target.removeEventListener(event, done);
      target.removeEventListener('error', fail);
    }
    target.addEventListener(event, done, { once: true });
    target.addEventListener('error', fail, { once: true });
  });
async function replay({ url, fps, transform, exerciseId }: ReplayOptions) {
  if (!['side-arm-raise', 'shoulder-external-rotation'].includes(exerciseId))
    throw new Error('Explicit diagnostic exercise required');
  if (!(fps > 0 && fps <= 30)) throw new Error('Explicit sample rate required');
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const ready = waitFor(video, 'loadeddata');
  video.src = url;
  document.body.appendChild(video);
  await ready;
  if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 120)
    throw new Error('Invalid bounded clip');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  const detector = new WebPoseDetectionService();
  detector.setVideoStyle('natural');
  const recorders = (['left', 'right'] as BodySide[]).map(
    (side) => new MovementRecorder({ joint: 'shoulder', side, exerciseId })
  );
  const inference: number[] = [];
  let detected = 0;
  let frames = 0;
  for (let i = 0; i / fps < video.duration - 0.025; i++) {
    const t = i / fps;
    if (Math.abs(video.currentTime - t) > 0.0001) {
      const sought = waitFor(video, 'seeked');
      video.currentTime = t;
      await sought;
    }
    ctx.save();
    if (transform === 'mirror') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    if (transform === 'black') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    const before = performance.now();
    const pose = await detector.detectFromFrame(canvas);
    inference.push(performance.now() - before);
    frames++;
    if (pose) detected++;
    const captured: ProcessedPoseData = pose
      ? { ...pose, timestamp: 1000000 + Math.round(t * 1000) }
      : {
          timestamp: 1000000 + Math.round(t * 1000),
          landmarks: [],
          confidence: 0,
          schemaId: 'mediapipe-33',
          aspectRatio: canvas.width / canvas.height,
        };
    recorders.forEach((rec) => rec.add(captured));
  }
  const sides = recorders.map((rec) => {
    const valid = rec.frames.filter((f) => f.angle !== null);
    const angles = valid.map((f) => f.angle!);
    const views: Record<string, number> = {};
    for (const f of rec.frames) views[f.view] = (views[f.view] ?? 0) + 1;
    const result = analyseSession(
      rec.frames,
      rec.context,
      {},
      { detect: detectCompensations, coaching: 'comfort' }
    );
    return {
      side: rec.context.side,
      measuredFrames: valid.length,
      coverage: valid.length / frames,
      views,
      estimatedFrames: valid.filter((f) => f.estimated).length,
      medianAngle: median(angles),
      reps: result.reps.length,
      result: result.result,
      findings: result.findings,
      numericFinite: valid.every((f) => Number.isFinite(f.angle)),
    };
  });
  detector.stopDetection();
  video.remove();
  if (!frames || sides.some((s) => !s.numericFinite))
    throw new Error('No frames or invalid numbers');
  if (
    transform === 'black' &&
    (detected !== 0 || sides.some((s) => s.result.status !== 'unavailable'))
  )
    throw new Error('Negative control produced a pose/measurement');
  return {
    provider:
      '@mediapipe/pose web modelComplexity=1, smoothing enabled, segmentation disabled',
    scope:
      'Diagnostic source-labelled shoulder replay, not a clinical prescription or sleeper assessment',
    exerciseId,
    transform,
    sourceDurationSeconds: video.duration,
    width: canvas.width,
    height: canvas.height,
    fps,
    frames,
    poseFrames: detected,
    poseCoverage: detected / frames,
    medianInferenceMilliseconds: median(inference),
    sides,
  };
}
(window as unknown as { replayPhysioVideo: typeof replay }).replayPhysioVideo = replay;
