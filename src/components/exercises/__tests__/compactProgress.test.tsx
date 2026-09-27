import React from 'react';
import { Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../../store';
import { EXERCISES } from '../../../constants/exercises';
import {
  startExercise,
  updateExerciseProgress,
  updateValidation,
} from '../../../store/slices/exerciseSlice';
import ExerciseControls from '../ExerciseControls';

const makeStore = () => {
  const defaults = rootReducer(undefined, { type: '@@INIT' });
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...defaults,
      settings: { ...defaults.settings, enableSpeech: false },
    },
  });
};
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android'); // Live-region contract; native iOS bridge is tested separately.
  jest
    .spyOn(require('react-native'), 'useWindowDimensions')
    .mockReturnValue({ width: 320, height: 568, scale: 2, fontScale: 1 });
});
afterEach(() => jest.restoreAllMocks());

it('retains accessible progress semantics when media replaces the ring', () => {
  const store = makeStore();
  store.dispatch(startExercise({ ...EXERCISES.armRaise, targetRepetitions: 10 }));
  const { getByTestId, queryByTestId } = render(
    <Provider store={store}>
      <ExerciseControls isActive mediaVisible />
    </Provider>
  );
  expect(queryByTestId('rep-ring')).toBeNull();
  expect(getByTestId('exercise-compact-progress').props['aria-valuetext']).toBe(
    getByTestId('exercise-compact-progress').props.accessibilityValue.text
  );
  expect(getByTestId('exercise-compact-progress').props.accessibilityLiveRegion).toBe(
    'polite'
  );
  expect(getByTestId('exercise-compact-progress').props.accessibilityRole).toBe(
    'progressbar'
  );
  act(() => {
    store.dispatch(updateExerciseProgress({ reps: 3, formScore: 1 }));
  });
  expect(getByTestId('exercise-compact-progress').props.accessibilityValue.text).toBe(
    '3 of 10 repetitions'
  );
});

it('does not announce compact counts over a warning or a pause', () => {
  const store = makeStore();
  store.dispatch(startExercise(EXERCISES.armRaise));
  store.dispatch(
    updateValidation({
      isValid: false,
      phase: 'rest',
      overLimit: true,
      errors: ['Not so far'],
      feedback: [],
    })
  );
  const view = render(
    <Provider store={store}>
      <ExerciseControls isActive mediaVisible />
    </Provider>
  );
  expect(
    view.getByTestId('exercise-compact-progress').props.accessibilityLiveRegion
  ).toBe('none');
  act(() => {
    store.dispatch(
      updateValidation({ isValid: true, phase: 'rest', errors: [], feedback: [] })
    );
  });
  expect(
    view.getByTestId('exercise-compact-progress').props.accessibilityLiveRegion
  ).toBe('polite');
  view.rerender(
    <Provider store={store}>
      <ExerciseControls isActive mediaVisible isPaused />
    </Provider>
  );
  expect(
    view.getByTestId('exercise-compact-progress').props.accessibilityLiveRegion
  ).toBe('none');
});

it('keeps holds distinct from repetitions without announcing every clock tick', () => {
  const store = makeStore();
  store.dispatch(startExercise(EXERCISES.heelPropExtension));
  const { getByTestId } = render(
    <Provider store={store}>
      <ExerciseControls isActive mediaVisible isPaused />
    </Provider>
  );
  const progress = getByTestId('exercise-compact-progress');
  expect(progress.props.accessibilityValue.text).toMatch(/seconds.*resting still/);
  expect(progress.props.accessibilityValue.text).not.toMatch(/repetitions/);
  expect(progress.props.accessibilityLiveRegion).toBe('none');
});
