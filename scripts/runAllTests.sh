#!/bin/bash

# PhysioAssist Comprehensive Test Runner
# Runs all tests across platforms and generates reports

set -e

echo "🧪 PhysioAssist Comprehensive Test Suite"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="$REPORTS_DIR/$TIMESTAMP"

# Create reports directory
mkdir -p "$REPORT_DIR"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Log function
log() {
    echo -e "$1" | tee -a "$REPORT_DIR/test-log.txt"
}

# Test result function
record_result() {
    local test_name=$1
    local status=$2
    local duration=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    case $status in
        "PASSED")
            PASSED_TESTS=$((PASSED_TESTS + 1))
            log "${GREEN}✓ $test_name - PASSED (${duration}s)${NC}"
            ;;
        "FAILED")
            FAILED_TESTS=$((FAILED_TESTS + 1))
            log "${RED}✗ $test_name - FAILED (${duration}s)${NC}"
            ;;
        "SKIPPED")
            SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
            log "${YELLOW}⊘ $test_name - SKIPPED${NC}"
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "${BLUE}Checking prerequisites...${NC}"
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log "${RED}Node.js is not installed${NC}"
        exit 1
    fi
    log "✓ Node.js: $(node -v)"
    
    # npm
    if ! command -v npm &> /dev/null; then
        log "${RED}npm is not installed${NC}"
        exit 1
    fi
    log "✓ npm: $(npm -v)"
    
    # Platform-specific checks
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v xcodebuild &> /dev/null; then
            log "${YELLOW}⚠ Xcode not found - iOS tests will be skipped${NC}"
        else
            log "✓ Xcode: $(xcodebuild -version | head -1)"
        fi
    fi
    
    if command -v adb &> /dev/null; then
        log "✓ Android SDK found"
    else
        log "${YELLOW}⚠ Android SDK not found - Android tests will be skipped${NC}"
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    log "${BLUE}Installing dependencies...${NC}"
    cd "$PROJECT_ROOT"
    
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps
    else
        log "Dependencies already installed"
    fi
    
    echo ""
}

# Run unit tests
run_unit_tests() {
    log "${BLUE}Running unit tests...${NC}"
    cd "$PROJECT_ROOT"
    
    START_TIME=$(date +%s)
    
    if npm test -- --coverage --json --outputFile="$REPORT_DIR/unit-test-results.json" 2>&1 | tee "$REPORT_DIR/unit-test-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Unit Tests" "PASSED" "$DURATION"
        
        # Copy coverage report
        if [ -d "coverage" ]; then
            cp -r coverage "$REPORT_DIR/"
        fi
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Unit Tests" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Run integration tests
run_integration_tests() {
    log "${BLUE}Running integration tests...${NC}"
    cd "$PROJECT_ROOT"
    
    START_TIME=$(date +%s)
    
    if npm test -- src/components/__tests__/integration.test.tsx --json --outputFile="$REPORT_DIR/integration-test-results.json" 2>&1 | tee "$REPORT_DIR/integration-test-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Integration Tests" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Integration Tests" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Run backend API tests
run_api_tests() {
    log "${BLUE}Running API tests...${NC}"
    cd "$PROJECT_ROOT"
    
    # Start mock server
    log "Starting mock server..."
    node src/mocks/mockServer.ts &
    MOCK_SERVER_PID=$!
    sleep 3
    
    START_TIME=$(date +%s)
    
    if npm test -- src/services/__tests__/api.test.ts --json --outputFile="$REPORT_DIR/api-test-results.json" 2>&1 | tee "$REPORT_DIR/api-test-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "API Tests" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "API Tests" "FAILED" "$DURATION"
    fi
    
    # Stop mock server
    kill $MOCK_SERVER_PID 2>/dev/null || true
    
    echo ""
}

# Run iOS UI tests
run_ios_tests() {
    if [[ "$OSTYPE" != "darwin"* ]] || ! command -v xcodebuild &> /dev/null; then
        record_result "iOS UI Tests" "SKIPPED" "0"
        return
    fi
    
    log "${BLUE}Running iOS UI tests...${NC}"
    cd "$PROJECT_ROOT/ios"
    
    START_TIME=$(date +%s)
    
    if xcodebuild test \
        -workspace PhysioAssist.xcworkspace \
        -scheme PhysioAssist \
        -destination 'platform=iOS Simulator,name=iPhone 14,OS=16.0' \
        -resultBundlePath "$REPORT_DIR/ios-test-results.xcresult" \
        2>&1 | tee "$REPORT_DIR/ios-test-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "iOS UI Tests" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "iOS UI Tests" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Run Android UI tests
run_android_tests() {
    if ! command -v adb &> /dev/null; then
        record_result "Android UI Tests" "SKIPPED" "0"
        return
    fi
    
    log "${BLUE}Running Android UI tests...${NC}"
    cd "$PROJECT_ROOT/android"
    
    # Check if emulator is running
    if ! adb devices | grep -q "emulator"; then
        log "${YELLOW}No Android emulator running - starting one...${NC}"
        # Start emulator (adjust for your setup)
        # emulator -avd Pixel_4_API_30 -no-window &
        # EMULATOR_PID=$!
        # sleep 30
    fi
    
    START_TIME=$(date +%s)
    
    if ./gradlew connectedAndroidTest 2>&1 | tee "$REPORT_DIR/android-test-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Android UI Tests" "PASSED" "$DURATION"
        
        # Copy test results
        cp -r app/build/reports/androidTests/connected/* "$REPORT_DIR/" 2>/dev/null || true
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Android UI Tests" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Run E2E tests with Detox
run_e2e_tests() {
    if ! command -v detox &> /dev/null; then
        log "${YELLOW}Detox not installed - installing...${NC}"
        npm install -g detox-cli
    fi
    
    log "${BLUE}Running E2E tests...${NC}"
    cd "$PROJECT_ROOT"
    
    # Build app for testing
    log "Building app for E2E tests..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        detox build -c ios.sim.debug
    else
        detox build -c android.emu.debug
    fi
    
    START_TIME=$(date +%s)
    
    if detox test -c ios.sim.debug --cleanup --jest-report-specs --artifacts-location "$REPORT_DIR/e2e-artifacts" 2>&1 | tee "$REPORT_DIR/e2e-test-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "E2E Tests" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "E2E Tests" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Run performance tests
run_performance_tests() {
    log "${BLUE}Running performance tests...${NC}"
    cd "$PROJECT_ROOT"
    
    START_TIME=$(date +%s)
    
    # Run performance benchmarks
    if node scripts/performanceBenchmark.js > "$REPORT_DIR/performance-results.json" 2>&1; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Performance Tests" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Performance Tests" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Run accessibility tests
run_accessibility_tests() {
    log "${BLUE}Running accessibility tests...${NC}"
    cd "$PROJECT_ROOT"
    
    START_TIME=$(date +%s)
    
    # Run accessibility audit
    if npm run test:accessibility > "$REPORT_DIR/accessibility-results.txt" 2>&1; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Accessibility Tests" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "Accessibility Tests" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Run linting and type checking
run_code_quality_checks() {
    log "${BLUE}Running code quality checks...${NC}"
    cd "$PROJECT_ROOT"
    
    # ESLint
    START_TIME=$(date +%s)
    if npm run lint -- --format json --output-file "$REPORT_DIR/eslint-results.json" 2>&1 | tee "$REPORT_DIR/eslint-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "ESLint" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "ESLint" "FAILED" "$DURATION"
    fi
    
    # TypeScript
    START_TIME=$(date +%s)
    if npm run type-check 2>&1 | tee "$REPORT_DIR/typescript-output.log"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "TypeScript" "PASSED" "$DURATION"
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        record_result "TypeScript" "FAILED" "$DURATION"
    fi
    
    echo ""
}

# Generate test report
generate_report() {
    log "${BLUE}Generating test report...${NC}"
    
    cat > "$REPORT_DIR/summary.txt" << EOF
PhysioAssist Test Report
========================
Generated: $(date)
Duration: $TOTAL_DURATION seconds

Test Summary
------------
Total Tests: $TOTAL_TESTS
Passed: $PASSED_TESTS
Failed: $FAILED_TESTS
Skipped: $SKIPPED_TESTS
Success Rate: $(( TOTAL_TESTS > 0 ? PASSED_TESTS * 100 / TOTAL_TESTS : 0 ))%

Detailed Results
----------------
EOF
    
    # Append test log
    cat "$REPORT_DIR/test-log.txt" >> "$REPORT_DIR/summary.txt"
    
    # Generate HTML report
    generate_html_report
    
    log "${GREEN}Test report generated at: $REPORT_DIR/summary.txt${NC}"
    log "${GREEN}HTML report available at: $REPORT_DIR/report.html${NC}"
}

# Generate HTML report
generate_html_report() {
    cat > "$REPORT_DIR/report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>PhysioAssist Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #4A90E2; color: white; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .passed { color: #4CAF50; }
        .failed { color: #f44336; }
        .skipped { color: #FF9800; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PhysioAssist Test Report</h1>
        <p>Generated: <script>document.write(new Date().toLocaleString());</script></p>
    </div>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <canvas id="chart" width="400" height="200"></canvas>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Total Tests</td>
                <td>TOTAL_TESTS_PLACEHOLDER</td>
            </tr>
            <tr>
                <td class="passed">Passed</td>
                <td class="passed">PASSED_TESTS_PLACEHOLDER</td>
            </tr>
            <tr>
                <td class="failed">Failed</td>
                <td class="failed">FAILED_TESTS_PLACEHOLDER</td>
            </tr>
            <tr>
                <td class="skipped">Skipped</td>
                <td class="skipped">SKIPPED_TESTS_PLACEHOLDER</td>
            </tr>
        </table>
    </div>
    
    <script>
        // Draw pie chart
        const canvas = document.getElementById('chart');
        const ctx = canvas.getContext('2d');
        const data = [
            { label: 'Passed', value: PASSED_TESTS_PLACEHOLDER, color: '#4CAF50' },
            { label: 'Failed', value: FAILED_TESTS_PLACEHOLDER, color: '#f44336' },
            { label: 'Skipped', value: SKIPPED_TESTS_PLACEHOLDER, color: '#FF9800' }
        ];
        
        // Pie chart implementation
        let total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2;
        
        data.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(200, 100, 80, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(200, 100);
            ctx.fillStyle = item.color;
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
    </script>
</body>
</html>
EOF
    
    # Replace placeholders
    sed -i.bak "s/TOTAL_TESTS_PLACEHOLDER/$TOTAL_TESTS/g" "$REPORT_DIR/report.html"
    sed -i.bak "s/PASSED_TESTS_PLACEHOLDER/$PASSED_TESTS/g" "$REPORT_DIR/report.html"
    sed -i.bak "s/FAILED_TESTS_PLACEHOLDER/$FAILED_TESTS/g" "$REPORT_DIR/report.html"
    sed -i.bak "s/SKIPPED_TESTS_PLACEHOLDER/$SKIPPED_TESTS/g" "$REPORT_DIR/report.html"
    rm "$REPORT_DIR/report.html.bak"
}

# Main execution
main() {
    START_TIME=$(date +%s)
    
    log "${GREEN}Starting PhysioAssist Comprehensive Test Suite${NC}"
    log "Report directory: $REPORT_DIR"
    echo ""
    
    # Run all test phases
    check_prerequisites
    install_dependencies
    run_unit_tests
    run_integration_tests
    run_api_tests
    run_code_quality_checks
    run_ios_tests
    run_android_tests
    # run_e2e_tests # Uncomment if Detox is configured
    # run_performance_tests # Uncomment if performance tests are set up
    # run_accessibility_tests # Uncomment if accessibility tests are set up
    
    END_TIME=$(date +%s)
    TOTAL_DURATION=$((END_TIME - START_TIME))
    
    # Generate final report
    generate_report
    
    echo ""
    log "${BLUE}Test Summary:${NC}"
    log "Total: $TOTAL_TESTS | ${GREEN}Passed: $PASSED_TESTS${NC} | ${RED}Failed: $FAILED_TESTS${NC} | ${YELLOW}Skipped: $SKIPPED_TESTS${NC}"
    log "Duration: ${TOTAL_DURATION}s"
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -gt 0 ]; then
        log "${RED}Tests FAILED${NC}"
        exit 1
    else
        log "${GREEN}All tests PASSED!${NC}"
        exit 0
    fi
}

# Run main function
main "$@"