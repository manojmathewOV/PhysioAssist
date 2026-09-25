/**
 * Compensation detectors against the virtual patient: each compensation at a
 * clear magnitude is found with the right severity, clean movements (also with
 * tracking noise) stay clean, and wrong camera views, hidden landmarks and
 * brief glitches are not reported.
 */
import { GoniometerService } from '../../goniometerService';
import { clinicalAngle } from '../../pose/exercisePlan';
import { getMeasurementLandmarks } from '../../pose/measurementLandmarks';
import {
  COMPENSATION_DETECTORS,
  DETECTORS_FOR,
  MIN_DURATION_MS,
  PATIENT_CUES,
  detectCompensations,
  detectElbowBend,
  detectKneeValgus,
  detectShoulderHike,
  detectBackArch,
} from '../compensations';
import type { CameraView, MovementContext, MovementFrame, Repetition } from '../types';
import {
  COMPENSATION_SCENARIOS,
  CompensationScenario,
  HOLD_MID,
  JITTER_SCENARIOS,
  spike,
} from '../../../testing/virtualPatient/compensationScenarios';
import { VirtualPatient } from '../../../testing/virtualPatient/VirtualPatient';

const byId = (id: string) => COMPENSATION_SCENARIOS.find((s) => s.id === id)!;

/** Play a scenario and cut its one repetition, as the recorder would. */
function repOf(
  scenario: CompensationScenario,
  { view = scenario.base.view, hidden }: { view?: CameraView; hidden?: string } = {}
): Repetition {
  const { joint, side } = scenario.context;
  const goniometer = new GoniometerService({ smoothingWindow: 1 });
  const frames: MovementFrame[] = [];
  for (const f of new VirtualPatient(scenario).frames()) {
    if (f.t < scenario.rep.startT || f.t > scenario.rep.endT) continue;
    let landmarks = getMeasurementLandmarks(f.pose);
    if (hidden) {
      landmarks = landmarks.map((lm) =>
        lm.name === hidden ? { ...lm, visibility: 0.1 } : lm
      );
    }
    const interior = goniometer
      .calculateAllJointAngles(landmarks)
      .get(`${side}_${joint}`)?.angle;
    frames.push({
      t: f.t,
      angle: interior === undefined ? null : clinicalAngle(joint, interior),
      landmarks,
      view,
    });
  }
  const angles = frames.map((f) => f.angle ?? 0);
  const peak = Math.max(...angles);
  return {
    index: 0,
    startT: frames[0].t,
    peakT: frames[angles.indexOf(peak)].t,
    endT: frames[frames.length - 1].t,
    peakDegrees: peak,
    restDegrees: Math.min(angles[0], angles[angles.length - 1]),
    holdMs: 0,
    frames,
    baseline: frames[0],
  };
}

const found = (rep: Repetition, context: MovementContext) =>
  detectCompensations(rep, context).map(({ id, severity }) => ({ id, severity }));

describe('compensation detectors (virtual patient)', () => {
  it.each(COMPENSATION_SCENARIOS.map((s) => [s.id, s] as const))('%s', (_id, s) => {
    expect(found(repOf(s), s.context)).toEqual(s.hits);
  });

  it.each(JITTER_SCENARIOS.map((s) => [s.id, s] as const))(
    '%s: 3 px of tracking noise raises nothing',
    (_id, s) => {
      expect(found(repOf(s), s.context)).toEqual([]);
    }
  );

  it('reports value, unit and how long it lasted', () => {
    const s = byId('raise-side-elbow-flag');
    const hit = detectElbowBend(repOf(s), s.context)!;
    expect(hit).toMatchObject({ id: 'elbow_bend', severity: 'flag', unit: 'deg' });
    expect(hit.value).toBeCloseTo(47, 0); // elbow 172° -> 125°
    expect(hit.durationMs).toBeGreaterThanOrEqual(1500);
  });
});

describe('compensation detectors: when not to report', () => {
  it('returns null when the camera view is wrong for the check', () => {
    const hike = byId('raise-front-hike-flag');
    expect(detectShoulderHike(repOf(hike), hike.context)).not.toBeNull();
    expect(detectShoulderHike(repOf(hike, { view: 'side' }), hike.context)).toBeNull();
    expect(detectShoulderHike(repOf(hike, { view: 'unknown' }), hike.context)).toBeNull();

    const arch = byId('raise-side-back-arch-flag');
    expect(detectBackArch(repOf(arch), arch.context)).not.toBeNull();
    expect(detectBackArch(repOf(arch, { view: 'front' }), arch.context)).toBeNull();

    const valgus = byId('squat-front-valgus-flag');
    expect(detectKneeValgus(repOf(valgus, { view: 'side' }), valgus.context)).toBeNull();
  });

  it('returns null when a needed landmark is hidden', () => {
    const s = byId('raise-front-hike-flag');
    expect(detectShoulderHike(repOf(s, { hidden: 'left_ear' }), s.context)).toBeNull();
  });

  it('only runs checks that apply to the joint being exercised', () => {
    const hike = byId('raise-front-hike-flag');
    const asKnee: MovementContext = { ...hike.context, joint: 'knee' };
    expect(detectShoulderHike(repOf(hike), asKnee)).toBeNull();

    const elbow = byId('raise-side-elbow-flag');
    const asElbow: MovementContext = { ...elbow.context, joint: 'elbow' };
    expect(detectElbowBend(repOf(elbow), asElbow)).toBeNull();

    const valgus = byId('squat-front-valgus-flag');
    const asShoulder: MovementContext = { ...valgus.context, joint: 'shoulder' };
    expect(detectKneeValgus(repOf(valgus), asShoulder)).toBeNull();
  });

  it(`ignores brief spikes (< ${MIN_DURATION_MS} ms) but not sustained ones`, () => {
    const clean = byId('raise-front-clean');
    const brief = { ...clean, effects: spike('left_shoulder', -30, HOLD_MID, 200) };
    expect(found(repOf(brief), clean.context)).toEqual([]);
    const sustained = { ...clean, effects: spike('left_shoulder', -30, HOLD_MID, 600) };
    expect(found(repOf(sustained), clean.context)).toEqual([
      { id: 'shoulder_hike', severity: 'flag' },
    ]);
  });
});

describe('compensation tables', () => {
  it('has a kind cue for every finding', () => {
    for (const cue of Object.values(PATIENT_CUES)) {
      expect(cue.length).toBeGreaterThan(10);
      expect(cue).not.toMatch(/weak|glute|scapul|dyskinesis|wrong|bad/i);
    }
    expect(PATIENT_CUES.shoulder_hike).toBe(
      'Keep your shoulder relaxed and down, away from your ear.'
    );
  });

  it('every applicable check has a detector', () => {
    for (const ids of Object.values(DETECTORS_FOR)) {
      for (const id of ids) expect(COMPENSATION_DETECTORS[id]).toBeDefined();
    }
  });
});
