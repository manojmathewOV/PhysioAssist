/**
 * Multi-Frame Sequence Generator
 * Gate 10D: Generates temporal pose sequences for validation
 *
 * Creates realistic video sequences with controlled temporal characteristics
 */

import { ProcessedPoseData } from '../types/pose';
import { TemporalPoseSequence, TemporalMeasurementSequence } from '../types/temporalValidation';
import { SyntheticPoseDataGenerator } from './SyntheticPoseDataGenerator';
import { ClinicalMeasurementService } from '../services/biomechanics/ClinicalMeasurementService';
import { AnatomicalReferenceService } from '../services/biomechanics/AnatomicalReferenceService';
import { AnatomicalFrameCache } from '../services/biomechanics/AnatomicalFrameCache';

export class MultiFrameSequenceGenerator {
  private poseGenerator: SyntheticPoseDataGenerator;
  private measurementService: ClinicalMeasurementService;
  private anatomicalService: AnatomicalReferenceService;
  private frameCache: AnatomicalFrameCache;

  constructor() {
    this.poseGenerator = new SyntheticPoseDataGenerator();
    this.measurementService = new ClinicalMeasurementService();
    this.anatomicalService = new AnatomicalReferenceService();
    this.frameCache = new AnatomicalFrameCache();
  }

  /**
   * Generate smooth increasing sequence (e.g., shoulder flexion 0° → 150°)
   */
  public generateSmoothIncreasing(
    movement: 'shoulder_flexion' | 'shoulder_abduction' | 'elbow_flexion' | 'knee_flexion',
    startAngle: number,
    endAngle: number,
    duration: number, // seconds
    frameRate: number = 30,
    options: {
      side?: 'left' | 'right';
      addNoise?: boolean; // Add small random variations (±1°)
    } = {}
  ): TemporalPoseSequence {
    const side = options.side || 'right';
    const totalFrames = Math.floor(duration * frameRate);
    const angleIncrement = (endAngle - startAngle) / (totalFrames - 1);

    const frames: ProcessedPoseData[] = [];

    for (let i = 0; i < totalFrames; i++) {
      let angle = startAngle + angleIncrement * i;

      // Add small noise if requested (±1°)
      if (options.addNoise) {
        angle += (Math.random() - 0.5) * 2;
      }

      // Generate pose at this angle
      let poseData: ProcessedPoseData;
      if (movement === 'shoulder_flexion') {
        ({ poseData } = this.poseGenerator.generateShoulderFlexion(angle, 'movenet-17', { side }));
      } else if (movement === 'shoulder_abduction') {
        ({ poseData } = this.poseGenerator.generateShoulderAbduction(angle, 'movenet-17', { side }));
      } else if (movement === 'elbow_flexion') {
        ({ poseData } = this.poseGenerator.generateElbowFlexion(angle, 'movenet-17', { side }));
      } else {
        ({ poseData } = this.poseGenerator.generateKneeFlexion(angle, 'movenet-17', { side }));
      }

      // Add quality score (high quality for smooth sequence)
      poseData.qualityScore = 0.95;

      frames.push(poseData);
    }

    return {
      frames,
      frameRate,
      duration,
      sequenceId: `smooth_increasing_${movement}_${startAngle}_to_${endAngle}`,
      metadata: {
        movement,
        side,
        expectedTrajectory: 'increasing',
        description: `Smooth ${movement} from ${startAngle}° to ${endAngle}° over ${duration}s`,
      },
    };
  }

  /**
   * Generate smooth decreasing sequence (e.g., elbow extension 150° → 0°)
   */
  public generateSmoothDecreasing(
    movement: 'shoulder_flexion' | 'shoulder_abduction' | 'elbow_flexion' | 'knee_flexion',
    startAngle: number,
    endAngle: number,
    duration: number,
    frameRate: number = 30,
    options: { side?: 'left' | 'right'; addNoise?: boolean } = {}
  ): TemporalPoseSequence {
    // Use increasing generator but reverse the angles
    const increasingSeq = this.generateSmoothIncreasing(movement, endAngle, startAngle, duration, frameRate, options);

    // Reverse the frames
    const reversedFrames = [...increasingSeq.frames].reverse();

    return {
      frames: reversedFrames,
      frameRate,
      duration,
      sequenceId: `smooth_decreasing_${movement}_${startAngle}_to_${endAngle}`,
      metadata: {
        movement,
        side: options.side || 'right',
        expectedTrajectory: 'decreasing',
        description: `Smooth ${movement} from ${startAngle}° to ${endAngle}° over ${duration}s`,
      },
    };
  }

  /**
   * Generate static hold sequence (e.g., shoulder flexion at 90° for 3 seconds)
   */
  public generateStaticHold(
    movement: 'shoulder_flexion' | 'shoulder_abduction' | 'elbow_flexion' | 'knee_flexion',
    angle: number,
    duration: number,
    frameRate: number = 30,
    options: {
      side?: 'left' | 'right';
      addTremor?: boolean; // Add small oscillations (±2°)
    } = {}
  ): TemporalPoseSequence {
    const side = options.side || 'right';
    const totalFrames = Math.floor(duration * frameRate);
    const frames: ProcessedPoseData[] = [];

    for (let i = 0; i < totalFrames; i++) {
      let currentAngle = angle;

      // Add tremor if requested (small oscillation)
      if (options.addTremor) {
        const oscillation = Math.sin((i / frameRate) * 2 * Math.PI) * 2; // 2° amplitude, 1 Hz frequency
        currentAngle += oscillation;
      }

      let poseData: ProcessedPoseData;
      if (movement === 'shoulder_flexion') {
        ({ poseData } = this.poseGenerator.generateShoulderFlexion(currentAngle, 'movenet-17', { side }));
      } else if (movement === 'shoulder_abduction') {
        ({ poseData } = this.poseGenerator.generateShoulderAbduction(currentAngle, 'movenet-17', { side }));
      } else if (movement === 'elbow_flexion') {
        ({ poseData } = this.poseGenerator.generateElbowFlexion(currentAngle, 'movenet-17', { side }));
      } else {
        ({ poseData } = this.poseGenerator.generateKneeFlexion(currentAngle, 'movenet-17', { side }));
      }

      poseData.qualityScore = 0.95;
      frames.push(poseData);
    }

    return {
      frames,
      frameRate,
      duration,
      sequenceId: `static_hold_${movement}_${angle}deg`,
      metadata: {
        movement,
        side,
        expectedTrajectory: 'static',
        description: `Static hold ${movement} at ${angle}° for ${duration}s`,
      },
    };
  }

  /**
   * Generate oscillating sequence (e.g., elbow reps 0° ↔ 120° × 3 reps)
   */
  public generateOscillating(
    movement: 'shoulder_flexion' | 'shoulder_abduction' | 'elbow_flexion' | 'knee_flexion',
    minAngle: number,
    maxAngle: number,
    repetitions: number,
    duration: number, // Total duration in seconds
    frameRate: number = 30,
    options: { side?: 'left' | 'right' } = {}
  ): TemporalPoseSequence {
    const side = options.side || 'right';
    const totalFrames = Math.floor(duration * frameRate);
    const framesPerCycle = totalFrames / repetitions;
    const framesPerHalfCycle = framesPerCycle / 2;

    const frames: ProcessedPoseData[] = [];

    for (let i = 0; i < totalFrames; i++) {
      // Determine position in current cycle
      const cyclePosition = i % framesPerCycle;

      let angle: number;
      if (cyclePosition < framesPerHalfCycle) {
        // Increasing phase
        const progress = cyclePosition / framesPerHalfCycle;
        angle = minAngle + (maxAngle - minAngle) * progress;
      } else {
        // Decreasing phase
        const progress = (cyclePosition - framesPerHalfCycle) / framesPerHalfCycle;
        angle = maxAngle - (maxAngle - minAngle) * progress;
      }

      let poseData: ProcessedPoseData;
      if (movement === 'shoulder_flexion') {
        ({ poseData } = this.poseGenerator.generateShoulderFlexion(angle, 'movenet-17', { side }));
      } else if (movement === 'shoulder_abduction') {
        ({ poseData } = this.poseGenerator.generateShoulderAbduction(angle, 'movenet-17', { side }));
      } else if (movement === 'elbow_flexion') {
        ({ poseData } = this.poseGenerator.generateElbowFlexion(angle, 'movenet-17', { side }));
      } else {
        ({ poseData } = this.poseGenerator.generateKneeFlexion(angle, 'movenet-17', { side }));
      }

      poseData.qualityScore = 0.95;
      frames.push(poseData);
    }

    return {
      frames,
      frameRate,
      duration,
      sequenceId: `oscillating_${movement}_${minAngle}_to_${maxAngle}_${repetitions}reps`,
      metadata: {
        movement,
        side,
        expectedTrajectory: 'oscillating',
        description: `Oscillating ${movement} between ${minAngle}° and ${maxAngle}° for ${repetitions} repetitions`,
      },
    };
  }

  /**
   * Generate sequence with sudden jumps (measurement artifacts)
   */
  public generateWithSuddenJumps(
    movement: 'shoulder_flexion' | 'shoulder_abduction' | 'elbow_flexion' | 'knee_flexion',
    baseSequence: TemporalPoseSequence,
    jumpMagnitude: number, // Degrees
    jumpFrames: number[] // Frame indices where jumps occur
  ): TemporalPoseSequence {
    const frames = [...baseSequence.frames];

    // Insert jumps at specified frames
    jumpFrames.forEach((frameIndex) => {
      if (frameIndex < frames.length) {
        const originalFrame = frames[frameIndex];
        const side = baseSequence.metadata?.side || 'right';

        // Extract current angle (approximate from position)
        // For simplicity, we'll add jumpMagnitude to the angle
        // In reality, we'd measure the current angle and add the jump

        let modifiedPoseData: ProcessedPoseData;
        // This is a simplified approach - in real scenario would extract angle first
        if (movement === 'shoulder_flexion') {
          ({ poseData: modifiedPoseData } = this.poseGenerator.generateShoulderFlexion(90 + jumpMagnitude, 'movenet-17', { side }));
        } else if (movement === 'shoulder_abduction') {
          ({ poseData: modifiedPoseData } = this.poseGenerator.generateShoulderAbduction(90 + jumpMagnitude, 'movenet-17', { side }));
        } else if (movement === 'elbow_flexion') {
          ({ poseData: modifiedPoseData } = this.poseGenerator.generateElbowFlexion(90 + jumpMagnitude, 'movenet-17', { side }));
        } else {
          ({ poseData: modifiedPoseData } = this.poseGenerator.generateKneeFlexion(90 + jumpMagnitude, 'movenet-17', { side }));
        }

        frames[frameIndex] = modifiedPoseData;
      }
    });

    return {
      ...baseSequence,
      frames,
      sequenceId: `${baseSequence.sequenceId}_with_jumps`,
      metadata: {
        ...baseSequence.metadata,
        description: `${baseSequence.metadata?.description} with ${jumpFrames.length} sudden jumps`,
      },
    };
  }

  /**
   * Generate sequence with quality degradation
   */
  public generateWithQualityDegradation(
    baseSequence: TemporalPoseSequence,
    degradationPattern: 'linear' | 'sudden' | 'intermittent'
  ): TemporalPoseSequence {
    const frames = baseSequence.frames.map((frame, index) => {
      let quality = 0.95; // Start with high quality

      if (degradationPattern === 'linear') {
        // Gradual quality decrease
        quality = 0.95 - (index / frames.length) * 0.3; // 0.95 → 0.65
      } else if (degradationPattern === 'sudden') {
        // Sudden drop at midpoint
        quality = index < frames.length / 2 ? 0.95 : 0.55;
      } else if (degradationPattern === 'intermittent') {
        // Random drops
        quality = Math.random() < 0.2 ? 0.6 : 0.95; // 20% chance of low quality
      }

      return {
        ...frame,
        qualityScore: quality,
      };
    });

    return {
      ...baseSequence,
      frames,
      sequenceId: `${baseSequence.sequenceId}_${degradationPattern}_quality`,
      metadata: {
        ...baseSequence.metadata,
        description: `${baseSequence.metadata?.description} with ${degradationPattern} quality degradation`,
      },
    };
  }

  /**
   * Generate sequence with developing compensation
   */
  public generateWithDevelopingCompensation(
    movement: 'shoulder_flexion' | 'shoulder_abduction' | 'elbow_flexion' | 'knee_flexion',
    startAngle: number,
    endAngle: number,
    duration: number,
    compensationType: 'trunk_lean' | 'shoulder_hiking' | 'hip_hike',
    compensationStartFrame: number, // Frame where compensation begins
    frameRate: number = 30,
    options: { side?: 'left' | 'right' } = {}
  ): TemporalPoseSequence {
    const side = options.side || 'right';
    const totalFrames = Math.floor(duration * frameRate);
    const angleIncrement = (endAngle - startAngle) / (totalFrames - 1);

    const frames: ProcessedPoseData[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const angle = startAngle + angleIncrement * i;

      // Calculate compensation magnitude (progressively increases after start frame)
      let compensationMagnitude = 0;
      if (i >= compensationStartFrame) {
        const framesIntoCompensation = i - compensationStartFrame;
        const maxCompensation = 20; // Maximum 20° compensation
        compensationMagnitude = Math.min(maxCompensation, (framesIntoCompensation / 30) * maxCompensation); // Ramps up over 1 second
      }

      // Generate pose with compensation
      let poseData: ProcessedPoseData;
      if (movement === 'shoulder_flexion') {
        const options: any = { side };
        if (compensationType === 'trunk_lean') options.trunkLean = compensationMagnitude;
        if (compensationType === 'shoulder_hiking') options.shoulderHiking = compensationMagnitude;
        ({ poseData } = this.poseGenerator.generateShoulderFlexion(angle, 'movenet-17', options));
      } else if (movement === 'shoulder_abduction') {
        const options: any = { side };
        if (compensationType === 'trunk_lean') options.trunkLean = compensationMagnitude;
        if (compensationType === 'shoulder_hiking') options.shoulderHiking = compensationMagnitude;
        ({ poseData } = this.poseGenerator.generateShoulderAbduction(angle, 'movenet-17', options));
      } else if (movement === 'elbow_flexion') {
        const options: any = { side };
        if (compensationType === 'trunk_lean') options.trunkLean = compensationMagnitude;
        ({ poseData } = this.poseGenerator.generateElbowFlexion(angle, 'movenet-17', options));
      } else {
        const options: any = { side };
        if (compensationType === 'hip_hike') options.hipHike = compensationMagnitude;
        ({ poseData } = this.poseGenerator.generateKneeFlexion(angle, 'movenet-17', options));
      }

      poseData.qualityScore = 0.95;
      frames.push(poseData);
    }

    return {
      frames,
      frameRate,
      duration,
      sequenceId: `developing_compensation_${movement}_${compensationType}`,
      metadata: {
        movement,
        side,
        expectedTrajectory: 'increasing',
        description: `${movement} with developing ${compensationType} starting at frame ${compensationStartFrame}`,
      },
    };
  }

  /**
   * Convert pose sequence to measurement sequence
   */
  public convertToMeasurementSequence(
    poseSequence: TemporalPoseSequence,
    movementType: 'shoulder_flexion' | 'shoulder_abduction' | 'elbow_flexion' | 'knee_flexion'
  ): TemporalMeasurementSequence {
    const side = poseSequence.metadata?.side || 'right';
    const measurements = [];
    const timestamps = [];

    for (let i = 0; i < poseSequence.frames.length; i++) {
      const frame = poseSequence.frames[i];

      // Add anatomical frames
      const enrichedFrame = this.addAnatomicalFrames(frame);

      // Measure joint angle
      let measurement;
      if (movementType === 'shoulder_flexion') {
        measurement = this.measurementService.measureShoulderFlexion(enrichedFrame, side);
      } else if (movementType === 'shoulder_abduction') {
        measurement = this.measurementService.measureShoulderAbduction(enrichedFrame, side);
      } else if (movementType === 'elbow_flexion') {
        measurement = this.measurementService.measureElbowFlexion(enrichedFrame, side);
      } else {
        measurement = this.measurementService.measureKneeFlexion(enrichedFrame, side);
      }

      measurements.push(measurement);
      timestamps.push(i * (1000 / poseSequence.frameRate)); // Milliseconds
    }

    return {
      measurements,
      timestamps,
      frameRate: poseSequence.frameRate,
      duration: poseSequence.duration,
      sequenceId: poseSequence.sequenceId,
    };
  }

  /**
   * Add anatomical frames to pose data using cache
   */
  private addAnatomicalFrames(poseData: ProcessedPoseData): ProcessedPoseData {
    const landmarks = poseData.landmarks;

    const global = this.frameCache.get('global', landmarks, (lms) =>
      this.anatomicalService.calculateGlobalFrame(lms)
    );

    const thorax = this.frameCache.get('thorax', landmarks, (lms) =>
      this.anatomicalService.calculateThoraxFrame(lms, global)
    );

    const pelvis = this.frameCache.get('pelvis', landmarks, (lms) =>
      this.anatomicalService.calculatePelvisFrame(lms, poseData.schemaId)
    );

    const left_humerus = this.frameCache.get('left_humerus', landmarks, (lms) =>
      this.anatomicalService.calculateHumerusFrame(lms, 'left', thorax)
    );

    const right_humerus = this.frameCache.get('right_humerus', landmarks, (lms) =>
      this.anatomicalService.calculateHumerusFrame(lms, 'right', thorax)
    );

    const left_forearm = this.frameCache.get('left_forearm', landmarks, (lms) =>
      this.anatomicalService.calculateForearmFrame(lms, 'left', poseData.schemaId)
    );

    const right_forearm = this.frameCache.get('right_forearm', landmarks, (lms) =>
      this.anatomicalService.calculateForearmFrame(lms, 'right', poseData.schemaId)
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
}
