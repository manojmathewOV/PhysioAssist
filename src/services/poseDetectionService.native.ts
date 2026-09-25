/**
 * Native (iOS/Android) entry point for pose detection.
 *
 * poseDetectionService.ts uses MediaPipe's browser build, which needs a DOM and
 * WebGL and cannot run inside React Native. Metro resolves this file instead on
 * native platforms, so native screens get the MoveNet TFLite service.
 */
export {
  PoseDetectionServiceV2 as PoseDetectionService,
  poseDetectionService,
} from './PoseDetectionService.v2';
