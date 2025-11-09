/**
 * Smart Feedback Generator
 *
 * Intelligently filters and prioritizes movement errors for patient feedback.
 *
 * Design Principles:
 * 1. Patient-Centered: Don't overwhelm with too many errors
 * 2. Safety First: Prioritize injury risk errors (knee valgus)
 * 3. Actionable: Focus on errors patient can immediately fix
 * 4. Progressive: Adjust feedback based on patient level
 * 5. Positive: Include encouragement and praise
 */

import { ShoulderError } from '../errorDetection/shoulderErrors';
import { KneeError } from '../errorDetection/kneeErrors';
import { ElbowError } from '../errorDetection/elbowErrors';
import { getLocalizedFeedbackMessages } from '../constants/feedbackMessages';

export type DetectedError = ShoulderError | KneeError | ElbowError;

export type PatientLevel = 'beginner' | 'intermediate' | 'advanced';

export interface PrioritizedError {
  error: DetectedError;
  priority: number;
  message: {
    title: string;
    description: string;
    correction: string;
  };
}

export interface FeedbackOutput {
  errors: PrioritizedError[];
  positiveReinforcement: string | null;
  overallScore: number;
  summary: string;
}

/**
 * Injury Risk Weights
 * Higher = more critical to patient safety
 */
const INJURY_RISK_WEIGHTS: Record<string, number> = {
  // Knee errors - HIGH injury risk (ACL tear, meniscus damage)
  knee_valgus: 100, // CRITICAL - ACL injury risk
  posterior_pelvic_tilt: 50, // Lumbar stress
  heel_lift: 30,
  insufficient_depth: 20,

  // Shoulder errors - Moderate injury risk (impingement, strain)
  shoulder_hiking: 40, // Impingement risk
  trunk_lean: 35,
  internal_rotation: 45, // Impingement risk
  incomplete_rom: 25,

  // Elbow errors - Lower injury risk (strain, tendinitis)
  shoulder_compensation: 30,
  incomplete_extension: 20,
  wrist_deviation: 25,
};

/**
 * Severity Weights
 */
const SEVERITY_WEIGHTS = {
  critical: 50,
  warning: 25,
};

/**
 * Calculate priority score for an error
 *
 * Formula: (injuryRisk × 100) + (severity × 50) + (frequency × 25)
 */
function calculatePriority(error: DetectedError, frequency: number): number {
  const injuryRisk = INJURY_RISK_WEIGHTS[error.type] || 0;
  const severity = SEVERITY_WEIGHTS[error.severity];
  const frequencyScore = Math.min(frequency, 10) * 2.5; // Cap at 10 occurrences

  return injuryRisk + severity + frequencyScore;
}

/**
 * Group errors by type and count frequency
 */
function groupAndCountErrors(
  errors: DetectedError[]
): Map<string, { errors: DetectedError[]; count: number }> {
  const grouped = new Map<string, { errors: DetectedError[]; count: number }>();

  for (const error of errors) {
    const key = `${error.type}_${error.side}`;
    if (!grouped.has(key)) {
      grouped.set(key, { errors: [], count: 0 });
    }
    const group = grouped.get(key)!;
    group.errors.push(error);
    group.count++;
  }

  return grouped;
}

/**
 * Get feedback message for error
 */
function getFeedbackMessage(
  error: DetectedError,
  locale: 'en' | 'es' = 'en'
): { title: string; description: string; correction: string } {
  const messages = getLocalizedFeedbackMessages(locale);

  // Map error type to message category
  const errorTypeMap: Record<string, any> = {
    // Shoulder
    shoulder_hiking: messages.shoulder.shoulderHiking,
    trunk_lean: messages.shoulder.trunkLean,
    internal_rotation: messages.shoulder.internalRotation,
    incomplete_rom: messages.shoulder.incompleteROM,

    // Knee
    knee_valgus: messages.knee.kneeValgus,
    heel_lift: messages.knee.heelLift,
    posterior_pelvic_tilt: messages.knee.posteriorPelvicTilt,
    insufficient_depth: messages.knee.insufficientDepth,

    // Elbow
    shoulder_compensation: messages.elbow.shoulderCompensation,
    incomplete_extension: messages.elbow.incompleteExtension,
    wrist_deviation: messages.elbow.wristDeviation,
  };

  return (
    errorTypeMap[error.type] || {
      title: 'Movement Error',
      description: 'Movement pattern differs from reference',
      correction: 'Review the reference video and try again',
    }
  );
}

/**
 * Adjust max error count based on patient level
 */
function getMaxErrorsForLevel(level: PatientLevel): number {
  switch (level) {
    case 'beginner':
      return 2; // Focus on 1-2 most critical errors
    case 'intermediate':
      return 3; // Can handle 2-3 errors
    case 'advanced':
      return 4; // Can handle more detailed feedback
    default:
      return 3;
  }
}

/**
 * Get positive reinforcement message
 */
function getPositiveReinforcement(
  errorCount: number,
  score: number,
  locale: 'en' | 'es' = 'en'
): string | null {
  const messages = getLocalizedFeedbackMessages(locale);

  if (errorCount === 0) {
    return messages.general.excellentForm;
  }

  if (score >= 90) {
    return messages.general.goodRep;
  }

  if (score >= 75) {
    return messages.general.keepGoing;
  }

  // For lower scores, focus on improvement
  return messages.general.keepGoing;
}

/**
 * Calculate overall movement score (0-100)
 */
function calculateOverallScore(errors: DetectedError[]): number {
  if (errors.length === 0) {
    return 100;
  }

  // Start at 100, deduct points for each error
  let score = 100;

  for (const error of errors) {
    const injuryRisk = INJURY_RISK_WEIGHTS[error.type] || 0;
    const severity = SEVERITY_WEIGHTS[error.severity];

    // Deduct points based on error severity
    // Critical errors = -10 to -15 points
    // Warning errors = -5 to -10 points
    const deduction = injuryRisk / 10 + severity / 5;
    score -= Math.min(deduction, 20); // Cap deduction at 20 points per error
  }

  return Math.max(score, 0); // Floor at 0
}

/**
 * Generate summary message
 */
function generateSummary(
  errorCount: number,
  score: number,
  locale: 'en' | 'es' = 'en'
): string {
  if (errorCount === 0) {
    return locale === 'en'
      ? 'Perfect form! No errors detected.'
      : 'Forma perfecta! No se detectaron errores.';
  }

  if (score >= 80) {
    return locale === 'en'
      ? `Good form with ${errorCount} minor issue${errorCount > 1 ? 's' : ''} to address.`
      : `Buena forma con ${errorCount} problema${errorCount > 1 ? 's' : ''} menor${errorCount > 1 ? 'es' : ''} para corregir.`;
  }

  if (score >= 60) {
    return locale === 'en'
      ? `Form needs attention - ${errorCount} error${errorCount > 1 ? 's' : ''} detected.`
      : `La forma necesita atención - ${errorCount} error${errorCount > 1 ? 'es' : ''} detectado${errorCount > 1 ? 's' : ''}.`;
  }

  return locale === 'en'
    ? `Multiple form issues detected - focus on the top priorities below.`
    : `Múltiples problemas de forma detectados - concéntrese en las prioridades principales a continuación.`;
}

/**
 * Smart Feedback Generator
 *
 * Takes raw detected errors and produces prioritized, patient-friendly feedback.
 */
export class SmartFeedbackGenerator {
  /**
   * Generate feedback from detected errors
   *
   * @param errors - All detected errors
   * @param patientLevel - Patient skill level (affects max error count)
   * @param locale - Language for feedback messages
   * @returns Prioritized and filtered feedback
   */
  static generate(
    errors: DetectedError[],
    patientLevel: PatientLevel = 'intermediate',
    locale: 'en' | 'es' = 'en'
  ): FeedbackOutput {
    // Step 1: Group errors by type and count frequency
    const grouped = groupAndCountErrors(errors);

    // Step 2: Calculate priority for each error group
    const prioritized: PrioritizedError[] = [];

    for (const [key, { errors: errorGroup, count }] of grouped.entries()) {
      // Use the most severe instance of each error type
      const mostSevere = errorGroup.reduce((prev, curr) =>
        curr.severity === 'critical' ? curr : prev.severity === 'critical' ? prev : curr
      );

      const priority = calculatePriority(mostSevere, count);
      const message = getFeedbackMessage(mostSevere, locale);

      prioritized.push({
        error: mostSevere,
        priority,
        message,
      });
    }

    // Step 3: Sort by priority (highest first)
    prioritized.sort((a, b) => b.priority - a.priority);

    // Step 4: Filter to top N based on patient level
    const maxErrors = getMaxErrorsForLevel(patientLevel);
    const topErrors = prioritized.slice(0, maxErrors);

    // Step 5: Calculate overall score
    const score = calculateOverallScore(errors);

    // Step 6: Generate positive reinforcement
    const positiveReinforcement = getPositiveReinforcement(errors.length, score, locale);

    // Step 7: Generate summary
    const summary = generateSummary(topErrors.length, score, locale);

    return {
      errors: topErrors,
      positiveReinforcement,
      overallScore: score,
      summary,
    };
  }

  /**
   * Generate feedback for live/streaming mode
   *
   * In live mode, we want to focus on the CURRENT most critical error
   * to avoid overwhelming the user during real-time exercise.
   */
  static generateLiveFeedback(
    errors: DetectedError[],
    patientLevel: PatientLevel = 'intermediate',
    locale: 'en' | 'es' = 'en'
  ): PrioritizedError | null {
    if (errors.length === 0) {
      return null;
    }

    // Group and prioritize
    const grouped = groupAndCountErrors(errors);
    const prioritized: PrioritizedError[] = [];

    for (const [key, { errors: errorGroup, count }] of grouped.entries()) {
      const mostSevere = errorGroup.reduce((prev, curr) =>
        curr.severity === 'critical' ? curr : prev.severity === 'critical' ? prev : curr
      );

      const priority = calculatePriority(mostSevere, count);
      const message = getFeedbackMessage(mostSevere, locale);

      prioritized.push({
        error: mostSevere,
        priority,
        message,
      });
    }

    // Sort by priority
    prioritized.sort((a, b) => b.priority - a.priority);

    // Return only the TOP priority error
    return prioritized[0];
  }

  /**
   * Check if feedback is needed
   *
   * Determines if there are any errors worth showing to the user.
   * Filters out very minor errors below a threshold.
   */
  static shouldShowFeedback(errors: DetectedError[]): boolean {
    if (errors.length === 0) {
      return false;
    }

    // Show feedback if any critical errors exist
    const hasCritical = errors.some((e) => e.severity === 'critical');
    if (hasCritical) {
      return true;
    }

    // Show feedback if warning errors are frequent (3+ occurrences)
    const grouped = groupAndCountErrors(errors);
    const hasFrequentWarnings = Array.from(grouped.values()).some((g) => g.count >= 3);

    return hasFrequentWarnings;
  }
}

export const smartFeedbackGenerator = SmartFeedbackGenerator;
