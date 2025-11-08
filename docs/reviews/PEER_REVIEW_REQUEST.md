# PhysioAssist Technical Peer Review Request
**Date:** November 8, 2025
**Review Type:** Technical Architecture & Clinical Error Detection
**Reviewer:** [Colleague Name]
**Estimated Review Time:** 2-3 hours

---

## 📍 What We're Building

**PhysioAssist** is a telehealth physiotherapy application that:
1. Uses **YouTube videos as reference templates** (PT-prescribed exercises)
2. Captures **patient performing exercise via webcam** using MediaPipe Pose
3. **Compares patient form to reference video** using temporal alignment + biomechanical analysis
4. Provides **real-time corrective feedback** on form errors

**Key Innovation:** Focus on **primary joint assessment** - e.g., if exercise targets shoulder, user toggles "shoulder" as primary joint. Elbow/knee may be visible in frame but shoulder errors are prioritized.

---

## 🎯 Review Objectives

We need your expert opinion on:

### 1. **Error Detection Accuracy & Clinical Validity**
   - Are our biomechanical algorithms clinically sound?
   - Are threshold values appropriate for post-surgical patients?
   - What are we missing in our error detection logic?

### 2. **Primary Joint Focus Architecture**
   - Best way to implement joint-specific error prioritization?
   - Should we filter out non-primary joint errors entirely or just deprioritize?

### 3. **Latest Technology & Advancements**
   - Are there newer pose estimation models we should consider? (MediaPipe Pose 2.0? OpenPose alternatives?)
   - Better temporal alignment algorithms? (DTW alternatives, ML-based?)
   - State-of-the-art in exercise form assessment (2024-2025 research)?

### 4. **Technical Architecture**
   - Is our current separation of concerns clean?
   - Performance bottlenecks?
   - Scalability concerns?

---

## 📚 Required Reading: Current Codebase

### **Core Architecture Files**

#### 1. **Product Roadmap**
**Location:** `docs/planning/EVIDENCE_BASED_ROADMAP_2025.md`

**What to Review:**
- Phase 1-5 gated implementation plan (4-6 months)
- Gate 12 clinical validation study design (critical!)
- Research-backed adherence optimization strategy

**Questions:**
- Is the validation approach rigorous enough?
- Are we measuring the right metrics (accuracy, usability, adherence, safety)?
- Missing any critical gates?

---

#### 2. **Clinical Thresholds Configuration**
**Location:** `src/features/videoComparison/config/clinicalThresholds.ts`

**What to Review:**
- Research-backed thresholds for shoulder/knee/elbow errors
- Patient-level adaptations (beginner/intermediate/advanced)
- Injury risk weights
- Clinical source citations

**Key Code Sections:**
```typescript
// Lines 58-98: Shoulder thresholds (AAOS OrthoInfo sources)
export const SHOULDER_THRESHOLDS: ExerciseThresholds = {
  abduction_shrug: {
    threshold: 0.05, // 5% of humerus length acromion rise
    max: 0.08, // 8% critical
    persistence_ms: 400,
    source: 'AAOS OrthoInfo - Shoulder Surgery Exercise Guide (2023)',
  },
  // ... more thresholds
};

// Lines 104-152: Knee thresholds (FPPA from IJSPT/JOSPT)
const KNEE_THRESHOLDS: ExerciseThresholds = {
  valgus_fppa: {
    threshold: 8, // degrees (conservative)
    max: 10, // degrees (upper bound)
    persistence_ms: 150, // 5-6 frames at 30fps
    source: 'IJSPT - Frontal Plane Projection Angle (FPPA) as 2D valgus proxy',
  },
  // ... more thresholds
};

// Lines 286-313: Injury risk weights (prioritization)
export const INJURY_RISK_WEIGHTS: Record<string, number> = {
  knee_valgus: 100, // ACL tear risk (IJSPT - established injury mechanism)
  shoulder_impingement: 90, // Rotator cuff damage (JOSPT)
  lumbar_hyperextension: 85, // Disc herniation risk (AAOS)
  // ... more weights
};
```

**Critical Questions:**
- ✅ **Are these thresholds clinically appropriate?** (e.g., is 8-10° FPPA for knee valgus correct?)
- ⚠️ **Should thresholds vary by surgery type?** (e.g., ACL vs. TKA vs. meniscus repair?)
- ⚠️ **Are persistence times (150-500ms) appropriate?** Too short = false positives, too long = miss errors
- ⚠️ **Injury risk weights - do you agree with prioritization?** (knee_valgus=100 highest)

---

#### 3. **One-Euro Smoothing Filter**
**Location:** `src/utils/smoothing.ts`

**What to Review:**
- Implementation of One-Euro filter (ACM CHI 2012 algorithm)
- PoseLandmarkFilter for all 33 MediaPipe landmarks
- AngleFilter with wrapping handling

**Key Code Sections:**
```typescript
// Lines 69-150: One-Euro filter core implementation
export class OneEuroFilter {
  constructor(
    private minCutoff: number = 1.0,  // Lower = more smoothing
    private beta: number = 0.007,      // Higher = more responsive to velocity
    private dCutoff: number = 1.0
  ) {}

  filter(value: number, timestamp: number): number {
    // Speed-based adaptive smoothing
    // Fast movements → less smoothing (responsive)
    // Slow movements → more smoothing (reduces jitter)
  }
}

// Lines 246-328: Pose landmark filter for all 33 MediaPipe points
export class PoseLandmarkFilter {
  filterPose(landmarks: Array<{x, y, z, visibility}>, timestamp: number) {
    // Filters each landmark independently
    // Skips landmarks with visibility < minVisibility (0.5)
  }
}
```

**Critical Questions:**
- ✅ **Are default parameters appropriate?** (minCutoff=1.0, beta=0.007)
- ⚠️ **Should we use different smoothing for different joint types?** (e.g., more smoothing for tremor-prone wrists?)
- ⚠️ **Latency concerns?** Target is <50ms end-to-end
- ⚠️ **Better alternatives to One-Euro?** Kalman filter? Particle filter? ML-based denoising?

---

#### 4. **Error Detection Algorithms**
**Location:** `src/features/videoComparison/errorDetection/`

**Files to Review:**
- `shoulderErrors.ts` - Shoulder hiking, trunk lean, internal rotation, incomplete ROM
- `kneeErrors.ts` - Knee valgus (FPPA), heel lift, pelvic tilt, insufficient depth
- `elbowErrors.ts` - Shoulder compensation, incomplete extension, wrist deviation

**Example: Knee Valgus Detection (FPPA Method)**
```typescript
// kneeErrors.ts - Frontal Plane Projection Angle
export function detectKneeValgus(
  userPose: PoseFrame,
  referencePose: PoseFrame,
  side: 'left' | 'right'
): KneeError | null {
  // 1. Calculate FPPA (angle between hip→knee and ankle→knee vectors)
  const hipToKnee = calculateVector(hip, knee);
  const ankleToKnee = calculateVector(ankle, knee);
  const fppa = calculateAngleBetweenVectors(hipToKnee, ankleToKnee);

  // 2. Compare to reference
  const deviation = fppa - referenceFppa;

  // 3. Check threshold (8-10° from clinical literature)
  if (deviation >= KNEE_THRESHOLDS.valgus_fppa.threshold) {
    return {
      type: 'knee_valgus',
      severity: deviation >= 10 ? 'critical' : 'warning',
      value: deviation,
      timestamp: userPose.timestamp,
    };
  }
}
```

**Critical Questions:**
- ✅ **Is FPPA calculation correct?** (2D proxy for 3D valgus angle)
- ⚠️ **Should we use absolute FPPA or compare to reference video?** (Current: compare to reference)
- ⚠️ **What about camera angle effects?** User's camera might not be at same angle as YouTube video
- ⚠️ **Missing error types?** What compensatory patterns are we not detecting?
- ⚠️ **Bilateral vs. unilateral exercises?** How to handle single-leg exercises?

---

#### 5. **Comparison Analysis Service (Temporal Alignment)**
**Location:** `src/features/videoComparison/services/comparisonAnalysisService.ts`

**What to Review:**
- How we align user video to reference video temporally
- Angle comparison across aligned frames
- Speed ratio calculation

**Key Code Sections:**
```typescript
// Lines 35-69: Main analysis pipeline
static analyzeMovement(
  referencePoses: PoseFrame[],
  userPoses: PoseFrame[],
  exerciseType: string
): ComparisonResult {
  const angleDeviations = this.compareAngles(referencePoses, userPoses);
  const temporalAlignment = this.analyzeTempo(referencePoses, userPoses);
  const overallScore = this.calculateOverallScore(angleDeviations, temporalAlignment);
  const recommendations = this.generateRecommendations(angleDeviations, temporalAlignment, exerciseType);
}

// Lines 132-150: Speed ratio calculation
private static analyzeTempo(reference: PoseFrame[], user: PoseFrame[]): TemporalAlignment {
  const refDuration = reference[reference.length - 1].timestamp - reference[0].timestamp;
  const userDuration = user[user.length - 1].timestamp - user[0].timestamp;

  // speedRatio = refDuration / userDuration
  // speedRatio > 1 means user is FASTER
  // speedRatio < 1 means user is SLOWER
  const speedRatio = userDuration > 0 ? refDuration / userDuration : 1;
}

// Lines 71-112: Angle comparison
private static compareAngles(reference: PoseFrame[], user: PoseFrame[]): AngleDeviation[] {
  // Compares all CRITICAL_JOINTS: leftElbow, rightElbow, leftShoulder, rightShoulder, leftKnee, rightKnee, leftHip, rightHip
  // Calculates average angle, min/max (ROM), deviation from reference
}
```

**Critical Questions:**
- ⚠️ **Temporal alignment method:** Currently using simple duration ratio. Should we use Dynamic Time Warping (DTW)?
- ⚠️ **Phase detection:** How to identify concentric vs. eccentric phases? (e.g., squat down vs. squat up)
- ⚠️ **Frame-by-frame vs. aggregate comparison:** Should we align frame-by-frame or compare aggregate statistics?
- ⚠️ **What if reference video has multiple reps?** How to segment and match user's reps?

---

#### 6. **Smart Feedback Generator (Prioritization)**
**Location:** `src/features/videoComparison/services/smartFeedbackGenerator.ts`

**What to Review:**
- Error prioritization logic (injury risk × severity × frequency)
- Patient-level adaptation (beginner/intermediate/advanced)
- Feedback message generation

**Key Code Sections:**
```typescript
// Lines 44-61: Injury risk weights
const INJURY_RISK_WEIGHTS: Record<string, number> = {
  knee_valgus: 100, // CRITICAL - ACL injury risk
  posterior_pelvic_tilt: 50,
  shoulder_hiking: 40,
  // ...
};

// Lines 76-82: Priority calculation
function calculatePriority(error: DetectedError, frequency: number): number {
  const injuryRisk = INJURY_RISK_WEIGHTS[error.type] || 0;
  const severity = SEVERITY_WEIGHTS[error.severity]; // critical=50, warning=25
  const frequencyScore = Math.min(frequency, 10) * 2.5;

  return injuryRisk + severity + frequencyScore;
}

// Max 3 errors shown to avoid overwhelming patient
```

**Critical Questions:**
- ⚠️ **Max 3 errors shown - is this appropriate?** Or should it adapt to patient level?
- ⚠️ **Prioritization formula - does it make clinical sense?**
- ⚠️ **Should we show positive feedback if form is good?** (Current: yes, with positive reinforcement messages)
- ⚠️ **Frequency weighting - is counting occurrences the right approach?** What about error persistence over time?

---

## 🎯 **PRIMARY JOINT FOCUS FEATURE** (Needs Design Input!)

### **User Requirement:**
User will **toggle on the primary joint** to assess (e.g., shoulder, knee, elbow).

**Example:**
- Exercise: Shoulder external rotation
- **Primary joint:** Shoulder (toggled ON)
- **Secondary joints visible:** Elbow, wrist (visible in frame but not primary focus)

**Expected behavior:**
- Shoulder errors prioritized and shown first
- Elbow/wrist errors deprioritized or hidden entirely
- Feedback focuses on shoulder form

### **Current Architecture Issues:**

**Problem 1:** `comparisonAnalysisService.ts` compares **ALL** critical joints:
```typescript
// Lines 24-33
private static readonly CRITICAL_JOINTS = [
  'leftElbow', 'rightElbow',
  'leftShoulder', 'rightShoulder',
  'leftKnee', 'rightKnee',
  'leftHip', 'rightHip',
];
```

**Problem 2:** No mechanism to specify "primary joint" in API
```typescript
// Current API signature
analyzeMovement(
  referencePoses: PoseFrame[],
  userPoses: PoseFrame[],
  exerciseType: string  // ← Just a string, no joint specification
): ComparisonResult
```

### **Proposed Solution (Need Your Input!):**

#### **Option A: Filter at Error Detection Level**
```typescript
analyzeMovement(
  referencePoses: PoseFrame[],
  userPoses: PoseFrame[],
  exerciseType: string,
  primaryJoint: 'shoulder' | 'elbow' | 'knee' | 'hip' | 'all'  // ← NEW PARAMETER
): ComparisonResult {
  // Only run error detection for primary joint
  if (primaryJoint === 'shoulder') {
    // Only call shoulderErrors.ts detectors
    // Skip kneeErrors.ts, elbowErrors.ts
  }
}
```

**Pros:** Clean separation, no wasted computation
**Cons:** Misses compensatory patterns in secondary joints (e.g., elbow flaring during shoulder exercise)

#### **Option B: Filter at Prioritization Level**
```typescript
// In smartFeedbackGenerator.ts
function prioritizeErrors(
  errors: DetectedError[],
  primaryJoint: 'shoulder' | 'elbow' | 'knee' | 'hip' | 'all'
): PrioritizedError[] {
  // Multiply priority by 10× if error matches primary joint
  // Keep secondary joint errors but deprioritize heavily

  if (primaryJoint === 'shoulder' && error.type.includes('shoulder')) {
    priority *= 10; // 10× boost
  }
}
```

**Pros:** Still detects compensatory patterns, just deprioritizes
**Cons:** Still runs all detectors (performance cost)

#### **Option C: Hybrid Approach**
```typescript
// 1. Run error detection for ALL joints (catch compensatory patterns)
// 2. Tag errors with relevance score:
//    - Primary joint errors: relevance = 1.0
//    - Direct compensatory (e.g., trunk lean during shoulder): relevance = 0.7
//    - Unrelated errors (e.g., knee valgus during shoulder): relevance = 0.1
// 3. Apply relevance weighting in prioritization
```

**Pros:** Best of both worlds
**Cons:** More complex, need to define "compensatory relationship" matrix

### **Questions for You:**
1. Which option do you recommend?
2. Should we **completely hide** secondary joint errors or show them at the bottom?
3. How to define "compensatory relationship"? (e.g., trunk lean IS relevant to shoulder exercise)
4. What about exercises that target multiple joints? (e.g., overhead squat = shoulder + knee + hip)

---

## 🔬 **LATEST TECHNOLOGY & ADVANCEMENTS**

### **Question 1: Pose Estimation Models**

**Current:** MediaPipe Pose (BlazePose architecture, 2020)
- 33 landmarks, 30 FPS on mobile
- Validated in 2024-2025 research (RMSE 0.28, 95-99% gait accuracy)

**Alternatives to Consider?**
- **MediaPipe Pose v2 (2024)?** Any improvements?
- **OpenPose (CMU)?** More accurate but slower
- **AlphaPose?** Better occlusion handling
- **YOLOv8-Pose (2023)?** Ultralytics release, faster inference
- **ViTPose (2022)?** Vision Transformer-based, SOTA accuracy
- **MMPose (2024)?** OpenMMLab framework, modular

**Your Input:**
- Is MediaPipe still the best choice for real-time web/mobile?
- Worth migrating to newer model or stick with validated one?
- Trade-offs: accuracy vs. speed vs. ease of deployment?

---

### **Question 2: Temporal Alignment Algorithms**

**Current:** Simple duration ratio + phase alignment
```typescript
speedRatio = refDuration / userDuration;
```

**Known Limitations:**
- Doesn't handle variable rep speeds within exercise
- No automatic rep segmentation
- Assumes synchronized start/end times

**Alternatives to Consider?**
- **Dynamic Time Warping (DTW):** Classic algorithm for time-series alignment
- **Soft-DTW (2017):** Differentiable version, can train end-to-end
- **Temporal Convolutional Networks (TCN):** ML-based temporal alignment
- **Action Segmentation models:** Automatically detect rep boundaries (MS-TCN, ASFormer)
- **Cross-Modal Retrieval:** Match user video to reference video using learned embeddings

**Your Input:**
- Is DTW overkill or essential for accurate comparison?
- Should we invest in ML-based alignment? (requires training data)
- How to handle multi-rep videos? (e.g., YouTube video shows 10 reps, user does 5)

---

### **Question 3: Exercise Form Assessment (2024-2025 SOTA)**

**Recent Research:**
1. **YOLO Pose for Physiotherapy (May 2025)** - MDPI Sensors study
2. **AI-Based Posture Correction (2025)** - Random Forest LSTM, 99% accuracy
3. **Monocular Pose Estimation Assessment (Jan 2025)** - Nature Scientific Reports
4. **Physio2.2M Dataset (Jan 2025)** - 2.2M frames of physical exercise with ground truth

**Your Input:**
- Should we benchmark against these newer approaches?
- Any datasets we should validate against? (Physio2.2M?)
- Worth implementing ensemble methods? (combine multiple pose models)
- Graph Neural Networks for pose? (MotionBERT, MixSTE)

---

### **Question 4: Real-Time Feedback Modalities**

**Current:** Visual overlay + text feedback

**Alternatives/Additions?**
- **Audio feedback:** "Push knee outward" during exercise (hands-free)
- **Haptic feedback:** Vibration patterns (requires wearables)
- **Augmented Reality:** AR glasses with form correction arrows
- **Generative AI coaching:** GPT-4V vision model analyzes video, generates natural language feedback

**Your Input:**
- Which modalities most effective for adherence?
- Audio vs. visual - what does research say?
- Worth exploring multimodal feedback?

---

## 📝 **SPECIFIC REVIEW TASKS**

### **Task 1: Clinical Validation (30 mins)**
- [ ] Review `clinicalThresholds.ts` - are thresholds appropriate?
- [ ] Review `INJURY_RISK_WEIGHTS` - do you agree with prioritization?
- [ ] Identify any missing error types we should detect
- [ ] Flag any safety concerns (could app cause harm?)

### **Task 2: Algorithm Review (45 mins)**
- [ ] Review knee valgus FPPA calculation - mathematically correct?
- [ ] Review shoulder hiking detection - using right landmarks?
- [ ] Review temporal alignment approach - adequate or need DTW?
- [ ] Review One-Euro filter parameters - appropriate for physiotherapy use?

### **Task 3: Architecture Review (30 mins)**
- [ ] Review separation of concerns (detection → prioritization → feedback)
- [ ] Identify performance bottlenecks (pose estimation, alignment, smoothing)
- [ ] Suggest architectural improvements

### **Task 4: Primary Joint Focus Design (45 mins)**
- [ ] Choose Option A, B, or C (or suggest Option D!)
- [ ] Design API signature for primary joint specification
- [ ] Define compensatory relationship matrix (if Option C)
- [ ] Consider edge cases (multi-joint exercises, bilateral exercises)

### **Task 5: Technology Recommendations (30 mins)**
- [ ] Recommend pose estimation model (stick with MediaPipe or migrate?)
- [ ] Recommend temporal alignment approach (DTW, ML-based, or current?)
- [ ] Identify any 2024-2025 research we should incorporate
- [ ] Suggest evaluation benchmarks (datasets, metrics)

---

## 📊 **Feedback Format**

Please provide feedback in this structure:

### **1. Clinical Validity** (⚠️ CRITICAL)
```
✅ APPROVED: [what's clinically sound]
⚠️ NEEDS ADJUSTMENT: [what needs tweaking]
❌ UNSAFE: [what could cause harm]

Specific threshold recommendations:
- knee_valgus: [current 8-10°] → [your recommendation]
- shoulder_hiking: [current 5-8% humerus length] → [your recommendation]
- ...
```

### **2. Algorithm Correctness**
```
✅ CORRECT: [algorithms that are mathematically sound]
⚠️ NEEDS REVIEW: [algorithms with potential issues]
❌ INCORRECT: [algorithms that are wrong]

Specific fixes:
- [Issue description] → [Suggested fix]
```

### **3. Primary Joint Focus Design**
```
RECOMMENDATION: [Option A / B / C / D (describe)]

API Design:
[Provide code snippet of proposed API]

Rationale:
[Why this approach is best]
```

### **4. Technology Recommendations**
```
POSE MODEL: [MediaPipe / Alternative] - Rationale: [why]
TEMPORAL ALIGNMENT: [Current / DTW / ML-based] - Rationale: [why]
OTHER TECH: [Any 2024-2025 advancements to incorporate]
```

### **5. Overall Assessment**
```
PRODUCTION READINESS: [0-100%]
CRITICAL BLOCKERS: [List any must-fix issues before deployment]
NICE-TO-HAVES: [Improvements for v2]
```

---

## 📞 **Contact for Questions**

If you need clarification on any code or have questions during review:
- **Codebase Location:** `/home/user/PhysioAssist/`
- **Key Documents:**
  - Roadmap: `docs/planning/EVIDENCE_BASED_ROADMAP_2025.md`
  - Clinical Integration: `docs/research/CLINICAL_FRAMEWORK_INTEGRATION.md`
  - Original Plans: `docs/planning/FOCUSED_REMEDIATION_PLAN.md`

---

## 🎯 **Review Deadline**

Please complete review by: **[DATE]**

Priority: **HIGH** - Blocks Gate 7-11 implementation (starting next week)

---

**Thank you for your expert review!** Your feedback will directly shape our clinical validation study (Gate 12) and ensure we're building a safe, effective, evidence-based tool.
