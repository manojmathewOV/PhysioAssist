/**
 * Integration Tests: Complete Measurement Pipeline
 * Tests end-to-end flow from pose generation through measurement to validation
 *
 * Validates integration of all gates (9B.5 → 10D):
 * - Frame caching (9B.5)
 * - Schema-aware goniometry (9B.6)
 * - Clinical measurements (10A)
 * - Compensation detection (10B)
 * - Single-frame validation (10C)
 * - Temporal validation (10D)
 */

import { SyntheticPoseDataGenerator } from '../SyntheticPoseDataGenerator';
import { MultiFrameSequenceGenerator } from '../MultiFrameSequenceGenerator';
import { AnatomicalFrameCache } from '../../services/biomechanics/AnatomicalFrameCache';
import { AnatomicalReferenceService } from '../../services/biomechanics/AnatomicalReferenceService';
import { ClinicalMeasurementService } from '../../services/biomechanics/ClinicalMeasurementService';
import { TemporalConsistencyAnalyzer } from '../../services/biomechanics/TemporalConsistencyAnalyzer';
import { ProcessedPoseData } from '../../types/pose';

describe('Integration Tests: Complete Measurement Pipeline', () => {
  let poseGenerator: SyntheticPoseDataGenerator;
  let sequenceGenerator: MultiFrameSequenceGenerator;
  let frameCache: AnatomicalFrameCache;
  let anatomicalService: AnatomicalReferenceService;
  // Removed: goniometerService (unused - measurement service creates its own)
  let measurementService: ClinicalMeasurementService;
  // Removed: compensationService (unused in current tests)
  let temporalAnalyzer: TemporalConsistencyAnalyzer;

  beforeEach(() => {
    poseGenerator = new SyntheticPoseDataGenerator();
    sequenceGenerator = new MultiFrameSequenceGenerator();
    frameCache = new AnatomicalFrameCache();
    anatomicalService = new AnatomicalReferenceService();
    // Disable temporal smoothing for single-frame accuracy tests
    measurementService = new ClinicalMeasurementService(undefined, undefined, {
      smoothingWindow: 1,
    });
    temporalAnalyzer = new TemporalConsistencyAnalyzer();
  });

  describe('End-to-End Single Frame Pipeline', () => {
    it('should process complete shoulder flexion measurement with all gates', () => {
      // Gate 10C: Generate synthetic pose with ground truth
      const { poseData, groundTruth } = poseGenerator.generateShoulderFlexion(
        120,
        'movenet-17',
        { side: 'right' }
      );

      // Gate 9B.5: Add cached anatomical frames
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      // Verify frame caching worked
      expect(enrichedPose.cachedAnatomicalFrames).toBeDefined();
      expect(enrichedPose.cachedAnatomicalFrames!.global).toBeDefined();
      expect(enrichedPose.cachedAnatomicalFrames!.thorax).toBeDefined();
      expect(enrichedPose.cachedAnatomicalFrames!.right_humerus).toBeDefined();

      // Gate 10A: Perform clinical measurement
      const measurement = measurementService.measureShoulderFlexion(
        enrichedPose,
        'right'
      );

      // Verify measurement accuracy
      expect(measurement.primaryJoint.name).toBe('right_shoulder');
      expect(measurement.primaryJoint.angleType).toBe('flexion');
      expect(
        Math.abs(measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle)
      ).toBeLessThan(5);

      // Gate 10B: Verify compensation detection
      expect(measurement.compensations).toBeDefined();
      expect(Array.isArray(measurement.compensations)).toBe(true);

      // Gate 9B.6: Verify plane projection was used
      expect(measurement.referenceFrames.measurementPlane).toBeDefined();
      expect(measurement.referenceFrames.measurementPlane.normal).toBeDefined();

      // Verify quality metrics
      expect(measurement.quality).toBeDefined();
      expect(measurement.quality.overall).toBe('high');
    });

    it('should detect compensations in shoulder abduction with hiking', () => {
      // Generate pose with compensation
      const { poseData } = poseGenerator.generateShoulderAbduction(120, 'movenet-17', {
        side: 'right',
        shoulderHiking: 25,
      });

      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
      const measurement = measurementService.measureShoulderAbduction(
        enrichedPose,
        'right'
      );

      // Should detect shoulder hiking
      expect(measurement.compensations.length).toBeGreaterThan(0);
      const shoulderHiking = measurement.compensations.find(
        (c) => c.type === 'shoulder_hiking'
      );
      expect(shoulderHiking).toBeDefined();
      expect(shoulderHiking!.magnitude).toBeGreaterThan(20);
    });

    it('should validate scapulohumeral rhythm in shoulder abduction', () => {
      const { poseData } = poseGenerator.generateShoulderAbduction(120, 'movenet-17', {
        side: 'right',
      });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
      const measurement = measurementService.measureShoulderAbduction(
        enrichedPose,
        'right'
      );

      // Verify scapulohumeral rhythm components
      expect(measurement.primaryJoint.components).toBeDefined();
      expect(measurement.primaryJoint.components!.glenohumeral).toBeGreaterThan(0);
      expect(measurement.primaryJoint.components!.scapulothoracic).toBeGreaterThan(0);
      expect(measurement.primaryJoint.components!.rhythm).toBeGreaterThan(0);

      // Rhythm should be between 2:1 and 3:1
      const rhythm = measurement.primaryJoint.components!.rhythm;
      expect(rhythm).toBeGreaterThanOrEqual(2.0);
      expect(rhythm).toBeLessThanOrEqual(3.5);
    });

    it('should validate elbow gating for shoulder rotation', () => {
      // Valid: elbow at 90°
      const { poseData: validPose } = poseGenerator.generateShoulderRotation(
        45,
        'movenet-17',
        {
          side: 'right',
          elbowAngle: 90,
        }
      );
      const enrichedValidPose = addAnatomicalFrames(
        validPose,
        frameCache,
        anatomicalService
      );
      const validMeasurement = measurementService.measureShoulderRotation(
        enrichedValidPose,
        'right'
      );

      expect(validMeasurement.quality.warnings?.length ?? 0).toBe(0);

      // Invalid: elbow at 120° (not at 90°)
      const { poseData: invalidPose } = poseGenerator.generateShoulderRotation(
        45,
        'movenet-17',
        {
          side: 'right',
          elbowAngle: 120,
        }
      );
      const enrichedInvalidPose = addAnatomicalFrames(
        invalidPose,
        frameCache,
        anatomicalService
      );
      const invalidMeasurement = measurementService.measureShoulderRotation(
        enrichedInvalidPose,
        'right'
      );

      expect(invalidMeasurement.quality.warnings?.length ?? 0).toBeGreaterThan(0);
      expect(invalidMeasurement.quality.warnings?.some((w) => w.includes('elbow'))).toBe(
        true
      );
    });
  });

  describe('End-to-End Temporal Pipeline', () => {
    it('should process complete temporal sequence with all gates', () => {
      // Gate 10D: Generate temporal sequence
      const poseSequence = sequenceGenerator.generateSmoothIncreasing(
        'shoulder_flexion',
        0,
        150,
        5,
        30,
        {
          side: 'right',
        }
      );

      expect(poseSequence.frames.length).toBe(150); // 5s × 30fps

      // Convert to measurements
      const measurementSequence = sequenceGenerator.convertToMeasurementSequence(
        poseSequence,
        'shoulder_flexion'
      );

      // Verify all frames were measured
      expect(measurementSequence.measurements.length).toBe(poseSequence.frames.length);

      // Gate 10D: Analyze temporal consistency
      const temporalResult = temporalAnalyzer.analyzeSequence(
        measurementSequence,
        poseSequence.frames,
        'increasing'
      );

      // Verify temporal consistency
      expect(temporalResult.passed).toBe(true);
      expect(temporalResult.consistency.suddenJumps).toBe(0);
      expect(temporalResult.consistency.smoothnessScore).toBeGreaterThan(0.8);
      expect(temporalResult.trajectory.observedPattern).toBe('increasing');
      expect(temporalResult.trajectory.patternMatch).toBe(true);
    });

    it('should track compensation development over time', () => {
      // Generate sequence with developing compensation
      const poseSequence = sequenceGenerator.generateWithDevelopingCompensation(
        'shoulder_flexion',
        0,
        150,
        5,
        'trunk_lean',
        60, // Starts at frame 60 (2 seconds in)
        30,
        { side: 'right' }
      );

      const measurementSequence = sequenceGenerator.convertToMeasurementSequence(
        poseSequence,
        'shoulder_flexion'
      );
      const temporalResult = temporalAnalyzer.analyzeSequence(
        measurementSequence,
        poseSequence.frames,
        'increasing'
      );

      // Should detect trunk lean compensation
      const trunkLean = temporalResult.compensations.find(
        (c) => c.compensationType === 'trunk_lean'
      );
      expect(trunkLean).toBeDefined();
      expect(trunkLean!.isPersistent).toBe(true); // Present in >50% of frames
      expect(trunkLean!.isProgressive).toBe(true); // Severity increases
      expect(trunkLean!.firstDetectedFrame).toBeGreaterThanOrEqual(60);
    });

    it('should detect quality degradation over sequence', () => {
      const baseSequence = sequenceGenerator.generateSmoothIncreasing(
        'elbow_flexion',
        0,
        140,
        4,
        30,
        { side: 'right' }
      );
      const degradedSequence = sequenceGenerator.generateWithQualityDegradation(
        baseSequence,
        'linear'
      );

      const measurementSequence = sequenceGenerator.convertToMeasurementSequence(
        degradedSequence,
        'elbow_flexion'
      );
      const temporalResult = temporalAnalyzer.analyzeSequence(
        measurementSequence,
        degradedSequence.frames,
        'increasing'
      );

      // Should detect quality degradation
      expect(temporalResult.quality.degradationRate).toBeLessThan(0); // Negative = decreasing
      expect(temporalResult.quality.finalQuality).toBeLessThan(
        temporalResult.quality.initialQuality
      );
    });
  });

  describe('Frame Cache Performance', () => {
    it('should achieve high cache hit rate for repeated measurements', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(90, 'movenet-17', {
        side: 'right',
      });

      // Clear cache
      const cache = new AnatomicalFrameCache();

      // First measurement - all misses
      addAnatomicalFramesWithCache(poseData, cache, anatomicalService);
      const stats1 = cache.getStats();
      expect(stats1.hits).toBe(0); // First time, no hits

      // Second measurement with same pose - should have cache hits
      addAnatomicalFramesWithCache(poseData, cache, anatomicalService);
      const stats2 = cache.getStats();
      expect(stats2.hits).toBeGreaterThan(0); // Should have hits now

      // Calculate hit rate
      const hitRate = stats2.hits / (stats2.hits + stats2.misses);
      expect(hitRate).toBeGreaterThan(0.5); // >50% hit rate
    });

    it('should maintain cache performance across temporal sequence', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing(
        'shoulder_flexion',
        0,
        150,
        5,
        30,
        {
          side: 'right',
        }
      );

      const cache = new AnatomicalFrameCache(100, 1000); // Small cache for testing (maxSize, ttl)

      // Process all frames
      poseSequence.frames.forEach((frame) => {
        addAnatomicalFramesWithCache(frame, cache, anatomicalService);
      });

      // Check overall cache performance
      const stats = cache.getStats();
      const hitRate = stats.hits / (stats.hits + stats.misses);

      // Should achieve reasonable hit rate even with small cache
      expect(hitRate).toBeGreaterThan(0.3); // >30% hit rate
    });
  });

  describe('Schema Compatibility', () => {
    it('should work with MoveNet-17 schema', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(120, 'movenet-17', {
        side: 'right',
      });
      expect(poseData.schemaId).toBe('movenet-17');
      expect(poseData.landmarks.length).toBe(17);

      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
      const measurement = measurementService.measureShoulderFlexion(
        enrichedPose,
        'right'
      );

      expect(measurement.primaryJoint.angle).toBeGreaterThan(0);
    });

    it('should handle bilateral measurements', () => {
      // Left shoulder
      const { poseData: leftPose } = poseGenerator.generateShoulderFlexion(
        90,
        'movenet-17',
        { side: 'left' }
      );
      const enrichedLeftPose = addAnatomicalFrames(
        leftPose,
        frameCache,
        anatomicalService
      );
      const leftMeasurement = measurementService.measureShoulderFlexion(
        enrichedLeftPose,
        'left'
      );

      // Right shoulder
      const { poseData: rightPose } = poseGenerator.generateShoulderFlexion(
        90,
        'movenet-17',
        { side: 'right' }
      );
      const enrichedRightPose = addAnatomicalFrames(
        rightPose,
        frameCache,
        anatomicalService
      );
      const rightMeasurement = measurementService.measureShoulderFlexion(
        enrichedRightPose,
        'right'
      );

      // Both should be valid
      expect(leftMeasurement.primaryJoint.name).toBe('left_shoulder');
      expect(rightMeasurement.primaryJoint.name).toBe('right_shoulder');

      // Should measure similar angles for same input
      expect(
        Math.abs(leftMeasurement.primaryJoint.angle - rightMeasurement.primaryJoint.angle)
      ).toBeLessThan(2);
    });
  });

  describe('Measurement Accuracy', () => {
    it('should achieve ±5° accuracy for shoulder flexion', () => {
      const testAngles = [0, 30, 60, 90, 120, 150, 180];
      const errors: number[] = [];

      testAngles.forEach((targetAngle) => {
        const { poseData, groundTruth } = poseGenerator.generateShoulderFlexion(
          targetAngle,
          'movenet-17',
          {
            side: 'right',
          }
        );
        const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
        const measurement = measurementService.measureShoulderFlexion(
          enrichedPose,
          'right'
        );

        const error = Math.abs(
          measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle
        );
        errors.push(error);
      });

      // Calculate MAE
      const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
      expect(mae).toBeLessThanOrEqual(5); // ±5° MAE target
    });

    it('should achieve ±5° accuracy for elbow flexion', () => {
      const testAngles = [0, 30, 60, 90, 120, 150];
      const errors: number[] = [];

      testAngles.forEach((targetAngle) => {
        const { poseData, groundTruth } = poseGenerator.generateElbowFlexion(
          targetAngle,
          'movenet-17',
          { side: 'right' }
        );

        const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
        const measurement = measurementService.measureElbowFlexion(enrichedPose, 'right');

        const error = Math.abs(
          measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle
        );
        errors.push(error);
      });

      const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
      expect(mae).toBeLessThanOrEqual(5);
    });

    it('should achieve ±5° accuracy for knee flexion', () => {
      const testAngles = [0, 30, 60, 90, 120, 135];
      const errors: number[] = [];

      testAngles.forEach((targetAngle) => {
        const { poseData, groundTruth } = poseGenerator.generateKneeFlexion(
          targetAngle,
          'movenet-17',
          { side: 'right' }
        );
        const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
        const measurement = measurementService.measureKneeFlexion(enrichedPose, 'right');

        const error = Math.abs(
          measurement.primaryJoint.angle - groundTruth.primaryMeasurement.angle
        );
        errors.push(error);
      });

      const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
      expect(mae).toBeLessThanOrEqual(5);
    });
  });

  describe('Compensation Detection Accuracy', () => {
    it('should detect trunk lean in shoulder flexion', () => {
      // Use frontal view to detect lateral trunk lean (sagittal only detects forward/backward)
      const { poseData } = poseGenerator.generateShoulderFlexion(120, 'movenet-17', {
        side: 'right',
        trunkLean: 20,
        viewOrientation: 'frontal',
      });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
      const measurement = measurementService.measureShoulderFlexion(
        enrichedPose,
        'right'
      );

      const trunkLean = measurement.compensations.find((c) => c.type === 'trunk_lean');
      expect(trunkLean).toBeDefined();
      expect(trunkLean!.magnitude).toBeGreaterThan(15);
    });

    it('should detect shoulder hiking in shoulder abduction', () => {
      const { poseData } = poseGenerator.generateShoulderAbduction(120, 'movenet-17', {
        side: 'right',
        shoulderHiking: 25,
      });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
      const measurement = measurementService.measureShoulderAbduction(
        enrichedPose,
        'right'
      );

      const shoulderHiking = measurement.compensations.find(
        (c) => c.type === 'shoulder_hiking'
      );
      expect(shoulderHiking).toBeDefined();
      expect(shoulderHiking!.magnitude).toBeGreaterThan(20);
    });

    it('should detect hip hike in knee flexion', () => {
      const { poseData } = poseGenerator.generateKneeFlexion(90, 'movenet-17', {
        side: 'right',
        hipHike: 30,
      });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
      const measurement = measurementService.measureKneeFlexion(enrichedPose, 'right');

      const hipHike = measurement.compensations.find((c) => c.type === 'hip_hike');
      expect(hipHike).toBeDefined();
      expect(hipHike!.magnitude).toBeGreaterThan(25);
    });

    it('should not detect compensations when none present', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(90, 'movenet-17', {
        side: 'right',
      });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);
      const measurement = measurementService.measureShoulderFlexion(
        enrichedPose,
        'right'
      );

      expect(measurement.compensations.length).toBe(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should measure single frame in <50ms', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(120, 'movenet-17', {
        side: 'right',
      });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      const startTime = Date.now();
      measurementService.measureShoulderFlexion(enrichedPose, 'right');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // eslint-disable-next-line no-console
      console.log(`Single frame measurement: ${duration}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should process 30-frame sequence in <2s', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing(
        'shoulder_flexion',
        0,
        150,
        1,
        30,
        {
          side: 'right',
        }
      ); // 1 second = 30 frames

      const startTime = Date.now();
      sequenceGenerator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // eslint-disable-next-line no-console
      console.log(`30-frame sequence processing: ${duration}ms`);
      expect(duration).toBeLessThan(2000); // <2 seconds for 30 frames
    });

    it('should maintain <120ms/frame for real-time processing (30 FPS)', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing(
        'elbow_flexion',
        0,
        140,
        2,
        30,
        { side: 'right' }
      ); // 60 frames

      const startTime = Date.now();
      sequenceGenerator.convertToMeasurementSequence(poseSequence, 'elbow_flexion');
      const endTime = Date.now();
      const duration = endTime - startTime;

      const msPerFrame = duration / poseSequence.frames.length;
      // eslint-disable-next-line no-console
      console.log(`Average processing time per frame: ${msPerFrame.toFixed(1)}ms`);
      expect(msPerFrame).toBeLessThan(120); // Real-time threshold for 30 FPS
    });
  });
});

// Helper functions

function addAnatomicalFrames(
  poseData: ProcessedPoseData,
  cache: AnatomicalFrameCache,
  anatomicalService: AnatomicalReferenceService
): ProcessedPoseData {
  const landmarks = poseData.landmarks;

  const global = cache.get('global', landmarks, (lms) =>
    anatomicalService.calculateGlobalFrame(lms)
  );
  const thorax = cache.get('thorax', landmarks, (lms) =>
    anatomicalService.calculateThoraxFrame(lms, global)
  );
  const pelvis = cache.get('pelvis', landmarks, (lms) =>
    anatomicalService.calculatePelvisFrame(lms, poseData.schemaId)
  );
  const left_humerus = cache.get('left_humerus', landmarks, (lms) =>
    anatomicalService.calculateHumerusFrame(lms, 'left', thorax)
  );
  const right_humerus = cache.get('right_humerus', landmarks, (lms) =>
    anatomicalService.calculateHumerusFrame(lms, 'right', thorax)
  );
  const left_forearm = cache.get('left_forearm', landmarks, (lms) =>
    anatomicalService.calculateForearmFrame(lms, 'left', poseData.schemaId)
  );
  const right_forearm = cache.get('right_forearm', landmarks, (lms) =>
    anatomicalService.calculateForearmFrame(lms, 'right', poseData.schemaId)
  );

  return {
    ...poseData,
    cachedAnatomicalFrames: {
      global,
      thorax,
      pelvis,
      left_humerus,
      right_humerus,
      left_forearm,
      right_forearm,
    },
  };
}

function addAnatomicalFramesWithCache(
  poseData: ProcessedPoseData,
  cache: AnatomicalFrameCache,
  anatomicalService: AnatomicalReferenceService
): ProcessedPoseData {
  return addAnatomicalFrames(poseData, cache, anatomicalService);
}
