#!/bin/bash
# Detect any mocks or stubs in production code

echo "🔍 Scanning for mocks/stubs in production code..."

ISSUES=0

# Check for mock imports in src/ (excluding __tests__)
MOCK_IMPORTS=$(grep -r "from.*mock" src/ --exclude-dir=__tests__ --exclude-dir=mocks --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -v "//" || true)

if [ -n "$MOCK_IMPORTS" ]; then
  echo "❌ Found mock imports in production code:"
  echo "$MOCK_IMPORTS"
  ISSUES=$((ISSUES + 1))
fi

# Check for test credentials in production
TEST_CREDS=$(grep -r "test@physioassist.com\|Test123!" src/ --exclude-dir=__tests__ --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -n "$TEST_CREDS" ]; then
  echo "❌ Found test credentials in production code:"
  echo "$TEST_CREDS"
  ISSUES=$((ISSUES + 1))
fi

# Check for mockFrame or mockData
MOCK_DATA=$(grep -r "mockFrame\|mockData\|mockUser" src/ --exclude-dir=__tests__ --exclude="*.example.tsx" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -n "$MOCK_DATA" ]; then
  echo "⚠️  Found mock data in production code:"
  echo "$MOCK_DATA"
fi

# Check for files in wrong locations
if [ -d "src/mocks" ]; then
  echo "⚠️  src/mocks/ directory exists (should be in __tests__/)"
  ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
  echo ""
  echo "✅ No production mocks detected!"
  exit 0
else
  echo ""
  echo "❌ Found $ISSUES issues. Review findings above."
  exit 1
fi
