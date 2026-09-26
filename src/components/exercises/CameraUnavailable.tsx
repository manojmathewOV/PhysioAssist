/**
 * Friendly full-screen explanation when the camera can't be used (no camera,
 * permission denied, detector failed): an icon, a short explanation in plain
 * words and one clear main button.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppText, BigButton, Screen } from '../ui';
import { colors, spacing } from '../../theme';

interface Action {
  label: string;
  onPress: () => void;
  icon?: string;
  testID?: string;
}

interface CameraUnavailableProps {
  icon: string;
  title: string;
  message: string;
  primary: Action;
  secondary?: Action;
  testID?: string;
}

const CameraUnavailable: React.FC<CameraUnavailableProps> = ({
  icon,
  title,
  message,
  primary,
  secondary,
  testID,
}) => (
  <Screen
    testID={testID}
    footer={
      <>
        <BigButton {...primary} />
        {secondary ? <BigButton variant="ghost" {...secondary} /> : null}
      </>
    }
  >
    <View style={styles.body}>
      <View style={styles.icon}>
        <Icon name={icon} size={56} color={colors.primary} />
      </View>
      <AppText variant="title" center accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} center>
        {message}
      </AppText>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});

export default CameraUnavailable;
