# 🍎 iOS Testing Quick Reference

One-page cheat sheet for iOS testing and development.

---

## ⚡ Most Used Commands

```bash
# Initial setup (run once)
npm run ios:setup

# Mac users: Full Xcode setup + optimization
npm run xcode:setup
npm run xcode:fast

# Test on simulator
npm run ios:sim

# Test on physical device
npm run ios:device

# Watch mode (auto-reload on save - FASTEST!)
npm run ios:watch

# Validate everything
npm run ios:validate:device

# Professional profiling (Mac/Xcode Instruments)
npm run xcode:instruments

# Debug tools (Mac)
npm run xcode:debug

# Stop Metro bundler
npm run ios:stop
```

---

## 🚀 Quick Workflows

### First Time Setup
```bash
npm run ios:setup           # Verify environment
open ios/PhysioAssist.xcworkspace  # Configure code signing in Xcode
```

### Daily Development
```bash
npm run ios:watch           # Start watch mode
# Edit files → Save → See changes instantly!
```

### Deploy to Device
```bash
npm run ios:device          # Deploy once
npm run ios:watch:device    # Enable auto-reload
```

### Pre-Commit
```bash
npm run gate:validate       # Run all gates
npm run ios:validate:device # Validate on device
```

---

## 🛠️ All npm Scripts

| Command | What It Does |
|---------|-------------|
| `npm run ios:setup` | Initial environment setup |
| `npm run ios:sim` | Run on simulator |
| `npm run ios:device` | Run on physical device |
| `npm run ios:watch` | Watch mode (simulator) |
| `npm run ios:watch:device` | Watch mode (device) |
| `npm run ios:validate` | Validate on simulator |
| `npm run ios:validate:device` | Validate on device |
| `npm run ios:stop` | Stop Metro bundler |
| `npm run ios:clean` | Clean build artifacts |
| `npm run ios:reset` | Full reset (nuclear option) |
| `npm run xcode` | Open Xcode workspace |
| `npm run xcode:setup` | Full Xcode setup & optimization (Mac) |
| `npm run xcode:fast` | Optimize Xcode for max build speed (Mac) |
| `npm run xcode:instruments` | Professional profiling with Instruments (Mac) |
| `npm run xcode:debug` | Debug tools and helpers (Mac) |
| `npm run gate:validate` | Run gate validation |

---

## 🎯 Unified CLI

All features in one command:

```bash
./scripts/ios/ios-cli.sh <command>
```

**Available commands:**
- `setup` - Environment setup
- `sim` - Run on simulator
- `device` - Run on device
- `watch` - Watch mode
- `validate` - Run validations
- `xcode` - Open Xcode workspace
- `xcode-setup` - Full Xcode configuration (Mac)
- `xcode-fast` - Build speed optimization (Mac)
- `instruments` - Professional profiling (Mac)
- `debug` - Debug tools (Mac)
- `start` - Start Metro
- `stop` - Stop Metro
- `reload` - Force reload
- `clean` - Clean build
- `reset` - Full reset
- `list` - List devices/simulators
- `help` - Show help

---

## 🐛 Common Issues & Fixes

### Metro Won't Start
```bash
npm run ios:stop
npm start
```

### Build Failed
```bash
npm run ios:clean
npm run ios:sim
```

### Device Not Detected
```bash
# Unplug → Unlock → Trust → Replug
./scripts/ios/ios-cli.sh list
```

### Code Signing Error
```bash
open ios/PhysioAssist.xcworkspace
# Signing & Capabilities → Select Team
```

### Complete Reset
```bash
npm run ios:reset
```

---

## 📱 Device Setup Checklist

### Physical Device Testing
- [ ] Device connected via USB
- [ ] Device unlocked
- [ ] Tapped "Trust" on device
- [ ] Developer Mode enabled (iOS 16+)
- [ ] Code signing configured in Xcode
- [ ] Same WiFi network (for hot reload)

### Simulator Testing
- [ ] Xcode installed
- [ ] Command Line Tools installed
- [ ] CocoaPods installed
- [ ] Dependencies installed (`npm install`)

---

## ⚡ Watch Mode Usage

```bash
# Start watch mode
npm run ios:watch

# Now edit any file in src/
# Save (Cmd+S)
# → App reloads automatically in <1 second!
```

**Watches:**
- All `.ts` files in `src/`
- All `.tsx` files in `src/`
- All `.js` files in `src/`
- All `.jsx` files in `src/`
- `App.tsx`

---

## 🧪 Validation Tests

### Gate Validation
```bash
npm run gate:validate
```

**Tests 5 gates:**
- Gate 0: Critical fixes
- Gate 1: Core functionality
- Gate 2: Integration
- Gate 3: Production readiness
- Gate 4: Advanced profiling

### On-Device Validation
```bash
npm run ios:validate:device
```

**Tests:**
- All 5 gates
- Performance profiling
- Memory leaks
- Pose detection
- Camera permissions

**Results:** `test-results/ios/validation-report-*.txt`

---

## 🎨 Dev Menu Shortcuts

### In Simulator
- `Cmd+D` - Open dev menu
- `R` - Reload
- `Cmd+M` - Element inspector

### On Device
- **Shake device** - Open dev menu
- Tap "Reload" - Reload app
- Enable "Fast Refresh" - Auto-reload

---

## 📊 Performance Tips

### Faster Builds
```bash
# Avoid clean builds (use only when needed)
npm run ios:sim          # ✅ Incremental (30-60s)
npm run ios:sim --clean  # ❌ Clean (2-5 min)
```

### Faster Development
```bash
# Use watch mode instead of manual reloads
npm run ios:watch        # ✅ Auto-reload <1s
./scripts/ios/ios-cli.sh reload  # ❌ Manual ~2-3s
```

---

## 📁 File Locations

```
PhysioAssist/
├── scripts/ios/              # All iOS testing scripts
│   ├── ios-cli.sh            # Unified CLI
│   ├── device-setup.sh       # Environment setup
│   ├── run-simulator.sh      # Simulator testing
│   ├── run-device.sh         # Device testing
│   ├── watch-mode.sh         # Auto-reload
│   ├── device-validate.sh    # Validation
│   └── stop-metro.sh         # Stop Metro
├── test-results/ios/         # Test results
│   ├── *.trace               # Instruments traces
│   └── validation-report-*.txt  # Reports
├── metro.log                 # Metro bundler logs
└── docs/
    └── IOS_TESTING_GUIDE.md  # Full documentation
```

---

## 🔗 Useful Commands

```bash
# List available simulators
xcrun simctl list devices available | grep "iPhone"

# List connected devices
xcrun xctrace list devices

# Check what's using port 8081
lsof -i :8081

# View Metro logs
tail -f metro.log

# Open Xcode workspace
open ios/PhysioAssist.xcworkspace

# Install CocoaPods dependencies
cd ios && pod install

# Check Xcode version
xcodebuild -version
```

---

## 📚 Full Documentation

For complete details, see:
- **[Mac Quick Start](MAC_QUICK_START.md)** - Mac-optimized guide 🍎
- **[iOS Testing Guide](docs/IOS_TESTING_GUIDE.md)** - Comprehensive guide
- **[Scripts README](scripts/ios/README.md)** - Script documentation
- **[Gated Development Plan](docs/GATED_DEVELOPMENT_PLAN.md)** - Gate system

---

## ✅ Success Checklist

Before considering setup complete:

- [ ] `npm run ios:setup` passes all checks
- [ ] App runs on simulator
- [ ] App deploys to physical device
- [ ] Hot reload works
- [ ] Watch mode auto-reloads on save
- [ ] All 5 gates pass validation
- [ ] On-device validation passes
- [ ] No memory leaks detected
- [ ] Camera permissions working

---

**Print this page and keep it handy! 📄**
