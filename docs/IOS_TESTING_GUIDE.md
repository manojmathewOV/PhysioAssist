# 🍎 iOS Testing & Development Guide

Complete guide for testing and developing PhysioAssist on iOS devices and simulators using Claude Code CLI.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Testing Workflows](#testing-workflows)
5. [Iterative Development](#iterative-development)
6. [Validation & Testing](#validation--testing)
7. [Troubleshooting](#troubleshooting)
8. [Command Reference](#command-reference)

---

## 🚀 Quick Start

### Fastest Way to Get Started

```bash
# 1. Initial setup (one-time)
npm run ios:setup

# 2. Test on simulator
npm run ios:sim

# 3. Test on physical device
npm run ios:device

# 4. Enable watch mode for rapid development
npm run ios:watch
```

That's it! 🎉

---

## ✅ Prerequisites

### Required Software

1. **macOS** (required for iOS development)
2. **Xcode** (latest version)
   - Install from Mac App Store
   - Open once to accept license agreements
3. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```
4. **Node.js** (18+)
5. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

### Optional but Recommended

- **fswatch** (for watch mode)
  ```bash
  brew install fswatch
  ```
- **ios-deploy** (for device logging)
  ```bash
  npm install -g ios-deploy
  ```
- **Homebrew** (package manager)
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```

### Hardware Requirements

- **For Simulator Testing**: Any Mac with Xcode
- **For Device Testing**:
  - iOS device (iPhone/iPad)
  - USB cable
  - Apple Developer account (free or paid)

---

## 🛠️ Initial Setup

### Step 1: Check Environment

```bash
npm run ios:setup
```

This script will:
- ✅ Verify Xcode installation
- ✅ Check Command Line Tools
- ✅ Verify CocoaPods
- ✅ List connected devices
- ✅ List available simulators
- ✅ Check for development certificates
- ✅ Offer to install dependencies

### Step 2: Configure Code Signing (for Physical Devices)

1. Open Xcode:
   ```bash
   open ios/PhysioAssist.xcworkspace
   ```

2. Select **PhysioAssist** target in left sidebar

3. Go to **Signing & Capabilities** tab

4. Check **Automatically manage signing**

5. Select your **Team** (Apple Developer account)

6. Xcode will automatically create provisioning profiles

### Step 3: Trust Your Device (Physical Device Only)

1. Connect iPhone/iPad via USB
2. Unlock device
3. Tap **"Trust"** when prompted
4. Enter device passcode
5. On iOS 16+: Enable **Developer Mode** in Settings → Privacy & Security

---

## 🧪 Testing Workflows

### iOS Simulator Testing

**Quick test on default simulator (iPhone 15 Pro):**
```bash
npm run ios:sim
```

**Test on specific simulator:**
```bash
./scripts/ios/run-simulator.sh "iPhone 14"
./scripts/ios/run-simulator.sh "iPad Pro (12.9-inch)"
```

**Clean build and test:**
```bash
npm run ios:sim --clean
```

**What happens:**
1. ✅ Starts Metro bundler (if not running)
2. ✅ Boots simulator (if not booted)
3. ✅ Builds app for simulator
4. ✅ Installs app on simulator
5. ✅ Launches app
6. ✅ Hot reload enabled automatically

### Physical Device Testing

**Deploy to connected device:**
```bash
npm run ios:device
```

**Clean build and deploy:**
```bash
npm run ios:device --clean
```

**What happens:**
1. ✅ Detects connected iOS device
2. ✅ Starts Metro bundler
3. ✅ Builds app for device
4. ✅ Deploys to device
5. ✅ Launches app
6. ✅ Hot reload enabled (over WiFi)

**Requirements:**
- Device connected via USB
- Device unlocked and trusted
- Code signing configured in Xcode
- Developer Mode enabled (iOS 16+)

---

## ⚡ Iterative Development

### Watch Mode (Auto-Reload on File Changes)

**For simulator:**
```bash
npm run ios:watch
```

**For physical device:**
```bash
npm run ios:watch:device
```

**What it does:**
- 👀 Watches `src/` and `App.tsx` for changes
- 🔄 Auto-reloads app when you save files
- ⚡ Ultra-fast feedback loop (<1 second!)
- 📊 Shows which files changed

**Development workflow:**
1. Start watch mode
2. Edit any `.ts`, `.tsx`, `.js`, or `.jsx` file
3. Save file (Cmd+S)
4. App reloads automatically
5. See changes instantly!

**Example session:**
```bash
# Terminal 1: Start watch mode
npm run ios:watch

# Terminal 2: Edit files with your editor
# Changes appear automatically in simulator!
```

### Manual Reload

**Force reload (Metro must be running):**
```bash
./scripts/ios/ios-cli.sh reload
```

**Or use dev menu:**
- **Simulator**: Press `Cmd+D` → Tap "Reload"
- **Device**: Shake device → Tap "Reload"

### Metro Bundler Control

**Start Metro:**
```bash
./scripts/ios/ios-cli.sh start
# or
npm start
```

**Stop Metro:**
```bash
npm run ios:stop
```

**Restart Metro:**
```bash
./scripts/ios/ios-cli.sh restart
```

**View Metro logs:**
```bash
./scripts/ios/ios-cli.sh logs
# or
tail -f metro.log
```

---

## 🔍 Validation & Testing

### Gate Validation (Code Quality Checks)

**Run all 5 gates:**
```bash
npm run gate:validate
```

**Gates tested:**
- Gate 0: Critical fixes (keypoint indices)
- Gate 1: Core functionality (algorithms, performance)
- Gate 2: Integration & stability
- Gate 3: Production readiness (security, accessibility)
- Gate 4: Advanced profiling (memory, app state handling)

### On-Device Validation

**Validate on simulator:**
```bash
npm run ios:validate
```

**Validate on physical device:**
```bash
npm run ios:validate:device
```

**What it tests:**
- ✅ Gate validation (all 5 gates)
- ✅ Performance profiling (30-second trace)
- ✅ Memory leak detection
- ✅ Pose detection model validation
- ✅ Camera permissions check
- 📊 Generates detailed report

**Output:**
```
test-results/ios/
├── performance-sim.trace       # Instruments trace file
├── memory-leaks.trace          # Memory analysis
└── validation-report-*.txt     # Detailed report
```

### View Instruments Traces

```bash
# Open performance trace in Xcode Instruments
open test-results/ios/performance-sim.trace

# Open memory leak trace
open test-results/ios/memory-leaks.trace
```

---

## 🐛 Troubleshooting

### Common Issues

#### "No Bundle URL Present"

**Cause:** Metro bundler not running

**Fix:**
```bash
npm run ios:stop
npm start
# In another terminal:
npm run ios:sim
```

#### "Command PhaseScriptExecution failed"

**Cause:** Pod installation or build cache issue

**Fix:**
```bash
npm run ios:clean
npm run ios:sim
```

#### "Could not find iPhone Simulator"

**Cause:** Simulator not available or incorrect name

**Fix:**
```bash
# List available simulators
./scripts/ios/ios-cli.sh list

# Use exact name
./scripts/ios/run-simulator.sh "iPhone 15 Pro"
```

#### "Code Signing Error"

**Cause:** No development certificate or team not selected

**Fix:**
1. Open `ios/PhysioAssist.xcworkspace` in Xcode
2. Select PhysioAssist target
3. Go to Signing & Capabilities
4. Enable "Automatically manage signing"
5. Select your Team

#### "Developer Mode Required" (iOS 16+)

**Fix:**
1. On device: Settings → Privacy & Security
2. Scroll to bottom → Developer Mode
3. Enable Developer Mode
4. Device will restart

#### "Device Not Detected"

**Fix:**
1. Unplug and replug USB cable
2. Unlock device
3. Tap "Trust" when prompted
4. Check device appears:
   ```bash
   ./scripts/ios/ios-cli.sh list
   ```

#### "App Crashes Immediately"

**Fix:**
1. Check Metro logs:
   ```bash
   tail -f metro.log
   ```
2. Check device logs in Xcode:
   - Window → Devices and Simulators
   - Select your device
   - Click "Open Console"

#### "Watch Mode Not Working"

**Cause:** fswatch not installed

**Fix:**
```bash
brew install fswatch
npm run ios:watch
```

### Complete Reset

If nothing else works:

```bash
# Nuclear option - full reset
npm run ios:reset

# This will:
# - Delete all build artifacts
# - Delete Pods
# - Delete node_modules
# - Clear npm cache
# - Reinstall everything
```

---

## 📚 Command Reference

### Unified iOS CLI

All commands can be run through the unified CLI:

```bash
./scripts/ios/ios-cli.sh <command>
```

Or use npm shortcuts:

| Command | npm Script | Description |
|---------|------------|-------------|
| `setup` | `npm run ios:setup` | Initial environment setup |
| `sim` | `npm run ios:sim` | Run on simulator |
| `device` | `npm run ios:device` | Run on physical device |
| `watch` | `npm run ios:watch` | Watch mode (simulator) |
| `watch device` | `npm run ios:watch:device` | Watch mode (device) |
| `validate` | `npm run ios:validate` | Validate on simulator |
| `validate device` | `npm run ios:validate:device` | Validate on device |
| `start` | `npm start` | Start Metro bundler |
| `stop` | `npm run ios:stop` | Stop Metro bundler |
| `reload` | - | Force reload app |
| `clean` | `npm run ios:clean` | Clean build artifacts |
| `reset` | `npm run ios:reset` | Full reset |
| `list` | - | List devices/simulators |
| `help` | - | Show help menu |

### Examples

```bash
# Show help
./scripts/ios/ios-cli.sh help

# Quick simulator test
npm run ios:sim

# Test on specific simulator
./scripts/ios/ios-cli.sh sim "iPhone 14 Pro"

# Deploy to device with clean build
npm run ios:device --clean

# Start watch mode
npm run ios:watch

# Run full validation on device
npm run ios:validate:device

# Clean and rebuild
npm run ios:clean
npm run ios:sim

# Complete reset
npm run ios:reset

# List all available devices and simulators
./scripts/ios/ios-cli.sh list
```

---

## 🎯 Development Workflows

### Daily Development

```bash
# 1. Start your day
npm run ios:watch

# 2. Edit code in src/
# 3. Save files
# 4. See changes instantly!

# When done:
npm run ios:stop
```

### Pre-Commit Testing

```bash
# Run full validation before committing
npm run gate:validate
npm run ios:validate

# If all pass, commit your changes
git add .
git commit -m "Your message"
```

### New Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Start watch mode
npm run ios:watch

# 3. Develop with instant feedback
# Edit → Save → See results

# 4. Validate when feature is complete
npm run ios:validate:device

# 5. Run gate validation
npm run gate:validate

# 6. Commit and push
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature
```

### Debugging Session

```bash
# 1. Deploy to device
npm run ios:device

# 2. Open device logs in Xcode
# Window → Devices and Simulators → Console

# 3. Reproduce issue while watching logs

# 4. Or use Metro logs
tail -f metro.log
```

---

## 🏆 Best Practices

### ✅ DO

- Use watch mode for iterative development
- Run `ios:setup` after pulling changes
- Clean build when dependencies change
- Validate before committing
- Keep Metro running in background
- Use specific simulator names
- Check device is unlocked and trusted

### ❌ DON'T

- Don't run multiple Metro instances
- Don't skip validation before commits
- Don't forget to clean after dependency changes
- Don't deploy to device without code signing setup
- Don't ignore Metro bundler errors

---

## 📱 Device-Specific Notes

### iPhone vs iPad Testing

```bash
# iPhone simulators (recommended for development)
./scripts/ios/ios-cli.sh sim "iPhone 15 Pro"
./scripts/ios/ios-cli.sh sim "iPhone 14"

# iPad simulators (test responsive layouts)
./scripts/ios/ios-cli.sh sim "iPad Pro (12.9-inch)"
```

### iOS Versions

All simulators for iOS 17.0+ are available. List them:
```bash
xcrun simctl list devices available | grep "iPhone"
```

---

## 🔗 Integration with Claude Code CLI

All scripts are designed to work seamlessly in the Claude Code CLI environment:

```bash
# From Claude Code CLI on your personal computer:

# Quick test
npm run ios:sim

# Deploy to your iPhone
npm run ios:device

# Iterative development
npm run ios:watch

# Validate everything
npm run ios:validate:device
```

**Advantages:**
- ✅ One-line commands
- ✅ Automatic Metro management
- ✅ Hot reload enabled by default
- ✅ Comprehensive validation
- ✅ Detailed error messages
- ✅ Progress indicators
- ✅ Auto-cleanup on exit

---

## 📊 Performance Tips

### Faster Build Times

```bash
# Use clean builds sparingly (slower)
npm run ios:sim --clean

# Normal builds are incremental (faster)
npm run ios:sim
```

### Faster Reloads

1. Use watch mode instead of manual reloads
2. Edit only necessary files
3. Keep Metro bundler running
4. Use hot reload (Cmd+D → "Enable Fast Refresh")

### Reduce Memory Usage

```bash
# Close unused simulators
xcrun simctl shutdown all

# Clean old build artifacts
npm run ios:clean
```

---

## 🆘 Getting Help

### In-App Dev Menu

**Simulator:**
- Press `Cmd+D` to open dev menu
- Press `R` to reload
- Press `Cmd+M` for element inspector

**Device:**
- Shake device to open dev menu
- Tap "Reload" to refresh
- Enable "Fast Refresh" for auto-reload

### Useful Commands

```bash
# Check what's using port 8081
lsof -i :8081

# Kill Metro if stuck
npm run ios:stop

# Check Xcode version
xcodebuild -version

# Check available simulators
xcrun simctl list devices available

# Check connected devices
xcrun xctrace list devices
```

### Log Files

- **Metro logs**: `metro.log` in project root
- **Validation reports**: `test-results/ios/validation-report-*.txt`
- **Performance traces**: `test-results/ios/*.trace`

---

## 🎉 Success Checklist

Before considering iOS testing complete, verify:

- [ ] Initial setup completed without errors
- [ ] App runs on iOS Simulator
- [ ] App deploys to physical iPhone
- [ ] Hot reload works on both simulator and device
- [ ] Watch mode auto-reloads on file changes
- [ ] All 5 gates pass validation
- [ ] On-device validation passes
- [ ] Performance profiling shows <16ms frame time
- [ ] No memory leaks detected
- [ ] Camera permissions working
- [ ] MoveNet model loads correctly

---

## 📞 Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Run `npm run ios:setup` to verify environment
3. Try `npm run ios:clean` or `npm run ios:reset`
4. Check log files for errors
5. Verify device/simulator appears in `./scripts/ios/ios-cli.sh list`

---

**Created:** November 2024
**Status:** Production Ready
**Version:** 2.0
**Compatibility:** iOS 13.0+, Xcode 15+, React Native 0.73.2
