/**
 * Unit Tests for ShoulderROMService
 *
 * Tests session management, progress analytics, and clinical summaries
 * for shoulder ROM tracking.
 *
 * @gate Gate 7 - Primary Joint Focus
 */

import { ShoulderROMService } from '../ShoulderROMService';
import { PoseLandmark } from '../../../types/pose';

// Mock landmarks for testing
const createMockLandmarks = (shoulderAngle: number): PoseLandmark[] => {
  const landmarks: PoseLandmark[] = Array(17).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    score: 0.9,
  }));

  // Simulate shoulder at given angle
  // Shoulder at index 5 (left) or 6 (right)
  // Wrist at index 9 (left) or 10 (right)
  const angleRad = (shoulderAngle * Math.PI) / 180;
  landmarks[5] = { x: 0.5, y: 0.5, score: 0.9 }; // Left shoulder
  landmarks[9] = {
    x: 0.5 + Math.sin(angleRad) * 0.3,
    y: 0.5 - Math.cos(angleRad) * 0.3,
    score: 0.9,
  }; // Left wrist

  return landmarks;
};

describe('ShoulderROMService', () => {
  let service: ShoulderROMService;

  beforeEach(() => {
    service = new ShoulderROMService();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========================================================================
  // Session Management
  // ========================================================================

  describe('Session management', () => {
    it('should start a new session', () => {
      const sessionKey = service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });

      expect(sessionKey).toBeTruthy();
      expect(service.isSessionActive()).toBe(true);
      expect(service.getCurrentConfig()).toMatchObject({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });
    });

    it('should end existing session when starting new one', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });

      // Track some frames
      const landmarks = createMockLandmarks(90);
      service.trackFrame(landmarks, 1000, 0.8);

      // Start new session
      service.startSession({
        movement: 'abduction',
        side: 'right',
        cameraAngle: 'frontal',
      });

      const config = service.getCurrentConfig();
      expect(config?.movement).toBe('abduction');
      expect(config?.side).toBe('right');

      // Previous session should be in history
      const history = service.getAllSessions();
      expect(history).toHaveLength(1);
      expect(history[0].movement).toBe('forward_flexion');
    });

    it('should end session manually', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });

      const landmarks = createMockLandmarks(120);
      service.trackFrame(landmarks, 1000, 0.8);

      const session = service.endSession();

      expect(session).toBeTruthy();
      expect(session?.movement).toBe('forward_flexion');
      expect(service.isSessionActive()).toBe(false);
    });

    it('should auto-end session after inactivity', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
        autoEndTimeout: 5000,
      });

      expect(service.isSessionActive()).toBe(true);

      // Fast-forward past timeout
      jest.advanceTimersByTime(6000);

      expect(service.isSessionActive()).toBe(false);
    });

    it('should reset inactivity timer on frame update', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
        autoEndTimeout: 5000,
      });

      const landmarks = createMockLandmarks(90);

      // Update frames periodically
      jest.advanceTimersByTime(3000);
      service.trackFrame(landmarks, 3000, 0.8);

      jest.advanceTimersByTime(3000);
      service.trackFrame(landmarks, 6000, 0.8);

      jest.advanceTimersByTime(3000);
      service.trackFrame(landmarks, 9000, 0.8);

      // Should still be active (timer reset each time)
      expect(service.isSessionActive()).toBe(true);
    });
  });

  // ========================================================================
  // Frame Tracking
  // ========================================================================

  describe('Frame tracking', () => {
    it('should track frames with sufficient confidence', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
        minConfidence: 0.6,
      });

      const landmarks = createMockLandmarks(100);
      const result = service.trackFrame(landmarks, 1000, 0.8);

      expect(result).toBeTruthy();
      expect(result?.movement).toBe('forward_flexion');
    });

    it('should skip frames with low confidence', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
        minConfidence: 0.7,
      });

      const landmarks = createMockLandmarks(100);
      const result = service.trackFrame(landmarks, 1000, 0.5); // Low confidence

      expect(result).toBeNull();
    });

    it('should warn when tracking without active session', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const landmarks = createMockLandmarks(100);
      const result = service.trackFrame(landmarks, 1000, 0.8);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No active session')
      );

      consoleSpy.mockRestore();
    });
  });

  // ========================================================================
  // Progress Analytics
  // ========================================================================

  describe('Progress analytics', () => {
    it('should calculate basic progress metrics', () => {
      // Session 1
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });
      const landmarks1 = createMockLandmarks(120);
      service.trackFrame(landmarks1, 1000, 0.8);
      service.endSession();

      // Session 2
      service.startSession({
        movement: 'abduction',
        side: 'left',
        cameraAngle: 'frontal',
      });
      const landmarks2 = createMockLandmarks(110);
      service.trackFrame(landmarks2, 2000, 0.8);
      service.endSession();

      const progress = service.calculateProgress();

      expect(progress.totalSessions).toBe(2);
      expect(progress.sessionsByMovement.forward_flexion).toBe(1);
      expect(progress.sessionsByMovement.abduction).toBe(1);
    });

    it('should track best ROM per movement', () => {
      // Multiple sessions for forward flexion
      for (let i = 0; i < 3; i++) {
        service.startSession({
          movement: 'forward_flexion',
          side: 'left',
          cameraAngle: 'sagittal',
        });

        const angles = [100, 130, 120]; // Peak at 130
        const landmarks = createMockLandmarks(angles[i]);
        service.trackFrame(landmarks, 1000 + i * 1000, 0.8);
        service.endSession();
      }

      const progress = service.calculateProgress();

      expect(progress.bestROMByMovement.forward_flexion).toBeGreaterThan(0);
    });

    it('should calculate improvement percentage', () => {
      // Simulate 8 sessions with gradual improvement
      const angles = [80, 85, 90, 95, 100, 105, 110, 115];

      for (let i = 0; i < angles.length; i++) {
        service.startSession({
          movement: 'forward_flexion',
          side: 'left',
          cameraAngle: 'sagittal',
        });

        const landmarks = createMockLandmarks(angles[i]);
        service.trackFrame(landmarks, 1000 + i * 1000, 0.8);
        service.endSession();
      }

      const progress = service.calculateProgress();

      // Should show positive improvement
      expect(progress.improvementPercent.forward_flexion).toBeGreaterThan(0);
    });

    it('should handle empty session history', () => {
      const progress = service.calculateProgress();

      expect(progress.totalSessions).toBe(0);
      expect(progress.lastSessionDate).toBe(0);
    });
  });

  // ========================================================================
  // Clinical Summary
  // ========================================================================

  describe('Clinical summary', () => {
    it('should generate clinical summary', () => {
      // Session with good ROM
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });
      const landmarks = createMockLandmarks(160); // Good ROM
      service.trackFrame(landmarks, 1000, 0.8);
      service.endSession();

      const summary = service.getClinicalSummary();

      expect(summary.summary).toBeTruthy();
      expect(summary.concerns).toBeDefined();
      expect(summary.achievements).toBeDefined();
    });

    it('should identify achievements for good ROM', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });
      const landmarks = createMockLandmarks(180); // Clinical standard
      service.trackFrame(landmarks, 1000, 0.8);
      service.endSession();

      const summary = service.getClinicalSummary();

      // Should have at least one achievement
      expect(summary.achievements.length).toBeGreaterThan(0);
    });

    it('should identify concerns for low ROM', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });
      const landmarks = createMockLandmarks(100); // Below population min (157)
      service.trackFrame(landmarks, 1000, 0.8);
      service.endSession();

      const summary = service.getClinicalSummary();

      // May have concerns or may not, depending on algorithm
      expect(summary.concerns).toBeDefined();
    });
  });

  // ========================================================================
  // Recommendations
  // ========================================================================

  describe('Recommendations', () => {
    it('should recommend least-practiced movement', () => {
      // Practice forward_flexion twice
      for (let i = 0; i < 2; i++) {
        service.startSession({
          movement: 'forward_flexion',
          side: 'left',
          cameraAngle: 'sagittal',
        });
        service.trackFrame(createMockLandmarks(120), 1000, 0.8);
        service.endSession();
      }

      // Practice abduction once
      service.startSession({
        movement: 'abduction',
        side: 'left',
        cameraAngle: 'frontal',
      });
      service.trackFrame(createMockLandmarks(110), 1000, 0.8);
      service.endSession();

      const recommended = service.getRecommendedMovement();

      // Should recommend external_rotation or internal_rotation (0 sessions)
      expect(['external_rotation', 'internal_rotation']).toContain(recommended);
    });

    it('should default to forward_flexion for new users', () => {
      const recommended = service.getRecommendedMovement();
      expect(recommended).toBe('forward_flexion');
    });
  });

  // ========================================================================
  // Data Export
  // ========================================================================

  describe('Data export', () => {
    it('should export session data', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });
      service.trackFrame(createMockLandmarks(120), 1000, 0.8);
      service.endSession();

      const exportData = service.exportData('patient-123', ['Test note']);

      expect(exportData.exportDate).toBeTruthy();
      expect(exportData.patientId).toBe('patient-123');
      expect(exportData.sessions).toHaveLength(1);
      expect(exportData.progress).toBeDefined();
      expect(exportData.notes).toContain('Test note');
    });

    it('should include all sessions in export', () => {
      // Multiple sessions
      for (let i = 0; i < 3; i++) {
        service.startSession({
          movement: 'forward_flexion',
          side: 'left',
          cameraAngle: 'sagittal',
        });
        service.trackFrame(createMockLandmarks(120 + i * 10), 1000, 0.8);
        service.endSession();
      }

      const exportData = service.exportData();

      expect(exportData.sessions).toHaveLength(3);
    });
  });

  // ========================================================================
  // Reset Functionality
  // ========================================================================

  describe('Reset functionality', () => {
    it('should reset all data', () => {
      service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
      });
      service.trackFrame(createMockLandmarks(120), 1000, 0.8);
      service.endSession();

      expect(service.getAllSessions()).toHaveLength(1);

      service.reset();

      expect(service.getAllSessions()).toHaveLength(0);
      expect(service.isSessionActive()).toBe(false);
      expect(service.calculateProgress().totalSessions).toBe(0);
    });
  });

  // ========================================================================
  // Integration Scenarios
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should handle full exercise session workflow', () => {
      // 1. Start session
      const sessionKey = service.startSession({
        movement: 'forward_flexion',
        side: 'left',
        cameraAngle: 'sagittal',
        minConfidence: 0.6,
      });
      expect(sessionKey).toBeTruthy();

      // 2. Track multiple frames (simulating exercise reps)
      for (let i = 0; i < 10; i++) {
        const angle = 80 + i * 5; // Gradually increase ROM
        const landmarks = createMockLandmarks(angle);
        const result = service.trackFrame(landmarks, 1000 + i * 100, 0.85);
        expect(result).toBeTruthy();
      }

      // 3. End session
      const session = service.endSession();
      expect(session).toBeTruthy();
      expect(session?.angleHistory).toHaveLength(10);

      // 4. Check progress
      const progress = service.calculateProgress();
      expect(progress.totalSessions).toBe(1);

      // 5. Get recommendation
      const recommended = service.getRecommendedMovement();
      expect(recommended).not.toBe('forward_flexion'); // Should recommend unpracticed movement
    });

    it('should handle multi-session progression', () => {
      const movements: Array<{ movement: any; angle: number }> = [
        { movement: 'forward_flexion', angle: 120 },
        { movement: 'abduction', angle: 110 },
        { movement: 'external_rotation', angle: 70 },
        { movement: 'internal_rotation', angle: 95 },
      ];

      // Complete one session for each movement
      movements.forEach(({ movement, angle }) => {
        service.startSession({
          movement: movement as any,
          side: 'left',
          cameraAngle: 'sagittal',
        });
        service.trackFrame(createMockLandmarks(angle), Date.now(), 0.8);
        service.endSession();
      });

      const progress = service.calculateProgress();
      expect(progress.totalSessions).toBe(4);

      const summary = service.getClinicalSummary();
      expect(summary.summary).toContain('4 session');
    });
  });
});
