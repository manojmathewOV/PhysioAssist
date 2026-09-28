/** Synthetic UI/logic fixtures. NEVER a clinical method registration or patient record. */
import type {
  SleeperCheck,
  SleeperMethod,
  SleeperResultContext,
} from '../services/checks/sleeperResult';
export const EXAMPLE_METHOD: SleeperMethod = {
  id: 'synthetic-only',
  revision: 'example-v1',
  variant: 'shoulder-level-sleeper',
  assistance: 'other-hand',
  setupProtocol: 'example-bedside',
  angleReference: 'forearm-neutral',
  estimator: 'known-inputs',
  endpointProtocol: 'predefined-window-two-attempts',
  allowanceVersion: 'NOT-CLINICAL',
  minCaudalDegrees: -5,
  maxCaudalDegrees: 10,
  displayStepDegrees: 1,
  angleValidOutsideBand: true,
};
export const EXAMPLE_CONTEXT: SleeperResultContext = {
  profileId: 'synthetic-person',
  episodeId: 'synthetic-recovery',
  side: 'left',
  mode: 'evaluation',
  methods: [EXAMPLE_METHOD],
  historyComplete: true,
};
export function exampleCheck(id = 'current', degrees = 42, day = 28): SleeperCheck {
  return {
    schema: 1,
    kind: 'check',
    exerciseId: 'sleeper-stretch',
    id,
    profileId: EXAMPLE_CONTEXT.profileId,
    episodeId: EXAMPLE_CONTEXT.episodeId,
    side: 'left',
    date: `2026-09-${String(day).padStart(2, '0')}T09:00:00.000Z`,
    source: 'synthetic',
    saveState: 'saved',
    method: { ...EXAMPLE_METHOD },
    interval: {
      id: `window-${id}`,
      fromT: 1000,
      toT: 3000,
      baselineId: `setup-${id}`,
      attempts: 2,
    },
    setup: 'acceptable',
    angle: { state: 'observed', degrees, intervalId: `window-${id}` },
    elbow: {
      state: 'observed',
      caudalDegrees: 3,
      uncertaintyDegrees: 0,
      initialCaudalDegrees: 1,
      intervalId: `window-${id}`,
    },
  };
}
export const EXAMPLE_HISTORY = [
  exampleCheck('previous', 38, 25),
  exampleCheck('best', 45, 20),
];
