/**
 * Today's routine on the Exercise screens (native and web): what's done, start
 * the next exercise, and the physio adding or removing exercises.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from '../../store';
import { setExercisePlan } from '../../store/slices/settingsSlice';
import type { ExercisePlan } from '../../services/pose/exercisePlan';
import {
  inRoutine,
  nextAfter,
  todaysRoutine,
  toggleRoutine,
} from '../../services/pose/routine';
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
  const routine = useMemo(() => todaysRoutine(plan, history), [plan, history]);

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
      setSelectedKey(option.key);
      setPending(true);
    },
    [setSelectedKey]
  );

  const startRoutine = useCallback(() => {
    if (routine.next) startExercise(routine.next);
  }, [routine.next, startExercise]);

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
          routine.doneCount === routine.items.length,
      };
    },
    [plan, routine, startExercise]
  );

  return { routine, startRoutine, toggle, afterSession };
}
