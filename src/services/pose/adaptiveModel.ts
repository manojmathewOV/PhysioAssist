/**
 * Runtime model selection: start on BlazePose Full and step down to Lite when the
 * device can't sustain Full at the requested detection rate. Decided from measured
 * inference times, so it adapts to the actual device (and to thermal throttling)
 * instead of guessing a device tier.
 *
 * Benchmark (docs/benchmarks/POSE_MODELS.md): Lite is ~20% faster than Full with
 * ~2.3° more mean angle error.
 */
export const BLAZEPOSE_FULL_MODEL_FILE = 'pose_landmarker_full.task';
export const BLAZEPOSE_LITE_MODEL_FILE = 'pose_landmarker_lite.task';

/** Frames to observe before deciding. */
export const MODEL_DECISION_SAMPLES = 30;

/**
 * Per-frame inference budget for a target detection rate: 80% of the frame
 * interval (leaving time for JS-side processing), clamped to 25-80 ms.
 */
export function inferenceBudgetMs(targetFps: number): number {
  const interval = 1000 / Math.max(1, targetFps);
  return Math.min(80, Math.max(25, interval * 0.8));
}

/** True when the median inference time over the window exceeds the budget. */
export function shouldStepDownModel(
  inferenceTimesMs: number[],
  budgetMs: number
): boolean {
  if (inferenceTimesMs.length < MODEL_DECISION_SAMPLES) {
    return false;
  }
  const sorted = [...inferenceTimesMs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return median > budgetMs;
}
