import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
  Linking,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  Frame,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import { setPoseData, setDetecting } from '../store/slices/poseSlice';
import { updateValidation } from '../store/slices/exerciseSlice';
import { poseDetectionService } from '../services/poseDetectionService';
import { exerciseValidationService } from '../services/exerciseValidationService';
import { audioFeedbackService } from '../services/audioFeedbackService';
import PoseOverlay from '../components/pose/PoseOverlay';
import ExerciseControls from '../components/exercises/ExerciseControls';
import { AccessibilityIds } from '../constants/accessibility';
import { ProcessedPoseData } from '../types/pose';

const PoseDetectionScreenAccessible: React.FC = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const device = useCameraDevice('front');

  const { isDetecting, confidence, currentPose } = useSelector(
    (state: RootState) => state.pose
  );
  const isExercising = useSelector((state: RootState) => state.exercise.isExercising);
  const frameSkip = useSelector((state: RootState) => state.settings.frameSkip);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDetectingRef = useRef(isDetecting);
  const frameCountRef = useRef(0);
  const lastSpokenFeedbackRef = useRef<string | null>(null);

  isDetectingRef.current = isDetecting;

  useEffect(() => {
    requestCameraPermission();
    initializePoseDetection();
    announceScreen();

    return () => {
      if (isDetectingRef.current) {
        dispatch(setDetecting(false));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const announceScreen = () => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(
        'Pose Detection screen. Position yourself so your full body is visible in the camera.'
      );
    }
  };

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'granted');

    if (permission !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'PhysioAssist needs camera access to detect your pose and provide exercise guidance.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
        { cancelable: false }
      );
    }
  };

  const initializePoseDetection = async () => {
    try {
      await poseDetectionService.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize pose detection. Please restart the app.'
      );
    }
  };

  const handlePoseData = useCallback(
    (poseData: ProcessedPoseData) => {
      dispatch(setPoseData(poseData));
    },
    [dispatch]
  );

  const startPoseDetection = async () => {
    if (!hasPermission) {
      Alert.alert('Not Ready', 'Please grant camera permission to start pose detection.');
      return;
    }

    setIsLoading(true);
    try {
      // Retry initialization if it failed on mount, so the user can recover
      if (!isInitialized) {
        await poseDetectionService.initialize();
        setIsInitialized(true);
      }
      poseDetectionService.setPoseDataCallback(handlePoseData);
      dispatch(setDetecting(true));

      // Announce start for accessibility
      AccessibilityInfo.announceForAccessibility(
        'Pose detection started. Begin your exercise.'
      );
    } catch (error) {
      console.error('Failed to start pose detection:', error);
      Alert.alert('Error', 'Failed to start pose detection. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPoseDetection = () => {
    dispatch(setDetecting(false));

    // Announce stop for accessibility
    AccessibilityInfo.announceForAccessibility('Pose detection stopped.');
  };

  // Validate each new pose during an active exercise and speak form corrections
  useEffect(() => {
    if (!isExercising || !currentPose) {
      return;
    }
    try {
      const result = exerciseValidationService.validatePose(currentPose);
      dispatch(updateValidation(result));

      const message = result.feedback[0];
      if (message && message !== lastSpokenFeedbackRef.current) {
        lastSpokenFeedbackRef.current = message;
        audioFeedbackService.speak(message);
      }
    } catch (error) {
      console.error('Failed to validate pose:', error);
    }
  }, [currentPose, isExercising, dispatch]);

  // Runs on the JS thread, called from the frame processor worklet. Frame skipping
  // lives here because refs and React state can't be mutated inside worklets.
  const processFrameData = useCallback(
    (_width: number, _height: number) => {
      frameCountRef.current++;
      if (frameCountRef.current % frameSkip !== 0) {
        return;
      }
      // Frame-to-tensor conversion needs a native resize plugin; until it's wired up,
      // pose data arrives through the callback registered in startPoseDetection.
    },
    [frameSkip]
  );

  const processFrameOnJS = useMemo(
    () => Worklets.createRunOnJS(processFrameData),
    [processFrameData]
  );

  // Frame processor for pose detection (VisionCamera v4 + react-native-worklets-core)
  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      processFrameOnJS(frame.width, frame.height);
    },
    [processFrameOnJS]
  );

  if (!device) {
    return (
      <View style={styles.container} accessibilityRole="alert">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel="Pose Detection Screen"
      testID={AccessibilityIds.poseDetection.screen}
    >
      {hasPermission ? (
        <>
          <Camera
            style={styles.camera}
            device={device}
            isActive={isFocused}
            frameProcessor={isDetecting ? frameProcessor : undefined}
            fps={30}
            accessible={true}
            accessibilityLabel="Camera view for pose detection"
            testID={AccessibilityIds.poseDetection.cameraView}
          />

          <PoseOverlay />

          <View style={styles.topControls}>
            <View
              style={styles.confidenceContainer}
              accessible={true}
              accessibilityLabel={`Confidence: ${Math.round(confidence * 100)} percent`}
              accessibilityRole="text"
              testID={AccessibilityIds.poseDetection.confidenceIndicator}
            >
              <Text style={styles.confidenceLabel}>Confidence:</Text>
              <Text style={styles.confidenceValue}>{(confidence * 100).toFixed(0)}%</Text>
            </View>
          </View>

          <View style={styles.bottomControls}>
            <ExerciseControls />

            <TouchableOpacity
              style={[
                styles.controlButton,
                isDetecting ? styles.stopButton : styles.startButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={isDetecting ? stopPoseDetection : startPoseDetection}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel={
                isDetecting ? 'Stop pose detection' : 'Start pose detection'
              }
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
              accessibilityHint={
                isDetecting
                  ? 'Double tap to stop detecting your pose'
                  : 'Double tap to start detecting your pose'
              }
              testID={
                isDetecting
                  ? AccessibilityIds.poseDetection.stopButton
                  : AccessibilityIds.poseDetection.startButton
              }
            >
              {isLoading ? (
                <ActivityIndicator
                  color="white"
                  accessibilityLabel="Loading"
                  testID={AccessibilityIds.common.loadingSpinner}
                />
              ) : (
                <Text style={styles.buttonText}>
                  {isDetecting ? 'Stop Detection' : 'Start Detection'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View
          style={styles.permissionContainer}
          accessible={true}
          accessibilityRole="alert"
          testID={AccessibilityIds.poseDetection.permissionDialog}
        >
          <Text style={styles.permissionText}>
            Camera permission is required for pose detection
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermission}
            accessible={true}
            accessibilityLabel="Grant camera permission"
            accessibilityRole="button"
            accessibilityHint="Double tap to grant camera permission"
            testID={AccessibilityIds.poseDetection.permissionGrantButton}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  confidenceContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  confidenceLabel: {
    color: 'white',
    fontSize: 14,
    marginRight: 5,
  },
  confidenceValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
  },
});

export default PoseDetectionScreenAccessible;
