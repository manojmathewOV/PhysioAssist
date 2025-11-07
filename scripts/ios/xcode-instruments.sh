#!/bin/bash

################################################################################
# Xcode Instruments Profiling Automation
# Run professional performance profiling with Instruments on Mac
################################################################################

set -e

echo "📊 Xcode Instruments Profiling"
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
cd "$PROJECT_ROOT"

TARGET="${1:-simulator}"
PROFILE_TYPE="${2:-time}"
DURATION="${3:-60}"

RESULTS_DIR="test-results/instruments"
mkdir -p "$RESULTS_DIR"

BUNDLE_ID="org.reactjs.native.example.PhysioAssist"

# Show profiling menu
show_menu() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Instruments Profiling Templates:${NC}\n"
    echo -e "  ${YELLOW}1${NC} - ${PURPLE}Time Profiler${NC}      - CPU usage, call stacks, hot paths"
    echo -e "  ${YELLOW}2${NC} - ${PURPLE}Allocations${NC}        - Memory allocations, leaks, zombies"
    echo -e "  ${YELLOW}3${NC} - ${PURPLE}Leaks${NC}              - Memory leak detection"
    echo -e "  ${YELLOW}4${NC} - ${PURPLE}Core Animation${NC}     - FPS, frame drops, rendering"
    echo -e "  ${YELLOW}5${NC} - ${PURPLE}Energy Log${NC}         - Battery usage, CPU, network, display"
    echo -e "  ${YELLOW}6${NC} - ${PURPLE}Network${NC}            - HTTP requests, data transfer"
    echo -e "  ${YELLOW}7${NC} - ${PURPLE}System Trace${NC}       - Complete system performance"
    echo -e "  ${YELLOW}8${NC} - ${PURPLE}Metal${NC}              - GPU performance (Skia rendering)"
    echo -e "  ${YELLOW}9${NC} - ${PURPLE}File Activity${NC}      - Disk I/O operations"
    echo -e "  ${YELLOW}10${NC} - ${PURPLE}All Templates${NC}     - Run comprehensive profiling"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Get device UDID
get_device_udid() {
    if [ "$TARGET" == "simulator" ]; then
        # Get booted simulator
        DEVICE_UDID=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

        if [ -z "$DEVICE_UDID" ]; then
            echo -e "${RED}❌ No booted simulator found${NC}"
            echo -e "${YELLOW}Boot a simulator first:${NC}"
            echo -e "  open -a Simulator"
            exit 1
        fi

        DEVICE_NAME=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | sed -E 's/\([^)]*\)//g' | xargs)
    else
        # Get physical device
        DEVICES=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator")

        if [ -z "$DEVICES" ]; then
            echo -e "${RED}❌ No physical devices detected${NC}"
            exit 1
        fi

        DEVICE_UDID=$(echo "$DEVICES" | head -n 1 | grep -oE '[0-9a-f]{40}')
        DEVICE_NAME=$(echo "$DEVICES" | head -n 1 | sed -E 's/\([^)]*\)//g' | xargs)
    fi

    echo -e "${GREEN}✓ Target: ${DEVICE_NAME}${NC}"
}

# Run single profiling template
run_profile() {
    local TEMPLATE=$1
    local NAME=$2
    local OUTPUT="${RESULTS_DIR}/${NAME}_${TARGET}_$(date +%Y%m%d_%H%M%S).trace"

    echo -e "\n${BLUE}📊 Running ${NAME} profiling...${NC}"
    echo -e "${CYAN}Duration: ${DURATION} seconds${NC}"
    echo -e "${CYAN}Output: ${OUTPUT}${NC}\n"

    # Launch app first if not running
    xcrun simctl launch booted "$BUNDLE_ID" 2>/dev/null || true

    # Run instruments profiling
    xcrun xctrace record \
        --template "$TEMPLATE" \
        --device "$DEVICE_UDID" \
        --time-limit ${DURATION}s \
        --output "$OUTPUT" \
        --launch "$BUNDLE_ID" \
        2>&1 | grep -v "Starting recording" || true

    if [ -f "$OUTPUT" ]; then
        echo -e "${GREEN}✓ ${NAME} profiling complete${NC}"
        echo -e "${CYAN}Results saved to: ${OUTPUT}${NC}"

        # Extract summary if possible
        echo -e "\n${YELLOW}Generating summary...${NC}"
        xctrace export --input "$OUTPUT" --output "${OUTPUT%.trace}_summary.txt" 2>/dev/null || true

        # Open in Instruments
        echo -e "\n${BLUE}Open results in Instruments? (y/N):${NC} "
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$OUTPUT"
        fi
    else
        echo -e "${RED}❌ Profiling failed${NC}"
    fi
}

# Profile CPU performance
profile_time() {
    run_profile "Time Profiler" "time_profiler"
}

# Profile memory allocations
profile_allocations() {
    run_profile "Allocations" "allocations"
}

# Profile memory leaks
profile_leaks() {
    run_profile "Leaks" "memory_leaks"
}

# Profile graphics/FPS
profile_animation() {
    run_profile "Core Animation" "core_animation"
}

# Profile battery usage
profile_energy() {
    run_profile "Energy Log" "energy_log"
}

# Profile network
profile_network() {
    run_profile "Network" "network"
}

# Profile system trace
profile_system() {
    run_profile "System Trace" "system_trace"
}

# Profile GPU
profile_metal() {
    run_profile "Metal" "metal_gpu"
}

# Profile file I/O
profile_file() {
    run_profile "File Activity" "file_activity"
}

# Run comprehensive profiling
profile_all() {
    echo -e "${PURPLE}🎯 Running comprehensive profiling suite${NC}"
    echo -e "${YELLOW}This will take approximately $((DURATION * 9)) seconds${NC}\n"

    profile_time
    profile_allocations
    profile_leaks
    profile_animation
    profile_energy
    profile_network
    profile_system
    profile_metal
    profile_file

    # Generate combined report
    generate_report
}

# Generate HTML report from all traces
generate_report() {
    echo -e "\n${BLUE}📊 Generating comprehensive report...${NC}"

    REPORT="${RESULTS_DIR}/profiling_report_$(date +%Y%m%d_%H%M%S).html"

    cat > "$REPORT" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>PhysioAssist Instruments Profiling Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #007AFF; border-bottom: 3px solid #007AFF; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        .metric { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #007AFF; }
        .metric strong { color: #007AFF; }
        .pass { color: #34C759; font-weight: bold; }
        .warn { color: #FF9500; font-weight: bold; }
        .fail { color: #FF3B30; font-weight: bold; }
        .file-list { list-style: none; padding: 0; }
        .file-list li { padding: 10px; background: #f0f0f0; margin: 5px 0; border-radius: 6px; }
        .file-list a { color: #007AFF; text-decoration: none; }
        .timestamp { color: #888; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 PhysioAssist Instruments Profiling Report</h1>
        <p class="timestamp">Generated: $(date)</p>
        <p class="timestamp">Target: ${TARGET} - ${DEVICE_NAME}</p>
        <p class="timestamp">Duration: ${DURATION}s per test</p>

        <h2>📁 Profile Traces</h2>
        <ul class="file-list">
EOF

    # List all trace files
    for trace in "$RESULTS_DIR"/*.trace; do
        if [ -f "$trace" ]; then
            FILENAME=$(basename "$trace")
            SIZE=$(du -h "$trace" | cut -f1)
            echo "            <li><a href=\"file://${trace}\">${FILENAME}</a> (${SIZE})</li>" >> "$REPORT"
        fi
    done

    cat >> "$REPORT" <<EOF
        </ul>

        <h2>🎯 Quick Analysis</h2>
        <div class="metric">
            <strong>Time Profiler:</strong> Check for hot paths in pose detection algorithms. Look for functions taking >16ms (causes frame drops).
        </div>
        <div class="metric">
            <strong>Allocations:</strong> Monitor memory growth during pose tracking sessions. Should remain stable after warmup.
        </div>
        <div class="metric">
            <strong>Leaks:</strong> Zero leaks expected. Any leaks in TensorFlow or camera handling are critical.
        </div>
        <div class="metric">
            <strong>Core Animation:</strong> Target 60 FPS consistently. Frame drops indicate CPU/GPU bottlenecks.
        </div>
        <div class="metric">
            <strong>Energy:</strong> CPU should stay <30% during pose tracking. GPU usage should be optimized via Skia.
        </div>

        <h2>📋 Performance Targets</h2>
        <div class="metric">
            ✅ <strong>Frame Rate:</strong> 60 FPS sustained<br>
            ✅ <strong>Pose Detection:</strong> <16ms per frame<br>
            ✅ <strong>Memory:</strong> <100MB stable state<br>
            ✅ <strong>CPU:</strong> <30% average usage<br>
            ✅ <strong>Battery:</strong> <15% per hour
        </div>

        <h2>🔍 How to Analyze</h2>
        <ol>
            <li>Click any .trace file above to open in Instruments</li>
            <li>Use keyboard shortcuts:
                <ul>
                    <li><code>Cmd+1,2,3...</code> - Switch between instruments</li>
                    <li><code>Cmd+F</code> - Search for symbols</li>
                    <li><code>E</code> - Extended detail view</li>
                </ul>
            </li>
            <li>Look for red/orange markers indicating issues</li>
            <li>Double-click call stacks to see source code</li>
            <li>Use filtering to focus on PhysioAssist code</li>
        </ol>

        <h2>🚀 Next Steps</h2>
        <p>Based on profiling results:</p>
        <ol>
            <li>Identify performance bottlenecks in call trees</li>
            <li>Optimize hot paths (functions called frequently)</li>
            <li>Fix memory leaks immediately</li>
            <li>Address frame drops in UI rendering</li>
            <li>Optimize energy-intensive operations</li>
        </ol>
    </div>
</body>
</html>
EOF

    echo -e "${GREEN}✓ Report generated: ${REPORT}${NC}"

    # Open report
    open "$REPORT"
}

# Main execution
main() {
    get_device_udid

    if [ $# -eq 0 ]; then
        show_menu
        echo -e "\n${CYAN}Select profiling template (1-10):${NC} "
        read -r CHOICE
    else
        CHOICE=$1
    fi

    echo -e "\n${CYAN}Duration in seconds (default 60):${NC} "
    read -r CUSTOM_DURATION
    if [ ! -z "$CUSTOM_DURATION" ]; then
        DURATION=$CUSTOM_DURATION
    fi

    case $CHOICE in
        1) profile_time ;;
        2) profile_allocations ;;
        3) profile_leaks ;;
        4) profile_animation ;;
        5) profile_energy ;;
        6) profile_network ;;
        7) profile_system ;;
        8) profile_metal ;;
        9) profile_file ;;
        10) profile_all ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Profiling complete!${NC}"
    echo -e "\n${BLUE}Results location:${NC} ${RESULTS_DIR}"
    echo -e "\n${BLUE}Analyze results:${NC}"
    echo -e "  • Open .trace files in Xcode Instruments"
    echo -e "  • Look for performance bottlenecks"
    echo -e "  • Check memory allocations and leaks"
    echo -e "  • Verify 60 FPS in Core Animation"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

main "$@"
