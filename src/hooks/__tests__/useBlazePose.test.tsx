import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { usePoseDetection } from 'react-native-mediapipe';

import poseReducer from '../../store/slices/poseSlice';
import { useBlazePose } from '../useBlazePose';
import type { ProcessedPoseData } from '../../types/pose';

type Callbacks = {
  onResults: (bundle: unknown, vc: unknown) => void;
  onError: (e: { code: number; message: string }) => void;
};

const landmark = (x: number, y: number) => ({ x, y, z: 0.1, visibility: 0.9 });
const bundle = {
  results: [
    {
      landmarks: [Array.from({ length: 33 }, (_, i) => landmark(0.2 + i / 100, 0.5))],
      worldLandmarks: [Array.from({ length: 33 }, (_, i) => landmark(i / 100, 0))],
    },
  ],
  inferenceTime: 9,
  inputImageWidth: 480,
  inputImageHeight: 640,
};
// Mirror x and scale into a 300x600 preview
const viewCoordinator = {
  getFrameDims: () => ({ width: 480, height: 640 }),
  convertPoint: (_: unknown, p: { x: number; y: number }) => ({
    x: (1 - p.x) * 300,
    y: p.y * 600,
  }),
};

function setup(options: { enabled: boolean; onPose?: (p: ProcessedPoseData) => void }) {
  let callbacks: Callbacks | undefined;
  (usePoseDetection as jest.Mock).mockImplementation((cb: Callbacks) => {
    callbacks = cb;
    return {
      frameProcessor: 'frame-processor',
      cameraViewLayoutChangeHandler: jest.fn(),
      cameraDeviceChangeHandler: jest.fn(),
      cameraOrientationChangedHandler: jest.fn(),
      resizeModeChangeHandler: jest.fn(),
      cameraViewDimensions: { width: 300, height: 600 },
    };
  });
  const store = configureStore({ reducer: { pose: poseReducer } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const hook = renderHook(
    (props: { enabled: boolean }) =>
      useBlazePose({ device: undefined, enabled: props.enabled, onPose: options.onPose }),
    { wrapper, initialProps: { enabled: options.enabled } }
  );
  const emit = (inferenceTime = 9) =>
    act(() => callbacks!.onResults({ ...bundle, inferenceTime }, viewCoordinator));
  return { hook, store, emit };
}

describe('useBlazePose', () => {
  it('attaches the frame processor only while enabled', () => {
    const { hook } = setup({ enabled: false });
    expect(hook.result.current.cameraProps.frameProcessor).toBeUndefined();
    expect(hook.result.current.cameraProps.pixelFormat).toBe('rgb');
    hook.rerender({ enabled: true });
    expect(hook.result.current.cameraProps.frameProcessor).toBe('frame-processor');
  });

  it('converts, maps into the preview, enriches and dispatches each pose', () => {
    const onPose = jest.fn();
    const { store, emit } = setup({ enabled: true, onPose });
    emit();

    const pose: ProcessedPoseData = onPose.mock.calls[0][0];
    expect(pose.schemaId).toBe('mediapipe-33');
    expect(pose.zIsRelative).toBe(true);
    expect(pose.aspectRatio).toBeCloseTo(0.5); // 300 / 600 preview
    expect(pose.landmarks[0].x).toBeCloseTo(0.8); // mirrored
    expect(pose.worldLandmarks?.[25].name).toBe('left_knee');
    expect(pose.qualityScore).toBeGreaterThan(0.8);
    expect(pose.cachedAnatomicalFrames?.thorax).toBeDefined();
    expect(store.getState().pose.currentPose).toBe(pose);
  });

  it('ignores results that arrive after detection is disabled', () => {
    const onPose = jest.fn();
    const { hook, emit } = setup({ enabled: true, onPose });
    hook.rerender({ enabled: false });
    emit();
    expect(onPose).not.toHaveBeenCalled();
  });

  it('steps down from Full to Lite when the device cannot keep up', () => {
    const { hook, emit } = setup({ enabled: true });
    expect(hook.result.current.activeModel).toBe('pose_landmarker_full.task');
    for (let i = 0; i < 30; i++) {
      emit(60); // 60 ms per frame at a 30 FPS target
    }
    expect(hook.result.current.activeModel).toBe('pose_landmarker_lite.task');
    expect((usePoseDetection as jest.Mock).mock.calls.at(-1)[2]).toBe(
      'pose_landmarker_lite.task'
    );
  });

  it('stays on Full when inference fits the budget', () => {
    const { hook, emit } = setup({ enabled: true });
    for (let i = 0; i < 30; i++) {
      emit(12);
    }
    expect(hook.result.current.activeModel).toBe('pose_landmarker_full.task');
  });
});
