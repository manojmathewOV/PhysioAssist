import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { updateSettings } from '@store/slices/settingsSlice';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  const handleToggleSetting = (key: keyof typeof settings, value: boolean) => {
    dispatch(updateSettings({ [key]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Voice Instructions</Text>
          <Switch
            testID="voice-instructions-toggle"
            accessible={true}
            accessibilityLabel="Voice instructions"
            accessibilityHint="Enable or disable voice instructions during exercises"
            accessibilityRole="switch"
            value={settings.voiceInstructionsEnabled}
            onValueChange={(value) =>
              handleToggleSetting('voiceInstructionsEnabled', value)
            }
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound Effects</Text>
          <Switch
            testID="sound-effects-toggle"
            accessible={true}
            accessibilityLabel="Sound effects"
            accessibilityHint="Enable or disable sound effects for exercise feedback"
            accessibilityRole="switch"
            value={settings.soundEffectsEnabled}
            onValueChange={(value) => handleToggleSetting('soundEffectsEnabled', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visual Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show Joint Angles</Text>
          <Switch
            testID="show-angles-toggle"
            accessible={true}
            accessibilityLabel="Show joint angles"
            accessibilityHint="Display real-time joint angle measurements during exercises"
            accessibilityRole="switch"
            value={settings.showJointAngles}
            onValueChange={(value) => handleToggleSetting('showJointAngles', value)}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show Pose Overlay</Text>
          <Switch
            testID="show-overlay-toggle"
            accessible={true}
            accessibilityLabel="Show pose overlay"
            accessibilityHint="Display visual skeleton overlay on camera feed"
            accessibilityRole="switch"
            value={settings.showPoseOverlay}
            onValueChange={(value) => handleToggleSetting('showPoseOverlay', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>High Performance Mode</Text>
          <Switch
            testID="high-performance-toggle"
            accessible={true}
            accessibilityLabel="High performance mode"
            accessibilityHint="Process every frame for maximum accuracy, uses more battery"
            accessibilityRole="switch"
            value={settings.highPerformanceMode}
            onValueChange={(value) => handleToggleSetting('highPerformanceMode', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Reduced Motion</Text>
          <Switch
            testID="reduced-motion-toggle"
            accessible={true}
            accessibilityLabel="Reduced motion"
            accessibilityHint="Minimize animations and transitions for better accessibility"
            accessibilityRole="switch"
            value={settings.reducedMotion}
            onValueChange={(value) => handleToggleSetting('reducedMotion', value)}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>High Contrast</Text>
          <Switch
            testID="high-contrast-toggle"
            accessible={true}
            accessibilityLabel="High contrast"
            accessibilityHint="Increase contrast for better visibility"
            accessibilityRole="switch"
            value={settings.highContrast}
            onValueChange={(value) => handleToggleSetting('highContrast', value)}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default SettingsScreen;
