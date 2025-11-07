# Quick Start: Clinical Validation

## Overview

This guide provides the essential commands to get started with clinical validation of the error detection system.

**Time Required**: 4-6 hours (spread across multiple sessions)

---

## Prerequisites

✅ Test videos prepared (reference + error videos)
✅ Ground truth annotations created (JSON files)
✅ PhysioAssist development environment set up

---

## Quick Commands

### 1. Run Tests (Verify Everything Works)

```bash
# Run error detection tests
npm run test:error-detection

# Run feedback generator tests
npm run test:feedback

# Run all tests
npm run test:all
```

**Expected**: All tests pass ✅

### 2. Validate with Test Videos

```bash
# Basic validation (no ground truth)
npm run clinical:validate -- \
  --reference ./test-videos/squat-reference.mp4 \
  --user ./test-videos/squat-patient.mp4 \
  --exercise squat

# Full validation (with ground truth for accuracy metrics)
npm run clinical:validate -- \
  --reference ./test-videos/squat-reference.mp4 \
  --user ./test-videos/squat-patient.mp4 \
  --exercise squat \
  --ground-truth ./test-videos/squat-ground-truth.json \
  --output ./results/squat-validation.json
```

**Exercise Types**:
- `shoulder_abduction` - Shoulder exercises
- `squat` - Knee exercises
- `bicep_curl` - Elbow exercises

### 3. Tune Thresholds

```bash
npm run clinical:tune
```

**Menu Options**:
1. View Current Thresholds
2. Tune Shoulder Thresholds
3. Tune Knee Thresholds (⚠️ ACL injury risk - tune carefully!)
4. Tune Elbow Thresholds
5. Validate Configuration
6. Save Configuration
7. Load Configuration
8. Reset to Defaults
9. Exit

**Workflow**:
1. Select "1" to view current thresholds
2. Select "2", "3", or "4" to tune specific body part
3. Adjust thresholds based on validation results
4. Select "5" to validate (ensures critical > warning)
5. Select "6" to save tuned configuration
6. Re-run validation to verify improvements

### 4. Check Current Thresholds

```bash
# View all thresholds in config file
cat src/features/videoComparison/config/errorDetectionConfig.ts | grep -A 2 "warning\|critical"
```

---

## Ground Truth File Format

Create JSON files documenting expected errors:

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
    "type": "heel_lift",
    "severity": "warning",
    "side": "bilateral",
    "timestampStart": 2500,
    "timestampEnd": 3000,
    "notes": "Slight heel lift at bottom of squat"
  }
]
```

**Valid Error Types**:

**Shoulder**:
- `shoulder_hiking`
- `trunk_lean`
- `internal_rotation`
- `incomplete_rom`

**Knee**:
- `knee_valgus` (⚠️ HIGH PRIORITY - ACL injury risk)
- `heel_lift`
- `posterior_pelvic_tilt`
- `insufficient_depth`

**Elbow**:
- `shoulder_compensation`
- `incomplete_extension`
- `wrist_deviation`

**Severity**:
- `warning` - Minor deviation, patient should be aware
- `critical` - Major deviation, injury risk or significant form issue

**Side**:
- `left`
- `right`
- `bilateral` (both sides)

---

## Validation Workflow

### Step 1: Initial Testing

```bash
# Test all your videos
for video in test-videos/*-error.mp4; do
  npm run clinical:validate -- \
    --reference test-videos/reference.mp4 \
    --user "$video" \
    --exercise squat
done
```

### Step 2: Review Results

Check the output for:
- ✅ Detected errors (did it catch what you expected?)
- ❌ False positives (flagged normal movement)
- ❌ False negatives (missed real errors)

### Step 3: Tune Thresholds

Based on results:
- **High false positives** → Increase thresholds (less sensitive)
- **High false negatives** → Decrease thresholds (more sensitive)

```bash
npm run clinical:tune
```

### Step 4: Re-validate

```bash
# Run validation again with tuned thresholds
npm run clinical:validate -- \
  --reference ./test-videos/squat-reference.mp4 \
  --user ./test-videos/squat-valgus.mp4 \
  --exercise squat \
  --ground-truth ./test-videos/squat-valgus-gt.json \
  --output ./results/squat-valgus-tuned.json
```

### Step 5: Check Accuracy

Target metrics:
- **Precision**: ≥ 85% (% of detected errors that were real)
- **Recall**: ≥ 85% (% of real errors that were detected)
- **F1 Score**: ≥ 85% (harmonic mean of precision and recall)

**Special case - Knee valgus**:
- **Recall**: ≥ 95% (must catch ALL ACL injury risks!)
- **Precision**: ≥ 90% (minimize false alarms)

### Step 6: Save Configuration

Once satisfied:

```bash
# In tuning tool
Select option: 6 (Save Configuration)
Enter file path: ./config/tuned-error-detection-config.json

# Replace default config
cp ./config/tuned-error-detection-config.json \
   ./src/features/videoComparison/config/errorDetectionConfig.ts
```

---

## Testing on Device

### Run on iOS Simulator

```bash
npm run ios:sim
```

### Run on Physical iOS Device

```bash
npm run ios:device
```

### Test the Feature

1. Launch PhysioAssist app
2. Navigate to "Video Comparison" feature
3. Select exercise type (shoulder/knee/elbow)
4. Record reference video (you doing perfect form)
5. Record user video (you with intentional errors)
6. Review detected errors and feedback

**Verify**:
- ✅ Errors are detected correctly
- ✅ Feedback messages are clear and actionable
- ✅ Priority is correct (critical errors shown first)
- ✅ No false alarms for good form

---

## Common Issues

### Issue: Tests failing

**Solution**:
```bash
# Re-install dependencies
npm install

# Clear cache and re-run
npm run test -- --clearCache
npm run test:error-detection
```

### Issue: Validation harness fails to load video

**Current Limitation**: The validation harness has stub video loading (video extraction not yet implemented for CLI).

**Workaround**: Focus on tuning thresholds and testing in the actual app for now.

**Future Enhancement**: Integrate video processing library for CLI validation.

### Issue: All/most errors flagged as false positives

**Solution**: Thresholds are too sensitive. Increase them:

```bash
npm run clinical:tune
# Select body part
# Increase warning and critical thresholds by 20-30%
# Re-validate
```

### Issue: Missing real errors (false negatives)

**Solution**: Thresholds are not sensitive enough. Decrease them:

```bash
npm run clinical:tune
# Select body part
# Decrease warning and critical thresholds by 20-30%
# Re-validate
```

### Issue: Knee valgus not detected

**Critical**: This is high-priority due to ACL injury risk.

**Solution**:
1. Verify video shows clear valgus (knees caving in)
2. Ensure camera angle is frontal view
3. Decrease knee valgus thresholds:
   - Try warning: 3% (default 5%)
   - Try critical: 7% (default 10%)
4. Test with exaggerated valgus first

---

## Acceptance Criteria

Before production deployment, verify:

- [ ] **Overall F1 Score ≥ 85%** across all error types
- [ ] **Knee valgus recall ≥ 95%** (critical for safety)
- [ ] **No error type < 75% F1** (all should be reasonably accurate)
- [ ] **Real patient testing** with 3-5 patients confirms accuracy
- [ ] **Validation report** created and signed off

---

## Next Steps

1. ✅ **Run tests** to verify everything works
2. ✅ **Prepare test videos** (reference + errors)
3. ✅ **Create ground truth** annotations
4. ✅ **Run validation harness** on all test cases
5. ✅ **Tune thresholds** iteratively
6. ✅ **Test on real device** with real patients
7. ✅ **Meet acceptance criteria**
8. ✅ **Deploy to production**

---

## Full Documentation

For detailed step-by-step instructions, see:
- `docs/CLINICAL_VALIDATION_PROTOCOL.md` - Complete validation guide
- `docs/ERROR_DETECTION_IMPLEMENTATION_COMPLETE.md` - Implementation summary

---

## Support

**Need help?**
- Review the full clinical validation protocol
- Check test results for specific failures
- Contact development team with detailed logs

---

**Good luck with clinical validation!** 🏥
