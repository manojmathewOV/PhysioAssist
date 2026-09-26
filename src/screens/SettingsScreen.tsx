/**
 * Settings, written for patients: a few plain-language switches, a big
 * three-way choice for speaking speed, and the technical options tucked away
 * under "Advanced" for the physiotherapist. Every change is saved straight away.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import type { RootState } from '../store';
import { resetSettings, updateSettings } from '../store/slices/settingsSlice';
import { logout } from '../store/slices/userSlice';
import { AccessibilityIds } from '../constants/accessibility';
import StepSlider from '../components/common/StepSlider';
import { audioFeedbackService, FeedbackConfig } from '../services/audioFeedbackService';
import {
  AppText,
  BigButton,
  Card,
  ListRow,
  Screen,
  SectionTitle,
} from '../components/ui';
import { colors, radii, shadows, spacing, touch } from '../theme';
import type { MainTabParamList, SettingsStackParamList } from '../navigation/types';

type SettingsState = RootState['settings'];
type BooleanSettingKey = {
  [K in keyof SettingsState]: SettingsState[K] extends boolean ? K : never;
}[keyof SettingsState];

type Navigation = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

/** Settings toggles that map onto the live audio/haptic feedback service config. */
const AUDIO_CONFIG_KEYS: Partial<Record<BooleanSettingKey, keyof FeedbackConfig>> = {
  enableSound: 'enableSound',
  enableHaptics: 'enableHaptics',
  enableSpeech: 'enableSpeech',
  voiceInstructionsEnabled: 'enableSpeech',
};

/**
 * Speaking speed. `settings.speechRate` is a multiple of normal speed (1.0);
 * the text-to-speech engine's own "normal" rate is 0.5.
 */
const SPEEDS = [
  { label: 'Slower', value: 0.75, testID: 'settings-speech-rate-slower' },
  { label: 'Normal', value: 1.0, testID: 'settings-speech-rate-normal' },
  { label: 'Faster', value: 1.25, testID: 'settings-speech-rate-faster' },
] as const;
const TTS_NORMAL_RATE = 0.5;

const closestSpeed = (rate: number) =>
  SPEEDS.reduce((best, s) =>
    Math.abs(s.value - rate) < Math.abs(best.value - rate) ? s : best
  );

const SAVED_TOAST_MS = 2000;

/** Push a change to the running feedback service; a failure must not block the UI. */
const applyAudioConfig = (config: Partial<FeedbackConfig>) => {
  try {
    audioFeedbackService.updateConfig(config);
  } catch (error) {
    console.warn('Could not apply audio settings', error);
  }
};

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<Navigation>();
  const settings = useSelector((state: RootState) => state.settings);
  const userName = useSelector((state: RootState) => state.user.currentUser?.name);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (savedTimer.current) {
        clearTimeout(savedTimer.current);
      }
    },
    []
  );

  /** Reassure the user that the change stuck (there is no Save button). */
  const confirmSaved = () => {
    setShowSaved(true);
    if (savedTimer.current) {
      clearTimeout(savedTimer.current);
    }
    savedTimer.current = setTimeout(() => setShowSaved(false), SAVED_TOAST_MS);
  };

  const handleToggleSetting = (key: BooleanSettingKey, value: boolean) => {
    dispatch(updateSettings({ [key]: value }));

    // Apply feedback settings to the running service immediately
    const audioKey = AUDIO_CONFIG_KEYS[key];
    if (audioKey) {
      applyAudioConfig({ [audioKey]: value });
    }
    confirmSaved();
  };

  const handleSpeedChange = (value: number) => {
    dispatch(updateSettings({ speechRate: value }));
    applyAudioConfig({ speechRate: value * TTS_NORMAL_RATE });
    confirmSaved();
  };

  const handleHighPerformance = (value: boolean) => {
    // Same rule as the toggleHighPerformanceMode reducer: every frame when on
    dispatch(updateSettings({ highPerformanceMode: value, frameSkip: value ? 1 : 3 }));
    confirmSaved();
  };

  // Frame skip flows through Redux into useBlazePose, so the store is all we update
  const handleFrameSkipComplete = (value: number) => {
    dispatch(updateSettings({ frameSkip: value }));
    confirmSaved();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset all settings?',
      'Everything on this page goes back to how it was when you first installed the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            dispatch(resetSettings());
            // Keep running services in sync with the restored defaults
            applyAudioConfig({
              enableSound: true,
              enableHaptics: true,
              enableSpeech: true,
              speechRate: TTS_NORMAL_RATE,
            });
            confirmSaved();
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const selectedSpeed = closestSpeed(settings.speechRate || 1.0).value;

  return (
    <View style={styles.flex}>
      <Screen
        testID={AccessibilityIds.settings.screen}
        title="Settings"
        subtitle="Changes are saved straight away."
      >
        <SectionTitle>You</SectionTitle>
        <Card style={styles.listCard}>
          <ListRow
            icon="person-outline"
            title="My details"
            description={userName || 'Your name'}
            onPress={() => navigation.navigate('Profile')}
            testID="settings-my-details"
          />
          <ListRow
            icon="help-outline"
            title="How to set up"
            description="Where to put your phone and how to stand"
            onPress={() => navigation.navigate('HomeTab', { screen: 'Help' })}
            testID="settings-help"
            last
          />
        </Card>

        <SectionTitle>Sound and touch</SectionTitle>
        <Card style={styles.listCard}>
          <ListRow
            icon="record-voice-over"
            title="Voice guidance"
            description="The app tells you what to do"
            toggle={{
              value: settings.voiceInstructionsEnabled,
              onChange: (v) => handleToggleSetting('voiceInstructionsEnabled', v),
              testID: 'voice-instructions-toggle',
            }}
          />
          <ListRow
            icon="volume-up"
            title="Sounds"
            description="A short sound for each repetition"
            toggle={{
              value: settings.enableSound !== false,
              onChange: (v) => handleToggleSetting('enableSound', v),
              testID: AccessibilityIds.settings.soundToggle,
            }}
          />
          <ListRow
            icon="vibration"
            title="Vibration"
            description="The phone buzzes gently"
            toggle={{
              value: settings.enableHaptics !== false,
              onChange: (v) => handleToggleSetting('enableHaptics', v),
              testID: AccessibilityIds.settings.hapticToggle,
            }}
          />
          <View style={styles.speedBlock}>
            <View style={styles.speedHeading}>
              <View style={styles.rowIcon}>
                <Icon name="speed" size={26} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">Speaking speed</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  How fast the voice talks
                </AppText>
              </View>
            </View>
            <View
              style={styles.segmented}
              accessibilityRole="radiogroup"
              accessibilityLabel="Speaking speed"
              testID={AccessibilityIds.settings.speechRateSlider}
            >
              {SPEEDS.map((speed) => {
                const selected = speed.value === selectedSpeed;
                return (
                  <Pressable
                    key={speed.label}
                    onPress={() => !selected && handleSpeedChange(speed.value)}
                    testID={speed.testID}
                    accessibilityRole="radio"
                    accessibilityLabel={`${speed.label} speaking speed`}
                    accessibilityState={{ checked: selected, selected }}
                    // Web: react-native-web doesn't turn the checked state into aria-checked
                    aria-checked={selected}
                    style={({ pressed }) => [
                      styles.segment,
                      selected && styles.segmentSelected,
                      pressed && !selected && styles.segmentPressed,
                    ]}
                  >
                    {selected ? (
                      <Icon
                        name="check"
                        size={22}
                        color={colors.onPrimary}
                        style={styles.segmentCheck}
                      />
                    ) : null}
                    <AppText
                      variant="label"
                      color={selected ? colors.onPrimary : colors.text}
                    >
                      {speed.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        <SectionTitle>Display</SectionTitle>
        <Card style={styles.listCard}>
          <ListRow
            icon="accessibility-new"
            title="Show my skeleton on camera"
            description="Lines on your body show what the app can see"
            toggle={{
              value: settings.showPoseOverlay,
              onChange: (v) => handleToggleSetting('showPoseOverlay', v),
              testID: 'show-overlay-toggle',
            }}
          />
          <ListRow
            icon="architecture"
            title="Show joint angles"
            description="Numbers show how far each joint bends"
            toggle={{
              value: settings.showJointAngles,
              onChange: (v) => handleToggleSetting('showJointAngles', v),
              testID: 'show-angles-toggle',
            }}
            last
          />
        </Card>

        <SectionTitle>Advanced</SectionTitle>
        <Card style={styles.listCard} testID="settings-advanced">
          <Pressable
            onPress={() => setShowAdvanced((v) => !v)}
            testID="settings-advanced-toggle"
            accessibilityRole="button"
            accessibilityLabel="Advanced settings, for your physiotherapist"
            accessibilityHint={
              showAdvanced ? 'Hides these settings' : 'Shows more settings'
            }
            accessibilityState={{ expanded: showAdvanced }}
            style={({ pressed }) => [
              styles.advancedHeader,
              showAdvanced && styles.divider,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.rowIcon, styles.rowIconMuted]}>
              <Icon name="tune" size={26} color={colors.textSecondary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">
                {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                For your physiotherapist
              </AppText>
            </View>
            <Icon
              name={showAdvanced ? 'expand-less' : 'expand-more'}
              size={32}
              color={colors.textMuted}
            />
          </Pressable>

          {showAdvanced ? (
            <View testID="settings-advanced-content">
              <ListRow
                icon="bolt"
                title="High performance mode"
                description="Checks every camera frame. Uses more battery."
                toggle={{
                  value: settings.highPerformanceMode,
                  onChange: handleHighPerformance,
                  testID: 'high-performance-toggle',
                }}
              />
              <View style={[styles.frameSkipBlock, styles.divider]}>
                <AppText variant="bodyStrong">Frames to skip</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Lower is more accurate. Higher saves battery on older phones.
                </AppText>
                <StepSlider
                  testID={AccessibilityIds.settings.frameSkipSlider}
                  accessibilityLabel="Frames to skip"
                  style={styles.stepper}
                  value={settings.frameSkip || 3}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  formatValue={(v) => (v === 1 ? 'Every frame' : `1 in ${v} frames`)}
                  onSlidingComplete={handleFrameSkipComplete}
                />
              </View>
              <View style={styles.resetBlock}>
                <BigButton
                  label="Reset all settings"
                  icon="restore"
                  variant="ghost"
                  compact
                  onPress={handleReset}
                  testID={AccessibilityIds.settings.resetButton}
                  accessibilityHint="Asks before changing anything"
                />
              </View>
            </View>
          ) : null}
        </Card>

        <BigButton
          label="Sign out"
          icon="logout"
          variant="secondary"
          onPress={handleSignOut}
          testID="settings-sign-out"
          accessibilityHint="Asks before signing you out"
          style={styles.signOut}
        />
      </Screen>

      {showSaved ? (
        <View
          style={styles.toast}
          pointerEvents="none"
          testID={AccessibilityIds.common.toastMessage}
          accessibilityLiveRegion="polite"
        >
          <Icon name="check-circle" size={24} color={colors.onPrimary} />
          <AppText variant="bodyStrong" color={colors.onPrimary}>
            Saved
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listCard: { paddingVertical: spacing.xs },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconMuted: { backgroundColor: colors.surfaceMuted },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  speedBlock: { paddingVertical: spacing.md, gap: spacing.md },
  speedHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: touch.min,
    borderRadius: radii.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  segmentSelected: { backgroundColor: colors.primary, ...shadows.card },
  segmentPressed: { backgroundColor: colors.border },
  segmentCheck: { marginRight: 2 },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.sm,
  },
  frameSkipBlock: { paddingVertical: spacing.md, gap: spacing.xs },
  stepper: { marginTop: spacing.sm },
  resetBlock: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  signOut: { marginTop: spacing.lg },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touch.min,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    ...shadows.card,
  },
});

export default SettingsScreen;
