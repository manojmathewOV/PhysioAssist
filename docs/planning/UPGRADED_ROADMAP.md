# PhysioAssist Upgraded Roadmap
## Accuracy-First, Performance-Driven, Simplicity-Validated

> **Last Updated:** November 8, 2025
> **Philosophy:** Accuracy → Performance → Simplicity → Robustness → Features
> **Critical Path:** YouTube Template Comparison Accuracy
> **Based On:** De Bono 6 Hats Analysis (see `6_HATS_ANALYSIS.md`)

---

## 🎯 Mission

Build a clinically accurate, real-time pose comparison system that allows patients to compare their exercise form against YouTube templates with ≥90% accuracy, <100ms latency, and ≤5 steps to feedback.

---

## 📊 Core Requirements (Non-Negotiable)

| Requirement | Metric | Validation |
|-------------|--------|------------|
| **Pose Accuracy** | ±5° joint angle error | vs synthetic ground truth |
| **Goniometry Accuracy** | ±3° measurement error | vs known angles |
| **Comparison Accuracy** | κ ≥0.6 vs PT assessment | Cohen's kappa agreement |
| **Real-time Performance** | <100ms end-to-end latency | Camera → feedback |
| **Simplicity** | ≤5 steps to first feedback | User testing (n=5) |
| **Robustness** | 0 crashes in 100 sessions | Beta field trial |
| **No Functionality Loss** | All core features work | Regression testing |

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                    CORE PIPELINE (Gate 1)                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐      ┌──────────────┐      ┌─────────────────┐  │
│  │  YouTube    │──┐   │              │      │                 │  │
│  │  Template   │  │   │              │      │   Comparison    │  │
│  │  Video      │  ├──▶│ Pose Service │──┬──▶│   Algorithm     │  │
│  └─────────────┘  │   │  (MoveNet)   │  │   │                 │  │
│                   │   │              │  │   │ - Angle Δ      │  │
│  ┌─────────────┐  │   └──────────────┘  │   │ - Temporal     │  │
│  │  Patient    │──┘                      │   │ - Error ID     │  │
│  │  Live       │        │                │   └─────────────────┘  │
│  │  Camera     │        ▼                │            │           │
│  └─────────────┘   ┌──────────────┐     │            ▼           │
│                    │ Goniometry   │◀────┘   ┌─────────────────┐  │
│                    │ Service      │         │   Feedback      │  │
│                    │ (3D angles)  │         │   Generator     │  │
│                    └──────────────┘         └─────────────────┘  │
│                                                                    │
│  LATENCY BUDGET: 100ms total                                      │
│  - Camera capture: 33ms (30 FPS)                                  │
│  - Pose detection: 30ms                                           │
│  - Goniometry: 10ms                                               │
│  - Comparison: 15ms                                               │
│  - Feedback gen: 12ms                                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🚪 Gate 0: Toolchain & Build Sanity

**Objective:** Reproducible builds, automated quality checks, zero technical debt from start

### Tasks

- [ ] **CI/CD Pipeline**
  - `.github/workflows/ci.yml`: lint, typecheck, test, security scan
  - Auto-fail on: TS errors, lint errors, test failures, vulnerabilities
  - Performance baseline: measure current end-to-end latency

- [ ] **Git Hooks**
  - Pre-commit: Prettier + ESLint auto-fix
  - Pre-push: TypeScript + unit tests
  - Commit message linting (conventional commits)

- [ ] **Quality Gates**
  - Test coverage ≥95% (statement, branch, function)
  - Cyclomatic complexity <10 per function
  - Security scan: 0 high/critical vulnerabilities

- [ ] **Documentation**
  - Lock toolchain versions (`.nvmrc`, `package.json` engines)
  - Document build process (README.md)
  - Performance baseline recorded

### Testing

```bash
npm ci
npm run lint
npm run typecheck
npm run test -- --coverage
npm run security:scan
npm run complexity-report
```

### Exit Criteria

- ✅ CI pipeline green on main branch
- ✅ All quality gates pass locally
- ✅ Performance baseline documented (current latency: ___ ms)
- ✅ Complexity report: all functions <10
- ✅ Security: 0 high/critical vulnerabilities

---

## 🚪 Gate 1: Core Pipeline - Real Implementations (No Mocks)

**Objective:** Build entire end-to-end pipeline with REAL implementations, prove it works (no accuracy validation yet)

### Critical Path

This gate builds THE core feature:
```
YouTube Template → Pose Extraction → Joint Angles → Patient Camera → Pose Extraction → Joint Angles → Comparison → Error Detection → Feedback
```

### Tasks

#### 1.1: YouTube Template Integration (NEW - Critical)

- [ ] **YouTube video loading**
  - File: Create `src/services/youtubeService.ts`
  - Load video from URL (react-native-video)
  - Extract frames at 30 FPS
  - Cache locally for offline comparison

- [ ] **Template pose extraction**
  - Run MoveNet on YouTube video frames
  - Extract all poses (entire video or key frames)
  - Store as template: `{ frame_index, landmarks, timestamp }`
  - File: Extend `src/services/PoseDetectionService.v2.ts`

- [ ] **Template goniometry**
  - Calculate joint angles for entire YouTube video
  - Store as template angles: `{ frame_index, angles: { left_elbow: 45°, ... } }`
  - File: Extend `src/services/goniometerService.ts`

#### 1.2: Patient Camera Capture (Real - Remove ALL Mocks)

- [ ] **Real VisionCamera integration**
  - File: `src/screens/PoseDetectionScreen.v2.tsx`
  - Remove any fallback mocks
  - Real-time frame capture at 30 FPS
  - Zero-copy JSI bridge

- [ ] **Real lighting/distance checks**
  - File: `src/utils/compensatoryMechanisms.ts`
  - Replace mocked Frame with real VisionCamera frames
  - ITU-R BT.601 brightness calculation (real)
  - Body fill estimation (real pixel analysis)

- [ ] **Real SetupWizard**
  - File: `src/components/common/SetupWizard.tsx`
  - Remove all mocked data (lines 33-118)
  - Use real frame analysis
  - Guide patient to optimal position/lighting

#### 1.3: Patient Pose Extraction & Goniometry

- [ ] **Real-time pose detection**
  - File: `src/services/PoseDetectionService.v2.ts`
  - MoveNet on live camera frames
  - 17 keypoints extracted
  - Confidence filtering (>0.5)

- [ ] **Real-time goniometry**
  - File: `src/services/goniometerService.ts`
  - Calculate joint angles from live poses
  - 3-point angle calculation (shoulder-elbow-wrist, etc.)
  - Output: `{ timestamp, angles: { ... } }`

#### 1.4: Comparison Algorithm (NEW - Critical)

- [ ] **Temporal alignment**
  - File: Create `src/services/temporalAlignmentService.ts`
  - Align patient video with YouTube template (handle speed differences)
  - Method 1 (simple): Speed ratio matching
  - Method 2 (advanced): Dynamic Time Warping (DTW) - implement if Method 1 insufficient
  - Output: `{ patient_frame_index → template_frame_index }`

- [ ] **Angle deviation calculation**
  - File: Create or update `src/features/videoComparison/services/comparisonAnalysisService.ts`
  - For each joint: `deviation = |patient_angle - template_angle|`
  - Account for temporal alignment (compare corresponding frames)
  - Output: `{ joint: "left_elbow", deviation: 12°, frame_index: 45 }`

- [ ] **Error detection integration**
  - File: `src/features/videoComparison/errorDetection/*.ts`
  - Use deviations to trigger error types (valgus, hiking, ROM, etc.)
  - Map to clinical error categories
  - Output: `{ error_type: "shoulder_hiking", severity: "warning", timestamp: 2.3s }`

#### 1.5: Feedback Generation

- [ ] **Smart feedback prioritization**
  - File: `src/features/videoComparison/services/smartFeedbackGenerator.ts`
  - Prioritize by injury risk (knee valgus > shoulder hiking)
  - Top 3 errors only (avoid overload)
  - Clear, actionable language

- [ ] **Real-time display**
  - Visual overlay on patient video
  - Angle deviations shown (you: 45°, target: 90°)
  - Error highlighting on joints
  - Progress indicator

### Testing Gate 1

```bash
# Unit tests (all new services)
npm run test src/services/youtubeService.test.ts
npm run test src/services/temporalAlignmentService.test.ts
npm run test src/features/videoComparison/services/comparisonAnalysisService.test.ts

# Integration test (end-to-end pipeline)
npm run test:integration -- --testNamePattern "YouTube Comparison Pipeline"

# Manual validation
1. Load YouTube template (shoulder abduction video)
2. Record patient doing same exercise
3. Verify comparison runs without crashes
4. Verify feedback generated (don't validate accuracy yet)
```

### Exit Criteria

- ✅ YouTube video loads and poses extracted
- ✅ Patient camera captures and poses extracted (real, 0% mocks)
- ✅ Goniometry calculates angles for both videos
- ✅ Temporal alignment matches patient to template
- ✅ Comparison calculates angle deviations
- ✅ Feedback displays (top 3 errors)
- ✅ No crashes in 10 end-to-end runs
- ✅ All unit tests pass (new services)
- ⚠️ Accuracy NOT validated yet (that's Gate 2)
- ⚠️ Performance may be slow (that's Gate 3)

**Estimated Effort:** 7-10 days (this is THE big gate)

---

## 🚪 Gate 2: Accuracy Validation (THE CRITICAL GATE)

**Objective:** Validate that pose, goniometry, and comparison are accurate enough for clinical use

**This is make-or-break. If accuracy fails here, nothing else matters.**

### Critical Metrics

| Component | Metric | Target | Method |
|-----------|--------|--------|--------|
| **Pose Detection** | Joint position error | ±5° | vs synthetic ground truth |
| **Goniometry** | Angle measurement error | ±3° | vs known angles |
| **Comparison** | Agreement with PT | κ ≥0.6 | Cohen's kappa |

### Tasks

#### 2.1: Create Synthetic Test Dataset (Ground Truth)

- [ ] **Synthetic video generation**
  - File: Create `tests/synthetic-dataset/`
  - Use Blender + rigged human model OR
  - Use existing datasets (Human3.6M, CMU Mocap)
  - 20 videos with known joint angles (ground truth)

- [ ] **Cover all error types**
  - Shoulder: hiking, internal rotation, incomplete ROM
  - Knee: valgus, heel lift, insufficient depth
  - Elbow: shoulder compensation, incomplete extension
  - Hip: posterior pelvic tilt, trunk lean

- [ ] **Cover all conditions**
  - Lighting: dark, dim, normal, bright, harsh
  - Clothing: tight, loose, shorts, long sleeves
  - Body types: slim, average, large
  - Occlusion: partial arm/leg hidden

#### 2.2: Pose Detection Accuracy Validation

- [ ] **Test against synthetic ground truth**
  - Run MoveNet on synthetic videos
  - Compare detected keypoints to ground truth
  - Calculate error: `|detected_angle - ground_truth_angle|`
  - File: Create `scripts/validate-pose-accuracy.ts`

- [ ] **Measure accuracy metrics**
  - Mean absolute error (MAE): ___ ° (target: <5°)
  - 95th percentile error: ___ ° (target: <8°)
  - Per-joint breakdown (shoulder, elbow, knee, hip)

- [ ] **Identify failure modes**
  - Which joints are least accurate?
  - Which conditions cause failures (lighting, occlusion)?
  - Document and create mitigation plan

#### 2.3: Goniometry Accuracy Validation

- [ ] **Test against known angles**
  - Use synthetic videos with known joint angles
  - Run goniometry service
  - Compare: `|calculated_angle - known_angle|`
  - File: Create `scripts/validate-goniometry-accuracy.ts`

- [ ] **Measure accuracy metrics**
  - MAE: ___ ° (target: <3°)
  - 95th percentile: ___ ° (target: <5°)
  - Test all calculation methods (3-point angle, quaternions, etc.)

- [ ] **Validate calculation method**
  - Document: Why 3-point angle? (cite academic source)
  - Alternative: Use quaternion-based angle (more robust to perspective)
  - Test both, choose more accurate

#### 2.4: Comparison Accuracy Validation

- [ ] **Create PT-annotated dataset**
  - Record 15 real patient videos (volunteer friends/colleagues)
  - Have 2-3 PTs independently annotate errors
  - Ground truth: PT consensus on errors
  - File: `tests/pt-annotated-dataset/`

- [ ] **Run comparison algorithm**
  - Compare patient videos to YouTube templates
  - Extract app-detected errors
  - File: `scripts/validate-comparison-accuracy.ts`

- [ ] **Calculate agreement metrics**
  - Cohen's kappa: ___ (target: ≥0.6)
  - Sensitivity: ___% (target: ≥80%) - % of PT-flagged errors detected
  - Specificity: ___% (target: ≥70%) - % of app-flagged errors confirmed by PT
  - False positive rate: ___% (target: <5%)

- [ ] **Error type breakdown**
  - Which errors detected accurately? (valgus, hiking, etc.)
  - Which errors missed? (false negatives)
  - Which errors over-detected? (false positives)

#### 2.5: Temporal Alignment Validation

- [ ] **Test speed variation handling**
  - Patient does exercise at 50% speed of YouTube video
  - Patient does exercise at 150% speed
  - Verify alignment still works

- [ ] **Test pause/hesitation handling**
  - Patient pauses mid-exercise
  - Verify alignment recovers

- [ ] **Measure alignment accuracy**
  - Manual ground truth: mark corresponding frames
  - Compare to algorithm output
  - Error: ___ frames off (target: <3 frames = 100ms at 30 FPS)

### Testing Gate 2

```bash
# Automated accuracy tests
npm run test:accuracy -- --synthetic-dataset
npm run test:accuracy -- --pt-annotated

# Generate accuracy report
npm run generate-accuracy-report
# Outputs: reports/accuracy-YYYY-MM-DD.md

# Validation checklist
- [ ] Pose MAE <5°
- [ ] Goniometry MAE <3°
- [ ] Comparison κ ≥0.6
- [ ] Sensitivity ≥80%
- [ ] Specificity ≥70%
- [ ] False positives <5%
```

### Exit Criteria

- ✅ Pose accuracy: MAE <5°, 95th percentile <8°
- ✅ Goniometry accuracy: MAE <3°, 95th percentile <5°
- ✅ Comparison accuracy: κ ≥0.6, sensitivity ≥80%, specificity ≥70%
- ✅ False positive rate <5%
- ✅ Temporal alignment error <3 frames
- ✅ All failure modes documented with mitigation plans
- ✅ Accuracy report generated and reviewed

**If any metric fails:** Debug, fix, re-test. Do NOT proceed to Gate 3 until accuracy is proven.

**Estimated Effort:** 7-10 days (critical validation phase)

---

## 🚪 Gate 3: Real-time Performance Optimization

**Objective:** Achieve <100ms end-to-end latency without degrading accuracy

### Latency Budget

```
TOTAL BUDGET: 100ms (10 FPS felt responsiveness)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Component                Allocated    Measured    Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Camera Capture           33ms         ___ms       [ ]
Pose Detection           30ms         ___ms       [ ]
Goniometry Calculation   10ms         ___ms       [ ]
Comparison Algorithm     15ms         ___ms       [ ]
Feedback Generation      7ms          ___ms       [ ]
UI Rendering             5ms          ___ms       [ ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                    100ms        ___ms       [ ]
```

### Tasks

#### 3.1: End-to-End Performance Profiling

- [ ] **Create performance profiling harness**
  - File: Create `scripts/profile-pipeline.ts`
  - Instrument every component with timestamps
  - Log: `{ component, start_time, end_time, duration }`

- [ ] **Measure baseline (current performance)**
  - Run on target device (iPhone SE - low-end)
  - Run 100 iterations
  - Calculate: mean, p50, p90, p99 latency
  - Document bottlenecks

- [ ] **Identify bottlenecks**
  - Which component exceeds budget?
  - CPU-bound or GPU-bound?
  - Memory allocation causing GC pauses?

#### 3.2: Pose Detection Optimization

- [ ] **GPU delegate optimization**
  - Test: GPU vs CoreML vs NNAPI vs CPU
  - Measure latency for each
  - Choose fastest (likely GPU on iOS, CoreML on newer devices)
  - File: Update `src/services/PoseDetectionService.v2.ts`

- [ ] **Zero-copy optimization**
  - Verify frame processor uses JSI bridge (no JS copying)
  - Ensure GPU buffer enabled
  - Measure memory usage (<500MB)

- [ ] **Model optimization**
  - Confirm MoveNet Lightning (not Thunder - Lightning is faster)
  - INT8 quantization enabled
  - Resolution: 256×256 (not 512×512)

#### 3.3: Goniometry Optimization

- [ ] **Vectorize calculations**
  - Use SIMD operations if available
  - Batch calculate all angles in one pass
  - Avoid redundant trig operations

- [ ] **Memoization**
  - Cache angle calculations for unchanged poses
  - Invalidate on new frame only

#### 3.4: Comparison Algorithm Optimization

- [ ] **Reduce comparison frequency**
  - Don't compare every frame (30 FPS)
  - Compare every 3rd frame (10 Hz) - still feels real-time
  - Saves 66% computation

- [ ] **Optimize temporal alignment**
  - If using DTW, use FastDTW approximation
  - If using speed ratio, precompute during template load

- [ ] **Early exit optimization**
  - If patient pose confidence <0.5, skip comparison
  - If patient not in frame, skip

#### 3.5: Stress Testing

- [ ] **Low-end device testing**
  - iPhone SE (2020) or equivalent Android
  - Measure latency under load
  - Test with background apps running

- [ ] **Thermal throttling simulation**
  - Run for 10 minutes continuous
  - Measure latency degradation
  - Ensure <100ms maintained even when hot

- [ ] **Memory pressure testing**
  - Run with low available memory
  - Verify no crashes, graceful degradation

### Testing Gate 3

```bash
# Performance benchmarks
npm run benchmark -- --end-to-end --iterations=100

# Stress tests
npm run test:stress -- --device=iphone-se --duration=10min

# Latency budget check
npm run check-latency-budget
# Fails if any component exceeds allocation

# Generate performance report
npm run generate-performance-report
# Outputs: reports/performance-YYYY-MM-DD.md
```

### Exit Criteria

- ✅ End-to-end latency <100ms (mean)
- ✅ p99 latency <150ms (occasional slowness acceptable)
- ✅ All components within budget
- ✅ Performance maintained on iPhone SE
- ✅ Performance maintained after 10 min (no thermal throttling degradation >20%)
- ✅ Memory usage <500MB
- ✅ 0 dropped frames in 5-minute session
- ✅ **Accuracy re-validated:** Optimizations didn't degrade accuracy (MAE still <5°)

**Estimated Effort:** 5-7 days

---

## 🚪 Gate 4: Smoothing & False Positive Reduction

**Objective:** Reduce jitter and false positives while maintaining accuracy

### Tasks

#### 4.1: One-Euro Filter Integration

- [ ] **Integrate filter into pose pipeline**
  - File: `src/utils/smoothing.ts` (already exists, needs integration)
  - File: Update `src/services/PoseDetectionService.v2.ts`
  - Apply filter to all 17 keypoints
  - Tuning parameters: `minCutoff=1.0, beta=0.007, dCutoff=1.0`

- [ ] **Measure jitter reduction**
  - Before smoothing: stddev of joint angles over 1 second
  - After smoothing: stddev should reduce by ≥50%
  - Target: jitter <3° stddev

- [ ] **Verify latency impact**
  - Smoothing should add <5ms (within budget)
  - Re-run latency tests from Gate 3

#### 4.2: Persistence Filtering

- [ ] **Create PersistenceFilter class**
  - File: Create `src/features/videoComparison/errorDetection/persistenceFilter.ts`
  - Errors must persist for threshold duration (150-500ms)
  - Prevents transient false positives

- [ ] **Integrate into error detection**
  - Update all error detection modules (shoulder, knee, elbow)
  - Apply persistence filter before flagging error
  - Tuning: 150ms for fast errors (valgus), 500ms for slow (ROM)

- [ ] **Measure false positive reduction**
  - Before: run on jittery test videos, count false positives
  - After: re-run, false positives should reduce by ≥80%
  - Target: <2% false positive rate

#### 4.3: Re-validate Accuracy

- [ ] **Ensure smoothing doesn't degrade accuracy**
  - Re-run accuracy tests from Gate 2
  - Pose MAE should remain <5°
  - Comparison κ should remain ≥0.6 (ideally improve slightly)

### Testing Gate 4

```bash
# Jitter measurement
npm run test:jitter -- --before-smoothing --after-smoothing

# False positive testing
npm run test:false-positives -- --jittery-videos

# Accuracy re-validation
npm run test:accuracy -- --with-smoothing

# Latency check
npm run benchmark -- --end-to-end
# Should still be <100ms
```

### Exit Criteria

- ✅ Jitter reduced by ≥50% (stddev <3°)
- ✅ False positives reduced by ≥80% (<2% rate)
- ✅ Latency still <100ms (smoothing adds <5ms)
- ✅ Accuracy maintained: MAE <5°, κ ≥0.6
- ✅ No new crashes introduced

**Estimated Effort:** 3-4 days

---

## 🚪 Gate 5: Clinical Thresholds & Research Integration

**Objective:** Replace placeholder thresholds with research-backed values, validate with PTs

### Tasks

#### 5.1: Create Clinical Thresholds Adapter

- [ ] **Map research thresholds to MoveNet**
  - File: Create `src/features/videoComparison/config/clinicalThresholdsAdapter.ts`
  - Source: `clinicalThresholds.ts` (MediaPipe 33-point)
  - Target: MoveNet 17-point model
  - Convert: percentage-based (5% humerus) to absolute (1.7cm)

- [ ] **Preserve research citations**
  - Every threshold has source comment
  - Example: `warning_cm: 1.7 // 5% humerus (AAOS OrthoInfo 2023)`

- [ ] **Remove all placeholders**
  - Delete `errorDetectionConfig.ts` (old placeholders)
  - Replace with `clinicalThresholdsAdapter.ts`
  - Zero "TUNE REQUIRED" comments

#### 5.2: Primary Joint Focus

- [ ] **Add primary joint selector**
  - File: Update `src/types/models.ts`
  - Type: `PrimaryJoint = 'shoulder' | 'elbow' | 'knee' | 'hip' | 'all'`

- [ ] **Implement 10× priority boost**
  - File: Update `src/features/videoComparison/services/smartFeedbackGenerator.ts`
  - Errors matching primary joint get 10× weight
  - Still show top 3 overall (but primary joint errors bubble up)

#### 5.3: Validate with PTs

- [ ] **PT review session**
  - Show 10 videos with detected errors
  - Ask PTs: "Do you agree with these thresholds?"
  - Adjust if consensus differs from research

- [ ] **Re-measure comparison accuracy**
  - Run comparison with new thresholds
  - Cohen's kappa should improve: target κ ≥0.65 (up from 0.6)
  - Sensitivity/specificity should improve

### Testing Gate 5

```bash
# Threshold validation
npm run test:thresholds -- --pt-annotated-dataset

# Comparison accuracy (should improve)
npm run test:accuracy -- --with-clinical-thresholds

# Primary joint focus
npm run test:primary-joint -- --joint=shoulder
```

### Exit Criteria

- ✅ All thresholds research-backed (zero placeholders)
- ✅ Research citations in code comments
- ✅ Primary joint focus implemented
- ✅ Comparison accuracy improved: κ ≥0.65
- ✅ PT validation: ≥80% agreement with thresholds
- ✅ Performance maintained: <100ms latency

**Estimated Effort:** 3-4 days

---

## 🚪 Gate 6: Simplicity & UX Validation

**Objective:** Ensure app is dead simple to use (≤5 steps to feedback, cognitive load ≤3)

### Simplicity Scorecard

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Steps to first feedback** | ≤5 | User observation |
| **Time to first feedback** | ≤2 minutes | Stopwatch |
| **Cognitive load** | ≤3 / 10 | NASA-TLX survey |
| **Error recovery steps** | ≤2 | User observation |
| **Task success rate** | 100% | 5/5 users complete without help |

### Tasks

#### 6.1: Simplify SetupWizard

- [ ] **Reduce steps**
  - Current: Permissions → Lighting → Distance → Practice → Start
  - Target: Permissions → Auto-check (lighting + distance) → Start
  - Auto-guidance: "Move closer" / "Find better light" (real-time, not sequential steps)

- [ ] **Visual feedback**
  - Green checkmark when lighting good
  - Red X when lighting poor (with fix instructions)
  - Body outline showing optimal position

- [ ] **Skip for advanced users**
  - "Skip setup" button (hidden initially)
  - Remembers preference for next session

#### 6.2: Simplify Exercise Flow

- [ ] **Reduce taps**
  - Current flow: ? taps (need to measure)
  - Target: ≤8 taps total (open app → feedback received)
  - Eliminate: confirmation dialogs, unnecessary screens

- [ ] **Auto-start recording**
  - After SetupWizard, auto-start camera (no "Start" button)
  - Countdown: 3, 2, 1, Go
  - Stop automatically when template complete

- [ ] **Clear progress indicator**
  - "Rep 1 of 10"
  - Progress bar
  - Audio cue when rep complete

#### 6.3: Simplify Feedback Display

- [ ] **Top 3 errors only**
  - Already implemented, verify it's clear
  - Large text, color-coded (red = critical, yellow = warning)

- [ ] **Visual highlighting**
  - Overlay circles on problem joints
  - Show target angle vs actual angle
  - Example: "Your elbow: 45°, Target: 90°"

- [ ] **Actionable language**
  - Bad: "Shoulder hiking detected"
  - Good: "Lower your shoulder 2 inches"

#### 6.4: User Testing (n=5)

- [ ] **Recruit 5 users**
  - Not engineers, not familiar with app
  - Age range: 25-65
  - Mix: 3 tech-savvy, 2 non-tech

- [ ] **Observation protocol**
  - Give task: "Try to get feedback on your shoulder exercise"
  - Don't help unless they give up
  - Measure: steps, time, cognitive load (NASA-TLX)

- [ ] **Iterate based on feedback**
  - Common confusion points → simplify
  - Target: 5/5 users succeed without help

### Testing Gate 6

```bash
# Automated step counting
npm run test:ux -- --count-steps
# Should output: "Steps to feedback: 5"

# User testing
# (Manual, no automated test)
# Document in: reports/ux-testing-YYYY-MM-DD.md
```

### Exit Criteria

- ✅ Steps to feedback ≤5
- ✅ Time to feedback ≤2 minutes (median across 5 users)
- ✅ Cognitive load ≤3 (NASA-TLX score)
- ✅ Task success rate 100% (5/5 users)
- ✅ Error recovery ≤2 steps
- ✅ No functionality lost (all features still work)

**Estimated Effort:** 4-5 days (including user testing)

---

## 🚪 Gate 7: Robustness & Device Adaptation

**Objective:** Handle edge cases gracefully, adapt to device constraints

### Tasks

#### 7.1: Real Device Health Monitoring

- [ ] **Native thermal monitoring**
  - iOS: Create `ios/PhysioAssist/ThermalMonitor.swift`
  - Android: Create `android/app/.../ThermalMonitor.kt`
  - Expose `ProcessInfo.thermalState` (iOS), `PowerManager.getThermalHeadroom()` (Android)

- [ ] **Adaptive performance**
  - Thermal state = nominal → 30 FPS, 720p
  - Thermal state = fair → 20 FPS, 480p
  - Thermal state = serious → 15 FPS, 480p
  - Thermal state = critical → pause, warn user ("Let device cool")

- [ ] **Memory monitoring**
  - React to low memory warnings
  - Progressive degradation: clear cache → reduce resolution → flush buffers → warn user

#### 7.2: Edge Case Handling

- [ ] **Lighting conditions**
  - Too dark: warn user, increase exposure programmatically (if possible)
  - Too bright: warn user, suggest move to shade
  - Harsh shadows: warn user, suggest diffused light

- [ ] **Occlusion handling**
  - Arm/leg partially hidden: use last known position (with confidence decay)
  - Full occlusion: skip frame, don't error
  - Warn if occlusion persists >2 seconds

- [ ] **Clothing variations**
  - Loose clothing: may hide body shape, lower confidence threshold
  - Tight clothing: better pose detection
  - Document: best practices for clothing (in SetupWizard tips)

- [ ] **Failure modes**
  - Camera permission denied: clear instructions to enable
  - Model load failure: retry with fallback (CPU delegate)
  - Crash recovery: save session state, resume on restart

#### 7.3: Stress Testing

- [ ] **100-session marathon**
  - Run 100 exercise sessions back-to-back
  - Target: 0 crashes
  - Monitor: memory leaks, performance degradation

- [ ] **Multitasking stress**
  - Run app with 10 other apps open
  - Verify: graceful degradation, no crashes

- [ ] **Network loss**
  - Disconnect network mid-session
  - Verify: offline mode works (if YouTube template cached)

### Testing Gate 7

```bash
# Device health simulation
npm run test:device-health -- --thermal=critical --memory=low

# Edge case tests
npm run test:edge-cases -- --lighting=dark --occlusion=partial

# Stress test
npm run test:stress -- --sessions=100 --multitasking
```

### Exit Criteria

- ✅ 0 crashes in 100-session test
- ✅ Graceful degradation under thermal/memory pressure
- ✅ All edge cases handled (lighting, occlusion, clothing)
- ✅ Failure modes documented and tested
- ✅ Performance maintained (still <100ms in normal conditions)

**Estimated Effort:** 5-6 days

---

## 🚪 Gate 8: Essential Features Only

**Objective:** Add only features that improve core experience (no bloat)

### Feature Justification Framework

Before adding any feature, answer:
1. **Does it improve comparison accuracy?** If no → defer
2. **Does it improve user simplicity?** If no → defer
3. **Does it enable core workflow?** If no → defer

### Approved Features

#### 8.1: YouTube Template Library

- [ ] **Template CRUD**
  - Create: Add YouTube URL, extract title/thumbnail
  - Read: List all templates for patient
  - Update: Edit primary joint, sets/reps
  - Delete: Soft delete with confirmation

- [ ] **Template preview**
  - Play YouTube video in-app
  - Show detected keypoints overlay (verify pose extraction works)

**Justification:** Enables core workflow (PT assigns exercises)

#### 8.2: Prescription API

- [ ] **REST endpoint**
  - `POST /api/prescriptions`
  - Body: `{ user_id, exercise_urls, primary_joint, sets, reps }`
  - Auth: API key (simple)

- [ ] **Patient inbox**
  - List new prescriptions
  - Accept → adds to template library
  - Decline → soft delete

**Justification:** Enables core workflow (PT-patient integration)

#### 8.3: Audio Feedback

- [ ] **Text-to-Speech**
  - Expo Speech integration
  - Speak top error: "Lower your shoulder"
  - Debounce: max 1 audio cue per 5 seconds (same error)

- [ ] **Haptic feedback**
  - Expo Haptics integration
  - Error detected → haptic pulse
  - Coordinated with audio (not redundant)

**Justification:** Improves accessibility and real-time feedback

#### 8.4: Session History

- [ ] **Local storage**
  - Save: date, exercise, duration, errors detected
  - Progress chart: errors over time (decreasing = improving)

**Justification:** Motivates patients (see progress)

### Deferred Features (Not in Gate 8)

- ❌ Authentication (nickname login is enough for beta)
- ❌ Telemetry backend (local logging is enough)
- ❌ Device health dashboards (telemetry is nice-to-have)
- ❌ Social sharing
- ❌ Gamification (badges, streaks)

### Testing Gate 8

```bash
# Feature tests
npm run test src/features/templates/*.test.ts
npm run test src/features/prescriptions/*.test.ts
npm run test src/services/audioFeedbackService.test.ts

# Regression: features don't slow down core
npm run benchmark -- --end-to-end
# Should still be <100ms
```

### Exit Criteria

- ✅ Template library works (CRUD + preview)
- ✅ Prescription API works (PT can assign)
- ✅ Audio feedback works (debounced, clear)
- ✅ Session history works (local, progress chart)
- ✅ **Performance maintained:** <100ms latency (features don't add bloat)
- ✅ **Simplicity maintained:** ≤5 steps to feedback (features don't complicate)

**Estimated Effort:** 4-5 days

---

## 🚪 Gate 9: Comprehensive Testing & Validation

**Objective:** Test everything systematically before beta

### Testing Matrix

| Test Type | Coverage | Status |
|-----------|----------|--------|
| **Unit Tests** | ≥95% (statements, branches, functions) | [ ] |
| **Integration Tests** | All major flows | [ ] |
| **E2E Tests (Detox)** | Critical user paths | [ ] |
| **Performance Tests** | <100ms latency | [ ] |
| **Accuracy Tests** | Pose/goniometry/comparison | [ ] |
| **Accessibility Tests** | WCAG AA compliance | [ ] |
| **Security Tests** | OWASP top 10 | [ ] |
| **Edge Case Tests** | Lighting, occlusion, failures | [ ] |

### Tasks

#### 9.1: Expand Synthetic Test Dataset

- [ ] **50 videos total** (up from 20)
  - All error types × all conditions
  - Body diversity: age, gender, size
  - File: `tests/synthetic-dataset/`

#### 9.2: Real Patient Videos

- [ ] **15 videos with PT annotations**
  - Volunteer friends/colleagues (not post-surgical)
  - 2-3 PTs annotate independently
  - Use for comparison validation

#### 9.3: Accessibility Testing

- [ ] **WCAG AA compliance**
  - Screen reader compatible
  - Color contrast ≥4.5:1
  - Keyboard navigation (if applicable)
  - Audio feedback for visually impaired

- [ ] **Test with users**
  - 1 low-vision user
  - 1 motor impairment user (limited hand dexterity)
  - Ensure usable

#### 9.4: Security Testing

- [ ] **Static analysis**
  - OWASP dependency check
  - No secrets in code
  - No SQL injection (if using DB)

- [ ] **Dynamic testing**
  - Telemetry payloads: no PII leakage
  - API: rate limiting works
  - Encryption: keys rotate

#### 9.5: Regression Testing

- [ ] **Automate all tests**
  - CI runs all tests on every PR
  - No manual testing required for regression

- [ ] **Mutation testing**
  - Stryker on critical services
  - >80% mutants killed

### Testing Gate 9

```bash
# Run ALL tests
npm run test:all

# Generate comprehensive test report
npm run generate-test-report
# Outputs: reports/comprehensive-testing-YYYY-MM-DD.md
```

### Exit Criteria

- ✅ All tests pass (unit, integration, E2E, performance, accuracy)
- ✅ Test coverage ≥95%
- ✅ Accessibility: WCAG AA compliant
- ✅ Security: OWASP checks pass, 0 vulnerabilities
- ✅ Synthetic dataset: 50 videos tested
- ✅ Real patient videos: 15 tested
- ✅ Mutation testing: >80% mutants killed
- ✅ Regression suite: automated in CI

**Estimated Effort:** 5-7 days

---

## 🚪 Gate 10: Beta Field Trial

**Objective:** Validate with real users in real conditions

### Beta Design

| Parameter | Value |
|-----------|-------|
| **Participants** | 5-10 volunteers (friends, colleagues) |
| **Duration** | 2-4 weeks |
| **Exercises** | Any (not post-surgical, just testing) |
| **Goal** | Find bugs, usability issues, performance problems |
| **Metrics** | Crash rate, feedback quality, usability |

### Tasks

#### 10.1: Recruitment

- [ ] **Recruit 5-10 users**
  - Diverse: age, tech-savviness, body type
  - Not post-surgical (avoid medical risk)
  - Mix of conditions: home gym, outdoor, bright/dim lighting

#### 10.2: Onboarding

- [ ] **Beta tester guide**
  - How to install (TestFlight/Play Console beta track)
  - What to test (feature checklist)
  - How to report bugs (GitHub issues template)

#### 10.3: Monitoring

- [ ] **Telemetry dashboard**
  - Track: sessions, crash rate, latency, errors detected
  - Daily review

- [ ] **Weekly check-ins**
  - 15-min calls with each tester
  - Ask: confusing? broken? slow?
  - Document in: `docs/beta-feedback/week-N.md`

#### 10.4: Iteration

- [ ] **Fix P1 bugs** (crashes, data loss)
  - Within 24 hours
  - Ship update to beta testers

- [ ] **Fix P2 usability issues**
  - Within 1 week
  - A/B test fixes

- [ ] **Defer P3** (nice-to-haves)
  - Document for post-beta

### Testing Gate 10

```bash
# No automated tests (real-world usage)
# Monitor via telemetry dashboard
# Document in: reports/beta-trial-YYYY-MM-DD.md
```

### Exit Criteria

- ✅ 5-10 beta testers recruited and using app
- ✅ 2-4 weeks of real usage
- ✅ Crash rate <1% (measured)
- ✅ All P1 bugs fixed
- ✅ All P2 usability issues addressed
- ✅ Positive feedback ≥80% (8/10 testers)
- ✅ Accuracy validated in real conditions (anecdotal PT confirmation)
- ✅ Performance validated: <100ms on diverse devices

**Estimated Effort:** 2-4 weeks (mostly waiting)

---

## 📊 Success Metrics Summary

| Metric | Target | Gate | Validation Method |
|--------|--------|------|-------------------|
| **Pose Accuracy** | ±5° MAE | Gate 2 | vs synthetic ground truth |
| **Goniometry Accuracy** | ±3° MAE | Gate 2 | vs known angles |
| **Comparison Accuracy** | κ ≥0.6 | Gate 2 | vs PT annotations |
| **Latency** | <100ms | Gate 3 | End-to-end profiling |
| **Jitter** | <3° stddev | Gate 4 | Smoothing validation |
| **False Positives** | <2% | Gate 4 | Persistence filtering |
| **Steps to Feedback** | ≤5 | Gate 6 | User observation |
| **Cognitive Load** | ≤3 / 10 | Gate 6 | NASA-TLX survey |
| **Crash Rate** | <1% | Gate 10 | Beta telemetry |
| **User Satisfaction** | ≥80% | Gate 10 | Beta feedback |

---

## 🎯 Post-Beta Decision

### GO Criteria (Proceed to Clinical Pilot)

- ✅ All success metrics met
- ✅ Beta feedback positive (≥80%)
- ✅ 0 unresolved P1 bugs
- ✅ Performance stable across devices
- ✅ Accuracy validated in real conditions

### PIVOT Criteria (Improve Before Clinical Pilot)

- ⚠️ Accuracy 0.4 ≤ κ < 0.6: Retrain, adjust thresholds
- ⚠️ Latency 100-200ms: Further optimization needed
- ⚠️ Usability issues: Simplify, iterate

### STOP Criteria (Fundamental Blocker)

- ❌ Accuracy κ < 0.4: Technology not viable
- ❌ Crash rate >5%: Too unstable
- ❌ Latency >300ms: Unusable

---

## 📝 Roadmap Summary

**Total Gates:** 11 (0-10)

**Critical Path:**
```
Gate 0: Toolchain → Gate 1: Core Pipeline → Gate 2: Accuracy (CRITICAL) →
Gate 3: Performance → Gate 4-5: Optimization → Gate 6: Simplicity →
Gate 7-8: Robustness + Features → Gate 9: Testing → Gate 10: Beta
```

**Estimated Timeline:** Not time-based (ship when ready)
- Fast path: ~6-8 weeks if all gates pass first try
- Realistic: ~10-14 weeks with iterations

**Philosophy:** Accuracy first, performance second, simplicity always, features last.

---

**Next Step:** Begin Gate 0 (Toolchain & Build Sanity)
