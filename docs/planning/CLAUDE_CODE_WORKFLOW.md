# Claude Code Workflow: Web → CLI Continuous Iteration

## 🎯 Overview

This document outlines the **two-phase workflow** for PhysioAssist remediation, leveraging Claude Code's web and CLI capabilities for maximum efficiency.

### The Insight

Your existing bridge infrastructure (`scripts/ios/claude-bridge.sh`, `claude-auto-iterate.sh`, `claude-bridge-server.js`) enables **Claude Code CLI** to:
- Execute Xcode builds and monitor simulators
- Run `pod install`, `gradle sync`, and native tooling
- Analyze build errors and apply fixes iteratively
- Watch simulator state and respond to issues
- Collaborate with you in real-time as you observe the app

This transforms Gate 1 and Gate 6 from "handoff points" to **collaborative sessions** where Claude Code CLI becomes your pair programming partner on your macOS machine.

---

## 📊 Two-Phase Execution Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 1: Claude Code Web                        │
│                  (Autonomous Code Changes - 80%)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Gate 1 (Prep): Update package.json, static imports, type defs     │
│  Gate 2 (Auth): Wire Redux selectors, remove bypasses              │
│  Gate 3 (Mocks): Remove fallbacks, fail-fast error handling        │
│  Gate 4 (Components): Complete ExerciseSummary, ProgressChart      │
│  Gate 5 (TypeScript): Fix all 232 errors, strict mode              │
│                                                                     │
│  OUTPUT: Branch with production-ready source code                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
                         GIT COMMIT & PUSH
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: Claude Code CLI                         │
│               (Local Validation & Iteration - 20%)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  You: Pull branch to local macOS                                   │
│  You: Open Claude Code CLI in project directory                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Claude Code CLI Session (Iterative Collaboration)          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Claude CLI: npm install                                    │  │
│  │  Claude CLI: cd ios && pod install                          │  │
│  │  Claude CLI: npm run ios:sim                                │  │
│  │                                                              │  │
│  │  → Simulator opens, you watch                               │  │
│  │                                                              │  │
│  │  You: "App crashes on launch with TensorFlow error"         │  │
│  │  Claude CLI: *Analyzes logs, adds Podfile configuration*    │  │
│  │  Claude CLI: pod install && npm run ios:sim                 │  │
│  │                                                              │  │
│  │  → Simulator reloads, you test                              │  │
│  │                                                              │  │
│  │  You: "Login screen doesn't appear, goes straight to main"  │  │
│  │  Claude CLI: *Checks RootNavigator Redux state*             │  │
│  │  Claude CLI: *Fixes hydration logic, commits*               │  │
│  │  Claude CLI: npm run ios:watch (enables hot reload)         │  │
│  │                                                              │  │
│  │  → Changes appear instantly, you verify                     │  │
│  │                                                              │  │
│  │  You: "Perfect! Now test pose detection"                    │  │
│  │  Claude CLI: *Monitors camera permissions, model loading*   │  │
│  │  Claude CLI: npm run ios:validate (runs full validation)    │  │
│  │                                                              │  │
│  │  → All tests pass, you approve                              │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  OUTPUT: Validated, device-tested, deployment-ready builds         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Phase 1: Claude Code Web Execution (Gates 1-5)

### What Claude Code Web Does Autonomously

#### Gate 1: Prepare Runtime Dependencies
**Claude Web Actions:**
```json
// Update package.json
{
  "dependencies": {
    "@tensorflow/tfjs": "^4.11.0",
    "@tensorflow/tfjs-react-native": "^0.8.0",
    "@mediapipe/pose": "^0.5.1675469404",
    "@mediapipe/camera_utils": "^0.3.1675467950",
    "react-native-ytdl": "^3.0.0",
    "react-native-fs": "^2.20.0"
  }
}
```

- Replace dynamic `require()` with static `import` statements
- Add type declarations in `src/types/mediapipe.d.ts`
- Create smoke test scaffolding in `__tests__/smoke/`
- Remove unused dependencies (Firebase, Skia)
- **Commit and push to branch**

**Handoff Point:** "✅ Gate 1 code complete - Ready for local dependency installation"

---

#### Gate 2: Restore Secure Authentication (100% Web)
**Claude Web Actions:**
- Fix `src/navigation/RootNavigator.tsx:54-55` (wire Redux selectors)
- Verify Redux auth state structure in `src/store/slices/userSlice.ts`
- Add navigation guard tests with React Navigation Testing Library
- Test auth flow transitions (logged out → login → onboarded → main)
- **Commit and push**

**Verification:** Unit tests pass, no manual device testing needed

---

#### Gate 3: Eliminate Production Mocks (100% Web)
**Claude Web Actions:**
- Remove `try-catch` fallback mocks from `youtubeService.ts:6-23`
- Audit all services for mock pathways
- Add structured error handling with user-facing messages
- Add error boundary components
- Test error paths with Jest
- **Commit and push**

**Verification:** Unit tests pass, error handling tested

---

#### Gate 4: Feature Completeness (100% Web)
**Claude Web Actions:**
- Implement full `ExerciseSummary.tsx` (form analysis, metrics, feedback)
- Implement full `ProgressChart.tsx` (Victory Native charts, data viz)
- Add charting library: `npm install victory-native`
- Wire components to Redux data sources
- Add snapshot tests
- **Commit and push**

**Verification:** Component tests pass, snapshot tests generated

---

#### Gate 5: TypeScript Integrity (100% Web)
**Claude Web Actions:**
- Fix all 232 TypeScript errors systematically
- Align `tsconfig.json` ↔ `babel.config.js` path aliases
- Add type definitions for MediaPipe, TensorFlow, ytdl, RNFS
- Fix Redux slice exports
- Fix React component prop types
- Enable strict mode
- **Commit and push**

**Verification:** `npm run type-check` → **0 errors**

---

### Phase 1 Deliverable

**Branch State After Phase 1:**
```
✅ All source code changes complete
✅ 232 TypeScript errors → 0 errors
✅ Authentication wired to Redux (no bypass)
✅ Production mocks removed (fail-fast errors)
✅ ExerciseSummary & ProgressChart fully implemented
✅ package.json contains all dependencies
✅ Type declarations added
✅ All unit tests passing
```

**Status:** Ready for local native validation

---

## 🔧 Phase 2: Claude Code CLI Execution (Gate 1 Validation + Gate 6)

### Handoff Protocol: Web → CLI

#### Step 1: You Switch to Local Environment
```bash
# On your macOS machine
cd ~/PhysioAssist

# Pull the branch from Phase 1
git fetch origin
git checkout claude/component-testing-validation-011CUqxXZunTiEEsDtPAqKYX
git pull

# Open Claude Code CLI
claude code .
```

#### Step 2: Claude Code CLI Takes Over

**What Claude CLI Can Now Do (That Web Cannot):**
- Execute `npm install`, `pod install`, `gradle sync`
- Run `npm run ios:sim` and monitor iOS Simulator
- Use your bridge infrastructure:
  - `npm run claude:bridge` - JSON API for build status
  - `npm run claude:iterate` - Auto-fix iteration mode
  - `npm run ios:watch` - Hot reload with file watching
  - `npm run ios:validate` - Comprehensive device validation
- Analyze Xcode build errors and fix native issues
- Monitor simulator logs in real-time
- Profile performance with Instruments
- Run E2E tests with Detox on simulator
- Iterate fixes while you watch and provide feedback

---

### Gate 1 Validation (Claude CLI + You)

**Scenario: Native Dependency Installation**

```
You: "Claude, install all dependencies and get the app running on iOS Simulator"

Claude CLI: "Starting Gate 1 native dependency installation..."

[Claude CLI executes:]
$ npm install
✓ Installed 6 new packages (TensorFlow, MediaPipe, ytdl, RNFS)
✓ No dependency conflicts

$ cd ios && pod install
Analyzing dependencies
Downloading dependencies
Installing TensorFlowLiteC (2.13.0)
Installing RNFSPackage (2.20.0)
✓ Pod installation complete

$ npm run ios:sim
Launching iPhone 15 Pro simulator...
Building PhysioAssist...

[ERROR] ld: framework not found TensorFlowLiteC
[ERROR] Build failed

Claude CLI: "I see a linker error. TensorFlow framework isn't linked correctly.
Let me check the Podfile configuration..."

[Claude CLI reads ios/Podfile, adds post_install hook:]

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
    end
  end
end

[Claude CLI executes:]
$ pod install
$ npm run ios:sim

Building PhysioAssist...
✓ Build succeeded
Installing on iPhone 15 Pro...
✓ App installed
Launching app...

[CRASH] Cannot find module '@tensorflow/tfjs'

Claude CLI: "The app is crashing because Metro bundler isn't loading the new
dependencies. Let me reset the cache..."

$ npm start -- --reset-cache
✓ Metro cache cleared
$ npm run ios:sim

✓ App launching...
✓ App rendered successfully!

Console output: "PoseDetectionService initialized successfully"

Claude CLI: "✅ Gate 1 validation complete! The app is running on simulator
with all dependencies loaded. Here's what I verified:

1. ✅ All 6 dependencies installed (npm, pods)
2. ✅ Native modules linked (TensorFlow, RNFS)
3. ✅ Metro bundler loading new packages
4. ✅ App launches without MODULE_NOT_FOUND errors
5. ✅ Pose detection service initializes

You should now see the app on your simulator. Can you confirm it's working?"

You: "Yes! I see the main screen. Let me try the pose detection feature..."
You: "Hmm, camera permission is being requested but the pose overlay isn't showing"

Claude CLI: "Let me check the camera permission flow and MediaPipe model loading..."

[Iteration continues...]
```

---

### Gate 6: Integrated System Validation (Claude CLI + You)

**Scenario: E2E Testing and Performance Validation**

```
You: "Claude, let's run the full validation suite and prepare for deployment"

Claude CLI: "Starting Gate 6 system validation. I'll run E2E tests, performance
profiling, and generate deployment artifacts."

[Claude CLI executes:]
$ npm run ios:validate

🧪 iOS On-Device Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Running Gate Validation...
✓ Gate 1: Dependencies - PASS
✓ Gate 2: Authentication - PASS
✓ Gate 3: No Mocks - PASS
✓ Gate 4: Components Complete - PASS
✓ Gate 5: TypeScript Clean - PASS

⚡ Running Performance Tests...
Launching Instruments...
Recording 30-second trace...
✓ Cold start: 3.2s (target: <5s) ✅
✓ Pose detection FPS: 24 fps (target: ≥20 fps) ✅
✓ Memory usage: 187 MB (target: <300 MB) ✅

💾 Running Memory Leak Detection...
✓ No memory leaks detected

🎯 Running Pose Detection Validation...
✓ MoveNet model loaded
✓ MediaPipe model loaded
✓ Camera permissions configured
✓ Pose landmarks detected successfully

📱 Running E2E Tests (Detox)...
✓ Authentication flow (login → onboarding → main)
✓ Pose detection screen (camera → detection → feedback)
✓ Exercise recording (record → save → review)
✓ Video comparison (YouTube URL → download → compare)
✓ Progress charts (data load → render → interaction)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Validation Complete!

Summary:
  Gate Validation: ✅ PASS (5/5 gates)
  Performance: ✅ PASS (all metrics within targets)
  Memory: ✅ PASS (no leaks detected)
  Pose Detection: ✅ PASS (models functional)
  E2E Tests: ✅ PASS (5/5 scenarios)

Results saved to: test-results/ios/validation-report-20251107-143022.txt

Claude CLI: "🎉 All validations passed! Here's the summary:

**Performance Metrics:**
- Cold start: 3.2s (32% under target)
- Pose detection: 24 FPS (20% above target)
- Memory: 187 MB (37% under target)

**Test Coverage:**
- Unit tests: 94% coverage
- E2E tests: 5/5 critical paths validated
- Gate validation: 100% passing

**Deployment Readiness:**
✅ No TypeScript errors
✅ No production mocks
✅ Authentication enforced
✅ Performance within targets
✅ No memory leaks
✅ All features functional

Next steps:
1. Review test results in test-results/ios/
2. Create release build: npm run ios:build --release
3. Submit to TestFlight for beta testing

Would you like me to generate the release build now?"

You: "Yes, let's create the release build"

Claude CLI: "Generating iOS release build..."

$ xcodebuild -workspace ios/PhysioAssist.xcworkspace \
  -scheme PhysioAssist \
  -configuration Release \
  -archivePath ios/build/PhysioAssist.xcarchive \
  archive

✓ Archive created
✓ Exporting IPA...
✓ Release build complete: ios/build/PhysioAssist.ipa

Claude CLI: "✅ Release build ready!

Build artifacts:
- ios/build/PhysioAssist.xcarchive
- ios/build/PhysioAssist.ipa

Next: Upload to App Store Connect with Xcode or use:
$ xcrun altool --upload-app --file ios/build/PhysioAssist.ipa \
  --type ios --username YOUR_APPLE_ID

Gate 6 complete! 🚀"
```

---

## 🔄 Iterative Refinement Workflow

### The Power of Claude CLI + Your Observation

**Key Advantage:** You watch the simulator/device while Claude CLI iterates fixes in real-time.

### Example: Debugging Pose Detection Issue

```
You: "Claude, the pose detection overlay is jittery and drops frames"

Claude CLI: "Let me analyze the pose detection performance..."

[Claude CLI reads:]
- src/services/poseDetectionService.ts
- src/screens/PoseDetectionScreen.tsx
- src/components/PoseOverlay.tsx

Claude CLI: "I see the issue. The pose overlay is re-rendering on every frame
because we're not memoizing the landmark data. Let me fix this..."

[Claude CLI edits PoseOverlay.tsx:]

const MemoizedPoseLandmarks = React.memo(
  ({ landmarks }) => {
    // Render logic
  },
  (prev, next) => {
    // Only re-render if landmarks actually changed
    return prev.landmarks === next.landmarks;
  }
);

[Since you're running `npm run ios:watch`, changes hot-reload instantly]

Claude CLI: "Changes applied. The overlay should be smoother now. Can you test?"

You: "Much better! FPS is solid now. But I notice a delay when I first open the camera"

Claude CLI: "That's likely the model initialization. Let me add pre-loading..."

[Claude CLI modifies initializationService.ts to preload pose models on app startup]

Claude CLI: "Now the models load during app launch instead of when you open the
camera. Try closing and reopening the app..."

You: "Perfect! Instant now. Great work!"

Claude CLI: "Excellent! Let me commit these performance improvements and run
the validation suite again to ensure we didn't break anything..."

$ git add .
$ git commit -m "⚡ Optimize pose detection: memoize overlays, preload models"
$ npm run ios:validate

✓ All tests still passing
✓ Performance improved: FPS 24 → 29

Claude CLI: "Performance optimizations committed. Ready for next task!"
```

---

## 🎯 Using Your Existing Bridge Infrastructure

### Available Commands (Already Built!)

#### 1. Claude Bridge (JSON API)
```bash
$ npm run claude:bridge status

{
  "success": true,
  "message": "Bridge status",
  "data": {
    "status": "running",
    "metro_running": true,
    "simulator_booted": true,
    "build_status": "success",
    "xcode_open": false
  }
}
```

**Claude CLI can use this to:**
- Check if Metro is running before launching
- Verify simulator state
- Monitor build status programmatically

---

#### 2. Auto-Iterate Mode
```bash
$ npm run claude:iterate
```

**What it does:**
- Watches for file changes
- Auto-runs validation on save
- Provides feedback loop for Claude CLI

**Usage in CLI session:**
```
You: "Claude, enable auto-iterate mode while I test features"

Claude CLI: "Starting auto-iterate mode..."

$ npm run claude:iterate

⚡ Auto-Iterate Mode Active
📁 Watching: src/
✓ Metro bundler ready
✓ Simulator ready

[You test features, Claude CLI watches logs and automatically fixes issues]
```

---

#### 3. Watch Mode (Hot Reload)
```bash
$ npm run ios:watch
```

**Perfect for iterative development:**
- You describe what's wrong
- Claude CLI fixes the code
- Changes appear instantly in simulator
- You verify immediately

---

#### 4. Validation Suite
```bash
$ npm run ios:validate
```

**Claude CLI uses this to:**
- Run all gate validators
- Profile performance
- Detect memory leaks
- Validate pose detection
- Generate comprehensive reports

---

## 📋 Complete Workflow Example (End-to-End)

### Day 1: Claude Code Web Session (2-4 hours)

**You:**
"Claude, execute Gates 1-5 of the remediation plan. Fix all code issues, TypeScript errors, and complete the stub components."

**Claude Web:**
- ✅ Gate 1: Updates package.json, adds type definitions
- ✅ Gate 2: Fixes authentication bypass
- ✅ Gate 3: Removes production mocks
- ✅ Gate 4: Implements ExerciseSummary and ProgressChart
- ✅ Gate 5: Fixes all 232 TypeScript errors
- ✅ Commits and pushes to branch

**Output:** "✅ Gates 1-5 complete. All code changes pushed to `claude/component-testing-validation-011CUqxXZunTiEEsDtPAqKYX`. Ready for local validation."

---

### Day 2: Claude Code CLI Session (2-3 hours)

**On your macOS:**

```bash
$ cd ~/PhysioAssist
$ git pull origin claude/component-testing-validation-011CUqxXZunTiEEsDtPAqKYX
$ claude code .
```

**Claude CLI Session:**

```
You: "Install dependencies and get the app running on simulator"

Claude CLI:
$ npm install
$ cd ios && pod install
$ npm run ios:sim
[Fixes any native linking issues]
✅ App running on simulator

You: "Login screen looks good. Test pose detection"

Claude CLI:
[Monitors camera permissions, model loading]
[You test, find jittery overlay]

You: "Pose overlay is jittery"

Claude CLI:
[Analyzes, adds memoization]
[Hot-reloads via npm run ios:watch]
✅ Fixed, you verify instantly

You: "Perfect! Run full validation suite"

Claude CLI:
$ npm run ios:validate
✅ All tests pass
✅ Performance within targets
✅ Ready for deployment

You: "Create release build"

Claude CLI:
$ xcodebuild archive...
✅ Release build created
✅ Ready for App Store submission
```

**Total time:** 2-3 hours of collaborative iteration

---

## 🎉 Benefits of This Workflow

### For You:
- ✅ **Visual feedback** - Watch the app while Claude CLI fixes issues
- ✅ **Real-time collaboration** - Describe what you see, Claude CLI fixes immediately
- ✅ **Leverage your tooling** - Uses the bridges you've already built
- ✅ **Faster iteration** - Hot reload means instant verification
- ✅ **Confidence** - Test on real simulators/devices, not just code analysis

### For Claude Code:
- ✅ **Web phase** - Autonomous execution of all code changes (80%)
- ✅ **CLI phase** - Access to native tooling and real devices (20%)
- ✅ **Complete workflow** - No "handoff gaps", continuous collaboration
- ✅ **Error recovery** - Can test fixes immediately and iterate

### For the Project:
- ✅ **Higher quality** - Real device testing catches issues static analysis misses
- ✅ **Faster delivery** - Parallel execution (web) + collaborative iteration (CLI)
- ✅ **Better coverage** - E2E tests, performance profiling, memory validation
- ✅ **Deployment ready** - Final artifacts tested and verified on real hardware

---

## 🚀 Next Steps

### Option 1: Start Phase 1 Now (Recommended)
"Claude, execute Gates 1-5 in Claude Code Web. I'll switch to CLI when you're done."

**Timeline:**
- Web execution: 4-8 hours (autonomous)
- CLI validation: 2-3 hours (collaborative)
- **Total:** 6-11 hours to deployment-ready state

### Option 2: Just Fix TypeScript (Gate 5)
"Claude, focus on Gate 5 only - fix all 232 TypeScript errors so builds work."

**Timeline:**
- Web execution: 2-4 hours
- CLI validation: 30 mins (verify builds)

### Option 3: Test the CLI Workflow First
"Claude, let's test the CLI workflow with a small change so I understand the collaboration model."

**Timeline:** 30 mins to verify workflow

---

## 📞 Summary

This workflow transforms the gated remediation plan from a sequential "handoff" approach to a **continuous collaboration model**:

1. **Claude Code Web** - Autonomous execution of all source code changes
2. **Git push** - Seamless transition point
3. **Claude Code CLI** - Collaborative validation with you watching the simulator
4. **Iterative refinement** - Real-time fixes based on your observations
5. **Deployment artifacts** - Fully tested, validated builds ready for App Store

Your existing bridge infrastructure (`claude:bridge`, `claude:iterate`, `ios:watch`) makes this workflow seamless and powerful.

**Ready to start?** Let me know which phase you'd like to begin with! 🚀
