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
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

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

  const getJointIcon = (joint: JointType): string => {
    const icons = {
      shoulder: '💪',
      elbow: '🦾',
      knee: '🦵',
      hip: '🦿',
    };
    return icons[joint];
  };

  const getJointLabel = (joint: JointType): string => {
    return joint.charAt(0).toUpperCase() + joint.slice(1);
  };

  const canConfirm = selectedJoint && selectedMovement;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Assessment</Text>
        <Text style={styles.headerSubtitle}>
          Choose the joint and movement to measure
        </Text>
      </View>

      {/* Side Selection */}
      {onSelectSide && (
        <View style={styles.sideSelector}>
          <Text style={styles.sideSelectorLabel}>Side:</Text>
          <View style={styles.sideButtons}>
            <TouchableOpacity
              style={[
                styles.sideButton,
                side === 'left' && styles.sideButtonActive,
              ]}
              onPress={() => onSelectSide('left')}
              accessibilityLabel="Select left side"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.sideButtonText,
                  side === 'left' && styles.sideButtonTextActive,
                ]}
              >
                Left
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sideButton,
                side === 'right' && styles.sideButtonActive,
              ]}
              onPress={() => onSelectSide('right')}
              accessibilityLabel="Select right side"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.sideButtonText,
                  side === 'right' && styles.sideButtonTextActive,
                ]}
              >
                Right
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Joint Selection */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {JOINT_CONFIGS.map((config) => (
          <View key={config.joint} style={styles.jointSection}>
            {/* Joint Button */}
            <TouchableOpacity
              style={[
                styles.jointButton,
                selectedJoint === config.joint && styles.jointButtonSelected,
              ]}
              onPress={() => handleJointPress(config.joint)}
              accessibilityLabel={`Select ${config.joint} joint`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedJoint === config.joint }}
            >
              <View style={styles.jointButtonContent}>
                <Text style={styles.jointIcon}>{getJointIcon(config.joint)}</Text>
                <Text style={styles.jointLabel}>{getJointLabel(config.joint)}</Text>
              </View>
              <Text style={styles.expandIcon}>
                {expandedJoint === config.joint ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {/* Movement Options (Expanded) */}
            {expandedJoint === config.joint && (
              <View style={styles.movementList}>
                {config.movements.map((movement) => (
                  <TouchableOpacity
                    key={movement.type}
                    style={[
                      styles.movementButton,
                      selectedMovement === movement.type &&
                        styles.movementButtonSelected,
                    ]}
                    onPress={() => handleMovementPress(movement.type)}
                    accessibilityLabel={`${movement.label}: ${movement.description}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedMovement === movement.type }}
                  >
                    <View style={styles.movementContent}>
                      <View style={styles.movementTextContainer}>
                        <Text style={styles.movementLabel}>{movement.label}</Text>
                        <Text style={styles.movementDescription}>
                          {movement.description}
                        </Text>
                      </View>
                      <View style={styles.movementTarget}>
                        <Text style={styles.movementTargetText}>
                          Target: {movement.targetAngle}°
                        </Text>
                      </View>
                    </View>
                    {selectedMovement === movement.type && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
          onPress={onConfirm}
          disabled={!canConfirm}
          accessibilityLabel="Confirm selection and start assessment"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canConfirm }}
        >
          <LinearGradient
            colors={
              canConfirm
                ? ['#4CAF50', '#45a049']
                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
            }
            style={styles.confirmButtonGradient}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !canConfirm && styles.confirmButtonTextDisabled,
              ]}
            >
              Start Assessment
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AAA',
  },
  sideSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sideSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 16,
  },
  sideButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sideButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#888',
    backgroundColor: 'transparent',
  },
  sideButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sideButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  sideButtonTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jointSection: {
    marginTop: 16,
  },
  jointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  jointButtonSelected: {
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
  jointButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jointIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  jointLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  expandIcon: {
    fontSize: 18,
    color: '#AAA',
  },
  movementList: {
    marginTop: 12,
    marginLeft: 16,
    gap: 8,
  },
  movementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  movementButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  movementContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movementTextContainer: {
    flex: 1,
  },
  movementLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  movementDescription: {
    fontSize: 14,
    color: '#AAA',
  },
  movementTarget: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderRadius: 12,
    marginLeft: 12,
  },
  movementTargetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  selectedBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  confirmButtonTextDisabled: {
    color: '#666',
  },
});

export default JointSelectionPanel;
