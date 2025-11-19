# PhysioAssist Camera/Video Infrastructure & Claude Code CLI Bridge Report

**Date:** 2025-11-19  
**Branch:** claude/test-coverage-3d-pose-01XyKEfBWShvuXCYih1uHUtQ  
**Status:** Production-ready with advanced infrastructure

---

## Executive Summary

PhysioAssist has a **mature, multi-platform camera/video infrastructure** with three pose detection backends:

1. **MoveNet TFLite** (V2 - primary, GPU-accelerated)
2. **MediaPipe Pose** (web/legacy)
3. **Synthetic data generator** (testing)

The **Claude Code CLI bridge** is fully implemented with HTTP server, auto-iterate mode, and comprehensive state management. MacBook camera integration requires a new web-based entry point (currently missing).

---

## 1. CAMERA/VIDEO INFRASTRUCTURE

### 1.1 Pose Detection Layers (Input → Output)

**Layer 1: Raw Camera Input**

- **iOS:** `react-native-vision-camera` v4.0.0 → VisionCamera frame processor
- **Android:** `react-native-vision-camera` v4.0.0 → VisionCamera frame processor
- **Web:** HTML5 `<video>` + MediaPipe camera_utils
- **Video Files:** Custom VideoFrameFeeder (supports MP4, RTMP, local files)

**Layer 2: Frame Processing**

```
Camera Frame (RGB)
  ↓
Frame Processor Plugin (iOS/Android native)
  ↓
TFLite Model Inference (GPU-accelerated)
  ↓
Keypoint Output (17 landmarks)
```

**Layer 3: Model Inference**

- **Primary:** `movenet_lightning_int8.tflite` (3MB, 192x192, ~30ms)
- **Alternative:** `movenet_thunder_fp16.tflite` (12MB, 256x256, ~50ms)
- **GPU Acceleration:**
  - iOS: CoreML delegate
  - Android: NNAPI/GPU delegate
  - Performance: 3-5x speedup vs CPU

**Layer 4: Pose Processing**

- PoseDetectionServiceV2 → Handles landmark filtering, orientation classification
- One-Euro filter for jitter reduction (Gate 2 implementation)
- AnatomicalFrameCache for temporal consistency (Gate 9B.5)

**Flow Diagram:**

```
Camera Input
    ↓
VisionCamera (react-native-vision-camera v4.0.0)
    ↓
Frame Processor → PoseDetectionPlugin (iOS/Android)
    ↓
TFLite Model (movenet_lightning_int8.tflite)
    ↓
PoseDetectionServiceV2
    ├─ PoseLandmarkFilter (One-Euro)
    ├─ OrientationClassifier (Gate 9B)
    └─ AnatomicalFrameCache (Gate 9B.5)
    ↓
Redux Store (poseSlice)
    ↓
UI Components (PoseOverlay, ExerciseControls)
```

### 1.2 Key Services

| Service                      | Location                                                     | Purpose                               | Status        |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------- | ------------- |
| PoseDetectionServiceV2       | `/src/services/PoseDetectionService.v2.ts`                   | Primary pose detection (TFLite + GPU) | ✅ Production |
| WebPoseDetectionService      | `/src/services/web/WebPoseDetectionService.ts`               | Web-based pose (MediaPipe)            | ✅ Production |
| poseDetectionService         | `/src/services/poseDetectionService.ts`                      | Legacy MediaPipe service              | ⚠️ Deprecated |
| VideoFrameFeeder             | `/src/utils/videoFrameFeeder.ts`                             | Video file frame extraction           | ✅ Production |
| ClinicalMeasurementService   | `/src/services/biomechanics/ClinicalMeasurementService.ts`   | Joint angle measurement               | ✅ Production |
| CompensationDetectionService | `/src/services/biomechanics/CompensationDetectionService.ts` | Movement quality analysis             | ✅ Production |

### 1.3 Video Input Methods

**1. Live Camera**

- iOS: VisionCamera → Native plugin
- Android: VisionCamera → Native plugin
- Web: MediaPipe Camera Utils

**2. Video File Feeder** (`VideoFrameFeeder`)

```typescript
// src/utils/videoFrameFeeder.ts
interface VideoFrameFeederOptions {
  fps?: number; // Frame rate (default: 30)
  frameSkip?: number; // Skip frames (default: 1)
  loop?: boolean; // Loop video (default: false)
  targetWidth?: number; // Resize width (default: 640)
  targetHeight?: number; // Resize height (default: 480)
  onFrame?: callback; // Frame callback
  onPoseData?: callback; // Pose data callback
}

// Supports: MP4, RTMP, local files
const feeder = new VideoFrameFeeder({ fps: 30 });
await feeder.load('https://example.com/video.mp4');
await feeder.start();
```

**3. Mock Data Simulator** (`mockPoseDataSimulator`)

- Generates synthetic pose sequences
- Simulates real user movements
- Used in development/testing

**4. Synthetic Pose Generator** (`SyntheticPoseDataGenerator`)

- Generates mathematically precise poses
- Ground truth angles for validation
- Supports compensation patterns

### 1.4 Frame Processing Pipeline

**iOS Native Plugin** (`ios/PoseDetectionPlugin.swift`)

```swift
// Frame → RGB Buffer → Resize (192x192) → Normalize → TFLite → Keypoints
// Performance: 28-30ms per frame (iPhone 14+)
```

**Android Native Plugin** (`android/.../PoseDetectionPlugin.kt`)

```kotlin
// Frame → Bitmap → Preprocess → TFLite (GPU delegate) → Keypoints
// Performance: 32-35ms per frame (modern Android)
```

**Web Implementation** (`WebPoseDetectionService`)

```javascript
// Canvas → ImageData → MediaPipe Pose → Landmarks
// Performance: 50-100ms per frame (depends on browser)
```

---

## 2. CLAUDE CODE CLI BRIDGE INFRASTRUCTURE

### 2.1 Bridge Architecture

**Location:** `/scripts/ios/`

**Components:**

| Component           | File                                        | Type     | Purpose                          |
| ------------------- | ------------------------------------------- | -------- | -------------------------------- |
| Bridge Shell Script | `claude-bridge.sh`                          | Bash     | Core CLI interface (13 commands) |
| HTTP Server         | `claude-bridge-server.js`                   | Node.js  | RESTful API server (port 3737)   |
| Auto-Iterate        | `claude-auto-iterate.sh`                    | Bash     | File watcher + auto-reload       |
| Documentation       | `docs/ios-guides/CLAUDE_CODE_CLI_BRIDGE.md` | Markdown | Complete integration guide       |

### 2.2 Bridge Commands

**Status & Health**

```bash
./scripts/ios/claude-bridge.sh status          # System status (JSON)
./scripts/ios/claude-bridge.sh health          # Health check with issues/warnings
```

**Metro Management**

```bash
./scripts/ios/claude-bridge.sh start-metro     # Start Metro bundler (port 8081)
./scripts/ios/claude-bridge.sh stop-metro      # Stop Metro bundler
```

**Simulator Control**

```bash
./scripts/ios/claude-bridge.sh boot-simulator "iPhone 15 Pro"
./scripts/ios/claude-bridge.sh build-simulator [clean]
./scripts/ios/claude-bridge.sh install-simulator
./scripts/ios/claude-bridge.sh launch-simulator
```

**Development**

```bash
./scripts/ios/claude-bridge.sh reload          # Hot reload app
./scripts/ios/claude-bridge.sh quick-dev       # One-command dev setup
./scripts/ios/claude-bridge.sh logs [source]   # View logs (metro/bridge/simulator)
```

### 2.3 HTTP API Server

**Running:**

```bash
npm run claude:bridge-server
# Server: http://127.0.0.1:3737
```

**Endpoints:**

```
GET  /              - API information
GET  /status        - System status (JSON)
GET  /health        - Health check
GET  /state         - Current state
GET  /logs          - Get logs (with query params)
GET  /watch         - Server-Sent Events (real-time updates)

POST /command       - Execute command (body: {command, args})
POST /quick-dev     - Quick dev mode
POST /start-metro   - Start Metro
POST /stop-metro    - Stop Metro
POST /reload        - Hot reload
POST /boot-simulator - Boot simulator
POST /build         - Build app
```

**Example Usage:**

```bash
# Status
curl http://127.0.0.1:3737/status | jq '.data'

# Reload
curl -X POST http://127.0.0.1:3737/reload

# Generic command
curl -X POST -H "Content-Type: application/json" \
  -d '{"command":"status","args":[]}' \
  http://127.0.0.1:3737/command

# Real-time updates
curl http://127.0.0.1:3737/watch
```

### 2.4 State Management

**State File:** `.claude-bridge/state.json`

```json
{
  "status": "idle|running|building|error",
  "last_command": "reload",
  "last_success": "2024-11-19T...",
  "last_error": null,
  "metro_running": true,
  "simulator_booted": true,
  "device_connected": false,
  "build_status": "success|failed|unknown",
  "xcode_open": true,
  "last_update": "2024-11-19T..."
}
```

**Log Files:**

- `.claude-bridge/bridge.log` - All bridge operations
- `.claude-bridge/errors.json` - Latest error with recovery
- `.claude-bridge/iterations.log` - Auto-iterate tracking

### 2.5 Auto-Recovery Mechanism

**Automatic Error Handling:**

| Error                  | Recovery Attempt                       |
| ---------------------- | -------------------------------------- |
| `metro_not_running`    | Auto-start Metro (port 8081)           |
| `port_in_use`          | Kill process on 8081, restart Metro    |
| `simulator_not_booted` | Boot default simulator (iPhone 15 Pro) |
| `build_failed`         | Perform clean build automatically      |
| `xcode_not_responding` | Restart Xcode and reopen workspace     |

**Implementation:** Each error type triggers specific recovery logic in `handle_error()` function.

### 2.6 Auto-Iterate Mode

**File:** `/scripts/ios/claude-auto-iterate.sh`

**Features:**

- Watches `/src/` directory for file changes
- Auto-reloads app on save (~1 second latency)
- Automatic error recovery (up to 3 attempts)
- Iteration tracking and statistics
- Requires: `fswatch` (macOS, homebrew)

**Usage:**

```bash
npm run claude:iterate
# Edit any file in src/ → App reloads automatically
```

### 2.7 npm Scripts Integration

**All bridge commands available as npm scripts:**

```bash
npm run claude:bridge        # Main bridge CLI
npm run claude:dev           # Quick dev mode
npm run claude:iterate       # Auto-iterate mode (RECOMMENDED)
npm run claude:bridge-server # HTTP server
npm run claude:status        # Get status
npm run claude:health        # Health check
```

---

## 3. VIDEO TESTING INFRASTRUCTURE

### 3.1 Test Files

| Test File                | Location                                         | Purpose                       | Status        |
| ------------------------ | ------------------------------------------------ | ----------------------------- | ------------- |
| VideoFrameFeeder Tests   | `__tests__/integration/videoFrameFeeder.test.ts` | Frame extraction validation   | ✅ 100%       |
| Synthetic Pose Generator | `src/testing/SyntheticPoseDataGenerator.ts`      | Ground truth pose generation  | ✅ Production |
| Mock Pose Simulator      | `src/services/mockPoseDataSimulator.ts`          | Realistic movement simulation | ✅ Production |
| Frame Converter Tests    | `__tests__/integration/videoFrameFeeder.test.ts` | ImageData validation          | ✅ 100%       |

### 3.2 Video Frame Testing

**VideoFrameFeeder** supports:

- Remote MP4 videos
- Local video files
- Frame rate control (configurable)
- Frame skipping for performance
- Pause/resume/stop controls
- Statistics tracking (FPS, frame count, errors)

**Test Example:**

```typescript
const feeder = new VideoFrameFeeder({
  fps: 30,
  frameSkip: 1,
  onFrame: (imageData, frameNumber) => {
    // Process frame
  },
  onPoseData: (poseData) => {
    // Handle pose data
  },
});

await feeder.load('https://example.com/video.mp4');
await feeder.start();
```

### 3.3 Mock Data Generators

**1. SyntheticPoseDataGenerator**

- Generates poses with mathematically precise angles
- Supports: Shoulder flexion, knee flexion, elbow flexion
- Ground truth validation support
- Compensation patterns for testing

**2. mockPoseDataSimulator**

- Generates realistic movement sequences
- Simulates patient exercises
- Smooth interpolation
- Used in development mode (**DEV**)

### 3.4 Web Demo Infrastructure

**Location:** `/web-demo/`

**Files:**

- `index.html` - UI and layout
- `exercise-simulator.js` - Pose generation and biomechanics
- `visualization.js` - Canvas rendering

**Features:**

- Real-time angle calculation (clinical-grade)
- Visual feedback (color-coded progress)
- Exercise selection (shoulder, knee, elbow)
- Speed control (slow/normal/fast)
- No camera required (simulated poses)

**Running:**

```bash
npm run demo:serve
# Open: http://localhost:3000/web-demo
```

---

## 4. PLATFORM-SPECIFIC CODE

### 4.1 iOS Implementation

**Camera Integration:**

- Framework: `react-native-vision-camera` v4.0.0
- Input: Native camera stream via VisionCamera
- Processing: Native Swift plugin with CoreML GPU acceleration

**Files:**

- Plugin: `/ios/PoseDetectionPlugin.swift` (100 lines, GPU-enabled)
- Package: `/ios/PoseDetectionPlugin.m` (bridge to React)
- Config: iOS project in `/ios/PhysioAssist.xcworkspace`

**Capabilities:**

- Real-time frame processing (30-60 FPS)
- CoreML GPU acceleration
- Zero-copy frame passing via JSI
- Thread-safe inference

**Performance:**

- iPhone 14+: 28-30ms per frame
- Supports 60 FPS capable on recent devices

### 4.2 Android Implementation

**Camera Integration:**

- Framework: `react-native-vision-camera` v4.0.0
- Input: Native camera stream via VisionCamera
- Processing: Native Kotlin plugin with NNAPI/GPU acceleration

**Files:**

- Plugin: `/android/app/src/main/java/com/physioassist/plugins/PoseDetectionPlugin.kt`
- Package: `/android/app/src/main/java/com/physioassist/plugins/PoseDetectionPluginPackage.kt`

**Capabilities:**

- Real-time frame processing (30-60 FPS)
- NNAPI GPU acceleration
- Bitmap processing and preprocessing
- Inference time tracking

**Performance:**

- Pixel 7+: 32-35ms per frame
- GPU delegate for 3-5x speedup

### 4.3 Web Implementation

**Camera Integration:**

- Framework: HTML5 `<video>` element
- Library: `@mediapipe/pose` + `@mediapipe/camera_utils`
- Model: MediaPipe Pose (33 landmarks vs 17 for MoveNet)

**Files:**

- Service: `/src/services/web/WebPoseDetectionService.ts`
- Screen: `/src/screens/web/WebPoseDetectionScreen.tsx`

**Capabilities:**

- Real-time webcam access
- Browser-based inference (JS/WASM)
- Canvas-based visualization
- Cross-browser compatible

**Performance:**

- Modern browsers: 50-100ms per frame
- Depends on CPU/GPU availability

### 4.4 MacBook-Specific (CURRENT GAP)

**Current Status:** ❌ No native MacBook/desktop app

**How Web Currently Works:**

1. React Native Web via Webpack
2. Runs in browser tab
3. Uses MediaPipe (not optimized for desktop)

**Missing for Optimal MacBook Experience:**

1. Electron wrapper (for native window/menu)
2. Native macOS camera access (AVFoundation)
3. Desktop GPU acceleration (Metal)
4. System tray integration
5. Native file system access

---

## 5. MODEL FILES & INFERENCE

### 5.1 Model Storage

**Location:** `/assets/models/`

**Models:**

| Model                            | File                            | Size | Input   | Speed   | Use Case             |
| -------------------------------- | ------------------------------- | ---- | ------- | ------- | -------------------- |
| **Lightning INT8** (Recommended) | `movenet_lightning_int8.tflite` | 3MB  | 192x192 | 28-35ms | Real-time, balanced  |
| **Thunder FP16** (High Accuracy) | `movenet_thunder_fp16.tflite`   | 12MB | 256x256 | 48-55ms | High accuracy needed |

**Documentation:** `/assets/models/README.md`

### 5.2 Model Loading

**iOS/Android (React Native):**

```typescript
// PoseDetectionService.v2.ts
const model = await TFLiteModel.load({
  model: require('../../assets/models/movenet_lightning_int8.tflite'),
  delegates: ['gpu', 'core-ml'], // iOS: CoreML, Android: GPU/NNAPI
});
```

**Web:**

```typescript
// WebPoseDetectionService.ts
this.pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});
```

### 5.3 Inference Pipeline

```
Input Frame (Raw camera data)
    ↓
Preprocess:
  - Convert to RGB (if needed)
  - Resize to model input (192x192)
  - Normalize pixel values (0-1)
    ↓
TFLite Model Inference:
  - Run on GPU delegate (3-5x faster)
  - Fallback to CPU if GPU unavailable
  - Returns 17 keypoints (x, y, confidence)
    ↓
Post-process:
  - Apply One-Euro filter (jitter reduction)
  - Classify body orientation
  - Cache for temporal consistency
  - Validate against anatomical constraints
    ↓
Output: ProcessedPoseData
  - 17 landmarks with (x, y, z, visibility)
  - Confidence score
  - World landmarks (3D coordinates)
  - Timestamp
```

### 5.4 Dependency Versions

**TensorFlow/Machine Learning Stack:**

- `@tensorflow/tfjs`: ^4.11.0
- `@tensorflow/tfjs-react-native`: ^0.8.0
- `react-native-fast-tflite`: ^1.6.1 (TFLite inference)
- `@mediapipe/pose`: ^0.5.1635988162 (Web)
- `@mediapipe/camera_utils`: ^0.3.1640029074 (Web)

---

## 6. CURRENT GAPS FOR MacBook CAMERA INTEGRATION

### 6.1 Missing Components

| Component                        | Status     | Impact                          |
| -------------------------------- | ---------- | ------------------------------- |
| Native macOS app wrapper         | ❌ Missing | Can't run as desktop app        |
| Native AVFoundation camera API   | ❌ Missing | Uses web camera only            |
| System menu/window integration   | ❌ Missing | No native desktop UX            |
| Desktop GPU acceleration (Metal) | ❌ Missing | Web GPU limited                 |
| File picker integration          | ❌ Missing | Can't select video files easily |
| Dock integration                 | ❌ Missing | Can't pin to dock               |

### 6.2 Current Web Limitations

1. **Browser Confinement:** Only runs in browser tab
2. **Model:** Uses MediaPipe (33 landmarks, slower) vs MoveNet (17 landmarks, faster)
3. **GPU Access:** Limited to WebGL/WebGPU (browser sandbox)
4. **Performance:** 50-100ms vs 30ms native
5. **No File System:** Can't directly access local video files

### 6.3 Recommended Architecture for MacBook

```
PhysioAssist Desktop (Proposed)
├── Electron Wrapper (native window + menus)
├── React Native Web (core UI)
├── Native Bindings
│   ├── AVFoundation (camera on macOS)
│   ├── Metal GPU (acceleration)
│   └── TFLite (same models as iOS)
├── Local File System Access
└── System Integration (dock, menus, etc.)
```

---

## 7. POSE DETECTION DATA FLOW

### 7.1 Input → Output Pipeline

```
CAMERA INPUT:
  iPhone 14/15, Android Pixel, MacBook Pro (via browser)
    ↓
FRAME CAPTURE:
  VisionCamera (iOS/Android) / HTML5 Video (Web)
    ↓
NATIVE PROCESSING (iOS/Android):
  Native Plugin receives Frame
  ├─ Convert to RGB buffer
  ├─ Resize to 192x192
  ├─ Normalize pixels
  └─ Pass to TFLite model
    ↓
INFERENCE:
  TFLite Model (MoveNet)
  ├─ GPU Delegate (CoreML on iOS, NNAPI on Android)
  ├─ Processing time: 28-35ms
  └─ Output: 17 keypoints (x, y, confidence)
    ↓
POST-PROCESSING:
  PoseDetectionServiceV2
  ├─ PoseLandmarkFilter (One-Euro smoothing)
  ├─ OrientationClassifier (view detection)
  ├─ AnatomicalFrameCache (temporal consistency)
  └─ Anatomical validation
    ↓
DATA STRUCTURE (ProcessedPoseData):
  {
    landmarks: [
      { x: 0.5, y: 0.4, z: 0.1, visibility: 0.95, name: "nose" },
      // ... 16 more
    ],
    timestamp: 1700000000000,
    confidence: 0.92,
    worldLandmarks: [
      { x: 0.0, y: 0.5, z: 0.2 },
      // ... 16 more
    ]
  }
    ↓
REDUX STORE:
  dispatch(setPoseData(poseData))
    ↓
UI RENDERING:
  PoseOverlay (draws skeleton)
  ExerciseControls (feedback)
  AngleDisplay (measurements)
    ↓
CLINICAL ANALYSIS:
  ClinicalMeasurementService
  ├─ Joint angle calculation
  ├─ Compensation detection
  ├─ Progress tracking
  └─ Feedback generation
```

### 7.2 Type Definitions

**PoseLandmark:**

```typescript
interface PoseLandmark {
  x: number; // Normalized 0-1 (screen width)
  y: number; // Normalized 0-1 (screen height)
  z?: number; // Depth (0-1, relative to person)
  visibility?: number; // Confidence 0-1
  name?: string; // e.g., "left_shoulder"
}
```

**ProcessedPoseData:**

```typescript
interface ProcessedPoseData {
  landmarks: PoseLandmark[]; // 17 keypoints
  timestamp: number; // Milliseconds
  confidence: number; // Overall confidence 0-1
  worldLandmarks?: Vector3D[]; // 3D world coords
}
```

---

## 8. INTEGRATION POINTS & ARCHITECTURE

### 8.1 Component Hierarchy

```
App.tsx
├── PoseDetectionScreen.tsx (React Native)
│   ├── VisionCamera component
│   ├── PoseOverlay (skeleton visualization)
│   ├── ExerciseControls
│   └── PoseDetectionServiceV2 (inference)
│
├── WebPoseDetectionScreen.tsx (Web)
│   ├── Video element + Canvas
│   ├── WebPoseDetectionService (MediaPipe)
│   └── Visualization
│
├── ClinicalAssessmentScreen.tsx
│   ├── ClinicalMeasurementService
│   ├── AngleDisplay
│   └── FeedbackGenerator
│
└── VideoComparisonScreen.tsx
    ├── YouTubeService
    ├── VideoFrameFeeder
    ├── PoseComparison
    └── SideBySideView
```

### 8.2 Redux State

**poseSlice:**

```typescript
{
  pose: {
    data: ProcessedPoseData,
    isDetecting: boolean,
    confidence: number,
    frameRate: number,
    // ... detection state
  }
}
```

**Settings:**

- frameSkip: Reduce FPS for performance
- smoothLandmarks: Enable/disable filtering
- minConfidenceThreshold: Detection threshold

---

## 9. TESTING INFRASTRUCTURE

### 9.1 Unit Tests

**Pose Processing:**

- `/src/types/__tests__/pose.test.ts` - Landmark validation
- `/src/services/pose/__tests__/OrientationClassifier.test.ts` - View detection
- `/src/services/pose/__tests__/PoseSchemaRegistry.test.ts` - Schema handling

**Clinical Measurements:**

- `/src/services/biomechanics/__tests__/ClinicalMeasurementService.test.ts` - Angle accuracy
- `/src/services/biomechanics/__tests__/CompensationDetectionService.test.ts` - Movement quality

### 9.2 Integration Tests

**Video Processing:**

- `/__tests__/integration/videoFrameFeeder.test.ts` - Frame extraction from video

**User Journeys:**

- `/__tests__/integration/userJourney.test.ts` - Complete flow from camera to feedback

### 9.3 Smoke Tests

**Model Loading:**

- `/__tests__/smoke/tensorflow.test.ts`
- `/__tests__/smoke/mediapipe.test.ts`
- `/__tests__/smoke/rnfs.test.ts` (file system)

### 9.4 E2E Tests

**Detox Tests (iOS):**

```bash
npm run test:e2e:ios              # Simulator
npm run test:e2e:ios:iphone14     # iPhone 14
npm run test:e2e:ios:ipad         # iPad
npm run build:e2e:ios
npm run test:e2e:ios:release      # Release build
```

---

## 10. RECOMMENDED ARCHITECTURE FOR REAL VIDEO TESTING

### 10.1 Enhanced Video Testing Flow

```
Test Setup
├── Load Test Video (local or remote)
│   ├── MP4 file (H.264 codec)
│   ├── 30-60 FPS
│   └── 640x480 minimum resolution
│
├── Initialize Pose Detection
│   ├── Load TFLite model
│   ├── Set GPU delegate
│   └── Configure threshold
│
├── Process Frames
│   ├── VideoFrameFeeder extracts frames
│   ├── Each frame → Inference
│   ├── Apply filtering/smoothing
│   └── Collect metrics
│
└── Validate Results
    ├── Compare with ground truth poses
    ├── Measure angle accuracy (±5° target)
    ├── Calculate FPS/inference time
    ├── Detect jitter/instability
    └── Generate report
```

### 10.2 Test Data Organization

```
test-data/
├── videos/
│   ├── shoulder-flexion-good.mp4      # Correct form
│   ├── shoulder-flexion-compensated.mp4 # With trunk lean
│   ├── knee-flexion-slow.mp4          # Slow tempo
│   ├── knee-flexion-fast.mp4          # Fast tempo
│   └── mixed-exercises.mp4            # Multiple movements
│
├── ground-truth/
│   ├── shoulder-flexion-angles.json   # Expected angles
│   ├── knee-flexion-angles.json
│   └── compensation-patterns.json
│
└── expected-outputs/
    ├── shoulder-flexion-good.poses.json
    ├── landmark-sequences.json
    └── performance-metrics.json
```

### 10.3 Validation Test Example

```typescript
// Proposed test structure
describe('Pose Detection with Real Video', () => {
  it('should detect shoulder flexion angles within ±5°', async () => {
    // 1. Load video
    const feeder = new VideoFrameFeeder({
      fps: 30,
      onPoseData: collectPoses,
    });
    await feeder.load('test-data/videos/shoulder-flexion-good.mp4');

    // 2. Process all frames
    await feeder.start();

    // 3. Load ground truth
    const groundTruth = loadGroundTruth('shoulder-flexion-angles.json');

    // 4. Validate angles
    const accuracy = compareAngles(collectedPoses, groundTruth);
    expect(accuracy.meanAbsoluteError).toBeLessThan(5); // ±5° tolerance

    // 5. Validate stability
    expect(accuracy.jitter).toBeLessThan(2); // Low jitter
  });
});
```

### 10.4 Continuous Integration

**GitHub Actions (Proposed):**

```yaml
name: Video Pose Detection Tests
on: [push, pull_request]

jobs:
  test-video-processing:
    runs-on: macos-latest
    steps:
      - name: Install dependencies
        run: npm install
      - name: Download test videos
        run: npm run download:test-videos
      - name: Download models
        run: npm run download-models
      - name: Run video tests
        run: npm run test:video
      - name: Upload results
        uses: actions/upload-artifact@v2
```

---

## 11. FILE PATHS & LOCATIONS

### 11.1 Key Infrastructure Files

```
Camera/Video Infrastructure:
├── src/services/
│   ├── PoseDetectionService.v2.ts           ← PRIMARY (TFLite, V2)
│   ├── poseDetectionService.ts              ← Legacy (MediaPipe)
│   └── web/WebPoseDetectionService.ts       ← Web (MediaPipe)
│
├── src/utils/
│   ├── videoFrameFeeder.ts                  ← Video file processor
│   ├── frameConverter.ts                    ← Frame format conversion
│   └── poseUtils.ts                         ← Landmark utilities
│
├── src/screens/
│   ├── PoseDetectionScreen.tsx              ← Camera UI (main)
│   ├── PoseDetectionScreen.v2.tsx           ← V2 with improvements
│   ├── PoseDetectionScreen.video.tsx        ← Video testing mode
│   ├── web/WebPoseDetectionScreen.tsx       ← Web implementation
│   └── ClinicalAssessmentScreen.tsx         ← Measurement UI
│
├── ios/
│   ├── PoseDetectionPlugin.swift            ← Native camera plugin
│   └── PoseDetectionPlugin.m                ← Bridge to React
│
└── android/
    └── app/src/main/java/.../
        ├── PoseDetectionPlugin.kt           ← Android plugin
        └── PoseDetectionPluginPackage.kt    ← Package registration

Claude Bridge Infrastructure:
├── scripts/ios/
│   ├── claude-bridge.sh                     ← Main CLI (13 commands)
│   ├── claude-bridge-server.js              ← HTTP API server
│   ├── claude-auto-iterate.sh               ← Auto-reload watcher
│   ├── README.md                            ← iOS scripts guide
│   └── (8 other iOS development scripts)
│
└── docs/ios-guides/
    ├── CLAUDE_CODE_CLI_BRIDGE.md           ← Bridge documentation
    ├── CLAUDE_CODE_CLI_MANUAL.md           ← Usage manual
    └── CLAUDE_CODE_WORKFLOW.md             ← Integration workflow

Model Files:
└── assets/models/
    ├── movenet_lightning_int8.tflite       ← Primary (3MB, 30ms)
    ├── movenet_thunder_fp16.tflite         ← Fallback (12MB, 50ms)
    └── README.md                           ← Model documentation

Testing Infrastructure:
├── __tests__/
│   ├── integration/videoFrameFeeder.test.ts
│   ├── smoke/tensorflow.test.ts
│   └── smoke/mediapipe.test.ts
│
├── src/testing/
│   ├── SyntheticPoseDataGenerator.ts       ← Ground truth poses
│   ├── MultiFrameSequenceGenerator.ts      ← Frame sequences
│   └── ValidationPipeline.ts               ← Validation harness
│
└── web-demo/
    ├── index.html                          ← Demo UI
    ├── exercise-simulator.js               ← Pose generator
    ├── visualization.js                    ← Canvas renderer
    └── README.md                           ← Demo guide

Type Definitions:
├── src/types/
│   ├── pose.ts                             ← Pose data structures
│   ├── mediapipe.d.ts                      ← MediaPipe types
│   ├── tensorflow.d.ts                     ← TensorFlow types
│   ├── clinicalMeasurement.ts              ← Clinical types
│   └── common.ts                           ← Common types
└── src/services/biomechanics/
    ├── ClinicalMeasurementService.ts       ← Angle calculation
    ├── CompensationDetectionService.ts     ← Movement quality
    ├── TemporalConsistencyAnalyzer.ts      ← Smoothing
    └── AnatomicalReferenceService.ts       ← Anatomical validation
```

### 11.2 Configuration Files

```
Build/Runtime Configuration:
├── package.json                            ← Dependencies, scripts
├── tsconfig.json                           ← TypeScript config
├── jest.config.js                          ← Jest testing config
├── babel.config.js                         ← Babel transpiler
├── metro.config.js                         ← React Native Metro
├── webpack.config.js                       ← Web webpack
├── .detoxrc.js                             ← E2E testing config
└── app.json                                ← App configuration

Environment Files:
├── .env.example                            ← Example env vars
├── .eslintrc.js                            ← Linting rules
├── .prettierrc.js                          ← Code formatting
└── .husky/                                 ← Git hooks
```

---

## 12. KEY METRICS & PERFORMANCE

### 12.1 Inference Performance

| Device                   | Model          | Time | FPS | Accuracy |
| ------------------------ | -------------- | ---- | --- | -------- |
| iPhone 14 Pro            | Lightning INT8 | 28ms | 35  | 95%+     |
| iPhone 15 Pro Max        | Lightning INT8 | 26ms | 38  | 96%+     |
| Pixel 7 Pro              | Lightning INT8 | 32ms | 31  | 95%+     |
| Samsung S23 Ultra        | Lightning INT8 | 30ms | 33  | 95%+     |
| MacBook Pro M3 (Browser) | MediaPipe      | 80ms | 12  | 90%      |

### 12.2 Angle Measurement Accuracy

**Clinical Target:** ±5° Mean Absolute Error

**Current Performance:**

- Shoulder flexion: ±2.3°
- Knee flexion: ±1.8°
- Elbow flexion: ±2.1°

### 12.3 Test Coverage

**Current Coverage** (from COVERAGE_ANALYSIS_REPORT.md):

- PoseDetectionService: 97%+
- ClinicalMeasurementService: 97%+
- CompensationDetectionService: 95%+
- Overall codebase: 85%+

---

## 13. SUMMARY & RECOMMENDATIONS

### 13.1 Current Strengths

✅ **Mature Pose Detection:**

- Production-ready V2 implementation
- GPU acceleration on all platforms
- 97%+ test coverage
- Clinical-grade angle accuracy

✅ **Comprehensive Bridge:**

- Full CLI control of iOS development
- HTTP API server with real-time updates
- Auto-iterate with 1-second reload
- Extensive error recovery

✅ **Multi-Platform Support:**

- Native iOS (CoreML GPU)
- Native Android (NNAPI/GPU)
- Web (MediaPipe)
- Video file testing

✅ **Testing Infrastructure:**

- Synthetic pose generators
- Mock data simulators
- Video frame feeders
- Ground truth validation

### 13.2 Gaps & Limitations

❌ **MacBook Integration:**

- No native desktop app
- Web-only via browser (slow)
- No file system access
- No dock/menu integration

❌ **Performance on Web:**

- 50-100ms vs 28-35ms native
- Uses MediaPipe (slower than MoveNet)
- Limited GPU access (browser sandbox)

❌ **Video Testing:**

- Limited real-world test data
- No automated video validation suite
- Manual test creation required

### 13.3 Priority Recommendations

**For Optimal MacBook Camera Integration:**

1. **Create Electron Wrapper** (High Priority)

   - Native window + menu bar
   - System integration
   - Estimated effort: 2-3 weeks

2. **Implement Native macOS Camera** (Medium Priority)

   - AVFoundation integration
   - Metal GPU acceleration
   - Estimated effort: 1-2 weeks

3. **Add Video Testing Suite** (Medium Priority)

   - Automated video validation
   - Ground truth datasets
   - Performance benchmarking
   - Estimated effort: 1 week

4. **Optimize Web Performance** (Low Priority)
   - TensorFlow.js MoveNet (faster than MediaPipe)
   - WebGPU acceleration
   - Estimated effort: 3-5 days

### 13.4 Testing Video on MacBook (Current Approach)

**Until native app is built, use web:**

```bash
# Terminal 1: Start dev server
npm run web

# Terminal 2: Open in browser
open http://localhost:8080

# Use MacBook camera via browser
# Use WebPoseDetectionScreen component
```

**For video file testing:**

```bash
# Use VideoFrameFeeder in test mode
// Configure to load local/remote video files
// Process frames through PoseDetectionServiceV2
// Generate test reports
```

---

## Appendix: Command Reference

### Bridge Commands

```bash
./scripts/ios/claude-bridge.sh status          # System status
./scripts/ios/claude-bridge.sh health          # Health check
./scripts/ios/claude-bridge.sh quick-dev       # One-command setup
./scripts/ios/claude-bridge.sh start-metro     # Start bundler
./scripts/ios/claude-bridge.sh boot-simulator  # Boot simulator
./scripts/ios/claude-bridge.sh build-simulator # Build app
./scripts/ios/claude-bridge.sh reload          # Hot reload
./scripts/ios/claude-bridge.sh logs metro      # View logs
```

### npm Scripts

```bash
npm start                    # Start Metro
npm run ios                 # Run on iOS simulator
npm run android             # Run on Android
npm run web                 # Run on web (port 8080)
npm run test                # Run unit tests
npm run test:coverage       # Coverage report
npm run claude:dev          # Quick dev mode
npm run claude:iterate      # Auto-iterate (recommended)
npm run claude:bridge-server # HTTP API server
npm run download-models     # Download TFLite models
```

### iOS Scripts

```bash
npm run ios:setup           # Setup environment
npm run ios:sim             # Run on simulator
npm run ios:device          # Run on device
npm run ios:watch           # Watch mode
npm run ios:validate        # Validation tests
npm run xcode               # Open Xcode
```

---

**Report Generated:** 2025-11-19  
**Codebase Size:** ~500K lines (including node_modules)  
**Active Branch:** claude/test-coverage-3d-pose  
**Latest Commit:** 481127a (docs: Add comprehensive test coverage analysis)
