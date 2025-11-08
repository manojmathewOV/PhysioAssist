# PhysioAssist Master Roadmap 2025
## Single Source of Truth - 12 Weeks to Clinical Pilot

> **Last Updated:** November 8, 2025
> **Owner:** Engineering + Clinical + Product
> **Timeline:** 12 weeks (Weeks 1-12)
> **Decision Point:** Week 12 - GO/PIVOT/STOP

---

## 🎯 Mission

Build and validate a mobile-first, clinically accurate pose-based exercise feedback system for post-surgical physiotherapy, validated through pilot study with 10-15 patients.

---

## 📅 Timeline Overview

```
Weeks 1-4:   Foundation (Mobile infrastructure, camera, model)
Weeks 5-6:   Clinical Features (Smoothing, thresholds, UI, API)
Weeks 7-12:  Pilot Validation (Real patients, real PTs)
Week 12:     GO/PIVOT/STOP Decision
```

---

## Phase 1: Mobile Foundation (Weeks 1-4)

### **Gate 1: Camera Capture & Quality Assurance** (Week 1, Days 1-7)

**Objective:** Establish reliable camera capture with quality validation

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Native camera module (iOS/Android) | Mobile Eng | 3 days | Camera opens, captures at 30 FPS |
| Frame buffer management | Mobile Eng | 2 days | No memory leaks, <500MB usage |
| Quality heuristics (brightness, blur, framing) | Mobile Eng | 2 days | Auto-detects poor lighting/positioning |
| Metadata capture (resolution, FPS, device) | Mobile Eng | 1 day | Metadata logged per frame |
| Test across 5 devices (phones/tablets) | QA | 2 days | Works on iPhone 12+, Android 10+ |

**Deliverables:**
- [ ] React Native camera module
- [ ] Quality scoring algorithm (0-100)
- [ ] User guidance ("Move to better light", "Step back")
- [ ] Telemetry for quality metrics

**Exit Criteria:**
- ✅ Camera captures at ≥30 FPS on all test devices
- ✅ Quality score >70 in normal indoor lighting
- ✅ Guidance triggers correctly in poor conditions
- ✅ No crashes or memory leaks in 10-minute sessions

---

### **Gate 2: Preprocessing Pipeline** (Week 2-3, Days 8-17)

**Objective:** Stabilize and normalize video input for pose detection

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Frame resize (standardize to 256×256) | Mobile Eng | 2 days | Resize <10ms, maintains aspect ratio |
| Color normalization (white balance) | Mobile Eng | 2 days | Consistent colors across lighting |
| Noise suppression (Gaussian blur) | Mobile Eng | 1 day | Reduces jitter without blurring keypoints |
| Contrast enhancement (CLAHE) | Mobile Eng | 2 days | Improves low-light performance |
| Batch processing optimization | Mobile Eng | 2 days | Process ≥30 FPS sustained |
| A/B test: preprocessing ON vs OFF | QA | 1 day | Measure impact on pose accuracy |

**Deliverables:**
- [ ] Preprocessing module (resize, normalize, denoise)
- [ ] Performance benchmarks (latency per operation)
- [ ] Before/after visual comparison tool
- [ ] Configuration presets (indoor, outdoor, gym)

**Exit Criteria:**
- ✅ Total preprocessing latency <50ms
- ✅ Color consistency across 5 lighting conditions
- ✅ Pose detection accuracy improves by ≥10% (measured)
- ✅ No visual artifacts or distortion

---

### **Gate 3: Model Integration & Telemetry** (Week 3-4, Days 18-28)

**Objective:** Integrate MoveNet pose detection with confidence scoring

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| MoveNet Lightning integration (TFLite) | Mobile Eng | 3 days | Model runs on-device at ≥20 FPS |
| Keypoint confidence filtering (>0.5 threshold) | Mobile Eng | 1 day | Low-confidence points excluded |
| Pose validation (full body in frame) | Mobile Eng | 2 days | Detects when user too close/far |
| Telemetry: FPS, latency, confidence scores | DevOps | 2 days | Metrics logged to backend |
| Fallback handling (model load failure) | Mobile Eng | 1 day | Graceful error, retry logic |
| Benchmark across devices | QA | 2 days | ≥20 FPS on iPhone 12, Pixel 5 |

**Deliverables:**
- [ ] MoveNet TFLite model (INT8 quantized)
- [ ] Pose detection service (17 keypoints)
- [ ] Confidence scoring per keypoint
- [ ] Telemetry dashboard (Grafana/DataDog)

**Exit Criteria:**
- ✅ Pose detection ≥20 FPS on mobile devices
- ✅ Confidence >0.5 on ≥90% of keypoints (good conditions)
- ✅ Latency <100ms end-to-end (camera → pose)
- ✅ Telemetry captures all metrics
- ✅ Model size <10MB, memory <500MB

---

## Phase 2: Clinical Features (Weeks 5-6)

### **Gate 4: Smoothing & Clinical Thresholds** (Week 5, Days 29-35)

**Objective:** Integrate research-backed smoothing and clinical thresholds

#### Sub-Gate 4a: One-Euro Filter Integration (Days 29-31)

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Integrate OneEuroFilter into pose pipeline | Backend Eng | 1 day | Filter applied to all 17 keypoints |
| Tune parameters (minCutoff, beta, dCutoff) | Clinical Science | 1 day | Jitter reduced, no lag perceived |
| Test with 10 varied exercise videos | QA | 1 day | Measure jitter before/after |
| Verify latency <50ms | Mobile Eng | 0.5 day | No perceptible delay |

**Exit Criteria:**
- ✅ Joint angle jitter reduced by ≥50% (stddev <3°)
- ✅ Filter latency <50ms
- ✅ No ghosting or lag in visual feedback

#### Sub-Gate 4b: Clinical Thresholds Adapter (Days 32-33)

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Create clinicalThresholdsAdapter.ts | Backend Eng | 1 day | Maps MediaPipe thresholds → MoveNet |
| Convert percentage thresholds to absolute (cm) | Clinical Science | 0.5 day | 5% humerus = 1.7cm (validated) |
| Preserve research citations (AAOS, IJSPT) | Clinical Science | 0.5 day | Sources documented in code |
| Replace errorDetectionConfig placeholders | Backend Eng | 0.5 day | All "TUNE REQUIRED" warnings removed |

**Exit Criteria:**
- ✅ All thresholds research-backed (no placeholders)
- ✅ Citations included in code comments
- ✅ MoveNet-compatible (17 keypoints)

#### Sub-Gate 4c: Persistence Filtering (Days 33-34)

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Create PersistenceFilter class | Backend Eng | 1 day | Temporal error validation (150-500ms) |
| Integrate into error detection modules | Backend Eng | 0.5 day | All errors persistence-filtered |
| Test with jittery movements | QA | 0.5 day | False positives eliminated |

**Exit Criteria:**
- ✅ Errors must persist for threshold duration (150-500ms)
- ✅ False positives from jitter eliminated
- ✅ Transient errors correctly ignored

#### Sub-Gate 4d: Lighting Analysis (Day 35)

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Implement brightness (ITU-R BT.601 luminance) | Mobile Eng | 0.5 day | Real brightness calculation |
| Implement contrast (stddev / 255) | Mobile Eng | 0.25 day | Real contrast metric |
| Implement shadow detection (histogram) | Mobile Eng | 0.25 day | Detects harsh shadows |
| Test across 5 lighting conditions | QA | 0.5 day | Dark, dim, normal, bright, harsh |

**Exit Criteria:**
- ✅ Lighting QA passes in all 5 conditions
- ✅ User warned when lighting inadequate
- ✅ Thresholds tuned for accuracy

---

### **Gate 5: Authentication & Profiles** (Week 5, Days 36-37)

**Objective:** Basic patient profiles without PHI

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Nickname-based login (no email/real names) | Backend Eng | 1 day | Simple auth, no PHI collected |
| Profile fields (nickname, age, level) | Backend Eng | 0.5 day | Beginner/intermediate/advanced |
| Session history (local storage) | Frontend Eng | 0.5 day | Exercise type, date, duration |
| Rate limiting on API endpoints | DevOps | 0.5 day | Prevent abuse |

**Deliverables:**
- [ ] Auth service (nickname-based)
- [ ] Profile schema (non-PHI)
- [ ] Session history UI
- [ ] Rate limiting (100 req/min per user)

**Exit Criteria:**
- ✅ Profile persists across app restarts
- ✅ No PHI collected or stored
- ✅ Login/logout stable, no crashes

---

### **Gate 6: Template UI & Primary Joint Focus** (Week 5-6, Days 38-40)

**Objective:** Therapist exercise prescription with joint-specific focus

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| YouTube URL input + validation | Frontend Eng | 0.5 day | Accepts valid URLs, rejects invalid |
| Video preview (title, duration, thumbnail) | Frontend Eng | 0.5 day | Shows video metadata |
| **Primary joint selector** (shoulder/elbow/knee/hip/all) | Frontend Eng | 0.5 day | Dropdown with 5 options |
| Template library per patient | Frontend Eng | 1 day | CRUD operations on templates |
| Delete/replace template functionality | Frontend Eng | 0.5 day | Soft delete with confirmation |

**Primary Joint Focus Implementation:**
```typescript
// 10× priority boost for errors matching primary joint
if (primaryJoint === 'shoulder' && error.type.includes('shoulder')) {
  priority *= 10;
}
```

**Deliverables:**
- [ ] YouTube template UI
- [ ] Primary joint selector
- [ ] Template library (per patient)
- [ ] Compensatory relationship map

**Exit Criteria:**
- ✅ Therapist can configure exercise + primary joint
- ✅ Primary joint errors shown first in feedback
- ✅ Video plays smoothly (≥30 FPS)
- ✅ Edge cases handled (invalid URLs, deleted videos)

---

### **Gate 7: Prescription API** (Week 6, Days 41-42)

**Objective:** External integration for PT clinic systems

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| REST endpoint: POST /api/prescriptions | Backend Eng | 1 day | Accepts JSON payload |
| Simple API key authentication | Backend Eng | 0.5 day | Key-based auth |
| Payload: user_id, exercise_urls[], primary_joint, dosage | Backend Eng | 0.5 day | Schema validation |
| Prescription inbox UI in patient app | Frontend Eng | 0.5 day | Shows new prescriptions |
| Rate limiting + validation | DevOps | 0.5 day | 1000 req/day per API key |

**Deliverables:**
- [ ] Prescription API endpoint
- [ ] API key management
- [ ] Patient inbox UI
- [ ] OpenAPI/Swagger docs

**Exit Criteria:**
- ✅ API accepts prescription and delivers to patient
- ✅ Sample integration app (mocked EMR connector)
- ✅ OpenAPI documentation published

---

### **Gate 8: Testing & Performance** (Week 6, Days 43-46)

**Objective:** Comprehensive test coverage and benchmarking

| Task | Owner | Duration | Exit Criteria |
|------|-------|----------|---------------|
| Unit tests (One-Euro, thresholds, FPPA) | Backend Eng | 2 days | ≥90% coverage on error detection |
| Integration tests (template → inbox → exercise) | QA | 1 day | End-to-end flow works |
| Performance benchmarks | Mobile Eng | 1 day | ≥20 FPS, <500MB memory, <50ms latency |
| Regression tests (all existing tests pass) | QA | 1 day | No new console errors |

**Performance Targets:**
- Pose detection: ≥20 FPS (mobile)
- Memory usage: <500MB during session
- Filter latency: <50ms
- Video loading: <3 seconds (30-sec clip)

**Exit Criteria:**
- ✅ 90% unit coverage on error detection modules
- ✅ All performance benchmarks met
- ✅ Automated regression suite in CI/CD
- ✅ Smoke test: Complete full exercise session without crash

---

## Phase 3: Clinical Pilot Validation (Weeks 7-12)

### **Gate 9: Clinical Pilot Study** (Weeks 7-12, Days 49-84)

**Objective:** Small-scale validation with real PTs and patients

#### Study Design

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Sample Size** | 10-15 patients | Sufficient for feasibility study |
| **Condition** | Post-surgical knee or shoulder | Target population |
| **Duration** | 2-4 weeks per patient | Typical PT episode |
| **Setting** | 1-2 PT clinics | Controlled environment |
| **Comparator** | PT in-person assessment | Gold standard |
| **Design** | Single-arm feasibility | Pilot, not RCT |

#### Timeline Breakdown

| Week | Phase | Tasks | Deliverables |
|------|-------|-------|--------------|
| **7-8** | Setup & Recruitment | IRB submission (if needed), recruit clinics, train PTs | Protocol, consent forms, PT training materials |
| **8-9** | Enrollment | Enroll 10-15 patients, collect baseline | Patient profiles, baseline ROM/pain scores |
| **9-11** | Intervention | Patients use app 3×/week for 2-4 weeks | Session logs, error reports, PT feedback |
| **11-12** | Analysis | Data analysis, write report | Accuracy (κ), usability (SUS), adherence (%), safety report |

#### Measurements

##### 1. Clinical Accuracy (Primary Outcome)

| Metric | Method | Target | Measurement Tool |
|--------|--------|--------|------------------|
| **Inter-rater Agreement** | PT and app assess same video (blinded) | **κ ≥0.6** (substantial) | Cohen's kappa |
| **Sensitivity** | % of PT-flagged errors detected by app | ≥80% | Confusion matrix |
| **Specificity** | % of app-flagged errors confirmed by PT | ≥70% | Confusion matrix |

##### 2. Usability

| Metric | Method | Target | Measurement Tool |
|--------|--------|--------|------------------|
| **SUS Score** | 10-question survey (post-study) | **≥70** ("good") | System Usability Scale |
| **Task Success Rate** | % of patients who complete exercise without help | ≥90% | Observation |
| **Time to Complete Setup** | First-time setup (camera, template selection) | <5 minutes | Stopwatch |

##### 3. Adherence

| Metric | Method | Target | Measurement Tool |
|--------|--------|--------|------------------|
| **Session Completion** | % of prescribed sessions completed | **≥40%** (beat 35% baseline) | App logs |
| **Dropout Rate** | % of patients who stop using app | ≤30% | Enrollment vs completion |
| **PT Engagement** | # of times PT checks patient progress | ≥2×/week | Dashboard logs |

##### 4. Safety

| Metric | Method | Target | Measurement Tool |
|--------|--------|--------|------------------|
| **Adverse Events** | Patient self-report + PT review | **0 events** attributable to app | Incident form |
| **Pain Exacerbations** | Increased pain during/after app use | 0 incidents | VAS pain scale |
| **Red Flag Escalation** | Time from detection to PT notification | <1 hour | Alert logs |

#### Week-by-Week Plan

**Weeks 7-8: Setup & Recruitment**
- [ ] Submit IRB protocol (if needed - check with legal)
- [ ] Recruit 1-2 PT clinics (target: orthopedic surgery practices)
- [ ] Train PTs on app usage (2-hour session)
- [ ] Create patient consent forms
- [ ] Set up data collection infrastructure

**Weeks 8-9: Enrollment & Baseline**
- [ ] Enroll 10-15 patients (post-surgical knee or shoulder)
- [ ] Collect baseline: ROM, pain (VAS), function (DASH/KOOS)
- [ ] PT assigns 3-5 exercises per patient
- [ ] Configure primary joint focus per patient
- [ ] Patient onboarding session (15-20 min)

**Weeks 9-11: Intervention Period**
- [ ] Patients use app 3×/week for 2-4 weeks
- [ ] PT checks dashboard 2×/week
- [ ] Collect session logs (errors detected, feedback shown)
- [ ] Weekly patient survey (adherence, pain, usability)
- [ ] PT reviews sample videos (blinded comparison for κ)

**Weeks 11-12: Data Analysis**
- [ ] Calculate accuracy: Cohen's kappa (PT vs app)
- [ ] Calculate usability: SUS scores
- [ ] Calculate adherence: session completion %
- [ ] Safety audit: review all adverse events
- [ ] Qualitative: PT interviews (10-15 min each)
- [ ] Write pilot study report

#### Data Collection

| Data Type | Source | Frequency | Purpose |
|-----------|--------|-----------|---------|
| **Error detections** | App logs | Per session | Accuracy (κ) calculation |
| **PT assessments** | Video review | 2× per patient | Gold standard comparison |
| **Session completion** | App logs | Per session | Adherence metric |
| **SUS survey** | Patient survey | End of study | Usability metric |
| **Adverse events** | Patient self-report | Weekly | Safety monitoring |
| **PT feedback** | Interviews | End of study | Qualitative insights |

#### Exit Criteria (GO/PIVOT/STOP)

**✅ GO - Continue to Scale (All criteria met):**
- ✅ Accuracy: κ ≥0.6 (substantial agreement with PT)
- ✅ Usability: SUS ≥70 ("good" usability)
- ✅ Adherence: ≥40% session completion
- ✅ Safety: 0 adverse events attributable to app
- ✅ Qualitative: ≥80% of PTs would recommend to colleagues

**⚠️ PIVOT - Improve Before Scale (Gaps identified):**
- Accuracy 0.4-0.6: Fix detection thresholds, retrain on pilot data
- Usability 50-70: Simplify UI, add onboarding tutorials, voice guidance
- Adherence 25-40%: Add motivation features, PT nudges, gamification
- Minor safety issues: Add warnings, improve red flag detection

**❌ STOP - Fundamental Blocker:**
- Accuracy <0.4: Technology not viable, consider pivot to B2B API
- Usability <50: Too complex for target users, need fundamental redesign
- Adherence <25%: No better than standard care, not worth scaling
- Safety issues: Patients injured, unacceptable risk

---

## Measurement Framework

### Technical Metrics (Gates 1-8)

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Camera FPS** | ≥30 (mobile) | Performance profiler | Mobile Eng |
| **Preprocessing latency** | <50ms | Timestamp diff | Mobile Eng |
| **Model inference FPS** | ≥20 (mobile) | TFLite benchmark | Mobile Eng |
| **Filter latency** | <50ms | Timestamp diff | Backend Eng |
| **Joint angle jitter** | <3° stddev | Before/after smoothing | Clinical Science |
| **Memory usage** | <500MB | DevTools / Xcode Instruments | Mobile Eng |
| **Crash rate** | <1% | Error logging (Sentry) | DevOps |

### Clinical Metrics (Gate 9)

| Metric | Target | Method | Owner |
|--------|--------|--------|-------|
| **Accuracy (κ)** | ≥0.6 | PT vs app agreement | Clinical Science |
| **Usability (SUS)** | ≥70 | 10-question survey | Product |
| **Adherence** | ≥40% | Session completion % | Product |
| **Safety** | 0 events | Incident reporting | Clinical Science |

---

## Resource Allocation

### Team Composition

| Team | Weeks 1-4 (Foundation) | Weeks 5-6 (Features) | Weeks 7-12 (Pilot) |
|------|------------------------|----------------------|---------------------|
| **Mobile Engineering (2 FTE)** | 100% (G1-G3) | 25% (support) | 10% (bug fixes) |
| **Backend Engineering (2 FTE)** | 25% (API prep) | 100% (G4-G8) | 25% (bug fixes) |
| **Frontend Engineering (1 FTE)** | 25% (UI mockups) | 100% (G6 UI) | 25% (bug fixes) |
| **Clinical Science (1 FTE)** | 50% (threshold validation) | 75% (G4 review) | 100% (pilot execution) |
| **Product Manager (1 FTE)** | 50% (G4 UX design) | 75% (G6-G7 specs) | 100% (pilot coordination) |
| **QA/Test (1 FTE)** | 50% (G1-G3 testing) | 100% (G8 testing) | 50% (pilot support) |
| **DevOps (0.5 FTE)** | 25% (telemetry setup) | 50% (G3, G7 CI/CD) | 25% (monitoring) |

---

## Technology Stack

### Current (Pilot)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Platform** | React Native | Cross-platform (iOS/Android) |
| **Pose Model** | MoveNet Lightning (17-pt, TFLite) | Fast (30+ FPS), lightweight, already integrated |
| **Smoothing** | One-Euro filter | ACM CHI 2012, peer-reviewed |
| **Thresholds** | AAOS/IJSPT/JOSPT research | Clinical validation |
| **Temporal Alignment** | Duration-based speedRatio | Simple, works for most exercises |
| **Backend** | Node.js + Express | Existing stack |
| **Database** | PostgreSQL | Relational, supports analytics |

### Under Evaluation (Post-Pilot)

| Component | Technology | When to Migrate |
|-----------|-----------|-----------------|
| **Pose Model** | MediaPipe Pose (33-pt) | If MoveNet accuracy <80% |
| **Temporal Alignment** | Dynamic Time Warping (DTW) | If speedRatio fails on complex exercises |
| **Depth Estimation** | Multi-view fusion | If 2D insufficient (scapular winging) |

---

## Risk Management

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| **G1-G3 delays** | Medium | High | Start immediately, dedicate mobile team | Eng Manager |
| **Mobile camera API issues** | Medium | High | Test on 5 devices early (Week 1) | Mobile Eng |
| **MoveNet accuracy <80%** | Medium | High | Parallel test MediaPipe in G3 | Backend Eng |
| **Pilot recruitment fails** | Low | Critical | Start recruitment in Week 5 (parallel) | Clinical Lead |
| **PT clinics drop out** | Low | High | Over-recruit (3 clinics for 2 needed) | Clinical Lead |
| **Patient adherence <25%** | Medium | High | PT engagement training, motivation features | Product |
| **Safety incident** | Low | Critical | Red flag system, PT escalation <1 hour | Clinical Lead |
| **IRB approval delays** | Low | Medium | Submit early (Week 7), use non-PHI to avoid | Clinical Lead |

---

## Communication & Reporting

### Weekly Standups (All Phases)

**When:** Every Monday, 10:00 AM
**Duration:** 30 minutes
**Attendees:** All team leads
**Agenda:**
- Previous week: completed tasks, blockers
- Current week: priorities, resource needs
- Metrics review: technical + clinical
- Risk review: new risks, mitigation updates

### Gate Reviews (End of Each Gate)

**Format:** 1-hour presentation + Q&A
**Attendees:** Full team + stakeholders
**Content:**
- Exit criteria review (met/not met)
- Metrics dashboard
- Demo (if applicable)
- Blockers and decisions needed
- GO/NO-GO for next gate

### Pilot Study Updates (Weeks 7-12)

**Frequency:** Bi-weekly
**Format:** Email report + optional call
**Content:**
- Enrollment progress (target: 10-15 patients)
- Adherence metrics (session completion %)
- Early safety signals (adverse events)
- PT feedback (qualitative)
- Preliminary accuracy data (if enough data)

### Final Report (Week 12)

**Format:** Written report (10-15 pages) + presentation
**Sections:**
1. Executive Summary
2. Methods (study design, sample, measures)
3. Results (accuracy, usability, adherence, safety)
4. Discussion (strengths, limitations, implications)
5. Recommendation (GO/PIVOT/STOP with rationale)
6. Next Steps (if GO: scale plan; if PIVOT: remediation plan)

---

## Success Criteria Summary

### Technical Success (Gates 1-8)

- ✅ Camera captures at ≥30 FPS
- ✅ Preprocessing latency <50ms
- ✅ Pose detection ≥20 FPS on mobile
- ✅ Smoothing reduces jitter by ≥50%
- ✅ All thresholds research-backed
- ✅ 90% unit test coverage
- ✅ No critical bugs at pilot launch

### Clinical Success (Gate 9)

**Minimum (to avoid STOP):**
- ✅ Accuracy: κ ≥0.4
- ✅ Usability: SUS ≥50
- ✅ Adherence: ≥25%
- ✅ Safety: 0 serious adverse events

**Target (for GO):**
- ✅ Accuracy: κ ≥0.6
- ✅ Usability: SUS ≥70
- ✅ Adherence: ≥40%
- ✅ Safety: 0 adverse events
- ✅ PT endorsement: ≥80%

**Stretch (exceptional):**
- ✅ Accuracy: κ ≥0.8 (near-perfect agreement)
- ✅ Usability: SUS ≥85 (excellent)
- ✅ Adherence: ≥70% (with PT engagement)
- ✅ PT endorsement: 100%

---

## Post-Pilot Paths (Week 13+)

### ✅ GO - Scale to Multi-Clinic Deployment

**Immediate Actions (Weeks 13-14):**
- [ ] Secure funding for scale (if needed)
- [ ] Recruit 10-20 additional PT clinics
- [ ] Hire 2-3 additional engineers
- [ ] Plan UX hardening (G4: real-time guidance, offline mode)
- [ ] Plan compliance (G5: HIPAA if collecting PHI)

**Scale Pilot (Weeks 15-26):**
- [ ] Enroll 200-500 patients across 10-20 clinics
- [ ] Measure same metrics (κ, SUS, adherence, safety)
- [ ] Prepare for publication (JMIR, JOSPT)
- [ ] Develop PT training program
- [ ] Build business model (SaaS subscription)

---

### ⚠️ PIVOT - Address Gaps Before Scale

**If Accuracy Gap (κ 0.4-0.6):**
- [ ] Analyze false positives/negatives
- [ ] Retrain thresholds on pilot data
- [ ] Consider MediaPipe migration (33-pt model)
- [ ] Add manual PT override mechanism
- [ ] Retest with 5-10 additional patients

**If Usability Gap (SUS 50-70):**
- [ ] Conduct user interviews (identify pain points)
- [ ] Simplify onboarding (reduce to <3 steps)
- [ ] Add voice guidance ("Lift arm higher")
- [ ] Add video tutorials (1-2 min)
- [ ] Retest with 5-10 new users

**If Adherence Gap (25-40%):**
- [ ] Add motivation features (streaks, badges)
- [ ] Improve PT dashboard (1-click patient check-in)
- [ ] Add push notifications (smart reminders)
- [ ] Test different session frequencies (2×/week vs 3×/week)
- [ ] Retest with 10-15 patients for 4 weeks

---

### ❌ STOP - Pivot Product Strategy

**If Accuracy <0.4:**
- Technology not viable for autonomous feedback
- **Pivot Option 1:** B2B API to existing PT platforms (no autonomous feedback)
- **Pivot Option 2:** Research tool licensing (universities, clinics)
- **Pivot Option 3:** Manual review mode (app records, PT reviews later)

**If Usability <50:**
- Too complex for target users (post-surgical patients)
- **Pivot Option 1:** PT-only dashboard (remove patient-facing app)
- **Pivot Option 2:** In-clinic use only (supervised sessions)
- **Pivot Option 3:** Simplify to single exercise (e.g., shoulder abduction only)

**If Adherence <25%:**
- No better than standard care (35% baseline)
- **Pivot Option 1:** Add human coaching (hybrid model)
- **Pivot Option 2:** Target different population (athletes, not post-surgical)
- **Pivot Option 3:** Focus on PT efficiency (reduce in-person visits)

---

## Key Milestones

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| **4** | Mobile foundation complete | Camera + preprocessing + model working on 5 devices |
| **6** | Clinical features complete | Smoothing + thresholds + UI + API ready |
| **7** | Pilot launch | First patient enrolled |
| **9** | Mid-pilot checkpoint | 50% of patients enrolled, early metrics |
| **12** | **DECISION POINT** | GO/PIVOT/STOP based on pilot results |
| **13** | Post-pilot plan | Scale roadmap OR pivot plan OR shutdown plan |

---

## Appendix: Research Citations

### Pose Estimation Validation
1. **JMIR 2024:** MediaPipe upper limb tracking, RMSE 0.28±0.06 px
2. **PMC 2023:** Markerless gait analysis, 95-99% accuracy vs Vicon
3. **Nature SR 2025:** Monocular pose estimation assessment (Physio2.2M dataset)

### Clinical Thresholds
4. **AAOS OrthoInfo 2023:** Shoulder surgery exercise guidelines
5. **IJSPT 2024:** FPPA as 2D valgus proxy (8-10° threshold)
6. **JOSPT 2025:** Rotator cuff PT protocols

### Patient Adherence
7. **PLOS Digital Health 2024:** mHealth app barriers (>65% non-adherence)
8. **PMC 2025:** OA study - apps don't auto-improve adherence
9. **JMIR 2024:** PT engagement = #1 predictor of adherence

### Smoothing Algorithms
10. **ACM CHI 2012:** One-Euro filter (Casiez et al.)
11. **SIGGRAPH 2024:** One-Euro benchmark studies

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 8, 2025 | Engineering + Clinical + Product | Initial master roadmap (merged G1-G5 + Gates 7-12) |

---

**This is the SINGLE SOURCE OF TRUTH for PhysioAssist development.**
**All other roadmap documents are deprecated.**

**Next Action:** Gate 1 kickoff (Week 1, Day 1) - Mobile camera module development.

---

**Questions or updates?** Contact:
- **Engineering:** [Lead Engineer]
- **Clinical:** [Clinical Science Lead]
- **Product:** [Product Manager]
