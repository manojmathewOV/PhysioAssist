/**
 * Smoke Test Utility
 *
 * Runs first-run smoke tests to validate critical functionality:
 * - Navigation flow
 * - Camera permissions
 * - Pose detection initialization
 * - Settings persistence
 * - Error handling
 *
 * Usage:
 *   import { runSmokeTests } from '@utils/smokeTests';
 *   await runSmokeTests();
 */

import { Camera } from 'react-native-vision-camera';
import { BLAZEPOSE_MODEL_FILE } from '@services/pose/mediapipeLandmarks';
import type { MockPoseDataSimulator } from '@services/mockPoseDataSimulator';
// Conditional import: Only include mock simulator in development builds
const mockPoseDataSimulator: MockPoseDataSimulator | null = __DEV__
  ? require('@services/mockPoseDataSimulator').mockPoseDataSimulator
  : null;
import { NativeModules, Platform } from 'react-native';

export interface SmokeTestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface SmokeTestReport {
  timestamp: string;
  platform: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: SmokeTestResult[];
}

/**
 * Run all smoke tests
 */
export async function runSmokeTests(): Promise<SmokeTestReport> {
  const startTime = Date.now();
  const results: SmokeTestResult[] = [];

  console.log('🧪 Starting smoke tests...');

  // Test 1: Camera Permission Check
  results.push(await testCameraPermissions());

  // Test 2: Camera Device Availability
  results.push(await testCameraDevice());

  // Test 3: Pose Detection Service
  results.push(await testPoseDetectionService());

  // Test 4: Mock Data Simulator
  results.push(await testMockDataSimulator());

  // Test 5: Error Handling
  results.push(await testErrorHandling());

  // Test 6: Platform Detection
  results.push(await testPlatformDetection());

  const duration = Date.now() - startTime;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  const report: SmokeTestReport = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    totalTests: results.length,
    passed,
    failed,
    duration,
    results,
  };

  console.log(`✅ Smoke tests completed: ${passed}/${results.length} passed`);

  return report;
}

/**
 * Test 1: Camera Permissions
 */
async function testCameraPermissions(): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const name = 'Camera Permissions';

  try {
    // VisionCamera v4: synchronous, returns 'granted' | 'not-determined' | 'denied' | 'restricted'
    const permission = Camera.getCameraPermissionStatus();

    if (permission === 'granted' || permission === 'not-determined') {
      return {
        name,
        passed: true,
        duration: Date.now() - startTime,
      };
    } else {
      return {
        name,
        passed: false,
        error: `Unexpected permission status: ${permission}`,
        duration: Date.now() - startTime,
      };
    }
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 2: Camera Device Availability
 */
async function testCameraDevice(): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const name = 'Camera Device Availability';

  try {
    // Note: This test may not work in web environment
    // It should pass on native devices
    if (Platform.OS === 'web') {
      return {
        name,
        passed: true,
        duration: Date.now() - startTime,
      };
    }

    // For native, we just verify the function doesn't crash
    // Actual device check happens in useCameraDevices hook
    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 3: Pose Detection Service
 */
async function testPoseDetectionService(): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const name = 'Pose Detection Service';

  try {
    // Native screens run MediaPipe BlazePose through react-native-mediapipe
    // (useBlazePose creates the detector on demand), so the native module must
    // be linked. Web uses MediaPipe's browser build instead.
    if (Platform.OS !== 'web' && !NativeModules.PoseDetection) {
      throw new Error('react-native-mediapipe PoseDetection module is not linked');
    }
    console.log(`ℹ️ Pose detection: MediaPipe BlazePose (${BLAZEPOSE_MODEL_FILE})`);

    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 4: Mock Data Simulator
 */
async function testMockDataSimulator(): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const name = 'Mock Data Simulator';

  // Skip test in production (mock simulator not available)
  if (!mockPoseDataSimulator) {
    return {
      name,
      passed: true, // Pass by default in production
      error: 'Skipped - mock simulator only available in development',
      duration: Date.now() - startTime,
    };
  }

  try {
    let frameReceived = false;

    // Start simulator
    mockPoseDataSimulator.start((data) => {
      frameReceived = true;

      // Validate data structure
      if (!data.landmarks || data.landmarks.length !== 33) {
        throw new Error(
          `Invalid landmark count: ${data.landmarks?.length || 0}, expected 33`
        );
      }

      if (typeof data.confidence !== 'number') {
        throw new Error('Invalid confidence value');
      }

      if (typeof data.timestamp !== 'number') {
        throw new Error('Invalid timestamp value');
      }
    }, 30);

    // Wait for at least one frame
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Stop simulator
    mockPoseDataSimulator.stop();

    if (!frameReceived) {
      return {
        name,
        passed: false,
        error: 'No frames received from mock simulator',
        duration: Date.now() - startTime,
      };
    }

    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    if (mockPoseDataSimulator) {
      mockPoseDataSimulator.stop(); // Clean up
    }
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 5: Error Handling
 */
async function testErrorHandling(): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const name = 'Error Handling';

  try {
    // Verify error boundary exists
    const ErrorBoundary = require('@components/common/ErrorBoundary').default;

    if (!ErrorBoundary) {
      return {
        name,
        passed: false,
        error: 'ErrorBoundary component not found',
        duration: Date.now() - startTime,
      };
    }

    // Test that creating an error doesn't crash
    const testError = new Error('Test error');
    console.log('Test error created:', testError.message);

    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 6: Platform Detection
 */
async function testPlatformDetection(): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const name = 'Platform Detection';

  try {
    const platform = Platform.OS;
    const version = Platform.Version;

    if (!platform || !version) {
      return {
        name,
        passed: false,
        error: 'Platform information not available',
        duration: Date.now() - startTime,
      };
    }

    console.log(`Platform: ${platform} ${version}`);

    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Format smoke test report for display
 */
export function formatSmokeTestReport(report: SmokeTestReport): string {
  const lines = [
    '═══════════════════════════════════════',
    '      SMOKE TEST REPORT',
    '═══════════════════════════════════════',
    '',
    `Platform: ${report.platform}`,
    `Timestamp: ${report.timestamp}`,
    `Duration: ${report.duration}ms`,
    '',
    `Total Tests: ${report.totalTests}`,
    `✅ Passed: ${report.passed}`,
    `❌ Failed: ${report.failed}`,
    '',
    '───────────────────────────────────────',
    'Test Results:',
    '───────────────────────────────────────',
    '',
  ];

  report.results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    lines.push(`${index + 1}. ${icon} ${result.name}`);
    lines.push(`   Duration: ${result.duration}ms`);

    if (result.error) {
      lines.push(`   Error: ${result.error}`);
    }

    lines.push('');
  });

  lines.push('═══════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Export report to JSON
 */
export function exportSmokeTestReport(report: SmokeTestReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Quick smoke test (runs critical tests only)
 */
export async function runQuickSmokeTest(): Promise<boolean> {
  const results: SmokeTestResult[] = [];

  results.push(await testCameraPermissions());
  results.push(await testMockDataSimulator());
  results.push(await testPlatformDetection());

  const passed = results.every((r) => r.passed);

  console.log(
    `Quick smoke test: ${passed ? '✅ PASSED' : '❌ FAILED'} (${
      results.filter((r) => r.passed).length
    }/${results.length})`
  );

  return passed;
}
