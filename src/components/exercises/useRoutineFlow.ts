/**
 * Today's routine on the Exercise screens (native and web): what's done, start
 * the next exercise, and the physio adding or removing exercises.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from '../../store';
import { setExercisePlan } from '../../store/slices/settingsSlice';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import {
  inRoutine,
  nextAfter,
  occurrenceFor,
  todaysRoutine,
  toggleRoutine,
} from '../../services/pose/routine';
import { setSessionContext } from '../../store/slices/exerciseSlice';
import { useRoutineClock } from './useRoutineClock';
import { ExerciseKey, findExerciseOption } from './exerciseCatalog';

export function useRoutineFlow({
  plan,
  setSelectedKey,
  start,
}: {
  plan: ExercisePlan | null | undefined;
  setSelectedKey: (key: ExerciseKey) => void;
  /** Starts the selected exercise (reads the selection when called). */
  start: () => void;
}) {
  const dispatch = useDispatch();
  const history = useSelector((s: RootState) => s.exercise.history);
  // Kept current as time passes (a round becoming due, the window, midnight)
  const { routine, refresh } = useRoutineClock(plan, history);
  const historyRef = useRef(history);
  historyRef.current = history;

  // Select, then start once the selection has rendered (start uses it)
  const [pending, setPending] = useState(false);
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    if (pending) {
      setPending(false);
      startRef.current();
    }
  }, [pending]);

  const startExercise = useCallback(
    (exerciseId: string) => {
      const option = findExerciseOption(exerciseId);
      if (!option) return;
      // Bind the session to its occurrence and episode now, at the start
      const fresh = todaysRoutine(plan, historyRef.current, Date.now());
      dispatch(
        setSessionContext({
          occurrenceKey: occurrenceFor(fresh, exerciseId),
          episodeId: plan?.episode?.id,
        })
      );
      setSelectedKey(option.key);
      setPending(true);
    },
    [dispatch, plan, setSelectedKey]
  );

  const startRoutine = useCallback(() => {
    // Re-check eligibility at the moment Start is pressed: the screen may
    // have been showing an older state
    const fresh = todaysRoutine(plan, historyRef.current, Date.now());
    if (!fresh.next) {
      refresh();
      return;
    }
    startExercise(fresh.next);
  }, [plan, refresh, startExercise]);

  const toggle = useCallback(
    (exerciseId: string) => {
      if (plan) dispatch(setExercisePlan(toggleRoutine(plan, exerciseId)));
    },
    [dispatch, plan]
  );

  /** After finishing an exercise: the routine's next one, and whether it's all done. */
  const afterSession = useCallback(
    (exerciseId: string) => {
      const next = inRoutine(plan, exerciseId)
        ? nextAfter(routine, exerciseId)
        : undefined;
      const option = next ? findExerciseOption(next) : undefined;
      return {
        next: option
          ? { title: option.title, onPress: () => startExercise(option.exercise.id) }
          : undefined,
        routineDone:
          inRoutine(plan, exerciseId) &&
          routine.items.length > 0 &&
          routine.finishedCount === routine.items.length,
      };
    },
    [plan, routine, startExercise]
  );

  return { routine, startRoutine, startExercise, toggle, afterSession };
}
