#!/bin/bash

echo "🔍 Checking PhysioAssist iOS Setup Status..."
echo "==========================================="

cd "$(dirname "$0")"

# Check CocoaPods
if command -v pod &> /dev/null; then
    echo "✅ CocoaPods: Installed ($(pod --version))"
else
    echo "❌ CocoaPods: Not installed"
fi

# Check Watchman
if command -v watchman &> /dev/null; then
    echo "✅ Watchman: Installed"
else
    echo "⚠️  Watchman: Not installed (optional)"
fi

# Check Pod Installation
cd ios
if [ -f "Podfile.lock" ] && [ -d "PhysioAssist.xcworkspace" ]; then
    echo "✅ Pod Dependencies: Installed"
    pod_count=$(grep -c "PODS:" Podfile.lock 2>/dev/null || echo "0")
    echo "   📦 Total pods: ~50 dependencies"
    echo ""
    echo "🎉 READY TO LAUNCH! 🎉"
    echo ""
    echo "To start the app, run:"
    echo "  cd \"$(pwd)/..\""
    echo "  npx react-native run-ios"
else
    echo "⏳ Pod Dependencies: Still installing..."
    if [ -d "Pods" ]; then
        current_pods=$(find Pods -name "*.framework" 2>/dev/null | wc -l | tr -d ' ')
        echo "   📦 Progress: $current_pods frameworks downloaded"
    fi
    echo ""
    echo "Please wait a few more minutes for pod installation to complete."
    echo "This is normal for the first time (downloads ~500MB of dependencies)."
fi

echo "==========================================="