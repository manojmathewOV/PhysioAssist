/**
 * Whole-session compensation gate: each compensation scenario, repeated three
 * times, goes through the recorder, repetition segmentation, the detectors and
 * the session findings, exactly as after a real session.
 */
import { COMPENSATION_SCENARIOS } from '../../../testing/virtualPatient/compensationScenarios';
import type { Keyframe } from '../../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../../testing/virtualPatient/VirtualPatient';
import { analyseSession } from '../analysis';
import { detectCompensations } from '../compensations';
import { MovementRecorder } from '../recorder';

const repeat = (keys: Keyframe[], times: number): Keyframe[] => {
  const period = keys[keys.length - 1].t + 400;
  return Array.from({ length: times }, (_, n) =>
    keys.map((k) => ({ ...k, t: k.t + n * period }))
  ).flat();
};

// Squats filmed from the front barely change the 2D knee angle, so these also
// exercise the hip-drop repetition timing.
const cases = COMPENSATION_SCENARIOS.filter(
  (s) => s.hits.length === 0 || s.hits.every((h) => h.severity === 'flag')
);

describe('session findings from compensation scenarios', () => {
  it.each(cases.map((s) => [s.id, s] as const))('%s', (_id, scenario) => {
    const recorder = new MovementRecorder(scenario.context);
    const patient = new VirtualPatient({
      ...scenario,
      timeline: repeat(scenario.timeline, 3),
    });
    for (const frame of patient.frames()) recorder.add(frame.pose);

    const result = analyseSession(
      recorder.frames,
      scenario.context,
      {},
      {
        detect: detectCompensations,
      }
    );
    expect(result.reps).toHaveLength(3);
    const found = result.findings.map((f) => f.id);
    expect(found.sort()).toEqual(scenario.hits.map((h) => h.id).sort());
    if (scenario.hits.length) expect(result.findings[0].severity).toBe('flag');
  });
});
