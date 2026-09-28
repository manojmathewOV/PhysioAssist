/** Presentation contract only. No camera estimator, prescription or default allowance. */
export interface SleeperMethod {
  id: string;
  revision: string;
  variant: string;
  assistance: string;
  setupProtocol: string;
  angleReference: string;
  estimator: string;
  endpointProtocol: string;
  allowanceVersion: string;
  minCaudalDegrees: number;
  maxCaudalDegrees: number;
  displayStepDegrees: number;
  angleValidOutsideBand: boolean;
}
export interface SleeperCheck {
  schema: 1;
  kind: 'check';
  exerciseId: 'sleeper-stretch';
  id: string;
  profileId: string;
  episodeId: string;
  side: 'left' | 'right';
  date: string;
  source: 'camera' | 'synthetic';
  saveState: 'saved' | 'pending' | 'failed';
  retracted?: boolean;
  method: SleeperMethod;
  interval: {
    id: string;
    fromT: number;
    toT: number;
    baselineId: string;
    attempts: number;
  };
  /** Setup/torso checks are independent of whether an angle can be calculated. */
  setup: 'acceptable' | 'changed' | 'unknown';
  angle: { state: 'observed' | 'unavailable'; degrees?: number; intervalId?: string };
  elbow: {
    state: 'observed' | 'unavailable';
    caudalDegrees?: number;
    uncertaintyDegrees?: number;
    initialCaudalDegrees?: number;
    intervalId?: string;
  };
}
export interface SleeperResultContext {
  profileId: string;
  episodeId: string;
  side: 'left' | 'right';
  mode: 'patient' | 'evaluation';
  methods: readonly SleeperMethod[];
  historyComplete: boolean;
}
/** Empty until method, allowance and reference-repeatability qualification is approved.
 * Records cannot register their own method. Synthetic fixtures never enter this list. */
export const PATIENT_SLEEPER_METHODS: readonly SleeperMethod[] = Object.freeze([]);
export interface SleeperReading {
  id: string;
  date: string;
  degrees: number;
  text: string;
}
export interface SleeperResultView {
  state:
    | 'comparable'
    | 'not_comparable'
    | 'unavailable'
    | 'not_configured'
    | 'conflict'
    | 'retracted';
  title: string;
  side: 'left' | 'right';
  date?: string;
  synthetic: boolean;
  message: string;
  saveText?: string;
  value?: string;
  rotationDegrees?: number;
  elbowText: string;
  caudalDegrees?: number;
  intervalId?: string;
  previous?: SleeperReading;
  best?: SleeperReading;
  bestLabel: string;
  firstComparable: boolean;
}
const text = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const methodFields = [
  'id',
  'revision',
  'variant',
  'assistance',
  'setupProtocol',
  'angleReference',
  'estimator',
  'endpointProtocol',
  'allowanceVersion',
] as const;
export function validSleeperMethod(v: unknown): v is SleeperMethod {
  return (
    object(v) &&
    methodFields.every((k) => text(v[k])) &&
    finite(v.minCaudalDegrees) &&
    finite(v.maxCaudalDegrees) &&
    v.minCaudalDegrees <= 0 &&
    v.maxCaudalDegrees > 0 &&
    v.minCaudalDegrees > -90 &&
    v.maxCaudalDegrees < 90 &&
    finite(v.displayStepDegrees) &&
    Number.isSafeInteger(v.displayStepDegrees) &&
    v.displayStepDegrees >= 1 &&
    v.displayStepDegrees <= 10 &&
    typeof v.angleValidOutsideBand === 'boolean'
  );
}
export const sleeperMethodKey = (m: SleeperMethod): string =>
  JSON.stringify([
    ...methodFields.map((k) => m[k]),
    m.minCaudalDegrees,
    m.maxCaudalDegrees,
    m.displayStepDegrees,
    m.angleValidOutsideBand,
  ]);
export function validSleeperCheck(v: unknown): v is SleeperCheck {
  if (
    !object(v) ||
    v.schema !== 1 ||
    v.kind !== 'check' ||
    v.exerciseId !== 'sleeper-stretch' ||
    !['id', 'profileId', 'episodeId', 'date'].every((k) => text(v[k])) ||
    !['left', 'right'].includes(v.side as string) ||
    !['camera', 'synthetic'].includes(v.source as string) ||
    !['saved', 'pending', 'failed'].includes(v.saveState as string) ||
    (v.retracted !== undefined && typeof v.retracted !== 'boolean') ||
    !Number.isFinite(Date.parse(v.date as string)) ||
    !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v.date as string) ||
    !validSleeperMethod(v.method) ||
    !object(v.interval) ||
    !object(v.angle) ||
    !object(v.elbow)
  )
    return false;
  const { interval: i, angle: a, elbow: e } = v;
  if (
    !text(i.id) ||
    !text(i.baselineId) ||
    !finite(i.fromT) ||
    !finite(i.toT) ||
    i.fromT < 0 ||
    i.toT <= i.fromT ||
    !Number.isSafeInteger(i.attempts) ||
    Number(i.attempts) < 1 ||
    !['acceptable', 'changed', 'unknown'].includes(v.setup as string)
  )
    return false;
  const angle =
    a.state === 'observed'
      ? finite(a.degrees) && a.degrees >= 0 && a.degrees <= 180 && text(a.intervalId)
      : a.state === 'unavailable' && a.degrees === undefined;
  const elbow =
    e.state === 'observed'
      ? finite(e.caudalDegrees) &&
        Math.abs(e.caudalDegrees) <= 180 &&
        finite(e.uncertaintyDegrees) &&
        e.uncertaintyDegrees >= 0 &&
        e.uncertaintyDegrees <= 180 &&
        finite(e.initialCaudalDegrees) &&
        Math.abs(e.initialCaudalDegrees) <= 180 &&
        text(e.intervalId)
      : e.state === 'unavailable' && e.caudalDegrees === undefined;
  return Boolean(angle && elbow);
}
function fingerprint(r: SleeperCheck) {
  return JSON.stringify([
    r.id,
    r.profileId,
    r.episodeId,
    r.side,
    r.date,
    r.source,
    sleeperMethodKey(r.method),
    r.interval.id,
    r.interval.fromT,
    r.interval.toT,
    r.interval.baselineId,
    r.interval.attempts,
    r.setup,
    r.angle.state,
    r.angle.degrees,
    r.angle.intervalId,
    r.elbow.state,
    r.elbow.caudalDegrees,
    r.elbow.uncertaintyDegrees,
    r.elbow.initialCaudalDegrees,
    r.elbow.intervalId,
  ]);
}
function empty(c: SleeperResultContext): SleeperResultView {
  return {
    state: 'unavailable',
    title: 'Sleeper stretch',
    side: c.side,
    synthetic: c.mode === 'evaluation',
    message: 'This check could not be measured.',
    elbowText: 'Elbow position not clear',
    firstComparable: false,
    bestLabel: c.historyComplete
      ? 'Best recorded in this recovery'
      : 'Best in saved checks',
  };
}
function reading(r: SleeperCheck): SleeperReading {
  const degrees =
    Math.round(r.angle.degrees! / r.method.displayStepDegrees) *
    r.method.displayStepDegrees;
  return { id: r.id, date: r.date, degrees, text: `About ${degrees}°` };
}
function evaluate(r: SleeperCheck, c: SleeperResultContext): SleeperResultView {
  const v = {
    ...empty(c),
    date: r.date,
    saveText:
      r.saveState === 'saved'
        ? 'Saved on this device'
        : r.saveState === 'failed'
          ? 'Not saved yet'
          : 'Saving — not recorded yet',
  };
  if (r.retracted)
    return {
      ...v,
      state: 'retracted',
      message: 'This check was removed from comparisons.',
    };
  const method = c.methods.find(
    (m) => validSleeperMethod(m) && sleeperMethodKey(m) === sleeperMethodKey(r.method)
  );
  if (!method || r.source !== (c.mode === 'evaluation' ? 'synthetic' : 'camera'))
    return {
      ...v,
      state: 'not_configured',
      message: 'This measurement method is not available for patient checks yet.',
    };
  const elbowVisible =
    r.elbow.state === 'observed' && r.elbow.intervalId === r.interval.id;
  const angleVisible =
    r.angle.state === 'observed' && r.angle.intervalId === r.interval.id;
  const low = r.elbow.caudalDegrees! - r.elbow.uncertaintyDegrees!;
  const high = r.elbow.caudalDegrees! + r.elbow.uncertaintyDegrees!;
  const inside =
    elbowVisible && low >= method.minCaudalDegrees && high <= method.maxCaudalDegrees;
  const outside =
    elbowVisible && (low > method.maxCaudalDegrees || high < method.minCaudalDegrees);
  v.elbowText = inside
    ? 'Elbow near shoulder level'
    : outside
      ? 'Elbow moved'
      : 'Elbow position not clear';
  if (elbowVisible) v.caudalDegrees = r.elbow.caudalDegrees;
  v.intervalId = r.interval.id;
  if (!angleVisible) return v;
  const initialInside =
    elbowVisible &&
    r.elbow.initialCaudalDegrees! >= method.minCaudalDegrees &&
    r.elbow.initialCaudalDegrees! <= method.maxCaudalDegrees;
  if (r.setup !== 'acceptable' || !inside || !initialInside) {
    if (
      method.angleValidOutsideBand &&
      r.setup === 'acceptable' &&
      initialInside &&
      outside
    )
      return {
        ...v,
        state: 'not_comparable',
        value: reading(r).text,
        rotationDegrees: reading(r).degrees,
        message: 'Not used for comparison: elbow moved.',
      };
    return {
      ...v,
      state: 'not_comparable',
      message:
        r.setup !== 'acceptable' || !initialInside
          ? 'Starting position or body position could not be confirmed.'
          : outside
            ? 'Not used for comparison: elbow moved.'
            : 'Elbow position is not clear enough for comparison.',
    };
  }
  return {
    ...v,
    state: 'comparable',
    value: reading(r).text,
    rotationDegrees: reading(r).degrees,
    message: 'Internal rotation (estimate)',
  };
}
/** Pure as-of-current comparison. No writes, inferred approvals, goal or improvement score. */
export function selectSleeperResult(
  current: unknown,
  history: readonly unknown[],
  c: SleeperResultContext
): SleeperResultView {
  const fallback = empty(c);
  if (
    !validSleeperCheck(current) ||
    current.profileId !== c.profileId ||
    current.episodeId !== c.episodeId ||
    current.side !== c.side
  )
    return fallback;
  const rows = new Map<string, SleeperCheck>();
  const conflicts = new Set<string>(),
    removed = new Set<string>();
  // IDs are profile scoped; conflicting copies cannot choose the favourable reading.
  for (const candidate of [...history, current]) {
    if (!object(candidate) || candidate.profileId !== c.profileId || !text(candidate.id))
      continue;
    if (candidate.retracted === true) removed.add(candidate.id);
    if (!validSleeperCheck(candidate)) {
      conflicts.add(candidate.id);
      continue;
    }
    const previous = rows.get(candidate.id);
    if (previous && fingerprint(previous) !== fingerprint(candidate))
      conflicts.add(candidate.id);
    else if (!previous || candidate.saveState === 'saved')
      rows.set(candidate.id, candidate);
  }
  if (removed.has(current.id))
    return {
      ...fallback,
      state: 'retracted',
      message: 'This check was removed from comparisons.',
    };
  if (conflicts.has(current.id))
    return {
      ...fallback,
      state: 'conflict',
      message: 'This record has conflicting copies. It is not used for comparison.',
    };
  // An explicitly unsaved current result never borrows a receipt from another copy.
  const result = evaluate(current, c);
  if (result.state === 'not_configured') return result;
  const key = sleeperMethodKey(current.method),
    at = Date.parse(current.date);
  let previous: SleeperCheck | undefined, best: SleeperCheck | undefined;
  let earlierCount = 0;
  for (const r of rows.values()) {
    if (
      removed.has(r.id) ||
      conflicts.has(r.id) ||
      r.saveState !== 'saved' ||
      r.episodeId !== c.episodeId ||
      r.side !== c.side ||
      sleeperMethodKey(r.method) !== key ||
      Date.parse(r.date) > at ||
      (r.id === current.id && current.saveState !== 'saved') ||
      evaluate(r, c).state !== 'comparable'
    )
      continue;
    if (r.id !== current.id && Date.parse(r.date) < at) {
      earlierCount++;
      if (
        !previous ||
        Date.parse(r.date) > Date.parse(previous.date) ||
        (Date.parse(r.date) === Date.parse(previous.date) && r.id < previous.id)
      )
        previous = r;
    }
    // Ties: oldest observation, then lexical event ID. Never a new-best celebration.
    if (
      !best ||
      r.angle.degrees! > best.angle.degrees! ||
      (r.angle.degrees === best.angle.degrees &&
        (Date.parse(r.date) < Date.parse(best.date) ||
          (Date.parse(r.date) === Date.parse(best.date) && r.id < best.id)))
    )
      best = r;
  }
  if (previous) result.previous = reading(previous);
  if (best && earlierCount > 0) result.best = reading(best);
  result.firstComparable =
    result.state === 'comparable' && current.saveState === 'saved' && earlierCount === 0;
  return result;
}
