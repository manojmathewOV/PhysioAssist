/**
 * End-to-End User Workflow Tests
 * Tests complete user journeys from start to finish
 */

// Skip E2E tests in unit test environment
if (process.env.DETOX_MODE === 'true') {
  // Only import Detox when running E2E tests
  const { device, element, by, expect: detoxExpect, waitFor } = require('detox');
  runE2ETests();
} else {
  // Skip E2E tests in normal Jest runs
  describe.skip('PhysioAssist E2E User Workflows', () => {
    it('E2E tests are skipped in unit test mode', () => {
      expect(true).toBe(true);
    });
  });
}

function runE2ETests() {
  describe('PhysioAssist E2E User Workflows', () => {
    beforeAll(async () => {
      await device.launchApp({
        newInstance: true,
        permissions: { camera: 'YES', microphone: 'YES' },
        launchArgs: {
          detoxPrintBusyIdleResources: 'YES',
          clearAsyncStorage: 'YES',
        },
      });
    });

    beforeEach(async () => {
      await device.reloadReactNative();
    });

    describe('First-Time User Complete Journey', () => {
      it('should complete onboarding, register, and perform first exercise', async () => {
        // Step 1: Welcome Screen
        await waitFor(element(by.id('onboarding-welcome')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('onboarding-get-started')).tap();

        // Step 2: Privacy Consent
        await waitFor(element(by.id('onboarding-privacy-checkbox')))
          .toBeVisible()
          .withTimeout(3000);

        // Read privacy policy (simulate delay)
        await device.pause(1000);

        await element(by.id('onboarding-privacy-checkbox')).tap();
        await element(by.id('onboarding-next')).tap();

        // Step 3: Registration
        await waitFor(element(by.id('auth-signup-button')))
          .toBeVisible()
          .withTimeout(3000);

        await element(by.id('auth-email-input')).typeText('newuser@test.com');
        await element(by.id('auth-password-input')).typeText('SecurePass123!');
        await element(by.id('auth-name-input')).typeText('New User');

        await element(by.id('auth-signup-button')).tap();

        // Step 4: Profile Setup
        await waitFor(element(by.id('profile-setup-screen')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('profile-age-input')).typeText('30');
        await element(by.id('profile-fitness-level')).tap();
        await element(by.text('Beginner')).tap();

        // Select goals
        await element(by.id('goal-flexibility')).tap();
        await element(by.id('goal-strength')).tap();

        await element(by.id('profile-save-button')).tap();

        // Step 5: Camera Permission
        await waitFor(element(by.id('pose-detection-screen')))
          .toBeVisible()
          .withTimeout(5000);

        // Handle system permission dialog
        await device.pause(1000); // Wait for permission dialog

        // Step 6: First Exercise Tutorial
        await waitFor(element(by.id('tutorial-overlay')))
          .toBeVisible()
          .withTimeout(3000);

        await element(by.id('tutorial-next')).tap();
        await element(by.id('tutorial-next')).tap();
        await element(by.id('tutorial-finish')).tap();

        // Step 7: Select and Start Exercise
        await element(by.id('exercise-selector')).tap();
        await element(by.id('exercise-bicep-curl')).tap();

        await element(by.id('exercise-start')).tap();

        // Step 8: Perform Exercise
        await waitFor(element(by.id('exercise-rep-counter')))
          .toBeVisible()
          .withTimeout(3000);

        // Simulate exercise for 10 seconds
        await device.pause(10000);

        // Step 9: Complete Exercise
        await element(by.id('exercise-end')).tap();

        // Step 10: View Results
        await waitFor(element(by.id('exercise-summary')))
          .toBeVisible()
          .withTimeout(3000);

        await detoxExpect(element(by.id('summary-total-reps'))).toBeVisible();
        await detoxExpect(element(by.id('summary-form-score'))).toBeVisible();

        await element(by.id('summary-close')).tap();

        // Verify user is on main screen
        await detoxExpect(element(by.id('pose-detection-screen'))).toBeVisible();
      });
    });

    describe('Returning User Daily Routine', () => {
      it('should login and complete daily exercise routine', async () => {
        // Skip onboarding for returning user
        if (await element(by.id('onboarding-skip')).atIndex(0).isVisible()) {
          await element(by.id('onboarding-skip')).tap();
        }

        // Step 1: Login
        await element(by.id('auth-email-input')).typeText('user@example.com');
        await element(by.id('auth-password-input')).typeText('Test123!');
        await element(by.id('auth-login-button')).tap();

        // Step 2: Check daily progress
        await waitFor(element(by.id('pose-detection-screen')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('home-tab')).tap();

        await waitFor(element(by.id('daily-streak')))
          .toBeVisible()
          .withTimeout(3000);

        // Step 3: Navigate to exercises
        await element(by.id('exercises-tab')).tap();

        // Step 4: Start exercise from history
        await element(by.id('quick-start-last-exercise')).tap();

        // Step 5: Complete exercise set
        await waitFor(element(by.id('exercise-rep-counter')))
          .toBeVisible()
          .withTimeout(3000);

        // Perform 3 sets
        for (let set = 0; set < 3; set++) {
          // Simulate exercise
          await device.pause(15000);

          // Rest between sets
          if (set < 2) {
            await element(by.id('exercise-pause')).tap();
            await device.pause(5000); // Rest
            await element(by.id('exercise-resume')).tap();
          }
        }

        // Step 6: End exercise
        await element(by.id('exercise-end')).tap();

        // Step 7: Rate session
        await waitFor(element(by.id('session-rating')))
          .toBeVisible()
          .withTimeout(3000);

        await element(by.id('rating-4-stars')).tap();
        await element(by.id('rating-submit')).tap();

        // Step 8: View progress
        await element(by.id('profile-tab')).tap();

        await waitFor(element(by.id('weekly-progress-chart')))
          .toBeVisible()
          .withTimeout(3000);

        // Verify streak updated
        await detoxExpect(element(by.id('current-streak'))).toHaveText('1 day');
      });
    });

    describe('Exercise Form Correction Flow', () => {
      it('should provide real-time form corrections', async () => {
        // Assume user is logged in
        await loginQuickly();

        // Start bicep curl
        await element(by.id('exercise-selector')).tap();
        await element(by.id('exercise-bicep-curl')).tap();
        await element(by.id('exercise-start')).tap();

        // Wait for detection to stabilize
        await waitFor(element(by.id('pose-confidence')))
          .toHaveText('90%')
          .withTimeout(5000);

        // Simulate poor form (this would be triggered by actual pose)
        // In real test, we'd manipulate test data to simulate poor form

        await waitFor(element(by.id('exercise-feedback')))
          .toBeVisible()
          .withTimeout(3000);

        // Verify form correction appears
        await detoxExpect(element(by.id('exercise-feedback'))).toHaveText(
          'Keep your elbow closer to your body'
        );

        // Verify visual indicator
        await detoxExpect(element(by.id('form-quality-indicator'))).toHaveText('Poor');

        // Simulate form improvement
        await device.pause(3000);

        // Verify positive feedback
        await waitFor(element(by.id('exercise-feedback')))
          .toHaveText('Great form! Keep it up!')
          .withTimeout(5000);

        await detoxExpect(element(by.id('form-quality-indicator'))).toHaveText(
          'Excellent'
        );
      });
    });

    describe('Multi-Exercise Circuit Training', () => {
      it('should complete a circuit training session', async () => {
        await loginQuickly();

        // Navigate to workouts
        await element(by.id('workouts-tab')).tap();

        // Select circuit training
        await element(by.id('circuit-training-option')).tap();

        // Configure circuit
        await element(by.id('add-exercise-bicep-curl')).tap();
        await element(by.id('add-exercise-shoulder-press')).tap();
        await element(by.id('add-exercise-squat')).tap();

        await element(by.id('circuit-duration-30s')).tap();
        await element(by.id('rest-duration-10s')).tap();

        await element(by.id('start-circuit')).tap();

        // Complete circuit
        const exercises = ['Bicep Curl', 'Shoulder Press', 'Squat'];

        for (let round = 0; round < 2; round++) {
          for (const exercise of exercises) {
            // Wait for exercise prompt
            await waitFor(element(by.text(`Get ready for ${exercise}`)))
              .toBeVisible()
              .withTimeout(5000);

            // Exercise period (30s)
            await waitFor(element(by.id('exercise-timer')))
              .toHaveText('0:00')
              .withTimeout(35000);

            // Rest period (10s) - except last exercise
            if (!(round === 1 && exercise === 'Squat')) {
              await waitFor(element(by.text('Rest')))
                .toBeVisible()
                .withTimeout(3000);

              await device.pause(10000);
            }
          }
        }

        // Verify completion
        await waitFor(element(by.id('circuit-complete')))
          .toBeVisible()
          .withTimeout(5000);

        await detoxExpect(element(by.id('total-exercises-completed'))).toHaveText('6');
      });
    });

    describe('Settings and Preferences Flow', () => {
      it('should customize app settings and verify changes', async () => {
        await loginQuickly();

        // Navigate to settings
        await element(by.id('settings-tab')).tap();

        // Test audio settings
        await element(by.id('settings-sound-toggle')).tap();
        await element(by.id('settings-speech-rate')).swipe('right', 'slow', 0.5);

        // Test visual settings
        await element(by.id('settings-high-contrast-toggle')).tap();
        await element(by.id('settings-text-size')).tap();
        await element(by.text('Large')).tap();

        // Test performance settings
        await element(by.id('settings-frame-skip')).swipe('right', 'slow', 0.3);

        // Save settings
        await element(by.id('settings-save')).tap();

        // Verify toast message
        await waitFor(element(by.text('Settings saved successfully')))
          .toBeVisible()
          .withTimeout(3000);

        // Navigate back to exercise
        await element(by.id('exercises-tab')).tap();

        // Start exercise to verify settings applied
        await element(by.id('quick-start-last-exercise')).tap();

        // Verify high contrast mode active
        await detoxExpect(element(by.id('pose-overlay'))).toHaveStyle({ borderWidth: 3 }); // High contrast indicator

        // Verify no sound (we disabled it)
        // This would be tested by checking audio service state
      });
    });

    describe('Error Recovery Scenarios', () => {
      it('should handle network disconnection gracefully', async () => {
        await loginQuickly();

        // Disable network
        await device.setURLBlacklist(['.*']);

        // Try to sync progress
        await element(by.id('sync-progress-button')).tap();

        // Verify offline message
        await waitFor(element(by.text('You are offline')))
          .toBeVisible()
          .withTimeout(3000);

        await detoxExpect(
          element(by.text('Progress will sync when connected'))
        ).toBeVisible();

        // Continue with offline mode
        await element(by.id('continue-offline')).tap();

        // Perform exercise offline
        await element(by.id('exercise-selector')).tap();
        await element(by.id('exercise-squat')).tap();
        await element(by.id('exercise-start')).tap();

        await device.pause(5000);

        await element(by.id('exercise-end')).tap();

        // Re-enable network
        await device.clearURLBlacklist();

        // Verify sync indicator
        await waitFor(element(by.id('syncing-indicator')))
          .toBeVisible()
          .withTimeout(5000);

        await waitFor(element(by.text('All data synced')))
          .toBeVisible()
          .withTimeout(10000);
      });

      it('should recover from app crash during exercise', async () => {
        await loginQuickly();

        // Start exercise
        await element(by.id('exercise-selector')).tap();
        await element(by.id('exercise-bicep-curl')).tap();
        await element(by.id('exercise-start')).tap();

        // Wait for some progress
        await device.pause(5000);

        // Simulate crash
        await device.terminateApp();
        await device.launchApp();

        // Check for recovery prompt
        await waitFor(element(by.text('Resume previous session?')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('resume-session')).tap();

        // Verify session restored
        await waitFor(element(by.id('exercise-rep-counter')))
          .toBeVisible()
          .withTimeout(3000);

        // Complete exercise
        await element(by.id('exercise-end')).tap();

        // Verify data integrity
        await detoxExpect(element(by.id('exercise-summary'))).toBeVisible();
      });
    });

    describe('Accessibility User Journey', () => {
      it('should navigate app using accessibility features', async () => {
        // Enable screen reader (simulated)
        await device.launchApp({
          newInstance: true,
          launchArgs: {
            accessibilityMode: 'screenReader',
          },
        });

        // Navigate using accessibility labels
        await element(by.label('PhysioAssist, Digital Physiotherapy Assistant')).atIndex(
          0
        );

        await element(by.label('Get Started, button')).tap();

        // Complete onboarding with screen reader
        await element(by.label('Privacy checkbox, unchecked')).tap();
        await element(by.label('Next, button')).tap();

        // Login with accessibility
        await element(by.label('Email address, text field')).typeText('user@example.com');
        await element(by.label('Password, secure text field')).typeText('Test123!');
        await element(by.label('Login, button')).tap();

        // Navigate to exercise with voice hints
        await waitFor(element(by.label('Pose Detection screen')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.label('Select exercise, button')).tap();
        await element(by.label('Bicep Curl, button, Double tap to select')).tap();

        // Start exercise with accessibility announcements
        await element(by.label('Start pose detection, button')).tap();

        // Verify accessibility announcements
        await waitFor(element(by.label('Pose detection started. Begin your exercise.')))
          .toExist()
          .withTimeout(3000);
      });
    });

    // Helper functions
    async function loginQuickly() {
      if (await element(by.id('onboarding-skip')).atIndex(0).isVisible()) {
        await element(by.id('onboarding-skip')).tap();
      }

      if (await element(by.id('auth-email-input')).atIndex(0).isVisible()) {
        await element(by.id('auth-email-input')).clearText();
        await element(by.id('auth-email-input')).typeText('test@physioassist.com');
        await element(by.id('auth-password-input')).typeText('Test123!');
        await element(by.id('auth-login-button')).tap();

        await waitFor(element(by.id('pose-detection-screen')))
          .toBeVisible()
          .withTimeout(5000);
      }
    }
  });
} // End of runE2ETests function
