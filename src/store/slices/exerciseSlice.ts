import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Exercise, ValidationResult, ExerciseMetrics } from '../../types/exercise';

interface ExerciseHistory {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  reps: number;
  duration: number;
  formScore: number;
  metrics?: ExerciseMetrics;
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
}

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
    },
    stopExercise: (state) => {
      state.isExercising = false;
      state.currentPhase = 'rest';
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
    clearExercise: (state) => {
      state.currentExercise = null;
      state.isExercising = false;
      state.currentPhase = 'rest';
      state.repetitionCount = 0;
      state.formScore = 0;
      state.feedback = '';
      state.lastValidationResult = null;
      state.metrics = null;
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
  clearExercise,
} = exerciseSlice.actions;

export default exerciseSlice.reducer;
