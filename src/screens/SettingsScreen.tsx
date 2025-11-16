import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { updateSettings, resetSettings } from '@store/slices/settingsSlice';
import { AccessibilityIds } from '../constants/accessibility';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const [showToast, setShowToast] = useState(false);
  const [speechRate, setSpeechRate] = useState(settings.speechRate || 1.0);
  const [frameSkip, setFrameSkip] = useState(settings.frameSkip || 3);

  const handleToggleSetting = (key: keyof typeof settings, value: boolean) => {
    dispatch(updateSettings({ [key]: value }));
  };

  const handleSave = () => {
    dispatch(
      updateSettings({
        speechRate,
        frameSkip,
      })
    );
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            dispatch(resetSettings());
            setSpeechRate(1.0);
            setFrameSkip(3);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} testID={AccessibilityIds.settings.screen}>
      {/* Toast message */}
      {showToast && (
        <View style={styles.toast} testID={AccessibilityIds.common.toastMessage}>
          <Text style={styles.toastText}>Settings saved successfully!</Text>
        </View>
      )}

      {/* Audio Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Sound</Text>
          <Switch
            testID={AccessibilityIds.settings.soundToggle}
            accessible={true}
            accessibilityLabel="Enable sound"
            accessibilityHint="Enable or disable all sound feedback"
            accessibilityRole="switch"
            value={settings.enableSound !== false}
            onValueChange={(value) => handleToggleSetting('enableSound', value)}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Haptic Feedback</Text>
          <Switch
            testID={AccessibilityIds.settings.hapticToggle}
            accessible={true}
            accessibilityLabel="Haptic feedback"
            accessibilityHint="Enable or disable vibration feedback"
            accessibilityRole="switch"
            value={settings.enableHaptics !== false}
            onValueChange={(value) => handleToggleSetting('enableHaptics', value)}
          />
        </View>

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

        <View style={styles.sliderRow}>
          <Text style={styles.settingLabel}>Speech Rate: {speechRate.toFixed(1)}x</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>0.5x</Text>
            <View
              testID={AccessibilityIds.settings.speechRateSlider}
              accessible={true}
              accessibilityLabel="Speech rate"
              accessibilityRole="adjustable"
              style={styles.slider}
            >
              <Text>{speechRate.toFixed(1)}x</Text>
            </View>
            <Text style={styles.sliderLabel}>2.0x</Text>
          </View>
        </View>
      </View>

      {/* Visual Settings */}
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

      {/* Performance */}
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

        <View style={styles.sliderRow}>
          <Text style={styles.settingLabel}>Frame Skip: {frameSkip}</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>1</Text>
            <View
              testID={AccessibilityIds.settings.frameSkipSlider}
              accessible={true}
              accessibilityLabel="Frame skip"
              accessibilityRole="adjustable"
              style={styles.slider}
            >
              <Text>{frameSkip}</Text>
            </View>
            <Text style={styles.sliderLabel}>10</Text>
          </View>
        </View>
      </View>

      {/* Accessibility */}
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

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          testID={AccessibilityIds.settings.saveButton}
          accessible={true}
          accessibilityLabel="Save settings"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Save Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
          testID={AccessibilityIds.settings.resetButton}
          accessible={true}
          accessibilityLabel="Reset settings"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  toast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
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
  sliderRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
