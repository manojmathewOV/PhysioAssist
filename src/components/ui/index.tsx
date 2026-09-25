/**
 * Shared UI building blocks. Screens compose these instead of styling raw
 * View/Text/TouchableOpacity, so every screen gets the same large type, generous
 * touch targets, contrast and screen-reader labels.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  colors,
  radii,
  shadows,
  spacing,
  touch,
  typography,
  TypographyVariant,
} from '../../theme';

type IconName = string;

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = colors.text,
  center,
  style,
  ...rest
}) => (
  <Text
    // Respect the user's OS text size, but cap it so layouts don't break
    maxFontSizeMultiplier={1.6}
    style={[typography[variant], { color }, center && styles.center, style]}
    {...rest}
  />
);

// ---------------------------------------------------------------------------
// Screen scaffold
// ---------------------------------------------------------------------------

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  testID?: string;
  /** Content pinned below the scroll area (e.g. the main action). */
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const Screen: React.FC<ScreenProps> = ({
  title,
  subtitle,
  children,
  scroll = true,
  testID,
  footer,
  headerRight,
}) => {
  const header = title ? (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {headerRight}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, styles.flex]}>
          {header}
          {children}
        </View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface BigButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

const buttonColors: Record<
  ButtonVariant,
  { bg: string; pressed: string; fg: string; border?: string }
> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary },
  secondary: {
    bg: colors.surface,
    pressed: colors.primarySoft,
    fg: colors.primary,
    border: colors.primary,
  },
  danger: { bg: colors.danger, pressed: '#8F1B12', fg: colors.textInverse },
  ghost: { bg: 'transparent', pressed: colors.primarySoft, fg: colors.primary },
};

export const BigButton: React.FC<BigButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  testID,
  accessibilityHint,
  style,
  compact,
}) => {
  const palette = buttonColors[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border ?? 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? (
            <Icon name={icon} size={26} color={palette.fg} style={styles.buttonIcon} />
          ) : null}
          <AppText variant="button" color={palette.fg}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export const Card: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}> = ({ children, style, testID }) => (
  <View style={[styles.card, style]} testID={testID}>
    {children}
  </View>
);

export interface ActionTileProps {
  icon: IconName;
  title: string;
  description?: string;
  onPress: () => void;
  tone?: 'primary' | 'neutral' | 'accent';
  testID?: string;
}

/** A large, full-width tappable card: icon, title and one line of explanation. */
export const ActionTile: React.FC<ActionTileProps> = ({
  icon,
  title,
  description,
  onPress,
  tone = 'neutral',
  testID,
}) => {
  const isPrimary = tone === 'primary';
  const iconBg = isPrimary
    ? 'rgba(255,255,255,0.18)'
    : tone === 'accent'
      ? colors.accentSoft
      : colors.primarySoft;
  const iconColor = isPrimary
    ? colors.onPrimary
    : tone === 'accent'
      ? colors.warning
      : colors.primary;
  const fg = isPrimary ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => [
        styles.tile,
        isPrimary ? styles.tilePrimary : styles.card,
        pressed &&
          (isPrimary ? { backgroundColor: colors.primaryPressed } : styles.tilePressed),
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={32} color={iconColor} />
      </View>
      <View style={styles.flex}>
        <AppText variant="heading" color={fg}>
          {title}
        </AppText>
        {description ? (
          <AppText
            variant="body"
            color={isPrimary ? colors.primarySoft : colors.textSecondary}
          >
            {description}
          </AppText>
        ) : null}
      </View>
      <Icon
        name="chevron-right"
        size={32}
        color={isPrimary ? colors.onPrimary : colors.textMuted}
      />
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Lists and settings
// ---------------------------------------------------------------------------

export const SectionTitle: React.FC<{ children: string }> = ({ children }) => (
  <AppText
    variant="label"
    color={colors.textSecondary}
    style={styles.sectionTitle}
    accessibilityRole="header"
  >
    {children.toUpperCase()}
  </AppText>
);

export interface ListRowProps {
  icon?: IconName;
  title: string;
  description?: string;
  onPress?: () => void;
  /** Renders a large switch instead of a chevron. */
  toggle?: { value: boolean; onChange: (value: boolean) => void; testID?: string };
  right?: React.ReactNode;
  testID?: string;
  last?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  icon,
  title,
  description,
  onPress,
  toggle,
  right,
  testID,
  last,
}) => {
  const content = (
    <>
      {icon ? (
        <View style={styles.rowIcon}>
          <Icon name={icon} size={26} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          testID={toggle.testID}
          accessibilityLabel={title}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          style={styles.switch}
        />
      ) : (
        right ??
        (onPress ? (
          <Icon name="chevron-right" size={28} color={colors.textMuted} />
        ) : null)
      )}
    </>
  );

  const rowStyle = [styles.row, !last && styles.rowDivider];
  if (onPress && !toggle) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [rowStyle, pressed && styles.rowPressed]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={rowStyle} testID={testID} accessible={!toggle}>
      {content}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

const bannerPalette: Record<BannerTone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: colors.primarySoft, fg: colors.primary, icon: 'info-outline' },
  success: { bg: colors.successSoft, fg: colors.success, icon: 'check-circle' },
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning-amber' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'error-outline' },
};

/** Inline message with icon + text (never colour alone). */
export const Banner: React.FC<{
  tone?: BannerTone;
  message: string;
  testID?: string;
}> = ({ tone = 'info', message, testID }) => {
  const p = bannerPalette[tone];
  return (
    <View
      style={[styles.banner, { backgroundColor: p.bg }]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name={p.icon} size={26} color={p.fg} />
      <AppText variant="bodyStrong" color={p.fg} style={styles.flex}>
        {message}
      </AppText>
    </View>
  );
};

/** Big number with a label, e.g. reps done or angle reached. */
export const Metric: React.FC<{
  value: string;
  label: string;
  testID?: string;
  color?: string;
  /** Label colour, e.g. a light colour on camera overlay panels. */
  labelColor?: string;
}> = ({
  value,
  label,
  testID,
  color = colors.text,
  labelColor = colors.textSecondary,
}) => (
  <View
    style={styles.metric}
    accessible
    accessibilityLabel={`${label}: ${value}`}
    testID={testID}
  >
    <AppText variant="metric" color={color}>
      {value}
    </AppText>
    <AppText variant="label" color={labelColor}>
      {label}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  headerText: { flex: 1 },
  subtitle: { marginTop: spacing.xs },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  button: {
    minHeight: touch.primary,
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: touch.min, paddingHorizontal: spacing.md },
  buttonIcon: { marginRight: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 96,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  tilePrimary: { backgroundColor: colors.primary, ...shadows.card },
  tilePressed: { backgroundColor: colors.primarySoft },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { marginTop: spacing.md, marginLeft: spacing.xs, letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  metric: { alignItems: 'center' },
});
