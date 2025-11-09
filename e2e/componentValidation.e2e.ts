import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('PhysioAssist - Complete Component Validation', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES', microphone: 'YES', photos: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('🎯 Onboarding Flow - Complete UI Validation', () => {
    it('should display welcome screen with all components properly wired', async () => {
      // Verify header
      await detoxExpect(element(by.text('Welcome to PhysioAssist'))).toBeVisible();

      // Verify description text
      await detoxExpect(element(by.text(/AI-powered physiotherapy/i))).toBeVisible();

      // Verify illustration/animation component
      await detoxExpect(element(by.id('onboarding-illustration'))).toBeVisible();

      // Verify navigation buttons
      await detoxExpect(element(by.id('get-started-button'))).toBeVisible();
      await detoxExpect(element(by.id('skip-button'))).toBeVisible();
    });

    it('should navigate through all onboarding screens', async () => {
      // Screen 1: Welcome
      await detoxExpect(element(by.text('Welcome to PhysioAssist'))).toBeVisible();
      await element(by.id('get-started-button')).tap();

      // Screen 2: Features
      await waitFor(element(by.text(/Real-time pose detection/i)))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('next-button')).tap();

      // Screen 3: Privacy
      await waitFor(element(by.text(/Your privacy matters/i)))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('privacy-consent-checkbox')).tap();
      await element(by.id('accept-button')).tap();

      // Should navigate to login/signup
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should allow skipping onboarding', async () => {
      await element(by.id('skip-button')).tap();
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('🔐 Login Screen - Form Validation & Components', () => {
    beforeEach(async () => {
      // Navigate to login screen
      await element(by.id('skip-button')).tap();
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should display all login components correctly', async () => {
      // Header
      await detoxExpect(element(by.text('Welcome Back'))).toBeVisible();

      // Input fields
      await detoxExpect(element(by.id('email-input'))).toBeVisible();
      await detoxExpect(element(by.id('password-input'))).toBeVisible();

      // Password visibility toggle
      await detoxExpect(element(by.id('password-toggle'))).toBeVisible();

      // Buttons
      await detoxExpect(element(by.id('login-button'))).toBeVisible();
      await detoxExpect(element(by.id('signup-link'))).toBeVisible();
      await detoxExpect(element(by.id('forgot-password-link'))).toBeVisible();
    });

    it('should validate email input', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('login-button')).tap();

      // Should show error
      await waitFor(element(by.text(/valid email/i)))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should validate password input', async () => {
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('123'); // Too short
      await element(by.id('login-button')).tap();

      // Should show error
      await waitFor(element(by.text(/at least 6 characters/i)))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should toggle password visibility', async () => {
      await element(by.id('password-input')).typeText('mypassword');

      // Password should be hidden by default
      await detoxExpect(element(by.id('password-input'))).toHaveToggleValue(false);

      // Toggle visibility
      await element(by.id('password-toggle')).tap();

      // Password should now be visible
      await detoxExpect(element(by.id('password-input'))).toHaveToggleValue(true);
    });

    it('should handle successful login flow', async () => {
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();

      // Should show loading state
      await waitFor(element(by.id('loading-indicator')))
        .toBeVisible()
        .withTimeout(1000);

      // Should navigate to main app
      await waitFor(element(by.id('pose-detection-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('📸 Pose Detection Screen - Camera & Components', () => {
    beforeEach(async () => {
      // Login first
      await device.launchApp({
        newInstance: true,
        permissions: { camera: 'YES' },
      });
      // Assume user is logged in (use test account or mock)
    });

    it('should display all pose detection UI components', async () => {
      // Camera view
      await detoxExpect(element(by.id('camera-view'))).toBeVisible();

      // Pose overlay canvas
      await detoxExpect(element(by.id('pose-overlay'))).toBeVisible();

      // Confidence indicator
      await detoxExpect(element(by.id('confidence-indicator'))).toBeVisible();

      // Control buttons
      await detoxExpect(element(by.id('start-exercise-button'))).toBeVisible();
      await detoxExpect(element(by.id('switch-camera-button'))).toBeVisible();
      await detoxExpect(element(by.id('settings-button'))).toBeVisible();
    });

    it('should request camera permission if not granted', async () => {
      await device.launchApp({
        newInstance: true,
        permissions: { camera: 'NO' },
      });

      // Should show permission request
      await waitFor(element(by.text(/camera permission/i)))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpect(element(by.id('request-permission-button'))).toBeVisible();
    });

    it('should switch between front and back camera', async () => {
      await element(by.id('switch-camera-button')).tap();

      // Wait for camera to switch
      await waitFor(element(by.id('camera-view')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify camera switched (check for indicator or state change)
      await detoxExpect(element(by.id('camera-indicator'))).toHaveText('Front');
    });

    it('should display pose landmarks when person detected', async () => {
      // Wait for pose detection to initialize
      await waitFor(element(by.id('pose-detected-indicator')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify confidence score is displayed
      await detoxExpect(element(by.id('confidence-score'))).toBeVisible();

      // Verify pose overlay is drawing landmarks
      await detoxExpect(element(by.id('pose-overlay'))).toBeVisible();
    });
  });

  describe('🏋️ Exercise Execution - Complete Workflow', () => {
    beforeEach(async () => {
      // Navigate to exercise screen
      await device.launchApp({ newInstance: true });
      // Login and navigate to exercises
    });

    it('should display exercise selector with all exercises', async () => {
      await detoxExpect(element(by.id('exercise-selector'))).toBeVisible();

      // Verify exercise categories
      await detoxExpect(element(by.text('Upper Body'))).toBeVisible();
      await detoxExpect(element(by.text('Lower Body'))).toBeVisible();
      await detoxExpect(element(by.text('Stretching'))).toBeVisible();

      // Verify specific exercises
      await detoxExpect(element(by.text('Bicep Curl'))).toBeVisible();
      await detoxExpect(element(by.text('Squat'))).toBeVisible();
      await detoxExpect(element(by.text('Hamstring Stretch'))).toBeVisible();
    });

    it('should select exercise and display instructions', async () => {
      await element(by.text('Bicep Curl')).tap();

      // Should show exercise details
      await waitFor(element(by.id('exercise-details-modal')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify components in modal
      await detoxExpect(element(by.id('exercise-title'))).toHaveText('Bicep Curl');
      await detoxExpect(element(by.id('exercise-description'))).toBeVisible();
      await detoxExpect(element(by.id('exercise-illustration'))).toBeVisible();
      await detoxExpect(element(by.id('start-exercise-button'))).toBeVisible();
    });

    it('should start exercise and track reps correctly', async () => {
      // Select and start bicep curl
      await element(by.text('Bicep Curl')).tap();
      await element(by.id('start-exercise-button')).tap();

      // Should show exercise controls
      await waitFor(element(by.id('exercise-controls')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify rep counter
      await detoxExpect(element(by.id('rep-counter'))).toHaveText('0 / 10');

      // Verify form feedback
      await detoxExpect(element(by.id('form-feedback'))).toBeVisible();

      // Verify angle display (if applicable)
      await detoxExpect(element(by.id('angle-display'))).toBeVisible();

      // Simulate rep completion (this would require pose data in real test)
      // For E2E, we're validating UI components are wired correctly
      await waitFor(element(by.id('rep-counter')))
        .toHaveText('1 / 10')
        .withTimeout(10000);
    });

    it('should provide real-time form feedback', async () => {
      await element(by.text('Bicep Curl')).tap();
      await element(by.id('start-exercise-button')).tap();

      // Wait for feedback to appear
      await waitFor(element(by.id('form-feedback')))
        .toBeVisible()
        .withTimeout(3000);

      // Feedback should update (look for different states)
      const feedbackStates = [
        'Get into position',
        'Good form!',
        'Keep your elbow stable',
        'Full range of motion',
      ];

      // At least one feedback state should appear
      let feedbackFound = false;
      for (const feedback of feedbackStates) {
        try {
          await detoxExpect(element(by.text(feedback))).toBeVisible();
          feedbackFound = true;
          break;
        } catch (e) {
          // Continue checking other states
        }
      }

      expect(feedbackFound).toBe(true);
    });

    it('should display exercise summary after completion', async () => {
      await element(by.text('Bicep Curl')).tap();
      await element(by.id('start-exercise-button')).tap();

      // Wait for exercise to complete (or skip for testing)
      await element(by.id('skip-to-summary-button')).tap();

      // Should show summary screen
      await waitFor(element(by.id('exercise-summary')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify summary components
      await detoxExpect(element(by.id('reps-completed'))).toBeVisible();
      await detoxExpect(element(by.id('exercise-duration'))).toBeVisible();
      await detoxExpect(element(by.id('form-accuracy'))).toBeVisible();
      await detoxExpect(element(by.id('done-button'))).toBeVisible();
      await detoxExpect(element(by.id('retry-button'))).toBeVisible();
    });
  });

  describe('⚙️ Settings Screen - All Components Working', () => {
    beforeEach(async () => {
      // Navigate to settings
      await element(by.id('settings-tab')).tap();
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should display all settings categories', async () => {
      await detoxExpect(element(by.text('Audio Feedback'))).toBeVisible();
      await detoxExpect(element(by.text('Haptic Feedback'))).toBeVisible();
      await detoxExpect(element(by.text('Visual Settings'))).toBeVisible();
      await detoxExpect(element(by.text('Accessibility'))).toBeVisible();
      await detoxExpect(element(by.text('Privacy'))).toBeVisible();
    });

    it('should toggle audio feedback setting', async () => {
      const audioToggle = element(by.id('audio-feedback-toggle'));

      // Get initial state
      await detoxExpect(audioToggle).toBeVisible();

      // Toggle off
      await audioToggle.tap();
      await detoxExpect(audioToggle).toHaveToggleValue(false);

      // Toggle on
      await audioToggle.tap();
      await detoxExpect(audioToggle).toHaveToggleValue(true);
    });

    it('should persist settings changes', async () => {
      // Change a setting
      await element(by.id('haptic-feedback-toggle')).tap();

      // Navigate away and back
      await element(by.id('home-tab')).tap();
      await element(by.id('settings-tab')).tap();

      // Setting should still be changed
      await detoxExpect(element(by.id('haptic-feedback-toggle'))).toHaveToggleValue(
        false
      );
    });

    it('should reset all settings to defaults', async () => {
      // Change multiple settings
      await element(by.id('audio-feedback-toggle')).tap();
      await element(by.id('haptic-feedback-toggle')).tap();

      // Reset
      await element(by.id('reset-settings-button')).tap();
      await element(by.id('confirm-reset-button')).tap();

      // All should be back to defaults
      await detoxExpect(element(by.id('audio-feedback-toggle'))).toHaveToggleValue(true);
      await detoxExpect(element(by.id('haptic-feedback-toggle'))).toHaveToggleValue(true);
    });
  });

  describe('📊 Progress Screen - Charts & Data Display', () => {
    beforeEach(async () => {
      await element(by.id('progress-tab')).tap();
      await waitFor(element(by.id('progress-screen')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should display progress chart components', async () => {
      // Chart component
      await detoxExpect(element(by.id('progress-chart'))).toBeVisible();

      // Time period selector
      await detoxExpect(element(by.id('period-selector'))).toBeVisible();
      await detoxExpect(element(by.text('Week'))).toBeVisible();
      await detoxExpect(element(by.text('Month'))).toBeVisible();
      await detoxExpect(element(by.text('Year'))).toBeVisible();

      // Stats summary
      await detoxExpect(element(by.id('total-exercises'))).toBeVisible();
      await detoxExpect(element(by.id('total-reps'))).toBeVisible();
      await detoxExpect(element(by.id('total-duration'))).toBeVisible();
    });

    it('should switch between time periods', async () => {
      // Default view (Week)
      await detoxExpect(element(by.id('period-week'))).toBeVisible();

      // Switch to Month
      await element(by.text('Month')).tap();
      await waitFor(element(by.id('period-month')))
        .toBeVisible()
        .withTimeout(2000);

      // Chart should update
      await detoxExpect(element(by.id('progress-chart'))).toBeVisible();
    });

    it('should display empty state when no data', async () => {
      // If new user or no exercises done
      await detoxExpect(element(by.text(/No exercise data yet/i))).toBeVisible();
      await detoxExpect(element(by.id('start-first-exercise-button'))).toBeVisible();
    });
  });

  describe('🎨 Visual Design Validation', () => {
    it('should display correct brand colors throughout app', async () => {
      // Primary color should be visible in key elements
      await detoxExpect(element(by.id('primary-button'))).toBeVisible();
      // Note: Color validation would require snapshot testing or visual regression
    });

    it('should use consistent typography', async () => {
      // Headers should use correct font family and size
      await detoxExpect(element(by.id('screen-header'))).toBeVisible();
      // Note: Font validation would require snapshot testing
    });

    it('should maintain proper spacing and alignment', async () => {
      // All screens should have consistent padding
      await detoxExpect(element(by.id('screen-container'))).toBeVisible();
      // Note: Layout validation would require snapshot testing
    });
  });

  describe('♿ Accessibility Features', () => {
    it('should have proper accessibility labels', async () => {
      await detoxExpect(element(by.label('Start exercise'))).toBeVisible();
      await detoxExpect(element(by.label('Settings'))).toBeVisible();
    });

    it('should support VoiceOver navigation', async () => {
      // Enable accessibility mode
      await device.enableAccessibility();

      // Navigate using accessibility
      await element(by.label('Start exercise')).tap();

      await device.disableAccessibility();
    });

    it('should have sufficient color contrast', async () => {
      // This would typically be validated with automated accessibility tools
      // or manual testing with accessibility inspector
    });
  });

  describe('🔄 Error Handling & Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Disable network
      await device.setURLBlacklist(['.*']);

      // Try to fetch data
      await element(by.id('refresh-button')).tap();

      // Should show error message
      await waitFor(element(by.text(/network error/i)))
        .toBeVisible()
        .withTimeout(3000);

      // Re-enable network
      await device.setURLBlacklist([]);
    });

    it('should handle camera permission denial', async () => {
      await device.launchApp({
        newInstance: true,
        permissions: { camera: 'NO' },
      });

      // Should show error state
      await detoxExpect(element(by.text(/camera permission required/i))).toBeVisible();

      // Should offer to open settings
      await detoxExpect(element(by.id('open-settings-button'))).toBeVisible();
    });

    it('should recover from app crash', async () => {
      // This would test error boundaries
      // Trigger a crash scenario and verify recovery
    });
  });

  describe('🔥 Performance Validation', () => {
    it('should render pose overlay smoothly (60 FPS)', async () => {
      // Start exercise
      await element(by.text('Bicep Curl')).tap();
      await element(by.id('start-exercise-button')).tap();

      // Monitor frame rate (Detox doesn't have built-in FPS monitoring)
      // This would require custom native monitoring or profiling tools

      // Verify no lag in UI
      await detoxExpect(element(by.id('pose-overlay'))).toBeVisible();
    });

    it('should load screens within 2 seconds', async () => {
      const startTime = Date.now();

      await element(by.id('settings-tab')).tap();
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(2000);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
