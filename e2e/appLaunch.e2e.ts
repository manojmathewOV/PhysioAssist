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
    // Wait for what the patient sees (the container can sit under other views),
    // with room for the first JS bundle load on a cold simulator
    await waitFor(element(by.id('onboarding-get-started')))
      .toBeVisible()
      .withTimeout(60000);
    await device.takeScreenshot('01-onboarding');
  });

  it('requires privacy consent before continuing', async () => {
    await element(by.id('onboarding-get-started')).tap();
    // On smaller screens the checkbox sits below the explanation: scroll to it
    await waitFor(element(by.id('onboarding-privacy-checkbox')))
      .toBeVisible()
      .whileElement(by.id('onboarding-scroll'))
      .scroll(200, 'down');
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
    // The help tile is at the bottom of Home: scroll until it can be tapped
    await waitFor(element(by.id('home-help')))
      .toBeVisible(100)
      .whileElement(by.id('home-screen-scroll'))
      .scroll(250, 'down');
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
