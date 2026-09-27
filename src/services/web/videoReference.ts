/**
 * Builds a reference movement profile from a video file the physio provides
 * (web only). The video is played frame by frame into the same MediaPipe
 * pipeline as the camera, and only the resulting numbers are kept: the video
 * itself is never uploaded or stored.
 *
 * YouTube links can't be analysed: YouTube's terms don't allow downloading and
 * its player gives no access to the frames. Use a file the clinic owns, or
 * record the demonstration in the app.
 */
import { webPoseDetectionService } from './WebPoseDetectionService';
import { MovementRecorder } from '../movement/recorder';
import { MovementProfile, buildReference } from '../movement/analysis';
import type { MovementContext } from '../movement/types';

/** Analysis frame rate: plenty for rehab-speed movement, 3x faster than 30 fps. */
const SAMPLE_FPS = 10;
/** Longest video analysed (seconds). */
const MAX_SECONDS = 180;

const seek = (video: HTMLVideoElement, time: number) =>
  new Promise<void>((resolve) => {
    video.addEventListener('seeked', () => resolve(), { once: true });
    video.currentTime = time;
  });

export async function referenceFromVideoFile(
  file: File,
  context: MovementContext,
  onProgress?: (fraction: number) => void
): Promise<MovementProfile | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('This video could not be opened.'));
    });
    const recorder = new MovementRecorder(context);
    const duration = Math.min(video.duration || 0, MAX_SECONDS);
    for (let t = 0; t < duration; t += 1 / SAMPLE_FPS) {
      await seek(video, t);
      const pose = await webPoseDetectionService.detectFromFrame(video);
      if (pose) recorder.add({ ...pose, timestamp: Math.round(t * 1000) + 1 });
      onProgress?.(t / duration);
    }
    onProgress?.(1);
    return buildReference(recorder.frames);
  } finally {
    URL.revokeObjectURL(url);
  }
}
