#!/bin/bash

################################################################################
# Xcode Debug Helper
# Quick debugging tools and shortcuts for Mac
################################################################################

set -e

echo "🐛 Xcode Debug Helper"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUNDLE_ID="org.reactjs.native.example.PhysioAssist"

# Show debug menu
show_menu() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Debug Tools:${NC}\n"
    echo -e "  ${YELLOW}1${NC}  - View simulator logs (live)"
    echo -e "  ${YELLOW}2${NC}  - View device logs (live)"
    echo -e "  ${YELLOW}3${NC}  - View Metro bundler logs"
    echo -e "  ${YELLOW}4${NC}  - View crash logs"
    echo -e "  ${YELLOW}5${NC}  - Inspect app container (simulator)"
    echo -e "  ${YELLOW}6${NC}  - Clear app data"
    echo -e "  ${YELLOW}7${NC}  - Reset simulator"
    echo -e "  ${YELLOW}8${NC}  - View network traffic"
    echo -e "  ${YELLOW}9${NC}  - Check app permissions"
    echo -e "  ${YELLOW}10${NC} - View UserDefaults/Keychain"
    echo -e "  ${YELLOW}11${NC} - Take screenshot"
    echo -e "  ${YELLOW}12${NC} - Record video"
    echo -e "  ${YELLOW}13${NC} - Open Console.app"
    echo -e "  ${YELLOW}14${NC} - Open Devices & Simulators"
    echo -e "  ${YELLOW}15${NC} - Debug keyboard shortcuts cheatsheet"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# View simulator logs
view_sim_logs() {
    echo -e "${BLUE}📋 Simulator logs (press Ctrl+C to stop)...${NC}\n"

    BOOTED=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$BOOTED" ]; then
        echo -e "${RED}❌ No booted simulator${NC}"
        return
    fi

    xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "PhysioAssist"' --level=debug
}

# View device logs
view_device_logs() {
    echo -e "${BLUE}📋 Device logs (press Ctrl+C to stop)...${NC}\n"

    # Check for idevicesyslog
    if command -v idevicesyslog &> /dev/null; then
        idevicesyslog | grep "PhysioAssist"
    elif command -v ios-deploy &> /dev/null; then
        DEVICE=$(xcrun xctrace list devices 2>&1 | grep "iPhone" | grep -v "Simulator" | head -n 1 | grep -oE '[0-9a-f]{40}')
        ios-deploy --id "$DEVICE" --justlaunch --debug
    else
        echo -e "${YELLOW}⚠️  Install libimobiledevice for better logging:${NC}"
        echo -e "   brew install libimobiledevice"
        echo -e "\n${CYAN}Opening Xcode Console instead...${NC}"
        open -a "Console"
    fi
}

# View Metro logs
view_metro_logs() {
    echo -e "${BLUE}📋 Metro bundler logs...${NC}\n"

    if [ -f "$PROJECT_ROOT/metro.log" ]; then
        tail -f "$PROJECT_ROOT/metro.log"
    else
        echo -e "${RED}❌ Metro log not found${NC}"
        echo -e "${YELLOW}Start Metro first: npm start${NC}"
    fi
}

# View crash logs
view_crash_logs() {
    echo -e "${BLUE}💥 Recent crash logs...${NC}\n"

    CRASH_DIR="$HOME/Library/Logs/DiagnosticReports"

    echo -e "${CYAN}PhysioAssist crashes (last 7 days):${NC}\n"

    find "$CRASH_DIR" -name "PhysioAssist*" -mtime -7 | while read -r crash; do
        echo -e "${YELLOW}$(basename "$crash")${NC}"
        echo -e "  ${CYAN}$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$crash")${NC}"
    done

    echo -e "\n${CYAN}View latest crash log? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        LATEST=$(find "$CRASH_DIR" -name "PhysioAssist*" -mtime -7 | sort -r | head -n 1)
        if [ ! -z "$LATEST" ]; then
            less "$LATEST"
        else
            echo -e "${GREEN}✓ No recent crashes!${NC}"
        fi
    fi
}

# Inspect app container
inspect_container() {
    echo -e "${BLUE}📁 App container (simulator)...${NC}\n"

    BOOTED=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$BOOTED" ]; then
        echo -e "${RED}❌ No booted simulator${NC}"
        return
    fi

    CONTAINER=$(xcrun simctl get_app_container "$BOOTED" "$BUNDLE_ID" data 2>/dev/null)

    if [ -z "$CONTAINER" ]; then
        echo -e "${RED}❌ App not installed${NC}"
        return
    fi

    echo -e "${GREEN}✓ Container: ${CONTAINER}${NC}\n"

    echo -e "${CYAN}Contents:${NC}"
    ls -la "$CONTAINER"

    echo -e "\n${CYAN}Open in Finder? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$CONTAINER"
    fi
}

# Clear app data
clear_app_data() {
    echo -e "${BLUE}🗑️  Clear app data...${NC}\n"

    echo -e "${RED}This will delete all app data (documents, caches, UserDefaults)${NC}"
    echo -e "${CYAN}Continue? (y/N):${NC}"
    read -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    BOOTED=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$BOOTED" ]; then
        echo -e "${RED}❌ No booted simulator${NC}"
        return
    fi

    # Uninstall and reinstall
    xcrun simctl uninstall "$BOOTED" "$BUNDLE_ID"
    echo -e "${GREEN}✓ App data cleared${NC}"
    echo -e "${YELLOW}Reinstall app: npm run ios:sim${NC}"
}

# Reset simulator
reset_simulator() {
    echo -e "${BLUE}🔄 Reset simulator...${NC}\n"

    echo -e "${RED}This will erase ALL data in the simulator${NC}"
    echo -e "${CYAN}Continue? (y/N):${NC}"
    read -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    BOOTED=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ ! -z "$BOOTED" ]; then
        xcrun simctl shutdown "$BOOTED"
    fi

    xcrun simctl erase all
    echo -e "${GREEN}✓ Simulator reset${NC}"
}

# View network traffic
view_network() {
    echo -e "${BLUE}🌐 Network traffic monitoring...${NC}\n"
    echo -e "${CYAN}Use Xcode Network Instrument for detailed analysis${NC}"
    echo -e "${CYAN}Or use Charles Proxy / Proxyman for HTTP inspection${NC}\n"

    echo -e "${YELLOW}Open Instruments? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./xcode-instruments.sh simulator network
    fi
}

# Check app permissions
check_permissions() {
    echo -e "${BLUE}🔐 App permissions...${NC}\n"

    BOOTED=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$BOOTED" ]; then
        echo -e "${RED}❌ No booted simulator${NC}"
        return
    fi

    echo -e "${CYAN}Camera permission:${NC}"
    xcrun simctl privacy "$BOOTED" grant camera "$BUNDLE_ID" 2>/dev/null && echo -e "${GREEN}✓ Granted${NC}" || echo -e "${RED}✗ Not granted${NC}"

    echo -e "${CYAN}Photos permission:${NC}"
    xcrun simctl privacy "$BOOTED" grant photos "$BUNDLE_ID" 2>/dev/null && echo -e "${GREEN}✓ Granted${NC}" || echo -e "${RED}✗ Not granted${NC}"

    echo -e "\n${YELLOW}Grant all permissions? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xcrun simctl privacy "$BOOTED" grant camera "$BUNDLE_ID"
        xcrun simctl privacy "$BOOTED" grant photos "$BUNDLE_ID"
        echo -e "${GREEN}✓ Permissions granted${NC}"
    fi
}

# Take screenshot
take_screenshot() {
    echo -e "${BLUE}📸 Taking screenshot...${NC}\n"

    BOOTED=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$BOOTED" ]; then
        echo -e "${RED}❌ No booted simulator${NC}"
        return
    fi

    OUTPUT="$PROJECT_ROOT/test-results/screenshots/screenshot_$(date +%Y%m%d_%H%M%S).png"
    mkdir -p "$(dirname "$OUTPUT")"

    xcrun simctl io "$BOOTED" screenshot "$OUTPUT"

    echo -e "${GREEN}✓ Screenshot saved: ${OUTPUT}${NC}"
    open "$OUTPUT"
}

# Record video
record_video() {
    echo -e "${BLUE}🎥 Recording video...${NC}\n"

    BOOTED=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

    if [ -z "$BOOTED" ]; then
        echo -e "${RED}❌ No booted simulator${NC}"
        return
    fi

    OUTPUT="$PROJECT_ROOT/test-results/videos/recording_$(date +%Y%m%d_%H%M%S).mov"
    mkdir -p "$(dirname "$OUTPUT")"

    echo -e "${GREEN}🔴 Recording... Press Ctrl+C to stop${NC}\n"

    xcrun simctl io "$BOOTED" recordVideo "$OUTPUT"

    echo -e "\n${GREEN}✓ Video saved: ${OUTPUT}${NC}"
    open "$OUTPUT"
}

# Show keyboard shortcuts
show_shortcuts() {
    cat <<EOF

${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${CYAN}⌨️  Xcode Keyboard Shortcuts Cheatsheet${NC}
${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${BLUE}Building & Running:${NC}
  Cmd + B           - Build
  Cmd + R           - Build & Run
  Cmd + .           - Stop running
  Shift + Cmd + K   - Clean build folder
  Shift + Cmd + O   - Open quickly (files)

${BLUE}Debugging:${NC}
  Cmd + Y           - Toggle breakpoints
  Cmd + \           - Add/remove breakpoint
  Cmd + K           - Clear console
  Ctrl + Cmd + Y    - Continue to next breakpoint
  F6                - Step over
  F7                - Step into
  F8                - Step out

${BLUE}Simulator:${NC}
  Cmd + D           - Show dev menu (React Native)
  Cmd + R           - Reload app
  Cmd + Shift + H   - Home button
  Cmd + Shift + H+H - App switcher
  Cmd + L           - Lock/unlock
  Cmd + →           - Rotate right
  Cmd + ←           - Rotate left

${BLUE}Navigation:${NC}
  Cmd + 0           - Show/hide Navigator
  Cmd + Opt + 0     - Show/hide Inspector
  Cmd + Shift + Y   - Show/hide Debug Area
  Cmd + 1,2,3...    - Navigator tabs
  Ctrl + 1,2,3...   - Related files

${BLUE}Editing:${NC}
  Cmd + /           - Comment/uncomment
  Cmd + [           - Decrease indent
  Cmd + ]           - Increase indent
  Ctrl + I          - Re-indent
  Cmd + Opt + [     - Move line up
  Cmd + Opt + ]     - Move line down

${BLUE}Search:${NC}
  Cmd + F           - Find in file
  Cmd + Shift + F   - Find in project
  Cmd + E           - Use selection for find

${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

EOF
}

# Main execution
main() {
    if [ $# -eq 0 ]; then
        show_menu
        echo -e "\n${CYAN}Select tool (1-15):${NC} "
        read -r CHOICE
    else
        CHOICE=$1
    fi

    case $CHOICE in
        1) view_sim_logs ;;
        2) view_device_logs ;;
        3) view_metro_logs ;;
        4) view_crash_logs ;;
        5) inspect_container ;;
        6) clear_app_data ;;
        7) reset_simulator ;;
        8) view_network ;;
        9) check_permissions ;;
        10) echo -e "${YELLOW}View in Xcode: Window → Devices and Simulators${NC}" ;;
        11) take_screenshot ;;
        12) record_video ;;
        13) open -a "Console" ;;
        14) open "x-apple.systempreferences:com.apple.preferences.extensions" ;;
        15) show_shortcuts ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
}

main "$@"
