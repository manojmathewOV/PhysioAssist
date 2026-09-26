/**
 * Care pathways: what the patient is being treated for, so the same simple
 * screens carry different clinical meaning. A mobility exercise for primary
 * frozen shoulder is not interchangeable with a similar-looking movement after
 * a cuff repair; restoring movement after a knee replacement is not the same
 * problem as protecting a meniscal repair.
 *
 * This catalogue holds no doses, dates, loads or pain thresholds: those come
 * from the treating team. It says which pathway families exist, which phases a
 * clinician can set, how the app should coach in each, and which pathways the
 * app must not run without a specialist-approved programme.
 */
import type { JointKind } from '../pose/exercisePlan';

/**
 * Broad purposes a phase can have. Navigation labels, not a protocol: the
 * clinician sets the phase; the calendar never advances it.
 */
export type PhaseId =
  | 'prepare'
  | 'protect'
  | 'symptom_limited'
  | 'restore_movement'
  | 'restore_capacity'
  | 'maintain';

export interface PhaseInfo {
  id: PhaseId;
  /** What the patient reads. */
  label: string;
  /**
   * 'comfort': no "raise higher" / "bend more" coaching; the patient moves
   * within comfort and only precautions and set-up come through.
   * 'target': the prescribed goal is coached.
   */
  coaching: 'comfort' | 'target';
}

export const PHASES: Record<PhaseId, PhaseInfo> = {
  prepare: { id: 'prepare', label: 'Getting ready', coaching: 'target' },
  protect: { id: 'protect', label: 'Protecting the repair', coaching: 'comfort' },
  symptom_limited: {
    id: 'symptom_limited',
    label: 'Moving within comfort',
    coaching: 'comfort',
  },
  restore_movement: {
    id: 'restore_movement',
    label: 'Getting movement back',
    coaching: 'target',
  },
  restore_capacity: {
    id: 'restore_capacity',
    label: 'Building strength',
    coaching: 'target',
  },
  maintain: { id: 'maintain', label: 'Keeping it going', coaching: 'target' },
};

export type PathwayKind = 'no_surgery' | 'before_surgery' | 'after_surgery';

export interface Pathway {
  id: string;
  joint: JointKind;
  /** Clinician-facing name. */
  label: string;
  kind: PathwayKind;
  /** Phases the clinician can choose, in their usual order. */
  phases: PhaseId[];
  /**
   * The app offers no exercises until a specialist has approved this
   * patient's programme: generic templates must not be improvised here.
   */
  specialistOnly?: boolean;
  /** For an operation: the pathway that follows it (the handover). */
  after?: string;
  /** A note for the clinician, shown in set-up. */
  note?: string;
}

export const PATHWAYS: Pathway[] = [
  // Shoulder
  {
    id: 'frozen_shoulder',
    joint: 'shoulder',
    label: 'Frozen shoulder (primary)',
    kind: 'no_surgery',
    phases: ['symptom_limited', 'restore_movement', 'restore_capacity', 'maintain'],
    note: 'Set the phase from irritability, not from time since onset. A camera angle measures active movement only; it cannot establish the passive restriction.',
  },
  {
    id: 'cuff_tendinopathy',
    joint: 'shoulder',
    label: 'Rotator cuff tendinopathy / partial tear, no surgery',
    kind: 'no_surgery',
    phases: ['symptom_limited', 'restore_capacity', 'maintain'],
    note: 'Progress is load, technique and function, not only how high the arm goes.',
  },
  {
    id: 'shoulder_before_surgery',
    joint: 'shoulder',
    label: 'Before shoulder surgery',
    kind: 'before_surgery',
    phases: ['prepare'],
    note: 'Baseline and practice for after the operation. Nothing carries over after surgery until the post-operative programme is confirmed.',
  },
  {
    id: 'cuff_repair',
    joint: 'shoulder',
    label: 'After rotator cuff repair',
    kind: 'after_surgery',
    phases: ['protect', 'restore_movement', 'restore_capacity', 'maintain'],
    note: 'Passive, assisted, active and resisted work need separate permission from the surgical team. A low pain score never overrides protection.',
  },
  {
    id: 'anatomic_shoulder_replacement',
    joint: 'shoulder',
    label: 'After anatomic shoulder replacement',
    kind: 'after_surgery',
    phases: ['protect', 'restore_movement', 'restore_capacity', 'maintain'],
    note: 'Its own programme (including subscapularis protection); not the reverse-replacement one.',
  },
  {
    id: 'reverse_shoulder_replacement',
    joint: 'shoulder',
    label: 'After reverse shoulder replacement',
    kind: 'after_surgery',
    phases: ['protect', 'restore_movement', 'restore_capacity', 'maintain'],
    note: 'Its own precautions, including pushing up from a chair with the arm.',
  },
  {
    id: 'capsular_release',
    joint: 'shoulder',
    label: 'After manipulation or capsular release',
    kind: 'after_surgery',
    phases: ['restore_movement', 'restore_capacity', 'maintain'],
    note: 'Check whether a repair was done at the same operation before choosing exercises.',
  },
  {
    id: 'shoulder_specialist',
    joint: 'shoulder',
    label: 'Instability, fracture, tendon transfer or revision',
    kind: 'after_surgery',
    phases: ['protect', 'restore_movement', 'restore_capacity', 'maintain'],
    specialistOnly: true,
  },
  // Knee
  {
    id: 'knee_oa',
    joint: 'knee',
    label: 'Knee osteoarthritis, no surgery',
    kind: 'no_surgery',
    phases: ['restore_movement', 'restore_capacity', 'maintain'],
    note: 'Strength, function and activity tolerance matter as much as range.',
  },
  {
    id: 'patellofemoral_pain',
    joint: 'knee',
    label: 'Patellofemoral pain',
    kind: 'no_surgery',
    phases: ['symptom_limited', 'restore_capacity', 'maintain'],
    note: 'Not a stiffness programme; the camera does not diagnose knee tracking.',
  },
  {
    id: 'knee_before_replacement',
    joint: 'knee',
    label: 'Before knee replacement',
    kind: 'before_surgery',
    phases: ['prepare'],
    after: 'knee_replacement',
    note: 'Practise the set-up and exercises now, before post-operative pain and stiffness.',
  },
  {
    id: 'knee_replacement',
    joint: 'knee',
    label: 'After total knee replacement',
    kind: 'after_surgery',
    phases: ['protect', 'restore_movement', 'restore_capacity', 'maintain'],
    note: 'Neither a single angle nor the date establishes readiness to progress.',
  },
  {
    id: 'meniscectomy',
    joint: 'knee',
    label: 'After partial meniscectomy',
    kind: 'after_surgery',
    phases: ['restore_movement', 'restore_capacity', 'maintain'],
    note: 'Not the loading rules of a meniscal repair.',
  },
  {
    id: 'knee_specialist',
    joint: 'knee',
    label:
      'Meniscal repair, ACL, extensor mechanism, cartilage, osteotomy, fracture or revision',
    kind: 'after_surgery',
    phases: ['protect', 'restore_movement', 'restore_capacity', 'maintain'],
    specialistOnly: true,
    note: 'Weight-bearing, bracing, loaded flexion and healing restrictions need a specialist programme.',
  },
];

export const pathwayOf = (id?: string): Pathway | undefined =>
  PATHWAYS.find((p) => p.id === id);

export const pathwaysFor = (joint: JointKind): Pathway[] =>
  PATHWAYS.filter((p) => p.joint === joint);
