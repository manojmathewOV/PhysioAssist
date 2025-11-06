# PhysioAssist V2 - Gated Development Plan

**Philosophy:** No more estimates. No more "weeks". Only concrete PASS/FAIL gates.

**Status:** 🔴 **Gate 0 FAILED (2/5 criteria)** - Cannot proceed

---

## 🚪 Gate System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│ GATE 0: CRITICAL FIX          │ Status: ❌ FAILED (2/5)        │
│ Cannot proceed until: 5/5 pass│                                  │
├──────────────────────────────────────────────────────────────────┤
│ GATE 1: CORE FUNCTIONALITY    │ Status: ⏸️  BLOCKED            │
│ Cannot proceed until: All pass│                                  │
├──────────────────────────────────────────────────────────────────┤
│ GATE 2: INTEGRATION & STABILITY│ Status: ⏸️  BLOCKED            │
│ Cannot proceed until: All pass│                                  │
├──────────────────────────────────────────────────────────────────┤
│ GATE 3: PRODUCTION READINESS  │ Status: ⏸️  BLOCKED            │
│ Cannot proceed until: All pass│                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **Cannot skip gates** - Must pass in order
2. **100% pass required** - All criteria must pass
3. **Automated validation** - Run `npm run gate:validate`
4. **No exceptions** - Fails block progress

---

## 🚪 GATE 0: CRITICAL FIX

**Purpose:** Fix show-stopper keypoint mismatch bug

**Current Status:** ❌ **FAILED (2/5 criteria passed)**

### Definition of Done

- [ ] ❌ All keypoint indices valid for MoveNet (0-16)
- [ ] ❌ Knee joints use correct indices: [11,13,15] and [12,14,16]
- [ ] ❌ Elbow joints use correct indices: [5,7,9] and [6,8,10]
- [ ] ✅ Algorithm calculates 90° correctly
- [ ] ✅ goniometerService.ts file exists

### Failed Criteria

```
❌ Found invalid indices: 23, 24, 25, 27, 28, 31, 32
   (max: 16 for MoveNet)

❌ left_knee indices [23,25,27] should be [11,13,15]
❌ right_knee indices [24,26,28] should be [12,14,16]

❌ left_elbow indices [11,13,15] should be [5,7,9]
❌ right_elbow indices [12,14,16] should be [6,8,10]
```

### Required Actions

**File:** `src/services/goniometerService.ts`

#### 1. Fix Elbow Joints (Lines 169-172)
```typescript
// WRONG (current - uses MediaPipe indices)
{ name: 'left_elbow', indices: [11, 13, 15] },
{ name: 'right_elbow', indices: [12, 14, 16] },

// CORRECT (MoveNet indices)
{ name: 'left_elbow', indices: [5, 7, 9] },    // shoulder-elbow-wrist
{ name: 'right_elbow', indices: [6, 8, 10] },
```

#### 2. Fix Shoulder Joints (Lines 173-174)
```typescript
// WRONG
{ name: 'left_shoulder', indices: [13, 11, 23] },
{ name: 'right_shoulder', indices: [14, 12, 24] },

// CORRECT
{ name: 'left_shoulder', indices: [7, 5, 11] },  // elbow-shoulder-hip
{ name: 'right_shoulder', indices: [8, 6, 12] },
```

#### 3. Fix Knee Joints (Lines 177-178)
```typescript
// WRONG
{ name: 'left_knee', indices: [23, 25, 27] },
{ name: 'right_knee', indices: [24, 26, 28] },

// CORRECT
{ name: 'left_knee', indices: [11, 13, 15] },   // hip-knee-ankle
{ name: 'right_knee', indices: [12, 14, 16] },
```

#### 4. Remove Unsupported Joints
```typescript
// DELETE these (MoveNet doesn't have these keypoints)
{ name: 'left_hip', indices: [11, 23, 25] },     // ❌ indices 23,25 don't exist
{ name: 'right_hip', indices: [12, 24, 26] },    // ❌ indices 24,26 don't exist
{ name: 'left_ankle', indices: [25, 27, 31] },   // ❌ indices 25,27,31 don't exist
{ name: 'right_ankle', indices: [26, 28, 32] },  // ❌ indices 26,28,32 don't exist
```

#### 5. Update getJointAngle() method (Lines 210-221)
```typescript
// Remove these from jointConfigs:
leftHip: [11, 23, 25],      // ❌ DELETE
rightHip: [12, 24, 26],     // ❌ DELETE
leftAnkle: [25, 27, 31],    // ❌ DELETE
rightAnkle: [26, 28, 32],   // ❌ DELETE
```

#### 6. Update getAllJointAngles() method (Lines 247-258)
```typescript
// Remove these from joints array:
const joints = [
  'leftElbow',
  'rightElbow',
  'leftKnee',
  'rightKnee',
  'leftShoulder',
  'rightShoulder',
  // 'leftHip',        // ❌ DELETE
  // 'rightHip',       // ❌ DELETE
  // 'leftAnkle',      // ❌ DELETE
  // 'rightAnkle',     // ❌ DELETE
];
```

### MoveNet Keypoint Reference

```
MoveNet Lightning (17 keypoints):
0:  nose
1:  left_eye
2:  right_eye
3:  left_ear
4:  right_ear
5:  left_shoulder
6:  right_shoulder
7:  left_elbow
8:  right_elbow
9:  left_wrist
10: right_wrist
11: left_hip
12: right_hip
13: left_knee
14: right_knee
15: left_ankle
16: right_ankle

Supported Joints:
- Elbows: [5,7,9] and [6,8,10] ✅
- Shoulders: [7,5,11] and [8,6,12] ✅
- Knees: [11,13,15] and [12,14,16] ✅

Unsupported (missing keypoints):
- Hip angles: Would need torso keypoints ❌
- Ankle angles: Would need foot keypoints ❌
```

### Validation

```bash
# After making changes, run validation:
npm run gate:validate

# Expected output:
✅ PASS: All keypoint indices valid (0-16)
✅ PASS: Knee joints correct
✅ PASS: Elbow joints correct
✅ PASS: Algorithm test passes
✅ PASS: File exists

✅ GATE 0 PASSED (5/5)
```

### Estimated Time

**2-3 hours** (straightforward find-replace)

---

## 🚪 GATE 1: CORE FUNCTIONALITY

**Purpose:** Validate all core algorithms work correctly

**Status:** ⏸️ **BLOCKED** (Gate 0 must pass first)

### Definition of Done

**Algorithm Accuracy:**
- [ ] Angle calculation accurate within ±1° for 0°, 45°, 90°, 180°
- [ ] Handles collinear points correctly
- [ ] Handles very small angles (<1°)
- [ ] Handles negative coordinates
- [ ] Handles large coordinate values

**Performance:**
- [ ] Frame preprocessing <2ms (192x192x3 → Float32Array)
- [ ] Angle calculation <0.1ms per call
- [ ] Can handle 30 FPS continuous processing

**Input Validation:**
- [ ] Rejects NaN values
- [ ] Rejects invalid array sizes
- [ ] Rejects out-of-range values (not 0-255)
- [ ] Protects against division by zero
- [ ] Handles null/undefined gracefully

**Numerical Stability:**
- [ ] No overflow errors
- [ ] No underflow errors
- [ ] NaN detection works
- [ ] Infinity handling correct

### Validation Tests

```bash
npm run gate:validate
# Will automatically run Gate 1 tests after Gate 0 passes

# Manual testing:
node scripts/test-algorithms.js
```

### Required Actions

1. ✅ Fix keypoint indices (Gate 0)
2. Verify algorithm tests pass
3. Run performance benchmarks
4. Test input validation
5. Verify numerical stability

### Exit Criteria

**100% of tests must pass:**
- Algorithm accuracy: 5/5 ✅
- Performance: 3/3 ✅
- Input validation: 5/5 ✅
- Numerical stability: 4/4 ✅

---

## 🚪 GATE 2: INTEGRATION & STABILITY

**Purpose:** Validate components work together without crashes or leaks

**Status:** ⏸️ **BLOCKED** (Gate 1 must pass first)

### Definition of Done

**Service Integration:**
- [ ] PoseDetectionService.v2.ts integrates with goniometerService
- [ ] compensatoryMechanisms.ts functions work
- [ ] All service files present and loadable

**Component Integration:**
- [ ] SetupWizard can be imported
- [ ] CoachingOverlay can be imported
- [ ] SimpleModeUI can be imported
- [ ] Example integration compiles

**Memory Management:**
- [ ] Cleanup patterns in useEffect returns
- [ ] No shared value leaks in Skia components
- [ ] Model disposal on unmount
- [ ] No growing memory over time

**Error Handling:**
- [ ] Try-catch in all critical paths
- [ ] Errors convert to patient-friendly messages
- [ ] App doesn't crash on invalid input
- [ ] Graceful degradation works

**State Management:**
- [ ] Redux actions dispatched correctly
- [ ] No race conditions in state updates
- [ ] Batch dispatching prevents re-render storms
- [ ] State persists correctly

### Validation Tests

```bash
npm run gate:validate
# Checks file existence, cleanup patterns, error handling

# Additional manual checks:
npm run test:integration
```

### Required Actions

1. Import all services in example screen
2. Test component mounting/unmounting
3. Verify cleanup functions called
4. Test error scenarios
5. Monitor memory usage

### Exit Criteria

**All checks pass:**
- Service integration: 3/3 ✅
- Component integration: 4/4 ✅
- Memory management: 4/4 ✅
- Error handling: 3/3 ✅
- State management: 4/4 ✅

---

## 🚪 GATE 3: PRODUCTION READINESS

**Purpose:** Validate security, accessibility, documentation, testing

**Status:** ⏸️ **BLOCKED** (Gate 2 must pass first)

### Definition of Done

**Security:**
- [ ] Patient data encrypted (EncryptedStorage, not AsyncStorage)
- [ ] No console.log in production builds
- [ ] No hardcoded secrets
- [ ] Input sanitization on all boundaries
- [ ] HIPAA compliance validated

**Accessibility:**
- [ ] All interactive elements have accessibilityLabel
- [ ] All buttons have accessibilityRole
- [ ] accessibilityHint provided where needed
- [ ] Touch targets ≥44x44pt
- [ ] Color contrast ≥4.5:1 (WCAG AA)
- [ ] VoiceOver/TalkBack compatible

**Performance:**
- [ ] Inference time <50ms (validated in simulation)
- [ ] FPS ≥10 sustained
- [ ] Memory stable over 30min session
- [ ] No frame drops during detection
- [ ] Battery usage acceptable

**Documentation:**
- [ ] Implementation guide complete
- [ ] API documentation (JSDoc) complete
- [ ] Integration examples provided
- [ ] Deployment guide exists
- [ ] Troubleshooting guide exists

**Testing:**
- [ ] Static validation passes (validate-v2.sh)
- [ ] Algorithm tests pass (test-algorithms.js)
- [ ] Device simulation passes (device-simulation-suite.js)
- [ ] Gate validation passes (gate-validation.js)
- [ ] >80% critical path coverage

### Validation Tests

```bash
npm run gate:validate
# Runs full production readiness check

# Additional validations:
npm run validate:all
npm run test:accessibility
npm run test:performance
```

### Required Actions

1. Replace AsyncStorage with EncryptedStorage
2. Add accessibility labels to all components
3. Remove production console.log
4. Complete documentation
5. Run full test suite

### Exit Criteria

**All checks pass:**
- Security: 5/5 ✅
- Accessibility: 6/6 ✅
- Performance: 5/5 ✅
- Documentation: 5/5 ✅
- Testing: 5/5 ✅

---

## 📊 Current Status Summary

```
┌─────────┬────────────────────────────┬──────────┬─────────────┐
│ Gate    │ Name                       │ Status   │ Pass Rate   │
├─────────┼────────────────────────────┼──────────┼─────────────┤
│ Gate 0  │ Critical Fix               │ ❌ FAILED│ 2/5 (40%)   │
│ Gate 1  │ Core Functionality         │ ⏸️  BLOCKED│ 0/0 (N/A)   │
│ Gate 2  │ Integration & Stability    │ ⏸️  BLOCKED│ 0/0 (N/A)   │
│ Gate 3  │ Production Readiness       │ ⏸️  BLOCKED│ 0/0 (N/A)   │
├─────────┼────────────────────────────┼──────────┼─────────────┤
│ Overall │                            │ 🔴 BLOCKED│ 0/4 (0%)    │
└─────────┴────────────────────────────┴──────────┴─────────────┘
```

**Immediate Action Required:** Fix Gate 0 (keypoint indices)

---

## 🎯 How to Use This System

### 1. Check Current Status
```bash
npm run gate:validate
```

### 2. Fix Failed Criteria
- Read the output
- Fix each failed criterion
- Re-run validation

### 3. Proceed to Next Gate
- Only when current gate 100% passes
- System automatically checks next gate
- Repeat until all gates pass

### 4. Deploy When Ready
```bash
# All 4 gates must pass
npm run gate:validate

# Expected final output:
✅ GATE 0 PASSED (5/5)
✅ GATE 1 PASSED (17/17)
✅ GATE 2 PASSED (18/18)
✅ GATE 3 PASSED (26/26)

🎉 ALL GATES PASSED - READY FOR PRODUCTION
```

---

## 🔧 NPM Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "gate:validate": "node scripts/gate-validation.js",
    "gate:0": "node scripts/gate-validation.js --gate=0",
    "gate:1": "node scripts/gate-validation.js --gate=1",
    "gate:2": "node scripts/gate-validation.js --gate=2",
    "gate:3": "node scripts/gate-validation.js --gate=3"
  }
}
```

---

## ✅ Benefits of Gated Development

**vs Time-Based ("Week 1, Week 2"):**
- ❌ Time-based: Arbitrary deadlines, may skip quality
- ✅ Gate-based: Quality-driven, objective criteria

**vs Percentage Scores:**
- ❌ Scores: Subjective, no clear threshold
- ✅ Gates: Binary pass/fail, unambiguous

**vs Manual QA:**
- ❌ Manual: Inconsistent, slow, error-prone
- ✅ Automated: Consistent, fast, reproducible

**Key Advantages:**
1. **No ambiguity** - Either passes or doesn't
2. **No skipping** - Must fix issues before proceeding
3. **Automated** - Run anytime, get instant feedback
4. **Objective** - No debates about "ready enough"
5. **Traceable** - Know exactly what's blocking

---

## 📝 Definition of "Done"

**Gate 0 Done:** All keypoint indices correct, algorithm works
**Gate 1 Done:** All measurements accurate, performant, validated
**Gate 2 Done:** Integration stable, no crashes, no leaks
**Gate 3 Done:** Production-grade security, accessibility, docs

**Project Done:** All 4 gates passed = Deploy with confidence

---

## 🚀 Next Steps

### Immediate (Right Now)

1. **Fix Gate 0** (2-3 hours)
   ```bash
   # Edit src/services/goniometerService.ts
   # Fix keypoint indices as documented above
   # Run: npm run gate:validate
   # Confirm: Gate 0 PASSED
   ```

2. **Validate Gate 1** (Should auto-pass)
   ```bash
   npm run gate:validate
   # Gate 1 tests run automatically
   ```

3. **Validate Gate 2** (Check integrations)
   ```bash
   npm run gate:validate
   # Verify all files present
   ```

4. **Fix Gate 3** (Security & accessibility)
   - Replace AsyncStorage with EncryptedStorage
   - Add accessibility labels
   - Complete documentation

### Long-term

- Keep gates updated as requirements change
- Add more criteria as needed
- Use gates for all future features
- Make gates part of CI/CD

---

**Status:** 🔴 **Gate 0 BLOCKING - Fix keypoint indices to proceed**

**Run:** `npm run gate:validate` after making changes

**Goal:** 🎯 **4/4 gates passed = Production ready**

---

*This is a living document. Gates may be updated as requirements evolve.*
