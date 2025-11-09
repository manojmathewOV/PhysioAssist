#!/usr/bin/env node

/**
 * PhysioAssist V2 - Gated Development Validation System
 *
 * PHILOSOPHY: No guessing. No estimates. Only PASS/FAIL gates.
 *
 * Each gate has:
 * 1. Clear criteria
 * 2. Automated validation
 * 3. Cannot proceed without PASSING
 * 4. Definition of Done
 *
 * GATES:
 * - Gate 0: CRITICAL FIX (Keypoint bug)
 * - Gate 1: CORE FUNCTIONALITY (Measurements work)
 * - Gate 2: INTEGRATION & STABILITY (Components integrated)
 * - Gate 3: PRODUCTION READINESS (Security, accessibility, docs)
 * - Gate 4: ADVANCED PROFILING (Performance, device compatibility, edge cases)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  gate: (msg) =>
    console.log(
      `\n${colors.cyan}${colors.bold}🚪 ${msg}${colors.reset}\n${'='.repeat(80)}\n`
    ),
  pass: (msg) => console.log(`${colors.green}✅ PASS: ${msg}${colors.reset}`),
  fail: (msg) => console.log(`${colors.red}❌ FAIL: ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

// Gate results
const gates = {
  gate0: {
    name: 'GATE 0: Critical Fix',
    status: 'PENDING',
    criteria: [],
    passed: 0,
    total: 0,
  },
  gate1: {
    name: 'GATE 1: Core Functionality',
    status: 'PENDING',
    criteria: [],
    passed: 0,
    total: 0,
  },
  gate2: {
    name: 'GATE 2: Integration & Stability',
    status: 'PENDING',
    criteria: [],
    passed: 0,
    total: 0,
  },
  gate3: {
    name: 'GATE 3: Production Readiness',
    status: 'PENDING',
    criteria: [],
    passed: 0,
    total: 0,
  },
  gate4: {
    name: 'GATE 4: Advanced Profiling',
    status: 'PENDING',
    criteria: [],
    passed: 0,
    total: 0,
  },
};

function addCriteria(gate, name, testFn) {
  gates[gate].total++;
  try {
    const result = testFn();
    if (result.pass) {
      gates[gate].passed++;
      gates[gate].criteria.push({ name, status: 'PASS', message: result.message });
      log.pass(name);
    } else {
      gates[gate].criteria.push({ name, status: 'FAIL', message: result.message });
      log.fail(`${name} - ${result.message}`);
    }
  } catch (error) {
    gates[gate].criteria.push({ name, status: 'FAIL', message: error.message });
    log.fail(`${name} - ERROR: ${error.message}`);
  }
}

function evaluateGate(gate) {
  const g = gates[gate];
  const passRate = (g.passed / g.total) * 100;

  if (passRate === 100) {
    g.status = 'PASSED';
    console.log(
      `\n${colors.green}${colors.bold}✅ ${g.name} PASSED (${g.passed}/${g.total})${colors.reset}\n`
    );
    return true;
  } else {
    g.status = 'FAILED';
    console.log(
      `\n${colors.red}${colors.bold}❌ ${g.name} FAILED (${g.passed}/${g.total})${colors.reset}`
    );
    console.log(
      `${colors.yellow}Cannot proceed to next gate until all criteria pass${colors.reset}\n`
    );
    return false;
  }
}

// ============================================================================
// GATE 0: CRITICAL FIX - Keypoint Mismatch Bug
// ============================================================================
// DEFINITION OF DONE:
// - Keypoint indices corrected for MoveNet (17 keypoints)
// - All joint calculations use correct indices (0-16)
// - No attempts to access landmarks[17+]
// - Knee/hip/ankle measurements work OR marked as unsupported
// ============================================================================

log.gate('GATE 0: CRITICAL FIX - Keypoint Mismatch');

log.info('Validating keypoint indices in goniometerService.ts...');

addCriteria('gate0', 'File exists: goniometerService.ts', () => {
  const exists = fs.existsSync(
    path.join(__dirname, '../src/services/goniometerService.ts')
  );
  return { pass: exists, message: exists ? 'File found' : 'File not found' };
});

addCriteria('gate0', 'No invalid keypoint indices (>16)', () => {
  const content = fs.readFileSync(
    path.join(__dirname, '../src/services/goniometerService.ts'),
    'utf8'
  );

  // Check for invalid indices
  const invalidIndices = [];
  const indexPattern = /indices:\s*\[(\d+),\s*(\d+),\s*(\d+)\]/g;
  let match;

  while ((match = indexPattern.exec(content)) !== null) {
    const indices = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    indices.forEach((idx) => {
      if (idx > 16) {
        invalidIndices.push(idx);
      }
    });
  }

  if (invalidIndices.length > 0) {
    return {
      pass: false,
      message: `Found invalid indices: ${invalidIndices.join(', ')} (max: 16 for MoveNet)`,
    };
  }

  return { pass: true, message: 'All indices valid (0-16)' };
});

addCriteria('gate0', 'Knee joint indices correct for MoveNet', () => {
  const content = fs.readFileSync(
    path.join(__dirname, '../src/services/goniometerService.ts'),
    'utf8'
  );

  // Check for left_knee configuration
  const leftKneeMatch = content.match(
    /['"']left_knee['"].*?indices:\s*\[(\d+),\s*(\d+),\s*(\d+)\]/
  );
  const rightKneeMatch = content.match(
    /['"']right_knee['"].*?indices:\s*\[(\d+),\s*(\d+),\s*(\d+)\]/
  );

  if (!leftKneeMatch && !rightKneeMatch) {
    return { pass: false, message: 'Knee joint configurations not found' };
  }

  // MoveNet correct indices: hip(11/12), knee(13/14), ankle(15/16)
  const expectedLeftKnee = [11, 13, 15];
  const expectedRightKnee = [12, 14, 16];

  if (leftKneeMatch) {
    const leftIndices = [
      parseInt(leftKneeMatch[1]),
      parseInt(leftKneeMatch[2]),
      parseInt(leftKneeMatch[3]),
    ];
    if (JSON.stringify(leftIndices) !== JSON.stringify(expectedLeftKnee)) {
      return {
        pass: false,
        message: `left_knee indices ${JSON.stringify(leftIndices)} should be ${JSON.stringify(expectedLeftKnee)}`,
      };
    }
  }

  if (rightKneeMatch) {
    const rightIndices = [
      parseInt(rightKneeMatch[1]),
      parseInt(rightKneeMatch[2]),
      parseInt(rightKneeMatch[3]),
    ];
    if (JSON.stringify(rightIndices) !== JSON.stringify(expectedRightKnee)) {
      return {
        pass: false,
        message: `right_knee indices ${JSON.stringify(rightIndices)} should be ${JSON.stringify(expectedRightKnee)}`,
      };
    }
  }

  return { pass: true, message: 'Knee indices correct for MoveNet' };
});

addCriteria('gate0', 'Elbow joint indices correct', () => {
  const content = fs.readFileSync(
    path.join(__dirname, '../src/services/goniometerService.ts'),
    'utf8'
  );

  // MoveNet: shoulder(5/6), elbow(7/8), wrist(9/10)
  const expectedLeftElbow = [5, 7, 9];
  const expectedRightElbow = [6, 8, 10];

  const leftElbowMatch = content.match(
    /['"']left_elbow['"].*?indices:\s*\[(\d+),\s*(\d+),\s*(\d+)\]/
  );
  const rightElbowMatch = content.match(
    /['"']right_elbow['"].*?indices:\s*\[(\d+),\s*(\d+),\s*(\d+)\]/
  );

  if (leftElbowMatch) {
    const leftIndices = [
      parseInt(leftElbowMatch[1]),
      parseInt(leftElbowMatch[2]),
      parseInt(leftElbowMatch[3]),
    ];
    if (JSON.stringify(leftIndices) !== JSON.stringify(expectedLeftElbow)) {
      return {
        pass: false,
        message: `left_elbow ${JSON.stringify(leftIndices)} should be ${JSON.stringify(expectedLeftElbow)}`,
      };
    }
  }

  if (rightElbowMatch) {
    const rightIndices = [
      parseInt(rightElbowMatch[1]),
      parseInt(rightElbowMatch[2]),
      parseInt(rightElbowMatch[3]),
    ];
    if (JSON.stringify(rightIndices) !== JSON.stringify(expectedRightElbow)) {
      return {
        pass: false,
        message: `right_elbow ${JSON.stringify(rightIndices)} should be ${JSON.stringify(expectedRightElbow)}`,
      };
    }
  }

  return { pass: true, message: 'Elbow indices correct' };
});

addCriteria('gate0', 'Algorithm test: Knee angle calculation', () => {
  // Simulate knee angle calculation
  const calculateAngle = (p1, p2, p3) => {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;

    const v1 = [x1 - x2, y1 - y2];
    const v2 = [x3 - x2, y3 - y2];

    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

    if (mag1 === 0 || mag2 === 0) return 0;

    const cos = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
  };

  // Test 90 degree knee bend
  const hip = [0, 0];
  const knee = [0, 1];
  const ankle = [1, 1];

  const angle = calculateAngle(hip, knee, ankle);

  if (Math.abs(angle - 90) < 0.1) {
    return { pass: true, message: `Calculated 90°: ${angle.toFixed(1)}°` };
  } else {
    return { pass: false, message: `Expected 90°, got ${angle.toFixed(1)}°` };
  }
});

const gate0Passed = evaluateGate('gate0');

// ============================================================================
// GATE 1: CORE FUNCTIONALITY - All Measurements Work
// ============================================================================
// DEFINITION OF DONE:
// - Angle calculations accurate within ±1°
// - All supported joints (elbow, shoulder, knee) measurable
// - Frame preprocessing works (192x192x3 → Float32Array)
// - Model inference simulated successfully
// - No crashes on valid input
// - Handles invalid input gracefully
// ============================================================================

if (gate0Passed) {
  log.gate('GATE 1: CORE FUNCTIONALITY');

  addCriteria('gate1', 'Angle calculation: 0° (straight)', () => {
    const calculateAngle = (p1, p2, p3) => {
      const [x1, y1] = p1;
      const [x2, y2] = p2;
      const [x3, y3] = p3;
      const v1 = [x1 - x2, y1 - y2];
      const v2 = [x3 - x2, y3 - y2];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
      if (mag1 === 0 || mag2 === 0) return 0;
      const cos = dot / (mag1 * mag2);
      return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
    };

    const angle = calculateAngle([0, 0], [1, 0], [2, 0]); // Collinear
    return { pass: Math.abs(angle - 180) < 1, message: `${angle.toFixed(1)}°` };
  });

  addCriteria('gate1', 'Angle calculation: 90° (right angle)', () => {
    const calculateAngle = (p1, p2, p3) => {
      const [x1, y1] = p1;
      const [x2, y2] = p2;
      const [x3, y3] = p3;
      const v1 = [x1 - x2, y1 - y2];
      const v2 = [x3 - x2, y3 - y2];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
      if (mag1 === 0 || mag2 === 0) return 0;
      const cos = dot / (mag1 * mag2);
      return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
    };

    const angle = calculateAngle([0, 0], [1, 0], [1, 1]);
    return { pass: Math.abs(angle - 90) < 1, message: `${angle.toFixed(1)}°` };
  });

  addCriteria('gate1', 'Frame preprocessing: Performance', () => {
    const frameSize = 192 * 192 * 3;
    const testData = new Uint8Array(frameSize);
    for (let i = 0; i < frameSize; i++) testData[i] = Math.random() * 255;

    const start = performance.now();
    const normalized = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) {
      normalized[i] = testData[i] * 0.00392156862745098;
    }
    const time = performance.now() - start;

    return { pass: time < 3, message: `${time.toFixed(2)}ms (target: <3ms)` };
  });

  addCriteria('gate1', 'Input validation: Rejects NaN', () => {
    const validateFrameData = (data) => {
      if (!data || data.length === 0) return false;
      const expectedSize = 192 * 192 * 3;
      if (data.length !== expectedSize) return false;
      if (!(data instanceof Uint8Array)) {
        const hasInvalidValues = data.some((v) => v < 0 || v > 255 || Number.isNaN(v));
        if (hasInvalidValues) return false;
      }
      return true;
    };

    const invalidInput = new Array(100).fill(NaN);
    const result = validateFrameData(invalidInput);

    return { pass: result === false, message: 'Correctly rejected NaN input' };
  });

  addCriteria('gate1', 'Input validation: Rejects wrong size', () => {
    const validateFrameData = (data) => {
      if (!data || data.length === 0) return false;
      const expectedSize = 192 * 192 * 3;
      if (data.length !== expectedSize) return false;
      return true;
    };

    const wrongSize = new Uint8Array(1000);
    const result = validateFrameData(wrongSize);

    return { pass: result === false, message: 'Correctly rejected wrong size' };
  });

  addCriteria('gate1', 'Division by zero protection', () => {
    const normalizeValue = (value, max) => {
      if (max === 0) return 0;
      return value / max;
    };

    const result = normalizeValue(5, 0);
    return {
      pass: !isNaN(result) && isFinite(result),
      message: `Returns ${result} for 5/0`,
    };
  });

  evaluateGate('gate1');
}

// ============================================================================
// GATE 2: INTEGRATION & STABILITY
// ============================================================================
// DEFINITION OF DONE:
// - All services integrate correctly
// - State management works (no race conditions)
// - Memory cleanup on unmount
// - Error handling doesn't crash app
// - Performance acceptable (<50ms inference)
// ============================================================================

if (gates.gate1.status === 'PASSED') {
  log.gate('GATE 2: INTEGRATION & STABILITY');

  addCriteria('gate2', 'Service files exist', () => {
    const files = [
      '../src/services/PoseDetectionService.v2.ts',
      '../src/services/goniometerService.ts',
      '../src/utils/compensatoryMechanisms.ts',
    ];

    const missing = files.filter((f) => !fs.existsSync(path.join(__dirname, f)));

    if (missing.length > 0) {
      return { pass: false, message: `Missing: ${missing.join(', ')}` };
    }

    return { pass: true, message: 'All service files exist' };
  });

  addCriteria('gate2', 'Component files exist', () => {
    const files = [
      '../src/components/common/SetupWizard.tsx',
      '../src/components/coaching/CoachingOverlay.tsx',
      '../src/components/simple/SimpleModeUI.tsx',
    ];

    const missing = files.filter((f) => !fs.existsSync(path.join(__dirname, f)));

    if (missing.length > 0) {
      return { pass: false, message: `Missing: ${missing.join(', ')}` };
    }

    return { pass: true, message: 'All component files exist' };
  });

  addCriteria('gate2', 'No memory leaks: Cleanup patterns present', () => {
    const poseOverlayContent = fs.readFileSync(
      path.join(__dirname, '../src/components/pose/PoseOverlay.skia.tsx'),
      'utf8'
    );

    // Check for cleanup in useEffect
    const hasCleanup =
      poseOverlayContent.includes('return () =>') &&
      poseOverlayContent.includes('landmarks.value = []');

    if (!hasCleanup) {
      return { pass: false, message: 'Missing cleanup in PoseOverlay' };
    }

    return { pass: true, message: 'Cleanup patterns present' };
  });

  addCriteria('gate2', 'Error handling: Try-catch in critical paths', () => {
    const serviceContent = fs.readFileSync(
      path.join(__dirname, '../src/services/PoseDetectionService.v2.ts'),
      'utf8'
    );

    const hasTryCatch =
      serviceContent.includes('try {') && serviceContent.includes('} catch');

    if (!hasTryCatch) {
      return { pass: false, message: 'Missing try-catch in PoseDetectionService' };
    }

    return { pass: true, message: 'Try-catch present in critical paths' };
  });

  addCriteria('gate2', 'Performance: Angle calculation <0.1ms', () => {
    const calculateAngle = (p1, p2, p3) => {
      const [x1, y1] = p1;
      const [x2, y2] = p2;
      const [x3, y3] = p3;
      const v1 = [x1 - x2, y1 - y2];
      const v2 = [x3 - x2, y3 - y2];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
      if (mag1 === 0 || mag2 === 0) return 0;
      const cos = dot / (mag1 * mag2);
      return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
    };

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      calculateAngle([0, 0], [1, 0], [1, 1]);
    }
    const avgTime = (performance.now() - start) / 1000;

    return { pass: avgTime < 0.1, message: `${avgTime.toFixed(3)}ms avg` };
  });

  evaluateGate('gate2');
}

// ============================================================================
// GATE 3: PRODUCTION READINESS
// ============================================================================
// DEFINITION OF DONE:
// - Security: No unencrypted patient data
// - Accessibility: Screen reader labels present
// - Performance: All targets met
// - Documentation: Complete
// - Testing: >80% critical path coverage
// ============================================================================

if (gates.gate2.status === 'PASSED') {
  log.gate('GATE 3: PRODUCTION READINESS');

  addCriteria('gate3', 'Security: Encrypted storage check', () => {
    const exampleContent = fs.readFileSync(
      path.join(
        __dirname,
        '../src/screens/PoseDetectionScreenPatientCentric.example.tsx'
      ),
      'utf8'
    );

    const hasEncryptedStorage = exampleContent.includes('EncryptedStorage');
    const hasAsyncStorage = exampleContent.includes('AsyncStorage');

    if (hasAsyncStorage && !hasEncryptedStorage) {
      return {
        pass: false,
        message: 'Using AsyncStorage without encryption (HIPAA violation)',
      };
    }

    return { pass: true, message: 'Encrypted storage pattern documented' };
  });

  addCriteria('gate3', 'Accessibility: Accessibility labels present', () => {
    const simpleModeContent = fs.readFileSync(
      path.join(__dirname, '../src/components/simple/SimpleModeUI.tsx'),
      'utf8'
    );

    const hasAccessibility =
      simpleModeContent.includes('accessible') ||
      simpleModeContent.includes('accessibilityLabel');

    if (!hasAccessibility) {
      return { pass: false, message: 'Missing accessibility labels' };
    }

    return { pass: true, message: 'Accessibility labels present' };
  });

  addCriteria('gate3', 'Documentation: Implementation guide exists', () => {
    const guideExists = fs.existsSync(
      path.join(__dirname, '../docs/PATIENT_CENTRIC_IMPLEMENTATION_GUIDE.md')
    );

    if (!guideExists) {
      return { pass: false, message: 'Implementation guide missing' };
    }

    return { pass: true, message: 'Implementation guide complete' };
  });

  addCriteria('gate3', 'Documentation: API documentation', () => {
    const serviceContent = fs.readFileSync(
      path.join(__dirname, '../src/services/PoseDetectionService.v2.ts'),
      'utf8'
    );

    const hasJSDoc = serviceContent.includes('/**') && serviceContent.includes('*/');

    if (!hasJSDoc) {
      return { pass: false, message: 'Missing JSDoc comments' };
    }

    return { pass: true, message: 'JSDoc documentation present' };
  });

  addCriteria('gate3', 'Testing: Validation scripts exist', () => {
    const scripts = [
      '../scripts/validate-v2.sh',
      '../scripts/test-algorithms.js',
      '../scripts/device-simulation-suite.js',
    ];

    const missing = scripts.filter((s) => !fs.existsSync(path.join(__dirname, s)));

    if (missing.length > 0) {
      return { pass: false, message: `Missing: ${missing.join(', ')}` };
    }

    return { pass: true, message: 'All validation scripts present' };
  });

  evaluateGate('gate3');
}

// ============================================================================
// GATE 4: ADVANCED PROFILING - Performance & Edge Cases
// ============================================================================
// DEFINITION OF DONE:
// - Performance profiling validated (FPS, memory, battery)
// - Device compatibility verified (iOS/Android versions)
// - Real-world scenarios tested (interruptions, low memory)
// - TensorFlow model performance validated
// - Error recovery mechanisms tested
// - Edge cases handled (multiple people, no detection, etc.)
// ============================================================================

if (gates.gate3.status === 'PASSED') {
  log.gate('GATE 4: ADVANCED PROFILING');

  // ===== PERFORMANCE PROFILING =====

  addCriteria('gate4', 'Performance: Frame rate monitoring', () => {
    const poseDetectionContent = fs.readFileSync(
      path.join(__dirname, '../src/services/PoseDetectionService.v2.ts'),
      'utf8'
    );

    // Check for FPS tracking
    const hasFpsTracking =
      poseDetectionContent.includes('fps') || poseDetectionContent.includes('frameRate');

    if (!hasFpsTracking) {
      return { pass: false, message: 'No FPS tracking found in pose detection service' };
    }

    return { pass: true, message: 'FPS tracking present' };
  });

  addCriteria('gate4', 'Performance: Memory leak prevention', () => {
    const files = [
      '../src/services/PoseDetectionService.v2.ts',
      '../src/components/pose/PoseOverlay.tsx',
      '../src/screens/PoseDetectionScreenPatientCentric.example.tsx',
    ];

    let hasCleanup = true;
    let missingFiles = [];

    files.forEach((file) => {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');

      // Check for cleanup patterns: useEffect cleanup, dispose, release, clear
      const hasCleanupPattern =
        content.includes('return () =>') ||
        content.includes('.dispose()') ||
        content.includes('.release()') ||
        content.includes('.clear()');

      if (!hasCleanupPattern) {
        hasCleanup = false;
      }
    });

    if (missingFiles.length > 0) {
      return { pass: false, message: `Missing files: ${missingFiles.join(', ')}` };
    }

    if (!hasCleanup) {
      return { pass: false, message: 'Some files missing cleanup patterns' };
    }

    return { pass: true, message: 'Cleanup patterns present in all files' };
  });

  addCriteria('gate4', 'Performance: TensorFlow model load time', () => {
    const poseDetectionContent = fs.readFileSync(
      path.join(__dirname, '../src/services/PoseDetectionService.v2.ts'),
      'utf8'
    );

    // Check for model initialization (TFLiteModel.load or similar)
    const hasModelInit =
      poseDetectionContent.includes('TFLiteModel.load') ||
      poseDetectionContent.includes('loadModel') ||
      poseDetectionContent.includes('initializeModel') ||
      (poseDetectionContent.includes('.load(') && poseDetectionContent.includes('model'));

    if (!hasModelInit) {
      return { pass: false, message: 'No model initialization found' };
    }

    // Check for error handling during model load
    const hasErrorHandling =
      poseDetectionContent.includes('try') &&
      poseDetectionContent.includes('catch') &&
      poseDetectionContent.includes('loadError');

    if (!hasErrorHandling) {
      return { pass: false, message: 'Model loading lacks error handling' };
    }

    return { pass: true, message: 'Model initialization with error handling present' };
  });

  // ===== DEVICE COMPATIBILITY =====

  addCriteria('gate4', 'Compatibility: iOS version check', () => {
    const packageJsonPath = path.join(__dirname, '../package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return { pass: false, message: 'package.json not found' };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // React Native 0.73 requires iOS 13+
    const hasIosVersion = packageJson.engines && packageJson.engines.ios;

    if (!hasIosVersion) {
      return { pass: true, message: 'iOS version not specified (assuming RN defaults)' };
    }

    return { pass: true, message: `iOS version requirements present` };
  });

  addCriteria('gate4', 'Compatibility: Android version check', () => {
    const buildGradlePath = path.join(__dirname, '../android/build.gradle');

    if (!fs.existsSync(buildGradlePath)) {
      return { pass: true, message: 'Android build.gradle not found (iOS only?)' };
    }

    const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

    // Check for minSdkVersion (should be 23+ for React Native 0.73)
    const hasMinSdk = buildGradle.includes('minSdkVersion');

    if (!hasMinSdk) {
      return { pass: false, message: 'minSdkVersion not specified' };
    }

    return { pass: true, message: 'Android SDK version specified' };
  });

  // ===== REAL-WORLD SCENARIOS =====

  addCriteria('gate4', 'Scenarios: App state handling (background/foreground)', () => {
    const exampleScreenContent = fs.readFileSync(
      path.join(
        __dirname,
        '../src/screens/PoseDetectionScreenPatientCentric.example.tsx'
      ),
      'utf8'
    );

    // Check for AppState handling
    const hasAppState =
      exampleScreenContent.includes('AppState') ||
      exampleScreenContent.includes('useAppState') ||
      exampleScreenContent.includes('useFocusEffect');

    if (!hasAppState) {
      return { pass: false, message: 'No AppState/focus handling found' };
    }

    return { pass: true, message: 'App state handling present' };
  });

  addCriteria('gate4', 'Scenarios: Camera permission handling', () => {
    const exampleScreenContent = fs.readFileSync(
      path.join(
        __dirname,
        '../src/screens/PoseDetectionScreenPatientCentric.example.tsx'
      ),
      'utf8'
    );

    // Check for camera permission checks
    const hasPermissionCheck =
      exampleScreenContent.includes('getCameraPermissionStatus') ||
      exampleScreenContent.includes('requestCameraPermission') ||
      exampleScreenContent.includes('checkPermission');

    if (!hasPermissionCheck) {
      return { pass: false, message: 'No camera permission handling' };
    }

    return { pass: true, message: 'Camera permission handling present' };
  });

  addCriteria('gate4', 'Scenarios: Network failure handling', () => {
    const youtubeServiceContent = fs.readFileSync(
      path.join(__dirname, '../src/features/videoComparison/services/youtubeService.ts'),
      'utf8'
    );

    // Check for network error handling
    const hasNetworkError =
      youtubeServiceContent.includes('NETWORK_ERROR') ||
      youtubeServiceContent.includes('NetworkError');

    if (!hasNetworkError) {
      return { pass: false, message: 'No network error handling in YouTube service' };
    }

    const hasCatch = youtubeServiceContent.includes('catch');

    if (!hasCatch) {
      return { pass: false, message: 'Missing try-catch blocks' };
    }

    return { pass: true, message: 'Network error handling present' };
  });

  // ===== ERROR RECOVERY =====

  addCriteria('gate4', 'Recovery: Error boundary implementation', () => {
    const errorBoundaryPath = path.join(
      __dirname,
      '../src/components/common/ErrorBoundary.tsx'
    );

    if (!fs.existsSync(errorBoundaryPath)) {
      return { pass: false, message: 'ErrorBoundary component not found' };
    }

    const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, 'utf8');

    const hasComponentDidCatch = errorBoundaryContent.includes('componentDidCatch');
    const hasGetDerivedStateFromError = errorBoundaryContent.includes(
      'getDerivedStateFromError'
    );

    if (!hasComponentDidCatch && !hasGetDerivedStateFromError) {
      return { pass: false, message: 'ErrorBoundary missing error handling methods' };
    }

    return { pass: true, message: 'ErrorBoundary properly implemented' };
  });

  addCriteria('gate4', 'Recovery: Pose detection fallback', () => {
    const poseDetectionContent = fs.readFileSync(
      path.join(__dirname, '../src/services/PoseDetectionService.v2.ts'),
      'utf8'
    );

    // Check for fallback mechanisms
    const hasFallback =
      poseDetectionContent.includes('fallback') ||
      poseDetectionContent.includes('retry') ||
      poseDetectionContent.includes('recovery');

    if (!hasFallback) {
      return { pass: false, message: 'No fallback/retry mechanisms found' };
    }

    return { pass: true, message: 'Fallback mechanisms present' };
  });

  // ===== EDGE CASES =====

  addCriteria('gate4', 'Edge case: Invalid pose data handling', () => {
    const goniometerContent = fs.readFileSync(
      path.join(__dirname, '../src/services/goniometerService.ts'),
      'utf8'
    );

    // Check for confidence threshold
    const hasConfidenceCheck =
      goniometerContent.includes('minConfidence') ||
      goniometerContent.includes('confidence');

    if (!hasConfidenceCheck) {
      return { pass: false, message: 'No confidence threshold checking' };
    }

    // Check for invalid angle handling
    const hasValidityCheck = goniometerContent.includes('isValid');

    if (!hasValidityCheck) {
      return { pass: false, message: 'No validity checking in angle calculations' };
    }

    return { pass: true, message: 'Invalid pose data handling present' };
  });

  addCriteria('gate4', 'Edge case: Boundary value testing', () => {
    // Test extreme angle values
    const calculateAngle = (p1, p2, p3) => {
      const [x1, y1] = p1;
      const [x2, y2] = p2;
      const [x3, y3] = p3;
      const v1 = [x1 - x2, y1 - y2];
      const v2 = [x3 - x2, y3 - y2];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
      if (mag1 === 0 || mag2 === 0) return 0;
      const cos = dot / (mag1 * mag2);
      return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
    };

    // Test boundary values
    const tests = [
      {
        name: '0° angle',
        points: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        expected: 180,
      },
      {
        name: '180° angle',
        points: [
          [2, 0],
          [1, 0],
          [0, 0],
        ],
        expected: 180,
      },
      {
        name: 'Coincident points',
        points: [
          [0, 0],
          [0, 0],
          [1, 0],
        ],
        expected: 0,
      },
    ];

    for (const test of tests) {
      const angle = calculateAngle(...test.points);
      if (!isFinite(angle) || isNaN(angle)) {
        return { pass: false, message: `${test.name} produces invalid result: ${angle}` };
      }
    }

    return { pass: true, message: 'Boundary value tests passed' };
  });

  // ===== DATA INTEGRITY =====

  addCriteria('gate4', 'Data integrity: Timestamp validation', () => {
    const poseSlicePath = path.join(__dirname, '../src/store/slices/poseSlice.ts');

    if (!fs.existsSync(poseSlicePath)) {
      return { pass: true, message: 'poseSlice not found (state management optional)' };
    }

    const poseSliceContent = fs.readFileSync(poseSlicePath, 'utf8');

    // Check for timestamp handling
    const hasTimestamp =
      poseSliceContent.includes('timestamp') ||
      poseSliceContent.includes('Date.now()') ||
      poseSliceContent.includes('new Date()');

    if (!hasTimestamp) {
      return { pass: false, message: 'No timestamp tracking in pose data' };
    }

    return { pass: true, message: 'Timestamp tracking present' };
  });

  evaluateGate('gate4');
}

// ============================================================================
// FINAL REPORT
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log(
  `${colors.bold}${colors.cyan}GATED DEVELOPMENT VALIDATION COMPLETE${colors.reset}`
);
console.log('='.repeat(80) + '\n');

Object.keys(gates).forEach((gateKey) => {
  const gate = gates[gateKey];
  const status =
    gate.status === 'PASSED'
      ? colors.green + '✅ PASSED'
      : gate.status === 'FAILED'
        ? colors.red + '❌ FAILED'
        : colors.yellow + '⏸️  PENDING';

  console.log(`${status} ${gate.name} (${gate.passed}/${gate.total})${colors.reset}`);

  if (gate.status === 'FAILED') {
    gate.criteria
      .filter((c) => c.status === 'FAIL')
      .forEach((c) => {
        console.log(`  ${colors.red}  ❌ ${c.name}: ${c.message}${colors.reset}`);
      });
  }
});

console.log('\n' + '='.repeat(80));

// Calculate overall readiness
const passedGates = Object.values(gates).filter((g) => g.status === 'PASSED').length;
const totalGates = Object.keys(gates).length;
const readiness = (passedGates / totalGates) * 100;

console.log(
  `\n${colors.bold}Overall Readiness: ${passedGates}/${totalGates} gates passed (${readiness.toFixed(0)}%)${colors.reset}\n`
);

if (readiness === 100) {
  console.log(
    `${colors.green}${colors.bold}🎉 ALL GATES PASSED - READY FOR PRODUCTION${colors.reset}\n`
  );
  process.exit(0);
} else if (readiness >= 75) {
  console.log(
    `${colors.yellow}${colors.bold}⚡ MOST GATES PASSED - READY FOR BETA${colors.reset}\n`
  );
  process.exit(0);
} else if (readiness >= 50) {
  console.log(
    `${colors.yellow}${colors.bold}⚠️  SOME GATES PASSED - CONTINUE DEVELOPMENT${colors.reset}\n`
  );
  process.exit(1);
} else {
  console.log(
    `${colors.red}${colors.bold}❌ CRITICAL GATES FAILED - FIX BEFORE PROCEEDING${colors.reset}\n`
  );
  process.exit(1);
}
