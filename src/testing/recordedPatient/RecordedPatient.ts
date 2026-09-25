/**
 * Recorded patient: replays real MediaPipe Pose output from people doing
 * physiotherapy exercises (see fixtures/README.md) through the same conversion
 * and enrichment as live camera frames. Where the virtual patient tests logic
 * with perfect, scripted landmarks, this tests it against real model output:
 * tracking noise, depth ambiguity and real human movement.
 *
 * The fixtures hold MediaPipe world landmarks (metres, hip-centred, XY plane
 * parallel to the camera), 12 body joints per frame. They're mapped onto the
 * 33-landmark result contract as an orthographic camera image; landmarks the
 * dataset doesn't include get zero visibility, as MediaPipe reports for points
 * it can't see.
 */
import type { ProcessedPoseData } from '../../types/pose';
import {
  MediaPipeLandmark,
  MediaPipePoseResultBundle,
  mediapipeResultToPoseData,
} from '../../services/pose/mediapipeLandmarks';
import { PoseEnricher } from '../../services/pose/PoseEnricher';
import { MEDIAPIPE_ORDER } from '../virtualPatient/body';

export interface RecordedFixture {
  source: string;
  license: string;
  subject: number;
  exercise: string;
  plane: 'frontal' | 'sagittal';
  evaluatedJoint: string;
  repetitions: number;
  joints: string[];
  fps: number;
  /** [ms, x0, y0, z0, x1, ...] per frame. */
  frames: number[][];
  groundTruthHz: number;
  /** Ground-truth joint amplitude (degrees) from motion capture; null = marker lost. */
  groundTruthDegrees: (number | null)[];
}

/** Image scale: metres to normalized image units (a ~1.7 m person fills ~70% of the frame). */
const METRES_TO_IMAGE = 1 / 2.4;
/** Clock origin (0 reads as "no timestamp" in the pipeline). */
const START_MS = 1_000_000;

export interface RecordedFrame {
  t: number;
  bundle: MediaPipePoseResultBundle;
  pose: ProcessedPoseData;
}

export class RecordedPatient {
  private enricher = new PoseEnricher();

  constructor(readonly fixture: RecordedFixture) {}

  /** One recorded frame as a MediaPipe Pose Landmarker result. */
  bundleAt(index: number): MediaPipePoseResultBundle {
    const row = this.fixture.frames[index];
    const byName = new Map<string, [number, number, number]>();
    this.fixture.joints.forEach((name, j) => {
      byName.set(name, [row[1 + j * 3], row[2 + j * 3], row[3 + j * 3]]);
    });
    const image: MediaPipeLandmark[] = [];
    const world: MediaPipeLandmark[] = [];
    for (const name of MEDIAPIPE_ORDER) {
      const p = byName.get(name);
      const visibility = p ? 0.95 : 0;
      const [x, y, z] = p ?? [0, 0, 0];
      image.push({
        x: 0.5 + x * METRES_TO_IMAGE,
        y: 0.5 + y * METRES_TO_IMAGE,
        z: 0,
        visibility,
        presence: visibility,
      });
      world.push({ x, y, z, visibility });
    }
    return {
      results: [{ landmarks: [image], worldLandmarks: [world] }],
      inferenceTime: 0,
      inputImageWidth: 1000,
      inputImageHeight: 1000,
    };
  }

  /** Every frame, in order, through conversion and enrichment. */
  *frames(): Generator<RecordedFrame> {
    this.enricher.reset();
    const t0 = this.fixture.frames[0]?.[0] ?? 0;
    for (let i = 0; i < this.fixture.frames.length; i++) {
      const t = this.fixture.frames[i][0] - t0;
      const bundle = this.bundleAt(i);
      const raw = mediapipeResultToPoseData(bundle, { timestamp: START_MS + t });
      if (raw) yield { t, bundle, pose: this.enricher.enrich(raw) };
    }
  }
}
