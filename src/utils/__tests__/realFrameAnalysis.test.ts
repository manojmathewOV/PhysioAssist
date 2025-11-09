/**
 * Unit Tests for Real Frame Analysis
 *
 * Tests ITU-R BT.601 brightness calculation, contrast analysis,
 * shadow detection, and histogram generation.
 *
 * @gate Gate 1 - Remove Camera Mocks
 */

import {
  calculatePixelLuminance,
  analyzeBrightness,
  analyzeContrast,
  detectShadows,
  generateLuminanceHistogram,
  downsamplePixelData,
  assessBrightness,
  assessContrast,
  assessShadows,
  BRIGHTNESS_THRESHOLDS,
  CONTRAST_THRESHOLDS,
  SHADOW_THRESHOLDS,
  PixelData,
} from '../realFrameAnalysis';

describe('realFrameAnalysis', () => {
  // ========================================================================
  // Test Data Helpers
  // ========================================================================

  const createTestPixelData = (
    width: number,
    height: number,
    fillValue: number
  ): PixelData => {
    const pixelCount = width * height;
    const data = new Uint8ClampedArray(pixelCount * 4);

    for (let i = 0; i < pixelCount; i++) {
      data[i * 4] = fillValue; // R
      data[i * 4 + 1] = fillValue; // G
      data[i * 4 + 2] = fillValue; // B
      data[i * 4 + 3] = 255; // A
    }

    return { data, width, height };
  };

  const createGradientPixelData = (width: number, height: number): PixelData => {
    const pixelCount = width * height;
    const data = new Uint8ClampedArray(pixelCount * 4);

    for (let i = 0; i < pixelCount; i++) {
      const gradient = Math.floor((i / pixelCount) * 255);
      data[i * 4] = gradient; // R
      data[i * 4 + 1] = gradient; // G
      data[i * 4 + 2] = gradient; // B
      data[i * 4 + 3] = 255; // A
    }

    return { data, width, height };
  };

  // ========================================================================
  // ITU-R BT.601 Luminance Tests
  // ========================================================================

  describe('calculatePixelLuminance', () => {
    it('should calculate luminance for white pixel (255, 255, 255)', () => {
      const luminance = calculatePixelLuminance(255, 255, 255);
      expect(luminance).toBe(255);
    });

    it('should calculate luminance for black pixel (0, 0, 0)', () => {
      const luminance = calculatePixelLuminance(0, 0, 0);
      expect(luminance).toBe(0);
    });

    it('should calculate luminance for gray pixel (128, 128, 128)', () => {
      const luminance = calculatePixelLuminance(128, 128, 128);
      expect(luminance).toBeCloseTo(128, 2); // Use toBeCloseTo for floating point
    });

    it('should calculate luminance for red pixel (255, 0, 0)', () => {
      const luminance = calculatePixelLuminance(255, 0, 0);
      // Y = 0.299 * 255 = 76.245
      expect(luminance).toBeCloseTo(76.245, 2);
    });

    it('should calculate luminance for green pixel (0, 255, 0)', () => {
      const luminance = calculatePixelLuminance(0, 255, 0);
      // Y = 0.587 * 255 = 149.685
      expect(luminance).toBeCloseTo(149.685, 2);
    });

    it('should calculate luminance for blue pixel (0, 0, 255)', () => {
      const luminance = calculatePixelLuminance(0, 0, 255);
      // Y = 0.114 * 255 = 29.07
      expect(luminance).toBeCloseTo(29.07, 2);
    });

    it('should follow ITU-R BT.601 formula: Y = 0.299R + 0.587G + 0.114B', () => {
      const r = 100,
        g = 150,
        b = 200;
      const expected = 0.299 * r + 0.587 * g + 0.114 * b;
      const luminance = calculatePixelLuminance(r, g, b);
      expect(luminance).toBeCloseTo(expected, 2);
    });
  });

  // ========================================================================
  // Brightness Analysis Tests
  // ========================================================================

  describe('analyzeBrightness', () => {
    it('should return 0.0 for completely black image', () => {
      const pixels = createTestPixelData(100, 100, 0);
      const brightness = analyzeBrightness(pixels);
      expect(brightness).toBe(0.0);
    });

    it('should return 1.0 for completely white image', () => {
      const pixels = createTestPixelData(100, 100, 255);
      const brightness = analyzeBrightness(pixels);
      expect(brightness).toBe(1.0);
    });

    it('should return ~0.5 for medium gray image', () => {
      const pixels = createTestPixelData(100, 100, 128);
      const brightness = analyzeBrightness(pixels);
      expect(brightness).toBeCloseTo(0.5, 1);
    });

    it('should handle gradient images correctly', () => {
      const pixels = createGradientPixelData(100, 100);
      const brightness = analyzeBrightness(pixels);
      // Gradient from 0-255 should average to ~127.5
      expect(brightness).toBeGreaterThan(0.4);
      expect(brightness).toBeLessThan(0.6);
    });
  });

  describe('assessBrightness', () => {
    it('should assess too dark below MIN threshold', () => {
      const assessment = assessBrightness(0.1);
      expect(assessment.status).toBe('too_dark');
      expect(assessment.optimal).toBe(false);
    });

    it('should assess too bright above MAX threshold', () => {
      const assessment = assessBrightness(0.9);
      expect(assessment.status).toBe('too_bright');
      expect(assessment.optimal).toBe(false);
    });

    it('should assess good in acceptable range', () => {
      const assessment = assessBrightness(0.5);
      expect(assessment.status).toBe('good');
    });

    it('should assess optimal in OPTIMAL range', () => {
      const assessment = assessBrightness(0.5); // Between 0.3-0.7
      expect(assessment.status).toBe('good');
      expect(assessment.optimal).toBe(true);
    });
  });

  // ========================================================================
  // Contrast Analysis Tests
  // ========================================================================

  describe('analyzeContrast', () => {
    it('should return 0.0 for uniform image (no contrast)', () => {
      const pixels = createTestPixelData(100, 100, 128);
      const contrast = analyzeContrast(pixels);
      expect(contrast).toBeCloseTo(0.0, 10); // Use toBeCloseTo for floating point precision
    });

    it('should return high contrast for black/white pattern', () => {
      const width = 100,
        height = 100;
      const data = new Uint8ClampedArray(width * height * 4);

      // Checkerboard pattern (black/white)
      for (let i = 0; i < width * height; i++) {
        const value = i % 2 === 0 ? 0 : 255;
        data[i * 4] = value;
        data[i * 4 + 1] = value;
        data[i * 4 + 2] = value;
        data[i * 4 + 3] = 255;
      }

      const pixels = { data, width, height };
      const contrast = analyzeContrast(pixels);

      // High contrast (stddev ~127.5 / 128 ~= 1.0)
      expect(contrast).toBeGreaterThan(0.8);
    });

    it('should return moderate contrast for gradient', () => {
      const pixels = createGradientPixelData(100, 100);
      const contrast = analyzeContrast(pixels);

      // Gradient has moderate contrast
      expect(contrast).toBeGreaterThan(0.3);
      expect(contrast).toBeLessThan(0.8);
    });
  });

  describe('assessContrast', () => {
    it('should assess low contrast', () => {
      const assessment = assessContrast(0.1);
      expect(assessment.status).toBe('low');
    });

    it('should assess high contrast', () => {
      const assessment = assessContrast(0.5);
      expect(assessment.status).toBe('high');
    });

    it('should assess good contrast in optimal range', () => {
      const assessment = assessContrast(0.25);
      expect(assessment.status).toBe('good');
    });
  });

  // ========================================================================
  // Shadow Detection Tests
  // ========================================================================

  describe('detectShadows', () => {
    it('should return 0.0 for uniform image (no shadows)', () => {
      const pixels = createTestPixelData(160, 160, 128);
      const shadowScore = detectShadows(pixels, 8);
      expect(shadowScore).toBe(0.0);
    });

    it('should detect shadows in high-variance image', () => {
      const width = 160,
        height = 160;
      const data = new Uint8ClampedArray(width * height * 4);

      // Create image with bright and dark regions (simulated shadows)
      for (let i = 0; i < width * height; i++) {
        // Left half dark, right half bright
        const x = i % width;
        const value = x < width / 2 ? 50 : 200;

        data[i * 4] = value;
        data[i * 4 + 1] = value;
        data[i * 4 + 2] = value;
        data[i * 4 + 3] = 255;
      }

      const pixels = { data, width, height };
      const shadowScore = detectShadows(pixels, 8);

      // Should detect shadows (variance between grid cells)
      expect(shadowScore).toBeGreaterThan(0.0);
    });
  });

  describe('assessShadows', () => {
    it('should assess no shadows', () => {
      const assessment = assessShadows(0.1);
      expect(assessment.status).toBe('none');
    });

    it('should assess moderate shadows', () => {
      const assessment = assessShadows(0.3);
      expect(assessment.status).toBe('moderate');
    });

    it('should assess harsh shadows', () => {
      const assessment = assessShadows(0.5);
      expect(assessment.status).toBe('harsh');
    });
  });

  // ========================================================================
  // Histogram Tests
  // ========================================================================

  describe('generateLuminanceHistogram', () => {
    it('should create 10 bins', () => {
      const pixels = createTestPixelData(100, 100, 128);
      const histogram = generateLuminanceHistogram(pixels);
      expect(histogram).toHaveLength(10);
    });

    it('should sum to 100% (all pixels accounted for)', () => {
      const pixels = createTestPixelData(100, 100, 128);
      const histogram = generateLuminanceHistogram(pixels);
      const sum = histogram.reduce((total, bin) => total + bin, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('should put all pixels in bin 5 for mid-gray (128)', () => {
      const pixels = createTestPixelData(100, 100, 128);
      const histogram = generateLuminanceHistogram(pixels);

      // Luminance 128 / 255 * 10 = bin 5.0 (floor = 5)
      expect(histogram[5]).toBeCloseTo(100, 0);
      expect(histogram[0]).toBe(0);
      expect(histogram[9]).toBe(0);
    });

    it('should distribute gradient evenly across bins', () => {
      const pixels = createGradientPixelData(1000, 1000);
      const histogram = generateLuminanceHistogram(pixels);

      // Gradient should have roughly equal distribution
      const avgBinSize = 100 / 10; // 10%
      histogram.forEach((binSize) => {
        expect(binSize).toBeGreaterThan(avgBinSize - 3);
        expect(binSize).toBeLessThan(avgBinSize + 3);
      });
    });
  });

  // ========================================================================
  // Downsampling Tests
  // ========================================================================

  describe('downsamplePixelData', () => {
    it('should reduce dimensions by factor', () => {
      const pixels = createTestPixelData(1000, 1000, 128);
      const downsampled = downsamplePixelData(pixels, 10);

      expect(downsampled.width).toBe(100);
      expect(downsampled.height).toBe(100);
      expect(downsampled.data.length).toBe(100 * 100 * 4);
    });

    it('should preserve pixel values during downsampling', () => {
      const pixels = createTestPixelData(100, 100, 200);
      const downsampled = downsamplePixelData(pixels, 2);

      // Check first pixel value
      expect(downsampled.data[0]).toBe(200); // R
      expect(downsampled.data[1]).toBe(200); // G
      expect(downsampled.data[2]).toBe(200); // B
      expect(downsampled.data[3]).toBe(255); // A
    });

    it('should handle non-divisible dimensions gracefully', () => {
      const pixels = createTestPixelData(105, 95, 128);
      const downsampled = downsamplePixelData(pixels, 10);

      expect(downsampled.width).toBe(10); // floor(105/10)
      expect(downsampled.height).toBe(9); // floor(95/10)
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration: Real-world scenarios', () => {
    it('should correctly analyze well-lit scene', () => {
      const pixels = createTestPixelData(640, 480, 180); // Bright, even lighting
      const brightness = analyzeBrightness(pixels);
      const contrast = analyzeContrast(pixels);
      const shadows = detectShadows(pixels);

      expect(brightness).toBeGreaterThan(BRIGHTNESS_THRESHOLDS.OPTIMAL_MIN);
      expect(brightness).toBeLessThan(BRIGHTNESS_THRESHOLDS.OPTIMAL_MAX);
      expect(contrast).toBeCloseTo(0, 10); // Uniform = no contrast (floating point)
      expect(shadows).toBeCloseTo(0, 10); // Uniform = no shadows (floating point)
    });

    it('should correctly analyze low-light scene', () => {
      const pixels = createTestPixelData(640, 480, 40); // Dark
      const brightness = analyzeBrightness(pixels);

      expect(brightness).toBeLessThan(BRIGHTNESS_THRESHOLDS.MIN);
    });

    it('should correctly analyze high-contrast scene with shadows', () => {
      const width = 640,
        height = 480;
      const data = new Uint8ClampedArray(width * height * 4);

      // Simulate harsh lighting: bright center, dark edges
      for (let i = 0; i < width * height; i++) {
        const x = i % width;
        const y = Math.floor(i / width);
        const centerDist = Math.sqrt(
          Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)
        );
        const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
        const value = Math.max(50, 255 - (centerDist / maxDist) * 200);

        data[i * 4] = value;
        data[i * 4 + 1] = value;
        data[i * 4 + 2] = value;
        data[i * 4 + 3] = 255;
      }

      const pixels = { data, width, height };
      const contrast = analyzeContrast(pixels);
      const shadows = detectShadows(pixels);

      expect(contrast).toBeGreaterThan(CONTRAST_THRESHOLDS.LOW);
      expect(shadows).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Threshold Constants Tests
  // ========================================================================

  describe('Threshold Constants', () => {
    it('should have valid BRIGHTNESS_THRESHOLDS', () => {
      expect(BRIGHTNESS_THRESHOLDS.MIN).toBeLessThan(BRIGHTNESS_THRESHOLDS.OPTIMAL_MIN);
      expect(BRIGHTNESS_THRESHOLDS.OPTIMAL_MIN).toBeLessThan(
        BRIGHTNESS_THRESHOLDS.OPTIMAL_MAX
      );
      expect(BRIGHTNESS_THRESHOLDS.OPTIMAL_MAX).toBeLessThan(BRIGHTNESS_THRESHOLDS.MAX);
    });

    it('should have valid CONTRAST_THRESHOLDS', () => {
      expect(CONTRAST_THRESHOLDS.LOW).toBeLessThanOrEqual(CONTRAST_THRESHOLDS.GOOD_MIN);
      expect(CONTRAST_THRESHOLDS.GOOD_MIN).toBeLessThan(CONTRAST_THRESHOLDS.GOOD_MAX);
      expect(CONTRAST_THRESHOLDS.GOOD_MAX).toBeLessThanOrEqual(CONTRAST_THRESHOLDS.HIGH);
    });

    it('should have valid SHADOW_THRESHOLDS', () => {
      expect(SHADOW_THRESHOLDS.MODERATE_MIN).toBeLessThan(SHADOW_THRESHOLDS.MODERATE_MAX);
      expect(SHADOW_THRESHOLDS.MODERATE_MAX).toBeLessThanOrEqual(SHADOW_THRESHOLDS.HARSH);
    });
  });
});
