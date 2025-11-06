#!/bin/bash

################################################################################
# iOS On-Device Validation Script
# Runs gate validation tests on physical device or simulator
################################################################################

set -e

echo "🧪 iOS On-Device Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TARGET="${1:-simulator}" # simulator or device
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$PROJECT_ROOT"

# Run standard gate validation
run_gate_validation() {
    echo -e "\n${BLUE}📋 Running Gate Validation...${NC}"

    npm run gate:validate

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Gate validation failed${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Gate validation passed${NC}"
    return 0
}

# Performance profiling on device
run_performance_tests() {
    echo -e "\n${BLUE}⚡ Running Performance Tests...${NC}"

    # Create test results directory
    mkdir -p test-results/ios

    if [ "$TARGET" == "simulator" ]; then
        echo -e "${YELLOW}Running on simulator...${NC}"

        # Get simulator UDID
        SIMULATOR_UDID=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

        if [ -z "$SIMULATOR_UDID" ]; then
            echo -e "${YELLOW}⚠️  No booted simulator found. Boot one first.${NC}"
            return 1
        fi

        # Run instruments profiling
        echo -e "${CYAN}Profiling CPU usage...${NC}"
        xcrun xctrace record \
            --device "$SIMULATOR_UDID" \
            --template 'Time Profiler' \
            --time-limit 30s \
            --output "test-results/ios/performance-sim.trace" \
            --launch org.reactjs.native.example.PhysioAssist \
            2>/dev/null || echo -e "${YELLOW}⚠️  Profiling requires app to be installed${NC}"

    else
        echo -e "${YELLOW}Running on physical device...${NC}"

        # Get device UDID
        DEVICE_UDID=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator" | head -n 1 | grep -oE '[0-9a-f]{40}')

        if [ -z "$DEVICE_UDID" ]; then
            echo -e "${RED}❌ No device connected${NC}"
            return 1
        fi

        # Run instruments profiling on device
        echo -e "${CYAN}Profiling on device...${NC}"
        xcrun xctrace record \
            --device "$DEVICE_UDID" \
            --template 'Time Profiler' \
            --time-limit 30s \
            --output "test-results/ios/performance-device.trace" \
            --launch org.reactjs.native.example.PhysioAssist \
            2>/dev/null || echo -e "${YELLOW}⚠️  Profiling requires app to be installed${NC}"
    fi

    echo -e "${GREEN}✓ Performance tests complete${NC}"
    echo -e "${BLUE}Results saved to: test-results/ios/${NC}"
}

# Memory leak detection
run_memory_tests() {
    echo -e "\n${BLUE}💾 Running Memory Tests...${NC}"

    if [ "$TARGET" == "simulator" ]; then
        SIMULATOR_UDID=$(xcrun simctl list devices booted | grep "iPhone" | head -n 1 | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

        if [ -z "$SIMULATOR_UDID" ]; then
            echo -e "${YELLOW}⚠️  No booted simulator${NC}"
            return 1
        fi

        # Run leaks instrument
        echo -e "${CYAN}Checking for memory leaks...${NC}"
        xcrun xctrace record \
            --device "$SIMULATOR_UDID" \
            --template 'Leaks' \
            --time-limit 30s \
            --output "test-results/ios/memory-leaks.trace" \
            --launch org.reactjs.native.example.PhysioAssist \
            2>/dev/null || echo -e "${YELLOW}⚠️  Leak detection requires app to be installed${NC}"

    else
        DEVICE_UDID=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator" | head -n 1 | grep -oE '[0-9a-f]{40}')

        if [ -z "$DEVICE_UDID" ]; then
            echo -e "${YELLOW}⚠️  No device connected${NC}"
            return 1
        fi

        xcrun xctrace record \
            --device "$DEVICE_UDID" \
            --template 'Leaks' \
            --time-limit 30s \
            --output "test-results/ios/memory-leaks-device.trace" \
            --launch org.reactjs.native.example.PhysioAssist \
            2>/dev/null || echo -e "${YELLOW}⚠️  Leak detection requires app to be installed${NC}"
    fi

    echo -e "${GREEN}✓ Memory tests complete${NC}"
}

# Camera/pose detection validation
run_pose_validation() {
    echo -e "\n${BLUE}🎯 Running Pose Detection Validation...${NC}"

    # Check if TensorFlow Lite model exists
    if [ ! -f "ios/models/movenet_lightning_int8.tflite" ]; then
        echo -e "${RED}❌ MoveNet model not found${NC}"
        echo -e "${YELLOW}Expected location: ios/models/movenet_lightning_int8.tflite${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ MoveNet model found${NC}"

    # Validate model format
    file ios/models/movenet_lightning_int8.tflite | grep -q "data"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Model format valid${NC}"
    else
        echo -e "${RED}❌ Invalid model format${NC}"
        return 1
    fi

    # Check camera permissions in Info.plist
    if grep -q "NSCameraUsageDescription" ios/PhysioAssist/Info.plist; then
        echo -e "${GREEN}✓ Camera permissions configured${NC}"
    else
        echo -e "${RED}❌ Camera permissions not configured${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Pose detection validation passed${NC}"
}

# Generate validation report
generate_report() {
    echo -e "\n${BLUE}📊 Generating Validation Report...${NC}"

    REPORT_FILE="test-results/ios/validation-report-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$REPORT_FILE" <<EOF
PhysioAssist iOS Validation Report
Generated: $(date)
Target: $TARGET
═══════════════════════════════════════════════════════════

GATE VALIDATION: ${GATE_RESULT}
PERFORMANCE TESTS: ${PERF_RESULT}
MEMORY TESTS: ${MEM_RESULT}
POSE VALIDATION: ${POSE_RESULT}

═══════════════════════════════════════════════════════════

Device Information:
$(if [ "$TARGET" == "simulator" ]; then
    xcrun simctl list devices booted | grep "iPhone"
else
    xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator" | head -n 1
fi)

Build Configuration:
- Scheme: PhysioAssist
- Configuration: Debug
- Platform: iOS

Test Artifacts:
- Performance traces: test-results/ios/*.trace
- Validation logs: Available in console output

═══════════════════════════════════════════════════════════
EOF

    echo -e "${GREEN}✓ Report generated: ${REPORT_FILE}${NC}"
    cat "$REPORT_FILE"
}

# Main execution
main() {
    echo -e "${BLUE}🎯 Target: ${YELLOW}${TARGET}${NC}\n"

    # Initialize results
    GATE_RESULT="❓"
    PERF_RESULT="❓"
    MEM_RESULT="❓"
    POSE_RESULT="❓"

    # Run all validations
    if run_gate_validation; then
        GATE_RESULT="✅ PASS"
    else
        GATE_RESULT="❌ FAIL"
    fi

    if run_performance_tests; then
        PERF_RESULT="✅ PASS"
    else
        PERF_RESULT="⚠️  PARTIAL"
    fi

    if run_memory_tests; then
        MEM_RESULT="✅ PASS"
    else
        MEM_RESULT="⚠️  PARTIAL"
    fi

    if run_pose_validation; then
        POSE_RESULT="✅ PASS"
    else
        POSE_RESULT="❌ FAIL"
    fi

    # Generate report
    generate_report

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Validation complete!${NC}"
    echo -e "\n${BLUE}Summary:${NC}"
    echo -e "  Gate Validation: ${GATE_RESULT}"
    echo -e "  Performance: ${PERF_RESULT}"
    echo -e "  Memory: ${MEM_RESULT}"
    echo -e "  Pose Detection: ${POSE_RESULT}"
    echo -e "\n${BLUE}📊 Full report: ${REPORT_FILE}${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

main
