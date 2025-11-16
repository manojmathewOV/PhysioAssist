# Frame Processing Integration Guide

## Overview

This guide explains how to implement the missing frame-to-ImageData conversion for production pose detection in PhysioAssist.

**Current Status**: ⚠️ NOT IMPLEMENTED
**Location**: `src/screens/PoseDetectionScreen.tsx:152-153`
**Priority**: CRITICAL for production
**Estimated Effort**: 2-4 hours

---

## Problem Statement

The pose detection pipeline requires converting `react-native-vision-camera` Frame objects to `ImageData` format for processing by MediaPipe. This conversion is currently commented out because it requires native module integration.

```typescript
// Current code (PoseDetectionScreen.tsx:116-134)
const processFrameData = useCallback(async (width: number, height: number) => {
  try {
    // Note: Actual frame processing would happen here
    // await poseDetectionService.processFrame(imageData);
  } catch (error) {
    console.error('Error processing frame:', error);
  }
}, []);
```

---

## Solution Options

### Option 1: VisionCamera Frame Processor Plugin (Recommended)

**Pros**:
- Official VisionCamera approach
- Best performance (runs on UI thread)
- Type-safe with worklet support

**Implementation**:

1. Install frame processor plugin:
```bash
npm install vision-camera-plugin-frame-processor-helper
```

2. Create native module for frame conversion:
```typescript
// src/native/FrameConverter.ts
import { VisionCameraProxy, Frame } from 'react-native-vision-camera';

export const convertFrameToImageData = (frame: Frame): ImageData => {
  'worklet';

  const data = frame.toArrayBuffer(); // Get raw pixel data
  const width = frame.width;
  const height = frame.height;

  return new ImageData(
    new Uint8ClampedArray(data),
    width,
    height
  );
};
```

3. Use in frame processor:
```typescript
// PoseDetectionScreen.tsx
import { convertFrameToImageData } from '@native/FrameConverter';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';

  if (!isDetecting || isPaused) return;

  frameCountRef.current++;
  if (frameCountRef.current % frameSkip !== 0) return;

  // Convert frame to ImageData
  const imageData = convertFrameToImageData(frame);

  // Process on JS thread
  runOnJS(async () => {
    await poseDetectionService.processFrame(imageData);
  })();
}, [isDetecting, isPaused, frameSkip]);
```

**Resources**:
- [VisionCamera Frame Processors](https://react-native-vision-camera.com/docs/guides/frame-processors)
- [VisionCamera Plugin Development](https://react-native-vision-camera.com/docs/guides/frame-processors-plugins-overview)

---

### Option 2: React Native Image Processing Library

**Pros**:
- No custom native code required
- Cross-platform support
- Good performance

**Implementation**:

1. Install library:
```bash
npm install react-native-fast-image @react-native-community/cameraroll
```

2. Use takeSnapshot:
```typescript
// PoseDetectionScreen.tsx
import { captureRef } from 'react-native-view-shot';

const cameraRef = useRef(null);

const processFrameData = useCallback(async () => {
  try {
    const uri = await captureRef(cameraRef, {
      format: 'png',
      quality: 0.8,
    });

    // Convert URI to ImageData
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageData = await createImageData(blob);

    await poseDetectionService.processFrame(imageData);
  } catch (error) {
    console.error('Error processing frame:', error);
  }
}, []);
```

---

### Option 3: TensorFlow.js Camera Integration

**Pros**:
- Direct TensorFlow integration
- Built-in preprocessing
- Good performance

**Implementation**:

1. Install TensorFlow camera plugin:
```bash
npm install @tensorflow/tfjs-react-native
```

2. Use TensorFlow camera:
```typescript
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

const TensorCamera = cameraWithTensors(Camera);

// In component
<TensorCamera
  style={styles.camera}
  type={CameraType.front}
  onReady={onCameraReady}
  resizeWidth={640}
  resizeHeight={480}
  resizeDepth={3}
  autorender={true}
  useCustomShadersToResize={false}
/>

const onCameraReady = (images: IterableIterator<tf.Tensor3D>) => {
  const loop = async () => {
    const nextImageTensor = images.next().value;

    if (nextImageTensor) {
      // Convert tensor to ImageData
      const imageData = await tensorToImageData(nextImageTensor);
      await poseDetectionService.processFrame(imageData);
    }

    requestAnimationFrame(loop);
  };

  loop();
};
```

---

## Recommended Approach

**Use Option 1 (VisionCamera Frame Processor Plugin)** because:

1. ✅ Best performance (UI thread processing)
2. ✅ Official VisionCamera approach
3. ✅ Type-safe with TypeScript
4. ✅ Minimal overhead
5. ✅ Active community support

---

## Implementation Checklist

- [ ] Choose implementation option (recommend Option 1)
- [ ] Install required dependencies
- [ ] Create frame conversion utility
- [ ] Update `PoseDetectionScreen.tsx:116-134`
- [ ] Test with real camera on device
- [ ] Verify pose data flows to Redux
- [ ] Verify overlays animate correctly
- [ ] Test performance (target: <120ms latency)
- [ ] Add error handling for failed conversions
- [ ] Update IMPLEMENTATION_STATUS.md
- [ ] Add integration tests

---

## Testing Strategy

### Unit Tests
```typescript
describe('Frame Processing', () => {
  it('should convert frame to ImageData', () => {
    const mockFrame = createMockFrame();
    const imageData = convertFrameToImageData(mockFrame);

    expect(imageData).toBeInstanceOf(ImageData);
    expect(imageData.width).toBe(mockFrame.width);
    expect(imageData.height).toBe(mockFrame.height);
  });
});
```

### Integration Tests
```typescript
describe('Pose Detection Pipeline', () => {
  it('should process camera frames through pose service', async () => {
    const mockFrame = createMockFrame();
    const imageData = convertFrameToImageData(mockFrame);
    const result = await poseDetectionService.processFrame(imageData);

    expect(result).toBeDefined();
    expect(result.landmarks).toHaveLength(33);
  });
});
```

### Device Testing
1. Test on iOS device
2. Test on Android device
3. Verify frame rate (target: 30fps)
4. Verify pose latency (<120ms)
5. Test in low-light conditions
6. Test with different camera positions

---

## Performance Optimization

### Frame Skip Strategy
```typescript
// Already implemented in PoseDetectionScreen
frameCountRef.current++;
if (frameCountRef.current % frameSkip !== 0) {
  return; // Skip this frame
}
```

### Resolution Optimization
```typescript
// Lower resolution for better performance
const POSE_DETECTION_WIDTH = 640;
const POSE_DETECTION_HEIGHT = 480;

const imageData = convertFrameToImageData(frame, {
  targetWidth: POSE_DETECTION_WIDTH,
  targetHeight: POSE_DETECTION_HEIGHT,
});
```

### Throttling
```typescript
// Use settings.frameSkip from Redux
const { frameSkip } = useSelector((state: RootState) => state.settings);

// High performance mode: frameSkip = 1
// Normal mode: frameSkip = 3
// Low performance mode: frameSkip = 5
```

---

## Common Issues and Solutions

### Issue 1: "Frame toArrayBuffer is not a function"
**Solution**: Ensure you're using VisionCamera v3+ with frame processor support

### Issue 2: Poor performance on older devices
**Solution**: Increase `frameSkip` value or reduce resolution

### Issue 3: Memory leaks
**Solution**: Properly dispose of ImageData and tensor objects after processing

### Issue 4: Pose detection lag
**Solution**: Process on separate thread or use worklets

---

## References

- [React Native Vision Camera Docs](https://react-native-vision-camera.com/)
- [MediaPipe Pose Detection](https://google.github.io/mediapipe/solutions/pose.html)
- [TensorFlow.js React Native](https://www.tensorflow.org/js/tutorials/setup#react_native)
- [PhysioAssist Current Implementation](../src/screens/PoseDetectionScreen.tsx)
- [Mock Data Simulator](../src/services/mockPoseDataSimulator.ts)

---

## Support

For questions or issues:
1. Check [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md)
2. Review [PoseDetectionScreen.tsx](../src/screens/PoseDetectionScreen.tsx:116-134)
3. Test with mock data simulator first
4. Enable diagnostics screen for debugging

---

**Last Updated**: 2025-11-15
**Status**: Ready for Implementation
**Assigned**: Sprint 2 - "Make Pose Usable"
