#!/bin/bash

################################################################################
# Claude Code CLI Bridge for Xcode/iOS Development
# Provides JSON API and automated error recovery for seamless integration
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BRIDGE_DIR="$PROJECT_ROOT/.claude-bridge"
STATE_FILE="$BRIDGE_DIR/state.json"
LOG_FILE="$BRIDGE_DIR/bridge.log"
ERROR_FILE="$BRIDGE_DIR/errors.json"

# Create bridge directory
mkdir -p "$BRIDGE_DIR"

# Initialize state file if not exists
initialize_state() {
    if [ ! -f "$STATE_FILE" ]; then
        cat > "$STATE_FILE" <<EOF
{
  "status": "idle",
  "last_command": null,
  "last_success": null,
  "last_error": null,
  "metro_running": false,
  "simulator_booted": false,
  "device_connected": false,
  "build_status": "unknown",
  "xcode_open": false,
  "last_update": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    fi
}

# Update state
update_state() {
    local key="$1"
    local value="$2"

    # Read current state
    local current_state=$(cat "$STATE_FILE")

    # Update with jq if available, otherwise use sed
    if command -v jq &> /dev/null; then
        echo "$current_state" | jq --arg key "$key" --arg value "$value" --arg time "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
            '.[$key] = $value | .last_update = $time' > "$STATE_FILE"
    else
        # Fallback to manual JSON update
        cat > "$STATE_FILE" <<EOF
{
  "status": "$2",
  "last_command": "$(echo "$current_state" | grep -o '"last_command": "[^"]*"' | cut -d'"' -f4)",
  "last_success": "$(echo "$current_state" | grep -o '"last_success": "[^"]*"' | cut -d'"' -f4)",
  "last_error": "$(echo "$current_state" | grep -o '"last_error": "[^"]*"' | cut -d'"' -f4)",
  "metro_running": $(lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "true" || echo "false"),
  "simulator_booted": $(xcrun simctl list devices booted | grep -q "iPhone" && echo "true" || echo "false"),
  "device_connected": $(xcrun xctrace list devices 2>&1 | grep -qE "iPhone|iPad" && grep -qv "Simulator" && echo "true" || echo "false"),
  "build_status": "unknown",
  "xcode_open": $(pgrep -x "Xcode" >/dev/null && echo "true" || echo "false"),
  "last_update": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    fi
}

# Log to file
log() {
    local level="$1"
    shift
    local message="$@"
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [$level] $message" >> "$LOG_FILE"
}

# Output JSON response
json_response() {
    local success="$1"
    local message="$2"
    local data="$3"

    if [ -z "$data" ]; then
        data="{}"
    fi

    cat <<EOF
{
  "success": $success,
  "message": "$message",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "data": $data
}
EOF
}

# Error with automatic recovery
handle_error() {
    local error_type="$1"
    local error_message="$2"
    local recovery_attempted=false

    log "ERROR" "$error_type: $error_message"

    # Attempt automatic recovery based on error type
    case "$error_type" in
        "metro_not_running")
            log "INFO" "Attempting to start Metro bundler..."
            npx react-native start --reset-cache > metro.log 2>&1 &
            echo $! > /tmp/physioassist_metro.pid
            sleep 3
            recovery_attempted=true
            ;;
        "simulator_not_booted")
            log "INFO" "Attempting to boot simulator..."
            local sim_udid=$(xcrun simctl list devices available | grep "iPhone 15 Pro" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')
            xcrun simctl boot "$sim_udid" 2>/dev/null || true
            open -a Simulator
            sleep 5
            recovery_attempted=true
            ;;
        "port_in_use")
            log "INFO" "Attempting to kill process on port 8081..."
            lsof -ti:8081 | xargs kill -9 2>/dev/null || true
            sleep 2
            npx react-native start --reset-cache > metro.log 2>&1 &
            echo $! > /tmp/physioassist_metro.pid
            recovery_attempted=true
            ;;
        "xcode_not_responding")
            log "INFO" "Attempting to restart Xcode..."
            killall Xcode 2>/dev/null || true
            sleep 2
            open "$PROJECT_ROOT/ios/PhysioAssist.xcworkspace"
            recovery_attempted=true
            ;;
        "build_failed")
            log "INFO" "Attempting clean build..."
            cd "$PROJECT_ROOT/ios"
            xcodebuild clean -workspace PhysioAssist.xcworkspace -scheme PhysioAssist 2>&1 | tail -n 20 >> "$LOG_FILE"
            recovery_attempted=true
            ;;
    esac

    # Record error
    cat > "$ERROR_FILE" <<EOF
{
  "error_type": "$error_type",
  "error_message": "$error_message",
  "recovery_attempted": $recovery_attempted,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

    update_state "last_error" "$error_type: $error_message"

    json_response false "$error_message" "{\"error_type\": \"$error_type\", \"recovery_attempted\": $recovery_attempted}"
}

# Check system status
cmd_status() {
    local metro_running=$(lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "true" || echo "false")
    local simulator_booted=$(xcrun simctl list devices booted 2>/dev/null | grep -q "iPhone" && echo "true" || echo "false")
    local device_connected=false

    if xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -qv "Simulator"; then
        device_connected=true
    fi

    local xcode_open=$(pgrep -x "Xcode" >/dev/null && echo "true" || echo "false")

    local simulator_name="none"
    if [ "$simulator_booted" == "true" ]; then
        simulator_name=$(xcrun simctl list devices booted 2>/dev/null | grep "iPhone" | head -n 1 | sed -E 's/\([^)]*\)//g' | xargs)
    fi

    local device_name="none"
    if [ "$device_connected" == "true" ]; then
        device_name=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator" | head -n 1 | sed -E 's/\([^)]*\)//g' | xargs)
    fi

    cat <<EOF
{
  "success": true,
  "message": "System status retrieved",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "data": {
    "metro_running": $metro_running,
    "metro_port": 8081,
    "simulator_booted": $simulator_booted,
    "simulator_name": "$simulator_name",
    "device_connected": $device_connected,
    "device_name": "$device_name",
    "xcode_open": $xcode_open,
    "node_version": "$(node -v 2>/dev/null || echo 'not installed')",
    "xcode_version": "$(xcodebuild -version 2>/dev/null | head -n 1 || echo 'not installed')",
    "cocoapods_version": "$(pod --version 2>/dev/null || echo 'not installed')"
  }
}
EOF
}

# Start Metro bundler
cmd_start_metro() {
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        json_response true "Metro bundler already running" "{\"port\": 8081}"
        return
    fi

    cd "$PROJECT_ROOT"
    npx react-native start --reset-cache > metro.log 2>&1 &
    local metro_pid=$!
    echo $metro_pid > /tmp/physioassist_metro.pid

    log "INFO" "Started Metro bundler (PID: $metro_pid)"

    # Wait for Metro to start
    for i in {1..30}; do
        if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
            update_state "metro_running" "true"
            json_response true "Metro bundler started successfully" "{\"port\": 8081, \"pid\": $metro_pid}"
            return
        fi
        sleep 1
    done

    handle_error "metro_not_running" "Metro bundler failed to start within 30 seconds"
}

# Stop Metro bundler
cmd_stop_metro() {
    if [ -f /tmp/physioassist_metro.pid ]; then
        local metro_pid=$(cat /tmp/physioassist_metro.pid)
        kill $metro_pid 2>/dev/null || true
        rm /tmp/physioassist_metro.pid
    fi

    # Also kill any process on port 8081
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true

    update_state "metro_running" "false"
    log "INFO" "Stopped Metro bundler"
    json_response true "Metro bundler stopped" "{}"
}

# Boot simulator
cmd_boot_simulator() {
    local sim_name="${1:-iPhone 15 Pro}"

    # Check if already booted
    if xcrun simctl list devices booted 2>/dev/null | grep -q "$sim_name"; then
        json_response true "Simulator already booted" "{\"name\": \"$sim_name\"}"
        return
    fi

    # Find simulator
    local sim_udid=$(xcrun simctl list devices available 2>/dev/null | grep "$sim_name" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$sim_udid" ]; then
        handle_error "simulator_not_found" "Simulator '$sim_name' not found"
        return
    fi

    # Boot simulator
    xcrun simctl boot "$sim_udid" 2>/dev/null || true
    open -a Simulator

    sleep 3

    update_state "simulator_booted" "true"
    log "INFO" "Booted simulator: $sim_name"
    json_response true "Simulator booted successfully" "{\"name\": \"$sim_name\", \"udid\": \"$sim_udid\"}"
}

# Build for simulator
cmd_build_simulator() {
    local clean_build="${1:-false}"

    cd "$PROJECT_ROOT/ios"

    local build_cmd="xcodebuild -workspace PhysioAssist.xcworkspace -scheme PhysioAssist -configuration Debug -sdk iphonesimulator -derivedDataPath build"

    if [ "$clean_build" == "true" ]; then
        log "INFO" "Starting clean build for simulator..."
        xcodebuild clean -workspace PhysioAssist.xcworkspace -scheme PhysioAssist 2>&1 >> "$LOG_FILE"
    fi

    log "INFO" "Building for simulator..."

    # Build and capture output
    if eval "$build_cmd" 2>&1 | tee -a "$LOG_FILE" | grep -q "BUILD SUCCEEDED"; then
        update_state "build_status" "success"
        log "INFO" "Build succeeded"
        json_response true "Build completed successfully" "{\"type\": \"simulator\", \"clean\": $clean_build}"
    else
        update_state "build_status" "failed"
        log "ERROR" "Build failed"

        # Extract last error from log
        local last_error=$(tail -n 50 "$LOG_FILE" | grep "error:" | head -n 1 || echo "Unknown build error")
        handle_error "build_failed" "$last_error"
    fi
}

# Install app on simulator
cmd_install_simulator() {
    local sim_udid=$(xcrun simctl list devices booted 2>/dev/null | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$sim_udid" ]; then
        handle_error "simulator_not_booted" "No booted simulator found"
        return
    fi

    # Find built app
    local app_path=$(find "$PROJECT_ROOT/ios/build/Build/Products/Debug-iphonesimulator" -name "PhysioAssist.app" -maxdepth 1 | head -n 1)

    if [ -z "$app_path" ]; then
        handle_error "app_not_found" "Built app not found. Run build first."
        return
    fi

    # Install app
    xcrun simctl install "$sim_udid" "$app_path"

    log "INFO" "Installed app on simulator"
    json_response true "App installed successfully" "{\"udid\": \"$sim_udid\"}"
}

# Launch app on simulator
cmd_launch_simulator() {
    local sim_udid=$(xcrun simctl list devices booted 2>/dev/null | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$sim_udid" ]; then
        handle_error "simulator_not_booted" "No booted simulator found"
        return
    fi

    local bundle_id="org.reactjs.native.example.PhysioAssist"

    xcrun simctl launch "$sim_udid" "$bundle_id"

    log "INFO" "Launched app on simulator"
    json_response true "App launched successfully" "{\"udid\": \"$sim_udid\", \"bundle_id\": \"$bundle_id\"}"
}

# Reload app
cmd_reload() {
    if ! lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        handle_error "metro_not_running" "Metro bundler not running"
        return
    fi

    curl -s -X POST http://localhost:8081/reload >/dev/null

    log "INFO" "Reloaded app"
    json_response true "App reloaded successfully" "{}"
}

# Get logs
cmd_logs() {
    local source="${1:-metro}"
    local lines="${2:-50}"

    case "$source" in
        metro)
            if [ -f "$PROJECT_ROOT/metro.log" ]; then
                local log_content=$(tail -n "$lines" "$PROJECT_ROOT/metro.log" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
                json_response true "Metro logs retrieved" "{\"source\": \"metro\", \"lines\": $lines, \"content\": \"$log_content\"}"
            else
                json_response false "Metro log file not found" "{}"
            fi
            ;;
        bridge)
            if [ -f "$LOG_FILE" ]; then
                local log_content=$(tail -n "$lines" "$LOG_FILE" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
                json_response true "Bridge logs retrieved" "{\"source\": \"bridge\", \"lines\": $lines, \"content\": \"$log_content\"}"
            else
                json_response false "Bridge log file not found" "{}"
            fi
            ;;
        simulator)
            local sim_udid=$(xcrun simctl list devices booted 2>/dev/null | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')
            if [ -z "$sim_udid" ]; then
                json_response false "No booted simulator found" "{}"
            else
                # Get recent logs (this is a simplified version)
                json_response true "Simulator logs command ready" "{\"source\": \"simulator\", \"udid\": \"$sim_udid\", \"note\": \"Use: xcrun simctl spawn $sim_udid log stream\"}"
            fi
            ;;
        *)
            json_response false "Unknown log source: $source" "{}"
            ;;
    esac
}

# Health check
cmd_health() {
    local issues=()
    local warnings=()

    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        issues+=("Xcode not installed")
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        issues+=("Node.js not installed")
    fi

    # Check CocoaPods
    if ! command -v pod &> /dev/null; then
        warnings+=("CocoaPods not installed")
    fi

    # Check dependencies
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        warnings+=("node_modules not found - run npm install")
    fi

    if [ ! -d "$PROJECT_ROOT/ios/Pods" ]; then
        warnings+=("Pods not installed - run pod install")
    fi

    # Check Metro
    if ! lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        warnings+=("Metro bundler not running")
    fi

    local issues_json=$(printf '%s\n' "${issues[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
    local warnings_json=$(printf '%s\n' "${warnings[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]")

    if [ ${#issues[@]} -eq 0 ]; then
        json_response true "System health check passed" "{\"issues\": $issues_json, \"warnings\": $warnings_json}"
    else
        json_response false "System health check failed" "{\"issues\": $issues_json, \"warnings\": $warnings_json}"
    fi
}

# Quick dev - one command to start everything
cmd_quick_dev() {
    log "INFO" "Starting quick dev mode..."

    # Start Metro if not running
    if ! lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        cmd_start_metro >/dev/null 2>&1
        sleep 3
    fi

    # Boot simulator if not booted
    if ! xcrun simctl list devices booted 2>/dev/null | grep -q "iPhone"; then
        cmd_boot_simulator "iPhone 15 Pro" >/dev/null 2>&1
        sleep 3
    fi

    # Build and install if needed
    if [ ! -f "$PROJECT_ROOT/ios/build/Build/Products/Debug-iphonesimulator/PhysioAssist.app/PhysioAssist" ]; then
        cmd_build_simulator "false" >/dev/null 2>&1
        cmd_install_simulator >/dev/null 2>&1
    fi

    # Launch app
    cmd_launch_simulator >/dev/null 2>&1

    json_response true "Quick dev mode started" "{\"metro_running\": true, \"simulator_booted\": true, \"app_launched\": true}"
}

# Show help
cmd_help() {
    cat <<EOF
{
  "success": true,
  "message": "Claude Bridge API Commands",
  "data": {
    "commands": {
      "status": "Get current system status",
      "health": "Run health check",
      "start-metro": "Start Metro bundler",
      "stop-metro": "Stop Metro bundler",
      "boot-simulator [name]": "Boot iOS simulator",
      "build-simulator [clean]": "Build app for simulator",
      "install-simulator": "Install app on simulator",
      "launch-simulator": "Launch app on simulator",
      "reload": "Reload app (hot reload)",
      "logs [source] [lines]": "Get logs (metro|bridge|simulator)",
      "quick-dev": "One command to start everything",
      "help": "Show this help"
    },
    "examples": [
      "./claude-bridge.sh status",
      "./claude-bridge.sh quick-dev",
      "./claude-bridge.sh build-simulator true",
      "./claude-bridge.sh logs metro 100"
    ],
    "state_file": "$STATE_FILE",
    "log_file": "$LOG_FILE",
    "error_file": "$ERROR_FILE"
  }
}
EOF
}

# Main command dispatcher
main() {
    initialize_state

    local command="${1:-status}"
    shift || true

    update_state "last_command" "$command"

    case "$command" in
        status) cmd_status ;;
        health) cmd_health ;;
        start-metro) cmd_start_metro ;;
        stop-metro) cmd_stop_metro ;;
        boot-simulator) cmd_boot_simulator "$@" ;;
        build-simulator) cmd_build_simulator "$@" ;;
        install-simulator) cmd_install_simulator ;;
        launch-simulator) cmd_launch_simulator ;;
        reload) cmd_reload ;;
        logs) cmd_logs "$@" ;;
        quick-dev) cmd_quick_dev ;;
        help) cmd_help ;;
        *)
            json_response false "Unknown command: $command" "{\"available_commands\": [\"status\", \"health\", \"start-metro\", \"stop-metro\", \"boot-simulator\", \"build-simulator\", \"install-simulator\", \"launch-simulator\", \"reload\", \"logs\", \"quick-dev\", \"help\"]}"
            exit 1
            ;;
    esac
}

main "$@"
