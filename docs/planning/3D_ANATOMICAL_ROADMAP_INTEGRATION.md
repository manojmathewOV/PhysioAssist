# 3D Anatomical Reference Frame Implementation Roadmap

## Integration with Existing Gated Development Plan

> **Status:** Design Complete, Ready for Implementation
> **Timeline:** Gates 9-12 (30-40 days total)
> **Research Basis:** ISB standards, 2024 biomechanics research, clinical validation studies

---

## 🎯 Executive Summary

This document integrates **3D anatomical reference frame measurement** into the existing PhysioAssist gated development plan, creating a clear path from the current 2D MoveNet-based system to a clinical-grade 3D measurement platform.

### Current State (Gates 0-8 ✅ COMPLETE)

**What Works:**

- ✅ MoveNet 17-point pose detection
- ✅ 2D shoulder ROM tracking
- ✅ Basic compensation detection (hiking, trunk lean)
- ✅ Video comparison with reference clips

**What's Missing:**

- ❌ 3D anatomical reference frames (global, thorax, humerus)
- ❌ Measurement in anatomical planes (sagittal, coronal, scapular)
- ❌ Primary/secondary joint architecture
- ❌ Comprehensive compensation detection
- ❌ Scapulohumeral rhythm measurement
- ❌ Depth perception (all z-values forced to 0)

---

## 📊 Research Foundation

### Key Findings from 2024 Research

1. **ISB Coordinate Systems** (International Society of Biomechanics)

   - Standard axes: X-anterior, Y-superior, Z-lateral
   - Enables cross-study comparison
   - Clinical validation requirements

2. **RGB-D Depth Estimation**

   - Azure Kinect/RealSense proven for clinical ROM
   - Mobile LiDAR sensors (iPhone 12+) provide depth
   - Accuracy comparable to marker-based systems

3. **Scapulohumeral Rhythm**

   - Research shows 2.86:1 to 3.13:1 ratio (not 2:1)
   - Requires dynamic tracking of glenohumeral + scapulothoracic
   - MoveNet can approximate, MediaPipe can measure directly

4. **Compensation Pattern Detection**
   - ML models achieve 98.1% F1-score
   - Rule-based detection can rival ML with proper reference frames
   - Trunk lean, rotation, shoulder hiking are key patterns

---

## 🗺️ Complete Gate Sequence

### Completed Gates (✅)

- **Gate 0:** Project Setup & Validation
- **Gate 1:** Core Infrastructure
- **Gate 2:** YouTube Service Import Fix
- **Gate 3:** Audio Feedback Cleanup
- **Gate 5:** Telemetry & Privacy
- **Gate 7:** Shoulder ROM Integration
- **Gate 8:** Video Comparison Feature

### New Gates (⏳ This Roadmap)

- **Gate 9:** 3D Anatomical Reference Frames (8-10 days)
- **Gate 10:** Clinical Joint Measurement Service (10-12 days)
- **Gate 11:** MediaPipe 33-pt Upgrade (10-14 days) - EXISTING, ENHANCED
- **Gate 12:** Multi-Angle Capture Workflow (8-10 days) - NEW

---

## 🚪 Gate 9: 3D Anatomical Reference Frames

**Duration:** 8-10 days
**Prerequisites:** Gates 0-8 ✅
**Deliverables:** ISB-compliant reference frame calculations

### Core Components

1. **Type Definitions** (`src/types/biomechanics.ts`)

   - `AnatomicalReferenceFrame`
   - `AnatomicalPlane`
   - `ClinicalJointMeasurement`
   - `CompensationPattern`

2. **Vector Math Utilities** (`src/utils/vectorMath.ts`)

   - `midpoint3D()`, `subtract3D()`, `normalize()`
   - `crossProduct()`, `dotProduct()`, `magnitude()`
   - `angleBetweenVectors()`, `projectVectorOntoPlane()`

3. **Reference Frame Service** (`src/services/biomechanics/AnatomicalReferenceService.ts`)

   - `calculateGlobalFrame()` - world coordinates
   - `calculateThoraxFrame()` - trunk reference
   - `calculateScapularPlane()` - 30-40° anterior to coronal
   - `calculateHumerusFrame()` - upper arm reference

4. **Enhanced Goniometer**

   - Enable `use3D: true` by default
   - Add `calculateAngleInPlane()` method
   - Support plane-aware measurements

5. **Depth Handling**
   - Populate z-depth from pose model
   - Fallback depth estimation from 2D landmarks
   - Add `hasDepth` metadata to frames

### Success Criteria

- ✅ All reference frames calculate correctly
- ✅ 3D angle measurements within ±5° of clinical goniometer
- ✅ 60+ unit tests passing
- ✅ No performance degradation (<5ms per frame)

**📄 Full Specification:** [GATE_9_3D_ANATOMICAL_REFERENCE_FRAMES.md](../gates/GATE_9_3D_ANATOMICAL_REFERENCE_FRAMES.md)

---

## 🚪 Gate 10: Clinical Joint Measurement Service

**Duration:** 10-12 days
**Prerequisites:** Gate 9 ✅
**Deliverables:** Primary/secondary joint architecture, compensation detection

### Core Components

1. **Compensation Detector** (`src/services/biomechanics/CompensationDetector.ts`)

   - Trunk lean detection (threshold: 10°)
   - Trunk rotation detection (threshold: 15°)
   - Shoulder hiking detection (threshold: 0.05 normalized)
   - Elbow flexion compensation (threshold: 160°)
   - Severity categorization (minimal, mild, moderate, severe)

2. **Clinical Joint Service** (`src/services/biomechanics/ClinicalJointMeasurementService.ts`)

   - `measureShoulderROM()` - with scapular plane measurement
   - `measureElbowROM()` - sagittal plane
   - `measureKneeROM()` - sagittal plane
   - Primary/secondary joint tracking
   - Scapulohumeral rhythm estimation

3. **Joint Configuration** (`src/constants/joints.ts`)

   - Shoulder, elbow, knee configs
   - Anatomical reference chains
   - Clinical guidance per joint

4. **UI Components**
   - `JointSelector.tsx` - choose primary joint
   - `CompensationOverlay.tsx` - show detected compensations
   - Visual severity indicators

### Primary/Secondary Joint Example

```typescript
// Measuring left shoulder abduction
PRIMARY JOINT:    Left shoulder (target measurement)
SECONDARY JOINTS:
  ├── Left elbow (validation: should be ~180° extended)
  ├── Trunk (compensation check: lean ≤10°)
  ├── Right shoulder (compensation check: no hiking)
  └── Spine (reference: vertical axis)
```

### Success Criteria

- ✅ Compensation detection ≥85% agreement with PT observations
- ✅ False positive rate ≤10%
- ✅ Scapulohumeral rhythm within ±15% of research values
- ✅ 80+ unit tests passing

**📄 Full Specification:** [GATE_10_CLINICAL_JOINT_MEASUREMENT.md](../gates/GATE_10_CLINICAL_JOINT_MEASUREMENT.md)

---

## 🚪 Gate 11: MediaPipe 33-pt Upgrade (ENHANCED)

**Duration:** 10-14 days
**Prerequisites:** Gates 9-10 ✅
**Deliverables:** True scapular tracking, spine segmentation

### Enhancements Over Original Plan

**Original Gate 11 Focus:**

- Add MediaPipe Pose 33-point model
- Backward compatibility with MoveNet

**Enhanced Gate 11 (builds on Gates 9-10):**

- ✅ All original features
- ✅ **True scapular tracking** (not estimated)
  - Direct measurement of scapular upward rotation
  - Scapular winging detection
- ✅ **Spine segmentation** (C7, T8, L2, L5, sacrum)
  - Internal rotation grading by spine level
  - Improved trunk reference frames
- ✅ **Scapulohumeral rhythm** measured (not estimated)
  - Ratio: 2.86:1 to 3.13:1 validation
- ✅ **Hand landmarks** (thumb, fingers)
  - Precise internal rotation measurement (hand-behind-back)

### MediaPipe 33-Point Landmark Map

```typescript
const MEDIAPIPE_LANDMARKS = {
  // Existing 17 (MoveNet compatible)
  0-16: [standard landmarks],

  // NEW: Scapular tracking (17-23)
  17: 'left_scapular_spine',
  18: 'right_scapular_spine',
  19: 'left_scapular_inferior_angle',
  20: 'right_scapular_inferior_angle',

  // NEW: Spine segmentation (21-26)
  21: 'cervical_c7',
  22: 'thoracic_t8',
  23: 'lumbar_l2',
  24: 'lumbar_l5',
  25: 'sacrum',

  // NEW: Hand tracking (27-32)
  26: 'left_thumb',
  27: 'right_thumb',
  28: 'left_index_finger',
  29: 'right_index_finger',
  30: 'left_pinky',
  31: 'right_pinky'
};
```

### Backward Compatibility

```typescript
// Feature detection
const FEATURES = {
  scapularTracking: model === 'mediapipe-33',
  spineSegmentation: model === 'mediapipe-33',
  handTracking: model === 'mediapipe-33',
  advancedInternalRotation: model === 'mediapipe-33',
};

// Graceful degradation
if (FEATURES.scapularTracking) {
  // Use true scapular landmarks
} else {
  // Fall back to Gate 10 estimation
}
```

### Success Criteria

- ✅ MediaPipe model integrated without breaking MoveNet
- ✅ Scapulohumeral rhythm accuracy ±5% of research values
- ✅ Internal rotation grading by spine level
- ✅ Scapular winging detection functional
- ✅ All Gate 9-10 tests still pass with both models

**📄 Full Specification:** [GATE_11_MEDIAPIPE_UPGRADE.md](../gates/GATE_11_MEDIAPIPE_UPGRADE.md) (ENHANCED)

---

## 🚪 Gate 12: Multi-Angle Capture Workflow (NEW)

**Duration:** 8-10 days
**Prerequisites:** Gates 9-11 ✅
**Deliverables:** Guided multi-view capture, view-aware measurement

### Motivation

Different movements require different camera angles:

- **Shoulder Flexion:** Sagittal (side) view
- **Shoulder Abduction:** Frontal view
- **Shoulder External Rotation:** Frontal view, elbow at 90°
- **Shoulder Internal Rotation:** Posterior (back) view

### Core Components

1. **Capture Context Metadata**

   ```typescript
   interface ProcessedPoseData {
     landmarks: PoseLandmark[];
     timestamp: number;
     confidence: number;

     // NEW in Gate 12
     viewOrientation: 'frontal' | 'sagittal' | 'posterior';
     cameraAzimuth?: number; // degrees from frontal
     captureInstructions?: string;
   }
   ```

2. **View-Aware Measurement Router**

   ```typescript
   class MultiAngleMeasurementService {
     measure(
       landmarks: PoseLandmark[],
       viewOrientation: ViewOrientation,
       targetMovement: Movement
     ): ClinicalJointMeasurement {
       // Route to correct measurement based on view
       if (targetMovement === 'flexion' && viewOrientation === 'sagittal') {
         return this.measureInSagittalPlane(landmarks);
       }
       // ...
     }
   }
   ```

3. **Guided Capture UI**

   - Prompt user for specific camera angles
   - Show visual guide (diagram/video)
   - Validate camera position before capture
   - Store view orientation with each clip

4. **View Fusion** (advanced, optional)
   - Combine frontal + sagittal for 3D reconstruction
   - Triangulate depth from multiple views
   - Improve z-depth accuracy

### Success Criteria

- ✅ UI guides user to correct camera angle
- ✅ View orientation detected automatically (optional)
- ✅ Measurements route to correct plane based on view
- ✅ Internal rotation uses posterior view with spine levels
- ✅ User experience smooth and intuitive

---

## 📈 Implementation Timeline

### Phase 1: Foundation (Gates 9-10) - 18-22 days

```
Week 1-2: Gate 9 (3D Reference Frames)
  ├── Days 1-2: Type definitions & vector math
  ├── Days 3-4: Reference frame service
  ├── Days 5-6: Enhanced goniometer
  └── Days 7-10: Depth handling, testing, validation

Week 3-4: Gate 10 (Clinical Joint Service)
  ├── Days 1-3: Compensation detector
  ├── Days 4-7: Clinical joint measurement service
  ├── Days 8-9: Joint configuration & UI
  └── Days 10-12: Integration, testing, validation
```

### Phase 2: Enhancement (Gates 11-12) - 18-24 days

```
Week 5-6: Gate 11 (MediaPipe Upgrade)
  ├── Days 1-3: MediaPipe integration
  ├── Days 4-6: Scapular tracking
  ├── Days 7-9: Spine segmentation
  └── Days 10-14: Testing, validation, backward compatibility

Week 7-8: Gate 12 (Multi-Angle Capture)
  ├── Days 1-3: Capture context metadata
  ├── Days 4-6: View-aware measurement
  ├── Days 7-8: Guided capture UI
  └── Days 9-10: Testing, validation
```

**Total:** 36-46 days (7-9 weeks)

---

## 🎓 Developer Implementation Guide

### Getting Started

1. **Read Gate Specifications**

   - [Gate 9: 3D Reference Frames](../gates/GATE_9_3D_ANATOMICAL_REFERENCE_FRAMES.md)
   - [Gate 10: Clinical Joint Service](../gates/GATE_10_CLINICAL_JOINT_MEASUREMENT.md)
   - [Gate 11: MediaPipe Upgrade](../gates/GATE_11_MEDIAPIPE_UPGRADE.md)

2. **Set Up Development Environment**

   ```bash
   # Install dependencies
   npm install

   # Run existing tests (should pass)
   npm test

   # Verify MoveNet working
   npm run dev
   ```

3. **Create Feature Branch**

   ```bash
   git checkout -b feature/gate-9-3d-reference-frames
   ```

4. **Follow Gate 9 Tasks Sequentially**
   - Don't skip ahead
   - Complete all DoD criteria
   - Get sign-off before proceeding

### Code Style & Principles

**Elegance:**

- Small, composable functions
- Clear separation of concerns
- Reuse existing patterns

**Simplicity:**

- No over-engineering
- Leverage existing services
- Feature flags for gradual rollout

**Lightweight:**

- <5ms per frame for reference calculations
- No FPS degradation
- Mobile-first performance

**Accuracy:**

- ±5° accuracy vs. clinical goniometer
- Research-based thresholds
- Clinical validation required

### Testing Strategy

**Unit Tests:**

- 100% coverage for vector math
- Test all reference frame calculations
- Test compensation detection logic

**Integration Tests:**

- End-to-end: Pose → Frames → Angles → ROM
- Multi-joint scenarios
- Compensation scenarios

**Clinical Validation:**

- Compare vs. physical therapist measurements
- Test with real patient videos
- Document MAE, SD, ICC

---

## 📊 Success Metrics

### Technical Metrics

| Metric                     | Current | After Gate 9 | After Gate 10 | After Gate 11 |
| -------------------------- | ------- | ------------ | ------------- | ------------- |
| Measurement Accuracy (MAE) | ±15°    | ±5°          | ±4°           | ±3°           |
| Compensation Detection     | 60%     | 75%          | 85%           | 92%           |
| False Positive Rate        | 25%     | 15%          | 10%           | 5%            |
| Test Coverage              | 93.3%   | 95%          | 96%           | 97%           |
| FPS (live mode)            | 23.8    | 23.5         | 23.0          | 22.5          |

### Clinical Metrics

| Metric                        | Target      | Validation Method           |
| ----------------------------- | ----------- | --------------------------- |
| Inter-rater Reliability (ICC) | ≥0.90       | Compare vs. PT measurements |
| Scapulohumeral Rhythm         | 2.86-3.13:1 | Literature comparison       |
| ROM Accuracy                  | ±5°         | Goniometer comparison       |
| Compensation Agreement        | ≥85%        | PT observation agreement    |

---

## 🚀 Quick Start Checklist

**Before Starting Gate 9:**

- [ ] Read all gate specifications
- [ ] Review ISB coordinate system standards
- [ ] Study scapulohumeral rhythm research
- [ ] Understand existing codebase (Gates 0-8)
- [ ] Set up development environment
- [ ] Run baseline tests (all should pass)

**During Gate 9:**

- [ ] Create feature branch
- [ ] Follow tasks sequentially
- [ ] Write tests as you go (not after)
- [ ] Document all formulas with research citations
- [ ] Test performance after each phase
- [ ] Get code review before proceeding

**After Gate 9:**

- [ ] All DoD criteria met
- [ ] Clinical validation completed
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Get sign-off from QA + Clinical Advisor
- [ ] Merge to main
- [ ] Start Gate 10

---

## 📚 Research References

1. **ISB Standards:**

   - Wu et al. (2005) - ISB recommendation on joint coordinate systems
   - ISB.org/standards

2. **Scapulohumeral Rhythm:**

   - BMC Musculoskelet Disord (2020) - Normal shoulder ROM values
   - J Shoulder Elbow Surg (2011) - Internal rotation measurement

3. **Compensation Detection:**

   - PMC 11566680 (2024) - ML pose estimation for movement analysis
   - Achieved 98.1% F1-score for compensation patterns

4. **RGB-D Systems:**
   - Frontiers Bioeng (2025) - RGB-D sensors for shoulder ROM
   - Systematic review: validity and reliability

---

## 🎯 Final Notes

This roadmap transforms PhysioAssist from a 2D exercise tracker into a **clinical-grade 3D biomechanics measurement platform**.

**Key Strengths:**

- ✅ Builds incrementally on existing gates
- ✅ Backward compatible throughout
- ✅ Research-backed at every step
- ✅ Testable and validatable
- ✅ Production-ready design

**Developer Responsibility:**

- Follow gates sequentially (no skipping!)
- Write tests as you code
- Document with research citations
- Get clinical validation
- Maintain backward compatibility

**Questions?**

- Review gate specifications in `docs/gates/`
- Check research references
- Consult with clinical advisor
- Ask in team channel

**Let's build something amazing! 🚀**
