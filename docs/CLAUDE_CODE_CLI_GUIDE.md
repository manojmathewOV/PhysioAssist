# Claude Code CLI Integration Guide

## Complete Local System Testing, Validation, and Development Workflow

**Last Updated:** 2025-11-19
**Branch:** claude/test-coverage-3d-pose-01XyKEfBWShvuXCYih1uHUtQ
**For:** PhysioAssist 3D Pose Estimation & Biomechanics

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Installation & Setup](#installation--setup)
4. [Claude Code CLI Bridge](#claude-code-cli-bridge)
5. [MacBook Testing Workflow](#macos-testing-workflow)
6. [Validation & Testing Commands](#validation--testing-commands)
7. [Development Iteration Workflow](#development-iteration-workflow)
8. [Upgrade & Deployment](#upgrade--deployment)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Usage](#advanced-usage)

---

## 🎯 Overview

This guide shows you how to use **Claude Code CLI** on your local MacBook to:

✅ **Test** - Run comprehensive tests with real camera data
✅ **Validate** - Verify 3D pose estimation accuracy and performance
✅ **Develop** - Iterate quickly with hot-reload and auto-testing
✅ **Upgrade** - Improve coverage and implement new features
✅ **Deploy** - Push changes with confidence

### System Architecture

```
Your MacBook
    ↓
Claude Code CLI (this terminal)
    ↓
┌─────────────────────────────────────────┐
│  Testing Infrastructure                 │
│  ├─ MacBook Camera Testing             │
│  ├─ Video File Testing                 │
│  ├─ Benchmark Suite                    │
│  └─ Performance Validation             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Claude Code Bridge Server (HTTP)      │
│  ├─ Real-time Updates (SSE)            │
│  ├─ Status Monitoring                  │
│  ├─ Build & Deploy Commands            │
│  └─ Auto-Iteration Mode                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  PhysioAssist Services                 │
│  ├─ Pose Detection (MoveNet/MediaPipe) │
│  ├─ Clinical Measurements              │
│  ├─ Compensation Detection             │
│  └─ Biomechanics Analysis              │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### One-Line Test Commands

```bash
# Test with MacBook camera (opens browser)
npm run test:macos:camera

# Run comprehensive benchmark
npm run test:macos:benchmark

# Test with pre-recorded video
npm run test:macos:video -- ./my-video.mp4

# Run all unit tests with coverage
npm run test:coverage
```

### Quick Validation

```bash
# Check if everything works
npm run test                    # Unit tests
npm run type-check              # TypeScript validation
npm run lint                    # Code quality check

# Gate validation (feature completeness)
npm run gate:validate           # All gates
npm run gate:validate:0         # Specific gate
```

---

## 🔧 Installation & Setup

### Prerequisites

**Required:**

- macOS (tested on macOS 10.15+)
- Node.js 16+ and npm
- Git
- Chrome or Safari (for camera testing)

**Optional:**

- Camera/webcam for live testing
- Test videos (MP4, MOV) for automated validation

### Initial Setup

1. **Clone Repository**

   ```bash
   cd ~/Projects
   git clone https://github.com/manojmathewOV/PhysioAssist.git
   cd PhysioAssist
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Download ML Models**

   ```bash
   npm run download-models
   ```

   This downloads:

   - `movenet_lightning_int8.tflite` (3MB, recommended)
   - `movenet_thunder_fp16.tflite` (12MB, high accuracy)

4. **Verify Installation**

   ```bash
   npm run type-check          # Should pass with 0 errors
   npm test                    # Should run tests successfully
   ```

5. **Grant Camera Permissions** (for live testing)
   - System Preferences → Security & Privacy → Camera
   - Enable for Chrome/Safari

### Directory Structure

```
PhysioAssist/
├── src/
│   ├── services/
│   │   ├── biomechanics/              # Clinical measurements
│   │   ├── pose/                      # Pose detection
│   │   └── PoseDetectionService.v2.ts # Main pose service
│   ├── testing/
│   │   ├── MacBookVideoTestHarness.ts # MacBook testing
│   │   └── SyntheticPoseDataGenerator.ts
│   └── types/                         # TypeScript types
├── scripts/
│   ├── macos-test-runner.js          # MacBook test CLI
│   └── ios/                           # Claude bridge scripts
│       ├── claude-bridge.sh           # Main bridge
│       ├── claude-bridge-server.js    # HTTP server
│       └── claude-auto-iterate.sh     # Auto-reload
├── docs/
│   ├── MACOS_TESTING_GUIDE.md        # MacBook testing guide
│   └── CLAUDE_CODE_CLI_GUIDE.md      # This file
└── package.json                       # npm scripts
```

---

## 🌉 Claude Code CLI Bridge

The Claude Code CLI Bridge enables real-time development with Claude AI assistance.

### Bridge Architecture

```
Claude Code CLI (Your Terminal)
        ↓
HTTP Server (localhost:3737)
        ↓
Server-Sent Events (SSE) - Real-time Updates
        ↓
Metro Bundler / Webpack / Test Runner
        ↓
Auto-Reload on File Changes
```

### Starting the Bridge

#### Method 1: Quick Development Mode

```bash
npm run claude:dev
```

**What it does:**

- Starts HTTP server on port 3737
- Enables real-time status updates via SSE
- Auto-reloads on file changes
- Monitors test results

**Output:**

```
🌉 Claude Code Bridge - Quick Dev Mode
════════════════════════════════════════
✅ HTTP Server: http://localhost:3737
✅ SSE Stream:  http://localhost:3737/events
✅ Status:      http://localhost:3737/status

📡 Listening for Claude Code commands...
```

#### Method 2: Full Bridge Mode

```bash
npm run claude:bridge
```

**Available commands:**

- `status` - Check system health
- `health` - Detailed health report
- `build` - Build project
- `deploy` - Deploy to device
- `reload` - Hot reload
- `logs` - View logs
- `test` - Run tests
- `validate` - Run gate validation

**Example:**

```bash
npm run claude:bridge status
```

#### Method 3: Auto-Iterate Mode (Advanced)

```bash
npm run claude:iterate
```

**What it does:**

- Watches all source files for changes
- Auto-runs tests on file save
- Auto-reloads Metro bundler
- Recovers from crashes
- 1-second debounce to avoid spam

**Perfect for:**

- Rapid development cycles
- Test-driven development
- Live debugging

### Bridge API Endpoints

When bridge server is running on `http://localhost:3737`:

| Endpoint    | Method | Description                    |
| ----------- | ------ | ------------------------------ |
| `/status`   | GET    | System status JSON             |
| `/health`   | GET    | Detailed health check          |
| `/events`   | GET    | SSE stream (real-time updates) |
| `/build`    | POST   | Trigger build                  |
| `/reload`   | POST   | Hot reload                     |
| `/test`     | POST   | Run test suite                 |
| `/validate` | POST   | Run gate validation            |

**Example Usage:**

```bash
# Get status
curl http://localhost:3737/status

# Trigger build
curl -X POST http://localhost:3737/build

# Stream real-time updates
curl http://localhost:3737/events
```

### Bridge Configuration

Edit `.claude/config.json` (if it exists) or use defaults:

```json
{
  "bridge": {
    "port": 3737,
    "autoReload": true,
    "watchPaths": ["src/**/*.ts", "src/**/*.tsx"],
    "debounceMs": 1000
  }
}
```

---

## 🎥 MacBook Testing Workflow

### Overview

The MacBook testing infrastructure enables testing 3D pose estimation with:

- Live camera feed
- Pre-recorded videos
- Synthetic data with ground truth
- Performance benchmarking

### Test Scenario 1: Live Camera Testing

**Use Case:** Test with real-time movements

```bash
npm run test:macos:camera
```

**What happens:**

1. Starts webpack dev server (port 8080)
2. Opens browser to camera interface
3. Prompts for camera permissions
4. Displays real-time pose detection
5. Shows joint angles and compensations

**Instructions shown:**

```
🎥 Starting MacBook camera test...
📊 Target: 30 FPS, 300 frames
🎯 Accuracy tolerance: ±5°

🌐 Open browser to: http://localhost:8080/camera-test
📹 Grant camera permissions and perform test movements
```

**Camera Interface Features:**

- Real-time pose overlay on video
- Joint angle measurements (shoulder, elbow, knee)
- Compensation detection (trunk lean, shoulder hiking)
- FPS counter
- Quality score

**Test Movements:**

1. **Shoulder Flexion** - Raise arms forward
2. **Shoulder Abduction** - Raise arms sideways
3. **Elbow Flexion** - Bend elbows
4. **Knee Flexion** - Lift foot back

### Test Scenario 2: Video File Testing

**Use Case:** Validate against pre-recorded movements with known angles

```bash
npm run test:macos:video -- /path/to/video.mp4
```

**Example:**

```bash
# Test shoulder flexion video
npm run test:macos:video -- ~/Videos/shoulder-flexion-90deg.mp4

# Test with custom tolerance
npm run test:macos:video -- ./test-videos/shoulder-abduction.mp4
```

**Output:**

```
🎬 Processing video: /Users/you/Videos/shoulder-flexion-90deg.mp4
📊 Target: 30 FPS, max Infinity frames
⏳ Processing frames...

Frame 0/150 - right_shoulder: 60.2° (GT: 60.0°) - 45.3 FPS
Frame 30/150 - right_shoulder: 75.1° (GT: 75.0°) - 46.1 FPS
Frame 60/150 - right_shoulder: 90.3° (GT: 90.0°) - 44.8 FPS
...

📊 TEST RESULTS
═══════════════════════════════════════════════════════════
Frames Processed:     150
Average FPS:          45.2
Average Processing:   22.13ms/frame
Mean Absolute Error:  0.47°
Accuracy Status:      ✅ PASS

📈 PERFORMANCE METRICS
───────────────────────────────────────────────────────────
Min FPS:              38.5
Max FPS:              52.1
P50 Latency:          21.50ms
P95 Latency:          28.30ms
P99 Latency:          31.20ms
```

**Success Criteria:**

- ✅ MAE < 5° (mean absolute error)
- ✅ Average FPS > 30
- ✅ P95 latency < 33ms

### Test Scenario 3: Comprehensive Benchmark

**Use Case:** Validate all movement types automatically

```bash
npm run test:macos:benchmark
```

**What it tests:**

1. Shoulder flexion (0-180°)
2. Shoulder abduction (0-180°)
3. Elbow flexion (0-150°)
4. Knee flexion (0-135°)

**Output:**

```
🏃 Running comprehensive benchmark suite...

🎯 Benchmarking shoulder_flexion...
  ✓ shoulder_flexion: 45.2 FPS, MAE: 0.47°

🎯 Benchmarking shoulder_abduction...
  ✓ shoulder_abduction: 44.8 FPS, MAE: 0.52°

🎯 Benchmarking elbow_flexion...
  ✓ elbow_flexion: 46.1 FPS, MAE: 0.38°

🎯 Benchmarking knee_flexion...
  ✓ knee_flexion: 45.7 FPS, MAE: 0.41°

📊 BENCHMARK SUMMARY
═══════════════════════════════════════════════════════════
shoulder_flexion          | 45.2 FPS | MAE: 0.47° | 150 frames
shoulder_abduction        | 44.8 FPS | MAE: 0.52° | 150 frames
elbow_flexion             | 46.1 FPS | MAE: 0.38° | 150 frames
knee_flexion              | 45.7 FPS | MAE: 0.41° | 150 frames
```

### Creating Test Videos

**Best Practices:**

1. **Camera Setup**

   - Distance: 6-10 feet
   - Height: Chest/shoulder level
   - Lighting: Bright, even
   - Background: Solid color, contrasting

2. **Recording**

   ```bash
   # Using QuickTime (built-in)
   # File → New Movie Recording → Record

   # Using ffmpeg
   ffmpeg -f avfoundation -framerate 30 -video_size 1280x720 -i "0" output.mp4
   ```

3. **Movements**

   - Start position: Neutral stance
   - Speed: Slow, controlled (2-3 sec per rep)
   - Range: Full ROM
   - Reps: 3-5 per video
   - Pause: 1 sec at start/end

4. **Naming Convention**
   ```
   shoulder-flexion-[angle].mp4
   shoulder-abduction-[angle].mp4
   elbow-flexion-[angle].mp4
   knee-flexion-[angle].mp4
   ```

### Advanced Testing

#### Programmatic API

```typescript
import { MacBookVideoTestHarness } from './src/testing/MacBookVideoTestHarness';

const harness = new MacBookVideoTestHarness();

// Test with custom configuration
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

#### Batch Testing

```bash
#!/bin/bash
# test-all-videos.sh

for video in ./test-videos/*.mp4; do
  echo "Testing: $video"
  npm run test:macos:video -- "$video"
  echo "─────────────────────────────────────"
done
```

---

## ✅ Validation & Testing Commands

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on changes)
npm run test:watch

# Specific test file
npm test -- ClinicalMeasurementService.test.ts

# Specific test pattern
npm test -- --testNamePattern="shoulder flexion"
```

### Integration Tests

```bash
# Run integration test suite
npm run test:integration

# Infrastructure tests (telemetry, quota, device health)
npm run test:infrastructure
```

### Type Checking

```bash
# Check TypeScript types
npm run type-check

# Watch mode
npm run type-check -- --watch
```

### Linting

```bash
# Check code quality
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Gate Validation

PhysioAssist uses "gates" to track feature completeness.

```bash
# Validate all gates
npm run gate:validate

# Specific gates
npm run gate:validate:0    # Gate 0: Foundation
npm run gate:validate:1    # Gate 1: Pose Detection
npm run gate:validate:2    # Gate 2: Smoothing & Jitter
npm run gate:validate:3    # Gate 3: Clinical Measurements
```

**Example Output:**

```
🚪 Gate Validation Report
═══════════════════════════════════════════════════════════

Gate 0: Foundation ✅ PASSED
  ✓ Project structure
  ✓ Dependencies installed
  ✓ Models downloaded
  ✓ TypeScript configured

Gate 1: Pose Detection ✅ PASSED
  ✓ MoveNet integration
  ✓ MediaPipe fallback
  ✓ Schema registry (MoveNet-17, MediaPipe-33)
  ✓ 97% test coverage

Gate 2: Smoothing & Jitter Reduction ✅ PASSED
  ✓ One-Euro filter
  ✓ Kalman filter
  ✓ Temporal consistency
  ✓ <5ms latency overhead

Gate 3: Clinical Measurements ⚠️  IN PROGRESS
  ✓ Shoulder flexion/abduction/rotation
  ✓ Elbow flexion
  ✓ Knee flexion
  ⚠  Hip flexion (not implemented)
  ⚠  Ankle measurements (not implemented)

Summary: 3/4 gates passed (75%)
```

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser
open coverage/lcov-report/index.html
```

**Coverage Thresholds** (in `jest.config.js`):

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

**Current Status:**

- Statements: 90.29%
- Branches: 80.32%
- Lines: 97.19%
- Functions: 89.93%

---

## 🔄 Development Iteration Workflow

### Standard Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Start auto-iterate mode
npm run claude:iterate

# 3. Edit code in your editor
# (Tests run automatically on save)

# 4. When ready, commit
git add .
git commit -m "feat: Add my feature"

# 5. Push to remote
git push origin feature/my-feature
```

### With Claude Code CLI

**Typical Session:**

```bash
# Terminal 1: Start Claude bridge
npm run claude:dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Use Claude Code CLI
claude-code
```

**In Claude Code CLI:**

```
> Help me implement hip flexion measurement

[Claude analyzes code and implements feature]

> Run tests to verify

[Claude runs: npm test -- hip]

> The test failed. Let me see the error

[Claude reads test output and fixes issue]

> Commit the changes

[Claude commits with descriptive message]
```

### Fast Iteration Loop

**Goal:** < 5 seconds from code change to test result

```bash
# 1. Enable fast mode
npm run claude:dev &
npm run test:watch &

# 2. Make code changes
vim src/services/biomechanics/ClinicalMeasurementService.ts

# 3. Save file (Cmd+S)
# → Tests run automatically
# → Results appear in terminal

# 4. If tests pass, commit
git add . && git commit -m "feat: Add feature"
```

### Hot Reload for Web Testing

```bash
# Terminal 1: Start web server with hot reload
npm run web

# Terminal 2: Start MacBook camera test
npm run test:macos:camera

# Make changes to code
# → Browser auto-reloads
# → See changes immediately in camera interface
```

---

## 🚀 Upgrade & Deployment

### Upgrading Test Coverage

**Current:** 90.29% → **Target:** 100%

#### Phase 1: Quick Wins (✅ Completed)

```bash
# Already implemented - 32 tests added
git log --oneline | grep "Phase 1"
```

#### Phase 2: Clinical Completeness

```bash
# Implement missing features
npm run claude:dev

# In Claude Code CLI:
> Implement pelvis frame calculation (ISB-compliant)
> Add tests for pelvis frame

> Implement forearm frame calculation
> Add tests for forearm frame

> Implement hip flexion measurement
> Add tests for hip flexion

> Run coverage report
npm run test:coverage
```

**Target:** 44 additional tests → 97% coverage

#### Phase 3: Edge Cases

```bash
# Add boundary condition tests
> Add tests for 0°, 90°, 180°, 360° angles
> Add tests for visibility thresholds (0, 0.5, 0.7, 1.0)
> Add tests for temporal anomalies
```

**Target:** 30 additional tests → 98% coverage

### Deploying to iOS/Android

#### iOS Deployment

```bash
# 1. Build iOS app
npm run ios:setup
npm run ios:cli build

# 2. Run on simulator
npm run ios:sim

# 3. Run on physical device
npm run ios:device

# 4. Validate
npm run ios:validate
```

#### Android Deployment

```bash
# Build and run
npm run android
```

### Web Deployment

```bash
# Build for production
npm run build:web

# Deploy (example: Netlify)
netlify deploy --prod --dir=dist
```

### Continuous Integration

**GitHub Actions Example:**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run test:macos:benchmark
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Camera Not Detected

**Symptoms:**

```
❌ Error: Camera not accessible
```

**Solution:**

```bash
# Check camera permissions
system_profiler SPCameraDataType

# Grant permissions
# System Preferences → Security & Privacy → Camera → Chrome/Safari

# Verify camera works
# Open Photo Booth app
```

#### Issue 2: Tests Failing

**Symptoms:**

```
FAIL src/services/__tests__/ClinicalMeasurementService.test.ts
```

**Debug Steps:**

```bash
# 1. Run specific test
npm test -- --verbose ClinicalMeasurementService.test.ts

# 2. Check TypeScript errors
npm run type-check

# 3. Clear cache
rm -rf node_modules/.cache
npm test

# 4. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue 3: Bridge Server Not Starting

**Symptoms:**

```
Error: Port 3737 already in use
```

**Solution:**

```bash
# Find and kill process on port 3737
lsof -ti:3737 | xargs kill -9

# Or use different port
PORT=3738 npm run claude:bridge-server
```

#### Issue 4: Models Not Found

**Symptoms:**

```
Error: Model file not found: assets/models/movenet_lightning_int8.tflite
```

**Solution:**

```bash
# Download models manually
npm run download-models

# Or download directly
mkdir -p assets/models
cd assets/models
curl -O https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/int8/4?lite-format=tflite
mv 4?lite-format=tflite movenet_lightning_int8.tflite
```

#### Issue 5: Low FPS / High Latency

**Symptoms:**

```
Average FPS: 15.2  (expected >30)
P95 Latency: 82.3ms  (expected <33ms)
```

**Solutions:**

```bash
# 1. Close other apps
# Activity Monitor → Quit resource-heavy apps

# 2. Use lower resolution
# Edit WebPoseDetectionService.ts:
# targetWidth: 640 (instead of 1280)
# targetHeight: 480 (instead of 720)

# 3. Use lightning model (faster)
# Uses movenet_lightning_int8.tflite by default

# 4. Check GPU acceleration
# For web: Enable Hardware Acceleration in Chrome
# chrome://settings → Advanced → System → Use hardware acceleration
```

### Debugging Tips

#### Enable Verbose Logging

```typescript
// In any service file
console.log('[DEBUG]', 'Variable value:', variable);
```

#### Inspect Pose Data

```typescript
// Log pose landmarks
console.log('Pose landmarks:', JSON.stringify(poseData.landmarks, null, 2));

// Log anatomical frames
console.log('Frames:', poseData.cachedAnatomicalFrames);

// Log measurements
console.log('Measurement:', JSON.stringify(measurement, null, 2));
```

#### Test in Isolation

```bash
# Test single file
npm test -- --testPathPattern=ClinicalMeasurementService

# Test single function
npm test -- --testNamePattern="measureShoulderFlexion"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
# Then open chrome://inspect in Chrome
```

### Getting Help

**Documentation:**

- MacBook Testing: `docs/MACOS_TESTING_GUIDE.md`
- Test Coverage: `COVERAGE_ANALYSIS_REPORT.md`
- Infrastructure: `CAMERA_VIDEO_INFRASTRUCTURE_REPORT.md`

**Claude Code CLI:**

```bash
# Within Claude Code session
> Help me debug the test failure
> Show me how to implement [feature]
> Explain the architecture of [component]
```

**GitHub Issues:**

```bash
# Report bugs
open https://github.com/manojmathewOV/PhysioAssist/issues/new
```

---

## 🚀 Advanced Usage

### Custom Test Scenarios

#### Scenario 1: Test with Custom Ground Truth

```typescript
// custom-test.ts
import { MacBookVideoTestHarness } from './src/testing/MacBookVideoTestHarness';

async function testCustomMovement() {
  const harness = new MacBookVideoTestHarness();

  const results = await harness.testWithVideoFile({
    videoPath: './my-custom-movement.mp4',
    groundTruth: {
      primaryMeasurement: {
        joint: 'right_shoulder',
        angle: 145, // Custom angle
        plane: 'scapular',
        movement: 'abduction',
      },
      secondaryMeasurements: [
        {
          joint: 'right_elbow',
          angle: 180, // Should be extended
        },
      ],
      compensations: [
        {
          type: 'trunk_lean',
          magnitude: 8,
          expectedSeverity: 'mild',
        },
      ],
      testCase: 'custom_movement_test',
    },
    accuracyTolerance: 3, // Stricter tolerance
  });

  // Assert custom conditions
  if (results.meanAbsoluteError! > 3) {
    throw new Error(`Accuracy too low: ${results.meanAbsoluteError}°`);
  }

  console.log('✅ Custom test passed!');
}

testCustomMovement();
```

#### Scenario 2: Automated Regression Testing

```bash
#!/bin/bash
# regression-test.sh

echo "🧪 Running Regression Test Suite"

# Baseline videos with known-good results
VIDEOS=(
  "baseline/shoulder-flexion-90.mp4:90:5"
  "baseline/shoulder-abduction-120.mp4:120:5"
  "baseline/elbow-flexion-90.mp4:90:3"
)

for video_config in "${VIDEOS[@]}"; do
  IFS=':' read -r video expected_angle tolerance <<< "$video_config"

  echo "Testing: $video (expected: ${expected_angle}°, tolerance: ±${tolerance}°)"

  npm run test:macos:video -- "$video" > /tmp/test-output.txt

  # Parse results
  mae=$(grep "Mean Absolute Error" /tmp/test-output.txt | awk '{print $4}' | tr -d '°')

  if (( $(echo "$mae < $tolerance" | bc -l) )); then
    echo "✅ PASS: MAE = ${mae}°"
  else
    echo "❌ FAIL: MAE = ${mae}° (tolerance: ${tolerance}°)"
    exit 1
  fi
done

echo "✅ All regression tests passed!"
```

### Performance Profiling

```bash
# Profile test execution
node --prof node_modules/.bin/jest

# Process profile
node --prof-process isolate-*.log > profile.txt

# Analyze
cat profile.txt | grep -A 10 "Statistical profiling"
```

### CI/CD Integration

#### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh

echo "🧪 Running pre-commit checks..."

# Type check
npm run type-check || exit 1

# Lint
npm run lint || exit 1

# Tests
npm test || exit 1

echo "✅ Pre-commit checks passed!"
```

#### Pre-push Hook

```bash
# .husky/pre-push
#!/bin/sh

echo "🚀 Running pre-push validation..."

# Full test suite with coverage
npm run test:coverage || exit 1

# Coverage threshold check
COVERAGE=$(npm run test:coverage --silent | grep "All files" | awk '{print $10}' | tr -d '%')

if (( $(echo "$COVERAGE < 90" | bc -l) )); then
  echo "❌ Coverage too low: ${COVERAGE}% (minimum: 90%)"
  exit 1
fi

echo "✅ Pre-push validation passed!"
```

### Custom npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:custom": "jest --testPathPattern=__tests__/custom",
    "test:watch:coverage": "jest --watch --coverage",
    "validate:all": "npm run type-check && npm run lint && npm run test:coverage && npm run gate:validate",
    "dev:full": "concurrently \"npm run claude:dev\" \"npm run test:watch\" \"npm run web\"",
    "benchmark:nightly": "npm run test:macos:benchmark > benchmark-$(date +%Y%m%d).log"
  }
}
```

---

## 📚 Reference

### Key Files

| File                                                        | Purpose                      |
| ----------------------------------------------------------- | ---------------------------- |
| `src/testing/MacBookVideoTestHarness.ts`                    | MacBook testing API          |
| `src/testing/SyntheticPoseDataGenerator.ts`                 | Ground truth data generation |
| `src/services/biomechanics/ClinicalMeasurementService.ts`   | Joint measurements           |
| `src/services/biomechanics/CompensationDetectionService.ts` | Compensation detection       |
| `scripts/macos-test-runner.js`                              | CLI test runner              |
| `scripts/ios/claude-bridge.sh`                              | Claude Code bridge           |
| `scripts/ios/claude-auto-iterate.sh`                        | Auto-iteration mode          |

### npm Scripts Reference

```bash
# Testing
npm test                    # Unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:macos:camera   # MacBook camera
npm run test:macos:video    # Video file
npm run test:macos:benchmark # Benchmark suite

# Validation
npm run type-check          # TypeScript
npm run lint                # ESLint
npm run lint:fix            # Auto-fix
npm run gate:validate       # Gate validation

# Claude Bridge
npm run claude:bridge       # Bridge CLI
npm run claude:dev          # Quick dev mode
npm run claude:iterate      # Auto-iterate
npm run claude:status       # Status check

# Build & Deploy
npm run web                 # Dev server
npm run build:web           # Production build
npm run ios:cli             # iOS CLI
npm run android             # Android build
```

### Environment Variables

```bash
# Port for Claude bridge server
PORT=3737

# Test configuration
TEST_TIMEOUT=10000
TEST_RETRIES=3

# Model paths
MODEL_PATH=assets/models
MOVENET_MODEL=movenet_lightning_int8.tflite

# Performance
MAX_FPS=60
TARGET_LATENCY_MS=33
```

---

## 🎓 Best Practices

### Testing

1. **Always test with real data** - Use MacBook camera or videos
2. **Validate against ground truth** - Use `SyntheticPoseDataGenerator`
3. **Check performance** - Ensure >30 FPS, <33ms latency
4. **Test edge cases** - 0°, 180°, low visibility, occlusion
5. **Use watch mode** - Iterate faster with `npm run test:watch`

### Development

1. **Use auto-iterate mode** - `npm run claude:iterate`
2. **Run tests before committing** - Automated with husky hooks
3. **Keep coverage >90%** - Check with `npm run test:coverage`
4. **Follow TypeScript** - No `any` types, strict mode enabled
5. **Document as you go** - Update docs when adding features

### Claude Code CLI

1. **Start bridge first** - `npm run claude:dev`
2. **Use specific commands** - "Run shoulder flexion tests" not "test"
3. **Provide context** - Show error messages, file paths
4. **Iterate quickly** - Make small changes, test often
5. **Commit frequently** - Small, focused commits

---

## 🏁 Quick Reference Card

**Print this for your desk!**

```
┌─────────────────────────────────────────────────────────┐
│              CLAUDE CODE CLI - QUICK REFERENCE          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🧪 TESTING                                             │
│  npm test                  - Run all tests              │
│  npm run test:macos:camera - Live camera                │
│  npm run test:macos:video -- video.mp4                  │
│  npm run test:macos:benchmark                           │
│                                                          │
│  🌉 CLAUDE BRIDGE                                       │
│  npm run claude:dev        - Start bridge               │
│  npm run claude:iterate    - Auto-reload mode           │
│                                                          │
│  ✅ VALIDATION                                          │
│  npm run type-check        - TypeScript                 │
│  npm run lint              - Code quality               │
│  npm run test:coverage     - Coverage report            │
│  npm run gate:validate     - Feature validation         │
│                                                          │
│  🚀 QUICK WORKFLOW                                      │
│  1. npm run claude:dev &                                │
│  2. npm run test:watch &                                │
│  3. [Edit code]                                         │
│  4. git add . && git commit -m "message"                │
│  5. git push                                            │
│                                                          │
│  📊 SUCCESS CRITERIA                                    │
│  ✓ MAE < 5°                                             │
│  ✓ FPS > 30                                             │
│  ✓ Latency < 33ms                                       │
│  ✓ Coverage > 90%                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**🎉 You're Ready!**

Start testing: `npm run test:macos:camera`

For more help: `docs/MACOS_TESTING_GUIDE.md`

Happy coding! 🚀
