import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
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

import { RootState } from '@store/index';
import { setPoseData, setDetecting } from '@store/slices/poseSlice';
import { poseDetectionService } from '@services/poseDetectionService';
import PoseOverlay from '@components/pose/PoseOverlay';
import ExerciseControls from '@components/exercises/ExerciseControls';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PoseDetectionScreen: React.FC = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const devices = useCameraDevices();
  const device = devices.front;
  
  const { isDetecting, confidence } = useSelector((state: RootState) => state.pose);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    requestCameraPermission();
    initializePoseDetection();

    return () => {
      if (isDetecting) {
        stopPoseDetection();
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'authorized');
    if (permission !== 'authorized') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to use pose detection.'
      );
    }
  };

  const initializePoseDetection = async () => {
    try {
      await poseDetectionService.initialize();
      poseDetectionService.setPoseDataCallback((poseData) => {
        dispatch(setPoseData(poseData));
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize pose detection. Please restart the app.'
      );
    }
  };

  const startPoseDetection = () => {
    if (isInitialized) {
      dispatch(setDetecting(true));
    }
  };

  const stopPoseDetection = () => {
    dispatch(setDetecting(false));
  };

  // Frame processor for pose detection
  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    if (!isDetecting) return;

    // Convert frame to processable format
    // Note: This is a simplified version. In production, you'd need
    // proper frame conversion logic
    runOnJS(() => {
      // Process frame with pose detection service
      // This would involve converting the frame to ImageData
      // and passing it to poseDetectionService.processFrame()
    })();
  }, [isDetecting]);

  if (!device || !hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          {!device ? 'No camera device found' : 'Camera permission required'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        frameProcessor={frameProcessor}
        fps={30}
      />
      
      <PoseOverlay />
      
      <View style={styles.topInfo}>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            Confidence: {(confidence * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        {!isDetecting ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startPoseDetection}
          >
            <Text style={styles.buttonText}>Start Detection</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopPoseDetection}
          >
            <Text style={styles.buttonText}>Stop Detection</Text>
          </TouchableOpacity>
        )}
      </View>

      <ExerciseControls />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  topInfo: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PoseDetectionScreen;