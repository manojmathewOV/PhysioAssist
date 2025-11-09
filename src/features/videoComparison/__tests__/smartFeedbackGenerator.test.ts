/**
 * SmartFeedbackGenerator Tests
 */

import { SmartFeedbackGenerator } from '../services/smartFeedbackGenerator';
import { ShoulderError } from '../errorDetection/shoulderErrors';
import { KneeError } from '../errorDetection/kneeErrors';
import { ElbowError } from '../errorDetection/elbowErrors';

describe('SmartFeedbackGenerator', () => {
  describe('generate', () => {
    it('should return perfect feedback when no errors', () => {
      const feedback = SmartFeedbackGenerator.generate([], 'intermediate', 'en');

      expect(feedback.errors).toHaveLength(0);
      expect(feedback.overallScore).toBe(100);
      expect(feedback.positiveReinforcement).toBeTruthy();
      expect(feedback.summary).toContain('Perfect');
    });

    it('should prioritize critical errors over warnings', () => {
      const errors: KneeError[] = [
        {
          type: 'knee_valgus',
          severity: 'warning',
          side: 'left',
          value: 6,
          unit: 'percent',
          timestamp: 1000,
        },
        {
          type: 'knee_valgus',
          severity: 'critical',
          side: 'right',
          value: 12,
          unit: 'percent',
          timestamp: 1000,
        },
        {
          type: 'heel_lift',
          severity: 'warning',
          side: 'left',
          value: 1.2,
          unit: 'cm',
          timestamp: 1000,
        },
      ];

      const feedback = SmartFeedbackGenerator.generate(errors, 'intermediate', 'en');

      // Critical knee valgus should be top priority (HIGH INJURY RISK)
      expect(feedback.errors[0].error.type).toBe('knee_valgus');
      expect(feedback.errors[0].error.severity).toBe('critical');
    });

    it('should limit errors based on patient level', () => {
      const errors: ShoulderError[] = [];

      // Create 5 different errors
      for (let i = 0; i < 5; i++) {
        errors.push({
          type: 'shoulder_hiking',
          severity: 'warning',
          side: 'left',
          value: 2.5,
          unit: 'cm',
          timestamp: i * 1000,
        });
      }

      // Beginner should see max 2 errors
      const beginnerFeedback = SmartFeedbackGenerator.generate(errors, 'beginner', 'en');
      expect(beginnerFeedback.errors.length).toBeLessThanOrEqual(2);

      // Intermediate should see max 3 errors
      const intermediateFeedback = SmartFeedbackGenerator.generate(
        errors,
        'intermediate',
        'en'
      );
      expect(intermediateFeedback.errors.length).toBeLessThanOrEqual(3);

      // Advanced should see max 4 errors
      const advancedFeedback = SmartFeedbackGenerator.generate(errors, 'advanced', 'en');
      expect(advancedFeedback.errors.length).toBeLessThanOrEqual(4);
    });

    it('should calculate lower score for more errors', () => {
      const oneError: KneeError[] = [
        {
          type: 'heel_lift',
          severity: 'warning',
          side: 'left',
          value: 1.2,
          unit: 'cm',
          timestamp: 1000,
        },
      ];

      const threeErrors: KneeError[] = [
        {
          type: 'knee_valgus',
          severity: 'critical',
          side: 'left',
          value: 12,
          unit: 'percent',
          timestamp: 1000,
        },
        {
          type: 'heel_lift',
          severity: 'warning',
          side: 'left',
          value: 1.5,
          unit: 'cm',
          timestamp: 1000,
        },
        {
          type: 'insufficient_depth',
          severity: 'warning',
          side: 'left',
          value: 15,
          unit: 'degrees',
          timestamp: 1000,
        },
      ];

      const oneErrorFeedback = SmartFeedbackGenerator.generate(
        oneError,
        'intermediate',
        'en'
      );
      const threeErrorFeedback = SmartFeedbackGenerator.generate(
        threeErrors,
        'intermediate',
        'en'
      );

      expect(threeErrorFeedback.overallScore).toBeLessThan(oneErrorFeedback.overallScore);
    });

    it('should provide localized messages in Spanish', () => {
      const errors: KneeError[] = [
        {
          type: 'knee_valgus',
          severity: 'critical',
          side: 'left',
          value: 12,
          unit: 'percent',
          timestamp: 1000,
        },
      ];

      const feedback = SmartFeedbackGenerator.generate(errors, 'intermediate', 'es');

      expect(feedback.errors[0].message.title).toContain('Valgo');
    });

    it('should group duplicate errors by frequency', () => {
      // Same error detected 5 times
      const errors: ShoulderError[] = [];
      for (let i = 0; i < 5; i++) {
        errors.push({
          type: 'shoulder_hiking',
          severity: 'warning',
          side: 'left',
          value: 2.5,
          unit: 'cm',
          timestamp: i * 1000,
        });
      }

      const feedback = SmartFeedbackGenerator.generate(errors, 'intermediate', 'en');

      // Should group into 1 error with high priority due to frequency
      expect(feedback.errors.length).toBe(1);
      expect(feedback.errors[0].error.type).toBe('shoulder_hiking');
      expect(feedback.errors[0].priority).toBeGreaterThan(0);
    });

    it('should include correction instructions', () => {
      const errors: KneeError[] = [
        {
          type: 'knee_valgus',
          severity: 'critical',
          side: 'left',
          value: 12,
          unit: 'percent',
          timestamp: 1000,
        },
      ];

      const feedback = SmartFeedbackGenerator.generate(errors, 'intermediate', 'en');

      expect(feedback.errors[0].message.correction).toBeTruthy();
      expect(feedback.errors[0].message.correction.length).toBeGreaterThan(10);
    });
  });

  describe('generateLiveFeedback', () => {
    it('should return only the top priority error for live mode', () => {
      const errors: KneeError[] = [
        {
          type: 'knee_valgus',
          severity: 'critical',
          side: 'left',
          value: 12,
          unit: 'percent',
          timestamp: 1000,
        },
        {
          type: 'heel_lift',
          severity: 'warning',
          side: 'left',
          value: 1.5,
          unit: 'cm',
          timestamp: 1000,
        },
        {
          type: 'insufficient_depth',
          severity: 'warning',
          side: 'left',
          value: 15,
          unit: 'degrees',
          timestamp: 1000,
        },
      ];

      const liveFeedback = SmartFeedbackGenerator.generateLiveFeedback(
        errors,
        'intermediate',
        'en'
      );

      expect(liveFeedback).not.toBeNull();
      expect(liveFeedback?.error.type).toBe('knee_valgus'); // Highest priority
      expect(liveFeedback?.error.severity).toBe('critical');
    });

    it('should return null when no errors', () => {
      const liveFeedback = SmartFeedbackGenerator.generateLiveFeedback(
        [],
        'intermediate',
        'en'
      );
      expect(liveFeedback).toBeNull();
    });
  });

  describe('shouldShowFeedback', () => {
    it('should show feedback for critical errors', () => {
      const errors: KneeError[] = [
        {
          type: 'knee_valgus',
          severity: 'critical',
          side: 'left',
          value: 12,
          unit: 'percent',
          timestamp: 1000,
        },
      ];

      const shouldShow = SmartFeedbackGenerator.shouldShowFeedback(errors);
      expect(shouldShow).toBe(true);
    });

    it('should show feedback for frequent warnings', () => {
      // Same warning 5 times (frequent)
      const errors: ShoulderError[] = [];
      for (let i = 0; i < 5; i++) {
        errors.push({
          type: 'shoulder_hiking',
          severity: 'warning',
          side: 'left',
          value: 2.5,
          unit: 'cm',
          timestamp: i * 1000,
        });
      }

      const shouldShow = SmartFeedbackGenerator.shouldShowFeedback(errors);
      expect(shouldShow).toBe(true);
    });

    it('should not show feedback for infrequent warnings', () => {
      // Only 1 warning (not frequent)
      const errors: ShoulderError[] = [
        {
          type: 'shoulder_hiking',
          severity: 'warning',
          side: 'left',
          value: 2.5,
          unit: 'cm',
          timestamp: 1000,
        },
      ];

      const shouldShow = SmartFeedbackGenerator.shouldShowFeedback(errors);
      expect(shouldShow).toBe(false);
    });

    it('should not show feedback when no errors', () => {
      const shouldShow = SmartFeedbackGenerator.shouldShowFeedback([]);
      expect(shouldShow).toBe(false);
    });
  });

  describe('Priority Scoring', () => {
    it('should give highest priority to knee valgus (ACL injury risk)', () => {
      const errors = [
        {
          type: 'knee_valgus' as const,
          severity: 'critical' as const,
          side: 'left' as const,
          value: 12,
          unit: 'percent' as const,
          timestamp: 1000,
        },
        {
          type: 'shoulder_hiking' as const,
          severity: 'critical' as const,
          side: 'left' as const,
          value: 6,
          unit: 'cm' as const,
          timestamp: 1000,
        },
      ];

      const feedback = SmartFeedbackGenerator.generate(errors, 'intermediate', 'en');

      // Knee valgus should be top priority due to injury risk
      expect(feedback.errors[0].error.type).toBe('knee_valgus');
      expect(feedback.errors[0].priority).toBeGreaterThan(feedback.errors[1].priority);
    });

    it('should increase priority with frequency', () => {
      // Infrequent error
      const infrequentError = [
        {
          type: 'shoulder_hiking' as const,
          severity: 'warning' as const,
          side: 'left' as const,
          value: 2.5,
          unit: 'cm' as const,
          timestamp: 1000,
        },
      ];

      // Frequent error (5 occurrences)
      const frequentErrors = [];
      for (let i = 0; i < 5; i++) {
        frequentErrors.push({
          type: 'shoulder_hiking' as const,
          severity: 'warning' as const,
          side: 'left' as const,
          value: 2.5,
          unit: 'cm' as const,
          timestamp: i * 1000,
        });
      }

      const infrequentFeedback = SmartFeedbackGenerator.generate(
        infrequentError,
        'intermediate',
        'en'
      );
      const frequentFeedback = SmartFeedbackGenerator.generate(
        frequentErrors,
        'intermediate',
        'en'
      );

      // Frequent error should have higher priority
      if (infrequentFeedback.errors.length > 0 && frequentFeedback.errors.length > 0) {
        expect(frequentFeedback.errors[0].priority).toBeGreaterThan(
          infrequentFeedback.errors[0].priority
        );
      }
    });
  });

  describe('Positive Reinforcement', () => {
    it('should provide excellent form message for perfect score', () => {
      const feedback = SmartFeedbackGenerator.generate([], 'intermediate', 'en');
      expect(feedback.positiveReinforcement).toContain('Excellent');
    });

    it('should provide good rep message for high scores', () => {
      const minorErrors: ShoulderError[] = [
        {
          type: 'shoulder_hiking',
          severity: 'warning',
          side: 'left',
          value: 2.1,
          unit: 'cm',
          timestamp: 1000,
        },
      ];

      const feedback = SmartFeedbackGenerator.generate(minorErrors, 'intermediate', 'en');
      expect(feedback.overallScore).toBeGreaterThanOrEqual(75);
      expect(feedback.positiveReinforcement).toBeTruthy();
    });
  });
});
