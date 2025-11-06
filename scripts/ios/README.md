# 🍎 iOS Testing Scripts

Complete iOS device and simulator testing toolkit for PhysioAssist.

## 📁 Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `ios-cli.sh` | **Unified CLI** - All commands in one place | `./ios-cli.sh help` |
| `device-setup.sh` | Environment setup and validation | `npm run ios:setup` |
| `run-simulator.sh` | Build and run on iOS Simulator | `npm run ios:sim` |
| `run-device.sh` | Build and deploy to physical device | `npm run ios:device` |
| `watch-mode.sh` | Auto-reload on file changes | `npm run ios:watch` |
| `device-validate.sh` | On-device testing and validation | `npm run ios:validate` |
| `stop-metro.sh` | Stop Metro bundler | `npm run ios:stop` |

## 🚀 Quick Start

### First Time Setup
```bash
npm run ios:setup
```

### Daily Development
```bash
# Test on simulator with watch mode
npm run ios:watch

# Or deploy to physical device
npm run ios:device
```

### Validation
```bash
# Validate on simulator
npm run ios:validate

# Validate on physical device
npm run ios:validate:device
```

## 📋 Features

### ✨ Automated Workflows
- ✅ Automatic Metro bundler management
- ✅ Device/simulator detection
- ✅ Code signing verification
- ✅ Dependency installation
- ✅ Build artifact cleanup
- ✅ Error handling and recovery

### ⚡ Iterative Development
- 🔄 Hot reload enabled by default
- 👀 Watch mode with auto-reload on save
- 📊 Live Metro bundler logs
- 🎯 Sub-second reload times

### 🧪 Comprehensive Testing
- 📋 Gate validation (all 5 gates)
- ⚡ Performance profiling (Instruments)
- 💾 Memory leak detection
- 🎯 Pose detection validation
- 📊 Detailed test reports

### 🎨 Developer Experience
- 🎨 Colorful, informative output
- 📝 Progress indicators
- ❌ Clear error messages
- 💡 Helpful suggestions
- 🧹 Automatic cleanup

## 🔧 Script Details

### ios-cli.sh (Unified Interface)

Main entry point for all iOS operations.

**Commands:**
```bash
./ios-cli.sh setup              # Initial environment setup
./ios-cli.sh sim                # Run on simulator
./ios-cli.sh device             # Run on physical device
./ios-cli.sh watch              # Watch mode (auto-reload)
./ios-cli.sh validate           # Run validations
./ios-cli.sh start              # Start Metro
./ios-cli.sh stop               # Stop Metro
./ios-cli.sh clean              # Clean build
./ios-cli.sh reset              # Full reset
./ios-cli.sh list               # List devices/simulators
./ios-cli.sh help               # Show help
```

### device-setup.sh

Verifies and configures iOS development environment.

**Checks:**
- Xcode installation and version
- Command Line Tools
- CocoaPods installation
- Connected physical devices
- Available simulators
- Development certificates
- Offers dependency installation

**Usage:**
```bash
npm run ios:setup
```

### run-simulator.sh

Builds and runs app on iOS Simulator with hot reload.

**Features:**
- Auto-starts Metro bundler
- Boots simulator if needed
- Incremental builds
- Clean build option
- Automatic app launch
- Optional log monitoring

**Usage:**
```bash
npm run ios:sim                      # Default simulator
./run-simulator.sh "iPhone 14"       # Specific simulator
./run-simulator.sh --clean           # Clean build
```

### run-device.sh

Deploys app to connected physical iOS device.

**Features:**
- Auto-detects connected devices
- Verifies code signing
- Deploys over USB
- Enables hot reload over WiFi
- Device log monitoring
- Error diagnosis

**Usage:**
```bash
npm run ios:device                   # Deploy to device
npm run ios:device --clean           # Clean build
```

**Requirements:**
- Device connected via USB
- Device unlocked and trusted
- Code signing configured
- Developer Mode enabled (iOS 16+)

### watch-mode.sh

Watches for file changes and auto-reloads app.

**Features:**
- Uses `fswatch` for file monitoring
- Watches `src/` and `App.tsx`
- Auto-reloads on `.ts`, `.tsx`, `.js`, `.jsx` changes
- Shows which files changed
- Sub-second reload times

**Usage:**
```bash
npm run ios:watch                    # Watch for simulator
npm run ios:watch:device             # Watch for device
```

**Dependencies:**
```bash
brew install fswatch
```

### device-validate.sh

Runs comprehensive validation suite on device/simulator.

**Tests:**
- Gate validation (all 5 gates)
- Performance profiling (30s trace)
- Memory leak detection
- Pose detection model check
- Camera permissions verification

**Output:**
- Performance traces in `test-results/ios/`
- Memory analysis traces
- Detailed validation report

**Usage:**
```bash
npm run ios:validate                 # Validate on simulator
npm run ios:validate:device          # Validate on device
```

**Results:**
```
test-results/ios/
├── performance-sim.trace
├── memory-leaks.trace
└── validation-report-YYYYMMDD-HHMMSS.txt
```

### stop-metro.sh

Stops Metro bundler gracefully.

**Features:**
- Kills Metro via PID file
- Fallback to port-based kill
- Cleans up PID files

**Usage:**
```bash
npm run ios:stop
```

## 🎯 Common Workflows

### Daily Development

```bash
# Start watch mode
npm run ios:watch

# Edit files in src/
# Save → See changes instantly!

# Stop when done
npm run ios:stop
```

### Testing on Device

```bash
# Deploy once
npm run ios:device

# Enable watch mode for rapid iteration
npm run ios:watch:device

# Validate when ready
npm run ios:validate:device
```

### Pre-Commit Validation

```bash
# Run all validations
npm run gate:validate
npm run ios:validate

# If all pass, commit
git add .
git commit -m "Your changes"
```

### Debugging

```bash
# Deploy to device
npm run ios:device

# Check Metro logs
tail -f metro.log

# Or check device logs in Xcode:
# Window → Devices and Simulators → Console
```

### Clean Builds

```bash
# Light clean (just build artifacts)
npm run ios:clean

# Full reset (everything)
npm run ios:reset
```

## 🐛 Troubleshooting

### Metro Won't Start

```bash
# Kill any existing Metro
npm run ios:stop

# Check port 8081
lsof -i :8081

# Restart
npm start
```

### Build Failures

```bash
# Clean and rebuild
npm run ios:clean
npm run ios:sim
```

### Device Not Detected

```bash
# List devices
./ios-cli.sh list

# Verify device appears
# If not: unplug, unlock, trust, replug
```

### Code Signing Issues

Open Xcode and configure signing:
```bash
open ios/PhysioAssist.xcworkspace
```

Then: Target → Signing & Capabilities → Select Team

## 📊 Performance Metrics

### Build Times
- **Clean build**: ~2-5 minutes
- **Incremental build**: ~30-60 seconds
- **Hot reload**: <1 second

### Development Cycle
- **Edit → Save → Reload**: <1 second (with watch mode)
- **Manual reload**: ~2-3 seconds
- **Full rebuild**: ~30-60 seconds

## 🔗 Integration

These scripts are designed to work with:
- ✅ Claude Code CLI
- ✅ npm scripts (package.json)
- ✅ Git hooks
- ✅ CI/CD pipelines
- ✅ Local development
- ✅ Automated testing

## 📚 Dependencies

### Required
- macOS (for iOS development)
- Xcode 15+
- Xcode Command Line Tools
- Node.js 18+
- CocoaPods

### Optional
- fswatch (for watch mode)
- ios-deploy (for device logging)
- Homebrew (for package management)

## 🎨 Output Examples

### Successful Build
```
📱 iOS Simulator Testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Target Simulator: iPhone 15 Pro
✓ Metro bundler ready (PID: 12345)
✓ Found simulator: ABC-123...
✓ Simulator ready
✓ Build successful
✓ App installed
✓ App launched
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ App running on simulator!
```

### Watch Mode
```
⚡ iOS Watch Mode - Iterative Development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Target: simulator
📁 Watching: src App.tsx
✓ Metro bundler ready

👀 Watching for file changes...
Press Ctrl+C to stop

📝 File changed: src/screens/LoginScreen.tsx
🔄 Reloading app...
✓ Reload command sent
```

### Validation Results
```
🧪 iOS On-Device Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Running Gate Validation...
✓ Gate validation passed

⚡ Running Performance Tests...
✓ Performance tests complete

💾 Running Memory Tests...
✓ Memory tests complete

🎯 Running Pose Detection Validation...
✓ MoveNet model found
✓ Model format valid
✓ Camera permissions configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Validation complete!

Summary:
  Gate Validation: ✅ PASS
  Performance: ✅ PASS
  Memory: ✅ PASS
  Pose Detection: ✅ PASS
```

## 🏆 Best Practices

### ✅ DO
- Run `ios:setup` after pulling changes
- Use watch mode for daily development
- Clean build when dependencies change
- Validate before committing
- Keep device unlocked during testing
- Use specific simulator names

### ❌ DON'T
- Run multiple Metro instances
- Skip validation before commits
- Forget to trust your device
- Ignore build warnings
- Deploy without code signing setup

## 📞 Support

For detailed documentation, see:
- [iOS Testing Guide](../../docs/IOS_TESTING_GUIDE.md)
- [Gated Development Plan](../../docs/GATED_DEVELOPMENT_PLAN.md)
- [Gate Validation](../gate-validation.js)

---

**All scripts include:**
- ✅ Comprehensive error handling
- ✅ Colorful, informative output
- ✅ Progress indicators
- ✅ Automatic cleanup
- ✅ Help text and examples
- ✅ Diagnostic suggestions

**Happy testing! 🎉**
