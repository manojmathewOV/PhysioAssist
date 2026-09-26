/**
 * Video patient: replays pose-model output extracted from real smartphone
 * video (scripts/fixtures/video_extract.py) through the app's pipeline.
 *
 * Each frame is the result the app's MediaPipe bridge delivers (33 image
 * landmarks with visibility and presence, 33 world landmarks, frame size), so
 * everything after pose inference runs exactly as on a phone. Frames where the
 * model found no one are passed on as empty results, as live.
 */
import type { ProcessedPoseData } from '../../types/pose';
import {
  MediaPipePoseResultBundle,
  mediapipeResultToPoseData,
} from '../../services/pose/mediapipeLandmarks';
import { PoseEnricher } from '../../services/pose/PoseEnricher';

/** [ms, inferenceMs, image [x,y,z,visibility,presence][] | null, world [x,y,z][] | null] */
export type VideoFrame = [number, number, number[][] | null, number[][] | null];

export interface VideoLandmarks {
  video: string;
  transform: string;
  width: number;
  height: number;
  fps: number;
  model: string;
  modelMd5: string;
  mediapipe: string;
  frames: VideoFrame[];
}

/** Clock origin (0 reads as "no timestamp" in the pipeline). */
const START_MS = 1_000_000;

export interface VideoPatientFrame {
  t: number;
  inferenceMs: number;
  /** null when the model found no person in this frame. */
  pose: ProcessedPoseData | null;
}

export class VideoPatient {
  private enricher = new PoseEnricher();

  constructor(readonly data: VideoLandmarks) {}

  bundleAt(index: number): MediaPipePoseResultBundle {
    const [, inferenceMs, image, world] = this.data.frames[index];
    return {
      results: image
        ? [
            {
              landmarks: [
                image.map(([x, y, z, visibility, presence]) => ({
                  x,
                  y,
                  z,
                  visibility,
                  presence,
                })),
              ],
              worldLandmarks: [
                (world ?? []).map(([x, y, z], i) => ({
                  x,
                  y,
                  z,
                  visibility: image[i][3],
                })),
              ],
            },
          ]
        : [],
      inferenceTime: inferenceMs,
      inputImageWidth: this.data.width,
      inputImageHeight: this.data.height,
    };
  }

  *frames(): Generator<VideoPatientFrame> {
    this.enricher.reset();
    for (let i = 0; i < this.data.frames.length; i++) {
      const [t, inferenceMs] = this.data.frames[i];
      const raw = mediapipeResultToPoseData(this.bundleAt(i), {
        timestamp: START_MS + t,
      });
      yield { t, inferenceMs, pose: raw ? this.enricher.enrich(raw) : null };
    }
  }
}
