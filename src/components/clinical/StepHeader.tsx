/**
 * Header for each step of the guided assessment: an optional Back button,
 * an optional Help button, "Step X of Y" and the step's question.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BigButton } from '../ui';
import { colors, spacing } from '../../theme';
import ProgressIndicator from './ProgressIndicator';

interface StepHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onHelp?: () => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  onHelp,
}) => (
  <View style={styles.container}>
    {onBack || onHelp ? (
      <View style={styles.nav}>
        {onBack ? (
          <BigButton
            label="Back"
            icon="arrow-back"
            variant="ghost"
            compact
            onPress={onBack}
            accessibilityHint="Go back to the previous step"
            style={styles.navButton}
          />
        ) : (
          <View />
        )}
        {onHelp ? (
          <BigButton
            label="Help"
            icon="help-outline"
            variant="ghost"
            compact
            onPress={onHelp}
            accessibilityHint="Explains how to use this screen"
            style={styles.navButton}
          />
        ) : null}
      </View>
    ) : null}
    <ProgressIndicator currentStep={step} totalSteps={totalSteps} />
    <View>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: spacing.md, marginBottom: spacing.sm },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -spacing.md,
  },
  navButton: { alignSelf: 'flex-start' },
  subtitle: { marginTop: spacing.xs },
});

export default StepHeader;
