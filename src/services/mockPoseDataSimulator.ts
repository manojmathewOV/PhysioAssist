/**
 * Mock Pose Data Simulator
 *
 * Provides simulated pose data for testing and development when:
 * - Camera is not available
 * - MediaPipe fails to load
 * - Running in web/test environments
 * - Developing UI without hardware dependencies
 */

import { ProcessedPoseData, PoseLandmark } from '../types/pose';

export class MockPoseDataSimulator {
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private frameCount: number = 0;
  private callback?: (data: ProcessedPoseData) => void;

  /**
   * Start generating mock pose data
   * @param callback Function to receive pose data
   * @param fps Frames per second (default: 30)
   */
  start(callback: (data: ProcessedPoseData) => void, fps: number = 30): void {
    if (this.isRunning) {
      console.warn('MockPoseDataSimulator is already running');
      return;
    }

    this.callback = callback;
    this.isRunning = true;
    this.frameCount = 0;

    const interval = 1000 / fps;

    this.intervalId = setInterval(() => {
      this.generateFrame();
    }, interval);

    console.log('MockPoseDataSimulator started');
  }

  /**
   * Stop generating mock pose data
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    this.callback = undefined;
    console.log('MockPoseDataSimulator stopped');
  }

  /**
   * Generate a single frame of mock pose data
   */
  private generateFrame(): void {
    if (!this.callback) return;

    this.frameCount++;
    const time = this.frameCount / 30; // Assuming 30 fps

    // Generate simulated landmarks with natural movement
    const landmarks = this.generateLandmarks(time);

    // Calculate average confidence (simulate realistic tracking)
    const confidence = this.calculateConfidence(landmarks);

    const mockData: ProcessedPoseData = {
      landmarks,
      timestamp: Date.now(),
      confidence,
      schemaId: 'mediapipe-33',
      viewOrientation: 'frontal',
      hasDepth: true,
      qualityScore: confidence,
      inferenceTime: 15 + Math.random() * 10, // Simulate 15-25ms inference
    };

    this.callback(mockData);
  }

  /**
   * Generate mock landmarks with simulated movement
   */
  private generateLandmarks(time: number): PoseLandmark[] {
    const landmarkNames = [
      'nose',
      'left_eye_inner',
      'left_eye',
      'left_eye_outer',
      'right_eye_inner',
      'right_eye',
      'right_eye_outer',
      'left_ear',
      'right_ear',
      'mouth_left',
      'mouth_right',
      'left_shoulder',
      'right_shoulder',
      'left_elbow',
      'right_elbow',
      'left_wrist',
      'right_wrist',
      'left_pinky',
      'right_pinky',
      'left_index',
      'right_index',
      'left_thumb',
      'right_thumb',
      'left_hip',
      'right_hip',
      'left_knee',
      'right_knee',
      'left_ankle',
      'right_ankle',
      'left_heel',
      'right_heel',
      'left_foot_index',
      'right_foot_index',
    ];

    return landmarkNames.map((name, index) => {
      const baseLandmark = this.getBaseLandmarkPosition(index);

      // Add natural oscillating movement
      const movementX = Math.sin(time + index * 0.1) * 0.02;
      const movementY = Math.cos(time * 0.8 + index * 0.15) * 0.01;

      return {
        x: baseLandmark.x + movementX,
        y: baseLandmark.y + movementY,
        z: baseLandmark.z + Math.sin(time * 1.2 + index * 0.2) * 0.05,
        visibility: 0.85 + Math.random() * 0.15, // 85-100% visibility
        index,
        name,
      };
    });
  }

  /**
   * Get base position for a landmark (standing pose)
   */
  private getBaseLandmarkPosition(index: number): { x: number; y: number; z: number } {
    // Normalized coordinates (0-1) representing a person standing
    // facing the camera in the center of frame
    const positions: Record<number, { x: number; y: number; z: number }> = {
      0: { x: 0.5, y: 0.15, z: 0 }, // nose
      1: { x: 0.48, y: 0.13, z: -0.02 }, // left_eye_inner
      2: { x: 0.47, y: 0.13, z: -0.02 }, // left_eye
      3: { x: 0.46, y: 0.13, z: -0.02 }, // left_eye_outer
      4: { x: 0.52, y: 0.13, z: -0.02 }, // right_eye_inner
      5: { x: 0.53, y: 0.13, z: -0.02 }, // right_eye
      6: { x: 0.54, y: 0.13, z: -0.02 }, // right_eye_outer
      7: { x: 0.44, y: 0.14, z: -0.03 }, // left_ear
      8: { x: 0.56, y: 0.14, z: -0.03 }, // right_ear
      9: { x: 0.48, y: 0.18, z: -0.01 }, // mouth_left
      10: { x: 0.52, y: 0.18, z: -0.01 }, // mouth_right
      11: { x: 0.42, y: 0.3, z: 0 }, // left_shoulder
      12: { x: 0.58, y: 0.3, z: 0 }, // right_shoulder
      13: { x: 0.38, y: 0.45, z: 0.05 }, // left_elbow
      14: { x: 0.62, y: 0.45, z: 0.05 }, // right_elbow
      15: { x: 0.36, y: 0.6, z: 0.08 }, // left_wrist
      16: { x: 0.64, y: 0.6, z: 0.08 }, // right_wrist
      17: { x: 0.35, y: 0.63, z: 0.09 }, // left_pinky
      18: { x: 0.65, y: 0.63, z: 0.09 }, // right_pinky
      19: { x: 0.36, y: 0.62, z: 0.1 }, // left_index
      20: { x: 0.64, y: 0.62, z: 0.1 }, // right_index
      21: { x: 0.37, y: 0.61, z: 0.09 }, // left_thumb
      22: { x: 0.63, y: 0.61, z: 0.09 }, // right_thumb
      23: { x: 0.45, y: 0.55, z: 0 }, // left_hip
      24: { x: 0.55, y: 0.55, z: 0 }, // right_hip
      25: { x: 0.44, y: 0.75, z: 0.05 }, // left_knee
      26: { x: 0.56, y: 0.75, z: 0.05 }, // right_knee
      27: { x: 0.43, y: 0.95, z: 0.1 }, // left_ankle
      28: { x: 0.57, y: 0.95, z: 0.1 }, // right_ankle
      29: { x: 0.42, y: 0.98, z: 0.12 }, // left_heel
      30: { x: 0.58, y: 0.98, z: 0.12 }, // right_heel
      31: { x: 0.44, y: 0.98, z: 0.15 }, // left_foot_index
      32: { x: 0.56, y: 0.98, z: 0.15 }, // right_foot_index
    };

    return positions[index] || { x: 0.5, y: 0.5, z: 0 };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(landmarks: PoseLandmark[]): number {
    const avgVisibility =
      landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;
    return Math.min(0.95, avgVisibility); // Cap at 95% for realism
  }

  /**
   * Check if simulator is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const mockPoseDataSimulator = new MockPoseDataSimulator();
