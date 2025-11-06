export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles: string[];
  equipment: string[];
  phases: ExercisePhase[];
  targetRepetitions: number;
  targetSets: number;
  restDuration: number; // in milliseconds
  videoUrl?: string;
  thumbnailUrl?: string;
  instructions: string[];
  warnings?: string[];
}

export interface ExercisePhase {
  name: string;
  description: string;
  jointRequirements: JointRequirement[];
  holdDuration?: number; // in milliseconds
  transitionTime?: number; // time to transition to this phase
}

export interface JointRequirement {
  joint: string;
  minAngle: number;
  maxAngle: number;
  targetAngle?: number;
  tolerance?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  phase: string;
  feedback: string[];
  jointAngles?: Record<string, JointAngle>;
  phaseProgress?: number;
}

export interface RepetitionData {
  number: number;
  timestamp: number;
  quality: number; // 0-100
  peakAngles: Record<string, JointAngle>;
  duration: number;
}

export interface ExerciseMetrics {
  exerciseName: string;
  repetitionCount: number;
  targetRepetitions: number;
  averageQuality: number;
  totalDuration: number;
  repetitionData: RepetitionData[];
  isComplete: boolean;
}

export type ExerciseCategory =
  | 'strength'
  | 'flexibility'
  | 'balance'
  | 'cardio'
  | 'rehabilitation'
  | 'posture';

export interface ExerciseSession {
  id: string;
  userId: string;
  exercises: ExerciseMetrics[];
  startTime: number;
  endTime?: number;
  totalScore: number;
  notes?: string;
}
