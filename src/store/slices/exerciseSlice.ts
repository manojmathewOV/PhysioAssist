import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Exercise, ValidationResult, ExerciseMetrics } from '../../types/exercise';

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
}

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
}

/** Most recent sessions kept on the device. */
const MAX_HISTORY = 200;

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
    },
    stopExercise: (state, action: PayloadAction<SessionResult | undefined>) => {
      // Record the finished session so patients (and clinicians) can see progress
      // (Rotation and still measurements are counted by the movement analysis,
      // so their result carries the reps, or a measurement with no reps at all)
      const reps = action.payload?.reps ?? state.repetitionCount;
      // An attempt that couldn't be measured is kept too, marked as such
      const worthKeeping =
        reps > 0 ||
        action.payload?.bestDegrees !== undefined ||
        action.payload?.measured === false;
      if (state.isExercising && state.currentExercise && worthKeeping) {
        const now = Date.now();
        state.history.unshift({
          id: `${state.currentExercise.id}-${now}`,
          exerciseId: state.currentExercise.id,
          exerciseName: state.currentExercise.name,
          date: new Date(now).toISOString(),
          duration: state.startedAt ? Math.round((now - state.startedAt) / 1000) : 0,
          formScore: state.formScore,
          ...action.payload,
          reps,
        });
        state.history.splice(MAX_HISTORY);
      }
      state.isExercising = false;
      state.currentPhase = 'rest';
      state.startedAt = null;
    },
    updateValidation: (state, action: PayloadAction<ValidationResult>) => {
      state.lastValidationResult = action.payload;
      state.currentPhase = action.payload.phase;
      if (action.payload.feedback.length > 0) {
        state.feedback = action.payload.feedback[0];
      }
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
    },
  },
});

export const {
  startExercise,
  stopExercise,
  updateValidation,
  incrementReps,
  updateFormScore,
  updatePhase,
  setFeedback,
  setMetrics,
  updateExerciseProgress,
  setLastSessionPain,
  clearExercise,
} = exerciseSlice.actions;

export default exerciseSlice.reducer;
