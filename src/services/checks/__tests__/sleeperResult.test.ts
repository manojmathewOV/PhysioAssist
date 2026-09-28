import {
  selectSleeperResult as select,
  PATIENT_SLEEPER_METHODS,
  validSleeperCheck,
} from '../sleeperResult';
import {
  exampleCheck as record,
  EXAMPLE_CONTEXT as context,
  EXAMPLE_HISTORY as history,
} from '../../../testing/sleeperResultFixtures';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
it('pairs current/previous/episode-best and never imports a goal', () => {
  const view = select(record(), history, context);
  expect(view).toMatchObject({
    state: 'comparable',
    value: 'About 42°',
    intervalId: 'window-current',
    caudalDegrees: 3,
    previous: { id: 'previous', text: 'About 38°' },
    best: { id: 'best', text: 'About 45°' },
  });
  expect(view).not.toHaveProperty('goal');
});
it('production has no qualified sleeper methods; fixtures cannot approve themselves', () => {
  expect(PATIENT_SLEEPER_METHODS).toEqual([]);
  expect(
    select(record(), history, {
      ...context,
      mode: 'patient',
      methods: PATIENT_SLEEPER_METHODS,
    })
  ).toMatchObject({ state: 'not_configured' });
  expect(
    select(record(), history, { ...context, mode: 'patient' }).value
  ).toBeUndefined();
});
it.each(['profileId', 'episodeId', 'side'] as const)('isolates %s', (key) => {
  const r = record();
  const altered = { ...r, [key]: key === 'side' ? 'right' : 'other' };
  expect(select(altered, history, context).value).toBeUndefined();
  expect(
    select(r, [{ ...history[0], [key]: key === 'side' ? 'right' : 'other' }], context)
      .previous
  ).toBeUndefined();
});
it.each([
  'variant',
  'assistance',
  'setupProtocol',
  'angleReference',
  'estimator',
  'endpointProtocol',
  'allowanceVersion',
  'revision',
] as const)('a changed %s separates historical comparisons', (key) => {
  const past = record('past', 90, 20);
  past.method[key] = 'changed';
  expect(select(record(), [past], context).previous).toBeUndefined();
});
it('does not conflate a band widening with improved movement', () => {
  const now = record();
  now.method.maxCaudalDegrees = 15;
  const c = { ...context, methods: [now.method, ...context.methods] };
  expect(select(now, history, c).previous).toBeUndefined();
});
it.each([NaN, Infinity, -1, 181])('withholds invalid rotation %s', (degrees) => {
  const now = record();
  now.angle.degrees = degrees;
  const v = select(now, history, context);
  expect(v.value).toBeUndefined();
  expect(v.rotationDegrees).toBeUndefined();
});
it('retains observed zero but never converts missing to zero', () => {
  expect(select(record('zero', 0), [], context).value).toBe('About 0°');
  const now = record();
  now.angle = { state: 'unavailable' };
  expect(select(now, history, context)).toMatchObject({
    state: 'unavailable',
    caudalDegrees: 3,
  });
  expect(select(now, history, context).value).toBeUndefined();
});
it('no elbow assessment means no headline rotation or ideal pose', () => {
  const now = record();
  now.elbow = { state: 'unavailable' };
  expect(select(now, history, context)).toMatchObject({
    state: 'not_comparable',
    elbowText: 'Elbow position not clear',
  });
  expect(select(now, history, context).value).toBeUndefined();
});
it('keeps out-of-band observation separate from trend, without subtracting drift', () => {
  const now = record('current', 50);
  now.elbow.caudalDegrees = 20;
  const v = select(now, history, context);
  expect(v).toMatchObject({
    state: 'not_comparable',
    value: 'About 50°',
    caudalDegrees: 20,
    best: { id: 'best' },
  });
});
it('withholds out-of-band angle when its method does not support that position', () => {
  const now = record();
  now.method.angleValidOutsideBand = false;
  now.elbow.caudalDegrees = 20;
  expect(
    select(now, history, { ...context, methods: [now.method] }).value
  ).toBeUndefined();
});
it('uncertainty across the band edge is neither clear nor moved', () => {
  const now = record();
  now.elbow.caudalDegrees = 10;
  now.elbow.uncertaintyDegrees = 2;
  expect(select(now, history, context)).toMatchObject({
    state: 'not_comparable',
    elbowText: 'Elbow position not clear',
  });
  expect(select(now, history, context).value).toBeUndefined();
});
it.each(['angle', 'elbow'] as const)('rejects %s from a different interval', (output) => {
  const now = record();
  now[output].intervalId = 'different';
  expect(select(now, history, context).value).toBeUndefined();
});
it.each(['changed', 'unknown'] as const)('does not qualify %s setup/torso', (setup) => {
  expect(select({ ...record(), setup }, history, context).value).toBeUndefined();
});
it.each(['pending', 'failed'] as const)(
  'unsaved %s reading cannot become recorded best',
  (saveState) => {
    const now = { ...record('current', 80), saveState };
    expect(select(now, history, context)).toMatchObject({
      value: 'About 80°',
      best: { id: 'best' },
    });
    expect(select(now, history, context).saveText).not.toBe('Saved on this device');
  }
);
it('first reading avoids duplicate previous/best tiles', () => {
  const view = select(record(), [], context);
  expect(view.firstComparable).toBe(true);
  expect(view.previous).toBeUndefined();
  expect(view.best).toBeUndefined();
});
it('identical replay and property reordering count once', () => {
  const earlier = record('past', 45, 20);
  const reordered = Object.fromEntries(Object.entries(earlier).reverse());
  expect(select(record(), [earlier, clone(earlier), reordered], context)).toEqual(
    select(record(), [earlier], context)
  );
});
it('conflicting duplicates cannot select the more favourable endpoint', () => {
  const a = record('clash', 40, 20),
    b = record('clash', 80, 20);
  expect(select(record(), [a, b], context).best).toBeUndefined();
  expect(select(a, [b], context)).toMatchObject({ state: 'conflict' });
});
it('a malformed copy with the same ID prevents a false comparison', () => {
  expect(
    select(record(), [{ ...history[0], angle: null }, history[0]], context).previous
  ).toBeUndefined();
});
it('retraction overrides an old duplicate; deletion recomputes best', () => {
  const all = [...history, { ...history[1], retracted: true }];
  expect(select(record(), all, context).best?.id).toBe('current');
  expect(select(record(), [history[0]], context).best?.id).toBe('current');
});
it('previous is preceding eligible, not the latest unmeasured or future attempt', () => {
  const missed = record('missed', 99, 26);
  missed.angle = { state: 'unavailable' };
  expect(
    select(record(), [...history, missed, record('future', 90, 29)], context).previous?.id
  ).toBe('previous');
});
it('best label acknowledges incomplete history', () => {
  expect(
    select(record(), history, { ...context, historyComplete: false }).bestLabel
  ).toBe('Best in saved checks');
});
it('same method across new baseline IDs remains comparable', () => {
  const older = record('older', 35, 20);
  older.interval.baselineId = 'different-valid-setup';
  expect(select(record(), [older], context).previous?.id).toBe('older');
});
it('order-independent tie selection and JSON roundtrip preserve source IDs', () => {
  const a = record('a', 45, 20),
    b = record('b', 45, 20);
  for (const rows of [
    [a, b],
    [b, a],
    [b, a, b, a],
  ]) {
    expect(select(record(), clone(rows), context).best?.id).toBe('a');
  }
});
it('10,000 records use the same bounded result without retaining frame/video payloads', () => {
  const rows = Array.from({ length: 10000 }, (_, i) =>
    record(`r-${i}`, 30 + (i % 20), 20 + (i % 7))
  );
  const view = select(record(), rows, context);
  expect(view.best?.degrees).toBe(49);
  expect(JSON.stringify(view).length).toBeLessThan(1600);
  expect(validSleeperCheck(null)).toBe(false);
});
it('an out-of-band starting position is not rebased to zero drift', () => {
  const r = record();
  r.elbow.initialCaudalDegrees = 20;
  const result = select(r, history, context);
  expect(result.state).toBe('not_comparable');
  expect(result.value).toBeUndefined();
});
it('known-geometry band/uncertainty grid never qualifies an overlapping interval', () => {
  let count = 0;
  for (let caudal = -20; caudal <= 30; caudal++)
    for (const uncertainty of [0, 1, 3]) {
      const r = record();
      r.elbow.caudalDegrees = caudal;
      r.elbow.uncertaintyDegrees = uncertainty;
      const qualifies = caudal - uncertainty >= -5 && caudal + uncertainty <= 10;
      const actual = select(r, [], context);
      expect(actual.state === 'comparable').toBe(qualifies);
      if (qualifies) expect(actual.intervalId).toBe(r.angle.intervalId);
      count++;
    }
  expect(count).toBe(153);
});
it.each(['allowanceVersion', 'angleReference', 'setupProtocol'] as const)(
  'missing %s never receives a legacy default',
  (field) => {
    const r = clone(record()) as any;
    delete r.method[field];
    expect(select(r, history, context).value).toBeUndefined();
  }
);

it('programme-owned blocking state outranks numbers and historical best', () => {
  const v = select(record(), history, {
    ...context,
    blockingMessage: 'Stop and check your programme.',
  });
  expect(v).toMatchObject({
    state: 'blocked',
    message: 'Stop and check your programme.',
  });
  expect(v.value).toBeUndefined();
  expect(v.best).toBeUndefined();
});
it('equal instants in different timezone strings have a deterministic best', () => {
  const a = record('a', 45, 20),
    b = record('b', 45, 20);
  b.date = '2026-09-20T19:00:00.000+10:00';
  expect(select(record(), [b, a], context).best?.id).toBe('a');
  expect(select(record(), [a, b], context).best?.id).toBe('a');
});
it('unsupported display precision does not produce floating-point text artefacts', () => {
  const r = record();
  r.method.displayStepDegrees = 1.1;
  expect(select(r, [], { ...context, methods: [r.method] }).value).toBeUndefined();
});

it('baseline uncertainty crossing the allowed band prevents comparison', () => {
  const r = record();
  r.elbow.initialCaudalDegrees = 10;
  r.elbow.initialUncertaintyDegrees = 2;
  expect(select(r, history, context).value).toBeUndefined();
});
it('does not invent zero baseline uncertainty', () => {
  const r = record();
  delete r.elbow.initialUncertaintyDegrees;
  expect(select(r, history, context).value).toBeUndefined();
});
