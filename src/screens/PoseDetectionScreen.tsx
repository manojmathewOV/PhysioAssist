/**
 * Exercise tab (iOS/Android).
 *
 * 1. Choose an exercise (large cards, set-up reminder, one big Start button).
 * 2. Exercise: the camera fills the screen. First "get into position" (the
 *    whole body must be in the frame for about a second), then a spoken
 *    3-2-1 countdown, then counting starts. The instruction, rep ring and one
 *    big Stop button sit on dark overlay panels (ExerciseControls).
 * 3. Summary: reps, time and form in words, an optional 0-10 pain check,
 *    then "Done" or "Do another".
 *
 * Without a camera (simulator) or camera permission, a friendly full-screen
 * explanation offers one clear way forward (open Settings / practice mode).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { setExercisePlan } from '@store/slices/settingsSlice';
import { ExercisePlan, applyPlan } from '@services/pose/exercisePlan';
import { setPoseData, setDetecting } from '@store/slices/poseSlice';
import {
  clearExercise,
  setFeedback,
  setLastSessionPain,
  startExercise,
  stopExercise,
  updateExerciseProgress,
  updateValidation,
} from '@store/slices/exerciseSlice';
import { useBlazePose, CAMERA_FPS } from '@hooks/useBlazePose';
import { exerciseValidationService } from '@services/exerciseValidationService';
import { audioFeedbackService } from '@services/audioFeedbackService';
import type { MockPoseDataSimulator } from '@services/mockPoseDataSimulator';
// Conditional import: Only include mock simulator in development builds
const mockPoseDataSimulator: MockPoseDataSimulator | null = __DEV__
  ? require('@services/mockPoseDataSimulator').mockPoseDataSimulator
  : null;
import PoseOverlay from '@components/pose/PoseOverlay';
import FollowAlongVideo from '@components/video/FollowAlongVideo';
import { parseYouTubeId, parseYouTubeStart } from '../utils/youtube';
import ExerciseControls from '@components/exercises/ExerciseControls';
import ExerciseChooser from '@components/exercises/ExerciseChooser';
import {
  sessionOutcome,
  useMovementAnalysis,
} from '@components/exercises/useMovementAnalysis';
import ExerciseSummary, {
  ExerciseSummaryProps,
} from '@components/exercises/ExerciseSummary';
import CameraUnavailable from '@components/exercises/CameraUnavailable';
import { FRAMING_MESSAGE, useSessionGate } from '@components/exercises/useSessionGate';
import {
  EXERCISE_OPTIONS,
  ExerciseKey,
  friendlyInstruction,
} from '@components/exercises/exerciseCatalog';
import { AccessibilityIds } from '../constants/accessibility';
import type { MainTabParamList } from '../navigation/types';
import { colors } from '../theme';

/** First exercise that trains the plan's joint (falls back to the bicep curl). */
const firstKeyFor = (plan?: ExercisePlan | null): ExerciseKey =>
  EXERCISE_OPTIONS.find((o) => plan && o.exercise.primaryJoint === plan.joint)?.key ??
  'bicepCurl';

type Stage = 'choose' | 'exercise' | 'summary';
type Permission = 'unknown' | 'granted' | 'denied';

const PoseDetectionScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const isFocused = useIsFocused();
  const device = useCameraDevice('front');

  const { isDetecting, currentPose } = useSelector((state: RootState) => state.pose);
  const { frameSkip, showPoseOverlay, showJointAngles } = useSelector(
    (state: RootState) => state.settings
  );
  const exerciseState = useSelector((state: RootState) => state.exercise);
  const { isExercising } = exerciseState;

  const plan = useSelector((s: RootState) => s.settings.exercisePlan);
  const [stage, setStage] = useState<Stage>('choose');
  const [selectedKey, setSelectedKey] = useState<ExerciseKey>(() => firstKeyFor(plan));
  const [permission, setPermission] = useState<Permission>('unknown');
  const [isPaused, setIsPaused] = useState(false);
  const [practice, setPractice] = useState(false);
  const [summary, setSummary] = useState<
    (ExerciseSummaryProps & { saved: boolean }) | null
  >(null);
  const lastSpokenRef = useRef('');
  const lastRepsRef = useRef(0);

  const option = EXERCISE_OPTIONS.find((o) => o.key === selectedKey)!;
  // The patient's version: only the joint of interest, with their physio's goal
  const plannedExercise = useMemo(() => applyPlan(option.exercise, plan), [option, plan]);
  const changePlan = useCallback(
    (next: ExercisePlan) => {
      dispatch(setExercisePlan(next));
      setSelectedKey(firstKeyFor(next));
    },
    [dispatch]
  );
  const cameraReady = !!device && permission === 'granted';
  // Records the joint of interest for the end-of-session comparison
  const movement = useMovementAnalysis(plan, plannedExercise);
  // The physio's YouTube video for this exercise, played alongside the camera
  const videoLink = plan?.videos?.[plannedExercise.id];
  const videoId = parseYouTubeId(videoLink);
  const [recordingDemo, setRecordingDemo] = useState(false);

  // Get into position -> 3-2-1 countdown -> count. Counting (and the timer)
  // starts at "Go".
  const gate = useSessionGate({
    landmarks: currentPose?.landmarks,
    onGo: () => {
      lastRepsRef.current = 0;
      dispatch(startExercise(plannedExercise));
      exerciseValidationService.startExercise(plannedExercise);
      movement.start();
    },
  });
  const { start: startGate, reset: resetGate } = gate;
  const counting = gate.phase === 'active';
  const outOfView = gate.outOfView;
  const outOfViewRef = useRef(outOfView);
  outOfViewRef.current = outOfView;

  // BlazePose runs only while detecting (and not paused); poses go to the Redux store
  const { cameraProps, error: detectorError } = useBlazePose({
    device,
    enabled: isDetecting && !isPaused && !practice,
    frameSkip,
  });

  const requestCameraPermission = useCallback(async () => {
    const result = await Camera.requestCameraPermission();
    setPermission(result === 'granted' ? 'granted' : 'denied');
  }, []);

  useEffect(() => {
    requestCameraPermission();
    return () => {
      dispatch(setDetecting(false));
      mockPoseDataSimulator?.stop();
    };
  }, [dispatch, requestCameraPermission]);

  // Validate each new pose during the exercise; show and speak the instruction
  useEffect(() => {
    if (stage !== 'exercise' || !counting || !isExercising || isPaused || !currentPose) {
      return;
    }
    try {
      const result = exerciseValidationService.validatePose(currentPose);
      movement.add(currentPose);
      dispatch(updateValidation(result));
      const raw = result.feedback[0] ?? result.errors[0] ?? '';
      if (!result.feedback.length && raw) {
        dispatch(setFeedback(raw));
      }
      const metrics = exerciseValidationService.getExerciseMetrics();
      dispatch(
        updateExerciseProgress({
          reps: metrics.repetitionCount,
          formScore: metrics.averageQuality / 100,
        })
      );
      if (metrics.repetitionCount > lastRepsRef.current) {
        audioFeedbackService.announceRep(
          metrics.repetitionCount,
          plannedExercise.targetRepetitions
        );
      }
      lastRepsRef.current = metrics.repetitionCount;
      // While out of view the screen already says "Step back into view"
      const message = outOfViewRef.current ? '' : friendlyInstruction(raw);
      if (
        message &&
        message !== lastSpokenRef.current &&
        audioFeedbackService.speakCorrection(message)
      ) {
        lastSpokenRef.current = message;
      }
    } catch (error) {
      console.error('Failed to validate pose:', error);
    }
  }, [
    currentPose,
    counting,
    isExercising,
    isPaused,
    stage,
    plannedExercise,
    dispatch,
    movement,
  ]);

  const beginSession = useCallback(
    (practiceMode: boolean) => {
      const exercise = plannedExercise;
      lastSpokenRef.current = '';
      setIsPaused(false);
      setPractice(practiceMode);
      // Shows the exercise on screen; counting only starts after the countdown
      dispatch(startExercise(exercise));
      dispatch(setDetecting(true));
      audioFeedbackService.speak(
        practiceMode
          ? `${option.title}. Get ready.`
          : `${option.title}. ${FRAMING_MESSAGE}.`
      );
      startGate({ skipFraming: practiceMode });

      if (practiceMode && mockPoseDataSimulator) {
        mockPoseDataSimulator.start(
          (poseData) => {
            dispatch(setPoseData(poseData));
          },
          30,
          plannedExercise.id
        );
      }
      setStage('exercise');
    },
    [dispatch, option, plannedExercise, startGate]
  );

  // Start straight away once the camera becomes available (e.g. permission granted)
  const gatePhase = gate.phase;
  useEffect(() => {
    if (stage === 'exercise' && cameraReady && gatePhase === 'idle' && !practice) {
      beginSession(false);
    }
  }, [stage, cameraReady, gatePhase, practice, beginSession]);

  const handleStart = () => {
    setRecordingDemo(false);
    if (cameraReady) {
      beginSession(false);
    } else {
      // Shows the friendly "camera unavailable" explanation
      setStage('exercise');
    }
  };

  const backToChooser = useCallback(() => {
    resetGate();
    exerciseValidationService.stopExercise();
    dispatch(clearExercise());
    mockPoseDataSimulator?.stop();
    dispatch(setDetecting(false));
    setPractice(false);
    setRecordingDemo(false);
    setStage('choose');
  }, [dispatch, resetGate]);

  const handleStop = useCallback(() => {
    if (!counting) {
      // Still getting ready: nothing to save
      backToChooser();
      return;
    }
    resetGate();
    const { repetitionCount, formScore, startedAt, currentExercise } = exerciseState;
    const sessionRange = exerciseValidationService.getSessionRange();
    exerciseValidationService.stopExercise();
    mockPoseDataSimulator?.stop();
    dispatch(setDetecting(false));
    const outcome = sessionOutcome(movement.finish(), {
      plan,
      exercise: plannedExercise,
      recordingDemo,
      sessionRange,
    });
    if (outcome.planUpdate) {
      dispatch(setExercisePlan(outcome.planUpdate));
    }
    // Practice sessions and demonstrations are not the patient's own history
    dispatch(
      practice || recordingDemo
        ? clearExercise()
        : stopExercise(outcome.historyResult ?? sessionRange ?? undefined)
    );
    audioFeedbackService.speak(
      outcome.spokenCue ? `Well done. ${outcome.spokenCue}` : 'Well done'
    );

    setSummary({
      ...outcome.summary,
      exercise: option.title,
      reps: outcome.summary.reps ?? repetitionCount,
      duration: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
      formAccuracy: Math.round(formScore * 100),
      targetReps: currentExercise?.targetRepetitions,
      practice,
      // stopExercise only records sessions with at least one rep
      saved: !practice && !recordingDemo && repetitionCount > 0,
    });
    setIsPaused(false);
    setRecordingDemo(false);
    setStage('summary');
  }, [
    backToChooser,
    counting,
    dispatch,
    exerciseState,
    resetGate,
    option,
    practice,
    movement,
    plan,
    plannedExercise,
    recordingDemo,
  ]);

  // -------------------------------------------------------------------------
  // 1. Choose
  // -------------------------------------------------------------------------
  if (stage === 'choose') {
    return (
      <View style={styles.flex} testID={AccessibilityIds.poseDetection.screen}>
        <ExerciseChooser
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          plan={plan}
          onPlanChange={changePlan}
          onRecordDemo={() => {
            handleStart();
            setRecordingDemo(true);
          }}
          onStart={handleStart}
        />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // 3. Summary
  // -------------------------------------------------------------------------
  if (stage === 'summary' && summary) {
    return (
      <View style={styles.flex} testID={AccessibilityIds.poseDetection.screen}>
        <ExerciseSummary
          {...summary}
          onPainSelect={(score) => {
            // Practice sessions aren't saved, so there is nothing to attach it to
            if (summary.saved) {
              dispatch(setLastSessionPain(score));
            }
          }}
          onDone={() => {
            setStage('choose');
            navigation.navigate('HomeTab', { screen: 'Home' });
          }}
          onRepeat={() => setStage('choose')}
        />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Camera not available
  // -------------------------------------------------------------------------
  if (!practice && (!cameraReady || detectorError)) {
    const practiceAction = mockPoseDataSimulator
      ? {
          label: 'Practice without camera',
          icon: 'play-arrow',
          onPress: () => beginSession(true),
          testID: 'use-practice-mode',
        }
      : undefined;
    const back = {
      label: 'Back to exercises',
      onPress: backToChooser,
      testID: 'camera-help-back',
    };

    if (detectorError) {
      return (
        <CameraUnavailable
          testID="camera-error"
          icon="videocam-off"
          title="The camera couldn't start"
          message="Please close the app and open it again. If this keeps happening, restart your phone."
          primary={{ ...back, icon: 'arrow-back' }}
        />
      );
    }
    if (permission === 'denied') {
      return (
        <CameraUnavailable
          testID={AccessibilityIds.poseDetection.permissionDialog}
          icon="photo-camera"
          title="Allow the camera"
          message="PhysioAssist uses your camera to watch your movements and count your repetitions. Nothing is recorded or sent anywhere. Turn on the camera for PhysioAssist in your phone's Settings."
          primary={{
            label: 'Open Settings',
            icon: 'settings',
            onPress: () => Linking.openSettings(),
            testID: AccessibilityIds.poseDetection.permissionGrantButton,
          }}
          secondary={practiceAction ?? back}
        />
      );
    }
    if (!device) {
      return (
        <CameraUnavailable
          testID="no-camera"
          icon="no-photography"
          title="No camera found"
          message="This device doesn't seem to have a front camera. You can still try the exercise screen in practice mode, with a pretend body."
          primary={practiceAction ?? { ...back, icon: 'arrow-back' }}
          secondary={practiceAction ? back : undefined}
        />
      );
    }
    // Permission still being asked
    return (
      <CameraUnavailable
        testID="camera-waiting"
        icon="photo-camera"
        title="Getting the camera ready"
        message="If your phone asks, please allow PhysioAssist to use the camera."
        primary={{
          label: 'Try again',
          icon: 'refresh',
          onPress: requestCameraPermission,
        }}
        secondary={back}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 2. Exercise (camera full screen)
  // -------------------------------------------------------------------------
  return (
    <View style={styles.camera} testID={AccessibilityIds.poseDetection.screen}>
      {cameraReady && !practice && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          resizeMode="cover"
          fps={CAMERA_FPS}
          testID="camera-view"
          {...cameraProps}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.practiceBackground]} />
      )}

      {showPoseOverlay !== false ? <PoseOverlay showAngles={showJointAngles} /> : null}

      <ExerciseControls
        media={
          videoId ? (
            <FollowAlongVideo videoId={videoId} start={parseYouTubeStart(videoLink)} />
          ) : undefined
        }
        isActive={isExercising}
        isPaused={isPaused}
        practice={practice}
        gate={
          gate.phase === 'framing' || gate.phase === 'countdown' ? gate.phase : undefined
        }
        framing={gate.framing}
        countdown={gate.countdown}
        outOfView={outOfView}
        onStart={() => beginSession(practice)}
        onStop={handleStop}
        onPause={() => setIsPaused((p) => !p)}
        onReset={backToChooser}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  camera: { flex: 1, backgroundColor: '#000' },
  practiceBackground: { backgroundColor: colors.text },
});

export default PoseDetectionScreen;
