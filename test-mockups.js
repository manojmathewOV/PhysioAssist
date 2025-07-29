const fs = require('fs');
const path = require('path');

// HTML mockup files to test
const mockupFiles = [
  'index.html',
  'home-dashboard.html',
  'exercise-selection.html',
  'pose-detection.html',
  'progress-analytics.html',
  'settings-hub.html',
  'user-profile.html',
  'exercise-complete.html',
  'video-comparison.html'
];

async function testMockups() {
  console.log('🧪 Testing HTML Mockups...\n');
  
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch(e) {
    console.log('⚠️  Puppeteer not available, using simple validation...\n');
    return testMockupsSimple();
  }

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  const mockupsDir = path.join(__dirname, 'mockups');

  for (const file of mockupFiles) {
    const filePath = path.join(mockupsDir, file);
    
    if (!fs.existsSync(filePath)) {
      results.push({
        file,
        status: '❌ NOT FOUND',
        error: 'File does not exist'
      });
      continue;
    }

    try {
      const page = await browser.newPage();
      
      // Set mobile viewport
      await page.setViewport({
        width: 375,
        height: 812,
        deviceScaleFactor: 3,
        isMobile: true
      });

      // Navigate to file
      await page.goto(`file://${filePath}`, {
        waitUntil: 'networkidle0'
      });

      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshotPath = path.join(mockupsDir, 'screenshots', `${path.basename(file, '.html')}.png`);
      
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(mockupsDir, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }
      
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });

      // Check for required elements
      const checks = await page.evaluate(() => {
        const phoneFrame = document.querySelector('.phone-frame');
        const screen = document.querySelector('.screen');
        const navigation = document.querySelector('.bottom-nav');
        
        return {
          hasPhoneFrame: !!phoneFrame,
          hasScreen: !!screen,
          hasNavigation: !!navigation,
          hasContent: document.body.textContent.trim().length > 0
        };
      });

      results.push({
        file,
        status: consoleErrors.length === 0 ? '✅ PASS' : '⚠️  WARNINGS',
        screenshot: `✅ Saved to screenshots/${path.basename(file, '.html')}.png`,
        checks,
        errors: consoleErrors
      });

      await page.close();
    } catch (error) {
      results.push({
        file,
        status: '❌ ERROR',
        error: error.message
      });
    }
  }

  await browser.close();

  // Print results
  console.log('\n📊 Mockup Test Results:\n');
  console.log('┌─────────────────────────┬──────────────┬─────────────────────────────────────┐');
  console.log('│ File                    │ Status       │ Details                             │');
  console.log('├─────────────────────────┼──────────────┼─────────────────────────────────────┤');
  
  results.forEach(result => {
    const fileName = result.file.padEnd(23);
    const status = result.status.padEnd(12);
    const details = result.error || result.screenshot || 'OK';
    console.log(`│ ${fileName} │ ${status} │ ${details.substring(0, 35).padEnd(35)} │`);
  });
  
  console.log('└─────────────────────────┴──────────────┴─────────────────────────────────────┘');

  // Summary
  const passed = results.filter(r => r.status.includes('PASS')).length;
  const warnings = results.filter(r => r.status.includes('WARNINGS')).length;
  const failed = results.filter(r => r.status.includes('ERROR') || r.status.includes('NOT FOUND')).length;
  
  console.log(`\n📈 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`);

  // Detailed checks
  console.log('🔍 Detailed Checks:\n');
  results.forEach(result => {
    if (result.checks) {
      console.log(`${result.file}:`);
      console.log(`  Phone Frame: ${result.checks.hasPhoneFrame ? '✅' : '❌'}`);
      console.log(`  Screen: ${result.checks.hasScreen ? '✅' : '❌'}`);
      console.log(`  Navigation: ${result.checks.hasNavigation ? '✅' : '❌'}`);
      console.log(`  Content: ${result.checks.hasContent ? '✅' : '❌'}`);
      if (result.errors && result.errors.length > 0) {
        console.log(`  Console Errors: ${result.errors.join(', ')}`);
      }
      console.log('');
    }
  });

  return results;
}

// Alternative testing without Puppeteer
async function testMockupsSimple() {
  console.log('🧪 Testing HTML Mockups (Simple Validation)...\n');
  
  const results = [];
  const mockupsDir = path.join(__dirname, 'mockups');

  for (const file of mockupFiles) {
    const filePath = path.join(mockupsDir, file);
    
    if (!fs.existsSync(filePath)) {
      results.push({
        file,
        status: '❌ NOT FOUND',
        error: 'File does not exist'
      });
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic HTML validation
      const checks = {
        hasHTML: content.includes('<!DOCTYPE html>'),
        hasPhoneFrame: content.includes('class="phone-frame"'),
        hasScreen: content.includes('class="screen"'),
        hasNavigation: content.includes('class="bottom-nav"'),
        hasCSS: content.includes('<style>') || content.includes('style='),
        hasContent: content.length > 1000
      };

      const errors = [];
      if (!checks.hasHTML) errors.push('Missing DOCTYPE');
      if (!checks.hasPhoneFrame) errors.push('Missing phone frame');
      if (!checks.hasScreen) errors.push('Missing screen element');
      if (!checks.hasCSS) errors.push('No styling found');

      results.push({
        file,
        status: errors.length === 0 ? '✅ PASS' : '⚠️  ISSUES',
        fileSize: `${(content.length / 1024).toFixed(1)}KB`,
        checks,
        errors
      });
    } catch (error) {
      results.push({
        file,
        status: '❌ ERROR',
        error: error.message
      });
    }
  }

  // Print results
  console.log('\n📊 Mockup Validation Results:\n');
  
  results.forEach(result => {
    console.log(`📄 ${result.file}`);
    console.log(`   Status: ${result.status}`);
    if (result.fileSize) console.log(`   Size: ${result.fileSize}`);
    if (result.errors && result.errors.length > 0) {
      console.log(`   Issues: ${result.errors.join(', ')}`);
    }
    console.log('');
  });

  return results;
}

// Run the appropriate test based on environment
if (require.main === module) {
  // Try Puppeteer first, fall back to simple validation
  testMockups().catch(() => {
    console.log('\n⚠️  Puppeteer not available, using simple validation...\n');
    return testMockupsSimple();
  }).then(() => {
    console.log('✅ Mockup testing complete!\n');
  });
}

module.exports = { testMockups, testMockupsSimple };