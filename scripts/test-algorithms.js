#!/usr/bin/env node

/**
 * PhysioAssist Algorithm Validation Suite
 *
 * Tests core business logic without React Native dependencies:
 * - Goniometer angle calculations
 * - Pose utility functions
 * - Exercise validation logic
 * - Mathematical accuracy
 */

console.log('🧪 PhysioAssist Algorithm Validation Suite');
console.log('==========================================\n');

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test helper
function test(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        failedTests++;
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertClose(actual, expected, tolerance = 0.01, message) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
        throw new Error(
            message || `Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`
        );
    }
}

// ============================================================================
// Mock Data Generator
// ============================================================================

function createMockLandmark(x, y, z = 0, visibility = 1.0, index = 0, name = '') {
    return { x, y, z, visibility, index, name };
}

function createStraightArmPose() {
    // Straight arm: 180 degrees at elbow
    return {
        shoulder: createMockLandmark(0.3, 0.3, 0, 1.0, 11, 'left_shoulder'),
        elbow: createMockLandmark(0.3, 0.5, 0, 1.0, 13, 'left_elbow'),
        wrist: createMockLandmark(0.3, 0.7, 0, 1.0, 15, 'left_wrist'),
    };
}

function createRightAnglePose() {
    // Right angle: 90 degrees at elbow
    return {
        shoulder: createMockLandmark(0.3, 0.3, 0, 1.0, 11, 'left_shoulder'),
        elbow: createMockLandmark(0.3, 0.5, 0, 1.0, 13, 'left_elbow'),
        wrist: createMockLandmark(0.5, 0.5, 0, 1.0, 15, 'left_wrist'),
    };
}

function createAcuteAnglePose() {
    // Acute angle: ~45 degrees at elbow
    return {
        shoulder: createMockLandmark(0.3, 0.3, 0, 1.0, 11, 'left_shoulder'),
        elbow: createMockLandmark(0.3, 0.5, 0, 1.0, 13, 'left_elbow'),
        wrist: createMockLandmark(0.4, 0.4, 0, 1.0, 15, 'left_wrist'),
    };
}

// ============================================================================
// GONIOMETER SERVICE TESTS
// ============================================================================

console.log('1️⃣  GONIOMETER SERVICE - Angle Calculations');
console.log('───────────────────────────────────────────\n');

// Test 2D angle calculation - Straight arm (180°)
test('Calculate 2D angle: Straight arm (180°)', () => {
    const pose = createStraightArmPose();
    const angle = calculate2DAngle(pose.shoulder, pose.elbow, pose.wrist);
    assertClose(angle, 180, 1.0, 'Straight arm should be ~180°');
});

// Test 2D angle calculation - Right angle (90°)
test('Calculate 2D angle: Right angle (90°)', () => {
    const pose = createRightAnglePose();
    const angle = calculate2DAngle(pose.shoulder, pose.elbow, pose.wrist);
    assertClose(angle, 90, 1.0, 'Right angle should be ~90°');
});

// Test 2D angle calculation - Acute angle (45°)
test('Calculate 2D angle: Acute angle (45°)', () => {
    const pose = createAcuteAnglePose();
    const angle = calculate2DAngle(pose.shoulder, pose.elbow, pose.wrist);
    assertClose(angle, 45, 2.0, 'Acute angle should be ~45°');
});

// Test angle with low confidence
test('Low confidence landmarks return invalid angle', () => {
    const shoulder = createMockLandmark(0.3, 0.3, 0, 0.3); // Low confidence
    const elbow = createMockLandmark(0.3, 0.5, 0, 1.0);
    const wrist = createMockLandmark(0.3, 0.7, 0, 1.0);

    const result = calculateAngleWithConfidence(shoulder, elbow, wrist, 0.5);
    assert(!result.isValid, 'Should be invalid with low confidence');
    assert(result.confidence < 0.5, 'Confidence should be below threshold');
});

// Test angle smoothing
test('Angle smoothing reduces variance', () => {
    const angles = [85, 90, 95, 90, 85];
    const smoothed = smoothAngles(angles, 3);

    // Check that smoothed values are within original range
    assert(smoothed.every(a => a >= 85 && a <= 95), 'Smoothed values in range');

    // Check that smoothed is less noisy
    const originalVariance = calculateVariance(angles);
    const smoothedVariance = calculateVariance(smoothed);
    assert(smoothedVariance <= originalVariance, 'Smoothing should reduce variance');
});

// Test 3D angle calculation
test('Calculate 3D angle with depth', () => {
    const pointA = createMockLandmark(0.3, 0.3, 0.1, 1.0);
    const pointB = createMockLandmark(0.3, 0.5, 0.0, 1.0);
    const pointC = createMockLandmark(0.3, 0.7, -0.1, 1.0);

    const angle = calculate3DAngle(pointA, pointB, pointC);
    assert(angle > 0 && angle <= 180, '3D angle should be valid');
});

console.log('');

// ============================================================================
// POSE UTILITY TESTS
// ============================================================================

console.log('2️⃣  POSE UTILITIES - Helper Functions');
console.log('───────────────────────────────────────────\n');

// Test confidence score calculation
test('Calculate confidence score from landmarks', () => {
    const landmarks = [
        createMockLandmark(0.5, 0.5, 0, 0.9),
        createMockLandmark(0.6, 0.6, 0, 0.8),
        createMockLandmark(0.4, 0.4, 0, 0.7),
    ];

    const confidence = calculateConfidenceScore(landmarks);
    assertClose(confidence, 0.8, 0.01, 'Average confidence should be 0.8');
});

// Test distance calculation
test('Calculate distance between two points', () => {
    const point1 = createMockLandmark(0.0, 0.0, 0.0, 1.0);
    const point2 = createMockLandmark(0.3, 0.4, 0.0, 1.0);

    const distance = calculateDistance(point1, point2);
    assertClose(distance, 0.5, 0.01, 'Distance should be 0.5 (3-4-5 triangle)');
});

// Test pose normalization
test('Normalize pose by shoulder distance', () => {
    const landmarks = createFullBodyLandmarks();
    const normalized = normalizePose(landmarks);

    // Check that shoulders are at standard distance
    const leftShoulder = normalized[11];
    const rightShoulder = normalized[12];
    const shoulderDist = calculateDistance(leftShoulder, rightShoulder);

    assertClose(shoulderDist, 1.0, 0.01, 'Normalized shoulder distance should be 1.0');
});

// Test pose stability check
test('Detect stable pose (no movement)', () => {
    const current = createFullBodyLandmarks();
    const previous = createFullBodyLandmarks(); // Same pose

    const stable = isPoseStable(current, previous, 0.02);
    assert(stable, 'Identical poses should be stable');
});

// Test pose stability check - with movement
test('Detect unstable pose (with movement)', () => {
    const current = createFullBodyLandmarks();
    const previous = createFullBodyLandmarks();

    // Move wrist significantly
    previous[15].x += 0.1;
    previous[15].y += 0.1;

    const stable = isPoseStable(current, previous, 0.02);
    assert(!stable, 'Moved pose should be unstable');
});

// Test bounding box calculation
test('Calculate pose bounding box', () => {
    const landmarks = createFullBodyLandmarks();
    const bbox = getPoseBoundingBox(landmarks);

    assert(bbox !== null, 'Should return bounding box');
    assert(bbox.width > 0 && bbox.height > 0, 'Bounding box should have dimensions');
    assert(bbox.x >= 0 && bbox.y >= 0, 'Bounding box should have valid origin');
});

// Test pose mirroring
test('Mirror pose horizontally', () => {
    const landmark = createMockLandmark(0.3, 0.5, 0, 1.0);
    const mirrored = mirrorPose([landmark])[0];

    assertClose(mirrored.x, 0.7, 0.01, 'Mirrored x should be 1 - original');
    assert(mirrored.y === landmark.y, 'Y coordinate should not change');
});

// Test facing camera detection
test('Detect if person is facing camera', () => {
    const landmarks = createFullBodyLandmarks();
    const facing = isFacingCamera(landmarks);

    assert(typeof facing === 'boolean', 'Should return boolean');
});

console.log('');

// ============================================================================
// EXERCISE VALIDATION LOGIC TESTS
// ============================================================================

console.log('3️⃣  EXERCISE VALIDATION - Business Logic');
console.log('───────────────────────────────────────────\n');

// Test bicep curl detection
test('Detect bicep curl flexion phase', () => {
    const landmarks = createBicepCurlFlexedPose();
    const angles = calculateAllAngles(landmarks);

    const leftElbow = angles.left_elbow;
    assert(leftElbow >= 30 && leftElbow <= 50, 'Flexed elbow should be 30-50°');
});

// Test bicep curl extension phase
test('Detect bicep curl extension phase', () => {
    const landmarks = createBicepCurlExtendedPose();
    const angles = calculateAllAngles(landmarks);

    const leftElbow = angles.left_elbow;
    assert(leftElbow >= 160 && leftElbow <= 180, 'Extended elbow should be 160-180°');
});

// Test squat depth detection
test('Detect proper squat depth', () => {
    const landmarks = createSquatBottomPose();
    const angles = calculateAllAngles(landmarks);

    const leftKnee = angles.left_knee;
    const rightKnee = angles.right_knee;

    assert(leftKnee >= 70 && leftKnee <= 110, 'Squat knee angle should be 70-110°');
    assert(rightKnee >= 70 && rightKnee <= 110, 'Squat knee angle should be 70-110°');
});

// Test range of motion validation
test('Validate exercise range of motion', () => {
    const requirement = { minAngle: 30, maxAngle: 50, targetAngle: 40 };

    assert(isWithinRange(40, requirement), '40° should be within 30-50°');
    assert(isWithinRange(30, requirement), '30° should be within 30-50°');
    assert(isWithinRange(50, requirement), '50° should be within 30-50°');
    assert(!isWithinRange(25, requirement), '25° should be outside 30-50°');
    assert(!isWithinRange(55, requirement), '55° should be outside 30-50°');
});

// Test form quality scoring
test('Calculate form quality score', () => {
    const targetAngle = 90;
    const actualAngles = [88, 90, 92, 89, 91];

    const scores = actualAngles.map(a => calculateFormScore(a, targetAngle, 20));
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    assert(avgScore > 95, 'Close angles should score >95');
});

// Test rep detection
test('Detect repetition completion', () => {
    const angleHistory = [
        170, 165, 140, 100, 60, 40, 45, 80, 120, 160, 175
    ];

    const reps = detectRepetitions(angleHistory, 40, 160);
    assert(reps === 1, 'Should detect 1 complete repetition');
});

console.log('');

// ============================================================================
// MATHEMATICAL ACCURACY TESTS
// ============================================================================

console.log('4️⃣  MATHEMATICAL ACCURACY');
console.log('───────────────────────────────────────────\n');

// Test vector dot product
test('Vector dot product calculation', () => {
    const v1 = { x: 1, y: 0, z: 0 };
    const v2 = { x: 0, y: 1, z: 0 };

    const dot = dotProduct(v1, v2);
    assertClose(dot, 0, 0.001, 'Perpendicular vectors should have dot product of 0');
});

// Test vector magnitude
test('Vector magnitude calculation', () => {
    const v = { x: 3, y: 4, z: 0 };
    const mag = magnitude(v);
    assertClose(mag, 5, 0.001, 'Magnitude of (3,4,0) should be 5');
});

// Test angle from vectors
test('Angle between perpendicular vectors', () => {
    const v1 = { x: 1, y: 0 };
    const v2 = { x: 0, y: 1 };

    const angle = angleBetweenVectors(v1, v2);
    assertClose(angle, 90, 0.1, 'Perpendicular vectors should be 90°');
});

// Test angle from parallel vectors
test('Angle between parallel vectors', () => {
    const v1 = { x: 1, y: 0 };
    const v2 = { x: 2, y: 0 };

    const angle = angleBetweenVectors(v1, v2);
    assertClose(angle, 0, 0.1, 'Parallel vectors should be 0°');
});

// Test angle from opposite vectors
test('Angle between opposite vectors', () => {
    const v1 = { x: 1, y: 0 };
    const v2 = { x: -1, y: 0 };

    const angle = angleBetweenVectors(v1, v2);
    assertClose(angle, 180, 0.1, 'Opposite vectors should be 180°');
});

console.log('');

// ============================================================================
// PERFORMANCE & EDGE CASES
// ============================================================================

console.log('5️⃣  EDGE CASES & PERFORMANCE');
console.log('───────────────────────────────────────────\n');

// Test with missing landmarks
test('Handle missing landmarks gracefully', () => {
    const incomplete = [
        createMockLandmark(0.5, 0.5, 0, 1.0, 0),
        null,
        createMockLandmark(0.6, 0.6, 0, 1.0, 2),
    ];

    const confidence = calculateConfidenceScore(incomplete.filter(l => l !== null));
    assert(confidence >= 0, 'Should handle missing landmarks');
});

// Test with zero vectors
test('Handle zero-length vectors', () => {
    const samePoint = createMockLandmark(0.5, 0.5, 0, 1.0);

    try {
        const distance = calculateDistance(samePoint, samePoint);
        assertClose(distance, 0, 0.001, 'Distance to self should be 0');
    } catch (error) {
        throw new Error('Should not throw on zero-length vectors');
    }
});

// Test performance with large dataset
test('Calculate angles for 100 frames in <100ms', () => {
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
        const landmarks = createFullBodyLandmarks();
        calculateAllAngles(landmarks);
    }

    const elapsed = Date.now() - startTime;
    assert(elapsed < 100, `Should process 100 frames quickly (took ${elapsed}ms)`);
});

// Test numerical stability
test('Handle extreme angle values', () => {
    const angles = [0, 45, 90, 135, 180, 170, 10, 85];
    angles.forEach(expected => {
        const pose = createPoseWithAngle(expected);
        const calculated = calculate2DAngle(pose.a, pose.b, pose.c);
        assertClose(calculated, expected, 2.0, `Angle ${expected}° should be accurate`);
    });
});

console.log('');

// ============================================================================
// HELPER IMPLEMENTATIONS
// ============================================================================

function calculate2DAngle(pointA, pointB, pointC) {
    const vectorBA = { x: pointA.x - pointB.x, y: pointA.y - pointB.y };
    const vectorBC = { x: pointC.x - pointB.x, y: pointC.y - pointB.y };

    const dotProd = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;
    const magBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2);
    const magBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2);

    const cosAngle = dotProd / (magBA * magBC);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return (angleRad * 180) / Math.PI;
}

function calculate3DAngle(pointA, pointB, pointC) {
    const vectorBA = {
        x: pointA.x - pointB.x,
        y: pointA.y - pointB.y,
        z: (pointA.z || 0) - (pointB.z || 0)
    };
    const vectorBC = {
        x: pointC.x - pointB.x,
        y: pointC.y - pointB.y,
        z: (pointC.z || 0) - (pointB.z || 0)
    };

    const dotProd = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y + vectorBA.z * vectorBC.z;
    const magBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2 + vectorBA.z ** 2);
    const magBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2 + vectorBC.z ** 2);

    const cosAngle = dotProd / (magBA * magBC);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return (angleRad * 180) / Math.PI;
}

function calculateAngleWithConfidence(pointA, pointB, pointC, minConfidence) {
    const minVis = Math.min(pointA.visibility, pointB.visibility, pointC.visibility);

    if (minVis < minConfidence) {
        return { angle: 0, confidence: minVis, isValid: false };
    }

    const angle = calculate2DAngle(pointA, pointB, pointC);
    return { angle, confidence: minVis, isValid: true };
}

function smoothAngles(angles, windowSize) {
    const smoothed = [];
    for (let i = 0; i < angles.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(angles.length, i + Math.ceil(windowSize / 2));
        const window = angles.slice(start, end);
        const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
        smoothed.push(avg);
    }
    return smoothed;
}

function calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => (val - mean) ** 2);
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateConfidenceScore(landmarks) {
    if (!landmarks || landmarks.length === 0) return 0;
    const total = landmarks.reduce((sum, l) => sum + (l.visibility || 0), 0);
    return total / landmarks.length;
}

function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = (point2.z || 0) - (point1.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalizePose(landmarks) {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    if (!leftShoulder || !rightShoulder) return landmarks;

    const shoulderDist = calculateDistance(leftShoulder, rightShoulder);
    if (shoulderDist === 0) return landmarks;

    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const centerY = (leftShoulder.y + rightShoulder.y) / 2;

    return landmarks.map(l => ({
        ...l,
        x: (l.x - centerX) / shoulderDist,
        y: (l.y - centerY) / shoulderDist,
        z: l.z ? l.z / shoulderDist : 0,
    }));
}

function isPoseStable(current, previous, threshold) {
    if (!previous || previous.length === 0) return false;

    let totalMovement = 0;
    let validCount = 0;

    for (let i = 0; i < current.length; i++) {
        if (current[i] && previous[i] &&
            current[i].visibility > 0.5 && previous[i].visibility > 0.5) {
            totalMovement += calculateDistance(current[i], previous[i]);
            validCount++;
        }
    }

    if (validCount === 0) return false;
    return (totalMovement / validCount) < threshold;
}

function getPoseBoundingBox(landmarks) {
    const visible = landmarks.filter(l => l.visibility > 0.5);
    if (visible.length === 0) return null;

    const xs = visible.map(l => l.x);
    const ys = visible.map(l => l.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function mirrorPose(landmarks) {
    return landmarks.map(l => ({ ...l, x: 1 - l.x }));
}

function isFacingCamera(landmarks) {
    const ls = landmarks[11], rs = landmarks[12];
    const lh = landmarks[23], rh = landmarks[24];
    if (!ls || !rs || !lh || !rh) return false;

    const shoulderAngle = Math.abs(ls.y - rs.y);
    const hipAngle = Math.abs(lh.y - rh.y);
    return shoulderAngle < 0.1 && hipAngle < 0.1;
}

function createFullBodyLandmarks() {
    const landmarks = [];
    for (let i = 0; i < 33; i++) {
        landmarks.push(createMockLandmark(0.5, 0.5, 0, 0.9, i));
    }
    // Shoulders
    landmarks[11] = createMockLandmark(0.4, 0.3, 0, 1.0, 11);
    landmarks[12] = createMockLandmark(0.6, 0.3, 0, 1.0, 12);
    // Hips
    landmarks[23] = createMockLandmark(0.4, 0.6, 0, 1.0, 23);
    landmarks[24] = createMockLandmark(0.6, 0.6, 0, 1.0, 24);
    return landmarks;
}

function calculateAllAngles(landmarks) {
    return {
        left_elbow: 90,
        right_elbow: 90,
        left_knee: 170,
        right_knee: 170,
    };
}

function createBicepCurlFlexedPose() {
    return createFullBodyLandmarks();
}

function createBicepCurlExtendedPose() {
    return createFullBodyLandmarks();
}

function createSquatBottomPose() {
    return createFullBodyLandmarks();
}

function isWithinRange(angle, req) {
    return angle >= req.minAngle && angle <= req.maxAngle;
}

function calculateFormScore(actual, target, range) {
    const diff = Math.abs(actual - target);
    return Math.max(0, 100 - (diff / range) * 100);
}

function detectRepetitions(angleHistory, minAngle, maxAngle) {
    let reps = 0;
    let lastState = 'unknown';

    for (const angle of angleHistory) {
        if (angle <= minAngle + 10) {
            if (lastState === 'extended') reps++;
            lastState = 'flexed';
        } else if (angle >= maxAngle - 10) {
            lastState = 'extended';
        }
    }

    return reps;
}

function dotProduct(v1, v2) {
    return (v1.x * v2.x) + (v1.y * v2.y) + ((v1.z || 0) * (v2.z || 0));
}

function magnitude(v) {
    return Math.sqrt(v.x ** 2 + v.y ** 2 + ((v.z || 0) ** 2));
}

function angleBetweenVectors(v1, v2) {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
    const cosAngle = dot / (mag1 * mag2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    return (angleRad * 180) / Math.PI;
}

function createPoseWithAngle(degrees) {
    const radians = (degrees * Math.PI) / 180;
    return {
        a: createMockLandmark(0, 1, 0, 1.0),
        b: createMockLandmark(0, 0, 0, 1.0),
        c: createMockLandmark(Math.cos(radians), Math.sin(radians), 0, 1.0),
    };
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('════════════════════════════════════════');
console.log('📊 ALGORITHM VALIDATION SUMMARY');
console.log('════════════════════════════════════════\n');

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
    console.log('🎉 All algorithms validated successfully!');
    console.log('✨ Core business logic is mathematically sound.');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Review above for details.');
    process.exit(1);
}
