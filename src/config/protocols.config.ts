/**
 * Clinical Assessment Protocols Configuration
 *
 * Defines pre-configured assessment protocols for common clinical scenarios.
 * Therapists can:
 * - Use built-in protocols
 * - Create custom protocols
 * - Share protocols via QR codes/deep links
 * - Track patient progress through protocols
 *
 * Example protocols:
 * - Post Rotator Cuff Surgery (Week 1-12)
 * - ACL Reconstruction Recovery
 * - Total Knee Replacement
 * - General Shoulder Assessment
 */

import { MovementType, JointType } from './movements.config';

export interface ProtocolStep {
  /** Step number in protocol */
  order: number;

  /** Movement to perform */
  movementId: string;

  /** Whether this step is required or optional */
  required: boolean;

  /** Additional instructions for this step */
  instructions?: string;

  /** Expected/target values */
  targets?: {
    minAngle?: number;
    maxAngle?: number;
    quality?: 'good' | 'fair' | 'any';
  };

  /** Prerequisites before this step can be performed */
  prerequisites?: string[];
}

export interface AssessmentProtocol {
  /** Unique protocol ID */
  id: string;

  /** Display name */
  name: string;

  /** Detailed description */
  description: string;

  /** Clinical category */
  category: 'post-surgery' | 'injury-recovery' | 'general' | 'research' | 'custom';

  /** Target patient population */
  targetPopulation?: string;

  /** Medical conditions this applies to */
  conditions?: string[];

  /** Recovery timeline (if applicable) */
  timeframe?: {
    week?: number;
    phase?: string;
  };

  /** Ordered list of assessment steps */
  steps: ProtocolStep[];

  /** Estimated time to complete (minutes) */
  estimatedDuration: number;

  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  /** Whether bilateral comparison is required */
  requiresBilateralComparison: boolean;

  /** Author/creator information */
  author?: {
    name: string;
    credentials?: string;
    institution?: string;
  };

  /** Tags for filtering */
  tags: string[];

  /** Creation date */
  createdAt: string;

  /** Last updated */
  updatedAt: string;
}

// ============================================
// BUILT-IN PROTOCOLS
// ============================================

export const PROTOCOL_REGISTRY: AssessmentProtocol[] = [
  // 1. Post Rotator Cuff Surgery - Week 1
  {
    id: 'rotator_cuff_week1',
    name: 'Post Rotator Cuff Surgery - Week 1',
    description:
      'Initial ROM assessment following rotator cuff repair. Focus on passive ROM only.',
    category: 'post-surgery',
    targetPopulation: 'Adults 40-70 recovering from rotator cuff repair',
    conditions: [
      'Rotator cuff tear repair',
      'Supraspinatus repair',
      'Infraspinatus repair',
    ],
    timeframe: {
      week: 1,
      phase: 'Passive ROM Phase',
    },
    steps: [
      {
        order: 1,
        movementId: 'shoulder_flexion',
        required: true,
        instructions: 'Therapist-assisted only. Do NOT attempt active lifting.',
        targets: {
          minAngle: 0,
          maxAngle: 90, // Limited ROM in week 1
        },
      },
      {
        order: 2,
        movementId: 'shoulder_abduction',
        required: true,
        instructions: 'Therapist-assisted only. Keep under 60° in week 1.',
        targets: {
          maxAngle: 60,
        },
      },
      {
        order: 3,
        movementId: 'shoulder_external_rotation',
        required: false,
        instructions: 'Only if comfortable. Elbow at side.',
        targets: {
          maxAngle: 30,
        },
      },
    ],
    estimatedDuration: 15,
    difficulty: 'beginner',
    requiresBilateralComparison: true,
    author: {
      name: 'PhysioAssist Clinical Team',
      credentials: 'PT, DPT',
    },
    tags: ['shoulder', 'post-surgery', 'rotator-cuff', 'passive-rom'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },

  // 2. Post Rotator Cuff Surgery - Week 6
  {
    id: 'rotator_cuff_week6',
    name: 'Post Rotator Cuff Surgery - Week 6',
    description: 'Progressive ROM assessment. Beginning active-assisted movements.',
    category: 'post-surgery',
    targetPopulation: 'Adults 40-70 recovering from rotator cuff repair',
    conditions: ['Rotator cuff tear repair'],
    timeframe: {
      week: 6,
      phase: 'Active-Assisted ROM Phase',
    },
    steps: [
      {
        order: 1,
        movementId: 'shoulder_flexion',
        required: true,
        instructions: 'Active-assisted movement. Goal: 140°+',
        targets: {
          minAngle: 120,
          maxAngle: 160,
        },
      },
      {
        order: 2,
        movementId: 'shoulder_abduction',
        required: true,
        instructions: 'Active-assisted movement. Goal: 120°+',
        targets: {
          minAngle: 100,
          maxAngle: 140,
        },
      },
      {
        order: 3,
        movementId: 'shoulder_external_rotation',
        required: true,
        instructions: 'Active movement now permitted.',
        targets: {
          minAngle: 45,
          maxAngle: 70,
        },
      },
      {
        order: 4,
        movementId: 'shoulder_internal_rotation',
        required: true,
        instructions: 'Gentle internal rotation.',
        targets: {
          minAngle: 40,
          maxAngle: 60,
        },
      },
    ],
    estimatedDuration: 20,
    difficulty: 'intermediate',
    requiresBilateralComparison: true,
    author: {
      name: 'PhysioAssist Clinical Team',
      credentials: 'PT, DPT',
    },
    tags: ['shoulder', 'post-surgery', 'rotator-cuff', 'active-assisted'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },

  // 3. ACL Reconstruction - Week 2
  {
    id: 'acl_week2',
    name: 'ACL Reconstruction - Week 2',
    description:
      'Early knee ROM assessment post-ACL reconstruction. Focus on extension and gentle flexion.',
    category: 'post-surgery',
    targetPopulation: 'Athletes and active adults post-ACL reconstruction',
    conditions: ['ACL reconstruction', 'ACL tear repair'],
    timeframe: {
      week: 2,
      phase: 'Early ROM Phase',
    },
    steps: [
      {
        order: 1,
        movementId: 'knee_extension',
        required: true,
        instructions: 'Full extension is critical. Use bolster if needed.',
        targets: {
          minAngle: -5, // Slight hyperextension OK
          maxAngle: 0,
        },
      },
      {
        order: 2,
        movementId: 'knee_flexion',
        required: true,
        instructions: 'Gentle flexion. Do NOT force beyond pain-free range.',
        targets: {
          minAngle: 0,
          maxAngle: 90,
        },
      },
    ],
    estimatedDuration: 10,
    difficulty: 'beginner',
    requiresBilateralComparison: true,
    author: {
      name: 'PhysioAssist Clinical Team',
      credentials: 'PT, DPT, SCS',
    },
    tags: ['knee', 'post-surgery', 'acl', 'early-recovery'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },

  // 4. General Shoulder Assessment
  {
    id: 'general_shoulder_full',
    name: 'General Shoulder Assessment',
    description: 'Comprehensive shoulder ROM assessment for all planes of movement.',
    category: 'general',
    targetPopulation: 'All adults',
    conditions: ['Shoulder pain', 'Shoulder stiffness', 'General assessment'],
    steps: [
      {
        order: 1,
        movementId: 'shoulder_flexion',
        required: true,
        instructions: 'Full forward flexion.',
        targets: {
          minAngle: 150,
        },
      },
      {
        order: 2,
        movementId: 'shoulder_abduction',
        required: true,
        instructions: 'Full abduction.',
        targets: {
          minAngle: 150,
        },
      },
      {
        order: 3,
        movementId: 'shoulder_external_rotation',
        required: true,
        instructions: 'External rotation at 90° abduction.',
        targets: {
          minAngle: 80,
        },
      },
      {
        order: 4,
        movementId: 'shoulder_internal_rotation',
        required: true,
        instructions: 'Internal rotation at 90° abduction.',
        targets: {
          minAngle: 60,
        },
      },
    ],
    estimatedDuration: 15,
    difficulty: 'intermediate',
    requiresBilateralComparison: true,
    tags: ['shoulder', 'general', 'comprehensive'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },

  // 5. Elbow Quick Screen
  {
    id: 'elbow_quick_screen',
    name: 'Elbow Quick Screen',
    description: 'Quick bilateral elbow flexion/extension assessment.',
    category: 'general',
    targetPopulation: 'All adults',
    conditions: ['Elbow pain', 'Tennis elbow', 'Golfer elbow', 'General assessment'],
    steps: [
      {
        order: 1,
        movementId: 'elbow_flexion',
        required: true,
        instructions: 'Full flexion - bring hand to shoulder.',
        targets: {
          minAngle: 140,
        },
      },
      {
        order: 2,
        movementId: 'elbow_extension',
        required: true,
        instructions: 'Full extension - straighten arm completely.',
        targets: {
          maxAngle: 5,
        },
      },
    ],
    estimatedDuration: 5,
    difficulty: 'beginner',
    requiresBilateralComparison: true,
    tags: ['elbow', 'quick-screen', 'general'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },

  // 6. Total Knee Replacement - Week 4
  {
    id: 'tkr_week4',
    name: 'Total Knee Replacement - Week 4',
    description:
      'Post-TKR ROM goals at 4 weeks. Focus on achieving 0° extension and 90°+ flexion.',
    category: 'post-surgery',
    targetPopulation: 'Adults 60+ post total knee replacement',
    conditions: ['Total knee replacement', 'TKR', 'TKA'],
    timeframe: {
      week: 4,
      phase: 'Progressive ROM Phase',
    },
    steps: [
      {
        order: 1,
        movementId: 'knee_extension',
        required: true,
        instructions: 'Full extension is critical for gait. Use prone hangs if needed.',
        targets: {
          minAngle: -2,
          maxAngle: 0,
        },
      },
      {
        order: 2,
        movementId: 'knee_flexion',
        required: true,
        instructions: 'Goal: 90° by week 4. Gentle overpressure if pain-free.',
        targets: {
          minAngle: 90,
          maxAngle: 110,
        },
      },
    ],
    estimatedDuration: 10,
    difficulty: 'intermediate',
    requiresBilateralComparison: false, // Often only one knee replaced
    author: {
      name: 'PhysioAssist Clinical Team',
      credentials: 'PT, DPT, OCS',
    },
    tags: ['knee', 'post-surgery', 'tkr', 'tka'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

// ============================================
// PROTOCOL MANAGER CLASS
// ============================================

export class ProtocolManager {
  /**
   * Get protocol by ID
   */
  static getProtocol(id: string): AssessmentProtocol | undefined {
    return PROTOCOL_REGISTRY.find((p) => p.id === id);
  }

  /**
   * Get all protocols for a specific joint
   */
  static getProtocolsByJoint(joint: JointType): AssessmentProtocol[] {
    return PROTOCOL_REGISTRY.filter((protocol) =>
      protocol.steps.some((step) => step.movementId.startsWith(joint))
    );
  }

  /**
   * Get protocols by category
   */
  static getProtocolsByCategory(
    category: AssessmentProtocol['category']
  ): AssessmentProtocol[] {
    return PROTOCOL_REGISTRY.filter((p) => p.category === category);
  }

  /**
   * Get protocols by tag
   */
  static getProtocolsByTag(tag: string): AssessmentProtocol[] {
    return PROTOCOL_REGISTRY.filter((p) => p.tags.includes(tag));
  }

  /**
   * Search protocols by name or description
   */
  static searchProtocols(query: string): AssessmentProtocol[] {
    const lowerQuery = query.toLowerCase();
    return PROTOCOL_REGISTRY.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get all post-surgery protocols for a specific week
   */
  static getPostSurgeryProtocolsByWeek(week: number): AssessmentProtocol[] {
    return PROTOCOL_REGISTRY.filter(
      (p) => p.category === 'post-surgery' && p.timeframe?.week === week
    );
  }

  /**
   * Get protocol steps in order
   */
  static getProtocolSteps(protocolId: string): ProtocolStep[] {
    const protocol = this.getProtocol(protocolId);
    if (!protocol) return [];
    return protocol.steps.sort((a, b) => a.order - b.order);
  }

  /**
   * Get total number of required steps in protocol
   */
  static getRequiredStepsCount(protocolId: string): number {
    const protocol = this.getProtocol(protocolId);
    if (!protocol) return 0;
    return protocol.steps.filter((s) => s.required).length;
  }

  /**
   * Get all unique tags across all protocols
   */
  static getAllTags(): string[] {
    const tagsSet = new Set<string>();
    PROTOCOL_REGISTRY.forEach((p) => {
      p.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  /**
   * Generate shareable protocol link
   */
  static generateProtocolLink(protocolId: string): string {
    return `physioassist://protocol/${protocolId}`;
  }

  /**
   * Generate QR code data for protocol
   */
  static generateQRCodeData(protocolId: string): string {
    const protocol = this.getProtocol(protocolId);
    if (!protocol) return '';

    return JSON.stringify({
      type: 'protocol',
      id: protocolId,
      name: protocol.name,
      link: this.generateProtocolLink(protocolId),
    });
  }
}
