/**
 * Acceptance cases from the independent follow-up review of 29e6e14, tested
 * along the patient's path (result -> selected instruction -> rendered screen
 * and speech -> saved record -> routine -> progress), not only inside one
 * function.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer } from '../../store';
import {
  ExerciseHistory,
  confirmLastSessionCompleted,
  isWorthKeeping,
  startExercise,
  stopExercise,
  updateValidation,
} from '../../store/slices/exerciseSlice';
import ExerciseSummary from '../exercises/ExerciseSummary';
import { routineAmount } from '../exercises/TodaysRoutineCard';
import ProgressScreen from '../../screens/ProgressScreen';
import { completionOf, todaysRoutine } from '../../services/pose/routine';
import { measurementSeries } from '../../utils/measurementSeries';
import { measureStaticHold } from '../../services/movement/staticHold';
import type { MovementFrame } from '../../services/movement/types';
import { EXERCISES } from '../../constants/exercises';
import ExerciseControls from '../exercises/ExerciseControls';
import { speakLiveFeedback } from '../exercises/liveFeedback';
import { audioFeedbackService } from '../../services/audioFeedbackService';
import { ExerciseValidationService } from '../../services/exerciseValidationService';
import { ExercisePlan, applyPlan, goalDegreesOf } from '../../services/pose/exercisePlan';
import { STANDING } from '../../testing/virtualPatient/body';
import { repetitions } from '../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../testing/virtualPatient/VirtualPatient';
import type { Scenario } from '../../testing/virtualPatient/scenarios';
import type { ValidationResult } from '../../types/exercise';

describe('F1: a precaution wins over praise everywhere', () => {
  /** Arm raised to about 93° with a 90° goal and a 90° limit (test values). */
  const pastTheLimit = (): ValidationResult => {
    const exercise = applyPlan(EXERCISES.armRaise, {
      joint: 'shoulder',
      side: 'left',
      goalDegrees: 90,
      limitDegrees: 90,
    });
    const service = new ExerciseValidationService();
    service.startExercise(exercise);
    const scenario: Scenario = {
      id: 'past-limit',
      exerciseId: 'arm-raise',
      title: '',
      description: '',
      base: { ...STANDING, view: 'side' },
      timeline: repetitions({
        rest: { leftShoulder: 10 },
        target: { leftShoulder: 93 },
        reps: 1,
        moveMs: 1000,
        holdMs: 1500,
        restMs: 0,
      }),
      expect: { reps: 0 },
    };
    let last: ValidationResult | undefined;
    for (const f of new VirtualPatient(scenario).frames()) {
      const r = service.validatePose(f.pose);
      if (r.overLimit) last = r;
    }
    expect(last).toBeDefined();
    return last as ValidationResult;
  };

  it('the result carries the warning and no praise or hold countdown', () => {
    const r = pastTheLimit();
    expect(r.errors[0]).toBe("Not so far: don't raise your arm past 90°");
    expect(r.feedback.some((m) => /Perfect|Good |Hold for/.test(m))).toBe(false);
  });

  it('the rendered instruction is the warning', () => {
    const r = pastTheLimit();
    const defaults = rootReducer(undefined, { type: '@@test/INIT' });
    const store = configureStore({ reducer: rootReducer, preloadedState: defaults });
    store.dispatch(startExercise(EXERCISES.armRaise));
    // A praise message arriving together with the warning must not win either
    store.dispatch(
      updateValidation({ ...r, feedback: ['Perfect left_shoulder angle!'] })
    );
    const { getAllByText, queryByText } = render(
      <Provider store={store}>
        <ExerciseControls isActive />
      </Provider>
    );
    expect(getAllByText("Not so far: don't raise your arm past 90°").length).toBe(1);
    expect(queryByText(/Perfect/)).toBeNull();
  });

  it('speech says the warning straight away and a repetition is not celebrated', () => {
    const r = pastTheLimit();
    const warn = jest.spyOn(audioFeedbackService, 'speakWarning').mockReturnValue(true);
    const correct = jest.spyOn(audioFeedbackService, 'speakCorrection');
    const rep = jest.spyOn(audioFeedbackService, 'announceRep').mockResolvedValue();
    const spoken = speakLiveFeedback(r, {
      reps: 3,
      previousReps: 2,
      outOfView: false,
      lastSpoken: '',
    });
    expect(spoken).toBe("Not so far: don't raise your arm past 90°");
    expect(warn).toHaveBeenCalled();
    expect(correct).not.toHaveBeenCalled();
    expect(rep).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});

const on = (hour: number) => new Date(new Date().setHours(hour, 0, 0, 0)).toISOString();
const entry = (patch: Partial<ExerciseHistory>): ExerciseHistory => ({
  id: `${Math.random()}`,
  exerciseId: 'seated-knee-extension',
  exerciseName: 'Seated knee straightening',
  date: on(9),
  reps: 10,
  duration: 90,
  formScore: 0.8,
  ...patch,
});
const rightKnee: ExercisePlan = {
  joint: 'knee',
  side: 'right',
  routine: [
    { exerciseId: 'seated-knee-extension' },
    { exerciseId: 'heel-prop-extension' },
  ],
};

describe('F2: completion belongs to the prescribed side', () => {
  it('a left-knee session does not complete a right-knee exercise', () => {
    const r = todaysRoutine(rightKnee, [
      entry({ joint: 'left_knee', completion: 'completed' }),
    ]);
    expect(r.items[0].done).toBe(false);
    expect(r.next).toBe('seated-knee-extension');
  });

  it('the right-knee session does', () => {
    const r = todaysRoutine(rightKnee, [
      entry({ joint: 'right_knee', completion: 'completed' }),
    ]);
    expect(r.items[0].done).toBe(true);
  });
});

describe('F3: attempted, stopped early and completed are different', () => {
  const ext = applyPlan(EXERCISES.seatedKneeExtension, { ...rightKnee, reps: 10 });
  const heel = applyPlan(EXERCISES.heelPropExtension, rightKnee);

  it('judges completion from the prescription, not from measurement', () => {
    expect(completionOf(ext, { reps: 10, durationSeconds: 60 })).toBe('completed');
    expect(completionOf(ext, { reps: 4, durationSeconds: 30 })).toBe('stopped_early');
    expect(completionOf(ext, { reps: 0, durationSeconds: 0 })).toBe('attempted');
    // A still hold is timed: 30 s prescribed by default
    expect(completionOf(heel, { reps: 0, durationSeconds: 31 })).toBe('completed');
    expect(completionOf(heel, { reps: 0, durationSeconds: 12 })).toBe('stopped_early');
    expect(completionOf(heel, { reps: 0, durationSeconds: 0 })).toBe('attempted');
  });

  it('a zero-length unmeasured attempt is kept but does not tick the exercise', () => {
    const attempt = entry({
      joint: 'right_knee',
      reps: 0,
      duration: 0,
      measured: false,
      completion: 'attempted',
    });
    expect(isWorthKeeping(attempt, 0)).toBe(true);
    const r = todaysRoutine(rightKnee, [attempt]);
    expect(r.items[0]).toMatchObject({
      status: 'attempted',
      done: false,
      finished: false,
    });
    expect(r.next).toBe('seated-knee-extension');
  });

  it('stopping early moves on without being called done', () => {
    const r = todaysRoutine(rightKnee, [
      entry({ joint: 'right_knee', reps: 4, completion: 'stopped_early' }),
    ]);
    expect(r.items[0]).toMatchObject({ done: false, finished: true });
    expect(r.next).toBe('heel-prop-extension');
  });

  it('the patient can confirm an exercise the camera could not count', () => {
    let state = rootReducer(undefined, startExercise(EXERCISES.seatedKneeExtension));
    state = rootReducer(
      state,
      stopExercise({ joint: 'right_knee', measured: false, completion: 'attempted' })
    );
    state = rootReducer(state, confirmLastSessionCompleted());
    expect(state.exercise.history[0]).toMatchObject({
      completion: 'completed',
      confirmedByPatient: true,
      measured: false,
    });
    expect(todaysRoutine(rightKnee, state.exercise.history).items[0].done).toBe(true);
  });
});

describe('F4: a still exercise takes its own prescription', () => {
  const plan: ExercisePlan = {
    joint: 'knee',
    side: 'left',
    routine: [{ exerciseId: 'heel-prop-extension', holdSeconds: 60, goalDegrees: 3 }],
  };

  it('the prescribed time and goal reach the exercise, the analysis and the card', () => {
    const heel = applyPlan(EXERCISES.heelPropExtension, plan);
    expect(heel.phases[0].holdDuration).toBe(60000);
    expect(goalDegreesOf(heel)).toBe(3);
    expect(routineAmount(plan.routine![0])).toBe('Rest still for 1 min');
  });

  it('a 60-second exercise is still measured over a short still window', () => {
    // Four seconds of still, observed frames: enough to measure
    const frames: MovementFrame[] = Array.from({ length: 120 }, (_, i) => ({
      t: i * 33,
      angle: 6,
      landmarks: [],
      view: 'side',
    }));
    expect(measureStaticHold(frames)?.degrees).toBeCloseTo(6);
  });
});

describe('F5: "this plan" means the current prescription', () => {
  const history = [
    entry({ joint: 'left_knee', measured: false, planVersion: 3, date: on(10) }),
    entry({
      joint: 'left_knee',
      bestDegrees: 9,
      direction: 'toward',
      planVersion: 2,
      date: on(9),
    }),
    entry({
      joint: 'left_knee',
      bestDegrees: 14,
      direction: 'toward',
      planVersion: 2,
      date: on(8),
    }),
  ];

  it('an unmeasured session under a new plan leaves older values as earlier plans', () => {
    const [s] = measurementSeries(history, 3);
    expect(s.thisPlan).toEqual([]);
    expect(s.earlierPlans.map((p) => p.degrees)).toEqual([14, 9]);
  });

  it('Progress says so instead of calling old values "this plan"', () => {
    const defaults = rootReducer(undefined, { type: '@@test/INIT' });
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: {
        ...defaults,
        exercise: { ...defaults.exercise, history },
        settings: {
          ...defaults.settings,
          exercisePlan: { joint: 'knee', side: 'left', version: 3 },
        },
      },
    });
    const { getByTestId, queryByText } = render(
      <Provider store={store}>
        <ProgressScreen />
      </Provider>
    );
    expect(getByTestId('progress-series-0-none')).toHaveTextContent(
      'No measurement with your current plan yet.'
    );
    expect(getByTestId('progress-series-0-before')).toHaveTextContent(/9°/);
    expect(queryByText(/with this plan/i)).toBeNull();
  });
});

describe('summaries say what actually happened', () => {
  it('a still hold is shown as time, not as zero repetitions', () => {
    const { getByTestId, queryByText } = render(
      <ExerciseSummary
        exercise="Heel prop"
        mode="hold"
        holdSeconds={60}
        duration={62}
        reps={0}
        targetReps={1}
        completion="completed"
        range={{ joint: 'left_knee', bestDegrees: 6, direction: 'toward' }}
      />
    );
    expect(getByTestId('summary-title')).toHaveTextContent('Well done!');
    expect(getByTestId('summary-hold-goal')).toHaveTextContent('Rest still for 1 min');
    expect(queryByText(/repetition/i)).toBeNull();
    expect(queryByText(/Your goal: 1/)).toBeNull();
    expect(queryByText(/No repetitions were counted/)).toBeNull();
  });

  it('completed but unmeasured says both', () => {
    const { getByText } = render(
      <ExerciseSummary
        exercise="Seated knee straightening"
        reps={10}
        completion="completed"
      />
    );
    expect(
      getByText(/You completed the exercise\. We couldn’t measure it this time\./)
    ).toBeTruthy();
  });

  it('an unassessable session never says "nothing to correct"', () => {
    const { getByTestId, queryByText } = render(
      <ExerciseSummary
        exercise="Shoulder turn-out"
        completion="attempted"
        findings={[]}
        assessed={false}
        notice="We couldn’t measure your left shoulder today."
      />
    );
    expect(getByTestId('movement-not-assessed')).toBeTruthy();
    expect(queryByText(/Nothing to correct/)).toBeNull();
  });

  it('an attempt offers "I did the whole exercise"; stopping early is not a failure', () => {
    const onConfirm = jest.fn();
    const { getByTestId, rerender, getByText } = render(
      <ExerciseSummary completion="attempted" onConfirmCompleted={onConfirm} />
    );
    fireEvent.press(getByTestId('summary-confirm-completed'));
    expect(onConfirm).toHaveBeenCalled();
    expect(getByTestId('summary-title')).toHaveTextContent('Well done!');
    rerender(<ExerciseSummary completion="stopped_early" />);
    expect(getByText('You stopped early')).toBeTruthy();
  });
});
