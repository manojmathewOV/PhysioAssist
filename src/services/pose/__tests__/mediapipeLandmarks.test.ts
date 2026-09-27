import {
  mediapipeResultToPoseData,
  MediaPipeLandmark,
  MediaPipePoseResultBundle,
} from '../mediapipeLandmarks';
import { goniometerService } from '../../goniometerService';

const makeLandmarks = (count: number, visibility = 0.9): MediaPipeLandmark[] =>
  Array.from({ length: count }, (_, i) => ({ x: i / 100, y: i / 200, z: 0, visibility }));

const bundle = (landmarks: MediaPipeLandmark[]): MediaPipePoseResultBundle => ({
  results: [{ landmarks: [landmarks], worldLandmarks: [landmarks] }],
  inferenceTime: 12,
});

describe('mediapipeResultToPoseData', () => {
  it('returns null when no pose was detected', () => {
    expect(
      mediapipeResultToPoseData({
        results: [{ landmarks: [], worldLandmarks: [] }],
        inferenceTime: 5,
      })
    ).toBeNull();
    expect(mediapipeResultToPoseData({ results: [], inferenceTime: 5 })).toBeNull();
  });

  it('converts 33 landmarks with MediaPipe names, schema id and depth info', () => {
    const pose = mediapipeResultToPoseData(bundle(makeLandmarks(33)), {
      timestamp: 1000,
    });

    expect(pose).not.toBeNull();
    expect(pose!.schemaId).toBe('mediapipe-33');
    expect(pose!.hasDepth).toBe(true);
    expect(pose!.timestamp).toBe(1000);
    expect(pose!.inferenceTime).toBe(12);
    expect(pose!.landmarks).toHaveLength(33);
    expect(pose!.landmarks[25]).toMatchObject({ index: 25, name: 'left_knee' });
    expect(pose!.landmarks[31]).toMatchObject({ index: 31, name: 'left_foot_index' });
    expect(pose!.confidence).toBeCloseTo(0.9);
  });

  it('falls back to presence when visibility is missing', () => {
    const landmarks = makeLandmarks(33).map(({ x, y, z }) => ({
      x,
      y,
      z,
      presence: 0.4,
    }));
    const pose = mediapipeResultToPoseData(bundle(landmarks));
    expect(pose!.landmarks[0].visibility).toBe(0.4);
  });

  it('maps points into view space when a mapper is given', () => {
    const pose = mediapipeResultToPoseData(bundle(makeLandmarks(33)), {
      mapPoint: ({ x, y }) => ({ x: 1 - x, y }),
      aspectRatio: 0.5,
    });
    expect(pose!.aspectRatio).toBe(0.5);
    expect(pose!.landmarks[10].x).toBeCloseTo(0.9);
    expect(pose!.landmarks[10].y).toBeCloseTo(0.05);
  });
});

describe('goniometer with MediaPipe-33 poses', () => {
  // Left leg: hip (23) above knee (25), ankle (27) straight below -> 180° knee.
  // Left arm: shoulder (11), elbow (13), wrist (15) bent to 90°.
  const pose = () => {
    const landmarks = mediapipeResultToPoseData(bundle(makeLandmarks(33, 1)))!.landmarks;
    const set = (i: number, x: number, y: number) => {
      landmarks[i] = { ...landmarks[i], x, y, z: 0 };
    };
    set(11, 0.4, 0.2); // left_shoulder
    set(13, 0.4, 0.35); // left_elbow
    set(15, 0.55, 0.35); // left_wrist
    set(23, 0.4, 0.5); // left_hip
    set(25, 0.4, 0.7); // left_knee
    set(27, 0.4, 0.9); // left_ankle
    set(31, 0.5, 0.9); // left_foot_index
    return landmarks;
  };

  it('uses the knee landmarks, not MoveNet indices, for knee angles', () => {
    const angles = goniometerService.calculateAllJointAngles(pose());
    expect(angles.get('left_knee')?.angle).toBeCloseTo(180, 0);
    expect(angles.get('left_elbow')?.angle).toBeCloseTo(90, 0);
  });

  it('measures ankle angles, which need heel/foot landmarks', () => {
    expect(goniometerService.getJointAngle('leftAnkle', pose())).toBeCloseTo(90, 0);
  });

  it('returns no ankle angle for 17-point MoveNet poses', () => {
    const moveNet = pose().slice(0, 17);
    expect(goniometerService.getJointAngle('leftAnkle', moveNet)).toBeNull();
  });
});
