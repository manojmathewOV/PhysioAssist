# Gate 11: MediaPipe Pose Upgrade (33-Point Model)
## Advanced Scapular & Spinal Tracking

> **Objective:** Upgrade from MoveNet (17-pt) to MediaPipe Pose (33-pt) for enhanced shoulder analytics
> **Prerequisite:** Gates 1-10 complete and validated with MoveNet
> **Estimated Effort:** 10-14 days

---

## 🎯 Why MediaPipe Upgrade?

### Limitations of MoveNet 17-Point Model

**Missing Landmarks:**
- No scapular landmarks (scapular spine, inferior angle)
- No spine landmarks (C7, T8, L2, L5, sacrum)
- No hand/finger landmarks (thumb position)

**Impact on Shoulder ROM:**
- Cannot measure true scapulothoracic motion
- Cannot detect scapular winging
- Internal rotation grading is approximate
- Scapulohumeral rhythm uses proxies only

### MediaPipe Pose 33-Point Advantages

**Additional Landmarks:**
- Full spine segmentation (posterior view)
- Hand landmarks (thumb, fingers)
- Posterior shoulder reference points

**Clinical Impact:**
- **True scapulohumeral rhythm** measurement
- **Scapular winging** detection
- **Precise internal rotation** grading (spine levels)
- **Better accuracy** for shoulder ROM

---

## 📊 Pre-Upgrade Baseline

Before upgrading, establish MoveNet baseline:

```bash
# Run accuracy tests with MoveNet 17-pt
npm run test:accuracy -- --model=movenet-17 --save-baseline

# Save baseline metrics
# - Pose MAE: ___°
# - Goniometry MAE: ___°
# - Comparison κ: ___
# - Shoulder ROM accuracy: ___%
```

**Goal:** MediaPipe must match or exceed MoveNet accuracy

---

## 🚪 Tasks

### 11.1: MediaPipe Model Integration

- [ ] **Add MediaPipe Pose dependency**
  ```bash
  npm install @mediapipe/pose
  ```

- [ ] **Create model configuration**
  - File: `src/config/poseModels.ts`
  ```typescript
  export const POSE_MODELS = {
    movenet: {
      type: 'movenet-17',
      landmarks: 17,
      confidence: 0.5,
      latency: 30  // ms
    },
    mediapipe: {
      type: 'mediapipe-33',
      landmarks: 33,
      confidence: 0.5,
      latency: 45  // ms (slightly slower)
    }
  };
  ```

- [ ] **Update PoseDetectionServiceV2**
  - File: `src/services/PoseDetectionService.v2.ts`
  - Add model selection:
    ```typescript
    class PoseDetectionServiceV2 {
      private model: 'movenet-17' | 'mediapipe-33';

      async initialize(modelType: 'movenet-17' | 'mediapipe-33') {
        if (modelType === 'mediapipe-33') {
          this.pose = await this.loadMediaPipePose();
        } else {
          this.pose = await this.loadMoveNet();
        }
      }

      private parseLandmarks(rawOutput: any): PoseLandmark[] {
        if (this.model === 'mediapipe-33') {
          return this.parseMediaPipeLandmarks(rawOutput);
        }
        return this.parseMoveNetLandmarks(rawOutput);
      }
    }
    ```

- [ ] **Create landmark mapping**
  - File: `src/utils/landmarkMapping.ts`
  - Map MediaPipe 33-pt to common landmark names:
    ```typescript
    const MEDIAPIPE_LANDMARK_MAP = {
      // Existing MoveNet equivalents
      0: 'nose',
      11: 'left_shoulder',
      12: 'right_shoulder',
      13: 'left_elbow',
      14: 'right_elbow',
      // ... (rest of 17)

      // NEW: MediaPipe exclusive
      24: 'left_scapular_spine',
      25: 'right_scapular_spine',
      26: 'thoracic_spine_t8',
      27: 'lumbar_spine_l2',
      28: 'lumbar_spine_l5',
      29: 'sacrum',
      30: 'left_thumb',
      31: 'right_thumb'
    };
    ```

### 11.2: Backward Compatibility

- [ ] **Dual-model support**
  - Services must work with both 17-pt and 33-pt
  - Feature flagging:
    ```typescript
    const FEATURES = {
      scapularTracking: model === 'mediapipe-33',
      spineSegmentation: model === 'mediapipe-33',
      advancedInternalRotation: model === 'mediapipe-33'
    };
    ```

- [ ] **Graceful degradation**
  - If MediaPipe fails to load → fallback to MoveNet
  - If scapular landmarks unavailable → use proxy method

- [ ] **Configuration flag**
  - File: `.env`
  ```
  POSE_MODEL=mediapipe-33  # or movenet-17
  ENABLE_SCAPULAR_TRACKING=true
  ```

### 11.3: Scapular Analytics Implementation

- [ ] **Scapular upward rotation**
  - File: Create `src/services/scapularAnalytics.ts`
  - Algorithm:
    ```typescript
    function calculateScapularUpwardRotation(
      landmarks: PoseLandmark[]
    ): number {
      const scapularSpine = landmarks.scapular_spine;
      const inferiorAngle = landmarks.scapular_inferior_angle;

      // Scapular axis
      const scapularAxis = subtract(scapularSpine, inferiorAngle);

      // Vertical reference
      const verticalRef = { x: 0, y: 1, z: 0 };

      // Upward rotation = angle from vertical
      return angleBetweenVectors(scapularAxis, verticalRef);
    }
    ```

- [ ] **Scapulothoracic contribution to abduction**
  - Track scapular rotation during arm raise
  - Calculate true GH vs ST ratio:
    ```typescript
    function calculateScapulohumoralRhythm(
      humeralAbduction: number,
      scapularUpwardRotation: number
    ): number {
      // GH = Total abduction - ST contribution
      const gh = humeralAbduction - scapularUpwardRotation;
      const ratio = gh / scapularUpwardRotation;
      return ratio;  // Should be ~2:1
    }
    ```

- [ ] **Scapular winging detection**
  - Measure distance from scapular landmarks to thorax
  - Algorithm:
    ```typescript
    function detectScapularWinging(
      landmarks: PoseLandmark[]
    ): { present: boolean; severity: 'mild' | 'moderate' | 'severe' } {
      const scapularSpine = landmarks.scapular_spine;
      const thoracicSpine = landmarks.thoracic_spine_t8;

      // Distance from scapula to thorax (Z-axis)
      const distance = abs(scapularSpine.z - thoracicSpine.z);

      // Normalize to shoulder width
      const shoulderWidth = euclideanDistance(
        landmarks.left_shoulder,
        landmarks.right_shoulder
      );
      const normalizedDistance = distance / shoulderWidth;

      if (normalizedDistance < 0.1) return { present: false };
      if (normalizedDistance < 0.15) return { present: true, severity: 'mild' };
      if (normalizedDistance < 0.25) return { present: true, severity: 'moderate' };
      return { present: true, severity: 'severe' };
    }
    ```

### 11.4: Enhanced Internal Rotation

- [ ] **Precise spine level detection**
  - File: Update `src/utils/spineLevelEstimation.ts`
  - Use real spine landmarks:
    ```typescript
    function detectSpineLevel(
      wristY: number,
      landmarks: PoseLandmark[]
    ): 'hip' | 'sacrum' | 'L5' | 'L2' | 'T8' | 'T4' {
      const spineLandmarks = [
        { name: 'hip', y: landmarks.hip.y },
        { name: 'sacrum', y: landmarks.sacrum.y },
        { name: 'L5', y: landmarks.lumbar_spine_l5.y },
        { name: 'L2', y: landmarks.lumbar_spine_l2.y },
        { name: 'T8', y: landmarks.thoracic_spine_t8.y },
        { name: 'T4', y: landmarks.thoracic_spine_t4.y }
      ];

      // Find closest spine level to wrist
      const closest = spineLandmarks.reduce((prev, curr) => {
        const prevDist = abs(wristY - prev.y);
        const currDist = abs(wristY - curr.y);
        return currDist < prevDist ? curr : prev;
      });

      return closest.name;
    }
    ```

- [ ] **Clinical grading**
  - Map spine levels to clinical ROM grades:
    ```typescript
    const INTERNAL_ROTATION_GRADES = {
      'hip': { grade: 'Minimal', score: 1 },
      'sacrum': { grade: 'Limited', score: 2 },
      'L5': { grade: 'Fair', score: 3 },
      'L2': { grade: 'Good', score: 4 },
      'T8': { grade: 'Excellent', score: 5 },
      'T4': { grade: 'Full ROM', score: 6 }
    };
    ```

### 11.5: Clinical Threshold Updates

- [ ] **Update all shoulder thresholds**
  - File: `src/features/videoComparison/config/clinicalThresholds.ts`
  - MediaPipe-specific thresholds:
    ```typescript
    export const SHOULDER_THRESHOLDS_MEDIAPIPE = {
      flexion: {
        normal: { min: 157, max: 180 },
        deficit: { threshold: 140 }
      },
      abduction: {
        normal: { min: 148, max: 180 },
        scapulohumoralRhythm: { min: 1.8, max: 2.5 }
      },
      scapularWinging: {
        normalizedDistance: { max: 0.1 }
      },
      internalRotation: {
        minGrade: 'L2'  // Must reach L2 level minimum
      }
    };
    ```

- [ ] **Re-validate with PT annotations**
  - Run comparison accuracy tests again
  - Target: κ ≥ 0.65 (improved from Gate 2's 0.6)

### 11.6: Performance Validation

- [ ] **Latency measurement**
  - MediaPipe is slightly slower than MoveNet
  - Measure: Pose detection latency
  - Target: Still stay under 100ms total budget

- [ ] **Optimize if needed**
  - Use MediaPipe Lite model if available
  - GPU delegate for mobile
  - Frame skipping if necessary

- [ ] **Battery/thermal impact**
  - Test 10-minute session with MediaPipe
  - Compare battery drain vs MoveNet
  - Ensure no thermal throttling

### 11.7: Testing & Validation

- [ ] **Unit tests for new services**
  ```bash
  npm run test src/services/scapularAnalytics.test.ts
  npm run test src/utils/spineLevelEstimation.test.ts
  ```

- [ ] **Accuracy regression tests**
  ```bash
  # Compare MediaPipe vs MoveNet baseline
  npm run test:accuracy -- --model=mediapipe-33 --compare-to-baseline
  ```

- [ ] **Integration tests**
  - End-to-end with scapular tracking
  - Multi-angle capture with MediaPipe
  - Internal rotation grading with spine landmarks

- [ ] **Manual validation**
  - Test with 5 volunteers
  - Verify scapular winging detection
  - Verify spine level detection for IR
  - Compare to PT assessment

---

## 📊 Exit Criteria

### Accuracy
- ✅ Pose MAE ≤ MoveNet baseline (no regression)
- ✅ Goniometry MAE ≤ MoveNet baseline
- ✅ Comparison κ ≥ 0.65 (improved from 0.6)

### Scapular Metrics
- ✅ Scapular upward rotation measured accurately (±5°)
- ✅ Scapulohumeral rhythm calculated (2:1 ±0.3)
- ✅ Scapular winging detection validated by PT

### Internal Rotation
- ✅ Spine level detection matches PT assessment (≥90% agreement)
- ✅ Clinical grading validated

### Performance
- ✅ End-to-end latency still <100ms (despite heavier model)
- ✅ No thermal throttling in 10-min session
- ✅ Battery drain <10% higher than MoveNet

### Robustness
- ✅ Graceful fallback to MoveNet if MediaPipe fails
- ✅ Dual-model support working
- ✅ All existing features work with both models

### Documentation
- ✅ MediaPipe upgrade guide written
- ✅ Landmark mapping documented
- ✅ Clinical threshold updates documented

---

## 🔄 Migration Strategy

### Phase 1: Opt-In (Week 1-2)
- Feature flag: `POSE_MODEL=mediapipe-33` (opt-in)
- Beta users test MediaPipe
- Monitor accuracy and performance
- Fix bugs

### Phase 2: A/B Test (Week 3-4)
- 50% users get MediaPipe
- 50% stay on MoveNet
- Compare metrics:
  - Accuracy
  - Performance
  - User satisfaction
  - Crash rates

### Phase 3: Gradual Rollout (Week 5-6)
- If A/B test successful:
  - 75% MediaPipe
  - 25% MoveNet
- Monitor closely

### Phase 4: Full Rollout (Week 7)
- 100% MediaPipe
- Keep MoveNet as fallback
- Remove MoveNet after 2 weeks of stability

---

## 📝 Local Handoff Document

**File:** `docs/gates/GATE_11_MAC_HANDOFF.md`

When Gate 11 cloud work is complete, create handoff document for local testing:

```markdown
# Gate 11: MediaPipe Upgrade - Mac Validation

## What to Test

1. **Install and run app**
   ```bash
   npm install
   cd ios && pod install
   npm run ios
   ```

2. **Verify MediaPipe model loads**
   - Check logs: "Using MediaPipe Pose 33-point model"
   - No errors during initialization

3. **Test scapular tracking**
   - Record shoulder abduction exercise (frontal view)
   - Check feedback includes scapular metrics
   - Visual overlay shows scapular landmarks

4. **Test internal rotation**
   - Record hand-behind-back exercise (posterior view)
   - Verify spine level detection
   - Check grading: "Reaching T8 (Excellent)"

5. **Performance check**
   - Run 10-minute session
   - No lag or dropped frames
   - Phone doesn't overheat

## Expected Results

- ✅ MediaPipe loads successfully
- ✅ Scapular landmarks visible in debug overlay
- ✅ Scapular winging detection working
- ✅ Spine level detection accurate
- ✅ Performance still <100ms latency
- ✅ No crashes
```

---

**Gate 11 Status:** 📋 Planned (Execute after Gates 1-10 complete)

**Estimated Timeline:**
- Planning: 2 days
- Implementation: 10 days
- Testing: 2 days
- **Total: ~3 weeks**
