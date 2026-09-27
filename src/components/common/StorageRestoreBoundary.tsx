import React, { useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Persistor } from 'redux-persist';
import type { createReadRecovery } from '../../store/readRecovery';
import { colors, radii, spacing, touch, typography } from '../../theme';

type Props = {
  children: React.ReactNode;
  recovery: ReturnType<typeof createReadRecovery>;
  persistor: Pick<Persistor, 'subscribe' | 'getState'>;
};

/** No patient interaction against an empty or partly restored store. */
export default function StorageRestoreBoundary({ children, recovery, persistor }: Props) {
  const read = useSyncExternalStore(
    recovery.subscribe,
    recovery.getSnapshot,
    recovery.getSnapshot
  );
  const ready = useSyncExternalStore(
    persistor.subscribe,
    () => persistor.getState().bootstrapped,
    () => false
  );
  if (ready && read.status === 'ready') return <>{children}</>;
  const blocked = read.status === 'blocked';
  return (
    <ScrollView testID="storage-restore-screen" contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          {blocked
            ? 'Your saved progress could not be opened'
            : 'Opening your saved progress'}
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.body}>
          {blocked
            ? 'Recording is paused to avoid replacing saved information. Try opening it again.'
            : 'Please wait before starting or recording an exercise.'}
        </Text>
        {blocked ? (
          <>
            <Pressable
              testID="storage-retry"
              accessibilityRole="button"
              accessibilityLabel="Try opening saved progress again"
              onPress={() => {
                void recovery.retry();
              }}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
            <Text style={styles.body}>
              If this keeps happening, close and reopen the app. Do not delete or
              reinstall it to fix this: progress stored only on this device could be lost.
            </Text>
          </>
        ) : (
          <ActivityIndicator
            accessibilityLabel="Opening saved progress"
            color={colors.primary}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  card: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: spacing.lg },
  title: { ...typography.heading, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary },
  button: {
    minHeight: touch.primary,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  pressed: { backgroundColor: colors.primaryPressed },
  buttonText: { ...typography.button, color: colors.onPrimary },
});
