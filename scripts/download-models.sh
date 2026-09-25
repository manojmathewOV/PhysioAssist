#!/bin/bash

# Script to download the on-device pose models:
# - MediaPipe BlazePose Full (pose_landmarker_full.task): 33 landmarks + world 3D
#   coordinates, used by the iOS/Android camera screen via react-native-mediapipe
# - MoveNet Lightning INT8: 17 keypoints, used by PoseDetectionService.v2

set -e

echo "🚀 Downloading pose detection models..."
echo "======================================="
echo ""

MODELS_DIR="$(dirname "$0")/../assets/models"
mkdir -p "$MODELS_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Model URLs (TF Hub links now 404; models are hosted on Kaggle as .tar.gz archives)
LIGHTNING_URL="https://www.kaggle.com/api/v1/models/google/movenet/tfLite/singlepose-lightning-tflite-int8/1/download"
BLAZEPOSE_BASE="https://storage.googleapis.com/mediapipe-models/pose_landmarker"
# react-native-mediapipe on Android loads models from the APK's assets
ANDROID_ASSETS_DIR="$(dirname "$0")/../android/app/src/main/assets"

# Download a Kaggle model archive and extract its single .tflite file to $2
download_model() {
  local url="$1" dest="$2" tmp
  tmp="$(mktemp -d)"
  curl -fsSL "$url" -o "$tmp/model.tar.gz"
  tar -xzf "$tmp/model.tar.gz" -C "$tmp"
  mv "$(find "$tmp" -name '*.tflite' | head -n 1)" "$dest"
  chmod 644 "$dest"
  rm -rf "$tmp"
}

# Download MoveNet Lightning INT8
echo -e "${YELLOW}📥 Downloading MoveNet Lightning INT8 (3MB)...${NC}"
if [ -f "$MODELS_DIR/movenet_lightning_int8.tflite" ]; then
  echo "   File already exists, skipping..."
else
  download_model "$LIGHTNING_URL" "$MODELS_DIR/movenet_lightning_int8.tflite"
  echo -e "${GREEN}   ✅ Downloaded successfully!${NC}"
fi
echo ""

# Download MediaPipe BlazePose Full (default) and Lite (auto-selected on slow devices)
mkdir -p "$ANDROID_ASSETS_DIR"
for variant in full lite; do
  model="pose_landmarker_${variant}.task"
  echo -e "${YELLOW}📥 Downloading MediaPipe BlazePose ${variant}...${NC}"
  if [ -f "$MODELS_DIR/$model" ]; then
    echo "   File already exists, skipping..."
  else
    curl -fsSL "$BLAZEPOSE_BASE/pose_landmarker_${variant}/float16/1/$model" -o "$MODELS_DIR/$model"
    echo -e "${GREEN}   ✅ Downloaded successfully!${NC}"
  fi
  cp "$MODELS_DIR/$model" "$ANDROID_ASSETS_DIR/"
done
echo ""

# Verify downloads
echo -e "${YELLOW}🔍 Verifying downloads...${NC}"
for model in movenet_lightning_int8.tflite pose_landmarker_full.task pose_landmarker_lite.task; do
  echo "   $model: $(du -h "$MODELS_DIR/$model" | cut -f1)"
done
echo ""

echo -e "${GREEN}✅ All models downloaded successfully!${NC}"
echo ""
echo "Models location: $MODELS_DIR"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Run 'cd ios && pod install' for iOS"
echo "3. Rebuild your app"
echo ""
