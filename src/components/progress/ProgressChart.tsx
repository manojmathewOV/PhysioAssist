/**
 * ProgressChart Component
 * Displays user progress over time
 *
 * TODO: Implement full chart functionality
 * This is a minimal stub to unblock tests
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressChartProps {
  data?: any[];
  title?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data, title }) => {
  return (
    <View style={styles.container} testID="progress-chart">
      <Text style={styles.title}>{title || 'Progress Chart'}</Text>
      <Text style={styles.placeholder}>Chart visualization will appear here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 32,
  },
});

export default ProgressChart;
