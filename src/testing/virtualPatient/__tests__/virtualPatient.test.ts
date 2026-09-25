/**
 * Camera-free gate tests: a virtual patient plays each scenario through the real
 * pipeline (MediaPipe result -> conversion -> enrichment -> angles -> rep state
 * machine) and the app must produce the scenario's expected outcome.
 */
import { EXERCISES } from '../../../constants/exercises';
import { ExerciseValidationService } from '../../../services/exerciseValidationService';
import { GoniometerService } from '../../../services/goniometerService';
import { getMeasurementLandmarks } from '../../../services/pose/measurementLandmarks';
import { mediapipeResultToPoseData } from '../../../services/pose/mediapipeLandmarks';
import { BodyPose, STANDING, renderBody } from '../body';
import { SCENARIOS } from '../scenarios';
import { VirtualPatient } from '../VirtualPatient';

const exerciseById = (id: string) => Object.values(EXERCISES).find((e) => e.id === id)!;

const measure = (body: BodyPose) => {
  const pose = mediapipeResultToPoseData(renderBody(body), { timestamp: 0 })!;
  // Fresh, unsmoothed service: each pose is measured on its own
  const angles = new GoniometerService({ smoothingWindow: 1 }).calculateAllJointAngles(
    getMeasurementLandmarks(pose)
  );
  return (joint: string) => angles.get(joint)!.angle;
};

describe('virtual patient body (geometry gate)', () => {
  it.each([
    ['side', { leftElbow: 40, rightElbow: 90, leftShoulder: 60, rightShoulder: 20 }],
    ['side', { leftKnee: 90, rightKnee: 90, leftHip: 90, rightHip: 90 }],
    ['side', { leftKnee: 120, rightKnee: 120, leftHip: 150, rightHip: 150 }],
    ['front', { leftShoulder: 90, rightShoulder: 170, leftElbow: 90, rightElbow: 170 }],
  ] as const)('%s view reproduces the requested joint angles %j', (view, angles) => {
    const at = measure({ ...STANDING, view, ...angles });
    const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    for (const [joint, expected] of Object.entries(angles)) {
      expect(at(snake(joint))).toBeCloseTo(expected, 0);
    }
  });

  it('emits the MediaPipe result contract: 33 image + 33 world landmarks', () => {
    const bundle = renderBody(STANDING);
    const [result] = bundle.results;
    expect(result.landmarks[0]).toHaveLength(33);
    expect(result.worldLandmarks[0]).toHaveLength(33);
    for (const lm of result.landmarks[0]) {
      expect(lm.x).toBeGreaterThanOrEqual(0);
      expect(lm.x).toBeLessThanOrEqual(1);
      expect(lm.y).toBeGreaterThanOrEqual(0);
      expect(lm.y).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic for a given seed', () => {
    const scenario = SCENARIOS.find((s) => s.id === 'bicep-curl-jitter')!;
    const run = () =>
      [...new VirtualPatient(scenario, { seed: 7 }).frames()]
        .slice(0, 20)
        .map((f) => f.pose.landmarks[15].x);
    expect(run()).toEqual(run());
  });
});

describe('virtual patient scenarios (state machine + feedback gate)', () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))('%s', (_id, scenario) => {
    const service = new ExerciseValidationService();
    service.startExercise(exerciseById(scenario.exerciseId));
    let sawEstimated = false;
    let maxReps = 0;
    for (const frame of new VirtualPatient(scenario).frames()) {
      const result = service.validatePose(frame.pose);
      sawEstimated ||= Boolean(result.estimatedJoints?.length);
      maxReps = Math.max(maxReps, service.getCurrentState().repetitionCount);
    }
    expect(service.getCurrentState().repetitionCount).toBe(scenario.expect.reps);
    // Counts never go backwards or overshoot
    expect(maxReps).toBe(scenario.expect.reps);
    expect(sawEstimated).toBe(Boolean(scenario.expect.estimatedJoints));
  });
});

describe('virtual patient feedback gate', () => {
  it('tells a patient with limited range to bend further, not less', () => {
    const scenario = SCENARIOS.find((s) => s.id === 'bicep-curl-limited')!;
    const service = new ExerciseValidationService();
    service.startExercise(exerciseById(scenario.exerciseId));
    const curlErrors = new Set<string>();
    for (const frame of new VirtualPatient(scenario).frames()) {
      const result = service.validatePose(frame.pose);
      if (result.phase === 'curl') result.errors.forEach((e) => curlErrors.add(e));
    }
    expect([...curlErrors].sort()).toEqual([
      'Bend left_elbow more',
      'Bend right_elbow more',
    ]);
  });
});
