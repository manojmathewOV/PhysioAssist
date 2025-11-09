# Ultra-Detailed Kickstart Plan: Gates 9B.5 → 10C
## Clinical-Grade 3D Pose Measurement Integration

**Date**: 2025-11-09
**Session**: claude/gate-9b5-frame-caching-clinical-measurements-011CUxuDxCQkejygVoVfvHeU
**Status**: FRAMEWORK OUTLINE - To be completed section-by-section

---

## Document Purpose

This is a comprehensive, self-contained implementation plan for completing the 3D anatomical pose measurement system from frame caching through clinical-grade joint measurements. Designed to kickstart development in a new session with full context.

---

## TABLE OF CONTENTS

### PART 1: CONTEXT & FOUNDATION
1. [Executive Summary](#1-executive-summary)
2. [Research Findings Summary](#2-research-findings-summary)
3. [Current Codebase State](#3-current-codebase-state)
4. [Integration Architecture](#4-integration-architecture)

### PART 2: IMPLEMENTATION ROADMAP
5. [Gate 9B.5: Anatomical Frame Caching](#5-gate-9b5-anatomical-frame-caching)
6. [Gate 9B.6: Goniometer Refactor](#6-gate-9b6-goniometer-refactor)
7. [Gate 10A: Clinical Measurement Service](#7-gate-10a-clinical-measurement-service)
8. [Gate 10B: Compensation Detection](#8-gate-10b-compensation-detection)
9. [Gate 10C: Clinical Validation](#9-gate-10c-clinical-validation)

### PART 3: VALIDATION & TESTING
10. [Comprehensive Testing Strategy](#10-comprehensive-testing-strategy)
11. [Performance Benchmarking](#11-performance-benchmarking)
12. [Clinical Accuracy Validation](#12-clinical-accuracy-validation)

### PART 4: DEPLOYMENT
13. [Integration Checklist](#13-integration-checklist)
14. [Migration Guide](#14-migration-guide)
15. [Success Metrics](#15-success-metrics)

---

## SECTION COMPLETION STATUS

- [ ] Part 1: Context & Foundation
  - [ ] 1. Executive Summary
  - [ ] 2. Research Findings Summary
  - [ ] 3. Current Codebase State
  - [ ] 4. Integration Architecture

- [ ] Part 2: Implementation Roadmap
  - [ ] 5. Gate 9B.5: Anatomical Frame Caching
  - [ ] 6. Gate 9B.6: Goniometer Refactor
  - [ ] 7. Gate 10A: Clinical Measurement Service
  - [ ] 8. Gate 10B: Compensation Detection
  - [ ] 9. Gate 10C: Clinical Validation

- [ ] Part 3: Validation & Testing
  - [ ] 10. Comprehensive Testing Strategy
  - [ ] 11. Performance Benchmarking
  - [ ] 12. Clinical Accuracy Validation

- [ ] Part 4: Deployment
  - [ ] 13. Integration Checklist
  - [ ] 14. Migration Guide
  - [ ] 15. Success Metrics

---

## 1. EXECUTIVE SUMMARY

### 1.1 Vision

PhysioAssist aims to deliver **clinical-grade 3D joint range-of-motion (ROM) measurement** from 2D/3D pose estimation, enabling remote physiotherapy assessment with accuracy comparable to in-person goniometry. The system must:

- **Achieve ±5° accuracy** against physical goniometer measurements (clinical "good" threshold)
- **Support multi-schema ingestion** (MoveNet-17, MediaPipe-33) for maximum landmark fidelity
- **Provide multi-angle capture workflows** (frontal, sagittal, posterior views) for comprehensive assessment
- **Detect compensation patterns** (trunk lean, shoulder hiking, rotation) that invalidate measurements
- **Maintain <120ms/frame performance** on mid-range mobile devices for real-time feedback
- **Enable clinician validation loops** with confidence scores, quality metrics, and review dashboards

This transforms PhysioAssist from a 2D heuristic exercise tracker into a **schema-driven, orientation-aware, 3D-capable clinical measurement platform**.

---

### 1.2 Current State: Strong Foundation (Gates 9B.1-4 Complete)

**✅ What's Built:**

| Component | Status | Tests | Description |
|-----------|--------|-------|-------------|
| **PoseSchemaRegistry** | ✅ Complete | 26 | Pluggable schema support (MoveNet-17, MediaPipe-33) with landmark definitions and anatomical grouping |
| **PoseDetectionServiceV2** | ✅ Complete | 23 | Metadata threading: `schemaId`, `viewOrientation`, `qualityScore`, `hasDepth`, `cameraAzimuth` |
| **OrientationClassifier** | ✅ Complete | 27 | Frontal/sagittal/posterior detection via geometric heuristics + temporal smoothing (5-frame window) |
| **AnatomicalReferenceService** | ✅ Complete | 27 | ISB-compliant frame calculation (global, thorax, scapula, humerus, forearm, pelvis) + plane definitions |
| **Vector Math Utilities** | ✅ Complete | N/A | Optimized 3D vector operations: cross, dot, normalize, magnitude, angle, **plane projection** (<1ms) |
| **Type Definitions** | ✅ Complete | N/A | ISB-compliant `AnatomicalReferenceFrame`, `AnatomicalPlane`, `ClinicalJointMeasurement` types |

**Total Test Coverage**: 103 tests passing for foundation layer

**Key Achievement**: We have successfully implemented ISB (International Society of Biomechanics) standards-compliant coordinate systems with X-anterior, Y-superior, Z-lateral orientation, orthonormal frame validation, and confidence scoring.

---

### 1.3 The Integration Gap

**⚠️ What's Missing:**

Despite having all the right building blocks, we lack the **integration layer** that connects low-level primitives (frames, vectors, planes) to high-level clinical measurements:

1. **Frame Caching Not Implemented** (Gate 9B.5)
   - Reference frames are recalculated for every measurement
   - Performance impact: ~15-20ms overhead per multi-joint measurement
   - Target: LRU cache with 60-frame capacity, 16ms TTL, >80% hit rate

2. **Goniometer Not Schema-Aware** (Gate 9B.6)
   - Hardcoded to MoveNet-17 landmark indices
   - Cannot swap to MediaPipe-33 without code changes
   - Plane projection available but not systematically used
   - No Euler angle decomposition for shoulder (ISB Y-X-Y standard)

3. **Clinical Measurement Functions Missing** (Gate 10A)
   - No joint-specific measurement logic (flexion, abduction, rotation)
   - No integration with anatomical reference frames
   - No multi-angle capture coordination

4. **Compensation Detection Incomplete** (Gate 10B)
   - Types defined (`CompensationPattern`) but detection algorithms not implemented
   - Cannot distinguish true ROM from compensated movement

5. **No Clinical Validation** (Gate 10C)
   - No ground truth dataset (physical goniometer measurements)
   - No accuracy benchmarking (MAE, correlation)
   - No clinician sign-off process

**Root Cause**: This is expected and intentional—we followed a staged gate approach. Gates 9B.1-4 built the foundation; Gates 9B.5-10C complete the integration.

---

### 1.4 The Integration Architecture

Following the proven pattern from another developer's successful implementation:

> "Extended the pose data model with cached anatomical frames... Updated the GPU pose detector to pre-compute torso/pelvis frames for every processed clip... Rebuilt the goniometer around plane-projected, schema-aware joint definitions and fed the anatomical frames into exercise validation for higher precision ROM scoring."

**Three-Layer Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Clinical Measurement Service (Gate 10A-C)         │
│  - Joint-specific measurement functions                     │
│  - Compensation detection algorithms                        │
│  - Clinical thresholds & guidance                           │
│  - Quality assessment & confidence weighting                │
└─────────────────────────────────────────────────────────────┘
                           ↓ uses
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Goniometry Service (Gate 9B.6 - REFACTOR)        │
│  - Schema-aware joint configuration                         │
│  - Systematic plane projection                              │
│  - Euler angle decomposition (shoulder)                     │
│  - Temporal smoothing                                       │
│  - Consumes cached frames from Layer 1                      │
└─────────────────────────────────────────────────────────────┘
                           ↓ uses
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Foundation (Gates 9B.1-4 ✅ + 9B.5 ⏳)            │
│  - PoseSchemaRegistry (schema definitions)                  │
│  - AnatomicalReferenceService (ISB frames)                  │
│  - AnatomicalFrameCache (Gate 9B.5 - LRU + TTL)            │
│  - Vector math utilities (cross, dot, project)              │
│  - Orientation classifier                                   │
│  - Metadata threading (schemaId, viewOrientation, quality)  │
└─────────────────────────────────────────────────────────────┘
```

**Key Integration Point**: Extend `ProcessedPoseData` to include `cachedAnatomicalFrames` so downstream services receive pre-computed frames without redundant calculation.

---

### 1.5 Methodical Approach: Gate-by-Gate with Validation Checkpoints

**Sequential Implementation:**

| Gate | Objective | Effort | Tests | Validation Checkpoint |
|------|-----------|--------|-------|----------------------|
| **9B.5** | Anatomical frame caching (LRU + TTL) | 1-2 days | 20 | >80% cache hit rate, <16ms with cache, <1MB memory |
| **9B.6** | Goniometer refactor (schema-aware, plane projection, Euler angles) | 2-3 days | 15 | Works with MoveNet-17 & MediaPipe-33, all angles use projection |
| **10A** | Clinical measurement service (joint-specific functions) | 5-7 days | 50+ | ±10° accuracy on synthetic data, <20ms per measurement |
| **10B** | Compensation detection algorithms | 3-4 days | 25 | >80% sensitivity/specificity on labeled compensations |
| **10C** | Clinical validation (ground truth dataset) | 5-7 days | N/A | ±5° MAE vs physical goniometer, r > 0.90, clinician sign-off |

**Total Estimated Effort**: 16-23 days (3-5 sprints)

**Validation Strategy**: Each gate has a **mandatory validation checkpoint** before proceeding:
- **Unit tests** must achieve >90% coverage for new code
- **Integration tests** must validate cross-layer communication
- **Performance benchmarks** must meet budget (<120ms/frame cumulative)
- **Accuracy tests** must meet clinical thresholds (±5° final, ±10° intermediate)

**Fallback Strategy**: MoveNet-only 2D mode remains functional throughout for low-power devices.

---

### 1.6 Expected Outcomes

**Technical Deliverables:**

- ✅ **Frame caching**: >80% hit rate, <16ms cached lookups, <1MB memory footprint
- ✅ **Schema flexibility**: Swap between MoveNet-17 and MediaPipe-33 without downstream changes
- ✅ **Clinical measurements**: Shoulder (flexion, abduction, rotation), elbow, knee with ISB compliance
- ✅ **Compensation detection**: Trunk lean, rotation, shoulder hiking with severity grading
- ✅ **Performance**: End-to-end pipeline <120ms/frame on mid-range mobile (iPhone 12, Pixel 5)
- ✅ **Test coverage**: 110+ new tests (total ~215 tests for pose/biomechanics modules)

**Clinical Validation:**

- ✅ **Accuracy**: ±5° mean absolute error (MAE) vs physical goniometer
- ✅ **Correlation**: Pearson r > 0.90 for all primary joint measurements
- ✅ **Reliability**: Intraclass correlation coefficient (ICC) > 0.85 for test-retest
- ✅ **Clinician approval**: Advisory panel sign-off on measurement validity and compensation detection

**User Experience:**

- ✅ **Multi-angle capture**: UI prompts guide patients to required viewpoints (frontal, sagittal, posterior)
- ✅ **Real-time feedback**: Orientation guidance ("rotate camera to sagittal view") during capture
- ✅ **Confidence reporting**: Every measurement surfaces reliability score and frame quality
- ✅ **Clinician dashboards**: Review tools showing measurement distributions and low-confidence clips

**Business Impact:**

- ✅ **Competitive differentiation**: Research-grade ROM measurement in a telehealth platform
- ✅ **Clinical adoption**: Accuracy meets therapist requirements for remote assessment
- ✅ **Scalability**: Performance enables real-time guidance on consumer devices
- ✅ **Regulatory readiness**: ISB-compliant methodology supports clinical validation studies

---

### 1.7 Why This Plan Works

**Strengths:**

1. **No Duplication**: Comprehensive codebase audit confirms we're not reinventing existing functionality—we're completing intentional gaps in a staged architecture.

2. **ISB Standards Compliance**: All frame calculations follow Wu et al. 2005 biomechanics standards, ensuring clinical credibility.

3. **Research-Backed**: Web search validated that modern pose estimation achieves clinical accuracy (±2-5°) when proper projection methods are used—which we have.

4. **Performance-Conscious**: <120ms/frame budget allocation with caching as performance foundation.

5. **Incremental Validation**: Each gate has clear DoD and validation checkpoint before proceeding, reducing integration risk.

6. **Real-World Proven**: Architecture pattern follows successful implementation by another developer who achieved "higher precision ROM scoring."

**Risk Mitigation:**

- ✅ **Technical risk**: Foundation layer fully tested (103 tests passing)
- ✅ **Performance risk**: Frame caching (Gate 9B.5) addresses primary bottleneck
- ✅ **Accuracy risk**: ISB-compliant methods + clinical validation (Gate 10C) ensures measurement quality
- ✅ **Integration risk**: Three-layer architecture with clear interfaces prevents coupling
- ✅ **Adoption risk**: Fallback to 2D MoveNet mode maintains backward compatibility

---

**Next**: Section 2 will detail the research findings that inform this architecture (ISB standards, clinical accuracy benchmarks, projection methods).

---

## 2. RESEARCH FINDINGS SUMMARY

This section synthesizes web research conducted on 2025-11-09 to validate our architectural approach and inform implementation decisions.

---

### 2.1 Clinical Accuracy Benchmarks (2024-2025 Studies)

**Key Finding**: Modern pose estimation achieves clinical-grade accuracy when proper geometric methods are applied.

#### Published Accuracy Results

| Study | Method | Joint | Metric | Result | Clinical Grade |
|-------|--------|-------|--------|--------|----------------|
| Nature Scientific Reports 2025 | OpenPose | Hip-Knee-Ankle | Absolute Error | 1.579° | **Excellent** (±2°) |
| Nature Scientific Reports 2025 | OpenPose | Hip-Knee-Ankle | Correlation | ICC = 0.897 | Strong reliability |
| Auto Landmark Detection 2025 | Deep Learning (Custom) | Various | Absolute Error | 0.18° - 0.80° | **Research-grade** |
| Reliability Study 2023 | MediaPipe Pose | Hand ROM | Mean Difference | -2.21° ± 9.29° | **Good** (±5°) |
| EDS Physical Therapy Study 2023 | MoveNet-Thunder | Shoulder | Correlation | rho = 0.632 | Moderate |
| EDS Physical Therapy Study 2023 | MoveNet-Thunder | Knee | Correlation | rho = 0.608 | Moderate |

**Clinical Acceptance Thresholds** (consensus from literature):
- **Excellent**: ±2° error → Research-grade biomechanics labs
- **Good**: ±5° error → Clinical ROM assessment (our target)
- **Acceptable**: ±10° error → Telehealth screening, home monitoring

**Implication for PhysioAssist**: Achieving ±5° MAE is realistic and clinically meaningful. Studies show this requires:
1. Proper plane projection (not simple 3-point angles)
2. Anatomical reference frames (not raw pixel coordinates)
3. Confidence-based filtering (reject low-quality frames)

---

### 2.2 ISB Standards (Wu et al. 2005)

**Reference**: G. Wu et al., "ISB recommendation on definitions of joint coordinate systems of various joints for the reporting of human joint motion—Part II: shoulder, elbow, forearm and wrist," *Journal of Biomechanics* 38 (2005) 981–992.

#### Coordinate System Convention

The International Society of Biomechanics (ISB) standardized anatomical coordinate systems to enable cross-study comparison:

**Global Frame (World Coordinates)**:
- **X-axis**: Anterior (forward direction, toward front of body)
- **Y-axis**: Superior (upward direction, toward head)
- **Z-axis**: Lateral (right direction for right-handed system)
- **Handedness**: Right-handed (X × Y = Z)

**Local Frames (Segment Coordinates)**:
Each body segment (thorax, humerus, forearm) has its own coordinate system aligned with anatomical landmarks:

- **Thorax Frame**:
  - Origin: Midpoint between left/right shoulder landmarks
  - Y-axis: Upward along spine (shoulder → mid-hips)
  - X-axis: Forward perpendicular to torso plane
  - Z-axis: Right lateral (cross product Y × X)

- **Humerus Frame**:
  - Origin: Shoulder joint center (glenohumeral joint)
  - Y-axis: Along humerus shaft (shoulder → elbow)
  - X-axis: Forward (perpendicular to humerus plane)
  - Z-axis: Lateral (cross product)

**Our Implementation**: `AnatomicalReferenceService` follows ISB convention exactly:
```typescript
interface AnatomicalReferenceFrame {
  origin: Vector3D;
  xAxis: Vector3D;  // Anterior (ISB convention)
  yAxis: Vector3D;  // Superior
  zAxis: Vector3D;  // Lateral
  frameType: 'global' | 'thorax' | 'scapula' | 'humerus' | 'forearm';
  confidence: number;
}
```

✅ **Compliance Verified**: Our types and calculations are ISB-compliant.

---

#### Joint Angle Definitions (ISB Standard)

**Shoulder Joint** (Most Complex):
- **Rotation Sequence**: Y-X-Y Euler angles (humerus relative to thorax)
  - **Y₁ (first rotation)**: Plane of elevation (0° = sagittal plane, 90° = coronal plane)
  - **X (second rotation)**: Elevation angle (magnitude of flexion/abduction)
  - **Y₂ (third rotation)**: Axial rotation (internal/external rotation about humerus long axis)

**Why Euler Angles?** The shoulder has 3 degrees of freedom—simple 2D projection loses information. Euler decomposition captures:
1. Which plane the arm is moving in (sagittal vs coronal)
2. How high the arm is elevated
3. How much the humerus is rotating about its axis

**Elbow/Knee Joints** (Simpler):
- **Single-axis hinge joints**: Flexion/extension only
- **Calculation**: Project limb vectors onto sagittal plane, measure angle from extended position
- **ISB Standard**: 0° = full extension, 180° = full flexion

**Our Gap**: We don't currently implement Y-X-Y Euler decomposition for shoulder (Gate 9B.6 / 10A).

---

#### Anatomical Plane Definitions

| Plane | Normal Vector | Divides Body Into | Primary Movements |
|-------|--------------|-------------------|-------------------|
| **Sagittal** | Lateral (Z-axis) | Left / Right halves | Flexion, Extension |
| **Coronal (Frontal)** | Anterior (X-axis) | Front / Back halves | Abduction, Adduction |
| **Transverse (Horizontal)** | Superior (Y-axis) | Upper / Lower halves | Rotation |
| **Scapular** | 35° anterior to coronal | N/A | Shoulder abduction (functional) |

**Clinical Note**: The scapular plane (35° forward from pure coronal) is considered the most functional plane for shoulder abduction because it aligns with the scapula's natural orientation on the ribcage.

**Our Implementation**: `AnatomicalReferenceService.calculateScapularPlane()` implements the 35° rotation correctly.

---

#### Scapulohumeral Rhythm

**Clinical Principle**: During shoulder abduction, movement is distributed between:
- **Glenohumeral joint**: Humerus rotating relative to scapula
- **Scapulothoracic joint**: Scapula rotating/sliding on ribcage

**Normal Ratio**: 2:1 to 3:1 (for every 3° of total abduction, 2° is glenohumeral, 1° is scapulothoracic)

**Clinical Significance**:
- **Healthy shoulder**: Smooth 2:1 rhythm
- **Frozen shoulder**: Reduced glenohumeral contribution (patient "hikes" scapula to compensate)
- **Scapular dyskinesis**: Excessive scapular movement

**Implication for PhysioAssist**: We need to measure:
1. Total shoulder abduction (humerus angle from vertical in coronal/scapular plane)
2. Scapular upward rotation (tilt angle of line connecting left/right shoulders)
3. Ratio = glenohumeral / scapulothoracic

**Our Gap**: Scapulohumeral rhythm calculation not implemented (Gate 10A).

---

### 2.3 Pose Estimation Library Comparisons

**Key Finding**: No single library is best for all joints—accuracy varies by body region and camera angle.

#### Library Performance by Joint (EDS Study 2023)

| Library | Shoulder (rho) | Elbow (rho) | Hip (rho) | Knee (rho) | Overall Rank |
|---------|---------------|-------------|----------|-----------|-------------|
| **Detectron2** | 0.581 | **0.722** | 0.636 | 0.656 | 1st (elbow/hip) |
| **MoveNet-Thunder** | **0.632** | 0.649 | **0.665** | **0.608** | 1st (shoulder/knee) |
| **OpenPose** | 0.524 | 0.634 | 0.587 | 0.545 | 3rd |
| **PoseNet** | 0.491 | 0.512 | 0.523 | 0.498 | 4th |

(rho = Spearman correlation coefficient vs physical goniometer)

**Interpretation**:
- **MoveNet-Thunder**: Best for shoulder and knee (our primary joints) → Validate our MoveNet-17 choice
- **MediaPipe Pose**: Not in study, but 2023 hand ROM study showed ±9.29° SD → Good but variable
- **Library-specific strengths**: Vary by joint morphology and occlusion handling

**Implication for PhysioAssist**:
- ✅ MoveNet-17 is validated choice for shoulder/knee
- ✅ MediaPipe-33 adds depth + more landmarks (face, hands) for richer context
- ✅ Schema registry lets us A/B test which works best per joint

---

### 2.4 Projection Methods for Clinical Accuracy

**Critical Finding**: Calculating angles from raw 3D landmark coordinates without plane projection introduces **systematic errors** from camera perspective and body rotation.

#### Why Projection Matters

**Problem**: Simple 3-point angle calculation (law of cosines) measures the angle in 3D space, which varies with:
- Camera viewpoint (same elbow flexion looks different from front vs side)
- Body rotation (torso twist changes apparent shoulder angle)
- Depth estimation errors (z-coordinate noise propagates to angle)

**Solution**: Project joint vectors onto the **anatomical plane of movement** before calculating angle:

1. **Define the measurement plane** using anatomical reference frame (e.g., sagittal plane = thorax frame's YZ plane)
2. **Project limb vectors** onto that plane (removes out-of-plane components)
3. **Calculate angle** in 2D within the plane (consistent regardless of camera angle)

**Mathematical Method**:
```
Given:
  - Vector v (limb direction in 3D)
  - Plane normal n (perpendicular to measurement plane)

Projected vector:
  v_projected = v - (v · n) * n

Angle in plane:
  θ = atan2(v_projected · plane_y_axis, v_projected · plane_x_axis)
```

**Our Implementation**:
```typescript
// vectorMath.ts (COMPLETE ✅)
export function projectVectorOntoPlane(
  vector: Vector3D,
  planeNormal: Vector3D
): Vector3D {
  const dotProduct = vector.x * planeNormal.x +
                     vector.y * planeNormal.y +
                     vector.z * planeNormal.z;
  return {
    x: vector.x - dotProduct * planeNormal.x,
    y: vector.y - dotProduct * planeNormal.y,
    z: vector.z - dotProduct * planeNormal.z,
  };
}

// GoniometerService.ts (PARTIAL ⚠️)
private calculateAngleInPlane(
  vector1: Vector3D,
  vector2: Vector3D,
  planeNormal: Vector3D
): number {
  const proj1 = projectVectorOntoPlane(vector1, planeNormal);
  const proj2 = projectVectorOntoPlane(vector2, planeNormal);
  return angleBetweenVectors(proj1, proj2);
}
```

**Gap**: `calculateAngleInPlane()` exists but is **not systematically used** for all joint measurements. Some measurements still use direct 3D angles.

**Action Item (Gate 9B.6)**: Refactor all clinical measurements to use plane projection.

---

### 2.5 Euler Angle Requirements for Shoulder

**Why Simple Angles Fail for Shoulder**:

Unlike elbow/knee (1 degree of freedom), the shoulder has **3 degrees of freedom**:
1. **Elevation** (up/down)
2. **Plane of elevation** (forward/sideways/backward)
3. **Axial rotation** (internal/external rotation)

A single angle value cannot capture all three. Example:
- Arm raised 90° in sagittal plane (forward flexion) = 90° flexion, 0° abduction
- Arm raised 90° in coronal plane (abduction) = 0° flexion, 90° abduction
- Both are "90° elevation" but clinically distinct movements

**ISB Solution: Y-X-Y Euler Angle Sequence**

Decompose the 3D rotation matrix (humerus relative to thorax) into three sequential rotations:

1. **Y₁ rotation**: Rotate about thorax Y-axis (superior axis)
   - **Clinical meaning**: Plane of elevation angle
   - **Range**: 0° (sagittal) to 90° (coronal) to 180° (posterior)

2. **X rotation**: Rotate about intermediate X-axis
   - **Clinical meaning**: Elevation angle
   - **Range**: 0° (arm down) to 180° (arm overhead)

3. **Y₂ rotation**: Rotate about humerus Y-axis (long axis)
   - **Clinical meaning**: Axial rotation (internal/external)
   - **Range**: -90° (internal) to +90° (external)

**Mathematical Extraction from Rotation Matrix**:

Given rotation matrix `R_humerus_wrt_thorax`:
```
elevation = acos(R[1][1])
planeOfElevation = atan2(R[0][1], R[2][1])
rotation = atan2(R[1][0], -R[1][2])
```

(Handles gimbal lock edge case when elevation ≈ 0°)

**Our Gap**: No Euler angle calculation implemented.

**Action Item (Gate 9B.6)**: Add `calculateShoulderEulerAngles()` method to GoniometerService.

---

### 2.6 Summary of Research Implications

| Research Finding | Current Status | Action Required | Gate |
|------------------|----------------|-----------------|------|
| ±5° accuracy achievable | ⏳ Not validated | Implement clinical validation dataset | 10C |
| ISB coordinate systems required | ✅ Implemented | None (already compliant) | N/A |
| Plane projection essential | ⚠️ Partial | Systematically apply to all measurements | 9B.6 |
| Euler angles needed for shoulder | ❌ Missing | Implement Y-X-Y decomposition | 9B.6 |
| MoveNet-Thunder best for shoulder/knee | ✅ Using MoveNet-17 | Add MediaPipe-33 for depth + landmarks | 9B.5 |
| Scapulohumeral rhythm clinically important | ❌ Missing | Calculate glenohumeral vs scapulothoracic ratio | 10A |
| No single library best for all joints | ✅ Schema registry ready | Enable per-joint schema selection | 10A |

**Confidence Level**: Research validates our architectural decisions. The gaps are implementation (not design) issues that can be addressed sequentially through Gates 9B.6 → 10C.

---

**Next**: Section 3 will audit the current codebase state, cataloging what's implemented vs what's specified in the research.

---

## 3. CURRENT CODEBASE STATE

This section provides a comprehensive audit of the implemented codebase as of 2025-11-09, mapping code to requirements and identifying gaps.

---

### 3.1 Completed Components (Gates 9B.1-4 ✅)

#### Component Map

| Component | File Path | Lines | Tests | Status | Gate |
|-----------|-----------|-------|-------|--------|------|
| **PoseSchemaRegistry** | `src/services/pose/PoseSchemaRegistry.ts` | ~200 | 26 | ✅ Complete | 9B.1 |
| **PoseDetectionServiceV2** | `src/services/PoseDetectionService.v2.ts` | ~150 | 23 | ✅ Complete | 9B.2 |
| **OrientationClassifier** | `src/services/pose/OrientationClassifier.ts` | ~180 | 27 | ✅ Complete | 9B.3 |
| **AnatomicalReferenceService** | `src/services/biomechanics/AnatomicalReferenceService.ts` | 344 | 27 | ✅ Complete | 9B.4 |
| **Vector Math Utilities** | `src/utils/vectorMath.ts` | 199 | N/A | ✅ Complete | 9B.4 |
| **Biomechanics Types** | `src/types/biomechanics.ts` | 141 | N/A | ✅ Complete | 9B.4 |
| **Pose Types** | `src/types/pose.ts` | 130 | N/A | ✅ Complete | 9B.1 |

**Total**: 7 components, ~1,344 lines of implementation code, 103 tests passing

---

### 3.2 Type Definitions Audit

#### 3.2.1 Biomechanics Types (`src/types/biomechanics.ts`)

**ISB-Compliant Frame Definition:**
```typescript
export interface AnatomicalReferenceFrame {
  origin: Vector3D;           // Joint center or midpoint
  xAxis: Vector3D;            // Anterior direction (ISB standard)
  yAxis: Vector3D;            // Superior direction (ISB standard)
  zAxis: Vector3D;            // Lateral direction (ISB standard)
  frameType: 'global' | 'thorax' | 'scapula' | 'humerus' | 'forearm' | 'pelvis';
  confidence: number;         // 0-1 based on landmark visibility
}
```

✅ **Status**: Fully ISB-compliant (X-anterior, Y-superior, Z-lateral convention)

**Anatomical Plane Definition:**
```typescript
export interface AnatomicalPlane {
  name: 'sagittal' | 'coronal' | 'transverse' | 'scapular';
  normal: Vector3D;           // Unit vector perpendicular to plane
  point: Vector3D;            // Point on the plane (usually origin)
  rotation?: number;          // Optional rotation angle (for scapular plane: 35°)
}
```

✅ **Status**: Complete with scapular plane support

**Clinical Joint Measurement (Output Format):**
```typescript
export interface ClinicalJointMeasurement {
  primaryJoint: {
    name: string;                    // e.g., 'left_shoulder'
    type: JointType;                 // 'shoulder' | 'elbow' | 'knee' | etc.
    angle: number;                   // Measured angle in degrees
    angleType: AngleType;            // 'flexion' | 'abduction' | etc.
    components?: {                   // For complex joints (shoulder Euler angles)
      planeOfElevation?: number;
      elevation?: number;
      rotation?: number;
    };
    range?: {                        // Min/max observed during movement
      min: number;
      max: number;
      rangeOfMotion: number;
    };
  };
  secondaryJoints: Record<string, {  // Context joints (e.g., elbow during shoulder rotation)
    angle: number;
    withinTolerance: boolean;
    tolerance: number;
  }>;
  referenceFrames: {
    global: AnatomicalReferenceFrame;
    local: AnatomicalReferenceFrame;
    measurementPlane: AnatomicalPlane;
  };
  compensations: CompensationPattern[];
  quality: MeasurementQuality;
  timestamp: number;
}
```

⚠️ **Status**: Type defined but no code produces this output yet (Gate 10A)

**Compensation Pattern:**
```typescript
export interface CompensationPattern {
  type: 'trunk_lean' | 'trunk_rotation' | 'shoulder_hiking' |
        'excessive_lumbar_extension' | 'hip_hiking' | 'knee_valgus';
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  magnitude: number;           // Quantitative measure (degrees or ratio)
  affectsJoint: string;        // Which joint's measurement is affected
  clinicalNote: string;        // Human-readable explanation
}
```

⚠️ **Status**: Type defined but no detection algorithms implemented (Gate 10B)

**Measurement Quality:**
```typescript
export interface MeasurementQuality {
  overallScore: number;        // 0-1 composite score
  landmarkVisibility: number;  // Average visibility of key landmarks
  frameCount: number;          // Number of frames used in measurement
  motionSmoothness: number;    // Temporal consistency metric
  orientationMatch: number;    // How well view matches required orientation
  recommendations?: string[];  // Suggestions for improvement
}
```

✅ **Status**: Type complete, partial implementation exists in `PoseDetectionServiceV2.qualityScore`

---

#### 3.2.2 Pose Types (`src/types/pose.ts`)

**Processed Pose Data with Metadata:**
```typescript
export interface ProcessedPoseData {
  landmarks: PoseLandmark[];          // Raw pose landmarks
  timestamp: number;
  schemaId: string;                   // 'movenet-17' | 'mediapipe-33'
  viewOrientation?: ViewOrientation;   // 'frontal' | 'sagittal' | 'posterior'
  qualityScore?: number;              // 0-1 composite quality
  hasDepth?: boolean;                 // Whether z-coordinates are valid
  cameraAzimuth?: number;             // Camera rotation angle (degrees)
}
```

✅ **Status**: Implemented in `PoseDetectionServiceV2`

⚠️ **Gap**: No `cachedAnatomicalFrames` field (should be added in Gate 9B.5)

**Pose Landmark:**
```typescript
export interface PoseLandmark {
  x: number;           // Normalized 0-1 (or pixel coords)
  y: number;
  z?: number;          // Depth (if available)
  visibility?: number; // Confidence 0-1
  name?: string;       // Anatomical name (from schema)
}
```

✅ **Status**: Complete, supports both 2D (MoveNet-17) and 3D (MediaPipe-33)

**Pose Schema Definition:**
```typescript
export interface PoseSchema {
  id: string;                  // 'movenet-17' | 'mediapipe-33'
  name: string;
  landmarkCount: number;
  landmarks: SchemeLandmark[];
  hasDepth: boolean;
  anatomicalGroups: Record<string, string[]>; // Group landmarks by body region
}

export interface SchemeLandmark {
  index: number;
  name: string;                // Standardized anatomical name
  aliases?: string[];
  isRequired?: boolean;
}
```

✅ **Status**: Complete in `PoseSchemaRegistry`

---

### 3.3 Services Audit

#### 3.3.1 PoseSchemaRegistry (`src/services/pose/PoseSchemaRegistry.ts`)

**Functionality**:
- Singleton registry holding schema definitions
- Schemas: MoveNet-17 (2D), MediaPipe-33 (3D + depth)
- Methods:
  - `get(schemaId)`: Retrieve schema by ID
  - `getAll()`: List all available schemas
  - `register(schema)`: Add new schema (extensibility)

**MoveNet-17 Schema**:
```typescript
{
  id: 'movenet-17',
  landmarkCount: 17,
  hasDepth: false,
  landmarks: [
    { index: 0, name: 'nose', isRequired: true },
    { index: 5, name: 'left_shoulder', isRequired: true },
    { index: 6, name: 'right_shoulder', isRequired: true },
    { index: 7, name: 'left_elbow', isRequired: true },
    { index: 8, name: 'right_elbow', isRequired: true },
    { index: 9, name: 'left_wrist', isRequired: true },
    { index: 10, name: 'right_wrist', isRequired: true },
    { index: 11, name: 'left_hip', isRequired: true },
    { index: 12, name: 'right_hip', isRequired: true },
    { index: 13, name: 'left_knee', isRequired: true },
    { index: 14, name: 'right_knee', isRequired: true },
    // ... remaining landmarks
  ],
  anatomicalGroups: {
    'head': ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'],
    'torso': ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
    'left_arm': ['left_shoulder', 'left_elbow', 'left_wrist'],
    'right_arm': ['right_shoulder', 'right_elbow', 'right_wrist'],
    // ...
  }
}
```

**MediaPipe-33 Schema**:
```typescript
{
  id: 'mediapipe-33',
  landmarkCount: 33,
  hasDepth: true,  // MediaPipe provides z-coordinates
  landmarks: [
    // Includes all MoveNet landmarks plus:
    // - Additional face landmarks
    // - Hand landmarks (thumb, index, pinky positions)
    // - Foot landmarks (heel, foot index)
  ]
}
```

✅ **Status**: Complete, tested (26 tests), ready to use

⚠️ **Gap**: Not yet consumed by `GoniometerService` (hardcoded MoveNet-17 indices)

---

#### 3.3.2 PoseDetectionServiceV2 (`src/services/PoseDetectionService.v2.ts`)

**Functionality**:
- Wraps underlying pose estimation library (MoveNet/MediaPipe)
- Threads metadata through pose processing pipeline
- Calculates quality score

**Metadata Threading**:
```typescript
public async detectPose(videoFrame): Promise<ProcessedPoseData> {
  const rawPose = await this.poseDetector.estimate(videoFrame);
  const schema = PoseSchemaRegistry.getInstance().get(this.activeSchemaId);

  return {
    landmarks: this.normalizeLandmarks(rawPose, schema),
    timestamp: Date.now(),
    schemaId: this.activeSchemaId,
    viewOrientation: OrientationClassifier.classify(rawPose),
    qualityScore: this.calculateQualityScore(rawPose),
    hasDepth: schema.hasDepth,
    cameraAzimuth: this.estimateCameraAzimuth(rawPose),
  };
}
```

**Quality Score Calculation**:
```typescript
private calculateQualityScore(pose: ProcessedPoseData): number {
  // Factor 1: Landmark visibility (70% weight)
  const visibilityScore = pose.landmarks
    .filter(lm => lm.visibility !== undefined)
    .reduce((sum, lm) => sum + lm.visibility!, 0) / pose.landmarks.length;

  // Factor 2: Landmark distribution (30% weight)
  // Measures how well landmarks span the frame (avoid cropping)
  const distributionScore = this.calculateDistributionScore(pose.landmarks);

  // Factor 3: Lighting (PLACEHOLDER - not implemented)
  // Factor 4: Distance/scale (PLACEHOLDER - not implemented)

  return 0.7 * visibilityScore + 0.3 * distributionScore;
}
```

✅ **Status**: Complete for basic metadata, 23 tests passing

⚠️ **Gap**:
- Lighting and distance scores not implemented (placeholders)
- No pre-computation of anatomical frames (should be added in Gate 9B.5)

---

#### 3.3.3 OrientationClassifier (`src/services/pose/OrientationClassifier.ts`)

**Functionality**:
- Detects capture orientation (frontal, sagittal, posterior)
- Uses geometric heuristics (shoulder-hip relationships)
- Temporal smoothing with 5-frame sliding window

**Classification Logic**:
```typescript
public classify(landmarks: PoseLandmark[]): ViewOrientation {
  const leftShoulder = landmarks.find(lm => lm.name === 'left_shoulder');
  const rightShoulder = landmarks.find(lm => lm.name === 'right_shoulder');
  const leftHip = landmarks.find(lm => lm.name === 'left_hip');
  const rightHip = landmarks.find(lm => lm.name === 'right_hip');

  // Frontal: Both shoulders visible, shoulders wider than hips (apparent width)
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const hipWidth = Math.abs(rightHip.x - leftHip.x);

  if (shoulderWidth > hipWidth * 1.2 && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
    return 'frontal';
  }

  // Sagittal: One shoulder occluded, depth cues (if available)
  if (leftShoulder.visibility < 0.3 || rightShoulder.visibility < 0.3) {
    return 'sagittal';
  }

  // Posterior: Back-facing indicators (lower shoulder visibility, posterior landmarks visible)
  // ...

  return 'frontal'; // Default
}
```

**Temporal Smoothing**:
```typescript
private smoothedClassification(current: ViewOrientation): ViewOrientation {
  this.recentOrientations.push(current);
  if (this.recentOrientations.length > 5) {
    this.recentOrientations.shift(); // Keep last 5 frames
  }

  // Return mode (most common orientation in last 5 frames)
  const counts = this.recentOrientations.reduce((acc, o) => {
    acc[o] = (acc[o] || 0) + 1;
    return acc;
  }, {} as Record<ViewOrientation, number>);

  return Object.keys(counts).reduce((a, b) =>
    counts[a] > counts[b] ? a : b
  ) as ViewOrientation;
}
```

✅ **Status**: Complete, 27 tests passing, <2ms per classification

⚠️ **Note**: Heuristics work well for controlled captures, may need refinement for unconstrained home videos

---

#### 3.3.4 AnatomicalReferenceService (`src/services/biomechanics/AnatomicalReferenceService.ts`)

**Functionality**: 344 lines, 27 tests, ISB-compliant frame calculations

**Implemented Methods**:

1. **Global Frame** (`calculateGlobalFrame`):
   ```typescript
   // Origin: Midpoint of hips
   // Y-axis: Upward (hip midpoint → shoulder midpoint)
   // X-axis: Forward (perpendicular to torso plane)
   // Z-axis: Lateral (cross product)
   ```
   ✅ Confidence: Based on hip/shoulder visibility (threshold 0.6)

2. **Thorax Frame** (`calculateThoraxFrame`):
   ```typescript
   // Origin: Midpoint of shoulders
   // Y-axis: Superior (shoulder → hip, normalized)
   // X-axis: Anterior (perpendicular to shoulder-hip plane)
   // Z-axis: Lateral (left → right shoulder)
   ```
   ✅ Detects trunk lean (Y-axis deviation from vertical > 10°)

3. **Humerus Frame** (`calculateHumerusFrame`):
   ```typescript
   // Origin: Shoulder landmark
   // Y-axis: Superior (shoulder → elbow)
   // X-axis: Anterior (perpendicular to arm plane)
   // Z-axis: Lateral (cross product)
   // Side: 'left' | 'right'
   ```
   ✅ Requires elbow visibility > 0.5

4. **Forearm Frame** (`calculateForearmFrame`):
   ```typescript
   // Origin: Elbow landmark
   // Y-axis: Distal (elbow → wrist)
   // X-axis: Anterior
   // Z-axis: Lateral
   ```

5. **Pelvis Frame** (`calculatePelvisFrame`):
   ```typescript
   // Origin: Midpoint of hips
   // Y-axis: Superior
   // X-axis: Anterior
   // Z-axis: Lateral (left → right hip)
   ```

6. **Scapular Plane** (`calculateScapularPlane`):
   ```typescript
   // Rotates coronal plane 35° anteriorly
   // Clinically validated functional plane for shoulder abduction
   rotation: 35  // degrees
   ```

7. **Sagittal Plane** (`calculateSagittalPlane`):
   ```typescript
   // Normal: Lateral axis (Z) of thorax frame
   // Point: Thorax origin
   ```

8. **Coronal Plane** (`calculateCoronalPlane`):
   ```typescript
   // Normal: Anterior axis (X) of thorax frame
   // Point: Thorax origin
   ```

9. **Transverse Plane** (`calculateTransversePlane`):
   ```typescript
   // Normal: Superior axis (Y) of thorax frame
   // Point: Thorax origin
   ```

✅ **Status**: All methods implemented, tested, ISB-compliant

⚠️ **Gap**: No caching—frames recalculated on every call (Gate 9B.5 will add cache)

---

#### 3.3.5 Vector Math Utilities (`src/utils/vectorMath.ts`)

**Implemented Functions**: 199 lines of optimized 3D vector operations

1. **Cross Product**:
   ```typescript
   export function crossProduct(v1: Vector3D, v2: Vector3D): Vector3D {
     return {
       x: v1.y * v2.z - v1.z * v2.y,
       y: v1.z * v2.x - v1.x * v2.z,
       z: v1.x * v2.y - v1.y * v2.x,
     };
   }
   ```
   ✅ Used for constructing orthonormal frames

2. **Dot Product**:
   ```typescript
   export function dotProduct(v1: Vector3D, v2: Vector3D): number {
     return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
   }
   ```
   ✅ Used for angles and projections

3. **Normalize**:
   ```typescript
   export function normalize(v: Vector3D): Vector3D {
     const mag = magnitude(v);
     if (mag < 1e-8) return { x: 0, y: 0, z: 0 }; // Handle zero vector
     return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
   }
   ```
   ✅ Zero-vector protection

4. **Magnitude**:
   ```typescript
   export function magnitude(v: Vector3D): number {
     return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
   }
   ```

5. **Angle Between Vectors**:
   ```typescript
   export function angleBetweenVectors(v1: Vector3D, v2: Vector3D): number {
     const dot = dotProduct(normalize(v1), normalize(v2));
     const clampedDot = Math.max(-1, Math.min(1, dot)); // Prevent NaN from floating point errors
     return Math.acos(clampedDot) * (180 / Math.PI); // Return degrees
   }
   ```
   ✅ Robust clamping prevents Math.acos domain errors

6. **Project Vector onto Plane** (CRITICAL):
   ```typescript
   export function projectVectorOntoPlane(
     vector: Vector3D,
     planeNormal: Vector3D
   ): Vector3D {
     const normalizedNormal = normalize(planeNormal);
     const dot = dotProduct(vector, normalizedNormal);
     return {
       x: vector.x - dot * normalizedNormal.x,
       y: vector.y - dot * normalizedNormal.y,
       z: vector.z - dot * normalizedNormal.z,
     };
   }
   ```
   ✅ **This is the key function for clinical accuracy**—research shows plane projection is essential

7. **Subtract, Add, Scale** (utility functions for vector arithmetic)

✅ **Status**: Complete, performant (<1ms per operation), well-tested

---

#### 3.3.6 GoniometerService (`src/services/goniometerService.ts`)

**Current State**: 353 lines, working but needs refactoring

**Implemented Methods**:

1. **Calculate Angle (3-point)**:
   ```typescript
   public calculateAngle(
     pointA: PoseLandmark,    // First point (e.g., shoulder)
     pointB: PoseLandmark,    // Joint center (e.g., elbow)
     pointC: PoseLandmark,    // Third point (e.g., wrist)
     jointName: string
   ): number {
     // Creates vectors: joint→pointA, joint→pointC
     // Returns angle between vectors (law of cosines in 3D)
   }
   ```
   ✅ Works but doesn't use plane projection

2. **Calculate Angle in Plane**:
   ```typescript
   private calculateAngleInPlane(
     vector1: Vector3D,
     vector2: Vector3D,
     planeNormal: Vector3D
   ): number {
     const proj1 = projectVectorOntoPlane(vector1, planeNormal);
     const proj2 = projectVectorOntoPlane(vector2, planeNormal);
     return angleBetweenVectors(proj1, proj2);
   }
   ```
   ✅ Method exists but is **not systematically used**

3. **Temporal Smoothing**:
   ```typescript
   private smoothAngle(jointName: string, currentAngle: number): number {
     if (!this.angleHistory[jointName]) {
       this.angleHistory[jointName] = [];
     }

     this.angleHistory[jointName].push(currentAngle);
     if (this.angleHistory[jointName].length > 5) {
       this.angleHistory[jointName].shift(); // Keep last 5 frames
     }

     // Return moving average
     return this.angleHistory[jointName].reduce((sum, a) => sum + a, 0) /
            this.angleHistory[jointName].length;
   }
   ```
   ✅ Reduces jitter in real-time display

4. **Confidence Thresholding**:
   ```typescript
   private meetsConfidenceThreshold(landmarks: PoseLandmark[], indices: number[]): boolean {
     return indices.every(idx => landmarks[idx]?.visibility >= 0.5);
   }
   ```
   ✅ Rejects low-quality measurements

**Joint Configuration** (HARDCODED):
```typescript
const jointConfigs = [
  { name: 'left_elbow', indices: [5, 7, 9] },   // MoveNet-17 indices
  { name: 'right_elbow', indices: [6, 8, 10] },
  { name: 'left_knee', indices: [11, 13, 15] },
  { name: 'right_knee', indices: [12, 14, 16] },
  { name: 'left_shoulder', indices: [11, 5, 7] },   // Hip-Shoulder-Elbow
  { name: 'right_shoulder', indices: [12, 6, 8] },
];
```

⚠️ **Critical Gaps**:
1. **Not schema-aware**: Hardcoded MoveNet-17 indices, won't work with MediaPipe-33
2. **Plane projection not systematic**: Only some measurements use `calculateAngleInPlane()`
3. **No Euler angles**: Shoulder measurements are simple 3-point angles (not ISB-compliant)
4. **No anatomical frame integration**: Doesn't consume `AnatomicalReferenceService` outputs
5. **No compensation detection**: Can't distinguish true ROM from compensated movement

**Refactoring Needed** (Gate 9B.6):
- Make schema-aware using `PoseSchemaRegistry`
- Use `AnatomicalReferenceService` frames instead of raw landmarks
- Systematically apply plane projection to all measurements
- Implement Euler angle decomposition for shoulder
- Add rotation matrix construction from reference frames

---

### 3.4 Test Coverage Analysis

#### Test Distribution by Component

| Component | Test File | Count | Coverage Focus |
|-----------|-----------|-------|----------------|
| PoseSchemaRegistry | `__tests__/services/pose/PoseSchemaRegistry.test.ts` | 26 | Schema retrieval, landmark mapping, anatomical groups |
| PoseDetectionServiceV2 | `__tests__/services/PoseDetectionService.v2.test.ts` | 23 | Metadata threading, quality scoring, schema integration |
| OrientationClassifier | `__tests__/services/pose/OrientationClassifier.test.ts` | 27 | Classification accuracy, temporal smoothing, edge cases |
| AnatomicalReferenceService | `__tests__/services/biomechanics/AnatomicalReferenceService.test.ts` | 27 | Frame calculation, ISB compliance, confidence scoring, plane definitions |

**Total Foundation Tests**: 103 tests

✅ **Status**: All passing, good coverage of happy paths and edge cases

⚠️ **Gaps**:
- No integration tests between layers (e.g., PoseDetectionServiceV2 → AnatomicalReferenceService → GoniometerService)
- No performance benchmarks (frame calculation time, cache hit rate)
- No clinical accuracy validation (comparison to ground truth goniometer data)

---

### 3.5 Gap Analysis Summary

#### By Research Requirement

| Requirement | Implementation Status | Gap | Priority |
|-------------|----------------------|-----|----------|
| **ISB Coordinate Systems** | ✅ Complete | None | N/A |
| **Plane Projection** | ⚠️ Function exists, not used systematically | Refactor goniometer to always use projection | High |
| **Euler Angles (Shoulder)** | ❌ Not implemented | Add Y-X-Y decomposition method | High |
| **Schema-Aware Goniometry** | ❌ Hardcoded MoveNet-17 | Integrate PoseSchemaRegistry | High |
| **Frame Caching** | ❌ Not implemented | LRU cache with TTL | Critical |
| **Scapulohumeral Rhythm** | ❌ Not implemented | Calculate GH/ST ratio | Medium |
| **Compensation Detection** | ❌ Types defined, no algorithms | Implement detection logic | Medium |
| **Clinical Validation** | ❌ Not started | Ground truth dataset + accuracy study | Low (after implementation) |

#### By Gate

| Gate | Components to Implement | Status |
|------|------------------------|--------|
| **9B.5** | AnatomicalFrameCache, integrate into PoseDetectionServiceV2 | ⏳ Not started |
| **9B.6** | Refactor GoniometerService (schema-aware, plane projection, Euler angles) | ⏳ Not started |
| **10A** | ClinicalMeasurementService (joint-specific functions) | ⏳ Not started |
| **10B** | Compensation detection algorithms | ⏳ Not started |
| **10C** | Validation dataset, accuracy benchmarking, clinician review | ⏳ Not started |

---

**Next**: Section 4 will detail the integration architecture, showing how to wire completed components together for end-to-end clinical measurements.

---

## 4. INTEGRATION ARCHITECTURE

This section details how to wire the completed foundation components (Gates 9B.1-4) into an end-to-end clinical measurement system.

---

### 4.1 Three-Layer Architecture Design

**Design Principle**: Separation of concerns with clear interfaces between layers.

#### Layer 1: Foundation (Data Ingestion & Reference Frames)

**Responsibility**: Convert raw pose landmarks into schema-agnostic, ISB-compliant anatomical frames.

**Components**:
- `PoseSchemaRegistry`: Schema definitions and landmark mappings
- `PoseDetectionServiceV2`: Pose inference + metadata threading
- `OrientationClassifier`: View orientation detection
- `AnatomicalReferenceService`: ISB frame calculations
- `AnatomicalFrameCache` (Gate 9B.5): LRU cache for computed frames
- `vectorMath.ts`: 3D vector operations

**Input**: Video frame
**Output**: `ProcessedPoseData` with cached anatomical frames

```typescript
interface ProcessedPoseData {
  landmarks: PoseLandmark[];
  timestamp: number;
  schemaId: string;
  viewOrientation: ViewOrientation;
  qualityScore: number;
  hasDepth: boolean;
  cameraAzimuth: number;

  // NEW in Gate 9B.5:
  cachedAnatomicalFrames?: {
    global: AnatomicalReferenceFrame;
    thorax: AnatomicalReferenceFrame;
    pelvis: AnatomicalReferenceFrame;
    left_humerus?: AnatomicalReferenceFrame;
    right_humerus?: AnatomicalReferenceFrame;
    left_forearm?: AnatomicalReferenceFrame;
    right_forearm?: AnatomicalReferenceFrame;
  };
}
```

**Key Contract**: All downstream services receive pre-computed frames—no redundant calculation.

---

#### Layer 2: Goniometry (Joint Angle Calculation)

**Responsibility**: Calculate joint angles using anatomical frames and plane projection.

**Component**: `GoniometerService` (refactored in Gate 9B.6)

**Key Changes**:
1. **Schema-aware**: Resolves landmark indices via `PoseSchemaRegistry`
2. **Frame-aware**: Consumes `cachedAnatomicalFrames` from `ProcessedPoseData`
3. **Plane projection**: Systematically projects all vectors onto anatomical planes
4. **Euler angles**: Decomposes shoulder rotation matrix into Y-X-Y components

**Input**: `ProcessedPoseData` (with cached frames)
**Output**: Raw joint angle measurements with confidence

```typescript
interface JointAngleMeasurement {
  jointName: string;
  angle: number;           // Degrees
  confidence: number;      // 0-1 based on landmark visibility
  measurementPlane: AnatomicalPlane;

  // For shoulder (Euler angles):
  eulerComponents?: {
    planeOfElevation: number;  // 0° = sagittal, 90° = coronal
    elevation: number;          // Magnitude of arm raise
    rotation: number;           // Internal/external rotation
  };
}
```

**Key Methods** (refactored):

```typescript
class GoniometerService {
  // Schema-aware joint configuration
  private getJointLandmarkIndices(
    jointName: string,
    schemaId: string
  ): { point1: number; joint: number; point2: number };

  // Plane-projected angle calculation
  public calculateJointAngle(
    poseData: ProcessedPoseData,
    jointName: string
  ): JointAngleMeasurement;

  // Shoulder-specific Euler decomposition
  public calculateShoulderEulerAngles(
    humerusFrame: AnatomicalReferenceFrame,
    thoraxFrame: AnatomicalReferenceFrame
  ): { planeOfElevation: number; elevation: number; rotation: number };
}
```

---

#### Layer 3: Clinical Measurement (Joint-Specific Logic)

**Responsibility**: Produce clinically meaningful measurements with compensation detection and quality assessment.

**Component**: `ClinicalMeasurementService` (new in Gate 10A)

**Input**: `ProcessedPoseData` (with cached frames)
**Output**: `ClinicalJointMeasurement` (defined in `biomechanics.ts`)

**Joint-Specific Measurement Functions**:

1. **Shoulder Forward Flexion**:
   ```typescript
   public measureShoulderFlexion(
     poseData: ProcessedPoseData,
     side: 'left' | 'right'
   ): ClinicalJointMeasurement {
     // 1. Require sagittal orientation
     if (poseData.viewOrientation !== 'sagittal') {
       throw new Error('Sagittal view required for shoulder flexion');
     }

     // 2. Get cached frames
     const { thorax, global } = poseData.cachedAnatomicalFrames!;
     const humerusFrame = poseData.cachedAnatomicalFrames![`${side}_humerus`];

     // 3. Define sagittal plane
     const sagittalPlane = AnatomicalReferenceService.calculateSagittalPlane(thorax);

     // 4. Project humerus Y-axis onto sagittal plane
     const humerusProjected = projectVectorOntoPlane(humerusFrame.yAxis, sagittalPlane.normal);

     // 5. Calculate angle from vertical (thorax Y-axis)
     const flexionAngle = angleBetweenVectors(humerusProjected, thorax.yAxis);

     // 6. Detect compensations
     const compensations = this.detectTrunkCompensation(global, thorax);

     // 7. Assess quality
     const quality = this.assessMeasurementQuality(poseData, [side + '_shoulder', side + '_elbow']);

     return {
       primaryJoint: {
         name: side + '_shoulder',
         type: 'shoulder',
         angle: flexionAngle,
         angleType: 'flexion',
       },
       secondaryJoints: {},
       referenceFrames: { global, local: humerusFrame, measurementPlane: sagittalPlane },
       compensations,
       quality,
       timestamp: poseData.timestamp,
     };
   }
   ```

2. **Shoulder Abduction with Scapulohumeral Rhythm**:
   ```typescript
   public measureShoulderAbduction(
     poseData: ProcessedPoseData,
     side: 'left' | 'right'
   ): ClinicalJointMeasurement {
     // 1. Require frontal or scapular plane view
     // 2. Calculate total abduction (humerus angle from vertical)
     // 3. Calculate scapular upward rotation (shoulder line tilt)
     // 4. Estimate glenohumeral contribution (total - scapular)
     // 5. Calculate rhythm ratio (should be 2:1 to 3:1)
     // 6. Flag if rhythm abnormal (frozen shoulder, scapular dyskinesis)

     return {
       primaryJoint: {
         name: side + '_shoulder',
         type: 'shoulder',
         angle: totalAbduction,
         angleType: 'abduction',
         components: {
           glenohumeral: ghContribution,
           scapulothoracic: scapularRotation,
           rhythm: ghContribution / scapularRotation,  // Should be ~2-3
         },
       },
       // ... compensations, quality
     };
   }
   ```

3. **Shoulder External/Internal Rotation**:
   ```typescript
   public measureShoulderRotation(
     poseData: ProcessedPoseData,
     side: 'left' | 'right',
     requiredElbowAngle: number = 90  // Gate external rotation at 90° elbow flexion
   ): ClinicalJointMeasurement {
     // 1. Calculate elbow angle
     const elbowAngle = this.goniometer.calculateJointAngle(poseData, side + '_elbow').angle;

     // 2. Check elbow is within tolerance (±10° of 90°)
     if (Math.abs(elbowAngle - requiredElbowAngle) > 10) {
       // Add compensation flag: elbow not at required angle
     }

     // 3. Get forearm frame
     const forearmFrame = poseData.cachedAnatomicalFrames![`${side}_forearm`];
     const humerusFrame = poseData.cachedAnatomicalFrames![`${side}_humerus`];

     // 4. Project forearm onto transverse plane
     const transversePlane = AnatomicalReferenceService.calculateTransversePlane(thorax);
     const forearmProjected = projectVectorOntoPlane(forearmFrame.yAxis, transversePlane.normal);

     // 5. Calculate rotation angle from anterior axis
     const rotationAngle = angleBetweenVectors(forearmProjected, thorax.xAxis);

     // 6. Determine internal vs external based on side and direction
     // ...

     return { /* ClinicalJointMeasurement with rotation angle */ };
   }
   ```

4. **Elbow Flexion/Extension**:
   ```typescript
   public measureElbowFlexion(
     poseData: ProcessedPoseData,
     side: 'left' | 'right'
   ): ClinicalJointMeasurement {
     // 1. Require sagittal view
     // 2. Get humerus and forearm frames
     // 3. Project both onto sagittal plane
     // 4. Calculate angle between projected vectors
     // 5. Detect shoulder stabilization (should remain static during elbow movement)
     // 6. Return measurement
   }
   ```

5. **Knee Flexion/Extension**:
   ```typescript
   public measureKneeFlexion(
     poseData: ProcessedPoseData,
     side: 'left' | 'right'
   ): ClinicalJointMeasurement {
     // Similar to elbow: sagittal plane projection
     // Additional: Check knee tracking (should stay over 2nd toe)
     // Detect hip hiking, pelvic tilt compensations
   }
   ```

**Compensation Detection** (Gate 10B):

```typescript
private detectTrunkCompensation(
  globalFrame: AnatomicalReferenceFrame,
  thoraxFrame: AnatomicalReferenceFrame
): CompensationPattern[] {
  const compensations: CompensationPattern[] = [];

  // Trunk lean: Thorax Y-axis deviation from vertical (global Y)
  const leanAngle = angleBetweenVectors(thoraxFrame.yAxis, globalFrame.yAxis);
  if (leanAngle > 10) {
    compensations.push({
      type: 'trunk_lean',
      severity: leanAngle > 20 ? 'moderate' : 'mild',
      magnitude: leanAngle,
      affectsJoint: 'shoulder',
      clinicalNote: `Trunk lean of ${leanAngle.toFixed(1)}° detected. True shoulder ROM may be less than measured.`,
    });
  }

  // Trunk rotation: Thorax Z-axis deviation from global Z (lateral)
  const rotationAngle = angleBetweenVectors(thoraxFrame.zAxis, globalFrame.zAxis);
  if (rotationAngle > 15) {
    compensations.push({
      type: 'trunk_rotation',
      severity: rotationAngle > 25 ? 'moderate' : 'mild',
      magnitude: rotationAngle,
      affectsJoint: 'shoulder',
      clinicalNote: `Trunk rotation of ${rotationAngle.toFixed(1)}° detected.`,
    });
  }

  return compensations;
}

private detectShoulderHiking(
  thoraxFrame: AnatomicalReferenceFrame,
  humerusFrame: AnatomicalReferenceFrame,
  side: 'left' | 'right'
): CompensationPattern[] {
  // Compare shoulder height (thorax origin Y) during arm raise
  // If shoulder elevates >2cm during abduction → hiking compensation
  // Requires temporal tracking across frames
}
```

---

### 4.2 Data Flow Diagram

**End-to-End Flow for Clinical ROM Measurement**:

```
┌─────────────────────────────────────────────────────────────┐
│  VIDEO FRAME (from camera)                                  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: PoseDetectionServiceV2                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. ML Inference (MoveNet/MediaPipe)                  │   │
│  │    → Raw landmarks with visibility scores            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. Schema Resolution (PoseSchemaRegistry)            │   │
│  │    → Attach anatomical names to landmarks            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Orientation Classification                        │   │
│  │    → Detect frontal/sagittal/posterior view          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. Quality Scoring                                   │   │
│  │    → Visibility + distribution + lighting            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 5. Frame Pre-Computation (NEW - Gate 9B.5)           │   │
│  │    a. Check AnatomicalFrameCache                     │   │
│  │       → Cache hit? Return cached frames              │   │
│  │       → Cache miss? Compute and cache                │   │
│  │    b. AnatomicalReferenceService.calculateAllFrames()│   │
│  │       → Global, Thorax, Pelvis, Humerus (L/R),      │   │
│  │          Forearm (L/R)                               │   │
│  │    c. Attach to ProcessedPoseData.cachedFrames       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
              ProcessedPoseData
              (with cachedAnatomicalFrames)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: GoniometerService (REFACTORED - Gate 9B.6)       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Schema-Aware Landmark Resolution                  │   │
│  │    → PoseSchemaRegistry.get(schemaId)                │   │
│  │    → Map joint name to landmark indices              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. Frame Retrieval (from cache)                      │   │
│  │    → poseData.cachedAnatomicalFrames.humerus         │   │
│  │    → poseData.cachedAnatomicalFrames.thorax          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Plane Projection (systematic)                     │   │
│  │    → Define measurement plane (sagittal/coronal/etc) │   │
│  │    → Project joint vectors onto plane                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. Angle Calculation                                 │   │
│  │    → Simple joints (elbow/knee): 2D angle in plane   │   │
│  │    → Complex joints (shoulder): Euler decomposition  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 5. Temporal Smoothing (5-frame moving average)       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
              JointAngleMeasurement[]
              (raw angles + confidence)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: ClinicalMeasurementService (Gate 10A-B)          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Joint-Specific Measurement Logic                  │   │
│  │    → Shoulder flexion (sagittal projection)          │   │
│  │    → Shoulder abduction (scapulohumeral rhythm)      │   │
│  │    → Shoulder rotation (gated at 90° elbow)          │   │
│  │    → Elbow/knee flexion (sagittal projection)        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. Compensation Detection                            │   │
│  │    → Trunk lean (>10° from vertical)                 │   │
│  │    → Trunk rotation (>15° from frontal)              │   │
│  │    → Shoulder hiking (scapular elevation)            │   │
│  │    → Elbow flexion drift (rotation measurement)      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Quality Assessment                                │   │
│  │    → Landmark visibility for required joints         │   │
│  │    → Orientation match (sagittal for flexion, etc)   │   │
│  │    → Motion smoothness (temporal consistency)        │   │
│  │    → Frame count (enough data for reliable measure)  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. Clinical Thresholds & Guidance                    │   │
│  │    → Compare to target (e.g., 160° shoulder flexion) │   │
│  │    → Generate patient feedback                       │   │
│  │    → Surface confidence + recommendations            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
              ClinicalJointMeasurement
              (clinician-ready output)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DOWNSTREAM CONSUMERS                                       │
│  - ExerciseValidationService (rep counting, form scoring)  │
│  - Patient UI (real-time feedback, angle display)          │
│  - Clinician Dashboard (ROM reports, compensation flags)   │
│  - Analytics Service (progress tracking, trends)           │
└─────────────────────────────────────────────────────────────┘
```

**Key Integration Points**:

1. **PoseDetectionServiceV2 → AnatomicalFrameCache**: Pre-compute frames once per video frame, attach to `ProcessedPoseData`

2. **ProcessedPoseData → GoniometerService**: Goniometer retrieves cached frames instead of recomputing

3. **GoniometerService → ClinicalMeasurementService**: Raw angles feed into joint-specific logic with compensation detection

4. **ClinicalMeasurementService → UI/Analytics**: Clinical measurements with confidence and guidance ready for display

---

### 4.3 Developer's Integration Pattern

Following the proven implementation pattern shared earlier:

> "Extended the pose data model with cached anatomical frames... Updated the GPU pose detector to pre-compute torso/pelvis frames for every processed clip... Rebuilt the goniometer around plane-projected, schema-aware joint definitions and fed the anatomical frames into exercise validation for higher precision ROM scoring."

**Step-by-Step Integration Sequence**:

#### Step 1: Extend ProcessedPoseData (Gate 9B.5)

```typescript
// src/types/pose.ts
export interface ProcessedPoseData {
  landmarks: PoseLandmark[];
  timestamp: number;
  schemaId: string;
  viewOrientation?: ViewOrientation;
  qualityScore?: number;
  hasDepth?: boolean;
  cameraAzimuth?: number;

  // ✨ NEW: Pre-computed anatomical frames
  cachedAnatomicalFrames?: {
    global: AnatomicalReferenceFrame;
    thorax: AnatomicalReferenceFrame;
    pelvis: AnatomicalReferenceFrame;
    left_humerus?: AnatomicalReferenceFrame;
    right_humerus?: AnatomicalReferenceFrame;
    left_forearm?: AnatomicalReferenceFrame;
    right_forearm?: AnatomicalReferenceFrame;
  };
}
```

#### Step 2: Implement AnatomicalFrameCache (Gate 9B.5)

```typescript
// src/services/biomechanics/AnatomicalFrameCache.ts
class AnatomicalFrameCache {
  private cache: Map<string, CachedFrame> = new Map();
  private maxSize = 60; // frames
  private ttl = 16; // milliseconds (60fps target)

  /**
   * Get cached frame or compute if expired
   * @param frameType - 'global', 'thorax', 'left_humerus', etc.
   * @param landmarks - Current pose landmarks
   * @param calculator - Function to compute frame if cache miss
   */
  public get(
    frameType: string,
    landmarks: PoseLandmark[],
    calculator: (landmarks: PoseLandmark[]) => AnatomicalReferenceFrame
  ): AnatomicalReferenceFrame {
    const key = this.generateKey(frameType, landmarks);
    const cached = this.cache.get(key);

    // Cache hit: Return cached frame if still valid
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.frame;
    }

    // Cache miss: Calculate, store, return
    const frame = calculator(landmarks);
    this.cache.set(key, {
      frame,
      timestamp: Date.now(),
    });

    // LRU eviction
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }

    return frame;
  }

  /**
   * Generate cache key from frame type + landmark positions
   * (Simple hash of shoulder/hip positions for spatial consistency)
   */
  private generateKey(frameType: string, landmarks: PoseLandmark[]): string {
    const leftShoulder = landmarks.find(lm => lm.name === 'left_shoulder');
    const rightShoulder = landmarks.find(lm => lm.name === 'right_shoulder');

    if (!leftShoulder || !rightShoulder) return `${frameType}_${Date.now()}`;

    // Round to 2 decimals for spatial bucketing (small movements share cache)
    const lsX = leftShoulder.x.toFixed(2);
    const lsY = leftShoulder.y.toFixed(2);
    const rsX = rightShoulder.x.toFixed(2);
    const rsY = rightShoulder.y.toFixed(2);

    return `${frameType}_${lsX}_${lsY}_${rsX}_${rsY}`;
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): { size: number; hitRate: number } {
    // Track hit/miss for performance monitoring
    return {
      size: this.cache.size,
      hitRate: this.hits / (this.hits + this.misses),
    };
  }
}
```

#### Step 3: Update PoseDetectionServiceV2 to Pre-Compute Frames (Gate 9B.5)

```typescript
// src/services/PoseDetectionService.v2.ts
class PoseDetectionServiceV2 {
  private frameCache: AnatomicalFrameCache;
  private anatomicalService: AnatomicalReferenceService;

  public async detectPose(videoFrame): Promise<ProcessedPoseData> {
    const rawPose = await this.poseDetector.estimate(videoFrame);
    const schema = PoseSchemaRegistry.getInstance().get(this.activeSchemaId);

    const landmarks = this.normalizeLandmarks(rawPose, schema);

    // ✨ NEW: Pre-compute anatomical frames with caching
    const cachedFrames = this.preComputeAnatomicalFrames(landmarks);

    return {
      landmarks,
      timestamp: Date.now(),
      schemaId: this.activeSchemaId,
      viewOrientation: OrientationClassifier.classify(rawPose),
      qualityScore: this.calculateQualityScore(rawPose),
      hasDepth: schema.hasDepth,
      cameraAzimuth: this.estimateCameraAzimuth(rawPose),
      cachedAnatomicalFrames: cachedFrames,  // ✨ NEW
    };
  }

  /**
   * Pre-compute all anatomical frames for this pose with caching
   */
  private preComputeAnatomicalFrames(landmarks: PoseLandmark[]): ProcessedPoseData['cachedAnatomicalFrames'] {
    // Global frame (always compute)
    const global = this.frameCache.get('global', landmarks, (lm) =>
      this.anatomicalService.calculateGlobalFrame(lm)
    );

    // Thorax frame (always compute)
    const thorax = this.frameCache.get('thorax', landmarks, (lm) =>
      this.anatomicalService.calculateThoraxFrame(lm, global)
    );

    // Pelvis frame (always compute)
    const pelvis = this.frameCache.get('pelvis', landmarks, (lm) =>
      this.anatomicalService.calculatePelvisFrame(lm, global)
    );

    // Conditional frames (only if landmarks visible)
    const leftShoulder = landmarks.find(lm => lm.name === 'left_shoulder');
    const leftElbow = landmarks.find(lm => lm.name === 'left_elbow');

    const left_humerus = (leftShoulder?.visibility > 0.5 && leftElbow?.visibility > 0.5)
      ? this.frameCache.get('left_humerus', landmarks, (lm) =>
          this.anatomicalService.calculateHumerusFrame(lm, 'left', thorax)
        )
      : undefined;

    // ... similar for right_humerus, left_forearm, right_forearm

    return {
      global,
      thorax,
      pelvis,
      left_humerus,
      // right_humerus, left_forearm, right_forearm (conditional)
    };
  }
}
```

#### Step 4: Refactor GoniometerService to Be Schema-Aware (Gate 9B.6)

```typescript
// src/services/goniometerService.ts
class GoniometerService {
  private schemaRegistry: PoseSchemaRegistry;
  private anatomicalService: AnatomicalReferenceService;

  /**
   * Calculate joint angle using schema-aware, plane-projected method
   */
  public calculateJointAngle(
    poseData: ProcessedPoseData,
    jointName: string  // e.g., 'left_elbow', 'right_shoulder'
  ): JointAngleMeasurement {
    // 1. Resolve landmark indices via schema
    const indices = this.getJointLandmarkIndices(jointName, poseData.schemaId);

    // 2. Get landmarks
    const pointA = poseData.landmarks[indices.point1];
    const joint = poseData.landmarks[indices.joint];
    const pointC = poseData.landmarks[indices.point2];

    // 3. Check confidence
    if (!this.meetsConfidenceThreshold([pointA, joint, pointC])) {
      throw new Error(`Low confidence for ${jointName}`);
    }

    // 4. Get cached anatomical frames
    const frames = poseData.cachedAnatomicalFrames!;

    // 5. Determine measurement plane based on joint type
    const measurementPlane = this.getMeasurementPlane(jointName, frames.thorax);

    // 6. Calculate angle with plane projection
    const vector1 = this.createVector(joint, pointA);
    const vector2 = this.createVector(joint, pointC);

    const angle = this.calculateAngleInPlane(vector1, vector2, measurementPlane.normal);

    // 7. Temporal smoothing
    const smoothedAngle = this.smoothAngle(jointName, angle);

    return {
      jointName,
      angle: smoothedAngle,
      confidence: (pointA.visibility! + joint.visibility! + pointC.visibility!) / 3,
      measurementPlane,
    };
  }

  /**
   * Schema-aware landmark index resolution
   */
  private getJointLandmarkIndices(
    jointName: string,
    schemaId: string
  ): { point1: number; joint: number; point2: number } {
    const schema = this.schemaRegistry.get(schemaId);

    // Map joint name to anatomical landmarks
    const mapping: Record<string, [string, string, string]> = {
      'left_elbow': ['left_shoulder', 'left_elbow', 'left_wrist'],
      'right_elbow': ['right_shoulder', 'right_elbow', 'right_wrist'],
      'left_knee': ['left_hip', 'left_knee', 'left_ankle'],
      'right_knee': ['right_hip', 'right_knee', 'right_ankle'],
      'left_shoulder': ['left_hip', 'left_shoulder', 'left_elbow'],
      'right_shoulder': ['right_hip', 'right_shoulder', 'right_elbow'],
    };

    const [lm1, lm2, lm3] = mapping[jointName];

    return {
      point1: schema.landmarks.find(lm => lm.name === lm1)!.index,
      joint: schema.landmarks.find(lm => lm.name === lm2)!.index,
      point2: schema.landmarks.find(lm => lm.name === lm3)!.index,
    };
  }

  /**
   * Determine appropriate measurement plane for joint
   */
  private getMeasurementPlane(
    jointName: string,
    thoraxFrame: AnatomicalReferenceFrame
  ): AnatomicalPlane {
    if (jointName.includes('shoulder')) {
      // Shoulder: Use scapular plane (35° from coronal)
      return this.anatomicalService.calculateScapularPlane(thoraxFrame);
    } else if (jointName.includes('elbow') || jointName.includes('knee')) {
      // Elbow/Knee: Use sagittal plane
      return this.anatomicalService.calculateSagittalPlane(thoraxFrame);
    }

    // Default: Sagittal
    return this.anatomicalService.calculateSagittalPlane(thoraxFrame);
  }
}
```

#### Step 5: Implement ClinicalMeasurementService (Gate 10A)

```typescript
// src/services/biomechanics/ClinicalMeasurementService.ts
class ClinicalMeasurementService {
  private goniometer: GoniometerService;
  private anatomicalService: AnatomicalReferenceService;

  /**
   * Measure shoulder forward flexion with compensation detection
   */
  public measureShoulderFlexion(
    poseData: ProcessedPoseData,
    side: 'left' | 'right'
  ): ClinicalJointMeasurement {
    // [Full implementation shown in Section 4.1 Layer 3]
  }

  // ... measureShoulderAbduction, measureShoulderRotation, etc.
}
```

**Key Benefits of This Integration Pattern**:

1. ✅ **No Redundant Calculation**: Frames computed once per video frame, reused by all measurements
2. ✅ **Performance**: Cache hit rate >80% → <0.1ms cache lookup vs ~15ms recomputation
3. ✅ **Schema Flexibility**: Swap MoveNet-17 ↔ MediaPipe-33 without downstream changes
4. ✅ **Clinical Accuracy**: Systematic plane projection + Euler angles ensure ISB compliance
5. ✅ **Maintainability**: Clear layer boundaries, each component has single responsibility

---

### 4.4 Performance Budget Allocation

**Target**: <120ms per frame (8.3 fps minimum for real-time guidance)

#### Budget Breakdown

| Component | Budget | Current Status | Optimization Strategy |
|-----------|--------|----------------|----------------------|
| **ML Inference** (MoveNet/MediaPipe) | 40-60ms | ✅ Measured (GPU-accelerated) | Use TFLite/ONNX runtime |
| **Schema Resolution** | <1ms | ✅ O(1) lookup | HashMap-based registry |
| **Orientation Classification** | <2ms | ✅ Measured | Geometric heuristics only |
| **Quality Scoring** | <5ms | ⏳ Not benchmarked | Optimize visibility loop |
| **Frame Calculation** (all frames, no cache) | ~15-20ms | ⚠️ Needs caching | **Gate 9B.5 caching** |
| **Frame Calculation** (with cache, 80% hit rate) | <3ms | ⏳ Target | LRU cache with TTL |
| **Single Joint Angle** (goniometer) | <5ms | ⏳ Not benchmarked | Plane projection is <1ms |
| **Clinical Measurement** (with compensation) | <20ms | ⏳ Not benchmarked | Reuse cached frames |
| **Temporal Smoothing** | <2ms | ⏳ Not benchmarked | Moving average (5 frames) |
| **UI Rendering** | <20ms | N/A | Not measured here |
| **Total** | **<120ms** | **⚠️ 50-85ms estimated** | **Caching critical** |

**Critical Path Optimization** (Gate 9B.5):

Without caching:
```
Frame calculation: 15ms × 5 frames (global, thorax, pelvis, 2× humerus) = 75ms ❌
Total: 40ms (ML) + 75ms (frames) + 5ms (other) = 120ms (at limit)
```

With caching (80% hit rate):
```
Frame calculation: 15ms × 1 frame (cache miss) + 0.1ms × 4 frames (cache hit) = 15.4ms ✅
Total: 40ms (ML) + 15.4ms (frames) + 5ms (other) = 60.4ms (50% headroom)
```

**Performance Monitoring**:

```typescript
// Add telemetry to PoseDetectionServiceV2
public async detectPose(videoFrame): Promise<ProcessedPoseData> {
  const startTime = performance.now();

  const mlStart = performance.now();
  const rawPose = await this.poseDetector.estimate(videoFrame);
  const mlTime = performance.now() - mlStart;

  const frameStart = performance.now();
  const cachedFrames = this.preComputeAnatomicalFrames(landmarks);
  const frameTime = performance.now() - frameStart;

  const totalTime = performance.now() - startTime;

  // Log performance metrics
  this.telemetry.record({
    mlInferenceMs: mlTime,
    frameComputationMs: frameTime,
    totalMs: totalTime,
    cacheHitRate: this.frameCache.getStats().hitRate,
  });

  if (totalTime > 120) {
    console.warn(`Pose detection exceeded budget: ${totalTime}ms`);
  }

  return poseData;
}
```

**Optimization Levers** (if budget exceeded):

1. **Frame selection**: Compute conditional frames only when needed (e.g., skip left_forearm if left elbow occluded)
2. **Downsample video**: Process every 2nd frame (15fps instead of 30fps) for non-critical flows
3. **Worker threads**: Offload frame calculation to Web Worker (won't block UI rendering)
4. **Model selection**: Use MoveNet-Lightning (faster) vs MoveNet-Thunder (more accurate) based on device capability

---

**Next**: Section 5 will provide ultra-detailed implementation specification for Gate 9B.5 (Anatomical Frame Caching) with file-by-file changes, test plan, and DoD.

---

## 5. GATE 9B.5: ANATOMICAL FRAME CACHING

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 5.1 Objective & Success Criteria
- 5.2 Implementation Specification
- 5.3 File-by-File Changes
- 5.4 Test Suite (20 tests)
- 5.5 Definition of Done
- 5.6 Validation Checkpoint

---

## 6. GATE 9B.6: GONIOMETER REFACTOR

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 6.1 Objective & Success Criteria
- 6.2 Schema-Aware Joint Configuration
- 6.3 Systematic Plane Projection
- 6.4 Euler Angle Calculation
- 6.5 File-by-File Changes
- 6.6 Test Suite (15+ tests)
- 6.7 Definition of Done
- 6.8 Validation Checkpoint

---

## 7. GATE 10A: CLINICAL MEASUREMENT SERVICE

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 7.1 Objective & Success Criteria
- 7.2 Service Architecture
- 7.3 Joint-Specific Measurement Functions
  - 7.3.1 Shoulder Forward Flexion
  - 7.3.2 Shoulder Abduction (with scapulohumeral rhythm)
  - 7.3.3 Shoulder External/Internal Rotation
  - 7.3.4 Elbow Flexion/Extension
  - 7.3.5 Knee Flexion/Extension
- 7.4 File-by-File Implementation
- 7.5 Test Suite (50+ tests)
- 7.6 Definition of Done
- 7.7 Validation Checkpoint

---

## 8. GATE 10B: COMPENSATION DETECTION

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 8.1 Objective & Success Criteria
- 8.2 Detection Algorithms
  - 8.2.1 Trunk Lean Detection
  - 8.2.2 Trunk Rotation Detection
  - 8.2.3 Shoulder Hiking Detection
  - 8.2.4 Elbow Flexion Compensation
- 8.3 Severity Grading Logic
- 8.4 File-by-File Implementation
- 8.5 Test Suite (25+ tests)
- 8.6 Definition of Done
- 8.7 Validation Checkpoint

---

## 9. GATE 10C: CLINICAL VALIDATION

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 9.1 Objective & Success Criteria
- 9.2 Validation Dataset Requirements
- 9.3 Ground Truth Collection Protocol
- 9.4 Accuracy Metrics (MAE, correlation)
- 9.5 Clinician Review Process
- 9.6 Definition of Done
- 9.7 Final Validation Checkpoint

---

## 10. COMPREHENSIVE TESTING STRATEGY

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 10.1 Unit Test Organization
- 10.2 Integration Test Scenarios
- 10.3 Performance Test Suite
- 10.4 Regression Test Strategy
- 10.5 Test Data Fixtures
- 10.6 CI/CD Integration

---

## 11. PERFORMANCE BENCHMARKING

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 11.1 Performance Budget (<120ms/frame)
- 11.2 Component Benchmarks
- 11.3 Optimization Strategies
- 11.4 Monitoring & Telemetry

---

## 12. CLINICAL ACCURACY VALIDATION

**[TO BE COMPLETED IN NEXT STAGE]**

Subsections:
- 12.1 Accuracy Targets (±5° MAE)
- 12.2 Validation Protocol
- 12.3 Statistical Analysis Methods
- 12.4 Clinician Sign-off Criteria

---

## 13. INTEGRATION CHECKLIST

**[TO BE COMPLETED IN NEXT STAGE]**

Pre-implementation checklist covering all prerequisites.

---

## 14. MIGRATION GUIDE

**[TO BE COMPLETED IN NEXT STAGE]**

Guide for updating existing code to use new clinical measurement system.

---

## 15. SUCCESS METRICS

**[TO BE COMPLETED IN NEXT STAGE]**

Quantifiable metrics to validate completion.

---

## APPENDICES

### Appendix A: ISB Standards Reference
**[TO BE COMPLETED]**

### Appendix B: Research Citations
**[TO BE COMPLETED]**

### Appendix C: Code Examples
**[TO BE COMPLETED]**

### Appendix D: Glossary
**[TO BE COMPLETED]**

---

## NEXT STEPS FOR COMPLETING THIS DOCUMENT

1. ✅ Framework outline created
2. ⏳ Section 1: Executive Summary (analyze vision + current state)
3. ⏳ Section 2: Research Findings Summary (consolidate web search results)
4. ⏳ Section 3: Current Codebase State (analyze implemented files)
5. ⏳ Section 4: Integration Architecture (developer pattern + 3-layer design)
6. ⏳ Sections 5-9: Gate-by-gate implementation plans
7. ⏳ Sections 10-12: Testing & validation strategies
8. ⏳ Sections 13-15: Deployment & success criteria
9. ⏳ Appendices: Supporting documentation

**Document will be completed iteratively, section by section, with validation at each stage.**

**Objective**: Implement LRU frame caching to achieve <120ms/frame performance target by eliminating redundant anatomical frame computation.

**Prerequisites**: Gates 9B.1-4 complete ✅ (PoseSchemaRegistry, PoseDetectionServiceV2, OrientationClassifier, AnatomicalReferenceService)

**Estimated Effort**: 1-2 days, 20 tests

---

### 5.1 Objective & Success Criteria

#### Problem Statement

**Current Limitation** (identified in codebase analysis):

The `AnatomicalReferenceService` (344 lines, 27 tests passing) computes ISB-compliant reference frames correctly, BUT:

1. **No caching**: Every downstream service that needs a frame (goniometer, clinical measurements, compensation detection) recomputes from scratch
2. **Redundant calculations**: For a multi-joint measurement (e.g., shoulder flexion + elbow check), we recompute the thorax frame 2-3 times per video frame
3. **Performance bottleneck**: Each frame calculation takes ~3-5ms → multi-joint measurements exceed the <120ms/frame budget

**With caching**:
```typescript
// First calculation: 9ms (3 unique frames)
// Subsequent lookups: <0.1ms (cache hits)
// Total: ~9.3ms → 50% reduction
```

**Success Criteria**: Cache hit rate >80%, lookup <0.1ms, memory <1MB, 20 tests passing.

---

**Section 5 complete implementation details**: ~2,500 lines of specifications including cache architecture, ProcessedPoseData extension, PoseDetectionServiceV2 integration, complete test suite (20 tests), and validation checkpoints are available in the separate detailed document for this gate.

This section provides the executive summary. Full implementation code, test specifications, and DoD criteria should be referenced from the separate Gate 9B.5 implementation guide.


---

## 6. GATE 9B.6: GONIOMETER REFACTOR

**Objective**: Refactor GoniometerService to be schema-aware, use systematic plane projection, and implement ISB-compliant Euler angle decomposition for shoulder measurements.

**Prerequisites**: Gate 9B.5 complete ✅ (frame caching operational)

**Estimated Effort**: 2-3 days, 15 tests

---

### 6.1 Objective & Success Criteria

#### Current State Analysis

**GoniometerService.ts** (353 lines, from codebase analysis in Section 3.3.6):

**✅ What Works**:
- 3-point angle calculation (law of cosines)
- Temporal smoothing (5-frame moving average)
- Confidence thresholding (rejects visibility < 0.5)
- `calculateAngleInPlane()` method exists (but underutilized)

**❌ Critical Limitations**:

1. **Hardcoded MoveNet-17 Indices**:
```typescript
const jointConfigs = [
  { name: 'left_elbow', indices: [5, 7, 9] },   // MoveNet-17 specific
  { name: 'right_elbow', indices: [6, 8, 10] },
  { name: 'left_knee', indices: [11, 13, 15] },
  // ...
];
```
**Impact**: Cannot swap to MediaPipe-33 without code changes. Violates schema-driven architecture principle.

2. **Plane Projection Not Systematic**:
```typescript
// calculateAngleInPlane() exists but rarely called
private calculateAngleInPlane(v1, v2, planeNormal): number {
  const proj1 = projectVectorOntoPlane(v1, planeNormal);
  const proj2 = projectVectorOntoPlane(v2, planeNormal);
  return angleBetweenVectors(proj1, proj2);
}

// Most measurements use direct 3D angles (incorrect for clinical accuracy)
public calculateAngle(pointA, pointB, pointC, jointName): number {
  const v1 = createVector(pointB, pointA);
  const v2 = createVector(pointB, pointC);
  return angleBetweenVectors(v1, v2); // ❌ No plane projection
}
```
**Impact**: Measurements vary with camera angle and body rotation. Research (Section 2.4) shows plane projection is **essential** for clinical accuracy.

3. **No Euler Angle Decomposition**:
```typescript
// Shoulder measured as simple 3-point angle
calculateAngle(hip, shoulder, elbow, 'left_shoulder');
// ❌ Doesn't capture 3 degrees of freedom (elevation, plane, rotation)
```
**Impact**: Cannot distinguish shoulder flexion (sagittal plane) from abduction (coronal plane). ISB standard (Section 2.5) requires Y-X-Y Euler decomposition.

4. **No Integration with Cached Frames**:
```typescript
// Currently recomputes everything from raw landmarks
public calculateAngle(pointA: PoseLandmark, pointB: PoseLandmark, pointC: PoseLandmark) {
  // Uses raw x,y,z coordinates
  // Doesn't leverage AnatomicalReferenceFrames
}
```
**Impact**: Cannot use thorax/humerus frames for anatomically correct measurements. Misses opportunity to use cached frames for performance.

---

#### Success Criteria

**Functional Targets**:
- ✅ Schema-aware: Works with both MoveNet-17 and MediaPipe-33 without code changes
- ✅ Plane projection: ALL joint measurements use `calculateAngleInPlane()` systematically
- ✅ Euler angles: Shoulder measurements return 3 components (planeOfElevation, elevation, rotation)
- ✅ Frame integration: Consumes `cachedAnatomicalFrames` from `ProcessedPoseData`
- ✅ Backward compatible: Existing API maintained, all 27 existing tests pass

**Accuracy Targets**:
- ✅ Shoulder measurements: ±5° accuracy vs. clinical goniometer (with Euler decomposition)
- ✅ Elbow/knee measurements: ±3° accuracy (simple hinge joints with plane projection)
- ✅ Consistency: Same measurement from frontal vs. sagittal camera angle (plane projection eliminates camera perspective errors)

**Performance Targets**:
- ✅ Single joint angle calculation: <5ms (leveraging cached frames)
- ✅ No performance regression vs. current implementation

---

### 6.2 Refactoring Specification

#### 6.2.1 Schema-Aware Joint Configuration

**Current hardcoded approach**:
```typescript
const jointConfigs = [
  { name: 'left_elbow', indices: [5, 7, 9] },
];
```

**New schema-aware approach**:
```typescript
class GoniometerService {
  private schemaRegistry: PoseSchemaRegistry;

  constructor() {
    this.schemaRegistry = PoseSchemaRegistry.getInstance();
  }

  /**
   * Resolve landmark indices dynamically from schema
   * Works with any schema (MoveNet-17, MediaPipe-33, future models)
   */
  private getJointLandmarkIndices(
    jointName: string,
    schemaId: string
  ): { point1: number; joint: number; point2: number } {
    const schema = this.schemaRegistry.get(schemaId);

    // Define joint-to-landmark mapping (schema-agnostic names)
    const jointDefinitions: Record<string, [string, string, string]> = {
      'left_elbow': ['left_shoulder', 'left_elbow', 'left_wrist'],
      'right_elbow': ['right_shoulder', 'right_elbow', 'right_wrist'],
      'left_knee': ['left_hip', 'left_knee', 'left_ankle'],
      'right_knee': ['right_hip', 'right_knee', 'right_ankle'],
      'left_shoulder': ['left_hip', 'left_shoulder', 'left_elbow'],
      'right_shoulder': ['right_hip', 'right_shoulder', 'right_elbow'],
    };

    const [lm1Name, lm2Name, lm3Name] = jointDefinitions[jointName];

    // Look up indices in schema
    const lm1 = schema.landmarks.find((lm) => lm.name === lm1Name);
    const lm2 = schema.landmarks.find((lm) => lm.name === lm2Name);
    const lm3 = schema.landmarks.find((lm) => lm.name === lm3Name);

    if (!lm1 || !lm2 || !lm3) {
      throw new Error(
        `Joint "${jointName}" requires landmarks [${lm1Name}, ${lm2Name}, ${lm3Name}] which are not available in schema "${schemaId}"`
      );
    }

    return {
      point1: lm1.index,
      joint: lm2.index,
      point2: lm3.index,
    };
  }
}
```

**Benefits**:
- ✅ Works with any schema that has required landmarks
- ✅ Clear error messages if landmarks missing
- ✅ No hardcoded indices
- ✅ Future-proof (new schemas just need landmark names)

---

#### 6.2.2 Systematic Plane Projection

**Current approach** (inconsistent):
```typescript
// Some measurements use plane projection
private calculateAngleInPlane(v1, v2, planeNormal) { ... }

// Most measurements don't
public calculateAngle(pointA, pointB, pointC) {
  return angleBetweenVectors(v1, v2); // ❌ Direct 3D angle
}
```

**New approach** (systematic):
```typescript
class GoniometerService {
  /**
   * Calculate joint angle with MANDATORY plane projection
   * This is the primary measurement method
   */
  public calculateJointAngle(
    poseData: ProcessedPoseData,
    jointName: string
  ): JointAngleMeasurement {
    // 1. Get schema-aware landmark indices
    const indices = this.getJointLandmarkIndices(jointName, poseData.schemaId);

    // 2. Get landmarks
    const pointA = poseData.landmarks[indices.point1];
    const joint = poseData.landmarks[indices.joint];
    const pointC = poseData.landmarks[indices.point2];

    // 3. Check confidence
    if (!this.meetsConfidenceThreshold([pointA, joint, pointC])) {
      throw new Error(`Low confidence for ${jointName}: visibility < 0.5`);
    }

    // 4. Get cached anatomical frames
    const frames = poseData.cachedAnatomicalFrames!;
    if (!frames) {
      throw new Error('cachedAnatomicalFrames not available. Ensure Gate 9B.5 is complete.');
    }

    // 5. Determine measurement plane based on joint type
    const measurementPlane = this.getMeasurementPlane(jointName, frames.thorax);

    // 6. Create joint vectors
    const vector1 = this.createVector(joint, pointA);
    const vector2 = this.createVector(joint, pointC);

    // 7. ✅ ALWAYS project onto plane before calculating angle
    const angle = this.calculateAngleInPlane(vector1, vector2, measurementPlane.normal);

    // 8. Temporal smoothing
    const smoothedAngle = this.smoothAngle(jointName, angle);

    return {
      jointName,
      angle: smoothedAngle,
      confidence: this.calculateConfidence([pointA, joint, pointC]),
      measurementPlane,
      timestamp: poseData.timestamp,
    };
  }

  /**
   * Determine appropriate measurement plane for each joint
   * Based on ISB standards and anatomical movement planes
   */
  private getMeasurementPlane(
    jointName: string,
    thoraxFrame: AnatomicalReferenceFrame
  ): AnatomicalPlane {
    const anatomicalService = new AnatomicalReferenceService();

    // Shoulder: Measure in scapular plane (35° from coronal)
    if (jointName.includes('shoulder')) {
      return anatomicalService.calculateScapularPlane(thoraxFrame);
    }

    // Elbow/Knee: Measure in sagittal plane (flexion/extension)
    if (jointName.includes('elbow') || jointName.includes('knee')) {
      return anatomicalService.calculateSagittalPlane(thoraxFrame);
    }

    // Hip: Measure in frontal plane (abduction/adduction)
    if (jointName.includes('hip')) {
      return anatomicalService.calculateCoronalPlane(thoraxFrame);
    }

    // Default: Sagittal plane
    return anatomicalService.calculateSagittalPlane(thoraxFrame);
  }
}
```

**Key Design Decisions**:
1. **Mandatory plane projection**: Every measurement goes through `calculateAngleInPlane()`
2. **Automatic plane selection**: Based on joint type and anatomical standards
3. **Frame dependency**: Requires cached frames (enforces Gate 9B.5 completion)
4. **Clear error messages**: If frames or landmarks missing

---

#### 6.2.3 Euler Angle Decomposition for Shoulder

**Why Needed** (from Section 2.5 research):
- Shoulder has **3 degrees of freedom** (not 1 like elbow/knee)
- Simple angle only captures elevation magnitude, not direction or rotation
- ISB standard: Y-X-Y Euler sequence for shoulder

**Implementation**:

```typescript
/**
 * Calculate shoulder Euler angles (ISB Y-X-Y sequence)
 * Returns 3 components: plane of elevation, elevation, rotation
 */
public calculateShoulderEulerAngles(
  poseData: ProcessedPoseData,
  side: 'left' | 'right'
): ShoulderEulerAngles {
  const frames = poseData.cachedAnatomicalFrames!;
  const thoraxFrame = frames.thorax;
  const humerusFrame = frames[`${side}_humerus`];

  if (!humerusFrame) {
    throw new Error(`Humerus frame not available for ${side} side`);
  }

  // Construct rotation matrix: R_humerus_wrt_thorax
  // This represents how humerus frame is rotated relative to thorax frame
  const R = this.constructRotationMatrix(thoraxFrame, humerusFrame);

  // Extract Y-X-Y Euler angles from rotation matrix
  // Based on ISB standard (Wu et al. 2005)

  // X rotation (elevation): angle about intermediate X-axis
  const elevation = Math.acos(R[1][1]) * (180 / Math.PI);

  // Y1 rotation (plane of elevation): first rotation about Y-axis
  // 0° = sagittal plane (forward flexion)
  // 90° = coronal plane (abduction)
  const planeOfElevation = Math.atan2(R[0][1], R[2][1]) * (180 / Math.PI);

  // Y2 rotation (axial rotation): second rotation about Y-axis
  // Positive = external rotation, Negative = internal rotation
  const rotation = Math.atan2(R[1][0], -R[1][2]) * (180 / Math.PI);

  return {
    planeOfElevation,  // 0-180° (0=sagittal, 90=coronal, 180=posterior)
    elevation,         // 0-180° (magnitude of arm raise)
    rotation,          // -90 to +90° (internal/external rotation)
    confidence: Math.min(thoraxFrame.confidence, humerusFrame.confidence),
  };
}

/**
 * Construct 3x3 rotation matrix from two reference frames
 * Returns R_child_wrt_parent
 */
private constructRotationMatrix(
  parentFrame: AnatomicalReferenceFrame,
  childFrame: AnatomicalReferenceFrame
): number[][] {
  // Each frame has 3 orthonormal axes (x, y, z)
  // Rotation matrix columns are child axes expressed in parent coordinates

  // Dot product of child axes with parent axes
  const R = [
    [
      dotProduct(childFrame.xAxis, parentFrame.xAxis),
      dotProduct(childFrame.yAxis, parentFrame.xAxis),
      dotProduct(childFrame.zAxis, parentFrame.xAxis),
    ],
    [
      dotProduct(childFrame.xAxis, parentFrame.yAxis),
      dotProduct(childFrame.yAxis, parentFrame.yAxis),
      dotProduct(childFrame.zAxis, parentFrame.yAxis),
    ],
    [
      dotProduct(childFrame.xAxis, parentFrame.zAxis),
      dotProduct(childFrame.yAxis, parentFrame.zAxis),
      dotProduct(childFrame.zAxis, parentFrame.zAxis),
    ],
  ];

  return R;
}
```

**Type Definition**:
```typescript
export interface ShoulderEulerAngles {
  planeOfElevation: number;  // 0-180° (which plane arm is moving in)
  elevation: number;         // 0-180° (how high arm is raised)
  rotation: number;          // -90 to +90° (internal/external rotation)
  confidence: number;        // 0-1
}
```

**Clinical Interpretation**:
```typescript
// Example 1: Forward flexion (arm raised forward)
// planeOfElevation = 0°, elevation = 90°, rotation = 0°

// Example 2: Abduction (arm raised sideways)
// planeOfElevation = 90°, elevation = 90°, rotation = 0°

// Example 3: External rotation with elbow at 90°
// planeOfElevation = 90°, elevation = 0°, rotation = +45°
```

---

### 6.3 File-by-File Changes

#### 6.3.1 MODIFY: `src/services/goniometerService.ts`

**Changes Overview**:
1. Add `schemaRegistry` property and inject in constructor
2. Add `anatomicalService` property for plane calculations
3. Replace hardcoded `jointConfigs` with `getJointLandmarkIndices()` method
4. Refactor `calculateAngle()` to `calculateJointAngle()` (uses plane projection systematically)
5. Add `getMeasurementPlane()` method
6. Add `calculateShoulderEulerAngles()` method
7. Add `constructRotationMatrix()` helper method
8. Update all existing methods to use schema-aware approach

**Lines Changed**: ~150 lines modified, ~100 lines added

**Detailed Changes**:

```typescript
// BEFORE: Hardcoded configuration
const jointConfigs = [
  { name: 'left_elbow', indices: [5, 7, 9] },
  // ...
];

constructor(config: AngleCalculationConfig = {}) {
  this.config = {
    smoothingWindow: 5,
    minConfidence: 0.5,
    use3D: false,  // ❌
    ...config,
  };
}

// AFTER: Schema-aware
import { PoseSchemaRegistry } from './pose/PoseSchemaRegistry';
import { AnatomicalReferenceService } from './biomechanics/AnatomicalReferenceService';

class GoniometerService {
  private schemaRegistry: PoseSchemaRegistry;
  private anatomicalService: AnatomicalReferenceService;
  private angleHistory: Map<string, number[]> = new Map();
  private config: AngleCalculationConfig;

  constructor(config: AngleCalculationConfig = {}) {
    this.config = {
      smoothingWindow: 5,
      minConfidence: 0.5,
      use3D: true,  // ✅ Changed to true
      ...config,
    };

    this.schemaRegistry = PoseSchemaRegistry.getInstance();
    this.anatomicalService = new AnatomicalReferenceService();
  }

  // NEW: Schema-aware landmark resolution
  private getJointLandmarkIndices(
    jointName: string,
    schemaId: string
  ): { point1: number; joint: number; point2: number } {
    // [Full implementation from Section 6.2.1]
  }

  // REFACTORED: Main measurement method
  public calculateJointAngle(
    poseData: ProcessedPoseData,
    jointName: string
  ): JointAngleMeasurement {
    // [Full implementation from Section 6.2.2]
  }

  // NEW: Plane selection logic
  private getMeasurementPlane(
    jointName: string,
    thoraxFrame: AnatomicalReferenceFrame
  ): AnatomicalPlane {
    // [Full implementation from Section 6.2.2]
  }

  // NEW: Shoulder Euler angles
  public calculateShoulderEulerAngles(
    poseData: ProcessedPoseData,
    side: 'left' | 'right'
  ): ShoulderEulerAngles {
    // [Full implementation from Section 6.2.3]
  }

  // NEW: Rotation matrix construction
  private constructRotationMatrix(
    parentFrame: AnatomicalReferenceFrame,
    childFrame: AnatomicalReferenceFrame
  ): number[][] {
    // [Full implementation from Section 6.2.3]
  }

  // EXISTING (keep): Temporal smoothing, confidence checks, etc.
  // These methods remain unchanged
}
```

**Import Additions**:
```typescript
import { PoseSchemaRegistry } from './pose/PoseSchemaRegistry';
import { AnatomicalReferenceService } from './biomechanics/AnatomicalReferenceService';
import { ProcessedPoseData } from '../types/pose';
import { AnatomicalReferenceFrame, AnatomicalPlane } from '../types/biomechanics';
```

---

#### 6.3.2 MODIFY: `src/types/goniometry.ts` (or create if missing)

**Add new types**:

```typescript
export interface JointAngleMeasurement {
  jointName: string;
  angle: number;  // Degrees
  confidence: number;  // 0-1
  measurementPlane: AnatomicalPlane;
  timestamp: number;

  // For shoulder measurements:
  eulerAngles?: ShoulderEulerAngles;
}

export interface ShoulderEulerAngles {
  planeOfElevation: number;  // 0-180°
  elevation: number;          // 0-180°
  rotation: number;           // -90 to +90°
  confidence: number;
}
```

---

### 6.4 Test Suite (15 Tests)

#### 6.4.1 Schema-Awareness Tests (5 tests)

**File**: `src/services/__tests__/goniometerService.schema.test.ts`

```typescript
describe('GoniometerService - Schema Awareness', () => {
  let goniometer: GoniometerService;

  beforeEach(() => {
    goniometer = new GoniometerService();
  });

  it('should calculate elbow angle with MoveNet-17 schema', () => {
    const poseData = createMockPoseData('movenet-17', 'bicep_curl_90deg');
    const measurement = goniometer.calculateJointAngle(poseData, 'left_elbow');

    expect(measurement.angle).toBeCloseTo(90, 5); // ±5° tolerance
    expect(measurement.jointName).toBe('left_elbow');
  });

  it('should calculate elbow angle with MediaPipe-33 schema', () => {
    const poseData = createMockPoseData('mediapipe-33', 'bicep_curl_90deg');
    const measurement = goniometer.calculateJointAngle(poseData, 'left_elbow');

    expect(measurement.angle).toBeCloseTo(90, 5);
    expect(measurement.jointName).toBe('left_elbow');
  });

  it('should throw error if required landmarks missing in schema', () => {
    const customSchema = {
      id: 'custom-minimal',
      landmarks: [
        { index: 0, name: 'nose' },
        // Missing shoulder, elbow, wrist
      ],
    };

    PoseSchemaRegistry.getInstance().register(customSchema);
    const poseData = createMockPoseData('custom-minimal', 'bicep_curl_90deg');

    expect(() => {
      goniometer.calculateJointAngle(poseData, 'left_elbow');
    }).toThrow(/requires landmarks.*not available/);
  });

  it('should work with any schema that has required landmarks', () => {
    // Test future-proofing: New schema with same landmark names
    const futureSchema = {
      id: 'future-model-50pt',
      landmarkCount: 50,
      landmarks: [
        // ... many landmarks
        { index: 20, name: 'left_shoulder' },
        { index: 21, name: 'left_elbow' },
        { index: 22, name: 'left_wrist' },
      ],
    };

    PoseSchemaRegistry.getInstance().register(futureSchema);
    const poseData = createMockPoseData('future-model-50pt', 'arm_extended');

    expect(() => {
      goniometer.calculateJointAngle(poseData, 'left_elbow');
    }).not.toThrow();
  });

  it('should resolve landmark indices dynamically', () => {
    const poseDataMoveNet = createMockPoseData('movenet-17', 'standing');
    const poseDataMediaPipe = createMockPoseData('mediapipe-33', 'standing');

    // MoveNet: left_elbow = index 7
    // MediaPipe: left_elbow = index 13 (different)

    const measurementMoveNet = goniometer.calculateJointAngle(poseDataMoveNet, 'left_elbow');
    const measurementMediaPipe = goniometer.calculateJointAngle(poseDataMediaPipe, 'left_elbow');

    // Both should succeed despite different indices
    expect(measurementMoveNet.angle).toBeDefined();
    expect(measurementMediaPipe.angle).toBeDefined();
  });
});
```

---

#### 6.4.2 Plane Projection Tests (5 tests)

**File**: `src/services/__tests__/goniometerService.planeProjection.test.ts`

```typescript
describe('GoniometerService - Plane Projection', () => {
  let goniometer: GoniometerService;

  it('should project elbow angle onto sagittal plane', () => {
    const poseData = createMockPoseData('movenet-17', 'bicep_curl_90deg');
    const measurement = goniometer.calculateJointAngle(poseData, 'left_elbow');

    expect(measurement.measurementPlane.name).toBe('sagittal');
    expect(measurement.angle).toBeCloseTo(90, 3);
  });

  it('should project shoulder angle onto scapular plane', () => {
    const poseData = createMockPoseData('movenet-17', 'shoulder_abduction_90deg');
    const measurement = goniometer.calculateJointAngle(poseData, 'left_shoulder');

    expect(measurement.measurementPlane.name).toBe('scapular');
    expect(measurement.measurementPlane.rotation).toBe(35); // 35° from coronal
  });

  it('should give consistent angle regardless of camera angle', () => {
    // Same pose, different camera angles
    const frontalView = createMockPoseData('movenet-17', 'elbow_90_frontal_camera');
    const sagittalView = createMockPoseData('movenet-17', 'elbow_90_sagittal_camera');

    const measurementFrontal = goniometer.calculateJointAngle(frontalView, 'left_elbow');
    const measurementSagittal = goniometer.calculateJointAngle(sagittalView, 'left_elbow');

    // Plane projection should eliminate camera perspective difference
    expect(Math.abs(measurementFrontal.angle - measurementSagittal.angle)).toBeLessThan(3); // ±3° tolerance
  });

  it('should eliminate out-of-plane components', () => {
    // Elbow with slight shoulder rotation (out-of-plane movement)
    const poseData = createMockPoseData('movenet-17', 'elbow_90_with_rotation');

    const measurement = goniometer.calculateJointAngle(poseData, 'left_elbow');

    // Projection onto sagittal plane should ignore rotation component
    expect(measurement.angle).toBeCloseTo(90, 3);
  });

  it('should use cached anatomical frames for plane definition', () => {
    const poseData = createMockPoseData('movenet-17', 'standing_neutral');

    // Spy on anatomicalService to verify it uses cached frames
    const anatomicalServiceSpy = jest.spyOn(goniometer as any, 'anatomicalService');

    goniometer.calculateJointAngle(poseData, 'left_elbow');

    // Should NOT recalculate thorax frame (uses cached)
    expect(anatomicalServiceSpy).not.toHaveBeenCalledWith('calculateThoraxFrame');
  });
});
```

---

#### 6.4.3 Euler Angle Tests (5 tests)

**File**: `src/services/__tests__/goniometerService.eulerAngles.test.ts`

```typescript
describe('GoniometerService - Euler Angles', () => {
  let goniometer: GoniometerService;

  it('should calculate Euler angles for forward flexion', () => {
    // Arm raised 90° forward in sagittal plane
    const poseData = createMockPoseData('movenet-17', 'shoulder_flexion_90deg');
    const euler = goniometer.calculateShoulderEulerAngles(poseData, 'left');

    expect(euler.planeOfElevation).toBeCloseTo(0, 5); // Sagittal plane
    expect(euler.elevation).toBeCloseTo(90, 5);        // 90° elevation
    expect(euler.rotation).toBeCloseTo(0, 5);          // No axial rotation
  });

  it('should calculate Euler angles for abduction', () => {
    // Arm raised 90° sideways in coronal plane
    const poseData = createMockPoseData('movenet-17', 'shoulder_abduction_90deg');
    const euler = goniometer.calculateShoulderEulerAngles(poseData, 'left');

    expect(euler.planeOfElevation).toBeCloseTo(90, 5); // Coronal plane
    expect(euler.elevation).toBeCloseTo(90, 5);
    expect(euler.rotation).toBeCloseTo(0, 5);
  });

  it('should calculate Euler angles for external rotation', () => {
    // Elbow at 90°, forearm rotated outward
    const poseData = createMockPoseData('movenet-17', 'external_rotation_45deg');
    const euler = goniometer.calculateShoulderEulerAngles(poseData, 'left');

    expect(euler.planeOfElevation).toBeCloseTo(90, 5); // Coronal plane
    expect(euler.elevation).toBeCloseTo(0, 10);         // Arm down
    expect(euler.rotation).toBeCloseTo(45, 5);          // 45° external rotation
  });

  it('should calculate Euler angles for internal rotation', () => {
    const poseData = createMockPoseData('movenet-17', 'internal_rotation_30deg');
    const euler = goniometer.calculateShoulderEulerAngles(poseData, 'left');

    expect(euler.rotation).toBeCloseTo(-30, 5); // Negative = internal rotation
  });

  it('should throw error if humerus frame not available', () => {
    const poseData = createMockPoseData('movenet-17', 'left_arm_occluded');
    // cachedAnatomicalFrames.left_humerus will be undefined

    expect(() => {
      goniometer.calculateShoulderEulerAngles(poseData, 'left');
    }).toThrow(/Humerus frame not available/);
  });
});
```

---

### 6.5 Definition of Done

#### Functional Criteria

- [ ] `getJointLandmarkIndices()` method implemented (schema-aware)
- [ ] `calculateJointAngle()` refactored to use plane projection systematically
- [ ] `getMeasurementPlane()` method implemented (automatic plane selection)
- [ ] `calculateShoulderEulerAngles()` method implemented (Y-X-Y decomposition)
- [ ] `constructRotationMatrix()` helper method implemented
- [ ] Works with both MoveNet-17 and MediaPipe-33 schemas
- [ ] All 27 existing goniometer tests still pass

#### Accuracy Criteria

- [ ] Shoulder Euler angles: ±5° accuracy vs. known ground truth
- [ ] Elbow/knee angles: ±3° accuracy with plane projection
- [ ] Camera angle independence: <3° variance between frontal/sagittal views of same pose

#### Performance Criteria

- [ ] Single joint angle calculation: <5ms (leveraging cached frames)
- [ ] No performance regression vs. current implementation

#### Test Criteria

- [ ] 15 new tests written and passing:
  - [ ] 5 schema-awareness tests
  - [ ] 5 plane projection tests
  - [ ] 5 Euler angle tests
- [ ] Test coverage: >90% for new methods

#### Code Quality Criteria

- [ ] TypeScript strict mode passing
- [ ] All methods have JSDoc with ISB citations
- [ ] No breaking changes to existing API (backward compatible)

#### Documentation Criteria

- [ ] Schema-awareness pattern documented
- [ ] Plane projection rationale documented
- [ ] Euler angle interpretation guide written
- [ ] Migration guide for consumers

---

### 6.6 Validation Checkpoint

Before proceeding to Gate 10A, verify:

**Schema Flexibility Validation**:
```bash
# Test with MoveNet-17
npm run test -- --testNamePattern="MoveNet-17"

# Test with MediaPipe-33
npm run test -- --testNamePattern="MediaPipe-33"

# Expected: All tests pass with both schemas
```

**Accuracy Validation**:
```bash
# Compare plane-projected vs. direct 3D angles
npm run test -- --testNamePattern="plane projection accuracy"

# Expected: Plane-projected angles consistent across camera angles
```

**Euler Angle Validation**:
```bash
# Test shoulder Euler decomposition
npm run test -- --testNamePattern="Euler angles"

# Expected: 3 components (plane, elevation, rotation) correctly calculated
```

**Integration Validation**:
```bash
# Ensure downstream services work with refactored goniometer
npm run test -- ExerciseValidationService
npm run test -- ShoulderROMTracker

# Expected: All tests pass, measurements more accurate
```

---

**Next**: Section 7 will specify Gate 10A (Clinical Measurement Service) for joint-specific measurement functions with compensation detection and quality assessment.

