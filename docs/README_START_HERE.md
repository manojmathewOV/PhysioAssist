# PhysioAssist Development - START HERE
## Complete Guide for AI-Driven Development with Minimal Local Intervention

> **Last Updated:** November 8, 2025
> **Status:** All planning and documentation complete, ready to begin Gate 0
> **Your Role:** Oversee AI development, validate final steps locally with Claude Code CLI

---

## 🎯 What Has Been Completed

### Complete Documentation Suite

All planning, architecture, and workflow documentation is now complete:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **AI_DEVELOPER_MANUAL.md** | Guide for AI developer (Claude on web) | AI reads this to understand workflow |
| **DEVELOPER_GATE_ROADMAP.md** | Your working roadmap (11 sequential gates) | Daily reference for current gate |
| **MASTER_ROADMAP_2025.md** | 12-week stakeholder roadmap | Show to team/investors |
| **ROADMAP_INTEGRATION_ANALYSIS.md** | G1-G5 vs Gates 7-12 comparison | Context for decisions made |
| **DEEP_ANALYSIS_ARCHITECTURE_STATE.md** | Technical architecture analysis | Understand current vs target state |
| **gated-testing-plan.md** | Rigorous testing strategy | Understand testing gates |

---

## 📚 How This Works: AI Development with Minimal Local Work

```
┌────────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT FLOW                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  95% of Work: AI in Cloud (Claude on Web + Cloud Labs)        │
│  ├─ Static code analysis                                      │
│  ├─ Code generation & refactoring                             │
│  ├─ Unit tests (≥95% coverage)                                │
│  ├─ Integration tests (mocked dependencies)                   │
│  ├─ Performance benchmarks                                    │
│  ├─ Mutation testing                                          │
│  ├─ Documentation generation                                  │
│  └─ Creates handoff documents                                 │
│                                                                │
│  5% of Work: You on MacOS with Claude Code CLI                │
│  ├─ Final real-world testing (iOS simulator/device)           │
│  ├─ Validation guided by Claude Code CLI                      │
│  ├─ Iterative fixes (describe issue to Claude in plain English│
│  └─ Mark gate complete (Claude updates progress tracker)      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Principle:** You never write code manually. Claude Code CLI guides you through natural language.

---

## 🚀 Getting Started: First Steps

### 1. Review the Developer Roadmap

**Open:** `docs/planning/DEVELOPER_GATE_ROADMAP.md`

This is your **working roadmap**. It has 11 sequential gates:

```
Gate 0:  Toolchain & Build Sanity
Gate 1:  Remove Camera/Pose Mocks
Gate 2:  Integrate One-Euro Filter
Gate 3:  Replace Clinical Threshold Placeholders
Gate 4:  Real Device Health Monitoring
Gate 5:  Telemetry & Production Monitoring
Gate 6:  Audio Feedback & Accessibility
Gate 7:  Primary Joint Focus
Gate 8:  YouTube Templates & Prescription API
Gate 9:  Comprehensive Testing
Gate 10: Beta Field Trial
```

Each gate has:
- **Objective:** What you're building
- **Current State:** What exists (with line numbers)
- **Tasks:** Step-by-step checklist
- **Testing:** How to validate
- **Exit Criteria:** Binary GO/NO-GO
- **Estimated Effort:** Rough guideline (but ship when ready, not when scheduled)

### 2. Understand the AI Workflow

**Open:** `docs/AI_DEVELOPER_MANUAL.md`

This is the **AI developer's bible**. It explains:

- **Phase 1:** What files to read for each gate
- **Phase 2:** How to proceed (8-step workflow per gate)
- **Phase 3:** How to test rigorously (90% cloud, 10% local)
- **Phase 4:** What AI can do in cloud vs what needs local
- **Phase 5:** How local handoff works (minimal, guided by Claude Code CLI)
- **Phase 6:** How progress is tracked
- **Phase 7:** How AI learns and improves
- **Phase 8:** Complete example (Gate 1 from start to finish)

**AI developer (Claude on web) reads this to understand the workflow.**

### 3. Track Progress

**File:** `docs/planning/GATE_PROGRESS.md` (create this file)

AI will maintain this file and update it after every task:

```markdown
# Gate Progress Tracker

Last Updated: [timestamp]
Current Gate: Gate 0 (Toolchain Sanity)

## Gate 0: Toolchain & Build Sanity ⚪ NOT STARTED
- [ ] CI pipeline created
- [ ] Git hooks configured
- [ ] Security scan passing
- [ ] Linting rules enforced

## Gate 1: Remove Camera Mocks ⚪ NOT STARTED
...
```

Check this file to see current status.

---

## 🔄 Typical Gate Workflow

### Phase 1: AI Development in Cloud (Web-Based Claude)

**AI does everything:**

1. **Analyze** current codebase state
   - Reads relevant files
   - Identifies mocks/stubs/placeholders
   - Documents findings

2. **Plan** implementation
   - Breaks into sub-tasks
   - Creates test plan
   - Identifies local dependencies

3. **Implement** with tests
   - Writes code
   - Writes comprehensive unit tests
   - Adds documentation

4. **Test rigorously**
   - Runs unit tests (≥95% coverage)
   - Runs integration tests (mocked dependencies)
   - Runs static analysis (typecheck, lint, security)
   - Runs performance benchmarks
   - Runs mutation testing

5. **Document everything**
   - Test reports
   - Progress tracker updates
   - Architecture decision records (if significant choices)

6. **Create handoff** (if local testing needed)
   - Handoff document with step-by-step instructions
   - Local test scripts (automated)
   - Troubleshooting guide

**You see:** Progress updates in `GATE_PROGRESS.md`

### Phase 2: Local Validation on Your MacOS (5% of Work)

**When AI completes cloud work, you receive:**

- Notification: "Gate X ready for local testing"
- Document: `docs/gates/GATE_X_LOCAL_HANDOFF.md`

**You do:**

1. **Open Claude Code CLI**
   ```bash
   cd ~/PhysioAssist
   claude
   ```

2. **Ask Claude to guide you**
   ```
   You: "Walk me through Gate 1 local testing"

   Claude: "I'll guide you step by step.
            First, syncing code from cloud..."
            [Runs: git pull]

            "Installing dependencies..."
            [Runs: npm install && cd ios && pod install]

            "Running camera permission test..."
            [Runs: npm run e2e:ios -- --testNamePattern "SetupWizard"]

            "✅ Camera test passed.
             Next, testing lighting detection.
             Please cover your camera..."
   ```

3. **Follow Claude's instructions**
   - Claude runs tests
   - Claude interprets results
   - You validate visually (e.g., "Does the warning show when I cover the camera?")

4. **If test fails, describe issue to Claude**
   ```
   You: "The lighting test failed. It didn't warn me when I covered the camera."

   Claude: [Analyzes logs]
           "I see the issue. The MIN_BRIGHTNESS threshold is too high.
            Lowering it from 100 to 80..."
           [Edits: src/utils/realFrameAnalysis.ts]

           "Running test again..."
           [Re-runs test]

           "✅ Test now passing. Brightness threshold tuned."
   ```

5. **Mark gate complete**
   ```
   You: "All tests passed. What's next?"

   Claude: [Updates: docs/planning/GATE_PROGRESS.md]
           "Gate 1 complete! Moving to Gate 2: Smoothing integration..."
   ```

**You never:**
- Write code manually
- Edit files in Xcode
- Debug with breakpoints
- Read TypeScript errors

**You only:**
- Run commands Claude suggests
- Describe what you see in plain English
- Validate visual results (e.g., "Yes, the warning appeared")

---

## 📖 How to Use Documentation

### Daily Development

**Your workflow:**

1. **Check current gate**
   ```bash
   cat docs/planning/GATE_PROGRESS.md
   # See: Gate 1 is 80% complete (cloud), 20% pending local
   ```

2. **If cloud work in progress**
   - AI is working, check back later
   - Watch for updates to `GATE_PROGRESS.md`

3. **If local work ready**
   - Open: `docs/gates/GATE_X_LOCAL_HANDOFF.md`
   - Follow instructions with Claude Code CLI

4. **If gate complete**
   - Move to next gate in `DEVELOPER_GATE_ROADMAP.md`
   - Repeat

### Reference Documentation

**When you need context:**

| Need | Read |
|------|------|
| Why is this gate necessary? | `DEVELOPER_GATE_ROADMAP.md` (gate objective) |
| What's the overall timeline? | `MASTER_ROADMAP_2025.md` (12-week view) |
| How do we test this? | `gated-testing-plan.md` (testing gates) |
| What problems were found? | `DEEP_ANALYSIS_ARCHITECTURE_STATE.md` (architecture) |
| Why was this decision made? | `docs/decisions/ADR-XXX-*.md` (decision records) |

### For Team/Stakeholders

**When presenting to others:**

- **Executives:** `MASTER_ROADMAP_2025.md` (concise, table-based)
- **Engineers:** `DEVELOPER_GATE_ROADMAP.md` (technical depth)
- **QA/Testing:** `gated-testing-plan.md` (testing strategy)
- **Clinical:** `docs/clinical/THRESHOLD_DERIVATION.md` (research citations)

---

## 🛠️ Local Setup (One-Time)

### Prerequisites

**Install once:**

1. **Xcode** (from App Store)
   - Required for iOS development
   - Includes iOS Simulator

2. **Node.js** (via Homebrew or nvm)
   ```bash
   brew install node
   # Or use nvm for version management
   ```

3. **Claude Code CLI** (already installed)
   ```bash
   # Verify:
   claude --version
   ```

4. **CocoaPods** (for iOS dependencies)
   ```bash
   sudo gem install cocoapods
   ```

### Project Setup

**First time only:**

```bash
# Clone repo (if not already)
cd ~/
git clone [repo-url] PhysioAssist
cd PhysioAssist

# Sync to AI development branch
git checkout claude/testing-validation-documentation-011CUv14uuvdCZ2RFG62FUT7

# Install dependencies
npm install

# Install iOS dependencies
cd ios
pod install
cd ..
```

**That's it!** You're ready for local testing when AI hands off.

---

## 🎯 What to Expect: Gate-by-Gate

### Gates with Minimal Local Work (<30 min)

| Gate | Local Work | Time |
|------|------------|------|
| **Gate 0** | None (100% cloud) | 0 min |
| **Gate 2** | Performance benchmarks | ~15 min |
| **Gate 3** | Validate clinical thresholds visually | ~20 min |
| **Gate 5** | Check telemetry dashboard | ~10 min |
| **Gate 7** | Test primary joint focus UI | ~15 min |

### Gates with Moderate Local Work (30-60 min)

| Gate | Local Work | Time |
|------|------------|------|
| **Gate 1** | E2E tests (camera, lighting, distance) | ~30 min |
| **Gate 6** | Accessibility testing (screen reader, voice) | ~45 min |
| **Gate 8** | YouTube template UI testing | ~30 min |
| **Gate 9** | Comprehensive test suite | ~60 min |

### Gates with Significant Local Work (1-2 hours)

| Gate | Local Work | Time |
|------|------------|------|
| **Gate 4** | Device health (thermal, memory) - requires stress testing | ~90 min |
| **Gate 10** | Beta field trial - recruiting, onboarding users | ~2 hours |

**Total estimated local time:** ~8 hours across all 11 gates

---

## 🐛 Troubleshooting Common Issues

### "Tests are failing locally but passed in cloud"

**Likely causes:**
- Environment differences (Node version, dependency versions)
- Real device behavior differs from mocks

**Solution:**
```
You: "Tests passed in cloud but failing locally. Error: [paste error]"

Claude: [Analyzes difference]
        "This is because local uses real VisionCamera, cloud used mock.
         Adjusting threshold..."
        [Fixes and re-runs]
```

### "Xcode won't build"

**Likely causes:**
- CocoaPods not updated
- Provisioning profile issues

**Solution:**
```
You: "Xcode build failed. Error: [paste error]"

Claude: "Looks like CocoaPods need updating.
         Running: cd ios && pod install && cd .."
        [Runs command]
        "Try building again."
```

### "App crashes on simulator"

**Likely causes:**
- Permissions not requested
- Native module not linked

**Solution:**
```
You: "App crashes immediately. Logs: [paste crash log]"

Claude: [Analyzes crash]
        "Missing camera permission.
         Adding NSCameraUsageDescription to Info.plist..."
        [Edits file]
        "Rebuild and run."
```

**Pattern:** Describe symptoms in plain English, Claude diagnoses and fixes.

---

## 📊 Progress Visibility

### Daily Checks

**Ask Claude Code CLI:**
```
You: "What's the current status?"

Claude: "Currently in Gate 1 (Remove Camera Mocks).
         Cloud work: 80% complete
         - ✅ Real frame analysis implemented
         - ✅ Unit tests passing (20/20)
         - ✅ Integration tests passing
         - ⏳ E2E tests ready for local validation

         Next: Run local tests (see docs/gates/GATE_1_LOCAL_HANDOFF.md)"
```

### Weekly Summaries

**Ask Claude Code CLI:**
```
You: "Summarize progress this week"

Claude: "Week of Nov 4-10:
         - ✅ Completed: Gate 0 (Toolchain)
         - ✅ Completed: Gate 1 (Camera Mocks) - 95% cloud, 5% local
         - 🔄 In Progress: Gate 2 (Smoothing) - 60% complete

         Metrics:
         - 487 lines of code written
         - 245 lines of tests written
         - 98.3% test coverage
         - 0 blocking issues

         Next week goal: Complete Gate 2, start Gate 3"
```

### Milestone Tracking

**Check:** `docs/planning/GATE_PROGRESS.md`

Visual progress:
```
Gate 0: ✅ COMPLETE
Gate 1: ✅ COMPLETE
Gate 2: 🔄 IN PROGRESS (60%)
Gate 3: ⚪ NOT STARTED
...
```

---

## 🎓 Learning Resources

### Understanding the Codebase

**Start here:**
1. `docs/architecture/DEEP_ANALYSIS_ARCHITECTURE_STATE.md`
   - Current architecture
   - What works, what doesn't
   - Integration gaps

2. `docs/planning/DEVELOPER_GATE_ROADMAP.md`
   - What we're building
   - Why each gate matters

3. Ask Claude Code CLI:
   ```
   You: "Explain the pose detection pipeline"

   Claude: [Draws ASCII diagram]
           "Camera → VisionCamera Frame Processor (JSI) →
            PoseDetectionService (TFLite Model) →
            Pose Landmarks (17 points) →
            Redux Store (poseSlice) →
            UI Components"
   ```

### Clinical/Medical Context

**Read:**
- `src/features/videoComparison/config/clinicalThresholds.ts`
  - Research citations (AAOS, IJSPT, JOSPT)
  - Why specific thresholds chosen

- `docs/clinical/THRESHOLD_DERIVATION.md` (AI will create during Gate 3)
  - How thresholds map to MoveNet model
  - Clinical validation approach

**Ask Claude:**
```
You: "Why is knee valgus angle threshold 8 degrees?"

Claude: "8° is the conservative threshold for frontal plane projection angle (FPPA)
         from IJSPT research. Above 8-10° indicates increased ACL injury risk.

         Source: 'IJSPT - Frontal Plane Projection Angle (FPPA) as 2D valgus proxy'

         We use 8° for warning, 10° for critical alert."
```

---

## 🚀 Next Steps

### Immediate (Today)

1. **Review this document** (you just did! ✅)

2. **Review Developer Roadmap**
   ```bash
   open docs/planning/DEVELOPER_GATE_ROADMAP.md
   # Or: cat docs/planning/DEVELOPER_GATE_ROADMAP.md
   ```

3. **Review AI Developer Manual**
   ```bash
   open docs/AI_DEVELOPER_MANUAL.md
   ```

4. **Ensure local setup complete**
   ```bash
   # Verify tools installed
   node --version
   npm --version
   pod --version
   claude --version
   ```

### Short-Term (This Week)

5. **Start Gate 0** (AI will handle, 100% cloud)
   - CI pipeline setup
   - Git hooks configuration
   - Security scanning
   - Toolchain documentation

6. **Wait for Gate 0 completion**
   - AI will update `GATE_PROGRESS.md`
   - No local work needed

7. **Move to Gate 1**
   - AI does cloud work (80%)
   - You do local validation (20%, ~30 min)

### Medium-Term (Next 2-4 Weeks)

8. **Complete Gates 1-5**
   - Core functionality
   - Device health
   - Telemetry

9. **Review beta field trial plan** (Gate 10)
   - Recruit 5-10 volunteers
   - Prepare testing protocol

### Long-Term (Future)

10. **Clinical pilot study** (post-Gate 10)
    - Only if beta succeeds
    - Requires IRB approval
    - Separate planning document

---

## 📝 Key Files Reference

### Must-Read Documents

| File | Purpose | Read When |
|------|---------|-----------|
| **README_START_HERE.md** | This file - overview | First time, orientation |
| **DEVELOPER_GATE_ROADMAP.md** | Your working roadmap | Daily, check current gate |
| **AI_DEVELOPER_MANUAL.md** | AI workflow guide | When curious how AI works |
| **GATE_PROGRESS.md** | Live progress tracker | Daily, check status |

### Supporting Documents

| File | Purpose | Read When |
|------|---------|-----------|
| **MASTER_ROADMAP_2025.md** | Stakeholder roadmap | Presenting to team |
| **ROADMAP_INTEGRATION_ANALYSIS.md** | Decision context | Understanding strategy |
| **DEEP_ANALYSIS_ARCHITECTURE_STATE.md** | Technical architecture | Understanding codebase |
| **gated-testing-plan.md** | Testing strategy | Understanding quality gates |

### Generated Documents (AI Creates)

| File | Purpose | Created When |
|------|---------|--------------|
| **docs/gates/GATE_X_LOCAL_HANDOFF.md** | Local testing guide | Gate needs local validation |
| **docs/test-reports/gate-X-YYYY-MM-DD.md** | Test results | After each testing session |
| **docs/decisions/ADR-XXX-TITLE.md** | Architecture decisions | Significant choice made |
| **docs/patterns/PATTERN_NAME.md** | Reusable patterns | Pattern discovered |

---

## ✅ Summary: What You Need to Know

### AI Does 95% of Work
- Code generation
- Unit & integration testing (≥95% coverage)
- Documentation
- Performance benchmarks
- Static analysis
- Progress tracking

### You Do 5% of Work
- Final validation on real iOS device/simulator
- Guided by Claude Code CLI (natural language)
- Describe issues, Claude fixes
- ~8 hours total across all gates

### How to Succeed
1. **Trust the process** - AI handles complexity
2. **Check progress daily** - Review `GATE_PROGRESS.md`
3. **Follow handoff docs** - Step-by-step when local work needed
4. **Describe issues in plain English** - Claude diagnoses and fixes
5. **Don't rush** - Ship when ready, not when scheduled

### When to Get Help
- **Technical blocker:** Ask Claude Code CLI
- **Strategy question:** Review roadmap documents
- **Clinical question:** Check research citations in code
- **Stakeholder question:** Use `MASTER_ROADMAP_2025.md`

---

## 🎉 You're Ready!

Everything is in place to begin development with minimal manual intervention.

**Next action:** AI starts Gate 0 (Toolchain Sanity)

**Your action:** None right now. Wait for Gate 0 completion notification.

**Questions?** Ask Claude Code CLI:
```bash
cd ~/PhysioAssist
claude

You: "I just read README_START_HERE. What should I do next?"

Claude: [Guides you through next steps]
```

---

**Good luck! 🚀**

---

**Document Owner:** AI + User (collaborative)
**Last Updated:** November 8, 2025
**Status:** Complete and ready for Gate 0 kickoff
