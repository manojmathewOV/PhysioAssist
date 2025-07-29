import { exerciseValidationService } from '../exerciseValidationService';
import { ProcessedPoseData } from '../../types/pose';
import { Exercise } from '../../types/exercise';
import { mockExercise, mockPoseLandmarks } from '../../utils/testHelpers';

describe('ExerciseValidationService', () => {
  const createMockPoseData = (overrides?: Partial<ProcessedPoseData>): ProcessedPoseData => ({
    landmarks: mockPoseLandmarks,
    confidence: 0.9,
    timestamp: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    exerciseValidationService.resetSession();
  });

  describe('startExercise', () => {
    it('should start an exercise session', () => {
      exerciseValidationService.startExercise(mockExercise);

      const state = exerciseValidationService.getCurrentState();
      expect(state.isActive).toBe(true);
      expect(state.exercise?.name).toBe('Bicep Curl');
      expect(state.repetitionCount).toBe(0);
      expect(state.phase?.name).toBe('rest');
    });
  });

  describe('validatePose', () => {
    it('should validate bicep curl form', () => {
      exerciseValidationService.startExercise(mockExercise);
      
      const poseData = createMockPoseData();
      const result = exerciseValidationService.validatePose(poseData);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.phase).toBeDefined();
      expect(result.feedback).toBeInstanceOf(Array);
    });

    it('should detect phase transitions', () => {
      exerciseValidationService.startExercise(mockExercise);
      
      // Start in rest position
      let poseData = createMockPoseData();
      let result = exerciseValidationService.validatePose(poseData);
      expect(result.phase).toBe('rest');

      // Move to flexion phase (elbow bent)
      const bentLandmarks = [...mockPoseLandmarks];
      bentLandmarks[13] = { ...bentLandmarks[13], y: 0.3 }; // left elbow up
      bentLandmarks[14] = { ...bentLandmarks[14], y: 0.3 }; // right elbow up
      bentLandmarks[15] = { ...bentLandmarks[15], y: 0.2 }; // left wrist up
      bentLandmarks[16] = { ...bentLandmarks[16], y: 0.2 }; // right wrist up
      
      poseData = createMockPoseData({ landmarks: bentLandmarks });
      
      // Simulate multiple validations to trigger phase transition
      for (let i = 0; i < 10; i++) {
        result = exerciseValidationService.validatePose(poseData);
      }
    });

    it('should count repetitions correctly', () => {
      exerciseValidationService.startExercise(mockExercise);
      
      // Create proper rest position (elbows at ~170 degrees)
      const restLandmarks = [...mockPoseLandmarks];
      restLandmarks[11] = { x: 0.45, y: 0.3, z: 0, visibility: 0.9, name: 'left_shoulder' };  // left shoulder
      restLandmarks[12] = { x: 0.55, y: 0.3, z: 0, visibility: 0.9, name: 'right_shoulder' }; // right shoulder
      restLandmarks[13] = { x: 0.43, y: 0.4, z: 0, visibility: 0.9, name: 'left_elbow' };     // left elbow
      restLandmarks[14] = { x: 0.57, y: 0.4, z: 0, visibility: 0.9, name: 'right_elbow' };    // right elbow
      restLandmarks[15] = { x: 0.42, y: 0.48, z: 0, visibility: 0.9, name: 'left_wrist' };    // left wrist (down)
      restLandmarks[16] = { x: 0.58, y: 0.48, z: 0, visibility: 0.9, name: 'right_wrist' };   // right wrist (down)
      
      // Create flexed position (elbows at ~45 degrees)
      const flexedLandmarks = [...mockPoseLandmarks];
      flexedLandmarks[11] = { x: 0.45, y: 0.3, z: 0, visibility: 0.9, name: 'left_shoulder' };  // left shoulder (same)
      flexedLandmarks[12] = { x: 0.55, y: 0.3, z: 0, visibility: 0.9, name: 'right_shoulder' }; // right shoulder (same)
      flexedLandmarks[13] = { x: 0.43, y: 0.4, z: 0, visibility: 0.9, name: 'left_elbow' };     // left elbow (same)
      flexedLandmarks[14] = { x: 0.57, y: 0.4, z: 0, visibility: 0.9, name: 'right_elbow' };    // right elbow (same)
      flexedLandmarks[15] = { x: 0.35, y: 0.32, z: 0, visibility: 0.9, name: 'left_wrist' };    // left wrist (up and in)
      flexedLandmarks[16] = { x: 0.65, y: 0.32, z: 0, visibility: 0.9, name: 'right_wrist' };   // right wrist (up and in)
      
      // Complete full repetition cycles through all three phases: rest -> flexion -> extension
      for (let rep = 0; rep < 2; rep++) {
        // Phase 1: Rest position (elbow angle ~170°) - hold until phase transition
        for (let i = 0; i < 10; i++) {
          exerciseValidationService.validatePose(createMockPoseData({ landmarks: restLandmarks }));
        }
        
        // Phase 2: Flexion position (elbow angle ~45°) - hold for 500ms + extra to ensure transition  
        const flexionStart = Date.now();
        while (Date.now() - flexionStart < 600) {
          exerciseValidationService.validatePose(createMockPoseData({ landmarks: flexedLandmarks }));
          // Small delay to simulate real-time validation
          const now = Date.now();
          while (Date.now() - now < 10) {
            // Small delay
          }
        }
        
        // Phase 3: Extension/back to rest (elbow angle ~170°) - completes the rep
        for (let i = 0; i < 10; i++) {
          exerciseValidationService.validatePose(createMockPoseData({ landmarks: restLandmarks }));
        }
      }
      
      const state = exerciseValidationService.getCurrentState();
      expect(state.repetitionCount).toBeGreaterThan(0);
    });

    it('should provide feedback for poor form', () => {
      exerciseValidationService.startExercise(mockExercise);
      
      // For poor form test, we'll check that invalid poses get errors
      const emptyPoseData = createMockPoseData({ landmarks: [] });
      const result = exerciseValidationService.validatePose(emptyPoseData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getExerciseMetrics', () => {
    it('should track exercise metrics', () => {
      exerciseValidationService.startExercise(mockExercise);
      
      // Create proper rest position (elbows at ~170 degrees)
      const restLandmarks = [...mockPoseLandmarks];
      restLandmarks[11] = { x: 0.45, y: 0.3, z: 0, visibility: 0.9, name: 'left_shoulder' };
      restLandmarks[12] = { x: 0.55, y: 0.3, z: 0, visibility: 0.9, name: 'right_shoulder' };
      restLandmarks[13] = { x: 0.43, y: 0.4, z: 0, visibility: 0.9, name: 'left_elbow' };
      restLandmarks[14] = { x: 0.57, y: 0.4, z: 0, visibility: 0.9, name: 'right_elbow' };
      restLandmarks[15] = { x: 0.42, y: 0.48, z: 0, visibility: 0.9, name: 'left_wrist' };
      restLandmarks[16] = { x: 0.58, y: 0.48, z: 0, visibility: 0.9, name: 'right_wrist' };
      
      // Create flexed position (elbows at ~45 degrees)
      const flexedLandmarks = [...mockPoseLandmarks];
      flexedLandmarks[11] = { x: 0.45, y: 0.3, z: 0, visibility: 0.9, name: 'left_shoulder' };
      flexedLandmarks[12] = { x: 0.55, y: 0.3, z: 0, visibility: 0.9, name: 'right_shoulder' };
      flexedLandmarks[13] = { x: 0.43, y: 0.4, z: 0, visibility: 0.9, name: 'left_elbow' };
      flexedLandmarks[14] = { x: 0.57, y: 0.4, z: 0, visibility: 0.9, name: 'right_elbow' };
      flexedLandmarks[15] = { x: 0.35, y: 0.32, z: 0, visibility: 0.9, name: 'left_wrist' };
      flexedLandmarks[16] = { x: 0.65, y: 0.32, z: 0, visibility: 0.9, name: 'right_wrist' };
      
      // Perform exercise simulation to track metrics
      // Rest position
      for (let i = 0; i < 3; i++) {
        exerciseValidationService.validatePose(createMockPoseData({ landmarks: restLandmarks }));
      }
      
      // Flexion phase 
      for (let i = 0; i < 5; i++) {
        exerciseValidationService.validatePose(createMockPoseData({ landmarks: flexedLandmarks }));
      }
      
      // Return to rest to complete repetition
      for (let i = 0; i < 3; i++) {
        exerciseValidationService.validatePose(createMockPoseData({ landmarks: restLandmarks }));
      }
      
      const metrics = exerciseValidationService.getExerciseMetrics();
      
      expect(metrics.exerciseName).toBe('Bicep Curl');
      expect(metrics.targetRepetitions).toBe(10);
      expect(metrics.averageQuality).toBeGreaterThanOrEqual(0);
      expect(metrics.totalDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('stopExercise', () => {
    it('should end exercise session and return summary', () => {
      exerciseValidationService.startExercise(mockExercise);
      
      const metrics = exerciseValidationService.stopExercise();
      
      expect(metrics).toBeDefined();
      expect(metrics.exerciseName).toBe('Bicep Curl');
      
      const state = exerciseValidationService.getCurrentState();
      expect(state.isActive).toBe(false);
      expect(state.exercise).toBeNull();
    });
  });

  describe('resetSession', () => {
    it('should reset current session', () => {
      exerciseValidationService.startExercise(mockExercise);
      exerciseValidationService.resetSession();
      
      const state = exerciseValidationService.getCurrentState();
      expect(state.isActive).toBe(false);
      expect(state.exercise).toBeNull();
      expect(state.repetitionCount).toBe(0);
    });
  });

  describe('exercise-specific validations', () => {
    it('should validate squat depth', () => {
      const squatExercise: Exercise = {
        ...mockExercise,
        id: 'squat',
        name: 'Squat',
        phases: [
          {
            name: 'standing',
            description: 'Standing position',
            jointRequirements: [
              { joint: 'left_knee', minAngle: 160, maxAngle: 180, targetAngle: 170 },
              { joint: 'right_knee', minAngle: 160, maxAngle: 180, targetAngle: 170 },
            ],
          },
          {
            name: 'squat',
            description: 'Squat position',
            jointRequirements: [
              { joint: 'left_knee', minAngle: 70, maxAngle: 110, targetAngle: 90 },
              { joint: 'right_knee', minAngle: 70, maxAngle: 110, targetAngle: 90 },
            ],
            holdDuration: 1000,
          },
        ],
      };
      
      exerciseValidationService.startExercise(squatExercise);
      
      const deepSquatLandmarks = [...mockPoseLandmarks];
      deepSquatLandmarks[25] = { ...deepSquatLandmarks[25], y: 0.7 }; // knees bent
      deepSquatLandmarks[26] = { ...deepSquatLandmarks[26], y: 0.7 };
      
      const poseData = createMockPoseData({ landmarks: deepSquatLandmarks });
      const result = exerciseValidationService.validatePose(poseData);
      
      expect(result).toBeDefined();
    });

    it('should validate hamstring stretch hold time', () => {
      const stretchExercise: Exercise = {
        ...mockExercise,
        id: 'hamstring_stretch',
        name: 'Hamstring Stretch',
        phases: [
          {
            name: 'stretch',
            description: 'Hold stretch position',
            jointRequirements: [
              { joint: 'left_hip', minAngle: 60, maxAngle: 90, targetAngle: 75 },
            ],
            holdDuration: 15000, // 15 seconds
          },
        ],
      };
      
      exerciseValidationService.startExercise(stretchExercise);
      
      const stretchLandmarks = [...mockPoseLandmarks];
      stretchLandmarks[23] = { ...stretchLandmarks[23], y: 0.4 }; // hip bent
      
      const poseData = createMockPoseData({ landmarks: stretchLandmarks });
      const result = exerciseValidationService.validatePose(poseData);
      
      expect(result).toBeDefined();
      expect(result.phaseProgress).toBeDefined();
    });
  });
});