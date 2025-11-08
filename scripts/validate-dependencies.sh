#!/bin/bash
# Validate all critical dependencies are installed

echo "🔍 Validating PhysioAssist dependencies..."

MISSING=0

# Check critical runtime dependencies
DEPS=(
  "@tensorflow/tfjs-react-native"
  "@mediapipe/pose"
  "react-native-fs"
  "react-native-ytdl"
  "react-native-vision-camera"
  "@react-navigation/native"
  "@mediapipe/camera_utils"
  "react-native-encrypted-storage"
)

for DEP in "${DEPS[@]}"; do
  if npm list "$DEP" &>/dev/null; then
    echo "✅ $DEP"
  else
    echo "❌ $DEP - MISSING"
    MISSING=$((MISSING + 1))
  fi
done

# Check devDependencies
if npm list "@types/node" &>/dev/null; then
  echo "✅ @types/node"
else
  echo "❌ @types/node - MISSING"
  MISSING=$((MISSING + 1))
fi

if [ $MISSING -eq 0 ]; then
  echo ""
  echo "✅ All critical dependencies installed!"
  exit 0
else
  echo ""
  echo "❌ $MISSING dependencies missing. Run: npm install"
  exit 1
fi
