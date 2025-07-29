export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseFrame {
  timestamp: number;
  landmarks: PoseLandmark[];
  visibility: number[];
  angles?: Record<string, number>;
}

export interface YouTubeVideoInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
  author: string;
}

export interface AngleDeviation {
  joint: string;
  referenceAngle: number;
  userAngle: number;
  deviation: number;
  severity: 'good' | 'warning' | 'critical';
}

export interface TemporalAlignment {
  offset: number;
  confidence: number;
  speedRatio: number;
  phaseAlignment: number;
}

export interface Recommendation {
  type: 'angle' | 'tempo' | 'range' | 'stability';
  priority: 'low' | 'medium' | 'high';
  message: string;
  detail: string;
}

export interface ComparisonResult {
  overallScore: number;
  angleDeviations: AngleDeviation[];
  temporalAlignment: TemporalAlignment;
  recommendations: Recommendation[];
}

export interface VideoComparisonState {
  isLoading: boolean;
  error: string | null;
  referenceVideo: YouTubeVideoInfo | null;
  userPoses: PoseFrame[];
  referencePoses: PoseFrame[];
  comparisonResult: ComparisonResult | null;
  syncOffset: number;
  isPlaying: boolean;
}

export enum VideoComparisonError {
  INVALID_URL = 'Invalid YouTube URL',
  NETWORK_ERROR = 'Network connection failed',
  VIDEO_TOO_LONG = 'Video exceeds 10 minute limit',
  PROCESSING_FAILED = 'Failed to process video',
  INSUFFICIENT_STORAGE = 'Not enough storage space',
  POSE_EXTRACTION_FAILED = 'Failed to extract poses from video'
}