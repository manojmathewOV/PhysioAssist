# Ultra-Granular 3D Anatomical Implementation Plan

## Gated Development with Comprehensive Validation

> **Philosophy**: No stage proceeds until current stage passes ALL validation criteria
> **Validation**: COMPREHENSIVE_VALIDATION_PROMPT.md style checking after each gate
> **Quality Gates**: Lint → Tests → Integration → Clinical Validation → Documentation

---

## 📊 Overall Progress Tracking

| Gate         | Status      | Tests   | Lint | Integration | Clinical | Docs |
| ------------ | ----------- | ------- | ---- | ----------- | -------- | ---- |
| **Gate 9A**  | ✅ COMPLETE | 102/102 | ✅   | ✅          | ⏳       | ✅   |
| **Gate 9B**  | 🔄 READY    | 0/25    | ⏳   | ⏳          | ⏳       | ⏳   |
| **Gate 9C**  | ⏳ BLOCKED  | 0/30    | ⏳   | ⏳          | ⏳       | ⏳   |
| **Gate 10A** | ⏳ BLOCKED  | 0/40    | ⏳   | ⏳          | ⏳       | ⏳   |
| **Gate 10B** | ⏳ BLOCKED  | 0/35    | ⏳   | ⏳          | ⏳       | ⏳   |
| **Gate 10C** | ⏳ BLOCKED  | 0/25    | ⏳   | ⏳          | ⏳       | ⏳   |
| **Final**    | ⏳ BLOCKED  | 0/50    | ⏳   | ✅          | ⏳       | ⏳   |

---

## 🎯 GATE 9A: Foundation (COMPLETED) ✅

### Deliverables (All Complete)

- ✅ ISB-compliant biomechanics types
- ✅ 3D vector math utilities
- ✅ Anatomical reference frame service
- ✅ Enhanced goniometer with plane-aware calculations

### Validation Results

```
✅ Unit Tests: 102/102 passing (100%)
✅ ESLint: 0 errors in Gate 9 files
✅ TypeScript: Strict mode passing
✅ Performance: <1ms vector ops, <5ms frame calculations
✅ Documentation: Comprehensive JSDoc coverage
✅ Git: 5 commits pushed to remote
```

### Known Gaps (To Address in Gate 9B)

1. ❌ Schema registry not implemented (hardcoded MoveNet 17)
2. ❌ Orientation metadata not captured
3. ❌ Frame caching not implemented
4. ❌ Clinical validation pending (no benchmark datasets)
5. ❌ Integration with existing ShoulderROMTracker pending

---

## 🚀 GATE 9B: Schema Foundation & Metadata

**Duration**: 3-5 days
**Prerequisites**: Gate 9A complete ✅
**Blocks**: Gate 9C, Gate 10A

### Phase 9B.1: Type Extensions (Day 1 Morning)

#### Tasks

- [ ] **9B.1.1**: Extend `ProcessedPoseData` with metadata fields

  - Add `schemaId?: 'movenet-17' | 'mediapipe-33'`
  - Add `viewOrientation?: 'frontal' | 'sagittal' | 'posterior'`
  - Add `cameraAzimuth?: number`
  - Add `hasDepth?: boolean`
  - Add `qualityScore?: number`
  - **File**: `src/types/pose.ts`
  - **Lines**: ~15-25
  - **Complexity**: LOW

- [ ] **9B.1.2**: Create `PoseSchema` interface
  - Define schema structure with landmark mapping
  - Include anatomical groups
  - **File**: `src/types/pose.ts` (new section)
  - **Lines**: ~40-60
  - **Complexity**: LOW

#### Definition of Done (9B.1)

```yaml
Code:
  - ✅ TypeScript strict mode passing
  - ✅ All new types exported from index.ts
  - ✅ JSDoc comments on all interfaces
  - ✅ Backward compatibility maintained

Lint:
  - ✅ ESLint: 0 errors
  - ✅ Prettier: formatted
  - ✅ No unused imports

Tests:
  - ✅ Type compatibility tests written (5 tests minimum)
  - ✅ All tests passing
  - ✅ Test coverage: 100% on new types

Git:
  - ✅ Commit message follows convention
  - ✅ Changes staged and committed
  - ⏸️ NOT pushed (wait for phase completion)

Validation Checklist:
  - [ ] Run: npm run type-check
  - [ ] Run: npm run lint -- src/types/
  - [ ] Run: npm test -- src/types/__tests__/
  - [ ] Verify: No breaking changes to existing code
  - [ ] Review: All type exports in index.ts
```

---

### Phase 9B.2: Schema Registry (Day 1 Afternoon)

#### Tasks

- [ ] **9B.2.1**: Create `PoseSchemaRegistry` class

  - Singleton pattern
  - MoveNet 17 schema definition
  - MediaPipe 33 schema definition (stub)
  - **File**: `src/services/pose/PoseSchemaRegistry.ts` (NEW)
  - **Lines**: ~150-200
  - **Complexity**: MEDIUM

- [ ] **9B.2.2**: Define MoveNet 17 schema

  - 17 landmark names
  - Anatomical groups (torso, leftArm, rightArm, leftLeg, rightLeg)
  - Confidence thresholds
  - **Within**: `PoseSchemaRegistry.ts`
  - **Lines**: ~60-80
  - **Complexity**: LOW

- [ ] **9B.2.3**: Define MediaPipe 33 schema (stub)
  - 33 landmark names
  - Extended anatomical groups
  - Mark as experimental
  - **Within**: `PoseSchemaRegistry.ts`
  - **Lines**: ~80-120
  - **Complexity**: LOW

#### Definition of Done (9B.2)

```yaml
Code:
  - ✅ PoseSchemaRegistry implements singleton
  - ✅ register() and get() methods working
  - ✅ Both schemas registered on initialization
  - ✅ Type-safe schema access
  - ✅ Error handling for unknown schemas

Lint:
  - ✅ ESLint: 0 errors
  - ✅ No magic numbers (use constants)
  - ✅ Consistent naming conventions

Tests:
  - ✅ Schema registration tests (3 tests)
  - ✅ Schema retrieval tests (3 tests)
  - ✅ Error handling tests (2 tests)
  - ✅ MoveNet schema validation (5 tests)
  - ✅ MediaPipe schema validation (5 tests)
  - ✅ Total: 18 tests minimum
  - ✅ Test coverage: ≥95%

Documentation:
  - ✅ JSDoc on all public methods
  - ✅ Usage examples in comments
  - ✅ Schema format documented

Git:
  - ✅ Commit: "feat(pose): Add PoseSchemaRegistry with MoveNet/MediaPipe schemas"
  - ⏸️ NOT pushed (wait for phase completion)

Validation Checklist:
  - [ ] Run: npm test -- src/services/pose/__tests__/PoseSchemaRegistry.test.ts
  - [ ] Run: npm run lint -- src/services/pose/
  - [ ] Verify: Both schemas retrievable
  - [ ] Verify: Unknown schema returns undefined
  - [ ] Verify: No console warnings
```

---

### Phase 9B.3: Orientation Classifier (Day 2 Morning)

#### Tasks

- [ ] **9B.3.1**: Create `OrientationClassifier` class

  - Heuristic-based classification
  - Confidence scoring
  - Fallback logic
  - **File**: `src/services/pose/OrientationClassifier.ts` (NEW)
  - **Lines**: ~200-250
  - **Complexity**: HIGH

- [ ] **9B.3.2**: Implement frontal view detection

  - Wide shoulders/hips heuristic
  - Confidence > 0.8 when clear
  - **Within**: `OrientationClassifier.ts`
  - **Lines**: ~40-60
  - **Complexity**: MEDIUM

- [ ] **9B.3.3**: Implement sagittal view detection

  - Narrow body profile heuristic
  - Depth cues when available
  - **Within**: `OrientationClassifier.ts`
  - **Lines**: ~40-60
  - **Complexity**: MEDIUM

- [ ] **9B.3.4**: Implement posterior view detection

  - Landmark visibility patterns
  - Shoulder/hip alignment
  - **Within**: `OrientationClassifier.ts`
  - **Lines**: ~40-60
  - **Complexity**: MEDIUM

- [ ] **9B.3.5**: Add temporal smoothing
  - Sliding window (5 frames)
  - Prevent rapid flips
  - **Within**: `OrientationClassifier.ts`
  - **Lines**: ~30-40
  - **Complexity**: MEDIUM

#### Definition of Done (9B.3)

```yaml
Code:
  - ✅ classify() returns {orientation, confidence}
  - ✅ classifyWithHistory() for temporal smoothing
  - ✅ All three orientations detectable
  - ✅ Confidence scoring 0-1 scale
  - ✅ Graceful degradation (fallback to 'frontal')

Lint:
  - ✅ ESLint: 0 errors
  - ✅ Cyclomatic complexity < 10 per method
  - ✅ Max function length: 50 lines

Tests:
  - ✅ Frontal detection tests (5 tests)
  - ✅ Sagittal detection tests (5 tests)
  - ✅ Posterior detection tests (5 tests)
  - ✅ Confidence scoring tests (3 tests)
  - ✅ Temporal smoothing tests (4 tests)
  - ✅ Edge cases: occluded landmarks (3 tests)
  - ✅ Total: 25 tests minimum
  - ✅ Test coverage: ≥90%

Performance:
  - ✅ Classification time: <2ms per frame
  - ✅ No memory leaks in history buffer

Documentation:
  - ✅ Algorithm explanation in JSDoc
  - ✅ Accuracy limitations documented
  - ✅ Clinical use cases described

Git:
  - ✅ Commit: "feat(pose): Add OrientationClassifier with temporal smoothing"
  - ⏸️ NOT pushed (wait for phase completion)

Validation Checklist:
  - [ ] Run: npm test -- src/services/pose/__tests__/OrientationClassifier.test.ts
  - [ ] Run: npm run lint -- src/services/pose/OrientationClassifier.ts
  - [ ] Benchmark: Performance test with 1000 iterations
  - [ ] Verify: Confidence always in [0,1] range
  - [ ] Verify: Temporal smoothing prevents flipping
  - [ ] Test: Manual verification with sample pose data
```

---

### Phase 9B.4: PoseDetectionService Integration (Day 2 Afternoon)

#### Tasks

- [ ] **9B.4.1**: Update `PoseDetectionServiceV2.processFrame()`

  - Emit `schemaId` metadata
  - Call `OrientationClassifier.classify()`
  - Populate `viewOrientation` and confidence
  - Calculate `qualityScore`
  - **File**: `src/services/PoseDetectionService.v2.ts`
  - **Lines Modified**: ~30-50
  - **Complexity**: MEDIUM

- [ ] **9B.4.2**: Add quality score calculation

  - Factor: lighting (mock for now)
  - Factor: distance (mock for now)
  - Factor: landmark visibility
  - **Within**: `PoseDetectionService.v2.ts`
  - **Lines**: ~20-30
  - **Complexity**: LOW

- [ ] **9B.4.3**: Update existing tests
  - Expect new metadata fields
  - Verify orientation classification
  - **File**: `src/services/__tests__/PoseDetectionService.v2.test.ts`
  - **Lines Modified**: ~50-80
  - **Complexity**: MEDIUM

#### Definition of Done (9B.4)

```yaml
Code:
  - ✅ ProcessedPoseData includes all metadata
  - ✅ Orientation classified on every frame
  - ✅ Quality score computed
  - ✅ Backward compatibility: metadata optional
  - ✅ Schema ID correctly set

Lint:
  - ✅ ESLint: 0 errors
  - ✅ No eslint-disable comments added

Tests:
  - ✅ Existing tests still passing
  - ✅ New metadata tests (8 tests)
  - ✅ Orientation integration tests (5 tests)
  - ✅ Quality score tests (4 tests)
  - ✅ Total new tests: 17 minimum
  - ✅ Overall test suite: 100% passing

Integration:
  - ✅ Works with existing consumers
  - ✅ No breaking changes
  - ✅ Metadata properly propagated

Git:
  - ✅ Commit: "feat(pose): Integrate orientation and metadata into PoseDetectionServiceV2"
  - ⏸️ NOT pushed (wait for gate completion)

Validation Checklist:
  - [ ] Run: npm test -- src/services/__tests__/PoseDetectionService.v2.test.ts
  - [ ] Run: npm test (full suite)
  - [ ] Verify: All existing tests passing
  - [ ] Verify: New metadata in output
  - [ ] Manual test: Run detection, inspect ProcessedPoseData
  - [ ] Check: No regression in existing features
```

---

### Phase 9B.5: Frame Caching (Day 3 Morning)

#### Tasks

- [ ] **9B.5.1**: Add `computeAllFrames()` to `AnatomicalReferenceService`

  - Compute global, thorax, scapular in one call
  - Optional caching with TTL
  - Return all frames in single object
  - **File**: `src/services/biomechanics/AnatomicalReferenceService.ts`
  - **Lines Added**: ~60-80
  - **Complexity**: MEDIUM

- [ ] **9B.5.2**: Implement LRU cache

  - Max size: 60 frames (~1 sec at 60fps)
  - TTL: 16ms (1 frame at 60fps)
  - Cache key: hash of landmark positions
  - **Within**: `AnatomicalReferenceService.ts`
  - **Lines**: ~40-60
  - **Complexity**: MEDIUM

- [ ] **9B.5.3**: Add cache hit/miss metrics
  - Track cache efficiency
  - Expose via telemetry
  - **Within**: `AnatomicalReferenceService.ts`
  - **Lines**: ~20-30
  - **Complexity**: LOW

#### Definition of Done (9B.5)

```yaml
Code:
  - ✅ computeAllFrames() returns all frames
  - ✅ Cache working with TTL expiration
  - ✅ Cache size limited
  - ✅ clearCache() method available
  - ✅ getCacheStats() for monitoring

Lint:
  - ✅ ESLint: 0 errors
  - ✅ Cache implementation clean

Tests:
  - ✅ computeAllFrames() tests (5 tests)
  - ✅ Cache hit tests (3 tests)
  - ✅ Cache miss tests (3 tests)
  - ✅ TTL expiration tests (3 tests)
  - ✅ Cache eviction tests (3 tests)
  - ✅ Performance tests (3 tests)
  - ✅ Total: 20 tests minimum
  - ✅ Test coverage: ≥90%

Performance:
  - ✅ Cache hit: <0.1ms
  - ✅ Cache miss: <5ms (frame computation)
  - ✅ No memory leaks
  - ✅ Cache size stable

Git:
  - ✅ Commit: "feat(biomechanics): Add frame caching to AnatomicalReferenceService"
  - ⏸️ NOT pushed (wait for gate completion)

Validation Checklist:
  - [ ] Run: npm test -- src/services/biomechanics/__tests__/
  - [ ] Benchmark: 1000 frames with/without cache
  - [ ] Verify: Cache hit rate >80% in typical use
  - [ ] Memory: Monitor cache size growth
  - [ ] Performance: <5ms average per frame
```

---

### GATE 9B VALIDATION CHECKPOINT ✋

**STOP**: Do not proceed to Gate 9C until ALL criteria pass.

#### Comprehensive Validation Protocol (COMPREHENSIVE_VALIDATION_PROMPT.md style)

```yaml
===== GATE 9B VALIDATION PROTOCOL =====

1. UNIT TESTS
   Command: npm test -- src/services/pose/ src/services/biomechanics/ src/types/
   Required: ALL tests passing
   Expected: 60+ new tests (25 OrientationClassifier + 18 SchemaRegistry + 17 integration + 20 caching)
   Actual: ___ / ___ passing
   Status: ⏳ PENDING

2. INTEGRATION TESTS
   Command: npm test
   Required: ALL existing tests still passing
   Expected: 102 (Gate 9A) + 60 (Gate 9B) = 162 total
   Actual: ___ / ___ passing
   Status: ⏳ PENDING

3. LINT CHECK
   Command: npm run lint -- src/services/pose/ src/services/biomechanics/ src/types/
   Required: 0 errors
   Allowed: 0 warnings in new code
   Actual Errors: ___
   Actual Warnings: ___
   Status: ⏳ PENDING

4. TYPE CHECK
   Command: npm run type-check
   Required: 0 errors
   Expected: Strict mode passing
   Actual: ___
   Status: ⏳ PENDING

5. PERFORMANCE BENCHMARKS
   Tests:
     - Orientation classification: <2ms ✅/❌
     - Frame caching (hit): <0.1ms ✅/❌
     - Frame caching (miss): <5ms ✅/❌
     - Overall frame processing: <10ms ✅/❌
   Status: ⏳ PENDING

6. BACKWARD COMPATIBILITY
   Checks:
     - Existing ShoulderROMTracker works: ✅/❌
     - Existing exercise validation works: ✅/❌
     - Metadata optional (no breaking changes): ✅/❌
     - All existing consumers functional: ✅/❌
   Status: ⏳ PENDING

7. CODE QUALITY
   Metrics:
     - Test coverage: ≥90% required (___ % actual)
     - Cyclomatic complexity: ≤10 per method
     - Max function length: ≤50 lines
     - Documentation: JSDoc on all public APIs
   Status: ⏳ PENDING

8. GIT HYGIENE
   Requirements:
     - Clean commit history ✅/❌
     - Descriptive commit messages ✅/❌
     - No uncommitted changes ✅/❌
     - All phases committed separately ✅/❌
   Status: ⏳ PENDING

9. MANUAL TESTING
   Scenarios:
     - Run PoseDetectionServiceV2 with real video
     - Verify orientation classification accuracy
     - Check frame caching efficiency
     - Inspect ProcessedPoseData metadata
   Results: _______________
   Status: ⏳ PENDING

10. DOCUMENTATION
    Checklist:
      - All new types documented ✅/❌
      - Schema registry usage examples ✅/❌
      - Orientation classifier limitations noted ✅/❌
      - Caching behavior documented ✅/❌
      - Migration notes for consumers ✅/❌
    Status: ⏳ PENDING

===== GATE 9B COMPLETION CRITERIA =====

ALL of the following must be TRUE to proceed:
  ⏳ 1. Unit tests: 100% passing
  ⏳ 2. Integration tests: 100% passing
  ⏳ 3. Lint check: 0 errors
  ⏳ 4. Type check: 0 errors
  ⏳ 5. Performance: All benchmarks within targets
  ⏳ 6. Backward compatibility: No breaking changes
  ⏳ 7. Code quality: All metrics met
  ⏳ 8. Git: Clean and organized
  ⏳ 9. Manual testing: Passed
  ⏳ 10. Documentation: Complete

OVERALL GATE 9B STATUS: ⏳ NOT READY
BLOCKER FOR: Gate 9C, Gate 10A
PROCEED TO GATE 9C: ❌ NO

===== SIGN-OFF REQUIRED =====
Developer: ___________________ Date: _______
Reviewer: ____________________ Date: _______
```

#### Gate 9B Push Protocol

```bash
# Only execute if ALL validation criteria pass

# 1. Squash commits if needed
git rebase -i HEAD~5  # Review last 5 commits

# 2. Final test run
npm test && npm run lint && npm run type-check

# 3. Push to remote
git push --no-verify  # Only if CI will validate

# 4. Create Gate 9B milestone tag
git tag -a gate-9b-complete -m "Gate 9B: Schema Foundation & Metadata - VALIDATED"
git push origin gate-9b-complete

# 5. Update tracking
# Update docs/planning/ULTRA_GRANULAR_IMPLEMENTATION_PLAN.md
# Mark Gate 9B as ✅ COMPLETE
```

---

## 🚀 GATE 9C: Depth Handling & Enhanced Integration

**Duration**: 2-3 days
**Prerequisites**: Gate 9B complete ✅
**Blocks**: Gate 10A

### Phase 9C.1: Depth Estimation (Day 1)

#### Tasks

- [ ] **9C.1.1**: Create `DepthEstimator` class

  - Heuristic-based depth from 2D
  - Shoulder width normalization
  - Body part depth estimation
  - **File**: `src/utils/depthEstimation.ts` (NEW)
  - **Lines**: ~150-200
  - **Complexity**: HIGH

- [ ] **9C.1.2**: Update `PoseDetectionServiceV2`
  - Populate z-coordinate when available
  - Fall back to estimated depth
  - Set `hasDepth` metadata flag
  - **File**: `src/services/PoseDetectionService.v2.ts`
  - **Lines Modified**: ~20-30
  - **Complexity**: LOW

#### Definition of Done (9C.1)

```yaml
Code:
  - ✅ estimateDepthFrom2D() working
  - ✅ z-coordinates populated
  - ✅ hasDepth flag accurate
  - ✅ Confidence penalty for estimated depth

Lint:
  - ✅ ESLint: 0 errors

Tests:
  - ✅ Depth estimation tests (10 tests)
  - ✅ Integration tests (8 tests)
  - ✅ Confidence tests (4 tests)
  - ✅ Total: 22 tests minimum

Performance:
  - ✅ Estimation time: <1ms

Validation:
  - [ ] Compare against ground truth (if available)
  - [ ] Visual inspection of depth estimates
  - [ ] Verify z-coordinates reasonable
```

---

### Phase 9C.2: ShoulderROMTracker Integration (Day 2)

#### Tasks

- [ ] **9C.2.1**: Refactor `calculateShoulderAngle()`

  - Use `AnatomicalReferenceService.computeAllFrames()`
  - Measure in scapular plane
  - Use cached frames
  - **File**: `src/features/shoulderAnalytics/ShoulderROMTracker.ts`
  - **Lines Modified**: ~80-120
  - **Complexity**: HIGH

- [ ] **9C.2.2**: Add trunk lean detection

  - Compare thorax.yAxis to global.yAxis
  - Flag if deviation >10°
  - **Within**: `ShoulderROMTracker.ts`
  - **Lines Added**: ~40-60
  - **Complexity**: MEDIUM

- [ ] **9C.2.3**: Update tests
  - Test scapular plane measurement
  - Test trunk lean detection
  - **File**: `src/features/shoulderAnalytics/__tests__/ShoulderROMTracker.test.ts`
  - **Tests Added**: ~15-20
  - **Complexity**: MEDIUM

#### Definition of Done (9C.2)

```yaml
Code:
  - ✅ Uses anatomical frames
  - ✅ Scapular plane measurement
  - ✅ Trunk lean detection working
  - ✅ Backward compatible

Lint:
  - ✅ ESLint: 0 errors

Tests:
  - ✅ All existing tests passing
  - ✅ Scapular plane tests (8 tests)
  - ✅ Trunk lean tests (7 tests)
  - ✅ Integration tests (5 tests)
  - ✅ Total: 20 new tests minimum

Clinical:
  - ✅ Accuracy within ±5° of Gate 9A
  - ✅ Trunk lean detection validated

Validation:
  - [ ] Manual test with shoulder abduction video
  - [ ] Verify scapular plane angle vs frontal plane
  - [ ] Confirm trunk lean flagged appropriately
```

---

### GATE 9C VALIDATION CHECKPOINT ✋

```yaml
===== GATE 9C VALIDATION PROTOCOL =====

[Similar structure to 9B, with 30 tests expected]

OVERALL GATE 9C STATUS: ⏳ NOT READY
BLOCKER FOR: Gate 10A
PROCEED TO GATE 10A: ❌ NO
```

---

## 🏥 GATE 10A: Clinical Measurement Service Foundation

**Duration**: 4-5 days
**Prerequisites**: Gate 9C complete ✅
**Blocks**: Gate 10B

### Phase 10A.1: ClinicalMeasurementService Skeleton (Day 1)

#### Tasks

- [ ] **10A.1.1**: Create service structure
- [ ] **10A.1.2**: Define measurement interfaces
- [ ] **10A.1.3**: Implement base measurement methods

[... continues with ultra-granular breakdown ...]

---

## 🏥 GATE 10B: Clinical Measurements Implementation

[... ultra-granular breakdown ...]

---

## 🏥 GATE 10C: Compensation Detection

[... ultra-granular breakdown ...]

---

## 🎓 FINAL VALIDATION GATE

**STOP**: Final comprehensive validation before production.

### Final COMPREHENSIVE_VALIDATION_PROTOCOL

```yaml
===== FINAL PRODUCTION READINESS VALIDATION =====

1. COMPLETE TEST SUITE
   Total Tests Required: 307 minimum
   Breakdown:
     - Gate 9A: 102 tests ✅
     - Gate 9B: 60 tests ⏳
     - Gate 9C: 30 tests ⏳
     - Gate 10A: 40 tests ⏳
     - Gate 10B: 35 tests ⏳
     - Gate 10C: 25 tests ⏳
     - Final integration: 15 tests ⏳

   Actual: ___ / 307
   Pass Rate Required: 100%
   Status: ⏳ PENDING

2. ZERO LINT ERRORS
   Command: npm run lint
   Pre-existing errors acceptable: YES (216 known)
   New errors acceptable: NO
   Gate 9-10 files errors: 0 required
   Status: ⏳ PENDING

3. CLINICAL VALIDATION
   Benchmark Dataset:
     - 50 shoulder ROM videos
     - 25 compensation pattern videos
     - 25 multi-view videos

   Accuracy Targets:
     - Forward flexion MAE: ≤5° ⏳
     - External rotation MAE: ≤5° ⏳
     - Abduction MAE: ≤5° ⏳
     - Compensation detection: ≥85% sensitivity ⏳
     - False positive rate: ≤10% ⏳

   Status: ⏳ PENDING

4. PERFORMANCE VALIDATION
   Targets:
     - Desktop: <80ms/frame ⏳
     - High-end mobile: <120ms/frame ⏳
     - Mid-range mobile: <200ms/frame ⏳

   Memory:
     - No memory leaks ⏳
     - Cache size stable ⏳

   Status: ⏳ PENDING

5. INTEGRATION VALIDATION
   End-to-end workflows:
     - Frontal shoulder abduction ⏳
     - Sagittal forward flexion ⏳
     - External rotation (elbow at 90°) ⏳
     - Internal rotation behind back ⏳
     - Multi-angle capture flow ⏳

   Status: ⏳ PENDING

6. DOCUMENTATION COMPLETENESS
   Required:
     - API documentation ⏳
     - Clinical measurement guide ⏳
     - Migration guide ⏳
     - UI copy for patient guidance ⏳
     - Troubleshooting guide ⏳

   Status: ⏳ PENDING

7. CLINICIAN SIGN-OFF
   Required approvals:
     - Measurement accuracy review ⏳
     - Compensation detection review ⏳
     - UI/UX for patient guidance ⏳
     - Reporting clarity ⏳

   Status: ⏳ PENDING

===== PRODUCTION READINESS: ⏳ NOT READY =====

Required for PROD: ALL criteria ✅
Estimated completion: ___ days remaining
Release date: TBD
```

---

## 📋 Appendix A: Commit Message Conventions

```
Format: <type>(<scope>): <subject>

Types:
  - feat: New feature
  - fix: Bug fix
  - refactor: Code restructure
  - test: Test additions
  - docs: Documentation
  - perf: Performance improvement

Scopes:
  - types: Type definitions
  - pose: Pose detection services
  - biomechanics: Anatomical reference services
  - clinical: Clinical measurement services
  - goniometer: Goniometer service
  - utils: Utility functions

Examples:
  - feat(pose): Add PoseSchemaRegistry with MoveNet/MediaPipe schemas
  - feat(biomechanics): Add frame caching to AnatomicalReferenceService
  - test(clinical): Add forward flexion measurement tests
  - docs(api): Document ClinicalMeasurementService API
```

---

## 📋 Appendix B: Test Coverage Requirements

```yaml
Minimum Coverage by Module:
  types/: 100%
  utils/vectorMath.ts: 100%
  services/pose/: ≥90%
  services/biomechanics/: ≥90%
  services/clinical/: ≥85%

Overall Project: ≥85%

Coverage Commands: npm test -- --coverage
  npm test -- --coverage --coverageReporters=html
  open coverage/index.html
```

---

## 📋 Appendix C: Performance Benchmarking

```typescript
// Benchmark template
describe('Performance Benchmarks', () => {
  it('should complete operation in target time', () => {
    const iterations = 10000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      // Operation under test
    }

    const end = performance.now();
    const avgTime = (end - start) / iterations;

    expect(avgTime).toBeLessThan(TARGET_MS);
  });
});
```

---

**END OF ULTRA-GRANULAR IMPLEMENTATION PLAN**

**Next Action**: Begin Gate 9B Phase 9B.1 (Type Extensions)
