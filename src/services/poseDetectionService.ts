import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Pose, Results } from '@mediapipe/pose';
import { Camera } from 'react-native-vision-camera';

import { PoseLandmark, PoseDetectionConfig, ProcessedPoseData } from '@types/pose';
import { calculateConfidenceScore } from '@utils/poseUtils';

export class PoseDetectionService {
  private pose: Pose | null = null;
  private isInitialized: boolean = false;
  private frameSkipCounter: number = 0;
  private readonly config: PoseDetectionConfig;

  constructor(config: PoseDetectionConfig = {}) {
    this.config = {
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      smoothLandmarks: true,
      enableSegmentation: false,
      frameSkipRate: 3,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    try {
      // Wait for TensorFlow.js to initialize
      await tf.ready();

      // Initialize MediaPipe Pose
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: this.config.smoothLandmarks,
        enableSegmentation: this.config.enableSegmentation,
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });

      this.pose.onResults(this.handlePoseResults);
      
      this.isInitialized = true;
      console.log('PoseDetectionService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PoseDetectionService:', error);
      throw error;
    }
  }

  async processFrame(imageData: ImageData): Promise<ProcessedPoseData | null> {
    if (!this.isInitialized || !this.pose) {
      throw new Error('PoseDetectionService not initialized');
    }

    // Skip frames based on configuration
    this.frameSkipCounter++;
    if (this.frameSkipCounter % this.config.frameSkipRate !== 0) {
      return null;
    }

    try {
      // Send the image to MediaPipe Pose
      await this.pose.send({ image: imageData });
      
      // Results will be handled by onResults callback
      return null; // Actual results come through callback
    } catch (error) {
      console.error('Error processing frame:', error);
      return null;
    }
  }

  private handlePoseResults = (results: Results): void => {
    if (!results.poseLandmarks) {
      return;
    }

    const processedData: ProcessedPoseData = {
      landmarks: this.convertLandmarks(results.poseLandmarks),
      timestamp: Date.now(),
      confidence: calculateConfidenceScore(results.poseLandmarks),
      worldLandmarks: results.poseWorldLandmarks || undefined,
    };

    // Emit processed pose data
    this.emitPoseData(processedData);
  };

  private convertLandmarks(landmarks: any[]): PoseLandmark[] {
    return landmarks.map((landmark, index) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z || 0,
      visibility: landmark.visibility || 0,
      index,
      name: this.getLandmarkName(index),
    }));
  }

  private getLandmarkName(index: number): string {
    const landmarkNames = [
      'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
      'right_eye_inner', 'right_eye', 'right_eye_outer',
      'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
      'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
      'left_index', 'right_index', 'left_thumb', 'right_thumb',
      'left_hip', 'right_hip', 'left_knee', 'right_knee',
      'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
      'left_foot_index', 'right_foot_index'
    ];
    
    return landmarkNames[index] || `landmark_${index}`;
  }

  private emitPoseData(data: ProcessedPoseData): void {
    // This will be connected to the app's state management
    // For now, we'll use a callback pattern
    if (this.poseDataCallback) {
      this.poseDataCallback(data);
    }
  }

  private poseDataCallback?: (data: ProcessedPoseData) => void;

  setPoseDataCallback(callback: (data: ProcessedPoseData) => void): void {
    this.poseDataCallback = callback;
  }

  async cleanup(): Promise<void> {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  updateConfig(newConfig: Partial<PoseDetectionConfig>): void {
    Object.assign(this.config, newConfig);
    
    if (this.pose) {
      this.pose.setOptions({
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
        smoothLandmarks: this.config.smoothLandmarks,
        enableSegmentation: this.config.enableSegmentation,
      });
    }
  }
}

// Singleton instance
export const poseDetectionService = new PoseDetectionService();