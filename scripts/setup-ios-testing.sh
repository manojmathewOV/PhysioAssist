#!/bin/bash

# PhysioAssist iOS E2E Testing Setup Script
# This script sets up everything needed to run iOS simulator tests

set -e  # Exit on error

echo "🚀 PhysioAssist iOS E2E Testing Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo -e "${RED}❌ Error: iOS testing requires macOS${NC}"
  echo "   Consider using GitHub Actions for CI/CD"
  exit 1
fi

echo -e "${YELLOW}Checking prerequisites...${NC}"
echo ""

# Check Xcode
if ! command -v xcodebuild &> /dev/null; then
  echo -e "${RED}❌ Xcode not found${NC}"
  echo "   Install Xcode from the App Store"
  exit 1
else
  XCODE_VERSION=$(xcodebuild -version | head -1)
  echo -e "${GREEN}✅ Found: $XCODE_VERSION${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found${NC}"
  echo "   Install from https://nodejs.org"
  exit 1
else
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found${NC}"
  exit 1
else
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
fi

# Check CocoaPods
if ! command -v pod &> /dev/null; then
  echo -e "${YELLOW}⚠️  CocoaPods not found, installing...${NC}"
  sudo gem install cocoapods
  echo -e "${GREEN}✅ CocoaPods installed${NC}"
else
  POD_VERSION=$(pod --version)
  echo -e "${GREEN}✅ CocoaPods: $POD_VERSION${NC}"
fi

echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
echo ""

# Install npm dependencies
echo "📦 Installing npm packages..."
npm install

# Install Detox CLI globally
if ! command -v detox &> /dev/null; then
  echo "📦 Installing Detox CLI..."
  npm install -g detox-cli
  echo -e "${GREEN}✅ Detox CLI installed${NC}"
else
  DETOX_VERSION=$(detox --version)
  echo -e "${GREEN}✅ Detox CLI: $DETOX_VERSION${NC}"
fi

# Install iOS pods
echo "📦 Installing CocoaPods dependencies..."
cd ios
pod install
cd ..
echo -e "${GREEN}✅ Pods installed${NC}"

echo ""
echo -e "${YELLOW}Checking iOS simulators...${NC}"
echo ""

# List available simulators
xcrun simctl list devices available | grep "iPhone\|iPad" | head -5

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "======================================"
echo "Next steps:"
echo ""
echo "1. Build the app for testing:"
echo "   ${YELLOW}npm run build:e2e:ios${NC}"
echo ""
echo "2. Run the tests:"
echo "   ${YELLOW}npm run test:e2e:ios${NC}"
echo ""
echo "3. View the documentation:"
echo "   ${YELLOW}docs/IOS_SIMULATOR_TESTING.md${NC}"
echo ""
echo "======================================"
echo ""
echo "🎉 Happy Testing!"
