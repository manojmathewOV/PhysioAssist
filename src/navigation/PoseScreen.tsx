/**
 * Pose detection tab screen for iOS/Android (VisionCamera + MoveNet).
 * PoseScreen.web.tsx is picked instead by webpack, so web never bundles the
 * native camera stack and native never bundles MediaPipe.
 */
export { default } from '../screens/PoseDetectionScreen';
