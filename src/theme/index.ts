/**
 * PhysioAssist design system.
 *
 * Built for patients who may be older or unfamiliar with apps:
 * - Large type (18pt body, 32pt titles) that still scales with the OS text size
 * - Touch targets of at least 56pt (64pt for primary actions)
 * - Text/background contrast of at least WCAG AA (most pairs are AAA)
 * - One calm primary colour for "do this", with colour never the only signal
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Brand: calm teal-blue for primary actions and selection
  primary: '#0B6E8F',
  primaryPressed: '#085873',
  primarySoft: '#E3F2F7',
  onPrimary: '#FFFFFF',

  // Warm accent for encouragement and highlights
  accent: '#F2994A',
  accentSoft: '#FDF0E4',

  // Surfaces
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F4',
  border: '#D9DEE4',

  // Text (all AA+ on background and surface)
  text: '#1B2430',
  textSecondary: '#4A5563',
  textMuted: '#5E6A77',
  textInverse: '#FFFFFF',

  // Status (paired with icons/text, never colour alone)
  success: '#17693F',
  successSoft: '#E4F4EB',
  warning: '#9A5B00',
  warningSoft: '#FFF3DC',
  danger: '#B42318',
  dangerSoft: '#FDECEA',

  // Camera screens (drawn over live video, so bright and with a soft shadow)
  cameraOverlay: 'rgba(12, 20, 28, 0.72)',
  skeleton: '#5CE1E6', // limbs the exercise measures
  poseLimb: 'rgba(255, 255, 255, 0.92)', // the rest of the body
  poseShadow: 'rgba(8, 16, 24, 0.45)', // under every line, for contrast on any background
  poseGood: '#4ADE80', // angle inside the goal range
  poseAdjust: '#FBBF24', // angle outside the goal range
  poseTarget: 'rgba(255, 255, 255, 0.34)', // goal-range gauge track
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** Minimum touch target sizes. */
export const touch = {
  min: 56,
  primary: 64,
} as const;

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  display: { fontFamily, fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title: { fontFamily, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontFamily, fontSize: 22, lineHeight: 28, fontWeight: '600' },
  body: { fontFamily, fontSize: 18, lineHeight: 26, fontWeight: '400' },
  bodyStrong: { fontFamily, fontSize: 18, lineHeight: 26, fontWeight: '600' },
  label: { fontFamily, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontFamily, fontSize: 15, lineHeight: 20, fontWeight: '400' },
  button: { fontFamily, fontSize: 20, lineHeight: 24, fontWeight: '600' },
  metric: { fontFamily, fontSize: 56, lineHeight: 64, fontWeight: '700' },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0B1F33',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 3 },
    default: { boxShadow: '0 4px 12px rgba(11, 31, 51, 0.08)' } as ViewStyle,
  }),
} as const;

export const theme = { colors, spacing, radii, touch, typography, shadows };
export type Theme = typeof theme;
