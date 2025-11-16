/**
 * Frame Converter Utility
 *
 * Converts various frame formats to ImageData for pose detection processing
 * Supports:
 * - react-native-vision-camera Frame objects
 * - Video frames from decoded MP4
 * - Canvas/WebGL contexts
 * - Base64 encoded images
 */

import { Frame } from 'react-native-vision-camera';

export interface ConversionOptions {
  targetWidth?: number;
  targetHeight?: number;
  flipHorizontal?: boolean;
  grayscale?: boolean;
}

/**
 * Convert VisionCamera Frame to ImageData
 * Note: This is a placeholder implementation that would need native module support
 */
export function convertFrameToImageData(
  frame: Frame,
  options: ConversionOptions = {}
): ImageData {
  'worklet';

  const { targetWidth = frame.width, targetHeight = frame.height } = options;

  // In production, this would use native module to extract pixel data
  // For now, we create a mock ImageData structure
  const pixelCount = targetWidth * targetHeight * 4; // RGBA
  const data = new Uint8ClampedArray(pixelCount);

  // TODO: Replace with actual frame.toArrayBuffer() or native conversion
  // This is where the native module would populate the data array

  return new ImageData(data, targetWidth, targetHeight);
}

/**
 * Convert HTML Canvas to ImageData
 * Works in web environment
 */
export function convertCanvasToImageData(
  canvas: HTMLCanvasElement,
  options: ConversionOptions = {}
): ImageData {
  const {
    targetWidth = canvas.width,
    targetHeight = canvas.height,
    flipHorizontal = false,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get 2D context from canvas');
  }

  // Get image data from canvas
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Resize if needed
  if (targetWidth !== canvas.width || targetHeight !== canvas.height) {
    imageData = resizeImageData(imageData, targetWidth, targetHeight);
  }

  // Flip horizontally if needed (for front camera)
  if (flipHorizontal) {
    imageData = flipImageDataHorizontal(imageData);
  }

  return imageData;
}

/**
 * Convert base64 image to ImageData
 */
export async function convertBase64ToImageData(
  base64: string,
  options: ConversionOptions = {}
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const { targetWidth = img.width, targetHeight = img.height } = options;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get 2D context'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

      resolve(imageData);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image from base64'));
    };

    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  });
}

/**
 * Convert video element to ImageData at current time
 */
export function convertVideoToImageData(
  video: HTMLVideoElement,
  options: ConversionOptions = {}
): ImageData {
  const {
    targetWidth = video.videoWidth,
    targetHeight = video.videoHeight,
    flipHorizontal = false,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get 2D context');
  }

  // Draw video frame to canvas
  if (flipHorizontal) {
    ctx.translate(targetWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Resize ImageData to target dimensions
 */
function resizeImageData(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get 2D context');
  }

  ctx.putImageData(imageData, 0, 0);

  // Create target canvas
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;

  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) {
    throw new Error('Cannot get 2D context');
  }

  targetCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Flip ImageData horizontally
 */
function flipImageDataHorizontal(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const flipped = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = (y * width + (width - 1 - x)) * 4;

      flipped.data[dstIdx] = data[srcIdx];
      flipped.data[dstIdx + 1] = data[srcIdx + 1];
      flipped.data[dstIdx + 2] = data[srcIdx + 2];
      flipped.data[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  return flipped;
}

/**
 * Validate ImageData structure
 */
export function validateImageData(imageData: ImageData): boolean {
  if (!imageData) return false;
  if (!imageData.data || !(imageData.data instanceof Uint8ClampedArray)) return false;
  if (!imageData.width || !imageData.height) return false;
  if (imageData.data.length !== imageData.width * imageData.height * 4) return false;

  return true;
}

/**
 * Get ImageData info for debugging
 */
export function getImageDataInfo(imageData: ImageData): {
  width: number;
  height: number;
  dataLength: number;
  expectedLength: number;
  valid: boolean;
} {
  return {
    width: imageData.width,
    height: imageData.height,
    dataLength: imageData.data.length,
    expectedLength: imageData.width * imageData.height * 4,
    valid: validateImageData(imageData),
  };
}
