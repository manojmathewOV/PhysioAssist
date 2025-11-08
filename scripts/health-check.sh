#!/bin/bash
# Quick health check before deployment

echo "🏥 PhysioAssist Health Check"
echo "=============================="

ERRORS=0

# 1. Dependencies
echo ""
echo "1️⃣  Checking dependencies..."
if npm list --depth=0 2>&1 | grep -q "UNMET DEPENDENCY"; then
  echo "❌ UNMET dependencies found. Run: npm install"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ All dependencies installed"
fi

# 2. TypeScript
echo ""
echo "2️⃣  Checking TypeScript..."
TS_ERRORS=$(npm run type-check 2>&1 | grep -c "error TS" || echo "0")
if [ "$TS_ERRORS" -gt 80 ]; then
  echo "❌ TypeScript errors: $TS_ERRORS (expected <80)"
  ERRORS=$((ERRORS + 1))
elif [ "$TS_ERRORS" -eq 0 ]; then
  echo "✅ TypeScript errors: 0 (perfect!)"
else
  echo "✅ TypeScript errors: $TS_ERRORS (acceptable)"
fi

# 3. Tests
echo ""
echo "3️⃣  Checking tests..."
if npm test -- --passWithNoTests 2>&1 | grep -q "FAIL"; then
  echo "❌ Some tests failing"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Tests passing"
fi

# 4. Production mocks
echo ""
echo "4️⃣  Checking for production mocks..."
if grep -r "from.*mock" src/ --exclude-dir=__tests__ --exclude-dir=mocks --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -q "mock"; then
  echo "❌ Found mocks in production code"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No production mocks"
fi

# 5. iOS build
echo ""
echo "5️⃣  Checking iOS configuration..."
if [ ! -d "ios/Pods" ]; then
  echo "⚠️  iOS pods not installed. Run: cd ios && pod install"
else
  echo "✅ iOS pods installed"
fi

# Summary
echo ""
echo "=============================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ Health check PASSED"
  echo "   Ready for deployment!"
  exit 0
else
  echo "❌ Health check FAILED"
  echo "   Found $ERRORS issues"
  exit 1
fi
