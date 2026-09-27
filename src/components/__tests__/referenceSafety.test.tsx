import React from 'react';
import { act, render, renderHook } from '@testing-library/react-native';
import { analyseSession, MovementProfile } from '../../services/movement/analysis';
import type { MovementContext, MovementFrame } from '../../services/movement/types';
import { applyPlan, ExercisePlan } from '../../services/pose/exercisePlan';
import { setEpisode } from '../../services/care/episode';
import { EXERCISES } from '../../constants/exercises';
import ExerciseSummary from '../exercises/ExerciseSummary';
import { sessionOutcome, useMovementAnalysis } from '../exercises/useMovementAnalysis';
import exerciseReducer, {
  startExercise,
  stopExercise,
} from '../../store/slices/exerciseSlice';
import { SCENARIOS } from '../../testing/virtualPatient/scenarios';
import { VirtualPatient } from '../../testing/virtualPatient/VirtualPatient';

// Synthetic values test software precedence; they are not patient prescriptions.
const shoulder: MovementContext = {
  joint: 'shoulder',
  side: 'left',
  exerciseId: 'arm-raise',
};
const knee: MovementContext = {
  joint: 'knee',
  side: 'left',
  exerciseId: 'seated-knee-extension',
};
const demo = (peak = 164): MovementProfile => ({
  repCount: 3,
  peakDegrees: peak,
  bestDegrees: peak,
  restDegrees: 0,
  repDurationMs: 1000,
  holdMs: 0,
});
const frames = (peak: number, rest = 0): MovementFrame[] =>
  Array.from({ length: 151 }, (_, i) => {
    const n = i % 50;
    const fraction =
      n < 10 ? 0 : n < 20 ? (n - 10) / 10 : n < 30 ? 1 : n < 40 ? (40 - n) / 10 : 0;
    return {
      t: i * 100,
      angle: rest + (peak - rest) * fraction,
      landmarks: [],
      view: 'side',
      nearSide: 'left',
      posture: 'seated',
    };
  });
const ids = (a: ReturnType<typeof analyseSession>) => a.findings.map((f) => f.id);
const plan: ExercisePlan = {
  joint: 'shoulder',
  side: 'left',
  goalDegrees: 90,
  reference: {
    ...demo(),
    exerciseId: 'arm-raise',
    source: 'demonstration',
    savedAt: '2026-09-27',
  },
};

describe('review V05: a demonstration never prescribes range', () => {
  it('164 degree reference does not override a met 90 degree goal', () => {
    expect(
      ids(analyseSession(frames(90), shoulder, { reference: demo(), goalDegrees: 90 }))
    ).not.toContain('reduced_range');
  });
  it('a lower reference does not hide a missed prescribed target', () => {
    const result = analyseSession(frames(50), shoulder, {
      reference: demo(40),
      goalDegrees: 90,
    });
    expect(result.findings.find((f) => f.id === 'reduced_range')?.detail).toContain(
      'your goal is 90'
    );
  });
  it('no goal: a reference is not permission to push further', () => {
    expect(
      ids(analyseSession(frames(90), shoulder, { reference: demo() }))
    ).not.toContain('reduced_range');
  });
  it('straightening respects a prescribed 30 degree goal, not a demo at zero', () => {
    expect(
      ids(analyseSession(frames(25, 90), knee, { reference: demo(0), goalDegrees: 30 }))
    ).not.toContain('reduced_range');
  });
  it('an explicit zero goal is not replaced by a less-straight demonstration', () => {
    expect(
      ids(analyseSession(frames(25, 90), knee, { reference: demo(30), goalDegrees: 0 }))
    ).toContain('reduced_range');
  });
  it.each(['front', 'oblique'] as const)(
    'withholds range coaching from %s rejected knee view',
    (view) => {
      const result = analyseSession(
        frames(50).map((f) => ({ ...f, view })),
        { ...knee, exerciseId: 'seated-knee-flexion' },
        { goalDegrees: 90 }
      );
      expect(result.result.status).toBe('unavailable');
      expect(ids(result)).not.toContain('reduced_range');
      expect(ids(result)).toContain('camera_view');
    }
  );
  it('withholds range coaching when the prescribed knee is hidden on the far side', () => {
    expect(
      ids(
        analyseSession(
          frames(50).map((f) => ({ ...f, nearSide: 'right' })),
          { ...knee, exerciseId: 'seated-knee-flexion' },
          { goalDegrees: 90 }
        )
      )
    ).not.toContain('reduced_range');
  });
});

describe('review V06: comfort policy reaches summary, speech selection and history', () => {
  const protectedPlan = setEpisode(plan, 'frozen_shoulder');
  it('filters expansion advice before the rendered summary and speech selection', () => {
    // Deliberately feed pre-policy analysis: the outcome must still honour the plan.
    const analysis = analyseSession(frames(50), shoulder, {
      reference: demo(),
      goalDegrees: 90,
    });
    const result = sessionOutcome(analysis, {
      plan: protectedPlan,
      exercise: EXERCISES.armRaise,
      recordingDemo: false,
      sessionRange: { joint: 'left_shoulder', bestDegrees: 50, goalDegrees: 90 },
    });
    const screen = render(
      <ExerciseSummary
        {...result.summary}
        exercise="Arm raise"
        reps={3}
        duration={15}
        completion="completed"
      />
    );
    expect(screen.queryByTestId('finding-reduced_range')).toBeNull();
    expect(screen.getByTestId('movement-coaching-limited')).toBeTruthy();
    expect(screen.queryByText(/Nothing to correct/)).toBeNull();
    expect(
      screen.queryByText(/go a little further|straighten.*more|all the way back/i)
    ).toBeNull();
    expect(result.spokenCue ?? '').not.toMatch(/further|straighten.*more|longer/i);
    expect(result.summary.range?.goalDegrees).toBeUndefined();
    let state = exerciseReducer(undefined, startExercise(EXERCISES.armRaise));
    state = exerciseReducer(state, stopExercise({ ...result.historyResult, reps: 3 }));
    expect(state.history[0]).toMatchObject({
      bestDegrees: 50,
      goalDegrees: 90,
      measured: true,
    });
  });
  it('passes the phase policy through the actual recording hook', () => {
    const exercise = applyPlan(EXERCISES.armRaise, protectedPlan);
    const { result } = renderHook(() => useMovementAnalysis(protectedPlan, exercise));
    const scenario = SCENARIOS.find((s) => s.id === 'arm-raise-short-of-standard')!;
    act(() => {
      result.current.start();
      for (const f of new VirtualPatient(scenario).frames()) result.current.add(f.pose);
    });
    let analysis: ReturnType<typeof analyseSession> | null = null;
    act(() => {
      analysis = result.current.finish();
    });
    expect(analysis).not.toBeNull();
    expect(ids(analysis!)).not.toContain('reduced_range');
  });
  it('keeps a genuine setup warning rather than blanketing all feedback', () => {
    const analysis = analyseSession(
      frames(50).map((f) => ({ ...f, view: 'front' })),
      { ...knee, exerciseId: 'seated-knee-flexion' },
      { goalDegrees: 90 }
    );
    const result = sessionOutcome(analysis, {
      plan: setEpisode({ joint: 'knee', side: 'left' }, 'knee_replacement'),
      exercise: EXERCISES.seatedKneeFlexion,
      recordingDemo: false,
      sessionRange: null,
    });
    expect(result.summary.findings?.map((f) => f.id)).toContain('camera_view');
    expect(result.spokenCue).toMatch(/side|camera/);
    expect(result.summary.range).toBeNull();
    expect(result.historyResult?.measured).toBe(false);
  });
  it('keeps an unmeasured still-position setup cue in comfort mode', () => {
    const p = setEpisode({ joint: 'knee', side: 'left' }, 'knee_replacement');
    const analysis = analyseSession(frames(8).slice(0, 5), {
      ...knee,
      exerciseId: 'heel-prop-extension',
    });
    const result = sessionOutcome(analysis, {
      plan: p,
      exercise: EXERCISES.heelPropExtension,
      recordingDemo: false,
      sessionRange: null,
    });
    expect(result.spokenCue).toMatch(/still|relaxed/);
    expect(result.historyResult?.measured).toBe(false);
  });
  it.each([true, false])(
    'does not show an inferred demo target with analysis=%s',
    (withAnalysis) => {
      const p = { ...plan, goalDegrees: undefined };
      const analysis = withAnalysis ? analyseSession(frames(90), shoulder) : null;
      const result = sessionOutcome(analysis, {
        plan: p,
        exercise: EXERCISES.armRaise,
        recordingDemo: false,
        sessionRange: { joint: 'left_shoulder', bestDegrees: 90 },
      });
      expect(result.summary.range?.goalDegrees).toBeUndefined();
      expect(result.summary.range?.goalLabel).toBeUndefined();
    }
  );
});

describe('reference and comfort edge cases', () => {
  it.each([undefined, NaN, Infinity, -10])(
    'an absent/invalid straightening goal (%s) is not an implicit zero',
    (goalDegrees) => {
      expect(
        ids(analyseSession(frames(25, 90), knee, { goalDegrees, reference: demo(0) }))
      ).not.toContain('reduced_range');
    }
  );
  it('a demonstration cannot prescribe extra hold time', () => {
    const ref = { ...demo(90), holdMs: 10000 };
    expect(ids(analyseSession(frames(90), shoulder, { reference: ref }))).not.toContain(
      'short_hold'
    );
    expect(
      ids(analyseSession(frames(90), shoulder, { reference: ref, holdMs: 10000 }))
    ).toContain('short_hold');
  });
  it('comfort policy preserves the number but suppresses range and longer-hold prompts', () => {
    const targets = { goalDegrees: 150, holdMs: 10000, reference: demo() };
    const normal = analyseSession(frames(60), shoulder, targets);
    const comfort = analyseSession(frames(60), shoulder, targets, {
      coaching: 'comfort',
    });
    expect(comfort.result).toEqual(normal.result);
    expect(ids(normal)).toEqual(expect.arrayContaining(['reduced_range', 'short_hold']));
    expect(ids(comfort)).not.toEqual(expect.arrayContaining(['reduced_range']));
    expect(ids(comfort)).not.toContain('short_hold');
  });
  it('a comfort static check keeps its measurement without straightening advice', () => {
    const input = Array.from(
      { length: 35 },
      (_, i): MovementFrame => ({
        t: i * 100,
        angle: 15,
        landmarks: [],
        view: 'side',
        nearSide: 'left',
      })
    );
    const context = { ...knee, exerciseId: 'heel-prop-extension' };
    const normal = analyseSession(input, context, { goalDegrees: 0 });
    const comfort = analyseSession(
      input,
      context,
      { goalDegrees: 0 },
      { coaching: 'comfort' }
    );
    expect(normal.result.status).toBe('measured');
    expect(comfort.result).toEqual(normal.result);
    expect(ids(normal)).toContain('reduced_range');
    expect(ids(comfort)).not.toContain('reduced_range');
  });
});
