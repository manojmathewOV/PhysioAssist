# Gate 9: 3D Anatomical Reference Frames

## Foundation for Clinical-Grade Joint Measurement

> **Objective:** Implement ISB-compliant anatomical reference frames for accurate 3D joint angle measurement
> **Prerequisites:** Gates 0-8 ✅ COMPLETE
> **Prepares For:** Gate 10 (Clinical Joint Service), Gate 11 (MediaPipe 33-pt)
> **Estimated Effort:** 8-10 days
> **Research Basis:** ISB standards, biomechanics research, RGB-D depth estimation

---

## 🎯 Strategic Importance

### Why 3D Reference Frames Matter

**Current Limitations (2D-only measurement):**

- ❌ Shoulder ROM measured in screen plane only (not scapular plane)
- ❌ Cannot separate spine lean from true joint motion
- ❌ External rotation approximated without torso reference
- ❌ No depth perception → 2D projection errors

**With 3D Reference Frames:**

- ✅ Measure joints relative to anatomical planes (sagittal, coronal, transverse)
- ✅ Detect compensation patterns (trunk lean, shoulder hiking)
- ✅ Primary joint (e.g., shoulder) measured relative to secondary joints (spine, elbow)
- ✅ Clinical-grade accuracy for ROM grading

### Research Foundation

Based on 2024 research:

- **ISB Coordinate Standards**: X-anterior, Y-superior, Z-lateral
- **Scapular Plane**: 30-40° anterior to coronal plane
- **Scapulohumeral Rhythm**: 2.86:1 to 3.13:1 (glenohumeral:scapulothoracic)
- **Compensation Detection**: 98.1% F1-score achievable with ML on trunk lean/rotation

---

## 📊 Pre-Implementation Baseline

### Current State Audit

Run baseline measurements:

```bash
# Test current 2D shoulder ROM
npm run test -- src/features/shoulderAnalytics

# Capture baseline metrics
# - Current shoulder abduction accuracy: ___%
# - Trunk lean detection: ___
# - Elbow compensation detection: ___
```

**Document:**

- Current accuracy vs. clinical goniometer
- False positive rate for compensations
- 2D measurement limitations

---

## 🚪 Phase 1: Core Data Structures (Days 1-2)

### 9.1.1: Type Definitions

**File:** `src/types/biomechanics.ts` (NEW)

```typescript
/**
 * ISB-compliant 3D coordinate frame
 * Based on International Society of Biomechanics standards
 */
export interface AnatomicalReferenceFrame {
  /** Origin point (typically joint center) */
  origin: Vector3D;

  /** X-axis: Anterior direction (forward) */
  xAxis: Vector3D;

  /** Y-axis: Superior direction (upward) */
  yAxis: Vector3D;

  /** Z-axis: Lateral direction (right) */
  zAxis: Vector3D;

  /** Frame type for documentation */
  frameType: 'global' | 'thorax' | 'scapula' | 'humerus' | 'forearm';

  /** Confidence in frame accuracy (0-1) */
  confidence: number;
}

/**
 * Anatomical plane in 3D space
 */
export interface AnatomicalPlane {
  name: 'sagittal' | 'coronal' | 'transverse' | 'scapular';
  normal: Vector3D;
  point: Vector3D;
  rotation?: number; // degrees from canonical plane
}

/**
 * Joint measurement with anatomical context
 */
export interface ClinicalJointMeasurement {
  primaryJoint: {
    name: string;
    type: 'shoulder' | 'elbow' | 'knee' | 'hip' | 'ankle';
    angle: number;
    angleType: 'flexion' | 'extension' | 'abduction' | 'adduction' | 'rotation';
    components?: {
      glenohumeral?: number;
      scapulothoracic?: number;
      ratio?: number;
    };
  };

  secondaryJoints: Record<
    string,
    {
      angle: number;
      purpose: 'reference' | 'compensation_check' | 'validation';
      deviation?: number;
      warning?: string;
    }
  >;

  referenceFrames: {
    global: AnatomicalReferenceFrame;
    local: AnatomicalReferenceFrame;
    measurementPlane: AnatomicalPlane;
  };

  compensations: CompensationPattern[];

  quality: MeasurementQuality;
}

export interface CompensationPattern {
  type:
    | 'trunk_lean'
    | 'trunk_rotation'
    | 'shoulder_hiking'
    | 'elbow_flexion'
    | 'hip_hike'
    | 'contralateral_lean';
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  magnitude: number;
  affectsJoint: string;
  clinicalNote: string;
}

export interface MeasurementQuality {
  depthReliability: number; // 0-1
  landmarkVisibility: number; // 0-1
  frameStability: number; // 0-1
  overall: 'excellent' | 'good' | 'fair' | 'poor';
}
```

**Tasks:**

- [ ] Create `src/types/biomechanics.ts`
- [ ] Add ISB reference documentation comments
- [ ] Export from `src/types/index.ts`
- [ ] Add unit tests for type compatibility

---

### 9.1.2: Vector Math Utilities

**File:** `src/utils/vectorMath.ts` (NEW)

```typescript
/**
 * Lightweight 3D vector math utilities
 * Optimized for mobile performance
 */

export function midpoint3D(p1: Vector3D, p2: Vector3D): Vector3D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: (p1.z + p2.z) / 2,
  };
}

export function subtract3D(p1: Vector3D, p2: Vector3D): Vector3D {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };
}

export function normalize(v: Vector3D): Vector3D {
  const mag = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  return mag === 0 ? v : { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

export function crossProduct(v1: Vector3D, v2: Vector3D): Vector3D {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
}

export function dotProduct(v1: Vector3D, v2: Vector3D): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

export function magnitude(v: Vector3D): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

export function angleBetweenVectors(v1: Vector3D, v2: Vector3D): number {
  const dot = dotProduct(v1, v2);
  const mags = magnitude(v1) * magnitude(v2);
  const cosAngle = dot / mags;
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

export function projectVectorOntoPlane(
  vector: Vector3D,
  planeNormal: Vector3D
): Vector3D {
  const dot = dotProduct(vector, planeNormal);
  return normalize({
    x: vector.x - dot * planeNormal.x,
    y: vector.y - dot * planeNormal.y,
    z: vector.z - dot * planeNormal.z,
  });
}
```

**Tasks:**

- [ ] Create `src/utils/vectorMath.ts`
- [ ] Implement all 8 core functions
- [ ] Add comprehensive JSDoc comments
- [ ] Write 24+ unit tests (3 per function minimum)
- [ ] Benchmark performance (<1ms per operation)

---

## 🚪 Phase 2: Reference Frame Service (Days 3-4)

### 9.2.1: Anatomical Reference Service

**File:** `src/services/biomechanics/AnatomicalReferenceService.ts` (NEW)

```typescript
/**
 * Calculates ISB-compliant anatomical reference frames
 * from pose landmarks
 */
export class AnatomicalReferenceService {
  /**
   * Calculate global reference frame (world coordinates)
   * Origin: midpoint of hips
   * Y-axis: vertical (superior)
   * X-axis: anterior
   * Z-axis: lateral (right)
   */
  calculateGlobalFrame(landmarks: PoseLandmark[]): AnatomicalReferenceFrame {
    const leftHip = landmarks[11];
    const rightHip = landmarks[12];
    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];

    const origin = midpoint3D(leftHip, rightHip);

    // Y-axis: hip-to-shoulder (vertical/superior)
    const hipCenter = origin;
    const shoulderCenter = midpoint3D(leftShoulder, rightShoulder);
    const yAxis = normalize(subtract3D(shoulderCenter, hipCenter));

    // Z-axis: lateral (left hip to right hip)
    const zAxis = normalize(subtract3D(rightHip, leftHip));

    // X-axis: anterior (cross product Y × Z)
    const xAxis = normalize(crossProduct(yAxis, zAxis));

    // Recalculate Z to ensure orthogonality
    const zAxisCorrected = normalize(crossProduct(xAxis, yAxis));

    return {
      origin,
      xAxis,
      yAxis,
      zAxis: zAxisCorrected,
      frameType: 'global',
      confidence: this.calculateFrameConfidence([
        leftHip,
        rightHip,
        leftShoulder,
        rightShoulder,
      ]),
    };
  }

  /**
   * Calculate thorax reference frame
   * Origin: midpoint of shoulders
   * Aligned with trunk orientation
   */
  calculateThoraxFrame(
    landmarks: PoseLandmark[],
    globalFrame: AnatomicalReferenceFrame
  ): AnatomicalReferenceFrame {
    // Implementation here
  }

  /**
   * Calculate scapular plane (30-40° anterior to coronal)
   */
  calculateScapularPlane(
    thoraxFrame: AnatomicalReferenceFrame,
    rotationAngle: number = 35
  ): AnatomicalPlane {
    // Implementation here
  }

  /**
   * Calculate humerus reference frame
   */
  calculateHumerusFrame(
    landmarks: PoseLandmark[],
    side: 'left' | 'right',
    thoraxFrame: AnatomicalReferenceFrame
  ): AnatomicalReferenceFrame {
    // Implementation here
  }

  private calculateFrameConfidence(landmarks: PoseLandmark[]): number {
    const visibilities = landmarks.map((lm) => lm.visibility);
    return visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
  }
}
```

**Tasks:**

- [ ] Create service file structure
- [ ] Implement `calculateGlobalFrame()`
- [ ] Implement `calculateThoraxFrame()`
- [ ] Implement `calculateScapularPlane()`
- [ ] Implement `calculateHumerusFrame()`
- [ ] Add frame visualization helpers (for debugging)
- [ ] Write 15+ unit tests covering all frames
- [ ] Test with synthetic pose data
- [ ] Test with real MoveNet output

---

## 🚪 Phase 3: Enhanced Goniometer (Days 5-6)

### 9.3.1: Enable 3D Mode by Default

**File:** `src/services/goniometerService.ts` (MODIFY)

```typescript
// BEFORE
constructor(config: AngleCalculationConfig = {}) {
  this.config = {
    smoothingWindow: 5,
    minConfidence: 0.5,
    use3D: false,  // ❌ 2D only
    ...config,
  };
}

// AFTER
constructor(config: AngleCalculationConfig = {}) {
  this.config = {
    smoothingWindow: 5,
    minConfidence: 0.5,
    use3D: true,  // ✅ 3D by default
    ...config,
  };
}
```

**Tasks:**

- [ ] Change `use3D` default to `true`
- [ ] Ensure `calculate3DAngle()` handles missing z gracefully
- [ ] Update all tests to expect 3D calculations
- [ ] Add feature flag for 2D fallback: `FORCE_2D_GONIOMETRY`

---

### 9.3.2: Plane-Aware Angle Calculation

**File:** `src/services/goniometerService.ts` (ADD)

```typescript
/**
 * Calculate angle between two vectors in a specific anatomical plane
 */
calculateAngleInPlane(
  vector1: Vector3D,
  vector2: Vector3D,
  plane: AnatomicalPlane,
  jointName: string
): JointAngle {
  // Project vectors onto plane
  const v1Projected = projectVectorOntoPlane(vector1, plane.normal);
  const v2Projected = projectVectorOntoPlane(vector2, plane.normal);

  // Calculate angle between projected vectors
  const angle = angleBetweenVectors(v1Projected, v2Projected);

  return {
    jointName,
    angle,
    confidence: 0.9, // High confidence for plane-projected angles
    isValid: true,
    vectors: {
      BA: v1Projected,
      BC: v2Projected
    },
    plane: plane.name
  };
}
```

**Tasks:**

- [ ] Add `calculateAngleInPlane()` method
- [ ] Extend `JointAngle` type with optional `plane` field
- [ ] Update `calculateAllJointAngles()` to use planes when available
- [ ] Write 12+ tests for plane-aware calculations
- [ ] Test sagittal, coronal, transverse, scapular planes

---

## 🚪 Phase 4: Depth Handling (Days 7-8)

### 9.4.1: Populate Z-Depth from Pose Model

**File:** `src/services/PoseDetectionService.v2.ts` (MODIFY)

```typescript
// BEFORE (z forced to 0)
const landmarks: PoseLandmark[] = results.keypoints.map((kp, index) => ({
  x: kp.x,
  y: kp.y,
  z: 0, // ❌ Depth discarded
  visibility: kp.score,
  name: MOVENET_KEYPOINTS[index],
  index,
}));

// AFTER (preserve depth when available)
const landmarks: PoseLandmark[] = results.keypoints.map((kp, index) => ({
  x: kp.x,
  y: kp.y,
  z: kp.z !== undefined ? kp.z : 0, // ✅ Use depth if available
  visibility: kp.score,
  name: MOVENET_KEYPOINTS[index],
  index,
}));
```

**Tasks:**

- [ ] Check if MoveNet provides z-depth
- [ ] If yes: populate z from model output
- [ ] If no: estimate z from 2D heuristics (shoulder width normalization)
- [ ] Add `hasDepth` boolean to `ProcessedPoseData`
- [ ] Test depth accuracy against known poses

---

### 9.4.2: Depth Estimation Fallback

**File:** `src/utils/depthEstimation.ts` (NEW)

```typescript
/**
 * Estimate rough z-depth from 2D landmarks
 * Based on shoulder width normalization
 */
export function estimateDepthFrom2D(landmarks: PoseLandmark[]): PoseLandmark[] {
  const leftShoulder = landmarks[5];
  const rightShoulder = landmarks[6];

  // Use shoulder width as depth scale reference
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const normalizedWidth = 0.4; // Average shoulder width in normalized coords
  const depthScale = shoulderWidth / normalizedWidth;

  return landmarks.map((lm, idx) => {
    // Estimate depth based on y-position (heuristic)
    // Higher landmarks (head) are typically further from camera
    const estimatedZ = (1.0 - lm.y) * depthScale * 0.2;

    return {
      ...lm,
      z: estimatedZ,
    };
  });
}
```

**Tasks:**

- [ ] Implement depth estimation heuristics
- [ ] Test accuracy against 3D ground truth (if available)
- [ ] Add confidence penalty for estimated vs. real depth
- [ ] Document limitations clearly

---

## 🚪 Phase 5: Integration & Testing (Days 9-10)

### 9.5.1: Update ShoulderROMTracker

**File:** `src/features/shoulderAnalytics/ShoulderROMTracker.ts` (REFACTOR)

```typescript
// BEFORE (2D calculation)
const dx = wrist.x - shoulder.x;
const dy = wrist.y - shoulder.y;
angle = Math.atan2(dx, dy) * (180 / Math.PI);

// AFTER (3D with reference frames)
const refService = new AnatomicalReferenceService();
const globalFrame = refService.calculateGlobalFrame(landmarks);
const thoraxFrame = refService.calculateThoraxFrame(landmarks, globalFrame);
const scapularPlane = refService.calculateScapularPlane(thoraxFrame);
const humerusFrame = refService.calculateHumerusFrame(landmarks, side, thoraxFrame);

// Measure in scapular plane (not pure frontal!)
const angle = goniometer.calculateAngleInPlane(
  humerusFrame.yAxis,
  thoraxFrame.yAxis,
  scapularPlane,
  `${side}_shoulder_abduction`
);
```

**Tasks:**

- [ ] Refactor `calculateShoulderAngle()` to use reference frames
- [ ] Add trunk lean detection using global vs. thorax frame
- [ ] Measure in scapular plane (not frontal)
- [ ] Update tests to expect 3D measurements
- [ ] Validate against clinical goniometer data

---

### 9.5.2: Capture Context Metadata

**File:** `src/types/pose.ts` (MODIFY)

```typescript
export interface ProcessedPoseData {
  landmarks: PoseLandmark[];
  timestamp: number;
  confidence: number;

  // NEW: Capture context
  viewOrientation?: 'frontal' | 'sagittal' | 'posterior';
  cameraAzimuth?: number; // degrees from frontal
  hasDepth?: boolean; // true if z is real, false if estimated
  keypointSchema?: 'movenet-17' | 'mediapipe-33'; // for future
}
```

**Tasks:**

- [ ] Extend `ProcessedPoseData` type
- [ ] Update `PoseDetectionServiceV2.processFrame()` to populate metadata
- [ ] Add UI to select view orientation during capture
- [ ] Document metadata usage in validators

---

## ✅ Definition of Done

### Functional Criteria

- [x] All tasks completed
- [ ] `AnatomicalReferenceService` calculates global, thorax, scapular, humerus frames
- [ ] `GoniometerService` operates in 3D mode by default
- [ ] Depth handling works (real or estimated)
- [ ] ShoulderROMTracker uses 3D reference frames
- [ ] Measurements accurate within ±5° of clinical goniometer

### Testing Criteria

- [ ] **Unit Tests:** 60+ new tests
  - [ ] vectorMath: 24 tests
  - [ ] AnatomicalReferenceService: 20 tests
  - [ ] GoniometerService (enhanced): 12 tests
  - [ ] depthEstimation: 6 tests
- [ ] **Integration Tests:**
  - [ ] End-to-end: Pose → Frames → Angles → ROM
  - [ ] Compare 2D vs 3D measurement accuracy
  - [ ] Validate against synthetic ground truth
- [ ] **Performance Tests:**
  - [ ] Reference frame calculation: <5ms per frame
  - [ ] No FPS degradation in live mode

### Code Quality Criteria

- [ ] TypeScript strict mode passing
- [ ] All functions have JSDoc with research citations
- [ ] No breaking changes to existing API
- [ ] Feature flags for gradual rollout

### Documentation Criteria

- [ ] ISB reference frame standard documented
- [ ] Vector math formulas documented
- [ ] Migration guide for existing code
- [ ] Clinical validation protocol written

### Clinical Validation Criteria

- [ ] Test with 10+ shoulder ROM videos
- [ ] Compare against physical therapist goniometer measurements
- [ ] Accuracy: MAE ≤ 5° for abduction, flexion
- [ ] Document any systematic biases

### Backward Compatibility

- [ ] All existing tests pass
- [ ] 2D mode available via config flag
- [ ] ShoulderROMTracker maintains same API
- [ ] No breaking changes to consumers

---

## 🔬 Clinical Validation Protocol

### Test Dataset

1. **Controlled Synthetic Poses** (10 poses)

   - Known ground truth angles
   - Validate math accuracy

2. **Real Patient Videos** (10 videos)

   - Shoulder abduction 0-180°
   - Physical therapist goniometer as reference
   - Compare system output vs. PT measurement

3. **Edge Cases** (5 videos)
   - Poor lighting
   - Occluded landmarks
   - Extreme body types

### Success Metrics

- **Accuracy:** MAE ≤ 5° vs. clinical goniometer
- **Precision:** SD ≤ 3°
- **Reliability:** ICC ≥ 0.90 (inter-rater reliability)

---

## 📦 Deliverables

1. **Code:**

   - `src/types/biomechanics.ts`
   - `src/utils/vectorMath.ts`
   - `src/utils/depthEstimation.ts`
   - `src/services/biomechanics/AnatomicalReferenceService.ts`
   - Enhanced `src/services/goniometerService.ts`
   - Refactored `src/features/shoulderAnalytics/ShoulderROMTracker.ts`

2. **Tests:**

   - 60+ unit tests
   - 5+ integration tests
   - Clinical validation test suite

3. **Documentation:**
   - ISB standards reference
   - Vector math formulas
   - Migration guide
   - Clinical validation report

---

## 🚦 Gate Status

**STATUS:** ⏳ READY TO START

**Sign-Off:**

- [ ] Developer: ********\_******** Date: **\_\_\_**
- [ ] QA: **********\_\_\_\_********** Date: **\_\_\_**
- [ ] Clinical Advisor: ****\_\_\_**** Date: **\_\_\_**

---

## 🔄 Next Steps After Gate 9

**Gate 10:** Clinical Joint Measurement Service

- Build on these reference frames
- Add compensation detection
- Primary/secondary joint architecture

**Gate 11:** MediaPipe 33-pt Upgrade

- True scapular tracking
- Spine segmentation
- Scapulohumeral rhythm measurement
