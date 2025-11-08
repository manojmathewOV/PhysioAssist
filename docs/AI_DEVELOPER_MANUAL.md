# AI Developer Instructional Manual
## Maximize Cloud Development, Minimize Local Deployment

> **Purpose:** Guide AI developer (Claude on web + cloud labs) through complete development cycle, leaving only final real-world simulation for user's MacOS laptop with Claude Code CLI.
>
> **Last Updated:** November 8, 2025
> **Target AI:** Claude (Anthropic) with code execution, cloud lab access
> **Target User:** Non-engineer with MacOS, Claude Code CLI installed

---

## 🎯 Development Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT STAGES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Stage 1: AI Development (Web + Cloud Labs) ───┐               │
│  - Static code analysis                        │               │
│  - Code generation & refactoring               │  95% of work  │
│  - Automated testing (unit, integration)       │               │
│  - Simulation testing (mocked devices)         │               │
│  - Documentation generation                    │               │
│                                                 │               │
│  Stage 2: Local Final Simulation (MacOS) ──────┤               │
│  - Real device testing (iPhone/simulator)      │   5% of work  │
│  - Final integration verification              │               │
│  - Production build signing                    │               │
│  - App Store submission (if needed)            │               │
│                                                 │               │
└─────────────────────────────────────────────────────────────────┘
```

**Principle:** If it can be tested statically or in simulation, do it in cloud. Only real hardware/iOS-specific items need local MacOS.

---

## 📚 PHASE 1: What to Read (AI Developer)

### 1.1 Essential Reading Order

When starting ANY gate from `DEVELOPER_GATE_ROADMAP.md`, read files in this order:

#### **First: Understand the Gate**
1. **docs/planning/DEVELOPER_GATE_ROADMAP.md**
   - Read the specific gate section (e.g., "Gate 1: Remove Mocks")
   - Note: Current State, Tasks, Exit Criteria

#### **Second: Current Codebase State**
2. **Architecture overview**
   ```bash
   # Read these files to understand system architecture
   - src/screens/PoseDetectionScreen.v2.tsx (camera capture)
   - src/services/PoseDetectionService.v2.ts (pose detection)
   - src/components/common/SetupWizard.tsx (user onboarding)
   - src/utils/compensatoryMechanisms.ts (environment heuristics)
   - src/store/slices/poseSlice.ts (state management)
   ```

3. **Related files per gate**

   **Gate 1 (Camera/Pose):**
   - src/screens/PoseDetectionScreen.v2.tsx (lines 75-213)
   - src/components/common/SetupWizard.tsx (lines 33-118)
   - src/utils/compensatoryMechanisms.ts (lines 16-140)

   **Gate 2 (Smoothing):**
   - src/utils/smoothing.ts (all 416 lines)
   - src/services/PoseDetectionService.v2.ts (lines 108-205)
   - src/services/goniometerService.ts (all 108 lines)

   **Gate 3 (Clinical Thresholds):**
   - src/features/videoComparison/config/clinicalThresholds.ts (all 434 lines)
   - src/features/videoComparison/config/errorDetectionConfig.ts (all 309 lines)
   - src/features/videoComparison/errorDetection/shoulderErrors.ts (all 403 lines)

   **Gate 4 (Device Health):**
   - src/services/deviceHealthMonitor.ts (all 233 lines)
   - src/services/memoryHealthManager.ts (all 208 lines)

   **Gate 5 (Telemetry):**
   - src/features/videoComparison/services/telemetryService.ts (all 214 lines)

   **Gate 6 (Audio/Accessibility):**
   - src/services/audioFeedbackService.ts (all 132 lines)

#### **Third: Testing Infrastructure**
4. **Testing setup**
   ```bash
   - docs/gated-testing-plan.md (understand testing gates)
   - package.json (see available test scripts)
   - jest.config.js (test configuration)
   - .github/workflows/ci.yml (if exists)
   ```

#### **Fourth: Research Context**
5. **Research backlog** (for context)
   - docs/research/* (clinical thresholds, smoothing algorithms)
   - docs/architecture/DEEP_ANALYSIS_ARCHITECTURE_STATE.md (current vs target state)

### 1.2 How to Read Files Efficiently

**Use Glob and Grep strategically:**

```bash
# Find all files related to a feature
glob "**/*pose*"
glob "**/*telemetry*"

# Find all TODOs, FIXMEs, MOCK comments
grep -r "TODO" --type ts
grep -r "FIXME" --type ts
grep -r "MOCK" --type ts
grep -r "⚠️" --type ts

# Find all test files
glob "**/*.test.ts"
glob "**/*.test.tsx"

# Find imports of a specific module
grep "from '@/utils/smoothing'" --type ts
grep "import.*PoseLandmarkFilter" --type ts
```

**Read strategically:**
- Start with function signatures and types
- Read comments and JSDoc
- Skim implementation unless modifying
- Focus on integration points (imports/exports)

---

## 🛠️ PHASE 2: How to Proceed (AI Development Workflow)

### 2.1 Gate Workflow Template

For EACH gate, follow this sequence:

```
┌──────────────────────────────────────────────────────────────┐
│                    GATE WORKFLOW                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ANALYZE     → Read relevant files                       │
│                 → Identify mocks/stubs/placeholders          │
│                 → Document current state                     │
│                                                              │
│  2. PLAN        → Break into sub-tasks                       │
│                 → Identify dependencies                      │
│                 → Write test plan                            │
│                                                              │
│  3. IMPLEMENT   → Write code (with tests)                    │
│                 → Remove mocks/stubs                         │
│                 → Add documentation                          │
│                                                              │
│  4. TEST        → Run unit tests                             │
│                 → Run integration tests                      │
│                 → Run static analysis                        │
│                 → Document test results                      │
│                                                              │
│  5. VERIFY      → Check exit criteria                        │
│                 → Update GATE_PROGRESS.md                    │
│                 → Create handoff notes (if local needed)     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Example: Gate 1 Workflow

#### Step 1: Analyze

```bash
# Read the gate definition
read docs/planning/DEVELOPER_GATE_ROADMAP.md --section "Gate 1"

# Read current implementation
read src/components/common/SetupWizard.tsx --lines 33-118
read src/utils/compensatoryMechanisms.ts --lines 84-140

# Find all mocks
grep "mock" src/components/common/SetupWizard.tsx -i
grep "TODO" src/components/common/SetupWizard.tsx

# Document findings
write docs/gates/gate-1-analysis.md
```

**Analysis Document Format:**
```markdown
# Gate 1 Analysis

## Current State
- SetupWizard.tsx uses mocked Frame (Line 33)
- checkLightingConditions() simulated (Line 84)
- checkPatientDistance() simulated (Line 101)

## Mocks Identified
1. mockFrame object (Line 33-45)
2. Simulated brightness calculation (Line 86)
3. Simulated body fill percentage (Line 103)

## Dependencies
- Need real VisionCamera Frame
- Need ITU-R BT.601 luminance formula
- Need pixel analysis utilities

## Approach
1. Create realFrameAnalysis.ts utility
2. Integrate with VisionCamera
3. Replace mocks in SetupWizard
4. Test with 5 lighting conditions
```

#### Step 2: Plan

```markdown
# Gate 1 Implementation Plan

## Sub-Tasks
- [ ] Task 1.1: Create src/utils/realFrameAnalysis.ts
  - Function: calculateBrightness(frame: Frame): number
  - Function: calculateContrast(frame: Frame): number
  - Function: estimateBodyFill(frame: Frame): number

- [ ] Task 1.2: Update SetupWizard.tsx
  - Remove mockFrame (Line 33)
  - Import realFrameAnalysis utilities
  - Replace checkLightingConditions()
  - Replace checkPatientDistance()

- [ ] Task 1.3: Create tests
  - Unit test: realFrameAnalysis.test.ts
  - Integration test: SetupWizard.test.tsx
  - E2E test: SetupWizard.e2e.ts (Detox)

## Test Plan
- Unit: Test brightness calculation with known RGB values
- Integration: Mock VisionCamera Frame, verify flow
- E2E: Requires local MacOS (mark as "LOCAL_ONLY")
```

#### Step 3: Implement

**File 1: Create utility**
```bash
write src/utils/realFrameAnalysis.ts
```

```typescript
/**
 * Real frame analysis utilities (no mocks)
 * Replaces simulated checks in SetupWizard
 */

import type { Frame } from 'react-native-vision-camera';

/**
 * Calculate brightness using ITU-R BT.601 luminance formula
 * @param frame VisionCamera frame
 * @returns Brightness value 0-255
 */
export function calculateBrightness(frame: Frame): number {
  // Extract RGB pixel data
  const pixels = frame.toArrayBuffer();
  const data = new Uint8Array(pixels);

  let totalLuminance = 0;
  const pixelCount = data.length / 4; // RGBA

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // ITU-R BT.601: Y = 0.299*R + 0.587*G + 0.114*B
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += luminance;
  }

  return totalLuminance / pixelCount;
}

/**
 * Calculate contrast (standard deviation / 255)
 */
export function calculateContrast(frame: Frame): number {
  const brightness = calculateBrightness(frame);
  const pixels = frame.toArrayBuffer();
  const data = new Uint8Array(pixels);

  let sumSquaredDiff = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    sumSquaredDiff += Math.pow(luminance - brightness, 2);
  }

  const stddev = Math.sqrt(sumSquaredDiff / pixelCount);
  return stddev / 255; // Normalize to 0-1
}

/**
 * Estimate body fill percentage (simplified)
 * Uses edge detection to find body boundaries
 */
export function estimateBodyFill(frame: Frame): number {
  // Simplified: count non-background pixels
  // Real implementation would use pose keypoints
  const pixels = frame.toArrayBuffer();
  const data = new Uint8Array(pixels);
  const threshold = 128; // Background threshold

  let bodyPixels = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    if (luminance > threshold) {
      bodyPixels++;
    }
  }

  return bodyPixels / pixelCount;
}
```

**File 2: Create tests**
```bash
write src/utils/realFrameAnalysis.test.ts
```

```typescript
import { calculateBrightness, calculateContrast, estimateBodyFill } from './realFrameAnalysis';

// Mock VisionCamera Frame
const createMockFrame = (rgb: [number, number, number]): Frame => {
  const [r, g, b] = rgb;
  const width = 100;
  const height = 100;
  const pixels = new Uint8Array(width * height * 4);

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = 255; // Alpha
  }

  return {
    toArrayBuffer: () => pixels.buffer,
    width,
    height,
  } as Frame;
};

describe('realFrameAnalysis', () => {
  describe('calculateBrightness', () => {
    test('pure white returns 255', () => {
      const frame = createMockFrame([255, 255, 255]);
      expect(calculateBrightness(frame)).toBeCloseTo(255, 0);
    });

    test('pure black returns 0', () => {
      const frame = createMockFrame([0, 0, 0]);
      expect(calculateBrightness(frame)).toBeCloseTo(0, 0);
    });

    test('ITU-R BT.601 formula correct', () => {
      const frame = createMockFrame([100, 150, 200]);
      const expected = 0.299 * 100 + 0.587 * 150 + 0.114 * 200;
      expect(calculateBrightness(frame)).toBeCloseTo(expected, 1);
    });
  });

  describe('calculateContrast', () => {
    test('uniform image has zero contrast', () => {
      const frame = createMockFrame([128, 128, 128]);
      expect(calculateContrast(frame)).toBeCloseTo(0, 2);
    });
  });

  describe('estimateBodyFill', () => {
    test('bright frame estimates high fill', () => {
      const frame = createMockFrame([200, 200, 200]);
      expect(estimateBodyFill(frame)).toBeGreaterThan(0.8);
    });

    test('dark frame estimates low fill', () => {
      const frame = createMockFrame([50, 50, 50]);
      expect(estimateBodyFill(frame)).toBeLessThan(0.2);
    });
  });
});
```

**File 3: Update SetupWizard**
```bash
edit src/components/common/SetupWizard.tsx
```

```typescript
// BEFORE (Line 33-118):
const mockFrame = { /* ... */ };

function checkLightingConditions() {
  const brightness = Math.random() * 255; // MOCK
  return brightness > 100;
}

// AFTER:
import { calculateBrightness, calculateContrast } from '@/utils/realFrameAnalysis';
import { useCameraFrame } from '@/hooks/useCameraFrame';

function SetupWizard() {
  const { frame } = useCameraFrame(); // Real frame from VisionCamera

  function checkLightingConditions() {
    if (!frame) return false;

    const brightness = calculateBrightness(frame);
    const contrast = calculateContrast(frame);

    // Research-backed thresholds
    const MIN_BRIGHTNESS = 80;  // Too dark
    const MAX_BRIGHTNESS = 200; // Too bright
    const MIN_CONTRAST = 0.15;  // Too flat

    return brightness >= MIN_BRIGHTNESS &&
           brightness <= MAX_BRIGHTNESS &&
           contrast >= MIN_CONTRAST;
  }

  // ... rest of component
}
```

#### Step 4: Test (AI in Cloud)

```bash
# Run unit tests
npm run test src/utils/realFrameAnalysis.test.ts
# Expected: All pass (can run in cloud)

# Run integration tests
npm run test src/components/common/SetupWizard.test.tsx
# Expected: Pass with mocked VisionCamera

# Static analysis
npm run typecheck
npm run lint src/utils/realFrameAnalysis.ts
npm run lint src/components/common/SetupWizard.tsx

# Coverage check
npm run test -- --coverage src/utils/realFrameAnalysis.ts
# Expected: ≥95% coverage
```

**Document test results:**
```bash
write docs/gates/gate-1-test-results.md
```

```markdown
# Gate 1 Test Results

## Unit Tests
✅ realFrameAnalysis.test.ts: 12/12 passed
- calculateBrightness: 3/3 tests passed
- calculateContrast: 2/2 tests passed
- estimateBodyFill: 2/2 tests passed

Coverage: 98.5% (197/200 lines)

## Integration Tests
✅ SetupWizard.test.tsx: 8/8 passed
- Lighting check with mocked frames: passed
- Distance check with mocked frames: passed

## Static Analysis
✅ TypeScript: 0 errors
✅ ESLint: 0 errors, 0 warnings

## Items Requiring Local MacOS Testing
⚠️ E2E test with real VisionCamera (SetupWizard.e2e.ts)
⚠️ Real device performance profiling
⚠️ iOS simulator verification

## Exit Criteria Check
✅ Mocks removed: mockFrame deleted
✅ Real implementation: calculateBrightness uses ITU-R BT.601
✅ Tests pass: 20/20 unit + integration tests passed
⚠️ Device tests: PENDING (needs local MacOS)
```

#### Step 5: Verify & Handoff

```bash
# Update progress tracker
edit docs/planning/GATE_PROGRESS.md
```

```markdown
## Gate 1: Remove Camera Mocks
- [x] Real lighting analysis implemented (realFrameAnalysis.ts)
- [x] Real distance check implemented
- [x] Unit tests passing (20/20)
- [x] Integration tests passing
- [ ] E2E tests on real device (LOCAL_ONLY)
- [ ] Performance profiling (LOCAL_ONLY)

Status: 80% complete (cloud), 20% pending local
```

**Create handoff document:**
```bash
write docs/gates/GATE_1_LOCAL_HANDOFF.md
```

```markdown
# Gate 1: Local MacOS Handoff

## What Was Completed in Cloud
✅ Real frame analysis utilities implemented
✅ SetupWizard updated (mocks removed)
✅ Unit tests passing (20/20)
✅ Integration tests passing
✅ Static analysis clean

## What Needs Local MacOS (User with Claude Code CLI)

### Prerequisites
- MacOS with Xcode installed
- iPhone or iOS simulator
- Claude Code CLI installed
- PhysioAssist repo cloned locally

### Steps for User

#### 1. Sync Code from Cloud
```bash
git pull origin claude/testing-validation-documentation-011CUv14uuvdCZ2RFG62FUT7
npm install
cd ios && pod install && cd ..
```

#### 2. Run E2E Tests (Guided by Claude Code CLI)
```bash
# Start Claude Code CLI session
claude

# Ask Claude to run E2E tests
> Run Detox E2E tests for SetupWizard
```

**Claude Code CLI will execute:**
```bash
npm run e2e:ios -- --configuration ios.sim.debug --testNamePattern "SetupWizard"
```

**What to verify:**
- SetupWizard opens camera
- Lighting check works in different conditions
  - Cover camera → should warn "Too dark"
  - Shine flashlight → should warn "Too bright"
  - Normal lighting → should pass
- Distance check works
  - Stand too close → should warn
  - Stand too far → should warn
  - Optimal distance → should pass

#### 3. If Tests Fail (Iterative Fix with Claude)

**Example failure:**
```
❌ SetupWizard › should detect low light
   Expected: warning shown
   Actual: no warning
```

**Ask Claude Code CLI:**
```
> The lighting detection test failed. The warning didn't show when I covered the camera. Debug this.
```

**Claude will:**
1. Check threshold values in realFrameAnalysis.ts
2. Add debug logging
3. Suggest fix (e.g., lower MIN_BRIGHTNESS threshold)
4. Apply fix
5. Re-run test

#### 4. Performance Profiling (Optional)

**Ask Claude Code CLI:**
```
> Profile the frame analysis performance. Is it <50ms?
```

**Claude will:**
```bash
# Add performance logging
# Measure calculateBrightness() timing
# Report results
```

**Expected:** <50ms per frame on iPhone 12+

#### 5. Mark Gate Complete

Once all tests pass:
```bash
# Ask Claude
> Update GATE_PROGRESS.md to mark Gate 1 complete
```

### Troubleshooting (Claude Code CLI)

| Issue | Ask Claude |
|-------|------------|
| Camera won't open | "Debug camera permissions in SetupWizard" |
| Tests timeout | "Increase Detox test timeout" |
| Lighting detection inaccurate | "Tune MIN_BRIGHTNESS threshold based on logs" |
| Performance slow | "Optimize calculateBrightness() function" |

### Exit Criteria (User Verification)
- [ ] E2E tests pass on iOS simulator
- [ ] Lighting detection works in 3 conditions (dark, bright, normal)
- [ ] Distance check works (close, far, optimal)
- [ ] Performance <50ms per frame (logged)
- [ ] No crashes or errors

### Files Modified (For Reference)
- src/utils/realFrameAnalysis.ts (NEW)
- src/utils/realFrameAnalysis.test.ts (NEW)
- src/components/common/SetupWizard.tsx (MODIFIED)
- docs/planning/GATE_PROGRESS.md (UPDATED)
```

---

## 🧪 PHASE 3: How to Test Rigorously (AI in Cloud)

### 3.1 Test Pyramid for Cloud Development

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← Mostly LOCAL (10%)
                    │  (Detox/Real)   │
                    └─────────────────┘
                   ┌───────────────────┐
                   │ Integration Tests │ ← Partially CLOUD (30%)
                   │  (Mocked devices) │
                   └───────────────────┘
              ┌──────────────────────────┐
              │     Unit Tests           │ ← Fully CLOUD (60%)
              │  (Pure functions)        │
              └──────────────────────────┘
         ┌─────────────────────────────────┐
         │   Static Analysis (Lint/Type)   │ ← Fully CLOUD
         └─────────────────────────────────┘
```

**Cloud Coverage:** 90% of testing can happen in cloud
**Local Coverage:** 10% requires real device (E2E, performance)

### 3.2 Testing Checklist per Gate

For EVERY gate, AI must run:

#### ✅ Static Analysis (100% Cloud)

```bash
# TypeScript type checking
npm run typecheck
# Expected: 0 errors

# ESLint
npm run lint
# Expected: 0 errors, 0 warnings

# Security scan
npm audit
# Expected: 0 high/critical vulnerabilities

# Import cycle detection
npm run lint:imports
# Expected: 0 circular dependencies

# Dead code detection
npm run lint:deadcode
# Expected: Report files with 0 imports
```

#### ✅ Unit Tests (100% Cloud)

```bash
# Run all unit tests
npm run test

# Run specific test suite
npm run test src/utils/realFrameAnalysis.test.ts

# With coverage
npm run test -- --coverage

# Coverage gates
npm run test -- --coverage --coverageThreshold='{"global":{"statements":95}}'
```

**Coverage Requirements:**
- Statements: ≥95%
- Branches: ≥90%
- Functions: ≥95%
- Lines: ≥95%

**How AI Creates Unit Tests:**

Template for test file:
```typescript
import { functionUnderTest } from './module';

describe('ModuleName', () => {
  describe('functionUnderTest', () => {
    test('should handle normal input', () => {
      const result = functionUnderTest(normalInput);
      expect(result).toBe(expectedOutput);
    });

    test('should handle edge case: empty input', () => {
      const result = functionUnderTest('');
      expect(result).toBe(defaultOutput);
    });

    test('should handle edge case: null', () => {
      expect(() => functionUnderTest(null)).toThrow();
    });

    test('should handle edge case: very large input', () => {
      const largeInput = 'x'.repeat(10000);
      const result = functionUnderTest(largeInput);
      expect(result).toBeDefined();
    });
  });
});
```

**Coverage for each function:**
- ✅ Normal case (happy path)
- ✅ Edge case: empty/null/undefined
- ✅ Edge case: boundary values (min, max)
- ✅ Error case: invalid input
- ✅ Performance case: large input

#### ✅ Integration Tests (80% Cloud, 20% Local)

**Cloud-executable integration tests:**
```typescript
// Mock external dependencies (VisionCamera, native modules)
import { calculateBrightness } from '@/utils/realFrameAnalysis';

jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getCameraDevice: jest.fn(() => ({ id: 'mock-camera' })),
  },
  useCameraDevice: jest.fn(() => ({ id: 'mock-camera' })),
}));

describe('SetupWizard Integration', () => {
  test('should progress from lighting to distance check', () => {
    const { getByText } = render(<SetupWizard />);

    // Mock good lighting
    const mockFrame = createMockFrame([150, 150, 150]);
    act(() => {
      // Simulate frame received
      onFrameReceived(mockFrame);
    });

    // Should progress to next step
    expect(getByText('Check your distance')).toBeTruthy();
  });
});
```

**Local-only integration tests:**
- Tests requiring real VisionCamera
- Tests requiring native modules (thermal, memory)
- Tests requiring actual network calls

Mark these as:
```typescript
test.skip('should work with real camera', () => {
  // LOCAL_ONLY: Requires real VisionCamera
});
```

#### ✅ Snapshot Tests (100% Cloud)

```bash
# Generate snapshots
npm run test -- -u

# Verify snapshots
npm run test -- --testNamePattern "snapshot"
```

**Use for:**
- Redux reducer outputs
- Component render trees (React Native)
- API response shapes

**Example:**
```typescript
test('poseSlice reducer snapshot', () => {
  const initialState = poseReducer(undefined, { type: '@@INIT' });
  expect(initialState).toMatchSnapshot();

  const withPose = poseReducer(initialState, {
    type: 'pose/setPose',
    payload: mockPoseData,
  });
  expect(withPose).toMatchSnapshot();
});
```

#### ✅ Mutation Testing (100% Cloud)

```bash
# Install Stryker (mutation testing)
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner

# Run mutation tests
npm run test:mutate src/utils/realFrameAnalysis.ts
```

**What it does:**
- Introduces bugs (mutations) into code
- Checks if tests catch the bugs
- Reports: % of mutants killed

**Target:** >80% mutants killed

**Example mutations:**
```typescript
// Original
if (brightness > 100) return true;

// Mutation 1: Change operator
if (brightness >= 100) return true; // Should be caught by tests

// Mutation 2: Change constant
if (brightness > 101) return true; // Should be caught by tests

// Mutation 3: Invert condition
if (brightness <= 100) return true; // Should be caught by tests
```

If tests don't catch mutations → Add more test cases

#### ✅ Performance Benchmarks (100% Cloud)

```bash
# Create benchmark script
write scripts/benchmark-gate-1.ts
```

```typescript
import { performance } from 'perf_hooks';
import { calculateBrightness } from '../src/utils/realFrameAnalysis';

const ITERATIONS = 1000;
const mockFrame = createMockFrame([128, 128, 128]);

// Benchmark
const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  calculateBrightness(mockFrame);
}
const end = performance.now();

const avgTime = (end - start) / ITERATIONS;
console.log(`Average time: ${avgTime.toFixed(2)}ms`);

// Assert performance threshold
if (avgTime > 50) {
  throw new Error(`Performance regression: ${avgTime}ms > 50ms threshold`);
}
```

```bash
# Run benchmarks
npm run benchmark -- gate-1

# Store baseline
npm run benchmark -- gate-1 --baseline
# Saves to benchmarks/gate-1.json
```

**CI Integration:**
```bash
# Compare against baseline
npm run benchmark -- gate-1 --compare
# Fails if >10% regression
```

### 3.3 Testing Gate Integration (from gated-testing-plan.md)

Map each testing gate to roadmap gates:

| Testing Gate | Roadmap Gates | AI Can Do in Cloud | Needs Local |
|--------------|---------------|-------------------|-------------|
| **Testing Gate 0: Toolchain** | All gates | 100% - CI setup, lint, typecheck | 0% |
| **Testing Gate 1: Core Logic** | Gates 1-3 | 100% - Unit tests, snapshots, mutation | 0% |
| **Testing Gate 2: Device/UX** | Gates 4-8 | 60% - Integration with mocks | 40% - Real device tests |
| **Testing Gate 3: Clinical/Edge** | Gate 9 | 50% - Synthetic data validation | 50% - Real patient videos |
| **Testing Gate 4: Release Ops** | Gate 10 | 30% - Monitoring setup | 70% - App Store submission |

**AI's Role per Testing Gate:**

**Testing Gate 0 (Toolchain) - 100% Cloud:**
```bash
# AI creates CI pipeline
write .github/workflows/ci.yml

# AI configures linting
write .eslintrc.js

# AI sets up pre-commit hooks
write .husky/pre-commit

# AI runs checks
npm run lint
npm run typecheck
npm run security:scan
```

**Testing Gate 1 (Core Logic) - 100% Cloud:**
```bash
# AI writes unit tests for all services
write src/services/PoseDetectionService.v2.test.ts
write src/utils/smoothing.test.ts
write src/features/videoComparison/services/telemetryService.test.ts

# AI generates snapshots
npm run test -- -u

# AI runs mutation testing
npm run test:mutate
```

**Testing Gate 2 (Device/UX) - 60% Cloud:**
```bash
# AI creates integration tests with mocks
write src/screens/PoseDetectionScreen.v2.test.tsx

# AI creates E2E test scripts (to run locally)
write e2e/SetupWizard.e2e.ts

# AI documents what needs local testing
write docs/gates/GATE_X_LOCAL_HANDOFF.md
```

**Testing Gate 3 (Clinical/Edge) - 50% Cloud:**
```bash
# AI creates synthetic patient library
write tests/fixtures/synthetic-patients/*.json

# AI creates validation scripts
write scripts/validate-clinical-accuracy.ts

# AI documents: "Need real PT to annotate videos locally"
write docs/clinical/VALIDATION_PROTOCOL.md
```

**Testing Gate 4 (Release Ops) - 30% Cloud:**
```bash
# AI sets up monitoring dashboards (Grafana config)
write grafana/dashboards/pose-detection.json

# AI creates deployment scripts
write scripts/deploy-backend.sh

# AI documents: "Need Apple Developer account for App Store"
write docs/deployment/APP_STORE_SUBMISSION.md
```

---

## 📦 PHASE 4: What AI Can Do in Cloud (Maximize)

### 4.1 Complete Development Tasks (No Local Needed)

#### ✅ Code Generation & Refactoring
```bash
# AI can write entire modules
write src/utils/newFeature.ts
write src/services/newService.ts

# AI can refactor existing code
edit src/components/old.tsx
# Remove duplication, improve types, add docs
```

#### ✅ Test Generation
```bash
# AI writes comprehensive test suites
write src/**/*.test.ts

# AI generates test fixtures
write tests/fixtures/mock-data.json
```

#### ✅ Documentation
```bash
# AI generates API docs
write docs/api/POSE_DETECTION_API.md

# AI creates developer guides
write docs/guides/ADDING_NEW_EXERCISE.md

# AI updates inline documentation
edit src/services/PoseDetectionService.v2.ts
# Add JSDoc comments
```

#### ✅ Static Analysis & Linting
```bash
# AI runs all static checks
npm run typecheck
npm run lint
npm run security:scan
npm run lint:imports
npm run lint:deadcode

# AI fixes issues automatically
npm run lint -- --fix
```

#### ✅ Dependency Management
```bash
# AI audits dependencies
npm audit

# AI updates dependencies
npm update

# AI checks for outdated packages
npm outdated

# AI documents dependency decisions
write docs/decisions/ADR-001-DEPENDENCY-CHOICES.md
```

#### ✅ Configuration Management
```bash
# AI creates/updates config files
write tsconfig.json
write jest.config.js
write .eslintrc.js
write babel.config.js
```

#### ✅ Schema & Type Definitions
```bash
# AI creates TypeScript types
write src/types/models.ts

# AI creates database schemas
write prisma/schema.prisma

# AI creates API schemas (OpenAPI)
write api/openapi.yaml
```

#### ✅ Test Data Generation
```bash
# AI creates realistic mock data
write tests/fixtures/patients.json
write tests/fixtures/exercises.json
write tests/fixtures/pose-frames.json
```

#### ✅ Performance Analysis
```bash
# AI creates benchmarks
write scripts/benchmarks/*.ts

# AI analyzes bundle size
npm run analyze-bundle

# AI suggests optimizations
# (AI reads bundle report, suggests code-splitting)
```

#### ✅ Migration Scripts
```bash
# AI creates database migrations
write prisma/migrations/001_initial.sql

# AI creates data migration scripts
write scripts/migrate-old-thresholds-to-new.ts
```

### 4.2 What AI CANNOT Do in Cloud (Needs Local)

#### ❌ Real Device Testing
- Running on physical iPhone/iPad
- Testing with real camera input
- iOS simulator testing (requires Xcode)
- Performance profiling on real hardware

**Workaround:** AI creates test scripts, user runs locally with Claude Code CLI

#### ❌ Native Module Development
- Writing Swift/Objective-C (iOS)
- Writing Kotlin/Java (Android)
- Testing native bridges

**Workaround:** AI writes interface definitions, user implements native code with Claude Code CLI guidance

#### ❌ App Store Submission
- Creating provisioning profiles
- Signing builds with certificates
- Uploading to App Store Connect
- Responding to Apple review feedback

**Workaround:** AI creates submission checklist, user follows with Claude Code CLI

#### ❌ Real Network Testing
- Testing with real backend APIs
- Testing WebSocket connections
- Testing under network throttling

**Workaround:** AI creates integration tests with mock network, user validates locally

#### ❌ Real User Testing
- Observing real users
- Conducting usability studies
- Collecting qualitative feedback

**Workaround:** AI creates user testing script, user conducts sessions, AI analyzes results

---

## 🚀 PHASE 5: Local Handoff Workflow (Minimize)

### 5.1 When to Hand Off to Local

**Trigger:** AI completes testing gate and creates `GATE_X_LOCAL_HANDOFF.md`

**Handoff Criteria:**
- ✅ All cloud tests passing (unit, integration, static)
- ✅ Code complete and documented
- ✅ Handoff document created
- ✅ Local test scripts prepared
- ✅ Expected results documented

### 5.2 Handoff Document Template

Every gate that needs local testing gets this document:

```markdown
# Gate X: Local MacOS Handoff

## Cloud Completion Summary
✅ [List what AI completed]
✅ All unit tests passing (X/X)
✅ All integration tests passing (X/X)
✅ Static analysis clean

## Local Testing Required

### Prerequisites
- [ ] MacOS with Xcode installed
- [ ] iOS Simulator or iPhone
- [ ] Claude Code CLI installed
- [ ] Repo synced: `git pull origin <branch>`
- [ ] Dependencies installed: `npm install && cd ios && pod install`

### Test Plan

#### Test 1: [Descriptive Name]
**What:** [What this test validates]
**Why local:** [Why it can't run in cloud]
**Command:**
```bash
# Ask Claude Code CLI:
> Run [specific test command]
```

**Expected Result:**
- [Bullet points of what should happen]

**If it fails:**
```
> Debug [specific issue] in [file]
```

#### Test 2: [Next test]
...

### Verification Checklist
- [ ] Test 1 passes
- [ ] Test 2 passes
- [ ] No crashes or errors
- [ ] Performance within thresholds
- [ ] Update GATE_PROGRESS.md

### Troubleshooting Guide

| Symptom | Ask Claude Code CLI |
|---------|---------------------|
| [Issue] | [Command to debug] |

### Files Modified
- [List of files for user's reference]

### Next Steps After Local Success
1. Update GATE_PROGRESS.md (Claude will do this)
2. Move to next gate
3. Create PR (if needed)
```

### 5.3 Claude Code CLI Workflow for User

**User's perspective (non-engineer):**

```
Step 1: Receive notification
───────────────────────────
AI: "Gate 1 is ready for local testing.
     See docs/gates/GATE_1_LOCAL_HANDOFF.md"

Step 2: Open Claude Code CLI
───────────────────────────
$ cd ~/PhysioAssist
$ claude

Step 3: Ask Claude to guide through handoff
───────────────────────────────────────────
User: "Walk me through Gate 1 local testing"

Claude: "I'll guide you step by step. First, let's sync the code..."
        [Runs git pull]
        "Now installing dependencies..."
        [Runs npm install]
        "Ready for testing. Starting with camera permission test..."
        [Runs Detox test]
        "✅ Camera permission test passed. Next, testing lighting detection..."

Step 4: If something breaks
─────────────────────────
Test output: "❌ Lighting detection test failed"

User: "The lighting test failed. Fix it."

Claude: [Analyzes logs]
        "I see the issue. The brightness threshold is too high.
         Lowering it from 100 to 80..."
        [Edits realFrameAnalysis.ts]
        "Running test again..."
        [Re-runs test]
        "✅ Test now passing."

Step 5: Mark complete
────────────────────
User: "All tests passed. What's next?"

Claude: [Updates GATE_PROGRESS.md]
        "Gate 1 complete! Moving to Gate 2..."
```

**Key principle:** User never writes code, just describes issues in plain English

### 5.4 Automated Local Test Runner

**AI creates script for user:**

```bash
write scripts/run-local-tests.sh
```

```bash
#!/bin/bash
# Automated local test runner
# User runs: ./scripts/run-local-tests.sh gate-1

GATE=$1

echo "🚀 Running local tests for $GATE..."

case $GATE in
  gate-1)
    echo "📹 Testing camera & SetupWizard..."
    npm run e2e:ios -- --testNamePattern "SetupWizard"
    npm run profile:camera
    ;;
  gate-2)
    echo "🎯 Testing smoothing performance..."
    npm run benchmark -- smoothing
    ;;
  gate-4)
    echo "🔥 Testing thermal monitoring..."
    npm run test:device-health
    ;;
  *)
    echo "❌ Unknown gate: $GATE"
    exit 1
    ;;
esac

echo "✅ Local tests complete!"
echo "📝 Review results and update GATE_PROGRESS.md"
```

**User runs:**
```bash
./scripts/run-local-tests.sh gate-1
```

**If test fails, ask Claude:**
```
> The camera test failed with error: [paste error]
```

---

## 📊 PHASE 6: Progress Tracking & Documentation

### 6.1 AI Maintains Progress Tracker

**File:** `docs/planning/GATE_PROGRESS.md`

**AI updates after every task:**

```markdown
# Gate Progress Tracker

Last Updated: 2025-11-08 14:30 UTC
Current Gate: Gate 1 (Remove Camera Mocks)

## Gate 0: Toolchain ✅ COMPLETE
- [x] CI pipeline created
- [x] Git hooks configured
- [x] Security scan passing
- [x] Linting rules enforced

## Gate 1: Remove Camera Mocks 🔄 IN PROGRESS (80% Cloud, 20% Local)
Cloud Completed:
- [x] Created realFrameAnalysis.ts utility
- [x] Wrote unit tests (20/20 passing)
- [x] Updated SetupWizard.tsx (mocks removed)
- [x] Integration tests passing with mocks
- [x] Static analysis clean

Local Pending:
- [ ] E2E tests on iOS simulator
- [ ] Real camera performance profiling
- [ ] Lighting detection validation (3 conditions)

Handoff: docs/gates/GATE_1_LOCAL_HANDOFF.md created

## Gate 2: Smoothing Integration ⚪ NOT STARTED
- [ ] Integrate OneEuroFilter
- [ ] Measure jitter reduction
- [ ] Performance benchmarks

...
```

### 6.2 AI Generates Test Reports

After each testing session:

```bash
write docs/test-reports/gate-1-YYYY-MM-DD.md
```

```markdown
# Gate 1 Test Report
Date: 2025-11-08
Phase: Cloud Testing

## Summary
✅ All cloud tests passed
⚠️ Local tests pending

## Test Results

### Unit Tests
- Total: 20 tests
- Passed: 20 (100%)
- Failed: 0
- Duration: 2.3s
- Coverage: 98.5%

Breakdown:
- realFrameAnalysis.test.ts: 12/12 ✅
- SetupWizard.test.tsx: 8/8 ✅

### Integration Tests
- Total: 8 tests
- Passed: 8 (100%)
- Failed: 0
- Duration: 5.1s

### Static Analysis
- TypeScript errors: 0
- ESLint errors: 0
- ESLint warnings: 0
- Security vulnerabilities: 0

### Performance Benchmarks
- calculateBrightness(): 12.3ms avg (threshold: 50ms) ✅
- calculateContrast(): 18.7ms avg (threshold: 50ms) ✅
- estimateBodyFill(): 34.2ms avg (threshold: 50ms) ✅

## Code Coverage
- Statements: 98.5% (197/200)
- Branches: 95.2% (20/21)
- Functions: 100% (15/15)
- Lines: 98.3% (180/183)

Uncovered lines:
- realFrameAnalysis.ts:142-144 (error handling for rare edge case)

## Mutation Testing
- Total mutants: 45
- Killed: 38 (84.4%)
- Survived: 7 (15.6%)

Survived mutants (need more tests):
- Line 67: Boundary condition (>= vs >)
- Line 89: Constant value (100 vs 101)

## Next Steps
1. Add tests for survived mutants
2. Hand off to local testing
3. User runs E2E tests with Claude Code CLI
```

### 6.3 AI Creates Architecture Decision Records (ADRs)

For significant decisions:

```bash
write docs/decisions/ADR-001-USE-REAL-FRAME-ANALYSIS.md
```

```markdown
# ADR 001: Use Real Frame Analysis Instead of Mocks

## Status
Accepted

## Context
SetupWizard previously used mocked frame data for lighting and distance checks.
This made testing easy but didn't reflect real-world conditions.

## Decision
Implement real frame analysis using ITU-R BT.601 luminance formula and
pixel-based body fill estimation.

## Consequences

### Positive
- Accurate lighting detection in real conditions
- Removes technical debt (no more mocks)
- Research-backed algorithm (ITU-R BT.601)
- Testable with synthetic frames in unit tests

### Negative
- Requires VisionCamera integration (complexity)
- Needs local testing on real devices
- Performance overhead (12-34ms per frame)

### Risks
- Different devices may have different color profiles
- Ambient light sensors may be more accurate (future improvement)

## Alternatives Considered
1. Use device ambient light sensor
   - Pro: Direct light measurement
   - Con: Not available in web, iOS API limited

2. Use mock data with calibration
   - Pro: Easier to test
   - Con: Doesn't match real-world

## Implementation
- Created: src/utils/realFrameAnalysis.ts
- Tests: src/utils/realFrameAnalysis.test.ts
- Integrated: src/components/common/SetupWizard.tsx

## References
- ITU-R BT.601: https://www.itu.int/rec/R-REC-BT.601
- Gate 1 requirements: docs/planning/DEVELOPER_GATE_ROADMAP.md
```

---

## 🎓 PHASE 7: AI Self-Learning & Improvement

### 7.1 AI Learns from Test Failures

**When tests fail, AI should:**

1. **Analyze failure pattern**
   ```
   Test failed: calculateBrightness returns NaN
   Input: frame with 0x0 dimensions
   Root cause: Division by zero (pixelCount = 0)
   ```

2. **Fix the code**
   ```typescript
   // Before
   return totalLuminance / pixelCount;

   // After
   if (pixelCount === 0) return 0;
   return totalLuminance / pixelCount;
   ```

3. **Add regression test**
   ```typescript
   test('should handle empty frame (0x0 dimensions)', () => {
     const emptyFrame = createMockFrame(0, 0);
     expect(calculateBrightness(emptyFrame)).toBe(0);
   });
   ```

4. **Document lesson**
   ```markdown
   ## Lesson: Always validate input dimensions
   - Don't assume frames have pixels
   - Return sensible default for empty frames
   - Add guard clauses for edge cases
   ```

### 7.2 AI Improves Test Coverage Iteratively

**Process:**
1. Run coverage report
2. Identify uncovered lines
3. Write tests for uncovered lines
4. Re-run coverage
5. Repeat until ≥95%

**Example:**
```bash
# Run coverage
npm run test -- --coverage src/utils/realFrameAnalysis.ts

# Output:
# Uncovered lines: 142-144 (error handling)

# AI writes test
test('should handle corrupt frame buffer', () => {
  const corruptFrame = {
    toArrayBuffer: () => { throw new Error('Corrupt buffer'); }
  };
  expect(() => calculateBrightness(corruptFrame)).toThrow('Corrupt buffer');
});

# Re-run coverage
npm run test -- --coverage src/utils/realFrameAnalysis.ts
# Now 100% coverage ✅
```

### 7.3 AI Documents Patterns & Best Practices

As AI works through gates, it documents reusable patterns:

```bash
write docs/patterns/TESTING_VISION_CAMERA.md
```

```markdown
# Pattern: Testing VisionCamera Integration

## Problem
VisionCamera is a native module that can't run in cloud tests.

## Solution
Use mocks for unit/integration tests, real device for E2E.

## Implementation

### 1. Create mock VisionCamera
```typescript
// tests/mocks/visionCamera.mock.ts
export const createMockFrame = (width, height, rgb) => ({
  toArrayBuffer: () => {
    const pixels = new Uint8Array(width * height * 4);
    // Fill with RGB values
    return pixels.buffer;
  },
  width,
  height,
});
```

### 2. Use mock in unit tests
```typescript
import { createMockFrame } from '@tests/mocks/visionCamera.mock';

test('should calculate brightness', () => {
  const frame = createMockFrame(100, 100, [128, 128, 128]);
  expect(calculateBrightness(frame)).toBeCloseTo(128);
});
```

### 3. Mark E2E tests for local execution
```typescript
test.skip('should work with real camera', () => {
  // LOCAL_ONLY: Requires VisionCamera
});
```

### 4. Create local handoff document
- Document: What to test with real camera
- Provide: Expected results
- Include: Troubleshooting guide

## When to Use
- Any feature using VisionCamera
- Camera permissions
- Frame processing
- Real-time capture

## See Also
- docs/gates/GATE_1_LOCAL_HANDOFF.md (example)
- docs/patterns/MOCKING_NATIVE_MODULES.md
```

---

## 📋 PHASE 8: Gate-by-Gate AI Workflow Summary

For each gate, AI follows this sequence:

### 1. Pre-Flight Checklist
```bash
# Read gate definition
read docs/planning/DEVELOPER_GATE_ROADMAP.md --section "Gate X"

# Read current codebase state
read [relevant files from gate definition]

# Search for mocks/stubs
grep "mock" src/ -r -i
grep "TODO" src/ -r -i
grep "FIXME" src/ -r -i
```

### 2. Analysis Phase
```bash
# Create analysis document
write docs/gates/gate-X-analysis.md

# Document:
# - Current state
# - Mocks identified
# - Dependencies
# - Approach
```

### 3. Planning Phase
```bash
# Create implementation plan
write docs/gates/gate-X-plan.md

# Break into sub-tasks
# Create test plan
# Identify what needs local testing
```

### 4. Implementation Phase
```bash
# Write code
write src/[new files]
edit src/[existing files]

# Write tests
write src/**/*.test.ts

# Write documentation
edit README.md
write docs/api/[API docs]
```

### 5. Testing Phase (Cloud)
```bash
# Static analysis
npm run typecheck
npm run lint
npm run security:scan

# Unit tests
npm run test -- --coverage

# Integration tests
npm run test:integration

# Performance benchmarks
npm run benchmark -- gate-X

# Mutation testing
npm run test:mutate src/[critical files]
```

### 6. Documentation Phase
```bash
# Test report
write docs/test-reports/gate-X-YYYY-MM-DD.md

# Update progress tracker
edit docs/planning/GATE_PROGRESS.md

# Architecture decision record (if needed)
write docs/decisions/ADR-XXX-[DECISION].md
```

### 7. Handoff Phase (If Local Needed)
```bash
# Create handoff document
write docs/gates/GATE_X_LOCAL_HANDOFF.md

# Create local test scripts
write scripts/test-gate-X-local.sh
write e2e/gate-X.e2e.ts

# Document expected results
# Provide troubleshooting guide
```

### 8. Verification Phase
```bash
# Check exit criteria
# ✅ All cloud tests passing?
# ✅ Coverage ≥95%?
# ✅ Static analysis clean?
# ✅ Documentation complete?
# ✅ Local handoff created (if needed)?

# Update status
edit docs/planning/GATE_PROGRESS.md
# Mark gate as: CLOUD_COMPLETE or FULLY_COMPLETE
```

---

## 🎯 Quick Reference for AI

### Commands AI Should Run Frequently

```bash
# Before starting any work
git pull origin main
npm install

# After writing code
npm run typecheck
npm run lint --fix
npm run test

# Before committing
npm run test -- --coverage
npm run lint
npm run typecheck

# When creating handoff
write docs/gates/GATE_X_LOCAL_HANDOFF.md
```

### Files AI Should Update Regularly

```bash
# After each task
docs/planning/GATE_PROGRESS.md

# After each testing session
docs/test-reports/gate-X-YYYY-MM-DD.md

# For significant decisions
docs/decisions/ADR-XXX-[TITLE].md

# When discovering patterns
docs/patterns/[PATTERN_NAME].md
```

### Questions AI Should Ask Itself

Before marking gate complete:
- ✅ Are all cloud tests passing?
- ✅ Is coverage ≥95%?
- ✅ Are there any TODOs, FIXMEs, or MOCKs left?
- ✅ Is documentation complete?
- ✅ Is local handoff document created (if needed)?
- ✅ Did I update GATE_PROGRESS.md?
- ✅ Did I create a test report?

---

## 🚀 Example: Complete Gate 1 Workflow (AI Perspective)

```bash
# ─────────────────────────────────────────────────────────────
# GATE 1: Remove Camera Mocks
# ─────────────────────────────────────────────────────────────

# Step 1: Read and Understand
# ─────────────────────────────────────────────────────────────
read docs/planning/DEVELOPER_GATE_ROADMAP.md --section "Gate 1"
read src/components/common/SetupWizard.tsx --lines 33-118
read src/utils/compensatoryMechanisms.ts --lines 84-140

# Step 2: Analyze
# ─────────────────────────────────────────────────────────────
grep "mock" src/components/common/SetupWizard.tsx -i
# Found: mockFrame (Line 33), simulated brightness (Line 86)

write docs/gates/gate-1-analysis.md
# Contents: Current state, mocks identified, dependencies, approach

# Step 3: Plan
# ─────────────────────────────────────────────────────────────
write docs/gates/gate-1-plan.md
# Sub-tasks, test plan, local requirements

# Step 4: Implement
# ─────────────────────────────────────────────────────────────
write src/utils/realFrameAnalysis.ts
# Implement: calculateBrightness, calculateContrast, estimateBodyFill

write src/utils/realFrameAnalysis.test.ts
# 20 unit tests covering all functions and edge cases

edit src/components/common/SetupWizard.tsx
# Remove mockFrame, integrate realFrameAnalysis

# Step 5: Test (Cloud)
# ─────────────────────────────────────────────────────────────
npm run test src/utils/realFrameAnalysis.test.ts
# ✅ 12/12 passing

npm run test src/components/common/SetupWizard.test.tsx
# ✅ 8/8 passing

npm run test -- --coverage src/utils/realFrameAnalysis.ts
# ✅ 98.5% coverage

npm run typecheck
# ✅ 0 errors

npm run lint
# ✅ 0 errors, 0 warnings

npm run benchmark -- gate-1
# ✅ All functions <50ms

npm run test:mutate src/utils/realFrameAnalysis.ts
# ⚠️ 84.4% mutants killed (7 survived)

# Add tests for survived mutants
edit src/utils/realFrameAnalysis.test.ts
# Add 3 more tests for boundary conditions

npm run test:mutate src/utils/realFrameAnalysis.ts
# ✅ 97.8% mutants killed

# Step 6: Document
# ─────────────────────────────────────────────────────────────
write docs/test-reports/gate-1-2025-11-08.md
# Test results, coverage, benchmarks, next steps

edit docs/planning/GATE_PROGRESS.md
# Mark Gate 1: 80% complete (cloud), 20% pending local

write docs/decisions/ADR-001-USE-REAL-FRAME-ANALYSIS.md
# Document decision to use ITU-R BT.601

# Step 7: Handoff
# ─────────────────────────────────────────────────────────────
write docs/gates/GATE_1_LOCAL_HANDOFF.md
# Prerequisites, test plan, troubleshooting, verification

write e2e/SetupWizard.e2e.ts
# Detox E2E tests for local execution

write scripts/test-gate-1-local.sh
# Automated local test runner

# Step 8: Verify
# ─────────────────────────────────────────────────────────────
# Check exit criteria:
# ✅ All cloud tests passing
# ✅ Coverage 98.5% (>95%)
# ✅ Static analysis clean
# ✅ Documentation complete
# ✅ Local handoff created
# ✅ GATE_PROGRESS.md updated

# Mark gate ready for local testing
edit docs/planning/GATE_PROGRESS.md
# Status: CLOUD_COMPLETE → Awaiting local verification

# Notify user
echo "Gate 1 ready for local testing. See docs/gates/GATE_1_LOCAL_HANDOFF.md"
```

---

## 📝 Summary for AI Developer

**Your mission:** Develop 90% of the app in cloud, hand off 10% for local MacOS testing

**Your tools:**
- Read: Glob, Grep, Read
- Write: Write, Edit
- Test: npm test, typecheck, lint, benchmark, mutation testing
- Document: Markdown files in docs/

**Your workflow:**
1. Read gate definition
2. Analyze current state
3. Plan implementation
4. Implement with tests
5. Test rigorously in cloud
6. Document everything
7. Create local handoff (if needed)
8. Verify exit criteria

**Your outputs:**
- Clean, tested, documented code
- Comprehensive test suites (≥95% coverage)
- Clear handoff documents for user
- Updated progress tracker
- Architecture decision records

**Your success criteria:**
- User (non-engineer) can complete local testing with only Claude Code CLI guidance
- No "surprise" issues in local testing (everything predictable)
- User spends <30 minutes per gate on local verification
- Final app deployment is simple (guided by Claude Code CLI)

**Remember:**
- If it can be tested in cloud, test it in cloud
- If it needs local, create crystal-clear handoff
- Document everything (code, tests, decisions, patterns)
- Update progress tracker after every task
- User should never write code manually

---

**Next:** Start Gate 0 (Toolchain Sanity)
