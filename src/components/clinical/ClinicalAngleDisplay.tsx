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
 * - Status badges pair an icon and a word with the colour (never colour alone)
 * - Large text for visibility during exercise
 * - Smooth animations for engaging experience
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ClinicalJointMeasurement } from '../../types/clinicalMeasurement';
import { AppText } from '../ui';
import { colors, radii, spacing } from '../../theme';

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

/** Light badge colours that stay readable on the dark camera panel. */
const TONES: Record<Tone, { bg: string; fg: string; icon: string }> = {
  success: { bg: colors.successSoft, fg: colors.success, icon: 'check-circle' },
  info: { bg: colors.primarySoft, fg: colors.primary, icon: 'info-outline' },
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning-amber' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'error-outline' },
  neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary, icon: 'help-outline' },
};

const Badge: React.FC<{ tone: Tone; label: string; icon?: string }> = ({
  tone,
  label,
  icon,
}) => {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Icon name={icon ?? t.icon} size={20} color={t.fg} />
      <AppText variant="label" color={t.fg} style={styles.capitalize}>
        {label}
      </AppText>
    </View>
  );
};

const ON_DARK_SECONDARY = 'rgba(255, 255, 255, 0.8)';
const ON_DARK_DIVIDER = 'rgba(255, 255, 255, 0.2)';

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

  const gradeTone: Record<string, Tone> = {
    excellent: 'success',
    good: 'success',
    fair: 'warning',
    limited: 'danger',
  };
  const qualityTone: Record<string, Tone> = {
    excellent: 'success',
    good: 'success',
    fair: 'warning',
    poor: 'danger',
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

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Main Angle Display */}
      <Animated.View
        style={[styles.angleContainer, { transform: [{ scale: pulseAnim }] }]}
        accessibilityLabel={`Current angle: ${Math.round(primaryAngle)} degrees`}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
      >
        <AppText variant="label" color={ON_DARK_SECONDARY} style={styles.upper}>
          {getAngleTypeLabel()}
        </AppText>
        <AppText
          style={[styles.angleValue, compact && styles.angleValueCompact]}
          color={colors.textInverse}
          maxFontSizeMultiplier={1.2}
        >
          {Math.round(primaryAngle)}°
        </AppText>

        {/* Clinical Grade Badge */}
        {clinicalGrade && !compact && (
          <Badge tone={gradeTone[clinicalGrade] ?? 'neutral'} label={clinicalGrade} />
        )}
      </Animated.View>

      {/* Target & Progress */}
      {showTarget && targetAngle > 0 && (
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <AppText variant="bodyStrong" color={colors.textInverse}>
              Target {targetAngle}°
            </AppText>
            <AppText variant="heading" color={colors.textInverse}>
              {Math.round(percentOfTarget)}%
            </AppText>
          </View>

          {/* Progress Bar */}
          <View
            style={styles.progressBarContainer}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Progress towards target"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(percentOfTarget) }}
          >
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>

          {/* Target Achieved Message */}
          {percentOfTarget >= 100 && (
            <View style={styles.center}>
              <Badge tone="success" label="Target achieved" icon="flag" />
            </View>
          )}
        </View>
      )}

      {/* Multi-Plane Display (for shoulder) */}
      {showMultiPlane &&
        measurement.primaryJoint.type === 'shoulder' &&
        measurement.primaryJoint.components && (
          <View style={[styles.section, styles.divided]}>
            <AppText variant="label" color={ON_DARK_SECONDARY} style={styles.upper}>
              Scapulohumeral rhythm
            </AppText>
            {[
              {
                label: 'Glenohumeral',
                value: `${Math.round(measurement.primaryJoint.components.glenohumeral)}°`,
              },
              {
                label: 'Scapulothoracic',
                value: `${Math.round(measurement.primaryJoint.components.scapulothoracic)}°`,
              },
              {
                label: 'Ratio',
                value: `${measurement.primaryJoint.components.rhythm.toFixed(1)}:1`,
                warn: !measurement.primaryJoint.components.rhythmNormal,
              },
            ].map((item) => (
              <View
                key={item.label}
                style={styles.rowBetween}
                accessible
                accessibilityLabel={`${item.label}: ${item.value}${
                  item.warn ? ', outside normal range' : ''
                }`}
              >
                <AppText variant="body" color={colors.textInverse}>
                  {item.label}
                </AppText>
                <View style={styles.inline}>
                  <AppText variant="bodyStrong" color={colors.textInverse}>
                    {item.value}
                  </AppText>
                  {item.warn ? (
                    <Icon name="warning-amber" size={20} color={colors.accent} />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

      {/* Quality Indicator */}
      {showQuality && !compact && (
        <View style={[styles.section, styles.divided]}>
          <View style={styles.rowBetween}>
            <AppText variant="bodyStrong" color={colors.textInverse}>
              Tracking quality
            </AppText>
            <Badge tone={qualityTone[quality] ?? 'neutral'} label={quality} />
          </View>

          {/* Quality Recommendations */}
          {measurement.quality.recommendations.length > 0 && (
            <View style={styles.list}>
              {measurement.quality.recommendations.slice(0, 2).map((rec, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Icon name="lightbulb-outline" size={20} color={ON_DARK_SECONDARY} />
                  <AppText
                    variant="caption"
                    color={ON_DARK_SECONDARY}
                    style={styles.flex}
                  >
                    {rec}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Compensation Alerts */}
      {showCompensations && measurement.compensations.length > 0 && !compact && (
        <View
          style={[styles.section, styles.compensationSection]}
          accessibilityRole="alert"
        >
          <View style={styles.inline}>
            <Icon name="warning-amber" size={24} color={colors.warning} />
            <AppText variant="bodyStrong" color={colors.warning}>
              Compensations detected
            </AppText>
          </View>
          {measurement.compensations.map((comp, idx) => (
            <View key={idx} style={styles.compensationItem}>
              <View style={styles.rowBetween}>
                <AppText variant="bodyStrong" style={[styles.capitalize, styles.flex]}>
                  {comp.type.replace(/_/g, ' ')}
                </AppText>
                <Badge tone={getSeverityTone(comp.severity)} label={comp.severity} />
              </View>
              {comp.clinicalNote && (
                <AppText variant="caption" color={colors.textSecondary}>
                  {comp.clinicalNote}
                </AppText>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Secondary Joints */}
      {!compact && Object.keys(measurement.secondaryJoints).length > 0 && (
        <View style={[styles.section, styles.divided]}>
          <AppText variant="label" color={ON_DARK_SECONDARY} style={styles.upper}>
            Secondary joints
          </AppText>
          {Object.entries(measurement.secondaryJoints).map(([jointName, jointData]) => (
            <View
              key={jointName}
              style={styles.rowBetween}
              accessible
              accessibilityLabel={`${jointName.replace(/_/g, ' ')}: ${Math.round(
                jointData.angle
              )} degrees${jointData.withinTolerance ? '' : ', outside tolerance'}`}
            >
              <AppText
                variant="body"
                color={colors.textInverse}
                style={styles.capitalize}
              >
                {jointName.replace(/_/g, ' ')}
              </AppText>
              <View style={styles.inline}>
                <AppText variant="bodyStrong" color={colors.textInverse}>
                  {Math.round(jointData.angle)}°
                </AppText>
                <Icon
                  name={jointData.withinTolerance ? 'check-circle' : 'warning-amber'}
                  size={20}
                  color={jointData.withinTolerance ? colors.skeleton : colors.accent}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Helper function to get the badge tone for a compensation severity
const getSeverityTone = (severity: string): Tone => {
  switch (severity) {
    case 'minimal':
      return 'success';
    case 'mild':
    case 'moderate':
      return 'warning';
    case 'severe':
      return 'danger';
    default:
      return 'neutral';
  }
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  capitalize: { textTransform: 'capitalize' },
  upper: { textTransform: 'uppercase', letterSpacing: 0.5 },
  container: {
    backgroundColor: colors.cameraOverlay,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    gap: spacing.md,
  },
  containerCompact: {
    padding: spacing.md,
  },
  angleContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  angleValue: {
    fontSize: 88,
    lineHeight: 96,
    fontWeight: '700',
  },
  angleValueCompact: {
    fontSize: 56,
    lineHeight: 64,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  section: {
    gap: spacing.sm,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ON_DARK_DIVIDER,
    paddingTop: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.skeleton,
  },
  list: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  compensationSection: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  compensationItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
});

export default ClinicalAngleDisplay;
