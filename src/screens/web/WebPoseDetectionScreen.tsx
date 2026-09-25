/**
 * Exercise tab (web, MediaPipe in the browser). Same three steps as the native
 * screen: choose an exercise -> exercise with the camera filling the screen
 * (get into position, 3-2-1 countdown, then counting) -> a calm summary with
 * an optional pain check. When the browser has no camera or blocks it, a friendly
 * full-screen explanation offers "Try again" or practice mode.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';

import { webPoseDetectionService } from '../../services/web/WebPoseDetectionService';
import { goniometerService } from '../../services/goniometerService';
import { exerciseValidationService } from '../../services/exerciseValidationService';
import { audioFeedbackService } from '../../services/audioFeedbackService';
import { mockPoseDataSimulator } from '../../services/mockPoseDataSimulator';
import { FRAME_HEIGHT, FRAME_WIDTH } from '../../testing/virtualPatient/body';

const VIRTUAL_FRAME_ASPECT = FRAME_WIDTH / FRAME_HEIGHT;
import {
  getMeasurementLandmarks,
  getOutOfPlaneJoints,
} from '../../services/pose/measurementLandmarks';
import { setPoseData, setDetecting } from '../../store/slices/poseSlice';
import {
  clearExercise,
  setFeedback,
  setLastSessionPain,
  startExercise,
  stopExercise,
  updateExerciseProgress,
  updateValidation,
} from '../../store/slices/exerciseSlice';
import type { RootState } from '../../store';
import { setExercisePlan } from '../../store/slices/settingsSlice';
import { ExercisePlan, applyPlan } from '../../services/pose/exercisePlan';
import { PoseLandmark, ProcessedPoseData } from '../../types/pose';
import WebPoseOverlay from '../../components/web/WebPoseOverlay';
import { focusFromExercise } from '../../components/pose/overlayGeometry';
import ExerciseChooser from '../../components/exercises/ExerciseChooser';
import {
  sessionOutcome,
  useMovementAnalysis,
} from '../../components/exercises/useMovementAnalysis';
import { referenceFromVideoFile } from '../../services/web/videoReference';
import FollowAlongVideo from '../../components/video/FollowAlongVideo';
import { parseYouTubeId, parseYouTubeStart } from '../../utils/youtube';
import ExerciseControls from '../../components/exercises/ExerciseControls';
import ExerciseSummary, {
  ExerciseSummaryProps,
} from '../../components/exercises/ExerciseSummary';
import CameraUnavailable from '../../components/exercises/CameraUnavailable';
import {
  FRAMING_MESSAGE,
  useSessionGate,
} from '../../components/exercises/useSessionGate';
import {
  EXERCISE_OPTIONS,
  ExerciseKey,
  friendlyInstruction,
} from '../../components/exercises/exerciseCatalog';
import { AccessibilityIds } from '../../constants/accessibility';
import type { MainTabParamList } from '../../navigation/types';
import { colors } from '../../theme';

/** First exercise that trains the plan's joint (falls back to the bicep curl). */
const firstKeyFor = (plan?: ExercisePlan | null): ExerciseKey =>
  EXERCISE_OPTIONS.find((o) => plan && o.exercise.primaryJoint === plan.joint)?.key ??
  'bicepCurl';

// Displayed joints: screen/overlay key -> goniometerService joint name
const WEB_JOINTS: Record<string, string> = {
  leftElbow: 'left_elbow',
  rightElbow: 'right_elbow',
  leftKnee: 'left_knee',
  rightKnee: 'right_knee',
  leftShoulder: 'left_shoulder',
  rightShoulder: 'right_shoulder',
};

type Stage = 'choose' | 'exercise' | 'summary';
type CameraState = 'starting' | 'live' | 'denied' | 'unavailable' | 'error';

/** Checks the camera first so a failure can be explained in plain words. */
const checkCamera = async (): Promise<CameraState> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unavailable';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    stream.getTracks().forEach((t) => t.stop());
    return 'live';
  } catch (error) {
    const name = (error as { name?: string })?.name;
    return name === 'NotAllowedError' || name === 'SecurityError'
      ? 'denied'
      : 'unavailable';
  }
};

const WebPoseDetectionScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const exerciseState = useSelector((s: RootState) => s.exercise);
  const showJointAngles = useSelector((s: RootState) => s.settings.showJointAngles);
  const showPoseOverlay = useSelector((s: RootState) => s.settings.showPoseOverlay);
  const currentLandmarks = useSelector((s: RootState) => s.pose.currentPose?.landmarks);

  const plan = useSelector((s: RootState) => s.settings.exercisePlan);
  const [stage, setStage] = useState<Stage>('choose');
  const [selectedKey, setSelectedKey] = useState<ExerciseKey>(() => firstKeyFor(plan));
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [practice, setPractice] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [summary, setSummary] = useState<
    (ExerciseSummaryProps & { saved: boolean }) | null
  >(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [videoAspect, setVideoAspect] = useState(16 / 9);

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
  const lastSpokenRef = useRef('');
  const lastRepsRef = useRef(0);
  const pausedRef = useRef(false);
  pausedRef.current = isPaused;

  // Get into position -> 3-2-1 countdown -> count. Validation (and the timer)
  // starts at "Go".
  // Records the joint of interest for the end-of-session comparison
  const movement = useMovementAnalysis(plan, plannedExercise);
  // The physio's YouTube video for this exercise, played alongside the camera
  const videoLink = plan?.videos?.[plannedExercise.id];
  const videoId = parseYouTubeId(videoLink);
  const movementRef = useRef(movement);
  movementRef.current = movement;
  const [recordingDemo, setRecordingDemo] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | undefined>();

  const gate = useSessionGate({
    landmarks: currentLandmarks,
    onGo: () => {
      lastRepsRef.current = 0;
      dispatch(startExercise(plannedExercise));
      exerciseValidationService.startExercise(plannedExercise);
      movementRef.current.start();
    },
  });
  const { start: startGate, reset: resetGate } = gate;
  const outOfViewRef = useRef(false);
  outOfViewRef.current = gate.outOfView;
  const settingsRef = useRef({ showJointAngles, showPoseOverlay });
  settingsRef.current = { showJointAngles, showPoseOverlay };

  const handlePoseResults = useCallback(
    (landmarks: PoseLandmark[], detected: ProcessedPoseData | null) => {
      if (landmarks.length === 0) {
        return;
      }

      // Landmarks are normalized per axis and MediaPipe's z is only a relative
      // guess, so angles need the frame's aspect ratio and must ignore z
      const video = videoRef.current;
      const aspect =
        video && video.videoWidth && video.videoHeight
          ? video.videoWidth / video.videoHeight
          : undefined;
      const poseData: ProcessedPoseData = {
        landmarks,
        timestamp: Date.now(),
        confidence:
          landmarks.reduce((acc, l) => acc + l.visibility, 0) / landmarks.length,
        schemaId: 'mediapipe-33',
        ...detected,
        aspectRatio: detected?.aspectRatio ?? aspect,
        zIsRelative: true,
      };
      dispatch(setPoseData(poseData));

      // Angles (degrees) for the overlay. Readings from limbs pointing toward
      // the camera are only estimates, so they are not shown as numbers; the
      // controls ask the patient to turn side-on instead.
      const angles: { [key: string]: number } = {};
      if (settingsRef.current.showJointAngles) {
        const allAngles = goniometerService.calculateAllJointAngles(
          getMeasurementLandmarks(poseData)
        );
        const outOfPlane = getOutOfPlaneJoints(poseData);
        for (const [joint, name] of Object.entries(WEB_JOINTS)) {
          const angle = allAngles.get(name);
          if (angle && !outOfPlane.has(name)) {
            angles[joint] = angle.angle;
          }
        }
      }

      // Validate the exercise and show/speak the next instruction
      if (exerciseValidationService.getCurrentState().isActive && !pausedRef.current) {
        const validation = exerciseValidationService.validatePose(poseData);
        movementRef.current.add(poseData);
        const metrics = exerciseValidationService.getExerciseMetrics();
        const raw = validation.feedback[0] ?? validation.errors[0] ?? '';
        dispatch(updateValidation(validation));
        if (!validation.feedback.length && raw) {
          dispatch(setFeedback(raw));
        }
        dispatch(
          updateExerciseProgress({
            reps: metrics.repetitionCount,
            formScore: metrics.averageQuality / 100, // slice stores 0-1
            phase: validation.phase,
          })
        );
        if (metrics.repetitionCount > lastRepsRef.current) {
          audioFeedbackService.announceRep(
            metrics.repetitionCount,
            exerciseValidationService.getCurrentState().exercise?.targetRepetitions
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
      }

      // Draw the skeleton
      const overlay = overlayCanvasRef.current;
      if (overlay && settingsRef.current.showPoseOverlay !== false) {
        WebPoseOverlay.drawPose(
          overlay,
          landmarks,
          angles,
          overlay.clientWidth || canvasRef.current?.width || 640,
          overlay.clientHeight || canvasRef.current?.height || 360,
          {
            focus: focusFromExercise(
              exerciseValidationService.getCurrentState().exercise,
              exerciseValidationService.getCurrentState().phase?.name
            ),
            showAngles: settingsRef.current.showJointAngles,
          }
        );
      }
    },
    [dispatch]
  );

  const beginExercise = useCallback(
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
      if (practiceMode) {
        setCameraState('live');
        mockPoseDataSimulator.start(
          (pose) => handlePoseResults(pose.landmarks, pose),
          30,
          exercise.id
        );
      }
    },
    [dispatch, handlePoseResults, option, plannedExercise, startGate]
  );

  const stopEverything = useCallback(() => {
    webPoseDetectionService.stopDetection();
    if (mockPoseDataSimulator.isActive()) {
      mockPoseDataSimulator.stop();
    }
    dispatch(setDetecting(false));
  }, [dispatch]);

  // Open the camera once the exercise view (and its <video>) is on screen
  useEffect(() => {
    if (stage !== 'exercise' || practice || cameraState !== 'starting') {
      return;
    }
    let cancelled = false;
    (async () => {
      const state = await checkCamera();
      if (cancelled) {
        return;
      }
      if (state !== 'live' || !videoRef.current || !canvasRef.current) {
        setCameraState(state === 'live' ? 'error' : state);
        return;
      }
      try {
        beginExercise(false);
        await webPoseDetectionService.startDetection(
          videoRef.current,
          canvasRef.current,
          handlePoseResults
        );
        if (!cancelled) {
          setCameraState('live');
        }
      } catch (error) {
        console.error('Failed to start pose detection:', error);
        exerciseValidationService.stopExercise();
        dispatch(clearExercise());
        stopEverything();
        if (!cancelled) {
          setCameraState('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    stage,
    practice,
    cameraState,
    beginExercise,
    handlePoseResults,
    dispatch,
    stopEverything,
  ]);

  // Stop the camera when leaving the screen
  useEffect(
    () => () => {
      webPoseDetectionService.stopDetection();
      mockPoseDataSimulator.stop();
      exerciseValidationService.stopExercise();
    },
    []
  );

  const handleStart = () => {
    setRecordingDemo(false);
    setPractice(false);
    setCameraState('starting');
    setStage('exercise');
  };

  const handleStop = () => {
    if (gate.phase !== 'active') {
      // Still getting ready: nothing to save
      backToChooser();
      return;
    }
    resetGate();
    const { repetitionCount, formScore, startedAt, currentExercise } = exerciseState;
    const sessionRange = exerciseValidationService.getSessionRange();
    exerciseValidationService.stopExercise();
    stopEverything();
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
        : stopExercise(sessionRange ?? undefined)
    );
    audioFeedbackService.speak(
      outcome.spokenCue ? `Well done. ${outcome.spokenCue}` : 'Well done'
    );
    setSummary({
      ...outcome.summary,
      exercise: option.title,
      reps: repetitionCount,
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
  };

  const backToChooser = () => {
    resetGate();
    exerciseValidationService.stopExercise();
    stopEverything();
    dispatch(clearExercise());
    setPractice(false);
    setRecordingDemo(false);
    setStage('choose');
  };

  /** The physio's standard from a video file: analysed here, never uploaded. */
  const uploadVideo = () => {
    const kind = plannedExercise.primaryJoint;
    if (!plan || !kind || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setDemoStatus('Watching the video… 0%');
      try {
        const profile = await referenceFromVideoFile(
          file,
          { joint: kind, side: plan.side, exerciseId: plannedExercise.id },
          (f) => setDemoStatus(`Watching the video… ${Math.round(f * 100)}%`)
        );
        if (profile) {
          dispatch(
            setExercisePlan({
              ...plan,
              reference: {
                ...profile,
                exerciseId: plannedExercise.id,
                source: 'video',
                savedAt: new Date().toISOString(),
                label: file.name,
              },
            })
          );
          setDemoStatus(undefined);
        } else {
          setDemoStatus(
            'No clear repetitions were found in that video. Try a video showing the whole body, side-on.'
          );
        }
      } catch {
        setDemoStatus('That video could not be opened. Please try another file.');
      }
    };
    input.click();
  };

  const onArea = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
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
          plan={plan}
          onPlanChange={changePlan}
          onRecordDemo={() => {
            handleStart();
            setRecordingDemo(true);
          }}
          onUploadVideo={uploadVideo}
          demoStatus={demoStatus}
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
  const practiceAction = {
    label: 'Practice without camera',
    icon: 'play-arrow',
    onPress: () => beginExercise(true),
    testID: 'use-practice-mode',
  };
  const back = {
    label: 'Back to exercises',
    onPress: backToChooser,
    testID: 'camera-help-back',
  };
  const tryAgain = {
    label: 'Try again',
    icon: 'refresh',
    onPress: () => setCameraState('starting'),
    testID: AccessibilityIds.poseDetection.permissionGrantButton,
  };

  if (!practice && cameraState === 'denied') {
    return (
      <CameraUnavailable
        testID={AccessibilityIds.poseDetection.permissionDialog}
        icon="photo-camera"
        title="Allow the camera"
        message="PhysioAssist uses your camera to watch your movements and count your repetitions. Nothing is recorded or sent anywhere. Click the camera icon in your browser's address bar, choose Allow, then press Try again."
        primary={tryAgain}
        secondary={practiceAction}
      />
    );
  }
  if (!practice && (cameraState === 'unavailable' || cameraState === 'error')) {
    const noCamera = cameraState === 'unavailable';
    return (
      <CameraUnavailable
        testID={noCamera ? 'no-camera' : 'camera-error'}
        icon={noCamera ? 'no-photography' : 'videocam-off'}
        title={noCamera ? 'No camera found' : "The camera couldn't start"}
        message={
          noCamera
            ? 'We could not find a camera on this device. Connect a webcam and press Try again, or practise with a pretend body to see how it works.'
            : 'Check your internet connection and that no other app is using the camera, then press Try again.'
        }
        primary={noCamera ? practiceAction : tryAgain}
        secondary={noCamera ? tryAgain : back}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 2. Exercise (camera full screen)
  // -------------------------------------------------------------------------
  // Keep video, video canvas and skeleton in one box with the video's aspect
  // ratio, so the skeleton lines up with the body.
  // Practice mode has no video: the box takes the virtual patient's 3:4 frame.
  const aspect = practice ? VIRTUAL_FRAME_ASPECT : videoAspect;
  const boxWidth = Math.min(area.width, area.height * aspect) || 0;
  const boxHeight = boxWidth ? boxWidth / aspect : 0;

  return (
    <View style={styles.stage} testID={AccessibilityIds.poseDetection.screen}>
      <View style={styles.videoArea} onLayout={onArea}>
        <View
          style={[
            styles.videoBox,
            practice && styles.practiceBox,
            { width: boxWidth, height: boxHeight },
          ]}
          testID="camera-view"
        >
          <video
            ref={videoRef}
            style={domStyles.fill}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                setVideoAspect(v.videoWidth / v.videoHeight);
              }
            }}
          />
          <canvas ref={canvasRef} style={domStyles.fill} />
          <canvas ref={overlayCanvasRef} style={domStyles.fill} />
        </View>
      </View>

      <ExerciseControls
        media={
          videoId ? (
            <FollowAlongVideo videoId={videoId} start={parseYouTubeStart(videoLink)} />
          ) : undefined
        }
        isActive={exerciseState.isExercising || cameraState === 'starting'}
        isPaused={isPaused}
        practice={practice}
        gate={
          gate.phase === 'framing' || gate.phase === 'countdown'
            ? gate.phase
            : gate.phase === 'idle'
              ? 'framing' // camera still opening
              : undefined
        }
        framing={gate.framing}
        countdown={gate.countdown}
        outOfView={gate.outOfView}
        onStop={handleStop}
        onPause={() => setIsPaused((p) => !p)}
        onReset={backToChooser}
      />
    </View>
  );
};

// Raw DOM elements (<video>, <canvas>) take CSS styles, not React Native styles
const domStyles: Record<'fill', React.CSSProperties> = {
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'fill',
    pointerEvents: 'none',
  },
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  stage: { flex: 1, backgroundColor: colors.text, overflow: 'hidden' },
  videoArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBox: { position: 'relative', backgroundColor: '#000' },
  practiceBox: { backgroundColor: 'transparent' },
});

export default WebPoseDetectionScreen;
