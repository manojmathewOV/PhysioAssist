/**
 * PoseDetectionScreen - Patient-Centric Example Integration
 *
 * This file demonstrates how to integrate all patient-centric components:
 * - Setup Wizard
 * - Compensatory Mechanisms
 * - Coaching Overlay
 * - Simple Mode UI
 *
 * Copy and adapt patterns from this file to existing screens
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Patient-centric components
import SetupWizard from '../components/common/SetupWizard';
import CoachingOverlay from '../components/coaching/CoachingOverlay';
import SimpleModeUI from '../components/simple/SimpleModeUI';
import LoadingOverlay from '../components/common/LoadingOverlay';

// Compensatory mechanisms
import {
  checkLightingConditions,
  checkPatientDistance,
  assessEnvironment,
  selectOptimalTier,
  getTierSettings,
  getComprehensiveAdaptiveSettings,
  translateToPatientLanguage,
  PatientProfile,
  EnvironmentConditions,
  AccuracyTier,
} from '../utils/compensatoryMechanisms';

// Services
import { poseDetectionService } from '../services/PoseDetectionService.v2';
import { PoseLandmark } from '../types/pose';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ScreenStatus = 'idle' | 'initializing' | 'setup' | 'ready' | 'detecting' | 'error';

const PoseDetectionScreenPatientCentric: React.FC = () => {
  // ============================================================================
  // State Management
  // ============================================================================

  // Screen state
  const [status, setStatus] = useState<ScreenStatus>('initializing');
  const [error, setError] = useState<string>('');

  // Setup wizard
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [confidence, setConfidence] = useState(0);

  // Patient-centric settings
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({
    age: 35,
    sessionsCompleted: 0,
    mobility: 'full',
    techComfort: 'medium',
    hasAssistance: false,
    hasTremor: false,
  });
  const [environment, setEnvironment] = useState<EnvironmentConditions>({
    lighting: 'good',
    space: 'adequate',
    background: 'moderate',
    stability: 'moderate',
  });
  const [accuracyTier, setAccuracyTier] = useState<AccuracyTier>('standard');
  const [simpleMode, setSimpleMode] = useState(false);

  // Exercise configuration
  const [exerciseConfig] = useState({
    name: 'Knee Flexion',
    jointType: 'knee',
    targetAngle: 90,
  });

  // Camera
  const device = useCameraDevice('back');

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    initializeApp();

    return () => {
      cleanup();
    };
  }, []);

  const initializeApp = async () => {
    try {
      setStatus('initializing');

      // Load patient profile
      await loadPatientProfile();

      // Initialize pose detection service
      await poseDetectionService.initialize();

      // Check if first time user
      const hasCompletedSetup = await AsyncStorage.getItem('setup_completed');

      if (!hasCompletedSetup) {
        // First time user -> Show setup wizard
        setStatus('setup');
        setShowSetupWizard(true);
      } else {
        // Returning user -> Skip to ready
        setStatus('ready');
        setSetupComplete(true);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize');
      setStatus('error');
    }
  };

  const loadPatientProfile = async () => {
    try {
      const profileJson = await AsyncStorage.getItem('patient_profile');
      if (profileJson) {
        const profile = JSON.parse(profileJson);
        setPatientProfile(profile);

        // Determine optimal tier
        const tier = selectOptimalTier(profile, environment);
        setAccuracyTier(tier);

        // Apply tier settings
        const tierSettings = getTierSettings(tier);
        setSimpleMode(tierSettings.simplifiedUI);

        console.log('📋 Loaded patient profile:', {
          age: profile.age,
          sessions: profile.sessionsCompleted,
          tier,
          simpleMode: tierSettings.simplifiedUI,
        });
      }
    } catch (error) {
      console.warn('Failed to load patient profile:', error);
      // Use defaults
    }
  };

  const cleanup = async () => {
    await poseDetectionService.cleanup();
  };

  // ============================================================================
  // Setup Wizard Handlers
  // ============================================================================

  const handleSetupComplete = async () => {
    console.log('✅ Setup wizard completed');

    // Mark setup as complete
    await AsyncStorage.setItem('setup_completed', 'true');

    // Hide wizard
    setShowSetupWizard(false);
    setSetupComplete(true);

    // Update status
    setStatus('ready');

    // Increment session count
    const updatedProfile = {
      ...patientProfile,
      sessionsCompleted: patientProfile.sessionsCompleted + 1,
    };
    setPatientProfile(updatedProfile);
    await AsyncStorage.setItem('patient_profile', JSON.stringify(updatedProfile));
  };

  const handleSetupSkip = () => {
    console.log('⏩ Setup wizard skipped');
    setShowSetupWizard(false);
    setSetupComplete(true);
    setStatus('ready');
  };

  // ============================================================================
  // Detection Control
  // ============================================================================

  const handleStart = async () => {
    try {
      // Pre-flight checks
      const canStart = await performPreflightChecks();

      if (!canStart) {
        return;
      }

      // Apply adaptive settings based on current environment
      await applyAdaptiveSettings();

      // Start detection
      setIsDetecting(true);
      setStatus('detecting');

      console.log('▶️ Detection started');
    } catch (error) {
      console.error('Failed to start detection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleStop = () => {
    setIsDetecting(false);
    setStatus('ready');
    console.log('⏸️ Detection stopped');
  };

  // ============================================================================
  // Pre-flight Checks
  // ============================================================================

  const performPreflightChecks = async (): Promise<boolean> => {
    // Check 1: Lighting conditions
    // Note: In production, pass actual frame from camera
    const mockFrame = {} as any;
    const lightingCheck = checkLightingConditions(mockFrame);

    if (!lightingCheck.canProceed) {
      Alert.alert(
        `${lightingCheck.icon} ${lightingCheck.message}`,
        lightingCheck.suggestion,
        [
          { text: 'Try Again', onPress: () => handleStart() },
          { text: 'Continue Anyway', onPress: () => forceStart() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return false;
    }

    // Check 2: Distance/positioning
    if (landmarks.length > 0) {
      const distanceCheck = checkPatientDistance(landmarks, SCREEN_HEIGHT);

      if (distanceCheck.status !== 'perfect') {
        Alert.alert(
          '📏 Position Adjustment',
          distanceCheck.instruction,
          [
            { text: 'OK, Let Me Adjust', style: 'default' },
            { text: 'Continue Anyway', onPress: () => forceStart() },
          ]
        );
        return false;
      }
    }

    // Check 3: Camera permissions
    const cameraPermission = await Camera.getCameraPermissionStatus();
    if (cameraPermission !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera access to track your movement',
        [
          { text: 'Open Settings', onPress: () => Camera.requestCameraPermission() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return false;
    }

    return true;
  };

  const forceStart = () => {
    setIsDetecting(true);
    setStatus('detecting');
    console.log('▶️ Detection force started (skipped checks)');
  };

  // ============================================================================
  // Adaptive Settings
  // ============================================================================

  const applyAdaptiveSettings = async () => {
    try {
      // Assess current environment
      // Note: In production, pass actual frame and landmarks
      const mockFrame = {} as any;
      const currentEnvironment = assessEnvironment(mockFrame, landmarks, SCREEN_HEIGHT);
      setEnvironment(currentEnvironment);

      // Get lighting assessment
      const lightingCheck = checkLightingConditions(mockFrame);

      // Get comprehensive adaptive settings
      const adaptiveSettings = getComprehensiveAdaptiveSettings(
        patientProfile,
        currentEnvironment,
        lightingCheck
      );

      // Apply to pose detection service
      poseDetectionService.applyAdaptiveSettings(adaptiveSettings);

      console.log('🎯 Applied adaptive settings:', {
        tier: accuracyTier,
        minConfidence: adaptiveSettings.minConfidence,
        smoothing: adaptiveSettings.smoothing,
        environment: currentEnvironment,
      });
    } catch (error) {
      console.error('Failed to apply adaptive settings:', error);
      // Continue with defaults
    }
  };

  // ============================================================================
  // Frame Processing
  // ============================================================================

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    // Note: Actual frame processing would happen here
    // Extract frame data, run through pose detection service
    // Update landmarks and angle

    // Example (pseudo-code):
    // const frameData = extractFrameData(frame);
    // const poseData = poseDetectionService.processFrame(frameData);
    // if (poseData) {
    //   runOnJS(updatePoseData)(poseData);
    // }
  }, []);

  const updatePoseData = (poseData: any) => {
    setLandmarks(poseData.landmarks);
    setConfidence(poseData.confidence);

    // Calculate angle based on exercise type
    // Example for knee flexion:
    // const angle = calculateKneeFlexion(poseData.landmarks);
    // setCurrentAngle(angle);
  };

  // ============================================================================
  // UI Helpers
  // ============================================================================

  const getTrackingQuality = (): 'excellent' | 'good' | 'poor' => {
    if (confidence >= 0.7) return 'excellent';
    if (confidence >= 0.4) return 'good';
    return 'poor';
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!device) {
    return (
      <LoadingOverlay
        visible={true}
        message="Camera not available"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />

      {/* Setup Wizard (First Time) */}
      {showSetupWizard && (
        <SetupWizard
          visible={showSetupWizard}
          onComplete={handleSetupComplete}
          onSkip={handleSetupSkip}
        />
      )}

      {/* Main UI */}
      {!showSetupWizard && setupComplete && (
        <>
          {simpleMode ? (
            // Simple Mode UI
            <SimpleModeUI
              isDetecting={isDetecting}
              onStart={handleStart}
              onStop={handleStop}
              currentStatus={status}
              currentAngle={currentAngle}
              targetAngle={exerciseConfig.targetAngle}
              exerciseName={exerciseConfig.name}
              trackingQuality={getTrackingQuality()}
              errorMessage={error}
            />
          ) : (
            // Standard Mode UI
            <View style={styles.standardUI}>
              {/* Standard UI implementation here */}
            </View>
          )}

          {/* Coaching Overlay (During Detection) */}
          {isDetecting && (
            <CoachingOverlay
              visible={isDetecting}
              currentAngle={currentAngle}
              targetAngle={exerciseConfig.targetAngle}
              exerciseType={exerciseConfig.jointType}
              exerciseName={exerciseConfig.name}
              audioEnabled={true}
              hapticEnabled={true}
              showTechnicalInfo={!simpleMode}
            />
          )}
        </>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={status === 'initializing'}
        message="Getting ready..."
      />

      {/* Error State */}
      {status === 'error' && (
        <View style={styles.errorContainer}>
          {/* Error UI */}
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  standardUI: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 40,
  },
});

export default PoseDetectionScreenPatientCentric;
