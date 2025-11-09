# Shoulder ROM Analytics - Architectural Integration Plan
## Clinical Evidence-Based Enhancement to UPGRADED_ROADMAP.md

> **Created:** 2025-11-09
> **Based on:** Clinical research + architectural analysis
> **Integrates with:** Gate 1 (foundation), Gate 5 (implementation), Gate 11 (MediaPipe upgrade)

---

## 🎯 Executive Summary

This document integrates shoulder-specific range-of-motion (ROM) analytics into the PhysioAssist roadmap, based on:
1. **Clinical research** (AAOS standards, scapulohumeral rhythm studies)
2. **Architectural touchpoints** (existing services can be extended)
3. **Multi-angle capture workflow** (frontal, sagittal, posterior views)

**Key Enhancements:**
- Forward Flexion (sagittal plane, side-view)
- External Rotation @ 90° elbow (frontal plane)
- Abduction with scapulothoracic differentiation (frontal plane)
- Internal Rotation hand-behind-back (posterior view)

---

## 📊 Clinical Foundation

### Normal Shoulder ROM Values

| Movement | AAOS Standard | Actual Population Mean | Clinical Source |
|----------|---------------|----------------------|-----------------|
| **Forward Flexion** | 180° | 157-162° | BMC Musculoskelet Disord 2020 |
| **Abduction** | 180° | 148-152° | BMC Musculoskelet Disord 2020 |
| **External Rotation** | 90° | 53-59° | BMC Musculoskelet Disord 2020 |
| **Internal Rotation** | Not standardized | 102° ± 7.7° | J Shoulder Elbow Surg 2011 |

### Scapulohumeral Rhythm

**Definition:** Ratio of glenohumeral motion to scapulothoracic motion during shoulder elevation

**Normal Values:**
- Classic textbook: **2:1** (GH:ST)
- Research measured: **2.86:1 to 3.13:1**
- **Clinical importance:** Abnormal rhythm → increased GH joint force → injury risk

**Measurement Requirements:**
- Cannot use fixed ratios (inaccurate)
- Need dynamic tracking of both components
- **MoveNet 17-pt:** Can approximate via proxies
- **MediaPipe 33-pt:** Can measure directly with scapular landmarks

### Multi-Angle Camera Requirements

**Research Evidence:**
- Back-viewing cameras: Best for joint angle measurement
- Frontal/sagittal views: Adequate for 2D planar movements
- Rotational movements: Require 3D or multiple angles
- **3D pose estimation >> 2D** for shoulder ROM (study: PMC 10635560)

**Standardized Protocol Critical:**
- Camera distance: 2-3 meters
- Camera height: Mid-torso level
- Lens parallel to movement plane
- Consistent lighting across angles

---

## 🏗️ Architectural Integration

### Service Extension Points

#### 1. **PoseDetectionServiceV2** (`src/services/PoseDetectionService.v2.ts`)

**Current Capabilities:**
- Emits 17 MoveNet landmarks
- Adaptive confidence thresholds
- Per-frame processing

**Enhancements Needed:**

```typescript
// Gate 1: Foundation
interface ProcessedPoseData {
  landmarks: PoseLandmark[];
  timestamp: number;
  confidence: number;

  // NEW: Multi-angle support
  cameraAngle?: 'frontal' | 'sagittal' | 'posterior';
  cameraAzimuth?: number; // degrees from frontal
}

// Gate 11: MediaPipe upgrade
interface PoseDetectionConfig {
  model: 'movenet-17' | 'mediapipe-33';
  adaptiveConfidence: boolean;
  minConfidence: number;
}
```

**Implementation:**
- Add `poseOrientation` tag to each frame
- Accept metadata about camera azimuth from capture workflow
- Design for model swapping (MoveNet → MediaPipe)

#### 2. **GoniometerService** (`src/services/goniometerService.ts`)

**Current Capabilities:**
- Centralizes joint-angle math
- Configurable smoothing
- 2D/3D modes

**Enhancements Needed:**

```typescript
// Gate 5: Shoulder-specific vectors
interface ShoulderVectors {
  torsoAxis: Vector3D;      // shoulder-hip line
  humerusAxis: Vector3D;    // shoulder-elbow line
  forearmAxis: Vector3D;    // elbow-wrist line
  coronalPlane: Plane;      // inter-shoulder reference
  sagittalPlane: Plane;     // perpendicular to coronal
}

// Gate 5: New joint angle types
type JointAngleType =
  | 'elbow_flexion'
  | 'shoulder_flexion'      // NEW: sagittal plane
  | 'shoulder_abduction'    // NEW: frontal plane
  | 'shoulder_external_rotation'  // NEW
  | 'shoulder_internal_rotation'; // NEW

// Gate 11: Scapular metrics (MediaPipe 33-pt)
interface ScapularMetrics {
  upwardRotation: number;   // degrees
  winging: number;          // mm from thorax
  elevation: number;        // mm from resting position
}
```

**Implementation:**
- Introduce sagittal/frontal plane vector calculations
- Use `poseUtils.areKeyLandmarksVisible()` to gate calculations
- Add scapular reference tracking (Gate 11)

#### 3. **ExerciseValidationService** (`src/features/videoComparison/services/exerciseValidationService.ts`)

**Current Capabilities:**
- Consumes goniometer output per phase
- Validates against thresholds

**Enhancements Needed:**

```typescript
// Gate 5: ROM-specific requirements
interface ExercisePhaseRequirement {
  phaseName: string;
  duration: number;

  // Existing
  jointRequirements: JointAngleRequirement[];

  // NEW: ROM checks
  romRequirements?: {
    joint: string;
    minPeakAngle?: number;    // e.g., flexion must reach 150°
    maxCompensation?: number; // e.g., trunk lean <10°
    scapularContribution?: {  // Gate 11
      min: number;  // e.g., 30% of total motion
      max: number;  // e.g., 50% of total motion
    };
  }[];

  // NEW: Multi-angle requirements
  requiredCameraAngle?: 'frontal' | 'sagittal' | 'posterior';
}
```

**Implementation:**
- Slot in new ROM checks (flexion/abduction thresholds)
- Add scapular compensation flags
- Minimal disruption to existing validator

#### 4. **Utility Helpers** (`src/utils/poseUtils.ts`, `src/utils/compensatoryMechanisms.ts`)

**Current Capabilities:**
- Visibility checks
- Normalization
- Stability checks
- Lighting/distance assessments

**Enhancements Needed:**

```typescript
// poseUtils.ts
export function areKeyLandmarksVisible(
  landmarks: PoseLandmark[],
  requiredJoints: string[],
  minConfidence = 0.5
): boolean {
  return requiredJoints.every(joint => {
    const landmark = findLandmark(landmarks, joint);
    return landmark && landmark.visibility >= minConfidence;
  });
}

// Gate 5: Plane-specific visibility
export function arePlaneSpecificLandmarksVisible(
  landmarks: PoseLandmark[],
  plane: 'sagittal' | 'frontal' | 'posterior'
): boolean {
  const requiredLandmarks = {
    sagittal: ['shoulder', 'elbow', 'hip'],
    frontal: ['left_shoulder', 'right_shoulder', 'elbow', 'wrist'],
    posterior: ['left_hip', 'right_hip', 'wrist']
  };
  return areKeyLandmarksVisible(landmarks, requiredLandmarks[plane]);
}

// compensatoryMechanisms.ts
// Gate 5: Confidence gating before ROM scoring
export function shouldScoreROM(
  frame: ProcessedPoseData,
  environmentalFactors: EnvironmentalFactors
): boolean {
  // Don't trust ROM in poor conditions
  if (environmentalFactors.lighting < 0.6) return false;
  if (environmentalFactors.distance !== 'optimal') return false;
  if (!arePlaneSpecificLandmarksVisible(frame.landmarks, frame.cameraAngle)) return false;
  return true;
}
```

---

## 🚪 Gate-by-Gate Integration

### Gate 1: Core Pipeline - Foundation for Multi-Angle

**NEW Task 1.6: Multi-Angle Data Structures**

```markdown
#### 1.6: Multi-Angle Workflow Foundation

- [ ] **YouTube template multi-angle support**
  - File: Extend `src/services/youtubeService.ts`
  - Data structure:
    ```typescript
    interface YouTubeTemplate {
      videoId: string;
      exerciseName: string;
      cameraAngles: {
        frontal?: {
          videoUrl: string;
          poses: ProcessedPoseData[];
          angles: JointAngles[];
        };
        sagittal?: { /* same */ };
        posterior?: { /* same */ };
      };
      requiredAngles: ('frontal' | 'sagittal' | 'posterior')[];
    }
    ```

- [ ] **Patient capture metadata**
  - Add `cameraAngle` tag to each ProcessedPoseData
  - SetupWizard prompts for angle when needed
  - Validate angle via landmark geometry

- [ ] **Comparison service design**
  - Match patient angle to template angle
  - Compare frontal-to-frontal, sagittal-to-sagittal
  - Design for future: multiple angles per exercise
```

**No Implementation Yet** - Just data structures and design

**Exit Criteria Addition:**
- ✅ Multi-angle data structures designed
- ✅ ProcessedPoseData supports `cameraAngle` metadata
- ✅ YouTubeTemplate supports multiple angle clips

---

### Gate 5: Clinical Thresholds & Shoulder ROM Analytics

**MAJOR EXPANSION** - This gate becomes comprehensive shoulder ROM implementation

```markdown
## 🚪 Gate 5: Clinical Thresholds & Shoulder ROM Analytics

**Objective:** Implement research-backed thresholds AND shoulder-specific ROM measurements

**Dependencies:** Gates 1-4 complete (accuracy validated, performance optimized, smoothing integrated)

---

### 5.1: Clinical Threshold Adapter (Existing)

[Keep existing content from UPGRADED_ROADMAP.md]

- [ ] Create adapter: MediaPipe thresholds → MoveNet 17-pt
- [ ] Replace errorDetectionConfig placeholders
- [ ] Add research citations

---

### 5.2: Forward Flexion (Sagittal Plane ROM)

**Clinical Context:**
- Normal range: 157-162° (population), 180° (AAOS)
- Target deficit threshold: Patient <140° vs Template 170° → flag

**Camera Requirements:**
- Side-view capture (≈90° to patient)
- Validates sagittal plane alignment

**Implementation:**

- [ ] **Sagittal plane goniometry**
  - File: Extend `src/services/goniometerService.ts`
  - Add `calculateShoulderFlexion(landmarks: PoseLandmark[])`
  - 3-point angle: shoulder-elbow-hip (sagittal projection)
  - Use One-Euro filter smoothing (from Gate 4)

- [ ] **Peak flexion detection**
  - Track max angle over rep cycle
  - Store: `{ peakFlexion: number, frameIndex: number }`

- [ ] **ROM comparison**
  - Compare patient peak vs YouTube template peak
  - Flag deficit: `patientMax < (templateMax - 20°)`
  - Extend existing "incomplete ROM" error type

- [ ] **SetupWizard guidance**
  - File: Update `src/components/common/SetupWizard.tsx`
  - Prompt: "Position camera to your side for this exercise"
  - Visual indicator: Side-view angle diagram
  - Validate: Check shoulder-hip line is perpendicular to camera

**Unit Tests:**
```typescript
describe('Shoulder Flexion ROM', () => {
  test('calculates flexion angle in sagittal plane', () => {
    const landmarks = createMockLandmarks({ shoulderFlexion: 150 });
    const angle = calculateShoulderFlexion(landmarks);
    expect(angle).toBeCloseTo(150, 1);
  });

  test('detects peak flexion over time', () => {
    const frames = [
      { flexion: 30 }, { flexion: 90 },
      { flexion: 150 }, { flexion: 90 }
    ];
    const peak = detectPeakFlexion(frames);
    expect(peak.angle).toBe(150);
    expect(peak.frameIndex).toBe(2);
  });

  test('flags incomplete ROM', () => {
    const patientPeak = 120;
    const templatePeak = 165;
    const error = checkFlexionROM(patientPeak, templatePeak);
    expect(error).toMatchObject({
      type: 'incomplete_shoulder_flexion',
      severity: 'warning',
      deficit: 45
    });
  });
});
```

---

### 5.3: External Rotation @ 90° Elbow

**Clinical Context:**
- Normal range: 53-59° (population), 90° (AAOS)
- Measurement: Forearm angle relative to torso, elbow at 90°

**Frame Gating:**
- Only evaluate when elbow angle ≈ 90° ± 10°
- Use existing `goniometerService.calculateElbowAngle()`

**Implementation:**

- [ ] **Forearm-to-torso angle calculation**
  - File: Extend `src/services/goniometerService.ts`
  - Add `calculateForearmToTorsoAngle(landmarks: PoseLandmark[])`
  - Algorithm:
    ```typescript
    function calculateForearmToTorsoAngle(landmarks) {
      // 1. Define coronal plane via inter-shoulder line
      const coronalPlane = createPlane(
        landmarks.left_shoulder,
        landmarks.right_shoulder,
        landmarks.left_hip
      );

      // 2. Forearm vector
      const forearmVector = subtract(
        landmarks.wrist,
        landmarks.elbow
      );

      // 3. Project forearm onto coronal plane
      const projected = projectVectorOntoPlane(forearmVector, coronalPlane);

      // 4. Calculate angle from vertical
      const verticalRef = subtract(landmarks.shoulder, landmarks.hip);
      return angleBetweenVectors(projected, verticalRef);
    }
    ```

- [ ] **Frame filtering**
  - Only process frames where `elbowAngle ∈ [80°, 100°]`
  - Skip frames outside range

- [ ] **Metrics**
  - Percent-of-target: `(patientER / templateER) × 100%`
  - Symmetry (if bilateral): `|leftER - rightER|`

- [ ] **Validation requirements**
  - File: Extend `ExerciseValidationService`
  - Add requirement:
    ```typescript
    {
      joint: 'shoulder_external_rotation',
      minAngle: 45,  // Must reach at least 45° ER
      elbowConstraint: { min: 80, max: 100 }
    }
    ```

**Unit Tests:**
```typescript
describe('Shoulder External Rotation', () => {
  test('calculates ER only when elbow at 90°', () => {
    const frames = [
      { elbowAngle: 45, shoulderER: 30 },  // Skip
      { elbowAngle: 90, shoulderER: 55 },  // Include
      { elbowAngle: 110, shoulderER: 40 }  // Skip
    ];
    const validFrames = filterFramesForER(frames);
    expect(validFrames).toHaveLength(1);
    expect(validFrames[0].shoulderER).toBe(55);
  });

  test('projects forearm onto coronal plane', () => {
    const landmarks = createMockLandmarks({
      leftShoulder: [0, 100, 0],
      rightShoulder: [200, 100, 0],
      elbow: [100, 100, 50],
      wrist: [120, 100, 100]  // Forearm rotated
    });
    const er = calculateForearmToTorsoAngle(landmarks);
    expect(er).toBeCloseTo(45, 1);
  });
});
```

---

### 5.4: Abduction - Scapulothoracic vs Glenohumeral

**Clinical Context:**
- Normal scapulohumeral rhythm: 2:1 (GH:ST)
- Total abduction: 148-152° (population), 180° (AAOS)
- Abnormal rhythm → compensatory patterns → injury risk

**MoveNet 17-pt Limitations:**
- No scapular landmarks
- Can approximate via proxies

**Implementation:**

- [ ] **Humeral abduction tracking**
  - File: `src/services/goniometerService.ts`
  - 3-point angle: shoulder-elbow-hip (frontal plane)
  - Track over time: `humeralAbduction(t)`

- [ ] **Scapular elevation proxy**
  - Track inter-shoulder line slope
  - Elevation: Change in shoulder height from baseline
  - Formula: `scapularElevation = shoulder_y(t) - shoulder_y(0)`

- [ ] **Proportion estimation (MoveNet approximation)**
  - Assume: `totalAbduction = GH + ST`
  - Proxy ST from shoulder elevation
  - Estimate GH: `GH ≈ totalAbduction - (scapularElevation × k)`
  - Where `k` is calibration factor (empirically tuned)

- [ ] **Compensation flags**
  - If `scapularElevation > (totalAbduction × 0.4)` → flag
  - "Excessive scapular compensation detected"
  - Integrate with existing shoulder hiking metric

- [ ] **Future MediaPipe upgrade (placeholder)**
  - File: Create `src/services/scapularAnalytics.ts`
  - Comment: "Requires MediaPipe 33-pt scapular landmarks"
  - Design interface now, implement in Gate 11

**Unit Tests:**
```typescript
describe('Scapulothoracic Differentiation', () => {
  test('estimates ST contribution from shoulder elevation', () => {
    const baseline = { shoulderY: 100 };
    const current = { shoulderY: 120, totalAbduction: 90 };
    const st = estimateScapularContribution(baseline, current);
    expect(st).toBeCloseTo(20, 1);  // 20° elevation
  });

  test('flags excessive scapular compensation', () => {
    const totalAbduction = 90;
    const scapularElevation = 40;  // >40% of total
    const flag = checkScapularCompensation(totalAbduction, scapularElevation);
    expect(flag.type).toBe('excessive_scapular_compensation');
    expect(flag.severity).toBe('warning');
  });
});
```

---

### 5.5: Internal Rotation (Hand Behind Back)

**Clinical Context:**
- No AAOS standard
- Functional measure: Reach level (hip, sacrum, lumbar, thoracic)
- Requires posterior view

**MoveNet 17-pt Strategy:**
- Approximate spine levels via hip/shoulder landmarks
- Use Y-coordinates normalized to body height

**Implementation:**

- [ ] **Multi-angle workflow trigger**
  - File: `src/components/common/SetupWizard.tsx`
  - Detect exercise requires posterior view
  - Prompt: "Rotate phone to capture your back"
  - Visual guide: Rear-view silhouette

- [ ] **Spine level approximation (MoveNet 17-pt)**
  - File: `src/utils/spineLevelEstimation.ts`
  - Algorithm:
    ```typescript
    function estimateSpineLevel(wristY: number, landmarks: PoseLandmark[]) {
      const hipY = avg(landmarks.left_hip.y, landmarks.right_hip.y);
      const shoulderY = avg(landmarks.left_shoulder.y, landmarks.right_shoulder.y);
      const bodyHeight = shoulderY - hipY;

      // Normalize wrist position
      const normalized = (wristY - hipY) / bodyHeight;

      // Approximate levels (empirical from PT data)
      if (normalized < 0.2) return 'hip';
      if (normalized < 0.4) return 'sacrum';
      if (normalized < 0.7) return 'lumbar';
      return 'thoracic';
    }
    ```

- [ ] **Qualitative badge for feedback**
  - File: `src/features/videoComparison/services/smartFeedbackGenerator.ts`
  - Add to feedback:
    ```typescript
    {
      metric: 'internal_rotation',
      result: 'lumbar_level',
      badge: 'Reaching L2-L5 (Good)',
      targetLevel: 'thoracic_level',
      deficit: 'Try to reach higher'
    }
    ```

- [ ] **Future MediaPipe upgrade (placeholder)**
  - Comment: "Will use T8, L2, L5, sacrum landmarks"
  - More precise grading when available

**Unit Tests:**
```typescript
describe('Internal Rotation Grading', () => {
  test('estimates spine level from wrist position', () => {
    const landmarks = createMockLandmarks({
      wrist: { y: 110 },
      hip: { y: 100 },
      shoulder: { y: 150 }
    });
    const level = estimateSpineLevel(landmarks.wrist.y, landmarks);
    expect(level).toBe('lumbar');
  });

  test('normalizes across different body heights', () => {
    const tall = { wristY: 160, hipY: 100, shoulderY: 200 };
    const short = { wristY: 130, hipY: 100, shoulderY: 150 };

    // Both at 60% of body height → same level
    const tallLevel = estimateSpineLevel(tall.wristY, tall);
    const shortLevel = estimateSpineLevel(short.wristY, short);
    expect(tallLevel).toBe(shortLevel);
  });
});
```

---

### 5.6: Multi-Angle Capture Workflow

**UX Requirements:**
- Must stay ≤5 steps to first feedback (Gate 6 validation)
- Progressive disclosure: Only prompt for additional angles if needed

**Implementation:**

- [ ] **Exercise metadata tagging**
  - File: Extend exercise database schema
  - Add field:
    ```typescript
    interface Exercise {
      name: string;
      youtubeUrl: string;
      requiredCameraAngles: ('frontal' | 'sagittal' | 'posterior')[];
      primaryAngle: 'frontal' | 'sagittal' | 'posterior';
    }
    ```

- [ ] **Dynamic SetupWizard flow**
  - File: `src/components/common/SetupWizard.tsx`
  - Flow:
    1. Start with primary angle (usually frontal)
    2. After first rep, check if additional angles needed
    3. If yes: "Great! Now let's capture a side view"
    4. Guide patient to reposition camera
    5. Validate angle via landmark geometry

- [ ] **Angle validation via pose geometry**
  - File: `src/utils/cameraAngleDetection.ts`
  - Algorithm:
    ```typescript
    function detectCameraAngle(landmarks: PoseLandmark[]): 'frontal' | 'sagittal' | 'posterior' {
      const shoulderLine = subtract(
        landmarks.right_shoulder,
        landmarks.left_shoulder
      );
      const shoulderWidth = length(shoulderLine);

      // Frontal: Shoulders wide apart (perpendicular to camera)
      if (shoulderWidth > 0.8 × expectedShoulderWidth) return 'frontal';

      // Sagittal: Shoulders overlapping (parallel to camera)
      if (shoulderWidth < 0.3 × expectedShoulderWidth) return 'sagittal';

      // Posterior: Check if back landmarks visible
      // (Limited with MoveNet 17-pt, use heuristics)
      return 'posterior';
    }
    ```

- [ ] **Comparison logic for multi-angle**
  - File: `src/features/videoComparison/services/comparisonAnalysisService.ts`
  - Match angles:
    - Patient frontal → Template frontal
    - Patient sagittal → Template sagittal
  - Aggregate metrics across angles
  - Don't penalize if template only has one angle

**Unit Tests:**
```typescript
describe('Multi-Angle Workflow', () => {
  test('detects frontal view from shoulder width', () => {
    const landmarks = createMockLandmarks({
      leftShoulder: [0, 100, 0],
      rightShoulder: [200, 100, 0]  // Wide apart
    });
    const angle = detectCameraAngle(landmarks);
    expect(angle).toBe('frontal');
  });

  test('prompts for additional angle if required', () => {
    const exercise = { requiredCameraAngles: ['frontal', 'sagittal'] };
    const capturedAngles = ['frontal'];
    const needsMore = requiresAdditionalAngle(exercise, capturedAngles);
    expect(needsMore).toBe(true);
    expect(needsMore.nextAngle).toBe('sagittal');
  });
});
```

---

### 5.7: Robustness & Confidence Gating

**Prevent Bad ROM Measurements:**

- [ ] **Frame quality checks before ROM scoring**
  - File: `src/utils/compensatoryMechanisms.ts`
  - Integration:
    ```typescript
    function scoreShoulderROM(frame: ProcessedPoseData): ROMMetrics | null {
      // Gate 1: Check lighting
      if (!isLightingAdequate(frame)) return null;

      // Gate 2: Check landmark visibility
      if (!arePlaneSpecificLandmarksVisible(frame.landmarks, frame.cameraAngle)) {
        return null;
      }

      // Gate 3: Check distance
      if (!isPatientDistanceOptimal(frame)) return null;

      // Only then: Calculate ROM
      return calculateROMMetrics(frame);
    }
    ```

- [ ] **Per-metric confidence tracking**
  - Aggregate landmark visibilities
  - Formula: `metricConfidence = avg(visibility[requiredLandmarks])`
  - Expose in ROM score:
    ```typescript
    interface ROMScore {
      angle: number;
      confidence: number;  // 0-1
      landmarkQuality: {
        shoulder: number;
        elbow: number;
        wrist: number;
      };
    }
    ```

- [ ] **Telemetry for therapist review**
  - Flag low-confidence ROM measurements
  - Store: `{ rom: 145, confidence: 0.62, flagForReview: true }`
  - PT can review flagged clips manually

---

### Exit Criteria (Gate 5)

**Existing:**
- ✅ Clinical thresholds mapped to MoveNet
- ✅ All "TUNE REQUIRED" warnings removed
- ✅ Research citations in code comments

**NEW:**
- ✅ Forward flexion ROM measurement working (sagittal view)
- ✅ External rotation @ 90° elbow measurement working
- ✅ Abduction with scapular compensation detection working
- ✅ Internal rotation hand-behind-back grading working
- ✅ Multi-angle workflow UX designed and implemented
- ✅ Camera angle auto-detection working
- ✅ Confidence gating prevents bad ROM measurements
- ✅ All shoulder ROM unit tests passing (≥95% coverage)
- ✅ Manual validation: Test with 3 volunteers
  - Forward flexion deficit detected correctly
  - External rotation deficit detected correctly
  - Scapular compensation flagged correctly
  - Internal rotation graded correctly

**Estimated Effort:** 10-14 days (expanded from original Gate 5)

---
```

[Continue to Gate 11 in next part...]

---

## 📝 Implementation Priorities

**Must-Have (Gate 5):**
1. Forward flexion ROM
2. External rotation @ 90°
3. Multi-angle capture workflow
4. Confidence gating

**Should-Have (Gate 5):**
5. Abduction ST differentiation (proxy method)
6. Internal rotation grading

**Future Enhancement (Gate 11):**
7. MediaPipe upgrade for scapular landmarks
8. True scapulothoracic measurement
9. Scapular winging detection

---

**This document provides the complete architectural blueprint for shoulder ROM integration.**
