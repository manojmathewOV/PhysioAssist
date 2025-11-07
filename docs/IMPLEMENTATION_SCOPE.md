# 🚀 Video Comparison Implementation Scope

**Date:** 2025-11-07
**Status:** Ready for systematic implementation

---

## ✅ What Will Be IMPLEMENTED (Code Complete)

### **Infrastructure Services (Gate 1)**

#### 1. Telemetry Service ✓ IMPLEMENT
**File:** `src/features/videoComparison/services/telemetryService.ts`

**Capabilities:**
- Track session metrics (duration, inference time, confidence scores)
- Track frame-level metrics (FPS, thermal state, dropped frames)
- Track network metrics (YouTube downloads, upload success/failure)
- Batch events and send to analytics backend
- No clinical validation needed - pure infrastructure

**Deliverable:** Fully functional telemetry with typed event schemas

---

#### 2. YouTube Quota Manager ✓ IMPLEMENT
**File:** `src/features/videoComparison/services/youtubeQuotaManager.ts`

**Capabilities:**
- Monitor YouTube API quota usage
- Implement circuit breaker when quota exceeded
- Cache metadata for 24h (already implemented)
- Fallback to offline library when quota low
- Automated alerting at 50%, 80%, 95% thresholds

**Deliverable:** Production-ready quota management

---

#### 3. Device Health Monitor ✓ IMPLEMENT
**File:** `src/services/deviceHealthMonitor.ts`

**Capabilities:**
- Monitor thermal state (nominal/fair/serious/critical)
- Monitor battery level
- Recommend inference intervals based on device health
- Emit telemetry events
- No clinical validation needed

**Deliverable:** Adaptive performance based on device state

---

#### 4. Analytics & Localization ✓ IMPLEMENT
**Files:**
- `src/features/videoComparison/services/analytics.ts`
- `src/features/videoComparison/services/localization.ts`
- `src/features/videoComparison/constants/analyticsEvents.ts`
- `src/features/videoComparison/constants/feedbackMessages.ts`

**Capabilities:**
- Centralized event definitions
- i18n-ready feedback messages
- Easy to add translations
- Type-safe event tracking

**Deliverable:** Centralized analytics and i18n infrastructure

---

#### 5. Analysis Session Interface ✓ IMPLEMENT
**File:** `src/features/videoComparison/services/analysisSession.ts`

**Capabilities:**
- `BatchAnalysisSession` for async mode
- `StreamingAnalysisSession` for live mode
- Unified `ComparisonResult` interface
- Windowed analysis for real-time feedback

**Deliverable:** Clean abstraction for both modes

---

#### 6. Memory Health Manager ✓ IMPLEMENT
**File:** `src/services/memoryHealthManager.ts`

**Capabilities:**
- Listen for iOS memory warnings
- Downshift resolution (1080p → 720p → 540p)
- Clear frame buffers
- Unload unused models
- User notifications

**Deliverable:** Prevents memory-related crashes

---

### **Error Detection Algorithms (Gate 3)**

#### 7. Shoulder Error Detectors ✓ IMPLEMENT
**File:** `src/features/videoComparison/errorDetection/shoulderErrors.ts`

**Algorithms:**
- Shoulder hiking detection (shoulder-to-ear distance)
- Trunk leaning detection (lateral trunk angle)
- Internal rotation detection (forearm orientation)
- Incomplete ROM detection (angle comparison)

**Configurable Parameters:**
```typescript
{
  shoulderHiking: {
    warningThreshold_cm: 2,    // ⚠️ CLINICAL TUNING
    criticalThreshold_cm: 5    // ⚠️ CLINICAL TUNING
  },
  trunkLean: {
    warningThreshold_deg: 5,   // ⚠️ CLINICAL TUNING
    criticalThreshold_deg: 15  // ⚠️ CLINICAL TUNING
  }
}
```

**Deliverable:** Working algorithms with placeholder thresholds

---

#### 8. Knee Error Detectors ✓ IMPLEMENT
**File:** `src/features/videoComparison/errorDetection/kneeErrors.ts`

**Algorithms:**
- Knee valgus detection (HIGH INJURY RISK)
- Heel lift detection
- Posterior pelvic tilt detection
- Insufficient depth detection

**Configurable Parameters:**
```typescript
{
  kneeValgus: {
    warningThreshold_percent: 5,   // ⚠️ CLINICAL TUNING
    criticalThreshold_percent: 10  // ⚠️ CLINICAL TUNING
  },
  heelLift: {
    warningThreshold_cm: 1,  // ⚠️ CLINICAL TUNING
    criticalThreshold_cm: 2  // ⚠️ CLINICAL TUNING
  }
}
```

**Deliverable:** Working algorithms with placeholder thresholds

---

#### 9. Elbow Error Detectors ✓ IMPLEMENT
**File:** `src/features/videoComparison/errorDetection/elbowErrors.ts`

**Algorithms:**
- Shoulder compensation detection
- Incomplete extension detection
- Wrist deviation detection

**Deliverable:** Working algorithms with placeholder thresholds

---

#### 10. Smart Feedback Prioritizer ✓ IMPLEMENT
**File:** `src/features/videoComparison/services/smartFeedbackGenerator.ts`

**Capabilities:**
- Priority scoring (injury risk + severity + frequency)
- Top-N filtering (max 3 errors)
- Patient level adjustment (beginner/intermediate/advanced)
- Positive reinforcement detection

**Deliverable:** Non-overwhelming feedback system

---

### **Configuration System**

#### 11. Error Detection Config ✓ IMPLEMENT
**File:** `src/features/videoComparison/config/errorDetectionConfig.ts`

**Structure:**
```typescript
export const ErrorDetectionConfig = {
  shoulder: {
    shoulderHiking: { warning: 2, critical: 5 },
    trunkLean: { warning: 5, critical: 15 },
    // ...all thresholds
  },
  knee: { /* ... */ },
  elbow: { /* ... */ }
};

// Easy for clinician to update via config file
```

**Deliverable:** Single source of truth for all thresholds

---

### **Validation & Testing Tools**

#### 12. Clinical Validation Test Harness ✓ IMPLEMENT
**File:** `scripts/clinical-validation-harness.js`

**Capabilities:**
- Load test videos
- Run error detection
- Compare against expected results
- Generate accuracy reports
- Export results as CSV for review

**Deliverable:** Easy testing workflow

---

#### 13. Threshold Tuning Tool ✓ IMPLEMENT
**File:** `scripts/tune-thresholds.js`

**Capabilities:**
- Load validation dataset
- Test different threshold values
- Calculate accuracy/precision/recall
- Find optimal thresholds
- Update config file

**Deliverable:** Data-driven threshold optimization

---

#### 14. Interactive Demo Mode ✓ IMPLEMENT
**Component:** `src/features/videoComparison/screens/DemoScreen.tsx`

**Capabilities:**
- Load sample videos
- Adjust thresholds in real-time with sliders
- See error detection change live
- Export tuned config

**Deliverable:** Visual threshold tuning UI

---

## ⚠️ What Requires CLINICAL VALIDATION (Cannot Code)

### **Threshold Values** 🏥 CLINICIAN TUNING

All error detection thresholds need PT validation:

| Error Type | Parameter | Current | Needs Validation |
|------------|-----------|---------|------------------|
| Shoulder Hiking | Warning (cm) | 2 | ⚠️ PT VALIDATE |
| Shoulder Hiking | Critical (cm) | 5 | ⚠️ PT VALIDATE |
| Trunk Lean | Warning (deg) | 5 | ⚠️ PT VALIDATE |
| Trunk Lean | Critical (deg) | 15 | ⚠️ PT VALIDATE |
| Knee Valgus | Warning (%) | 5 | ⚠️ PT VALIDATE |
| Knee Valgus | Critical (%) | 10 | ⚠️ PT VALIDATE |
| Heel Lift | Warning (cm) | 1 | ⚠️ PT VALIDATE |
| Heel Lift | Critical (cm) | 2 | ⚠️ PT VALIDATE |
| Incomplete ROM | Warning (%) | 30 | ⚠️ PT VALIDATE |
| Incomplete ROM | Critical (%) | 50 | ⚠️ PT VALIDATE |

**Process:**
1. Developer implements algorithm with placeholder thresholds
2. Clinician tests with validation videos
3. Clinician adjusts thresholds using tuning tool
4. Repeat until accuracy ≥85%

---

### **Accuracy Validation** 🏥 CLINICIAN TESTING

**Requirements:**
- [ ] Test with 60 videos (20 shoulder, 20 knee, 20 elbow)
- [ ] 50% good form, 50% bad form
- [ ] Overall detection accuracy ≥85%
- [ ] False positive rate <15%
- [ ] PT agreement ≥80%

**Deliverable:** Validation report with accuracy metrics

---

### **Feedback Message Validation** 🏥 CLINICIAN REVIEW

**Requirements:**
- [ ] Review all error messages for clinical accuracy
- [ ] Ensure corrections are safe and appropriate
- [ ] Confirm no dangerous advice
- [ ] Validate patient-friendly language

**Deliverable:** PT sign-off on feedback library

---

### **Exercise-Specific Validation** 🏥 CLINICIAN TESTING

**Requirements:**
- [ ] Validate shoulder exercises (abduction, flexion, rotation)
- [ ] Validate knee exercises (squat, lunge, step-up)
- [ ] Validate elbow exercises (flexion, extension, curl)
- [ ] Confirm error patterns match real patient mistakes

**Deliverable:** Per-exercise validation reports

---

## 📋 Implementation Phases

### **Phase 1: Infrastructure (Week 1)**
- ✅ Telemetry service
- ✅ YouTube quota manager
- ✅ Device health monitor
- ✅ Analytics & localization
- ✅ Analysis session interface
- ✅ Memory health manager

**Outcome:** Solid foundation for feature

---

### **Phase 2: Error Detection (Week 2)**
- ✅ Shoulder error detectors
- ✅ Knee error detectors
- ✅ Elbow error detectors
- ✅ Smart feedback prioritizer
- ✅ Configuration system

**Outcome:** Functional error detection with placeholder thresholds

---

### **Phase 3: Validation Tools (Week 2)**
- ✅ Clinical validation harness
- ✅ Threshold tuning tool
- ✅ Interactive demo mode
- ✅ Testing protocol documentation

**Outcome:** Complete testing toolkit

---

### **Phase 4: Clinical Validation (Clinician-Led)**
- ⚠️ Collect validation videos
- ⚠️ Test error detection
- ⚠️ Tune thresholds
- ⚠️ Validate accuracy
- ⚠️ Review feedback messages
- ⚠️ Sign off on clinical safety

**Outcome:** Production-ready thresholds and validated accuracy

---

## 🎯 Success Criteria

### **Code Complete Definition**
- [x] All services implemented and tested
- [x] All error detection algorithms functional
- [x] Configuration system in place
- [x] Validation tools ready
- [x] Documentation complete
- [x] No blocking bugs

### **Clinical Validation Definition**
- [ ] Accuracy ≥85% across all exercise types
- [ ] False positive rate <15%
- [ ] PT agreement ≥80%
- [ ] No dangerous feedback messages
- [ ] Thresholds clinically appropriate
- [ ] PT sign-off obtained

---

## 📝 Testing Protocol for Clinician

**File:** `docs/CLINICAL_VALIDATION_PROTOCOL.md`

Will include:
1. How to run validation harness
2. How to interpret results
3. How to tune thresholds
4. How to export validation reports
5. Acceptance criteria for each error type
6. Sample test videos

---

## 🚦 Gate Status After Implementation

| Gate | Status | Blockers |
|------|--------|----------|
| Gate 0 | ✅ PASSED | None |
| Gate 1 | ✅ PASSED | None (all services coded) |
| Gate 2 | ✅ PASSED | None (UI implemented) |
| Gate 3 | ⚠️ PENDING | Clinical threshold validation |
| Gate 4 | ✅ PASSED | None (live mode coded) |
| Gate 5 | ✅ PASSED | None (multi-angle coded) |

**Only clinical validation remains!**

---

**This approach ensures:**
- ✅ Maximum developer productivity (implement everything possible)
- ✅ Clear separation of concerns (code vs clinical)
- ✅ Easy validation process for clinician
- ✅ Production-ready infrastructure
- ✅ Configurable, tunable system
