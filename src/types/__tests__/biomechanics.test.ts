import {
  AnatomicalReferenceFrame,
  AnatomicalPlane,
  ClinicalJointMeasurement,
  CompensationPattern,
  MeasurementQuality,
} from '../biomechanics';
import { Vector3D } from '../pose';

describe('Biomechanics Types', () => {
  describe('AnatomicalReferenceFrame', () => {
    it('should accept valid ISB-compliant reference frame', () => {
      const frame: AnatomicalReferenceFrame = {
        origin: { x: 0, y: 0, z: 0 },
        xAxis: { x: 1, y: 0, z: 0 },
        yAxis: { x: 0, y: 1, z: 0 },
        zAxis: { x: 0, y: 0, z: 1 },
        frameType: 'global',
        confidence: 0.95,
      };

      expect(frame.frameType).toBe('global');
      expect(frame.confidence).toBeGreaterThan(0);
      expect(frame.xAxis.x).toBe(1); // Anterior
      expect(frame.yAxis.y).toBe(1); // Superior
      expect(frame.zAxis.z).toBe(1); // Lateral
    });

    it('should accept all frame types', () => {
      const frameTypes: Array<AnatomicalReferenceFrame['frameType']> = [
        'global',
        'thorax',
        'scapula',
        'humerus',
        'forearm',
      ];

      frameTypes.forEach((frameType) => {
        const frame: AnatomicalReferenceFrame = {
          origin: { x: 0, y: 0, z: 0 },
          xAxis: { x: 1, y: 0, z: 0 },
          yAxis: { x: 0, y: 1, z: 0 },
          zAxis: { x: 0, y: 0, z: 1 },
          frameType,
          confidence: 0.9,
        };

        expect(frame.frameType).toBe(frameType);
      });
    });

    it('should validate confidence is between 0 and 1', () => {
      const frame: AnatomicalReferenceFrame = {
        origin: { x: 0, y: 0, z: 0 },
        xAxis: { x: 1, y: 0, z: 0 },
        yAxis: { x: 0, y: 1, z: 0 },
        zAxis: { x: 0, y: 0, z: 1 },
        frameType: 'thorax',
        confidence: 0.85,
      };

      expect(frame.confidence).toBeGreaterThanOrEqual(0);
      expect(frame.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('AnatomicalPlane', () => {
    it('should accept sagittal plane definition', () => {
      const sagittalPlane: AnatomicalPlane = {
        name: 'sagittal',
        normal: { x: 0, y: 0, z: 1 }, // Normal to lateral axis
        point: { x: 0, y: 0, z: 0 },
        rotation: 0,
      };

      expect(sagittalPlane.name).toBe('sagittal');
      expect(sagittalPlane.normal.z).toBe(1);
    });

    it('should accept scapular plane with rotation', () => {
      const scapularPlane: AnatomicalPlane = {
        name: 'scapular',
        normal: { x: 0.57, y: 0, z: 0.82 }, // ~35° anterior to coronal
        point: { x: 0, y: 0, z: 0 },
        rotation: 35,
      };

      expect(scapularPlane.name).toBe('scapular');
      expect(scapularPlane.rotation).toBe(35);
    });

    it('should accept all anatomical planes', () => {
      const planes: Array<AnatomicalPlane['name']> = [
        'sagittal',
        'coronal',
        'transverse',
        'scapular',
      ];

      planes.forEach((planeName) => {
        const plane: AnatomicalPlane = {
          name: planeName,
          normal: { x: 0, y: 1, z: 0 },
          point: { x: 0, y: 0, z: 0 },
        };

        expect(plane.name).toBe(planeName);
      });
    });
  });

  describe('ClinicalJointMeasurement', () => {
    it('should accept complete shoulder measurement with scapulohumeral components', () => {
      const shoulderMeasurement: ClinicalJointMeasurement = {
        primaryJoint: {
          name: 'left_shoulder',
          type: 'shoulder',
          angle: 120,
          angleType: 'abduction',
          components: {
            glenohumeral: 90,
            scapulothoracic: 30,
            ratio: 3.0, // 90:30 = 3:1
          },
        },
        secondaryJoints: {
          trunk: {
            angle: 5,
            purpose: 'compensation_check',
            deviation: 5,
            warning: 'Minimal trunk lean detected',
          },
          left_elbow: {
            angle: 175,
            purpose: 'validation',
          },
        },
        referenceFrames: {
          global: {
            origin: { x: 0, y: 0, z: 0 },
            xAxis: { x: 1, y: 0, z: 0 },
            yAxis: { x: 0, y: 1, z: 0 },
            zAxis: { x: 0, y: 0, z: 1 },
            frameType: 'global',
            confidence: 0.9,
          },
          local: {
            origin: { x: 0.5, y: 0.6, z: 0 },
            xAxis: { x: 1, y: 0, z: 0 },
            yAxis: { x: 0, y: 1, z: 0 },
            zAxis: { x: 0, y: 0, z: 1 },
            frameType: 'humerus',
            confidence: 0.85,
          },
          measurementPlane: {
            name: 'scapular',
            normal: { x: 0.57, y: 0, z: 0.82 },
            point: { x: 0.5, y: 0.6, z: 0 },
            rotation: 35,
          },
        },
        compensations: [],
        quality: {
          depthReliability: 0.8,
          landmarkVisibility: 0.95,
          frameStability: 0.9,
          overall: 'good',
        },
      };

      expect(shoulderMeasurement.primaryJoint.type).toBe('shoulder');
      expect(shoulderMeasurement.primaryJoint.components?.ratio).toBeCloseTo(3.0, 1);
    });

    it('should accept all joint types', () => {
      const jointTypes: Array<ClinicalJointMeasurement['primaryJoint']['type']> = [
        'shoulder',
        'elbow',
        'knee',
        'hip',
        'ankle',
      ];

      jointTypes.forEach((jointType) => {
        const measurement: ClinicalJointMeasurement = {
          primaryJoint: {
            name: `test_${jointType}`,
            type: jointType,
            angle: 90,
            angleType: 'flexion',
          },
          secondaryJoints: {},
          referenceFrames: {
            global: {
              origin: { x: 0, y: 0, z: 0 },
              xAxis: { x: 1, y: 0, z: 0 },
              yAxis: { x: 0, y: 1, z: 0 },
              zAxis: { x: 0, y: 0, z: 1 },
              frameType: 'global',
              confidence: 0.9,
            },
            local: {
              origin: { x: 0, y: 0, z: 0 },
              xAxis: { x: 1, y: 0, z: 0 },
              yAxis: { x: 0, y: 1, z: 0 },
              zAxis: { x: 0, y: 0, z: 1 },
              frameType: 'global',
              confidence: 0.9,
            },
            measurementPlane: {
              name: 'sagittal',
              normal: { x: 0, y: 0, z: 1 },
              point: { x: 0, y: 0, z: 0 },
            },
          },
          compensations: [],
          quality: {
            depthReliability: 1.0,
            landmarkVisibility: 0.9,
            frameStability: 0.85,
            overall: 'excellent',
          },
        };

        expect(measurement.primaryJoint.type).toBe(jointType);
      });
    });
  });

  describe('CompensationPattern', () => {
    it('should accept trunk lean compensation', () => {
      const compensation: CompensationPattern = {
        type: 'trunk_lean',
        severity: 'moderate',
        magnitude: 15, // degrees
        affectsJoint: 'left_shoulder',
        clinicalNote: 'Patient leans trunk 15° to the left to achieve target ROM',
      };

      expect(compensation.type).toBe('trunk_lean');
      expect(compensation.magnitude).toBe(15);
    });

    it('should accept all compensation types', () => {
      const compensationTypes: Array<CompensationPattern['type']> = [
        'trunk_lean',
        'trunk_rotation',
        'shoulder_hiking',
        'elbow_flexion',
        'hip_hike',
        'contralateral_lean',
      ];

      compensationTypes.forEach((compType) => {
        const compensation: CompensationPattern = {
          type: compType,
          severity: 'mild',
          magnitude: 10,
          affectsJoint: 'test_joint',
          clinicalNote: `Test ${compType} compensation`,
        };

        expect(compensation.type).toBe(compType);
      });
    });

    it('should accept all severity levels', () => {
      const severities: Array<CompensationPattern['severity']> = [
        'minimal',
        'mild',
        'moderate',
        'severe',
      ];

      severities.forEach((severity) => {
        const compensation: CompensationPattern = {
          type: 'trunk_lean',
          severity,
          magnitude: 10,
          affectsJoint: 'shoulder',
          clinicalNote: `Test ${severity} compensation`,
        };

        expect(compensation.severity).toBe(severity);
      });
    });
  });

  describe('MeasurementQuality', () => {
    it('should accept excellent quality metrics', () => {
      const quality: MeasurementQuality = {
        depthReliability: 1.0,
        landmarkVisibility: 0.98,
        frameStability: 0.95,
        overall: 'excellent',
      };

      expect(quality.overall).toBe('excellent');
      expect(quality.depthReliability).toBe(1.0);
    });

    it('should accept poor quality metrics', () => {
      const quality: MeasurementQuality = {
        depthReliability: 0.3,
        landmarkVisibility: 0.5,
        frameStability: 0.4,
        overall: 'poor',
      };

      expect(quality.overall).toBe('poor');
      expect(quality.landmarkVisibility).toBeLessThan(0.6);
    });

    it('should accept all quality levels', () => {
      const qualityLevels: Array<MeasurementQuality['overall']> = [
        'excellent',
        'good',
        'fair',
        'poor',
      ];

      qualityLevels.forEach((level) => {
        const quality: MeasurementQuality = {
          depthReliability: 0.8,
          landmarkVisibility: 0.8,
          frameStability: 0.8,
          overall: level,
        };

        expect(quality.overall).toBe(level);
      });
    });
  });

  describe('Type Compatibility', () => {
    it('should work with Vector3D from pose types', () => {
      const vector: Vector3D = { x: 1, y: 2, z: 3 };
      const frame: AnatomicalReferenceFrame = {
        origin: vector,
        xAxis: { x: 1, y: 0, z: 0 },
        yAxis: { x: 0, y: 1, z: 0 },
        zAxis: { x: 0, y: 0, z: 1 },
        frameType: 'global',
        confidence: 0.9,
      };

      expect(frame.origin).toBe(vector);
      expect(frame.origin.x).toBe(1);
    });

    it('should support nested reference frames in measurements', () => {
      const globalFrame: AnatomicalReferenceFrame = {
        origin: { x: 0, y: 0, z: 0 },
        xAxis: { x: 1, y: 0, z: 0 },
        yAxis: { x: 0, y: 1, z: 0 },
        zAxis: { x: 0, y: 0, z: 1 },
        frameType: 'global',
        confidence: 0.95,
      };

      const localFrame: AnatomicalReferenceFrame = {
        ...globalFrame,
        frameType: 'humerus',
        origin: { x: 0.5, y: 0.6, z: 0.1 },
      };

      expect(localFrame.frameType).toBe('humerus');
      expect(globalFrame.frameType).toBe('global');
    });
  });
});
