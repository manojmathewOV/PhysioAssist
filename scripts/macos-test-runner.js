#!/usr/bin/env node

/**
 * MacBook Test Runner CLI
 * Provides command-line interface for running PhysioAssist tests on macOS
 *
 * Usage:
 *   node scripts/macos-test-runner.js camera           # Live camera test
 *   node scripts/macos-test-runner.js video <path>     # Video file test
 *   node scripts/macos-test-runner.js benchmark        # Comprehensive benchmark
 *   node scripts/macos-test-runner.js web              # Launch web interface
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================================================
// Configuration
// ============================================================================

const WEB_PORT = 8080;
const WEB_URL = `http://localhost:${WEB_PORT}/camera-test`;

// ============================================================================
// Command Handlers
// ============================================================================

async function runCameraTest() {
  console.log('🎥 Starting MacBook Camera Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 Instructions:');
  console.log('1. Opening web browser with camera interface...');
  console.log('2. Grant camera permissions when prompted');
  console.log('3. Position yourself in frame (full body visible)');
  console.log('4. Perform test movements:');
  console.log('   - Shoulder flexion: Raise arms forward');
  console.log('   - Shoulder abduction: Raise arms sideways');
  console.log('   - Elbow flexion: Bend arms');
  console.log('5. Observe real-time angle measurements\n');

  // Start webpack dev server
  console.log('🌐 Starting web server...');
  await startWebServer();

  // Open browser
  console.log(`🔗 Opening browser: ${WEB_URL}`);
  await openBrowser(WEB_URL);

  console.log('\n✅ Camera test interface ready!');
  console.log('   Press Ctrl+C to stop the server when done.\n');
}

async function runVideoTest(videoPath) {
  if (!videoPath) {
    console.error('❌ Error: Video path required');
    console.log('Usage: npm run test:macos:video -- /path/to/video.mp4');
    process.exit(1);
  }

  if (!fs.existsSync(videoPath)) {
    console.error(`❌ Error: Video file not found: ${videoPath}`);
    process.exit(1);
  }

  console.log('🎬 Starting Video File Test');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`📁 Video: ${videoPath}`);
  console.log('⏳ Processing frames...\n');

  // Run test via Jest
  const testFile = 'src/testing/__tests__/MacBookVideoTestHarness.test.ts';
  await runJestTest(testFile, {
    VIDEO_PATH: videoPath,
  });
}

async function runBenchmark() {
  console.log('🏃 Starting Comprehensive Benchmark Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 Testing movement types:');
  console.log('   1. Shoulder flexion (0-180°)');
  console.log('   2. Shoulder abduction (0-180°)');
  console.log('   3. Elbow flexion (0-150°)');
  console.log('   4. Knee flexion (0-135°)\n');

  console.log('🎯 Success criteria:');
  console.log('   - Mean Absolute Error (MAE): ±5°');
  console.log('   - Average FPS: >30');
  console.log('   - Processing time: <33ms/frame\n');

  // Run benchmark test
  const testFile = 'src/testing/__tests__/MacBookVideoTestHarness.test.ts';
  await runJestTest(testFile, {
    TEST_MODE: 'benchmark',
  });
}

async function runWebInterface() {
  console.log('🌐 Starting PhysioAssist Web Interface');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Start webpack dev server
  await startWebServer();

  console.log(`\n✅ Web interface running at: ${WEB_URL}`);
  console.log('   Press Ctrl+C to stop the server.\n');
}

// ============================================================================
// Utilities
// ============================================================================

async function startWebServer() {
  return new Promise((resolve, reject) => {
    const webpack = spawn('npm', ['run', 'web'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..'),
    });

    // Wait for server to start
    setTimeout(() => {
      resolve();
    }, 3000);

    webpack.on('error', (err) => {
      console.error('❌ Failed to start web server:', err);
      reject(err);
    });
  });
}

async function openBrowser(url) {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') {
    command = 'open';
  } else if (platform === 'win32') {
    command = 'start';
  } else {
    command = 'xdg-open';
  }

  return new Promise((resolve) => {
    const browser = spawn(command, [url], {
      stdio: 'ignore',
      shell: true,
    });

    setTimeout(resolve, 1000);
  });
}

async function runJestTest(testFile, env = {}) {
  return new Promise((resolve, reject) => {
    const jest = spawn('npm', ['test', '--', testFile], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        ...env,
      },
    });

    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });

    jest.on('error', (err) => {
      console.error('❌ Failed to run test:', err);
      reject(err);
    });
  });
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('MacBook Test Runner for PhysioAssist');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Usage:');
    console.log('  npm run test:macos:camera                  # Live camera test');
    console.log('  npm run test:macos:video -- <path>        # Video file test');
    console.log('  npm run test:macos:benchmark               # Comprehensive benchmark');
    console.log('  npm run test:macos:web                     # Launch web interface\n');
    console.log('Examples:');
    console.log('  npm run test:macos:camera');
    console.log('  npm run test:macos:video -- ./test-videos/shoulder-flexion.mp4');
    console.log('  npm run test:macos:benchmark\n');
    process.exit(0);
  }

  try {
    switch (command) {
      case 'camera':
        await runCameraTest();
        break;

      case 'video':
        await runVideoTest(args[1]);
        break;

      case 'benchmark':
        await runBenchmark();
        break;

      case 'web':
        await runWebInterface();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run without arguments to see usage.');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

main();
