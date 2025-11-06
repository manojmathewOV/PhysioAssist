import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
  Frame,
} from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { runOnJS } from 'react-native-reanimated';

import { RootState } from '../store';
import { setPoseData, setDetecting } from '../store/slices/poseSlice';
import { poseDetectionService } from '../services/poseDetectionService';
import PoseOverlay from '../components/pose/PoseOverlay';
import ExerciseControls from '../components/exercises/ExerciseControls';
import { AccessibilityIds } from '../constants/accessibility';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PoseDetectionScreenAccessible: React.FC = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const devices = useCameraDevices();
  const device = devices.front;

  const { isDetecting, confidence } = useSelector((state: RootState) => state.pose);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    requestCameraPermission();
    initializePoseDetection();
    announceScreen();

    return () => {
      if (isDetecting) {
        stopPoseDetection();
      }
    };
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
    setHasPermission(permission === 'authorized');

    if (permission !== 'authorized') {
      Alert.alert(
        'Camera Permission Required',
        'PhysioAssist needs camera access to detect your pose and provide exercise guidance.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Camera.openSettings() },
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

  const startPoseDetection = async () => {
    if (!hasPermission || !isInitialized) {
      Alert.alert(
        'Not Ready',
        'Please grant camera permission and wait for initialization.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await poseDetectionService.startDetection();
      dispatch(setDetecting(true));

      // Announce start for accessibility
      AccessibilityInfo.announceForAccessibility(
        'Pose detection started. Begin your exercise.'
      );
    } catch (error) {
      console.error('Failed to start pose detection:', error);
      Alert.alert('Error', 'Failed to start pose detection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopPoseDetection = async () => {
    setIsLoading(true);
    try {
      await poseDetectionService.stopDetection();
      dispatch(setDetecting(false));

      // Announce stop for accessibility
      AccessibilityInfo.announceForAccessibility('Pose detection stopped.');
    } catch (error) {
      console.error('Failed to stop pose detection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      if (isDetecting) {
        const landmarks = poseDetectionService.processFrame(frame);
        if (landmarks) {
          runOnJS(updatePoseData)(landmarks);
        }
      }
    },
    [isDetecting]
  );

  const updatePoseData = (landmarks: any) => {
    dispatch(
      setPoseData({
        landmarks,
        timestamp: Date.now(),
        confidence: landmarks.confidence || 0,
      })
    );
  };

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
            frameProcessor={frameProcessor}
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
