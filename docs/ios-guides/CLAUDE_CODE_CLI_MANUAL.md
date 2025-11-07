# 🤖 Claude Code CLI User Manual - PhysioAssist iOS Setup

**Complete guide for Claude Code CLI to assist users with iOS development setup and testing**

---

## 📋 Overview

This manual guides Claude Code CLI through helping users set up, test, and run iOS development for PhysioAssist on their Mac. The bridge system eliminates typical Claude Code CLI limitations with Xcode and iOS development.

**Target User:** Mac user with Claude Code CLI
**Goal:** Complete iOS development setup with testing and validation
**Time:** 10-15 minutes for full setup

---

## 🎯 What Claude Code CLI Can Do

### ✅ Full Capabilities (No Limitations)

Thanks to the bridge system, Claude Code CLI can now:

1. **Query System Status** - Get real-time iOS development environment status via JSON
2. **Control Metro Bundler** - Start, stop, restart Metro programmatically
3. **Manage iOS Simulator** - Boot, install apps, launch apps
4. **Build Applications** - Trigger builds with clean/incremental options
5. **Hot Reload Apps** - Trigger reloads programmatically
6. **Monitor State** - Track all system state in real-time via JSON file
7. **Handle Errors Automatically** - Built-in error recovery for common issues
8. **Run Validations** - Execute complete test suites
9. **Profile Performance** - Run Xcode Instruments profiling
10. **Debug Issues** - Access logs, crash reports, and diagnostic tools

### 🌉 Bridge System Components

- **JSON API** - All commands return structured JSON
- **HTTP Server** - RESTful API on port 3737
- **Auto-Iterate** - Automatic file watching and reload
- **State Management** - Real-time status in `.claude-bridge/state.json`
- **Error Recovery** - Automatic fixing of 5 common issues

---

## 🚀 Setup Procedure for Claude Code CLI

### Phase 1: Initial Environment Check (2 minutes)

#### Step 1.1: Verify Repository
```bash
# Check current directory
pwd
# Should be: /path/to/PhysioAssist

# Verify scripts exist
ls -la scripts/ios/claude-bridge.sh
ls -la scripts/ios/claude-bridge-server.js
ls -la scripts/ios/claude-auto-iterate.sh
```

**Expected Output:**
```
-rwxr-xr-x ... claude-bridge.sh
-rwxr-xr-x ... claude-bridge-server.js
-rwxr-xr-x ... claude-auto-iterate.sh
```

**If scripts not executable:**
```bash
chmod +x scripts/ios/*.sh scripts/ios/*.js
```

#### Step 1.2: Run Health Check
```bash
npm run claude:health
```

**Expected JSON Output:**
```json
{
  "success": false,
  "message": "System health check failed",
  "data": {
    "issues": ["Xcode not installed"],
    "warnings": [...]
  }
}
```

**Parse the JSON to identify issues:**
- If `"Xcode not installed"` - Tell user to install Xcode from Mac App Store
- If `"CocoaPods not installed"` - Run: `sudo gem install cocoapods`
- If `"node_modules not found"` - Run: `npm install`
- If `"Pods not installed"` - Run: `cd ios && pod install`

#### Step 1.3: Get System Status
```bash
npm run claude:status
```

**Parse JSON Response:**
```json
{
  "success": true,
  "data": {
    "metro_running": false,
    "simulator_booted": false,
    "device_connected": false,
    "xcode_open": false,
    "node_version": "v18.0.0",
    "xcode_version": "Xcode 15.0"
  }
}
```

**What to tell user:**
- ✅ If `xcode_version` present: "Xcode detected: [version]"
- ✅ If `node_version` present: "Node.js detected: [version]"
- ❌ If missing: Guide user to install missing components

---

### Phase 2: Xcode Setup (3 minutes)

#### Step 2.1: Run Xcode Setup
```bash
npm run xcode:setup
```

**This script will:**
1. Verify Xcode installation
2. Check Command Line Tools
3. Setup CocoaPods
4. Configure code signing
5. Optimize simulator
6. Create shell aliases

**Interactive prompts:**
- When asked "Install dependencies?" - Tell user to press `y`
- When asked "Add aliases?" - Tell user to press `y`
- Xcode will open - Tell user to configure signing in Xcode:
  1. Select PhysioAssist target
  2. Go to "Signing & Capabilities"
  3. Check "Automatically manage signing"
  4. Select their Team (Apple ID)

#### Step 2.2: Optimize Build Speed
```bash
npm run xcode:fast
```

**This will:**
- Configure parallel builds
- Enable incremental compilation
- Optimize derived data location
- Optionally benchmark build speed

**If benchmark requested:**
- Tell user it will take 2-5 minutes for clean build
- Show expected times for their Mac specs

---

### Phase 3: Development Environment Setup (3 minutes)

#### Step 3.1: Quick Dev Setup
```bash
npm run claude:dev
```

**Expected JSON Response:**
```json
{
  "success": true,
  "message": "Quick dev mode started",
  "data": {
    "metro_running": true,
    "simulator_booted": true,
    "app_launched": true
  }
}
```

**What this does automatically:**
1. Starts Metro bundler (if needed)
2. Boots iOS Simulator (if needed)
3. Builds app (if needed)
4. Installs app on simulator
5. Launches app

**If any step fails:**
- Check error message in JSON response
- Run health check again: `npm run claude:health`
- Check logs: `cat .claude-bridge/bridge.log`

#### Step 3.2: Verify Setup
```bash
npm run claude:status
```

**Parse JSON - Should now show:**
```json
{
  "data": {
    "metro_running": true,
    "simulator_booted": true,
    "simulator_name": "iPhone 15 Pro",
    "app_launched": true
  }
}
```

**Tell user:** "✅ Development environment is ready! Simulator should be visible with PhysioAssist running."

---

### Phase 4: Testing and Validation (5 minutes)

#### Step 4.1: Run Gate Validation
```bash
npm run gate:validate
```

**This tests 5 gates:**
- Gate 0: Critical fixes (keypoint indices)
- Gate 1: Core functionality
- Gate 2: Integration & stability
- Gate 3: Production readiness
- Gate 4: Advanced profiling

**Expected output:** All gates should pass

**If failures occur:**
- Parse the output for specific failures
- Guide user through fixes based on error messages

#### Step 4.2: Run iOS Validation
```bash
npm run ios:validate
```

**This tests:**
- All 5 gates
- Performance profiling
- Memory leak detection
- Pose detection model
- Camera permissions

**Results saved to:**
- `test-results/ios/validation-report-[timestamp].txt`

**Tell user where to find results:**
```bash
ls -lt test-results/ios/validation-report-*.txt | head -1
```

#### Step 4.3: Test Hot Reload
```bash
# Make a small change to a file
echo "// Test change" >> src/App.tsx

# Trigger reload
./scripts/ios/claude-bridge.sh reload
```

**Expected JSON:**
```json
{
  "success": true,
  "message": "App reloaded successfully"
}
```

**Tell user:** "✅ Hot reload working! You should see the app refresh in the simulator."

---

## 🎮 Interactive Commands for Claude Code CLI

### Command Pattern 1: Check Status Anytime
```bash
STATUS=$(npm run claude:status --silent)
METRO_RUNNING=$(echo "$STATUS" | jq -r '.data.metro_running')

if [ "$METRO_RUNNING" == "true" ]; then
  echo "✅ Metro is running"
else
  echo "⚠️  Metro is not running. Starting..."
  npm run claude:dev
fi
```

### Command Pattern 2: Parse and Act on Health
```bash
HEALTH=$(npm run claude:health --silent)
ISSUES=$(echo "$HEALTH" | jq -r '.data.issues[]')

if [ ! -z "$ISSUES" ]; then
  echo "❌ Issues found:"
  echo "$ISSUES"
  echo "Please resolve these issues first."
else
  echo "✅ All health checks passed!"
fi
```

### Command Pattern 3: Monitor State Changes
```bash
# Watch state file for real-time updates
watch -n 2 'cat .claude-bridge/state.json | jq .'

# Or use fswatch for event-based monitoring
fswatch -o .claude-bridge/state.json | while read; do
  cat .claude-bridge/state.json | jq '.'
done
```

### Command Pattern 4: Handle Errors Gracefully
```bash
RESULT=$(./scripts/ios/claude-bridge.sh reload 2>&1)
SUCCESS=$(echo "$RESULT" | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  ERROR_MSG=$(echo "$RESULT" | jq -r '.message')
  echo "❌ Error: $ERROR_MSG"

  # Check if recovery was attempted
  RECOVERY=$(echo "$RESULT" | jq -r '.data.recovery_attempted // false')
  if [ "$RECOVERY" == "true" ]; then
    echo "🔧 Automatic recovery was attempted"
  fi

  # Suggest next steps
  echo "💡 Try: npm run claude:dev"
fi
```

---

## 🔄 Development Workflows for Users

### Workflow 1: Daily Development (Recommended)
**Setup once, then just code:**

```bash
# Terminal 1: Start auto-iterate mode
npm run claude:iterate
```

**What user does:**
1. Edit any file in `src/`
2. Save (Cmd+S)
3. Wait 1 second
4. See changes in simulator automatically!

**Claude Code CLI role:**
- Monitor `.claude-bridge/iterations.log` for activity
- Check state file for errors
- If errors occur, suggest fixes

**Tell user:**
"✅ Auto-iterate mode active! Just edit and save files. Changes appear in ~1 second. Press Ctrl+C to stop."

### Workflow 2: Manual Control
**For precise control:**

```bash
# Start Metro
npm run claude:dev

# Make changes to code
# Then reload manually
./scripts/ios/claude-bridge.sh reload
```

**Claude Code CLI can:**
- Trigger reloads after specific changes
- Monitor Metro logs: `tail -f metro.log`
- Check build status programmatically

### Workflow 3: Testing Changes
**Before committing:**

```bash
# Run all validations
npm run gate:validate
npm run ios:validate

# Check results
cat test-results/ios/validation-report-*.txt | tail -50
```

**Claude Code CLI should:**
- Parse validation results
- Report success/failure
- Suggest fixes for failures

---

## 🌐 Using the HTTP Bridge Server

### Setup HTTP Server
**For advanced automation:**

```bash
# Terminal 1: Start HTTP server
npm run claude:bridge-server

# Server runs on: http://127.0.0.1:3737
```

### Available Endpoints

#### GET /status
```bash
curl -s http://127.0.0.1:3737/status | jq '.'
```

**Use case:** Check if Metro is running before attempting reload

#### POST /reload
```bash
curl -s -X POST http://127.0.0.1:3737/reload
```

**Use case:** Trigger hot reload after code generation

#### POST /quick-dev
```bash
curl -s -X POST http://127.0.0.1:3737/quick-dev
```

**Use case:** One-command setup from external automation

#### GET /watch (Server-Sent Events)
```bash
curl -N http://127.0.0.1:3737/watch
```

**Use case:** Stream real-time state updates

### Example: Automated Code Change + Reload
```bash
# 1. Modify code
echo "// Updated by Claude" >> src/components/ExampleComponent.tsx

# 2. Wait for write to complete
sleep 0.5

# 3. Trigger reload via HTTP
curl -s -X POST http://127.0.0.1:3737/reload | jq '.success'

# 4. Check result
if [ $? -eq 0 ]; then
  echo "✅ Code updated and reloaded successfully"
fi
```

---

## 🐛 Troubleshooting Guide

### Issue 1: Metro Won't Start
**Symptoms:** `metro_running: false` in status

**Solution:**
```bash
# Check if port is in use
lsof -i :8081

# If something is using it, the bridge will auto-kill and restart
./scripts/ios/claude-bridge.sh start-metro
```

**Tell user:** "Metro bundler starting... This may take 10-15 seconds."

### Issue 2: Simulator Won't Boot
**Symptoms:** `simulator_booted: false` after boot command

**Solution:**
```bash
# Try booting specific simulator
./scripts/ios/claude-bridge.sh boot-simulator "iPhone 15 Pro"

# If that fails, list available simulators
xcrun simctl list devices available | grep "iPhone"

# Boot first available
FIRST_SIM=$(xcrun simctl list devices available | grep "iPhone" | head -1)
echo "Trying: $FIRST_SIM"
```

**Tell user:** "Booting simulator... Simulator app should open in 5-10 seconds."

### Issue 3: Build Failures
**Symptoms:** `build_status: failed` in state

**Solution:**
```bash
# Try clean build
./scripts/ios/claude-bridge.sh build-simulator true

# Check last 50 lines of log for errors
tail -50 .claude-bridge/bridge.log | grep -i "error"
```

**Tell user:** "Build failed. Attempting clean build... This may take 3-5 minutes."

### Issue 4: Xcode Not Found
**Symptoms:** `xcode_version: ""` in status

**Solution:**
```bash
# Check if Xcode is installed
xcodebuild -version

# If not found, check path
xcode-select -p

# If wrong path, fix it
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

**Tell user:** "Xcode not found. Please ensure Xcode is installed from Mac App Store and opened at least once."

### Issue 5: Code Signing Errors
**Symptoms:** Build fails with signing error

**Solution:**
```bash
# Open Xcode for manual signing setup
open ios/PhysioAssist.xcworkspace
```

**Tell user specific steps:**
1. "In Xcode, select 'PhysioAssist' in left sidebar"
2. "Click 'Signing & Capabilities' tab"
3. "Check 'Automatically manage signing'"
4. "Select your Team from dropdown"
5. "Close Xcode and try building again: npm run claude:dev"

---

## 📊 Monitoring and Diagnostics

### Real-Time Monitoring
```bash
# Monitor state file
watch -n 2 'cat .claude-bridge/state.json | jq .'

# Monitor bridge logs
tail -f .claude-bridge/bridge.log

# Monitor Metro logs
tail -f metro.log

# Monitor iteration logs
tail -f .claude-bridge/iterations.log
```

### Health Dashboard Command
```bash
# Create a simple status dashboard
cat <<'EOF' > check-status.sh
#!/bin/bash
echo "=== PhysioAssist iOS Status ==="
echo ""
npm run claude:status --silent | jq '{
  metro: .data.metro_running,
  simulator: .data.simulator_booted,
  simulator_name: .data.simulator_name,
  xcode: .data.xcode_open
}'
echo ""
echo "Last update: $(cat .claude-bridge/state.json | jq -r .last_update)"
EOF
chmod +x check-status.sh
./check-status.sh
```

### Log Analysis
```bash
# Count successful reloads
grep "Reload successful" .claude-bridge/iterations.log | wc -l

# Count errors
grep "ERROR" .claude-bridge/bridge.log | wc -l

# Last 10 commands
cat .claude-bridge/state.json | jq -r .last_command
```

---

## 🎯 Success Criteria Checklist

### ✅ Setup Complete When:
- [ ] `npm run claude:health` returns no critical issues
- [ ] `npm run claude:status` shows metro_running: true
- [ ] `npm run claude:status` shows simulator_booted: true
- [ ] App visible in iOS Simulator
- [ ] `./scripts/ios/claude-bridge.sh reload` returns success: true
- [ ] All 5 gates pass in `npm run gate:validate`
- [ ] Hot reload works (test by editing a file)

### ✅ Tell User Setup is Complete:
```
🎉 Setup Complete!

✅ Metro bundler running
✅ iOS Simulator booted
✅ PhysioAssist app installed and running
✅ Hot reload working
✅ All validations passed

You can now:
1. Edit files in src/ → Changes appear automatically
2. Use npm run ios:watch for auto-reload mode
3. Use npm run xcode:debug for debugging tools
4. Use npm run xcode:instruments for profiling

Happy coding! 🚀
```

---

## 🔄 Common User Requests and Responses

### Request: "Start the app"
**Response:**
```bash
npm run claude:dev
```
**Then tell user:** "Starting development environment... Metro bundler will start, simulator will boot, and app will launch. This takes about 30-60 seconds."

### Request: "Reload the app"
**Response:**
```bash
./scripts/ios/claude-bridge.sh reload
```
**Then tell user:** "Reloading app... Changes should appear in 1-2 seconds."

### Request: "Is everything working?"
**Response:**
```bash
npm run claude:health && npm run claude:status
```
**Then parse and report:** "Metro: ✅, Simulator: ✅, Xcode: ✅"

### Request: "The app isn't updating"
**Response:**
```bash
# Check Metro status
STATUS=$(npm run claude:status --silent)
METRO=$(echo "$STATUS" | jq -r '.data.metro_running')

if [ "$METRO" == "false" ]; then
  echo "Metro not running. Restarting..."
  npm run claude:dev
else
  echo "Metro is running. Trying reload..."
  ./scripts/ios/claude-bridge.sh reload
fi
```

### Request: "Run tests"
**Response:**
```bash
npm run gate:validate
npm run ios:validate
```
**Then report results:** "36/36 tests passed ✅" or specific failures

### Request: "Start over / Reset everything"
**Response:**
```bash
# Stop everything
npm run ios:stop
killall Simulator 2>/dev/null || true

# Clean and restart
npm run ios:clean
npm run claude:dev
```
**Then tell user:** "Resetting environment... This will take 2-3 minutes."

---

## 💡 Pro Tips for Claude Code CLI

### Tip 1: Always Check State First
```bash
# Before any action, check current state
STATE=$(cat .claude-bridge/state.json)
echo "$STATE" | jq '.'
```

### Tip 2: Use JSON for All Decisions
```bash
# Don't rely on text output, parse JSON
RESULT=$(./scripts/ios/claude-bridge.sh status)
SUCCESS=$(echo "$RESULT" | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  # Proceed
else
  # Handle error
fi
```

### Tip 3: Monitor Logs for Context
```bash
# Before reporting an error, check logs
tail -20 .claude-bridge/bridge.log
tail -20 metro.log
```

### Tip 4: Use HTTP Server for Complex Automation
```bash
# Start server in background
npm run claude:bridge-server &
sleep 3

# Now use curl for all operations
curl -s http://127.0.0.1:3737/status | jq '.'
```

### Tip 5: Provide Context to User
```bash
# Don't just say "Failed", explain why
RESULT=$(./scripts/ios/claude-bridge.sh build-simulator false)
if [ "$(echo "$RESULT" | jq -r '.success')" != "true" ]; then
  ERROR=$(echo "$RESULT" | jq -r '.message')
  echo "Build failed: $ERROR"
  echo "This usually means:"
  echo "  - Code syntax error"
  echo "  - Missing dependencies"
  echo "  - Xcode configuration issue"
  echo ""
  echo "Checking logs for more details..."
  tail -30 .claude-bridge/bridge.log | grep -i error
fi
```

---

## 🎓 Training Scenarios

### Scenario 1: First-Time Setup
**User says:** "Help me set up iOS development"

**Claude Code CLI should:**
1. Run: `npm run claude:health`
2. Parse JSON, identify missing components
3. Guide user to install (Xcode, CocoaPods, etc.)
4. Run: `npm run xcode:setup`
5. Help with code signing if needed
6. Run: `npm run claude:dev`
7. Confirm success with status check
8. Tell user they're ready to develop!

### Scenario 2: Build Error
**User says:** "The build failed"

**Claude Code CLI should:**
1. Check: `cat .claude-bridge/errors.json`
2. Check logs: `tail -50 .claude-bridge/bridge.log`
3. Parse error type
4. Suggest specific fix based on error
5. If needed, run clean build: `./scripts/ios/claude-bridge.sh build-simulator true`
6. Monitor progress and report

### Scenario 3: Making Changes
**User says:** "I changed the code, how do I see it?"

**Claude Code CLI should:**
1. Check if auto-iterate is running: `ps aux | grep claude-auto-iterate`
2. If not, suggest: `npm run claude:iterate`
3. If running, just tell user to save
4. Or manually reload: `./scripts/ios/claude-bridge.sh reload`
5. Confirm reload success

### Scenario 4: Performance Testing
**User says:** "Is the app fast enough?"

**Claude Code CLI should:**
1. Run: `npm run ios:validate`
2. Run: `npm run xcode:instruments`
3. Parse results from `test-results/ios/`
4. Report specific metrics (FPS, memory, etc.)
5. Suggest optimizations if needed

---

## 📚 Quick Reference Commands

```bash
# Status and Health
npm run claude:status              # Get current status (JSON)
npm run claude:health              # Run health check (JSON)

# Development
npm run claude:dev                 # One-command setup
npm run claude:iterate             # Auto-reload mode
./scripts/ios/claude-bridge.sh reload  # Manual reload

# Testing
npm run gate:validate              # Run 5 gates
npm run ios:validate               # Full validation
npm run ios:validate:device        # On physical device

# HTTP Server
npm run claude:bridge-server       # Start on port 3737
curl http://127.0.0.1:3737/status  # Check status
curl -X POST http://127.0.0.1:3737/reload  # Reload

# Logs
tail -f .claude-bridge/bridge.log  # Bridge operations
tail -f metro.log                  # Metro bundler
cat .claude-bridge/state.json     # Current state

# Xcode Tools
npm run xcode:setup                # Full Xcode setup
npm run xcode:fast                 # Optimize builds
npm run xcode:instruments          # Profiling
npm run xcode:debug                # Debug tools

# Cleanup
npm run ios:stop                   # Stop Metro
npm run ios:clean                  # Clean build
npm run ios:reset                  # Full reset
```

---

## 🎉 Success Checklist for Claude Code CLI

After setup, verify:

- [ ] Can get status: `npm run claude:status` returns valid JSON
- [ ] Can check health: `npm run claude:health` shows no critical issues
- [ ] Can start dev: `npm run claude:dev` succeeds
- [ ] Can reload: `./scripts/ios/claude-bridge.sh reload` works
- [ ] Can run tests: `npm run gate:validate` passes
- [ ] State file exists: `.claude-bridge/state.json` is readable
- [ ] User sees app in simulator
- [ ] Hot reload works when editing files

**If all checked:** ✅ Setup successful, user ready to develop!

---

## 🆘 Emergency Commands

If everything breaks:

```bash
# 1. Stop everything
npm run ios:stop
killall Simulator 2>/dev/null || true
killall Xcode 2>/dev/null || true
killall node 2>/dev/null || true

# 2. Clean everything
npm run ios:clean

# 3. Restart from scratch
npm run claude:dev

# 4. If still broken, full reset
npm run ios:reset
```

---

**This manual gives Claude Code CLI complete control over iOS development with zero limitations!** 🚀
