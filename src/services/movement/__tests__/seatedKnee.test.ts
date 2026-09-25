/**
 * Seated knee exercises filmed side-on, end to end on the virtual patient:
 * posture and view, repetitions of a movement towards straight, the active
 * extension deficit, and bending past 90° while sitting.
 */
import { SEATED } from '../../../testing/virtualPatient/compensationScenarios';
import { repetitions } from '../../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../../testing/virtualPatient/VirtualPatient';
import type { Scenario } from '../../../testing/virtualPatient/scenarios';
import { analyseSession } from '../analysis';
import { detectCompensations } from '../compensations';
import { MovementRecorder } from '../recorder';
import type { MovementContext } from '../types';

const EXTENSION: MovementContext = {
  joint: 'knee',
  side: 'left',
  exerciseId: 'seated-knee-extension',
};
const FLEXION: MovementContext = {
  joint: 'knee',
  side: 'left',
  exerciseId: 'seated-knee-flexion',
};

/** Three repetitions from 90° to `top` (interior degrees, 180 = straight). */
const seated = (top: number): Scenario => ({
  id: `seated-${top}`,
  exerciseId: 'seated-knee-extension',
  title: '',
  description: '',
  base: SEATED,
  timeline: repetitions({
    rest: { leftKnee: 90 },
    target: { leftKnee: top },
    reps: 3,
    moveMs: 1300,
    holdMs: 1500,
    restMs: 700,
  }),
  expect: { reps: 3 },
});

const analyse = (scenario: Scenario, context: MovementContext, goalDegrees?: number) => {
  const recorder = new MovementRecorder(context);
  for (const f of new VirtualPatient(scenario).frames()) recorder.add(f.pose);
  return {
    frames: recorder.frames,
    analysis: analyseSession(
      recorder.frames,
      context,
      { goalDegrees },
      { detect: detectCompensations }
    ),
  };
};

describe('seated knee extension (side-on)', () => {
  it('is seen sitting, side-on, with the working leg nearest the camera', () => {
    const { frames } = analyse(seated(176), EXTENSION);
    expect(frames.every((f) => f.posture === 'seated')).toBe(true);
    expect(frames.every((f) => f.view === 'side')).toBe(true);
    expect(frames.every((f) => f.nearSide === 'left')).toBe(true);
  });

  it('counts each straightening; the peak is the smallest angle', () => {
    const { analysis } = analyse(seated(176), EXTENSION);
    expect(analysis.reps).toHaveLength(3);
    for (const rep of analysis.reps) {
      expect(rep.peakDegrees).toBeCloseTo(4, 0);
      expect(rep.restDegrees).toBeCloseTo(90, -1);
    }
    expect(analysis.profile?.bestDegrees).toBeCloseTo(4, 0);
    expect(analysis.findings).toEqual([]);
  });

  it.each([
    [168, 'warn'], // 12° short of straight
    [150, 'flag'], // 30° short
  ] as const)(
    'reaching %i° reports an active extension deficit (%s)',
    (top, severity) => {
      const { analysis } = analyse(seated(top), EXTENSION);
      const finding = analysis.findings.find((f) => f.id === 'reduced_range');
      expect(finding?.severity).toBe(severity);
      expect(finding?.detail).toMatch(/Active extension deficit/);
      expect(finding?.detail).not.toMatch(/lag/i);
      expect(finding?.cue).toMatch(/straighten/i);
    }
  );

  it('judges the deficit against the prescribed goal, not full straightening', () => {
    // Early after surgery: "within 30° of straight"; reaching 25° meets it
    const { analysis } = analyse(seated(155), EXTENSION, 30);
    expect(analysis.findings.map((f) => f.id)).not.toContain('reduced_range');
  });

  it('never says "come back further" (returning to the bent start is no fault)', () => {
    const { analysis } = analyse(seated(176), EXTENSION);
    expect(analysis.findings.map((f) => f.id)).not.toContain('incomplete_return');
  });

  it('asks for the working leg nearest the camera when it is the far one', () => {
    const { analysis } = analyse(seated(176), { ...EXTENSION, side: 'right' });
    const setup = analysis.findings.find((f) => f.id === 'camera_view');
    expect(setup?.cue).toMatch(/right leg is closest to the phone/);
  });
});

describe('seated knee bend (side-on)', () => {
  it('counts bending past 90° and reports the deepest bend', () => {
    const { analysis } = analyse(
      { ...seated(60), exerciseId: 'seated-knee-flexion' },
      FLEXION
    );
    expect(analysis.reps).toHaveLength(3);
    expect(analysis.profile?.bestDegrees).toBeCloseTo(120, 0);
    expect(analysis.findings).toEqual([]);
  });
});
