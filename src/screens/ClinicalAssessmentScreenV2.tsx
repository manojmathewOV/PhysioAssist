/**
 * Clinical Assessment Screen V2 - Ultra Simplified
 *
 * Complete 5-step assessment flow based on 2025 healthcare UX research:
 * 1. Select Joint (with side selection)
 * 2. Select Movement type
 * 3. Watch Demo (NEW - 3x auto-play)
 * 4. Perform & Measure (simplified display)
 * 5. Complete & Celebrate
 *
 * Key improvements:
 * - Progressive disclosure (one thing per screen)
 * - Visual demonstration before attempting
 * - Very large angle display on a calm camera panel
 * - Voice support throughout
 * - Progress indicators
 * - Help always accessible
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { RootState } from '@store/index';
import { setDetecting } from '@store/slices/poseSlice';
import { useBlazePose, CAMERA_FPS } from '@hooks/useBlazePose';
import { ClinicalMeasurementService } from '@services/biomechanics/ClinicalMeasurementService';
import { ProcessedPoseData } from '../types/pose';
import { ClinicalJointMeasurement } from '../types/clinicalMeasurement';

// V2 Components
import JointSelectionPanelV2 from '@components/clinical/JointSelectionPanelV2';
import MovementSelectionPanelV2 from '@components/clinical/MovementSelectionPanelV2';
import { JointType, MovementType } from '@config/movements.config';
import MovementDemoScreen from '@components/clinical/MovementDemoScreen';
import ClinicalAngleDisplayV2 from '@components/clinical/ClinicalAngleDisplayV2';
import ProgressIndicator from '@components/clinical/ProgressIndicator';
import PoseOverlay from '@components/pose/PoseOverlay';
import { AppText, Banner, BigButton, Card, Metric, Screen } from '@components/ui';
import { CameraPanel } from '@components/ui/CameraPanel';
import { colors, radii, spacing } from '../theme';

type AssessmentStep = 'joint' | 'movement' | 'demo' | 'measure' | 'complete';

const ClinicalAssessmentScreenV2: React.FC = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const device = useCameraDevice('front');

  const { isDetecting, currentPose } = useSelector((state: RootState) => state.pose);
  const { frameSkip } = useSelector((state: RootState) => state.settings);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Assessment flow state
  const [step, setStep] = useState<AssessmentStep>('joint');
  const [selectedJoint, setSelectedJoint] = useState<JointType | undefined>();
  const [selectedMovement, setSelectedMovement] = useState<MovementType | undefined>();
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>('left');

  // Measurement state
  const [currentMeasurement, setCurrentMeasurement] = useState<
    ClinicalJointMeasurement | undefined
  >();
  const [maxAngleAchieved, setMaxAngleAchieved] = useState<number>(0);
  const [, setSessionStartTime] = useState<number>(0);

  // Services
  const clinicalServiceRef = useRef(new ClinicalMeasurementService());

  // BlazePose runs only while assessing; poses (with anatomical frames) go to the
  // Redux store and come back as currentPose for the clinical measurements below
  const { cameraProps, error: detectorError } = useBlazePose({
    device,
    enabled: isDetecting && step === 'measure',
    frameSkip,
  });
  useEffect(() => {
    if (detectorError) {
      Alert.alert(
        'Pose Detection Error',
        'Pose detection is unavailable. Please restart the app.'
      );
    }
  }, [detectorError]);

  useEffect(() => {
    requestCameraPermission();
    initializePoseDetection();

    return () => {
      if (isDetecting) {
        stopMeasurement();
      }
    };
  }, []);

  // Process pose data for clinical measurements
  useEffect(() => {
    if (currentPose && step === 'measure' && selectedJoint && selectedMovement) {
      performMeasurement(currentPose);
    }
  }, [currentPose, step, selectedJoint, selectedMovement]);

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'granted');
    if (permission !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to use clinical assessment.'
      );
    }
  };

  // The BlazePose detector is created natively by useBlazePose
  const initializePoseDetection = () => {
    setIsInitialized(true);
  };

  const performMeasurement = (poseData: ProcessedPoseData) => {
    try {
      const clinicalService = clinicalServiceRef.current;
      let measurement: ClinicalJointMeasurement | undefined;

      // Call appropriate measurement method
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

        // Track max angle
        const currentAngle = measurement.primaryJoint.angle;
        if (currentAngle > maxAngleAchieved) {
          setMaxAngleAchieved(currentAngle);
          ReactNativeHapticFeedback.trigger('impactLight');
        }
      }
    } catch (error) {
      console.error('Measurement error:', error);
    }
  };

  // Step 1: Joint Selection
  const handleJointSelect = (joint: JointType, side: 'left' | 'right') => {
    setSelectedJoint(joint);
    setSelectedSide(side);
    setStep('movement');
  };

  // Step 2: Movement Selection
  const handleMovementSelect = (movement: MovementType) => {
    setSelectedMovement(movement);
    setStep('demo');
  };

  // Step 3: Demo Complete
  const handleDemoComplete = () => {
    setStep('measure');
    startMeasurement();
  };

  // Step 4: Start Measurement
  const startMeasurement = () => {
    if (isInitialized) {
      dispatch(setDetecting(true));
      setSessionStartTime(Date.now());
      setMaxAngleAchieved(0);
      ReactNativeHapticFeedback.trigger('impactMedium');
    }
  };

  // Step 4: Stop Measurement
  const stopMeasurement = () => {
    dispatch(setDetecting(false));
    setStep('complete');
    ReactNativeHapticFeedback.trigger('impactHeavy');
  };

  // Step 5: New Assessment
  const resetAssessment = () => {
    setStep('joint');
    setSelectedJoint(undefined);
    setSelectedMovement(undefined);
    setCurrentMeasurement(undefined);
    setMaxAngleAchieved(0);
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  // Back navigation
  const handleBack = () => {
    if (step === 'movement') setStep('joint');
    else if (step === 'demo') setStep('movement');
    else if (step === 'measure') {
      dispatch(setDetecting(false));
      setStep('demo');
    }
  };

  if (!device || !hasPermission) {
    return (
      <Screen
        title="Clinical assessment"
        subtitle="Measures how far a joint moves, using the camera."
        testID="clinical-assessment-v2"
      >
        <Banner
          tone="warning"
          message={!device ? 'No camera device found' : 'Camera permission required'}
        />
        {device ? (
          <BigButton
            label="Allow camera"
            icon="videocam"
            onPress={requestCameraPermission}
            accessibilityHint="Asks for permission to use the camera"
          />
        ) : null}
      </Screen>
    );
  }

  return (
    <View
      style={[styles.container, step === 'measure' && styles.cameraContainer]}
      testID="clinical-assessment-v2"
    >
      {/* Camera (only visible during measurement) */}
      {step === 'measure' && (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused}
            {...cameraProps}
            fps={CAMERA_FPS}
          />
          <PoseOverlay />
        </>
      )}

      {/* Step 1: Joint Selection */}
      {step === 'joint' && (
        <JointSelectionPanelV2
          onSelect={handleJointSelect}
          onHelp={() => {
            Alert.alert(
              'How to Use',
              '1. Choose Left or Right side\n2. Tap the body part to measure\n3. Watch the demonstration\n4. Do the movement yourself\n5. See your results\n\nNeed help? Contact your therapist.'
            );
          }}
        />
      )}

      {/* Step 2: Movement Selection */}
      {step === 'movement' && selectedJoint && (
        <MovementSelectionPanelV2
          joint={selectedJoint}
          side={selectedSide}
          onSelect={handleMovementSelect}
          onBack={handleBack}
        />
      )}

      {/* Step 3: Demo */}
      {step === 'demo' && selectedMovement && (
        <MovementDemoScreen
          movementType={selectedMovement}
          jointName={selectedJoint || ''}
          onReady={handleDemoComplete}
          onBack={handleBack}
        />
      )}

      {/* Step 4: Measurement */}
      {step === 'measure' && (
        <SafeAreaView style={styles.measurementOverlay} edges={['top', 'bottom']}>
          <View style={styles.topArea}>
            <CameraPanel style={styles.statusPanel}>
              {/* Progress dots */}
              <ProgressIndicator currentStep={4} totalSteps={4} tone="dark" />

              {/* Camera status */}
              <View
                style={styles.cameraStatus}
                accessible
                accessibilityLabel="Camera is tracking you"
              >
                <Icon name="videocam" size={22} color={colors.skeleton} />
                <AppText variant="label" color={colors.textInverse}>
                  Tracking you
                </AppText>
              </View>
            </CameraPanel>

            {/* Angle display */}
            {currentMeasurement ? (
              <ClinicalAngleDisplayV2 measurement={currentMeasurement} mode="simple" />
            ) : (
              <CameraPanel style={styles.waitingPanel}>
                <AppText variant="heading" color={colors.textInverse} center>
                  Stand where the camera can see you
                </AppText>
              </CameraPanel>
            )}
          </View>

          {/* Done button */}
          <CameraPanel style={styles.bottomPanel}>
            <BigButton
              label="Done"
              icon="stop"
              variant="danger"
              onPress={stopMeasurement}
              accessibilityHint="Finish measurement and see your result"
            />
          </CameraPanel>
        </SafeAreaView>
      )}

      {/* Step 5: Complete */}
      {step === 'complete' && currentMeasurement && (
        <Screen
          title="Excellent work!"
          subtitle="You completed the assessment."
          footer={
            <BigButton
              label="Measure another"
              icon="replay"
              onPress={resetAssessment}
              accessibilityHint="Start a new measurement"
            />
          }
        >
          <Card style={styles.resultCard}>
            <View style={styles.trophy}>
              <Icon name="emoji-events" size={40} color={colors.warning} />
            </View>
            <Metric
              value={`${Math.round(maxAngleAchieved)}°`}
              label="Your result"
              color={colors.primary}
            />
            <View style={styles.resultRow}>
              <AppText variant="body" color={colors.textSecondary}>
                Target
              </AppText>
              <AppText variant="bodyStrong">
                {currentMeasurement.primaryJoint.targetAngle}°
              </AppText>
            </View>
            <View style={styles.resultRow}>
              <AppText variant="body" color={colors.textSecondary}>
                Grade
              </AppText>
              <AppText variant="bodyStrong" style={styles.capitalize}>
                {currentMeasurement.primaryJoint.clinicalGrade || 'Good'}
              </AppText>
            </View>
          </Card>

          <Card>
            <AppText variant="body">
              You&apos;re doing great! Keep practising and you&apos;ll improve even more.
            </AppText>
          </Card>

          <Banner tone="success" message="Your result has been saved" />
        </Screen>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cameraContainer: {
    backgroundColor: '#000',
  },
  measurementOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  topArea: {
    gap: spacing.md,
  },
  statusPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  cameraStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  waitingPanel: {
    padding: spacing.lg,
  },
  bottomPanel: {
    padding: spacing.md,
  },
  resultCard: {
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  trophy: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
});

export default ClinicalAssessmentScreenV2;
