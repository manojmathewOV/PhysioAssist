/**
 * WebPoseDetectionService: results must carry MediaPipe-33 names and the frame
 * aspect ratio, so joint angles can be computed in aspect-corrected 2D.
 */
import { Pose } from '@mediapipe/pose';
import { WebPoseDetectionService } from '../WebPoseDetectionService';
import { goniometerService } from '../../goniometerService';
import { getMeasurementLandmarks } from '../../pose/measurementLandmarks';

const WIDTH = 1280;
const HEIGHT = 720;

/** 33 landmarks with a 90° left elbow in pixel space (not in normalized space). */
function makeLandmarks() {
  const lms = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: -0.3,
    visibility: 0.9,
  }));
  const px = (x: number, y: number, z: number) => ({
    x: x / WIDTH,
    y: y / HEIGHT,
    z,
    visibility: 0.9,
  });
  lms[11] = px(600, 200, -0.8); // left_shoulder
  lms[13] = px(600, 400, 0.4); // left_elbow
  lms[15] = px(800, 400, -0.6); // left_wrist
  return lms;
}

describe('WebPoseDetectionService', () => {
  it('produces named, aspect-aware pose data from a frame', async () => {
    const service = new WebPoseDetectionService();
    const detection = service.detectFromFrame({ width: WIDTH, height: HEIGHT } as any);

    const instance = (Pose as unknown as jest.Mock).mock.results.at(-1)!.value;
    const handler = instance.onResults.mock.calls[0][0];
    handler({
      image: { width: WIDTH, height: HEIGHT },
      poseLandmarks: makeLandmarks(),
      poseWorldLandmarks: makeLandmarks(),
    });

    const pose = await detection;
    expect(pose).not.toBeNull();
    expect(pose!.landmarks).toHaveLength(33);
    expect(pose!.landmarks[13].name).toBe('left_elbow');
    expect(pose!.landmarks[31].name).toBe('left_foot_index');
    expect(pose!.worldLandmarks?.[23].name).toBe('left_hip');
    expect(pose!.aspectRatio).toBeCloseTo(WIDTH / HEIGHT);
    expect(pose!.zIsRelative).toBe(true);
    expect(pose!.schemaId).toBe('mediapipe-33');

    // Aspect-corrected 2D recovers the true 90° elbow angle
    const angles = goniometerService.calculateAllJointAngles(
      getMeasurementLandmarks(pose!)
    );
    expect(angles.get('left_elbow')?.angle).toBeCloseTo(90, 0);
  });

  it('resolves null when no person is found', async () => {
    const service = new WebPoseDetectionService();
    const detection = service.detectFromFrame({ width: WIDTH, height: HEIGHT } as any);
    const instance = (Pose as unknown as jest.Mock).mock.results.at(-1)!.value;
    instance.onResults.mock.calls[0][0]({ image: { width: WIDTH, height: HEIGHT } });
    await expect(detection).resolves.toBeNull();
  });
});
