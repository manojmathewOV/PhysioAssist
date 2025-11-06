#!/bin/bash

################################################################################
# Xcode Project Setup & Configuration
# Optimizes Xcode settings for PhysioAssist development on Mac
################################################################################

set -e

echo "🔧 Xcode Project Setup & Optimization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

WORKSPACE="ios/PhysioAssist.xcworkspace"
PROJECT="ios/PhysioAssist.xcodeproj"

# Check Xcode version and path
check_xcode() {
    echo -e "\n${BLUE}📱 Checking Xcode installation...${NC}"

    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}❌ Xcode not found${NC}"
        echo -e "${YELLOW}Install Xcode from Mac App Store${NC}"
        exit 1
    fi

    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    XCODE_PATH=$(xcode-select -p)

    echo -e "${GREEN}✓ ${XCODE_VERSION}${NC}"
    echo -e "${GREEN}✓ Location: ${XCODE_PATH}${NC}"

    # Check if correct Xcode is selected
    if [[ ! "$XCODE_PATH" == *"Xcode.app"* ]]; then
        echo -e "${YELLOW}⚠️  Wrong Xcode path selected${NC}"
        echo -e "${YELLOW}Run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer${NC}"
    fi
}

# Install/update CocoaPods dependencies
setup_cocoapods() {
    echo -e "\n${BLUE}📦 Setting up CocoaPods...${NC}"

    cd ios

    # Deintegrate old pods if needed
    if [ -d "Pods" ]; then
        echo -e "${YELLOW}Cleaning old Pods...${NC}"
        pod deintegrate 2>/dev/null || true
    fi

    # Update pod repo
    echo -e "${CYAN}Updating CocoaPods repo...${NC}"
    pod repo update --silent

    # Install pods
    echo -e "${CYAN}Installing dependencies...${NC}"
    pod install

    echo -e "${GREEN}✓ CocoaPods setup complete${NC}"

    cd ..
}

# Configure Xcode build settings
optimize_build_settings() {
    echo -e "\n${BLUE}⚙️  Optimizing Xcode build settings...${NC}"

    # Enable parallel builds
    defaults write com.apple.dt.Xcode ShowBuildOperationDuration YES
    defaults write com.apple.dt.Xcode IDEBuildOperationMaxNumberOfConcurrentCompileTasks 8

    # Enable build time display
    defaults write com.apple.dt.Xcode ShowBuildOperationDuration YES

    # Increase thread count for Swift compilation
    defaults write com.apple.dt.Xcode IDEBuildOperationMaxNumberOfConcurrentCompileTasks $(sysctl -n hw.ncpu)

    # Enable indexing
    defaults write com.apple.dt.Xcode IDEIndexDisable 0

    echo -e "${GREEN}✓ Build settings optimized${NC}"
}

# Configure code signing automatically
setup_code_signing() {
    echo -e "\n${BLUE}🔑 Configuring code signing...${NC}"

    # Check for Apple ID in Xcode
    ACCOUNTS=$(security find-generic-password -s "Xcode" 2>/dev/null | grep "acct" | wc -l || echo "0")

    if [ "$ACCOUNTS" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No Xcode accounts found${NC}"
        echo -e "${CYAN}Opening Xcode to add account...${NC}"
        echo -e "${YELLOW}Go to: Xcode → Settings → Accounts → + → Add Apple ID${NC}"
        open -a Xcode "$WORKSPACE"

        echo -e "\n${BLUE}Press Enter after adding your Apple ID...${NC}"
        read -r
    else
        echo -e "${GREEN}✓ Xcode account configured${NC}"
    fi

    # Check for valid signing identity
    IDENTITY=$(security find-identity -v -p codesigning | grep "Apple Development" | head -n 1)

    if [ -z "$IDENTITY" ]; then
        echo -e "${YELLOW}⚠️  No signing identity found${NC}"
        echo -e "${CYAN}Will use automatic signing${NC}"
    else
        echo -e "${GREEN}✓ Signing identity found:${NC}"
        echo -e "  ${IDENTITY}"
    fi
}

# Configure simulator settings for best performance
optimize_simulator() {
    echo -e "\n${BLUE}📱 Optimizing iOS Simulator...${NC}"

    # Disable slow animations
    defaults write com.apple.iphonesimulator GraphicsQualityOverride 10

    # Shutdown all simulators
    xcrun simctl shutdown all 2>/dev/null || true

    # Erase old simulators to free space (optional)
    echo -e "${YELLOW}Clean old simulator data? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}Erasing simulator data...${NC}"
        xcrun simctl erase all
        echo -e "${GREEN}✓ Simulator data erased${NC}"
    fi

    echo -e "${GREEN}✓ Simulator optimized${NC}"
}

# Create Xcode schemes if needed
setup_schemes() {
    echo -e "\n${BLUE}📋 Checking Xcode schemes...${NC}"

    cd ios

    # List existing schemes
    SCHEMES=$(xcodebuild -workspace PhysioAssist.xcworkspace -list | grep -A 100 "Schemes:" | tail -n +2)

    echo -e "${GREEN}Available schemes:${NC}"
    echo "$SCHEMES" | while IFS= read -r scheme; do
        if [ ! -z "$scheme" ]; then
            echo -e "  ${GREEN}•${NC} $scheme"
        fi
    done

    cd ..
}

# Configure Xcode derived data location
configure_derived_data() {
    echo -e "\n${BLUE}💾 Configuring derived data...${NC}"

    # Set derived data to relative path for better performance
    defaults write com.apple.dt.Xcode IDECustomDerivedDataLocation -string "${PROJECT_ROOT}/ios/build/DerivedData"

    echo -e "${GREEN}✓ Derived data location set${NC}"
}

# Install helpful Xcode plugins/tools
install_xcode_tools() {
    echo -e "\n${BLUE}🔧 Checking Xcode tools...${NC}"

    # Check for xcpretty
    if ! command -v xcpretty &> /dev/null; then
        echo -e "${YELLOW}Installing xcpretty (better build output)...${NC}"
        sudo gem install xcpretty
    else
        echo -e "${GREEN}✓ xcpretty installed${NC}"
    fi

    # Check for xcode-build-server (for better IDE integration)
    if ! command -v xcode-build-server &> /dev/null; then
        echo -e "${CYAN}xcode-build-server not found (optional)${NC}"
        echo -e "${CYAN}Install with: brew install xcode-build-server${NC}"
    fi
}

# Create quick access aliases in shell profile
create_aliases() {
    echo -e "\n${BLUE}⚡ Creating quick access commands...${NC}"

    SHELL_RC="$HOME/.zshrc"
    if [ ! -f "$SHELL_RC" ]; then
        SHELL_RC="$HOME/.bashrc"
    fi

    # Check if aliases already exist
    if grep -q "PhysioAssist iOS Development" "$SHELL_RC" 2>/dev/null; then
        echo -e "${GREEN}✓ Aliases already configured${NC}"
        return
    fi

    echo -e "${YELLOW}Add quick access aliases to $SHELL_RC? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat >> "$SHELL_RC" <<'EOF'

# PhysioAssist iOS Development Aliases
alias physio-xcode='open ios/PhysioAssist.xcworkspace'
alias physio-sim='npm run ios:sim'
alias physio-device='npm run ios:device'
alias physio-watch='npm run ios:watch'
alias physio-validate='npm run ios:validate:device'
alias physio-clean='npm run ios:clean'

EOF
        echo -e "${GREEN}✓ Aliases added to $SHELL_RC${NC}"
        echo -e "${CYAN}Restart terminal or run: source $SHELL_RC${NC}"
        echo -e "\n${BLUE}New commands available:${NC}"
        echo -e "  ${YELLOW}physio-xcode${NC}    - Open Xcode workspace"
        echo -e "  ${YELLOW}physio-sim${NC}      - Run on simulator"
        echo -e "  ${YELLOW}physio-device${NC}   - Run on device"
        echo -e "  ${YELLOW}physio-watch${NC}    - Watch mode"
        echo -e "  ${YELLOW}physio-validate${NC} - Full validation"
        echo -e "  ${YELLOW}physio-clean${NC}    - Clean build"
    fi
}

# Open Xcode workspace
open_xcode() {
    echo -e "\n${BLUE}🚀 Opening Xcode workspace...${NC}"

    if [ ! -f "$WORKSPACE" ]; then
        echo -e "${RED}❌ Workspace not found: $WORKSPACE${NC}"
        exit 1
    fi

    # Open Xcode workspace
    open "$WORKSPACE"

    echo -e "${GREEN}✓ Xcode opened${NC}"
    echo -e "\n${CYAN}Next steps in Xcode:${NC}"
    echo -e "  1. Select ${YELLOW}PhysioAssist${NC} target in left sidebar"
    echo -e "  2. Go to ${YELLOW}Signing & Capabilities${NC} tab"
    echo -e "  3. Check ${YELLOW}Automatically manage signing${NC}"
    echo -e "  4. Select your ${YELLOW}Team${NC} (Apple Developer account)"
    echo -e "  5. Xcode will create provisioning profiles automatically"
}

# Main setup
main() {
    check_xcode

    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Setup Options:${NC}"
    echo -e "  ${YELLOW}1${NC} - Full setup (recommended for first time)"
    echo -e "  ${YELLOW}2${NC} - Quick setup (CocoaPods + open Xcode)"
    echo -e "  ${YELLOW}3${NC} - Build optimization only"
    echo -e "  ${YELLOW}4${NC} - Just open Xcode workspace"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\n${CYAN}Select option (1-4):${NC} "
    read -n 1 -r OPTION
    echo

    case $OPTION in
        1)
            echo -e "\n${GREEN}🔧 Running full setup...${NC}"
            setup_cocoapods
            optimize_build_settings
            setup_code_signing
            optimize_simulator
            setup_schemes
            configure_derived_data
            install_xcode_tools
            create_aliases
            open_xcode
            ;;
        2)
            echo -e "\n${GREEN}⚡ Running quick setup...${NC}"
            setup_cocoapods
            optimize_build_settings
            open_xcode
            ;;
        3)
            echo -e "\n${GREEN}⚙️  Running build optimization...${NC}"
            optimize_build_settings
            configure_derived_data
            optimize_simulator
            ;;
        4)
            open_xcode
            ;;
        *)
            echo -e "${YELLOW}Invalid option. Running quick setup...${NC}"
            setup_cocoapods
            open_xcode
            ;;
    esac

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Xcode setup complete!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "  1. Configure code signing in Xcode (if not done)"
    echo -e "  2. Run ${YELLOW}npm run ios:sim${NC} to test on simulator"
    echo -e "  3. Run ${YELLOW}npm run ios:device${NC} to test on your iPhone"
    echo -e "  4. Run ${YELLOW}npm run ios:watch${NC} for rapid development"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

main "$@"
