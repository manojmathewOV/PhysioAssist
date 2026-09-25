/**
 * Scenario library for the virtual patient: deterministic recordings of how real
 * patients move (and fail to), each with the outcome the app must produce.
 *
 * These are software tests, not clinical ground truth: they check that the
 * pipeline counts, freezes and warns correctly. Clinical accuracy is measured
 * against real recordings (see docs/benchmarks).
 */
import { BodyPose, FrameEffects, MEDIAPIPE_ORDER, STANDING } from './body';
import { Keyframe, gaussian, repetitions, seededRandom } from './timeline';

export interface ScenarioExpectation {
  /** Exact repetitions the app should count. */
  reps: number;
  /** Should the "turn side-on" (limb out of the image plane) warning appear? */
  estimatedJoints?: boolean;
}

export interface Scenario {
  id: string;
  /** Exercise id from src/constants/exercises.ts. */
  exerciseId: string;
  title: string;
  description: string;
  base: BodyPose;
  timeline: Keyframe[];
  /** Per-frame camera/model problems. `rand` is seeded per scenario. */
  effects?: (t: number, rand: () => number) => FrameEffects;
  expect: ScenarioExpectation;
}

const SIDE: BodyPose = { ...STANDING, view: 'side' };
const FRONT: BodyPose = {
  ...STANDING,
  view: 'front',
  leftShoulder: 90,
  rightShoulder: 90,
  leftElbow: 90,
  rightElbow: 90,
};

const CURL_REST = { leftElbow: 172, rightElbow: 172 };
const CURL_TOP = { leftElbow: 40, rightElbow: 40 };
const curl = (over: Partial<Parameters<typeof repetitions>[0]> = {}) =>
  repetitions({
    rest: CURL_REST,
    target: CURL_TOP,
    reps: 5,
    moveMs: 900,
    holdMs: 1400, // exercise asks for a 1 s hold
    restMs: 700,
    ...over,
  });

const SQUAT_REST = { leftKnee: 176, rightKnee: 176, leftHip: 176, rightHip: 176 };
const SQUAT_BOTTOM = { leftKnee: 88, rightKnee: 88, leftHip: 88, rightHip: 88 };
const squat = (over: Partial<Parameters<typeof repetitions>[0]> = {}) =>
  repetitions({
    rest: SQUAT_REST,
    target: SQUAT_BOTTOM,
    reps: 5,
    moveMs: 1200,
    holdMs: 900,
    restMs: 700,
    ...over,
  });

/** Every landmark jitters by a seeded Gaussian of `sd` pixels. */
const jitter =
  (sd: number) =>
  (_t: number, rand: () => number): FrameEffects => {
    const offsets: FrameEffects['offsets'] = {};
    for (const name of MEDIAPIPE_ORDER) {
      offsets[name] = { x: gaussian(rand) * sd, y: gaussian(rand) * sd };
    }
    return { offsets };
  };

/** Time window [from, to) of the n-th repetition (0-based) of a rep plan. */
const repWindow = (n: number, lead: number, rep: number): [number, number] => [
  lead + n * rep,
  lead + (n + 1) * rep,
];

const CURL_REP_MS = 900 + 1400 + 900 + 700;

export const SCENARIOS: Scenario[] = [
  {
    id: 'bicep-curl-normal',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, good form',
    description: 'Five full curls, side-on, holding each for over a second.',
    base: SIDE,
    timeline: curl(),
    expect: { reps: 5 },
  },
  {
    id: 'bicep-curl-limited',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, limited range',
    description: 'The elbow only bends to 75°, short of the 30-50° goal.',
    base: SIDE,
    timeline: curl({ target: { leftElbow: 75, rightElbow: 75 } }),
    expect: { reps: 0 },
  },
  {
    id: 'bicep-curl-jitter',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, shaky tracking',
    description: 'Good curls with 3 px of landmark noise on every frame.',
    base: SIDE,
    timeline: curl(),
    effects: jitter(3),
    expect: { reps: 5 },
  },
  {
    id: 'bicep-curl-occluded',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, hands hidden',
    description: 'The wrists leave the picture for the whole third curl.',
    base: SIDE,
    timeline: curl(),
    effects: (t) => {
      const [from, to] = repWindow(2, 1000, CURL_REP_MS);
      return t >= from + 100 && t < to - 100
        ? { hidden: new Set(['left_wrist', 'right_wrist']) }
        : {};
    },
    expect: { reps: 4 },
  },
  {
    id: 'bicep-curl-fast',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, too fast',
    description: 'Curls with no pause at the top, so the 1 s hold is never met.',
    base: SIDE,
    timeline: curl({ moveMs: 400, holdMs: 0, restMs: 200 }),
    expect: { reps: 0 },
  },
  {
    id: 'bicep-curl-hover-start',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, wobbling at the start line',
    description:
      'Between curls the arm hovers around 160°, crossing the start threshold repeatedly.',
    base: SIDE,
    timeline: curl({ rest: { leftElbow: 161, rightElbow: 161 } }),
    effects: (t) => {
      // ±4° wobble at the elbow shows up as the wrist swinging ~6 px
      const s = Math.sin((2 * Math.PI * t) / 300) * 6;
      return { offsets: { left_wrist: { x: s, y: 0 }, right_wrist: { x: s, y: 0 } } };
    },
    expect: { reps: 5 },
  },
  {
    id: 'bicep-curl-one-arm',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, only one arm moves',
    description: 'The left arm curls; the right arm stays straight.',
    base: SIDE,
    timeline: curl({ target: { leftElbow: 40, rightElbow: 172 } }),
    expect: { reps: 0 },
  },
  {
    id: 'bicep-curl-stops-early',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, stops after two (e.g. pain)',
    description: 'Two good curls, then the patient stands still.',
    base: SIDE,
    timeline: [...curl({ reps: 2 }), { t: 20000, angles: CURL_REST }],
    expect: { reps: 2 },
  },
  {
    id: 'bicep-curl-facing-camera',
    exerciseId: 'bicep-curl',
    title: 'Bicep curl, forearm pointing at the camera',
    description:
      'Camera placed in front: the forearm moves towards the lens, so the 2D angle is unreliable.',
    base: SIDE,
    timeline: curl(),
    effects: () => ({ depth: { left_wrist: -0.3, right_wrist: -0.3 } }),
    expect: { reps: 5, estimatedJoints: true },
  },
  {
    id: 'squat-normal',
    exerciseId: 'squat',
    title: 'Squat, good depth',
    description: 'Five squats to about 90° at hip and knee, side-on.',
    base: SIDE,
    timeline: squat(),
    expect: { reps: 5 },
  },
  {
    id: 'squat-shallow',
    exerciseId: 'squat',
    title: 'Squat, too shallow',
    description: 'Knees and hips only reach 125°.',
    base: SIDE,
    timeline: squat({
      target: { leftKnee: 125, rightKnee: 125, leftHip: 125, rightHip: 125 },
    }),
    expect: { reps: 0 },
  },
  {
    id: 'squat-jitter',
    exerciseId: 'squat',
    title: 'Squat, shaky tracking',
    description: 'Good squats with 3 px of landmark noise.',
    base: SIDE,
    timeline: squat(),
    effects: jitter(3),
    expect: { reps: 5 },
  },
  {
    id: 'shoulder-press-normal',
    exerciseId: 'shoulder-press',
    title: 'Shoulder press, good form',
    description: 'Facing the camera: arms from goalpost to overhead, five times.',
    base: FRONT,
    timeline: repetitions({
      rest: { leftShoulder: 90, rightShoulder: 90, leftElbow: 90, rightElbow: 90 },
      target: { leftShoulder: 170, rightShoulder: 170, leftElbow: 170, rightElbow: 170 },
      reps: 5,
      moveMs: 1000,
      holdMs: 800,
      restMs: 700,
    }),
    expect: { reps: 5 },
  },
];

export const getScenario = (id: string): Scenario | undefined =>
  SCENARIOS.find((s) => s.id === id);

/** Default practice-mode scenario for each exercise. */
export const practiceScenarioFor = (exerciseId: string): Scenario =>
  SCENARIOS.find((s) => s.exerciseId === exerciseId && s.id.endsWith('-normal')) ??
  SCENARIOS[0];

export { seededRandom };
