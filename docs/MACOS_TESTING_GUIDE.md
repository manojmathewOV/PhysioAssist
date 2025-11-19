# MacBook Testing Guide for PhysioAssist

## Real Camera & Video Testing with CLI Integration

**Last Updated:** 2025-11-19
**Branch:** claude/test-coverage-3d-pose-01XyKEfBWShvuXCYih1uHUtQ

---

## 📖 Overview

This guide shows you how to test PhysioAssist's 3D pose estimation and biomechanics measurements using your MacBook camera or pre-recorded videos. The testing framework validates:

- ✅ Real-time pose detection accuracy
- ✅ Joint angle measurements (±5° target)
- ✅ Compensation detection (trunk lean, shoulder hiking, etc.)
- ✅ Performance benchmarks (FPS, latency)
- ✅ Clinical measurement quality

---

## 🚀 Quick Start

### Option 1: Live MacBook Camera Test

```bash
npm run test:macos:camera
```

This will:

1. Start the web server
2. Open your browser with camera interface
3. Display real-time angle measurements
4. Show detected compensations

### Option 2: Pre-Recorded Video Test

```bash
npm run test:macos:video -- /path/to/your/video.mp4
```

Requirements:

- Video format: MP4, MOV, AVI
- Resolution: 640x480 or higher
- Frame rate: 30-60 FPS recommended
- Content: Full body visible performing movements

### Option 3: Comprehensive Benchmark

```bash
npm run test:macos:benchmark
```

Runs automated tests on:

- Shoulder flexion (0-180°)
- Shoulder abduction (0-180°)
- Elbow flexion (0-150°)
- Knee flexion (0-135°)

---

## 🎥 Creating Test Videos

### Best Practices

**Camera Setup:**

- Distance: 6-10 feet from camera
- Height: Camera at chest/shoulder level
- Lighting: Good, even lighting (avoid backlit)
- Background: Solid, contrasting color
- Framing: Full body visible (head to feet)

**Movement Guidelines:**

- Start position: Neutral stance, arms at sides
- Movement speed: Slow, controlled (2-3 seconds per direction)
- Range: Full ROM for the joint being tested
- Repetitions: 3-5 reps per video
- Pause: 1 second pause at start/end positions

**Recommended Test Videos:**

1. **Shoulder Flexion** (Sagittal view - side profile)

   - Start: Arms at sides
   - Movement: Raise arms forward overhead
   - End: Arms pointing up
   - Ground truth: 0° → 180°

2. **Shoulder Abduction** (Frontal view - facing camera)

   - Start: Arms at sides
   - Movement: Raise arms sideways
   - End: Arms pointing up
   - Ground truth: 0° → 180°

3. **Elbow Flexion** (Sagittal view - side profile)

   - Start: Arms straight at sides
   - Movement: Bend elbows to bring hands to shoulders
   - End: Elbows fully flexed
   - Ground truth: 180° → 30°

4. **Knee Flexion** (Sagittal view - side profile)
   - Start: Standing straight
   - Movement: Lift foot back by bending knee
   - End: Knee fully flexed
   - Ground truth: 0° → 135°

### Recording with MacBook Camera

```bash
# Option 1: Use built-in QuickTime
# File → New Movie Recording → Record

# Option 2: Use ffmpeg
ffmpeg -f avfoundation -framerate 30 -video_size 1280x720 -i "0" output.mp4

# Option 3: Use our web interface
npm run test:macos:camera
# Then use browser's built-in recording features
```

---

## 📊 Understanding Test Results

### Sample Output

```
📊 TEST RESULTS
═══════════════════════════════════════════════════════════
Frames Processed:     150
Average FPS:          45.2
Average Processing:   22.13ms/frame
Mean Absolute Error:  3.47°
Accuracy Status:      ✅ PASS

📈 PERFORMANCE METRICS
───────────────────────────────────────────────────────────
Min FPS:              38.5
Max FPS:              52.1
P50 Latency:          21.50ms
P95 Latency:          28.30ms
P99 Latency:          31.20ms

⚠️  COMPENSATIONS DETECTED
───────────────────────────────────────────────────────────
trunk_lean                12 frames
shoulder_hiking           5 frames
```

### Success Criteria

| Metric                    | Target | Status            |
| ------------------------- | ------ | ----------------- |
| Mean Absolute Error (MAE) | ±5°    | ✅ PASS if < 5°   |
| Average FPS               | >30    | ✅ PASS if > 30   |
| P95 Latency               | <33ms  | ✅ PASS if < 33ms |

### Common Issues & Solutions

**❌ High MAE (>5°)**

- Check: Full body visible in frame?
- Check: Good lighting and contrast?
- Check: Camera stable (not shaky)?
- Solution: Re-record with better setup

**❌ Low FPS (<30)**

- Check: Video resolution too high?
- Check: Other apps consuming resources?
- Solution: Close other apps, use 720p resolution

**❌ Many Compensations Detected**

- This may be expected! Compensations indicate:
  - Trunk lean during shoulder movements
  - Shoulder hiking to gain extra ROM
  - Hip hike during knee flexion
- Review: Are compensations clinically accurate?

---

## 🔧 Advanced Usage

### Custom Test Configuration

```typescript
import { MacBookVideoTestHarness } from './src/testing/MacBookVideoTestHarness';

const harness = new MacBookVideoTestHarness();

const results = await harness.testWithVideoFile({
  videoPath: './test-videos/shoulder-flexion.mp4',
  groundTruth: {
    primaryMeasurement: {
      joint: 'right_shoulder',
      angle: 120,
      plane: 'sagittal',
      movement: 'flexion',
    },
    secondaryMeasurements: [],
    compensations: [],
    testCase: 'shoulder_flexion_120deg',
  },
  targetFPS: 30,
  maxFrames: 300,
  enableBenchmarking: true,
  accuracyTolerance: 5,
});

console.log(`Accuracy: ${results.meanAbsoluteError}°`);
console.log(`Performance: ${results.avgFPS} FPS`);
```

### Batch Testing Multiple Videos

```bash
# Create a test script
cat > test-all-videos.sh << 'EOF'
#!/bin/bash

for video in ./test-videos/*.mp4; do
  echo "Testing: $video"
  npm run test:macos:video -- "$video"
done
EOF

chmod +x test-all-videos.sh
./test-all-videos.sh
```

### Integration with CI/CD

```yaml
# .github/workflows/macos-tests.yml
name: MacOS Video Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:macos:benchmark
```

---

## 🏗️ Testing Architecture

### Data Flow

```
MacBook Camera (AVFoundation)
         ↓
Browser (MediaPipe Pose / getUserMedia)
         ↓
PoseDetectionServiceV2
         ↓
AnatomicalFrameCache (temporal consistency)
         ↓
ClinicalMeasurementService (angle calculation)
         ↓
CompensationDetectionService (quality analysis)
         ↓
Test Results & Validation
```

### Components

| Component                  | Purpose                      | Location                                      |
| -------------------------- | ---------------------------- | --------------------------------------------- |
| MacBookVideoTestHarness    | Main test orchestration      | `src/testing/MacBookVideoTestHarness.ts`      |
| SyntheticPoseDataGenerator | Ground truth generation      | `src/testing/SyntheticPoseDataGenerator.ts`   |
| macos-test-runner.js       | CLI interface                | `scripts/macos-test-runner.js`                |
| VideoFrameFeeder           | Video file processing        | `src/utils/videoFrameFeeder.ts`               |
| WebPoseDetectionService    | Browser-based pose detection | `src/services/web/WebPoseDetectionService.ts` |

---

## 📝 Test Coverage Integration

This MacBook testing framework helps achieve **10/10 coverage** by enabling:

### Real-World Validation ✅

- Test with actual camera feeds (not just synthetic data)
- Validate against physical movements
- Detect real-world edge cases (occlusion, poor lighting, etc.)

### Performance Benchmarking ✅

- Measure FPS under real conditions
- Track latency percentiles (P50, P95, P99)
- Identify bottlenecks in the pipeline

### Clinical Accuracy ✅

- Validate ±5° accuracy target
- Test compensation detection sensitivity
- Compare against ground truth measurements

### Missing Test Scenarios ✅

- **Extreme angles**: Record at 0°, 5°, 175°, 180°
- **Occlusion**: Partial body visibility
- **Poor lighting**: Low contrast conditions
- **Rapid motion**: Fast movements
- **Bilateral**: Both sides simultaneously

---

## 🎯 Test Scenarios to Record

To achieve 10/10 coverage, create these test videos:

### Priority 1: Basic Movements

- [ ] Shoulder flexion 0-180° (sagittal view)
- [ ] Shoulder abduction 0-180° (frontal view)
- [ ] Elbow flexion 0-150° (sagittal view)
- [ ] Knee flexion 0-135° (sagittal view)

### Priority 2: Edge Cases

- [ ] Shoulder flexion at exactly 0°, 90°, 180°
- [ ] Low visibility (dim lighting)
- [ ] Partial occlusion (arms behind body)
- [ ] Rapid motion (fast arm raises)

### Priority 3: Compensations

- [ ] Shoulder flexion WITH trunk lean
- [ ] Shoulder abduction WITH shoulder hiking
- [ ] Knee flexion WITH hip hike
- [ ] Elbow flexion WITH trunk rotation

### Priority 4: Bilateral

- [ ] Both shoulders flexion (asymmetric)
- [ ] Both elbows flexion (asymmetric)
- [ ] Both knees flexion (asymmetric)

---

## 🔍 Troubleshooting

### Camera Not Detected

**macOS:**

```bash
# Check camera permissions
system_profiler SPCameraDataType

# Grant permissions in System Preferences
# System Preferences → Security & Privacy → Camera → Chrome/Safari
```

### Web Server Won't Start

```bash
# Check if port 8080 is in use
lsof -ti:8080 | xargs kill -9

# Restart web server
npm run test:macos:web
```

### Poor Pose Detection

**Common causes:**

1. Insufficient lighting
2. Cluttered background
3. Camera too close/far
4. Body partially out of frame

**Solutions:**

- Use natural daylight or bright indoor lighting
- Stand against a solid, contrasting wall
- Position 6-10 feet from camera
- Ensure full body visible (head to feet)

### Low FPS / High Latency

```bash
# Close other applications
# Use Activity Monitor to check CPU usage

# Lower video resolution
# Edit config in WebPoseDetectionService:
# targetWidth: 640 (instead of 1280)
# targetHeight: 480 (instead of 720)
```

---

## 📚 Related Documentation

- [Test Coverage Analysis](../COVERAGE_ANALYSIS_REPORT.md) - Detailed gap analysis
- [Test Gaps Summary](../TEST_GAPS_EXECUTIVE_SUMMARY.txt) - Prioritized action items
- [Camera Infrastructure Report](../CAMERA_VIDEO_INFRASTRUCTURE_REPORT.md) - Technical details
- [Claude Code CLI Bridge](../scripts/ios/README.md) - iOS development integration

---

## 🤝 Contributing Test Videos

If you record high-quality test videos, consider sharing them:

1. Upload to cloud storage (Google Drive, Dropbox)
2. Include metadata:
   - Movement type
   - Ground truth angles
   - View orientation
   - Any compensations
3. Open an issue with the link

**Example metadata:**

```json
{
  "filename": "shoulder-flexion-120deg.mp4",
  "movement": "shoulder_flexion",
  "side": "right",
  "groundTruth": 120,
  "startAngle": 0,
  "endAngle": 120,
  "viewOrientation": "sagittal",
  "compensations": ["trunk_lean"],
  "duration": "10s",
  "fps": 30,
  "resolution": "1280x720"
}
```

---

## 💡 Tips for Best Results

1. **Wear contrasting clothing** - Dark on light background or vice versa
2. **Avoid baggy clothes** - Fitted clothing helps landmark detection
3. **Remove obstructions** - No chairs, tables, or objects in frame
4. **Stable camera** - Use tripod or prop MacBook securely
5. **Controlled movements** - Slow, deliberate movements (2-3 sec per rep)
6. **Multiple takes** - Record 2-3 videos per movement type
7. **Calibration** - Start with arms at sides for baseline
8. **Document ground truth** - Note expected angles for each position

---

## 📞 Support

For issues or questions:

- GitHub Issues: [PhysioAssist/issues](https://github.com/manojmathewOV/PhysioAssist/issues)
- Documentation: See `docs/` directory
- Tests: Run `npm run test:coverage` to see current coverage

---

## 🔄 Next Steps

After setting up MacBook testing:

1. ✅ Run initial benchmark: `npm run test:macos:benchmark`
2. ✅ Review results and identify gaps
3. ✅ Record test videos for missing scenarios
4. ✅ Implement Phase 1 priority tests (30 tests)
5. ✅ Achieve 93%+ coverage
6. ✅ Continue to Phase 2 (clinical completeness)
7. ✅ Reach 10/10 coverage goal

**Current Status:** 90.29% → **Target:** 100% + edge cases

---

**Ready to test? Run:**

```bash
npm run test:macos:camera
```

🎉 **Happy Testing!**
