/**
 * Short-arc quadriceps, lying side-on with a roll under the knee: the heel
 * lifts to straighten the knee while the thigh stays on the roll.
 */
import { STANDING } from '../../../testing/virtualPatient/body';
import { JointAngles, repetitions } from '../../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../../testing/virtualPatient/VirtualPatient';
import type { Scenario } from '../../../testing/virtualPatient/scenarios';
import { analyseSession } from '../analysis';
import { detectCompensations } from '../compensations';
import { MovementRecorder } from '../recorder';
import type { MovementContext } from '../types';

const SAQ: MovementContext = {
  joint: 'knee',
  side: 'left',
  exerciseId: 'short-arc-quad',
};

/** Three repetitions from 40° bent (interior 140°) to `top`. */
const saq = (top = 176, extra: JointAngles = {}): Scenario => ({
  id: 'saq',
  exerciseId: 'short-arc-quad',
  title: '',
  description: '',
  base: { ...STANDING, view: 'lyingSide', kneeOnRoll: 1, leftKnee: 140, rightKnee: 140 },
  timeline: repetitions({
    rest: { leftKnee: 140, thighLift: 0 },
    target: { leftKnee: top, ...extra },
    reps: 3,
    moveMs: 1200,
    holdMs: 2000,
    restMs: 700,
  }),
  expect: { reps: 3 },
});

const run = (scenario: Scenario, context = SAQ) => {
  const recorder = new MovementRecorder(context);
  for (const f of new VirtualPatient(scenario).frames()) recorder.add(f.pose);
  return {
    frames: recorder.frames,
    analysis: analyseSession(
      recorder.frames,
      context,
      {},
      { detect: detectCompensations }
    ),
  };
};

describe('short-arc quad (lying, roll under the knee)', () => {
  it('is seen lying and side-on', () => {
    const { frames } = run(saq());
    expect(frames.every((f) => f.posture === 'lying')).toBe(true);
    expect(frames.every((f) => f.view === 'side')).toBe(true);
  });

  it('counts each straightening, peak = straightest, no findings', () => {
    const { analysis } = run(saq());
    expect(analysis.reps).toHaveLength(3);
    expect(analysis.profile?.bestDegrees).toBeCloseTo(4, 0);
    expect(analysis.findings).toEqual([]);
  });

  it('reports an active extension deficit when the knee stops short', () => {
    const { analysis } = run(saq(160)); // 20° short
    const f = analysis.findings.find((x) => x.id === 'reduced_range');
    expect(f?.severity).toBe('warn');
    expect(f?.detail).toMatch(/Active extension deficit/);
  });

  it.each([
    [12, 'warn'],
    [20, 'flag'],
  ] as const)(
    'flags the knee lifting off the roll (thigh rises %i°: %s)',
    (lift, severity) => {
      const { analysis } = run(saq(176, { thighLift: lift }));
      const f = analysis.findings.find((x) => x.id === 'thigh_lift');
      expect(f?.severity).toBe(severity);
      expect(f?.cue).toMatch(/thigh resting down/);
    }
  );

  it('does not run standing or seated checks while lying', () => {
    const { analysis } = run(saq(176, { thighLift: 0 }));
    const ids = analysis.findings.map((x) => x.id);
    expect(ids).not.toContain('heel_lift');
    expect(ids).not.toContain('lean_back');
  });
});
