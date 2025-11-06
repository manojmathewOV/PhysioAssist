#!/bin/bash

################################################################################
# iOS Physical Device Testing Script
# Builds and deploys the app to a connected iOS device
################################################################################

set -e

echo "📱 iOS Physical Device Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCHEME="PhysioAssist"
CONFIGURATION="Debug"

# Project root
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check for connected devices
check_device() {
    echo -e "${BLUE}🔍 Checking for connected devices...${NC}"

    # Get list of connected devices
    DEVICES=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator")

    if [ -z "$DEVICES" ]; then
        echo -e "${RED}❌ No iOS devices detected${NC}"
        echo -e "\n${YELLOW}Please:${NC}"
        echo -e "  1. Connect your iOS device via USB"
        echo -e "  2. Unlock the device"
        echo -e "  3. Tap 'Trust' when prompted"
        echo -e "  4. Run this script again"
        exit 1
    fi

    echo -e "${GREEN}✓ Found devices:${NC}"
    echo "$DEVICES"

    # Get first device UDID
    DEVICE_UDID=$(echo "$DEVICES" | head -n 1 | grep -oE '[0-9a-f]{40}|[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')
    DEVICE_NAME=$(echo "$DEVICES" | head -n 1 | sed -E 's/\([^)]*\)//g' | xargs)

    echo -e "\n${BLUE}🎯 Target device: ${YELLOW}${DEVICE_NAME}${NC}"
    echo -e "${BLUE}📱 UDID: ${YELLOW}${DEVICE_UDID}${NC}"
}

# Check if Metro bundler is running
check_metro() {
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Start Metro bundler
start_metro() {
    echo -e "\n${BLUE}🚀 Starting Metro bundler...${NC}"

    if check_metro; then
        echo -e "${GREEN}✓ Metro bundler already running${NC}"
        return 0
    fi

    # Start Metro in background
    npx react-native start --reset-cache > metro.log 2>&1 &
    METRO_PID=$!
    echo $METRO_PID > /tmp/physioassist_metro.pid

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

# Build and deploy to device
build_and_deploy() {
    echo -e "\n${BLUE}🔨 Building for device...${NC}"

    cd ios

    # Clean if requested
    if [ "$1" == "--clean" ]; then
        echo -e "${YELLOW}Cleaning build...${NC}"
        xcodebuild clean -workspace PhysioAssist.xcworkspace -scheme "$SCHEME"
    fi

    echo -e "${YELLOW}Building and deploying to device...${NC}"
    echo -e "${YELLOW}This may take a few minutes...${NC}"

    # Build and deploy
    xcodebuild \
        -workspace PhysioAssist.xcworkspace \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -destination "id=$DEVICE_UDID" \
        -derivedDataPath build \
        | xcpretty || true

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo -e "${RED}❌ Build failed${NC}"
        echo -e "\n${YELLOW}Common issues:${NC}"
        echo -e "  1. ${YELLOW}Code signing:${NC} Open PhysioAssist.xcworkspace in Xcode and configure signing"
        echo -e "  2. ${YELLOW}Device trust:${NC} Make sure you tapped 'Trust' on your device"
        echo -e "  3. ${YELLOW}Developer mode:${NC} Enable Developer Mode in Settings > Privacy & Security (iOS 16+)"
        exit 1
    fi

    echo -e "${GREEN}✓ Build and deployment successful${NC}"
    cd ..
}

# Get device logs
monitor_device_logs() {
    echo -e "\n${BLUE}📊 Monitoring device logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

    # Use ios-deploy to stream logs
    if command -v ios-deploy &> /dev/null; then
        ios-deploy --id "$DEVICE_UDID" --no-wifi --justlaunch --debug
    else
        # Fallback to idevicesyslog if available
        if command -v idevicesyslog &> /dev/null; then
            idevicesyslog -u "$DEVICE_UDID" | grep "PhysioAssist"
        else
            echo -e "${YELLOW}⚠️  Install ios-deploy for better logging: npm install -g ios-deploy${NC}"
            echo -e "${YELLOW}   Or use Xcode Console (Window > Devices and Simulators)${NC}"
        fi
    fi
}

# Cleanup
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"

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
    check_device
    start_metro
    build_and_deploy "$@"

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ App deployed to device!${NC}"
    echo -e "\n${BLUE}The app should now be running on your device${NC}"
    echo -e "\n${BLUE}Hot reload is enabled:${NC}"
    echo -e "  • Shake device to open dev menu"
    echo -e "  • Tap 'Reload' to refresh"
    echo -e "  • Edit files and save - changes will appear automatically"
    echo -e "\n${BLUE}Metro bundler running at:${NC} http://localhost:8081"
    echo -e "\n${YELLOW}Note: Device must be on same WiFi network for hot reload${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Ask if user wants to monitor logs
    echo -e "\n${BLUE}❓ Monitor device logs?${NC}"
    read -p "   Show live logs? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        monitor_device_logs
    else
        echo -e "\n${YELLOW}Metro bundler will keep running in background${NC}"
        echo -e "${YELLOW}Run 'npm run ios:stop' to stop it${NC}"
        trap - EXIT
    fi
}

main "$@"
