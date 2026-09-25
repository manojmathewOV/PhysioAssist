/**
 * Shoulder external rotation with the elbow at the side, facing the camera:
 * the approximate 3D rotation angle, repetitions, and the dependable checks
 * (elbow staying at the side, trunk not turning).
 */
import { BodyPose, STANDING } from '../../../testing/virtualPatient/body';
import { JointAngles, repetitions } from '../../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../../testing/virtualPatient/VirtualPatient';
import type { Scenario } from '../../../testing/virtualPatient/scenarios';
import { analyseSession } from '../analysis';
import { detectCompensations } from '../compensations';
import { MovementRecorder } from '../recorder';
import type { MovementContext } from '../types';

const ER: MovementContext = {
  joint: 'shoulder',
  side: 'left',
  exerciseId: 'shoulder-external-rotation',
};

const FACING: BodyPose = {
  ...STANDING,
  view: 'front',
  leftShoulder: 10,
  leftElbow: 90,
  leftForearmForward: 1,
};

/** Three rotations from forward to `top` degrees outward (and back). */
const rotate = (top = 60, extra: JointAngles = {}, base = FACING): Scenario => ({
  id: 'er',
  exerciseId: 'shoulder-external-rotation',
  title: '',
  description: '',
  base,
  timeline: repetitions({
    rest: { leftShoulderRotation: 0, leftShoulder: 10, trunkRotation: 0 },
    target: { leftShoulderRotation: top, ...extra },
    reps: 3,
    moveMs: 1200,
    holdMs: 1500,
    restMs: 700,
  }),
  expect: { reps: 3 },
});

const run = (scenario: Scenario) => {
  const recorder = new MovementRecorder(ER);
  for (const f of new VirtualPatient(scenario).frames()) recorder.add(f.pose);
  return {
    frames: recorder.frames,
    analysis: analyseSession(recorder.frames, ER, {}, { detect: detectCompensations }),
  };
};

describe('shoulder external rotation at the side (front view)', () => {
  it('measures the rotation (0° forward, positive outward), always as an estimate', () => {
    const { frames } = run(rotate(60));
    const angles = frames.map((f) => f.angle as number);
    expect(Math.min(...angles)).toBeCloseTo(0, 0);
    expect(Math.max(...angles)).toBeCloseTo(60, 0);
    expect(frames.every((f) => f.estimated)).toBe(true);
    expect(frames.every((f) => f.view === 'front')).toBe(true);
  });

  it('reads turning inward as negative', () => {
    const { frames } = run(rotate(-30));
    expect(Math.min(...frames.map((f) => f.angle as number))).toBeCloseTo(-30, 0);
  });

  it('counts repetitions with no findings when the elbow stays at the side', () => {
    const { analysis } = run(rotate(60));
    expect(analysis.reps).toHaveLength(3);
    expect(analysis.profile?.bestDegrees).toBeCloseTo(60, 0);
    expect(analysis.findings).toEqual([]);
  });

  it.each([
    [30, 'warn'], // elbow drifts out: arm 20° above rest
    [42, 'flag'], // 32° above rest
  ] as const)('flags the elbow leaving the side (arm to %i°: %s)', (arm, severity) => {
    const { analysis } = run(rotate(60, { leftShoulder: arm }));
    const f = analysis.findings.find((x) => x.id === 'elbow_from_side');
    expect(f?.severity).toBe(severity);
    expect(f?.cue).toBe('Keep your elbow gently beside your body.');
  });

  it('flags the trunk turning instead of the shoulder', () => {
    const { analysis } = run(rotate(60, { trunkRotation: 45 }));
    expect(analysis.findings.map((x) => x.id)).toContain('trunk_rotation');
  });

  it('does not call the bent elbow a fault', () => {
    const { analysis } = run(rotate(60));
    expect(analysis.findings.map((x) => x.id)).not.toContain('elbow_bend');
  });

  it('asks the patient to face the phone when filmed from the side', () => {
    const { analysis } = run(rotate(60, {}, { ...FACING, view: 'side' }));
    const setup = analysis.findings.find((x) => x.id === 'camera_view');
    expect(setup?.cue).toMatch(/Face the phone/);
  });
});
