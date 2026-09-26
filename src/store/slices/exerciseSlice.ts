import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Exercise, ValidationResult, ExerciseMetrics } from '../../types/exercise';
import { liveCue } from '../../utils/liveCue';
import {
  SessionClock,
  activeMs,
  pause,
  pausedMsOf,
  resume,
  seconds,
  wallMs,
} from '../../services/session/sessionClock';

/** The session clock held in the exercise state. */
export const clockOf = (s: {
  startedAt: number | null;
  pausedAt?: number | null;
  pausedMs?: number;
}): SessionClock => ({
  startedAt: s.startedAt,
  pausedAt: s.pausedAt ?? null,
  pausedMs: s.pausedMs ?? 0,
});

export interface ExerciseHistory {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  reps: number;
  duration: number;
  formScore: number;
  metrics?: ExerciseMetrics;
  /** Patient-reported pain after the session, 0 (none) to 10 (worst). */
  painScore?: number;
  /** Joint of interest, e.g. 'left_shoulder'. */
  joint?: string;
  /** Best range reached for that joint, clinical degrees from neutral. */
  bestDegrees?: number;
  /** The goal (standard) the patient was asked to reach. */
  goalDegrees?: number;
  direction?: SessionResult['direction'];
  measure?: string;
  approximate?: boolean;
  measured?: boolean;
  unavailableReason?: string;
  planVersion?: number;
  method?: string;
  /** From Go to Stop, and how much of it was paused (s); `duration` is active time. */
  wallSeconds?: number;
  pausedSeconds?: number;
  completion?: SessionResult['completion'];
  /** The patient said they did the whole exercise (the camera couldn't count it). */
  confirmedByPatient?: boolean;
}

/** Extra results recorded with a finished session. */
export interface SessionResult {
  joint?: string;
  bestDegrees?: number;
  goalDegrees?: number;
  /** 'toward' when smaller is better (straightening). */
  direction?: 'away' | 'toward';
  /** What was measured, when not the joint's usual range (e.g. 'rotation'). */
  measure?: string;
  /** The number is an estimate. */
  approximate?: boolean;
  /** Repetitions from the movement analysis, when the live counter can't count them. */
  reps?: number;
  /** False when the session couldn't be measured (kept, so gaps stay visible). */
  measured?: boolean;
  /** Why it couldn't be measured. */
  unavailableReason?: string;
  /** The prescription version the session was done under (see ExercisePlan.version). */
  planVersion?: number;
  /** How the number was measured (see measurementMethodOf): series compare within one. */
  method?: string;
  /** How much of the prescribed exercise was done (see completionOf). */
  completion?: 'completed' | 'stopped_early' | 'attempted';
}

/**
 * Whether a finished session goes into the history: some repetitions, a
 * measurement, or an attempt that couldn't be measured (kept, so gaps stay
 * visible). `liveReps` is the live counter's count.
 */
export const isWorthKeeping = (result: SessionResult | undefined, liveReps: number) =>
  (result?.reps ?? liveReps) > 0 ||
  result?.bestDegrees !== undefined ||
  result?.measured === false;

interface ExerciseState {
  currentExercise: Exercise | null;
  isExercising: boolean;
  currentPhase: string;
  repetitionCount: number;
  formScore: number;
  feedback: string;
  lastValidationResult: ValidationResult | null;
  metrics: ExerciseMetrics | null;
  history: ExerciseHistory[];
  /** When the current exercise started (ms since epoch). */
  startedAt: number | null;
  /** When the current pause began (see sessionClock). */
  pausedAt: number | null;
  /** Paused time before the current pause (ms). */
  pausedMs: number;
}

/**
 * Most recent sessions kept on the device. Several prescribed sessions a day
 * add up (9 a day would fill 200 in about three weeks), and the baseline
 * measurements must not be dropped that soon: 3000 is about a year at that
 * rate. A proper retention/export policy is still to be decided.
 */
export const MAX_HISTORY = 3000;

const initialState: ExerciseState = {
  currentExercise: null,
  isExercising: false,
  currentPhase: 'rest',
  repetitionCount: 0,
  formScore: 0,
  feedback: '',
  lastValidationResult: null,
  metrics: null,
  history: [],
  startedAt: null,
  pausedAt: null,
  pausedMs: 0,
};

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    startExercise: (state, action: PayloadAction<Exercise>) => {
      state.currentExercise = action.payload;
      state.isExercising = true;
      state.currentPhase = 'rest';
      state.repetitionCount = 0;
      state.formScore = 0;
      state.feedback = '';
      state.startedAt = Date.now();
      state.pausedAt = null;
      state.pausedMs = 0;
    },
    /** Pause and resume the session clock (the live timer, completion and history share it). */
    pauseExercise: (state, action: PayloadAction<number | undefined>) => {
      Object.assign(state, pause(clockOf(state), action.payload ?? Date.now()));
    },
    resumeExercise: (state, action: PayloadAction<number | undefined>) => {
      Object.assign(state, resume(clockOf(state), action.payload ?? Date.now()));
    },
    stopExercise: (state, action: PayloadAction<SessionResult | undefined>) => {
      // Record the finished session so patients (and clinicians) can see progress
      // (Rotation and still measurements are counted by the movement analysis,
      // so their result carries the reps, or a measurement with no reps at all)
      const reps = action.payload?.reps ?? state.repetitionCount;
      if (
        state.isExercising &&
        state.currentExercise &&
        isWorthKeeping(action.payload, state.repetitionCount)
      ) {
        const now = Date.now();
        state.history.unshift({
          id: `${state.currentExercise.id}-${now}`,
          exerciseId: state.currentExercise.id,
          exerciseName: state.currentExercise.name,
          date: new Date(now).toISOString(),
          // Active time: pauses don't count towards the exercise
          duration: seconds(activeMs(clockOf(state), now)),
          wallSeconds: seconds(wallMs(clockOf(state), now)),
          pausedSeconds: seconds(pausedMsOf(clockOf(state), now)),
          formScore: state.formScore,
          ...action.payload,
          reps,
        });
        state.history.splice(MAX_HISTORY);
      }
      state.isExercising = false;
      state.currentPhase = 'rest';
      state.startedAt = null;
      state.pausedAt = null;
      state.pausedMs = 0;
    },
    updateValidation: (state, action: PayloadAction<ValidationResult>) => {
      state.lastValidationResult = action.payload;
      state.currentPhase = action.payload.phase;
      // The same instruction the screens show and speak (a precaution first)
      const cue = liveCue(action.payload);
      if (cue.text) state.feedback = cue.text;
    },
    incrementReps: (state, action: PayloadAction<number>) => {
      state.repetitionCount += action.payload;
    },
    updateFormScore: (state, action: PayloadAction<number>) => {
      state.formScore = action.payload;
    },
    updatePhase: (state, action: PayloadAction<string>) => {
      state.currentPhase = action.payload;
    },
    setFeedback: (state, action: PayloadAction<string>) => {
      state.feedback = action.payload;
    },
    setMetrics: (state, action: PayloadAction<ExerciseMetrics>) => {
      state.metrics = action.payload;
    },
    updateExerciseProgress: (
      state,
      action: PayloadAction<{
        reps?: number;
        formScore?: number;
        phase?: string;
        metrics?: ExerciseMetrics;
      }>
    ) => {
      if (action.payload.reps !== undefined) {
        state.repetitionCount = action.payload.reps;
      }
      if (action.payload.formScore !== undefined) {
        state.formScore = action.payload.formScore;
      }
      if (action.payload.phase !== undefined) {
        state.currentPhase = action.payload.phase;
      }
      if (action.payload.metrics !== undefined) {
        state.metrics = action.payload.metrics;
      }
    },
    /**
     * The patient confirms they did the whole exercise when the camera
     * couldn't count it: completed, but still not measured.
     */
    confirmLastSessionCompleted: (state) => {
      if (state.history[0]) {
        state.history[0].completion = 'completed';
        state.history[0].confirmedByPatient = true;
      }
    },
    /** Pain (0-10) reported on the summary screen for the session just recorded. */
    setLastSessionPain: (state, action: PayloadAction<number>) => {
      const score = Math.round(action.payload);
      if (state.history[0] && Number.isFinite(score)) {
        state.history[0].painScore = Math.min(10, Math.max(0, score));
      }
    },
    clearExercise: (state) => {
      state.currentExercise = null;
      state.isExercising = false;
      state.currentPhase = 'rest';
      state.repetitionCount = 0;
      state.formScore = 0;
      state.feedback = '';
      state.lastValidationResult = null;
      state.metrics = null;
      state.startedAt = null;
      state.pausedAt = null;
      state.pausedMs = 0;
    },
  },
});

export const {
  startExercise,
  stopExercise,
  pauseExercise,
  resumeExercise,
  updateValidation,
  incrementReps,
  updateFormScore,
  updatePhase,
  setFeedback,
  setMetrics,
  updateExerciseProgress,
  setLastSessionPain,
  confirmLastSessionCompleted,
  clearExercise,
} = exerciseSlice.actions;

export default exerciseSlice.reducer;
