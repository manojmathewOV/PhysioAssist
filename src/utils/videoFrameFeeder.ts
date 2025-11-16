/**
 * Video Frame Feeder
 *
 * Feeds video frames to pose detection service for testing without live camera
 * Supports:
 * - MP4 files (local or remote)
 * - Frame rate control (30fps default)
 * - Pause/resume/stop controls
 * - Frame skipping for performance
 */

import { convertVideoToImageData, validateImageData } from './frameConverter';
import { ProcessedPoseData } from '@types/pose';

export interface VideoFrameFeederOptions {
  fps?: number;
  frameSkip?: number;
  loop?: boolean;
  flipHorizontal?: boolean;
  targetWidth?: number;
  targetHeight?: number;
  onFrame?: (imageData: ImageData, frameNumber: number) => void;
  onPoseData?: (poseData: ProcessedPoseData) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
}

export interface VideoFrameFeederStats {
  totalFrames: number;
  processedFrames: number;
  skippedFrames: number;
  errors: number;
  fps: number;
  duration: number;
  isPlaying: boolean;
}

export class VideoFrameFeeder {
  private video: HTMLVideoElement | null = null;
  private animationFrame: number | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private frameNumber: number = 0;
  private processedFrames: number = 0;
  private skippedFrames: number = 0;
  private errors: number = 0;
  private startTime: number = 0;
  private lastFrameTime: number = 0;
  private options: Required<VideoFrameFeederOptions>;

  constructor(options: VideoFrameFeederOptions = {}) {
    this.options = {
      fps: options.fps || 30,
      frameSkip: options.frameSkip || 1,
      loop: options.loop !== undefined ? options.loop : false,
      flipHorizontal: options.flipHorizontal !== undefined ? options.flipHorizontal : false,
      targetWidth: options.targetWidth || 640,
      targetHeight: options.targetHeight || 480,
      onFrame: options.onFrame || (() => {}),
      onPoseData: options.onPoseData || (() => {}),
      onError: options.onError || (() => {}),
      onEnd: options.onEnd || (() => {}),
    };
  }

  /**
   * Load video from URL or file
   */
  async load(videoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.video = document.createElement('video');
      this.video.crossOrigin = 'anonymous';
      this.video.playsInline = true;
      this.video.muted = true;

      this.video.onloadedmetadata = () => {
        console.log('Video loaded:', {
          duration: this.video?.duration,
          width: this.video?.videoWidth,
          height: this.video?.videoHeight,
        });
        resolve();
      };

      this.video.onerror = (error) => {
        console.error('Video load error:', error);
        reject(new Error('Failed to load video'));
      };

      this.video.onended = () => {
        if (this.options.loop) {
          this.video!.currentTime = 0;
          this.video!.play();
        } else {
          this.stop();
          this.options.onEnd();
        }
      };

      this.video.src = videoUrl;
      this.video.load();
    });
  }

  /**
   * Start feeding frames
   */
  async start(): Promise<void> {
    if (!this.video) {
      throw new Error('Video not loaded. Call load() first.');
    }

    if (this.isPlaying) {
      console.warn('VideoFrameFeeder already playing');
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.frameNumber = 0;
    this.processedFrames = 0;
    this.skippedFrames = 0;
    this.errors = 0;
    this.startTime = Date.now();
    this.lastFrameTime = Date.now();

    try {
      await this.video.play();
      this.processFrames();
    } catch (error) {
      this.isPlaying = false;
      throw new Error(`Failed to start video: ${error}`);
    }
  }

  /**
   * Pause frame feeding
   */
  pause(): void {
    if (!this.isPlaying) return;

    this.isPaused = true;
    if (this.video) {
      this.video.pause();
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Resume frame feeding
   */
  resume(): void {
    if (!this.isPlaying || !this.isPaused) return;

    this.isPaused = false;
    if (this.video) {
      this.video.play();
      this.processFrames();
    }
  }

  /**
   * Stop frame feeding
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;

    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Process frames at specified FPS
   */
  private processFrames = (): void => {
    if (!this.isPlaying || this.isPaused || !this.video) return;

    const now = Date.now();
    const frameInterval = 1000 / this.options.fps;
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= frameInterval) {
      this.lastFrameTime = now - (elapsed % frameInterval);

      this.frameNumber++;

      // Apply frame skipping
      if (this.frameNumber % this.options.frameSkip === 0) {
        try {
          this.processCurrentFrame();
          this.processedFrames++;
        } catch (error) {
          this.errors++;
          this.options.onError(error instanceof Error ? error : new Error(String(error)));
        }
      } else {
        this.skippedFrames++;
      }
    }

    this.animationFrame = requestAnimationFrame(this.processFrames);
  };

  /**
   * Process current video frame
   */
  private processCurrentFrame(): void {
    if (!this.video) return;

    // Convert video frame to ImageData
    const imageData = convertVideoToImageData(this.video, {
      targetWidth: this.options.targetWidth,
      targetHeight: this.options.targetHeight,
      flipHorizontal: this.options.flipHorizontal,
    });

    // Validate ImageData
    if (!validateImageData(imageData)) {
      throw new Error('Invalid ImageData generated from video frame');
    }

    // Callback with imageData
    this.options.onFrame(imageData, this.frameNumber);
  }

  /**
   * Get current stats
   */
  getStats(): VideoFrameFeederStats {
    const duration = this.isPlaying ? (Date.now() - this.startTime) / 1000 : 0;
    const actualFps = duration > 0 ? this.processedFrames / duration : 0;

    return {
      totalFrames: this.frameNumber,
      processedFrames: this.processedFrames,
      skippedFrames: this.skippedFrames,
      errors: this.errors,
      fps: Math.round(actualFps * 10) / 10,
      duration,
      isPlaying: this.isPlaying && !this.isPaused,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();

    if (this.video) {
      this.video.src = '';
      this.video = null;
    }
  }

  /**
   * Check if feeder is playing
   */
  isActive(): boolean {
    return this.isPlaying && !this.isPaused;
  }
}

/**
 * Create video frame feeder with pose detection integration
 */
export function createPoseVideoFeeder(
  poseDetectionService: any,
  options: VideoFrameFeederOptions = {}
): VideoFrameFeeder {
  return new VideoFrameFeeder({
    ...options,
    onFrame: async (imageData, frameNumber) => {
      try {
        // Process frame with pose detection service
        await poseDetectionService.processFrame(imageData);

        // Call original onFrame if provided
        if (options.onFrame) {
          options.onFrame(imageData, frameNumber);
        }
      } catch (error) {
        console.error(`Error processing frame ${frameNumber}:`, error);
        if (options.onError) {
          options.onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    },
  });
}
