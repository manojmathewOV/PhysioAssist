/**
 * Clinical Assessment Screen
 *
 * Comprehensive clinical assessment workflow for physiotherapy:
 * 1. Joint & movement selection
 * 2. Real-time pose detection with angle measurement
 * 3. Large, patient-friendly angle display
 * 4. Clinical feedback and recommendations
 * 5. Session recording and history
 *
 * Design Philosophy:
 * - Frictionless workflow: minimal steps from start to assessment
 * - Patient-centric: clear visual feedback, encouraging messages
 * - Professional: clinical-grade measurements with quality indicators
 * - Aesthetic: smooth animations, modern design
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import PoseOverlay from '@components/pose/PoseOverlay';
import JointSelectionPanel, {
  JointType,
  MovementType,
} from '@components/clinical/JointSelectionPanel';
import ClinicalAngleDisplay from '@components/clinical/ClinicalAngleDisplay';
import {
  AppText,
  Banner,
  BigButton,
  Card,
  ListRow,
  Metric,
  Screen,
} from '@components/ui';
import { CameraPanel } from '@components/ui/CameraPanel';
import { colors, spacing } from '../theme';

type AssessmentPhase = 'setup' | 'ready' | 'assessing' | 'complete';

const ClinicalAssessmentScreen: React.FC = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const device = useCameraDevice('front');

  const { isDetecting, currentPose } = useSelector((state: RootState) => state.pose);
  const { frameSkip } = useSelector((state: RootState) => state.settings);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
  const [, setSessionStartTime] = useState<number>(0);

  // Services
  const clinicalServiceRef = useRef(new ClinicalMeasurementService());

  // BlazePose runs only while assessing; poses (with anatomical frames) go to the
  // Redux store and come back as currentPose for the clinical measurements below
  const { cameraProps, error: detectorError } = useBlazePose({
    device,
    enabled: isDetecting && phase === 'assessing',
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

  // Animations
  const instructionFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestCameraPermission();
    initializePoseDetection();

    return () => {
      if (isDetecting) {
        stopAssessment();
      }
    };
  }, []);

  // Fade in instructions
  useEffect(() => {
    Animated.timing(instructionFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [phase]);

  // Process pose data for clinical measurements
  useEffect(() => {
    if (currentPose && phase === 'assessing' && selectedJoint && selectedMovement) {
      performMeasurement(currentPose);
    }
  }, [currentPose, phase, selectedJoint, selectedMovement]);

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
          // Haptic feedback on new max
          ReactNativeHapticFeedback.trigger('impactLight');
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
      ReactNativeHapticFeedback.trigger('impactMedium');
    }
  };

  const startAssessment = () => {
    if (isInitialized) {
      dispatch(setDetecting(true));
      setPhase('assessing');
      setSessionStartTime(Date.now());
      setMaxAngleAchieved(0);
      ReactNativeHapticFeedback.trigger('impactMedium');
    }
  };

  const stopAssessment = () => {
    dispatch(setDetecting(false));
    setPhase('complete');
    ReactNativeHapticFeedback.trigger('impactHeavy');
  };

  const resetAssessment = () => {
    setPhase('setup');
    setShowSelectionPanel(true);
    setCurrentMeasurement(undefined);
    setMaxAngleAchieved(0);
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  const changeSelection = () => {
    setShowSelectionPanel(true);
    setPhase('setup');
    dispatch(setDetecting(false));
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  const getCurrentInstruction = (): string => {
    switch (phase) {
      case 'setup':
        return 'Select joint and movement to assess';
      case 'ready':
        return 'Position yourself in camera view, then tap Start';
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

  if (!device || !hasPermission) {
    return (
      <Screen
        title="Clinical assessment"
        subtitle="Measures joint range of motion with the camera."
        testID="clinical-assessment"
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

  const selectionLabel =
    selectedJoint && selectedMovement
      ? `${selectedSide} ${selectedJoint} · ${selectedMovement.replace(/_/g, ' ')}`
      : undefined;

  return (
    <View style={styles.container} testID="clinical-assessment">
      {/* Camera View */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && !showSelectionPanel}
        {...cameraProps}
        fps={CAMERA_FPS}
      />

      {/* Pose Overlay */}
      {!showSelectionPanel && <PoseOverlay />}

      {/* Joint Selection Modal */}
      <Modal
        visible={showSelectionPanel}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <JointSelectionPanel
          selectedJoint={selectedJoint}
          selectedMovement={selectedMovement}
          onSelectJoint={setSelectedJoint}
          onSelectMovement={setSelectedMovement}
          onConfirm={handleConfirmSelection}
          side={selectedSide}
          onSelectSide={setSelectedSide}
        />
      </Modal>

      {!showSelectionPanel && phase !== 'complete' && (
        <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.topArea}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Bar - Instructions */}
            <Animated.View style={{ opacity: instructionFadeAnim }}>
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
                <View
                  accessible={true}
                  accessibilityLabel={getCurrentInstruction()}
                  accessibilityRole="text"
                  accessibilityLiveRegion="polite"
                >
                  <AppText variant="heading" color={colors.textInverse}>
                    {getCurrentInstruction()}
                  </AppText>
                </View>
              </CameraPanel>
            </Animated.View>

            {/* Angle Display (during assessment) */}
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

          {/* Control Buttons */}
          <CameraPanel style={styles.controls}>
            {/* Main Action Button */}
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

            {/* Change Selection Button */}
            <BigButton
              label="Change selection"
              icon="tune"
              variant="secondary"
              compact
              onPress={changeSelection}
              accessibilityHint="Change joint or movement selection"
            />
          </CameraPanel>
        </SafeAreaView>
      )}

      {/* Complete Screen */}
      {phase === 'complete' && currentMeasurement && (
        <View style={StyleSheet.absoluteFill}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  capitalize: { textTransform: 'capitalize' },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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

export default ClinicalAssessmentScreen;
