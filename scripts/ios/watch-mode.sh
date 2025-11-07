#!/bin/bash

################################################################################
# iOS Watch Mode - Iterative Development Workflow
# Auto-rebuilds and hot-reloads on file changes
################################################################################

set -e

echo "⚡ iOS Watch Mode - Iterative Development"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
TARGET="${1:-simulator}" # simulator or device
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WATCH_DIRS=("src" "App.tsx")

cd "$PROJECT_ROOT"

echo -e "${BLUE}🎯 Target: ${YELLOW}${TARGET}${NC}"
echo -e "${BLUE}📁 Watching: ${YELLOW}${WATCH_DIRS[*]}${NC}"

# Check if Metro is running
check_metro() {
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Start Metro bundler
start_metro() {
    if check_metro; then
        echo -e "${GREEN}✓ Metro bundler already running${NC}"
        return 0
    fi

    echo -e "\n${BLUE}🚀 Starting Metro bundler...${NC}"
    npx react-native start --reset-cache > metro.log 2>&1 &
    METRO_PID=$!
    echo $METRO_PID > /tmp/physioassist_metro.pid

    sleep 3
    if check_metro; then
        echo -e "${GREEN}✓ Metro bundler started (PID: $METRO_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start Metro${NC}"
        exit 1
    fi
}

# Install fswatch if not present
check_fswatch() {
    if ! command -v fswatch &> /dev/null; then
        echo -e "${YELLOW}⚠️  fswatch not found. Installing via Homebrew...${NC}"
        if command -v brew &> /dev/null; then
            brew install fswatch
        else
            echo -e "${RED}❌ Please install Homebrew first: https://brew.sh${NC}"
            exit 1
        fi
    fi
}

# Reload app
reload_app() {
    echo -e "\n${CYAN}🔄 Reloading app...${NC}"

    # Send reload command to Metro
    curl -s -X POST http://localhost:8081/reload > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Reload command sent${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not send reload command${NC}"
    fi
}

# Watch for file changes
watch_files() {
    echo -e "\n${BLUE}👀 Watching for file changes...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

    # Build watch pattern
    WATCH_PATTERN=""
    for dir in "${WATCH_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            WATCH_PATTERN="$WATCH_PATTERN $dir"
        elif [ -f "$dir" ]; then
            WATCH_PATTERN="$WATCH_PATTERN $dir"
        fi
    done

    # Use fswatch to monitor changes
    fswatch -r \
        --exclude=".*/\\..*" \
        --exclude=".*node_modules.*" \
        --exclude=".*\\.log$" \
        --exclude=".*build.*" \
        --exclude=".*\\.git.*" \
        --event Created \
        --event Updated \
        --event Removed \
        $WATCH_PATTERN | while read -r file
    do
        # Get relative path for display
        REL_PATH="${file#$PROJECT_ROOT/}"

        echo -e "\n${CYAN}📝 File changed: ${YELLOW}${REL_PATH}${NC}"

        # Only reload for TypeScript/JavaScript files
        if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
            reload_app
        fi
    done
}

# Enhanced development tips
show_dev_tips() {
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}⚡ Watch mode active!${NC}"
    echo -e "\n${BLUE}Development workflow:${NC}"
    echo -e "  1. Edit files in ${YELLOW}src/${NC} or ${YELLOW}App.tsx${NC}"
    echo -e "  2. Save your changes"
    echo -e "  3. App will auto-reload (usually <1 second!)"
    echo -e "\n${BLUE}Quick commands:${NC}"

    if [ "$TARGET" == "simulator" ]; then
        echo -e "  • Press ${YELLOW}Cmd+D${NC} in simulator for dev menu"
        echo -e "  • Press ${YELLOW}R${NC} to force reload"
        echo -e "  • Press ${YELLOW}Cmd+M${NC} to open element inspector"
    else
        echo -e "  • ${YELLOW}Shake device${NC} to open dev menu"
        echo -e "  • Tap ${YELLOW}'Reload'${NC} to force reload"
        echo -e "  • Enable ${YELLOW}'Fast Refresh'${NC} in dev menu"
    fi

    echo -e "\n${BLUE}Metro bundler:${NC} http://localhost:8081"
    echo -e "${BLUE}Log file:${NC} metro.log"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping watch mode...${NC}"

    if [ -f /tmp/physioassist_metro.pid ]; then
        METRO_PID=$(cat /tmp/physioassist_metro.pid)
        if ps -p $METRO_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping Metro bundler...${NC}"
            kill $METRO_PID
            rm /tmp/physioassist_metro.pid
        fi
    fi

    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

trap cleanup EXIT INT TERM

# Main execution
main() {
    check_fswatch
    start_metro
    show_dev_tips
    watch_files
}

main
