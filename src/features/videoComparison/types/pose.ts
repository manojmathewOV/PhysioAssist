/**
 * Pose types used by the video-comparison error detectors
 * (errorDetection/elbowErrors.ts, kneeErrors.ts, shoulderErrors.ts).
 *
 * Keypoints follow the MoveNet 17-keypoint index order, in image pixel
 * coordinates, each with its own detection confidence (0-1).
 */

export interface KeyPoint {
  x: number;
  y: number;
  /** Detection confidence for this keypoint (0-1) */
  confidence: number;
}

export interface PoseFrame {
  /** Frame timestamp in milliseconds */
  timestamp: number;
  /** MoveNet-ordered keypoints (17 entries) */
  keypoints: KeyPoint[];
  /** Overall pose confidence (0-1) */
  confidence: number;
}
