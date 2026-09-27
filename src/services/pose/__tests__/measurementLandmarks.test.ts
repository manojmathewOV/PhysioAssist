import {
  getMeasurementLandmarks,
  getOutOfPlaneJoints,
  getOutOfPlaneSegments,
} from '../measurementLandmarks';
import { findLandmark } from '../landmarkLookup';
import { goniometerService } from '../../goniometerService';
import type { PoseLandmark } from '../../../types/pose';

const NAMES: Record<number, string> = {
  11: 'left_shoulder',
  13: 'left_elbow',
  15: 'left_wrist',
  23: 'left_hip',
  25: 'left_knee',
  27: 'left_ankle',
};

const pose33 = (overrides: Record<number, Partial<PoseLandmark>> = {}): PoseLandmark[] =>
  Array.from({ length: 33 }, (_, index) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
    index,
    name: NAMES[index] ?? `landmark_${index}`,
    ...overrides[index],
  }));

describe('getMeasurementLandmarks', () => {
  it('returns the same array when no correction is needed', () => {
    const landmarks = pose33();
    expect(getMeasurementLandmarks({ landmarks })).toBe(landmarks);
  });

  it('rescales x by the aspect ratio and drops relative z', () => {
    const landmarks = pose33({ 13: { x: 0.4, z: -0.3 } });
    const measured = getMeasurementLandmarks({
      landmarks,
      aspectRatio: 0.75,
      zIsRelative: true,
    });
    expect(measured[13].x).toBeCloseTo(0.3);
    expect(measured[13].z).toBeUndefined();
    expect(landmarks[13].x).toBe(0.4); // input untouched
  });

  it('keeps exact depth when z is not relative', () => {
    const landmarks = pose33({ 13: { z: 0.2 } });
    expect(getMeasurementLandmarks({ landmarks, aspectRatio: 2 })[13].z).toBe(0.2);
  });

  it('memoizes per landmark array', () => {
    const pose = { landmarks: pose33(), aspectRatio: 0.5 };
    expect(getMeasurementLandmarks(pose)).toBe(getMeasurementLandmarks(pose));
  });

  it('corrects the angle skew of non-square frames', () => {
    // 480x640 portrait frame: upper arm straight up (120px), forearm 120px right and
    // 120px down, a true 135° elbow. Raw normalized coords give 126.9°.
    const landmarks = pose33({
      11: { x: 0.5, y: 0.3125 },
      13: { x: 0.5, y: 0.5 },
      15: { x: 0.75, y: 0.6875 },
    });
    const pose = { landmarks, aspectRatio: 480 / 640, zIsRelative: true };
    const m = getMeasurementLandmarks(pose);
    const at = (name: string) => findLandmark(m, name)!;
    const angle = goniometerService.calculateAngle(
      at('left_shoulder'),
      at('left_elbow'),
      at('left_wrist'),
      'aspect_test'
    ).angle;
    expect(angle).toBeCloseTo(135, 0);
  });
});

describe('out-of-plane detection', () => {
  it('flags segments tilted toward the camera, and the joints using them', () => {
    const world = pose33({
      11: { x: 0, y: -0.4, z: 0 },
      13: { x: 0, y: -0.1, z: 0 }, // upper arm in the image plane
      15: { x: 0.05, y: -0.1, z: -0.25 }, // forearm pointing at the camera
      23: { x: 0, y: 0, z: 0 },
      25: { x: 0, y: 0.4, z: 0.05 },
      27: { x: 0, y: 0.8, z: 0.05 },
    });
    expect(getOutOfPlaneSegments({ worldLandmarks: world })).toEqual(
      new Set(['left_forearm'])
    );
    const joints = getOutOfPlaneJoints({ worldLandmarks: world });
    expect(joints.has('left_elbow')).toBe(true);
    expect(joints.has('left_knee')).toBe(false);
  });

  it('returns nothing without world landmarks', () => {
    expect(getOutOfPlaneJoints({}).size).toBe(0);
  });
});
