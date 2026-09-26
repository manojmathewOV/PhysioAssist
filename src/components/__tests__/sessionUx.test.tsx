/**
 * Session UX: get-into-position gate, 3-2-1 countdown, rep ring and the
 * post-exercise pain check.
 */
import React from 'react';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer } from '../../store';
import { EXERCISES } from '../../constants/exercises';
import exerciseReducer, {
  setLastSessionPain,
  startExercise,
  stopExercise,
  updateExerciseProgress,
} from '../../store/slices/exerciseSlice';
import { audioFeedbackService } from '../../services/audioFeedbackService';
import ExerciseControls from '../exercises/ExerciseControls';
import ExerciseSummary from '../exercises/ExerciseSummary';
import { RepRing } from '../ui/RepRing';
import { useSessionGate } from '../exercises/useSessionGate';
import { INITIAL_FRAMING } from '../exercises/useFramingReadiness';

const activeStore = (reps: number) => {
  const defaults = rootReducer(undefined, { type: '@@test/INIT' });
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...defaults,
      exercise: {
        ...defaults.exercise,
        isExercising: true,
        currentExercise: EXERCISES.bicepCurl,
        repetitionCount: reps,
      },
    },
  });
};

describe('RepRing', () => {
  it('shows the count and the goal', () => {
    const { getByTestId } = render(
      <RepRing value={4} target={12} testID="rep-ring" valueTestID="value" />
    );
    expect(getByTestId('value')).toHaveTextContent('4');
    expect(getByTestId('rep-ring')).toHaveTextContent(/of 12/);
    expect(getByTestId('rep-ring').props.accessibilityLabel).toBe('4 of 12 repetitions');
  });

  it('says when the goal is reached', () => {
    const { getByTestId } = render(<RepRing value={12} target={12} testID="rep-ring" />);
    expect(getByTestId('rep-ring').props.accessibilityLabel).toMatch(/goal reached/);
  });
});

describe('ExerciseControls session gate', () => {
  it('shows the full-body framing guide and checklist before counting', () => {
    const onReset = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <Provider store={activeStore(0)}>
        <ExerciseControls
          isActive
          gate="framing"
          framing={{
            ...INITIAL_FRAMING,
            checks: { ...INITIAL_FRAMING.checks, head: true },
          }}
          onReset={onReset}
        />
      </Provider>
    );
    expect(getByTestId('framing-guide')).toBeTruthy();
    expect(getByTestId('exercise-feedback')).toHaveTextContent(
      'Step back until your whole body is inside the frame'
    );
    expect(getByTestId('framing-check-head').props.accessibilityLabel).toBe(
      'Head visible: yes'
    );
    expect(getByTestId('framing-check-feet').props.accessibilityLabel).toBe(
      'Feet visible: not yet'
    );
    // Nothing is counted yet, so there is no rep ring or Stop button
    expect(queryByTestId('rep-ring')).toBeNull();
    fireEvent.press(getByTestId('exercise-cancel'));
    expect(onReset).toHaveBeenCalled();
  });

  it('shows big countdown numbers', () => {
    const { getByTestId } = render(
      <Provider store={activeStore(0)}>
        <ExerciseControls isActive gate="countdown" countdown={2} />
      </Provider>
    );
    expect(getByTestId('countdown')).toHaveTextContent('2');
  });

  it('shows the rep ring while counting and asks to step back into view', () => {
    const { getByTestId } = render(
      <Provider store={activeStore(5)}>
        <ExerciseControls isActive outOfView />
      </Provider>
    );
    expect(getByTestId('rep-ring')).toBeTruthy();
    expect(getByTestId('exercise-rep-counter')).toHaveTextContent('5');
    expect(getByTestId('exercise-feedback')).toHaveTextContent('Step back into view');
    expect(getByTestId('framing-guide')).toBeTruthy();
  });
});

describe('useSessionGate', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('practice mode skips framing but counts down 3-2-1-Go (spoken) before counting', () => {
    const speak = jest.spyOn(audioFeedbackService, 'speak').mockResolvedValue();
    const onGo = jest.fn();
    const { result } = renderHook(() => useSessionGate({ landmarks: null, onGo }));

    act(() => result.current.start({ skipFraming: true }));
    expect(result.current.phase).toBe('countdown');
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current.countdown).toBe(3);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.countdown).toBe(0);
    expect(onGo).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.phase).toBe('active');
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls.map((c) => c[0])).toEqual(['3', '2', '1', 'Go']);
    // Practice mode never asks to step back into view
    expect(result.current.outOfView).toBe(false);
    speak.mockRestore();
  });

  it('waits in the framing step while nobody is in view', () => {
    const onGo = jest.fn();
    const { result } = renderHook(() => useSessionGate({ landmarks: null, onGo }));
    act(() => result.current.start());
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe('framing');
    expect(onGo).not.toHaveBeenCalled();
    act(() => result.current.reset());
    expect(result.current.phase).toBe('idle');
  });
});

describe('Pain check', () => {
  it('asks for pain 0-10 and warns about severe pain', () => {
    const onPainSelect = jest.fn();
    const onDone = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <ExerciseSummary reps={5} onPainSelect={onPainSelect} onDone={onDone} />
    );
    expect(getByTestId('pain-scale')).toBeTruthy();
    for (let n = 0; n <= 10; n++) {
      expect(getByTestId(`pain-option-${n}`)).toBeTruthy();
    }
    fireEvent.press(getByTestId('pain-option-3'));
    expect(onPainSelect).toHaveBeenLastCalledWith(3);
    expect(queryByTestId('pain-warning')).toBeNull();
    expect(getByTestId('pain-option-3').props.accessibilityState).toMatchObject({
      selected: true,
    });

    fireEvent.press(getByTestId('pain-option-8'));
    expect(getByTestId('pain-warning')).toHaveTextContent(
      'Please tell your physiotherapist about this pain before your next session.'
    );
  });

  it('is optional: Done works without an answer', () => {
    const onDone = jest.fn();
    const { getByTestId } = render(
      <ExerciseSummary reps={5} onPainSelect={jest.fn()} onDone={onDone} />
    );
    fireEvent.press(getByTestId('done-button'));
    expect(onDone).toHaveBeenCalled();
  });

  it('stores the score on the session just recorded', () => {
    let state = exerciseReducer(undefined, startExercise(EXERCISES.squat));
    state = exerciseReducer(state, updateExerciseProgress({ reps: 4 }));
    state = exerciseReducer(state, stopExercise());
    state = exerciseReducer(state, setLastSessionPain(6));
    expect(state.history[0].painScore).toBe(6);
    // Clamped to the 0-10 scale
    state = exerciseReducer(state, setLastSessionPain(14));
    expect(state.history[0].painScore).toBe(10);
  });

  it('does nothing when no session was recorded', () => {
    const state = exerciseReducer(undefined, setLastSessionPain(5));
    expect(state.history).toHaveLength(0);
  });
});
