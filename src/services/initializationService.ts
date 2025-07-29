import { poseDetectionService } from './poseDetectionService';
import { audioFeedbackService } from './audioFeedbackService';
import { Platform } from 'react-native';

export const initializeServices = async (): Promise<void> => {
  try {
    console.log('Initializing services...');

    // Initialize pose detection
    await poseDetectionService.initialize();

    // Platform-specific initializations
    if (Platform.OS === 'ios') {
      // iOS specific setup
    } else if (Platform.OS === 'android') {
      // Android specific setup
    }

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Service initialization failed:', error);
    throw error;
  }
};

export const cleanupServices = async (): Promise<void> => {
  try {
    await poseDetectionService.cleanup();
    audioFeedbackService.cleanup();
  } catch (error) {
    console.error('Service cleanup failed:', error);
  }
};