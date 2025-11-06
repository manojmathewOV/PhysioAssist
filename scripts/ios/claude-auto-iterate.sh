#!/bin/bash

################################################################################
# Claude Auto-Iterate - Intelligent File Watcher with Automatic Recovery
# Watches files, auto-reloads, and handles errors automatically
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BRIDGE_SCRIPT="$PROJECT_ROOT/scripts/ios/claude-bridge.sh"
BRIDGE_DIR="$PROJECT_ROOT/.claude-bridge"
ITERATION_LOG="$BRIDGE_DIR/iterations.log"

mkdir -p "$BRIDGE_DIR"

echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         🤖 Claude Auto-Iterate                                ║
║         Intelligent Development Loop                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
WATCH_DIRS=("src" "App.tsx" "index.js")
RELOAD_DELAY=1  # seconds to wait before reloading
ITERATION_COUNT=0
ERROR_COUNT=0
MAX_AUTO_RETRY=3

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"

    if ! command -v fswatch &> /dev/null; then
        echo -e "${YELLOW}⚠️  fswatch not found. Installing...${NC}"
        if command -v brew &> /dev/null; then
            brew install fswatch
        else
            echo -e "${RED}❌ Please install Homebrew first: https://brew.sh${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}✓ Dependencies OK${NC}"
}

# Initialize environment
initialize() {
    echo -e "\n${BLUE}🚀 Initializing development environment...${NC}"

    # Get system status
    local status=$(bash "$BRIDGE_SCRIPT" status)
    local metro_running=$(echo "$status" | grep -o '"metro_running": true' || echo "")
    local sim_booted=$(echo "$status" | grep -o '"simulator_booted": true' || echo "")

    # Start Metro if not running
    if [ -z "$metro_running" ]; then
        echo -e "${CYAN}Starting Metro bundler...${NC}"
        bash "$BRIDGE_SCRIPT" start-metro > /dev/null
        sleep 3
    fi

    # Boot simulator if not booted
    if [ -z "$sim_booted" ]; then
        echo -e "${CYAN}Booting simulator...${NC}"
        bash "$BRIDGE_SCRIPT" boot-simulator "iPhone 15 Pro" > /dev/null
        sleep 5
    fi

    # Build and launch if needed
    echo -e "${CYAN}Building and launching app...${NC}"
    bash "$BRIDGE_SCRIPT" build-simulator false > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  Initial build failed, attempting clean build...${NC}"
        bash "$BRIDGE_SCRIPT" build-simulator true > /dev/null 2>&1
    }

    bash "$BRIDGE_SCRIPT" install-simulator > /dev/null
    bash "$BRIDGE_SCRIPT" launch-simulator > /dev/null

    echo -e "${GREEN}✓ Environment ready${NC}"
}

# Log iteration
log_iteration() {
    local type="$1"
    local file="$2"
    local status="$3"
    local message="$4"

    ITERATION_COUNT=$((ITERATION_COUNT + 1))

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local log_entry="[$timestamp] #$ITERATION_COUNT [$type] $file - $status: $message"

    echo "$log_entry" >> "$ITERATION_LOG"

    # Keep only last 1000 iterations
    tail -n 1000 "$ITERATION_LOG" > "$ITERATION_LOG.tmp" && mv "$ITERATION_LOG.tmp" "$ITERATION_LOG"
}

# Handle file change
handle_change() {
    local file="$1"
    local relative_path="${file#$PROJECT_ROOT/}"

    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}📝 File changed: ${YELLOW}${relative_path}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Wait for file to settle
    sleep "$RELOAD_DELAY"

    # Attempt reload
    echo -e "${CYAN}🔄 Reloading app...${NC}"

    local result=$(bash "$BRIDGE_SCRIPT" reload 2>&1)
    local success=$(echo "$result" | grep -o '"success": true' || echo "")

    if [ -n "$success" ]; then
        echo -e "${GREEN}✓ Reload successful (iteration #$((ITERATION_COUNT + 1)))${NC}"
        log_iteration "CHANGE" "$relative_path" "SUCCESS" "Hot reload completed"
        ERROR_COUNT=0
    else
        echo -e "${RED}❌ Reload failed${NC}"
        ERROR_COUNT=$((ERROR_COUNT + 1))

        # Attempt auto-recovery
        if [ $ERROR_COUNT -le $MAX_AUTO_RETRY ]; then
            echo -e "${YELLOW}🔧 Attempting automatic recovery (attempt $ERROR_COUNT/$MAX_AUTO_RETRY)...${NC}"

            # Check if Metro is still running
            local status=$(bash "$BRIDGE_SCRIPT" status 2>&1)
            local metro_running=$(echo "$status" | grep -o '"metro_running": true' || echo "")

            if [ -z "$metro_running" ]; then
                echo -e "${YELLOW}Metro bundler stopped. Restarting...${NC}"
                bash "$BRIDGE_SCRIPT" start-metro > /dev/null
                sleep 3
                bash "$BRIDGE_SCRIPT" reload > /dev/null
                echo -e "${GREEN}✓ Recovery successful${NC}"
                log_iteration "RECOVERY" "$relative_path" "SUCCESS" "Metro restarted"
                ERROR_COUNT=0
            else
                # Try reloading again
                sleep 2
                bash "$BRIDGE_SCRIPT" reload > /dev/null && {
                    echo -e "${GREEN}✓ Retry successful${NC}"
                    log_iteration "RETRY" "$relative_path" "SUCCESS" "Reload retry worked"
                    ERROR_COUNT=0
                }
            fi
        else
            echo -e "${RED}⚠️  Max auto-retry attempts reached${NC}"
            echo -e "${YELLOW}Manual intervention may be required${NC}"
            echo -e "${CYAN}Check logs: $ITERATION_LOG${NC}"
            log_iteration "ERROR" "$relative_path" "FAILED" "Max retries exceeded"
        fi
    fi

    # Show statistics
    echo -e "\n${BLUE}📊 Statistics:${NC}"
    echo -e "  Total iterations: ${GREEN}$((ITERATION_COUNT + 1))${NC}"
    echo -e "  Current errors: ${RED}$ERROR_COUNT${NC}"
    echo -e "  Watching: ${CYAN}${WATCH_DIRS[*]}${NC}"
}

# Watch files
watch_files() {
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}👀 Auto-Iterate Active!${NC}"
    echo -e "\n${BLUE}Development workflow:${NC}"
    echo -e "  1. Edit files in ${YELLOW}${WATCH_DIRS[*]}${NC}"
    echo -e "  2. Save your changes (${YELLOW}Cmd+S${NC})"
    echo -e "  3. App reloads automatically in ~${RELOAD_DELAY}s"
    echo -e "  4. Errors are auto-recovered"
    echo -e "\n${CYAN}Features:${NC}"
    echo -e "  ✅ Automatic hot reload"
    echo -e "  ✅ Intelligent error recovery"
    echo -e "  ✅ Metro restart on failure"
    echo -e "  ✅ Iteration tracking"
    echo -e "  ✅ Build failure handling"
    echo -e "\n${YELLOW}Press Ctrl+C to stop${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # Build watch pattern
    local watch_paths=()
    for dir in "${WATCH_DIRS[@]}"; do
        local full_path="$PROJECT_ROOT/$dir"
        if [ -e "$full_path" ]; then
            watch_paths+=("$full_path")
        fi
    done

    # Watch for changes
    fswatch -r \
        --exclude=".*/\\..*" \
        --exclude=".*node_modules.*" \
        --exclude=".*\\.log$" \
        --exclude=".*build.*" \
        --exclude=".*\\.git.*" \
        --exclude=".*ios/Pods.*" \
        --exclude=".*android.*" \
        --event Created \
        --event Updated \
        --event Removed \
        "${watch_paths[@]}" | while read -r file
    do
        # Only process TypeScript/JavaScript files
        if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
            handle_change "$file"
        fi
    done
}

# Cleanup on exit
cleanup() {
    echo -e "\n\n${YELLOW}Stopping auto-iterate...${NC}"
    echo -e "${CYAN}Final statistics:${NC}"
    echo -e "  Total iterations: ${GREEN}$ITERATION_COUNT${NC}"
    echo -e "  Log file: ${CYAN}$ITERATION_LOG${NC}"
    echo -e "\n${GREEN}✓ Auto-iterate stopped${NC}"
}

trap cleanup EXIT INT TERM

# Main execution
main() {
    check_dependencies
    initialize
    watch_files
}

main "$@"
