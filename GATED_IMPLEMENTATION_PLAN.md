# 🚦 YouTube Video Comparison - Gated Implementation Plan

## Overview

This is a **gate-based implementation plan** with clear **Definition of Done (DoD)** criteria for each gate. Each gate must be fully completed and validated before proceeding to the next gate.

**Total Gates:** 6
**Current Gate:** 0 (Not Started)

---

## 🎯 Gate Philosophy

### **What is a Gate?**
A gate is a milestone that represents a complete, tested, and validated increment of functionality. You **CANNOT** proceed to the next gate until:
- ✅ All tasks are completed
- ✅ All tests pass
- ✅ All DoD criteria are met
- ✅ Gate validation is signed off

### **Gate Progression Rules**
```
GATE 0 (Setup) → GATE 1 (Foundation) → GATE 2 (Async Mode)
    → GATE 3 (Error Detection) → GATE 4 (Live Mode)
    → GATE 5 (Multi-Angle) → GATE 6 (Production Polish)
```

**No Skipping Gates. No Partial Gates.**

---

# 🚧 GATE 0: Project Setup & Validation

**Goal:** Ensure development environment is ready and baseline app works

## 📋 Tasks

### 0.1 Development Environment
- [ ] Verify Xcode 15+ installed
- [ ] Verify React Native 0.73.2 working
- [ ] Verify iOS Simulator functional
- [ ] Verify physical device testing capability
- [ ] Install/verify all dependencies (CocoaPods, npm packages)

### 0.2 Baseline App Health
- [ ] Current app builds without errors
- [ ] Current app runs on simulator
- [ ] Current app runs on physical device (iPhone XS+)
- [ ] Current pose detection working (MoveNet Lightning)
- [ ] All existing tests passing

### 0.3 Technical Spike: Pose Models
- [ ] Benchmark MoveNet Lightning on device (measure FPS)
- [ ] Test MoveNet Thunder integration (high accuracy mode)
- [ ] Confirm both models can coexist in app
- [ ] Document performance metrics

### 0.4 Technical Spike: Video Storage
- [ ] Test video recording at 1080p
- [ ] Measure file sizes for 30-second videos
- [ ] Test video playback from cache
- [ ] Confirm storage APIs work on iOS

### 0.5 Technical Spike: YouTube Integration
- [ ] Test react-native-ytdl library
- [ ] Successfully download a test YouTube video
- [ ] Play YouTube video in app
- [ ] Extract video metadata (title, duration, thumbnail)

## ✅ Definition of Done

### Functional Criteria
- [x] All tasks checked off
- [ ] App builds with 0 errors, 0 warnings
- [ ] App runs on iOS Simulator (iPhone 14)
- [ ] App runs on physical device (iPhone XS or newer)
- [ ] MoveNet Lightning achieves ≥20 FPS on device
- [ ] MoveNet Thunder tested and functional
- [ ] YouTube video downloaded and played successfully

### Testing Criteria
- [ ] All existing tests pass (100%)
- [ ] Performance baseline documented:
  - MoveNet Lightning FPS: ___
  - MoveNet Thunder FPS: ___
  - Video file size (30s, 1080p): ___ MB
  - YouTube download time (720p, 30s): ___ seconds

### Documentation Criteria
- [ ] Technical spike results documented
- [ ] Performance baseline saved
- [ ] Known limitations documented

### Sign-Off
- [ ] Developer: _________________ Date: _______
- [ ] QA: ________________________ Date: _______

**🚦 GATE 0 STATUS:** ❌ NOT PASSED

---

# 🏗️ GATE 1: Core Infrastructure

**Goal:** Build foundational systems for video comparison (storage, database, services)

**Prerequisites:** Gate 0 PASSED ✅

## 📋 Tasks

### 1.1 Database Schema
- [ ] Create `comparison_sessions` table
- [ ] Create `error_history` table
- [ ] Create `youtube_cache` table
- [ ] Implement database migrations
- [ ] Add indexes for performance

### 1.2 Video Storage Manager
- [ ] Implement `VideoStorageManager` class
- [ ] Implement `savePatientVideo()`
- [ ] Implement `saveYouTubeVideo()`
- [ ] Implement `savePoseData()`
- [ ] Implement `saveReport()`
- [ ] Implement `generateThumbnail()`
- [ ] Implement `calculateTotalSize()`
- [ ] Implement `cleanupIfNeeded()`
- [ ] Implement `cleanYouTubeCache()`
- [ ] Implement LRU eviction logic

### 1.3 Enhanced YouTube Service
- [ ] Extend `YouTubeService` with download progress
- [ ] Add quality selection (360p, 720p, 1080p)
- [ ] Implement persistent cache (24-hour retention)
- [ ] Add video duration validation (<10 min)
- [ ] Implement error handling for network failures

### 1.4 Video Processing Service
- [ ] Implement `extractFrames()` using FFmpeg
- [ ] Implement frame extraction at 30 FPS
- [ ] Implement `synchronizeVideos()` with DTW algorithm
- [ ] Add progress callbacks for long operations

### 1.5 Pose Model Manager
- [ ] Create `PoseModelManager` class
- [ ] Implement model switcher (Lightning vs Thunder)
- [ ] Add `detectPose_Lightning()` for real-time
- [ ] Add `detectPose_Thunder()` for analysis
- [ ] Implement pose data caching

### 1.6 Session Management
- [ ] Create `SessionManager` class
- [ ] Implement `createSession()`
- [ ] Implement `loadSession()`
- [ ] Implement `deleteSession()`
- [ ] Implement `listSessions()` with filters
- [ ] Add favorite/unfavorite functionality
- [ ] Add share functionality

## ✅ Definition of Done

### Functional Criteria
- [x] All tasks checked off
- [ ] Database tables created and accessible
- [ ] Video storage saves and retrieves videos correctly
- [ ] YouTube videos download and cache properly
- [ ] Frame extraction produces valid image frames
- [ ] Pose models switch correctly based on mode
- [ ] Sessions saved and loaded without data loss

### Testing Criteria
- [ ] **Unit Tests:** 90% code coverage minimum
  - [ ] VideoStorageManager: 12 tests
  - [ ] YouTubeService: 8 tests
  - [ ] VideoProcessingService: 6 tests
  - [ ] PoseModelManager: 5 tests
  - [ ] SessionManager: 10 tests
- [ ] **Integration Tests:**
  - [ ] End-to-end: Download YouTube → Extract frames → Detect poses → Save session
  - [ ] Storage cleanup triggers at 5GB limit
  - [ ] LRU eviction removes oldest non-favorite sessions
- [ ] **Performance Tests:**
  - [ ] Frame extraction: <5 seconds for 30-second video
  - [ ] Pose detection (Thunder): <10 seconds for 30-second video
  - [ ] Database queries: <100ms for session list
  - [ ] Storage cleanup: <2 seconds

### Code Quality Criteria
- [ ] All code follows TypeScript strict mode
- [ ] All functions have JSDoc comments
- [ ] No console.log statements (use proper logging)
- [ ] Error handling on all async operations
- [ ] Input validation on all public methods

### Documentation Criteria
- [ ] Architecture diagram created
- [ ] API documentation for all services
- [ ] Database schema documented
- [ ] Storage policy documented

### Sign-Off
- [ ] Developer: _________________ Date: _______
- [ ] Code Review: ________________ Date: _______
- [ ] QA: ________________________ Date: _______

**🚦 GATE 1 STATUS:** ❌ NOT PASSED

---

# 📱 GATE 2: Mode 1 - Async Comparison (Pre-Recorded)

**Goal:** Fully functional pre-recorded video comparison with side-by-side review

**Prerequisites:** Gate 1 PASSED ✅

## 📋 Tasks

### 2.1 Recording Screen UI
- [ ] Create `PatientRecordingScreen` component
- [ ] Add camera view with live pose overlay
- [ ] Add positioning guide (AR-style overlay)
- [ ] Add countdown timer (3-2-1-Go)
- [ ] Add rep counter display
- [ ] Add recording status indicator
- [ ] Add stop/restart controls
- [ ] Implement proper camera permissions handling

### 2.2 Recording Logic
- [ ] Implement video recording at 1080p, 30 FPS
- [ ] Start recording on countdown complete
- [ ] Display live pose skeleton during recording
- [ ] Track rep count in real-time
- [ ] Auto-stop at 60 seconds max
- [ ] Save recorded video to storage
- [ ] Generate thumbnail from first frame

### 2.3 Offline Analysis Pipeline
- [ ] Create `ComparisonAnalysisPipeline` service
- [ ] Extract frames from YouTube video
- [ ] Extract frames from patient video
- [ ] Run pose detection on all frames (Thunder model)
- [ ] Synchronize videos using DTW algorithm
- [ ] Calculate angle deviations for all joints
- [ ] Calculate temporal alignment
- [ ] Calculate overall score
- [ ] Show progress indicator during analysis

### 2.4 Side-by-Side Review Screen
- [ ] Create `SideBySideReviewScreen` component
- [ ] Display YouTube video (left 50%)
- [ ] Display patient video (right 50%)
- [ ] Overlay pose skeletons on both videos
- [ ] Sync playback of both videos
- [ ] Add play/pause/restart controls
- [ ] Add playback speed control (0.25x, 0.5x, 0.75x, 1x)
- [ ] Add frame-by-frame stepping (left/right arrows)
- [ ] Add error timeline markers (red dots)
- [ ] Highlight current error on timeline

### 2.5 Feedback Panel
- [ ] Display overall score (0-100)
- [ ] Show top 3 errors with priority
- [ ] Display error descriptions
- [ ] Show angle deviation values
- [ ] Add expandable detailed breakdown
- [ ] Include visual aids (images/diagrams)
- [ ] Add positive reinforcement messages

### 2.6 Report Generation
- [ ] Create `ReportGenerator` service
- [ ] Generate PDF report with:
  - [ ] Session metadata (date, exercise, score)
  - [ ] Side-by-side video thumbnails
  - [ ] Top 3 errors with descriptions
  - [ ] Angle comparison charts
  - [ ] Recommendations
- [ ] Implement email sharing
- [ ] Implement SMS sharing
- [ ] Add "Save to favorites"
- [ ] Add "Add notes" functionality

### 2.7 Session History
- [ ] Create `SessionHistoryScreen` component
- [ ] Display list of past sessions
- [ ] Show thumbnail, date, exercise type, score
- [ ] Add filter by exercise type
- [ ] Add sort by date/score
- [ ] Enable tap to review session
- [ ] Add swipe to delete
- [ ] Show storage usage

## ✅ Definition of Done

### Functional Criteria
- [x] All tasks checked off
- [ ] User can record 30-second exercise video
- [ ] Video records at 1080p with pose overlay visible
- [ ] Offline analysis completes in <30 seconds
- [ ] Side-by-side review shows synchronized videos
- [ ] Error markers appear on timeline
- [ ] Top 3 errors displayed with clear descriptions
- [ ] PDF report generates and shares successfully
- [ ] Session saves to history and can be re-opened

### Testing Criteria
- [ ] **Unit Tests:** 85% code coverage minimum
  - [ ] PatientRecordingScreen: 8 tests
  - [ ] ComparisonAnalysisPipeline: 12 tests
  - [ ] SideBySideReviewScreen: 10 tests
  - [ ] ReportGenerator: 6 tests
- [ ] **Integration Tests:**
  - [ ] End-to-end: YouTube URL → Record → Analyze → Review → Share
  - [ ] Video sync accuracy: <1 frame offset
  - [ ] Error detection: Find 3+ errors in deliberately bad form video
- [ ] **User Acceptance Tests:**
  - [ ] 5 test users complete full flow without assistance
  - [ ] Average task completion time: <5 minutes
  - [ ] User comprehension: 80%+ understand error feedback
- [ ] **Performance Tests:**
  - [ ] Recording uses <10% battery per minute
  - [ ] Analysis completes in <30 seconds for 30s video
  - [ ] Playback maintains 30 FPS
  - [ ] PDF generation: <5 seconds

### Clinical Validation Criteria
- [ ] Test with 3 exercise types:
  - [ ] Shoulder abduction
  - [ ] Knee squat
  - [ ] Elbow flexion
- [ ] Test with deliberately bad form:
  - [ ] System detects intentional errors 80%+ of time
- [ ] Test with good form:
  - [ ] False positive rate <15%

### Code Quality Criteria
- [ ] All components use React hooks properly
- [ ] No memory leaks in video playback
- [ ] Proper cleanup on component unmount
- [ ] Error boundaries implemented
- [ ] Loading states for all async operations

### Documentation Criteria
- [ ] User flow diagram created
- [ ] Component documentation complete
- [ ] API documentation updated
- [ ] Known issues documented

### Sign-Off
- [ ] Developer: _________________ Date: _______
- [ ] UX Review: _________________ Date: _______
- [ ] Clinical Review (PT): _______ Date: _______
- [ ] QA: ________________________ Date: _______

**🚦 GATE 2 STATUS:** ❌ NOT PASSED

---

# 🧠 GATE 3: Intelligent Error Detection System

**Goal:** Research-based error detection with smart, non-overwhelming feedback

**Prerequisites:** Gate 2 PASSED ✅

## 📋 Tasks

### 3.1 Shoulder Error Detection
- [ ] Implement **Shoulder Hiking** detection
  - [ ] Track shoulder-to-ear distance
  - [ ] Baseline on first rep
  - [ ] Detect >2cm elevation (warning), >5cm (critical)
  - [ ] Generate specific feedback messages
- [ ] Implement **Trunk Leaning** detection
  - [ ] Calculate trunk lateral angle
  - [ ] Detect >5° lean (warning), >15° (critical)
  - [ ] Account for natural asymmetry
- [ ] Implement **Internal Rotation** detection
  - [ ] Estimate forearm rotation from wrist-elbow position
  - [ ] Detect thumb-down position (critical)
  - [ ] Generate rotation correction feedback
- [ ] Implement **Incomplete ROM** detection
  - [ ] Compare user max angle to reference max
  - [ ] Detect <70% of reference ROM (warning), <50% (critical)
  - [ ] Provide target angle in feedback
- [ ] Test with 20 shoulder exercise videos
  - [ ] 10 good form videos (should score >85)
  - [ ] 10 bad form videos (should detect errors)

### 3.2 Knee Error Detection
- [ ] Implement **Knee Valgus** detection (HIGHEST PRIORITY)
  - [ ] Track knee X-position relative to ankle
  - [ ] Detect >5% medial shift (warning), >10% (critical)
  - [ ] Flag as high injury risk
  - [ ] Generate "push knees out" feedback
- [ ] Implement **Heel Lift** detection
  - [ ] Track ankle Y-position change
  - [ ] Detect >1cm lift (warning), >2cm (critical)
  - [ ] Generate "keep heels down" feedback
- [ ] Implement **Posterior Pelvic Tilt** detection
  - [ ] Track hip-to-shoulder angle change
  - [ ] Detect >10° rotation (warning), >20° (critical)
  - [ ] Generate "don't tuck tailbone" feedback
- [ ] Implement **Insufficient Depth** detection
  - [ ] Compare user knee flexion to reference
  - [ ] Detect >10° short (warning), >20° (critical)
  - [ ] Provide target depth in feedback
- [ ] Test with 20 squat videos
  - [ ] 10 good form videos
  - [ ] 10 bad form videos (valgus, heel lift, etc.)

### 3.3 Elbow Error Detection
- [ ] Implement **Shoulder Compensation** detection
  - [ ] Track shoulder X-position movement
  - [ ] Detect >3cm movement (warning), >7cm (critical)
  - [ ] Generate "keep upper arm still" feedback
- [ ] Implement **Incomplete Extension** detection
  - [ ] Measure minimum elbow angle
  - [ ] Detect <160° extension (warning), <140° (critical)
  - [ ] Generate "straighten arm" feedback
- [ ] Implement **Wrist Deviation** detection
  - [ ] Estimate wrist alignment from elbow-wrist line
  - [ ] Detect significant bend (warning)
  - [ ] Generate "keep wrist straight" feedback
- [ ] Test with 20 arm exercise videos
  - [ ] 10 good form videos
  - [ ] 10 bad form videos

### 3.4 Smart Feedback Prioritization System
- [ ] Create `SmartFeedbackGenerator` class
- [ ] Implement priority scoring algorithm:
  - [ ] Weight by injury risk (critical=100, high=75, medium=50, low=25)
  - [ ] Weight by severity (critical=50, warning=25)
  - [ ] Weight by frequency (>80% reps = +25)
  - [ ] Weight by cascading effect (+25 if fixing helps other errors)
- [ ] Implement top-N filtering (max 3 errors)
- [ ] Implement patient level adjustment:
  - [ ] Beginner: 1-2 critical errors only
  - [ ] Intermediate: 2-3 errors
  - [ ] Advanced: detailed breakdown
- [ ] Add positive reinforcement:
  - [ ] Detect score improvement over previous sessions
  - [ ] Generate encouraging messages
  - [ ] Celebrate milestones (first 80+ score, etc.)

### 3.5 Exercise-Specific Error Database
- [ ] Create error pattern database
- [ ] Define errors for each exercise type:
  - [ ] Shoulder abduction: 4 error patterns
  - [ ] Shoulder flexion: 4 error patterns
  - [ ] Knee squat: 4 error patterns
  - [ ] Elbow flexion: 3 error patterns
  - [ ] Elbow extension: 3 error patterns
- [ ] Map errors to injury risk levels
- [ ] Create correction instructions for each error
- [ ] Add visual aids (diagrams/reference images)

### 3.6 Feedback Message Library
- [ ] Create beginner-friendly messages (simple, encouraging)
- [ ] Create intermediate messages (clear, instructive)
- [ ] Create advanced messages (technical, precise)
- [ ] Translate messages to patient-friendly language
- [ ] Test messages with 5 non-technical users for clarity

## ✅ Definition of Done

### Functional Criteria
- [x] All tasks checked off
- [ ] All 11 error patterns implemented and tested
- [ ] Smart feedback shows max 3 errors per session
- [ ] Feedback messages clear to non-technical users
- [ ] Positive reinforcement appears when appropriate
- [ ] Error priority scoring works correctly

### Testing Criteria
- [ ] **Unit Tests:** 90% code coverage minimum
  - [ ] Each error detector: 4-6 tests
  - [ ] SmartFeedbackGenerator: 12 tests
  - [ ] Priority scoring: 8 tests
- [ ] **Validation Tests (60 total):**
  - [ ] Shoulder videos: 20 (10 good, 10 bad) - ≥85% accuracy
  - [ ] Knee videos: 20 (10 good, 10 bad) - ≥85% accuracy
  - [ ] Elbow videos: 20 (10 good, 10 bad) - ≥85% accuracy
- [ ] **False Positive Tests:**
  - [ ] Test 30 good form videos
  - [ ] False positive rate <15%
- [ ] **Clinical Validation:**
  - [ ] Physical therapist reviews 20 error detections
  - [ ] PT agrees with ≥80% of error identifications
  - [ ] PT confirms feedback messages are appropriate

### Accuracy Criteria
- [ ] **Overall Error Detection:** ≥85% accuracy
- [ ] **Injury Risk Prioritization:** 100% of critical injury risks shown first
- [ ] **False Positive Rate:** <15%
- [ ] **Feedback Clarity:** ≥80% of test users understand corrections

### Performance Criteria
- [ ] Error detection adds <2 seconds to analysis time
- [ ] Priority scoring completes in <100ms
- [ ] No impact on app performance

### Clinical Criteria
- [ ] Physical therapist validates error patterns
- [ ] PT confirms feedback is clinically appropriate
- [ ] PT confirms non-overwhelming approach
- [ ] No dangerous or harmful feedback messages

### Code Quality Criteria
- [ ] All error thresholds configurable
- [ ] Error patterns externalized (JSON config)
- [ ] Logging for debugging false positives
- [ ] Clear separation of detection vs. feedback

### Documentation Criteria
- [ ] Error detection algorithms documented
- [ ] Clinical rationale for each error documented
- [ ] Threshold values justified with research
- [ ] PT sign-off documented

### Sign-Off
- [ ] Developer: _________________ Date: _______
- [ ] Physical Therapist: _________ Date: _______
- [ ] Clinical Advisor: ___________ Date: _______
- [ ] QA: ________________________ Date: _______

**🚦 GATE 3 STATUS:** ❌ NOT PASSED

---

# 🎬 GATE 4: Mode 2 - Live Split-Screen Comparison

**Goal:** Real-time guided exercise with split-screen and instant feedback

**Prerequisites:** Gate 3 PASSED ✅

## 📋 Tasks

### 4.1 Split-Screen Layout UI
- [ ] Create `LiveSplitScreenView` component
- [ ] Layout YouTube video player (left 50%)
- [ ] Layout live camera feed (right 50%)
- [ ] Add pose skeleton overlay on both sides
- [ ] Color-code skeletons (YouTube=red, User=green)
- [ ] Add top overlay bar (rep counter, score)
- [ ] Add bottom overlay (current error indicator)
- [ ] Ensure UI doesn't obstruct video

### 4.2 Synchronized Playback
- [ ] Implement play/pause controls
- [ ] Sync YouTube video with user movement
- [ ] Add replay/restart button
- [ ] Add speed control (0.5x, 0.75x, 1x)
- [ ] Maintain sync when changing speeds
- [ ] Handle video buffering gracefully

### 4.3 Real-Time Pose Detection
- [ ] Switch to MoveNet Lightning model (fast)
- [ ] Process frames every 500ms (2x per second)
- [ ] Display live skeleton on user feed
- [ ] Track current rep count
- [ ] Detect rep completion (concentric/eccentric phases)
- [ ] Update UI in real-time

### 4.4 Real-Time Error Detection
- [ ] Run error detection every 500ms
- [ ] Calculate current error (not historical)
- [ ] Prioritize to single top error only
- [ ] Update error indicator in real-time
- [ ] Clear error when corrected
- [ ] Track error frequency for post-session report

### 4.5 Real-Time Audio Feedback
- [ ] Integrate `AudioFeedbackService`
- [ ] Speak top error message (high priority)
- [ ] Implement 3-second cooldown (avoid spam)
- [ ] Queue messages (process one at a time)
- [ ] Speak "Good rep!" on successful rep
- [ ] Speak "Rest" when exercise complete

### 4.6 Real-Time Visual Feedback
- [ ] Highlight problem joint with red circle
- [ ] Show angle deviation (e.g., "15° off")
- [ ] Color-code skeleton:
  - [ ] Green = good form
  - [ ] Yellow = warning
  - [ ] Red = critical error
- [ ] Animate rep counter on rep complete
- [ ] Show live score (updates every rep)

### 4.7 Real-Time Haptic Feedback
- [ ] Light haptic on rep complete
- [ ] Medium haptic on warning error
- [ ] Strong haptic on critical error
- [ ] Success pattern on exercise complete

### 4.8 Auto-Recording Session
- [ ] Start recording on first movement
- [ ] Record user camera feed only (not YouTube)
- [ ] Save at 720p (balance quality/performance)
- [ ] Stop recording when YouTube video ends
- [ ] Save session metadata (reps, errors, score)
- [ ] Auto-generate thumbnail

### 4.9 Post-Session Report
- [ ] Create `LiveSessionReportScreen` component
- [ ] Show session summary:
  - [ ] Total reps completed
  - [ ] Average score
  - [ ] Time spent
  - [ ] Improvement vs. previous session
- [ ] Show top 3 errors with frequency chart
- [ ] Enable review of recorded session (like Mode 1)
- [ ] Enable sharing report
- [ ] Show next steps / recommendations

### 4.10 Performance Optimization
- [ ] Optimize for 20 FPS pose detection
- [ ] Reduce battery consumption:
  - [ ] Throttle pose detection (500ms, not every frame)
  - [ ] Use MoveNet Lightning (fastest model)
  - [ ] Reduce camera resolution if needed
- [ ] Handle thermal throttling:
  - [ ] Detect device temperature
  - [ ] Show warning at 80% thermal capacity
  - [ ] Suggest break at 90%
- [ ] Test on iPhone XS (oldest supported device)

## ✅ Definition of Done

### Functional Criteria
- [x] All tasks checked off
- [ ] Split-screen shows both videos clearly
- [ ] Playback stays synchronized
- [ ] Real-time pose skeleton overlays correctly
- [ ] Audio feedback speaks errors within 1 second
- [ ] Visual feedback highlights problem joints
- [ ] Haptic feedback triggers appropriately
- [ ] Session auto-records and saves
- [ ] Post-session report displays correctly

### Testing Criteria
- [ ] **Unit Tests:** 85% code coverage minimum
  - [ ] LiveSplitScreenView: 10 tests
  - [ ] Real-time feedback: 12 tests
  - [ ] Auto-recording: 6 tests
  - [ ] Post-session report: 8 tests
- [ ] **Integration Tests:**
  - [ ] End-to-end: YouTube load → Exercise → Real-time feedback → Report
  - [ ] Sync accuracy: Videos stay within 500ms
  - [ ] Error detection latency: <1 second
- [ ] **Performance Tests:**
  - [ ] Pose detection: ≥20 FPS sustained
  - [ ] Battery usage: <10% per 10-minute session
  - [ ] Memory usage: <500 MB total
  - [ ] Thermal: No throttling in 10-minute session
- [ ] **User Acceptance Tests:**
  - [ ] 5 test users complete live session
  - [ ] 80%+ find real-time feedback helpful
  - [ ] <10% find feedback overwhelming
  - [ ] 90%+ can follow along without confusion

### Performance Criteria
- [ ] **Frame Rate:** ≥20 FPS on iPhone XS
- [ ] **Latency:** Error feedback <1 second delay
- [ ] **Battery:** <10% per 10-minute session
- [ ] **Thermal:** No overheating warnings in normal use
- [ ] **Memory:** No memory leaks after 5 sessions

### User Experience Criteria
- [ ] Feedback feels natural and helpful
- [ ] Audio doesn't interrupt flow excessively
- [ ] Visual indicators are clear and unobtrusive
- [ ] UI doesn't block view of videos
- [ ] Controls are easily accessible

### Code Quality Criteria
- [ ] Proper frame processor optimization
- [ ] No blocking the UI thread
- [ ] Efficient memory management (release frames)
- [ ] Proper cleanup on session end
- [ ] Error handling for camera/mic permissions

### Documentation Criteria
- [ ] Real-time architecture documented
- [ ] Performance optimization techniques documented
- [ ] Known limitations documented
- [ ] User guide for live mode updated

### Sign-Off
- [ ] Developer: _________________ Date: _______
- [ ] UX Review: _________________ Date: _______
- [ ] Performance Review: _________ Date: _______
- [ ] QA: ________________________ Date: _______

**🚦 GATE 4 STATUS:** ❌ NOT PASSED

---

# 📐 GATE 5: Multi-Angle Support & Camera Positioning

**Goal:** Handle exercises requiring side-view angles with intelligent guidance

**Prerequisites:** Gate 4 PASSED ✅

## 📋 Tasks

### 5.1 YouTube Video Angle Detection
- [ ] Create `CameraAngleDetector` service
- [ ] Implement angle classification:
  - [ ] Frontal (0°)
  - [ ] Side view (90°)
  - [ ] 45° angle
- [ ] Analyze YouTube video first frame
- [ ] Detect camera position from pose landmarks
- [ ] Store detected angle with video metadata

### 5.2 Patient Positioning Guide
- [ ] Create `PositioningGuideOverlay` component
- [ ] Show AR-style overlay with body outline
- [ ] Display text instructions: "Face the camera" or "Turn to your right side"
- [ ] Show distance indicator (too close/too far)
- [ ] Verify full body in frame (head to feet visible)
- [ ] Show checkmark when positioned correctly
- [ ] Auto-dismiss guide when ready

### 5.3 Multi-Angle Recording Flow
- [ ] Detect if exercise requires multiple angles:
  - [ ] Shoulder flexion: Frontal + Side
  - [ ] Elbow flexion: Side only
  - [ ] Knee squat: Frontal (or 45° optional)
- [ ] Prompt user for first angle
- [ ] Record first angle (e.g., frontal view)
- [ ] Prompt user to reposition: "Now turn to your right side"
- [ ] Show positioning guide for second angle
- [ ] Record second angle
- [ ] Save both videos to session

### 5.4 Multi-Angle Pose Data Merging
- [ ] Extract poses from frontal view
- [ ] Extract poses from side view
- [ ] Merge complementary data:
  - [ ] Use frontal for knee valgus detection
  - [ ] Use side for elbow extension detection
- [ ] Create combined pose analysis
- [ ] Generate single comprehensive report

### 5.5 Distance & Framing Validation
- [ ] Estimate user distance from camera
- [ ] Detect if too close (<1.5m) or too far (>3m)
- [ ] Verify head visible at top of frame
- [ ] Verify feet visible at bottom of frame
- [ ] Show real-time feedback: "Step back 1 foot"
- [ ] Lock recording button until framing is good

### 5.6 Exercise-Specific Angle Requirements
- [ ] Create angle requirement database:
  - [ ] Shoulder abduction: Frontal only
  - [ ] Shoulder flexion: Frontal + Side
  - [ ] Knee squat: Frontal (recommended) or 45°
  - [ ] Elbow flexion/extension: Side only
- [ ] Auto-detect optimal angle from YouTube video
- [ ] Suggest angle to user based on exercise
- [ ] Allow user override if needed

## ✅ Definition of Done

### Functional Criteria
- [x] All tasks checked off
- [ ] YouTube angle detection works ≥90% accuracy
- [ ] Positioning guide displays correct instructions
- [ ] Multi-angle recording flow is smooth and clear
- [ ] Distance validation prevents bad framing
- [ ] Multi-angle data merges correctly
- [ ] Single comprehensive report generated

### Testing Criteria
- [ ] **Unit Tests:** 85% code coverage minimum
  - [ ] CameraAngleDetector: 8 tests
  - [ ] PositioningGuideOverlay: 6 tests
  - [ ] Multi-angle merge: 10 tests
- [ ] **Validation Tests:**
  - [ ] Test 30 YouTube videos for angle detection
  - [ ] Accuracy ≥90%
  - [ ] No false classifications on ambiguous videos
- [ ] **User Acceptance Tests:**
  - [ ] 5 test users complete multi-angle recording
  - [ ] 80%+ understand positioning instructions
  - [ ] Task completion time: <2 minutes per angle
- [ ] **Integration Tests:**
  - [ ] End-to-end multi-angle flow
  - [ ] Merged data produces accurate error detection

### Functional Validation Criteria
- [ ] Angle detection accuracy: ≥90%
- [ ] Positioning guide comprehension: ≥80%
- [ ] Distance estimation accuracy: ±0.5m
- [ ] Framing validation accuracy: ≥95%

### User Experience Criteria
- [ ] Users understand angle instructions clearly
- [ ] Repositioning flow is not frustrating
- [ ] AR overlay is helpful, not confusing
- [ ] Distance feedback is accurate and helpful

### Code Quality Criteria
- [ ] Angle detection algorithm well-documented
- [ ] Positioning guide configurable
- [ ] Multi-angle logic separated from single-angle
- [ ] Clean abstraction for angle-specific processing

### Documentation Criteria
- [ ] Angle detection algorithm documented
- [ ] Multi-angle flow diagram created
- [ ] Exercise angle requirements documented
- [ ] User guide updated

### Sign-Off
- [ ] Developer: _________________ Date: _______
- [ ] UX Review: _________________ Date: _______
- [ ] Clinical Review (PT): _______ Date: _______
- [ ] QA: ________________________ Date: _______

**🚦 GATE 5 STATUS:** ❌ NOT PASSED

---

# 💎 GATE 6: Production Polish & Clinical Integration

**Goal:** Production-ready app with therapist features and clinical workflows

**Prerequisites:** Gate 5 PASSED ✅

## 📋 Tasks

### 6.1 Patient History & Progress Tracking
- [ ] Create `PatientHistoryScreen` component
- [ ] Display session history list with:
  - [ ] Thumbnail
  - [ ] Date/time
  - [ ] Exercise type
  - [ ] Overall score
  - [ ] Star (favorite) indicator
- [ ] Implement filters:
  - [ ] By exercise type
  - [ ] By date range
  - [ ] Favorites only
  - [ ] Shared with therapist
- [ ] Implement sorting (date, score, exercise)
- [ ] Add swipe-to-delete with confirmation
- [ ] Show storage usage bar at bottom

### 6.2 Progress Charts
- [ ] Create `ProgressChartScreen` component
- [ ] Show score trend over time (line chart)
- [ ] Show error frequency reduction (bar chart)
- [ ] Show rep count over time
- [ ] Filter charts by exercise type
- [ ] Show improvement percentage vs. baseline
- [ ] Add date range selector

### 6.3 Therapist Dashboard
- [ ] Create `TherapistDashboard` component
- [ ] Display patient's shared sessions
- [ ] Show recent activity summary
- [ ] Enable therapist to add notes to sessions
- [ ] Enable therapist to assign YouTube videos
- [ ] Show patient compliance (% of assigned exercises completed)
- [ ] Flag sessions needing attention (score drops, pain indicators)

### 6.4 Exercise Library
- [ ] Create `ExerciseLibrary` component
- [ ] Curate 50+ validated YouTube videos:
  - [ ] 15 shoulder exercises
  - [ ] 15 knee exercises
  - [ ] 15 elbow exercises
  - [ ] 5+ other (hip, ankle, etc.)
- [ ] Categorize by:
  - [ ] Body part
  - [ ] Difficulty (beginner, intermediate, advanced)
  - [ ] Equipment needed (none, dumbbells, resistance band)
- [ ] Add exercise descriptions
- [ ] Show preview thumbnail and duration
- [ ] Enable favorites
- [ ] Enable therapist to assign specific videos to patients

### 6.5 Settings & Customization
- [ ] Create `SettingsScreen` component
- [ ] Audio feedback settings:
  - [ ] Enable/disable toggle
  - [ ] Volume slider
  - [ ] Speech rate adjustment
  - [ ] Pitch adjustment
- [ ] Visual feedback settings:
  - [ ] Skeleton color picker
  - [ ] Error highlight color
  - [ ] UI theme (light/dark)
- [ ] Feedback level:
  - [ ] Beginner mode (1-2 errors, simple language)
  - [ ] Intermediate mode (2-3 errors, clear language)
  - [ ] Advanced mode (detailed, technical)
- [ ] Storage management:
  - [ ] View total storage used
  - [ ] Clear YouTube cache button
  - [ ] Clear old sessions button
  - [ ] Auto-delete settings
- [ ] Privacy settings:
  - [ ] Share with therapist by default toggle
  - [ ] Auto-delete after X days

### 6.6 Onboarding & Tutorial
- [ ] Create `OnboardingFlow` component
- [ ] Welcome screen with app purpose
- [ ] 30-second demo video showing features
- [ ] Camera setup tutorial:
  - [ ] How to position phone
  - [ ] How to ensure full body visible
  - [ ] Distance check
- [ ] Mode selection explanation:
  - [ ] "Record first" (Mode 1) - Recommended
  - [ ] "Follow along" (Mode 2) - Real-time
- [ ] First guided exercise:
  - [ ] Simple exercise (shoulder abduction)
  - [ ] Step-by-step prompts
  - [ ] Celebrate completion with confetti
- [ ] Review tutorial:
  - [ ] How to read error feedback
  - [ ] How to replay and improve
- [ ] Skip option for advanced users

### 6.7 Error Handling & Edge Cases
- [ ] Handle missing pose detection:
  - [ ] Body not in frame → Show positioning guide
  - [ ] Occlusion (body part hidden) → Prompt to reposition
  - [ ] Low confidence (<0.5) → Warning message
- [ ] Handle video errors:
  - [ ] YouTube download fails → Retry with lower quality
  - [ ] Network timeout → Cache and retry
  - [ ] Invalid YouTube URL → Clear error message
- [ ] Handle storage errors:
  - [ ] Storage full → Prompt to delete old sessions
  - [ ] Disk write failure → Graceful degradation
- [ ] Handle permission errors:
  - [ ] Camera denied → Show settings instructions
  - [ ] Microphone denied → Disable audio feedback only
- [ ] Handle app state:
  - [ ] Background → Pause session
  - [ ] Foreground → Resume session
  - [ ] Crash recovery → Restore session

### 6.8 Accessibility
- [ ] Add VoiceOver support:
  - [ ] Label all buttons
  - [ ] Announce error messages
  - [ ] Describe video content
- [ ] Add Dynamic Type support (font scaling)
- [ ] Add color blind friendly mode
- [ ] Add text-only feedback option (for hearing impaired)
- [ ] Test with iOS accessibility features enabled

### 6.9 Performance & Stability
- [ ] Optimize bundle size (<100 MB)
- [ ] Reduce app launch time (<2 seconds)
- [ ] Eliminate memory leaks:
  - [ ] Video player cleanup
  - [ ] Camera cleanup
  - [ ] Pose detection cleanup
- [ ] Add crash reporting (Sentry or Crashlytics)
- [ ] Add performance monitoring
- [ ] Add analytics (session completion rate, feature usage)

### 6.10 Clinical Safety Features
- [ ] Add pain indicator:
  - [ ] Prompt after each session: "Did you experience pain?"
  - [ ] Log pain level (1-10 scale)
  - [ ] Alert therapist if pain >7
- [ ] Add fatigue detection:
  - [ ] Detect score drop mid-session
  - [ ] Prompt: "Are you feeling tired? Consider a break"
- [ ] Add overexertion prevention:
  - [ ] Limit session duration to 30 minutes
  - [ ] Suggest rest days
- [ ] Add disclaimers:
  - [ ] "This app is not a substitute for professional medical advice"
  - [ ] "Stop if you experience sharp pain"
  - [ ] Display therapist contact info

### 6.11 Final Testing & Validation
- [ ] End-to-end regression testing (all flows)
- [ ] Cross-device testing (iPhone XS, 11, 12, 13, 14, 15)
- [ ] Load testing (100 sessions in history)
- [ ] Network testing (poor connection, offline mode)
- [ ] Beta testing with 20+ real users
- [ ] Clinical validation with 3 physical therapists
- [ ] Accessibility audit
- [ ] Security audit
- [ ] Performance benchmarking

## ✅ Definition of Done

### Functional Criteria
- [x] All tasks checked off
- [ ] Patient history displays and filters correctly
- [ ] Progress charts show meaningful trends
- [ ] Therapist dashboard functional (if applicable)
- [ ] Exercise library contains 50+ curated videos
- [ ] Settings allow full customization
- [ ] Onboarding flow is smooth and clear
- [ ] All error cases handled gracefully
- [ ] Accessibility features work correctly
- [ ] Clinical safety features implemented

### Testing Criteria
- [ ] **Unit Tests:** 90% overall code coverage
- [ ] **Integration Tests:** All critical paths covered
- [ ] **Regression Tests:** All 100+ tests passing
- [ ] **Performance Tests:**
  - [ ] App launch: <2 seconds
  - [ ] Session list load (100 items): <1 second
  - [ ] Chart rendering: <500ms
  - [ ] No memory leaks after 10 sessions
- [ ] **User Acceptance Tests:**
  - [ ] 20 beta users complete full workflow
  - [ ] 85%+ task completion rate
  - [ ] System Usability Scale (SUS) score ≥75
  - [ ] <10% report confusing or overwhelming feedback
- [ ] **Clinical Validation:**
  - [ ] 3 physical therapists review app
  - [ ] PT confidence in error detection ≥80%
  - [ ] PT approval of feedback messages
  - [ ] PT confirms clinical safety measures adequate

### Quality Criteria
- [ ] **Code Quality:**
  - [ ] 0 critical bugs
  - [ ] <5 minor bugs
  - [ ] Code review completed for all PRs
  - [ ] No console warnings
  - [ ] All TODOs resolved
- [ ] **Performance:**
  - [ ] App size <100 MB
  - [ ] Launch time <2 seconds
  - [ ] Battery usage <10% per 10-minute session
  - [ ] No crashes in 100 test sessions
- [ ] **Security:**
  - [ ] Patient data encrypted at rest
  - [ ] Video files encrypted
  - [ ] No data sent to external servers (except optional therapist sharing)
  - [ ] HIPAA compliance reviewed
- [ ] **Accessibility:**
  - [ ] VoiceOver compatible
  - [ ] Dynamic Type supported
  - [ ] Color contrast WCAG AA compliant
  - [ ] Tested with accessibility tools

### Documentation Criteria
- [ ] User manual complete
- [ ] Therapist guide complete
- [ ] API documentation complete
- [ ] Architecture documentation updated
- [ ] README with setup instructions
- [ ] Troubleshooting guide
- [ ] Privacy policy drafted
- [ ] Terms of service drafted

### Clinical Criteria
- [ ] Physical therapist sign-off obtained
- [ ] Clinical advisor approval
- [ ] Safety features validated
- [ ] Error detection accuracy confirmed ≥85%
- [ ] False positive rate confirmed <15%
- [ ] No dangerous feedback messages

### Deployment Criteria
- [ ] App Store screenshots prepared
- [ ] App Store description written
- [ ] Privacy policy submitted
- [ ] TestFlight build uploaded
- [ ] Beta testers invited
- [ ] Crash reporting configured
- [ ] Analytics configured
- [ ] Support email/system set up

### Sign-Off
- [ ] Developer: _________________ Date: _______
- [ ] UX Lead: ___________________ Date: _______
- [ ] Physical Therapist: _________ Date: _______
- [ ] Clinical Advisor: ___________ Date: _______
- [ ] QA Lead: ___________________ Date: _______
- [ ] Product Owner: _____________ Date: _______

**🚦 GATE 6 STATUS:** ❌ NOT PASSED

---

# 📊 Gate Status Summary

| Gate | Name | Status | Progress |
|------|------|--------|----------|
| **0** | Project Setup & Validation | ❌ NOT PASSED | 0% |
| **1** | Core Infrastructure | ❌ NOT PASSED | 0% |
| **2** | Mode 1 - Async Comparison | ❌ NOT PASSED | 0% |
| **3** | Intelligent Error Detection | ❌ NOT PASSED | 0% |
| **4** | Mode 2 - Live Split-Screen | ❌ NOT PASSED | 0% |
| **5** | Multi-Angle Support | ❌ NOT PASSED | 0% |
| **6** | Production Polish | ❌ NOT PASSED | 0% |

**Overall Project Status:** 0% Complete

---

# 🎯 Next Steps

**To begin implementation:**
1. Review this gated plan with stakeholders
2. Get sign-off from clinical team (PT/advisor)
3. Allocate development resources
4. Begin Gate 0: Project Setup & Validation
5. Follow gates sequentially - no skipping!

**Questions for Stakeholders Before Starting:**
1. Which exercise type is highest priority? (Shoulder/Knee/Elbow)
2. Is therapist dashboard required for MVP? (Can defer to post-launch)
3. What is acceptable timeline? (Gates can take 1-3 weeks each)
4. Who will provide clinical validation? (Need PT access)
5. What is definition of MVP? (Can we ship after Gate 3?)

---

**Ready to begin Gate 0?**
