# Developer Action Plan: 3D Anatomical Reference Frames

## Immediate Next Steps

> **Status:** Ready to implement
> **Start Gate:** Gate 9
> **Estimated Time to First Value:** 8-10 days

---

## 🎯 What We're Building

Transform PhysioAssist from **2D exercise tracking** → **3D clinical-grade joint measurement**

**Current Problem:**

- Shoulder ROM measured in screen plane only (not anatomically correct)
- Can't separate spine lean from actual shoulder motion
- No depth perception (all z-values = 0)
- Compensation detection is basic heuristics

**After Implementation:**

- ✅ Measure joints in anatomical planes (sagittal, coronal, scapular)
- ✅ Primary joint (shoulder) measured relative to secondary joints (spine, elbow)
- ✅ True 3D calculations with depth
- ✅ 98% accurate compensation detection

---

## 📋 Immediate Action: Start Gate 9

### Day 1: Setup & Types (3-4 hours)

**Morning:**

1. Create feature branch

   ```bash
   git checkout -b feature/gate-9-3d-reference-frames
   ```

2. Create type definitions

   ```bash
   # Create new file
   touch src/types/biomechanics.ts
   ```

3. Copy type definitions from Gate 9 spec:

   - `AnatomicalReferenceFrame`
   - `AnatomicalPlane`
   - `ClinicalJointMeasurement`
   - `CompensationPattern`
   - `MeasurementQuality`

4. Export from `src/types/index.ts`

**Afternoon:** 5. Write 4+ unit tests for type compatibility 6. Commit: `feat(types): Add ISB-compliant biomechanics types`

---

### Day 1-2: Vector Math Utilities (4-6 hours)

1. Create vector math utilities

   ```bash
   touch src/utils/vectorMath.ts
   ```

2. Implement 8 core functions:

   - `midpoint3D()` - average of two 3D points
   - `subtract3D()` - vector subtraction
   - `normalize()` - unit vector
   - `crossProduct()` - perpendicular vector
   - `dotProduct()` - scalar projection
   - `magnitude()` - vector length
   - `angleBetweenVectors()` - angle in degrees
   - `projectVectorOntoPlane()` - plane projection

3. Write 24+ unit tests (3 per function minimum)

   ```bash
   touch src/utils/__tests__/vectorMath.test.ts
   ```

4. Benchmark performance (<1ms per operation)

5. Commit: `feat(utils): Add 3D vector math utilities with full test coverage`

---

### Day 3-4: Reference Frame Service (8-10 hours)

1. Create service structure

   ```bash
   mkdir -p src/services/biomechanics
   touch src/services/biomechanics/AnatomicalReferenceService.ts
   ```

2. Implement reference frame calculations:

   - `calculateGlobalFrame()` - world coordinates
   - `calculateThoraxFrame()` - trunk reference
   - `calculateScapularPlane()` - 30-40° from coronal
   - `calculateHumerusFrame()` - upper arm reference

3. Write 15+ unit tests

   ```bash
   touch src/services/biomechanics/__tests__/AnatomicalReferenceService.test.ts
   ```

4. Test with synthetic pose data
5. Test with real MoveNet output

6. Commit: `feat(biomechanics): Add ISB-compliant reference frame service`

---

### Day 5-6: Enhanced Goniometer (6-8 hours)

1. **Enable 3D by default**

   ```typescript
   // File: src/services/goniometerService.ts
   // Change line ~13
   use3D: true,  // Was: false
   ```

2. **Add plane-aware calculation**

   ```typescript
   calculateAngleInPlane(
     vector1: Vector3D,
     vector2: Vector3D,
     plane: AnatomicalPlane,
     jointName: string
   ): JointAngle
   ```

3. **Extend JointAngle type**

   ```typescript
   // Add optional field
   plane?: 'sagittal' | 'coronal' | 'transverse' | 'scapular';
   ```

4. Write 12+ tests for plane-aware calculations

5. Commit: `feat(goniometer): Enable 3D mode and add plane-aware measurements`

---

### Day 7: Depth Handling (4-6 hours)

1. **Check MoveNet output**

   - Does it provide z-depth?
   - If yes: use it
   - If no: estimate from 2D

2. **Populate depth in PoseDetectionService**

   ```typescript
   // File: src/services/PoseDetectionService.v2.ts
   // Change line where z is set
   z: kp.z !== undefined ? kp.z : 0,  // Was: z: 0
   ```

3. **Create depth estimation fallback**

   ```bash
   touch src/utils/depthEstimation.ts
   ```

4. Add `hasDepth` to `ProcessedPoseData`

5. Write 6+ tests

6. Commit: `feat(pose): Add z-depth handling with estimation fallback`

---

### Day 8-10: Integration & Validation (8-12 hours)

1. **Refactor ShoulderROMTracker**

   ```typescript
   // Use new reference frames instead of simple 2D math
   const refService = new AnatomicalReferenceService();
   const globalFrame = refService.calculateGlobalFrame(landmarks);
   const thoraxFrame = refService.calculateThoraxFrame(landmarks, globalFrame);
   const scapularPlane = refService.calculateScapularPlane(thoraxFrame);
   ```

2. **Update all tests**

   - Expect 3D calculations
   - Verify accuracy improved

3. **Clinical validation**

   - Test with 10+ shoulder ROM videos
   - Compare vs. physical therapist measurements
   - Document MAE (target: ≤5°)

4. **Performance testing**

   - Ensure <5ms per frame
   - No FPS degradation

5. **Update documentation**

   - Add ISB reference docs
   - Document migration path

6. Commit: `feat(shoulder): Refactor ROM tracker to use 3D reference frames`

---

## ✅ Gate 9 Definition of Done

Before you can proceed to Gate 10, verify:

### Functional

- [ ] `AnatomicalReferenceService` calculates all frames correctly
- [ ] `GoniometerService` operates in 3D mode
- [ ] Depth handling works (real or estimated)
- [ ] ShoulderROMTracker uses 3D reference frames
- [ ] Measurements within ±5° of clinical goniometer

### Testing

- [ ] 60+ unit tests passing
- [ ] Clinical validation completed (10+ videos)
- [ ] Performance benchmarks met (<5ms per frame)
- [ ] All existing tests still pass

### Documentation

- [ ] ISB standards documented
- [ ] Vector math formulas documented
- [ ] Migration guide written
- [ ] Clinical validation report complete

### Sign-Off

- [ ] Developer sign-off
- [ ] QA sign-off
- [ ] Clinical advisor sign-off

---

## 🚀 After Gate 9: Gate 10 Preview

**What's Next:**

- Build on these reference frames
- Add compensation detection (trunk lean, rotation, hiking)
- Implement primary/secondary joint architecture
- Create clinical joint measurement service

**Estimated Time:** 10-12 days

---

## 📚 Key Resources

### Documentation

1. **Gate 9 Full Spec:** `docs/gates/GATE_9_3D_ANATOMICAL_REFERENCE_FRAMES.md`
2. **Gate 10 Preview:** `docs/gates/GATE_10_CLINICAL_JOINT_MEASUREMENT.md`
3. **Roadmap:** `docs/planning/3D_ANATOMICAL_ROADMAP_INTEGRATION.md`

### Research References

1. **ISB Standards:** Wu et al. (2005) - Joint coordinate systems
2. **Shoulder ROM:** BMC Musculoskelet Disord (2020) - Normal values
3. **RGB-D Systems:** Frontiers Bioeng (2025) - Validity study

### Code Examples

- See Gate 9 spec for complete code samples
- Vector math formulas documented inline
- Reference frame calculations with comments

---

## 🎓 Implementation Tips

### Elegance

- Reuse existing patterns
- Small, composable functions
- Clear naming

### Simplicity

- No over-engineering
- Leverage what exists
- Feature flags for rollout

### Lightweight

- Performance-conscious
- <5ms per operation
- Mobile-first

### Accuracy

- Research-backed formulas
- Clinical validation required
- ±5° accuracy target

---

## ❓ Common Questions

**Q: Can I skip to Gate 10?**
A: No. Gates must be completed sequentially. Gate 10 depends on Gate 9.

**Q: What if MoveNet doesn't provide z-depth?**
A: Use depth estimation fallback (see Day 7 tasks). Document limitations.

**Q: How accurate does this need to be?**
A: ±5° MAE vs. clinical goniometer. This is the industry standard.

**Q: What about backward compatibility?**
A: Critical. Add feature flags. All existing tests must pass.

**Q: When can we use MediaPipe 33-pt?**
A: After Gates 9-10. That's Gate 11. Don't skip ahead.

---

## 🚦 Status Tracking

Update this as you progress:

**Gate 9 Progress:**

- [ ] Day 1: Types & Setup
- [ ] Day 1-2: Vector Math
- [ ] Day 3-4: Reference Frames
- [ ] Day 5-6: Enhanced Goniometer
- [ ] Day 7: Depth Handling
- [ ] Day 8-10: Integration & Validation

**Blockers:** (List any blockers here)

**Questions:** (List questions for team/clinical advisor)

---

## 🎯 Success = Production-Ready 3D Measurement

By the end of Gate 9, PhysioAssist will have:

- ✅ ISB-compliant 3D reference frames
- ✅ Anatomically correct plane measurements
- ✅ Depth perception (real or estimated)
- ✅ 5° accuracy (clinical grade)
- ✅ Foundation for advanced compensation detection

**This is the foundation for everything else!**

---

**Ready to start? Begin with Day 1! 🚀**

Good luck, and remember: Follow the gates, test everything, validate clinically!
