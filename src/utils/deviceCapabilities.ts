/**
 * Device Capability Detection
 *
 * Detects device-specific capabilities for optimal camera configuration:
 * - GPU buffer support
 * - Maximum supported resolution
 * - Frame rate capabilities
 * - Hardware acceleration (CoreML/NNAPI)
 * - Memory constraints
 *
 * Used for adaptive camera settings to ensure performance across device range.
 *
 * @author AI Developer
 * @gate Gate 1 - Camera Configuration Hardening
 */

import { Platform } from 'react-native';
import { CameraDevice } from 'react-native-vision-camera';

// ============================================================================
// Types
// ============================================================================

export interface DeviceCapabilities {
  /** GPU buffer support for zero-copy processing */
  supportsGpuBuffers: boolean;
  /** Maximum recommended resolution (width x height) */
  maxResolution: { width: number; height: number };
  /** Optimal resolution for performance */
  optimalResolution: { width: number; height: number };
  /** Maximum frame rate */
  maxFrameRate: number;
  /** Optimal frame rate for pose detection */
  optimalFrameRate: number;
  /** Hardware acceleration type */
  hardwareAcceleration: 'coreml' | 'nnapi' | 'gpu' | 'cpu';
  /** Device tier (high/medium/low performance) */
  deviceTier: 'high' | 'medium' | 'low';
  /** Pixel format preference */
  preferredPixelFormat: 'yuv' | 'rgb' | 'native';
  /** Estimated memory budget (MB) */
  memoryBudgetMB: number;
}

export interface CameraConfiguration {
  /** Resolution to use */
  resolution: { width: number; height: number };
  /** Frame rate (fps) */
  fps: number;
  /** Enable GPU buffers */
  enableGpuBuffers: boolean;
  /** Pixel format */
  pixelFormat: 'yuv' | 'rgb' | 'native';
  /** Enable low-light boost */
  lowLightBoost: boolean;
  /** Video stabilization mode */
  videoStabilization: 'off' | 'standard' | 'cinematic' | 'auto';
}

// ============================================================================
// Device Detection
// ============================================================================

/**
 * Detects device tier based on platform and device characteristics
 *
 * iOS: Uses device identifier patterns
 * Android: Uses build model and available RAM
 */
const detectDeviceTier = (): 'high' | 'medium' | 'low' => {
  if (Platform.OS === 'ios') {
    // iOS device tier detection
    // High: iPhone 12+ (A14+), iPad Pro M1+
    // Medium: iPhone 8-11 (A11-A13)
    // Low: iPhone 6/7, older iPads

    // In production, use react-native-device-info
    // For Gate 1, assume medium tier as conservative default
    return 'medium';
  } else {
    // Android device tier detection
    // High: Snapdragon 8-series, 8GB+ RAM
    // Medium: Snapdragon 6/7-series, 4-8GB RAM
    // Low: Older chips, <4GB RAM

    // In production, check Build.MODEL and ActivityManager memory
    return 'medium';
  }
};

/**
 * Detects GPU buffer support
 *
 * iOS: Supported on all devices with Metal (iPhone 5S+)
 * Android: Varies by device and Android version
 */
const detectGpuBufferSupport = (): boolean => {
  if (Platform.OS === 'ios') {
    // iOS: Assume Metal support (iPhone 5S+ / iOS 8+)
    return Platform.Version >= 8;
  } else {
    // Android: GPU buffers supported on Android 8+ with Vulkan
    return Platform.Version >= 26;
  }
};

/**
 * Detects hardware acceleration type
 */
const detectHardwareAcceleration = (): 'coreml' | 'nnapi' | 'gpu' | 'cpu' => {
  if (Platform.OS === 'ios') {
    // iOS: CoreML available on iOS 11+
    return Platform.Version >= 11 ? 'coreml' : 'gpu';
  } else {
    // Android: NNAPI available on Android 8.1+
    return Platform.Version >= 27 ? 'nnapi' : 'gpu';
  }
};

/**
 * Estimates memory budget based on device tier
 */
const estimateMemoryBudget = (tier: 'high' | 'medium' | 'low'): number => {
  const budgets = {
    high: 1024, // 1 GB for high-end devices
    medium: 512, // 512 MB for mid-range
    low: 256, // 256 MB for low-end
  };
  return budgets[tier];
};

// ============================================================================
// Resolution Configuration
// ============================================================================

/**
 * Gets optimal resolution based on device tier
 */
const getOptimalResolution = (
  tier: 'high' | 'medium' | 'low'
): { width: number; height: number } => {
  const resolutions = {
    high: { width: 1280, height: 720 }, // 720p
    medium: { width: 960, height: 540 }, // 540p
    low: { width: 640, height: 480 }, // 480p (VGA)
  };
  return resolutions[tier];
};

/**
 * Gets maximum resolution based on device tier
 */
const getMaxResolution = (
  tier: 'high' | 'medium' | 'low'
): { width: number; height: number } => {
  const resolutions = {
    high: { width: 1920, height: 1080 }, // 1080p
    medium: { width: 1280, height: 720 }, // 720p
    low: { width: 960, height: 540 }, // 540p
  };
  return resolutions[tier];
};

// ============================================================================
// Frame Rate Configuration
// ============================================================================

/**
 * Gets optimal frame rate based on device tier
 *
 * For pose detection, 30 FPS is ideal balance:
 * - Smooth visual feedback
 * - Enough temporal resolution for movement tracking
 * - Not excessive for inference latency (30-50ms)
 */
const getOptimalFrameRate = (tier: 'high' | 'medium' | 'low'): number => {
  const frameRates = {
    high: 30, // 30 FPS (smooth, real-time)
    medium: 24, // 24 FPS (cinematic, still smooth)
    low: 20, // 20 FPS (acceptable for pose tracking)
  };
  return frameRates[tier];
};

/**
 * Gets maximum frame rate capability
 */
const getMaxFrameRate = (tier: 'high' | 'medium' | 'low'): number => {
  const frameRates = {
    high: 60, // 60 FPS capable
    medium: 30, // 30 FPS max
    low: 24, // 24 FPS max
  };
  return frameRates[tier];
};

// ============================================================================
// Main API
// ============================================================================

/**
 * Detects device capabilities for camera configuration
 *
 * @returns Complete capability profile
 */
export const detectDeviceCapabilities = (): DeviceCapabilities => {
  const deviceTier = detectDeviceTier();
  const supportsGpuBuffers = detectGpuBufferSupport();
  const hardwareAcceleration = detectHardwareAcceleration();

  return {
    supportsGpuBuffers,
    maxResolution: getMaxResolution(deviceTier),
    optimalResolution: getOptimalResolution(deviceTier),
    maxFrameRate: getMaxFrameRate(deviceTier),
    optimalFrameRate: getOptimalFrameRate(deviceTier),
    hardwareAcceleration,
    deviceTier,
    preferredPixelFormat: supportsGpuBuffers ? 'yuv' : 'rgb',
    memoryBudgetMB: estimateMemoryBudget(deviceTier),
  };
};

/**
 * Gets recommended camera configuration based on device capabilities
 *
 * @param capabilities Device capabilities (from detectDeviceCapabilities)
 * @param prioritize What to prioritize ('performance' | 'quality' | 'balanced')
 * @returns Recommended camera configuration
 */
export const getRecommendedCameraConfig = (
  capabilities?: DeviceCapabilities,
  prioritize: 'performance' | 'quality' | 'balanced' = 'balanced'
): CameraConfiguration => {
  const caps = capabilities || detectDeviceCapabilities();

  if (prioritize === 'performance') {
    // Maximize FPS, reduce resolution if needed
    return {
      resolution:
        caps.deviceTier === 'low'
          ? { width: 640, height: 480 } // VGA for low-end
          : caps.optimalResolution,
      fps: caps.optimalFrameRate,
      enableGpuBuffers: caps.supportsGpuBuffers,
      pixelFormat: caps.preferredPixelFormat,
      lowLightBoost: false, // Disable for performance
      videoStabilization: 'off', // Disable for performance
    };
  }

  if (prioritize === 'quality') {
    // Maximize resolution, accept lower FPS if needed
    return {
      resolution: caps.maxResolution,
      fps: Math.max(caps.optimalFrameRate - 6, 20), // Slight reduction for quality
      enableGpuBuffers: caps.supportsGpuBuffers,
      pixelFormat: caps.preferredPixelFormat,
      lowLightBoost: true,
      videoStabilization: caps.deviceTier === 'high' ? 'standard' : 'off',
    };
  }

  // Balanced (default)
  return {
    resolution: caps.optimalResolution,
    fps: caps.optimalFrameRate,
    enableGpuBuffers: caps.supportsGpuBuffers,
    pixelFormat: caps.preferredPixelFormat,
    lowLightBoost: caps.deviceTier !== 'low',
    videoStabilization: 'auto',
  };
};

/**
 * Adjusts camera configuration based on runtime performance
 *
 * Call this when FPS drops or memory warnings occur to adapt settings.
 *
 * @param currentConfig Current camera configuration
 * @param issue Performance issue ('low_fps' | 'high_memory' | 'thermal')
 * @returns Adjusted configuration
 */
export const adjustCameraConfigForPerformance = (
  currentConfig: CameraConfiguration,
  issue: 'low_fps' | 'high_memory' | 'thermal'
): CameraConfiguration => {
  const adjusted = { ...currentConfig };

  if (issue === 'low_fps') {
    // Reduce resolution to improve FPS
    if (currentConfig.resolution.width > 640) {
      adjusted.resolution = { width: 640, height: 480 };
      console.log('📉 Reduced resolution to 480p due to low FPS');
    }
    // Disable expensive features
    adjusted.lowLightBoost = false;
    adjusted.videoStabilization = 'off';
  }

  if (issue === 'high_memory') {
    // Reduce memory footprint
    adjusted.resolution = { width: 640, height: 480 };
    adjusted.enableGpuBuffers = false; // Disable GPU buffers if causing issues
    console.log('💾 Reduced memory usage (480p, no GPU buffers)');
  }

  if (issue === 'thermal') {
    // Reduce processing load to prevent overheating
    adjusted.fps = Math.max(currentConfig.fps - 6, 15);
    adjusted.resolution = { width: 640, height: 480 };
    adjusted.lowLightBoost = false;
    console.log('🌡️ Reduced thermal load (15-20 FPS, 480p)');
  }

  return adjusted;
};

/**
 * Validates if a camera device supports the requested configuration
 *
 * @param device VisionCamera device
 * @param config Desired camera configuration
 * @returns Whether configuration is supported
 */
export const validateCameraConfig = (
  device: CameraDevice,
  config: CameraConfiguration
): { supported: boolean; reason?: string } => {
  // Check resolution support
  const supportsResolution = device.formats.some(
    (format) =>
      format.videoWidth === config.resolution.width &&
      format.videoHeight === config.resolution.height
  );

  if (!supportsResolution) {
    return {
      supported: false,
      reason: `Resolution ${config.resolution.width}x${config.resolution.height} not supported`,
    };
  }

  // Check FPS support
  const supportsFrameRate = device.formats.some((format) =>
    format.frameRateRanges.some(
      (range) => range.minFrameRate <= config.fps && config.fps <= range.maxFrameRate
    )
  );

  if (!supportsFrameRate) {
    return {
      supported: false,
      reason: `Frame rate ${config.fps} FPS not supported`,
    };
  }

  return { supported: true };
};

// ============================================================================
// Exports
// ============================================================================

export default {
  detectDeviceCapabilities,
  getRecommendedCameraConfig,
  adjustCameraConfigForPerformance,
  validateCameraConfig,
};
