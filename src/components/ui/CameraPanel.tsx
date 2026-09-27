/**
 * Dark translucent panel for controls and text drawn over the camera image
 * (see "Camera screens" in docs/design/DESIGN_SYSTEM.md).
 */
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, spacing } from '../../theme';

export const CameraPanel: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}> = ({ children, style, testID }) => (
  <View style={[styles.panel, style]} testID={testID}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.cameraOverlay,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
});

export default CameraPanel;
