# Roadmap Integration Analysis: G1-G5 vs Gates 7-12

**Date:** November 8, 2025
**Status:** DECISION REQUIRED
**Owner:** Engineering + Product

---

## Executive Summary

**Two roadmaps exist with different scopes:**

| Roadmap | Focus | Duration | Stage |
|---------|-------|----------|-------|
| **G1-G5** | Mobile foundation, image quality, infrastructure | 6-8 weeks | Pre-production |
| **Gates 7-12** | Clinical error detection, pilot validation | 10 weeks | Production |

**Recommendation:** **MERGE** - G1-G3 are prerequisites for Gates 7-12. Execute sequentially with overlaps.

---

## Roadmap Comparison

### G1-G5: Foundation-First Approach

| Gate | Objective | Duration | Key Deliverables |
|------|-----------|----------|------------------|
| **G1** | Camera capture & QA | 1.5 weeks | Camera module, quality heuristics, metadata |
| **G2** | Preprocessing pipeline | 1.5 weeks | Resize, color stabilization, noise suppression |
| **G3** | Model integration | 2 weeks | TFLite/Core ML, confidence scoring, telemetry |
| **G4** | UX hardening | 1.5 weeks | Real-time guidance, offline mode, accessibility |
| **G5** | Compliance & ops | 1.5 weeks | HIPAA/GDPR, CI/CD, monitoring, model versioning |

**Total:** 8 weeks

### Gates 7-12: Clinical-First Approach

| Gate | Objective | Duration | Key Deliverables |
|------|-----------|----------|------------------|
| **Gate 7** | Core safety & stability | 1 week | Smoothing, clinical thresholds, lighting |
| **Gate 8** | Authentication | 2 days | Nickname login, profiles |
| **Gate 9** | Template UI | 3 days | YouTube input, primary joint selector |
| **Gate 10** | Prescription API | 2 days | REST endpoint, PT integration |
| **Gate 11** | Testing & performance | 4 days | Unit tests, benchmarks, regression |
| **Gate 12** | Clinical pilot | 6 weeks | 10-15 patients, accuracy validation (κ≥0.6) |

**Total:** 10 weeks

---

## Dependency Analysis

### Critical Dependencies

```
G1 (Camera Capture) ──┐
                      ├──> G2 (Preprocessing) ──> G3 (Model Integration) ──> Gate 7 (Smoothing)
React Native App ─────┘                                                           │
                                                                                  ▼
                                                                          Gates 8-11 (Features)
                                                                                  │
                                                                                  ▼
                                                                          Gate 12 (Pilot)
                                                                                  │
                              G4 (UX) ◄──────────────────────────────────────────┤
                              G5 (Compliance) ◄──────────────────────────────────┘
```

### Overlap Matrix

| G1-G5 Component | Gates 7-12 Dependency | Blocker? |
|-----------------|----------------------|----------|
| **G1: Camera module** | Gate 7 (pose detection) | ✅ YES - Need camera to capture poses |
| **G2: Preprocessing** | Gate 7 (lighting QA) | ✅ YES - Lighting analysis needs preprocessed frames |
| **G3: Model integration** | Gate 7 (smoothing) | ✅ YES - Can't smooth poses without model output |
| **G4: UX guidance** | Gates 8-11 (template UI) | ⚠️ PARTIAL - Can build basic UI without real-time guidance |
| **G5: Compliance** | Gate 12 (pilot) | ❌ NO - Pilot uses non-PHI (nicknames only) |

**Conclusion:** **G1-G3 are BLOCKERS for Gate 7.** Must complete first.

---

## Integration Conflicts

### Conflict 1: Technology Stack

| Component | G1-G5 Assumption | Gates 7-12 Assumption | Resolution |
|-----------|------------------|----------------------|------------|
| **Platform** | React Native (mobile-first) | Web-first (YouTube, webcam) | ✅ ALIGNED - React Native supports both |
| **Model** | TFLite/Core ML (mobile) | MoveNet (web, TensorFlow.js) | ⚠️ CONFLICT - Need decision |
| **Camera** | Native camera module | WebRTC/navigator.mediaDevices | ⚠️ CONFLICT - Need abstraction layer |

**Action:** Create camera abstraction layer to support both web and mobile.

---

### Conflict 2: Pose Model Selection

**G1-G5 implies mobile-first:**
- TFLite (Android) / Core ML (iOS)
- Optimized for on-device inference
- Likely MediaPipe Pose (33-point)

**Gates 7-12 assumes web-first:**
- MoveNet Lightning (17-point)
- TensorFlow.js in browser
- Already integrated in codebase

**Decision Required:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A: Web-first (MoveNet)** | Already integrated, faster pilot | Limited to desktop, no mobile | ⚠️ Short-term only |
| **B: Mobile-first (MediaPipe)** | Better for scale, 33-point accuracy | Need full rewrite, delays pilot | ✅ Long-term target |
| **C: Hybrid (both)** | Flexibility, cross-platform | Maintain 2 codebases | ❌ Too complex |

**Recommended:** **Start with A (web), migrate to B (mobile) post-pilot** - aligns with hybrid approach in architecture analysis.

---

## Recommended Integrated Roadmap

### Phase 1: Mobile Foundation (Weeks 1-4)

Execute G1-G3 to establish mobile infrastructure:

| Week | Gate | Focus | Exit Criteria |
|------|------|-------|---------------|
| **1-1.5** | **G1** | Camera capture & QA | Camera module working, quality heuristics tested across 5 devices |
| **2-2.5** | **G2** | Preprocessing pipeline | Resize, color stabilization, noise suppression verified |
| **3-4** | **G3** | Model integration | MoveNet integrated on mobile (TFLite), confidence >0.5 on 90% of frames |

**Owner:** Mobile Engineering
**Parallel Work:** Clinical team can finalize thresholds, prepare pilot protocol

---

### Phase 2: Clinical Features (Weeks 4-6)

Execute Gates 7-11 using mobile infrastructure from G1-G3:

| Week | Gate | Focus | Exit Criteria |
|------|------|-------|---------------|
| **4** | **Gate 7** | Smoothing + thresholds | Jitter <3°, latency <50ms, lighting QA passes |
| **5** | **Gate 8-9** | Auth + Template UI | Nickname login, YouTube templates, primary joint selector |
| **5-6** | **Gate 10-11** | API + Testing | Prescription API working, 90% unit coverage, benchmarks met |

**Owner:** Full-Stack Engineering
**Parallel Work:** Begin pilot recruitment (Week 5)

---

### Phase 3: Pilot Validation (Weeks 7-12)

Execute Gate 12 with optional G4-G5 hardening:

| Week | Gate | Focus | Exit Criteria |
|------|------|-------|---------------|
| **7-8** | **G4** | UX hardening (optional) | Real-time guidance, offline mode, accessibility |
| **7-12** | **Gate 12** | Clinical pilot | κ≥0.6, SUS≥70, adherence≥40%, 0 adverse events |
| **13** | **G5** | Compliance (if needed) | HIPAA/GDPR if pilot collects PHI |

**Owner:** Clinical + Product
**Decision Point (Week 12):** GO / PIVOT / STOP

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| **G1-G3 delays block Gate 7** | HIGH - Pilot timeline slips | Start G1 immediately, dedicate mobile team |
| **Web vs mobile conflict** | MEDIUM - Rework needed | Build camera abstraction early (Week 1) |
| **Model accuracy <80% on mobile** | HIGH - May need MediaPipe migration | Parallel test MediaPipe during G3 |
| **Pilot recruitment delays** | MEDIUM - Gate 12 extends | Start recruitment in Week 5 (parallel with dev) |
| **G5 compliance premature** | LOW - Wasted effort | Defer G5 until pilot succeeds (post-Week 12) |

---

## Resource Allocation

### Team Structure

| Team | G1-G3 (Weeks 1-4) | Gates 7-11 (Weeks 4-6) | Gate 12 (Weeks 7-12) |
|------|-------------------|------------------------|----------------------|
| **Mobile Engineering** | 100% (G1-G3) | 25% (support) | 0% |
| **Web Engineering** | 0% | 100% (Gates 7-11) | 25% (bug fixes) |
| **Clinical Science** | 25% (threshold validation) | 50% (Gate 7 review) | 100% (pilot) |
| **Product** | 50% (design G4 UX) | 50% (Gate 9 UI) | 100% (pilot coordination) |
| **DevOps** | 0% | 25% (Gate 11 CI/CD) | 50% (G5 if needed) |

---

## Decision Matrix

### Should We Adopt G1-G5?

**Answer: YES, with modifications**

| Question | Answer | Rationale |
|----------|--------|-----------|
| **Are G1-G3 necessary?** | ✅ YES | Mobile camera capture is prerequisite for pose detection |
| **Should G1-G3 block Gate 7?** | ✅ YES | Can't detect poses without camera input |
| **Should we do G4 (UX) now?** | ⚠️ OPTIONAL | Real-time guidance is nice-to-have, not blocker |
| **Should we do G5 (compliance) now?** | ❌ NO | Pilot uses non-PHI, defer until scale |
| **Should we replace Gates 7-12?** | ❌ NO | Clinical features are core value, keep them |

**Final Recommendation:**

```
┌────────────────────────────────────────────────────────┐
│           INTEGRATED ROADMAP (12 Weeks)                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Weeks 1-4:  G1-G3 (Mobile Foundation)                │
│              ↓                                         │
│  Weeks 4-6:  Gates 7-11 (Clinical Features)           │
│              ↓                                         │
│  Weeks 7-12: Gate 12 (Pilot Validation)               │
│              ↓                                         │
│  Week 12:    GO/PIVOT/STOP Decision                   │
│              ↓                                         │
│  Post-Pilot: G4-G5 (UX + Compliance for scale)        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Measurement Framework

### Technical Metrics (G1-G3)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Camera FPS | ≥30 (mobile) | Performance profiler |
| Preprocessing latency | <50ms | Timestamp diff |
| Model inference | ≥20 FPS (mobile) | TFLite benchmark |
| Confidence score | >0.5 on 90% frames | Telemetry |

### Clinical Metrics (Gates 7-12)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pose jitter | <3° stddev | Before/after smoothing |
| Lighting QA | Pass in 5 conditions | Manual testing |
| Accuracy (κ) | ≥0.6 | PT vs app agreement |
| Usability (SUS) | ≥70 | 10-question survey |
| Adherence | ≥40% | Session completion % |

---

## Action Items (Priority Order)

### Immediate (Week 1)

- [ ] **DECISION:** Approve integrated roadmap (G1-G3 → Gates 7-12)
- [ ] **DECISION:** Confirm mobile-first approach (React Native)
- [ ] **START:** G1 - Camera module development
- [ ] **DESIGN:** Camera abstraction layer (web + mobile)
- [ ] **RECRUIT:** Assign mobile engineering team

### Short-term (Weeks 2-4)

- [ ] Complete G1 (camera capture)
- [ ] Complete G2 (preprocessing)
- [ ] Complete G3 (model integration - MoveNet on mobile)
- [ ] Finalize clinical thresholds for MoveNet
- [ ] Prepare pilot study protocol

### Medium-term (Weeks 5-6)

- [ ] Complete Gate 7 (smoothing + thresholds)
- [ ] Complete Gates 8-11 (auth, UI, API, testing)
- [ ] Begin pilot recruitment (1-2 PT clinics)
- [ ] Parallel test: MediaPipe vs MoveNet accuracy

### Long-term (Weeks 7-12)

- [ ] Execute Gate 12 pilot study
- [ ] Collect accuracy, usability, adherence data
- [ ] Week 12: GO/PIVOT/STOP decision
- [ ] If GO: Plan G4-G5 for scale
- [ ] If PIVOT: Address gaps (accuracy/adherence)

---

## Outstanding Questions

| Question | Owner | Deadline |
|----------|-------|----------|
| **1. Mobile-first confirmed?** | Product Lead | Week 1 |
| **2. Budget for mobile team?** | Engineering Manager | Week 1 |
| **3. Which PT clinics for pilot?** | Clinical Lead | Week 5 |
| **4. MediaPipe migration timeline?** | Engineering | Post-pilot |
| **5. G5 compliance scope?** | Legal/Product | Post-pilot (if GO) |

---

## Comparison with Colleague's Format

**What makes G1-G5 roadmap better:**

✅ **Concise** - 5 gates vs our 12
✅ **Foundation-first** - Addresses infrastructure gaps
✅ **Clear ownership** - Mobile team focus
✅ **Risk management** - Quality gates before features
✅ **Table-based** - Easy to scan

**What makes Gates 7-12 roadmap better:**

✅ **Clinical validation** - Pilot study with real PTs
✅ **Research-backed** - Thresholds from AAOS/IJSPT
✅ **Measurement framework** - κ, SUS, adherence
✅ **Decision criteria** - GO/PIVOT/STOP
✅ **Technical depth** - Integration details

**Best of both:**
- G1-G5 format (tables, concise)
- Gates 7-12 content (clinical rigor, measurements)
- Integrated timeline (12 weeks to pilot)

---

## Appendix: Key Changes from Original Roadmaps

### From G1-G5 Roadmap

**Adopted:**
- G1-G3 as prerequisites
- Mobile-first infrastructure
- Quality heuristics and preprocessing
- TFLite/Core ML model integration

**Deferred:**
- G4 (UX hardening) to post-pilot
- G5 (compliance) to post-pilot if GO decision
- HIPAA/GDPR scope (pilot uses non-PHI)

### From Gates 7-12 Roadmap

**Kept:**
- All clinical features (Gates 7-11)
- Pilot study design (Gate 12)
- Measurement framework (κ, SUS, adherence)
- GO/PIVOT/STOP decision criteria
- Hybrid approach (MoveNet → MediaPipe)

**Modified:**
- Timeline: Prepend G1-G3 (adds 4 weeks)
- Total duration: 12 weeks instead of 10
- Platform: Mobile-first (was web-first)
- Model: MoveNet on mobile (TFLite) instead of web (TF.js)

---

## Summary

**Recommendation:** **MERGE roadmaps into 12-week integrated plan**

**Key Decisions:**
1. ✅ Execute G1-G3 first (mobile foundation, Weeks 1-4)
2. ✅ Then Gates 7-11 (clinical features, Weeks 4-6)
3. ✅ Then Gate 12 (pilot validation, Weeks 7-12)
4. ⚠️ Defer G4-G5 (UX + compliance) to post-pilot
5. ✅ Use G1-G5 format (tables) for stakeholder docs
6. ✅ Use Gates 7-12 depth for technical implementation

**Critical Path:**
```
G1 (camera) → G2 (preprocessing) → G3 (model) → Gate 7 (smoothing) → Gates 8-11 (features) → Gate 12 (pilot)
```

**Next Step:** Review with team, approve integrated roadmap, start G1 (Week 1).

---

**Document Owner:** Engineering + Product
**Last Updated:** November 8, 2025
**Status:** PENDING APPROVAL
