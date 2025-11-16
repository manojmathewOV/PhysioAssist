/**
 * PoseDetectionScreen with Video Feeder Support
 *
 * Enhanced version that supports:
 * - Real camera (VisionCamera)
 * - Video file feeding for testing
 * - Mock data simulator
 *
 * Use TEST_MODE=video to enable video feeder
 * Use TEST_MODE=mock to enable mock simulator
 * Use TEST_MODE=camera (or undefined) for real camera
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
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

import { RootState } from '@store/index';
import { setPoseData, setDetecting } from '@store/slices/poseSlice';
import { poseDetectionService } from '@services/poseDetectionService';
import { mockPoseDataSimulator } from '@services/mockPoseDataSimulator';
import { VideoFrameFeeder, createPoseVideoFeeder } from '@utils/videoFrameFeeder';
import PoseOverlay from '@components/pose/PoseOverlay';
import ExerciseControls from '@components/exercises/ExerciseControls';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Test mode configuration
const TEST_MODE = process.env.TEST_MODE || 'mock'; // 'camera' | 'video' | 'mock'
const TEST_VIDEO_URL =
  process.env.TEST_VIDEO_URL ||
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface PoseDetectionScreenProps {
  testMode?: 'camera' | 'video' | 'mock';
  testVideoUrl?: string;
}

const PoseDetectionScreenWithVideo: React.FC<PoseDetectionScreenProps> = ({
  testMode = TEST_MODE as any,
  testVideoUrl = TEST_VIDEO_URL,
}) => {
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
  const [useMockData, setUseMockData] = useState(testMode === 'mock');
  const [useVideoFeed, setUseVideoFeed] = useState(testMode === 'video');
  const [initError, setInitError] = useState<string | null>(null);
  const [videoStats, setVideoStats] = useState<any>(null);

  const frameCountRef = useRef(0);
  const videoFeederRef = useRef<VideoFrameFeeder | null>(null);

  useEffect(() => {
    if (testMode === 'camera') {
      requestCameraPermission();
    }
    initializePoseDetection();

    return () => {
      if (isDetecting) {
        stopPoseDetection();
      }
      if (videoFeederRef.current) {
        videoFeederRef.current.cleanup();
      }
    };
  }, []);

  // Update video stats every second
  useEffect(() => {
    if (!useVideoFeed || !videoFeederRef.current) return;

    const interval = setInterval(() => {
      if (videoFeederRef.current) {
        setVideoStats(videoFeederRef.current.getStats());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [useVideoFeed]);

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'authorized');
    if (permission !== 'authorized') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to use pose detection.',
        [
          { text: 'Use Video Feed', onPress: () => setUseVideoFeed(true) },
          { text: 'Use Mock Data', onPress: () => setUseMockData(true) },
        ]
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

      if (testMode === 'video') {
        setUseVideoFeed(true);
        setIsInitialized(true);
      } else {
        Alert.alert(
          'Using Mock Data',
          'Pose detection service unavailable. Using simulated data for testing.',
          [
            {
              text: 'OK',
              onPress: () => {
                setUseMockData(true);
                setIsInitialized(true);
              },
            },
          ]
        );
      }
    }
  };

  const initializeVideoFeeder = async () => {
    try {
      if (Platform.OS === 'web' && videoFeederRef.current === null) {
        console.log('Initializing video feeder with URL:', testVideoUrl);

        videoFeederRef.current = createPoseVideoFeeder(poseDetectionService, {
          fps: 30,
          frameSkip,
          loop: true,
          flipHorizontal: true,
          targetWidth: 640,
          targetHeight: 480,
          onFrame: (imageData, frameNumber) => {
            console.log(`Processing video frame ${frameNumber}`);
          },
          onError: (error) => {
            console.error('Video feeder error:', error);
          },
          onEnd: () => {
            console.log('Video feed ended');
          },
        });

        await videoFeederRef.current.load(testVideoUrl);
        console.log('Video loaded successfully');
      }
    } catch (error) {
      console.error('Failed to initialize video feeder:', error);
      Alert.alert('Video Feed Error', 'Failed to load video. Falling back to mock data.');
      setUseVideoFeed(false);
      setUseMockData(true);
    }
  };

  const startPoseDetection = async () => {
    if (isInitialized) {
      dispatch(setDetecting(true));

      if (useVideoFeed) {
        await initializeVideoFeeder();
        if (videoFeederRef.current) {
          await videoFeederRef.current.start();
          console.log('Video feed started');
        }
      } else if (useMockData) {
        mockPoseDataSimulator.start((poseData) => {
          dispatch(setPoseData(poseData));
        }, 30);
      }
    }
  };

  const stopPoseDetection = () => {
    dispatch(setDetecting(false));

    if (useVideoFeed && videoFeederRef.current) {
      videoFeederRef.current.stop();
    } else if (useMockData && mockPoseDataSimulator.isActive()) {
      mockPoseDataSimulator.stop();
    }
  };

  const handleStartExercise = useCallback(() => {
    setIsExerciseActive(true);
    setIsPaused(false);
    if (!isDetecting) {
      startPoseDetection();
    }
  }, [isDetecting, useVideoFeed, useMockData]);

  const handleStopExercise = useCallback(() => {
    setIsExerciseActive(false);
    setIsPaused(false);
    stopPoseDetection();
  }, [useVideoFeed, useMockData]);

  const handlePauseExercise = useCallback(() => {
    setIsPaused(!isPaused);
    if (useVideoFeed && videoFeederRef.current) {
      if (!isPaused) {
        videoFeederRef.current.pause();
      } else {
        videoFeederRef.current.resume();
      }
    }
  }, [isPaused, useVideoFeed]);

  const handleResetExercise = useCallback(() => {
    setIsExerciseActive(false);
    setIsPaused(false);
    frameCountRef.current = 0;
    if (useVideoFeed && videoFeederRef.current) {
      videoFeederRef.current.stop();
    }
  }, [useVideoFeed]);

  const processFrameData = useCallback(async (width: number, height: number) => {
    try {
      // Real frame processing would happen here in production
      // await poseDetectionService.processFrame(imageData);
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';

      if (!isDetecting || isPaused || useVideoFeed || useMockData) return;

      frameCountRef.current++;
      if (frameCountRef.current % frameSkip !== 0) {
        return;
      }

      const frameWidth = frame.width;
      const frameHeight = frame.height;

      runOnJS(processFrameData)(frameWidth, frameHeight);
    },
    [isDetecting, isPaused, frameSkip, processFrameData, useVideoFeed, useMockData]
  );

  // Render camera or video/mock background
  const renderBackground = () => {
    if (useVideoFeed) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.mockBackground]}>
          <Text style={styles.mockModeText}>VIDEO FEED MODE</Text>
          <Text style={styles.mockModeSubtext}>Processing video frames for testing</Text>
          {videoStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>FPS: {videoStats.fps}</Text>
              <Text style={styles.statsText}>
                Frames: {videoStats.processedFrames}/{videoStats.totalFrames}
              </Text>
              <Text style={styles.statsText}>Skipped: {videoStats.skippedFrames}</Text>
              <Text style={styles.statsText}>Errors: {videoStats.errors}</Text>
            </View>
          )}
        </View>
      );
    }

    if (useMockData) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.mockBackground]}>
          <Text style={styles.mockModeText}>MOCK DATA MODE</Text>
          <Text style={styles.mockModeSubtext}>Simulated pose detection for testing</Text>
        </View>
      );
    }

    if (device && hasPermission) {
      return (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          frameProcessor={frameProcessor}
          fps={30}
        />
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          {!device ? 'No camera device found' : 'Camera permission required'}
        </Text>
        <TouchableOpacity
          style={styles.mockButton}
          onPress={() => {
            setUseVideoFeed(true);
            Alert.alert('Video Mode Enabled', 'Using video feed for testing.');
          }}
        >
          <Text style={styles.mockButtonText}>Use Video Feed (Testing Mode)</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderBackground()}

      <PoseOverlay />

      <View style={styles.topInfo}>
        {useVideoFeed && (
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>VIDEO MODE</Text>
          </View>
        )}
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
  statsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  statsText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 4,
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
  modeBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
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

export default PoseDetectionScreenWithVideo;
