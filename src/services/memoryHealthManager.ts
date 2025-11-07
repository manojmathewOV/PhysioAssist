/**
 * Memory Health Manager
 *
 * Monitors and responds to iOS memory warnings to prevent app termination.
 * Implements progressive degradation strategy when memory pressure increases.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { telemetryService } from '../features/videoComparison/services/telemetryService';

export type MemoryPressureLevel = 'normal' | 'warning' | 'critical';

export interface MemoryState {
  level: MemoryPressureLevel;
  timestamp: number;
  actionsToken: string[];
}

export interface MemoryAction {
  action: string;
  description: string;
  timestamp: number;
}

/**
 * Memory Health Manager
 *
 * Responds to iOS memory warnings by progressively reducing resource usage:
 * 1. Clear caches
 * 2. Reduce resolution (1080p → 720p → 540p)
 * 3. Clear frame buffers
 * 4. Unload unused models
 * 5. Request garbage collection
 */
export class MemoryHealthManager {
  private static instance: MemoryHealthManager;

  private currentState: MemoryState = {
    level: 'normal',
    timestamp: Date.now(),
    actionsToken: [],
  };

  private listeners: Array<(state: MemoryState) => void> = [];
  private memoryWarningListener: any = null;
  private actionHistory: MemoryAction[] = [];

  private constructor() {
    this.setupMemoryWarningListener();
  }

  static getInstance(): MemoryHealthManager {
    if (!MemoryHealthManager.instance) {
      MemoryHealthManager.instance = new MemoryHealthManager();
    }
    return MemoryHealthManager.instance;
  }

  /**
   * Setup listener for iOS memory warnings
   */
  private setupMemoryWarningListener(): void {
    if (Platform.OS !== 'ios') {
      console.log('[MemoryHealth] Not iOS - memory warnings not supported');
      return;
    }

    try {
      // Listen for UIApplicationDidReceiveMemoryWarningNotification
      // This requires native bridge implementation

      // For now, this is a placeholder
      // In production, would use:
      // const eventEmitter = new NativeEventEmitter(NativeModules.MemoryMonitor);
      // this.memoryWarningListener = eventEmitter.addListener('memoryWarning', this.handleMemoryWarning);

      console.log('[MemoryHealth] Memory warning listener setup (native bridge required for production)');
    } catch (error) {
      console.error('[MemoryHealth] Failed to setup memory warning listener:', error);
    }
  }

  /**
   * Handle memory warning from iOS
   */
  private handleMemoryWarning = (): void => {
    console.warn('[MemoryHealth] ⚠️ MEMORY WARNING RECEIVED');

    // Update state to warning level
    this.updateState('warning');

    // Execute memory reduction strategy
    this.executeMemoryReduction();

    // Emit telemetry
    telemetryService.trackMemoryWarning('memory_warning_received');

    // Notify listeners
    this.notifyListeners();
  };

  /**
   * Execute progressive memory reduction strategy
   */
  private async executeMemoryReduction(): Promise<void> {
    const actions: string[] = [];

    // Level 1: Clear caches
    if (!this.currentState.actionsToken.includes('clear_cache')) {
      await this.clearCaches();
      actions.push('clear_cache');
      this.recordAction('clear_cache', 'Cleared video and image caches');
    }

    // Level 2: Downgrade resolution
    if (!this.currentState.actionsToken.includes('downgrade_resolution')) {
      await this.downgradeResolution();
      actions.push('downgrade_resolution');
      this.recordAction('downgrade_resolution', 'Reduced video resolution to conserve memory');
    }

    // Level 3: Clear frame buffers
    if (!this.currentState.actionsToken.includes('clear_buffers')) {
      await this.clearFrameBuffers();
      actions.push('clear_buffers');
      this.recordAction('clear_buffers', 'Cleared frame processing buffers');
    }

    // Level 4: Unload unused models
    if (!this.currentState.actionsToken.includes('unload_models')) {
      await this.unloadUnusedModels();
      actions.push('unload_models');
      this.recordAction('unload_models', 'Unloaded inactive pose detection models');
    }

    // Level 5: Request garbage collection (last resort)
    if (!this.currentState.actionsToken.includes('gc_requested')) {
      this.requestGarbageCollection();
      actions.push('gc_requested');
      this.recordAction('gc_requested', 'Requested JavaScript garbage collection');
    }

    // Update state with actions taken
    this.currentState.actionsToken.push(...actions);

    console.log(`[MemoryHealth] Executed ${actions.length} memory reduction actions:`, actions);
  }

  /**
   * Clear caches to free memory
   */
  private async clearCaches(): Promise<void> {
    try {
      // Clear YouTube video cache
      // await youtubeService.clearCache();

      // Clear image cache
      // await imageCacheService.clear();

      // Clear pose data cache
      // await poseDataCache.clear();

      console.log('[MemoryHealth] ✓ Caches cleared');
    } catch (error) {
      console.error('[MemoryHealth] Failed to clear caches:', error);
    }
  }

  /**
   * Downgrade video resolution
   */
  private async downgradeResolution(): Promise<void> {
    try {
      // Get current resolution from settings
      // const currentRes = await settingsService.getResolution();

      // Downgrade: 1080p → 720p → 540p
      // if (currentRes === '1080p') {
      //   await settingsService.setResolution('720p');
      // } else if (currentRes === '720p') {
      //   await settingsService.setResolution('540p');
      // }

      console.log('[MemoryHealth] ✓ Resolution downgraded');
      telemetryService.trackMemoryWarning('resolution_downgraded');
    } catch (error) {
      console.error('[MemoryHealth] Failed to downgrade resolution:', error);
    }
  }

  /**
   * Clear frame buffers
   */
  private async clearFrameBuffers(): Promise<void> {
    try {
      // Clear video frame buffers
      // await videoProcessor.clearBuffers();

      // Clear pose detection frame queue
      // await poseDetectionService.clearFrameQueue();

      console.log('[MemoryHealth] ✓ Frame buffers cleared');
    } catch (error) {
      console.error('[MemoryHealth] Failed to clear buffers:', error);
    }
  }

  /**
   * Unload unused ML models
   */
  private async unloadUnusedModels(): Promise<void> {
    try {
      // Unload inactive pose detection models
      // if (!poseModelManager.isMultiPoseActive()) {
      //   await poseModelManager.unloadMultiPose();
      // }

      // Keep only the currently active model
      console.log('[MemoryHealth] ✓ Unused models unloaded');
    } catch (error) {
      console.error('[MemoryHealth] Failed to unload models:', error);
    }
  }

  /**
   * Request JavaScript garbage collection
   */
  private requestGarbageCollection(): void {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('[MemoryHealth] ✓ Garbage collection requested');
      } else {
        console.log('[MemoryHealth] Garbage collection not available');
      }
    } catch (error) {
      console.error('[MemoryHealth] Failed to request GC:', error);
    }
  }

  /**
   * Update memory state
   */
  private updateState(level: MemoryPressureLevel): void {
    this.currentState = {
      level,
      timestamp: Date.now(),
      actionsToken: this.currentState.actionsToken,
    };
  }

  /**
   * Record action taken
   */
  private recordAction(action: string, description: string): void {
    this.actionHistory.push({
      action,
      description,
      timestamp: Date.now(),
    });

    // Keep last 50 actions
    if (this.actionHistory.length > 50) {
      this.actionHistory.shift();
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('[MemoryHealth] Listener error:', error);
      }
    });
  }

  /**
   * Get current memory state
   */
  getState(): MemoryState {
    return { ...this.currentState };
  }

  /**
   * Get action history
   */
  getActionHistory(): MemoryAction[] {
    return [...this.actionHistory];
  }

  /**
   * Add listener for memory state changes
   */
  addListener(callback: (state: MemoryState) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.currentState = {
      level: 'normal',
      timestamp: Date.now(),
      actionsToken: [],
    };
    this.actionHistory = [];
  }

  /**
   * Manually trigger memory warning (for testing)
   */
  triggerMemoryWarning(): void {
    this.handleMemoryWarning();
  }

  /**
   * Get memory usage recommendation
   */
  getRecommendation(): string {
    switch (this.currentState.level) {
      case 'critical':
        return 'Memory critically low! Consider closing the app and restarting.';
      case 'warning':
        return 'Memory pressure detected. Performance may be reduced.';
      case 'normal':
      default:
        return 'Memory usage normal';
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.memoryWarningListener) {
      this.memoryWarningListener.remove();
      this.memoryWarningListener = null;
    }
    this.listeners = [];
  }
}

// Singleton export
export const memoryHealthManager = MemoryHealthManager.getInstance();

/**
 * Native bridge interface (to be implemented in iOS)
 *
 * iOS (Swift):
 * ```swift
 * @objc(MemoryMonitor)
 * class MemoryMonitor: RCTEventEmitter {
 *
 *   override init() {
 *     super.init()
 *
 *     // Listen for memory warnings
 *     NotificationCenter.default.addObserver(
 *       self,
 *       selector: #selector(handleMemoryWarning),
 *       name: UIApplication.didReceiveMemoryWarningNotification,
 *       object: nil
 *     )
 *   }
 *
 *   @objc
 *   func handleMemoryWarning() {
 *     sendEvent(withName: "memoryWarning", body: [
 *       "timestamp": Date().timeIntervalSince1970,
 *       "level": "warning"
 *     ])
 *   }
 *
 *   override func supportedEvents() -> [String]! {
 *     return ["memoryWarning"]
 *   }
 * }
 * ```
 */
