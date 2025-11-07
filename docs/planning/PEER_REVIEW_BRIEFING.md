# 🔍 Peer Review Briefing: YouTube Comparison Feature

**Purpose:** Get technical feedback on our gated implementation plan for the YouTube video comparison feature

**Requested Review Time:** 45-60 minutes

**Documents to Review:**
1. This briefing (start here)
2. `GATED_IMPLEMENTATION_PLAN.md` (main plan)
3. `VIDEO_COMPARISON_IMPLEMENTATION_PLAN.md` (detailed research & architecture)

---

## 📱 Background: What is PhysioAssist?

### **App Overview**
PhysioAssist is a **React Native iOS app** that helps physical therapy patients perform exercises correctly at home using AI-powered pose estimation.

**Core Technology Stack:**
- React Native 0.73.2
- iOS 13+ (target devices: iPhone XS and newer)
- **MoveNet Lightning INT8** (TensorFlow Lite) - 17 keypoints, real-time pose detection
- React Native Vision Camera for camera access
- Skia for frame processing and pose overlay rendering

**Current App Status:**
- ✅ **100% production ready** (passed 5 gates, all tests passing)
- ✅ Real-time pose detection working (20-30 FPS on device)
- ✅ Exercise tracking, rep counting, form feedback
- ✅ iOS testing infrastructure with Xcode integration
- ✅ Claude Code CLI bridge system for development

**What Works Today:**
1. Patient records themselves doing exercises
2. App detects pose in real-time using phone camera
3. App counts reps and provides basic form feedback
4. No comparison to reference videos (this is what we're adding)

---

## 🎯 Feature Goal: YouTube Video Comparison

### **Clinical Problem We're Solving**

**The Pain Point:**
- Patients receive exercise videos from therapists (usually YouTube links)
- Patients attempt exercises at home without knowing if form is correct
- Incorrect form → injury risk, ineffective therapy, poor outcomes
- Therapists can't monitor patients between appointments

**The Solution:**
Enable patients to compare their exercise form to professional YouTube demonstration videos with:
1. **Automated pose analysis** - detect common errors without manual review
2. **Research-based error detection** - focus on clinically significant mistakes
3. **Non-overwhelming feedback** - show top 2-3 errors only, prioritized by injury risk
4. **Multi-modal feedback** - visual, audio, haptic during exercise

---

## 🏗️ Technical Architecture: Two Modes

### **Mode 1: Async (Pre-Recorded Comparison)**
**Flow:**
1. Patient pastes YouTube URL
2. App downloads video and extracts pose data
3. Patient records themselves doing the exercise
4. App analyzes offline (can use high-accuracy model)
5. Patient reviews side-by-side comparison with errors highlighted

**Use Case:** "I want to record my exercise and see a detailed report of what I'm doing wrong"

---

### **Mode 2: Live (Real-Time Split-Screen)**
**Flow:**
1. Patient pastes YouTube URL
2. App shows split-screen: YouTube video (left) + Live camera (right)
3. Patient follows along in real-time
4. App provides immediate audio/visual/haptic feedback during exercise
5. Session auto-records for later review
6. Post-session report shows top errors

**Use Case:** "I want to follow along with the video and get coaching in real-time"

---

## 🚧 Technical Challenges We've Identified

### **Challenge 1: iOS Camera & Performance Constraints**

**The Problem:**
- Need real-time pose estimation (≥20 FPS for smooth experience)
- iPhones throttle under sustained ML workload (thermal limits)
- Battery drain is a concern for 10-20 minute sessions

**Our Research Findings:**
- MoveNet Lightning: 20-30 FPS (acceptable)
- MoveNet Thunder: 10-15 FPS (too slow for real-time, OK for offline)
- Apple Vision: 5-15 FPS (too slow)
- MediaPipe: 15-25 FPS, 33 keypoints (better data, but more complex integration)

**Our Approach:**
- **Mode 1 (Async):** Use MoveNet Thunder for high accuracy (speed doesn't matter)
- **Mode 2 (Live):** Use MoveNet Lightning for speed
- Throttle pose detection to every 500ms in live mode (reduce CPU load)
- Target <10% battery per 10-minute session

**Question for You:**
- Is model-switching architecture sound, or will it cause issues?
- Any suggestions for optimizing battery/thermal performance?

---

### **Challenge 2: Selfie Camera Angle Limitations**

**The Problem:**
- Patient uses phone camera (selfie or propped up)
- Some exercises require **side view** for accurate assessment (e.g., elbow flexion)
- Other exercises require **frontal view** (e.g., knee valgus detection)
- Pose estimation accuracy degrades at extreme angles (±45° from optimal)

**Research Finding:**
> "Landmark predictions at extreme viewing angles (around 45° and 135°) have the lowest performances due to projective distortions"

**Our Approach:**
- Detect YouTube video camera angle automatically
- Prompt patient to position camera at matching angle
- For exercises requiring multiple angles → record twice, merge pose data
- Show AR-style positioning guide to help patient frame correctly

**Question for You:**
- Is multi-angle recording too complex for patients?
- Should we restrict to frontal-only exercises in MVP?
- Better approach to angle detection?

---

### **Challenge 3: Video Synchronization**

**The Problem:**
- Patient's video and YouTube video have different:
  - Durations (patient might be slower/faster)
  - Start times (patient may start mid-movement)
  - Frame rates
- Need to align videos to compare corresponding poses

**Our Approach:**
- Use **Dynamic Time Warping (DTW)** algorithm to find optimal alignment
- Match based on pose similarity (not just time)
- Calculate "speed ratio" (how much faster/slower patient is vs. reference)

**Question for You:**
- Is DTW the right algorithm, or is there a simpler approach?
- How do we handle patient pausing mid-exercise?
- Should we allow patients to manually adjust sync offset?

---

### **Challenge 4: Storage Management**

**The Problem:**
- Each session generates ~70-110 MB:
  - YouTube video (720p): 15-25 MB
  - Patient video (1080p): 50-80 MB
  - Pose data (JSON): 0.5-1 MB
  - Report: 1-2 MB
- 64GB iPhone fills up after ~500-700 sessions

**Our Approach:**
- Delete YouTube videos after 24 hours (can re-download)
- Delete patient videos after 30 days (keep pose data + reports)
- LRU eviction when storage exceeds 5GB
- Keep "favorites" and "shared with therapist" indefinitely
- Patient can manually delete old sessions

**Question for You:**
- Is 5GB limit reasonable, or too aggressive/permissive?
- Should we compress patient videos (lower quality)?
- Alternative storage strategies?

---

### **Challenge 5: Error Detection Accuracy**

**The Problem:**
- Need to detect **clinically significant errors** (not just any deviation)
- Must avoid **false positives** (saying something is wrong when it's not)
- Must avoid **overwhelming patients** (showing 10+ errors at once)

**Research-Based Common Errors We're Detecting:**

**Shoulder Exercises:**
1. Shoulder hiking (shrugging) - **HIGH injury risk** (impingement)
2. Trunk leaning (compensating with body lean)
3. Internal rotation (thumb down position) - **HIGH injury risk**
4. Incomplete ROM (not reaching target angle)

**Knee Exercises:**
1. Knee valgus (knees caving inward) - **CRITICAL injury risk** (ACL tear)
2. Heel lift (weight shifting to toes)
3. Posterior pelvic tilt ("butt wink")
4. Insufficient depth (not squatting deep enough)

**Elbow Exercises:**
1. Shoulder compensation (swinging upper arm)
2. Incomplete extension (not straightening arm)
3. Wrist deviation (wrist bending)

**Our Approach:**
- Detect all errors, then **prioritize by**:
  - Injury risk (critical > high > medium > low)
  - Severity (how far off from reference)
  - Frequency (errors in 80%+ of reps)
  - Cascading effect (fixing this fixes other errors)
- **Show only top 2-3 errors** to patient
- Adapt feedback to patient level (beginner = simpler language)

**Accuracy Targets:**
- Error detection accuracy: ≥85%
- False positive rate: <15%

**Question for You:**
- Is 85% accuracy achievable with 17-keypoint pose data?
- Should we upgrade to MediaPipe (33 keypoints) for better accuracy?
- How do we validate error detection (need physical therapist ground truth)?
- Is prioritization algorithm sound?

---

### **Challenge 6: Real-Time Feedback (Mode 2)**

**The Problem:**
- Need to analyze pose, detect errors, and provide feedback **during exercise**
- Audio feedback must be timely but not annoying
- Visual feedback must be clear but not obstructive
- Haptic feedback must be meaningful

**Our Approach:**
- Analyze pose every **500ms** (not every frame → reduce CPU)
- Show only **single top error** in real-time (not all errors)
- Audio feedback with **3-second cooldown** (prevent spam)
- Visual: Highlight problem joint with red circle, show angle deviation
- Haptic: Light vibration on warning, strong on critical error

**Question for You:**
- Is 500ms analysis interval good, or too slow/fast?
- Will audio feedback be annoying during exercise?
- Better UX patterns for real-time coaching?

---

## 📊 Current Implementation Status

### **What Exists Today:**

**✅ Working:**
- YouTube service (download, cache, metadata extraction)
- Comparison analysis service (basic angle comparison)
- Audio feedback service (TTS, sound effects, haptics)
- Type definitions for all data structures
- Feature documentation

**⚠️ Limitations:**
- Only compares **average angles** (not detailed error patterns)
- Only has logic for 2 exercises (squat, bicep curl)
- No research-based error detection
- No smart feedback prioritization
- No real-time mode (only async concept exists)
- No multi-angle support
- No patient history/progress tracking

**Code Locations:**
- `src/features/videoComparison/services/youtubeService.ts`
- `src/features/videoComparison/services/comparisonAnalysisService.ts`
- `src/features/videoComparison/types/videoComparison.types.ts`
- `src/services/audioFeedbackService.ts`
- `src/features/VIDEO_COMPARISON_FEATURE.md`

---

## 🚦 The Gated Implementation Plan

We've created a **6-gate plan** with strict Definition of Done criteria for each gate.

### **Gate Structure:**
Each gate has:
- **Tasks:** 20-40 specific tasks
- **Definition of Done:**
  - Functional criteria (features work)
  - Testing criteria (unit: 85-90% coverage, integration, UAT, performance)
  - Code quality criteria
  - Clinical validation criteria (PT sign-off)
  - Documentation criteria
- **Sign-offs:** Developer, QA, PT/Clinical Advisor (where applicable)
- **Binary pass/fail:** Cannot proceed to next gate until ALL criteria met

### **The 6 Gates:**

**Gate 0: Project Setup & Validation** (Foundation)
- Verify environment ready (Xcode, React Native, dependencies)
- Benchmark pose models (Lightning vs Thunder)
- Test YouTube integration
- Test video storage
- **DoD:** All systems functional, performance baseline documented

**Gate 1: Core Infrastructure** (Build Services)
- Database schema (sessions, errors, cache)
- Video storage manager (save, load, cleanup, LRU eviction)
- Enhanced YouTube service (quality selection, caching)
- Video processing service (frame extraction, sync)
- Pose model manager (Lightning/Thunder switcher)
- Session manager
- **DoD:** 90% test coverage, all services integrated

**Gate 2: Mode 1 - Async Comparison** (First User-Facing Feature)
- Recording screen with positioning guide
- Offline analysis pipeline (DTW sync, angle comparison)
- Side-by-side review screen (synced playback, error timeline)
- Feedback panel (top 3 errors)
- PDF report generation
- Session history
- **DoD:** 5 test users complete flow, 85% test coverage, PT validation

**Gate 3: Intelligent Error Detection** (Critical Clinical Value)
- Implement 11 research-based error patterns:
  - 4 shoulder errors
  - 4 knee errors
  - 3 elbow errors
- Smart feedback prioritization (injury risk → severity → frequency)
- Exercise-specific error database
- Beginner/intermediate/advanced feedback levels
- **DoD:** ≥85% accuracy on 60 test videos, <15% false positives, PT sign-off

**Gate 4: Mode 2 - Live Split-Screen** (Real-Time Coaching)
- Split-screen layout (YouTube + live camera)
- Real-time pose detection (MoveNet Lightning)
- Real-time error detection (500ms interval)
- Multi-modal feedback (audio, visual, haptic)
- Auto-recording
- Post-session report
- **DoD:** ≥20 FPS on iPhone XS, <10% battery/10min, 5 users test successfully

**Gate 5: Multi-Angle Support** (Handle Complex Exercises)
- YouTube angle detection (frontal vs side)
- Patient positioning guide
- Multi-angle recording flow
- Pose data merging from multiple angles
- Distance/framing validation
- **DoD:** ≥90% angle detection accuracy, users understand multi-angle flow

**Gate 6: Production Polish** (Ship-Ready)
- Patient history & progress charts
- Therapist dashboard
- Exercise library (50+ curated videos)
- Settings & customization
- Onboarding tutorial
- Error handling & edge cases
- Accessibility features
- Clinical safety features (pain indicator, fatigue detection)
- Final testing (regression, cross-device, accessibility, security)
- **DoD:** 20+ beta users, SUS score ≥75, PT/clinical advisor sign-off

---

## 🤔 Key Questions for Your Review

### **Architecture & Design:**
1. Is the two-mode approach (Async + Live) sound, or should we focus on one?
2. Is model-switching (Lightning/Thunder) a good architecture, or will it cause issues?
3. Is DTW the right algorithm for video sync, or overkill?
4. Should we use MediaPipe (33 keypoints) instead of MoveNet (17 keypoints)?

### **Technical Feasibility:**
5. Are our performance targets realistic (20 FPS, <10% battery, <2s launch)?
6. Is 85% error detection accuracy achievable with pose data alone?
7. Is multi-angle recording too complex for MVP (should we defer to later)?
8. Is our storage strategy sound (5GB limit, 30-day retention)?

### **User Experience:**
9. Will real-time audio feedback be annoying or helpful?
10. Is 500ms error detection interval good for live mode?
11. Is showing "top 3 errors only" the right balance (not overwhelming)?
12. Should we allow manual sync offset adjustment, or trust DTW?

### **Clinical Validation:**
13. How do we validate error detection without large labeled dataset?
14. Is PT sign-off sufficient, or do we need IRB approval / clinical trials?
15. Should we add more safety guardrails (pain tracking, session limits)?

### **Scope & Prioritization:**
16. Is the 6-gate plan appropriately scoped for MVP?
17. Should therapist dashboard be Gate 6 or deferred to post-launch?
18. Which exercise type should we prioritize (shoulder/knee/elbow)?
19. Can we ship after Gate 3 or 4 (before live mode)?

### **Testing & Quality:**
20. Are our test coverage targets realistic (85-90%)?
21. How do we test error detection (need ground truth videos)?
22. Is our DoD criteria too strict or too lenient?
23. Do we need performance testing on older devices (iPhone XS)?

### **Risks & Unknowns:**
24. What are the biggest technical risks you see?
25. What are we not thinking about (blind spots)?
26. What would you change about this plan?
27. What would you prototype first to reduce risk?

---

## 📚 Reference Documents

### **To Review:**
1. **GATED_IMPLEMENTATION_PLAN.md** - Detailed gate breakdown with DoD
2. **VIDEO_COMPARISON_IMPLEMENTATION_PLAN.md** - Research findings, architecture details
3. **Current codebase:**
   - `src/features/videoComparison/` - Existing comparison code
   - `src/services/audioFeedbackService.ts` - Feedback system

### **Context Documents (Optional):**
- `TEST_RESULTS.md` - Current app test results (36/36 passing)
- `MAC_QUICK_START.md` - iOS development setup
- `CLAUDE_CODE_CLI_BRIDGE.md` - Development tooling

---

## 🎯 Deliverable We're Looking For

**Ideal Feedback Format:**

### **1. First Impressions (5 min)**
- Overall reaction to the plan
- Biggest concerns or red flags

### **2. Architecture Review (15 min)**
- Thoughts on two-mode approach
- Model-switching architecture
- Video sync strategy
- Storage management

### **3. Technical Feasibility (15 min)**
- Performance targets realistic?
- Error detection accuracy achievable?
- Multi-angle support feasible?
- Testing strategy sound?

### **4. Risks & Alternatives (10 min)**
- What are the biggest risks?
- What should we prototype first?
- What would you do differently?

### **5. Gate Review (10 min)**
- Is gate structure sound?
- Are DoD criteria appropriate?
- Should we reorder or combine gates?
- What's missing?

### **6. Recommendations (5 min)**
- Top 3 things to change before starting
- Top 3 things to de-risk with prototypes
- MVP scope suggestions (ship after which gate?)

---

## 💡 How to Provide Feedback

**Options:**
1. **Written review:** Comment directly in this document or create a new `PEER_REVIEW_FEEDBACK.md`
2. **Video call:** 30-45 minute walkthrough with live discussion
3. **Async comments:** Add comments/questions in specific gate sections of GATED_IMPLEMENTATION_PLAN.md
4. **Code review:** Review existing comparison code and suggest improvements

**What We Need Most:**
- ✅ Validation that architecture is sound (or major concerns)
- ✅ Technical risks we haven't considered
- ✅ Suggestions for reducing scope while keeping clinical value
- ✅ Testing strategy feedback (how to validate error detection)
- ✅ Performance optimization ideas

---

## 🙏 Thank You!

We appreciate you taking time to review this plan. Your engineering perspective will help us:
- Avoid major architectural mistakes
- Identify risks early
- Scope MVP appropriately
- Build a production-quality feature

**Questions or need clarification?** Feel free to ask!

**Timeline for feedback:** Ideally within 3-5 days, but take the time needed for a thorough review.

---

**Prepared by:** Claude Code AI Assistant
**Date:** 2025-11-07
**For:** PhysioAssist YouTube Comparison Feature Peer Review
