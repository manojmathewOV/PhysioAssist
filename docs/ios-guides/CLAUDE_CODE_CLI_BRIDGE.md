# 🌉 Claude Code CLI Bridge - Complete Integration Guide

**Seamless Xcode/iOS integration for Claude Code CLI with automatic error recovery**

This bridge system eliminates common Claude Code CLI limitations when working with Xcode and iOS development.

---

## 🎯 What This Solves

### Common Claude Code CLI Limitations (SOLVED)
- ❌ Cannot directly control Xcode
- ❌ Cannot interact with iOS Simulator programmatically
- ❌ Limited visibility into build status
- ❌ No automatic error recovery
- ❌ Difficult to track Metro bundler state
- ❌ Cannot monitor logs in real-time
- ❌ Manual intervention required for common issues

### Bridge Features (ENABLED)
- ✅ **JSON API** - Programmatic control of all iOS operations
- ✅ **HTTP Server** - RESTful API for remote control
- ✅ **Auto-Iterate** - Automatic reload with error recovery
- ✅ **State Management** - Real-time status tracking
- ✅ **Error Recovery** - Automatic fixing of common issues
- ✅ **Log Aggregation** - Centralized log access
- ✅ **Health Checks** - Proactive problem detection

---

## ⚡ Quick Start for Claude Code CLI

### 1. One-Command Development

```bash
# Start everything automatically
npm run claude:dev

# Or use the bridge directly
./scripts/ios/claude-bridge.sh quick-dev
```

**This command:**
- ✅ Starts Metro bundler (if not running)
- ✅ Boots iOS Simulator (if not booted)
- ✅ Builds app (if not built)
- ✅ Installs and launches app
- ✅ Returns JSON status

### 2. Auto-Iterate Mode (Recommended)

```bash
# Start intelligent auto-reload with error recovery
npm run claude:iterate
```

**Features:**
- Edit any file → Auto-reload in 1 second
- Automatic Metro restart on failure
- Error recovery (up to 3 attempts)
- Iteration tracking and logging
- No manual intervention needed

### 3. HTTP API Server (Advanced)

```bash
# Start HTTP bridge server
npm run claude:bridge-server

# Server runs on: http://127.0.0.1:3737
```

---

## 🔌 JSON API Interface

All bridge commands return JSON responses:

```json
{
  "success": true,
  "message": "Description of result",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    // Command-specific data
  }
}
```

### Available Commands

#### 1. System Status

```bash
./scripts/ios/claude-bridge.sh status
```

**Response:**
```json
{
  "success": true,
  "message": "System status retrieved",
  "data": {
    "metro_running": true,
    "metro_port": 8081,
    "simulator_booted": true,
    "simulator_name": "iPhone 15 Pro",
    "device_connected": false,
    "xcode_open": true,
    "node_version": "v18.0.0",
    "xcode_version": "Xcode 15.0"
  }
}
```

#### 2. Health Check

```bash
./scripts/ios/claude-bridge.sh health
```

**Response:**
```json
{
  "success": true,
  "message": "System health check passed",
  "data": {
    "issues": [],
    "warnings": ["Metro bundler not running"]
  }
}
```

#### 3. Start Metro

```bash
./scripts/ios/claude-bridge.sh start-metro
```

**Automatic recovery:** If port 8081 is busy, kills existing process and restarts

#### 4. Boot Simulator

```bash
./scripts/ios/claude-bridge.sh boot-simulator "iPhone 15 Pro"
```

**Automatic recovery:** If simulator won't boot, tries alternate simulators

#### 5. Build App

```bash
# Regular build
./scripts/ios/claude-bridge.sh build-simulator false

# Clean build
./scripts/ios/claude-bridge.sh build-simulator true
```

**Automatic recovery:** If build fails, performs clean build automatically

#### 6. Hot Reload

```bash
./scripts/ios/claude-bridge.sh reload
```

**Automatic recovery:** If reload fails, restarts Metro and retries

#### 7. Get Logs

```bash
# Metro logs
./scripts/ios/claude-bridge.sh logs metro 100

# Bridge logs
./scripts/ios/claude-bridge.sh logs bridge 50

# Simulator logs
./scripts/ios/claude-bridge.sh logs simulator
```

---

## 🌐 HTTP API Usage

### Start Server

```bash
npm run claude:bridge-server
# Server: http://127.0.0.1:3737
```

### Endpoints

#### GET /status
```bash
curl http://127.0.0.1:3737/status
```

#### GET /health
```bash
curl http://127.0.0.1:3737/health
```

#### POST /quick-dev
```bash
curl -X POST http://127.0.0.1:3737/quick-dev
```

#### POST /reload
```bash
curl -X POST http://127.0.0.1:3737/reload
```

#### POST /command (Generic)
```bash
curl -X POST http://127.0.0.1:3737/command \
  -H "Content-Type: application/json" \
  -d '{"command": "status", "args": []}'
```

#### GET /watch (Server-Sent Events)
```bash
# Real-time state updates
curl http://127.0.0.1:3737/watch
```

**Streams JSON updates whenever state changes**

---

## 🤖 Claude Code CLI Integration Patterns

### Pattern 1: Status Check Before Action

```bash
# Always check status first
STATUS=$(./scripts/ios/claude-bridge.sh status)

# Parse with jq
METRO_RUNNING=$(echo "$STATUS" | jq -r '.data.metro_running')

if [ "$METRO_RUNNING" == "false" ]; then
  ./scripts/ios/claude-bridge.sh start-metro
fi
```

### Pattern 2: Error Handling

```bash
# All commands return success/failure
RESULT=$(./scripts/ios/claude-bridge.sh reload)
SUCCESS=$(echo "$RESULT" | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo "✓ Reload successful"
else
  ERROR_MSG=$(echo "$RESULT" | jq -r '.message')
  echo "✗ Reload failed: $ERROR_MSG"

  # Check if recovery was attempted
  RECOVERY=$(echo "$RESULT" | jq -r '.data.recovery_attempted')
  if [ "$RECOVERY" == "true" ]; then
    echo "→ Automatic recovery attempted"
  fi
fi
```

### Pattern 3: State File Monitoring

```bash
# Watch state file for changes
STATE_FILE=".claude-bridge/state.json"

# Read current state
cat "$STATE_FILE" | jq '.'

# Monitor in real-time (requires fswatch)
fswatch -o "$STATE_FILE" | while read; do
  cat "$STATE_FILE" | jq '.'
done
```

### Pattern 4: HTTP API Integration

```bash
# Start server in background
npm run claude:bridge-server &
sleep 2

# Use curl for all operations
curl -s http://127.0.0.1:3737/status | jq '.data'
curl -s -X POST http://127.0.0.1:3737/reload | jq '.success'
```

---

## 🔄 Automatic Error Recovery

The bridge automatically handles these common issues:

### 1. Metro Not Running
**Error:** `metro_not_running`
**Recovery:** Automatically starts Metro bundler on port 8081

### 2. Port Already in Use
**Error:** `port_in_use`
**Recovery:** Kills process on port 8081 and restarts Metro

### 3. Simulator Not Booted
**Error:** `simulator_not_booted`
**Recovery:** Boots default simulator (iPhone 15 Pro)

### 4. Build Failed
**Error:** `build_failed`
**Recovery:** Performs clean build and retries

### 5. Xcode Not Responding
**Error:** `xcode_not_responding`
**Recovery:** Restarts Xcode and reopens workspace

---

## 📊 State Management

### State File Location
```
.claude-bridge/state.json
```

### State Structure
```json
{
  "status": "idle|running|building|error",
  "last_command": "reload",
  "last_success": "2024-01-01T12:00:00Z",
  "last_error": null,
  "metro_running": true,
  "simulator_booted": true,
  "device_connected": false,
  "build_status": "success|failed|unknown",
  "xcode_open": true,
  "last_update": "2024-01-01T12:00:00Z"
}
```

### Reading State (Shell)
```bash
cat .claude-bridge/state.json | jq '.metro_running'
```

### Reading State (Node.js)
```javascript
const state = require('./.claude-bridge/state.json');
console.log(state.metro_running);
```

---

## 🔍 Log Files

### Bridge Log
```bash
.claude-bridge/bridge.log
```

**Contains:** All bridge operations and automatic recovery actions

### Iteration Log
```bash
.claude-bridge/iterations.log
```

**Contains:** File change tracking and reload statistics

### Error Log
```bash
.claude-bridge/errors.json
```

**Contains:** Latest error with recovery details

### View Logs
```bash
# Last 50 lines of bridge log
tail -n 50 .claude-bridge/bridge.log

# Real-time bridge log
tail -f .claude-bridge/bridge.log

# Last 100 lines of Metro log
./scripts/ios/claude-bridge.sh logs metro 100
```

---

## 🚀 Complete Claude Code CLI Workflow

### Setup (One-Time)

```bash
# 1. Make scripts executable
chmod +x scripts/ios/*.sh

# 2. Verify environment
./scripts/ios/claude-bridge.sh health

# 3. Start quick dev mode
./scripts/ios/claude-bridge.sh quick-dev
```

### Development Loop

```bash
# Start auto-iterate mode
npm run claude:iterate

# Now edit any file in src/
# Save → Auto-reload in ~1 second
# Errors auto-recovered
```

### Manual Control

```bash
# Check status
./scripts/ios/claude-bridge.sh status

# Reload manually
./scripts/ios/claude-bridge.sh reload

# View logs
./scripts/ios/claude-bridge.sh logs metro 50

# Build clean
./scripts/ios/claude-bridge.sh build-simulator true
```

### HTTP API Mode

```bash
# Terminal 1: Start server
npm run claude:bridge-server

# Terminal 2: Use curl
curl http://127.0.0.1:3737/status | jq '.'
curl -X POST http://127.0.0.1:3737/reload

# Terminal 3: Edit files
# Auto-reload handled by server
```

---

## 🎯 npm Scripts (Quick Access)

```bash
# Auto-iterate mode (RECOMMENDED)
npm run claude:iterate

# Quick dev setup
npm run claude:dev

# Start HTTP bridge server
npm run claude:bridge-server

# Get status (JSON)
npm run claude:status

# Health check
npm run claude:health
```

---

## 🐛 Troubleshooting

### Bridge Not Working

```bash
# Check if scripts are executable
ls -la scripts/ios/claude-bridge.sh

# If not, make executable
chmod +x scripts/ios/claude-bridge.sh
chmod +x scripts/ios/claude-auto-iterate.sh
chmod +x scripts/ios/claude-bridge-server.js
```

### JSON Parsing Issues

```bash
# Install jq for better JSON handling
brew install jq

# Without jq, use grep
./scripts/ios/claude-bridge.sh status | grep "metro_running"
```

### Port 3737 Already in Use

```bash
# Use different port
BRIDGE_PORT=3838 npm run claude:bridge-server
```

### Auto-Iterate Not Working

```bash
# Install fswatch
brew install fswatch

# Check if it's running
ps aux | grep fswatch
```

### State File Corrupted

```bash
# Remove and reinitialize
rm -rf .claude-bridge
./scripts/ios/claude-bridge.sh status
```

---

## 📝 Example: Complete Automation Script

```bash
#!/bin/bash

# automation.sh - Complete iOS development automation

echo "🚀 Starting PhysioAssist iOS development..."

# 1. Check health
echo "Checking system health..."
HEALTH=$(./scripts/ios/claude-bridge.sh health)
SUCCESS=$(echo "$HEALTH" | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo "❌ Health check failed"
  echo "$HEALTH" | jq '.data'
  exit 1
fi

# 2. Quick dev setup
echo "Setting up development environment..."
./scripts/ios/claude-bridge.sh quick-dev

# 3. Wait for app to launch
sleep 5

# 4. Start auto-iterate
echo "Starting auto-iterate mode..."
./scripts/ios/claude-auto-iterate.sh &
ITERATE_PID=$!

# 5. Monitor and report
echo "Development environment ready!"
echo "Edit files in src/ to see automatic reloads"
echo "Press Ctrl+C to stop"

# Cleanup on exit
trap "kill $ITERATE_PID 2>/dev/null" EXIT

wait
```

---

## 🎓 Advanced: Custom Recovery Handlers

Add custom error recovery in `claude-bridge.sh`:

```bash
# In handle_error function
case "$error_type" in
  "custom_error")
    log "INFO" "Attempting custom recovery..."
    # Your recovery logic here
    recovery_attempted=true
    ;;
esac
```

---

## 🌟 Best Practices for Claude Code CLI

1. **Always Check Status First**
   ```bash
   ./scripts/ios/claude-bridge.sh status
   ```

2. **Use Auto-Iterate for Active Development**
   ```bash
   npm run claude:iterate
   ```

3. **Use HTTP API for Remote Control**
   ```bash
   npm run claude:bridge-server
   ```

4. **Monitor Logs for Issues**
   ```bash
   tail -f .claude-bridge/bridge.log
   ```

5. **Let Auto-Recovery Work**
   - Don't manually intervene immediately
   - Bridge attempts recovery up to 3 times
   - Check error log if recovery fails

---

## ✅ Verification Checklist

```bash
# 1. Health check passes
./scripts/ios/claude-bridge.sh health

# 2. Can start Metro
./scripts/ios/claude-bridge.sh start-metro

# 3. Can boot simulator
./scripts/ios/claude-bridge.sh boot-simulator

# 4. Can build app
./scripts/ios/claude-bridge.sh build-simulator false

# 5. Can reload app
./scripts/ios/claude-bridge.sh reload

# 6. Auto-iterate works
npm run claude:iterate
# Edit a file and save

# 7. HTTP server works
npm run claude:bridge-server
curl http://127.0.0.1:3737/status
```

---

## 📚 Related Documentation

- [iOS Testing Guide](docs/IOS_TESTING_GUIDE.md)
- [Mac Quick Start](MAC_QUICK_START.md)
- [iOS Quick Reference](IOS_QUICK_REFERENCE.md)

---

**The bridge eliminates all common Claude Code CLI limitations with iOS/Xcode development!** 🎉

**Recommended workflow:** `npm run claude:iterate` for fastest development with zero manual intervention.
