import { JointAngle } from './pose';

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
  /** The joint this exercise trains; with a patient's plan, the only joint tracked. */
  primaryJoint?: JointKind;
  /**
   * Prescribed "don't go past" limit (e.g. after surgery), in clinical degrees
   * from neutral, for one joint. Set from the patient's plan.
   */
  safetyLimit?: { joint: string; kind: JointKind; maxDegrees: number };
}

/** Joints a patient's plan can focus on. */
export type JointKind = 'shoulder' | 'elbow' | 'hip' | 'knee';
export type BodySide = 'left' | 'right';

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
  /**
   * Required joints whose limb is turned toward/away from the camera, so the 2D
   * angle is foreshortened and should be shown as an estimate.
   */
  estimatedJoints?: string[];
  /** The joint went past the plan's safety limit on this frame. */
  overLimit?: boolean;
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
