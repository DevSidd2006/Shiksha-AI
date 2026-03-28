// ─────────────────────────────────────────────────────────────────────────────
// Shiksha AI — Design System v2
// Inspired by Duolingo / Khan Academy / Photomath
// Consistent, vibrant, student-friendly
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // Primary — Electric Indigo
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  primaryDark: '#4F46E5',
  primaryGradient: ['#818CF8', '#6366F1'] as [string, string],

  // Secondary — Vivid Violet
  secondary: '#8B5CF6',
  secondaryLight: '#F5F3FF',
  secondaryDark: '#7C3AED',
  secondaryGradient: ['#A78BFA', '#8B5CF6'] as [string, string],

  // Accent — Coral/Amber (gamification)
  accent: '#F59E0B',
  accentLight: '#FFFBEB',
  accentDark: '#D97706',

  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  successDark: '#059669',

  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningDark: '#D97706',

  error: '#EF4444',
  errorLight: '#FEF2F2',
  errorDark: '#DC2626',

  // Neutral scale
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Backgrounds
  background: '#F4F6FB',
  surface: '#FFFFFF',
};

// ── Consistent dual-theme palette (used by every screen) ──────────────────────
export interface AppTheme {
  surface: string;
  panel: string;
  panelSoft: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;           // Text that sits on top of accent bg
  headerGradient: [string, string];
  cardGradient: [string, string];
  chipBg: string;
  buttonBg: string;
  buttonText: string;
  tagSuccess: string;
  tagSuccessText: string;
  tagWarning: string;
  tagWarningText: string;
  tagError: string;
  tagErrorText: string;
  badgeBg: string;
  badgeText: string;
}

export const DARK_THEME: AppTheme = {
  surface:       '#06070B',
  panel:         '#0F1320',
  panelSoft:     '#161C2C',
  border:        'rgba(255,255,255,0.09)',
  text:          '#F0F4FF',
  textMuted:     '#8A9BB5',
  accent:        '#818CF8',        // Soft indigo on dark
  accentText:    '#FFFFFF',
  headerGradient: ['#0D1025', '#0F1320'],
  cardGradient:   ['#141828', '#0F1320'],
  chipBg:        '#1C2540',
  buttonBg:      '#818CF8',
  buttonText:    '#FFFFFF',
  tagSuccess:    'rgba(16,185,129,0.18)',
  tagSuccessText: '#34D399',
  tagWarning:    'rgba(245,158,11,0.18)',
  tagWarningText: '#FBBF24',
  tagError:      'rgba(239,68,68,0.18)',
  tagErrorText:  '#F87171',
  badgeBg:       '#1C2540',
  badgeText:     '#A5B4FC',
};

export const LIGHT_THEME: AppTheme = {
  surface:       '#F4F6FB',
  panel:         '#FFFFFF',
  panelSoft:     '#ECF0FA',
  border:        'rgba(10,14,40,0.09)',
  text:          '#0D1025',
  textMuted:     '#657085',
  accent:        '#6366F1',        // Full indigo on light
  accentText:    '#FFFFFF',
  headerGradient: ['#EEF2FF', '#FFFFFF'],
  cardGradient:   ['#FFFFFF', '#F0F4FF'],
  chipBg:        '#E5E9FF',
  buttonBg:      '#6366F1',
  buttonText:    '#FFFFFF',
  tagSuccess:    '#D1FAE5',
  tagSuccessText: '#065F46',
  tagWarning:    '#FEF3C7',
  tagWarningText: '#92400E',
  tagError:      '#FEE2E2',
  tagErrorText:  '#991B1B',
  badgeBg:       '#EEF2FF',
  badgeText:     '#4338CA',
};

// ── Spacing ───────────────────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

// ── Border Radius ─────────────────────────────────────────────────────────────
export const BorderRadius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 9999,
};

// ── Fonts ─────────────────────────────────────────────────────────────────────
export const Fonts = {
  regular:  'System',
  medium:   'System',
  semibold: 'System',
  bold:     'System',
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
};

// ── Typography ────────────────────────────────────────────────────────────────
export const Typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40 },
  h2: { fontSize: 26, fontWeight: '800' as const, lineHeight: 34 },
  h3: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h4: { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },
  h5: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '700' as const, lineHeight: 16, letterSpacing: 0.6 },
};

export const Transitions = {
  fast:   150,
  normal: 300,
  slow:   500,
};
