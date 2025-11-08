/**
 * Smoke tests for MediaPipe Pose
 * Validates that MediaPipe Pose can be imported and instantiated
 */

import { Pose } from '@mediapipe/pose';

describe('MediaPipe Pose Smoke Tests', () => {
  it('should import Pose class successfully', () => {
    expect(Pose).toBeDefined();
  });

  it('should be able to instantiate Pose', () => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    expect(pose).toBeDefined();
    expect(pose.setOptions).toBeDefined();
    expect(pose.onResults).toBeDefined();
    expect(pose.send).toBeDefined();
    expect(pose.close).toBeDefined();
  });

  it('should be able to set options', () => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    expect(() => {
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }).not.toThrow();

    pose.close();
  });

  it('should be able to register results callback', () => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    const mockCallback = jest.fn();

    expect(() => {
      pose.onResults(mockCallback);
    }).not.toThrow();

    pose.close();
  });

  it('should have correct method signatures', () => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    expect(typeof pose.setOptions).toBe('function');
    expect(typeof pose.onResults).toBe('function');
    expect(typeof pose.send).toBe('function');
    expect(typeof pose.close).toBe('function');

    pose.close();
  });
});
