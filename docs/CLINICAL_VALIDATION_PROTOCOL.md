# Clinical Validation Protocol

## Overview

This document provides step-by-step instructions for validating and tuning the error detection algorithms in the PhysioAssist video comparison feature.

**Target Audience**: Physical therapists and clinicians using PhysioAssist

**Estimated Time**: 4-6 hours (spread across multiple sessions)

**Prerequisites**:
- PhysioAssist app installed on testing device
- Access to sample videos (reference videos of correct form + patient videos with known errors)
- Basic understanding of movement assessment

---

## Phase 1: Preparation (30 minutes)

### 1.1 Gather Test Videos

You'll need at least **3 sets of videos** for each exercise type:

#### Shoulder Abduction Videos:
- ✅ **Reference video**: Perfect form (0 errors expected)
- ❌ **Error video 1**: Shoulder hiking (visible shoulder elevation)
- ❌ **Error video 2**: Trunk lean (lateral flexion during movement)
- ❌ **Error video 3**: Multiple errors (combination of compensations)

#### Squat Videos:
- ✅ **Reference video**: Perfect form (0 errors expected)
- ❌ **Error video 1**: Knee valgus (knees caving in) - **HIGH PRIORITY**
- ❌ **Error video 2**: Heel lift (heels coming off ground)
- ❌ **Error video 3**: Insufficient depth (not reaching target ROM)

#### Bicep Curl Videos:
- ✅ **Reference video**: Perfect form (0 errors expected)
- ❌ **Error video 1**: Shoulder compensation (swinging/momentum)
- ❌ **Error video 2**: Incomplete extension (not fully extending elbow)
- ❌ **Error video 3**: Wrist deviation (wrist flexion/extension)

**Video Requirements**:
- Side view (sagittal plane) for best pose detection
- Well-lit environment
- Full body visible in frame
- 720p or higher resolution
- 5-10 seconds per rep, 3-5 reps per video

### 1.2 Create Ground Truth Annotations

For each error video, create a JSON file documenting the **expected errors**:

**Example: `squat-knee-valgus-ground-truth.json`**
```json
[
  {
    "type": "knee_valgus",
    "severity": "critical",
    "side": "left",
    "timestampStart": 2000,
    "timestampEnd": 3500,
    "notes": "Left knee caves in during descent, approximately 12% medial shift"
  },
  {
    "type": "knee_valgus",
    "severity": "warning",
    "side": "right",
    "timestampStart": 2000,
    "timestampEnd": 3500,
    "notes": "Right knee shows mild valgus, approximately 6% medial shift"
  }
]
```

**Template for all errors**: See `docs/GROUND_TRUTH_TEMPLATE.json`

---

## Phase 2: Initial Validation (1-2 hours)

### 2.1 Run Validation Harness

For each test video pair, run the clinical validation harness:

```bash
cd PhysioAssist

# Test shoulder abduction
npm run clinical:validate -- \
  --reference ./test-videos/shoulder-ref.mp4 \
  --user ./test-videos/shoulder-hiking.mp4 \
  --exercise shoulder_abduction \
  --ground-truth ./test-videos/shoulder-hiking-gt.json \
  --output ./results/shoulder-hiking-results.json

# Test squats (knee valgus)
npm run clinical:validate -- \
  --reference ./test-videos/squat-ref.mp4 \
  --user ./test-videos/squat-valgus.mp4 \
  --exercise squat \
  --ground-truth ./test-videos/squat-valgus-gt.json \
  --output ./results/squat-valgus-results.json

# Test bicep curls
npm run clinical:validate -- \
  --reference ./test-videos/curl-ref.mp4 \
  --user ./test-videos/curl-compensation.mp4 \
  --exercise bicep_curl \
  --ground-truth ./test-videos/curl-compensation-gt.json \
  --output ./results/curl-compensation-results.json
```

### 2.2 Review Initial Results

For each test, review the output:

1. **Detected Errors**: Did the system catch the expected errors?
2. **Accuracy Metrics**:
   - **Precision**: % of detected errors that were real (false positive rate)
   - **Recall**: % of real errors that were detected (false negative rate)
   - **F1 Score**: Overall balance (target: ≥85%)
3. **Recommendations**: Does the system suggest threshold adjustments?

**Example Output**:
```
📊 Detected Errors:
-------------------
   • knee_valgus (critical) - left side - 12.3% @ 2100ms
   • knee_valgus (warning) - right side - 6.1% @ 2150ms

📈 Accuracy Metrics:
-------------------
   True Positives: 2
   False Positives: 0
   False Negatives: 0
   Precision: 100.0%
   Recall: 100.0%
   F1 Score: 100.0%

💡 Recommendations:
------------------
   ✅ Good threshold balance - thresholds appear well-calibrated.
```

### 2.3 Document Initial Findings

Create a findings document: `VALIDATION_FINDINGS.md`

```markdown
## Initial Validation Results

### Shoulder Abduction
- ✅ Shoulder hiking: PASS (2/2 detected, 0 false positives)
- ⚠️  Trunk lean: BORDERLINE (1/2 detected, 1 false negative)
- ❌ Internal rotation: FAIL (0/2 detected, 2 false negatives)

**Action Required**: Decrease internal rotation thresholds

### Squats
- ✅ Knee valgus: PASS (3/3 detected, 0 false positives)
- ✅ Heel lift: PASS (2/2 detected, 0 false positives)
- ⚠️  Insufficient depth: BORDERLINE (4/5 detected, 1 false negative)

**Action Required**: Minor adjustment to depth thresholds

### Bicep Curls
- ✅ Shoulder compensation: PASS (2/2 detected, 0 false positives)
- ⚠️  Incomplete extension: BORDERLINE (1/2 detected, 1 false negative)
- ✅ Wrist deviation: PASS (2/2 detected, 1 false positive)

**Action Required**: Adjust extension threshold, increase wrist deviation threshold
```

---

## Phase 3: Threshold Tuning (2-3 hours)

### 3.1 Launch Tuning Tool

```bash
npm run clinical:tune
```

### 3.2 Systematic Tuning Process

For each error type that needs adjustment:

1. **Identify the Issue**:
   - High false positives → Increase threshold (make less sensitive)
   - High false negatives → Decrease threshold (make more sensitive)

2. **Make Small Adjustments**:
   - Adjust in increments of 10-20% of current value
   - Example: If shoulder hiking warning is 2.0 cm, try 1.6 cm or 2.4 cm

3. **Re-validate**:
   - Run validation harness again with new thresholds
   - Check if accuracy improved

4. **Iterate**:
   - Repeat until F1 Score ≥ 85% for each error type

**Example Tuning Session**:
```
Select option (1-9): 2  (Tune Shoulder Thresholds)

📊 INTERNAL ROTATION
-----------------------------------------------------------
Current Warning:  15°
Current Critical: 30°

Change this threshold? (y/n): y
New WARNING threshold (15): 10
New CRITICAL threshold (30): 25

✅ Updated successfully!
   Warning:  15° → 10°
   Critical: 30° → 25°
```

### 3.3 Special Considerations

#### **Knee Valgus (CRITICAL - ACL Injury Risk)**
- **Conservative thresholds recommended**: Better to over-detect than miss
- **Target**: 100% recall (catch all real errors), ≥90% precision (minimize false alarms)
- **Default thresholds**: warning=5%, critical=10%
- **Adjustment range**: warning=3-7%, critical=8-12%

#### **Shoulder Hiking**
- **Common compensation**: Often visible but not dangerous
- **Target**: ≥85% recall, ≥85% precision
- **Default thresholds**: warning=2cm, critical=5cm
- **Adjustment range**: warning=1-3cm, critical=4-7cm

#### **Incomplete ROM**
- **Patient-specific**: ROM varies significantly by individual
- **Target**: ≥80% recall (catch most), ≥90% precision (few false alarms)
- **Default thresholds**: warning=70%, critical=50%
- **Adjustment range**: warning=60-80%, critical=40-60%

### 3.4 Save Tuned Configuration

Once satisfied with tuning:

```bash
# In tuning tool, select option 6 (Save Configuration)
Select option (1-9): 6
Enter file path to save (default: ./error-detection-config.json): ./config/tuned-thresholds.json
✅ Configuration saved to ./config/tuned-thresholds.json
```

---

## Phase 4: Final Validation (1 hour)

### 4.1 Run Full Test Suite

Test all videos again with tuned thresholds:

```bash
# Run all validation tests
./scripts/run-all-validation-tests.sh
```

### 4.2 Calculate Overall Accuracy

Aggregate results across all test cases:

| Exercise Type | Test Cases | Precision | Recall | F1 Score | Status |
|---------------|------------|-----------|--------|----------|--------|
| Shoulder Abduction | 9 | 92% | 89% | 90% | ✅ PASS |
| Squats | 12 | 95% | 94% | 94% | ✅ PASS |
| Bicep Curls | 8 | 88% | 87% | 87% | ✅ PASS |
| **Overall** | **29** | **92%** | **90%** | **91%** | **✅ PASS** |

**Acceptance Criteria**:
- ✅ Overall F1 Score ≥ 85%
- ✅ Knee valgus recall ≥ 95% (critical for safety)
- ✅ No error type with F1 Score < 75%

### 4.3 Real-World Testing

Test with **3-5 real patients** (not test videos):

1. Record patient performing exercises
2. Review video and annotate errors (ground truth)
3. Run validation harness
4. Compare system output to your clinical assessment

**Document any discrepancies**:
```markdown
## Real-World Testing Results

### Patient 1 - Shoulder Abduction
- System detected: shoulder hiking (warning)
- Clinical assessment: Agree - mild elevation visible
- **MATCH** ✅

### Patient 2 - Squat
- System detected: knee valgus (critical, left), heel lift (warning, bilateral)
- Clinical assessment: Agree on valgus, disagree on heel lift (false positive)
- **PARTIAL MATCH** ⚠️
- Action: Slightly increase heel lift threshold

### Patient 3 - Bicep Curl
- System detected: No errors
- Clinical assessment: Agree - good form
- **MATCH** ✅
```

---

## Phase 5: Deployment (30 minutes)

### 5.1 Update Production Config

Replace the default configuration with your tuned thresholds:

```bash
cp ./config/tuned-thresholds.json ./src/features/videoComparison/config/errorDetectionConfig.ts
```

### 5.2 Create Validation Report

Document your validation process and results:

**Template**: `VALIDATION_REPORT.md`
```markdown
# Clinical Validation Report
**Date**: 2025-11-07
**Clinician**: Dr. [Your Name]
**Total Test Cases**: 29
**Real Patient Tests**: 5

## Summary
All error detection algorithms have been validated and tuned to achieve ≥85% accuracy.

## Results by Exercise Type
[Include table from Phase 4]

## Threshold Changes
[Document all threshold adjustments made]

## Recommendations for Future Improvement
- [Any observations or suggestions]

## Sign-Off
I certify that the error detection system has been clinically validated and is ready for production use.

Signature: ________________
Date: ________________
```

### 5.3 Monitor in Production

After deployment, continue monitoring:

1. **Collect user feedback**: Are patients reporting false alarms?
2. **Review flagged cases**: Are critical errors being caught?
3. **Periodic re-validation**: Re-test quarterly with new videos

---

## Troubleshooting

### Issue: High False Positive Rate

**Symptoms**: System detects errors that aren't really there

**Solutions**:
1. Increase thresholds (make less sensitive)
2. Check video quality (low confidence can cause false detections)
3. Verify reference video has perfect form

### Issue: High False Negative Rate

**Symptoms**: System misses real errors

**Solutions**:
1. Decrease thresholds (make more sensitive)
2. Check if errors are visible from side view (pose detection limitation)
3. Verify ground truth annotations are correct

### Issue: Inconsistent Detection

**Symptoms**: Same error detected sometimes, missed other times

**Solutions**:
1. Check pose confidence scores (low confidence = unreliable)
2. Improve lighting and camera angle
3. Consider adding temporal smoothing (average across multiple frames)

---

## Reference: Default Thresholds

### Shoulder Errors
| Error Type | Warning | Critical | Unit |
|------------|---------|----------|------|
| Shoulder Hiking | 2.0 | 5.0 | cm |
| Trunk Lean | 5.0 | 15.0 | degrees |
| Internal Rotation | 15.0 | 30.0 | degrees |
| Incomplete ROM | 70 | 50 | percent |

### Knee Errors
| Error Type | Warning | Critical | Unit |
|------------|---------|----------|------|
| Knee Valgus | 5.0 | 10.0 | percent |
| Heel Lift | 1.0 | 2.0 | cm |
| Posterior Pelvic Tilt | 10.0 | 20.0 | degrees |
| Insufficient Depth | 10.0 | 20.0 | degrees |

### Elbow Errors
| Error Type | Warning | Critical | Unit |
|------------|---------|----------|------|
| Shoulder Compensation | 3.0 | 7.0 | cm |
| Incomplete Extension | 160.0 | 140.0 | degrees |
| Wrist Deviation | 15.0 | 30.0 | degrees |

---

## Support

If you encounter issues during validation:

1. **Check existing documentation**:
   - `docs/IMPLEMENTATION_SCOPE.md`
   - `docs/TESTING_GUIDE.md`

2. **Review code**:
   - Error detection: `src/features/videoComparison/errorDetection/`
   - Config: `src/features/videoComparison/config/errorDetectionConfig.ts`

3. **Contact development team**: Report issues with detailed logs and test videos

---

## Appendix A: Sample Ground Truth Template

```json
[
  {
    "type": "error_type_here",
    "severity": "warning_or_critical",
    "side": "left_right_or_bilateral",
    "timestampStart": 0,
    "timestampEnd": 0,
    "notes": "Description of what you see clinically"
  }
]
```

**Valid error types**:
- Shoulder: `shoulder_hiking`, `trunk_lean`, `internal_rotation`, `incomplete_rom`
- Knee: `knee_valgus`, `heel_lift`, `posterior_pelvic_tilt`, `insufficient_depth`
- Elbow: `shoulder_compensation`, `incomplete_extension`, `wrist_deviation`

---

## Appendix B: Validation Checklist

- [ ] Phase 1: Preparation
  - [ ] Test videos collected (≥3 per exercise type)
  - [ ] Ground truth annotations created
  - [ ] Videos meet quality requirements

- [ ] Phase 2: Initial Validation
  - [ ] Validation harness run for all test cases
  - [ ] Results documented
  - [ ] Issues identified

- [ ] Phase 3: Threshold Tuning
  - [ ] Tuning tool used to adjust thresholds
  - [ ] Iterative validation performed
  - [ ] F1 Score ≥85% achieved for all error types
  - [ ] Tuned configuration saved

- [ ] Phase 4: Final Validation
  - [ ] Full test suite run with tuned thresholds
  - [ ] Overall accuracy calculated
  - [ ] Real-world patient testing completed
  - [ ] Acceptance criteria met

- [ ] Phase 5: Deployment
  - [ ] Production config updated
  - [ ] Validation report created
  - [ ] Monitoring plan established

---

**End of Clinical Validation Protocol**
