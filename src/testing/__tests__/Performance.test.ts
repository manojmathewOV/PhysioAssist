/**
 * Performance Benchmark Tests
 * Validates system performance across all gates
 *
 * Targets:
 * - Single frame processing: <50ms
 * - Real-time video (30 FPS): <33ms/frame
 * - Frame cache hit rate: >80%
 * - Memory usage: <100MB for typical sequence
 */

import { SyntheticPoseDataGenerator } from '../SyntheticPoseDataGenerator';
import { MultiFrameSequenceGenerator } from '../MultiFrameSequenceGenerator';
import { AnatomicalFrameCache } from '../../services/biomechanics/AnatomicalFrameCache';
import { AnatomicalReferenceService } from '../../services/biomechanics/AnatomicalReferenceService';
import { ClinicalMeasurementService } from '../../services/biomechanics/ClinicalMeasurementService';
import { CompensationDetectionService } from '../../services/biomechanics/CompensationDetectionService';
import { TemporalConsistencyAnalyzer } from '../../services/biomechanics/TemporalConsistencyAnalyzer';
import { ProcessedPoseData } from '../../types/pose';

describe('Performance Benchmarks', () => {
  let poseGenerator: SyntheticPoseDataGenerator;
  let sequenceGenerator: MultiFrameSequenceGenerator;
  let frameCache: AnatomicalFrameCache;
  let anatomicalService: AnatomicalReferenceService;
  let measurementService: ClinicalMeasurementService;
  let compensationService: CompensationDetectionService;
  let temporalAnalyzer: TemporalConsistencyAnalyzer;

  beforeEach(() => {
    poseGenerator = new SyntheticPoseDataGenerator();
    sequenceGenerator = new MultiFrameSequenceGenerator();
    frameCache = new AnatomicalFrameCache();
    anatomicalService = new AnatomicalReferenceService();
    measurementService = new ClinicalMeasurementService();
    compensationService = new CompensationDetectionService();
    temporalAnalyzer = new TemporalConsistencyAnalyzer();
  });

  describe('Single Frame Performance', () => {
    it('should measure shoulder flexion in <50ms', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(120, 'movenet-17', { side: 'right' });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        measurementService.measureShoulderFlexion(enrichedPose, 'right');
      }

      const endTime = Date.now();
      const avgDuration = (endTime - startTime) / iterations;

      console.log(`Shoulder flexion measurement: ${avgDuration.toFixed(2)}ms/frame`);
      expect(avgDuration).toBeLessThan(50);
    });

    it('should measure elbow flexion in <50ms', () => {
      const { poseData } = poseGenerator.generateElbowFlexion(120, 'movenet-17', { side: 'right' });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        measurementService.measureElbowFlexion(enrichedPose, 'right');
      }

      const endTime = Date.now();
      const avgDuration = (endTime - startTime) / iterations;

      console.log(`Elbow flexion measurement: ${avgDuration.toFixed(2)}ms/frame`);
      expect(avgDuration).toBeLessThan(50);
    });

    it('should measure knee flexion in <50ms', () => {
      const { poseData } = poseGenerator.generateKneeFlexion(90, 'movenet-17', { side: 'right' });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        measurementService.measureKneeFlexion(enrichedPose, 'right');
      }

      const endTime = Date.now();
      const avgDuration = (endTime - startTime) / iterations;

      console.log(`Knee flexion measurement: ${avgDuration.toFixed(2)}ms/frame`);
      expect(avgDuration).toBeLessThan(50);
    });
  });

  describe('Frame Cache Performance', () => {
    it('should achieve >80% cache hit rate for repeated measurements', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(90, 'movenet-17', { side: 'right' });

      const cache = new AnatomicalFrameCache();

      // Process same frame 10 times
      for (let i = 0; i < 10; i++) {
        addAnatomicalFrames(poseData, cache, anatomicalService);
      }

      const stats = cache.getStats();
      const hitRate = stats.hits / (stats.hits + stats.misses);

      console.log(`Cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
      expect(hitRate).toBeGreaterThan(0.8);
    });

    it('should maintain <1ms cache lookup time', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(90, 'movenet-17', { side: 'right' });
      const cache = new AnatomicalFrameCache();

      // Prime the cache
      addAnatomicalFrames(poseData, cache, anatomicalService);

      // Measure cache lookup
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        cache.get('thorax', poseData.landmarks, (lms) => anatomicalService.calculateThoraxFrame(lms, poseData.schemaId));
      }

      const endTime = Date.now();
      const avgDuration = (endTime - startTime) / iterations;

      console.log(`Cache lookup time: ${avgDuration.toFixed(3)}ms`);
      expect(avgDuration).toBeLessThan(1);
    });

    it('should handle temporal sequence efficiently with cache', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 3, 30, {
        side: 'right',
      }); // 90 frames

      const cache = new AnatomicalFrameCache();
      const startTime = Date.now();

      poseSequence.frames.forEach((frame) => {
        addAnatomicalFrames(frame, cache, anatomicalService);
      });

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const msPerFrame = totalDuration / poseSequence.frames.length;

      const stats = cache.getStats();
      const hitRate = stats.hits / (stats.hits + stats.misses);

      console.log(`Temporal sequence processing: ${msPerFrame.toFixed(2)}ms/frame, cache hit rate: ${(hitRate * 100).toFixed(1)}%`);

      expect(msPerFrame).toBeLessThan(5); // <5ms per frame with cache
      expect(hitRate).toBeGreaterThan(0.5); // >50% hit rate
    });
  });

  describe('Real-Time Processing (30 FPS)', () => {
    it('should process shoulder flexion sequence at >30 FPS', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 2, 30, {
        side: 'right',
      }); // 60 frames

      const startTime = Date.now();
      sequenceGenerator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');
      const endTime = Date.now();

      const totalDuration = endTime - startTime;
      const msPerFrame = totalDuration / poseSequence.frames.length;
      const achievedFPS = 1000 / msPerFrame;

      console.log(`Real-time processing: ${msPerFrame.toFixed(2)}ms/frame (${achievedFPS.toFixed(1)} FPS)`);

      expect(msPerFrame).toBeLessThan(33); // 30 FPS = 33ms/frame
      expect(achievedFPS).toBeGreaterThan(30);
    });

    it('should process elbow flexion sequence at >30 FPS', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing('elbow_flexion', 0, 140, 2, 30, { side: 'right' });

      const startTime = Date.now();
      sequenceGenerator.convertToMeasurementSequence(poseSequence, 'elbow_flexion');
      const endTime = Date.now();

      const totalDuration = endTime - startTime;
      const msPerFrame = totalDuration / poseSequence.frames.length;
      const achievedFPS = 1000 / msPerFrame;

      console.log(`Real-time processing: ${msPerFrame.toFixed(2)}ms/frame (${achievedFPS.toFixed(1)} FPS)`);

      expect(msPerFrame).toBeLessThan(33);
      expect(achievedFPS).toBeGreaterThan(30);
    });
  });

  describe('Temporal Analysis Performance', () => {
    it('should analyze sequence in <100ms', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 3, 30, {
        side: 'right',
      });
      const measurementSequence = sequenceGenerator.convertToMeasurementSequence(poseSequence, 'shoulder_flexion');

      const startTime = Date.now();
      temporalAnalyzer.analyzeSequence(measurementSequence, poseSequence.frames, 'increasing');
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`Temporal analysis: ${duration}ms for 90 frames`);

      expect(duration).toBeLessThan(100);
    });

    it('should calculate smoothness score efficiently', () => {
      const angles = Array.from({ length: 150 }, (_, i) => i); // 0-149 degrees

      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        temporalAnalyzer.calculateSmoothnessScore(angles);
      }

      const endTime = Date.now();
      const avgDuration = (endTime - startTime) / iterations;

      console.log(`Smoothness calculation: ${avgDuration.toFixed(3)}ms`);
      expect(avgDuration).toBeLessThan(1);
    });
  });

  describe('Compensation Detection Performance', () => {
    it('should detect compensations in <10ms', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(120, 'movenet-17', {
        side: 'right',
        trunkLean: 20,
        shoulderHiking: 25,
      });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        compensationService.detectCompensations(enrichedPose, undefined, 'shoulder_flexion');
      }

      const endTime = Date.now();
      const avgDuration = (endTime - startTime) / iterations;

      console.log(`Compensation detection: ${avgDuration.toFixed(2)}ms`);
      expect(avgDuration).toBeLessThan(10);
    });
  });

  describe('Scalability Tests', () => {
    it('should handle long sequences (5 minutes, 9000 frames) efficiently', () => {
      const poseSequence = sequenceGenerator.generateSmoothIncreasing('shoulder_flexion', 0, 150, 300, 30, {
        side: 'right',
      }); // 5 minutes = 9000 frames

      const startTime = Date.now();

      // Process in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < poseSequence.frames.length; i += batchSize) {
        const batch = poseSequence.frames.slice(i, Math.min(i + batchSize, poseSequence.frames.length));
        batch.forEach((frame) => {
          const enriched = addAnatomicalFrames(frame, frameCache, anatomicalService);
          measurementService.measureShoulderFlexion(enriched, 'right');
        });
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const msPerFrame = totalDuration / poseSequence.frames.length;

      console.log(`Long sequence processing: ${totalDuration}ms total, ${msPerFrame.toFixed(2)}ms/frame`);

      expect(msPerFrame).toBeLessThan(50);
    }, 60000); // 60 second timeout

    it('should maintain performance with multiple joint measurements', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(120, 'movenet-17', { side: 'right' });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      const iterations = 50;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        // Measure multiple joints simultaneously
        measurementService.measureShoulderFlexion(enrichedPose, 'right');
        measurementService.measureShoulderAbduction(enrichedPose, 'right');
        measurementService.measureElbowFlexion(enrichedPose, 'right');
      }

      const endTime = Date.now();
      const avgDuration = (endTime - startTime) / iterations;

      console.log(`Multi-joint measurement: ${avgDuration.toFixed(2)}ms for 3 joints`);
      expect(avgDuration).toBeLessThan(150); // 3 joints × 50ms = 150ms
    });
  });

  describe('Performance Regression Detection', () => {
    it('should track performance baseline for shoulder measurements', () => {
      const { poseData } = poseGenerator.generateShoulderFlexion(120, 'movenet-17', { side: 'right' });
      const enrichedPose = addAnatomicalFrames(poseData, frameCache, anatomicalService);

      const iterations = 100;
      const measurements: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        measurementService.measureShoulderFlexion(enrichedPose, 'right');
        const duration = Date.now() - start;
        measurements.push(duration);
      }

      const avgDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
      const maxDuration = Math.max(...measurements);
      const minDuration = Math.min(...measurements);
      const stdDev = Math.sqrt(
        measurements.reduce((sum, d) => sum + (d - avgDuration) ** 2, 0) / measurements.length
      );

      console.log('\nPerformance Baseline (Shoulder Flexion):');
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration}ms`);
      console.log(`  Max: ${maxDuration}ms`);
      console.log(`  Std Dev: ${stdDev.toFixed(2)}ms`);

      // Record baseline for future regression testing
      expect(avgDuration).toBeLessThan(50);
      expect(stdDev).toBeLessThan(10); // Low variance = consistent performance
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle cache eviction without memory leaks', () => {
      const cache = new AnatomicalFrameCache({ maxSize: 50, ttl: 16 }); // Small cache

      // Generate many different poses
      for (let i = 0; i < 200; i++) {
        const angle = i % 180;
        const { poseData } = poseGenerator.generateShoulderFlexion(angle, 'movenet-17', { side: 'right' });
        addAnatomicalFrames(poseData, cache, anatomicalService);
      }

      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0); // Should have evicted some entries
      expect(stats.size).toBeLessThanOrEqual(50); // Should not exceed max size
    });
  });
});

// Helper function
function addAnatomicalFrames(
  poseData: ProcessedPoseData,
  cache: AnatomicalFrameCache,
  anatomicalService: AnatomicalReferenceService
): ProcessedPoseData {
  const landmarks = poseData.landmarks;

  const global = cache.get('global', landmarks, (lms) => anatomicalService.calculateGlobalFrame(lms, poseData.schemaId));
  const thorax = cache.get('thorax', landmarks, (lms) => anatomicalService.calculateThoraxFrame(lms, poseData.schemaId));
  const pelvis = cache.get('pelvis', landmarks, (lms) => anatomicalService.calculatePelvisFrame(lms, poseData.schemaId));
  const left_humerus = cache.get('left_humerus', landmarks, (lms) =>
    anatomicalService.calculateHumerusFrame(lms, 'left', poseData.schemaId)
  );
  const right_humerus = cache.get('right_humerus', landmarks, (lms) =>
    anatomicalService.calculateHumerusFrame(lms, 'right', poseData.schemaId)
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
