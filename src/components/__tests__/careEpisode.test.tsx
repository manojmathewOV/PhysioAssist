/**
 * The care episode: exercises only under a confirmed programme for the
 * patient's pathway and phase; specialist-only pathways need an approved
 * programme; an operation starts afresh; comfort phases don't push for range.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer } from '../../store';
import { setExercisePlan } from '../../store/slices/settingsSlice';
import ExerciseChooser from '../exercises/ExerciseChooser';
import HomeScreen from '../../screens/HomeScreen';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import {
  coachingOf,
  confirmProgramme,
  episodeStatus,
  exercisesAllowed,
  setEpisode,
  setSpecialistApproved,
} from '../../services/care/episode';
import { PATHWAYS } from '../../services/care/pathways';
import { todaysRoutine } from '../../services/pose/routine';
import { liveCue } from '../../utils/liveCue';

const knee: ExercisePlan = {
  joint: 'knee',
  side: 'left',
  routine: [{ exerciseId: 'seated-knee-extension' }],
};

describe('episode rules', () => {
  it('older plans without an episode work as before', () => {
    expect(episodeStatus(knee)).toBe('none');
    expect(exercisesAllowed(knee)).toBe(true);
    expect(coachingOf(knee)).toBe('target');
  });

  it('a pathway needs a confirmed programme before exercises are offered', () => {
    const set = setEpisode(knee, 'knee_replacement');
    expect(set.episode).toMatchObject({ pathway: 'knee_replacement', phase: 'protect' });
    expect(exercisesAllowed(set)).toBe(false);
    const confirmed = confirmProgramme(set, '2026-09-26');
    expect(episodeStatus(confirmed)).toBe('ready');
  });

  it('changing the phase needs confirming again; the date never changes it', () => {
    const confirmed = confirmProgramme(setEpisode(knee, 'knee_replacement'));
    const next = setEpisode(confirmed, 'knee_replacement', 'restore_movement');
    expect(next.episode?.phase).toBe('restore_movement');
    expect(episodeStatus(next)).toBe('needs_confirmation');
  });

  it('specialist-only pathways offer nothing until a specialist programme is approved', () => {
    const set = confirmProgramme(setEpisode(knee, 'knee_specialist'));
    expect(episodeStatus(set)).toBe('needs_specialist');
    const approved = confirmProgramme(setSpecialistApproved(set, true));
    expect(episodeStatus(approved)).toBe('ready');
  });

  it('the operation is a handover: the pre-operative routine does not carry over', () => {
    const before = confirmProgramme(setEpisode(knee, 'knee_before_replacement'));
    const after = setEpisode(before, 'knee_replacement');
    expect(after.routine).toEqual([]);
    expect(episodeStatus(after)).toBe('needs_confirmation');
  });

  it('changing a confirmed programme needs confirming again (store)', () => {
    let state = rootReducer(
      undefined,
      setExercisePlan(confirmProgramme(setEpisode(knee, 'knee_oa')))
    );
    expect(episodeStatus(state.settings.exercisePlan)).toBe('ready');
    const plan = state.settings.exercisePlan!;
    state = rootReducer(
      state,
      setExercisePlan({ ...plan, routine: [...plan.routine!, { exerciseId: 'squat' }] })
    );
    expect(episodeStatus(state.settings.exercisePlan)).toBe('needs_confirmation');
  });

  it('comfort phases: no pushing for range, precautions still come through', () => {
    const protect = confirmProgramme(setEpisode(knee, 'knee_replacement'));
    expect(coachingOf(protect)).toBe('comfort');
    const result = {
      isValid: false,
      errors: ['Bend left_knee more'],
      feedback: ['Good left_knee position'],
      phase: 'bend',
    };
    expect(liveCue(result, { comfort: true }).text).toBe('');
    expect(
      liveCue(
        {
          ...result,
          overLimit: true,
          errors: ["Not so far: don't bend your knee past 90°"],
        },
        { comfort: true }
      )
    ).toEqual({ text: "Not so far: don't bend your knee past 90°", warning: true });
  });

  it('frozen shoulder starts symptom-limited (comfort coaching)', () => {
    const plan = setEpisode({ joint: 'shoulder', side: 'right' }, 'frozen_shoulder');
    expect(plan.episode?.phase).toBe('symptom_limited');
    expect(coachingOf(plan)).toBe('comfort');
  });

  it('every pathway has phases and holds no doses', () => {
    for (const p of PATHWAYS) {
      expect(p.phases.length).toBeGreaterThan(0);
      expect(JSON.stringify(p)).not.toMatch(/\b\d+\s*(reps?|times|weeks?|kg|°)\b/i);
    }
  });
});

const storeWith = (plan: ExercisePlan) => {
  const defaults = rootReducer(undefined, { type: '@@test/INIT' });
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...defaults,
      settings: { ...defaults.settings, exercisePlan: plan },
    },
  });
};

describe('what the patient sees', () => {
  const unconfirmed = setEpisode(knee, 'knee_replacement');

  it('an unconfirmed programme: no exercises, and why', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider store={storeWith(unconfirmed)}>
        <ExerciseChooser
          selectedKey="seatedKneeExtension"
          onSelect={jest.fn()}
          onStart={jest.fn()}
          plan={unconfirmed}
          onPlanChange={jest.fn()}
          routine={todaysRoutine(unconfirmed, [])}
          onStartRoutine={jest.fn()}
        />
      </Provider>
    );
    expect(getByTestId('programme-waiting')).toBeTruthy();
    expect(getByText('Your programme is being prepared')).toBeTruthy();
    expect(queryByTestId('start-routine-button')).toBeNull();
    expect(queryByTestId('start-exercise-button')).toBeNull();
  });

  it('Home says the programme is being prepared, with no start button', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={storeWith(unconfirmed)}>
        <HomeScreen />
      </Provider>
    );
    expect(getByTestId('home-waiting')).toBeTruthy();
    expect(queryByTestId('home-start-exercises')).toBeNull();
  });

  it('the physio chooses the pathway and phase and confirms in set-up', () => {
    const onPlanChange = jest.fn();
    const { getByTestId } = render(
      <Provider store={storeWith(unconfirmed)}>
        <ExerciseChooser
          selectedKey="seatedKneeExtension"
          onSelect={jest.fn()}
          onStart={jest.fn()}
          plan={unconfirmed}
          onPlanChange={onPlanChange}
          routine={todaysRoutine(unconfirmed, [])}
          onStartRoutine={jest.fn()}
        />
      </Provider>
    );
    fireEvent.press(getByTestId('exercise-setup-open'));
    expect(getByTestId('pathway-note')).toHaveTextContent(/Neither a single angle/);
    fireEvent.press(getByTestId('phase-restore_movement'));
    expect(onPlanChange.mock.calls.at(-1)[0].episode.phase).toBe('restore_movement');
    fireEvent.press(getByTestId('programme-confirm'));
    expect(onPlanChange.mock.calls.at(-1)[0].episode.confirmedAt).toBeDefined();
  });
});
