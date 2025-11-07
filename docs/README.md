# PhysioAssist Documentation

Organized documentation for the PhysioAssist project.

## 📁 Directory Structure

```
docs/
├── planning/              # Implementation plans and project planning
├── ios-guides/           # iOS development and Claude Code CLI guides
├── workflow-templates/   # GitHub workflow templates
└── *.md                  # Core documentation files
```

---

## 🚀 Quick Start

**New to the project?**
- Read the main [README.md](../README.md) in the project root
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions

**iOS Development:**
- See [ios-guides/](./ios-guides/) folder for comprehensive iOS/Xcode guides
- Quick reference: [ios-guides/IOS_QUICK_REFERENCE.md](./ios-guides/IOS_QUICK_REFERENCE.md)
- Mac setup: [ios-guides/MAC_QUICK_START.md](./ios-guides/MAC_QUICK_START.md)

**Testing:**
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing documentation
- [IOS_TESTING_GUIDE.md](./IOS_TESTING_GUIDE.md) - iOS-specific testing
- [TESTING_QUICK_REFERENCE.md](./TESTING_QUICK_REFERENCE.md) - Quick commands

---

## 📚 Core Documentation

### Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design patterns
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment procedures and configuration
- **[UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)** - UX enhancements and guidelines

### Testing
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing documentation
- **[IOS_TESTING_GUIDE.md](./IOS_TESTING_GUIDE.md)** - iOS testing guide
- **[IOS_SIMULATOR_TESTING.md](./IOS_SIMULATOR_TESTING.md)** - Simulator testing
- **[MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md)** - Manual QA checklist
- **[UI_TESTING_GUIDE.md](./UI_TESTING_GUIDE.md)** - UI/UX testing
- **[VISUAL_TESTING.md](./VISUAL_TESTING.md)** - Visual regression testing
- **[TESTING_QUICK_REFERENCE.md](./TESTING_QUICK_REFERENCE.md)** - Quick commands

### Video Comparison Feature

**Implementation Documentation:**
- **[IMPLEMENTATION_SCOPE.md](./IMPLEMENTATION_SCOPE.md)** - Feature scope and boundaries
- **[IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md)** - Implementation status
- **[IMPLEMENTATION_STATUS_SUMMARY.md](./IMPLEMENTATION_STATUS_SUMMARY.md)** - Complete summary

**Error Detection System:**
- **[ERROR_DETECTION_IMPLEMENTATION_COMPLETE.md](./ERROR_DETECTION_IMPLEMENTATION_COMPLETE.md)** - Implementation summary
- **[CLINICAL_VALIDATION_PROTOCOL.md](./CLINICAL_VALIDATION_PROTOCOL.md)** - Clinical validation guide
- **[QUICK_START_CLINICAL_VALIDATION.md](./QUICK_START_CLINICAL_VALIDATION.md)** - Quick start guide

**Planning Documents** (in [planning/](./planning/) folder):
- [VIDEO_COMPARISON_IMPLEMENTATION_PLAN.md](./planning/VIDEO_COMPARISON_IMPLEMENTATION_PLAN.md)
- [GATED_IMPLEMENTATION_PLAN.md](./planning/GATED_IMPLEMENTATION_PLAN.md)
- [PEER_REVIEW_ACTION_PLAN.md](./planning/PEER_REVIEW_ACTION_PLAN.md)
- [PEER_REVIEW_BRIEFING.md](./planning/PEER_REVIEW_BRIEFING.md)

### UI/UX
- **[APP_MOCKUP.html](./APP_MOCKUP.html)** - Interactive app mockup (open in browser)

---

## 🍎 iOS Development (ios-guides/)

Complete guides for iOS development with Claude Code CLI:

- **[CLAUDE_CODE_CLI_MANUAL.md](./ios-guides/CLAUDE_CODE_CLI_MANUAL.md)** - Complete manual
- **[CLAUDE_CODE_CLI_BRIDGE.md](./ios-guides/CLAUDE_CODE_CLI_BRIDGE.md)** - Bridge architecture
- **[IOS_QUICK_REFERENCE.md](./ios-guides/IOS_QUICK_REFERENCE.md)** - Quick reference
- **[MAC_QUICK_START.md](./ios-guides/MAC_QUICK_START.md)** - Mac development setup
- **[README_IOS_DOCS.md](./ios-guides/README_IOS_DOCS.md)** - iOS docs index

**Key iOS Scripts** (in `/scripts/ios/`):
- `claude-bridge.sh` - Main Claude Code CLI bridge
- `ios-cli.sh` - Interactive iOS development CLI
- `device-setup.sh` - iOS device setup automation
- `xcode-*.sh` - Xcode integration scripts

---

## 🔧 Common Tasks

### Running Tests
```bash
# All tests
npm test

# Infrastructure tests
npm run test:infrastructure

# Error detection tests
npm run test:error-detection

# Smart feedback tests
npm run test:feedback

# iOS simulator tests
npm run ios:validate
```

### iOS Development
```bash
# Run on simulator
npm run ios:sim

# Run on device
npm run ios:device

# Launch Xcode
npm run xcode

# iOS CLI
npm run ios:cli
```

### Clinical Validation
```bash
# Validate with test videos
npm run clinical:validate -- \
  --reference ./videos/ref.mp4 \
  --user ./videos/user.mp4 \
  --exercise squat

# Tune thresholds interactively
npm run clinical:tune
```

---

## 📋 Planning Documents (planning/)

Implementation plans and project planning:

- **[VIDEO_COMPARISON_IMPLEMENTATION_PLAN.md](./planning/VIDEO_COMPARISON_IMPLEMENTATION_PLAN.md)**
  Original comprehensive implementation plan for video comparison feature

- **[GATED_IMPLEMENTATION_PLAN.md](./planning/GATED_IMPLEMENTATION_PLAN.md)**
  Gated development approach with 5 gates and binary pass/fail criteria

- **[PEER_REVIEW_ACTION_PLAN.md](./planning/PEER_REVIEW_ACTION_PLAN.md)**
  Action plan addressing peer review feedback

- **[PEER_REVIEW_BRIEFING.md](./planning/PEER_REVIEW_BRIEFING.md)**
  Peer review briefing document with critical issues identified

---

## 🆘 Getting Help

**Questions about:**
- Architecture/design → See [ARCHITECTURE.md](./ARCHITECTURE.md)
- Testing → See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- iOS development → See [ios-guides/](./ios-guides/)
- Video comparison → See implementation docs above
- Clinical validation → See [CLINICAL_VALIDATION_PROTOCOL.md](./CLINICAL_VALIDATION_PROTOCOL.md)
- Deployment → See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the project root for contribution guidelines.

---

**Last Updated**: 2025-11-07
**Status**: Active development - video comparison feature complete, pending clinical validation
