# TensorFlow Lite Models

This directory contains optimized TFLite models for pose detection.

## Models

### MoveNet Lightning INT8 (Recommended)
- **File:** `movenet_lightning_int8.tflite`
- **Input Size:** 192x192 pixels
- **Format:** INT8 quantized
- **Size:** ~3MB
- **Inference:** ~30ms on modern devices
- **Use Case:** Real-time pose detection with best balance of speed/accuracy
- **Download:** Run `npm run download-models`

### MoveNet Thunder Float16 (High Accuracy)
- **File:** `movenet_thunder_fp16.tflite`
- **Input Size:** 256x256 pixels
- **Format:** Float16
- **Size:** ~12MB
- **Inference:** ~50ms on modern devices
- **Use Case:** High-accuracy requirements
- **Download:** Run `npm run download-models`

## Keypoints (17 total)

MoveNet detects 17 body keypoints:

```
0: nose
1: left_eye
2: right_eye
3: left_ear
4: right_ear
5: left_shoulder
6: right_shoulder
7: left_elbow
8: right_elbow
9: left_wrist
10: right_wrist
11: left_hip
12: right_hip
13: left_knee
14: right_knee
15: left_ankle
16: right_ankle
```

## Output Format

```typescript
{
  keypoints: [
    {
      x: number,  // 0-1 normalized
      y: number,  // 0-1 normalized
      score: number  // confidence 0-1
    },
    // ... 17 total
  ]
}
```

## Download Models

Run the download script:

```bash
npm run download-models
```

Or manually download:

**Lightning INT8:**
```bash
curl -L "https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/int8/4?lite-format=tflite" \
  -o assets/models/movenet_lightning_int8.tflite
```

**Thunder Float16:**
```bash
curl -L "https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/float16/4?lite-format=tflite" \
  -o assets/models/movenet_thunder_fp16.tflite
```

## Performance Benchmarks

| Model | iPhone 14 | Pixel 7 | Size |
|-------|-----------|---------|------|
| Lightning INT8 | 28ms | 32ms | 3MB |
| Thunder FP16 | 48ms | 55ms | 12MB |

## Usage

```typescript
import { TFLiteModel } from 'react-native-fast-tflite';

const model = await TFLiteModel.load({
  model: require('./movenet_lightning_int8.tflite'),
  delegates: ['gpu', 'core-ml'],
});

const output = model.run(inputTensor);
```

## License

Models are from TensorFlow Hub under Apache 2.0 License.
