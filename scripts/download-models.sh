#!/bin/bash

# Script to download MoveNet TFLite models

set -e

echo "🚀 Downloading MoveNet TFLite Models..."
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
THUNDER_URL="https://www.kaggle.com/api/v1/models/google/movenet/tfLite/singlepose-thunder-tflite-float16/1/download"

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

# Download MoveNet Thunder Float16
echo -e "${YELLOW}📥 Downloading MoveNet Thunder Float16 (12MB)...${NC}"
if [ -f "$MODELS_DIR/movenet_thunder_fp16.tflite" ]; then
  echo "   File already exists, skipping..."
else
  download_model "$THUNDER_URL" "$MODELS_DIR/movenet_thunder_fp16.tflite"
  echo -e "${GREEN}   ✅ Downloaded successfully!${NC}"
fi
echo ""

# Verify downloads
echo -e "${YELLOW}🔍 Verifying downloads...${NC}"
LIGHTNING_SIZE=$(du -h "$MODELS_DIR/movenet_lightning_int8.tflite" | cut -f1)
THUNDER_SIZE=$(du -h "$MODELS_DIR/movenet_thunder_fp16.tflite" | cut -f1)

echo "   movenet_lightning_int8.tflite: $LIGHTNING_SIZE"
echo "   movenet_thunder_fp16.tflite: $THUNDER_SIZE"
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
