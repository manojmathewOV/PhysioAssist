import {
  midpoint3D,
  subtract3D,
  normalize,
  crossProduct,
  dotProduct,
  magnitude,
  angleBetweenVectors,
  projectVectorOntoPlane,
} from '../vectorMath';
import { Vector3D } from '../../types/common';

describe('Vector Math Utilities', () => {
  describe('midpoint3D', () => {
    it('should calculate midpoint of two points on X axis', () => {
      const p1: Vector3D = { x: 0, y: 0, z: 0 };
      const p2: Vector3D = { x: 10, y: 0, z: 0 };
      const result = midpoint3D(p1, p2);

      expect(result.x).toBeCloseTo(5, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should calculate midpoint in 3D space', () => {
      const p1: Vector3D = { x: 1, y: 2, z: 3 };
      const p2: Vector3D = { x: 5, y: 6, z: 7 };
      const result = midpoint3D(p1, p2);

      expect(result.x).toBeCloseTo(3, 5);
      expect(result.y).toBeCloseTo(4, 5);
      expect(result.z).toBeCloseTo(5, 5);
    });

    it('should handle negative coordinates', () => {
      const p1: Vector3D = { x: -2, y: -4, z: -6 };
      const p2: Vector3D = { x: 2, y: 4, z: 6 };
      const result = midpoint3D(p1, p2);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });
  });

  describe('subtract3D', () => {
    it('should subtract two vectors correctly', () => {
      const v1: Vector3D = { x: 5, y: 7, z: 9 };
      const v2: Vector3D = { x: 2, y: 3, z: 4 };
      const result = subtract3D(v1, v2);

      expect(result.x).toBeCloseTo(3, 5);
      expect(result.y).toBeCloseTo(4, 5);
      expect(result.z).toBeCloseTo(5, 5);
    });

    it('should handle zero result', () => {
      const v1: Vector3D = { x: 1, y: 2, z: 3 };
      const v2: Vector3D = { x: 1, y: 2, z: 3 };
      const result = subtract3D(v1, v2);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should handle negative results', () => {
      const v1: Vector3D = { x: 1, y: 2, z: 3 };
      const v2: Vector3D = { x: 4, y: 6, z: 9 };
      const result = subtract3D(v1, v2);

      expect(result.x).toBeCloseTo(-3, 5);
      expect(result.y).toBeCloseTo(-4, 5);
      expect(result.z).toBeCloseTo(-6, 5);
    });
  });

  describe('normalize', () => {
    it('should normalize vector to unit length', () => {
      const v: Vector3D = { x: 3, y: 4, z: 0 };
      const result = normalize(v);

      expect(result.x).toBeCloseTo(0.6, 5);
      expect(result.y).toBeCloseTo(0.8, 5);
      expect(result.z).toBeCloseTo(0, 5);

      // Check magnitude is 1
      const mag = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2);
      expect(mag).toBeCloseTo(1, 5);
    });

    it('should normalize 3D vector correctly', () => {
      const v: Vector3D = { x: 1, y: 1, z: 1 };
      const result = normalize(v);

      const expectedValue = 1 / Math.sqrt(3);
      expect(result.x).toBeCloseTo(expectedValue, 5);
      expect(result.y).toBeCloseTo(expectedValue, 5);
      expect(result.z).toBeCloseTo(expectedValue, 5);
    });

    it('should handle zero vector gracefully', () => {
      const v: Vector3D = { x: 0, y: 0, z: 0 };
      const result = normalize(v);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it('should preserve direction for already normalized vector', () => {
      const v: Vector3D = { x: 1, y: 0, z: 0 };
      const result = normalize(v);

      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });
  });

  describe('crossProduct', () => {
    it('should calculate cross product of X and Y axes', () => {
      const xAxis: Vector3D = { x: 1, y: 0, z: 0 };
      const yAxis: Vector3D = { x: 0, y: 1, z: 0 };
      const result = crossProduct(xAxis, yAxis);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(1, 5);
    });

    it('should calculate cross product of Y and Z axes', () => {
      const yAxis: Vector3D = { x: 0, y: 1, z: 0 };
      const zAxis: Vector3D = { x: 0, y: 0, z: 1 };
      const result = crossProduct(yAxis, zAxis);

      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should return zero for parallel vectors', () => {
      const v1: Vector3D = { x: 1, y: 2, z: 3 };
      const v2: Vector3D = { x: 2, y: 4, z: 6 }; // Parallel to v1
      const result = crossProduct(v1, v2);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should respect right-hand rule (order matters)', () => {
      const v1: Vector3D = { x: 1, y: 0, z: 0 };
      const v2: Vector3D = { x: 0, y: 1, z: 0 };

      const result1 = crossProduct(v1, v2);
      const result2 = crossProduct(v2, v1);

      // Should be opposite
      expect(result1.z).toBeCloseTo(-result2.z, 5);
    });
  });

  describe('dotProduct', () => {
    it('should calculate dot product of perpendicular vectors', () => {
      const v1: Vector3D = { x: 1, y: 0, z: 0 };
      const v2: Vector3D = { x: 0, y: 1, z: 0 };
      const result = dotProduct(v1, v2);

      expect(result).toBeCloseTo(0, 5);
    });

    it('should calculate dot product of parallel vectors', () => {
      const v1: Vector3D = { x: 2, y: 0, z: 0 };
      const v2: Vector3D = { x: 3, y: 0, z: 0 };
      const result = dotProduct(v1, v2);

      expect(result).toBeCloseTo(6, 5);
    });

    it('should calculate dot product in 3D', () => {
      const v1: Vector3D = { x: 1, y: 2, z: 3 };
      const v2: Vector3D = { x: 4, y: 5, z: 6 };
      const result = dotProduct(v1, v2);

      // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
      expect(result).toBeCloseTo(32, 5);
    });

    it('should be commutative', () => {
      const v1: Vector3D = { x: 1, y: 2, z: 3 };
      const v2: Vector3D = { x: 4, y: 5, z: 6 };

      const result1 = dotProduct(v1, v2);
      const result2 = dotProduct(v2, v1);

      expect(result1).toBeCloseTo(result2, 5);
    });
  });

  describe('magnitude', () => {
    it('should calculate magnitude of unit vector', () => {
      const v: Vector3D = { x: 1, y: 0, z: 0 };
      const result = magnitude(v);

      expect(result).toBeCloseTo(1, 5);
    });

    it('should calculate magnitude using Pythagorean theorem', () => {
      const v: Vector3D = { x: 3, y: 4, z: 0 };
      const result = magnitude(v);

      expect(result).toBeCloseTo(5, 5);
    });

    it('should calculate magnitude in 3D', () => {
      const v: Vector3D = { x: 1, y: 2, z: 2 };
      const result = magnitude(v);

      // sqrt(1 + 4 + 4) = sqrt(9) = 3
      expect(result).toBeCloseTo(3, 5);
    });

    it('should return 0 for zero vector', () => {
      const v: Vector3D = { x: 0, y: 0, z: 0 };
      const result = magnitude(v);

      expect(result).toBeCloseTo(0, 5);
    });
  });

  describe('angleBetweenVectors', () => {
    it('should calculate 90 degrees for perpendicular vectors', () => {
      const v1: Vector3D = { x: 1, y: 0, z: 0 };
      const v2: Vector3D = { x: 0, y: 1, z: 0 };
      const result = angleBetweenVectors(v1, v2);

      expect(result).toBeCloseTo(90, 1);
    });

    it('should calculate 0 degrees for parallel vectors', () => {
      const v1: Vector3D = { x: 1, y: 0, z: 0 };
      const v2: Vector3D = { x: 2, y: 0, z: 0 };
      const result = angleBetweenVectors(v1, v2);

      expect(result).toBeCloseTo(0, 1);
    });

    it('should calculate 180 degrees for opposite vectors', () => {
      const v1: Vector3D = { x: 1, y: 0, z: 0 };
      const v2: Vector3D = { x: -1, y: 0, z: 0 };
      const result = angleBetweenVectors(v1, v2);

      expect(result).toBeCloseTo(180, 1);
    });

    it('should calculate 45 degrees correctly', () => {
      const v1: Vector3D = { x: 1, y: 0, z: 0 };
      const v2: Vector3D = { x: 1, y: 1, z: 0 };
      const result = angleBetweenVectors(v1, v2);

      expect(result).toBeCloseTo(45, 1);
    });

    it('should handle zero vector gracefully', () => {
      const v1: Vector3D = { x: 0, y: 0, z: 0 };
      const v2: Vector3D = { x: 1, y: 1, z: 1 };
      const result = angleBetweenVectors(v1, v2);

      expect(result).toBeCloseTo(0, 1);
    });
  });

  describe('projectVectorOntoPlane', () => {
    it('should project vector onto XY plane (remove Z component)', () => {
      const vector: Vector3D = { x: 1, y: 1, z: 1 };
      const planeNormal: Vector3D = { x: 0, y: 0, z: 1 };
      const result = projectVectorOntoPlane(vector, planeNormal);

      // Z component should be removed, result normalized
      expect(result.z).toBeCloseTo(0, 5);
      expect(Math.sqrt(result.x ** 2 + result.y ** 2)).toBeCloseTo(1, 5);
    });

    it('should project vector onto XZ plane (remove Y component)', () => {
      const vector: Vector3D = { x: 1, y: 1, z: 1 };
      const planeNormal: Vector3D = { x: 0, y: 1, z: 0 };
      const result = projectVectorOntoPlane(vector, planeNormal);

      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should project vector onto YZ plane (remove X component)', () => {
      const vector: Vector3D = { x: 1, y: 1, z: 1 };
      const planeNormal: Vector3D = { x: 1, y: 0, z: 0 };
      const result = projectVectorOntoPlane(vector, planeNormal);

      expect(result.x).toBeCloseTo(0, 5);
    });

    it('should return normalized result', () => {
      const vector: Vector3D = { x: 5, y: 5, z: 5 };
      const planeNormal: Vector3D = { x: 0, y: 0, z: 1 };
      const result = projectVectorOntoPlane(vector, planeNormal);

      const mag = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2);
      expect(mag).toBeCloseTo(1, 5);
    });

    it('should project onto scapular plane (35° from coronal)', () => {
      // Scapular plane normal: ~35° anterior to coronal
      const angle = 35 * (Math.PI / 180);
      const planeNormal: Vector3D = {
        x: Math.sin(angle),
        y: 0,
        z: Math.cos(angle),
      };

      const humerusVector: Vector3D = { x: 0.5, y: 0.7, z: 0.3 };
      const result = projectVectorOntoPlane(humerusVector, planeNormal);

      // Result should lie in scapular plane (perpendicular to normal)
      const dotWithNormal = dotProduct(result, planeNormal);
      expect(Math.abs(dotWithNormal)).toBeLessThan(0.01); // Nearly zero
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete midpoint3D in < 1ms', () => {
      const p1: Vector3D = { x: 1, y: 2, z: 3 };
      const p2: Vector3D = { x: 4, y: 5, z: 6 };

      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        midpoint3D(p1, p2);
      }

      const end = performance.now();
      const avgTime = (end - start) / iterations;

      expect(avgTime).toBeLessThan(1); // < 1ms per operation
    });

    it('should complete normalize in < 1ms', () => {
      const v: Vector3D = { x: 3, y: 4, z: 5 };

      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        normalize(v);
      }

      const end = performance.now();
      const avgTime = (end - start) / iterations;

      expect(avgTime).toBeLessThan(1);
    });

    it('should complete angleBetweenVectors in < 1ms', () => {
      const v1: Vector3D = { x: 1, y: 2, z: 3 };
      const v2: Vector3D = { x: 4, y: 5, z: 6 };

      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        angleBetweenVectors(v1, v2);
      }

      const end = performance.now();
      const avgTime = (end - start) / iterations;

      expect(avgTime).toBeLessThan(1);
    });
  });
});
