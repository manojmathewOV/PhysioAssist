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
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Import from centralized registry
import { MovementRegistry, JointType, MovementType } from '@config/movements.config';
import { AppText, BigButton, Card, Screen, SectionTitle } from '../ui';
import { colors, radii, spacing } from '../../theme';
import StepHeader from './StepHeader';

interface MovementDemoScreenProps {
  movementType: MovementType;
  jointName: string;
  onReady: () => void;
  onBack?: () => void;
}

const MovementDemoScreen: React.FC<MovementDemoScreenProps> = ({
  movementType,
  jointName,
  onReady,
  onBack,
}) => {
  const [demoCount, setDemoCount] = useState(1);
  const [showReadyButton, setShowReadyButton] = useState(false);

  // Get movement definition from registry
  const movementDef = MovementRegistry.getMovementsByJoint(jointName as JointType).find(
    (m) => m.type === movementType
  );

  // Animation value for arm rotation
  // (hooks must run unconditionally, before any early return)
  const armRotation = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Nothing to demo if the movement is unknown (component renders null below)
    if (!movementDef) {
      return undefined;
    }

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

  if (!movementDef) {
    console.error(`Movement definition not found for ${jointName} - ${movementType}`);
    return null;
  }

  return (
    <Screen
      testID="movement-demo"
      footer={
        <>
          <Animated.View
            style={{ transform: [{ scale: showReadyButton ? buttonPulse : 1 }] }}
          >
            <BigButton
              label="I'm ready to try"
              icon="play-arrow"
              onPress={handleReady}
              accessibilityHint="Starts the camera so you can do the movement"
            />
          </Animated.View>
          <BigButton
            label="Watch again"
            icon="replay"
            variant="secondary"
            onPress={handleWatchAgain}
            accessibilityHint="Plays the demonstration again"
          />
        </>
      }
    >
      <StepHeader
        step={3}
        totalSteps={4}
        title="Watch the demo"
        subtitle={movementDef.description.simple}
        onBack={onBack}
      />

      {/* Stick figure animation */}
      <Card style={styles.demoCard}>
        <View style={styles.counterBadge} accessibilityLiveRegion="polite">
          <Icon name="ondemand-video" size={22} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            Demo {demoCount} of 3
          </AppText>
        </View>
        <View
          style={styles.demoArea}
          accessible
          accessibilityLabel={`Animated figure showing ${movementDef.description.simple}`}
        >
          <StickFigureAnimation movementType={movementType} armRotation={armRotation} />
        </View>
      </Card>

      {/* Tips */}
      <SectionTitle>Tips for best results</SectionTitle>
      <Card>
        {movementDef.tips.simple.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Icon name="check-circle" size={24} color={colors.success} />
            <AppText variant="body" style={styles.flex}>
              {tip}
            </AppText>
          </View>
        ))}
      </Card>
    </Screen>
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
    outputRange:
      movementType === 'flexion'
        ? ['0deg', '-160deg']
        : movementType === 'abduction'
          ? ['0deg', '-90deg']
          : ['0deg', '-90deg'],
  });

  return (
    <Svg width={240} height={256} viewBox="0 0 300 320">
      {/* Head */}
      <Circle cx={150} cy={60} r={30} fill={colors.primary} />

      {/* Body */}
      <Line
        x1={150}
        y1={90}
        x2={150}
        y2={200}
        stroke={colors.text}
        strokeWidth={6}
        strokeLinecap="round"
      />

      {/* Legs */}
      <Line
        x1={150}
        y1={200}
        x2={120}
        y2={300}
        stroke={colors.text}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Line
        x1={150}
        y1={200}
        x2={180}
        y2={300}
        stroke={colors.text}
        strokeWidth={6}
        strokeLinecap="round"
      />

      {/* Feet */}
      <Circle cx={120} cy={300} r={8} fill={colors.primary} />
      <Circle cx={180} cy={300} r={8} fill={colors.primary} />

      {/* Animated arm (left) */}
      <AnimatedG origin="150, 120" rotation={rotation}>
        <Line
          x1={150}
          y1={120}
          x2={150}
          y2={220}
          stroke={colors.accent}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <Circle cx={150} cy={220} r={10} fill={colors.accent} />
      </AnimatedG>

      {/* Stationary arm (right) */}
      <Line
        x1={150}
        y1={120}
        x2={200}
        y2={180}
        stroke={colors.text}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Circle cx={200} cy={180} r={8} fill={colors.text} />

      {/* Movement arrow */}
      <Path
        d="M 140 240 Q 120 180 110 120"
        stroke={colors.primary}
        strokeWidth={3}
        fill="none"
        strokeDasharray="5,5"
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  demoCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  demoArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});

export default MovementDemoScreen;
