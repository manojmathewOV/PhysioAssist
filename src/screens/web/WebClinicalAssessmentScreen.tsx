/**
 * Web Clinical Assessment Screen
 *
 * Web-optimized version of the clinical assessment workflow
 * Uses webcam instead of mobile camera, with desktop-friendly layout
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { setPoseData, setDetecting } from '@store/slices/poseSlice';
import { poseDetectionService } from '@services/poseDetectionService';
import { ClinicalMeasurementService } from '@services/biomechanics/ClinicalMeasurementService';
import { ProcessedPoseData } from '../../types/pose';
import { ClinicalJointMeasurement } from '../../types/clinicalMeasurement';
import JointSelectionPanel, {
  JointType,
  MovementType,
} from '@components/clinical/JointSelectionPanel';
import ClinicalAngleDisplay from '@components/clinical/ClinicalAngleDisplay';
import { AppText, BigButton, Card, ListRow, Metric, Screen } from '@components/ui';
import { CameraPanel } from '@components/ui/CameraPanel';
import { colors, spacing } from '../../theme';

type AssessmentPhase = 'setup' | 'ready' | 'assessing' | 'complete';

const WebClinicalAssessmentScreen: React.FC = () => {
  const dispatch = useDispatch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const { isDetecting, currentPose } = useSelector((state: RootState) => state.pose);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasWebcamAccess, setHasWebcamAccess] = useState(false);

  // Assessment state
  const [phase, setPhase] = useState<AssessmentPhase>('setup');
  const [selectedJoint, setSelectedJoint] = useState<JointType | undefined>();
  const [selectedMovement, setSelectedMovement] = useState<MovementType | undefined>();
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>('left');
  const [showSelectionPanel, setShowSelectionPanel] = useState(true);

  // Measurement state
  const [currentMeasurement, setCurrentMeasurement] = useState<
    ClinicalJointMeasurement | undefined
  >();
  const [maxAngleAchieved, setMaxAngleAchieved] = useState<number>(0);

  // Services
  const clinicalServiceRef = useRef(new ClinicalMeasurementService());

  useEffect(() => {
    initializeWebcam();
    initializePoseDetection();

    return () => {
      stopWebcam();
    };
  }, []);

  // Process pose data for clinical measurements
  useEffect(() => {
    if (currentPose && phase === 'assessing' && selectedJoint && selectedMovement) {
      performMeasurement(currentPose);
    }
  }, [currentPose, phase, selectedJoint, selectedMovement]);

  const initializeWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        setHasWebcamAccess(true);
      }
    } catch (error) {
      console.error('Webcam access denied:', error);
      alert('Please grant webcam access to use clinical assessment.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
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
      alert('Failed to initialize pose detection. Please refresh the page.');
    }
  };

  const processFrame = useCallback(async () => {
    if (
      !isDetecting ||
      !videoRef.current ||
      !canvasRef.current ||
      videoRef.current.readyState !== 4
    ) {
      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for pose detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Process with pose detection service
    try {
      await poseDetectionService.processFrame(imageData);
    } catch (error) {
      console.error('Frame processing error:', error);
    }

    // Continue processing
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isDetecting]);

  useEffect(() => {
    if (isDetecting && hasWebcamAccess && isInitialized) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDetecting, hasWebcamAccess, isInitialized, processFrame]);

  const performMeasurement = (poseData: ProcessedPoseData) => {
    try {
      const clinicalService = clinicalServiceRef.current;
      let measurement: ClinicalJointMeasurement | undefined;

      // Call appropriate measurement method based on selection
      if (selectedJoint === 'shoulder' && selectedMovement === 'flexion') {
        measurement = clinicalService.measureShoulderFlexion(poseData, selectedSide);
      } else if (selectedJoint === 'shoulder' && selectedMovement === 'abduction') {
        measurement = clinicalService.measureShoulderAbduction(poseData, selectedSide);
      } else if (
        selectedJoint === 'shoulder' &&
        (selectedMovement === 'external_rotation' ||
          selectedMovement === 'internal_rotation')
      ) {
        measurement = clinicalService.measureShoulderRotation(poseData, selectedSide);
      } else if (selectedJoint === 'elbow' && selectedMovement === 'flexion') {
        measurement = clinicalService.measureElbowFlexion(poseData, selectedSide);
      } else if (selectedJoint === 'knee' && selectedMovement === 'flexion') {
        measurement = clinicalService.measureKneeFlexion(poseData, selectedSide);
      }

      if (measurement) {
        setCurrentMeasurement(measurement);

        // Track max angle achieved
        const currentAngle = measurement.primaryJoint.angle;
        if (currentAngle > maxAngleAchieved) {
          setMaxAngleAchieved(currentAngle);
        }
      }
    } catch (error) {
      console.error('Measurement error:', error);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedJoint && selectedMovement) {
      setShowSelectionPanel(false);
      setPhase('ready');
    }
  };

  const startAssessment = () => {
    if (isInitialized && hasWebcamAccess) {
      dispatch(setDetecting(true));
      setPhase('assessing');
      setMaxAngleAchieved(0);
    }
  };

  const stopAssessment = () => {
    dispatch(setDetecting(false));
    setPhase('complete');
  };

  const resetAssessment = () => {
    setPhase('setup');
    setShowSelectionPanel(true);
    setCurrentMeasurement(undefined);
    setMaxAngleAchieved(0);
  };

  const changeSelection = () => {
    setShowSelectionPanel(true);
    setPhase('setup');
    dispatch(setDetecting(false));
  };

  const getCurrentInstruction = (): string => {
    switch (phase) {
      case 'setup':
        return 'Select joint and movement to assess';
      case 'ready':
        return 'Position yourself in camera view, then click Start';
      case 'assessing':
        if (!currentMeasurement) return 'Detecting pose...';
        const percent = currentMeasurement.primaryJoint.percentOfTarget || 0;
        if (percent < 30) return 'Begin the movement slowly';
        if (percent < 70) return "Keep going, you're doing great!";
        if (percent < 95) return 'Almost there!';
        return 'Perfect! Hold this position';
      case 'complete':
        return 'Assessment complete!';
      default:
        return '';
    }
  };

  const selectionLabel =
    selectedJoint && selectedMovement
      ? `${selectedSide} ${selectedJoint} · ${selectedMovement.replace(/_/g, ' ')}`
      : undefined;

  return (
    <div style={webStyles.container}>
      {/* Video Feed */}
      <div style={webStyles.videoContainer}>
        <video ref={videoRef} style={webStyles.video} autoPlay playsInline muted />
        <canvas ref={canvasRef} style={webStyles.hiddenCanvas} />
      </div>

      {/* Selection Panel */}
      {showSelectionPanel && (
        <View style={[StyleSheet.absoluteFill, styles.lightLayer]}>
          <JointSelectionPanel
            selectedJoint={selectedJoint}
            selectedMovement={selectedMovement}
            onSelectJoint={setSelectedJoint}
            onSelectMovement={setSelectedMovement}
            onConfirm={handleConfirmSelection}
            side={selectedSide}
            onSelectSide={setSelectedSide}
          />
        </View>
      )}

      {!showSelectionPanel && phase !== 'complete' && (
        <View
          style={[StyleSheet.absoluteFill, styles.overlayLayer]}
          pointerEvents="box-none"
        >
          <View style={styles.overlay} pointerEvents="box-none">
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.topArea}
              showsVerticalScrollIndicator={false}
            >
              {/* Instructions and selection */}
              <CameraPanel>
                {selectionLabel ? (
                  <AppText
                    variant="label"
                    color={colors.skeleton}
                    style={styles.capitalize}
                  >
                    {selectionLabel}
                  </AppText>
                ) : null}
                <View accessibilityLiveRegion="polite">
                  <AppText variant="heading" color={colors.textInverse}>
                    {getCurrentInstruction()}
                  </AppText>
                </View>
              </CameraPanel>

              {/* Angle Display */}
              {phase === 'assessing' && currentMeasurement && (
                <ClinicalAngleDisplay
                  measurement={currentMeasurement}
                  showMultiPlane={true}
                  showTarget={true}
                  showQuality={true}
                  showCompensations={true}
                />
              )}
            </ScrollView>

            {/* Controls */}
            <CameraPanel style={styles.controls}>
              {phase === 'ready' && (
                <BigButton
                  label="Start assessment"
                  icon="play-arrow"
                  onPress={startAssessment}
                  accessibilityHint="Starts measuring the selected movement"
                />
              )}
              {phase === 'assessing' && (
                <BigButton
                  label="Stop"
                  icon="stop"
                  variant="danger"
                  onPress={stopAssessment}
                  accessibilityHint="Stop assessment and see the results"
                />
              )}
              <BigButton
                label="Change selection"
                icon="tune"
                variant="secondary"
                compact
                onPress={changeSelection}
                accessibilityHint="Change joint or movement selection"
              />
            </CameraPanel>
          </View>
        </View>
      )}

      {/* Complete Screen */}
      {phase === 'complete' && currentMeasurement && (
        <View style={[StyleSheet.absoluteFill, styles.lightLayer]}>
          <Screen
            title="Assessment complete"
            subtitle={selectionLabel}
            footer={
              <BigButton
                label="New assessment"
                icon="replay"
                onPress={resetAssessment}
                accessibilityHint="Start new assessment"
              />
            }
          >
            <Card>
              <Metric
                value={`${Math.round(maxAngleAchieved)}°`}
                label="Max angle achieved"
                color={colors.primary}
              />
            </Card>
            <Card>
              <ListRow
                icon="grade"
                title="Clinical grade"
                right={
                  <AppText variant="bodyStrong" style={styles.capitalize}>
                    {currentMeasurement.primaryJoint.clinicalGrade || 'N/A'}
                  </AppText>
                }
              />
              <ListRow
                icon="flag"
                title="Target achievement"
                last
                right={
                  <AppText variant="bodyStrong">
                    {Math.round(currentMeasurement.primaryJoint.percentOfTarget || 0)}%
                  </AppText>
                }
              />
            </Card>
          </Screen>
        </View>
      )}
    </div>
  );
};

// Layout for the DOM video element (inline CSS)
const webStyles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)', // Mirror for front camera
  },
  hiddenCanvas: {
    display: 'none',
  },
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  capitalize: { textTransform: 'capitalize' },
  lightLayer: {
    zIndex: 100,
    backgroundColor: colors.background,
  },
  overlayLayer: {
    zIndex: 10,
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    padding: spacing.md,
    gap: spacing.md,
  },
  topArea: {
    gap: spacing.md,
  },
  controls: {
    padding: spacing.md,
  },
});

export default WebClinicalAssessmentScreen;
