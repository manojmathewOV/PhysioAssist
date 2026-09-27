/**
 * Model-agnostic per-frame enrichment shared by every pose source (BlazePose via
 * react-native-mediapipe, MoveNet via PoseDetectionServiceV2, web MediaPipe).
 *
 * Adds view orientation, a quality score and cached anatomical reference frames,
 * all computed from aspect-corrected measurement landmarks so downstream services
 * (goniometer, clinical measurements, compensation detection) see one consistent
 * coordinate space regardless of model or camera aspect ratio.
 */
import type { PoseLandmark, ProcessedPoseData } from '../../types/pose';
import { OrientationClassifier } from './OrientationClassifier';
import { AnatomicalFrameCache } from '../biomechanics/AnatomicalFrameCache';
import { AnatomicalReferenceService } from '../biomechanics/AnatomicalReferenceService';
import { findLandmark } from './landmarkLookup';
import { getMeasurementLandmarks } from './measurementLandmarks';

const TORSO_LANDMARKS = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];

/** Visibility (70%) blended with how many torso landmarks are visible (30%). */
export function calculateQualityScore(landmarks: PoseLandmark[]): number {
  if (landmarks.length === 0) {
    return 0;
  }
  const visibility =
    landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;
  const torsoVisible = TORSO_LANDMARKS.filter(
    (name) => (findLandmark(landmarks, name)?.visibility ?? 0) > 0.5
  ).length;
  const score = visibility * 0.7 + (torsoVisible / TORSO_LANDMARKS.length) * 0.3;
  return Math.min(1, Math.max(0, score));
}

export class PoseEnricher {
  private readonly orientationClassifier = new OrientationClassifier(5);
  private readonly frameCache = new AnatomicalFrameCache(60, 16, 2);
  private readonly anatomicalService = new AnatomicalReferenceService();

  enrich(pose: ProcessedPoseData): ProcessedPoseData {
    const landmarks = getMeasurementLandmarks(pose);
    return {
      ...pose,
      viewOrientation:
        this.orientationClassifier.classifyWithHistory(landmarks).orientation,
      qualityScore: calculateQualityScore(pose.landmarks),
      cachedAnatomicalFrames: this.computeFrames(landmarks),
    };
  }

  /** Clear temporal state (orientation history, frame cache), e.g. between sessions. */
  reset(): void {
    this.orientationClassifier.clearHistory();
    this.frameCache.clear();
  }

  getFrameCacheStats() {
    return this.frameCache.getStats();
  }

  private computeFrames(
    landmarks: PoseLandmark[]
  ): NonNullable<ProcessedPoseData['cachedAnatomicalFrames']> {
    const global = this.frameCache.get('global', landmarks, (lm) =>
      this.anatomicalService.calculateGlobalFrame(lm)
    );
    const thorax = this.frameCache.get('thorax', landmarks, (lm) =>
      this.anatomicalService.calculateThoraxFrame(lm, global)
    );
    const humerus = (side: 'left' | 'right') => {
      const shoulder = findLandmark(landmarks, `${side}_shoulder`);
      const elbow = findLandmark(landmarks, `${side}_elbow`);
      return (shoulder?.visibility ?? 0) > 0.5 && (elbow?.visibility ?? 0) > 0.5
        ? this.frameCache.get(`${side}_humerus`, landmarks, (lm) =>
            this.anatomicalService.calculateHumerusFrame(lm, side, thorax)
          )
        : undefined;
    };

    return {
      global,
      thorax,
      // Simplified pelvis: hip-centred global frame (full pelvis frame not implemented yet)
      pelvis: global,
      left_humerus: humerus('left'),
      right_humerus: humerus('right'),
      // Forearm frames not implemented yet
      left_forearm: undefined,
      right_forearm: undefined,
    };
  }
}
