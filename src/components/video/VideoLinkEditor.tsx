/**
 * Add or change the YouTube link for an exercise video. Checks the link and
 * says plainly what's wrong; the physio usually fills this in.
 */
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, BigButton } from '../ui';
import { colors, radii, spacing, typography } from '../../theme';
import { parseYouTubeId } from '../../utils/youtube';

export const VideoLinkEditor: React.FC<{
  initial?: string;
  onSave: (link: string) => void;
  onCancel: () => void;
}> = ({ initial = '', onSave, onCancel }) => {
  const [link, setLink] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    if (!parseYouTubeId(link)) {
      setError(
        'That doesn’t look like a YouTube link. Copy it from the Share button on YouTube.'
      );
      return;
    }
    onSave(link.trim());
  };
  return (
    <View style={styles.editor} testID="video-link-editor">
      <AppText variant="bodyStrong" nativeID="video-link-label">
        YouTube link
      </AppText>
      <TextInput
        value={link}
        onChangeText={(text) => {
          setLink(text);
          setError(null);
        }}
        placeholder="https://youtu.be/…"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="done"
        onSubmitEditing={save}
        accessibilityLabel="YouTube link"
        accessibilityLabelledBy="video-link-label"
        style={[styles.input, error ? styles.inputError : null]}
        testID="video-link-input"
      />
      {error ? (
        <AppText variant="body" color={colors.danger} testID="video-link-error">
          {error}
        </AppText>
      ) : null}
      <BigButton
        label="Save video"
        icon="check"
        compact
        onPress={save}
        testID="video-link-save"
      />
      <BigButton
        variant="ghost"
        compact
        label="Cancel"
        onPress={onCancel}
        testID="video-link-cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  editor: { gap: spacing.sm },
  input: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.body?.fontSize ?? 18,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
});
