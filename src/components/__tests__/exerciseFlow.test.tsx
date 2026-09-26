/**
 * Patient-facing exercise flow: in-camera controls and the summary card.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer } from '../../store';
import { EXERCISES } from '../../constants/exercises';
import ExerciseControls from '../exercises/ExerciseControls';
import ExerciseSummary from '../exercises/ExerciseSummary';
import { friendlyInstruction } from '../exercises/exerciseCatalog';

type RootTestState = ReturnType<typeof rootReducer>;

const storeWith = (patch: {
  exercise?: Partial<RootTestState['exercise']>;
  settings?: Partial<RootTestState['settings']>;
}) => {
  const defaults = rootReducer(undefined, { type: '@@test/INIT' });
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...defaults,
      exercise: { ...defaults.exercise, ...patch.exercise },
      settings: { ...defaults.settings, ...patch.settings },
    },
  });
};

describe('ExerciseControls during an exercise', () => {
  const active = {
    isExercising: true,
    currentExercise: EXERCISES.bicepCurl,
    repetitionCount: 3,
  };

  it('asks the patient to turn side-on when a reading is only an estimate', () => {
    const store = storeWith({
      exercise: {
        ...active,
        lastValidationResult: {
          isValid: true,
          errors: [],
          phase: 'curl',
          feedback: [],
          estimatedJoints: ['left_elbow'],
        },
      },
    });
    const { getByTestId } = render(
      <Provider store={store}>
        <ExerciseControls isActive />
      </Provider>
    );
    expect(getByTestId('exercise-side-on-hint')).toHaveTextContent(
      'Turn side-on to the camera'
    );
    expect(getByTestId('exercise-rep-counter')).toHaveTextContent('3');
    expect(getByTestId('exercise-end')).toBeTruthy();
  });

  it('hides technical numbers unless joint angles are switched on', () => {
    const { queryByTestId, rerender } = render(
      <Provider
        store={storeWith({ exercise: active, settings: { showJointAngles: false } })}
      >
        <ExerciseControls isActive />
      </Provider>
    );
    expect(queryByTestId('pose-confidence')).toBeNull();

    rerender(
      <Provider
        store={storeWith({ exercise: active, settings: { showJointAngles: true } })}
      >
        <ExerciseControls isActive />
      </Provider>
    );
    expect(queryByTestId('pose-confidence')).toBeTruthy();
  });

  it('shows raw validation messages in plain words', () => {
    expect(friendlyInstruction('Bend left_elbow more')).toBe('Bend left elbow more');
    expect(friendlyInstruction('Cannot detect right_knee')).toBe(
      'Step back so your whole body is in view'
    );
    expect(friendlyInstruction('No exercise selected')).toBe('');
  });
});

describe('ExerciseSummary', () => {
  it('describes form in words and offers Done and Do another', () => {
    const onDone = jest.fn();
    const onRepeat = jest.fn();
    const { getByTestId } = render(
      <ExerciseSummary
        exercise="Bicep curl"
        reps={12}
        targetReps={12}
        duration={95}
        formAccuracy={72}
        onDone={onDone}
        onRepeat={onRepeat}
      />
    );
    expect(getByTestId('reps-completed')).toHaveTextContent('12');
    expect(getByTestId('exercise-duration')).toHaveTextContent('1 min 35 s');
    expect(getByTestId('form-accuracy')).toHaveTextContent('Good form');

    fireEvent.press(getByTestId('done-button'));
    fireEvent.press(getByTestId('retry-button'));
    expect(onDone).toHaveBeenCalled();
    expect(onRepeat).toHaveBeenCalled();
  });
});
