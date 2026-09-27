import { EXERCISES } from '../../../constants/exercises';
import {
  applyPlan,
  clinicalAngle,
  goalDegreesOf,
  interiorAngle,
  trackedJoint,
} from '../exercisePlan';

describe('exercise plan', () => {
  it('converts between interior and clinical angles', () => {
    expect(clinicalAngle('knee', 90)).toBe(90);
    expect(clinicalAngle('elbow', 40)).toBe(140);
    expect(clinicalAngle('shoulder', 120)).toBe(120);
    expect(interiorAngle('elbow', clinicalAngle('elbow', 35))).toBe(35);
  });

  it('tracks only the joint of interest on the chosen side', () => {
    const ex = applyPlan(EXERCISES.squat, { joint: 'knee', side: 'right' });
    for (const phase of ex.phases) {
      expect(phase.jointRequirements.map((r) => r.joint)).toEqual(['right_knee']);
    }
    expect(trackedJoint(ex)).toBe('right_knee');
  });

  it('mirrors a one-sided rule to the chosen side', () => {
    const ex = applyPlan(EXERCISES.hamstringStretch, { joint: 'hip', side: 'right' });
    expect(ex.phases[0].jointRequirements.map((r) => r.joint)).toEqual(['right_hip']);
  });

  it('applies the prescribed goal, limit, reps and hold to the goal phase', () => {
    const ex = applyPlan(EXERCISES.bicepCurl, {
      joint: 'elbow',
      side: 'left',
      goalDegrees: 100,
      limitDegrees: 120,
      reps: 8,
      holdSeconds: 2,
    });
    const goal = ex.phases[1];
    // Elbow flexion 100-120° = interior 60-80°
    expect(goal.jointRequirements[0]).toMatchObject({ minAngle: 60, maxAngle: 80 });
    expect(goal.holdDuration).toBe(2000);
    expect(ex.targetRepetitions).toBe(8);
    expect(ex.safetyLimit).toEqual({
      joint: 'left_elbow',
      kind: 'elbow',
      maxDegrees: 120,
    });
    expect(goalDegreesOf(ex)).toBe(100);
    // The start phase is unchanged apart from the side
    expect(ex.phases[0].jointRequirements[0]).toMatchObject({
      minAngle: 160,
      maxAngle: 180,
    });
  });

  it("doesn't prescribe a goal for an exercise that trains another joint", () => {
    const ex = applyPlan(EXERCISES.bicepCurl, {
      joint: 'shoulder',
      side: 'left',
      goalDegrees: 90,
    });
    expect(ex.phases[1].jointRequirements[0]).toMatchObject({
      joint: 'left_elbow',
      minAngle: 30,
    });
    expect(ex.safetyLimit).toBeUndefined();
  });

  it('leaves an exercise unchanged without a plan', () => {
    expect(applyPlan(EXERCISES.squat, null)).toBe(EXERCISES.squat);
    expect(goalDegreesOf(EXERCISES.armRaise)).toBe(140);
  });
});
