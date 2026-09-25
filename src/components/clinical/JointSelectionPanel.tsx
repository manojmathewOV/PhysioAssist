/**
 * Joint Selection Panel
 *
 * Allows patients/therapists to select:
 * - Which joint to assess (Shoulder, Elbow, Knee, Hip)
 * - Which movement type to measure (Flexion, Abduction, Rotation, etc.)
 *
 * Design Philosophy:
 * - Large, touch-friendly buttons
 * - Clear visual hierarchy
 * - Accessible labels
 * - Smooth animations
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, BigButton, Screen, SectionTitle } from '../ui';
import { SegmentedControl } from '../ui/SegmentedControl';
import { colors, radii, shadows, spacing, touch } from '../../theme';
import { JOINT_ICONS } from './clinicalIcons';

export type JointType = 'shoulder' | 'elbow' | 'knee' | 'hip';

export type MovementType =
  | 'flexion'
  | 'extension'
  | 'abduction'
  | 'adduction'
  | 'external_rotation'
  | 'internal_rotation';

export interface JointConfig {
  joint: JointType;
  movements: {
    type: MovementType;
    label: string;
    description: string;
    targetAngle: number;
  }[];
}

const JOINT_CONFIGS: JointConfig[] = [
  {
    joint: 'shoulder',
    movements: [
      {
        type: 'flexion',
        label: 'Forward Flexion',
        description: 'Lifting arm to the front',
        targetAngle: 160,
      },
      {
        type: 'abduction',
        label: 'Abduction',
        description: 'Lifting arm to the side',
        targetAngle: 160,
      },
      {
        type: 'external_rotation',
        label: 'External Rotation',
        description: 'Turning outwards',
        targetAngle: 90,
      },
      {
        type: 'internal_rotation',
        label: 'Internal Rotation',
        description: 'Turning inwards',
        targetAngle: 70,
      },
    ],
  },
  {
    joint: 'elbow',
    movements: [
      {
        type: 'flexion',
        label: 'Flexion',
        description: 'Bending the elbow',
        targetAngle: 150,
      },
      {
        type: 'extension',
        label: 'Extension',
        description: 'Straightening the elbow',
        targetAngle: 0,
      },
    ],
  },
  {
    joint: 'knee',
    movements: [
      {
        type: 'flexion',
        label: 'Flexion',
        description: 'Bending the knee',
        targetAngle: 135,
      },
      {
        type: 'extension',
        label: 'Extension',
        description: 'Straightening the knee',
        targetAngle: 0,
      },
    ],
  },
  {
    joint: 'hip',
    movements: [
      {
        type: 'flexion',
        label: 'Flexion',
        description: 'Lifting leg forward',
        targetAngle: 120,
      },
      {
        type: 'abduction',
        label: 'Abduction',
        description: 'Lifting leg to the side',
        targetAngle: 45,
      },
    ],
  },
];

interface JointSelectionPanelProps {
  selectedJoint?: JointType;
  selectedMovement?: MovementType;
  onSelectJoint: (joint: JointType) => void;
  onSelectMovement: (movement: MovementType) => void;
  onConfirm: () => void;
  side?: 'left' | 'right';
  onSelectSide?: (side: 'left' | 'right') => void;
}

const JointSelectionPanel: React.FC<JointSelectionPanelProps> = ({
  selectedJoint,
  selectedMovement,
  onSelectJoint,
  onSelectMovement,
  onConfirm,
  side = 'left',
  onSelectSide,
}) => {
  const [expandedJoint, setExpandedJoint] = useState<JointType | null>(
    selectedJoint || null
  );

  const handleJointPress = (joint: JointType) => {
    setExpandedJoint(expandedJoint === joint ? null : joint);
    onSelectJoint(joint);
  };

  const handleMovementPress = (movement: MovementType) => {
    onSelectMovement(movement);
  };

  const getJointLabel = (joint: JointType): string => {
    return joint.charAt(0).toUpperCase() + joint.slice(1);
  };

  const canConfirm = selectedJoint && selectedMovement;

  return (
    <Screen
      title="Select assessment"
      subtitle="Choose the joint and movement to measure."
      testID="joint-selection-panel"
      footer={
        <BigButton
          label="Start assessment"
          icon="play-arrow"
          onPress={onConfirm}
          disabled={!canConfirm}
          accessibilityHint={
            canConfirm
              ? 'Confirm selection and start assessment'
              : 'Choose a joint and a movement first'
          }
        />
      }
    >
      {/* Side Selection */}
      {onSelectSide && (
        <>
          <SectionTitle>Side</SectionTitle>
          <SegmentedControl
            accessibilityLabel="Side"
            value={side}
            onChange={onSelectSide}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </>
      )}

      {/* Joint Selection */}
      <SectionTitle>Joint and movement</SectionTitle>
      {JOINT_CONFIGS.map((config) => {
        const jointSelected = selectedJoint === config.joint;
        const expanded = expandedJoint === config.joint;
        return (
          <View
            key={config.joint}
            style={[styles.jointCard, jointSelected && styles.jointCardSelected]}
          >
            {/* Joint Button */}
            <Pressable
              style={({ pressed }) => [styles.jointButton, pressed && styles.pressed]}
              onPress={() => handleJointPress(config.joint)}
              accessibilityLabel={`Select ${config.joint} joint`}
              accessibilityRole="button"
              accessibilityState={{ selected: jointSelected, expanded }}
            >
              <View style={styles.jointIcon}>
                <Icon name={JOINT_ICONS[config.joint]} size={28} color={colors.primary} />
              </View>
              <AppText variant="heading" style={styles.flex}>
                {getJointLabel(config.joint)}
              </AppText>
              <Icon
                name={expanded ? 'expand-less' : 'expand-more'}
                size={32}
                color={colors.textMuted}
              />
            </Pressable>

            {/* Movement Options (Expanded) */}
            {expanded && (
              <View style={styles.movementList}>
                {config.movements.map((movement) => {
                  const selected = jointSelected && selectedMovement === movement.type;
                  return (
                    <Pressable
                      key={movement.type}
                      style={({ pressed }) => [
                        styles.movementButton,
                        selected && styles.movementButtonSelected,
                        pressed && !selected && styles.pressed,
                      ]}
                      onPress={() => handleMovementPress(movement.type)}
                      accessibilityLabel={`${movement.label}: ${movement.description}. Target ${movement.targetAngle} degrees`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, checked: selected }}
                    >
                      <Icon
                        name={
                          selected ? 'radio-button-checked' : 'radio-button-unchecked'
                        }
                        size={26}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                      <View style={styles.flex}>
                        <AppText variant="bodyStrong">{movement.label}</AppText>
                        <AppText variant="caption" color={colors.textSecondary}>
                          {movement.description}
                        </AppText>
                      </View>
                      <View style={styles.movementTarget}>
                        <AppText variant="label" color={colors.text}>
                          {movement.targetAngle}°
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  jointCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...shadows.card,
  },
  jointCardSelected: {
    borderColor: colors.primary,
  },
  jointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 80,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  jointIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  movementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.min + 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  movementButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  movementTarget: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
  },
});

export default JointSelectionPanel;
