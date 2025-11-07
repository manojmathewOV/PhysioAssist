#!/bin/bash

################################################################################
# PhysioAssist iOS CLI - Unified Testing & Development Tool
# One command to rule them all
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Banner
show_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████╗ ██╗  ██╗██╗   ██╗███████╗██╗ ██████╗             ║
║     ██╔══██╗██║  ██║╚██╗ ██╔╝██╔════╝██║██╔═══██╗            ║
║     ██████╔╝███████║ ╚████╔╝ ███████╗██║██║   ██║            ║
║     ██╔═══╝ ██╔══██║  ╚██╔╝  ╚════██║██║██║   ██║            ║
║     ██║     ██║  ██║   ██║   ███████║██║╚██████╔╝            ║
║     ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝ ╚═════╝             ║
║                                                               ║
║                    iOS Testing & Development CLI             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Show help menu
show_help() {
    show_banner
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}USAGE:${NC}"
    echo -e "  ./ios-cli.sh ${YELLOW}<command>${NC} [options]"
    echo -e ""
    echo -e "${CYAN}SETUP & ENVIRONMENT:${NC}"
    echo -e "  ${YELLOW}setup${NC}              Configure iOS development environment"
    echo -e "  ${YELLOW}check${NC}              Verify all requirements are met"
    echo -e ""
    echo -e "${CYAN}SIMULATOR TESTING:${NC}"
    echo -e "  ${YELLOW}sim${NC}                Build and run on iOS Simulator"
    echo -e "  ${YELLOW}sim --clean${NC}        Clean build and run on Simulator"
    echo -e "  ${YELLOW}sim \"iPhone 14\"${NC}   Run on specific simulator"
    echo -e ""
    echo -e "${CYAN}DEVICE TESTING:${NC}"
    echo -e "  ${YELLOW}device${NC}             Build and deploy to connected iOS device"
    echo -e "  ${YELLOW}device --clean${NC}     Clean build and deploy to device"
    echo -e ""
    echo -e "${CYAN}ITERATIVE DEVELOPMENT:${NC}"
    echo -e "  ${YELLOW}watch${NC}              Watch mode - auto-reload on file changes (simulator)"
    echo -e "  ${YELLOW}watch device${NC}       Watch mode for physical device"
    echo -e "  ${YELLOW}reload${NC}             Force reload app (Metro must be running)"
    echo -e ""
    echo -e "${CYAN}VALIDATION & TESTING:${NC}"
    echo -e "  ${YELLOW}validate${NC}           Run all gate validations"
    echo -e "  ${YELLOW}validate sim${NC}       Run validations on simulator"
    echo -e "  ${YELLOW}validate device${NC}    Run validations on physical device"
    echo -e "  ${YELLOW}perf${NC}               Run performance profiling"
    echo -e "  ${YELLOW}memory${NC}             Run memory leak detection"
    echo -e ""
    echo -e "${CYAN}METRO BUNDLER:${NC}"
    echo -e "  ${YELLOW}start${NC}              Start Metro bundler"
    echo -e "  ${YELLOW}stop${NC}               Stop Metro bundler"
    echo -e "  ${YELLOW}restart${NC}            Restart Metro bundler"
    echo -e "  ${YELLOW}logs${NC}               Show Metro bundler logs"
    echo -e ""
    echo -e "${CYAN}XCODE INTEGRATION:${NC}"
    echo -e "  ${YELLOW}xcode${NC}              Open Xcode workspace with optimization"
    echo -e "  ${YELLOW}xcode-setup${NC}        Full Xcode setup and configuration"
    echo -e "  ${YELLOW}xcode-fast${NC}         Optimize Xcode for maximum build speed"
    echo -e "  ${YELLOW}instruments${NC}        Professional profiling with Instruments"
    echo -e "  ${YELLOW}debug${NC}              Debug tools and helpers"
    echo -e ""
    echo -e "${CYAN}CLAUDE CODE CLI BRIDGE:${NC}"
    echo -e "  ${YELLOW}claude-bridge${NC}      JSON API for programmatic control"
    echo -e "  ${YELLOW}claude-dev${NC}         One-command dev setup with JSON output"
    echo -e "  ${YELLOW}claude-iterate${NC}     Auto-reload with error recovery"
    echo -e "  ${YELLOW}claude-server${NC}      Start HTTP bridge server (port 3737)"
    echo -e ""
    echo -e "${CYAN}UTILITIES:${NC}"
    echo -e "  ${YELLOW}clean${NC}              Clean build artifacts"
    echo -e "  ${YELLOW}reset${NC}              Full reset (clean + clear cache + reinstall)"
    echo -e "  ${YELLOW}list${NC}               List available devices and simulators"
    echo -e "  ${YELLOW}help${NC}               Show this help message"
    echo -e ""
    echo -e "${CYAN}EXAMPLES:${NC}"
    echo -e "  ${GREEN}# Initial setup${NC}"
    echo -e "  ./ios-cli.sh setup"
    echo -e ""
    echo -e "  ${GREEN}# Quick test on simulator${NC}"
    echo -e "  ./ios-cli.sh sim"
    echo -e ""
    echo -e "  ${GREEN}# Deploy to device and watch for changes${NC}"
    echo -e "  ./ios-cli.sh device && ./ios-cli.sh watch device"
    echo -e ""
    echo -e "  ${GREEN}# Run full validation suite${NC}"
    echo -e "  ./ios-cli.sh validate device"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Execute command
execute_command() {
    COMMAND="$1"
    shift

    case "$COMMAND" in
        setup|check)
            bash "$SCRIPT_DIR/device-setup.sh" "$@"
            ;;
        sim|simulator)
            bash "$SCRIPT_DIR/run-simulator.sh" "$@"
            ;;
        device)
            bash "$SCRIPT_DIR/run-device.sh" "$@"
            ;;
        watch)
            bash "$SCRIPT_DIR/watch-mode.sh" "$@"
            ;;
        validate)
            bash "$SCRIPT_DIR/device-validate.sh" "$@"
            ;;
        reload)
            echo -e "${CYAN}🔄 Reloading app...${NC}"
            curl -s -X POST http://localhost:8081/reload
            echo -e "${GREEN}✓ Reload command sent${NC}"
            ;;
        start)
            echo -e "${CYAN}🚀 Starting Metro bundler...${NC}"
            npx react-native start --reset-cache > metro.log 2>&1 &
            echo $! > /tmp/physioassist_metro.pid
            echo -e "${GREEN}✓ Metro started (PID: $(cat /tmp/physioassist_metro.pid))${NC}"
            ;;
        stop)
            bash "$SCRIPT_DIR/stop-metro.sh"
            ;;
        restart)
            bash "$SCRIPT_DIR/stop-metro.sh"
            sleep 1
            npx react-native start --reset-cache > metro.log 2>&1 &
            echo $! > /tmp/physioassist_metro.pid
            echo -e "${GREEN}✓ Metro restarted${NC}"
            ;;
        logs)
            if [ -f metro.log ]; then
                tail -f metro.log
            else
                echo -e "${RED}❌ Metro log file not found${NC}"
            fi
            ;;
        perf|performance)
            bash "$SCRIPT_DIR/device-validate.sh" "$@"
            ;;
        memory)
            bash "$SCRIPT_DIR/device-validate.sh" "$@"
            ;;
        clean)
            echo -e "${CYAN}🧹 Cleaning build artifacts...${NC}"
            cd "$(dirname "$SCRIPT_DIR")"
            rm -rf ios/build
            rm -rf ios/Pods
            echo -e "${GREEN}✓ Clean complete${NC}"
            ;;
        reset)
            echo -e "${YELLOW}⚠️  This will clean everything and reinstall dependencies${NC}"
            read -p "Continue? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cd "$(dirname "$SCRIPT_DIR")"
                echo -e "${CYAN}Removing build artifacts...${NC}"
                rm -rf ios/build
                rm -rf ios/Pods
                rm -rf node_modules
                echo -e "${CYAN}Clearing caches...${NC}"
                npm cache clean --force
                watchman watch-del-all 2>/dev/null || true
                echo -e "${CYAN}Reinstalling dependencies...${NC}"
                npm install
                cd ios && pod install
                echo -e "${GREEN}✓ Reset complete${NC}"
            fi
            ;;
        xcode)
            PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
            open "$PROJECT_ROOT/ios/PhysioAssist.xcworkspace"
            echo -e "${GREEN}✓ Xcode workspace opened${NC}"
            ;;
        xcode-setup)
            bash "$SCRIPT_DIR/xcode-setup.sh" "$@"
            ;;
        xcode-fast)
            bash "$SCRIPT_DIR/xcode-build-fast.sh" "$@"
            ;;
        instruments)
            bash "$SCRIPT_DIR/xcode-instruments.sh" "$@"
            ;;
        debug)
            bash "$SCRIPT_DIR/xcode-debug.sh" "$@"
            ;;
        claude-bridge)
            bash "$SCRIPT_DIR/claude-bridge.sh" "$@"
            ;;
        claude-dev)
            bash "$SCRIPT_DIR/claude-bridge.sh" quick-dev
            ;;
        claude-iterate)
            bash "$SCRIPT_DIR/claude-auto-iterate.sh" "$@"
            ;;
        claude-server)
            node "$SCRIPT_DIR/claude-bridge-server.js"
            ;;
        list)
            echo -e "${BLUE}📱 Available iOS Simulators:${NC}"
            xcrun simctl list devices available | grep "iPhone"
            echo -e "\n${BLUE}📱 Connected Physical Devices:${NC}"
            xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $COMMAND${NC}\n"
            show_help
            exit 1
            ;;
    esac
}

# Main entry point
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    execute_command "$@"
}

main "$@"
