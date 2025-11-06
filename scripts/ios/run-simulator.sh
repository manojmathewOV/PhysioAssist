#!/bin/bash

################################################################################
# iOS Simulator Testing Script
# Builds and runs the app on iOS Simulator with hot reload
################################################################################

set -e

echo "📱 iOS Simulator Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default simulator (can be overridden)
SIMULATOR_NAME="${1:-iPhone 15 Pro}"
SCHEME="PhysioAssist"

# Project root
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}🎯 Target Simulator: ${YELLOW}${SIMULATOR_NAME}${NC}"

# Check if Metro bundler is running
check_metro() {
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Metro bundler already running${NC}"
        return 0
    fi
    return 1
}

# Start Metro bundler in background
start_metro() {
    echo -e "\n${BLUE}🚀 Starting Metro bundler...${NC}"

    if check_metro; then
        return 0
    fi

    # Start Metro in background
    npx react-native start --reset-cache > metro.log 2>&1 &
    METRO_PID=$!
    echo $METRO_PID > /tmp/physioassist_metro.pid

    # Wait for Metro to be ready
    echo -e "${YELLOW}Waiting for Metro to start...${NC}"
    for i in {1..30}; do
        if check_metro; then
            echo -e "${GREEN}✓ Metro bundler ready (PID: $METRO_PID)${NC}"
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}❌ Metro bundler failed to start${NC}"
    exit 1
}

# Find or create simulator
setup_simulator() {
    echo -e "\n${BLUE}📱 Setting up simulator...${NC}"

    # Get simulator UDID
    SIMULATOR_UDID=$(xcrun simctl list devices available | grep "$SIMULATOR_NAME" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$SIMULATOR_UDID" ]; then
        echo -e "${RED}❌ Simulator not found: $SIMULATOR_NAME${NC}"
        echo -e "${YELLOW}Available simulators:${NC}"
        xcrun simctl list devices available | grep "iPhone" | head -n 5
        exit 1
    fi

    echo -e "${GREEN}✓ Found simulator: ${SIMULATOR_UDID}${NC}"

    # Boot simulator if not already booted
    SIMULATOR_STATE=$(xcrun simctl list devices | grep "$SIMULATOR_UDID" | grep -oE '\((Booted|Shutdown)\)')

    if [[ "$SIMULATOR_STATE" == *"Shutdown"* ]]; then
        echo -e "${YELLOW}Booting simulator...${NC}"
        xcrun simctl boot "$SIMULATOR_UDID"
        sleep 3
    fi

    # Open Simulator app
    open -a Simulator

    echo -e "${GREEN}✓ Simulator ready${NC}"
}

# Build and install app
build_and_install() {
    echo -e "\n${BLUE}🔨 Building app...${NC}"

    cd ios

    # Clean build if requested
    if [ "$2" == "--clean" ]; then
        echo -e "${YELLOW}Cleaning build...${NC}"
        xcodebuild clean -workspace PhysioAssist.xcworkspace -scheme "$SCHEME" -configuration Debug
    fi

    # Build for simulator
    echo -e "${YELLOW}Building for iOS Simulator...${NC}"
    xcodebuild \
        -workspace PhysioAssist.xcworkspace \
        -scheme "$SCHEME" \
        -configuration Debug \
        -sdk iphonesimulator \
        -derivedDataPath build \
        -destination "id=$SIMULATOR_UDID" \
        | xcpretty || true

    # Find the built app
    APP_PATH=$(find build/Build/Products/Debug-iphonesimulator -name "PhysioAssist.app" -maxdepth 1 | head -n 1)

    if [ -z "$APP_PATH" ]; then
        echo -e "${RED}❌ Build failed - app not found${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Build successful${NC}"

    # Install app on simulator
    echo -e "\n${BLUE}📲 Installing app on simulator...${NC}"
    xcrun simctl install "$SIMULATOR_UDID" "$APP_PATH"

    echo -e "${GREEN}✓ App installed${NC}"

    cd ..
}

# Launch app
launch_app() {
    echo -e "\n${BLUE}🚀 Launching app...${NC}"

    # Get bundle ID
    BUNDLE_ID="org.reactjs.native.example.PhysioAssist"

    # Launch app
    xcrun simctl launch "$SIMULATOR_UDID" "$BUNDLE_ID"

    echo -e "${GREEN}✓ App launched${NC}"
}

# Monitor logs
monitor_logs() {
    echo -e "\n${BLUE}📊 Monitoring app logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

    # Stream logs
    xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "PhysioAssist"' --level=debug
}

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"

    # Kill Metro if we started it
    if [ -f /tmp/physioassist_metro.pid ]; then
        METRO_PID=$(cat /tmp/physioassist_metro.pid)
        if ps -p $METRO_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping Metro bundler...${NC}"
            kill $METRO_PID
            rm /tmp/physioassist_metro.pid
        fi
    fi
}

trap cleanup EXIT

# Main execution
main() {
    start_metro
    setup_simulator
    build_and_install "$@"
    launch_app

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ App running on simulator!${NC}"
    echo -e "\n${BLUE}Hot reload is enabled:${NC}"
    echo -e "  • Press ${YELLOW}Cmd+D${NC} in simulator for dev menu"
    echo -e "  • Press ${YELLOW}R${NC} to reload"
    echo -e "  • Edit files and save - changes will appear automatically"
    echo -e "\n${BLUE}Metro bundler running at:${NC} http://localhost:8081"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Ask if user wants to monitor logs
    echo -e "\n${BLUE}❓ Monitor app logs?${NC}"
    read -p "   Show live logs? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        monitor_logs
    else
        echo -e "\n${YELLOW}Metro bundler will keep running in background${NC}"
        echo -e "${YELLOW}Run 'npm run ios:stop' to stop it${NC}"
        # Don't kill Metro, let it run
        trap - EXIT
    fi
}

main "$@"
