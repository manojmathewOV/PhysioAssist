/**
 * Shared types for movement analysis: recording a session for the joint of
 * interest, splitting it into repetitions, spotting compensations, and comparing
 * against a reference (the physio's demonstration or their prescribed goal).
 *
 * Conventions:
 * - Landmarks are measurement landmarks (aspect-corrected, see
 *   services/pose/measurementLandmarks), so x and y share one scale.
 * - Angles are clinical degrees from neutral (services/pose/exercisePlan).
 * - Everything is compared with the patient's own rest posture at the start of
 *   each repetition, never with another person's body.
 */
import type { PoseLandmark } from '../../types/pose';
import type { BodySide, JointKind } from '../pose/exercisePlan';

/** Oblique: turned roughly 30-50° to the camera; neither front nor side checks are reliable. */
export type CameraView = 'front' | 'side' | 'oblique' | 'unknown';

/** One analysed frame. */
export interface MovementFrame {
  /** Milliseconds (frame capture time). */
  t: number;
  /** Clinical angle of the joint of interest; null when it can't be measured. */
  angle: number | null;
  /** Measurement landmarks (MediaPipe-33 names). */
  landmarks: PoseLandmark[];
  view: CameraView;
}

/** One repetition: rest -> peak -> back to rest. */
export interface Repetition {
  index: number;
  startT: number;
  peakT: number;
  endT: number;
  /** Largest clinical angle reached. */
  peakDegrees: number;
  /** Smallest clinical angle at the start/end (how fully they returned). */
  restDegrees: number;
  /** Time spent within 5° of the peak. */
  holdMs: number;
  /** Frames from startT to endT (inclusive). */
  frames: MovementFrame[];
  /** The rest frame at the start of the repetition: the patient's own baseline. */
  baseline: MovementFrame;
}

export interface MovementContext {
  joint: JointKind;
  side: BodySide;
  /** Exercise id, e.g. 'arm-raise' (some checks only apply to some exercises). */
  exerciseId?: string;
}

export type FindingId =
  | 'reduced_range'
  | 'incomplete_return'
  | 'too_fast'
  | 'short_hold'
  | 'shoulder_hike'
  | 'trunk_side_lean'
  | 'trunk_rotation'
  | 'back_arch'
  | 'elbow_bend'
  | 'knee_valgus'
  | 'hip_hitch'
  | 'heel_lift'
  | 'forward_head'
  | 'head_tilt'
  | 'trunk_forward_lean'
  | 'pelvic_shift';

export type Severity = 'ok' | 'warn' | 'flag';

/** A compensation seen in one repetition (from a detector). */
export interface CompensationHit {
  id: FindingId;
  severity: Exclude<Severity, 'ok'>;
  /** Size of the problem in the detector's unit (e.g. degrees, % of torso). */
  value: number;
  unit: 'deg' | '%torso' | 'ratio';
  /** How long the condition held continuously in this repetition. */
  durationMs: number;
}

/** A finding for the whole session (seen in enough repetitions to be real). */
export interface Finding {
  id: FindingId;
  severity: Exclude<Severity, 'ok'>;
  /** Short, kind instruction for the patient. */
  cue: string;
  /** Plain-language explanation with numbers, for the summary and the physio. */
  detail: string;
  /** Repetition indexes (0-based) where it was seen. */
  reps: number[];
}

/** A per-repetition compensation detector. */
export type CompensationDetector = (
  rep: Repetition,
  context: MovementContext
) => CompensationHit | null;
