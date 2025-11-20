import { Vector3D } from './common';

/**
 * ISB-compliant 3D anatomical reference frame
 * Based on International Society of Biomechanics (ISB) standards
 *
 * Reference: Wu et al. (2005) - ISB recommendation on definitions of joint coordinate systems
 * Standard: X-anterior, Y-superior, Z-lateral (right-handed coordinate system)
 */
export interface AnatomicalReferenceFrame {
  /** Origin point (typically joint center or segment midpoint) */
  origin: Vector3D;

  /** X-axis: Anterior direction (forward) */
  xAxis: Vector3D;

  /** Y-axis: Superior direction (upward) */
  yAxis: Vector3D;

  /** Z-axis: Lateral direction (right for global, segment-specific for local) */
  zAxis: Vector3D;

  /** Frame type for documentation and validation */
  frameType: 'global' | 'thorax' | 'scapula' | 'humerus' | 'forearm' | 'pelvis';

  /** Confidence in frame accuracy (0-1) based on landmark visibility */
  confidence: number;
}

/**
 * Anatomical plane in 3D space
 * Planes divide the body into sections for angle measurement
 */
export interface AnatomicalPlane {
  /** Plane name following anatomical conventions */
  name: 'sagittal' | 'coronal' | 'transverse' | 'scapular';

  /** Normal vector perpendicular to the plane */
  normal: Vector3D;

  /** Point on the plane (typically joint center) */
  point: Vector3D;

  /** Rotation from canonical plane in degrees (e.g., scapular plane is ~35° from coronal) */
  rotation?: number;
}

/**
 * Joint measurement with full anatomical context
 * Captures primary joint angle, secondary joint positions, and compensation patterns
 */
export interface ClinicalJointMeasurement {
  /** Primary joint being measured */
  primaryJoint: {
    name: string;
    type: 'shoulder' | 'elbow' | 'knee' | 'hip' | 'ankle';
    angle: number;
    angleType: 'flexion' | 'extension' | 'abduction' | 'adduction' | 'rotation';

    /** For shoulder: separate glenohumeral and scapulothoracic contributions */
    components?: {
      glenohumeral?: number;
      scapulothoracic?: number;
      ratio?: number; // Scapulohumeral rhythm (typically 2.86:1 to 3.13:1)
    };
  };

  /** Secondary joints tracked for context and compensation detection */
  secondaryJoints: Record<
    string,
    {
      angle: number;
      purpose: 'reference' | 'compensation_check' | 'validation';
      deviation?: number; // Deviation from expected neutral position
      warning?: string; // Clinical warning if compensation detected
    }
  >;

  /** Reference frames used in measurement */
  referenceFrames: {
    global: AnatomicalReferenceFrame;
    local: AnatomicalReferenceFrame;
    measurementPlane: AnatomicalPlane;
  };

  /** Detected compensation patterns */
  compensations: CompensationPattern[];

  /** Overall measurement quality assessment */
  quality: MeasurementQuality;
}

/**
 * Compensation pattern detected during movement
 * Indicates when patient uses alternative movement strategies
 */
export interface CompensationPattern {
  /** Type of compensation strategy */
  type:
    | 'trunk_lean' // Leaning trunk to gain ROM
    | 'trunk_rotation' // Rotating trunk instead of joint
    | 'shoulder_hiking' // Elevating shoulder girdle
    | 'elbow_flexion' // Flexing elbow during shoulder movement
    | 'hip_hike' // Hiking hip during lower extremity movement
    | 'contralateral_lean'; // Leaning away from movement side

  /** Severity classification for clinical reporting */
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';

  /** Numerical magnitude (degrees or normalized units) */
  magnitude: number;

  /** Which joint is being compensated for */
  affectsJoint: string;

  /** Clinical interpretation for therapist */
  clinicalNote: string;
}

/**
 * Quality metrics for pose measurement reliability
 * Used to flag low-quality measurements for clinical review
 */
export interface MeasurementQuality {
  /** Reliability of depth data (0-1): 1 = real depth sensor, <1 = estimated */
  depthReliability: number;

  /** Average landmark visibility/confidence (0-1) */
  landmarkVisibility: number;

  /** Frame-to-frame stability (0-1): higher = less jitter */
  frameStability: number;

  /** Overall quality assessment */
  overall: 'excellent' | 'good' | 'fair' | 'poor';
}
