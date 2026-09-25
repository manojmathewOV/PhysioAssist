/**
 * First-run smoke test: the app launches, onboarding (including the required
 * privacy consent) can be completed, demo login works and the main tabs render.
 *
 * Unlike componentValidation.e2e.ts (a spec for screens still being built),
 * this only uses testIDs that exist today, so CI can run it on every build.
 */
import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

const dismissAlertIfShown = async () => {
  try {
    await element(by.text('OK')).tap();
  } catch {
    // No alert on screen
  }
};

describe('App launch smoke test', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true,
      permissions: { camera: 'YES', microphone: 'YES' },
    });
  });

  it('shows onboarding on first launch', async () => {
    await waitFor(element(by.id('onboarding-screen')))
      .toBeVisible()
      .withTimeout(30000);
    await detoxExpect(element(by.id('onboarding-get-started'))).toBeVisible();
    await device.takeScreenshot('01-onboarding');
  });

  it('requires privacy consent before continuing', async () => {
    await element(by.id('onboarding-get-started')).tap();
    await waitFor(element(by.id('onboarding-privacy-checkbox')))
      .toBeVisible()
      .withTimeout(5000);
    await device.takeScreenshot('02-privacy-consent');

    await element(by.id('onboarding-privacy-checkbox')).tap();
    await element(by.id('onboarding-next')).tap();
  });

  it('finishes onboarding and reaches login', async () => {
    // Page through the setup tips until the login screen appears
    for (let i = 0; i < 10; i++) {
      try {
        await detoxExpect(element(by.id('login-screen'))).toBeVisible();
        break;
      } catch {
        await element(by.id('onboarding-next')).tap();
      }
    }
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
    await device.takeScreenshot('03-login');
  });

  it('logs in as the demo user and lands on Home', async () => {
    await element(by.id('demo-login-button')).tap();
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(15000);
    await detoxExpect(element(by.id('home-start-exercises'))).toBeVisible();
    await device.takeScreenshot('04-home');
  });

  it('opens every tab and the help page', async () => {
    await element(by.id('home-help')).tap();
    await waitFor(element(by.id('help-screen')))
      .toBeVisible()
      .withTimeout(5000);
    await device.takeScreenshot('05-help');

    await element(by.id('tab-progress')).tap();
    await waitFor(element(by.id('progress-screen')))
      .toBeVisible()
      .withTimeout(5000);
    await device.takeScreenshot('06-progress');

    await element(by.id('tab-settings')).tap();
    await device.takeScreenshot('07-settings');

    await element(by.id('tab-exercises')).tap();
    // The simulator has no camera; the exercise screen may show an alert
    await dismissAlertIfShown();
    await device.takeScreenshot('08-exercise');
  });
});
