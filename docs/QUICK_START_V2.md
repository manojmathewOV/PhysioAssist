# PhysioAssist V2 - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

This automatically:
- ✅ Installs react-native-fast-tflite
- ✅ Installs react-native-skia
- ✅ Downloads MoveNet models
- ✅ Configures metro bundler

### Step 2: Platform Setup

#### iOS
```bash
cd ios
pod install
cd ..
```

#### Android
Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'org.tensorflow:tensorflow-lite-gpu:2.14.0'
}
```

See `android/GPU_CONFIG.md` for complete setup.

### Step 3: Run
```bash
# iOS
npm run ios

# Android
npm run android
```

---

## ⚡ Performance Verification

After launching the app:

1. **Check FPS Counter** (top-left)
   - Should show 60 FPS
   - Green = Good performance

2. **Check GPU Status** (top-left)
   - ✅ = GPU enabled
   - ❌ = Fallback to CPU

3. **Check Inference Time** (console logs)
   - Should be 30-50ms
   - <50ms = Excellent

---

## 🐛 Troubleshooting

### Models Not Downloading
```bash
npm run download-models
```

### iOS Build Fails
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Android Build Fails
```bash
cd android
./gradlew clean
cd ..
```

### Low FPS (<30)
- Check GPU is enabled
- Verify models are loaded
- Check logcat/Xcode console for errors

---

## 📊 What to Expect

### Performance Metrics
- **Inference**: 30-50ms
- **FPS**: 60+
- **Memory**: <200MB
- **Battery**: <20% per 30min

### Visual Indicators
- **Green keypoints**: High confidence (>70%)
- **Yellow keypoints**: Medium confidence (40-70%)
- **Orange keypoints**: Low confidence (<40%)

---

## 📚 Next Steps

- Read [V2 Upgrade Summary](./V2_UPGRADE_SUMMARY.md)
- Check [Performance Upgrade Plan](./PERFORMANCE_UPGRADE_PLAN.md)
- Run [iOS E2E Tests](./IOS_SIMULATOR_TESTING.md)

---

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install & setup |
| `npm run ios` | Run iOS |
| `npm run android` | Run Android |
| `npm test` | Run unit tests |
| `npm run download-models` | Download models |
| `npm run test:e2e:ios` | Run E2E tests |

---

**Need help?** Check the full documentation or open an issue.
