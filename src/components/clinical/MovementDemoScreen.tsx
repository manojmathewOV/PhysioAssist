/**
 * Movement Demo Screen
 *
 * Shows animated demonstration of the movement before patient attempts it.
 * Research shows patients MUST watch demo 3-5x before attempting movement.
 *
 * Features:
 * - Animated stick figure demonstration
 * - Auto-plays 3 times
 * - Counter shows "Demo X of 3"
 * - Tips for best results
 * - "Watch Again" and "I'm Ready" buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type MovementType = 'flexion' | 'abduction' | 'external_rotation' | 'elbow_flexion' | 'knee_flexion';

interface MovementDemoScreenProps {
  movementType: MovementType;
  jointName: string;
  onReady: () => void;
  onBack?: () => void;
}

const MOVEMENT_CONFIGS = {
  flexion: {
    title: 'Lift Your Arm Forward',
    description: 'Raise your arm straight in front of you',
    tips: [
      'Keep your elbow straight',
      'Move slowly and smoothly',
      'Go as high as comfortable',
      'Stop if you feel pain',
    ],
  },
  abduction: {
    title: 'Lift Your Arm to the Side',
    description: 'Raise your arm out to your side',
    tips: [
      'Keep your palm facing down',
      'Keep your elbow straight',
      'Lift straight to the side',
      'Stop if you feel pain',
    ],
  },
  external_rotation: {
    title: 'Turn Your Arm Out',
    description: 'Rotate your arm outward (elbow bent at 90°)',
    tips: [
      'Keep elbow at your side',
      'Keep elbow bent 90°',
      'Only rotate your forearm',
      'Stop if you feel pain',
    ],
  },
  elbow_flexion: {
    title: 'Bend Your Elbow',
    description: 'Bring your hand toward your shoulder',
    tips: [
      'Keep your upper arm still',
      'Keep your palm facing up',
      'Bend slowly',
      'Stop if you feel pain',
    ],
  },
  knee_flexion: {
    title: 'Bend Your Knee',
    description: 'Bring your heel toward your bottom',
    tips: [
      'Stand on one leg (hold wall if needed)',
      'Keep your thighs aligned',
      'Bend slowly',
      'Stop if you feel pain',
    ],
  },
};

const MovementDemoScreen: React.FC<MovementDemoScreenProps> = ({
  movementType,
  jointName,
  onReady,
  onBack,
}) => {
  const [demoCount, setDemoCount] = useState(1);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const config = MOVEMENT_CONFIGS[movementType];

  // Animation value for arm rotation
  const armRotation = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start arm animation loop
    animateMovement();

    // Auto-increment demo counter
    const interval = setInterval(() => {
      setDemoCount((prev) => {
        if (prev < 3) {
          ReactNativeHapticFeedback.trigger('impactLight');
          return prev + 1;
        } else {
          setShowReadyButton(true);
          clearInterval(interval);
          // Start pulsing ready button
          Animated.loop(
            Animated.sequence([
              Animated.timing(buttonPulse, {
                toValue: 1.05,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(buttonPulse, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ).start();
          return prev;
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const animateMovement = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(armRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(armRotation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleWatchAgain = () => {
    if (demoCount < 3) {
      setDemoCount(demoCount + 1);
      ReactNativeHapticFeedback.trigger('impactLight');
    }
  };

  const handleReady = () => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    onReady();
  };

  // Calculate rotation based on movement type
  const getArmRotation = () => {
    const rotation = armRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', movementType === 'flexion' ? '-160deg' : movementType === 'abduction' ? '-90deg' : '0deg'],
    });
    return rotation;
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      {/* Progress dots */}
      <View style={styles.progressDots}>
        <Text style={[styles.dot, styles.dotActive]}>●</Text>
        <Text style={[styles.dot, styles.dotActive]}>●</Text>
        <Text style={[styles.dot, styles.dotActive]}>●</Text>
        <Text style={styles.dot}>○</Text>
      </View>

      {/* Back button */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Watch the Demo</Text>
        <Text style={styles.subtitle}>{config.description}</Text>
      </View>

      {/* Demo counter */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>Demo {demoCount} of 3</Text>
      </View>

      {/* Stick figure animation */}
      <View style={styles.demoArea}>
        <StickFigureAnimation
          movementType={movementType}
          armRotation={armRotation}
        />
      </View>

      {/* Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>💡 Tips for Best Results</Text>
        {config.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Text style={styles.tipCheck}>✓</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: showReadyButton ? buttonPulse : 1 }] }}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleReady}
            accessibilityLabel="I'm ready to try the movement"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>I'm Ready to Try</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleWatchAgain}
          accessibilityLabel="Watch the demonstration again"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>↻ Watch Again</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// Stick figure animation component
interface StickFigureAnimationProps {
  movementType: MovementType;
  armRotation: Animated.Value;
}

const StickFigureAnimation: React.FC<StickFigureAnimationProps> = ({
  movementType,
  armRotation,
}) => {
  const AnimatedG = Animated.createAnimatedComponent(G);

  const rotation = armRotation.interpolate({
    inputRange: [0, 1],
    outputRange: movementType === 'flexion'
      ? ['0deg', '-160deg']
      : movementType === 'abduction'
      ? ['0deg', '-90deg']
      : ['0deg', '-90deg'],
  });

  return (
    <Svg width={300} height={400} viewBox="0 0 300 400">
      {/* Head */}
      <Circle cx={150} cy={60} r={30} fill="#4CAF50" stroke="#fff" strokeWidth={3} />

      {/* Body */}
      <Line x1={150} y1={90} x2={150} y2={200} stroke="#fff" strokeWidth={6} strokeLinecap="round" />

      {/* Legs */}
      <Line x1={150} y1={200} x2={120} y2={300} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <Line x1={150} y1={200} x2={180} y2={300} stroke="#fff" strokeWidth={6} strokeLinecap="round" />

      {/* Feet */}
      <Circle cx={120} cy={300} r={8} fill="#4CAF50" />
      <Circle cx={180} cy={300} r={8} fill="#4CAF50" />

      {/* Animated arm (left) */}
      <AnimatedG
        origin="150, 120"
        rotation={rotation}
      >
        <Line x1={150} y1={120} x2={150} y2={220} stroke="#FFC107" strokeWidth={8} strokeLinecap="round" />
        <Circle cx={150} cy={220} r={10} fill="#FFC107" />
      </AnimatedG>

      {/* Stationary arm (right) */}
      <Line x1={150} y1={120} x2={200} y2={180} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <Circle cx={200} cy={180} r={8} fill="#fff" />

      {/* Movement arrow */}
      <Path
        d="M 140 240 Q 120 180 110 120"
        stroke="#4CAF50"
        strokeWidth={3}
        fill="none"
        strokeDasharray="5,5"
      />
    </Svg>
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
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  counterBadge: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 50,
    marginBottom: 20,
  },
  counterText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4CAF50',
  },
  demoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  tipsBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderRadius: 20,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFC107',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipCheck: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MovementDemoScreen;
