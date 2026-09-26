/**
 * Setup help: four illustrated steps for placing the phone and standing, written
 * for someone doing this for the first time.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, Banner, Card, Screen } from '../components/ui';
import { colors, radii, spacing } from '../theme';

const STEPS = [
  {
    icon: 'stay-current-portrait',
    title: 'Stand the phone up',
    text: 'Lean it against something steady at about waist height. Keep it upright.',
  },
  {
    icon: 'straighten',
    title: 'Step back about 2 metres',
    text: 'Your whole body, from head to feet, should fit on the screen.',
  },
  {
    icon: 'accessibility-new',
    title: 'Turn side-on for bending',
    text: 'For knee, hip and elbow bends, stand sideways to the phone. Face it for arm raises.',
  },
  {
    icon: 'wb-sunny',
    title: 'Use good light',
    text: 'Face a window or lamp. Avoid bright light behind you.',
  },
];

const HelpScreen: React.FC = () => (
  <Screen testID="help-screen" title="How to set up" subtitle="Takes about a minute">
    {STEPS.map((step, i) => (
      <Card key={step.title} style={styles.step}>
        <View style={styles.number}>
          <AppText variant="heading" color={colors.onPrimary}>
            {i + 1}
          </AppText>
        </View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Icon name={step.icon} size={28} color={colors.primary} />
            <AppText variant="heading" style={styles.flex}>
              {step.title}
            </AppText>
          </View>
          <AppText variant="body" color={colors.textSecondary}>
            {step.text}
          </AppText>
        </View>
      </Card>
    ))}
    <Banner
      tone="info"
      message="The app talks to you during exercises. Turn your volume up so you can hear it."
    />
  </Screen>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  number: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
});

export default HelpScreen;
