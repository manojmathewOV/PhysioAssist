// Mock for @mediapipe/camera_utils
export class Camera {
  constructor(videoElement, options) {
    this.videoElement = videoElement;
    this.options = options;
  }

  start() {
    return Promise.resolve();
  }

  stop() {
    return Promise.resolve();
  }
}

export default Camera;
