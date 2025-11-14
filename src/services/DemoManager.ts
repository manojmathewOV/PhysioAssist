/**
 * Demo Manager Service
 *
 * Manages loading and caching of movement demonstration content.
 * Supports multiple formats:
 * - 2D SVG animations (current)
 * - 3D models (future)
 * - Video files (HD, SD)
 * - Live streaming (therapist demos)
 *
 * Auto-selects best format based on:
 * - Device capabilities
 * - Network speed
 * - User preferences
 * - Storage availability
 */

import { MovementRegistry, MovementDefinition } from '@config/movements.config';

export type DemoFormat = 'svg' | '3d' | 'video' | 'liveStream';
export type VideoQuality = 'hd' | 'sd' | 'low';

export interface DemoAsset {
  format: DemoFormat;
  uri: string;
  size?: number; // bytes
  duration?: number; // seconds
  thumbnail?: string;
  quality?: VideoQuality;
}

export interface DemoLoadOptions {
  preferredFormat?: DemoFormat;
  preferredQuality?: VideoQuality;
  autoDetect?: boolean; // Auto-detect best format
  cacheEnabled?: boolean;
  preload?: boolean;
}

export interface DeviceCapabilities {
  supports3D: boolean;
  supportsVideo: boolean;
  networkSpeed: 'fast' | 'medium' | 'slow';
  storageAvailable: number; // MB
  isLowEndDevice: boolean;
}

/**
 * Demo Manager Class
 *
 * Handles all demo content loading, caching, and format selection
 */
export class DemoManager {
  private demoCache: Map<string, DemoAsset> = new Map();
  private deviceCapabilities: DeviceCapabilities;
  private defaultFormat: DemoFormat = 'svg';

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
  }

  /**
   * Get demo asset for a specific movement
   *
   * @param movementId - Movement ID from registry
   * @param options - Load options
   * @returns Demo asset with URI and metadata
   */
  async getDemoAsset(
    movementId: string,
    options: DemoLoadOptions = {}
  ): Promise<DemoAsset | null> {
    const {
      preferredFormat,
      preferredQuality = 'hd',
      autoDetect = true,
      cacheEnabled = true,
      preload = false,
    } = options;

    // Check cache first
    const cacheKey = `${movementId}_${preferredFormat || 'auto'}`;
    if (cacheEnabled && this.demoCache.has(cacheKey)) {
      return this.demoCache.get(cacheKey)!;
    }

    // Get movement definition
    const movementDef = MovementRegistry.getMovement(movementId);
    if (!movementDef) {
      console.error(`Movement not found: ${movementId}`);
      return null;
    }

    // Determine best format
    const format = autoDetect
      ? this.selectBestFormat(movementDef, preferredFormat)
      : preferredFormat || this.defaultFormat;

    // Build demo asset
    const asset = this.buildDemoAsset(movementDef, format, preferredQuality);

    if (!asset) {
      console.warn(`No demo asset available for ${movementId} in format ${format}`);
      return null;
    }

    // Cache the asset
    if (cacheEnabled) {
      this.demoCache.set(cacheKey, asset);
    }

    // Preload if requested
    if (preload) {
      await this.preloadAsset(asset);
    }

    return asset;
  }

  /**
   * Get all available demo formats for a movement
   *
   * @param movementId - Movement ID from registry
   * @returns Array of available demo assets
   */
  getAvailableFormats(movementId: string): DemoAsset[] {
    const movementDef = MovementRegistry.getMovement(movementId);
    if (!movementDef) return [];

    const assets: DemoAsset[] = [];

    // Check each format
    if (movementDef.demos.svg) {
      assets.push(this.buildDemoAsset(movementDef, 'svg', 'hd')!);
    }
    if (movementDef.demos['3d']) {
      assets.push(this.buildDemoAsset(movementDef, '3d', 'hd')!);
    }
    if (movementDef.demos.video) {
      // Add multiple quality variants
      ['hd', 'sd', 'low'].forEach(quality => {
        const asset = this.buildDemoAsset(movementDef, 'video', quality as VideoQuality);
        if (asset) assets.push(asset);
      });
    }

    return assets;
  }

  /**
   * Preload multiple demos (e.g., for a full assessment protocol)
   *
   * @param movementIds - Array of movement IDs to preload
   * @param options - Load options
   */
  async preloadDemos(
    movementIds: string[],
    options: DemoLoadOptions = {}
  ): Promise<void> {
    const loadPromises = movementIds.map(id =>
      this.getDemoAsset(id, { ...options, preload: true })
    );

    await Promise.all(loadPromises);
    console.log(`Preloaded ${movementIds.length} demo assets`);
  }

  /**
   * Clear demo cache
   */
  clearCache(): void {
    this.demoCache.clear();
    console.log('Demo cache cleared');
  }

  /**
   * Get cache size in MB
   */
  getCacheSize(): number {
    let totalSize = 0;
    this.demoCache.forEach(asset => {
      totalSize += asset.size || 0;
    });
    return totalSize / (1024 * 1024); // Convert to MB
  }

  // ============ PRIVATE METHODS ============

  /**
   * Select best demo format based on device capabilities and availability
   */
  private selectBestFormat(
    movementDef: MovementDefinition,
    preferredFormat?: DemoFormat
  ): DemoFormat {
    // If user has a preference and it's available, use it
    if (preferredFormat && movementDef.demos[preferredFormat]) {
      return preferredFormat;
    }

    const { supports3D, supportsVideo, networkSpeed, isLowEndDevice } = this.deviceCapabilities;

    // Low-end devices: Always use SVG (lightweight)
    if (isLowEndDevice) {
      return 'svg';
    }

    // Priority order based on capabilities and network
    if (supports3D && movementDef.demos['3d'] && networkSpeed === 'fast') {
      return '3d';
    }

    if (supportsVideo && movementDef.demos.video) {
      // Use video if network is good
      if (networkSpeed === 'fast' || networkSpeed === 'medium') {
        return 'video';
      }
    }

    // Fallback to SVG (always available, lightweight)
    return 'svg';
  }

  /**
   * Build demo asset object from movement definition
   */
  private buildDemoAsset(
    movementDef: MovementDefinition,
    format: DemoFormat,
    quality: VideoQuality
  ): DemoAsset | null {
    const demos = movementDef.demos;

    switch (format) {
      case 'svg':
        if (!demos.svg) return null;
        return {
          format: 'svg',
          uri: demos.svg,
          size: 5000, // SVG animations are ~5KB
          duration: 4, // 4 seconds per loop
          thumbnail: demos.thumbnail,
        };

      case '3d':
        if (!demos['3d']) return null;
        return {
          format: '3d',
          uri: demos['3d'],
          size: 2 * 1024 * 1024, // ~2MB for 3D models
          duration: 4,
          thumbnail: demos.thumbnail,
        };

      case 'video':
        if (!demos.video) return null;
        // Build video URI with quality suffix
        const videoUri = this.getVideoUriForQuality(demos.video, quality);
        const videoSize = this.estimateVideoSize(quality);
        return {
          format: 'video',
          uri: videoUri,
          size: videoSize,
          duration: 10, // 10 seconds
          thumbnail: demos.thumbnail,
          quality,
        };

      default:
        return null;
    }
  }

  /**
   * Get video URI for specific quality
   */
  private getVideoUriForQuality(baseUri: string, quality: VideoQuality): string {
    // Replace extension with quality-specific version
    // e.g., /demos/shoulder_flexion_hd.mp4 → shoulder_flexion_sd.mp4
    const parts = baseUri.split('.');
    const ext = parts.pop();
    const base = parts.join('.');

    // If already has quality suffix, replace it
    const qualitySuffixRegex = /_(hd|sd|low)$/;
    const baseWithoutQuality = base.replace(qualitySuffixRegex, '');

    return `${baseWithoutQuality}_${quality}.${ext}`;
  }

  /**
   * Estimate video file size based on quality
   */
  private estimateVideoSize(quality: VideoQuality): number {
    switch (quality) {
      case 'hd':
        return 15 * 1024 * 1024; // 15MB
      case 'sd':
        return 5 * 1024 * 1024; // 5MB
      case 'low':
        return 2 * 1024 * 1024; // 2MB
      default:
        return 5 * 1024 * 1024;
    }
  }

  /**
   * Preload asset (download and cache)
   */
  private async preloadAsset(asset: DemoAsset): Promise<void> {
    // In real implementation, this would:
    // 1. Download the file if it's a video or 3D model
    // 2. Store in device cache
    // 3. Verify integrity
    console.log(`Preloading demo asset: ${asset.uri} (${asset.format})`);

    // Simulate loading delay
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`✓ Preloaded: ${asset.uri}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Detect device capabilities for optimal format selection
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    // In real implementation, this would detect:
    // - GPU capabilities for 3D
    // - Network speed
    // - Available storage
    // - Device performance tier

    // For now, return reasonable defaults
    return {
      supports3D: true, // Most modern devices support 3D
      supportsVideo: true,
      networkSpeed: 'fast', // Assume fast network
      storageAvailable: 500, // 500MB available
      isLowEndDevice: false,
    };
  }

  /**
   * Update device capabilities (call this when network changes, etc.)
   */
  updateCapabilities(capabilities: Partial<DeviceCapabilities>): void {
    this.deviceCapabilities = {
      ...this.deviceCapabilities,
      ...capabilities,
    };
  }

  /**
   * Set default demo format
   */
  setDefaultFormat(format: DemoFormat): void {
    this.defaultFormat = format;
  }
}

// Singleton instance
export const demoManager = new DemoManager();
