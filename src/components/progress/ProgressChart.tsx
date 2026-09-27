/**
 * ProgressChart Component
 * Displays progress over time as a simple bar chart with a short summary.
 *
 * Bars are coloured by score band, and every band is also named in the legend
 * and in each bar's accessibility label (never colour alone).
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText } from '../ui';
import { colors, radii, shadows, spacing, touch } from '../../theme';

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

const CHART_HEIGHT = 180;

const band = (value: number) =>
  value >= 80
    ? { color: colors.success, name: 'Excellent' }
    : value >= 60
      ? { color: colors.accent, name: 'Good' }
      : { color: colors.danger, name: 'Needs work' };

const RANGE_LABELS: Record<'7d' | '30d' | 'all', string> = {
  '7d': '7 days',
  '30d': '30 days',
  all: 'All time',
};

const ProgressChart: React.FC<ProgressChartProps> = ({
  data = [],
  title = 'Progress over time',
  // yAxisLabel = 'Score', // Currently not used in rendering
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
    const secondHalfAvg =
      values.slice(midPoint).reduce((a, b) => a + b, 0) / (values.length - midPoint);
    const improvement = secondHalfAvg - firstHalfAvg;

    const trend =
      improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';

    return { average: Math.round(average), trend, improvement: Math.round(improvement) };
  }, [chartData]);

  const formatLabel = (point: ProgressDataPoint) => {
    if (point.label) {
      return point.label;
    }
    const date = new Date(point.date);
    return `${date.toLocaleDateString('en-US', { month: 'short' })}\n${date.getDate()}`;
  };

  const renderBarChart = () => {
    if (!chartData.hasData) {
      return (
        <View style={styles.placeholderContainer} testID="empty-progress-message">
          <Icon name="insert-chart-outlined" size={48} color={colors.textMuted} />
          <AppText variant="heading" center>
            No data yet
          </AppText>
          <AppText variant="body" color={colors.textSecondary} center>
            No data available - complete exercises to track your progress
          </AppText>
        </View>
      );
    }

    const { points, maxValue } = chartData;
    const barWidth = Math.max(20, Math.min(28, 200 / points.length));

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.chartScroll}>
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View
            style={styles.yAxisLabels}
            importantForAccessibility="no-hide-descendants"
          >
            {[maxValue, Math.round(maxValue / 2), 0].map((tick, i) => (
              <AppText
                key={i}
                variant="caption"
                color={colors.textMuted}
                style={[styles.yAxisLabel, { top: (i * CHART_HEIGHT) / 2 - 10 }]}
              >
                {tick}
              </AppText>
            ))}
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            <View style={[styles.gridLine, styles.gridTop]} />
            <View style={[styles.gridLine, styles.gridMid]} />
            <View style={[styles.gridLine, styles.gridBottom]} />

            <View style={styles.bars}>
              {points.map((point, index) => {
                const heightPercent = (point.value / maxValue) * 100;
                const b = band(point.value);
                const label = formatLabel(point);

                return (
                  <View
                    key={index}
                    style={[styles.barColumn, { width: barWidth + spacing.sm }]}
                    testID={`data-point-${index}`}
                    accessible
                    accessibilityLabel={`${label.replace('\n', ' ')}: ${point.value}, ${b.name}`}
                  >
                    <View style={[styles.barContainer, { height: CHART_HEIGHT }]}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: barWidth,
                            height: `${heightPercent}%`,
                            backgroundColor: b.color,
                          },
                        ]}
                      />
                    </View>
                    <AppText variant="label">{point.value}</AppText>
                    <AppText
                      variant="caption"
                      color={colors.textSecondary}
                      numberOfLines={2}
                      style={styles.barLabel}
                    >
                      {label}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const trendIcon =
    stats.trend === 'improving'
      ? 'trending-up'
      : stats.trend === 'declining'
        ? 'trending-down'
        : 'trending-flat';
  const trendColor =
    stats.trend === 'improving'
      ? colors.success
      : stats.trend === 'declining'
        ? colors.danger
        : colors.textSecondary;

  return (
    <View style={styles.container} testID="progress-chart">
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>

        {/* Date Range Selector */}
        {onDateRangeChange && (
          <View style={styles.dateRangeSelector} accessibilityRole="tablist">
            {(['7d', '30d', 'all'] as const).map((range) => {
              const selected = dateRange === range;
              return (
                <Pressable
                  key={range}
                  style={[styles.dateRangeButton, selected && styles.dateRangeActive]}
                  onPress={() => onDateRangeChange(range)}
                  accessibilityRole="tab"
                  accessibilityLabel={RANGE_LABELS[range]}
                  accessibilityState={{ selected }}
                >
                  <AppText
                    variant="label"
                    color={selected ? colors.onPrimary : colors.primary}
                  >
                    {RANGE_LABELS[range]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Stats Summary */}
      {chartData.hasData && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox} accessible>
            <AppText variant="caption" color={colors.textSecondary}>
              Average
            </AppText>
            <AppText variant="heading">{stats.average}</AppText>
          </View>
          <View style={styles.statBox} accessible>
            <AppText variant="caption" color={colors.textSecondary}>
              Trend
            </AppText>
            <View style={styles.trendRow}>
              <Icon name={trendIcon} size={24} color={trendColor} />
              <AppText variant="bodyStrong" color={trendColor}>
                {stats.trend.charAt(0).toUpperCase() + stats.trend.slice(1)}
              </AppText>
            </View>
          </View>
          {stats.improvement !== 0 && (
            <View style={styles.statBox} accessible>
              <AppText variant="caption" color={colors.textSecondary}>
                Change
              </AppText>
              <AppText
                variant="heading"
                color={stats.improvement > 0 ? colors.success : colors.danger}
              >
                {stats.improvement > 0 ? '+' : ''}
                {stats.improvement}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Chart */}
      {renderBarChart()}

      {/* Legend */}
      {chartData.hasData && (
        <View style={styles.legend} testID="chart-legend">
          {[
            { color: colors.success, text: 'Excellent (80+)' },
            { color: colors.accent, text: 'Good (60–79)' },
            { color: colors.danger, text: 'Needs work (under 60)' },
          ].map((item) => (
            <View key={item.text} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <AppText variant="caption" color={colors.textSecondary}>
                {item.text}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  header: {
    gap: spacing.md,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateRangeButton: {
    flex: 1,
    minHeight: touch.min,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  dateRangeActive: {
    backgroundColor: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
  },
  statBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 28,
  },
  chartScroll: {
    flexGrow: 0,
  },
  chartContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  yAxisLabels: {
    width: 36,
    height: CHART_HEIGHT,
  },
  yAxisLabel: {
    position: 'absolute',
    right: spacing.sm,
    lineHeight: 20,
  },
  barsContainer: {
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  gridTop: { top: 0 },
  gridMid: { top: CHART_HEIGHT / 2 },
  gridBottom: { top: CHART_HEIGHT },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xs,
  },
  barColumn: {
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bar: {
    borderTopLeftRadius: radii.sm / 2,
    borderTopRightRadius: radii.sm / 2,
    minHeight: 4,
  },
  barLabel: {
    maxWidth: 64,
    textAlign: 'center',
  },
  placeholderContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
});

export default ProgressChart;
