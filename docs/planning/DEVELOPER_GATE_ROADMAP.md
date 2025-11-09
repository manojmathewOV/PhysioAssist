# PhysioAssist Developer Gate Roadmap
## Sequential Gate-Based Plan (Solo Developer)

> **Last Updated:** November 8, 2025
> **Developer:** Solo (You)
> **Approach:** Sequential gates, no time pressure, rigorous testing
> **Philosophy:** Ship when ready, not when scheduled

---

## 🎯 Mission

Remove all mocks/stubs/placeholders, integrate research-backed features, and validate with real-world testing before considering any pilot study.

---

## 🏗️ Architecture Overview

```
┌──────────┐    ┌────────────────────┐    ┌────────────────────┐    ┌──────────────────┐
│ Capture  │──▶│ PoseDetectionScreen │──▶│ Pose Services       │──▶│ Feedback/Telemetry│
│ (Vision) │    │ (React Native)     │    │ (JSI + Services)   │    │ (Store + Services)│
└──────────┘    └────────────────────┘    └────────────────────┘    └──────────────────┘
        ▲                    │                         │                       │
        │                    ▼                         ▼                       ▼
 ┌──────────────┐   ┌───────────────────┐     ┌─────────────────────┐   ┌───────────────────┐
 │ Setup Wizard │   │ Compensatory Utils│     │ Device/Mem Health   │   │ Audio + Telemetry │
 │ (Patient UX) │   │ (Env heuristics)  │     │ (Adaptive cadence)  │   │ (Guidance + Ops)  │
 └──────────────┘   └───────────────────┘     └─────────────────────┘   └───────────────────┘
```

---

## 📋 Gate Structure

Each gate has:
- **Objective:** What you're building
- **Current State:** What exists (mocks/stubs/real)
- **Tasks:** Sequential checklist (no parallelization needed)
- **Testing Gate:** Automated + manual validation
- **Exit Criteria:** Binary GO/NO-GO
- **No Stubs Rule:** Every mock must be replaced with real implementation

---

## Gate 0: Toolchain & Build Sanity

**Objective:** Ensure reproducible builds and catch errors before runtime

### Current State Analysis

| Component | Status | Issue |
|-----------|--------|-------|
| CI/CD pipeline | ❓ Unknown | Need `.github/workflows/ci.yml` |
| Linting/TypeScript | ✅ Likely exists | Verify runs on every commit |
| Security scanning | ❌ Missing | Need `npm run security:scan` |
| Git hooks | ❓ Unknown | Need pre-commit formatting |

### Tasks

- [ ] **Create CI pipeline** (`.github/workflows/ci.yml`)
  - npm ci (lockfile integrity check)
  - npm run lint
  - npm run typecheck
  - npm run security:scan (npm audit + Snyk)
  - Metro bundler validation
- [ ] **Set up git hooks** (husky + lint-staged)
  - Pre-commit: Prettier + ESLint
  - Pre-push: Typecheck + tests
- [ ] **Document toolchain versions**
  - Node, npm, React Native, Expo
  - Lock in `.nvmrc` and `package.json` engines

### Testing Gate 0

```bash
# Automated checks (must pass on every commit)
npm ci
npm run lint
npm run typecheck
npm run security:scan
expo doctor
```

**Exit Criteria:**
- ✅ CI pipeline green on main branch
- ✅ All commands above pass locally
- ✅ No security vulnerabilities (high/critical)
- ✅ Git hooks enforcing formatting

**Estimated Effort:** 1-2 days (setup once, runs forever)

---

## Gate 1: Remove Mocks from Camera & Pose Pipeline

**Objective:** Replace all mocked camera/pose data with real VisionCamera integration

### Current State Analysis

**File:** `src/components/common/SetupWizard.tsx`
- ❌ **Line 33-118:** Uses mocked `Frame` and landmark data
- ❌ `checkLightingConditions()` - simulated brightness
- ❌ `checkPatientDistance()` - simulated body fill

**File:** `src/screens/PoseDetectionScreen.v2.tsx`
- ✅ **Line 75-138:** Real VisionCamera config exists
- ⚠️ Need to verify no fallback mocks

**File:** `src/services/PoseDetectionService.v2.ts`
- ✅ **Line 12-133:** Real TFLite model loading
- ✅ **Line 152-205:** Performance stats tracking (real)

### Tasks

#### 1.1: Real Frame Analysis in SetupWizard

- [ ] **Replace mocked Frame** (SetupWizard.tsx:33-118)
  ```typescript
  // BEFORE (MOCK):
  const mockFrame = { /* fake data */ };

  // AFTER (REAL):
  const { frame } = useCameraFrame(); // From VisionCamera
  const brightness = calculateBrightness(frame); // Real ITU-R BT.601
  const bodyFill = estimateBodyFill(frame); // Real pixel analysis
  ```

- [ ] **Implement real lighting analysis**
  - Use ITU-R BT.601 luminance formula
  - Calculate histogram for contrast
  - Detect shadows using variance
  - File: `src/utils/compensatoryMechanisms.ts:84-140`

- [ ] **Implement real distance check**
  - Estimate body fill % from frame
  - Use pose keypoint bounding box
  - Validate against 40-60% optimal range
  - File: `src/utils/compensatoryMechanisms.ts:16-101`

#### 1.2: Camera Configuration Hardening

- [ ] **Profile per-device capture settings**
  - Test on 5 devices (2 iOS, 3 Android)
  - Document optimal `pixelFormat`, `fps`, `enableGpuBuffers`
  - File: `src/screens/PoseDetectionScreen.v2.tsx:75-138`

- [ ] **Create device capability detection**
  - Check GPU buffer support
  - Auto-adjust resolution (720p → 480p on low-end)
  - File: Create `src/utils/deviceCapabilities.ts`

#### 1.3: Validate Pose Detection Pipeline

- [ ] **Ensure zero-copy path works**
  - Verify frame processor JSI bridge
  - Measure memory usage (<500MB)
  - File: `src/services/PoseDetectionService.v2.ts:108-205`

- [ ] **Test model delegate fallback**
  - GPU → CoreML → NNAPI → CPU
  - Measure latency per delegate
  - Document in code comments

### Testing Gate 1

```bash
# Unit tests
npm run test src/utils/compensatoryMechanisms.test.ts
npm run test src/services/PoseDetectionService.v2.test.ts

# Integration tests (Detox)
npm run e2e:ios -- --configuration ios.sim.debug --testNamePattern "SetupWizard"
npm run e2e:android -- --testNamePattern "SetupWizard"

# Manual validation
- Open SetupWizard
- Cover camera (should detect low light)
- Stand too close (should warn)
- Stand too far (should warn)
- Perfect setup (should pass to practice step)
```

**Exit Criteria:**
- ✅ SetupWizard uses 100% real frame data (0% mocks)
- ✅ Lighting detection works in 5 lighting conditions
- ✅ Distance check accurate within ±10%
- ✅ Tests pass on 2 iOS + 3 Android devices
- ✅ No `TODO`, `FIXME`, or `MOCK` comments in modified files

**Estimated Effort:** 3-5 days

---

## Gate 2: Integrate One-Euro Filter (Remove Jitter)

**Objective:** Replace placeholder smoothing with research-backed One-Euro filter

### Current State Analysis

**File:** `src/utils/smoothing.ts` (416 lines)
- ✅ **One-Euro filter implemented** (ACM CHI 2012)
- ❌ **NOT INTEGRATED** - Zero imports found in codebase
- File exists but is dead code

**File:** `src/services/PoseDetectionService.v2.ts`
- ❌ No smoothing applied to pose output
- Raw jittery landmarks sent directly to Redux

### Tasks

#### 2.1: Integrate Filter into Pose Pipeline

- [ ] **Import PoseLandmarkFilter** into PoseDetectionService.v2.ts
  ```typescript
  import { PoseLandmarkFilter } from '@/utils/smoothing';

  export class PoseDetectionServiceV2 {
    private filter: PoseLandmarkFilter;

    constructor() {
      this.filter = new PoseLandmarkFilter(
        1.0,   // minCutoff (clinical default)
        0.007, // beta
        1.0,   // dCutoff
        0.5    // minVisibility
      );
    }

    async detectPose(frame) {
      const rawPose = await this.model.detect(frame);
      const timestamp = performance.now() / 1000;
      const smoothedPose = this.filter.filterPose(rawPose, timestamp);
      return smoothedPose;
    }
  }
  ```

- [ ] **Add filter reset on session start**
  - Clear filter state between exercises
  - Prevent smoothing across different movements

#### 2.2: Tune Filter Parameters

- [ ] **Record 10 test videos**
  - Shoulder abduction
  - Knee squats
  - Elbow flexion
  - Measure jitter before/after (stddev of joint angles)

- [ ] **Validate latency <50ms**
  - Add performance timing
  - Log to telemetry service

- [ ] **Document tuning rationale**
  - Why minCutoff=1.0? (from research)
  - Why beta=0.007? (validated in smoothing.ts)

### Testing Gate 2

```bash
# Unit tests
npm run test src/utils/smoothing.test.ts
npm run test src/services/PoseDetectionService.v2.test.ts

# Benchmark test
npm run benchmark -- --test=smoothing
# Expect: <50ms latency, >50% jitter reduction

# Manual validation
- Record shoulder exercise
- Check Redux pose data has smooth angle progression
- Verify no visual lag in UI
```

**Exit Criteria:**
- ✅ smoothing.ts imported and used (no dead code)
- ✅ Joint angle jitter reduced by ≥50% (measured)
- ✅ Filter latency <50ms (logged via telemetry)
- ✅ No perceptible lag in visual feedback
- ✅ Benchmarks stored in `benchmarks/smoothing.json`

**Estimated Effort:** 2-3 days

---

## Gate 3: Replace Clinical Thresholds Placeholders

**Objective:** Remove all "⚠️ TUNE REQUIRED" warnings with research-backed values

### Current State Analysis

**File:** `src/features/videoComparison/config/errorDetectionConfig.ts` (309 lines)
- ❌ **Placeholder values** with "TUNE REQUIRED" warnings
- Example: `warning_cm: 2.0 // ⚠️ TUNE: Placeholder`

**File:** `src/features/videoComparison/config/clinicalThresholds.ts` (434 lines)
- ✅ **Research-backed thresholds** with AAOS/IJSPT citations
- ❌ **NOT INTEGRATED** - Dead code (zero imports)
- Assumes MediaPipe 33-point model (we use MoveNet 17-point)

**File:** `src/features/videoComparison/errorDetection/shoulderErrors.ts` (403 lines)
- Uses MoveNet 17-keypoint indices (Line 3-5)
- Needs adapter to use clinicalThresholds values

### Tasks

#### 3.1: Create Clinical Thresholds Adapter

- [ ] **Create adapter file** (`src/features/videoComparison/config/clinicalThresholdsAdapter.ts`)
  ```typescript
  /**
   * Maps research-backed MediaPipe thresholds to MoveNet 17-point model
   * Preserves research citations while adapting to current architecture
   */
  import { CLINICAL_THRESHOLDS } from './clinicalThresholds';

  export const MOVENET_CLINICAL_THRESHOLDS = {
    shoulder: {
      shoulderHiking: {
        // Convert 5-8% humerus to cm (avg humerus = 33cm)
        warning_cm: 1.7,  // 5% × 33cm (from AAOS)
        critical_cm: 2.6, // 8% × 33cm
        persistence_ms: 400, // From research
        source: CLINICAL_THRESHOLDS.shoulder.abduction_shrug.source
      },
      // ... map all shoulder errors
    },
    knee: {
      kneeValgus: {
        warning_deg: 8,  // FPPA threshold (IJSPT)
        critical_deg: 10,
        persistence_ms: 150, // 5-6 frames at 30fps
        source: CLINICAL_THRESHOLDS.knee.valgus_fppa.source
      },
      // ... map all knee errors
    }
  };
  ```

- [ ] **Replace errorDetectionConfig.ts imports**
  - Change all imports from `errorDetectionConfig` to `clinicalThresholdsAdapter`
  - Remove all "TUNE REQUIRED" comments
  - Add research citations to code comments

#### 3.2: Add Persistence Filtering

- [ ] **Create PersistenceFilter class**
  - File: `src/features/videoComparison/errorDetection/persistenceFilter.ts`
  - Temporal validation: errors must persist 150-500ms
  - Prevents false positives from jitter

- [ ] **Integrate into error detection modules**
  - shoulderErrors.ts
  - kneeErrors.ts
  - elbowErrors.ts
  - Each detection function checks persistence

#### 3.3: Document Threshold Derivation

- [ ] **Create threshold documentation**
  - File: `docs/clinical/THRESHOLD_DERIVATION.md`
  - Table: Error type → Research source → Value → Rationale
  - Include MoveNet adaptation notes

### Testing Gate 3

```bash
# Unit tests
npm run test src/features/videoComparison/config/clinicalThresholdsAdapter.test.ts
npm run test src/features/videoComparison/errorDetection/persistenceFilter.test.ts

# Integration tests
npm run test:integration -- --testNamePattern "Error Detection"

# Manual validation
- Record shoulder hiking (intentional)
- Verify warning at 1.7cm, critical at 2.6cm
- Verify error persists for 400ms before showing
- Check research citation displayed in feedback
```

**Exit Criteria:**
- ✅ Zero "TUNE REQUIRED" warnings in codebase
- ✅ All thresholds have research citations in code comments
- ✅ clinicalThresholds.ts imported and used (no dead code)
- ✅ Persistence filter prevents false positives (tested with jittery movements)
- ✅ Documentation complete with derivation table

**Estimated Effort:** 4-5 days

---

## Gate 4: Implement Real Device Health Monitoring

**Objective:** Replace mocked thermal/memory monitoring with real native APIs

### Current State Analysis

**File:** `src/services/deviceHealthMonitor.ts` (233 lines)
- ❌ **Line 153-233:** Mock thermal state generator
- ❌ No real iOS/Android thermal API integration

**File:** `src/services/memoryHealthManager.ts` (208 lines)
- ⚠️ **Line 120-208:** Progressive degradation logic exists
- ❌ Memory warnings are mocked

### Tasks

#### 4.1: Native Thermal API Integration

- [ ] **Create native module** (iOS)
  - File: `ios/PhysioAssist/ThermalMonitor.swift`
  - Expose `ProcessInfo.thermalState` via React Native bridge
  - Subscribe to `NSProcessInfo.thermalStateDidChangeNotification`

- [ ] **Create native module** (Android)
  - File: `android/app/src/main/java/com/physioassist/ThermalMonitor.kt`
  - Use `PowerManager.getThermalHeadroom()` (Android 11+)
  - Fall back to battery temperature for older versions

- [ ] **Update DeviceHealthMonitor**
  - Replace mock generator (Line 153-233)
  - Use real native bridge
  - Log thermal transitions to telemetry

#### 4.2: Real Memory Pressure Handling

- [ ] **iOS memory warnings**
  - Subscribe to `UIApplication.didReceiveMemoryWarningNotification`
  - Trigger MemoryHealthManager actions

- [ ] **Android memory monitoring**
  - Use `ActivityManager.getMemoryInfo()`
  - Check `lowMemory` flag
  - Trigger progressive degradation

- [ ] **Test degradation flow**
  - Simulate memory pressure
  - Verify: clear cache → reduce resolution → flush buffers → warn user
  - Ensure app doesn't crash

#### 4.3: Adaptive FPS/Resolution

- [ ] **Implement thermal throttling**
  ```typescript
  // When thermal state = critical
  - Reduce FPS: 30 → 20 → 15
  - Reduce resolution: 720p → 480p
  - Log to telemetry
  ```

- [ ] **Create recovery logic**
  - When thermal state = nominal
  - Gradually restore FPS and resolution
  - Prevent rapid oscillation (hysteresis)

### Testing Gate 4

```bash
# Unit tests
npm run test src/services/deviceHealthMonitor.test.ts
npm run test src/services/memoryHealthManager.test.ts

# Device tests (manual)
- iOS: Trigger memory warning (Xcode Instruments)
- Android: Stress test with memory-intensive app in background
- Verify progressive degradation without crash
- Check telemetry logs thermal/memory events

# Stress test
npm run test:stress -- --duration=10min --thermal=high
```

**Exit Criteria:**
- ✅ Real iOS thermal API integrated (no mocks)
- ✅ Real Android thermal API integrated (no mocks)
- ✅ Memory warnings trigger progressive degradation
- ✅ App survives 10-minute stress test without crash
- ✅ Telemetry logs all thermal/memory transitions
- ✅ FPS/resolution adapt correctly under pressure

**Estimated Effort:** 5-7 days (native bridge development)

---

## Gate 5: Telemetry & Production Monitoring

**Objective:** Complete telemetry pipeline for field insights and debugging

### Current State Analysis

**File:** `src/features/videoComparison/services/telemetryService.ts` (214 lines)
- ✅ **Line 1-144:** Batch flushing logic exists
- ⚠️ Need backend endpoint for ingestion
- ⚠️ Need dashboard for visualization

### Tasks

#### 5.1: Telemetry Backend

- [ ] **Create ingestion endpoint**
  - POST /api/telemetry/batch
  - Validate JWT auth
  - Store in PostgreSQL or ClickHouse (time-series)

- [ ] **Schema design**
  ```sql
  CREATE TABLE telemetry_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    session_id UUID,
    event_type VARCHAR(50), -- frame_processed, thermal_throttle, etc.
    timestamp TIMESTAMPTZ,
    metadata JSONB,
    device_info JSONB
  );
  ```

- [ ] **Rate limiting**
  - 1000 events/min per user
  - Prevent abuse

#### 5.2: Telemetry Dashboard

- [ ] **Set up Grafana/DataDog**
  - Panels: FPS over time, inference latency percentiles, thermal events
  - Alerts: FPS <15, latency >200ms, crash rate >1%

- [ ] **Create runbook**
  - File: `docs/operations/TELEMETRY_RUNBOOK.md`
  - What to do when alerts fire
  - How to query raw data

#### 5.3: On-Device Aggregation

- [ ] **Reduce bandwidth**
  - Calculate percentiles on-device (p50, p90, p99 latency)
  - Send aggregated stats every 5 minutes
  - Send raw events only for errors/anomalies

- [ ] **Privacy compliance**
  - No raw frames sent
  - No PII in metadata
  - Consent flag checked before transmission

### Testing Gate 5

```bash
# Unit tests
npm run test src/features/videoComparison/services/telemetryService.test.ts

# Integration test
- Start session
- Generate 100 pose frames
- Verify telemetry batch sent to backend
- Check dashboard shows FPS/latency charts

# Load test
npm run test:load -- --sessions=100 --concurrent=10
# Verify backend handles load, no dropped events
```

**Exit Criteria:**
- ✅ Telemetry backend deployed and stable
- ✅ Dashboard shows real-time metrics
- ✅ Alerts configured and tested
- ✅ On-device aggregation reduces bandwidth by >80%
- ✅ Privacy: no PII, no raw frames transmitted
- ✅ Runbook documented for on-call engineer

**Estimated Effort:** 5-7 days (backend + dashboard)

---

## Gate 6: Audio Feedback & Accessibility

**Objective:** Complete multimodal feedback without sensory overload

### Current State Analysis

**File:** `src/services/audioFeedbackService.ts` (132 lines)
- ✅ Basic audio cues implemented
- ⚠️ Need TTS (text-to-speech) integration
- ⚠️ Need haptics integration
- ⚠️ Need debounce logic to prevent spam

### Tasks

#### 6.1: Text-to-Speech Integration

- [ ] **Integrate Expo Speech**
  ```typescript
  import * as Speech from 'expo-speech';

  async playGuidance(message: string) {
    await Speech.speak(message, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9
    });
  }
  ```

- [ ] **Prioritize critical messages**
  - Error detection → High priority (interrupts)
  - Encouragement → Low priority (queued)

- [ ] **Localization prep**
  - Extract all strings to i18n file
  - Support en-US, es-ES (Spanish) initially

#### 6.2: Haptics Integration

- [ ] **Integrate Expo Haptics**
  ```typescript
  import * as Haptics from 'expo-haptics';

  async triggerHaptic(type: 'warning' | 'success' | 'error') {
    if (type === 'error') {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
    }
    // ... other types
  }
  ```

- [ ] **Coordinate with audio**
  - Haptic + audio for critical errors
  - Haptic only for minor corrections
  - User preference toggle

#### 6.3: Feedback Saturation Prevention

- [ ] **Implement debounce**
  - Max 1 audio cue per 5 seconds (same error type)
  - Max 3 haptics per 10 seconds

- [ ] **Smart queueing**
  - Drop low-priority messages if queue >3
  - Always play critical safety messages

- [ ] **User testing**
  - Test with 5 users (including low-vision)
  - Measure: feedback clarity, annoyance level
  - Tune debounce windows based on feedback

### Testing Gate 6

```bash
# Unit tests
npm run test src/services/audioFeedbackService.test.ts

# Accessibility audit
npm run test:a11y -- --wcag-level=AA
# Expect: zero critical issues

# Manual testing
- Trigger same error 10 times rapidly → verify only 2-3 audio cues
- Disable audio → verify haptics still work
- Low-vision mode → verify TTS announces all critical info
```

**Exit Criteria:**
- ✅ TTS working for all guidance messages
- ✅ Haptics coordinated with audio (no overload)
- ✅ Debounce prevents feedback spam
- ✅ WCAG AA compliance (accessibility audit passes)
- ✅ User testing with 5 participants (>4/5 positive feedback)
- ✅ Localization ready (i18n strings extracted)

**Estimated Effort:** 4-5 days

---

## Gate 7: Primary Joint Focus & Smart Feedback

**Objective:** Implement therapist-configurable primary joint with 10× priority boost

### Current State Analysis

**File:** `src/features/videoComparison/services/comparisonAnalysisService.ts`
- ❌ **Hardcoded CRITICAL_JOINTS array** - no primary joint concept
- All joints analyzed equally

**File:** `src/features/videoComparison/services/smartFeedbackGenerator.ts`
- ✅ Priority-based feedback exists
- ❌ No primary joint boost mechanism

### Tasks

#### 7.1: Add Primary Joint to Schema

- [ ] **Update ExercisePrescription type**
  ```typescript
  export type PrimaryJoint = 'shoulder' | 'elbow' | 'knee' | 'hip' | 'all';

  export interface ExercisePrescription {
    exerciseType: string;
    primaryJoint: PrimaryJoint; // NEW
    youtubeUrl: string;
    sets: number;
    reps: number;
  }
  ```

- [ ] **Database migration**
  - Add `primary_joint` column to prescriptions table
  - Default to 'all' for existing records

#### 7.2: Implement 10× Priority Boost

- [ ] **Update smartFeedbackGenerator.ts**
  ```typescript
  function generateFeedback(
    errors: DetectedError[],
    primaryJoint: PrimaryJoint
  ) {
    const priorities = errors.map(error => {
      let priority = calculateBasePriority(error);

      // 10× boost for primary joint
      if (errorMatchesJoint(error, primaryJoint)) {
        priority *= 10;
      }

      return { error, priority };
    });

    // Sort and take top 3
    return priorities
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }

  function errorMatchesJoint(error: DetectedError, joint: PrimaryJoint) {
    const mapping = {
      'shoulder_hiking': ['shoulder'],
      'trunk_lean': ['shoulder'], // Compensatory
      'knee_valgus': ['knee'],
      'heel_lift': ['knee'],
      // ... complete mapping
    };
    return mapping[error.type]?.includes(joint);
  }
  ```

#### 7.3: UI for Primary Joint Selector

- [ ] **Add to prescription form**
  - Dropdown: Shoulder | Elbow | Knee | Hip | All Joints
  - Default: "All Joints"
  - Tooltip: "Focus feedback on this joint (other errors still detected)"

- [ ] **Display in exercise view**
  - Badge: "Primary Focus: Shoulder"
  - Color-coded error cards (primary joint = red, others = yellow)

### Testing Gate 7

```bash
# Unit tests
npm run test src/features/videoComparison/services/smartFeedbackGenerator.test.ts

# Integration test
- Create prescription with primaryJoint='shoulder'
- Record exercise with shoulder + knee errors
- Verify shoulder error shown first (despite lower injury risk)
- Verify compensatory errors (trunk lean) also prioritized
```

**Exit Criteria:**
- ✅ Primary joint stored in database
- ✅ 10× priority boost implemented and tested
- ✅ UI allows therapist to select primary joint
- ✅ Feedback prioritizes primary joint errors correctly
- ✅ Compensatory errors mapped to related joints
- ✅ Documentation: which errors map to which joints

**Estimated Effort:** 3-4 days

---

## Gate 8: YouTube Template Library & Prescription API

**Objective:** Complete PT-facing features for exercise assignment

### Current State Analysis

**File:** Templates UI - ❓ Status unknown
**File:** Prescription API - ❌ Not implemented

### Tasks

#### 8.1: YouTube Template UI

- [ ] **Create template management screen**
  - Input: YouTube URL
  - Validation: Check video exists, extract metadata
  - Preview: Thumbnail, title, duration
  - CRUD: Create, edit, delete templates

- [ ] **Primary joint selector** (from Gate 7)
  - Integrated into template form

- [ ] **Template library per patient**
  - List view: All templates for patient
  - Filter by joint, exercise type
  - Assign to session

#### 8.2: Prescription API

- [ ] **Create REST endpoint**
  ```typescript
  POST /api/prescriptions
  Headers: Authorization: Bearer <api_key>
  Body: {
    user_id: "uuid",
    exercise_urls: ["youtube.com/..."],
    primary_joint: "shoulder",
    sets: 3,
    reps: 10,
    frequency: "3x/week"
  }
  ```

- [ ] **API key management**
  - Generate API keys for PT clinics
  - Store hashed in database
  - Rate limit: 1000 req/day per key

- [ ] **Patient inbox**
  - New prescriptions shown in app
  - Patient can view, accept, decline
  - Telemetry: acceptance rate

#### 8.3: OpenAPI Documentation

- [ ] **Generate Swagger docs**
  - Auto-generated from TypeScript types
  - Interactive API explorer
  - Code examples (curl, Python, JS)

- [ ] **Create sample integration**
  - Mock EMR connector (Python script)
  - Shows how PT systems can integrate
  - File: `examples/emr-integration/prescription-sync.py`

### Testing Gate 8

```bash
# Unit tests
npm run test src/features/prescriptions/*.test.ts

# Integration test
- Create template via UI
- Send prescription via API
- Verify patient sees in inbox
- Accept prescription
- Verify template accessible in exercise list

# API test
npm run test:api -- --endpoint=/api/prescriptions
```

**Exit Criteria:**
- ✅ YouTube template UI working (create, edit, delete)
- ✅ Prescription API deployed and documented
- ✅ OpenAPI docs published
- ✅ Sample integration (Python script) tested
- ✅ Patient inbox shows new prescriptions
- ✅ Rate limiting works (test with 1001 requests)

**Estimated Effort:** 5-6 days

---

## Gate 9: Comprehensive Testing & Quality Gates

**Objective:** Enforce staged testing gates from `gated-testing-plan.md`

### Testing Architecture

```
┌────────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ Gate 0     │    │ Gate 1        │    │ Gate 2       │    │ Gate 3       │
│ Toolchain  │──▶│ Core Logic     │──▶│ Device & UX   │──▶│ Clinical/Edge │
│ Sanity     │    │ Verification   │    │ Integration   │    │ Assurance     │
└────────────┘    └───────────────┘    └──────────────┘    └──────────────┘
```

### Gate 9.1: Core Logic Verification (Testing Gate 1)

- [ ] **Unit test coverage ≥95%**
  - PoseDetectionService.v2.ts
  - GoniometerService
  - TelemetryService
  - CompensatoryMechanisms
  - Redux slices

- [ ] **Snapshot testing**
  - SetupWizard reducer snapshots
  - PoseDetection reducer snapshots

- [ ] **Mutation testing**
  - Install Stryker
  - Run on critical services
  - Target: >80% mutants killed

- [ ] **Performance benchmarks**
  - File: `scripts/measure-pipeline.ts`
  - Baseline: `benchmarks/core.json`
  - Fail build if ±10% regression

### Gate 9.2: Device & UX Integration (Testing Gate 2)

- [ ] **Detox E2E tests**
  - Camera permission flows
  - SetupWizard completion
  - Exercise session (start, pause, resume)
  - Audio/haptic feedback triggers

- [ ] **VisionCamera frame harness**
  - Golden-path: clear frame → pose detected <120ms
  - Fault injection: blur, low-light, occlusion
  - Graceful degradation to 480p

- [ ] **Accessibility audit**
  - react-native-accessibility-engine
  - WCAG AA compliance
  - Manual checklist for screen readers

- [ ] **Device performance profiling**
  - Test on 5 devices (2 iOS, 3 Android)
  - Log: FPS, memory, thermal state
  - Export to `artifacts/device-metrics/*.csv`

### Gate 9.3: Clinical & Edge-Case Assurance (Testing Gate 3)

- [ ] **Synthetic patient library**
  - Record 20 exercise videos
  - Variations: lighting, clothing, mobility aids
  - Annotate ground truth (PT labels errors)

- [ ] **Accuracy validation**
  - Compare app vs PT annotations
  - Measure: sensitivity, specificity
  - Target: >80% sensitivity, >70% specificity

- [ ] **Edge case scripts**
  - Network loss during session
  - Disk full (can't save video)
  - Thermal shutdown
  - Accelerometer failure
  - Verify graceful failures + user guidance

- [ ] **Security tests**
  - Telemetry payload inspection (no PII)
  - Encryption validation (keys rotate)
  - Static analysis (OWASP top 10)

### Gate 9.4: Regression Suite

- [ ] **CI pipeline integration**
  - Run on every PR
  - Block merge if tests fail
  - Automated reporting

- [ ] **Nightly device tests**
  - Full Detox suite on physical devices
  - Upload videos/screenshots to artifacts

- [ ] **Monthly clinical validation**
  - Re-run synthetic patient library
  - Check accuracy hasn't regressed
  - Append report to `docs/clinical-validation-reports/YYYY-MM.md`

### Testing Gate 9 Exit Criteria

- ✅ **Testing Gate 0:** CI green, security scan passes
- ✅ **Testing Gate 1:** ≥95% coverage, mutation score >80%, benchmarks pass
- ✅ **Testing Gate 2:** Detox passes on 5 devices, accessibility audit clean
- ✅ **Testing Gate 3:** Accuracy >80% sensitivity, all edge cases handled gracefully
- ✅ **Regression suite:** Automated, runs on every PR

**Estimated Effort:** 7-10 days (comprehensive testing infrastructure)

---

## Gate 10: Field Trial Readiness

**Objective:** Deploy to small beta group before considering pilot study

### Beta Trial Design

**Not a clinical pilot** - just field testing with real users

| Parameter | Value |
|-----------|-------|
| **Participants** | 5-10 volunteers (friends, colleagues) |
| **Duration** | 2-4 weeks |
| **Exercises** | Any (not post-surgical) |
| **Goal** | Find bugs, usability issues, performance problems |
| **IRB needed?** | No (not research, just testing) |

### Tasks

#### 10.1: Beta Build Distribution

- [ ] **Set up TestFlight/Play Console**
  - Create beta track
  - Invite 10 testers
  - Enable crash reporting (Sentry/Crashlytics)

- [ ] **Create beta tester guide**
  - How to install app
  - What to test (features checklist)
  - How to report bugs (GitHub issues template)

#### 10.2: Monitoring & Feedback

- [ ] **Telemetry dashboard**
  - Monitor beta tester sessions
  - Track: crashes, FPS, thermal events
  - Daily check-ins on data

- [ ] **Weekly feedback sessions**
  - 15-minute calls with each tester
  - Ask: What's confusing? What's broken? What's slow?
  - Document in `docs/beta-feedback/week-N.md`

#### 10.3: Iteration Based on Feedback

- [ ] **Fix critical bugs** (crashes, data loss)
  - Priority 1: Fix immediately
  - Ship updates to beta testers

- [ ] **Improve usability** (confusing UI, unclear guidance)
  - Priority 2: Fix within 1 week
  - A/B test changes with testers

- [ ] **Defer nice-to-haves**
  - Priority 3: Document for post-beta

### Exit Criteria

- ✅ 10 beta testers recruited and using app
- ✅ 2-4 weeks of real usage
- ✅ Crash rate <1% (measured via telemetry)
- ✅ All P1 bugs fixed
- ✅ All P2 usability issues addressed
- ✅ FPS ≥20 on all tester devices
- ✅ No data loss incidents
- ✅ Positive feedback from ≥8/10 testers

**Estimated Effort:** 2-4 weeks (mostly waiting for feedback)

---

## Research Integration Checkpoints

Throughout the gates, integrate research threads from the backlog:

### Device-Aware Capture Research

- **Gate 1 Checkpoint:** Document per-device capture settings
- **Gate 4 Checkpoint:** Validate thermal/memory adaptation
- **Gate 10 Checkpoint:** Collect real-world device diversity metrics

### Pipeline Efficiency Research

- **Gate 2 Checkpoint:** Benchmark model delegate matrix
- **Gate 9 Checkpoint:** Validate adaptive confidence curves
- **Gate 10 Checkpoint:** Measure real-world inference performance

### Multimodal Feedback Research

- **Gate 6 Checkpoint:** Study feedback saturation patterns
- **Gate 9 Checkpoint:** Accessibility validation with diverse users
- **Gate 10 Checkpoint:** A/B test guidance messaging variants

---

## Anti-Patterns to Avoid

### ❌ No Time Estimates

- Don't commit to "2 weeks" or "3 days"
- Work at sustainable pace
- Ship when exit criteria met, not when calendar says

### ❌ No Mock Carry-Forward

- If you add a mock/stub, immediately create ticket to remove it
- Tag with `debt:mock` label
- Review all mocks monthly

### ❌ No Test Skipping

- Don't merge PRs with skipped tests
- Fix or delete broken tests, don't skip

### ❌ No "We'll Document Later"

- Every feature ships with docs
- Code comments explain WHY, not WHAT
- Keep `docs/` in sync with code

---

## Progress Tracking

### Current Gate Status

| Gate | Status | Completion |
|------|--------|------------|
| Gate 0: Toolchain | 🟡 In Progress | ?% |
| Gate 1: Remove Camera Mocks | ⚪ Not Started | 0% |
| Gate 2: Smoothing Integration | ⚪ Not Started | 0% |
| Gate 3: Clinical Thresholds | ⚪ Not Started | 0% |
| Gate 4: Device Health | ⚪ Not Started | 0% |
| Gate 5: Telemetry | ⚪ Not Started | 0% |
| Gate 6: Audio/Accessibility | ⚪ Not Started | 0% |
| Gate 7: Primary Joint Focus | ⚪ Not Started | 0% |
| Gate 8: Templates & API | ⚪ Not Started | 0% |
| Gate 9: Testing Gates | ⚪ Not Started | 0% |
| Gate 10: Beta Field Trial | ⚪ Not Started | 0% |

### Update Regularly

File: `docs/planning/GATE_PROGRESS.md`

```markdown
# Gate Progress Tracker

## Gate 0: Toolchain
- [x] CI pipeline created
- [x] Git hooks configured
- [ ] Security scan passing (2 high vulnerabilities)

## Gate 1: Remove Camera Mocks
- [x] Real lighting analysis implemented
- [ ] Real distance check (50% done)
- [ ] Tests passing (3 failing)
```

---

## Post-Beta: Clinical Pilot Decision

**After Gate 10 succeeds**, then consider:

- Clinical pilot study (with IRB, PTs, real patients)
- But NOT before all gates complete and beta trial successful
- Pilot design in separate document: `docs/clinical/PILOT_PROTOCOL.md`

---

## Summary

**This is YOUR roadmap.** Sequential gates, no time pressure, rigorous testing, zero mocks/stubs at the end.

**Next Action:** Start Gate 0 - Set up CI pipeline and git hooks.

**Philosophy:** Slow is smooth, smooth is fast. Ship when ready, not when rushed.

---

**Questions?** Update this doc as you learn. It's a living document, not a contract.
