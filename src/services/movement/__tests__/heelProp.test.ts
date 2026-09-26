/**
 * Passive knee extension with the heel propped, lying side-on: a still
 * measurement (the steadiest few seconds), reported as a passive extension
 * deficit, never counted as repetitions.
 */
import { STANDING } from '../../../testing/virtualPatient/body';
import type { Keyframe } from '../../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../../testing/virtualPatient/VirtualPatient';
import type { Scenario } from '../../../testing/virtualPatient/scenarios';
import { analyseSession } from '../analysis';
import { MovementRecorder } from '../recorder';
import { measureStaticHold } from '../staticHold';
import type { MovementContext, MovementFrame } from '../types';

const HEEL_PROP: MovementContext = {
  joint: 'knee',
  side: 'left',
  exerciseId: 'heel-prop-extension',
};

const lying = (timeline: Keyframe[]): Scenario => ({
  id: 'heel-prop',
  exerciseId: 'heel-prop-extension',
  title: '',
  description: '',
  base: { ...STANDING, view: 'lyingSide' },
  timeline,
  expect: { reps: 0 },
});

/** The left knee held at `knee` (interior degrees) for `ms`. */
const still = (knee: number, ms = 5000): Keyframe[] => [
  { t: 0, angles: { leftKnee: knee } },
  { t: ms, angles: { leftKnee: knee } },
];

const run = (scenario: Scenario, context = HEEL_PROP, goalDegrees?: number) => {
  const recorder = new MovementRecorder(context);
  for (const f of new VirtualPatient(scenario).frames()) recorder.add(f.pose);
  return {
    frames: recorder.frames,
    analysis: analyseSession(recorder.frames, context, { goalDegrees }),
  };
};

describe('heel-prop passive knee extension', () => {
  it('is seen lying, side-on, with the working leg nearest the camera', () => {
    const { frames } = run(lying(still(176)));
    expect(frames.every((f) => f.posture === 'lying')).toBe(true);
    expect(frames.every((f) => f.view === 'side')).toBe(true);
    expect(frames.every((f) => f.nearSide === 'left')).toBe(true);
  });

  it('measures the resting angle and counts no repetitions', () => {
    const { analysis } = run(lying(still(176)));
    expect(analysis.reps).toEqual([]);
    expect(analysis.hold?.degrees).toBeCloseTo(4, 0);
    expect(analysis.hold?.heldMs).toBeGreaterThanOrEqual(2000);
    expect(analysis.findings).toEqual([]);
  });

  it.each([
    [172, 'warn'], // 8° short of straight
    [165, 'flag'], // 15° short
  ] as const)(
    'resting at %i° reports a passive extension deficit (%s)',
    (knee, severity) => {
      const { analysis } = run(lying(still(knee)));
      const finding = analysis.findings.find((f) => f.id === 'reduced_range');
      expect(finding?.severity).toBe(severity);
      expect(finding?.detail).toMatch(/Passive extension deficit/);
      expect(finding?.detail).not.toMatch(/lag/i);
    }
  );

  it('judges the deficit against the prescribed goal', () => {
    // Goal "within 10° of straight"; resting 8° short meets it
    const { analysis } = run(lying(still(172)), HEEL_PROP, 10);
    expect(analysis.findings.map((f) => f.id)).not.toContain('reduced_range');
  });

  it('waits for the leg to settle and measures the still part', () => {
    const { analysis } = run(
      lying([
        { t: 0, angles: { leftKnee: 150 } },
        { t: 1500, angles: { leftKnee: 176 } },
        { t: 1800, angles: { leftKnee: 160 } },
        { t: 2400, angles: { leftKnee: 176 } },
        { t: 6000, angles: { leftKnee: 176 } },
      ])
    );
    expect(analysis.hold?.degrees).toBeCloseTo(4, 0);
    expect(analysis.hold?.fromT).toBeGreaterThanOrEqual(1_000_000 + 1800);
  });

  it('asks the patient to keep still when the leg never settles', () => {
    const moving: Keyframe[] = [];
    for (let t = 0; t <= 6000; t += 600) {
      moving.push({ t, angles: { leftKnee: t % 1200 ? 150 : 176 } });
    }
    const { analysis } = run(lying(moving));
    expect(analysis.hold).toBeNull();
    expect(analysis.findings.map((f) => f.id)).toEqual(['short_hold']);
  });

  it('asks for the working leg nearest the camera when it is the far one', () => {
    const { analysis } = run(lying(still(176)), { ...HEEL_PROP, side: 'right' });
    expect(analysis.hold).toBeNull();
    expect(analysis.findings[0].cue).toMatch(/right leg is closest to the phone/);
  });
});

describe('measureStaticHold', () => {
  const frames = (angles: (number | null)[], stepMs = 100): MovementFrame[] =>
    angles.map((angle, i) => ({ t: i * stepMs, angle, landmarks: [], view: 'side' }));

  it('averages the steadiest window of at least two seconds', () => {
    const hold = measureStaticHold(frames([...Array(25).fill(10), ...Array(25).fill(6)]));
    expect(hold?.degrees).toBeCloseTo(6, 5);
  });

  it('returns null when nothing is still for long enough', () => {
    expect(
      measureStaticHold(frames(Array.from({ length: 50 }, (_, i) => (i % 2) * 20)))
    ).toBeNull();
    expect(measureStaticHold(frames(Array(10).fill(5)))).toBeNull();
  });
});
