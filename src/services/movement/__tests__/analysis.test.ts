/**
 * Reference comparison, end to end on the virtual patient: a demonstration is
 * recorded, then patient sessions are compared against it.
 */
import { SCENARIOS, Scenario } from '../../../testing/virtualPatient/scenarios';
import { repetitions } from '../../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../../testing/virtualPatient/VirtualPatient';
import { analyseSession, buildReference } from '../analysis';
import { MovementRecorder } from '../recorder';
import { segmentReps } from '../repSegmentation';
import type { MovementContext } from '../types';

const scenario = (id: string) => SCENARIOS.find((s) => s.id === id)!;

const record = (s: Scenario, context: MovementContext) => {
  const recorder = new MovementRecorder(context);
  for (const frame of new VirtualPatient(s).frames()) recorder.add(frame.pose);
  return recorder.frames;
};

const ELBOW: MovementContext = { joint: 'elbow', side: 'left', exerciseId: 'bicep-curl' };
const SHOULDER: MovementContext = {
  joint: 'shoulder',
  side: 'left',
  exerciseId: 'arm-raise',
};

describe('repetition segmentation', () => {
  it.each([
    ['bicep-curl-normal', ELBOW, 5],
    ['bicep-curl-jitter', ELBOW, 5],
    ['bicep-curl-limited', ELBOW, 5],
    ['bicep-curl-fast', ELBOW, 5],
    ['bicep-curl-stops-early', ELBOW, 2],
    ['arm-raise-normal', SHOULDER, 5],
  ] as const)('%s: counts every repetition', (id, context, count) => {
    const reps = segmentReps(record(scenario(id), context));
    expect(reps).toHaveLength(count);
  });

  it('measures peak, rest and hold in clinical degrees', () => {
    const [rep] = segmentReps(record(scenario('bicep-curl-normal'), ELBOW));
    expect(rep.peakDegrees).toBeCloseTo(140, -1); // interior 40° = 140° flexion
    expect(rep.restDegrees).toBeLessThan(15);
    expect(rep.holdMs).toBeGreaterThan(1000);
  });

  it('finds nothing in a person standing still', () => {
    const still: Scenario = {
      ...scenario('bicep-curl-normal'),
      timeline: [
        { t: 0, angles: {} },
        { t: 8000, angles: {} },
      ],
    };
    expect(segmentReps(record(still, ELBOW))).toHaveLength(0);
  });
});

describe('comparison with a demonstration', () => {
  const curlRef = buildReference(record(scenario('bicep-curl-normal'), ELBOW))!;
  const raiseRef = buildReference(record(scenario('arm-raise-normal'), SHOULDER))!;
  const ids = (id: string, ctx: MovementContext, ref = curlRef) =>
    analyseSession(record(scenario(id), ctx), ctx, { reference: ref }).findings.map(
      (f) => f.id
    );

  it('builds a profile of the demonstration', () => {
    expect(raiseRef).toMatchObject({ repCount: 5 });
    expect(raiseRef.peakDegrees).toBeCloseTo(155, -1);
  });

  it('reports nothing when the patient matches the demonstration', () => {
    expect(ids('bicep-curl-normal', ELBOW)).toEqual([]);
    expect(ids('bicep-curl-jitter', ELBOW)).toEqual([]);
  });

  it('reports reduced range with both numbers', () => {
    const result = analyseSession(
      record(scenario('arm-raise-short-of-standard'), SHOULDER),
      SHOULDER,
      { reference: raiseRef }
    );
    expect(result.findings[0].id).toBe('reduced_range');
    expect(result.findings[0].detail).toMatch(/about 11\d°.*demonstration reached 15\d°/);
    expect(result.cues[0]).toMatch(/a little further/);
  });

  it('reports moving too fast and not holding', () => {
    expect(ids('bicep-curl-fast', ELBOW)).toEqual(
      expect.arrayContaining(['too_fast', 'short_hold'])
    );
  });

  it('reports not straightening the elbow fully', () => {
    const bentRest: Scenario = {
      ...scenario('bicep-curl-normal'),
      timeline: repetitions({
        rest: { leftElbow: 145, rightElbow: 145 },
        target: { leftElbow: 40, rightElbow: 40 },
        reps: 5,
        moveMs: 900,
        holdMs: 1400,
        restMs: 700,
      }),
    };
    const result = analyseSession(record(bentRest, ELBOW), ELBOW, { reference: curlRef });
    const finding = result.findings.find((f) => f.id === 'incomplete_return');
    expect(finding?.cue).toBe('Try to straighten your elbow all the way each time.');
  });

  it('falls back to the prescribed goal without a demonstration', () => {
    const result = analyseSession(
      record(scenario('arm-raise-short-of-standard'), SHOULDER),
      SHOULDER,
      { goalDegrees: 150 }
    );
    expect(result.findings[0].detail).toMatch(/your goal is 150°/);
  });

  it('gives at most two cues, most important first', () => {
    const result = analyseSession(
      record(scenario('bicep-curl-fast'), ELBOW),
      ELBOW,
      {
        reference: curlRef,
      },
      {
        detect: (rep) =>
          rep.index < 3
            ? [
                {
                  id: 'shoulder_hike',
                  severity: 'flag',
                  value: 15,
                  unit: '%torso',
                  durationMs: 500,
                },
              ]
            : [],
      }
    );
    expect(result.cues).toHaveLength(2);
    expect(result.findings[0].id).toBe('shoulder_hike');
  });

  it('ignores a compensation seen in only one repetition', () => {
    const result = analyseSession(
      record(scenario('bicep-curl-normal'), ELBOW),
      ELBOW,
      {
        reference: curlRef,
      },
      {
        detect: (rep) =>
          rep.index === 2
            ? [
                {
                  id: 'trunk_side_lean',
                  severity: 'warn',
                  value: 9,
                  unit: 'deg',
                  durationMs: 400,
                },
              ]
            : [],
      }
    );
    expect(result.findings).toEqual([]);
  });
});
