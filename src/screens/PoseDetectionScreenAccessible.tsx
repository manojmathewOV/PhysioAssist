import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import { setDetecting } from '../store/slices/poseSlice';
import { updateValidation } from '../store/slices/exerciseSlice';
import { useBlazePose, CAMERA_FPS } from '../hooks/useBlazePose';
import { exerciseValidationService } from '../services/exerciseValidationService';
import { audioFeedbackService } from '../services/audioFeedbackService';
import PoseOverlay from '../components/pose/PoseOverlay';
import ExerciseControls from '../components/exercises/ExerciseControls';
import { AccessibilityIds } from '../constants/accessibility';
import { AppText, BigButton, Card } from '../components/ui';
import { CameraPanel } from '../components/ui/CameraPanel';
import { colors, radii, spacing } from '../theme';

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
  const [isLoading, setIsLoading] = useState(false);
  const isDetectingRef = useRef(isDetecting);
  const lastSpokenFeedbackRef = useRef<string | null>(null);

  isDetectingRef.current = isDetecting;

  // BlazePose runs only while detecting; poses go to the Redux store
  const { cameraProps, error: detectorError } = useBlazePose({
    device,
    enabled: isDetecting,
    frameSkip,
  });

  // The native detector failed: stop and let the user try again
  useEffect(() => {
    if (!detectorError) {
      return;
    }
    console.error('Pose detection failed:', detectorError);
    if (isDetectingRef.current) {
      dispatch(setDetecting(false));
    }
    Alert.alert('Error', 'Failed to start pose detection. Please try again.', [
      { text: 'OK' },
    ]);
  }, [detectorError, dispatch]);

  useEffect(() => {
    requestCameraPermission();
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

  const startPoseDetection = () => {
    if (!hasPermission) {
      Alert.alert('Not Ready', 'Please grant camera permission to start pose detection.');
      return;
    }

    setIsLoading(true);
    try {
      // The BlazePose detector (created natively by useBlazePose) starts
      // analysing frames as soon as detection is enabled
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

  if (!device) {
    return (
      <View style={[styles.container, styles.centered]} accessibilityRole="alert">
        <ActivityIndicator size="large" color={colors.skeleton} />
        <AppText variant="bodyStrong" color={colors.textInverse}>
          Loading camera…
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityLabel="Pose Detection Screen"
      testID={AccessibilityIds.poseDetection.screen}
    >
      {hasPermission ? (
        <>
          <Camera
            style={styles.camera}
            device={device}
            isActive={isFocused}
            fps={CAMERA_FPS}
            {...cameraProps}
            accessible={true}
            accessibilityLabel="Camera view for pose detection"
            testID={AccessibilityIds.poseDetection.cameraView}
          />

          <PoseOverlay />

          <SafeAreaView
            style={styles.overlay}
            edges={['top', 'bottom']}
            pointerEvents="box-none"
          >
            <View
              style={styles.confidenceContainer}
              accessible={true}
              accessibilityLabel={`Confidence: ${Math.round(confidence * 100)} percent`}
              accessibilityRole="text"
              testID={AccessibilityIds.poseDetection.confidenceIndicator}
            >
              <Icon name="visibility" size={22} color={colors.skeleton} />
              <AppText variant="label" color={colors.textInverse}>
                Confidence
              </AppText>
              <AppText variant="bodyStrong" color={colors.textInverse}>
                {(confidence * 100).toFixed(0)}%
              </AppText>
            </View>

            {/* Exercise choice, instructions and rep counter */}
            <View style={styles.flex} pointerEvents="box-none">
              <ExerciseControls />
            </View>

            <CameraPanel style={styles.actionPanel}>
              <BigButton
                label={isDetecting ? 'Stop detection' : 'Start detection'}
                icon={isDetecting ? 'stop' : 'play-arrow'}
                variant={isDetecting ? 'danger' : 'primary'}
                onPress={isDetecting ? stopPoseDetection : startPoseDetection}
                disabled={isLoading}
                loading={isLoading}
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
              />
            </CameraPanel>
          </SafeAreaView>
        </>
      ) : (
        <View style={[styles.permissionContainer, styles.centered]}>
          <Card
            style={styles.permissionCard}
            testID={AccessibilityIds.poseDetection.permissionDialog}
          >
            <View style={styles.permissionIcon}>
              <Icon name="videocam" size={36} color={colors.primary} />
            </View>
            <AppText variant="heading" center accessibilityRole="header">
              Allow the camera
            </AppText>
            <AppText
              variant="body"
              color={colors.textSecondary}
              center
              accessibilityRole="alert"
            >
              Camera permission is required for pose detection
            </AppText>
            <BigButton
              label="Grant permission"
              icon="videocam"
              onPress={requestCameraPermission}
              accessibilityHint="Double tap to grant camera permission"
              testID={AccessibilityIds.poseDetection.permissionGrantButton}
            />
          </Card>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  camera: {
    flex: 1,
  },
  flex: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.cameraOverlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  actionPanel: {
    padding: spacing.md,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'stretch',
    gap: spacing.md,
  },
  permissionIcon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PoseDetectionScreenAccessible;
