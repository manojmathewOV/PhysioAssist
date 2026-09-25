/**
 * Controls drawn over the camera image during an exercise (see "Camera
 * screens" in docs/design/DESIGN_SYSTEM.md):
 * - top panel: the current instruction in large text (plus a "Turn side-on"
 *   hint when a joint reading is only an estimate);
 * - bottom panel: a rep progress ring, form in words, and one big Stop button
 *   with a smaller Pause/Resume button beside it.
 *
 * Before counting starts (`gate`), the top panel asks the patient to get into
 * position (with a "Head visible / Feet visible" checklist) and the middle of
 * the screen shows a dashed full-body frame, then a big 3-2-1 countdown. The
 * only button is Cancel. Mid-session, `outOfView` asks them to step back in.
 *
 * Technical numbers (tracking confidence) only appear when `showDetails` is on
 * (defaults to the "Show joint angles" setting).
 *
 * Used standalone (no callbacks) it drives the Redux exercise slice itself.
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';

import {
  startExercise,
  stopExercise,
  clearExercise,
} from '../../store/slices/exerciseSlice';
import { RootState } from '../../store';
import { AccessibilityIds } from '../../constants/accessibility';
import { exerciseValidationService } from '../../services/exerciseValidationService';
import { AppText, BigButton } from '../ui';
import { CameraPanel } from '../ui/CameraPanel';
import { RepRing } from '../ui/RepRing';
import { colors, radii, spacing, touch } from '../../theme';
import {
  EXERCISE_OPTIONS,
  SIDE_ON_HINT,
  findExerciseOption,
  formInWords,
  friendlyInstruction,
} from './exerciseCatalog';
import { CountdownBadge, FramingChecklist, FramingGuide } from './SessionGateViews';
import { FramingState, INITIAL_FRAMING } from './useFramingReadiness';
import { FRAMING_MESSAGE, OUT_OF_VIEW_MESSAGE } from './useSessionGate';

/** Form scores below this threshold trigger a haptic cue. */
const POOR_FORM_THRESHOLD = 0.6;
const FORM_FEEDBACK_VIBRATION_MS = 150;

const ON_DARK = colors.textInverse;
const ON_DARK_SOFT = 'rgba(255, 255, 255, 0.82)';

interface ExerciseControlsProps {
  /** Shown above the bottom panel while counting, e.g. the physio's video. */
  media?: React.ReactNode;
  isActive?: boolean;
  isPaused?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  /** Show technical numbers (tracking %). Defaults to settings.showJointAngles. */
  showDetails?: boolean;
  /** Practice mode (simulated body, no camera). */
  practice?: boolean;
  /** Before counting: getting into position, or the 3-2-1 countdown. */
  gate?: 'framing' | 'countdown';
  /** Framing checks while `gate` is 'framing'. */
  framing?: FramingState;
  /** 3, 2, 1, then 0 for "Go". */
  countdown?: number | null;
  /** Mid-session: the patient has stepped out of the frame. */
  outOfView?: boolean;
}

const ExerciseControls: React.FC<ExerciseControlsProps> = ({
  media,
  isActive: propIsActive,
  isPaused = false,
  onStart: propOnStart,
  onStop: propOnStop,
  onPause: propOnPause,
  onReset: propOnReset,
  showDetails: propShowDetails,
  practice,
  gate,
  framing = INITIAL_FRAMING,
  countdown = null,
  outOfView = false,
}) => {
  const dispatch = useDispatch();
  const {
    isExercising,
    repetitionCount,
    formScore,
    currentPhase,
    feedback,
    currentExercise,
    lastValidationResult,
  } = useSelector((state: RootState) => state.exercise);
  const confidence = useSelector((state: RootState) => state.pose.confidence);
  const hasPose = useSelector((state: RootState) => !!state.pose.currentPose);
  const enableHaptics = useSelector(
    (state: RootState) => state.settings.enableHaptics !== false
  );
  const showJointAngles = useSelector(
    (state: RootState) => state.settings.showJointAngles
  );

  // Use props if provided, otherwise use Redux state
  const isActive = propIsActive !== undefined ? propIsActive : isExercising;
  const showDetails = propShowDetails ?? showJointAngles;

  // Haptic cue when a new form correction arrives while form is poor, so the
  // user notices it without having to look at the screen mid-exercise.
  const lastFeedbackRef = useRef(feedback);
  useEffect(() => {
    const isNewFeedback = !!feedback && feedback !== lastFeedbackRef.current;
    lastFeedbackRef.current = feedback;
    if (isActive && isNewFeedback && formScore < POOR_FORM_THRESHOLD && enableHaptics) {
      Vibration.vibrate(FORM_FEEDBACK_VIBRATION_MS);
    }
  }, [feedback, formScore, isActive, enableHaptics]);

  const handleSelect = (key: (typeof EXERCISE_OPTIONS)[number]['key']) => {
    const exercise = EXERCISE_OPTIONS.find((o) => o.key === key)!.exercise;
    dispatch(startExercise(exercise));
    exerciseValidationService.startExercise(exercise);
  };

  const handleStart = () => {
    if (propOnStart) {
      propOnStart();
    } else {
      const exercise = EXERCISE_OPTIONS[0].exercise;
      dispatch(startExercise(exercise));
      exerciseValidationService.startExercise(exercise);
    }
  };

  const handleStop = () => (propOnStop ? propOnStop() : dispatch(stopExercise()));
  const handlePause = () => (propOnPause ? propOnPause() : dispatch(stopExercise()));
  const handleReset = () => (propOnReset ? propOnReset() : dispatch(clearExercise()));

  // ---------------------------------------------------------------------------
  // Not started (standalone use): pick an exercise
  // ---------------------------------------------------------------------------
  if (!isActive) {
    return (
      <CameraPanel style={styles.idlePanel} testID="exercise-controls">
        <AppText variant="heading" color={ON_DARK} accessibilityRole="header">
          Choose an exercise
        </AppText>
        <View
          style={styles.options}
          accessible={false}
          accessibilityLabel="Select exercise type"
        >
          {EXERCISE_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => handleSelect(option.key)}
              testID={`exercise-${option.exercise.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${option.title}. ${option.description}`}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <Icon name={option.icon} size={24} color={ON_DARK} />
              <AppText variant="label" color={ON_DARK}>
                {option.title}
              </AppText>
            </Pressable>
          ))}
        </View>
        <BigButton
          label="Start"
          icon="play-arrow"
          onPress={handleStart}
          testID={AccessibilityIds.exercise.startExerciseButton}
          accessibilityHint="Starts the exercise"
        />
        <BigButton
          label="Start over"
          variant="secondary"
          compact
          onPress={handleReset}
          testID="reset-button"
        />
      </CameraPanel>
    );
  }

  // ---------------------------------------------------------------------------
  // During the exercise
  // ---------------------------------------------------------------------------
  const option = findExerciseOption(currentExercise?.id);
  const exerciseName = option?.title ?? currentExercise?.name ?? 'Exercise';
  const target = currentExercise?.targetRepetitions;

  const isEstimate =
    (lastValidationResult?.estimatedJoints?.length ?? 0) > 0 ||
    /turn side-on/i.test(feedback);
  const spoken = friendlyInstruction(feedback);
  const instruction = isPaused
    ? 'Paused. Take a rest.'
    : outOfView
      ? OUT_OF_VIEW_MESSAGE
      : spoken && spoken !== SIDE_ON_HINT
        ? spoken
        : !hasPose
          ? 'Step into view so the camera can see you'
          : currentExercise?.instructions?.[0] ?? 'Get into position';
  const showForm = repetitionCount > 0 || formScore > 0;

  const header = (
    <View style={styles.topRow}>
      <AppText variant="label" color={ON_DARK_SOFT} style={styles.flex}>
        {exerciseName.toUpperCase()}
      </AppText>
      {practice ? (
        <View style={styles.pill} testID="practice-mode-badge">
          <AppText variant="caption" color={ON_DARK}>
            Practice
          </AppText>
        </View>
      ) : null}
      {showDetails ? (
        <View
          style={styles.pill}
          testID={AccessibilityIds.poseDetection.confidenceIndicator}
          accessibilityLabel={`Tracking ${Math.round(confidence * 100)} percent`}
        >
          <AppText variant="caption" color={ON_DARK}>
            Tracking {Math.round(confidence * 100)}%
          </AppText>
        </View>
      ) : null}
    </View>
  );

  // ---------------------------------------------------------------------------
  // Getting into position / countdown: nothing is counted yet
  // ---------------------------------------------------------------------------
  if (gate) {
    const framingStep = gate === 'framing';
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.overlay}
        pointerEvents="box-none"
        testID="exercise-controls"
      >
        <CameraPanel style={styles.topPanel}>
          {header}
          <AppText
            variant="title"
            color={ON_DARK}
            testID={AccessibilityIds.exercise.feedbackText}
            accessibilityLiveRegion="polite"
          >
            {framingStep ? FRAMING_MESSAGE : 'Get ready'}
          </AppText>
          {framingStep ? (
            <FramingChecklist checks={framing.checks} progress={framing.progress} />
          ) : currentExercise?.instructions?.[0] ? (
            <AppText variant="body" color={ON_DARK_SOFT}>
              {currentExercise.instructions[0]}
            </AppText>
          ) : null}
        </CameraPanel>

        {framingStep ? (
          <FramingGuide inFrame={framing.checks.fullBody} />
        ) : (
          <CountdownBadge value={countdown} />
        )}

        <CameraPanel style={styles.gatePanel}>
          <BigButton
            label="Cancel"
            icon="close"
            variant="secondary"
            onPress={handleReset}
            testID="exercise-cancel"
            accessibilityHint="Goes back to the list of exercises"
          />
        </CameraPanel>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.overlay}
      pointerEvents="box-none"
      testID="exercise-controls"
    >
      <CameraPanel style={styles.topPanel}>
        {header}
        <AppText
          variant="title"
          color={ON_DARK}
          testID={AccessibilityIds.exercise.feedbackText}
          accessibilityLiveRegion="polite"
        >
          {instruction}
        </AppText>
        {isEstimate && !isPaused ? (
          <View style={styles.hint} testID="exercise-side-on-hint">
            <Icon name="screen-rotation" size={22} color={colors.warning} />
            <AppText variant="bodyStrong" color={colors.warning} style={styles.flex}>
              {SIDE_ON_HINT}
            </AppText>
          </View>
        ) : null}
      </CameraPanel>

      {outOfView && !isPaused ? (
        <FramingGuide inFrame={false} />
      ) : media ? (
        <View style={[styles.flex, styles.media]} pointerEvents="box-none">
          {media}
        </View>
      ) : (
        <View style={styles.flex} pointerEvents="none" />
      )}

      <CameraPanel style={styles.bottomPanel}>
        <View style={styles.statsRow}>
          <RepRing
            value={repetitionCount}
            target={target}
            size={116}
            strokeWidth={12}
            testID="rep-ring"
            valueTestID={AccessibilityIds.exercise.repCounter}
          />
          <View style={styles.statsText}>
            {target && repetitionCount >= target ? (
              <AppText variant="bodyStrong" color={colors.poseGood}>
                Goal reached!
              </AppText>
            ) : null}
            {showForm ? (
              <View style={styles.formRow}>
                <Icon
                  name={formScore >= POOR_FORM_THRESHOLD ? 'thumb-up' : 'info-outline'}
                  size={20}
                  color={
                    formScore >= POOR_FORM_THRESHOLD ? colors.skeleton : colors.accent
                  }
                />
                <AppText
                  variant="bodyStrong"
                  color={ON_DARK}
                  testID={AccessibilityIds.exercise.formQuality}
                >
                  {formInWords(formScore)}
                </AppText>
              </View>
            ) : null}
            <AppText
              variant="caption"
              color={ON_DARK_SOFT}
              testID="exercise-phase-indicator"
            >
              Step: {currentPhase}
            </AppText>
          </View>
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={handlePause}
            testID={AccessibilityIds.exercise.pauseExerciseButton}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Resume exercise' : 'Pause exercise'}
            style={({ pressed }) => [styles.pause, pressed && styles.optionPressed]}
          >
            <Icon name={isPaused ? 'play-arrow' : 'pause'} size={28} color={ON_DARK} />
            <AppText variant="caption" color={ON_DARK}>
              {isPaused ? 'Resume' : 'Pause'}
            </AppText>
          </Pressable>
          <BigButton
            label="Stop"
            icon="stop"
            variant="secondary"
            onPress={handleStop}
            testID={AccessibilityIds.exercise.endExerciseButton}
            accessibilityHint="Ends the exercise and shows how you did"
            style={styles.flex}
          />
        </View>
      </CameraPanel>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  idlePanel: { margin: spacing.md, gap: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  optionPressed: { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  topPanel: { padding: spacing.lg, gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.warningSoft,
  },
  bottomPanel: { padding: spacing.lg, gap: spacing.md },
  media: { justifyContent: 'flex-end', paddingVertical: spacing.sm },
  gatePanel: { padding: spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  statsText: { flex: 1, gap: spacing.xs },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buttons: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
  pause: {
    width: 88,
    minHeight: touch.primary,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExerciseControls;
