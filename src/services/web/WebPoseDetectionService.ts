import { Camera } from '@mediapipe/camera_utils';
import { Pose, Results } from '@mediapipe/pose';
import { PoseLandmark, ProcessedPoseData } from '../../types/pose';
import { mediapipeResultToPoseData } from '../pose/mediapipeLandmarks';
import { VideoStyle, drawCameraFrame } from './focusFrame';

/** Frames MediaPipe's browser build accepts, plus raw pixels (see detectFromFrame). */
export type WebPoseInput =
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageData;

/**
 * Receives each result: the image landmarks (normalized, MediaPipe-33 names) and
 * the full ProcessedPoseData (aspect ratio, relative-z flag, world landmarks) that
 * angle maths needs. `pose` is null when no person was found.
 */
export type WebPoseResultsCallback = (
  landmarks: PoseLandmark[],
  pose: ProcessedPoseData | null
) => void;

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
  private onResultsCallback: WebPoseResultsCallback | null = null;
  private sendStartedAt = 0;
  private videoStyle: VideoStyle = 'focus';
  private scratchCanvas: HTMLCanvasElement | null = null;

  /**
   * 'focus' dims the room and keeps the person bright (needs the segmentation
   * mask); 'natural' shows the camera picture as it is. Set before starting.
   */
  setVideoStyle(style: VideoStyle) {
    if (style === this.videoStyle) return;
    this.videoStyle = style;
    this.pose?.setOptions({ enableSegmentation: style === 'focus' });
  }

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
      // The person's outline, for the 'focus' picture (see focusFrame)
      enableSegmentation: this.videoStyle === 'focus',
      smoothSegmentation: true,
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
      drawCameraFrame(
        canvasCtx,
        results.image as CanvasImageSource,
        this.videoStyle === 'focus'
          ? (results.segmentationMask as CanvasImageSource | undefined)
          : null,
        this.canvasElement.width,
        this.canvasElement.height,
        this.videoStyle,
        () => (this.scratchCanvas ??= document.createElement('canvas'))
      );
    }

    // Process landmarks
    if (this.onResultsCallback) {
      const pose = this.toPoseData(results);
      const landmarks = pose?.landmarks ?? [];

      if (landmarks.length > 0 || !canvasCtx) {
        this.onResultsCallback(landmarks, pose);
      }
    }

    canvasCtx?.restore();
  }

  /**
   * Convert a result with the same converter the native BlazePose path uses, so
   * landmarks carry MediaPipe-33 names, world landmarks, zIsRelative and the
   * frame's aspect ratio (landmarks are normalized per axis).
   */
  private toPoseData(results: Results): ProcessedPoseData | null {
    if (!results.poseLandmarks?.length) {
      return null;
    }
    const size = this.imageSize(results.image) ?? this.imageSize(this.videoElement);
    return mediapipeResultToPoseData({
      results: [
        {
          landmarks: [results.poseLandmarks],
          worldLandmarks: [results.poseWorldLandmarks ?? []],
        },
      ],
      inferenceTime: this.sendStartedAt ? Date.now() - this.sendStartedAt : 0,
      inputImageWidth: size?.width,
      inputImageHeight: size?.height,
    });
  }

  /** Pixel size of a frame source, if known. */
  private imageSize(image: unknown): { width: number; height: number } | undefined {
    if (!image) {
      return undefined;
    }
    const el = image as {
      videoWidth?: number;
      videoHeight?: number;
      naturalWidth?: number;
      naturalHeight?: number;
      width?: number;
      height?: number;
    };
    const width = el.videoWidth || el.naturalWidth || el.width;
    const height = el.videoHeight || el.naturalHeight || el.height;
    return width && height ? { width, height } : undefined;
  }

  /** Width / height of the live video, once its metadata has loaded. */
  getVideoDimensions(): { width: number; height: number } | undefined {
    return this.imageSize(this.videoElement);
  }

  private async send(
    pose: Pose,
    image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ) {
    this.sendStartedAt = Date.now();
    await pose.send({ image });
  }

  async startDetection(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onResults: WebPoseResultsCallback
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
          await this.send(this.pose, this.videoElement);
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
    const pose = await this.detectFromFrame(imageElement);
    return pose?.landmarks ?? [];
  }

  /**
   * Detect a pose in one still frame (image, canvas, video or raw ImageData, e.g.
   * from the test video feeder). Resolves to null when no person was found.
   */
  async detectFromFrame(input: WebPoseInput): Promise<ProcessedPoseData | null> {
    const pose = this.ensurePose();
    const image =
      typeof ImageData !== 'undefined' && input instanceof ImageData
        ? this.imageDataToCanvas(input)
        : (input as Exclude<WebPoseInput, ImageData>);

    return new Promise((resolve, reject) => {
      const originalCallback = this.onResultsCallback;

      this.onResultsCallback = (_landmarks, poseData) => {
        this.onResultsCallback = originalCallback;
        resolve(poseData);
      };

      this.send(pose, image).catch((error: unknown) => {
        this.onResultsCallback = originalCallback;
        reject(error);
      });
    });
  }

  private imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')?.putImageData(imageData, 0, 0);
    return canvas;
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
