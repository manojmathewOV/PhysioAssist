/**
 * Real-human gate: MediaPipe Pose output recorded from healthy adults doing
 * physiotherapy exercises (Clemente et al. 2024, CC BY 4.0; see
 * fixtures/README.md) goes through the unchanged session pipeline and is
 * compared with synchronised motion capture.
 *
 * Healthy people performing correctly should be counted like motion capture,
 * seen from the right camera view, and not flagged for compensations.
 */
import fs from 'fs';
import path from 'path';
import { analyseRecording, RecordingResult } from '../analyseRecording';
import { loadFixture } from '../loadFixture';

const dir = path.join(__dirname, '../fixtures');
const results: RecordingResult[] = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json.gz'))
  .sort()
  .map((f) => analyseRecording(loadFixture(path.join(dir, f))));

const named = (r: RecordingResult) => `s${r.fixture.subject} ${r.fixture.exercise}`;
const of = (...exercises: string[]) =>
  results
    .filter((r) => exercises.includes(r.fixture.exercise))
    .map((r) => [named(r), r] as const);

describe('recorded patients (real MediaPipe output vs motion capture)', () => {
  it('loads every fixture', () => {
    expect(results).toHaveLength(16);
  });

  // Seated knee extension here was filmed at 35°; it needs a side view, so the
  // app must say so instead of counting and judging range (tested below)
  it.each(
    results
      .filter((r) => r.fixture.exercise !== 'seated_knee_extension')
      .map((r) => [named(r), r] as const)
  )('%s: counts repetitions like motion capture', (_name, r) => {
    expect(Math.abs(r.analysis.reps.length - r.groundTruthReps)).toBeLessThanOrEqual(1);
  });

  it.each(of('shoulder_abduction', 'shoulder_press', 'hip_abduction'))(
    '%s: filmed facing the camera, seen as front',
    (_name, r) => {
      expect(r.view).toBe('front');
    }
  );

  it.each(of('squat', 'march', 'elbow_flexion', 'seated_knee_extension'))(
    '%s: filmed at 35°, seen as oblique (front and side checks stay off)',
    (_name, r) => {
      expect(r.view).toBe('oblique');
    }
  );

  it.each(of('seated_knee_extension'))(
    '%s: filmed at an angle, asks for a side view and judges no range',
    (_name, r) => {
      const ids = r.analysis.findings.map((f) => f.id);
      expect(ids).toContain('camera_view');
      expect(ids).not.toContain('reduced_range');
    }
  );

  it.each(of('seated_knee_extension'))('%s: seen sitting', (_name, r) => {
    const postures = r.analysis.reps.map((rep) => rep.baseline.posture);
    expect(postures.filter((p) => p === 'seated').length).toBeGreaterThanOrEqual(
      postures.length - 1
    );
  });

  it.each(
    of(
      'shoulder_abduction',
      'shoulder_flexion',
      'shoulder_press',
      'squat',
      'seated_knee_extension'
    )
  )('%s: no compensation flagged for a healthy person', (_name, r) => {
    expect(r.analysis.findings.filter((f) => f.severity === 'flag')).toEqual([]);
  });

  // Shoulder flexion filmed at 35° reads 5-23° high (depth ambiguity, as the
  // dataset's authors also found): it needs a true side view, so it's reported
  // in the benchmark rather than held to this bound
  it.each(of('shoulder_abduction', 'shoulder_press', 'squat'))(
    '%s: peak range within 20° of motion capture',
    (_name, r) => {
      expect(Math.abs(r.peak - r.groundTruthPeak)).toBeLessThanOrEqual(20);
    }
  );
});
