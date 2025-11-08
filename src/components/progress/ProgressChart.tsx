/**
 * ProgressChart Component
 * Displays user progress over time with basic visualization
 *
 * Version: 1.0 (SVG-based) - Advanced charting library (Victory Native) deferred to v1.1
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export interface ProgressDataPoint {
  date: string | Date;
  value: number;
  label?: string;
}

export interface ProgressChartProps {
  data?: ProgressDataPoint[];
  title?: string;
  yAxisLabel?: string;
  dateRange?: '7d' | '30d' | 'all';
  onDateRangeChange?: (range: '7d' | '30d' | 'all') => void;
}

const ProgressChart: React.FC<ProgressChartProps> = ({
  data = [],
  title = 'Progress Over Time',
  yAxisLabel = 'Score',
  dateRange = 'all',
  onDateRangeChange,
}) => {
  // Calculate chart dimensions and scales
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return { points: [], maxValue: 100, minValue: 0, hasData: false };
    }

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values, 100);
    const minValue = Math.min(...values, 0);

    return {
      points: data,
      maxValue,
      minValue,
      hasData: true,
    };
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData.hasData) {
      return { average: 0, trend: 'neutral', improvement: 0 };
    }

    const values = chartData.points.map((p) => p.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    // Simple trend calculation (comparing first half to second half)
    const midPoint = Math.floor(values.length / 2);
    const firstHalfAvg = values.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint;
    const secondHalfAvg = values.slice(midPoint).reduce((a, b) => a + b, 0) / (values.length - midPoint);
    const improvement = secondHalfAvg - firstHalfAvg;

    const trend = improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';

    return { average: Math.round(average), trend, improvement: Math.round(improvement) };
  }, [chartData]);

  // Render simple bar chart
  const renderBarChart = () => {
    if (!chartData.hasData) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholder}>📊 No data yet</Text>
          <Text style={styles.placeholderSubtext}>
            Complete exercises to track your progress
          </Text>
        </View>
      );
    }

    const { points, maxValue } = chartData;
    const chartHeight = 200;
    const barWidth = Math.min(40, 300 / points.length);
    const barGap = 8;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.chartScroll}>
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisLabel}>{maxValue}</Text>
            <Text style={styles.yAxisLabel}>{Math.round(maxValue / 2)}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: '50%' }]} />
            <View style={[styles.gridLine, { bottom: 0 }]} />

            <View style={styles.bars}>
              {points.map((point, index) => {
                const heightPercent = (point.value / maxValue) * 100;
                const barColor =
                  point.value >= 80 ? '#4CAF50' : point.value >= 60 ? '#FF9800' : '#F44336';

                return (
                  <View key={index} style={[styles.barColumn, { width: barWidth }]}>
                    <View style={[styles.barContainer, { height: chartHeight }]}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barValue}>{point.value}</Text>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {point.label || new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container} testID="progress-chart">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>

        {/* Date Range Selector */}
        {onDateRangeChange && (
          <View style={styles.dateRangeSelector}>
            {(['7d', '30d', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.dateRangeButton, dateRange === range && styles.dateRangeButtonActive]}
                onPress={() => onDateRangeChange(range)}
              >
                <Text
                  style={[
                    styles.dateRangeText,
                    dateRange === range && styles.dateRangeTextActive,
                  ]}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Stats Summary */}
      {chartData.hasData && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={styles.statValue}>{stats.average}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Trend</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    stats.trend === 'improving'
                      ? '#4CAF50'
                      : stats.trend === 'declining'
                      ? '#F44336'
                      : '#FF9800',
                },
              ]}
            >
              {stats.trend === 'improving' ? '↗️' : stats.trend === 'declining' ? '↘️' : '→'}{' '}
              {stats.trend}
            </Text>
          </View>
          {stats.improvement !== 0 && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Change</Text>
              <Text
                style={[styles.statValue, { color: stats.improvement > 0 ? '#4CAF50' : '#F44336' }]}
              >
                {stats.improvement > 0 ? '+' : ''}
                {stats.improvement}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Chart */}
      {renderBarChart()}

      {/* Legend */}
      {chartData.hasData && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Excellent (80+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Good (60-79)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Needs Work (<60)</Text>
          </View>
        </View>
      )}

      {/* Version Note */}
      <Text style={styles.versionNote}>
        Advanced charting (line graphs, multi-metric comparison) coming in v1.1
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  dateRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  dateRangeButtonActive: {
    backgroundColor: '#2196F3',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateRangeTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartScroll: {
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
    height: 200,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  barsContainer: {
    position: 'relative',
    flex: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#999',
    maxWidth: 50,
    textAlign: 'center',
  },
  placeholderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  versionNote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
});

export default ProgressChart;
