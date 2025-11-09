# Gate 10: Clinical Joint Measurement Service

## Primary/Secondary Joint Architecture & Compensation Detection

> **Objective:** Build production-ready clinical joint measurement with anatomical context
> **Prerequisites:** Gate 9 ✅ (3D Anatomical Reference Frames)
> **Prepares For:** Gate 11 (MediaPipe 33-pt upgrade)
> **Estimated Effort:** 10-12 days
> **Research Basis:** Compensation pattern detection (98.1% F1-score), clinical biomechanics

---

## 🎯 Strategic Importance

### The Primary/Secondary Joint Paradigm

**Clinical Reality:**
When measuring shoulder ROM, you're not just measuring the shoulder—you're measuring:

- **PRIMARY:** Shoulder glenohumeral angle (the target)
- **SECONDARY:** Elbow extension (should be straight)
- **SECONDARY:** Trunk alignment (should be vertical)
- **SECONDARY:** Contralateral shoulder (should not elevate)
- **SECONDARY:** Scapular position (relative to rib cage)

**Example: Shoulder Abduction**

```
PRIMARY JOINT:    Left shoulder (measure abduction angle)
SECONDARY JOINTS:
  ├── Left elbow (validation: should be ~180° extended)
  ├── Trunk (compensation check: lean ≤10°)
  ├── Right shoulder (compensation check: no hiking)
  └── Spine (reference: vertical axis)
```

### Research-Backed Compensation Detection

2024 research shows ML models achieve **98.1% F1-score** detecting:

- Trunk lean forward (TLF)
- Trunk rotation (TR)
- Shoulder elevation (SE)

We'll implement rule-based detection that rivals ML accuracy.

---

## 📊 Pre-Implementation Baseline

### Current State Audit

```bash
# Test current shoulder compensation detection
npm run test -- src/features/shoulderAnalytics
npm run test -- src/features/videoComparison/errorDetection/shoulderErrors.test.ts

# Metrics to capture:
# - Trunk lean detection rate: ___%
# - False positive rate: ___%
# - Shoulder hiking detection: ___%
```

**Goal:** Improve detection accuracy by 15%+ with anatomical context

---

## 🚪 Phase 1: Compensation Detector (Days 1-3)

### 10.1.1: Compensation Pattern Types

**File:** `src/services/biomechanics/CompensationDetector.ts` (NEW)

```typescript
/**
 * Detects movement compensation patterns
 * Based on 2024 research: 98.1% F1-score achievable
 */
export class CompensationDetector {
  // Clinical thresholds (evidence-based)
  private readonly TRUNK_LEAN_THRESHOLD = 10; // degrees
  private readonly TRUNK_ROTATION_THRESHOLD = 15; // degrees
  private readonly SHOULDER_HIKE_THRESHOLD = 0.05; // normalized units
  private readonly ELBOW_FLEX_THRESHOLD = 160; // degrees (should be ~180)

  /**
   * Detect all compensation patterns for a given movement
   */
  detectPatterns(
    landmarks: PoseLandmark[],
    side: 'left' | 'right',
    movement: string,
    secondaryJoints: Record<string, SecondaryJointData>,
    previousFrames?: PoseLandmark[][]
  ): CompensationPattern[] {
    const patterns: CompensationPattern[] = [];

    // 1. Trunk lean detection
    if (this.detectTrunkLean(secondaryJoints)) {
      patterns.push(this.createTrunkLeanPattern(secondaryJoints, side));
    }

    // 2. Elbow flexion compensation
    if (this.detectElbowCompensation(secondaryJoints, side)) {
      patterns.push(this.createElbowFlexPattern(secondaryJoints, side));
    }

    // 3. Contralateral shoulder hiking
    if (this.detectShoulderHiking(secondaryJoints, side)) {
      patterns.push(this.createShoulderHikePattern(secondaryJoints, side));
    }

    // 4. Trunk rotation (requires temporal data)
    if (previousFrames && previousFrames.length > 5) {
      const rotation = this.detectTrunkRotation(landmarks, previousFrames);
      if (rotation > this.TRUNK_ROTATION_THRESHOLD) {
        patterns.push(this.createTrunkRotationPattern(rotation, side));
      }
    }

    return patterns;
  }

  private detectTrunkLean(secondaryJoints: Record<string, SecondaryJointData>): boolean {
    return secondaryJoints.trunk_lean?.angle > this.TRUNK_LEAN_THRESHOLD;
  }

  private detectElbowCompensation(
    secondaryJoints: Record<string, SecondaryJointData>,
    side: 'left' | 'right'
  ): boolean {
    const elbowJoint = secondaryJoints[`${side}_elbow`];
    return elbowJoint && elbowJoint.angle < this.ELBOW_FLEX_THRESHOLD;
  }

  private detectShoulderHiking(
    secondaryJoints: Record<string, SecondaryJointData>,
    side: 'left' | 'right'
  ): boolean {
    const contralateralSide = side === 'left' ? 'right' : 'left';
    const shoulderHike = secondaryJoints[`${contralateralSide}_shoulder_elevation`];
    return shoulderHike && shoulderHike.deviation > this.SHOULDER_HIKE_THRESHOLD * 100;
  }

  private detectTrunkRotation(
    current: PoseLandmark[],
    previous: PoseLandmark[][]
  ): number {
    // Calculate rotation of inter-shoulder axis over time
    const currentLeftShoulder = current[5];
    const currentRightShoulder = current[6];
    const currentAxis = subtract3D(currentRightShoulder, currentLeftShoulder);

    const prevFrame = previous[previous.length - 1];
    const prevLeftShoulder = prevFrame[5];
    const prevRightShoulder = prevFrame[6];
    const prevAxis = subtract3D(prevRightShoulder, prevLeftShoulder);

    // Project to horizontal plane and calculate angle
    const currentProj = { x: currentAxis.x, y: 0, z: currentAxis.z || 0 };
    const prevProj = { x: prevAxis.x, y: 0, z: prevAxis.z || 0 };

    return angleBetweenVectors(currentProj, prevProj);
  }

  private categorizeSeverity(
    value: number,
    threshold: number
  ): 'minimal' | 'mild' | 'moderate' | 'severe' {
    const ratio = value / threshold;
    if (ratio < 1.2) return 'minimal';
    if (ratio < 1.5) return 'mild';
    if (ratio < 2.0) return 'moderate';
    return 'severe';
  }

  private createTrunkLeanPattern(
    secondaryJoints: Record<string, SecondaryJointData>,
    side: string
  ): CompensationPattern {
    const trunkLean = secondaryJoints.trunk_lean;
    return {
      type: 'trunk_lean',
      severity: this.categorizeSeverity(trunkLean.angle, this.TRUNK_LEAN_THRESHOLD),
      magnitude: trunkLean.angle,
      affectsJoint: `${side}_shoulder`,
      clinicalNote: 'Patient leaning trunk to compensate for limited shoulder mobility',
    };
  }

  // ... similar create methods for other patterns
}
```

**Tasks:**

- [ ] Create `CompensationDetector` class
- [ ] Implement `detectTrunkLean()`
- [ ] Implement `detectElbowCompensation()`
- [ ] Implement `detectShoulderHiking()`
- [ ] Implement `detectTrunkRotation()`
- [ ] Add severity categorization
- [ ] Write 20+ unit tests
- [ ] Test with synthetic compensation data

---

### 10.1.2: Compensation Pattern Visualization

**File:** `src/components/biomechanics/CompensationOverlay.tsx` (NEW)

```typescript
/**
 * Visual overlay showing detected compensations
 * Helps patients understand what they're doing wrong
 */
export const CompensationOverlay: React.FC<{
  compensations: CompensationPattern[];
  landmarks: PoseLandmark[];
}> = ({ compensations, landmarks }) => {
  return (
    <View style={styles.overlay}>
      {compensations.map((comp, idx) => (
        <CompensationWarning key={idx} pattern={comp} />
      ))}
    </View>
  );
};
```

**Tasks:**

- [ ] Create visual overlay component
- [ ] Add animated indicators for compensations
- [ ] Show severity with color coding
- [ ] Test on various screen sizes

---

## 🚪 Phase 2: Clinical Joint Measurement Service (Days 4-7)

### 10.2.1: Core Service Implementation

**File:** `src/services/biomechanics/ClinicalJointMeasurementService.ts` (NEW)

```typescript
/**
 * Clinical-grade joint measurement with anatomical context
 * Implements primary/secondary joint architecture
 */
export class ClinicalJointMeasurementService {
  private refService: AnatomicalReferenceService;
  private compensationDetector: CompensationDetector;

  constructor() {
    this.refService = new AnatomicalReferenceService();
    this.compensationDetector = new CompensationDetector();
  }

  /**
   * Measure shoulder ROM with full anatomical context
   */
  measureShoulderROM(
    landmarks: PoseLandmark[],
    side: 'left' | 'right',
    movement: 'flexion' | 'abduction' | 'external_rotation',
    previousFrames?: PoseLandmark[][]
  ): ClinicalJointMeasurement {
    // 1. Calculate reference frames
    const globalFrame = this.refService.calculateGlobalFrame(landmarks);
    const thoraxFrame = this.refService.calculateThoraxFrame(landmarks, globalFrame);
    const humerusFrame = this.refService.calculateHumerusFrame(
      landmarks,
      side,
      thoraxFrame
    );
    const scapularPlane = this.refService.calculateScapularPlane(thoraxFrame);

    // 2. Get landmarks
    const shoulderIdx = side === 'left' ? 5 : 6;
    const elbowIdx = side === 'left' ? 7 : 8;
    const wristIdx = side === 'left' ? 9 : 10;

    const shoulder = landmarks[shoulderIdx];
    const elbow = landmarks[elbowIdx];
    const wrist = landmarks[wristIdx];

    // 3. Calculate primary joint angle in appropriate plane
    let primaryAngle: number;
    let measurementPlane: AnatomicalPlane;

    switch (movement) {
      case 'flexion':
        // Measure in sagittal plane
        measurementPlane = {
          name: 'sagittal',
          normal: thoraxFrame.zAxis,
          point: thoraxFrame.origin,
        };
        primaryAngle = this.calculateAngleInPlane(
          humerusFrame.yAxis,
          thoraxFrame.yAxis,
          measurementPlane
        );
        break;

      case 'abduction':
        // Measure in scapular plane (30° anterior to coronal)
        measurementPlane = scapularPlane;
        primaryAngle = this.calculateAngleInPlane(
          humerusFrame.yAxis,
          thoraxFrame.yAxis,
          measurementPlane
        );
        break;

      case 'external_rotation':
        // Measure forearm rotation with elbow at 90°
        const forearmVector = normalize(subtract3D(wrist, elbow));
        measurementPlane = {
          name: 'transverse',
          normal: thoraxFrame.yAxis,
          point: { x: elbow.x, y: elbow.y, z: elbow.z || 0 },
        };
        primaryAngle = this.calculateAngleInPlane(
          forearmVector,
          thoraxFrame.xAxis,
          measurementPlane
        );
        break;
    }

    // 4. Calculate secondary joint angles for context
    const secondaryJoints = this.measureSecondaryJoints(
      landmarks,
      side,
      movement,
      thoraxFrame,
      globalFrame
    );

    // 5. Estimate scapulohumeral rhythm (if abduction/flexion)
    let components: ShoulderComponents | undefined;
    if (movement === 'abduction' || movement === 'flexion') {
      components = this.estimateScapulohumeralRhythm(
        landmarks,
        side,
        primaryAngle,
        thoraxFrame
      );
    }

    // 6. Detect compensation patterns
    const compensations = this.compensationDetector.detectPatterns(
      landmarks,
      side,
      movement,
      secondaryJoints,
      previousFrames
    );

    // 7. Assess quality
    const quality = this.assessMeasurementQuality(
      landmarks,
      [shoulder, elbow, wrist],
      thoraxFrame,
      compensations
    );

    return {
      primaryJoint: {
        name: `${side}_shoulder`,
        type: 'shoulder',
        angle: primaryAngle,
        angleType: movement,
        components,
      },
      secondaryJoints,
      referenceFrames: {
        global: globalFrame,
        local: humerusFrame,
        measurementPlane,
      },
      compensations,
      quality,
    };
  }

  /**
   * Measure secondary joints for context and compensation detection
   */
  private measureSecondaryJoints(
    landmarks: PoseLandmark[],
    side: 'left' | 'right',
    movement: string,
    thoraxFrame: AnatomicalReferenceFrame,
    globalFrame: AnatomicalReferenceFrame
  ): Record<string, SecondaryJointData> {
    const secondaryJoints: Record<string, SecondaryJointData> = {};

    // Elbow flexion (should be straight for shoulder ROM)
    const shoulderIdx = side === 'left' ? 5 : 6;
    const elbowIdx = side === 'left' ? 7 : 8;
    const wristIdx = side === 'left' ? 9 : 10;

    const elbowAngle = this.calculate3DAngle(
      landmarks[shoulderIdx],
      landmarks[elbowIdx],
      landmarks[wristIdx]
    );

    secondaryJoints[`${side}_elbow`] = {
      angle: elbowAngle,
      purpose: 'validation',
      deviation: Math.abs(elbowAngle - 180),
      warning:
        elbowAngle < 160
          ? 'Elbow should be straight for accurate shoulder ROM'
          : undefined,
    };

    // Trunk lean
    const trunkLateralAngle = this.calculateAngleBetweenVectors(
      thoraxFrame.yAxis,
      globalFrame.yAxis
    );

    secondaryJoints.trunk_lean = {
      angle: trunkLateralAngle,
      purpose: 'compensation_check',
      deviation: trunkLateralAngle,
      warning:
        trunkLateralAngle > 10
          ? 'Excessive trunk lean compensating for limited ROM'
          : undefined,
    };

    // Contralateral shoulder elevation
    const contralateralSide = side === 'left' ? 'right' : 'left';
    const contralateralShoulderIdx = contralateralSide === 'left' ? 5 : 6;
    const contralateralShoulder = landmarks[contralateralShoulderIdx];

    const shoulderHeightDiff = Math.abs(
      landmarks[shoulderIdx].y - contralateralShoulder.y
    );

    secondaryJoints[`${contralateralSide}_shoulder_elevation`] = {
      angle: shoulderHeightDiff * 100,
      purpose: 'compensation_check',
      deviation: shoulderHeightDiff * 100,
      warning:
        shoulderHeightDiff > 0.05 ? 'Contralateral shoulder hiking detected' : undefined,
    };

    return secondaryJoints;
  }

  /**
   * Estimate scapulohumeral rhythm (glenohumeral vs scapulothoracic)
   * Research shows 2.86:1 to 3.13:1 ratio
   */
  private estimateScapulohumeralRhythm(
    landmarks: PoseLandmark[],
    side: 'left' | 'right',
    totalElevation: number,
    thoraxFrame: AnatomicalReferenceFrame
  ): ShoulderComponents {
    // MoveNet 17-pt doesn't have scapular landmarks
    // Use approximation based on shoulder elevation pattern

    // Simplified: 75% glenohumeral, 25% scapular
    const scapularContribution = totalElevation * 0.25;
    const glenohumeralContribution = totalElevation * 0.75;
    const ratio = glenohumeralContribution / (scapularContribution || 1);

    return {
      glenohumeral: glenohumeralContribution,
      scapulothoracic: scapularContribution,
      ratio: ratio,
    };
  }

  private calculateAngleInPlane(
    vector1: Vector3D,
    vector2: Vector3D,
    plane: AnatomicalPlane
  ): number {
    const v1Projected = projectVectorOntoPlane(vector1, plane.normal);
    const v2Projected = projectVectorOntoPlane(vector2, plane.normal);
    return angleBetweenVectors(v1Projected, v2Projected);
  }

  private calculate3DAngle(p1: PoseLandmark, p2: PoseLandmark, p3: PoseLandmark): number {
    const v1 = subtract3D(p1, p2);
    const v2 = subtract3D(p3, p2);
    return angleBetweenVectors(v1, v2);
  }

  private calculateAngleBetweenVectors(v1: Vector3D, v2: Vector3D): number {
    return angleBetweenVectors(v1, v2);
  }

  private assessMeasurementQuality(
    allLandmarks: PoseLandmark[],
    primaryLandmarks: PoseLandmark[],
    frame: AnatomicalReferenceFrame,
    compensations: CompensationPattern[]
  ): MeasurementQuality {
    const landmarkVisibility =
      primaryLandmarks.reduce((sum, lm) => sum + lm.visibility, 0) /
      primaryLandmarks.length;

    const depthReliability = primaryLandmarks.every((lm) => lm.z !== undefined)
      ? 0.8
      : 0.5;

    const frameStability = frame.confidence;

    // Penalize quality if significant compensations detected
    const compensationPenalty =
      compensations.filter((c) => c.severity === 'moderate' || c.severity === 'severe')
        .length * 0.1;

    const overall =
      (landmarkVisibility + depthReliability + frameStability) / 3 - compensationPenalty;

    return {
      depthReliability,
      landmarkVisibility,
      frameStability,
      overall:
        overall >= 0.8
          ? 'excellent'
          : overall >= 0.6
            ? 'good'
            : overall >= 0.4
              ? 'fair'
              : 'poor',
    };
  }
}
```

**Tasks:**

- [ ] Implement `ClinicalJointMeasurementService` class
- [ ] Add `measureShoulderROM()`
- [ ] Add `measureElbowROM()` (similar pattern)
- [ ] Add `measureKneeROM()` (similar pattern)
- [ ] Implement `measureSecondaryJoints()`
- [ ] Implement `estimateScapulohumeralRhythm()`
- [ ] Write 30+ unit tests
- [ ] Test with real patient videos

---

## 🚪 Phase 3: Joint Analysis Configuration (Days 8-9)

### 10.3.1: Joint Config System

**File:** `src/constants/joints.ts` (NEW - as provided by user)

```typescript
export type JointAnalysisKey = 'shoulder' | 'elbow' | 'knee';

export interface JointAnalysisConfig {
  id: JointAnalysisKey;
  label: string;
  angles: string[];
  primaryPlane: string;
  referenceChain: string[];
  description: string;
  guidance: string;
}

export const JOINT_ANALYSIS_CONFIGS: JointAnalysisConfig[] = [
  {
    id: 'shoulder',
    label: 'Shoulder',
    angles: ['leftShoulder', 'rightShoulder'],
    primaryPlane: 'Frontal + Sagittal (multi-angle)',
    referenceChain: [
      'Thoracic spine alignment',
      'Scapula tracking relative to rib cage',
      'Glenohumeral joint center',
      'Forearm axis (for rotation cues)',
    ],
    description:
      'Use frontal views for abduction/adduction and sagittal views for flexion/extension...',
    guidance: 'Keep the elbow visible to distinguish rotation from unwanted hiking...',
  },
  // ... elbow, knee configs
];

export const JOINT_ANALYSIS_MAP: Record<JointAnalysisKey, JointAnalysisConfig> =
  JOINT_ANALYSIS_CONFIGS.reduce(
    (acc, config) => ({ ...acc, [config.id]: config }),
    {} as Record<JointAnalysisKey, JointAnalysisConfig>
  );
```

**Tasks:**

- [ ] Create `src/constants/joints.ts`
- [ ] Define configs for shoulder, elbow, knee
- [ ] Document reference chains
- [ ] Add clinical guidance for each

---

### 10.3.2: Joint Selector UI

**File:** `src/components/biomechanics/JointSelector.tsx` (NEW)

```typescript
export const JointSelector: React.FC<{
  selectedJoint: JointAnalysisKey;
  onSelect: (joint: JointAnalysisKey) => void;
}> = ({ selectedJoint, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Primary Joint:</Text>
      <View style={styles.buttons}>
        {JOINT_ANALYSIS_CONFIGS.map((config) => (
          <TouchableOpacity
            key={config.id}
            style={[
              styles.button,
              selectedJoint === config.id && styles.selectedButton
            ]}
            onPress={() => onSelect(config.id)}
          >
            <Text style={styles.buttonText}>{config.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Show reference chain for selected joint */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Anatomical Reference Chain:</Text>
        {JOINT_ANALYSIS_MAP[selectedJoint].referenceChain.map((item) => (
          <Text key={item} style={styles.infoItem}>• {item}</Text>
        ))}
      </View>
    </View>
  );
};
```

**Tasks:**

- [ ] Create joint selector component
- [ ] Show anatomical reference chain
- [ ] Display clinical guidance
- [ ] Add visual joint diagram (optional)

---

## 🚪 Phase 4: Integration & Refactoring (Days 10-12)

### 10.4.1: Refactor ShoulderROMTracker

**File:** `src/features/shoulderAnalytics/ShoulderROMTracker.ts` (REFACTOR)

```typescript
// BEFORE (2D, no context)
export class ShoulderROMTracker {
  trackFrame(landmarks: PoseLandmark[], ...): ShoulderROMResult {
    const currentAngle = calculateShoulderAngle(landmarks, ...);
    // ...
  }
}

// AFTER (3D, with context)
export class ShoulderROMTracker {
  private clinicalService: ClinicalJointMeasurementService;

  constructor() {
    this.clinicalService = new ClinicalJointMeasurementService();
  }

  trackFrame(
    landmarks: PoseLandmark[],
    timestamp: number,
    averageConfidence: number,
    previousFrames?: PoseLandmark[][]
  ): ShoulderROMResult {
    // Use clinical service for measurement
    const measurement = this.clinicalService.measureShoulderROM(
      landmarks,
      this.side,
      this.movement,
      previousFrames
    );

    // Convert to ShoulderROMResult format
    return {
      movement: this.movement,
      side: this.side,
      cameraAngle: this.cameraAngle,
      currentAngle: measurement.primaryJoint.angle,
      maxAngle: this.updateMaxAngle(measurement.primaryJoint.angle),
      clinicalStandard: this.getClinicalStandard(this.movement),
      populationMean: this.getPopulationMean(this.movement),
      percentOfStandard: (measurement.primaryJoint.angle / this.getClinicalStandard(this.movement)) * 100,
      measurementQuality: measurement.quality.overall,
      feedback: this.generateFeedback(measurement),
      notes: this.generateNotes(measurement.compensations),
      // NEW: Include compensation data
      compensations: measurement.compensations,
      secondaryJoints: measurement.secondaryJoints
    };
  }
}
```

**Tasks:**

- [ ] Refactor `ShoulderROMTracker` to use `ClinicalJointMeasurementService`
- [ ] Maintain backward compatibility with existing API
- [ ] Add compensation data to results
- [ ] Update all tests

---

### 10.4.2: Update UI to Show Compensations

**File:** `src/screens/web/WebPoseDetectionScreen.tsx` (ENHANCE)

```typescript
// Add compensation display
{exerciseMetrics.compensations && exerciseMetrics.compensations.length > 0 && (
  <View style={styles.compensationsContainer}>
    <Text style={styles.compensationsTitle}>⚠️ Compensations Detected</Text>
    {exerciseMetrics.compensations.map((comp, idx) => (
      <View key={idx} style={styles.compensationRow}>
        <Text style={styles.compensationType}>{comp.type}</Text>
        <Text style={[
          styles.compensationSeverity,
          { color: getSeverityColor(comp.severity) }
        ]}>
          {comp.severity}
        </Text>
        <Text style={styles.compensationNote}>{comp.clinicalNote}</Text>
      </View>
    ))}
  </View>
)}
```

**Tasks:**

- [ ] Add compensation display to UI
- [ ] Color-code by severity
- [ ] Show clinical notes
- [ ] Test on various screen sizes

---

## ✅ Definition of Done

### Functional Criteria

- [x] All tasks completed
- [ ] `CompensationDetector` detects trunk lean, rotation, shoulder hiking, elbow flexion
- [ ] `ClinicalJointMeasurementService` measures shoulder, elbow, knee with context
- [ ] Primary/secondary joint architecture implemented
- [ ] Compensations visible in UI with clinical notes
- [ ] Scapulohumeral rhythm estimated (rough, will improve with MediaPipe)

### Testing Criteria

- [ ] **Unit Tests:** 80+ new tests
  - [ ] CompensationDetector: 25 tests
  - [ ] ClinicalJointMeasurementService: 40 tests
  - [ ] JointSelector: 8 tests
  - [ ] Integration: 10 tests
- [ ] **Clinical Validation:**
  - [ ] Test with 15+ patient videos
  - [ ] Compare compensation detection vs. PT observations
  - [ ] Accuracy: ≥85% agreement with PT
- [ ] **Performance Tests:**
  - [ ] Compensation detection: <3ms per frame
  - [ ] Clinical measurement: <8ms per frame
  - [ ] No FPS impact in live mode

### Code Quality Criteria

- [ ] TypeScript strict mode
- [ ] All functions documented with research citations
- [ ] No breaking changes to existing API
- [ ] Feature flags for gradual rollout

### Documentation Criteria

- [ ] Primary/secondary joint architecture documented
- [ ] Compensation detection algorithms documented
- [ ] Clinical validation protocol written
- [ ] Migration guide for existing code

### Clinical Validation Criteria

- [ ] **Compensation Detection Accuracy:**
  - Trunk lean: ≥85% agreement with PT
  - Shoulder hiking: ≥80% agreement
  - Elbow flexion: ≥90% agreement
- [ ] **False Positive Rate:** ≤10%
- [ ] **Scapulohumeral Rhythm:** Within ±15% of research values

### Backward Compatibility

- [ ] All existing tests pass
- [ ] ShoulderROMTracker maintains same API surface
- [ ] Can toggle new features via config

---

## 🔬 Clinical Validation Protocol

### Test Dataset

1. **Controlled Compensation Videos** (10 videos)

   - Deliberately introduce trunk lean, hiking, etc.
   - Verify detection at various severities

2. **Real Patient Videos** (15 videos)

   - Mix of clean and compensated movements
   - PT annotations as ground truth

3. **Edge Cases** (5 videos)
   - Minimal compensations (threshold testing)
   - Multiple simultaneous compensations

### Success Metrics

- **Detection Accuracy:** ≥85% vs. PT observations
- **False Positive Rate:** ≤10%
- **Severity Grading:** ≥75% agreement on severity level

---

## 📦 Deliverables

1. **Code:**

   - `src/services/biomechanics/CompensationDetector.ts`
   - `src/services/biomechanics/ClinicalJointMeasurementService.ts`
   - `src/constants/joints.ts`
   - `src/components/biomechanics/JointSelector.tsx`
   - `src/components/biomechanics/CompensationOverlay.tsx`
   - Refactored `src/features/shoulderAnalytics/ShoulderROMTracker.ts`

2. **Tests:**

   - 80+ unit tests
   - 10+ integration tests
   - Clinical validation test suite

3. **Documentation:**
   - Primary/secondary joint architecture
   - Compensation detection algorithms
   - Clinical validation report

---

## 🚦 Gate Status

**STATUS:** ⏳ AWAITING GATE 9 COMPLETION

**Dependencies:**

- Gate 9 ✅ (3D Anatomical Reference Frames)

**Sign-Off:**

- [ ] Developer: ********\_******** Date: **\_\_\_**
- [ ] QA: **********\_\_\_\_********** Date: **\_\_\_**
- [ ] Clinical Advisor: ****\_\_\_**** Date: **\_\_\_**

---

## 🔄 Next Steps After Gate 10

**Gate 11:** MediaPipe 33-pt Upgrade

- Replace scapulohumeral rhythm estimation with true scapular tracking
- Add spine segmentation for internal rotation grading
- Measure true scapulothoracic motion
- Detect scapular winging
- Improve compensation detection accuracy to 95%+

**Gate 12:** Multi-Angle Capture Workflow

- Prompt user for frontal, sagittal, posterior views
- Auto-select measurement plane based on view
- Fuse multiple views for 3D reconstruction
- Grade internal rotation with spine level references
