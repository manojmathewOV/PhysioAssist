/**
 * ExerciseSummary Component
 * Displays comprehensive summary of completed exercise session
 *
 * Version: 1.0 (Basic) - Form analysis and historical comparison deferred to v1.1
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface ExerciseSummaryProps {
  exercise?: string;
  reps?: number;
  duration?: number;
  score?: number;
  formAccuracy?: number;
  calories?: number;
  targetReps?: number;
  previousBestScore?: number;
}

const ExerciseSummary: React.FC<ExerciseSummaryProps> = ({
  exercise = 'Exercise',
  reps = 0,
  duration = 0,
  score = 0,
  formAccuracy = 0,
  calories = 0,
  targetReps,
  previousBestScore,
}) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const scoreColor = score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336';
  const formColor = formAccuracy >= 80 ? '#4CAF50' : formAccuracy >= 60 ? '#FF9800' : '#F44336';

  const isPersonalBest = previousBestScore !== undefined && score > previousBestScore;

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container} testID="exercise-summary">
        <Text style={styles.title}>{exercise} Complete!</Text>

        {isPersonalBest && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>🎉 Personal Best!</Text>
          </View>
        )}

        {/* Primary Stats */}
        <View style={styles.primaryStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Reps</Text>
            <Text style={[styles.statValue, styles.large]}>{reps}</Text>
            {targetReps && (
              <Text style={styles.statSubtext}>
                {reps >= targetReps ? `✓ Goal: ${targetReps}` : `Goal: ${targetReps}`}
              </Text>
            )}
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={[styles.statValue, styles.large]}>{durationText}</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={[styles.statValue, styles.large, { color: scoreColor }]}>
              {score}
            </Text>
            <Text style={styles.statSubtext}>/100</Text>
          </View>
        </View>

        {/* Secondary Stats */}
        <View style={styles.secondaryStats}>
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Form Accuracy</Text>
            <View style={styles.statRowValue}>
              <View style={[styles.progressBar, { width: '100%', backgroundColor: '#E0E0E0' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${formAccuracy}%`, backgroundColor: formColor },
                  ]}
                />
              </View>
              <Text style={[styles.percentage, { color: formColor }]}>{formAccuracy}%</Text>
            </View>
          </View>

          {calories > 0 && (
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Calories Burned</Text>
              <Text style={styles.statRowText}>{calories} kcal</Text>
            </View>
          )}

          {previousBestScore !== undefined && (
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Previous Best</Text>
              <Text style={styles.statRowText}>{previousBestScore}/100</Text>
            </View>
          )}
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Performance Feedback</Text>
          {score >= 80 && <Text style={styles.feedbackText}>✨ Excellent form and execution!</Text>}
          {score >= 60 && score < 80 && (
            <Text style={styles.feedbackText}>👍 Good effort! Focus on maintaining form.</Text>
          )}
          {score < 60 && (
            <Text style={styles.feedbackText}>💪 Keep practicing! Your form will improve.</Text>
          )}
          {targetReps && reps >= targetReps && (
            <Text style={styles.feedbackText}>🎯 Target reps achieved!</Text>
          )}
        </View>

        {/* Note about v1.1 features */}
        <Text style={styles.versionNote}>
          Advanced analytics (joint angle analysis, movement quality scoring) coming in v1.1
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  primaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  large: {
    fontSize: 32,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  secondaryStats: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statRowLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  statRowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
    flex: 1,
    maxWidth: 100,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  feedbackSection: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  feedbackText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 4,
  },
  versionNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default ExerciseSummary;
