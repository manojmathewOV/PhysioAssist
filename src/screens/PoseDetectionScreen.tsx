/**
 * Exercise tab (iOS/Android).
 *
 * 1. Choose an exercise (large cards, set-up reminder, one big Start button).
 * 2. Exercise: the camera fills the screen; the instruction, rep counter and
 *    one big Stop button sit on dark overlay panels (ExerciseControls).
 * 3. Summary: reps, time and form in words, then "Done" or "Do another".
 *
 * Without a camera (simulator) or camera permission, a friendly full-screen
 * explanation offers one clear way forward (open Settings / practice mode).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { setPoseData, setDetecting } from '@store/slices/poseSlice';
import {
  clearExercise,
  setFeedback,
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
import ExerciseControls from '@components/exercises/ExerciseControls';
import ExerciseChooser from '@components/exercises/ExerciseChooser';
import ExerciseSummary, {
  ExerciseSummaryProps,
} from '@components/exercises/ExerciseSummary';
import CameraUnavailable from '@components/exercises/CameraUnavailable';
import {
  EXERCISE_OPTIONS,
  ExerciseKey,
  friendlyInstruction,
} from '@components/exercises/exerciseCatalog';
import { AccessibilityIds } from '../constants/accessibility';
import type { MainTabParamList } from '../navigation/types';
import { colors } from '../theme';

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

  const [stage, setStage] = useState<Stage>('choose');
  const [selectedKey, setSelectedKey] = useState<ExerciseKey>('bicepCurl');
  const [permission, setPermission] = useState<Permission>('unknown');
  const [isPaused, setIsPaused] = useState(false);
  const [practice, setPractice] = useState(false);
  const [summary, setSummary] = useState<ExerciseSummaryProps | null>(null);
  const lastSpokenRef = useRef('');

  const option = EXERCISE_OPTIONS.find((o) => o.key === selectedKey)!;
  const cameraReady = !!device && permission === 'granted';

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
    if (stage !== 'exercise' || !isExercising || isPaused || !currentPose) {
      return;
    }
    try {
      const result = exerciseValidationService.validatePose(currentPose);
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
      const message = friendlyInstruction(raw);
      if (message && message !== lastSpokenRef.current) {
        lastSpokenRef.current = message;
        audioFeedbackService.speak(message);
      }
    } catch (error) {
      console.error('Failed to validate pose:', error);
    }
  }, [currentPose, isExercising, isPaused, stage, dispatch]);

  const beginSession = useCallback(
    (practiceMode: boolean) => {
      const exercise = option.exercise;
      lastSpokenRef.current = '';
      setIsPaused(false);
      setPractice(practiceMode);
      dispatch(startExercise(exercise));
      exerciseValidationService.startExercise(exercise);
      dispatch(setDetecting(true));
      audioFeedbackService.speak(`Starting ${option.title}. ${exercise.instructions[0]}`);

      if (practiceMode && mockPoseDataSimulator) {
        mockPoseDataSimulator.start((poseData) => {
          dispatch(setPoseData(poseData));
        }, 30);
      }
      setStage('exercise');
    },
    [dispatch, option]
  );

  // Start straight away once the camera becomes available (e.g. permission granted)
  useEffect(() => {
    if (stage === 'exercise' && cameraReady && !isExercising && !practice) {
      beginSession(false);
    }
  }, [stage, cameraReady, isExercising, practice, beginSession]);

  const handleStart = () => {
    if (cameraReady) {
      beginSession(false);
    } else {
      // Shows the friendly "camera unavailable" explanation
      setStage('exercise');
    }
  };

  const handleStop = useCallback(() => {
    const { repetitionCount, formScore, startedAt, currentExercise } = exerciseState;
    exerciseValidationService.stopExercise();
    mockPoseDataSimulator?.stop();
    dispatch(setDetecting(false));
    // Practice sessions use a pretend body, so they are not saved to history
    dispatch(practice ? clearExercise() : stopExercise());
    audioFeedbackService.speak('Well done');

    setSummary({
      exercise: option.title,
      reps: repetitionCount,
      duration: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
      formAccuracy: Math.round(formScore * 100),
      targetReps: currentExercise?.targetRepetitions,
      practice,
    });
    setIsPaused(false);
    setStage('summary');
  }, [dispatch, exerciseState, option, practice]);

  const backToChooser = () => {
    if (isExercising) {
      exerciseValidationService.stopExercise();
      dispatch(clearExercise());
    }
    mockPoseDataSimulator?.stop();
    dispatch(setDetecting(false));
    setPractice(false);
    setStage('choose');
  };

  // -------------------------------------------------------------------------
  // 1. Choose
  // -------------------------------------------------------------------------
  if (stage === 'choose') {
    return (
      <View style={styles.flex} testID={AccessibilityIds.poseDetection.screen}>
        <ExerciseChooser
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
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
        isActive={isExercising}
        isPaused={isPaused}
        practice={practice}
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
