#!/bin/bash

# Infrastructure Tests Runner
# Runs all tests for newly implemented infrastructure services

set -e  # Exit on any error

echo "🧪 Running Infrastructure Tests"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run a test suite
run_test() {
  local test_name=$1
  local test_path=$2

  echo -e "${YELLOW}Running: $test_name${NC}"

  if npm test -- "$test_path" --verbose 2>&1 | tee /tmp/test_output.txt; then
    echo -e "${GREEN}✅ PASSED: $test_name${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED: $test_name${NC}"
    ((FAILED++))
  fi
  echo ""
}

echo "📊 Test Suite: Infrastructure Services"
echo "----------------------------------------"
echo ""

# Run individual test suites
run_test "TelemetryService Tests" "src/features/videoComparison/__tests__/telemetryService.test.ts"
run_test "YouTubeQuotaManager Tests" "src/features/videoComparison/__tests__/youtubeQuotaManager.test.ts"
run_test "DeviceHealthMonitor Tests" "src/__tests__/deviceHealthMonitor.test.ts"
run_test "AnalyticsService Tests" "src/features/videoComparison/__tests__/analytics.test.ts"
run_test "Integration Tests" "src/features/videoComparison/__tests__/integration.test.ts"

echo ""
echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
