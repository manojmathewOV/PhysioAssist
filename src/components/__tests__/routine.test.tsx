/**
 * The physiotherapist's routine: per-exercise prescriptions, a versioned plan,
 * "Start today's session" (the patient doesn't choose), moving on to the next
 * exercise, and progress kept as one series per exercise.
 */
import React from 'react';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer } from '../../store';
import { setExercisePlan } from '../../store/slices/settingsSlice';
import { EXERCISES } from '../../constants/exercises';
import ExerciseChooser from '../exercises/ExerciseChooser';
import ExerciseSummary from '../exercises/ExerciseSummary';
import { useRoutineFlow } from '../exercises/useRoutineFlow';
import type { ExerciseKey } from '../exercises/exerciseCatalog';
import HomeScreen from '../../screens/HomeScreen';
import ProgressScreen from '../../screens/ProgressScreen';
import { isWorthKeeping, ExerciseHistory } from '../../store/slices/exerciseSlice';
import { ExercisePlan, applyPlan, goalDegreesOf } from '../../services/pose/exercisePlan';
import {
  nextAfter,
  todaysRoutine,
  toggleRoutine,
  updateRoutineItem,
  withVersion,
} from '../../services/pose/routine';
import { measurementSeries } from '../../utils/measurementSeries';

const NOW = new Date('2026-09-26T15:00:00').getTime();
const today = (h: number) => new Date(`2026-09-26T${String(h).padStart(2, '0')}:00:00`);
const yesterday = new Date('2026-09-25T10:00:00');

const kneePlan: ExercisePlan = {
  joint: 'knee',
  side: 'left',
  extensionGoalDegrees: 5,
  goalDegrees: 100,
  routine: [
    { exerciseId: 'heel-prop-extension', holdSeconds: 30 },
    { exerciseId: 'seated-knee-extension', reps: 12 },
    { exerciseId: 'seated-knee-flexion', reps: 10, goalDegrees: 95 },
  ],
};

const session = (
  exerciseId: string,
  date: Date,
  extra: Partial<ExerciseHistory> = {}
): ExerciseHistory => ({
  id: `${exerciseId}-${date.getTime()}`,
  exerciseId,
  exerciseName: exerciseId,
  date: date.toISOString(),
  reps: 10,
  duration: 60,
  formScore: 0.8,
  ...extra,
});

describe('prescription per exercise', () => {
  it('a routine exercise uses its own repetitions and goal', () => {
    const flexion = applyPlan(EXERCISES.seatedKneeFlexion, kneePlan);
    expect(flexion.targetRepetitions).toBe(10);
    expect(goalDegreesOf(flexion)).toBe(95); // its own, not the plan's 100
    const extension = applyPlan(EXERCISES.seatedKneeExtension, kneePlan);
    expect(extension.targetRepetitions).toBe(12);
    expect(goalDegreesOf(extension)).toBe(5); // the plan's straightening goal
  });

  it('exercises outside the routine keep the plan-wide prescription', () => {
    expect(goalDegreesOf(applyPlan(EXERCISES.squat, kneePlan))).toBe(100);
  });
});

describe('plan versions', () => {
  it('starts at 1 and goes up only when the prescription changes', () => {
    const v1 = withVersion(null, kneePlan, '2026-09-01');
    expect(v1).toMatchObject({ version: 1, prescribedAt: '2026-09-01' });
    // A video is not a prescription change
    const video = withVersion(v1, { ...v1, videos: { squat: 'x' } }, '2026-09-02');
    expect(video).toMatchObject({ version: 1, prescribedAt: '2026-09-01' });
    const reps = withVersion(
      video,
      updateRoutineItem(video, 'seated-knee-extension', { reps: 15 }),
      '2026-09-10'
    );
    expect(reps).toMatchObject({ version: 2, prescribedAt: '2026-09-10' });
    const removed = withVersion(reps, toggleRoutine(reps, 'heel-prop-extension'));
    expect(removed.version).toBe(3);
  });

  it('is applied by the store', () => {
    let state = rootReducer(undefined, setExercisePlan(kneePlan));
    expect(state.settings.exercisePlan?.version).toBe(1);
    state = rootReducer(state, setExercisePlan({ ...kneePlan, limitDegrees: 110 }));
    expect(state.settings.exercisePlan?.version).toBe(2);
  });
});

describe("today's routine", () => {
  it('ticks what was done today, in order; an unmeasured attempt still counts', () => {
    const history = [
      session('seated-knee-extension', today(9), { measured: false }),
      session('heel-prop-extension', yesterday),
    ];
    const r = todaysRoutine(kneePlan, history, NOW);
    expect(r.items.map((i) => i.done)).toEqual([false, true, false]);
    expect(r.doneCount).toBe(1);
    expect(r.next).toBe('heel-prop-extension');
    expect(nextAfter(r, 'heel-prop-extension')).toBe('seated-knee-flexion');
  });

  it('never offers the exercise just finished as the next one', () => {
    // Heel prop wasn't saved (nothing counted) and the rest are done
    const history = [
      session('seated-knee-extension', today(9)),
      session('seated-knee-flexion', today(10)),
    ];
    const r = todaysRoutine(kneePlan, history, NOW);
    expect(nextAfter(r, 'heel-prop-extension')).toBeUndefined();
  });
});

describe('a session is kept by one rule', () => {
  it('counts analysis repetitions, measurements and unmeasured attempts', () => {
    expect(isWorthKeeping({ reps: 3 }, 0)).toBe(true);
    expect(isWorthKeeping({ measured: false }, 0)).toBe(true);
    expect(isWorthKeeping({ bestDegrees: 6 }, 0)).toBe(true);
    expect(isWorthKeeping(undefined, 0)).toBe(false);
  });
});

const storeWith = (plan: ExercisePlan | null, history: ExerciseHistory[] = []) => {
  const defaults = rootReducer(undefined, { type: '@@test/INIT' });
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...defaults,
      exercise: { ...defaults.exercise, history },
      settings: { ...defaults.settings, exercisePlan: plan },
    },
  });
};

describe('Exercise screen with a routine', () => {
  const routine = todaysRoutine(kneePlan, [], NOW);

  it("shows today's exercises and one button that starts the next", () => {
    const onStartRoutine = jest.fn();
    const { getByTestId, getByText } = render(
      <Provider store={storeWith(kneePlan)}>
        <ExerciseChooser
          selectedKey="heelPropExtension"
          onSelect={jest.fn()}
          onStart={jest.fn()}
          plan={kneePlan}
          onPlanChange={jest.fn()}
          routine={routine}
          onStartRoutine={onStartRoutine}
          onToggleRoutine={jest.fn()}
        />
      </Provider>
    );
    expect(getByText('Today’s exercises')).toBeTruthy();
    expect(getByTestId('todays-routine-status')).toHaveTextContent(
      '0 of 3 exercises done'
    );
    expect(getByTestId('todays-routine-item-1')).toHaveTextContent(/12 times/);
    fireEvent.press(getByTestId('start-routine-button'));
    expect(onStartRoutine).toHaveBeenCalled();
  });

  it('the physio adds or removes the selected exercise', () => {
    const onToggleRoutine = jest.fn();
    const { getByTestId } = render(
      <Provider store={storeWith(kneePlan)}>
        <ExerciseChooser
          selectedKey="shortArcQuad"
          onSelect={jest.fn()}
          onStart={jest.fn()}
          plan={kneePlan}
          onPlanChange={jest.fn()}
          routine={routine}
          onStartRoutine={jest.fn()}
          onToggleRoutine={onToggleRoutine}
        />
      </Provider>
    );
    fireEvent(getByTestId('exercise-routine-toggle'), 'onValueChange', true);
    expect(onToggleRoutine).toHaveBeenCalledWith('short-arc-quad');
  });

  it('the summary goes straight on to the next exercise', () => {
    const onPress = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <ExerciseSummary
        exercise="Heel prop"
        onDone={jest.fn()}
        onRepeat={jest.fn()}
        next={{ title: 'Seated knee straightening', onPress }}
      />
    );
    expect(getByTestId('next-exercise-button')).toHaveTextContent(
      'Next: Seated knee straightening'
    );
    expect(queryByTestId('retry-button')).toBeNull();
    fireEvent.press(getByTestId('next-exercise-button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('says when today’s session is finished', () => {
    const { getByTestId } = render(<ExerciseSummary onDone={jest.fn()} routineDone />);
    expect(getByTestId('summary-routine-done')).toBeTruthy();
  });
});

describe('Home with a routine', () => {
  it("counts exercises to go and says Start today's session", () => {
    const { getByTestId } = render(
      <Provider store={storeWith(kneePlan, [session('heel-prop-extension', new Date())])}>
        <HomeScreen />
      </Provider>
    );
    expect(getByTestId('home-routine')).toHaveTextContent(/2 exercises to go/);
    expect(getByTestId('home-start-exercises')).toHaveTextContent(
      'Continue today’s session'
    );
  });
});

describe('progress as one series per exercise', () => {
  const history = [
    // newest first, as stored
    session('seated-knee-extension', today(9), {
      joint: 'left_knee',
      bestDegrees: 8,
      direction: 'toward',
      planVersion: 2,
    }),
    session('heel-prop-extension', today(8), {
      joint: 'left_knee',
      measured: false,
      direction: 'toward',
      planVersion: 2,
    }),
    session('seated-knee-extension', yesterday, {
      joint: 'left_knee',
      bestDegrees: 12,
      direction: 'toward',
      planVersion: 2,
    }),
    session('seated-knee-extension', new Date('2026-09-01T10:00:00'), {
      joint: 'left_knee',
      bestDegrees: 25,
      direction: 'toward',
      planVersion: 1,
    }),
  ];

  it('never mixes exercises, keeps unmeasured sessions, and compares within one plan', () => {
    const series = measurementSeries(history, 2);
    const active = series.find((s) => s.exerciseId === 'seated-knee-extension')!;
    expect(active.points.map((p) => p.degrees)).toEqual([25, 12, 8]);
    expect(active.thisPlan.map((p) => p.degrees)).toEqual([12, 8]);
    expect(active.earlierPlans.map((p) => p.degrees)).toEqual([25]);
    const passive = series.find((s) => s.exerciseId === 'heel-prop-extension')!;
    expect(passive).toMatchObject({ measuredCount: 0, unmeasuredCount: 1 });
    expect(passive.latest).toBeUndefined();
  });

  it('Progress leads with the measurement, labelled by plan, without claiming improvement', () => {
    const { getByTestId, queryByText } = render(
      <Provider store={storeWith({ ...kneePlan, version: 2 }, history)}>
        <ProgressScreen />
      </Provider>
    );
    expect(getByTestId('progress-series-0-latest')).toHaveTextContent(
      /8°.*from straight/
    );
    expect(getByTestId('progress-series-0-earlier')).toHaveTextContent(/12°/);
    expect(getByTestId('progress-series-0-before')).toHaveTextContent(
      /Before your current plan: 25° from straight/
    );
    expect(getByTestId('progress-series-1-none')).toBeTruthy();
    expect(getByTestId('progress-series-1-unmeasured')).toHaveTextContent(
      '1 session couldn’t be measured'
    );
    expect(getByTestId('progress-series-note')).toBeTruthy();
    expect(queryByText(/improved/i)).toBeNull();
  });
});

describe('starting the routine on the Exercise screen', () => {
  it('selects the next exercise, then starts it once selected', () => {
    const calls: string[] = [];
    let selected = 'squat';
    const store = storeWith(kneePlan);
    const { result } = renderHook(
      () =>
        useRoutineFlow({
          plan: kneePlan,
          setSelectedKey: (k: ExerciseKey) => {
            selected = k;
            calls.push(`select ${k}`);
          },
          start: () => calls.push(`start ${selected}`),
        }),
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Provider store={store}>{children}</Provider>
        ),
      }
    );
    act(() => result.current.startRoutine());
    expect(calls).toEqual(['select heelPropExtension', 'start heelPropExtension']);
  });
});
