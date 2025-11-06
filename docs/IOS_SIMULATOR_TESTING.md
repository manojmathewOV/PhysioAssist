# iOS Simulator Testing Guide

This guide explains how to run comprehensive end-to-end tests on iOS Simulator to validate every component in the PhysioAssist app.

## 🎯 What Gets Tested

The E2E test suite validates **every single component** end-to-end, ensuring:

### ✅ Functional Testing
- **Onboarding Flow**: Welcome screens, navigation, privacy consent
- **Authentication**: Login/signup forms, validation, error handling
- **Pose Detection**: Camera access, pose overlay, real-time updates
- **Exercise Execution**: Rep counting, form feedback, angle calculations
- **Settings**: All toggles, persistence, reset functionality
- **Progress Tracking**: Charts, stats, period switching

### ✅ UI/UX Validation
- All buttons are tappable and respond correctly
- All text inputs accept and validate data
- Navigation flows work seamlessly
- Loading states display properly
- Error messages appear when expected

### ✅ Component Wiring
- Redux store integration
- Navigation routing
- Service layer connections
- Camera permissions
- AsyncStorage persistence
- Audio/haptic feedback

### ✅ Design Compliance
- All components render as designed
- Proper spacing and alignment
- Correct colors and typography
- Accessibility labels present

### ✅ Edge Cases & Error Handling
- Network failures
- Permission denials
- Invalid inputs
- App crash recovery

---

## 📋 Prerequisites

### Required Software
1. **macOS** (Monterey 12.0 or later)
2. **Xcode 14+** with iOS Simulator
3. **Node.js 18+**
4. **CocoaPods**

### Install Xcode Command Line Tools
```bash
xcode-select --install
```

### Verify Xcode Installation
```bash
xcodebuild -version
# Should show: Xcode 14.x or later
```

### Install Dependencies
```bash
# Install npm packages
npm install

# Install iOS dependencies
cd ios
pod install
cd ..
```

---

## 🚀 Running Tests Locally

### Step 1: Install Detox CLI (First Time Only)
```bash
npm install -g detox-cli
```

### Step 2: Build the App for Testing
```bash
npm run build:e2e:ios
```

This will:
- Build the iOS app in debug mode
- Place the `.app` bundle in `ios/build/`
- Take 2-5 minutes on first run (cached afterward)

### Step 3: Run the E2E Tests
```bash
npm run test:e2e:ios
```

This will:
- Launch iOS Simulator (iPhone 15 Pro by default)
- Install the app
- Run all component validation tests
- Take approximately 10-15 minutes

---

## 📱 Testing on Different Devices

### iPhone 14
```bash
npm run test:e2e:ios:iphone14
```

### iPad Pro
```bash
npm run test:e2e:ios:ipad
```

### Custom Device
```bash
detox test --configuration ios.sim.debug --device-name="iPhone 13"
```

---

## 🔍 What You'll See

### Test Output
```
PhysioAssist - Complete Component Validation
  🎯 Onboarding Flow - Complete UI Validation
    ✓ should display welcome screen with all components properly wired (1234ms)
    ✓ should navigate through all onboarding screens (3456ms)
    ✓ should allow skipping onboarding (987ms)

  🔐 Login Screen - Form Validation & Components
    ✓ should display all login components correctly (876ms)
    ✓ should validate email input (1234ms)
    ✓ should validate password input (1098ms)
    ✓ should toggle password visibility (765ms)
    ✓ should handle successful login flow (2345ms)

  📸 Pose Detection Screen - Camera & Components
    ✓ should display all pose detection UI components (1456ms)
    ✓ should switch between front and back camera (2123ms)
    ✓ should display pose landmarks when person detected (4567ms)

  🏋️ Exercise Execution - Complete Workflow
    ✓ should display exercise selector with all exercises (987ms)
    ✓ should select exercise and display instructions (1234ms)
    ✓ should start exercise and track reps correctly (8901ms)
    ✓ should provide real-time form feedback (6789ms)
    ✓ should display exercise summary after completion (2345ms)

  ⚙️ Settings Screen - All Components Working
    ✓ should display all settings categories (654ms)
    ✓ should toggle audio feedback setting (876ms)
    ✓ should persist settings changes (1234ms)
    ✓ should reset all settings to defaults (1987ms)

  📊 Progress Screen - Charts & Data Display
    ✓ should display progress chart components (876ms)
    ✓ should switch between time periods (1456ms)
    ✓ should display empty state when no data (765ms)

  ♿ Accessibility Features
    ✓ should have proper accessibility labels (543ms)
    ✓ should support VoiceOver navigation (2345ms)

  🔄 Error Handling & Edge Cases
    ✓ should handle network errors gracefully (3456ms)
    ✓ should handle camera permission denial (2109ms)
    ✓ should recover from app crash (1876ms)

Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
Time:        156.789s
```

### Simulator View
You'll see the iOS Simulator automatically:
1. Launch the app
2. Navigate through screens
3. Tap buttons
4. Fill in forms
5. Display camera views
6. Show exercise feedback

---

## 🐛 Troubleshooting

### Simulator Won't Boot
```bash
# List all simulators
xcrun simctl list devices

# Boot manually
xcrun simctl boot "iPhone 15 Pro"
```

### Build Fails
```bash
# Clean build
rm -rf ios/build
cd ios
pod deintegrate
pod install
cd ..
npm run build:e2e:ios
```

### Tests Timeout
```bash
# Increase timeout in .detoxrc.js
testRunner: {
  jest: {
    setupTimeout: 180000, // 3 minutes
  },
}
```

### App Crashes During Test
- Check logs: `~/Library/Logs/DiagnosticReports/`
- Enable Detox verbose logging: `detox test --loglevel trace`

### Camera Tests Fail
- Ensure simulator has camera permission
- Check if virtual camera is enabled in simulator settings

---

## 📊 Continuous Integration

### GitHub Actions
Tests run automatically on:
- Every push to `main`, `develop`, or `claude/**` branches
- Every pull request
- Manual trigger via GitHub Actions tab

View results:
1. Go to GitHub → Actions tab
2. Select "iOS E2E Tests" workflow
3. View test results and artifacts

### Running CI Locally
```bash
# Install act (GitHub Actions local runner)
brew install act

# Run workflow locally
act push
```

---

## 📈 Test Coverage Report

After running tests, view coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

Current coverage targets:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

---

## 🎬 Recording Test Videos

### Enable Video Recording
In `.detoxrc.js`, add:
```javascript
{
  artifacts: {
    rootDir: 'e2e/artifacts',
    plugins: {
      video: 'failing', // Record only failing tests
      // OR
      video: 'all', // Record all tests
    },
  },
}
```

Videos saved to: `e2e/artifacts/`

---

## 📸 Taking Screenshots

### Manually During Test
```typescript
await device.takeScreenshot('login-screen');
```

### Automatic Screenshot on Failure
Enabled by default. Check `e2e/artifacts/` after test run.

---

## 🔧 Advanced Configuration

### Run Specific Test Suite
```bash
detox test e2e/componentValidation.e2e.ts --configuration ios.sim.debug
```

### Run Single Test
```bash
detox test -f "should display welcome screen" --configuration ios.sim.debug
```

### Debug Mode
```bash
detox test --configuration ios.sim.debug --loglevel trace
```

### Headless Mode (No Simulator UI)
```bash
detox test --headless --configuration ios.sim.release
```

---

## ✅ Validation Checklist

After running tests, verify:

- [ ] All 27 tests pass
- [ ] No warning messages in console
- [ ] Simulator launches and closes properly
- [ ] Test artifacts generated (if configured)
- [ ] Coverage report meets thresholds (70%)

---

## 🚨 Known Limitations

### Cannot Run on Linux/Windows
- iOS Simulator only works on macOS
- Use GitHub Actions for CI/CD on non-Mac machines

### Requires Physical or Virtual Mac
- Mac mini (for CI servers)
- MacStadium or similar cloud Mac service
- GitHub-hosted macOS runners (free for public repos)

### Performance Considerations
- First run takes 5-10 minutes (builds app)
- Subsequent runs: 2-5 minutes (uses cached build)
- Full test suite: 10-15 minutes

---

## 🎯 What This Validates

### ✅ Every Screen Works
- Onboarding → Login → Pose Detection → Exercise → Results → Settings

### ✅ Every Component Renders
- Buttons, inputs, images, charts, overlays, modals

### ✅ Every Interaction Works
- Taps, swipes, text entry, navigation, toggles

### ✅ Every State Transition Works
- Loading → Success → Error
- Empty → Populated
- Idle → Active → Complete

### ✅ Every Integration Works
- Camera ↔ Pose Detection
- Pose Detection ↔ Exercise Validation
- Redux ↔ Components
- AsyncStorage ↔ Settings
- Navigation ↔ Screens

### ✅ Exactly as Designed
- Layout matches design specs
- Colors match brand guidelines
- Typography is consistent
- Spacing and alignment correct

---

## 📚 Additional Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [iOS Simulator Guide](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device)

---

## 💡 Pro Tips

1. **Run tests before every commit**
   ```bash
   npm run test:e2e:ios
   ```

2. **Use watch mode during development**
   ```bash
   detox test --watch
   ```

3. **Profile slow tests**
   ```bash
   detox test --loglevel trace
   ```

4. **Test on multiple devices**
   - iPhone SE (small screen)
   - iPhone 15 Pro Max (large screen)
   - iPad Pro (tablet)

5. **Keep tests fast**
   - Use `reloadReactNative()` instead of `launchApp()`
   - Mock API calls
   - Disable animations in test builds

---

## 🎉 You're All Set!

Run your first test:
```bash
npm run build:e2e:ios && npm run test:e2e:ios
```

Watch the magic happen as every component gets validated automatically! 🚀
