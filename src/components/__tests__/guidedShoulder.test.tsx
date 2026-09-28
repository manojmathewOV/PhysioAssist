import React from 'react';
import { Keyboard } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  GUIDED_SHOULDER_REVISION,
  guidedShoulderFor,
} from '../../services/care/guidedShoulder';
import { confirmProgramme, setEpisode } from '../../services/care/episode';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import settingsReducer, { setExercisePlan } from '../../store/slices/settingsSlice';
import { todaysRoutine } from '../../services/pose/routine';
import GuidedShoulderSetup from '../exercises/GuidedShoulderSetup';
import TodayPrep from '../exercises/TodayPrep';
const plan = (): ExercisePlan =>
  confirmProgramme(
    setEpisode(
      {
        joint: 'shoulder',
        side: 'left',
        routine: [
          {
            exerciseId: 'sleeper-stretch',
            repRange: { min: 2, max: 3 },
            instructionRevision: GUIDED_SHOULDER_REVISION,
          },
        ],
      },
      'frozen_shoulder',
      'symptom_limited',
      1000
    ),
    '2026-09-28T00:00:00Z'
  );
describe('exact guided shoulder variants without fabricated measurement/dose', () => {
  it('uses the shoulder-level/pillow cue, not the ER elbow-at-side rule', () => {
    const guide = guidedShoulderFor(plan(), 'sleeper-stretch');
    expect(guide?.guidedOnly).toBe(true);
    expect(guide?.exercise.instructions.join(' ')).toMatch(/shoulder level.*pillow/);
    expect(guide?.exercise.instructions.join(' ')).not.toMatch(
      /close to your body|beside your body/
    );
    expect(guide?.exercise).not.toHaveProperty('phases');
    expect(guide?.exercise).not.toHaveProperty('targetRepetitions');
  });
  it.each(['cuff_repair', 'shoulder_before_surgery', 'shoulder_specialist'])(
    'cannot transfer sleeper into %s',
    (pathway) => {
      const p = plan();
      p.episode = { ...p.episode!, pathway, confirmedAt: '2026-09-28' };
      expect(guidedShoulderFor(p, 'sleeper-stretch')).toBeUndefined();
    }
  );
  it('does not supply an unknown dose, source revision or programme confirmation', () => {
    for (const field of ['repRange', 'instructionRevision'] as const) {
      const p = plan();
      delete p.routine![0][field];
      expect(guidedShoulderFor(p, 'sleeper-stretch')).toBeUndefined();
    }
    const p = plan();
    delete p.episode!.confirmedAt;
    expect(guidedShoulderFor(p, 'sleeper-stretch')).toBeUndefined();
    expect(guidedShoulderFor(plan(), 'toString')).toBeUndefined();
  });
  it('adds no default repetitions and applying a dose requires reconfirmation', () => {
    const p = { ...plan(), routine: [] };
    const change = jest.fn();
    const ui = render(<GuidedShoulderSetup plan={p} onChange={change} />);
    fireEvent.press(ui.getByTestId('choose-sleeper-stretch'));
    expect(ui.getByTestId('guided-dose-min').props.value).toBe('');
    fireEvent.press(ui.getByTestId('guided-dose-apply'));
    expect(change).not.toHaveBeenCalled();
    fireEvent.changeText(ui.getByTestId('guided-dose-min'), '2');
    fireEvent.changeText(ui.getByTestId('guided-dose-max'), '3');
    fireEvent.press(ui.getByTestId('guided-dose-apply'));
    const next = change.mock.calls[0][0];
    expect(next.routine[0]).toMatchObject({
      repRange: { min: 2, max: 3 },
      instructionRevision: GUIDED_SHOULDER_REVISION,
    });
    expect(next.routine[0].holdSeconds).toBeUndefined();
    const settings = { ...settingsReducer(undefined, { type: 'init' }), exercisePlan: p };
    expect(
      settingsReducer(settings, setExercisePlan(next)).exercisePlan?.episode?.confirmedAt
    ).toBeUndefined();
  });
  it('dismisses the numeric keyboard after an explicit valid programme edit', () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const ui = render(
      <GuidedShoulderSetup plan={{ ...plan(), routine: [] }} onChange={jest.fn()} />
    );
    try {
      fireEvent.press(ui.getByTestId('choose-sleeper-stretch'));
      dismiss.mockClear();
      fireEvent.changeText(ui.getByTestId('guided-dose-min'), '2');
      fireEvent.press(ui.getByTestId('guided-dose-apply'));
      expect(dismiss).toHaveBeenCalledTimes(1);
    } finally {
      ui.unmount();
      dismiss.mockRestore();
    }
  });
  it('patient entry starts guided exercise, never the standing camera substitution', () => {
    const p = plan();
    const guided = jest.fn(),
      camera = jest.fn();
    const ui = render(
      <TodayPrep
        plan={p}
        routine={todaysRoutine(p, [])}
        onReady={camera}
        onWithoutCamera={guided}
        onRepeat={() => {}}
        onOpenSetup={() => {}}
        onHelp={() => {}}
      />
    );
    expect(ui.getByTestId('today-next-title')).toHaveTextContent('Sleeper stretch');
    expect(ui.queryByTestId('start-without-camera')).toBeNull();
    fireEvent.press(ui.getByTestId('start-routine-button'));
    expect(guided).toHaveBeenCalledTimes(1);
    expect(camera).not.toHaveBeenCalled();
  });
  it('missing source/dose is not incorrectly called all done', () => {
    const p = plan();
    p.routine![0].instructionRevision = 'unreviewed-old';
    const ui = render(
      <TodayPrep
        plan={p}
        routine={todaysRoutine(p, [])}
        onReady={() => {}}
        onWithoutCamera={() => {}}
        onRepeat={() => {}}
        onOpenSetup={() => {}}
        onHelp={() => {}}
      />
    );
    expect(ui.queryByTestId('start-routine-button')).toBeNull();
    expect(ui.getByText('Check the exercise instructions')).toBeTruthy();
  });
});
