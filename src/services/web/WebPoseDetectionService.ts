import { Camera } from '@mediapipe/camera_utils';
import { Pose, Results } from '@mediapipe/pose';
import { PoseLandmark } from '../../types/pose';

/** A landmark in pixel coordinates (see denormalizeCoordinates). */
export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export class WebPoseDetectionService {
  private pose: Pose | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isRunning = false;
  private onResultsCallback: ((landmarks: PoseLandmark[]) => void) | null = null;

  /**
   * MediaPipe is created lazily: this module is also bundled on iOS/Android
   * (RootNavigator imports the web screen), where there is no DOM/WebGL, so
   * constructing Pose at import time must be avoided.
   */
  private ensurePose(): Pose {
    if (!this.pose) {
      this.pose = this.createPose();
    }
    return this.pose;
  }

  private createPose(): Pose {
    const pose = new Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(this.onResults.bind(this));
    return pose;
  }

  private onResults(results: Results) {
    // Draw the video frame when a live canvas is attached. Still images
    // (detectFromImage) have no canvas but must still receive landmarks.
    const canvasCtx =
      this.canvasElement && this.videoElement
        ? this.canvasElement.getContext('2d')
        : null;

    if (canvasCtx && this.canvasElement) {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
    }

    // Process landmarks
    if (this.onResultsCallback) {
      const landmarks: PoseLandmark[] = (results.poseLandmarks ?? []).map(
        (landmark, index) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0,
          visibility: landmark.visibility ?? 1,
          index,
          name: this.getLandmarkName(index),
        })
      );

      if (landmarks.length > 0 || !canvasCtx) {
        this.onResultsCallback(landmarks);
      }
    }

    canvasCtx?.restore();
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
    this.ensurePose();
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onResultsCallback = onResults;

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
    const pose = this.ensurePose();

    return new Promise((resolve, reject) => {
      const originalCallback = this.onResultsCallback;

      this.onResultsCallback = (landmarks) => {
        this.onResultsCallback = originalCallback;
        resolve(landmarks);
      };

      pose.send({ image: imageElement }).catch((error: unknown) => {
        this.onResultsCallback = originalCallback;
        reject(error);
      });
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
