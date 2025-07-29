# Visual Regression Testing Guide

## Overview

Visual regression testing ensures UI consistency across updates by comparing screenshots of your app's screens.

## Recommended Tools

### 1. **Percy (Recommended for CI/CD)**
- Cloud-based visual testing
- Integrates with GitHub Actions
- Cross-browser testing
- Responsive design testing

#### Setup:
```bash
npm install --save-dev @percy/cli @percy/appium-app
```

#### Configuration:
```javascript
// percy.config.js
module.exports = {
  version: 2,
  snapshot: {
    widths: [375, 768, 1280],
    minHeight: 1024,
    percyCSS: `
      /* Hide dynamic content */
      .timestamp { visibility: hidden; }
      .loading-spinner { display: none; }
    `
  }
};
```

### 2. **Applitools Eyes**
- AI-powered visual testing
- Smart image comparison
- Root cause analysis

#### Setup:
```bash
npm install --save-dev @applitools/eyes-appium
```

#### Usage:
```javascript
const { Eyes, Target } = require('@applitools/eyes-appium');

const eyes = new Eyes();
eyes.setApiKey(process.env.APPLITOOLS_API_KEY);

// In your test
await eyes.open(driver, 'PhysioAssist', 'Exercise Flow');
await eyes.check('Exercise Selection', Target.window());
await eyes.close();
```

### 3. **React Native Screenshot Testing**

#### iOS (using Snapshot Test Case):
```swift
import FBSnapshotTestCase

class PhysioAssistSnapshotTests: FBSnapshotTestCase {
    
    override func setUp() {
        super.setUp()
        recordMode = false // Set to true to record new reference images
    }
    
    func testPoseDetectionScreen() {
        let app = XCUIApplication()
        app.launch()
        
        // Navigate to pose detection
        app.tabBars.buttons["exercises-tab"].tap()
        
        // Wait for screen to load
        Thread.sleep(forTimeInterval: 1)
        
        // Take snapshot
        FBSnapshotVerifyView(app.windows.firstMatch)
    }
}
```

#### Android (using Screenshot Tests for Android):
```kotlin
@RunWith(AndroidJUnit4::class)
class PhysioAssistScreenshotTest {
    
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @Test
    fun testPoseDetectionScreen() {
        // Navigate to pose detection
        onView(withContentDescription("exercises-tab")).perform(click())
        
        // Take screenshot
        Screenshot.capture(activityRule.activity).apply {
            name = "pose_detection_screen"
            format = CompressFormat.PNG
            process()
        }
    }
}
```

## Local Visual Testing Setup

### 1. **Jest Image Snapshot** (for React Native Web)

```bash
npm install --save-dev jest-image-snapshot puppeteer
```

```javascript
// visual.test.js
const puppeteer = require('puppeteer');

describe('Visual Regression Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should match pose detection screen', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="pose-detection-screen"]');
    
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot({
      customSnapshotsDir: '__image_snapshots__',
      customDiffDir: '__image_snapshots__/__diff__',
      threshold: 0.01, // 1% threshold
    });
  });
});
```

### 2. **Detox + Jest Snapshots** (for React Native)

```javascript
// e2e/visualTests.spec.js
describe('Visual Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should match onboarding screen', async () => {
    const imagePath = await device.takeScreenshot('onboarding');
    await expectBitmapsToBeEqual(imagePath, './e2e/screenshots/onboarding.png');
  });
});
```

## Best Practices

### 1. **Baseline Management**
- Store baseline images in version control
- Review and approve visual changes in PRs
- Use separate baselines for different devices/OS versions

### 2. **Dynamic Content Handling**
```javascript
// Hide dynamic content before screenshots
const hideDynamicContent = () => {
  // Hide timestamps
  document.querySelectorAll('.timestamp').forEach(el => {
    el.style.visibility = 'hidden';
  });
  
  // Replace dynamic text
  document.querySelectorAll('.rep-counter').forEach(el => {
    el.textContent = '0';
  });
};
```

### 3. **Responsive Testing**
```javascript
const viewports = [
  { width: 375, height: 667, name: 'iPhone-6' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1920, height: 1080, name: 'Desktop' }
];

for (const viewport of viewports) {
  await page.setViewport(viewport);
  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot({
    customSnapshotIdentifier: `pose-detection-${viewport.name}`,
  });
}
```

### 4. **Component-Level Visual Tests**
```javascript
// Component snapshot testing
import React from 'react';
import renderer from 'react-test-renderer';
import PoseOverlay from '../PoseOverlay';

it('renders correctly with landmarks', () => {
  const tree = renderer.create(
    <PoseOverlay 
      landmarks={mockLandmarks}
      width={320}
      height={480}
    />
  ).toJSON();
  
  expect(tree).toMatchSnapshot();
});
```

## CI/CD Integration

### GitHub Actions with Percy:
```yaml
name: Visual Tests

on: [pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build app
        run: npm run build:web
        
      - name: Percy Test
        run: npx percy exec -- npm run test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

## Debugging Visual Differences

### 1. **Analyze Diffs**
- Check diff images in `__diff__` folder
- Look for unintended changes
- Verify dynamic content is properly masked

### 2. **Update Baselines**
```bash
# Update specific snapshot
npm test -- -u --testNamePattern="pose detection screen"

# Update all snapshots
npm test -- -u
```

### 3. **Common Issues**
- **Font rendering**: Use web fonts consistently
- **Animations**: Disable during tests
- **Async content**: Wait for content to load
- **Platform differences**: Use platform-specific baselines

## Visual Testing Checklist

- [ ] Set up visual testing tool
- [ ] Create baseline images
- [ ] Configure CI/CD integration
- [ ] Handle dynamic content
- [ ] Test responsive layouts
- [ ] Document approval process
- [ ] Set up notifications for failures
- [ ] Regular baseline maintenance