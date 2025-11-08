# PhysioAssist Evidence-Based Roadmap (2025)

> **Last Updated:** November 8, 2025
> **Owners:** Clinical Science, Product, Engineering
> **Status:** 🚨 **Integration gaps identified - see [Architecture Analysis](../architecture/DEEP_ANALYSIS_ARCHITECTURE_STATE.md)**

---

## 🎯 Core Focus

**Build and validate a clinically accurate pose-based exercise feedback system for post-surgical physiotherapy.**

### What We're Building

1. **YouTube reference templates** - PT-prescribed exercise videos
2. **Real-time pose comparison** - Patient webcam vs reference using MoveNet
3. **Biomechanical error detection** - Shoulder hiking, knee valgus, etc.
4. **Therapist-selected primary joint focus** - Prioritize shoulder/knee/elbow
5. **Smart feedback prioritization** - Max 3 errors, injury risk weighted

---

## 🔴 **Critical Discovery (Nov 8)**

**Two incompatible systems exist in codebase:**

| System | Model | Config | Status |
|--------|-------|--------|--------|
| **Working** | MoveNet 17-pt | `errorDetectionConfig.ts` (placeholders) | ✅ Integrated |
| **New (Nov 8)** | MediaPipe 33-pt | `clinicalThresholds.ts` (research-backed) | ❌ **NOT integrated** |

**Impact:** New research-backed configs + smoothing filter are **dead code**. See [Deep Analysis](../architecture/DEEP_ANALYSIS_ARCHITECTURE_STATE.md).

**Solution:** Hybrid approach - fix MoveNet first (Gate 7-11), evaluate MediaPipe migration post-pilot (Gate 12).

---

## 📋 Implementation Gates

### **Gate 7: Core Safety & Stability** (Week 1 - 4 days)

**Objective:** Integrate research-backed improvements into existing MoveNet system.

#### Sub-Gate 7a: Smoothing Integration (Days 1-2)
- [ ] Integrate `OneEuroFilter` into `PoseDetectionService.v2.ts`
- [ ] Test with 10 varied exercise videos
- [ ] Measure jitter reduction (target: >50% improvement)
- [ ] Verify latency <50ms end-to-end

#### Sub-Gate 7b: Clinical Thresholds Adapter (Day 3)
- [ ] Create `clinicalThresholdsAdapter.ts` to map MediaPipe thresholds → MoveNet indices
- [ ] Convert percentage-based thresholds (5% humerus) → absolute (1.7cm)
- [ ] Preserve research citations (AAOS, IJSPT, JOSPT)
- [ ] Replace placeholder values in `errorDetectionConfig.ts`

#### Sub-Gate 7c: Persistence Filtering (Day 3-4)
- [ ] Create `PersistenceFilter` class for temporal error validation
- [ ] Integrate into error detection modules
- [ ] Use research-backed persistence times (150-500ms)
- [ ] Prevent false positives from pose jitter

#### Sub-Gate 7d: Lighting Analysis (Day 4)
- [ ] Implement real brightness analysis (ITU-R BT.601 luminance)
- [ ] Implement real contrast analysis (stddev / 255)
- [ ] Implement shadow detection (histogram or edge detection)
- [ ] Test across 5 lighting conditions (dark, dim, normal, bright, harsh)

**Exit Criteria:**
- [ ] Joint angle jitter < 3° (50%+ reduction from baseline)
- [ ] Filter latency measured at <50ms
- [ ] Lighting QA passes across all environments
- [ ] Persistence filtering prevents transient false positives

---

### **Gate 8: Simple Authentication** (Week 2 - 2 days)

**Objective:** Basic patient profiles without PHI.

#### Tasks
- [ ] Nickname-based login (no email, no real names)
- [ ] Profile fields: nickname, age, patient level (beginner/intermediate/advanced)
- [ ] Session history: exercise type, date, duration (local storage only)
- [ ] Rate limiting on API endpoints

**Exit Criteria:**
- [ ] Profile persists across app restarts
- [ ] No PHI collected or stored
- [ ] Login/logout stable, no crashes

---

### **Gate 9: YouTube Template UI + Primary Joint Focus** (Week 2-3 - 3 days)

**Objective:** Therapist exercise prescription with joint-specific focus.

#### Tasks
- [ ] YouTube URL input with validation
- [ ] Video preview (title, duration, thumbnail)
- [ ] **Primary joint selector** (shoulder / elbow / knee / hip / all)
- [ ] Template library per patient
- [ ] Delete/replace template functionality

#### Primary Joint Focus Implementation (Option B)
```typescript
// 10× priority boost for errors matching primary joint
if (primaryJoint === 'shoulder' && error.type.includes('shoulder')) {
  priority *= 10;
}
```

**Compensatory Relationship Map:**
- `shoulder_hiking` → shoulder (1.0)
- `trunk_lean` → shoulder (0.7 - compensatory)
- `knee_valgus` → shoulder (0.1 - unrelated)

**Exit Criteria:**
- [ ] Therapist can configure exercise + primary joint
- [ ] Primary joint errors shown first in feedback
- [ ] Video plays smoothly (30 FPS minimum)
- [ ] Edge cases handled (invalid URLs, deleted videos)

---

### **Gate 10: Prescription API** (Week 3 - 2 days)

**Objective:** External integration for PT clinic systems.

#### Tasks
- [ ] REST endpoint: `POST /api/prescriptions`
- [ ] Simple API key authentication
- [ ] Payload: `user_id` (non-PHI), `exercise_urls[]`, `primary_joint`, `dosage`
- [ ] Prescription inbox UI in patient app
- [ ] Basic rate limiting + validation

**Exit Criteria:**
- [ ] API accepts prescription and delivers to patient
- [ ] Sample integration app (mocked EMR connector)
- [ ] OpenAPI/Swagger documentation

---

### **Gate 11: Testing & Performance** (Week 3-4 - 4 days)

**Objective:** Comprehensive test coverage and benchmarking.

#### Test Coverage
- [ ] **Unit tests:** One-Euro filter, clinical threshold calculations, FPPA
- [ ] **Integration tests:** Template → inbox → start exercise flow
- [ ] **Performance benchmarks:**
  - Pose detection: ≥20 FPS (web), ≥15 FPS (mobile)
  - Memory usage: <500MB during session
  - Filter latency: <50ms
  - Video loading: <3 seconds (30-sec clip)
- [ ] **Regression tests:** All existing tests pass, no new console errors

**Exit Criteria:**
- [ ] 90% unit coverage on error detection modules
- [ ] All performance benchmarks met
- [ ] Automated regression suite in CI/CD
- [ ] Smoke test: Complete full exercise session without crash

---

### **Gate 12: Clinical Pilot Study** (Weeks 5-10 - 4-6 weeks)

**Objective:** Small-scale validation with real PTs and patients.

#### Study Design
- **Sample:** 10-15 patients (post-surgical knee or shoulder)
- **Duration:** 2-4 weeks per patient
- **Setting:** 1-2 PT clinics, hybrid telehealth model
- **Comparator:** PT in-person assessment (gold standard)

#### Measurements

##### 1. **Clinical Accuracy** (Primary)
- **Method:** PT and app both assess same patient video (blinded)
- **Metric:** Inter-rater agreement (Cohen's kappa)
- **Target:** **κ ≥0.6** (substantial agreement)

##### 2. **Usability**
- **Method:** System Usability Scale (SUS) questionnaire
- **Metric:** SUS score (0-100)
- **Target:** **SUS ≥70** ("good" usability)

##### 3. **Adherence**
- **Method:** Track completion rate over 2-4 weeks
- **Metric:** % of prescribed sessions completed
- **Target:** **≥40%** (beat 35% baseline from literature)

##### 4. **Safety**
- **Method:** Patient self-report + PT review
- **Metric:** Adverse events (injuries, pain exacerbations)
- **Target:** **Zero** adverse events attributable to app

#### Timeline
- **Weeks 1-2:** Recruit clinics, train PTs, draft protocol
- **Weeks 3-4:** Enroll patients, collect baseline
- **Weeks 5-8:** Intervention period (patients use app)
- **Weeks 9-10:** Data analysis, write report

**Exit Criteria:**
- [ ] Accuracy κ ≥0.6 (if 0.4-0.6, fix thresholds and retest)
- [ ] Usability SUS ≥70 (if 50-70, simplify UI)
- [ ] Adherence ≥40% (if <40%, Gate 13-14 become critical)
- [ ] Safety: zero adverse events
- [ ] Qualitative: Patients willing to recommend

#### Decision Point: GO / PIVOT / STOP

**✅ GO** (Continue to Scale):
- All metrics met
- PTs endorse for broader use
- No safety concerns

**⚠️ PIVOT** (Improve Before Scale):
- Accuracy 0.4-0.6: Fix detection thresholds
- Usability 50-70: Simplify UI, add tutorials
- Adherence 25-40%: Add motivation features (Gates 13-14)

**❌ STOP** (Fundamental Blocker):
- Accuracy <0.4: Technology not viable
- Usability <50: Too complex for target users
- Adherence <25%: No better than standard care
- Safety issues: Patients injured

---

## 📊 Measurement Framework

### **Technical Metrics**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pose detection FPS | ≥20 (web), ≥15 (mobile) | Performance profiler |
| Filter latency | <50ms | Timestamp diff |
| Joint angle jitter | <3° stddev | Before/after smoothing |
| Memory usage | <500MB | Browser DevTools |
| Crash rate | <1% | Error logging |

### **Clinical Metrics**

| Metric | Target | Method |
|--------|--------|--------|
| Accuracy (κ) | ≥0.6 | PT vs app agreement |
| Usability (SUS) | ≥70 | 10-question survey |
| Adherence | ≥40% | Session completion % |
| Safety | 0 events | Incident reporting |

---

## 🔬 Research & Evidence Base

### **Pose Estimation Validation**
1. **JMIR 2024:** MediaPipe upper limb tracking, RMSE 0.28±0.06 px
2. **PMC 2023:** Markerless gait, 95-99% accuracy vs Vicon
3. **Nature SR 2025:** Monocular pose estimation assessment (Physio2.2M dataset)

### **Clinical Thresholds**
4. **AAOS OrthoInfo 2023:** Shoulder surgery exercise guidelines
5. **IJSPT 2024:** FPPA as 2D valgus proxy (8-10° threshold)
6. **JOSPT 2025:** Rotator cuff PT protocols

### **Patient Adherence**
7. **PLOS Digital Health 2024:** mHealth app barriers (>65% non-adherence)
8. **PMC 2025:** OA study - apps don't auto-improve adherence
9. **JMIR 2024:** PT engagement = #1 predictor of adherence

### **Smoothing Algorithms**
10. **ACM CHI 2012:** One-Euro filter (Casiez et al.)
11. **SIGGRAPH 2024:** One-Euro benchmark studies

---

## 🧪 Technology Stack

### **Current (MoveNet-based)**
- **Pose Model:** MoveNet Lightning INT8 (17 keypoints, 30+ FPS)
- **Config:** `errorDetectionConfig.ts` → adapted from `clinicalThresholds.ts`
- **Smoothing:** One-Euro filter (integrated in Gate 7)
- **Temporal Alignment:** Duration-based speedRatio

### **Under Evaluation (Post-Pilot)**
- **Pose Model:** MediaPipe Pose (33 keypoints, 20-25 FPS)
- **Temporal Alignment:** Dynamic Time Warping (DTW) or transformer-based
- **Depth Estimation:** Multi-view fusion for 3D analysis

**Decision:** Stick with MoveNet for pilot. Evaluate MediaPipe migration based on pilot accuracy results.

---

## 🚨 Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Lighting variability** | False negatives in dim rooms | Lighting QA in Gate 7, user guidance |
| **Camera angle effects** | FPPA accuracy degraded | Document camera setup protocol for PTs |
| **Patient hardware diversity** | Mobile GPU constraints | Performance testing across devices |
| **Adherence <40%** | Pilot fails, need Gates 13-14 | PT engagement training, motivation features |
| **MoveNet accuracy <80%** | Need MediaPipe migration | Parallel implementation post-pilot |

---

## 🛣️ Post-Pilot Paths

### **If Pilot Succeeds (GO)**
- **Gates 13-14:** Adherence optimization (PT dashboard, patient motivation)
- **Gate 15:** HIPAA compliance (when collecting PHI)
- **Scale:** 10-20 clinics, 200-500 patients

### **If Pilot Shows Gaps (PIVOT)**
- **Accuracy gap:** Migrate to MediaPipe 33-point
- **Usability gap:** Simplify onboarding, add voice guidance
- **Adherence gap:** Implement motivation system before scale

### **If Pilot Fails (STOP)**
- **Accuracy <40%:** Fundamental tech limitation
- **Adherence <25%:** No improvement over standard care
- **Pivot options:** B2B API to existing platforms, research tool licensing

---

## ✅ Immediate Next Steps (Week 1)

### **Monday: Kickoff**
- [ ] Review [Deep Architecture Analysis](../architecture/DEEP_ANALYSIS_ARCHITECTURE_STATE.md)
- [ ] Align on hybrid approach (MoveNet + clinical thresholds)
- [ ] Assign Gate 7 sub-tasks

### **Tuesday-Wednesday: Smoothing Integration**
- [ ] Integrate OneEuroFilter into PoseDetectionService.v2
- [ ] Test jitter reduction with 10 videos
- [ ] Verify <50ms latency

### **Thursday: Clinical Thresholds Adapter**
- [ ] Create adapter mapping MediaPipe → MoveNet
- [ ] Update errorDetectionConfig with research values
- [ ] Add persistence filtering

### **Friday: Lighting Analysis**
- [ ] Implement real brightness/contrast/shadow detection
- [ ] Test across 5 lighting conditions
- [ ] Document QA results

---

## 📞 Key Questions for Colleague Review

See [Peer Review Request](../reviews/PEER_REVIEW_REQUEST.md) for detailed technical questions.

**High-level asks:**
1. **Clinical thresholds:** Are mapped MoveNet values appropriate? (e.g., 1.7cm for shoulder hiking from 5% humerus)
2. **Primary joint focus:** Confirm Option B (10× priority boost) is correct approach
3. **Model selection:** Agree with MoveNet-first, MediaPipe-later strategy?
4. **Temporal alignment:** Need DTW now or post-pilot?
5. **Missing error types:** What compensatory patterns are we not detecting?

---

## 🎯 Success Definition

**Gate 12 Exit:**
- **Accuracy:** ≥90% agreement with PT (stretch: κ ≥0.8)
- **Usability:** SUS ≥80 (stretch: ≥85)
- **Adherence:** ≥70% session completion with PT nudges (stretch: ≥80%)
- **Safety:** 0 adverse events, <1 hour red-flag escalation
- **Qualitative:** "I would use this with my patients" from ≥80% of PTs

---

## 📚 Additional Documentation

- **Architecture:** [Deep Analysis](../architecture/DEEP_ANALYSIS_ARCHITECTURE_STATE.md) (read first!)
- **Clinical Framework:** [Integration Analysis](../research/CLINICAL_FRAMEWORK_INTEGRATION.md)
- **Peer Review:** [Technical Review Request](../reviews/PEER_REVIEW_REQUEST.md)
- **Original Plans:** [Focused Remediation](FOCUSED_REMEDIATION_PLAN.md)

---

**Ready to build.** Next: Gate 7 kickoff meeting.

**Last Updated:** November 8, 2025
