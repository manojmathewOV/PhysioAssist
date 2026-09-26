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
import { StyleSheet, View, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { setPoseData, setDetecting } from '@store/slices/poseSlice';
import { useBlazePose, CAMERA_FPS } from '@hooks/useBlazePose';
import { webPoseDetectionService } from '@services/web/WebPoseDetectionService';
import type { MockPoseDataSimulator } from '@services/mockPoseDataSimulator';
// Conditional import: Only include mock simulator in development builds
const mockPoseDataSimulator: MockPoseDataSimulator | null = __DEV__
  ? require('@services/mockPoseDataSimulator').mockPoseDataSimulator
  : null;
import { VideoFrameFeeder, createPoseVideoFeeder } from '@utils/videoFrameFeeder';
import PoseOverlay from '@components/pose/PoseOverlay';
import ExerciseControls from '@components/exercises/ExerciseControls';
import { AppText, Banner, BigButton } from '@components/ui';
import { CameraPanel } from '@components/ui/CameraPanel';
import { colors, radii, spacing } from '../theme';

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const device = useCameraDevice('front');

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
    setHasPermission(permission === 'granted');
    if (permission !== 'granted') {
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

  // Camera mode: BlazePose runs natively while detecting (not paused); poses go
  // to the Redux store. The detector is created by useBlazePose itself.
  const { cameraProps, error: detectorError } = useBlazePose({
    device,
    enabled: isDetecting && !isPaused && !useVideoFeed && !useMockData,
    frameSkip,
  });

  const initializePoseDetection = () => {
    setIsInitialized(true);
    console.log('Pose detection initialized successfully');
  };

  // Detector failure: fall back to the video feed (video mode) or mock data
  useEffect(() => {
    if (!detectorError) {
      return;
    }
    console.error('Pose detection error:', detectorError);
    setInitError('Pose detection unavailable');

    if (testMode === 'video') {
      setUseVideoFeed(true);
    } else {
      Alert.alert(
        'Using Mock Data',
        'Pose detection service unavailable. Using simulated data for testing.',
        [{ text: 'OK', onPress: () => setUseMockData(true) }]
      );
    }
  }, [detectorError, testMode]);

  const initializeVideoFeeder = async () => {
    try {
      if (Platform.OS === 'web' && videoFeederRef.current === null) {
        console.log('Initializing video feeder with URL:', testVideoUrl);

        // Video frames go through MediaPipe's browser build (web only)
        const videoPoseDetector = {
          processFrame: async (imageData: ImageData) => {
            const poseData = await webPoseDetectionService.detectFromFrame(imageData);
            if (poseData) {
              dispatch(setPoseData(poseData));
            }
          },
        };
        videoFeederRef.current = createPoseVideoFeeder(videoPoseDetector, {
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
      } else if (useMockData && mockPoseDataSimulator) {
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
    } else if (useMockData && mockPoseDataSimulator && mockPoseDataSimulator.isActive()) {
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

  // Render camera or video/mock background
  const renderBackground = () => {
    if (!useVideoFeed && !useMockData && device && hasPermission) {
      return (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          fps={CAMERA_FPS}
          {...cameraProps}
        />
      );
    }
    return <View style={[StyleSheet.absoluteFill, styles.mockBackground]} />;
  };

  const noCamera = !useVideoFeed && !useMockData && !(device && hasPermission);

  return (
    <View style={styles.container}>
      {renderBackground()}

      <PoseOverlay />

      <SafeAreaView
        style={styles.overlay}
        edges={['top', 'bottom']}
        pointerEvents="box-none"
      >
        <View style={styles.topInfo} pointerEvents="box-none">
          {useVideoFeed && (
            <StatusChip icon="ondemand-video" label="Video feed (testing)" />
          )}
          {useMockData && <StatusChip icon="science" label="Mock data (testing)" />}
          <StatusChip
            icon="visibility"
            label={`Confidence ${(confidence * 100).toFixed(0)}%`}
          />
          {useVideoFeed && videoStats && (
            <>
              <StatusChip icon="speed" label={`FPS ${videoStats.fps}`} />
              <StatusChip
                icon="movie"
                label={`Frames ${videoStats.processedFrames}/${videoStats.totalFrames}`}
              />
              <StatusChip
                icon="skip-next"
                label={`Skipped ${videoStats.skippedFrames}`}
              />
              <StatusChip
                icon="error-outline"
                label={`Errors ${videoStats.errors}`}
                danger={videoStats.errors > 0}
              />
            </>
          )}
          {initError && <StatusChip icon="error-outline" label={initError} danger />}
        </View>

        {/* No camera: offer the video feed instead */}
        {noCamera && (
          <CameraPanel style={styles.noCameraPanel}>
            <Banner
              tone="warning"
              message={!device ? 'No camera device found' : 'Camera permission required'}
            />
            <BigButton
              label="Use video feed (testing)"
              icon="ondemand-video"
              variant="secondary"
              compact
              onPress={() => {
                setUseVideoFeed(true);
                Alert.alert('Video Mode Enabled', 'Using video feed for testing.');
              }}
            />
          </CameraPanel>
        )}

        {/* Exercise choice, instructions and rep counter */}
        <View style={styles.flex} pointerEvents="box-none">
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

        {!isExerciseActive && (
          <CameraPanel style={styles.controls}>
            {!isDetecting ? (
              <BigButton
                label="Start detection"
                icon="play-arrow"
                onPress={startPoseDetection}
                accessibilityHint="Starts pose detection on the current feed"
              />
            ) : (
              <BigButton
                label="Stop detection"
                icon="stop"
                variant="danger"
                onPress={stopPoseDetection}
                accessibilityHint="Stops pose detection"
              />
            )}
          </CameraPanel>
        )}
      </SafeAreaView>
    </View>
  );
};

/** Small status pill for the camera overlay: icon + text, never colour alone. */
const StatusChip: React.FC<{ icon: string; label: string; danger?: boolean }> = ({
  icon,
  label,
  danger,
}) => (
  <View
    style={[styles.chip, danger && styles.chipDanger]}
    accessible
    accessibilityLabel={label}
  >
    <Icon name={icon} size={20} color={danger ? colors.danger : colors.skeleton} />
    <AppText variant="label" color={danger ? colors.danger : colors.textInverse}>
      {label}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mockBackground: {
    backgroundColor: colors.text,
  },
  noCameraPanel: {
    gap: spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    gap: spacing.sm,
  },
  topInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cameraOverlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  chipDanger: {
    backgroundColor: colors.dangerSoft,
  },
  controls: {
    padding: spacing.md,
  },
});

export default PoseDetectionScreenWithVideo;
