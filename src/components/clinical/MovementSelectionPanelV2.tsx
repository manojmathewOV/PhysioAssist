/**
 * Movement Selection Panel V2 - Ultra Simplified
 *
 * After joint selection, shows available movements with:
 * - Plain language descriptions
 * - Clear directional icons
 * - Target angles visible
 * - Voice support
 * - One movement per card
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Import from centralized registry
import {
  MovementRegistry,
  JointType,
  MovementType,
  JOINT_METADATA,
} from '@config/movements.config';
import { AppText, Screen } from '../ui';
import { colors, radii, shadows, spacing } from '../../theme';
import StepHeader from './StepHeader';
import { JOINT_ICONS, MOVEMENT_ICONS } from './clinicalIcons';

interface MovementSelectionPanelV2Props {
  joint: JointType;
  side: 'left' | 'right';
  onSelect: (movement: MovementType) => void;
  onBack: () => void;
}

const MovementSelectionPanelV2: React.FC<MovementSelectionPanelV2Props> = ({
  joint,
  side,
  onSelect,
  onBack,
}) => {
  // Get movements from centralized registry
  const movementDefs = MovementRegistry.getMovementsByJoint(joint);
  const jointInfo = JOINT_METADATA[joint];

  const handleSelect = (movement: MovementType) => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    onSelect(movement);
  };

  const handleBack = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    onBack();
  };

  // Generate voice prompt using simple display names
  const voiceOptions = movementDefs.map((m) => `"${m.displayName.simple}"`).join(', ');
  const sideLabel = side.charAt(0).toUpperCase() + side.slice(1);

  return (
    <Screen testID="movement-selection-v2">
      <StepHeader
        step={2}
        totalSteps={4}
        title="How do you want to move it?"
        subtitle="Choose the movement to measure."
        onBack={handleBack}
      />

      {/* Selected joint */}
      <View
        style={styles.jointBadge}
        accessible
        accessibilityLabel={`Measuring ${sideLabel} ${jointInfo.displayName}`}
      >
        <Icon name={JOINT_ICONS[joint]} size={24} color={colors.primary} />
        <AppText variant="label" color={colors.primary}>
          {sideLabel} {jointInfo.displayName.toLowerCase()}
        </AppText>
      </View>

      {/* Movement cards */}
      {movementDefs.map((movementDef) => (
        <Pressable
          key={movementDef.id}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => handleSelect(movementDef.type)}
          accessibilityLabel={`${movementDef.displayName.simple}: ${movementDef.description.simple}. Target: ${movementDef.targetAngle} degrees`}
          accessibilityRole="button"
        >
          <View style={styles.cardIcon}>
            <Icon
              name={MOVEMENT_ICONS[movementDef.type] ?? 'open-with'}
              size={32}
              color={colors.primary}
            />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">{movementDef.displayName.simple}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {movementDef.description.simple}
            </AppText>
            <View style={styles.targetBadge}>
              <Icon name="flag" size={18} color={colors.text} />
              <AppText variant="label">Target {movementDef.targetAngle}°</AppText>
            </View>
          </View>
          <Icon name="chevron-right" size={32} color={colors.textMuted} />
        </Pressable>
      ))}

      {/* Voice prompt */}
      <View style={styles.hint}>
        <Icon name="mic" size={24} color={colors.textSecondary} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
          You can also say {voiceOptions}
        </AppText>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  jointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    minHeight: 96,
    ...shadows.card,
  },
  cardPressed: { backgroundColor: colors.primarySoft },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

export default MovementSelectionPanelV2;
