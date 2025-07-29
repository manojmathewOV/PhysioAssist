import { PoseLandmark } from '@types/pose';

/**
 * Calculate overall confidence score from landmarks
 */
export const calculateConfidenceScore = (landmarks: any[]): number => {
  if (!landmarks || landmarks.length === 0) return 0;

  const totalVisibility = landmarks.reduce(
    (sum, landmark) => sum + (landmark.visibility || 0),
    0
  );

  return totalVisibility / landmarks.length;
};

/**
 * Check if key body parts are visible for exercise tracking
 */
export const areKeyLandmarksVisible = (
  landmarks: PoseLandmark[],
  requiredLandmarks: number[],
  minVisibility: number = 0.5
): boolean => {
  return requiredLandmarks.every(
    (index) => landmarks[index] && landmarks[index].visibility >= minVisibility
  );
};

/**
 * Calculate distance between two landmarks
 */
export const calculateDistance = (
  landmark1: PoseLandmark,
  landmark2: PoseLandmark
): number => {
  const dx = landmark2.x - landmark1.x;
  const dy = landmark2.y - landmark1.y;
  const dz = (landmark2.z || 0) - (landmark1.z || 0);

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Normalize pose landmarks to account for different body sizes
 */
export const normalizePose = (landmarks: PoseLandmark[]): PoseLandmark[] => {
  // Use shoulder distance as reference
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftShoulder || !rightShoulder) return landmarks;

  const shoulderDistance = calculateDistance(leftShoulder, rightShoulder);
  if (shoulderDistance === 0) return landmarks;

  // Calculate center point
  const centerX = (leftShoulder.x + rightShoulder.x) / 2;
  const centerY = (leftShoulder.y + rightShoulder.y) / 2;

  // Normalize all landmarks relative to shoulder distance and center
  return landmarks.map((landmark) => ({
    ...landmark,
    x: (landmark.x - centerX) / shoulderDistance,
    y: (landmark.y - centerY) / shoulderDistance,
    z: landmark.z ? landmark.z / shoulderDistance : 0,
  }));
};

/**
 * Check if pose is stable (not moving too much)
 */
export const isPoseStable = (
  currentLandmarks: PoseLandmark[],
  previousLandmarks: PoseLandmark[],
  threshold: number = 0.02
): boolean => {
  if (!previousLandmarks || previousLandmarks.length === 0) return false;

  let totalMovement = 0;
  let validComparisons = 0;

  for (let i = 0; i < currentLandmarks.length; i++) {
    const current = currentLandmarks[i];
    const previous = previousLandmarks[i];

    if (current && previous && current.visibility > 0.5 && previous.visibility > 0.5) {
      const movement = calculateDistance(current, previous);
      totalMovement += movement;
      validComparisons++;
    }
  }

  if (validComparisons === 0) return false;

  const averageMovement = totalMovement / validComparisons;
  return averageMovement < threshold;
};

/**
 * Get bounding box for visible landmarks
 */
export const getPoseBoundingBox = (
  landmarks: PoseLandmark[]
): { x: number; y: number; width: number; height: number } | null => {
  const visibleLandmarks = landmarks.filter((l) => l.visibility > 0.5);

  if (visibleLandmarks.length === 0) return null;

  const xs = visibleLandmarks.map((l) => l.x);
  const ys = visibleLandmarks.map((l) => l.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Mirror pose landmarks horizontally (for front camera)
 */
export const mirrorPose = (landmarks: PoseLandmark[]): PoseLandmark[] => {
  return landmarks.map((landmark) => ({
    ...landmark,
    x: 1 - landmark.x,
  }));
};

/**
 * Check if person is facing camera (based on shoulder/hip alignment)
 */
export const isFacingCamera = (landmarks: PoseLandmark[]): boolean => {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return false;
  }

  // Check if shoulders and hips are roughly horizontal
  const shoulderAngle = Math.abs(leftShoulder.y - rightShoulder.y);
  const hipAngle = Math.abs(leftHip.y - rightHip.y);

  const maxAngle = 0.1; // Allow 10% deviation
  return shoulderAngle < maxAngle && hipAngle < maxAngle;
};