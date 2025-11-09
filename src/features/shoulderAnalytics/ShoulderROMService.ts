/**
 * Shoulder ROM Service
 *
 * Integration service that connects ShoulderROMTracker with the pose detection
 * pipeline. Provides real-time shoulder ROM tracking, session management, and
 * progress analytics.
 *
 * @module ShoulderROMService
 * @gate Gate 7 - Primary Joint Focus
 */

import { PoseLandmark } from '../../types/pose';
import {
  ShoulderROMTracker,
  ShoulderMovement,
  CameraAngle,
  ShoulderROMResult,
  ShoulderROMSession,
} from './ShoulderROMTracker';

export interface ShoulderROMConfig {
  /** Movement type to track */
  movement: ShoulderMovement;
  /** Side to measure */
  side: 'left' | 'right';
  /** Camera angle */
  cameraAngle: CameraAngle;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Auto-end session after inactivity (ms) */
  autoEndTimeout?: number;
}

export interface ShoulderROMProgress {
  /** Total sessions completed */
  totalSessions: number;
  /** Sessions by movement type */
  sessionsByMovement: Record<ShoulderMovement, number>;
  /** Best ROM achieved per movement (degrees) */
  bestROMByMovement: Record<ShoulderMovement, number>;
  /** Average ROM per movement (degrees) */
  avgROMByMovement: Record<ShoulderMovement, number>;
  /** Percentage improvement over time */
  improvementPercent: Record<ShoulderMovement, number>;
  /** Last session date */
  lastSessionDate: number;
}

export interface ShoulderROMExport {
  /** Export timestamp */
  exportDate: number;
  /** Patient identifier */
  patientId?: string;
  /** All sessions */
  sessions: ShoulderROMSession[];
  /** Progress summary */
  progress: ShoulderROMProgress;
  /** Clinical notes */
  notes?: string[];
}

/**
 * Shoulder ROM Service
 *
 * Manages shoulder ROM tracking sessions with automatic quality control,
 * progress analytics, and data export for clinical review.
 */
export class ShoulderROMService {
  private tracker: ShoulderROMTracker;
  private config: ShoulderROMConfig | null = null;
  private lastFrameTime: number = 0;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private sessionHistory: ShoulderROMSession[] = [];

  constructor() {
    this.tracker = new ShoulderROMTracker();
  }

  /**
   * Start a new ROM tracking session
   */
  startSession(config: ShoulderROMConfig): string {
    // End any existing session
    if (this.config) {
      this.endSession();
    }

    this.config = {
      ...config,
      minConfidence: config.minConfidence ?? 0.5,
      autoEndTimeout: config.autoEndTimeout ?? 30000, // 30s default
    };

    const sessionKey = this.tracker.startSession(
      config.movement,
      config.side,
      config.cameraAngle
    );

    this.lastFrameTime = Date.now();
    this.startInactivityMonitor();

    return sessionKey;
  }

  /**
   * Process a frame for ROM tracking
   */
  trackFrame(
    landmarks: PoseLandmark[],
    timestamp: number,
    averageConfidence: number
  ): ShoulderROMResult | null {
    if (!this.config) {
      console.warn('[ShoulderROMService] No active session');
      return null;
    }

    // Quality check
    if (averageConfidence < this.config.minConfidence!) {
      return null; // Skip low-quality frames
    }

    // Update inactivity timer
    this.lastFrameTime = Date.now();
    this.resetInactivityMonitor();

    // Track frame
    return this.tracker.trackFrame(landmarks, timestamp, averageConfidence);
  }

  /**
   * End current session
   */
  endSession(): ShoulderROMSession | null {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    const session = this.tracker.endSession();
    this.config = null;

    if (session) {
      this.sessionHistory.push(session);
    }

    return session;
  }

  /**
   * Get current session status
   */
  isSessionActive(): boolean {
    return this.config !== null;
  }

  /**
   * Get current session configuration
   */
  getCurrentConfig(): ShoulderROMConfig | null {
    return this.config;
  }

  /**
   * Calculate progress analytics
   */
  calculateProgress(): ShoulderROMProgress {
    const allSessions = this.getAllSessions();

    // Group by movement
    const sessionsByMovement: Record<ShoulderMovement, ShoulderROMSession[]> = {
      forward_flexion: [],
      abduction: [],
      external_rotation: [],
      internal_rotation: [],
    };

    for (const session of allSessions) {
      sessionsByMovement[session.movement].push(session);
    }

    // Calculate metrics per movement
    const bestROMByMovement: Record<ShoulderMovement, number> = {
      forward_flexion: 0,
      abduction: 0,
      external_rotation: 0,
      internal_rotation: 0,
    };

    const avgROMByMovement: Record<ShoulderMovement, number> = {
      forward_flexion: 0,
      abduction: 0,
      external_rotation: 0,
      internal_rotation: 0,
    };

    const improvementPercent: Record<ShoulderMovement, number> = {
      forward_flexion: 0,
      abduction: 0,
      external_rotation: 0,
      internal_rotation: 0,
    };

    for (const movement of Object.keys(sessionsByMovement) as ShoulderMovement[]) {
      const sessions = sessionsByMovement[movement];

      if (sessions.length === 0) continue;

      // Best ROM
      bestROMByMovement[movement] = Math.max(...sessions.map((s) => s.peakAngle));

      // Average ROM
      const totalAngle = sessions.reduce((sum, s) => sum + s.averageAngle, 0);
      avgROMByMovement[movement] = totalAngle / sessions.length;

      // Improvement (compare first quarter to last quarter)
      if (sessions.length >= 4) {
        const quarterSize = Math.floor(sessions.length / 4);
        const firstQuarter = sessions.slice(0, quarterSize);
        const lastQuarter = sessions.slice(-quarterSize);

        const firstAvg =
          firstQuarter.reduce((sum, s) => sum + s.peakAngle, 0) / firstQuarter.length;
        const lastAvg =
          lastQuarter.reduce((sum, s) => sum + s.peakAngle, 0) / lastQuarter.length;

        improvementPercent[movement] = ((lastAvg - firstAvg) / firstAvg) * 100;
      }
    }

    // Count sessions by movement
    const sessionCounts: Record<ShoulderMovement, number> = {
      forward_flexion: sessionsByMovement.forward_flexion.length,
      abduction: sessionsByMovement.abduction.length,
      external_rotation: sessionsByMovement.external_rotation.length,
      internal_rotation: sessionsByMovement.internal_rotation.length,
    };

    return {
      totalSessions: allSessions.length,
      sessionsByMovement: sessionCounts,
      bestROMByMovement,
      avgROMByMovement,
      improvementPercent,
      lastSessionDate:
        allSessions.length > 0 ? allSessions[allSessions.length - 1].startTime : 0,
    };
  }

  /**
   * Export session data for clinical review
   */
  exportData(patientId?: string, notes?: string[]): ShoulderROMExport {
    return {
      exportDate: Date.now(),
      patientId,
      sessions: this.getAllSessions(),
      progress: this.calculateProgress(),
      notes,
    };
  }

  /**
   * Get all sessions (including history)
   */
  getAllSessions(): ShoulderROMSession[] {
    const trackerHistory = this.tracker.getSessionHistory();

    // Merge sessionHistory with tracker history (avoiding duplicates)
    const allSessions = [...this.sessionHistory];

    for (const session of trackerHistory) {
      const exists = allSessions.some(
        (s) => s.startTime === session.startTime && s.movement === session.movement
      );
      if (!exists) {
        allSessions.push(session);
      }
    }

    return allSessions.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Clear all session data
   */
  reset(): void {
    this.tracker.reset();
    this.sessionHistory = [];
    this.config = null;
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Get recommended next movement
   *
   * Suggests movement based on least-practiced exercise or lowest ROM
   */
  getRecommendedMovement(): ShoulderMovement {
    const progress = this.calculateProgress();

    // Find movement with fewest sessions
    let minSessions = Infinity;
    let recommended: ShoulderMovement = 'forward_flexion';

    for (const movement of Object.keys(
      progress.sessionsByMovement
    ) as ShoulderMovement[]) {
      const count = progress.sessionsByMovement[movement];
      if (count < minSessions) {
        minSessions = count;
        recommended = movement;
      }
    }

    return recommended;
  }

  /**
   * Get clinical summary for therapist review
   */
  getClinicalSummary(): {
    summary: string;
    concerns: string[];
    achievements: string[];
  } {
    const progress = this.calculateProgress();
    const concerns: string[] = [];
    const achievements: string[] = [];

    // Check each movement against clinical standards
    const standards = {
      forward_flexion: { standard: 180, populationMin: 157 },
      abduction: { standard: 180, populationMin: 148 },
      external_rotation: { standard: 90, populationMin: 53 },
      internal_rotation: { standard: 100, populationMin: 95 },
    };

    for (const movement of Object.keys(standards) as ShoulderMovement[]) {
      const best = progress.bestROMByMovement[movement];
      const { standard, populationMin } = standards[movement];

      if (best === 0) {
        concerns.push(`${movement.replace('_', ' ')}: No data collected`);
        continue;
      }

      if (best >= standard) {
        achievements.push(
          `${movement.replace('_', ' ')}: Achieved clinical standard (${best.toFixed(1)}°)`
        );
      } else if (best >= populationMin) {
        achievements.push(
          `${movement.replace('_', ' ')}: Within population average (${best.toFixed(1)}°)`
        );
      } else {
        concerns.push(
          `${movement.replace('_', ' ')}: Below population average (${best.toFixed(1)}° vs ${populationMin}° min)`
        );
      }
    }

    // Generate summary
    const totalSessions = progress.totalSessions;
    const avgImprovement =
      Object.values(progress.improvementPercent).reduce((a, b) => a + b, 0) / 4;

    let summary = `Completed ${totalSessions} session(s). `;
    if (avgImprovement > 10) {
      summary += `Excellent progress with ${avgImprovement.toFixed(1)}% average improvement.`;
    } else if (avgImprovement > 0) {
      summary += `Showing improvement (${avgImprovement.toFixed(1)}% average).`;
    } else {
      summary += `Continue regular exercises for improvement.`;
    }

    return { summary, concerns, achievements };
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Start monitoring for session inactivity
   */
  private startInactivityMonitor(): void {
    if (!this.config || !this.config.autoEndTimeout) return;

    this.inactivityTimer = setTimeout(() => {
      console.log('[ShoulderROMService] Session auto-ended due to inactivity');
      this.endSession();
    }, this.config.autoEndTimeout);
  }

  /**
   * Reset inactivity monitor
   */
  private resetInactivityMonitor(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.startInactivityMonitor();
  }
}

export default ShoulderROMService;
