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
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Import from centralized registry
import {
  MovementRegistry,
  JointType,
  MovementType,
  JOINT_METADATA,
} from '@config/movements.config';

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

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressDots}>
        <Text style={[styles.dot, styles.dotActive]}>●</Text>
        <Text style={[styles.dot, styles.dotActive]}>●</Text>
        <Text style={styles.dot}>○</Text>
        <Text style={styles.dot}>○</Text>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.jointBadge}>
          <Text style={styles.jointIcon}>{jointInfo.icon}</Text>
          <Text style={styles.jointText}>
            {side.charAt(0).toUpperCase() + side.slice(1)} {jointInfo.label}
          </Text>
        </View>
        <Text style={styles.question}>How do you want to move it?</Text>
        <Text style={styles.subtext}>Choose the movement to measure</Text>
      </View>

      {/* Movement cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {movementDefs.map((movementDef) => (
          <TouchableOpacity
            key={movementDef.id}
            style={styles.card}
            onPress={() => handleSelect(movementDef.type)}
            activeOpacity={0.8}
            accessibilityLabel={`${movementDef.displayName.simple}: ${movementDef.description.simple}. Target: ${movementDef.targetAngle} degrees`}
            accessibilityRole="button"
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{movementDef.icon}</Text>
              <Text style={styles.cardTitle}>{movementDef.displayName.simple}</Text>
            </View>
            <Text style={styles.cardDesc}>{movementDef.description.simple}</Text>
            <View style={styles.targetBadge}>
              <Text style={styles.targetText}>Target: {movementDef.targetAngle}°</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Voice prompt */}
      <View style={styles.voicePrompt}>
        <Text style={styles.micIcon}>🎤</Text>
        <Text style={styles.voiceText}>Say {voiceOptions}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    gap: 12,
  },
  dot: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  jointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    marginBottom: 24,
  },
  jointIcon: {
    fontSize: 24,
  },
  jointText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  question: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
  },
  subtext: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
  },
  cardDesc: {
    fontSize: 18,
    color: '#4a5568',
    marginBottom: 16,
    lineHeight: 26,
  },
  targetBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  targetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  voicePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  micIcon: {
    fontSize: 24,
  },
  voiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flexShrink: 1,
  },
});

export default MovementSelectionPanelV2;
