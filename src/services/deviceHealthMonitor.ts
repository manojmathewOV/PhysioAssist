/**
 * Device Health Monitor
 *
 * Monitors device thermal state and battery level to adapt
 * inference cadence and prevent overheating/battery drain.
 */

import { NativeModules, Platform } from 'react-native';
import { telemetryService } from '../features/videoComparison/services/telemetryService';

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';

export interface DeviceHealth {
  thermalState: ThermalState;
  batteryLevel: number; // 0-1
  isLowPowerMode: boolean;
  memoryUsage: number; // MB
  memoryWarning: boolean; // true if > 300MB
  memoryCritical: boolean; // true if > 500MB
  timestamp: number;
}

export interface InferenceRecommendation {
  interval_ms: number;
  resolution: '1080p' | '720p' | '540p';
  maxFPS: number;
  reason: string;
}

/**
 * Device Health Monitor
 *
 * Adapts app performance based on device state to prevent
 * thermal throttling, battery drain, and crashes.
 */
export class DeviceHealthMonitor {
  private static instance: DeviceHealthMonitor;

  // Memory thresholds (in MB) - from stress testing recommendations
  private readonly MEMORY_WARNING_THRESHOLD = 300;
  private readonly MEMORY_CLEANUP_THRESHOLD = 400;
  private readonly MEMORY_CRITICAL_THRESHOLD = 500;

  private currentHealth: DeviceHealth = {
    thermalState: 'nominal',
    batteryLevel: 1.0,
    isLowPowerMode: false,
    memoryUsage: 100, // Initial estimate
    memoryWarning: false,
    memoryCritical: false,
    timestamp: Date.now(),
  };

  private listeners: Array<(health: DeviceHealth) => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): DeviceHealthMonitor {
    if (!DeviceHealthMonitor.instance) {
      DeviceHealthMonitor.instance = new DeviceHealthMonitor();
    }
    return DeviceHealthMonitor.instance;
  }

  /**
   * Get current device health
   */
  getHealth(): DeviceHealth {
    return { ...this.currentHealth };
  }

  /**
   * Get recommended inference settings based on device health
   */
  getInferenceRecommendation(): InferenceRecommendation {
    const { thermalState, batteryLevel, isLowPowerMode, memoryCritical, memoryWarning } =
      this.currentHealth;

    // Critical memory - stop inference temporarily
    if (memoryCritical) {
      telemetryService.trackMemoryWarning('critical_stop');
      return {
        interval_ms: 5000, // Very slow
        resolution: '540p',
        maxFPS: 5,
        reason: 'Critical memory usage - pausing to allow cleanup',
      };
    }

    // Critical thermal state - very conservative
    if (thermalState === 'critical') {
      telemetryService.trackThermalThrottle('critical');
      return {
        interval_ms: 2000,
        resolution: '540p',
        maxFPS: 10,
        reason: 'Device overheating - reduced performance to cool down',
      };
    }

    // Memory warning or serious thermal state or very low battery
    if (memoryWarning || thermalState === 'serious' || batteryLevel < 0.15) {
      if (memoryWarning) {
        telemetryService.trackMemoryWarning('warning_throttle');
      }
      if (thermalState === 'serious') {
        telemetryService.trackThermalThrottle('serious');
      }
      return {
        interval_ms: 1000,
        resolution: '720p',
        maxFPS: 15,
        reason: 'High memory, heat, or low battery - reduced performance',
      };
    }

    // Fair thermal state or low battery or low power mode
    if (thermalState === 'fair' || batteryLevel < 0.3 || isLowPowerMode) {
      return {
        interval_ms: 750,
        resolution: '720p',
        maxFPS: 20,
        reason: 'Conserving resources',
      };
    }

    // Nominal - full performance
    return {
      interval_ms: 500,
      resolution: '1080p',
      maxFPS: 30,
      reason: 'Optimal conditions',
    };
  }

  /**
   * Check if should pause/stop inference
   */
  shouldPauseInference(): boolean {
    return (
      this.currentHealth.thermalState === 'critical' ||
      this.currentHealth.batteryLevel < 0.1 ||
      this.currentHealth.memoryCritical
    );
  }

  /**
   * Check if should trigger garbage collection
   */
  shouldTriggerCleanup(): boolean {
    return this.currentHealth.memoryUsage >= this.MEMORY_CLEANUP_THRESHOLD;
  }

  /**
   * Register listener for health changes
   */
  addListener(callback: (health: DeviceHealth) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Start monitoring device health
   */
  private startMonitoring(): void {
    // Check every 5 seconds
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, 5000);

    // Initial check
    this.checkHealth();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check current device health
   */
  private async checkHealth(): Promise<void> {
    try {
      const memoryUsage = await this.getMemoryUsage();
      const memoryWarning = memoryUsage >= this.MEMORY_WARNING_THRESHOLD;
      const memoryCritical = memoryUsage >= this.MEMORY_CRITICAL_THRESHOLD;

      const health: DeviceHealth = {
        thermalState: await this.getThermalState(),
        batteryLevel: await this.getBatteryLevel(),
        isLowPowerMode: await this.getIsLowPowerMode(),
        memoryUsage,
        memoryWarning,
        memoryCritical,
        timestamp: Date.now(),
      };

      // Detect state changes
      const thermalChanged = health.thermalState !== this.currentHealth.thermalState;
      const batteryChanged =
        Math.abs(health.batteryLevel - this.currentHealth.batteryLevel) > 0.05;
      const memoryChanged =
        Math.abs(health.memoryUsage - this.currentHealth.memoryUsage) > 50; // 50MB threshold

      this.currentHealth = health;

      // Notify listeners if significant change
      if (thermalChanged || batteryChanged || memoryChanged) {
        this.notifyListeners();
      }

      // Warn if critical
      if (health.thermalState === 'critical') {
        console.warn('[DeviceHealth] CRITICAL: Device overheating!');
      }

      if (health.batteryLevel < 0.1) {
        console.warn('[DeviceHealth] CRITICAL: Battery very low!');
      }

      if (health.memoryCritical) {
        console.warn(
          `[DeviceHealth] CRITICAL: Memory usage very high! ${memoryUsage}MB / ${this.MEMORY_CRITICAL_THRESHOLD}MB`
        );
      } else if (health.memoryWarning) {
        console.warn(
          `[DeviceHealth] WARNING: Memory usage elevated: ${memoryUsage}MB / ${this.MEMORY_WARNING_THRESHOLD}MB`
        );
      }
    } catch (error) {
      console.error('[DeviceHealth] Failed to check health:', error);
    }
  }

  /**
   * Get thermal state from native module
   */
  private async getThermalState(): Promise<ThermalState> {
    if (Platform.OS !== 'ios') {
      return 'nominal'; // Android - would need different implementation
    }

    try {
      // TODO: Implement native bridge to expose ProcessInfo.processInfo.thermalState
      // For now, return nominal
      // const { DeviceInfo } = NativeModules;
      // const state = await DeviceInfo.getThermalState();

      // Mock implementation - replace with actual native bridge
      const mockState = 'nominal';
      return mockState as ThermalState;
    } catch (error) {
      console.error('[DeviceHealth] Failed to get thermal state:', error);
      return 'nominal';
    }
  }

  /**
   * Get battery level from native
   */
  private async getBatteryLevel(): Promise<number> {
    try {
      // TODO: Implement native bridge to expose UIDevice.current.batteryLevel
      // For now, return full battery
      // const { DeviceInfo } = NativeModules;
      // const level = await DeviceInfo.getBatteryLevel();

      // Mock implementation - replace with actual native bridge
      const mockLevel = 1.0;
      return mockLevel;
    } catch (error) {
      console.error('[DeviceHealth] Failed to get battery level:', error);
      return 1.0;
    }
  }

  /**
   * Check if device is in low power mode
   */
  private async getIsLowPowerMode(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      // TODO: Implement native bridge to expose ProcessInfo.processInfo.isLowPowerModeEnabled
      // const { DeviceInfo } = NativeModules;
      // const enabled = await DeviceInfo.isLowPowerModeEnabled();

      // Mock implementation
      return false;
    } catch (error) {
      console.error('[DeviceHealth] Failed to check low power mode:', error);
      return false;
    }
  }

  /**
   * Get current memory usage in MB
   * Uses performance.memory API on web, estimates on native
   */
  private async getMemoryUsage(): Promise<number> {
    try {
      // Try performance.memory API (available on web and some environments)
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        // usedJSHeapSize is in bytes, convert to MB
        const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
        return Math.round(usedMB);
      }

      // For React Native, would need native bridge
      // TODO: Implement native bridge to get actual memory usage
      // const { DeviceInfo } = NativeModules;
      // const memoryMB = await DeviceInfo.getMemoryUsage();

      // Fallback: Estimate based on typical app usage
      // Real implementation would query native memory APIs
      const estimatedMB = 150; // Conservative estimate for React Native app
      return estimatedMB;
    } catch (error) {
      console.error('[DeviceHealth] Failed to get memory usage:', error);
      return 150; // Safe default
    }
  }

  /**
   * Notify all listeners of health change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentHealth);
      } catch (error) {
        console.error('[DeviceHealth] Listener error:', error);
      }
    });
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(): string {
    const { thermalState, batteryLevel, isLowPowerMode } = this.currentHealth;

    if (thermalState === 'critical') {
      return 'Device overheating! Taking a break is recommended.';
    }

    if (batteryLevel < 0.1) {
      return 'Battery very low! Please charge your device.';
    }

    if (thermalState === 'serious') {
      return 'Device is warm. Performance may be reduced.';
    }

    if (batteryLevel < 0.2) {
      return 'Low battery. Consider charging soon.';
    }

    if (isLowPowerMode) {
      return 'Low power mode enabled. Performance may be limited.';
    }

    return 'Device health optimal';
  }
}

// Singleton export
export const deviceHealthMonitor = DeviceHealthMonitor.getInstance();

/**
 * Native bridge interface (to be implemented in iOS/Android)
 *
 * iOS (Swift):
 * ```swift
 * @objc(DeviceInfo)
 * class DeviceInfo: NSObject {
 *   @objc
 *   func getThermalState(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
 *     let state = ProcessInfo.processInfo.thermalState
 *     let stateString: String
 *     switch state {
 *       case .nominal: stateString = "nominal"
 *       case .fair: stateString = "fair"
 *       case .serious: stateString = "serious"
 *       case .critical: stateString = "critical"
 *     }
 *     resolve(stateString)
 *   }
 *
 *   @objc
 *   func getBatteryLevel(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
 *     UIDevice.current.isBatteryMonitoringEnabled = true
 *     let level = UIDevice.current.batteryLevel
 *     resolve(level)
 *   }
 *
 *   @objc
 *   func isLowPowerModeEnabled(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
 *     let enabled = ProcessInfo.processInfo.isLowPowerModeEnabled
 *     resolve(enabled)
 *   }
 * }
 * ```
 */
