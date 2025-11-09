/**
 * Type definitions for MediaPipe Pose
 * @see https://google.github.io/mediapipe/solutions/pose
 */

declare module '@mediapipe/pose' {
  export interface PoseLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }

  export interface Results {
    poseLandmarks: PoseLandmark[];
    poseWorldLandmarks?: PoseLandmark[];
    segmentationMask?: ImageData;
  }

  export interface PoseConfig {
    locateFile: (file: string) => string;
  }

  export interface PoseOptions {
    modelComplexity?: 0 | 1 | 2;
    smoothLandmarks?: boolean;
    enableSegmentation?: boolean;
    smoothSegmentation?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export class Pose {
    constructor(config: PoseConfig);
    setOptions(options: PoseOptions): void;
    send(input: {
      image: HTMLImageElement | HTMLVideoElement | ImageData | any;
    }): Promise<void>;
    onResults(callback: (results: Results) => void): void;
    close(): void;
    reset(): void;
  }
}

declare module '@mediapipe/camera_utils' {
  export interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
  }

  export class Camera {
    constructor(videoElement: HTMLVideoElement, options: CameraOptions);
    start(): Promise<void>;
    stop(): void;
  }
}
