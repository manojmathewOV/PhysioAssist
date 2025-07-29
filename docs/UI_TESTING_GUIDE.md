# UI Testing Guide for PhysioAssist

## Overview

This guide provides comprehensive instructions for running and maintaining UI tests across iOS and Android platforms.

## Test Structure

```
tests/
├── ios/
│   ├── PhysioAssistUITests/
│   │   ├── PhysioAssistUITests.swift
│   │   ├── Helpers/
│   │   └── Snapshots/
│   └── PhysioAssistUITestsScheme.xcscheme
├── android/
│   ├── androidTest/
│   │   ├── PhysioAssistUITest.kt
│   │   ├── helpers/
│   │   └── screenshots/
│   └── espresso-config.json
└── shared/
    ├── test-data.json
    └── accessibility-ids.json
```

## Running Tests

### iOS (XCTest)

#### Prerequisites
- Xcode 14+
- iOS Simulator or device
- CocoaPods installed

#### Run Tests
```bash
# Run all UI tests
xcodebuild test \
  -workspace ios/PhysioAssist.xcworkspace \
  -scheme PhysioAssist \
  -destination 'platform=iOS Simulator,name=iPhone 14,OS=16.0' \
  -only-testing:PhysioAssistUITests

# Run specific test
xcodebuild test \
  -workspace ios/PhysioAssist.xcworkspace \
  -scheme PhysioAssist \
  -destination 'platform=iOS Simulator,name=iPhone 14,OS=16.0' \
  -only-testing:PhysioAssistUITests/PhysioAssistUITests/testOnboardingFlow
```

#### Generate Test Report
```bash
# With xcpretty
xcodebuild test ... | xcpretty -r html --output reports/ios-test-report.html
```

### Android (Espresso)

#### Prerequisites
- Android Studio
- Android SDK 30+
- Emulator or device with developer mode

#### Run Tests
```bash
# Run all UI tests
./gradlew connectedAndroidTest

# Run specific test class
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.physioassist.PhysioAssistUITest

# Run specific test method
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.physioassist.PhysioAssistUITest#test01_OnboardingUserJourney
```

#### Generate Test Report
```bash
# HTML report location
# app/build/reports/androidTests/connected/index.html

# Coverage report
./gradlew createDebugCoverageReport
```

## Test Data Management

### User Credentials
```json
// test-data.json
{
  "validUser": {
    "email": "test@physioassist.com",
    "password": "Test123!"
  },
  "invalidUser": {
    "email": "invalid@test.com",
    "password": "wrong"
  },
  "exercises": [
    "Bicep Curl",
    "Shoulder Press",
    "Squat",
    "Hamstring Stretch"
  ]
}
```

### Mock Responses
```typescript
// Configure mock server for consistent testing
const mockServer = {
  login: {
    success: { token: "mock-token", userId: "123" },
    failure: { error: "Invalid credentials" }
  },
  exercises: {
    history: generateMockHistory(30)
  }
};
```

## Accessibility Testing

### iOS VoiceOver Testing
```swift
// Enable VoiceOver in tests
func testWithVoiceOver() {
    // Programmatically enable VoiceOver
    XCUIDevice.shared.siriService.activate(
        voiceRecognitionText: "Turn on VoiceOver"
    )
    
    // Run your test
    // ...
    
    // Disable VoiceOver
    XCUIDevice.shared.siriService.activate(
        voiceRecognitionText: "Turn off VoiceOver"
    )
}
```

### Android TalkBack Testing
```kotlin
// Enable TalkBack in tests
@Test
fun testWithTalkBack() {
    // Enable TalkBack via ADB
    device.executeShellCommand(
        "settings put secure enabled_accessibility_services " +
        "com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService"
    )
    
    // Run your test
    // ...
    
    // Disable TalkBack
    device.executeShellCommand(
        "settings put secure enabled_accessibility_services ''"
    )
}
```

## Performance Testing

### Measure App Launch Time
```swift
// iOS
func testLaunchPerformance() {
    measure(metrics: [XCTApplicationLaunchMetric()]) {
        XCUIApplication().launch()
    }
}
```

```kotlin
// Android
@Test
fun testLaunchPerformance() {
    val startTime = System.currentTimeMillis()
    activityRule.scenario.onActivity { /* launched */ }
    val launchTime = System.currentTimeMillis() - startTime
    
    assertTrue("Launch time should be under 3 seconds", launchTime < 3000)
}
```

### Memory Usage Testing
```swift
// iOS - Monitor memory during exercise
func testMemoryDuringExercise() {
    let app = XCUIApplication()
    let metrics = [XCTMemoryMetric()]
    
    measure(metrics: metrics) {
        startExerciseSession()
        Thread.sleep(forTimeInterval: 30)
        stopExerciseSession()
    }
}
```

## Visual Regression Testing

### Setup Percy
```bash
# Install Percy CLI
npm install --save-dev @percy/cli @percy/appium-app

# Set environment variable
export PERCY_TOKEN=your_percy_token
```

### Capture Screenshots
```swift
// iOS
func capturePercySnapshot(name: String) {
    let screenshot = XCUIScreen.main.screenshot()
    percy.screenshot(name, screenshot: screenshot.image)
}
```

```kotlin
// Android
fun capturePercySnapshot(name: String) {
    val screenshot = Screenshot.capture()
    percy.screenshot(name, screenshot.bitmap)
}
```

## CI/CD Integration

### GitHub Actions
```yaml
name: UI Tests

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  ios-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: '14.2'
      
      - name: Run iOS UI Tests
        run: |
          xcodebuild test \
            -workspace ios/PhysioAssist.xcworkspace \
            -scheme PhysioAssist \
            -destination 'platform=iOS Simulator,name=iPhone 14' \
            -resultBundlePath TestResults
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        with:
          name: ios-test-results
          path: TestResults.xcresult

  android-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup JDK
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          
      - name: Run Android UI Tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 30
          script: ./gradlew connectedAndroidTest
          
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        with:
          name: android-test-results
          path: app/build/reports/androidTests
```

## Best Practices

### 1. Test Isolation
- Clear app state before each test
- Use unique test data
- Don't depend on test order

### 2. Reliable Selectors
```swift
// Good - Using accessibility identifier
app.buttons["auth-login-button"].tap()

// Bad - Using text that might change
app.buttons["Login"].tap()
```

### 3. Proper Waits
```kotlin
// Good - Wait for specific element
onView(isRoot()).perform(waitForView(withContentDescription("main-screen")))

// Bad - Arbitrary sleep
Thread.sleep(5000)
```

### 4. Test Organization
- Group related tests
- Use descriptive names
- Add comments for complex flows

### 5. Error Handling
```swift
// Always handle potential failures
do {
    try performComplexAction()
} catch {
    XCTFail("Action failed: \(error)")
    // Take screenshot for debugging
    takeScreenshot(name: "error_state")
}
```

## Debugging Failed Tests

### 1. Screenshots
- Automatically capture on failure
- Name descriptively
- Include in test reports

### 2. Video Recording
```bash
# iOS
xcrun simctl io booted recordVideo test-recording.mp4

# Android
adb shell screenrecord /sdcard/test-recording.mp4
```

### 3. Logs
```swift
// iOS - Print view hierarchy
print(app.debugDescription)

// Android - Dump view hierarchy
device.dumpWindowHierarchy()
```

### 4. Network Debugging
- Use Charles Proxy or similar
- Mock network responses
- Test offline scenarios

## Maintenance

### Regular Tasks
1. **Weekly**
   - Review flaky tests
   - Update test data
   - Check CI/CD status

2. **Monthly**
   - Update dependencies
   - Review test coverage
   - Optimize slow tests

3. **Quarterly**
   - Audit accessibility
   - Update device matrix
   - Review visual baselines

### Adding New Tests
1. Identify user journey
2. Add accessibility IDs
3. Write test case
4. Run locally
5. Add to CI/CD
6. Document edge cases

## Troubleshooting

### Common Issues

#### "Element not found"
- Check accessibility ID
- Add proper wait
- Verify element is visible

#### "Test timeout"
- Increase timeout value
- Check for deadlocks
- Review async operations

#### "Flaky tests"
- Add retries
- Improve selectors
- Check race conditions

#### "Different results on CI"
- Match CI environment locally
- Check for hardcoded values
- Review timing issues

## Resources

- [XCTest Documentation](https://developer.apple.com/documentation/xctest)
- [Espresso Documentation](https://developer.android.com/training/testing/espresso)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Accessibility Testing Guide](https://www.w3.org/WAI/test-evaluate/)