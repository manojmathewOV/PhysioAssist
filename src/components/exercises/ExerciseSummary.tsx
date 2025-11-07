/**
 * ExerciseSummary Component
 * Displays summary of completed exercise session
 *
 * TODO: Implement full summary functionality
 * This is a minimal stub to unblock tests
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ExerciseSummaryProps {
  reps?: number;
  duration?: number;
  score?: number;
  exercise?: string;
}

const ExerciseSummary: React.FC<ExerciseSummaryProps> = ({
  reps = 0,
  duration = 0,
  score = 0,
  exercise = 'Exercise',
}) => {
  return (
    <View style={styles.container} testID="exercise-summary">
      <Text style={styles.title}>{exercise} Summary</Text>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Reps</Text>
          <Text style={styles.statValue}>{reps}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{Math.round(duration)}s</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}/100</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default ExerciseSummary;
