/**
 * My details: the name the app uses to greet you. One large field and one
 * clear Save button. When offline, the change is queued and a banner says so.
 */
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from '../store';
import { queueAction } from '../store/slices/networkSlice';
import { loginSuccess } from '../store/slices/userSlice';
import { AppText, Banner, BigButton, Card, Screen } from '../components/ui';
import { colors, radii, spacing, touch, typography } from '../theme';

type SaveStatus = 'idle' | 'saved' | 'queued' | 'empty';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const isConnected = useSelector((state: RootState) => state.network.isConnected);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed && currentUser) {
      setStatus('empty');
      return;
    }
    if (!isConnected) {
      // Queue the save action for when back online
      dispatch(queueAction({ type: 'profile/save', payload: { name: trimmed } }));
      setStatus('queued');
      return;
    }
    if (currentUser) {
      dispatch(loginSuccess({ ...currentUser, name: trimmed }));
    }
    setStatus('saved');
  };

  return (
    <Screen
      testID="profile-screen"
      footer={
        <BigButton
          label="Save"
          icon="check"
          onPress={handleSave}
          testID="profile-save"
          accessibilityHint="Saves your name"
        />
      }
    >
      <AppText variant="body" color={colors.textSecondary}>
        This is the name the app uses to greet you.
      </AppText>

      <Card style={styles.card}>
        <AppText variant="label" nativeID="profile-name-label">
          Your name
        </AppText>
        <TextInput
          style={[styles.input, focused && styles.inputFocused]}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (status !== 'idle') {
              setStatus('idle');
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="For example, Margaret"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          maxFontSizeMultiplier={1.6}
          accessibilityLabel="Your name"
          accessibilityLabelledBy="profile-name-label"
          testID="profile-name-input"
        />
        {status === 'empty' ? (
          <AppText variant="caption" color={colors.danger}>
            Please type your name before saving.
          </AppText>
        ) : null}

        {currentUser?.email ? (
          <View style={styles.readOnly}>
            <AppText variant="label">Email</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {currentUser.email}
            </AppText>
          </View>
        ) : null}
      </Card>

      {status === 'queued' ? (
        <Banner
          tone="warning"
          message="No internet connection. Your change will be saved when you are back online."
          testID="offline-queue-message"
        />
      ) : null}
      {status === 'saved' ? (
        <Banner
          tone="success"
          message={
            name.trim()
              ? `Saved. The app will call you ${name.trim().split(' ')[0]}.`
              : 'Saved.'
          }
          testID="profile-saved-message"
        />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  input: {
    ...typography.body,
    fontSize: 20,
    color: colors.text,
    minHeight: touch.primary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.primary },
  readOnly: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
});

export default ProfileScreen;
