/**
 * Clinical Angle Display
 *
 * Large, prominent display of joint angles with clinical context:
 * - Real-time angle value (large, easy to read)
 * - Target angle and progress
 * - Clinical grade indicator
 * - Multi-plane display for complex joints (shoulder)
 * - Quality feedback
 * - Compensation alerts
 *
 * Design Philosophy:
 * - Patient-facing: Easy to understand at a glance
 * - Color-coded feedback (green = good, yellow = caution, red = poor)
 * - Large text for visibility during exercise
 * - Smooth animations for engaging experience
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ClinicalJointMeasurement } from '../../types/clinicalMeasurement';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ClinicalAngleDisplayProps {
  measurement: ClinicalJointMeasurement;
  showMultiPlane?: boolean;
  showTarget?: boolean;
  showQuality?: boolean;
  showCompensations?: boolean;
  compact?: boolean;
}

const ClinicalAngleDisplay: React.FC<ClinicalAngleDisplayProps> = ({
  measurement,
  showMultiPlane = true,
  showTarget = true,
  showQuality = true,
  showCompensations = true,
  compact = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const primaryAngle = measurement.primaryJoint.angle;
  const targetAngle = measurement.primaryJoint.targetAngle || 0;
  const percentOfTarget = measurement.primaryJoint.percentOfTarget || 0;
  const angleType = measurement.primaryJoint.angleType;
  const clinicalGrade = measurement.primaryJoint.clinicalGrade;
  const quality = measurement.quality.overall;

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percentOfTarget / 100,
      useNativeDriver: false,
      tension: 20,
      friction: 7,
    }).start();
  }, [percentOfTarget]);

  // Pulse animation when target achieved
  useEffect(() => {
    if (percentOfTarget >= 100) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [percentOfTarget]);

  // Get color based on progress and quality
  const getProgressColor = (): string => {
    if (percentOfTarget >= 95) return '#4CAF50'; // Green - Excellent
    if (percentOfTarget >= 75) return '#8BC34A'; // Light Green - Good
    if (percentOfTarget >= 50) return '#FFC107'; // Yellow - Fair
    if (percentOfTarget >= 25) return '#FF9800'; // Orange - Poor
    return '#2196F3'; // Blue - Just started
  };

  const getQualityColor = (): string => {
    switch (quality) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FFC107';
      case 'poor':
        return '#F44336';
      default:
        return '#888';
    }
  };

  const getGradeLabel = (): string => {
    switch (clinicalGrade) {
      case 'excellent':
        return '✓ Excellent';
      case 'good':
        return '✓ Good';
      case 'fair':
        return '○ Fair';
      case 'limited':
        return '⚠ Limited';
      default:
        return '';
    }
  };

  const getAngleTypeLabel = (): string => {
    const labels: Record<string, string> = {
      flexion: 'Flexion',
      extension: 'Extension',
      abduction: 'Abduction',
      adduction: 'Adduction',
      external_rotation: 'External Rotation',
      internal_rotation: 'Internal Rotation',
    };
    return labels[angleType] || angleType;
  };

  const progressColor = getProgressColor();
  const qualityColor = getQualityColor();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Main Angle Display */}
      <Animated.View
        style={[styles.angleContainer, { transform: [{ scale: pulseAnim }] }]}
        accessibilityLabel={`Current angle: ${Math.round(primaryAngle)} degrees`}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
      >
        <Text style={styles.angleTypeLabel}>{getAngleTypeLabel()}</Text>
        <View style={styles.angleValueContainer}>
          <Text style={[styles.angleValue, { color: progressColor }]}>
            {Math.round(primaryAngle)}
          </Text>
          <Text style={styles.angleUnit}>°</Text>
        </View>

        {/* Clinical Grade Badge */}
        {clinicalGrade && !compact && (
          <View style={[styles.gradeBadge, { backgroundColor: progressColor + '30' }]}>
            <Text style={[styles.gradeText, { color: progressColor }]}>
              {getGradeLabel()}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Target & Progress */}
      {showTarget && targetAngle > 0 && (
        <View style={styles.targetSection}>
          <View style={styles.targetHeader}>
            <Text style={styles.targetLabel}>Target: {targetAngle}°</Text>
            <Text style={[styles.percentText, { color: progressColor }]}>
              {Math.round(percentOfTarget)}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={[progressColor, progressColor + 'AA']}
                style={styles.progressBarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>

          {/* Target Achieved Message */}
          {percentOfTarget >= 100 && (
            <View style={styles.achievedBadge}>
              <Text style={styles.achievedText}>🎯 Target Achieved!</Text>
            </View>
          )}
        </View>
      )}

      {/* Multi-Plane Display (for shoulder) */}
      {showMultiPlane &&
        measurement.primaryJoint.type === 'shoulder' &&
        measurement.primaryJoint.components && (
          <View style={styles.multiPlaneSection}>
            <Text style={styles.multiPlaneTitle}>Scapulohumeral Rhythm</Text>
            <View style={styles.multiPlaneRow}>
              <View style={styles.multiPlaneItem}>
                <Text style={styles.multiPlaneLabel}>Glenohumeral</Text>
                <Text style={styles.multiPlaneValue}>
                  {Math.round(measurement.primaryJoint.components.glenohumeral)}°
                </Text>
              </View>
              <View style={styles.multiPlaneDivider} />
              <View style={styles.multiPlaneItem}>
                <Text style={styles.multiPlaneLabel}>Scapulothoracic</Text>
                <Text style={styles.multiPlaneValue}>
                  {Math.round(measurement.primaryJoint.components.scapulothoracic)}°
                </Text>
              </View>
              <View style={styles.multiPlaneDivider} />
              <View style={styles.multiPlaneItem}>
                <Text style={styles.multiPlaneLabel}>Ratio</Text>
                <Text
                  style={[
                    styles.multiPlaneValue,
                    {
                      color: measurement.primaryJoint.components.rhythmNormal
                        ? '#4CAF50'
                        : '#FFC107',
                    },
                  ]}
                >
                  {measurement.primaryJoint.components.rhythm.toFixed(1)}:1
                </Text>
              </View>
            </View>
          </View>
        )}

      {/* Quality Indicator */}
      {showQuality && !compact && (
        <View style={styles.qualitySection}>
          <View style={styles.qualityRow}>
            <Text style={styles.qualityLabel}>Tracking Quality:</Text>
            <View style={[styles.qualityBadge, { backgroundColor: qualityColor + '30' }]}>
              <View style={[styles.qualityDot, { backgroundColor: qualityColor }]} />
              <Text style={[styles.qualityText, { color: qualityColor }]}>
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </Text>
            </View>
          </View>

          {/* Quality Recommendations */}
          {measurement.quality.recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              {measurement.quality.recommendations.slice(0, 2).map((rec, idx) => (
                <Text key={idx} style={styles.recommendationText}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Compensation Alerts */}
      {showCompensations && measurement.compensations.length > 0 && !compact && (
        <View style={styles.compensationSection}>
          <Text style={styles.compensationTitle}>⚠ Compensations Detected</Text>
          {measurement.compensations.map((comp, idx) => (
            <View key={idx} style={styles.compensationItem}>
              <View style={styles.compensationHeader}>
                <Text style={styles.compensationType}>
                  {comp.type.replace(/_/g, ' ')}
                </Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(comp.severity) + '30' },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: getSeverityColor(comp.severity) },
                    ]}
                  >
                    {comp.severity}
                  </Text>
                </View>
              </View>
              {comp.clinicalNote && (
                <Text style={styles.compensationNote}>{comp.clinicalNote}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Secondary Joints */}
      {!compact && Object.keys(measurement.secondaryJoints).length > 0 && (
        <View style={styles.secondarySection}>
          <Text style={styles.secondaryTitle}>Secondary Joints</Text>
          {Object.entries(measurement.secondaryJoints).map(([jointName, jointData]) => (
            <View key={jointName} style={styles.secondaryItem}>
              <Text style={styles.secondaryJointName}>
                {jointName.replace(/_/g, ' ')}:
              </Text>
              <Text
                style={[
                  styles.secondaryJointValue,
                  {
                    color: jointData.withinTolerance ? '#4CAF50' : '#FFC107',
                  },
                ]}
              >
                {Math.round(jointData.angle)}°{!jointData.withinTolerance && ' ⚠'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Helper function to get severity color
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'minimal':
      return '#8BC34A';
    case 'mild':
      return '#FFC107';
    case 'moderate':
      return '#FF9800';
    case 'severe':
      return '#F44336';
    default:
      return '#888';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  containerCompact: {
    padding: 16,
    borderRadius: 16,
  },
  angleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  angleTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#AAA',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  angleValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  angleValue: {
    fontSize: 96,
    fontWeight: '700',
    lineHeight: 100,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  angleUnit: {
    fontSize: 48,
    fontWeight: '700',
    color: '#AAA',
    marginLeft: 4,
  },
  gradeBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  targetSection: {
    marginBottom: 20,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AAA',
  },
  percentText: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  progressBarGradient: {
    flex: 1,
  },
  achievedBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  achievedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  multiPlaneSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  multiPlaneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 12,
    textAlign: 'center',
  },
  multiPlaneRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  multiPlaneItem: {
    alignItems: 'center',
  },
  multiPlaneLabel: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 4,
  },
  multiPlaneValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  multiPlaneDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  qualitySection: {
    marginBottom: 16,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#FFC107',
    marginTop: 4,
  },
  compensationSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  compensationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 12,
  },
  compensationItem: {
    marginBottom: 8,
  },
  compensationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compensationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  compensationNote: {
    fontSize: 12,
    color: '#CCC',
    fontStyle: 'italic',
  },
  secondarySection: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  secondaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
    marginBottom: 8,
  },
  secondaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryJointName: {
    fontSize: 13,
    color: '#CCC',
    textTransform: 'capitalize',
  },
  secondaryJointValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ClinicalAngleDisplay;
