import { currentStreak, dailyReps, summarizeWeek } from '../progressSummary';
import exerciseReducer, {
  startExercise,
  stopExercise,
  updateExerciseProgress,
  ExerciseHistory,
} from '../../store/slices/exerciseSlice';
import { EXERCISES } from '../../constants/exercises';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 8, 25, 18, 0).getTime(); // local 6pm
const session = (daysAgo: number, reps: number): ExerciseHistory => ({
  id: `s${daysAgo}-${reps}`,
  exerciseId: 'bicep-curl',
  exerciseName: 'Bicep Curl',
  date: new Date(NOW - daysAgo * DAY).toISOString(),
  reps,
  duration: 60,
  formScore: 80,
});

describe('progress summaries', () => {
  const history = [
    session(0, 10),
    session(0, 5),
    session(1, 8),
    session(3, 4),
    session(9, 20),
  ];

  it('summarizes the last 7 days', () => {
    expect(summarizeWeek(history, NOW)).toEqual({ sessions: 4, reps: 27, activeDays: 3 });
  });

  it('totals reps per local day, oldest first, zero-filled', () => {
    const days = dailyReps(history, 7, NOW);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.value)).toEqual([0, 0, 0, 4, 0, 8, 15]);
  });

  it('counts the streak from today, or from yesterday if today is not done yet', () => {
    expect(currentStreak(history, NOW)).toBe(2);
    expect(currentStreak([session(1, 5), session(2, 5)], NOW)).toBe(2);
    expect(currentStreak([session(3, 5)], NOW)).toBe(0);
  });
});

describe('exercise session history', () => {
  it('records a finished session with reps and form score', () => {
    let state = exerciseReducer(undefined, startExercise(EXERCISES.bicepCurl));
    state = exerciseReducer(state, updateExerciseProgress({ reps: 12, formScore: 85 }));
    state = exerciseReducer(state, stopExercise());
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toMatchObject({
      exerciseId: 'bicep-curl',
      exerciseName: 'Bicep Curl',
      reps: 12,
      formScore: 85,
    });
    expect(state.isExercising).toBe(false);
  });

  it('does not record a session with no repetitions', () => {
    let state = exerciseReducer(undefined, startExercise(EXERCISES.bicepCurl));
    state = exerciseReducer(state, stopExercise());
    expect(state.history).toHaveLength(0);
  });
});
