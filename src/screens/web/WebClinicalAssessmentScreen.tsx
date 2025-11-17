/**
 * Web Clinical Assessment Screen
 *
 * Web-optimized version of the clinical assessment workflow
 * Uses webcam instead of mobile camera, with desktop-friendly layout
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { setPoseData, setDetecting } from '@store/slices/poseSlice';
import { poseDetectionService } from '@services/poseDetectionService';
import { ClinicalMeasurementService } from '@services/biomechanics/ClinicalMeasurementService';
import { ProcessedPoseData } from '@types/pose';
import { ClinicalJointMeasurement } from '@types/clinicalMeasurement';
import JointSelectionPanel, {
  JointType,
  MovementType,
} from '@components/clinical/JointSelectionPanel';
import ClinicalAngleDisplay from '@components/clinical/ClinicalAngleDisplay';

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

  return (
    <div style={webStyles.container}>
      {/* Video Feed */}
      <div style={webStyles.videoContainer}>
        <video ref={videoRef} style={webStyles.video} autoPlay playsInline muted />
        <canvas ref={canvasRef} style={webStyles.hiddenCanvas} />
      </div>

      {/* Selection Panel */}
      {showSelectionPanel && (
        <div style={webStyles.selectionOverlay}>
          <JointSelectionPanel
            selectedJoint={selectedJoint}
            selectedMovement={selectedMovement}
            onSelectJoint={setSelectedJoint}
            onSelectMovement={setSelectedMovement}
            onConfirm={handleConfirmSelection}
            side={selectedSide}
            onSelectSide={setSelectedSide}
          />
        </div>
      )}

      {/* Instructions */}
      {!showSelectionPanel && (
        <div style={webStyles.instructionBar}>
          <p style={webStyles.instructionText}>{getCurrentInstruction()}</p>
        </div>
      )}

      {/* Angle Display */}
      {phase === 'assessing' && currentMeasurement && (
        <div style={webStyles.angleDisplayContainer}>
          <ClinicalAngleDisplay
            measurement={currentMeasurement}
            showMultiPlane={true}
            showTarget={true}
            showQuality={true}
            showCompensations={true}
          />
        </div>
      )}

      {/* Complete Screen */}
      {phase === 'complete' && currentMeasurement && (
        <div style={webStyles.completeOverlay}>
          <div style={webStyles.completeCard}>
            <h1 style={webStyles.completeTitle}>Assessment Complete!</h1>
            <div style={webStyles.completeSummary}>
              <div style={webStyles.summaryRow}>
                <span style={webStyles.summaryLabel}>Max Angle Achieved:</span>
                <span style={webStyles.summaryValue}>
                  {Math.round(maxAngleAchieved)}°
                </span>
              </div>
              <div style={webStyles.summaryRow}>
                <span style={webStyles.summaryLabel}>Clinical Grade:</span>
                <span style={webStyles.summaryValue}>
                  {currentMeasurement.primaryJoint.clinicalGrade || 'N/A'}
                </span>
              </div>
              <div style={webStyles.summaryRow}>
                <span style={webStyles.summaryLabel}>Target Achievement:</span>
                <span style={webStyles.summaryValue}>
                  {Math.round(currentMeasurement.primaryJoint.percentOfTarget || 0)}%
                </span>
              </div>
            </div>
            <button style={webStyles.completeButton} onClick={resetAssessment}>
              New Assessment
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {!showSelectionPanel && phase !== 'complete' && (
        <div style={webStyles.controlsContainer}>
          <button style={webStyles.secondaryButton} onClick={changeSelection}>
            Change Selection
          </button>
          {phase === 'ready' && (
            <button style={webStyles.primaryButton} onClick={startAssessment}>
              Start Assessment
            </button>
          )}
          {phase === 'assessing' && (
            <button
              style={{ ...webStyles.primaryButton, ...webStyles.stopButton }}
              onClick={stopAssessment}
            >
              Stop
            </button>
          )}
        </div>
      )}

      {/* Selection Badge */}
      {!showSelectionPanel && selectedJoint && selectedMovement && (
        <div style={webStyles.selectionBadge}>
          {selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1)}{' '}
          {selectedJoint.charAt(0).toUpperCase() + selectedJoint.slice(1)} -{' '}
          {selectedMovement.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  );
};

// Web-specific styles using inline CSS
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
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 100,
  },
  instructionBar: {
    position: 'absolute',
    top: '60px',
    left: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '20px',
    padding: '16px',
    textAlign: 'center',
    zIndex: 10,
  },
  instructionText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFF',
    margin: 0,
  },
  angleDisplayContainer: {
    position: 'absolute',
    top: '140px',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: '40px',
    left: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 10,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
    fontSize: '20px',
    fontWeight: '700',
    padding: '18px',
    borderRadius: '30px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFF',
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px',
    borderRadius: '25px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
  },
  selectionBadge: {
    position: 'absolute',
    top: '60px',
    right: '20px',
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    padding: '10px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
    zIndex: 10,
  },
  completeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    zIndex: 100,
  },
  completeCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '32px',
    border: '2px solid rgba(76, 175, 80, 0.5)',
  },
  completeTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: '32px',
  },
  completeSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: '16px',
    color: '#AAA',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
    fontSize: '18px',
    fontWeight: '700',
    padding: '16px',
    borderRadius: '25px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
};

export default WebClinicalAssessmentScreen;
