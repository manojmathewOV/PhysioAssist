/**
 * Movement Registry Configuration
 *
 * Central source of truth for ALL movement definitions.
 * Makes system modular - easy to add new movements without code changes.
 *
 * Based on November 2025 standards:
 * - Data-driven (not hardcoded in components)
 * - Multi-language support
 * - Multiple demo formats
 * - Extensible for therapist customization
 */

export type JointType = 'shoulder' | 'elbow' | 'knee' | 'hip' | 'wrist' | 'ankle' | 'spine' | 'neck';
export type MovementType =
  | 'flexion'
  | 'extension'
  | 'abduction'
  | 'adduction'
  | 'external_rotation'
  | 'internal_rotation'
  | 'scaption'
  | 'horizontal_abduction'
  | 'horizontal_adduction';

export type DemoFormat = '2d-svg' | '3d-model' | 'video' | 'live-stream';
export type InterfaceMode = 'simple' | 'advanced';

export interface MovementDefinition {
  // Identification
  id: string;
  joint: JointType;
  type: MovementType;

  // Display Names (multi-mode)
  displayName: {
    simple: string;      // Layman terms
    advanced: string;    // Clinical terms
  };

  // Descriptions
  description: {
    simple: string;      // "Raise your arm straight in front"
    advanced: string;    // "Glenohumeral flexion in sagittal plane"
  };

  // Clinical Parameters
  targetAngle: number;
  normalRange: {
    min: number;
    max: number;
  };
  measurementFunction: string;  // Name of function in ClinicalMeasurementService

  // Visual Assets
  demos: {
    svg?: string;          // Component name for SVG animation
    video?: string;        // Path to video file
    '3d'?: string;         // Path to 3D model (.glb)
    thumbnail?: string;    // Preview image
  };

  icon: string;            // Emoji or icon identifier

  // Applicability
  sides: ('left' | 'right' | 'bilateral')[];

  // Related Information
  secondaryJoints?: string[];
  tips: {
    simple: string[];
    advanced: string[];
  };
  contraindications?: string[];

  // Difficulty & Prerequisites
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];  // Movement IDs that should be done first

  // Customization
  customizable: boolean;     // Can therapist modify targets?
  tags?: string[];           // For filtering: 'post-surgery', 'sports', etc.
}

/**
 * Movement Registry
 *
 * Current: 10 movements
 * Future: 60+ movements
 */
export const MOVEMENT_REGISTRY: MovementDefinition[] = [
  // ============================================================================
  // SHOULDER MOVEMENTS (4)
  // ============================================================================
  {
    id: 'shoulder_flexion',
    joint: 'shoulder',
    type: 'flexion',
    displayName: {
      simple: 'Lift Forward',
      advanced: 'Forward Flexion',
    },
    description: {
      simple: 'Raise your arm straight in front of you',
      advanced: 'Glenohumeral flexion in the sagittal plane with elbow extended',
    },
    targetAngle: 160,
    normalRange: { min: 150, max: 180 },
    measurementFunction: 'measureShoulderFlexion',
    demos: {
      svg: 'ShoulderFlexionAnimation',
      video: '/demos/videos/shoulder_flexion_hd.mp4',
      '3d': '/demos/3d/shoulder_flexion.glb',
      thumbnail: '/demos/thumbnails/shoulder_flexion.jpg',
    },
    icon: '⬆️',
    sides: ['left', 'right'],
    secondaryJoints: ['elbow'],
    tips: {
      simple: [
        'Keep your elbow straight',
        'Move slowly and smoothly',
        'Go as high as comfortable',
        'Stop if you feel pain',
      ],
      advanced: [
        'Maintain elbow extension (>170°)',
        'Avoid trunk compensation',
        'Monitor scapular rhythm',
        'Assess for impingement signs',
      ],
    },
    contraindications: [
      'Acute shoulder pain',
      'Recent rotator cuff surgery (<6 weeks)',
      'Anterior shoulder dislocation',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'post-surgery'],
  },

  {
    id: 'shoulder_abduction',
    joint: 'shoulder',
    type: 'abduction',
    displayName: {
      simple: 'Lift to Side',
      advanced: 'Abduction',
    },
    description: {
      simple: 'Raise your arm out to the side',
      advanced: 'Glenohumeral abduction in the coronal plane',
    },
    targetAngle: 160,
    normalRange: { min: 150, max: 180 },
    measurementFunction: 'measureShoulderAbduction',
    demos: {
      svg: 'ShoulderAbductionAnimation',
      video: '/demos/videos/shoulder_abduction_hd.mp4',
      '3d': '/demos/3d/shoulder_abduction.glb',
      thumbnail: '/demos/thumbnails/shoulder_abduction.jpg',
    },
    icon: '↗️',
    sides: ['left', 'right'],
    secondaryJoints: ['elbow'],
    tips: {
      simple: [
        'Keep your palm facing down',
        'Keep your elbow straight',
        'Lift straight to the side',
        'Stop if you feel pain',
      ],
      advanced: [
        'Monitor scapulohumeral rhythm (2:1 ratio)',
        'Assess for superior migration',
        'Check for impingement at 90°',
        'Evaluate scapular dyskinesia',
      ],
    },
    contraindications: [
      'Subacromial impingement',
      'Recent shoulder surgery',
      'Acute pain with abduction',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'impingement-test'],
  },

  {
    id: 'shoulder_external_rotation',
    joint: 'shoulder',
    type: 'external_rotation',
    displayName: {
      simple: 'Turn Out',
      advanced: 'External Rotation',
    },
    description: {
      simple: 'Rotate your arm outward with elbow bent at 90°',
      advanced: 'External rotation at 0° abduction with elbow flexed to 90°',
    },
    targetAngle: 90,
    normalRange: { min: 80, max: 100 },
    measurementFunction: 'measureShoulderRotation',
    demos: {
      svg: 'ShoulderExternalRotationAnimation',
      video: '/demos/videos/shoulder_external_rotation_hd.mp4',
      '3d': '/demos/3d/shoulder_external_rotation.glb',
      thumbnail: '/demos/thumbnails/shoulder_external_rotation.jpg',
    },
    icon: '🔄',
    sides: ['left', 'right'],
    secondaryJoints: ['elbow'],
    tips: {
      simple: [
        'Keep your elbow at your side',
        'Keep elbow bent at 90°',
        'Only rotate your forearm',
        'Stop if you feel pain',
      ],
      advanced: [
        'Maintain elbow flexion at 90° ±10°',
        'Prevent shoulder abduction',
        'Assess capsular restriction',
        'Monitor for anterior translation',
      ],
    },
    contraindications: [
      'Anterior shoulder instability',
      'Recent capsulorrhaphy',
      'Acute posterior capsule pain',
    ],
    difficulty: 'intermediate',
    customizable: true,
    tags: ['rotator-cuff', 'rom', 'instability-test'],
  },

  {
    id: 'shoulder_internal_rotation',
    joint: 'shoulder',
    type: 'internal_rotation',
    displayName: {
      simple: 'Turn In',
      advanced: 'Internal Rotation',
    },
    description: {
      simple: 'Rotate your arm inward with elbow bent at 90°',
      advanced: 'Internal rotation at 0° abduction with elbow flexed to 90°',
    },
    targetAngle: 70,
    normalRange: { min: 60, max: 80 },
    measurementFunction: 'measureShoulderRotation',
    demos: {
      svg: 'ShoulderInternalRotationAnimation',
      video: '/demos/videos/shoulder_internal_rotation_hd.mp4',
      '3d': '/demos/3d/shoulder_internal_rotation.glb',
      thumbnail: '/demos/thumbnails/shoulder_internal_rotation.jpg',
    },
    icon: '↩️',
    sides: ['left', 'right'],
    secondaryJoints: ['elbow'],
    tips: {
      simple: [
        'Keep your elbow at your side',
        'Keep elbow bent at 90°',
        'Only rotate your forearm',
        'Stop if you feel pain',
      ],
      advanced: [
        'Maintain elbow flexion at 90° ±10°',
        'Prevent shoulder abduction',
        'Assess posterior capsule tightness',
        'Monitor scapular positioning',
      ],
    },
    contraindications: [
      'Posterior shoulder instability',
      'Acute anterior capsule pain',
    ],
    difficulty: 'intermediate',
    customizable: true,
    tags: ['rotator-cuff', 'rom', 'capsule-test'],
  },

  // ============================================================================
  // ELBOW MOVEMENTS (2)
  // ============================================================================
  {
    id: 'elbow_flexion',
    joint: 'elbow',
    type: 'flexion',
    displayName: {
      simple: 'Bend',
      advanced: 'Flexion',
    },
    description: {
      simple: 'Bring your hand toward your shoulder',
      advanced: 'Elbow flexion with forearm supination',
    },
    targetAngle: 150,
    normalRange: { min: 140, max: 160 },
    measurementFunction: 'measureElbowFlexion',
    demos: {
      svg: 'ElbowFlexionAnimation',
      video: '/demos/videos/elbow_flexion_hd.mp4',
      '3d': '/demos/3d/elbow_flexion.glb',
      thumbnail: '/demos/thumbnails/elbow_flexion.jpg',
    },
    icon: '💪',
    sides: ['left', 'right'],
    tips: {
      simple: [
        'Keep your upper arm still',
        'Keep your palm facing up',
        'Bend slowly',
        'Stop if you feel pain',
      ],
      advanced: [
        'Stabilize humerus',
        'Monitor for lateral elbow pain',
        'Assess end-feel (soft)',
        'Check biceps tendon integrity',
      ],
    },
    contraindications: [
      'Acute elbow fracture',
      'Recent elbow surgery',
      'Severe cubital tunnel syndrome',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'strength-indicator'],
  },

  {
    id: 'elbow_extension',
    joint: 'elbow',
    type: 'extension',
    displayName: {
      simple: 'Straighten',
      advanced: 'Extension',
    },
    description: {
      simple: 'Straighten your elbow completely',
      advanced: 'Full elbow extension to anatomical zero',
    },
    targetAngle: 0,
    normalRange: { min: -10, max: 5 },  // Some hyperextension is normal
    measurementFunction: 'measureElbowFlexion',
    demos: {
      svg: 'ElbowExtensionAnimation',
      video: '/demos/videos/elbow_extension_hd.mp4',
      '3d': '/demos/3d/elbow_extension.glb',
      thumbnail: '/demos/thumbnails/elbow_extension.jpg',
    },
    icon: '✋',
    sides: ['left', 'right'],
    tips: {
      simple: [
        'Keep your upper arm still',
        'Straighten completely',
        'Don\'t force it',
        'Stop if you feel pain',
      ],
      advanced: [
        'Assess for extension lag',
        'Monitor for triceps weakness',
        'Check for posterior impingement',
        'Evaluate joint effusion',
      ],
    },
    contraindications: [
      'Acute elbow effusion',
      'Posterior elbow pain',
      'Recent triceps repair',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'post-surgery'],
  },

  // ============================================================================
  // KNEE MOVEMENTS (2)
  // ============================================================================
  {
    id: 'knee_flexion',
    joint: 'knee',
    type: 'flexion',
    displayName: {
      simple: 'Bend',
      advanced: 'Flexion',
    },
    description: {
      simple: 'Bring your heel toward your bottom',
      advanced: 'Active knee flexion in prone or standing position',
    },
    targetAngle: 135,
    normalRange: { min: 130, max: 145 },
    measurementFunction: 'measureKneeFlexion',
    demos: {
      svg: 'KneeFlexionAnimation',
      video: '/demos/videos/knee_flexion_hd.mp4',
      '3d': '/demos/3d/knee_flexion.glb',
      thumbnail: '/demos/thumbnails/knee_flexion.jpg',
    },
    icon: '🦵',
    sides: ['left', 'right'],
    tips: {
      simple: [
        'Stand on one leg (hold wall if needed)',
        'Keep your thighs aligned',
        'Bend slowly',
        'Stop if you feel pain',
      ],
      advanced: [
        'Assess for capsular restriction',
        'Monitor patellar tracking',
        'Check for meniscal catch',
        'Evaluate hamstring flexibility',
      ],
    },
    contraindications: [
      'Acute knee effusion',
      'Recent ACL reconstruction (<3 months)',
      'Posterior knee pain',
      'Patellar subluxation',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'post-surgery', 'acl-protocol'],
  },

  {
    id: 'knee_extension',
    joint: 'knee',
    type: 'extension',
    displayName: {
      simple: 'Straighten',
      advanced: 'Extension',
    },
    description: {
      simple: 'Straighten your knee completely',
      advanced: 'Full knee extension to anatomical zero',
    },
    targetAngle: 0,
    normalRange: { min: -5, max: 5 },
    measurementFunction: 'measureKneeFlexion',
    demos: {
      svg: 'KneeExtensionAnimation',
      video: '/demos/videos/knee_extension_hd.mp4',
      '3d': '/demos/3d/knee_extension.glb',
      thumbnail: '/demos/thumbnails/knee_extension.jpg',
    },
    icon: '🦿',
    sides: ['left', 'right'],
    tips: {
      simple: [
        'Straighten your leg completely',
        'You can sit or lie down',
        'Don\'t force it',
        'Stop if you feel pain',
      ],
      advanced: [
        'Assess for extension lag',
        'Monitor quadriceps activation',
        'Check for anterior knee pain',
        'Evaluate patellar mobility',
      ],
    },
    contraindications: [
      'Acute knee effusion',
      'Anterior knee pain',
      'Recent patellar surgery',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'post-surgery', 'quad-strength'],
  },

  // ============================================================================
  // HIP MOVEMENTS (2)
  // ============================================================================
  {
    id: 'hip_flexion',
    joint: 'hip',
    type: 'flexion',
    displayName: {
      simple: 'Lift Forward',
      advanced: 'Flexion',
    },
    description: {
      simple: 'Lift your leg forward',
      advanced: 'Hip flexion with knee flexed to 90°',
    },
    targetAngle: 120,
    normalRange: { min: 110, max: 130 },
    measurementFunction: 'measureHipFlexion',
    demos: {
      svg: 'HipFlexionAnimation',
      video: '/demos/videos/hip_flexion_hd.mp4',
      '3d': '/demos/3d/hip_flexion.glb',
      thumbnail: '/demos/thumbnails/hip_flexion.jpg',
    },
    icon: '⬆️',
    sides: ['left', 'right'],
    tips: {
      simple: [
        'You can lie down or stand',
        'Lift your knee toward your chest',
        'Move slowly',
        'Stop if you feel pain',
      ],
      advanced: [
        'Stabilize contralateral hip',
        'Monitor lumbar compensation',
        'Assess for FAI symptoms',
        'Check psoas flexibility',
      ],
    },
    contraindications: [
      'Recent hip replacement (<6 weeks)',
      'Acute hip pain',
      'Anterior hip impingement',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'post-surgery', 'fai-test'],
  },

  {
    id: 'hip_abduction',
    joint: 'hip',
    type: 'abduction',
    displayName: {
      simple: 'Lift to Side',
      advanced: 'Abduction',
    },
    description: {
      simple: 'Lift your leg to the side',
      advanced: 'Hip abduction in the coronal plane',
    },
    targetAngle: 45,
    normalRange: { min: 40, max: 50 },
    measurementFunction: 'measureHipAbduction',
    demos: {
      svg: 'HipAbductionAnimation',
      video: '/demos/videos/hip_abduction_hd.mp4',
      '3d': '/demos/3d/hip_abduction.glb',
      thumbnail: '/demos/thumbnails/hip_abduction.jpg',
    },
    icon: '↗️',
    sides: ['left', 'right'],
    tips: {
      simple: [
        'You can lie on your side or stand',
        'Lift your leg out to the side',
        'Keep your toes pointing forward',
        'Stop if you feel pain',
      ],
      advanced: [
        'Prevent hip hiking',
        'Monitor for Trendelenburg sign',
        'Assess gluteus medius strength',
        'Check for IT band tightness',
      ],
    },
    contraindications: [
      'Recent hip replacement (<6 weeks)',
      'Acute lateral hip pain',
      'Greater trochanteric bursitis (acute)',
    ],
    difficulty: 'beginner',
    customizable: true,
    tags: ['basic', 'rom', 'strength-test', 'gait-analysis'],
  },
];

/**
 * Movement Registry Class
 * Provides helper methods for accessing movement definitions
 */
export class MovementRegistry {
  /**
   * Get movement by ID
   */
  static getMovement(id: string): MovementDefinition | undefined {
    return MOVEMENT_REGISTRY.find((m) => m.id === id);
  }

  /**
   * Get all movements for a joint
   */
  static getMovementsByJoint(joint: JointType, mode: InterfaceMode = 'simple'): MovementDefinition[] {
    return MOVEMENT_REGISTRY.filter((m) => m.joint === joint);
  }

  /**
   * Get movement display name based on interface mode
   */
  static getDisplayName(movementId: string, mode: InterfaceMode): string {
    const movement = this.getMovement(movementId);
    return movement ? movement.displayName[mode] : movementId;
  }

  /**
   * Get movement description based on interface mode
   */
  static getDescription(movementId: string, mode: InterfaceMode): string {
    const movement = this.getMovement(movementId);
    return movement ? movement.description[mode] : '';
  }

  /**
   * Get movements by tag
   */
  static getMovementsByTag(tag: string): MovementDefinition[] {
    return MOVEMENT_REGISTRY.filter((m) => m.tags?.includes(tag));
  }

  /**
   * Get movements by difficulty
   */
  static getMovementsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): MovementDefinition[] {
    return MOVEMENT_REGISTRY.filter((m) => m.difficulty === difficulty);
  }

  /**
   * Get all available joints
   */
  static getAllJoints(): JointType[] {
    const joints = new Set(MOVEMENT_REGISTRY.map((m) => m.joint));
    return Array.from(joints);
  }

  /**
   * Get total number of unique assessments
   */
  static getTotalAssessments(): number {
    return MOVEMENT_REGISTRY.reduce((total, movement) => {
      return total + movement.sides.length;
    }, 0);
  }

  /**
   * Validate movement configuration
   */
  static validate(movementId: string): { valid: boolean; errors: string[] } {
    const movement = this.getMovement(movementId);
    const errors: string[] = [];

    if (!movement) {
      return { valid: false, errors: ['Movement not found'] };
    }

    if (!movement.demos.svg && !movement.demos.video && !movement.demos['3d']) {
      errors.push('No demo available');
    }

    if (movement.targetAngle < movement.normalRange.min || movement.targetAngle > movement.normalRange.max) {
      errors.push('Target angle outside normal range');
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * Export for easy access
 */
export default MovementRegistry;
