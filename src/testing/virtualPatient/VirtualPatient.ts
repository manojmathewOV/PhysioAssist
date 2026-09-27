/**
 * Virtual patient pose provider.
 *
 * Plays a scenario as a stream of MediaPipe Pose Landmarker result bundles and
 * runs them through the same conversion and enrichment as live camera frames
 * (mediapipeResultToPoseData -> PoseEnricher), so everything downstream (angles,
 * rep counting, feedback, overlay) is exercised exactly as on a device.
 */
import type { ProcessedPoseData } from '../../types/pose';
import {
  MediaPipePoseResultBundle,
  mediapipeResultToPoseData,
} from '../../services/pose/mediapipeLandmarks';
import { PoseEnricher } from '../../services/pose/PoseEnricher';
import { renderBody } from './body';
import { Scenario } from './scenarios';
import { sampleTimeline, seededRandom, timelineEnd } from './timeline';

export interface VirtualFrame {
  /** Milliseconds since the scenario started. */
  t: number;
  bundle: MediaPipePoseResultBundle;
  pose: ProcessedPoseData;
}

export interface VirtualPatientOptions {
  fps?: number;
  seed?: number;
  /** Clock origin added to frame timestamps (must be > 0: 0 reads as "no timestamp"). */
  startTime?: number;
}

export class VirtualPatient {
  readonly fps: number;
  readonly durationMs: number;
  private readonly seed: number;
  private readonly startTime: number;
  private rand: () => number;
  private enricher = new PoseEnricher();
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    readonly scenario: Scenario,
    { fps = 30, seed = 1, startTime = 1_000_000 }: VirtualPatientOptions = {}
  ) {
    this.fps = fps;
    this.seed = seed;
    this.startTime = startTime;
    this.rand = seededRandom(seed);
    this.durationMs = timelineEnd(scenario.timeline) + 1000;
  }

  /** The frame at time t (ms). Call in increasing t for reproducible noise. */
  frameAt(t: number): VirtualFrame {
    const body = sampleTimeline(this.scenario.base, this.scenario.timeline, t);
    const bundle = renderBody(body, this.scenario.effects?.(t, this.rand));
    const raw = mediapipeResultToPoseData(bundle, { timestamp: this.startTime + t });
    if (!raw) throw new Error('virtual patient produced no pose');
    return { t, bundle, pose: this.enricher.enrich(raw) };
  }

  /** Every frame of the scenario at the configured frame rate. */
  *frames(): Generator<VirtualFrame> {
    this.reset();
    const step = 1000 / this.fps;
    for (let i = 0; i * step <= this.durationMs; i++) {
      yield this.frameAt(i * step);
    }
  }

  reset(): void {
    this.rand = seededRandom(this.seed);
    this.enricher.reset();
  }

  /** Stream frames in real time (practice mode). Loops unless `loop` is false. */
  start(onPose: (pose: ProcessedPoseData) => void, { loop = true } = {}): void {
    this.stop();
    this.reset();
    const step = 1000 / this.fps;
    let started = Date.now();
    this.timer = setInterval(() => {
      let t = Date.now() - started;
      if (t > this.durationMs) {
        if (!loop) {
          this.stop();
          return;
        }
        this.reset();
        started = Date.now();
        t = 0;
      }
      const frame = this.frameAt(t);
      onPose({ ...frame.pose, timestamp: Date.now() });
    }, step);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  isActive(): boolean {
    return this.timer !== undefined;
  }
}
