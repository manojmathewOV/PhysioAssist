import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { webPoseDetectionService } from '../../services/web/WebPoseDetectionService';
import { goniometerService } from '../../services/goniometerService';
import { exerciseValidationService } from '../../services/exerciseValidationService';
import { audioFeedbackService } from '../../services/audioFeedbackService';
import { setPoseData } from '../../store/slices/poseSlice';
import { updateExerciseProgress } from '../../store/slices/exerciseSlice';
import { RootState } from '../../store/store';
import { PoseLandmark } from '../../types/pose';
import { ExerciseType } from '../../types/exercise';
import WebPoseOverlay from '../../components/web/WebPoseOverlay';

const WebPoseDetectionScreen: React.FC = () => {
  const dispatch = useDispatch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('bicep_curl');
  const [angleData, setAngleData] = useState<{ [key: string]: number }>({});
  const [exerciseMetrics, setExerciseMetrics] = useState({
    reps: 0,
    quality: 0,
    feedback: '',
  });

  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  useEffect(() => {
    // Request camera permissions on mount
    if (Platform.OS === 'web') {
      requestCameraPermission();
    }

    return () => {
      if (isDetecting) {
        stopDetection();
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      audioFeedbackService.speak('Camera permission is required for pose detection');
    }
  };

  const handlePoseResults = useCallback(
    (landmarks: PoseLandmark[]) => {
      // Calculate angles for relevant joints
      const angles = {
        leftElbow: goniometerService.calculateAngle(
          landmarks[11], // left shoulder
          landmarks[13], // left elbow
          landmarks[15] // left wrist
        ),
        rightElbow: goniometerService.calculateAngle(
          landmarks[12], // right shoulder
          landmarks[14], // right elbow
          landmarks[16] // right wrist
        ),
        leftKnee: goniometerService.calculateAngle(
          landmarks[23], // left hip
          landmarks[25], // left knee
          landmarks[27] // left ankle
        ),
        rightKnee: goniometerService.calculateAngle(
          landmarks[24], // right hip
          landmarks[26], // right knee
          landmarks[28] // right ankle
        ),
        leftShoulder: goniometerService.calculateAngle(
          landmarks[23], // left hip
          landmarks[11], // left shoulder
          landmarks[13] // left elbow
        ),
        rightShoulder: goniometerService.calculateAngle(
          landmarks[24], // right hip
          landmarks[12], // right shoulder
          landmarks[14] // right elbow
        ),
      };

      setAngleData(angles);

      // Update pose data in Redux
      dispatch(
        setPoseData({
          landmarks,
          timestamp: Date.now(),
          confidence:
            landmarks.reduce((acc, l) => acc + l.visibility, 0) / landmarks.length,
        })
      );

      // Validate exercise if one is selected
      if (selectedExercise) {
        const validation = exerciseValidationService.validateExercise(
          selectedExercise,
          landmarks,
          angles
        );

        if (validation.feedbackMessage) {
          audioFeedbackService.speak(validation.feedbackMessage);
        }

        setExerciseMetrics({
          reps: validation.repetitions,
          quality: validation.formScore * 100,
          feedback: validation.feedbackMessage || '',
        });

        // Update exercise progress in Redux
        dispatch(
          updateExerciseProgress({
            exerciseId: selectedExercise,
            repetitions: validation.repetitions,
            quality: validation.formScore,
          })
        );
      }

      // Draw pose overlay
      if (overlayCanvasRef.current && canvasRef.current) {
        WebPoseOverlay.drawPose(
          overlayCanvasRef.current,
          landmarks,
          angles,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    },
    [selectedExercise, dispatch]
  );

  const startDetection = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas element not ready');
      return;
    }

    try {
      setIsDetecting(true);
      audioFeedbackService.speak('Starting pose detection');

      await webPoseDetectionService.startDetection(
        videoRef.current,
        canvasRef.current,
        handlePoseResults
      );

      // Start exercise session
      exerciseValidationService.startExercise(selectedExercise, {
        userId: currentUser?.id || 'guest',
        targetReps: 10,
        targetSets: 3,
      });
    } catch (error) {
      console.error('Failed to start pose detection:', error);
      setIsDetecting(false);
      audioFeedbackService.speak('Failed to start pose detection');
    }
  };

  const stopDetection = () => {
    webPoseDetectionService.stopDetection();
    exerciseValidationService.endExercise();
    setIsDetecting(false);
    audioFeedbackService.speak('Pose detection stopped');
  };

  const exercises: { value: ExerciseType; label: string }[] = [
    { value: 'bicep_curl', label: 'Bicep Curl' },
    { value: 'shoulder_press', label: 'Shoulder Press' },
    { value: 'squat', label: 'Squat' },
    { value: 'hamstring_stretch', label: 'Hamstring Stretch' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PhysioAssist - Pose Detection</Text>
        <Text style={styles.subtitle}>
          {Platform.OS === 'web' ? 'Web Version' : 'Mobile Version'}
        </Text>
      </View>

      <View style={styles.videoContainer}>
        <video ref={videoRef} style={styles.video} autoPlay playsInline muted />
        <canvas ref={canvasRef} style={styles.canvas} />
        <canvas ref={overlayCanvasRef} style={styles.overlayCanvas} />
      </View>

      <View style={styles.controls}>
        <View style={styles.exerciseSelector}>
          <Text style={styles.label}>Select Exercise:</Text>
          <View style={styles.exerciseButtons}>
            {exercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.value}
                style={[
                  styles.exerciseButton,
                  selectedExercise === exercise.value && styles.selectedExercise,
                ]}
                onPress={() => setSelectedExercise(exercise.value)}
              >
                <Text style={styles.exerciseButtonText}>{exercise.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isDetecting ? styles.stopButton : styles.startButton]}
          onPress={isDetecting ? stopDetection : startDetection}
        >
          <Text style={styles.buttonText}>
            {isDetecting ? 'Stop Detection' : 'Start Detection'}
          </Text>
        </TouchableOpacity>
      </View>

      {isDetecting && (
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>Exercise Metrics</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Repetitions:</Text>
            <Text style={styles.metricValue}>{exerciseMetrics.reps}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Form Quality:</Text>
            <Text style={styles.metricValue}>{exerciseMetrics.quality.toFixed(0)}%</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Feedback:</Text>
            <Text style={styles.feedbackText}>{exerciseMetrics.feedback}</Text>
          </View>

          <View style={styles.angleContainer}>
            <Text style={styles.angleTitle}>Joint Angles:</Text>
            {Object.entries(angleData).map(([joint, angle]) => (
              <View key={joint} style={styles.angleRow}>
                <Text style={styles.angleLabel}>{joint}:</Text>
                <Text style={styles.angleValue}>{angle.toFixed(1)}°</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    marginVertical: 20,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  overlayCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  controls: {
    padding: 20,
    alignItems: 'center',
  },
  exerciseSelector: {
    marginBottom: 20,
    width: '100%',
    maxWidth: 600,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  exerciseButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  exerciseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    margin: 5,
  },
  selectedExercise: {
    backgroundColor: '#4A90E2',
  },
  exerciseButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricsContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 16,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  angleContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  angleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  angleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  angleLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  angleValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WebPoseDetectionScreen;
