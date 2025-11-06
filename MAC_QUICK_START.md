# 🍎 PhysioAssist - Mac Quick Start Guide

**Your Mac is the perfect development machine for iOS testing!**

This guide gets you up and running in minutes with powerful Mac-native tools.

---

## ⚡ Fastest Start (3 Commands)

```bash
# 1. Setup Xcode and environment
npm run xcode:setup

# 2. Optimize for maximum build speed
npm run xcode:fast

# 3. Start developing with watch mode
npm run ios:watch
```

**Done!** Changes appear in <1 second. 🎉

---

## 🚀 Power User Setup (Recommended)

### Step 1: Full Xcode Configuration
```bash
npm run xcode:setup
```

This will:
- ✅ Verify Xcode installation
- ✅ Optimize build settings for your Mac
- ✅ Configure code signing automatically
- ✅ Set up CocoaPods
- ✅ Create shell aliases for quick access
- ✅ Open Xcode workspace

### Step 2: Optimize Build Speed
```bash
npm run xcode:fast
```

This will:
- ✅ Configure parallel builds (use all CPU cores)
- ✅ Enable incremental Swift compilation
- ✅ Optimize derived data location
- ✅ Create fast build configuration
- ✅ Benchmark your build speed

### Step 3: Start Rapid Development
```bash
npm run ios:watch
```

Now edit any file in `src/` → Save → See changes instantly!

---

## 🎯 Mac-Optimized Workflows

### Daily Development (Fastest)

```bash
# Start watch mode
npm run ios:watch

# Edit code in your favorite editor
# Save file (Cmd+S)
# → App reloads in <1 second!

# Stop when done
Ctrl+C
```

**This is the fastest development workflow possible on Mac.**

### Xcode Development

```bash
# Open Xcode workspace
npm run xcode

# Or use new shell alias (after xcode:setup)
physio-xcode
```

**Then in Xcode:**
- `Cmd+B` - Build
- `Cmd+R` - Build & Run
- `Cmd+.` - Stop
- `Cmd+K` - Clear console

### Professional Profiling (Instruments)

```bash
# Interactive profiling menu
npm run xcode:instruments

# Or specific profiling
./scripts/ios/xcode-instruments.sh simulator time      # CPU profiling
./scripts/ios/xcode-instruments.sh simulator allocations # Memory
./scripts/ios/xcode-instruments.sh simulator leaks     # Memory leaks
```

**Instruments templates available:**
1. Time Profiler - CPU usage and hot paths
2. Allocations - Memory allocations
3. Leaks - Memory leak detection
4. Core Animation - FPS and rendering
5. Energy Log - Battery usage
6. Network - HTTP traffic
7. System Trace - Complete performance
8. Metal - GPU performance
9. File Activity - Disk I/O
10. All Templates - Comprehensive profiling

### Debugging Tools

```bash
# Open debug helper menu
npm run xcode:debug

# Quick debug commands
./scripts/ios/xcode-debug.sh 1    # View simulator logs
./scripts/ios/xcode-debug.sh 2    # View device logs
./scripts/ios/xcode-debug.sh 4    # View crash logs
./scripts/ios/xcode-debug.sh 11   # Take screenshot
./scripts/ios/xcode-debug.sh 15   # Keyboard shortcuts cheatsheet
```

---

## 🖥️ Mac-Specific Features

### Shell Aliases (After xcode:setup)

After running `npm run xcode:setup`, these aliases are available:

```bash
physio-xcode      # Open Xcode workspace
physio-sim        # Run on simulator
physio-device     # Run on device
physio-watch      # Watch mode
physio-validate   # Full validation
physio-clean      # Clean build
```

Restart your terminal or run: `source ~/.zshrc`

### Xcode Keyboard Shortcuts

**Most Used:**
- `Cmd+B` - Build
- `Cmd+R` - Build & Run
- `Cmd+.` - Stop
- `Shift+Cmd+K` - Clean build
- `Cmd+Y` - Toggle breakpoints
- `Cmd+D` (in Simulator) - Dev menu

**Full cheatsheet:**
```bash
npm run xcode:debug
# Select option 15
```

### Mac Performance Optimizations

Your Mac will automatically use:
- ✅ All CPU cores for parallel compilation
- ✅ SSD-optimized derived data
- ✅ Incremental Swift builds
- ✅ Fast linking without bitcode
- ✅ Optimized indexing

**Check your Mac specs:**
```bash
./scripts/ios/xcode-build-fast.sh
# Shows CPU cores, RAM, and optimizes accordingly
```

---

## 📊 Testing on Mac

### Simulator Testing (Instant)

```bash
# Quick test (default: iPhone 15 Pro)
npm run ios:sim

# Specific device
./scripts/ios/run-simulator.sh "iPhone 14"
./scripts/ios/run-simulator.sh "iPad Pro (12.9-inch)"

# List all available
./scripts/ios/ios-cli.sh list
```

### Physical Device Testing

```bash
# 1. Connect iPhone/iPad via USB
# 2. Unlock device
# 3. Tap "Trust" when prompted
# 4. Deploy

npm run ios:device
```

**For iterative development on device:**
```bash
npm run ios:watch:device
```

---

## 🔍 Comprehensive Validation

### Quick Validation
```bash
# Run all 5 gates
npm run gate:validate

# On-device validation
npm run ios:validate:device
```

### Professional Profiling
```bash
# Run comprehensive Instruments profiling
npm run xcode:instruments
# Select option 10 (All Templates)
```

**Results saved to:**
- `test-results/instruments/*.trace` - Instruments files
- `test-results/instruments/*.html` - Interactive reports

**Open traces in Instruments:**
```bash
open test-results/instruments/time_profiler_*.trace
```

---

## 💡 Pro Tips for Mac Users

### 1. Use Multiple Desktops (Spaces)

**Setup:**
- Desktop 1: Code editor
- Desktop 2: iOS Simulator
- Desktop 3: Xcode (when needed)
- Desktop 4: Terminal with watch mode

**Navigate:** `Ctrl + →/←`

### 2. Hot Corners (Optional)

System Settings → Desktop & Dock → Hot Corners:
- Top Left: Show Desktop (see Simulator)
- Bottom Right: Application Windows (switch to Xcode)

### 3. Alfred/Spotlight Workflows

Create quick launchers:
```bash
# In Alfred/Spotlight
physio sim       # Runs npm run ios:sim
physio watch     # Runs npm run ios:watch
```

### 4. Terminal Profiles

Create a "PhysioAssist Dev" terminal profile with:
- Working directory: Project root
- Startup command: `npm run ios:watch`

### 5. Xcode Behaviors

Xcode → Settings → Behaviors:
- On Build Succeeds: Show Simulator
- On Build Fails: Show issue navigator

### 6. Use Touch Bar (if available)

Xcode can show build controls on Touch Bar:
- Build button
- Stop button
- Debug controls

---

## 🎨 Recommended Mac Setup

### Essential Apps
- ✅ **Xcode** (Mac App Store)
- ✅ **Homebrew** (package manager)
- ✅ **iTerm2** (better terminal)
- ✅ **VS Code** or **Cursor** (editor)

### Optional but Useful
- **Charles Proxy** - HTTP debugging
- **Proxyman** - Modern HTTP debugger
- **SF Symbols** - Apple's icon library
- **Sim Genie** - Simulator management
- **ImageOptim** - Asset optimization

### Homebrew Packages
```bash
brew install fswatch          # For watch mode
brew install ios-deploy       # Better device logging
brew install xcpretty         # Better build output
brew install git-lfs          # For large files
```

---

## 🚀 Performance Benchmarks (Mac)

**Expected performance on typical Mac:**

| Task | Time |
|------|------|
| Clean build | 2-5 minutes |
| Incremental build | 30-60 seconds |
| Hot reload (watch mode) | <1 second |
| App launch (Simulator) | 3-5 seconds |
| App launch (Device) | 5-10 seconds |
| Test suite | 1-2 minutes |

**On M1/M2/M3 Macs:** Even faster!
- Clean build: 1-3 minutes
- Incremental build: 15-30 seconds
- Hot reload: <500ms

---

## 🐛 Mac-Specific Troubleshooting

### "Command Line Tools not found"
```bash
xcode-select --install
```

### "Pod install fails"
```bash
sudo gem install cocoapods
cd ios && pod install
```

### "Simulator won't boot"
```bash
# Kill all simulators
killall Simulator
xcrun simctl shutdown all

# Erase and restart
xcrun simctl erase all
```

### "Derived data issues"
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
npm run ios:clean
```

### "Xcode is slow"
```bash
# Optimize Xcode
npm run xcode:fast

# Free up space
# Xcode → Settings → Locations → Derived Data → Delete
```

### "Build fails randomly"
```bash
# Nuclear option
npm run ios:reset

# Restart Mac
sudo shutdown -r now
```

---

## ⌨️ Essential Mac Shortcuts

### Global
- `Cmd+Space` - Spotlight (launch apps)
- `Cmd+Tab` - Switch apps
- `Cmd+`` - Switch windows
- `Ctrl+←/→` - Switch desktops

### Terminal (iTerm2)
- `Cmd+T` - New tab
- `Cmd+D` - Split pane vertically
- `Cmd+Shift+D` - Split pane horizontally
- `Cmd+[/]` - Switch panes

### Xcode
- `Cmd+B` - Build
- `Cmd+R` - Run
- `Cmd+.` - Stop
- `Shift+Cmd+K` - Clean
- `Cmd+0` - Toggle Navigator
- `Cmd+Shift+Y` - Toggle Console

### Simulator
- `Cmd+D` - Dev menu (React Native)
- `Cmd+K` - Toggle keyboard
- `Cmd+Shift+H` - Home
- `Cmd+←/→` - Rotate
- `Cmd+L` - Lock/unlock

---

## 📚 Mac-Optimized Documentation

- **This file** - Mac Quick Start
- `IOS_QUICK_REFERENCE.md` - One-page cheat sheet
- `docs/IOS_TESTING_GUIDE.md` - Complete guide
- `scripts/ios/README.md` - Script reference

---

## 🎯 Success Checklist

Run through this to verify everything works:

```bash
# 1. Environment setup
npm run xcode:setup
# → Should complete without errors

# 2. Build optimization
npm run xcode:fast
# → Should show your Mac specs and optimize

# 3. Simulator test
npm run ios:sim
# → Should build and launch app

# 4. Watch mode
npm run ios:watch
# → Edit a file, save, see changes in <1s

# 5. Device test (iPhone connected)
npm run ios:device
# → Should deploy to your iPhone

# 6. Professional profiling
npm run xcode:instruments
# → Should open profiling menu

# 7. Validation
npm run ios:validate:device
# → All gates should pass

# 8. Debug tools
npm run xcode:debug
# → Should show debug menu
```

✅ **All working?** You're ready to build amazing iOS apps on your Mac!

---

## 🆘 Getting Help

### Quick Commands
```bash
./scripts/ios/ios-cli.sh help           # All available commands
npm run xcode:debug                     # Debug tools
./scripts/ios/xcode-debug.sh 15        # Keyboard shortcuts
```

### System Info
```bash
system_profiler SPSoftwareDataType      # macOS version
xcodebuild -version                     # Xcode version
sysctl -n hw.ncpu                       # CPU cores
sysctl -n hw.memsize | awk '{print $0/1024/1024/1024 " GB"}' # RAM
```

### Log Files
- Metro: `metro.log`
- Build times: `~/.physioassist_build_times.log`
- Crashes: `~/Library/Logs/DiagnosticReports`
- Instruments: `test-results/instruments/`

---

**Your Mac is now a powerful iOS development machine! 🚀**

**Fastest workflow:** `npm run ios:watch`
**Best experience:** Use multiple desktops + watch mode
**Professional:** Xcode Instruments for profiling

**Happy coding! 🎉**
