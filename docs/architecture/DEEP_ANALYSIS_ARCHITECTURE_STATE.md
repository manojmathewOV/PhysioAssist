# PhysioAssist Deep Architecture Analysis
## Critical Discoveries & Integration Plan

**Date:** November 8, 2025
**Status:** 🚨 **CRITICAL GAPS FOUND**
**Priority:** IMMEDIATE ATTENTION REQUIRED

---

## 🔴 **CRITICAL FINDING: Model & Config Inconsistency**

### **Discovery Summary**

We have **TWO INCOMPATIBLE SYSTEMS** running in parallel:

| System | Model | Keypoints | Config File | Status |
|--------|-------|-----------|-------------|--------|
| **OLD (Current)** | MoveNet Lightning | 17 points | `errorDetectionConfig.ts` | ✅ INTEGRATED |
| **NEW (Nov 8)** | MediaPipe Pose | 33 points | `clinicalThresholds.ts` | ❌ **NOT INTEGRATED** |

**This is a BLOCKER for Gate 7.**

---

## 📊 **ASCII: Current Architecture State**

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT WORKING SYSTEM                      │
│                    (MoveNet 17-keypoint)                        │
└─────────────────────────────────────────────────────────────────┘

                    YouTube Reference Video
                              │
                              ▼
                    ┌──────────────────┐
                    │ PoseDetection    │
                    │ Service.v2       │
                    │                  │
                    │ MoveNet Lightning│  ◄── Actual model in use
                    │ INT8 quantized   │
                    └────────┬─────────┘
                             │
                             │ PoseFrame[]
                             │ (17 keypoints)
                             ▼
        ┌────────────────────────────────────────┐
        │   comparisonAnalysisService.ts         │
        │                                        │
        │   - compareAngles()                    │
        │   - analyzeTempo()                     │
        │   - Uses CRITICAL_JOINTS array        │
        └────────┬───────────────────────────────┘
                 │
                 │ AngleDeviation[]
                 │ TemporalAlignment
                 ▼
    ┌────────────────────────────────────────────────┐
    │        ERROR DETECTION MODULES                 │
    ├────────────────────────────────────────────────┤
    │                                                │
    │  shoulderErrors.ts  ◄── Uses MoveNet indices  │
    │  - KEYPOINTS = {                              │
    │      NOSE: 0, LEFT_EYE: 1, ..., LEFT_HIP: 11  │
    │    }                                          │
    │  - detectShoulderHiking()                     │
    │  - detectTrunkLean()                          │
    │  - detectInternalRotation()                   │
    │  - detectIncompleteROM()                      │
    │                                                │
    │  kneeErrors.ts      ◄── Uses MoveNet indices  │
    │  - KEYPOINTS = {                              │
    │      LEFT_HIP: 11, LEFT_KNEE: 13, ...         │
    │    }                                          │
    │  - detectKneeValgus()     ⚠️ ACL risk         │
    │  - detectHeelLift()                           │
    │  - detectPosteriorPelvicTilt()                │
    │  - detectInsufficientDepth()                  │
    │                                                │
    │  elbowErrors.ts     ◄── Uses MoveNet indices  │
    │  - detectShoulderCompensation()               │
    │  - detectIncompleteExtension()                │
    │  - detectWristDeviation()                     │
    │                                                │
    └───────────────────┬────────────────────────────┘
                        │
                        │ ShoulderError[]
                        │ KneeError[]
                        │ ElbowError[]
                        ▼
            ┌───────────────────────────┐
            │ errorDetectionConfig.ts   │  ◄── PLACEHOLDER VALUES
            │                           │
            │ shoulder: {               │     ⚠️ NOT research-backed
            │   shoulderHiking: {       │     ⚠️ Marked "TUNE REQUIRED"
            │     warning_cm: 2.0       │
            │     critical_cm: 5.0      │
            │   }                       │
            │ }                         │
            │ knee: {                   │
            │   kneeValgus: {           │
            │     warning_percent: 5.0  │
            │     critical_percent: 10.0│
            │   }                       │
            │ }                         │
            └───────────────────────────┘
                        │
                        ▼
            ┌───────────────────────────┐
            │ smartFeedbackGenerator.ts │
            │                           │
            │ INJURY_RISK_WEIGHTS = {   │
            │   knee_valgus: 100        │
            │   shoulder_hiking: 40     │
            │   ...                     │
            │ }                         │
            │                           │
            │ prioritizeErrors()        │
            │ Max 3 errors shown        │
            └───────────────────────────┘
                        │
                        ▼
                  Patient Feedback
                  (Visual + Text)
```

---

## 🆕 **ASCII: NEW System (NOT INTEGRATED)**

```
┌─────────────────────────────────────────────────────────────────┐
│              NEW RESEARCH-BACKED SYSTEM                         │
│           (Created Nov 8, NOT INTEGRATED YET)                   │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────┐
    │ clinicalThresholds.ts            │  ◄── NEW, MediaPipe-based
    │                                  │      Research-backed
    │ ✅ Based on MediaPipe 33 points  │
    │ ✅ AAOS/IJSPT/JOSPT sources      │
    │ ✅ Patient level adaptation      │
    │ ✅ Injury risk weights           │
    │                                  │
    │ SHOULDER_THRESHOLDS = {          │
    │   abduction_shrug: {             │
    │     threshold: 0.05  // 5% humerus ◄── Research-backed!
    │     max: 0.08                    │
    │     persistence_ms: 400          │
    │     source: "AAOS OrthoInfo..."  │
    │   }                              │
    │ }                                │
    │                                  │
    │ KNEE_THRESHOLDS = {              │
    │   valgus_fppa: {                 │
    │     threshold: 8  // degrees     │  ◄── FPPA method!
    │     max: 10                      │
    │     persistence_ms: 150          │
    │     source: "IJSPT - FPPA..."    │
    │   }                              │
    │ }                                │
    └──────────────────────────────────┘
                  │
                  │ ❌ NO INTEGRATION
                  │ ❌ NOT USED BY ERROR DETECTION
                  │
                  ✗ (Dead code)


    ┌──────────────────────────────────┐
    │ smoothing.ts                     │  ◄── NEW, not integrated
    │                                  │
    │ ✅ One-Euro filter (ACM CHI 2012)│
    │ ✅ Peer-reviewed algorithm       │
    │ ✅ Clinical defaults             │
    │                                  │
    │ class OneEuroFilter {            │
    │   filter(value, timestamp)       │
    │   // Adaptive smoothing based    │
    │   // on movement speed           │
    │ }                                │
    │                                  │
    │ class PoseLandmarkFilter {       │
    │   // For all 33 MediaPipe points │
    │   filterPose(landmarks, ts)      │
    │ }                                │
    └──────────────────────────────────┘
                  │
                  │ ❌ NO INTEGRATION
                  │ ❌ NOT USED IN POSE PIPELINE
                  │
                  ✗ (Dead code)
```

---

## 🔍 **Model Comparison: MoveNet vs MediaPipe**

### **MoveNet Lightning (Currently Used)**

```
Keypoints: 17 total
┌──────────────────────────────┐
│  0: nose                     │
│  1: left_eye                 │
│  2: right_eye                │
│  3: left_ear                 │
│  4: right_ear                │
│  5: left_shoulder            │
│  6: right_shoulder           │
│  7: left_elbow               │
│  8: right_elbow              │
│  9: left_wrist               │
│ 10: right_wrist              │
│ 11: left_hip                 │
│ 12: right_hip                │
│ 13: left_knee                │
│ 14: right_knee               │
│ 15: left_ankle               │
│ 16: right_ankle              │
└──────────────────────────────┘

✅ Pros:
- Fast (30+ FPS on mobile)
- Lightweight (INT8 quantized)
- Already integrated
- Good for basic exercises

❌ Cons:
- Missing landmarks (no toes, no mid-torso)
- Can't detect scapular winging (no scapula points)
- Limited for complex shoulder analysis
- 2024 research uses MediaPipe for PT apps
```

### **MediaPipe Pose (New Config Assumes This)**

```
Keypoints: 33 total
┌──────────────────────────────┐
│  0-10: Face/head (same)      │
│ 11-12: Shoulders             │
│ 13-14: Elbows                │
│ 15-16: Wrists                │
│ 17-22: Hand landmarks        │
│ 23-24: Hips                  │
│ 25-26: Knees                 │
│ 27-28: Ankles                │
│ 29-32: Feet (heels, toes)    │
└──────────────────────────────┘

✅ Pros:
- More detailed (33 vs 17 points)
- Validated in 2024-2025 research
- Foot landmarks (heel lift detection)
- Better for clinical analysis
- BlazePose architecture (proven)

❌ Cons:
- Slightly slower (20-25 FPS)
- Larger model size
- Need to rewrite all detection code
```

---

## 🚨 **Critical Integration Gaps**

### **Gap 1: Model Mismatch**

**Problem:**
```typescript
// clinicalThresholds.ts (NEW)
// Assumes 33 MediaPipe landmarks
export class PoseLandmarkFilter {
  // Pre-create filters for all 33 MediaPipe landmarks
  for (let i = 0; i < 33; i++) {
    this.filters.set(i, new OneEuroFilter3D(...));
  }
}

// shoulderErrors.ts (CURRENT)
// Uses only 17 MoveNet landmarks
const KEYPOINTS = {
  NOSE: 0,
  ...
  LEFT_HIP: 11,
  RIGHT_HIP: 12
  // ❌ No landmarks 13-32!
};
```

**Impact:** **BLOCKER** - Can't use new config with current code

---

### **Gap 2: Threshold Incompatibility**

**Problem:**
```typescript
// errorDetectionConfig.ts (OLD - USED)
shoulder: {
  shoulderHiking: {
    warning_cm: 2.0,     // Simple cm measurement
    critical_cm: 5.0
  }
}

// clinicalThresholds.ts (NEW - NOT USED)
SHOULDER_THRESHOLDS = {
  abduction_shrug: {
    threshold: 0.05,     // 5% of humerus length (normalized!)
    max: 0.08,
    persistence_ms: 400, // ❌ NEW: temporal filtering
    source: "AAOS..."    // ❌ NEW: research citation
  }
}
```

**Different concepts:**
- OLD: Absolute cm (2-5cm)
- NEW: Normalized percentage (5-8% of humerus)
- NEW: Adds persistence requirement (400ms)

**Impact:** **BLOCKER** - Detection algorithms need rewrite

---

### **Gap 3: No Smoothing Integration**

**Problem:**
```typescript
// Current pose detection pipeline
PoseDetectionService.v2.ts
  ↓ detectPose(frame)
  ↓ rawPoseFrame (with jitter)
  ↓ NO SMOOTHING ❌
  ↓ directly to error detection

// Needed integration point
PoseDetectionService.v2.ts
  ↓ detectPose(frame)
  ↓ rawPoseFrame
  ↓ OneEuroFilter.filter(pose, timestamp) ✅
  ↓ smoothedPoseFrame
  ↓ to error detection
```

**Impact:** HIGH - Jittery detection, false positives

---

### **Gap 4: No Primary Joint Focus**

**Current code:**
```typescript
// comparisonAnalysisService.ts
private static readonly CRITICAL_JOINTS = [
  'leftElbow', 'rightElbow',
  'leftShoulder', 'rightShoulder',
  'leftKnee', 'rightKnee',
  'leftHip', 'rightHip',
];

// ❌ No way to specify primary joint
// ❌ All joints always analyzed
```

**Impact:** MEDIUM - Can't focus on therapist-selected joint

---

## 🎯 **Decision Matrix: Model Selection**

| Criteria | MoveNet Lightning | MediaPipe Pose | Winner |
|----------|-------------------|----------------|--------|
| **Speed** | 30+ FPS | 20-25 FPS | MoveNet |
| **Accuracy** | Good | Better (2024 research) | MediaPipe |
| **Keypoints** | 17 | 33 | MediaPipe |
| **Clinical validation** | 2023 | 2024-2025 | MediaPipe |
| **Integration effort** | ✅ Done | ❌ Need rewrite | MoveNet |
| **Research backing** | ⚠️ Limited | ✅ Strong | MediaPipe |
| **Foot landmarks** | ❌ No | ✅ Yes | MediaPipe |
| **Model size** | Small (INT8) | Medium | MoveNet |

### **Recommendation: HYBRID APPROACH**

```
┌──────────────────────────────────────────────────────────┐
│              RECOMMENDED ARCHITECTURE                    │
│                                                          │
│  Phase 1 (Gate 7-11): Keep MoveNet                      │
│  - Fix what we have                                     │
│  - Integrate smoothing with 17-point model              │
│  - Map clinicalThresholds to MoveNet indices            │
│  - Complete pilot study                                 │
│                                                          │
│  Phase 2 (Post-Gate 12): Migrate to MediaPipe           │
│  - Rewrite error detection for 33 points               │
│  - Use research-backed thresholds natively             │
│  - Better clinical accuracy                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Rationale:**
1. ✅ Don't break working code before pilot
2. ✅ Validate approach with MoveNet first
3. ✅ Migrate after proving concept
4. ✅ Reduces risk of Gate 7-11 delays

---

## 📋 **Integration Plan: MoveNet + Research Thresholds**

### **Step 1: Map Clinical Thresholds to MoveNet**

Create adapter layer:

```typescript
// File: src/features/videoComparison/config/clinicalThresholdsAdapter.ts

/**
 * Adapts research-backed MediaPipe thresholds to MoveNet 17-point model
 *
 * Limitations:
 * - No scapular landmarks (can't detect winging directly)
 * - No foot landmarks (approximate heel lift using ankle)
 * - No hand landmarks (can't detect grip issues)
 */

import { CLINICAL_THRESHOLDS } from './clinicalThresholds';

export const MOVENET_CLINICAL_THRESHOLDS = {
  shoulder: {
    // Map abduction_shrug to shoulder hiking
    shoulderHiking: {
      // Convert 5-8% humerus length to cm
      // Avg humerus: 33cm, so 5% = 1.65cm, 8% = 2.64cm
      warning_cm: 1.7,  // ~5% humerus (from AAOS research)
      critical_cm: 2.6, // ~8% humerus
      persistence_ms: CLINICAL_THRESHOLDS.shoulder.abduction_shrug.persistence_ms, // 400ms
      source: CLINICAL_THRESHOLDS.shoulder.abduction_shrug.source
    },

    trunkLean: {
      warning_deg: 8,   // From AAOS research
      critical_deg: 10,
      persistence_ms: 400,
      source: CLINICAL_THRESHOLDS.shoulder.abduction_shrug.source
    },

    // ... map other thresholds
  },

  knee: {
    kneeValgus: {
      // ⚠️ CRITICAL: MoveNet doesn't have FPPA directly
      // Need to approximate with knee-ankle offset percentage
      warning_percent: 5.0,  // Keep current (Hewett et al.)
      critical_percent: 10.0,
      persistence_ms: CLINICAL_THRESHOLDS.knee.valgus_fppa.persistence_ms, // 150ms
      source: CLINICAL_THRESHOLDS.knee.valgus_fppa.source
    }
  }
};
```

---

### **Step 2: Integrate One-Euro Filter**

**File:** `src/services/PoseDetectionService.v2.ts`

```typescript
import { OneEuroFilter, PoseLandmarkFilter } from '@/utils/smoothing';

export class PoseDetectionServiceV2 {
  private poseFilter: PoseLandmarkFilter;

  constructor() {
    // Initialize filter with clinical defaults
    this.poseFilter = new PoseLandmarkFilter(
      1.0,   // minCutoff (from research)
      0.007, // beta
      1.0,   // dCutoff
      0.5    // minVisibility
    );
  }

  async detectPose(imageData: ImageData): Promise<PoseFrame> {
    // 1. Run MoveNet detection
    const rawPose = await this.detector.estimatePoses(imageData);

    // 2. Convert to our PoseFrame format
    const rawFrame = this.convertToPoseFrame(rawPose);

    // 3. ✅ NEW: Apply smoothing filter
    const timestamp = performance.now() / 1000; // seconds
    const smoothedLandmarks = this.poseFilter.filterPose(
      rawFrame.landmarks,
      timestamp
    );

    // 4. Return smoothed frame
    return {
      ...rawFrame,
      landmarks: smoothedLandmarks
    };
  }
}
```

---

### **Step 3: Add Persistence Filtering**

**File:** `src/features/videoComparison/errorDetection/persistenceFilter.ts` (NEW)

```typescript
/**
 * Temporal Persistence Filter
 *
 * Prevents false positives by requiring errors to persist for minimum duration.
 * Based on clinical thresholds (150-500ms depending on error type).
 */

export interface PersistentError {
  errorType: string;
  firstDetected: number;   // timestamp
  lastDetected: number;    // timestamp
  frameCount: number;
  severity: 'warning' | 'critical';
}

export class PersistenceFilter {
  private activeErrors: Map<string, PersistentError> = new Map();

  /**
   * Check if error has persisted long enough to be real
   */
  filterError(
    errorType: string,
    detected: boolean,
    currentTime: number,
    requiredPersistence_ms: number
  ): boolean {
    const key = errorType;

    if (detected) {
      // Error currently detected
      if (this.activeErrors.has(key)) {
        // Update existing
        const error = this.activeErrors.get(key)!;
        error.lastDetected = currentTime;
        error.frameCount++;

        // Check if persisted long enough
        const duration = error.lastDetected - error.firstDetected;
        return duration >= requiredPersistence_ms;
      } else {
        // New error, start tracking
        this.activeErrors.set(key, {
          errorType,
          firstDetected: currentTime,
          lastDetected: currentTime,
          frameCount: 1,
          severity: 'warning'
        });
        return false; // Not persisted yet
      }
    } else {
      // Error not detected, clear tracking
      this.activeErrors.delete(key);
      return false;
    }
  }

  clear() {
    this.activeErrors.clear();
  }
}
```

---

### **Step 4: Add Primary Joint Focus**

**Architecture Decision: OPTION B (Prioritization)**

Based on clinical input, we'll detect all errors but boost primary joint priority 10×.

**File:** `src/features/videoComparison/types/videoComparison.types.ts`

```typescript
export type PrimaryJoint = 'shoulder' | 'elbow' | 'knee' | 'hip' | 'all';

export interface ExercisePrescription {
  exerciseType: string;
  primaryJoint: PrimaryJoint;  // ← NEW
  youtubeUrl: string;
  sets: number;
  reps: number;
}
```

**File:** `src/features/videoComparison/services/smartFeedbackGenerator.ts`

```typescript
// Update signature
export function generateFeedback(
  errors: DetectedError[],
  patientLevel: PatientLevel,
  exerciseContext: ExerciseContext,
  primaryJoint: PrimaryJoint = 'all'  // ← NEW parameter
): FeedbackOutput {

  // Calculate priority with primary joint boost
  const priorities = errors.map(error => {
    let basePriority = calculatePriority(error, frequency);

    // 10× boost if error matches primary joint
    if (primaryJoint !== 'all' && errorMatchesJoint(error, primaryJoint)) {
      basePriority *= 10;
    }

    return { error, priority: basePriority };
  });

  // Sort and take top 3
  const topErrors = priorities
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  // ... rest of function
}

function errorMatchesJoint(error: DetectedError, joint: PrimaryJoint): boolean {
  const errorJointMap: Record<string, PrimaryJoint[]> = {
    'shoulder_hiking': ['shoulder'],
    'trunk_lean': ['shoulder'], // Compensatory for shoulder
    'internal_rotation': ['shoulder'],
    'incomplete_rom': ['shoulder'],
    'knee_valgus': ['knee'],
    'heel_lift': ['knee'], // Related to knee mechanics
    'posterior_pelvic_tilt': ['knee'], // Compensatory for knee
    'insufficient_depth': ['knee'],
    'shoulder_compensation': ['elbow'],
    'incomplete_extension': ['elbow'],
    'wrist_deviation': ['elbow'],
  };

  const relevantJoints = errorJointMap[error.type] || [];
  return relevantJoints.includes(joint);
}
```

---

## 📈 **Revised Gate 7 Implementation Plan**

### **Gate 7a: Integrate Smoothing (Days 1-2)**

- [x] One-Euro filter created ✅
- [ ] Add filter to PoseDetectionService.v2.ts
- [ ] Test with 10 videos, measure jitter reduction
- [ ] Verify <50ms latency
- [ ] Document filter parameters

### **Gate 7b: Map Clinical Thresholds (Day 3)**

- [ ] Create clinicalThresholdsAdapter.ts
- [ ] Map research thresholds to MoveNet indices
- [ ] Convert percentage-based to absolute values
- [ ] Preserve research citations

### **Gate 7c: Add Persistence Filtering (Day 4)**

- [ ] Create PersistenceFilter class
- [ ] Integrate into error detection modules
- [ ] Use research-backed persistence times (150-500ms)
- [ ] Test with jittery movements

### **Gate 7d: Fix Lighting Analysis (Day 4)**

- [ ] Implement real brightness (ITU-R BT.601)
- [ ] Implement real contrast (stddev/255)
- [ ] Implement shadow detection
- [ ] Test in 5 lighting conditions

### **Exit Criteria:**
- [ ] Smoothing reduces jitter by >50%
- [ ] Latency <50ms end-to-end
- [ ] Lighting detection works across conditions
- [ ] Persistence prevents false positives
- [ ] All tests pass

---

## 🔄 **Migration Path to MediaPipe (Post-Gate 12)**

### **Phase 1: Parallel Implementation (Weeks 1-2)**

- [ ] Keep MoveNet as primary
- [ ] Add MediaPipe as optional backend
- [ ] Rewrite error detection for 33 points
- [ ] Run both in parallel during pilot

### **Phase 2: Clinical Validation (Weeks 3-4)**

- [ ] Compare accuracy: MoveNet vs MediaPipe
- [ ] Measure which detects errors better
- [ ] Get PT feedback on both
- [ ] Decide which to keep

### **Phase 3: Migration (Weeks 5-6)**

- [ ] Switch to better-performing model
- [ ] Remove old code
- [ ] Update all documentation

---

## ✅ **Updated Roadmap Summary**

```
┌────────────────────────────────────────────────────────────┐
│ REALISTIC IMPLEMENTATION PATH                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Gate 7 (Week 1):                                          │
│   ✅ Integrate smoothing (MoveNet-compatible)             │
│   ✅ Map clinical thresholds to MoveNet                   │
│   ✅ Add persistence filtering                            │
│   ✅ Fix lighting analysis                                │
│                                                            │
│ Gates 8-11 (Weeks 2-3):                                   │
│   - Authentication                                        │
│   - YouTube template UI                                   │
│   - Prescription API                                      │
│   - Testing suite                                         │
│                                                            │
│ Gate 12 (Weeks 4-9):                                      │
│   - Pilot study with MoveNet                              │
│   - Validate thresholds                                   │
│   - Collect accuracy data                                 │
│                                                            │
│ Post-Pilot Decision:                                      │
│   ⚠️ IF accuracy <80%: Consider MediaPipe migration      │
│   ✅ IF accuracy ≥80%: Continue with MoveNet             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Next Actions (Priority Order)**

1. **IMMEDIATE:** Review this analysis with team
2. **Day 1:** Integrate One-Euro filter into PoseDetectionService.v2
3. **Day 2:** Create clinicalThresholdsAdapter for MoveNet
4. **Day 3:** Add PersistenceFilter to error detection
5. **Day 4:** Fix lighting analysis stubs
6. **Week 2:** Complete Gates 8-11
7. **Week 4:** Start pilot study

---

## 📚 **Key Takeaways**

### ✅ **What We Have (Working)**
- MoveNet pose detection (30 FPS)
- Error detection algorithms (all major patterns)
- Smart feedback prioritization
- Frame-by-frame analysis

### ⚠️ **What Needs Integration (High Priority)**
- One-Euro smoothing filter
- Research-backed clinical thresholds
- Persistence filtering (temporal)
- Real lighting analysis

### 🔮 **What's Deferred (Post-Pilot)**
- MediaPipe migration
- 33-point pose analysis
- Advanced scapular detection
- Multi-view fusion

---

**Status:** Analysis complete. Ready for team review and Gate 7 kickoff.

**Last Updated:** November 8, 2025
