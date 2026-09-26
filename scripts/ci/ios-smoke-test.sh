#!/bin/bash
# Boot a simulator, install the built app, launch it and capture screenshots,
# logs and crash state. Used by .github/workflows/ios-simulator.yml.
#
# Usage: scripts/ci/ios-smoke-test.sh <path-to-.app> <simulator-udid> <out-dir>

set -euo pipefail

APP_PATH="$1"
UDID="$2"
OUT_DIR="$3"
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$APP_PATH/Info.plist")
APP_BINARY=$(/usr/libexec/PlistBuddy -c "Print :CFBundleExecutable" "$APP_PATH/Info.plist")

mkdir -p "$OUT_DIR"

echo "Booting simulator $UDID"
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b

echo "Installing $BUNDLE_ID"
xcrun simctl install "$UDID" "$APP_PATH"
for service in camera microphone photos; do
  xcrun simctl privacy "$UDID" grant "$service" "$BUNDLE_ID" || true
done

echo "Launching $BUNDLE_ID"
xcrun simctl launch "$UDID" "$BUNDLE_ID"

# Take screenshots over time so slow JS startup and later crashes are both visible
for t in 5 15 30; do
  sleep $((t - ${prev:-0}))
  prev=$t
  xcrun simctl io "$UDID" screenshot "$OUT_DIR/launch-${t}s.png"
done

xcrun simctl spawn "$UDID" log show --last 3m --style compact \
  --predicate "process == \"$APP_BINARY\"" > "$OUT_DIR/app.log" 2>&1 || true

if pgrep -f "$APP_BINARY.app/$APP_BINARY" > /dev/null; then
  echo "✅ App still running 30s after launch"
  echo "running" > "$OUT_DIR/status.txt"
else
  echo "❌ App is not running 30s after launch (crashed or exited)"
  echo "crashed" > "$OUT_DIR/status.txt"
  cp ~/Library/Logs/DiagnosticReports/"$APP_BINARY"* "$OUT_DIR/" 2>/dev/null || true
  tail -n 80 "$OUT_DIR/app.log" || true
  exit 1
fi
