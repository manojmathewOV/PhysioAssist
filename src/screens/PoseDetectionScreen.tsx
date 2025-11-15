import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { mockPoseDataSimulator } from '@services/mockPoseDataSimulator';
import PoseOverlay from '@components/pose/PoseOverlay';
import ExerciseControls from '@components/exercises/ExerciseControls';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PoseDetectionScreen: React.FC = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const devices = useCameraDevices();
  const device = devices.front;

  const { isDetecting, confidence } = useSelector((state: RootState) => state.pose);
  const { frameSkip } = useSelector((state: RootState) => state.settings);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const frameCountRef = useRef(0);

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
      setUseMockData(false);
      console.log('Pose detection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      setInitError('Pose detection unavailable');

      // Fall back to mock data simulator
      Alert.alert(
        'Using Mock Data',
        'Pose detection service unavailable. Using simulated data for testing. This is normal in development/test environments.',
        [
          {
            text: 'OK',
            onPress: () => {
              setUseMockData(true);
              setIsInitialized(true);
              console.log('Switched to mock pose data simulator');
            },
          },
        ]
      );
    }
  };

  const startPoseDetection = () => {
    if (isInitialized) {
      dispatch(setDetecting(true));

      // Start mock simulator if using mock data
      if (useMockData) {
        mockPoseDataSimulator.start((poseData) => {
          dispatch(setPoseData(poseData));
        }, 30);
      }
    }
  };

  const stopPoseDetection = () => {
    dispatch(setDetecting(false));

    // Stop mock simulator if running
    if (useMockData && mockPoseDataSimulator.isActive()) {
      mockPoseDataSimulator.stop();
    }
  };

  // Exercise control handlers
  const handleStartExercise = useCallback(() => {
    setIsExerciseActive(true);
    setIsPaused(false);
    if (!isDetecting) {
      startPoseDetection();
    }
  }, [isDetecting]);

  const handleStopExercise = useCallback(() => {
    setIsExerciseActive(false);
    setIsPaused(false);
    stopPoseDetection();
  }, []);

  const handlePauseExercise = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleResetExercise = useCallback(() => {
    setIsExerciseActive(false);
    setIsPaused(false);
    frameCountRef.current = 0;
  }, []);

  // Process frame callback (must be non-worklet function)
  const processFrameData = useCallback(async (width: number, height: number) => {
    try {
      // In a real implementation, you would:
      // 1. Convert the Frame buffer to ImageData
      // 2. Call poseDetectionService.processFrame(imageData)
      // 3. The service will call the callback we set up in initializePoseDetection
      //
      // For now, we'll simulate this with a mock implementation
      // since frame-to-ImageData conversion requires native modules or plugins

      // Mock pose data for testing (replace with actual frame processing)
      // The actual pose data will come through the callback set in initializePoseDetection

      // Note: Actual frame processing would happen here
      // await poseDetectionService.processFrame(imageData);
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }, []);

  // Frame processor for pose detection
  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';

      if (!isDetecting || isPaused) return;

      // Apply frame skipping for performance
      frameCountRef.current++;
      if (frameCountRef.current % frameSkip !== 0) {
        return;
      }

      // Convert frame to processable format and send to JS thread
      // Note: Frame-to-ImageData conversion requires native implementation
      // For now, we'll pass frame dimensions to trigger processing
      const frameWidth = frame.width;
      const frameHeight = frame.height;

      runOnJS(processFrameData)(frameWidth, frameHeight);
    },
    [isDetecting, isPaused, frameSkip, processFrameData]
  );

  // Render fallback UI when camera is not available but mock data is enabled
  if ((!device || !hasPermission) && !useMockData) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          {!device ? 'No camera device found' : 'Camera permission required'}
        </Text>
        {isInitialized && (
          <TouchableOpacity
            style={styles.mockButton}
            onPress={() => {
              setUseMockData(true);
              Alert.alert(
                'Mock Mode Enabled',
                'Using simulated pose data for testing without camera access.'
              );
            }}
          >
            <Text style={styles.mockButtonText}>Use Mock Data (Testing Mode)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {device && hasPermission && !useMockData ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          frameProcessor={frameProcessor}
          fps={30}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.mockBackground]}>
          <Text style={styles.mockModeText}>MOCK DATA MODE</Text>
          <Text style={styles.mockModeSubtext}>
            Simulated pose detection for testing
          </Text>
        </View>
      )}

      <PoseOverlay />

      <View style={styles.topInfo}>
        {useMockData && (
          <View style={styles.mockBadge}>
            <Text style={styles.mockBadgeText}>MOCK MODE</Text>
          </View>
        )}
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            Confidence: {(confidence * 100).toFixed(0)}%
          </Text>
        </View>
        {initError && (
          <View style={styles.errorBadge}>
            <Text style={styles.errorText}>{initError}</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {!isDetecting && !isExerciseActive ? (
          <TouchableOpacity style={styles.startButton} onPress={startPoseDetection}>
            <Text style={styles.buttonText}>Start Detection</Text>
          </TouchableOpacity>
        ) : isDetecting && !isExerciseActive ? (
          <TouchableOpacity style={styles.stopButton} onPress={stopPoseDetection}>
            <Text style={styles.buttonText}>Stop Detection</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isInitialized && (
        <ExerciseControls
          isActive={isExerciseActive}
          onStart={handleStartExercise}
          onStop={handleStopExercise}
          onPause={handlePauseExercise}
          onReset={handleResetExercise}
        />
      )}
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
    paddingHorizontal: 20,
  },
  mockButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 40,
    alignSelf: 'center',
  },
  mockButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mockBackground: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockModeText: {
    color: '#FF9800',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mockModeSubtext: {
    color: '#AAA',
    fontSize: 14,
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
    marginTop: 8,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mockBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mockBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  errorText: {
    color: '#FFF',
    fontSize: 12,
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
