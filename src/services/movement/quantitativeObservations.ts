/** Continuous quantities are not warnings or clinical clearance.
 * This opt-in channel preserves held-window data, including zero/unknown.
 * It does not install or approve a sleeper estimator.
 */
import type { MovementContext, MovementFrame } from './types';
import type { StaticMeasurement } from './staticHold';
export interface QuantitativeValue {
  id: string;
  unit: 'deg' | '%torso' | 'ratio';
  state: 'observed' | 'unavailable' | 'not_applicable';
  value?: number;
  observedFrames: number;
  reason?: string;
}
export interface ObservationInterval {
  fromT: number;
  toT: number;
  baselineT: number | null;
  sampledFrames: number;
  basis: 'accepted_angle_window' | 'unmeasured_attempt';
}
export interface HeldObservations {
  method: string;
  interval: ObservationInterval | null;
  values: QuantitativeValue[];
  error?: 'no_interval' | 'observer_failed' | 'invalid_output';
}
export interface HoldObservationProvider {
  method: string;
  observe: (
    frames: readonly MovementFrame[],
    context: MovementContext,
    interval: Readonly<ObservationInterval>,
    baseline: MovementFrame | null
  ) => readonly QuantitativeValue[];
}
/** Technical bound on metadata, not a movement or clinical threshold. */
export const MAX_QUANTITIES_PER_WINDOW = 32;
export function collectHeldObservations(
  frames: MovementFrame[],
  context: MovementContext,
  hold: StaticMeasurement | null,
  provider?: HoldObservationProvider
): HeldObservations | undefined {
  if (!provider) return undefined;
  const validTime = frames.filter((f) => Number.isFinite(f.t));
  const selected = hold
    ? validTime.filter((f) => f.t >= hold.fromT && f.t <= hold.toT)
    : validTime;
  const result: HeldObservations = {
    method: provider.method,
    interval: null,
    values: [],
  };
  if (!selected.length || selected.some((f, i) => i > 0 && f.t <= selected[i - 1].t)) {
    return { ...result, error: 'no_interval' };
  }
  const interval: ObservationInterval = {
    fromT: selected[0].t,
    toT: selected[selected.length - 1].t,
    baselineT: validTime[0]?.t ?? null,
    sampledFrames: selected.length,
    basis: hold ? 'accepted_angle_window' : 'unmeasured_attempt',
  };
  result.interval = interval;
  try {
    const values = provider.observe(selected, context, interval, validTime[0] ?? null);
    if (
      !provider.method.trim() ||
      provider.method.length > 160 ||
      !Array.isArray(values) ||
      values.length > MAX_QUANTITIES_PER_WINDOW
    )
      return { ...result, error: 'invalid_output' };
    const ids = new Set<string>();
    for (const v of values) {
      const known =
        v &&
        typeof v.id === 'string' &&
        v.id.trim() &&
        v.id.length <= 120 &&
        ['deg', '%torso', 'ratio'].includes(v.unit) &&
        ['observed', 'unavailable', 'not_applicable'].includes(v.state);
      const count =
        v &&
        Number.isInteger(v.observedFrames) &&
        v.observedFrames >= 0 &&
        v.observedFrames <= selected.length;
      const number =
        v &&
        (v.state === 'observed'
          ? Number.isFinite(v.value) && v.observedFrames > 0
          : v.value === undefined);
      const reason =
        v &&
        (v.reason === undefined ||
          (typeof v.reason === 'string' && v.reason.length <= 240));
      if (!known || !count || !number || !reason || ids.has(v.id))
        return { ...result, error: 'invalid_output' };
      ids.add(v.id);
    }
    result.values = values.map((v) => ({
      id: v.id,
      unit: v.unit,
      state: v.state,
      observedFrames: v.observedFrames,
      ...(v.value !== undefined ? { value: v.value } : {}),
      ...(v.reason !== undefined ? { reason: v.reason } : {}),
    }));
    return result;
  } catch {
    return { ...result, error: 'observer_failed' };
  }
}
