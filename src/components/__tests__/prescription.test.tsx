/**
 * Goals and precautions say what they apply to, and the live checks measure
 * the same thing the session analysis does. Cases from the independent review
 * of 06e77dd: a rotation limit checked against arm height, a front-view squat
 * given a knee number, the plan editor dropping the video, saving a video
 * jumping back to the first exercise, and a goal silently raising the limit.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import PlanEditor from '../exercises/PlanEditor';
import { keepOrFirstKey } from '../exercises/exerciseCatalog';
import { EXERCISES } from '../../constants/exercises';
import { ExerciseValidationService } from '../../services/exerciseValidationService';
import {
  ExercisePlan,
  applyPlan,
  goalDegreesOf,
  interiorAngle,
} from '../../services/pose/exercisePlan';
import { STANDING } from '../../testing/virtualPatient/body';
import { repetitions } from '../../testing/virtualPatient/timeline';
import { VirtualPatient } from '../../testing/virtualPatient/VirtualPatient';
import type { Scenario } from '../../testing/virtualPatient/scenarios';

const reference = {
  repCount: 3,
  peakDegrees: 100,
  bestDegrees: 105,
  restDegrees: 90,
  repDurationMs: 3000,
  holdMs: 1000,
  exerciseId: 'seated-knee-extension',
  source: 'demonstration' as const,
  savedAt: '2026-01-01',
};

describe('plan editor', () => {
  const plan: ExercisePlan = {
    joint: 'knee',
    side: 'left',
    goalDegrees: 90,
    limitDegrees: 110,
    reps: 10,
    reference,
    videos: { 'seated-knee-extension': 'https://youtu.be/dQw4w9WgXcQ' },
  };

  it('saving an unchanged plan keeps its demonstration and videos', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(<PlanEditor value={plan} onSave={onSave} />);
    fireEvent.press(getByTestId('plan-save'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ reference, videos: plan.videos, goalDegrees: 90 })
    );
  });

  it('never moves the limit to fit the goal; a goal past the limit blocks saving', () => {
    const onSave = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <PlanEditor value={{ ...plan, goalDegrees: 105 }} onSave={onSave} />
    );
    fireEvent.press(getByTestId('plan-goal-plus')); // 110: at the limit, fine
    expect(queryByTestId('plan-goal-past-limit')).toBeNull();
    fireEvent.press(getByTestId('plan-goal-plus')); // 115: past it
    expect(getByTestId('plan-goal-past-limit')).toBeTruthy();
    fireEvent.press(getByTestId('plan-save'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('names what the limit restricts', () => {
    const { getByText } = render(<PlanEditor value={plan} onSave={jest.fn()} />);
    expect(getByText("Don't bend your knee past")).toBeTruthy();
    expect(getByText('Knee bend goal')).toBeTruthy();
  });

  it('has a separate straightening goal for the knee, down to 0°', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(<PlanEditor value={plan} onSave={onSave} />);
    fireEvent(getByTestId('plan-extension-toggle'), 'onValueChange', true);
    for (let i = 0; i < 10; i++) fireEvent.press(getByTestId('plan-extension-minus'));
    fireEvent.press(getByTestId('plan-save'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ extensionGoalDegrees: 0, goalDegrees: 90 })
    );
  });
});

describe('exercise choice survives plan changes', () => {
  it('keeps seated knee straightening after saving a video', () => {
    expect(keepOrFirstKey('seatedKneeExtension', { joint: 'knee', side: 'left' })).toBe(
      'seatedKneeExtension'
    );
  });

  it('moves to an exercise for the new joint when the joint changes', () => {
    expect(
      keepOrFirstKey('seatedKneeExtension', { joint: 'shoulder', side: 'left' })
    ).not.toBe('seatedKneeExtension');
  });
});

describe('each goal applies only to its kind of exercise', () => {
  const knee: ExercisePlan = {
    joint: 'knee',
    side: 'left',
    goalDegrees: 100,
    extensionGoalDegrees: 5,
  };

  it('a knee bend goal sets the squat, not the straightening exercise', () => {
    expect(goalDegreesOf(applyPlan(EXERCISES.squat, knee))).toBe(100);
    expect(goalDegreesOf(applyPlan(EXERCISES.seatedKneeExtension, knee))).toBe(5);
  });

  it('no bend or raise goal is applied to rotation', () => {
    const plan: ExercisePlan = { joint: 'shoulder', side: 'left', goalDegrees: 150 };
    const phases = applyPlan(EXERCISES.shoulderExternalRotation, plan).phases;
    expect(phases[0].jointRequirements[0].targetAngle).not.toBe(
      interiorAngle('shoulder', 150)
    );
  });
});

describe('live checks measure what the exercise measures', () => {
  it('rotation: no "Perfect angle" for the arm-at-side guard; the limit is named', () => {
    // The review's case: limit 30°, forearm turned 60° out, arm at the side
    const service = new ExerciseValidationService();
    service.startExercise(
      applyPlan(EXERCISES.shoulderExternalRotation, {
        joint: 'shoulder',
        side: 'left',
        limitDegrees: 30,
      })
    );
    const scenario: Scenario = {
      id: 'er',
      exerciseId: 'shoulder-external-rotation',
      title: '',
      description: '',
      base: {
        ...STANDING,
        view: 'front',
        leftShoulder: 8,
        leftElbow: 90,
        leftForearmForward: 1,
      },
      timeline: repetitions({
        rest: { leftShoulderRotation: 0 },
        target: { leftShoulderRotation: 60 },
        reps: 1,
        moveMs: 1000,
        holdMs: 1000,
        restMs: 500,
      }),
      expect: { reps: 0 },
    };
    const feedback: string[] = [];
    let overLimit = false;
    for (const f of new VirtualPatient(scenario).frames()) {
      const r = service.validatePose(f.pose);
      feedback.push(...r.feedback, ...r.errors);
      overLimit ||= Boolean(r.overLimit);
    }
    expect(feedback.some((m) => /Perfect|Good .* position/.test(m))).toBe(false);
    // The plan's limit is an arm-raise limit; the arm stayed at the side
    expect(overLimit).toBe(false);
    // Rotation's range isn't claimed by the live counter
    expect(service.getSessionRange()).toBeNull();
  });

  it('an arm-raise limit is named as such when passed', () => {
    const service = new ExerciseValidationService();
    service.startExercise(
      applyPlan(EXERCISES.armRaise, { joint: 'shoulder', side: 'left', limitDegrees: 90 })
    );
    const scenario: Scenario = {
      id: 'raise',
      exerciseId: 'arm-raise',
      title: '',
      description: '',
      base: { ...STANDING, view: 'side' },
      timeline: repetitions({
        rest: { leftShoulder: 10 },
        target: { leftShoulder: 130 },
        reps: 1,
        moveMs: 1000,
        holdMs: 1000,
        restMs: 500,
      }),
      expect: { reps: 0 },
    };
    const errors = new Set<string>();
    for (const f of new VirtualPatient(scenario).frames()) {
      service.validatePose(f.pose).errors.forEach((e) => errors.add(e));
    }
    expect([...errors]).toContain("Not so far: don't raise your arm past 90°");
  });

  it('front-view squat: the knee number is withheld live too, with set-up guidance', () => {
    const service = new ExerciseValidationService();
    service.startExercise(applyPlan(EXERCISES.squat, { joint: 'knee', side: 'left' }));
    const scenario: Scenario = {
      id: 'front-squat',
      exerciseId: 'squat',
      title: '',
      description: '',
      base: { ...STANDING, view: 'front' },
      timeline: repetitions({
        rest: { leftKnee: 176, rightKnee: 176, leftHip: 176, rightHip: 176 },
        target: { leftKnee: 100, rightKnee: 100, leftHip: 100, rightHip: 100 },
        reps: 2,
        moveMs: 1000,
        holdMs: 800,
        restMs: 500,
      }),
      expect: { reps: 0 },
    };
    const results = [...new VirtualPatient(scenario).frames()].map((f) =>
      service.validatePose(f.pose)
    );
    expect(results.every((r) => r.withheld)).toBe(true);
    expect(results[0].errors[0]).toMatch(/Turn side-on .* left knee can be measured/);
    expect(results.some((r) => r.errors.some((e) => /Bend|Straighten/.test(e)))).toBe(
      false
    );
    expect(service.getSessionRange()).toBeNull();
  });
});
