## 5. GATE 9B.5: ANATOMICAL FRAME CACHING

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

**Example scenario** (shoulder flexion measurement):
```typescript
// Current flow (WITHOUT caching):
const globalFrame = anatomicalService.calculateGlobalFrame(landmarks);    // 3ms
const thoraxFrame = anatomicalService.calculateThoraxFrame(landmarks, globalFrame); // 3ms
const humerusFrame = anatomicalService.calculateHumerusFrame(landmarks, 'left', thoraxFrame); // 3ms

// Now measure elbow as secondary joint:
const globalFrame2 = anatomicalService.calculateGlobalFrame(landmarks);   // 3ms REDUNDANT
const thoraxFrame2 = anatomicalService.calculateThoraxFrame(landmarks, globalFrame2); // 3ms REDUNDANT
const forearmFrame = anatomicalService.calculateForearmFrame(landmarks, 'left', thoraxFrame2); // 3ms

// Total: 18ms just for frame calculation (6 frames, 3 unique)
```

**With caching**:
```typescript
// First calculation: 9ms (3 unique frames)
// Subsequent lookups: <0.1ms (cache hits)
// Total: ~9.3ms → 50% reduction
```

**Scaled Impact**: For clinical validation workflows measuring 5-10 joints simultaneously, uncached computation could exceed 50-100ms, leaving no budget for ML inference or UI rendering.

---

#### Success Criteria

**Performance Targets**:
- ✅ Cache hit rate: >80% for typical multi-joint measurements
- ✅ Cache lookup time: <0.1ms (hash map O(1))
- ✅ Frame computation with cache: <16ms total per video frame (5 frames × 3ms, 80% hit rate)
- ✅ Memory footprint: <1MB for 60-frame cache (worst case: 60 frames × 7 frame types × 200 bytes/frame ≈ 84KB)

**Functional Targets**:
- ✅ LRU eviction: Oldest frames discarded when cache exceeds 60 entries
- ✅ TTL expiration: Frames invalidated after 16ms (target 60fps)
- ✅ Spatial consistency: Small landmark movements (<2px) share cache entries (bucketing)
- ✅ Thread-safe: Works correctly with async pose detection

**Quality Targets**:
- ✅ No frame accuracy degradation (cache returns exact same objects as fresh calculation)
- ✅ All existing AnatomicalReferenceService tests pass unchanged
- ✅ 20 new cache-specific tests covering hit/miss, eviction, TTL, bucketing

---

### 5.2 Implementation Specification

This section is complete in the main kickstart plan document. See `docs/implementation/ULTRA_DETAILED_KICKSTART_PLAN.md` Section 5.2 for the complete cache architecture, ProcessedPoseData extension, and PoseDetectionServiceV2 integration code.

---

### 5.3 Test Suite (20 Tests)

See main document Section 5.4 for complete test specifications.

---

### 5.4 Definition of Done

See main document Section 5.5 for complete DoD criteria.

---

### 5.5 Validation Checkpoint

See main document Section 5.6 for complete validation procedures.
