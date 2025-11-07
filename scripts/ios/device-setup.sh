#!/bin/bash

################################################################################
# iOS Device Setup & Detection Script
# Detects connected iOS devices and prepares them for testing
################################################################################

set -e

echo "🍎 iOS Device Setup & Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Xcode is installed
check_xcode() {
    echo -e "\n${BLUE}📱 Checking Xcode installation...${NC}"

    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}❌ Xcode is not installed${NC}"
        echo -e "${YELLOW}Install Xcode from the Mac App Store${NC}"
        exit 1
    fi

    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo -e "${GREEN}✓ ${XCODE_VERSION}${NC}"
}

# Check if Xcode Command Line Tools are installed
check_xcode_tools() {
    echo -e "\n${BLUE}🔧 Checking Xcode Command Line Tools...${NC}"

    if ! xcode-select -p &> /dev/null; then
        echo -e "${RED}❌ Xcode Command Line Tools not installed${NC}"
        echo -e "${YELLOW}Installing...${NC}"
        xcode-select --install
        exit 1
    fi

    echo -e "${GREEN}✓ Command Line Tools installed${NC}"
}

# Check if CocoaPods is installed
check_cocoapods() {
    echo -e "\n${BLUE}📦 Checking CocoaPods...${NC}"

    if ! command -v pod &> /dev/null; then
        echo -e "${RED}❌ CocoaPods is not installed${NC}"
        echo -e "${YELLOW}Installing CocoaPods...${NC}"
        sudo gem install cocoapods
    fi

    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✓ CocoaPods ${POD_VERSION}${NC}"
}

# List connected physical devices
list_devices() {
    echo -e "\n${BLUE}📱 Detecting connected iOS devices...${NC}"

    # Get list of devices using xcrun
    DEVICES=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator")

    if [ -z "$DEVICES" ]; then
        echo -e "${YELLOW}⚠️  No physical iOS devices detected${NC}"
        echo -e "${YELLOW}   Make sure your device is:${NC}"
        echo -e "${YELLOW}   1. Connected via USB${NC}"
        echo -e "${YELLOW}   2. Unlocked${NC}"
        echo -e "${YELLOW}   3. Trusted (tap 'Trust' on the device)${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Found connected devices:${NC}"
    echo "$DEVICES" | while IFS= read -r device; do
        echo -e "  ${GREEN}•${NC} $device"
    done

    # Save device list to file for other scripts
    echo "$DEVICES" > /tmp/physioassist_devices.txt
}

# List available iOS Simulators
list_simulators() {
    echo -e "\n${BLUE}📱 Available iOS Simulators...${NC}"

    # Get list of available simulators
    SIMULATORS=$(xcrun simctl list devices available iPhone | grep "iPhone")

    if [ -z "$SIMULATORS" ]; then
        echo -e "${YELLOW}⚠️  No iOS Simulators found${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Available simulators:${NC}"
    echo "$SIMULATORS" | head -n 10 | while IFS= read -r sim; do
        echo -e "  ${GREEN}•${NC} $sim"
    done

    # Save simulator list to file
    echo "$SIMULATORS" > /tmp/physioassist_simulators.txt
}

# Check iOS development certificate
check_certificate() {
    echo -e "\n${BLUE}🔑 Checking iOS development certificate...${NC}"

    # Check for valid signing identity
    IDENTITY=$(security find-identity -v -p codesigning | grep "iPhone Developer" | head -n 1)

    if [ -z "$IDENTITY" ]; then
        echo -e "${YELLOW}⚠️  No iOS development certificate found${NC}"
        echo -e "${YELLOW}   You'll need to set up code signing in Xcode${NC}"
        echo -e "${YELLOW}   Open PhysioAssist.xcworkspace and configure signing${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Development certificate found${NC}"
    echo -e "  $IDENTITY"
}

# Install iOS dependencies
install_dependencies() {
    echo -e "\n${BLUE}📦 Installing iOS dependencies...${NC}"

    cd "$(dirname "$0")/../.."

    # Install npm dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing npm packages...${NC}"
        npm install
    fi

    # Install CocoaPods dependencies
    cd ios
    echo -e "${YELLOW}Installing CocoaPods...${NC}"
    pod install

    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Main setup sequence
main() {
    check_xcode
    check_xcode_tools
    check_cocoapods
    list_devices
    list_simulators
    check_certificate

    # Ask if user wants to install dependencies
    echo -e "\n${BLUE}❓ Install/update iOS dependencies?${NC}"
    read -p "   Install CocoaPods and npm packages? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_dependencies
    fi

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ iOS setup complete!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "  1. Run ${YELLOW}npm run ios:sim${NC} to test on simulator"
    echo -e "  2. Run ${YELLOW}npm run ios:device${NC} to test on physical device"
    echo -e "  3. Run ${YELLOW}npm run ios:validate${NC} to run on-device tests"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

main
