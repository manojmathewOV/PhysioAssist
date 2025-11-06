#!/bin/bash

# PhysioAssist iOS Runner Script

echo "🚀 Starting PhysioAssist for iOS..."

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null
then
    echo "❌ CocoaPods is not installed!"
    echo "Please run: sudo gem install cocoapods"
    exit 1
fi

# Check if Watchman is installed
if ! command -v watchman &> /dev/null
then
    echo "⚠️  Watchman is not installed (optional but recommended)"
    echo "Install with: brew install watchman"
fi

# Install pods if needed
cd ios
if [ ! -d "Pods" ]; then
    echo "📦 Installing CocoaPods dependencies..."
    pod install
fi
cd ..

# Start Metro bundler in the background
echo "🔄 Starting Metro bundler..."
npx react-native start --reset-cache &
METRO_PID=$!

# Wait a moment for Metro to start
sleep 3

# Run iOS app
echo "📱 Launching iOS app..."
npx react-native run-ios --simulator="iPhone 15 Pro"

# Cleanup
trap "kill $METRO_PID 2>/dev/null" EXIT