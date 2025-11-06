import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { PoseLandmark, DetectionConfig, Keypoint } from '../../types/pose';

export class WebPoseDetectionService {
  private pose: Pose | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isRunning = false;
  private onResultsCallback: ((landmarks: PoseLandmark[]) => void) | null = null;

  constructor() {
    this.initializePose();
  }

  private initializePose() {
    this.pose = new Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.pose.onResults(this.onResults.bind(this));
  }

  private onResults(results: any) {
    if (!this.canvasElement || !this.videoElement) return;

    const canvasCtx = this.canvasElement.getContext('2d');
    if (!canvasCtx) return;

    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Draw video frame
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height
    );

    // Process landmarks
    if (results.poseLandmarks && this.onResultsCallback) {
      const landmarks: PoseLandmark[] = results.poseLandmarks.map(
        (landmark: any, index: number) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0,
          visibility: landmark.visibility || 1,
          name: this.getLandmarkName(index),
        })
      );

      this.onResultsCallback(landmarks);
    }

    canvasCtx.restore();
  }

  private getLandmarkName(index: number): string {
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
    return landmarkNames[index] || `landmark_${index}`;
  }

  async startDetection(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onResults: (landmarks: PoseLandmark[]) => void
  ) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onResultsCallback = onResults;

    if (!this.pose) {
      throw new Error('Pose detection not initialized');
    }

    // Set canvas size to match video
    const resizeCanvas = () => {
      if (this.videoElement && this.canvasElement) {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
      }
    };

    this.videoElement.addEventListener('loadedmetadata', resizeCanvas);

    // Initialize camera
    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.pose && this.videoElement) {
          await this.pose.send({ image: this.videoElement });
        }
      },
      width: 1280,
      height: 720,
    });

    await this.camera.start();
    this.isRunning = true;
  }

  stopDetection() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    this.isRunning = false;
    this.videoElement = null;
    this.canvasElement = null;
    this.onResultsCallback = null;
  }

  async detectFromImage(imageElement: HTMLImageElement): Promise<PoseLandmark[]> {
    if (!this.pose) {
      throw new Error('Pose detection not initialized');
    }

    return new Promise((resolve) => {
      const originalCallback = this.onResultsCallback;

      this.onResultsCallback = (landmarks) => {
        this.onResultsCallback = originalCallback;
        resolve(landmarks);
      };

      this.pose.send({ image: imageElement });
    });
  }

  isDetectionRunning(): boolean {
    return this.isRunning;
  }

  // Convert normalized coordinates to pixel coordinates
  denormalizeCoordinates(
    landmarks: PoseLandmark[],
    width: number,
    height: number
  ): Keypoint[] {
    return landmarks.map((landmark) => ({
      x: landmark.x * width,
      y: landmark.y * height,
      score: landmark.visibility,
      name: landmark.name,
    }));
  }
}

// Singleton instance
export const webPoseDetectionService = new WebPoseDetectionService();
