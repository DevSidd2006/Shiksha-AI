// Design System for Shiksha AI - Student-Focused UI (Indigo/Violet Theme)

export const Colors = {
  // Primary - Pro Indigo
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  primaryDark: '#4F46E5',
  primaryGradient: ['#6366F1', '#4F46E5'],

  // Secondary - Modern Violet
  secondary: '#8B5CF6',
  secondaryLight: '#F5F3FF',
  secondaryDark: '#7C3AED',
  secondaryGradient: ['#8B5CF6', '#7C3AED'],

  // Accent - Creative Pink/Rose (for highlights)
  accent: '#EC4899',
  accentLight: '#FDF2F8',
  accentDark: '#DB2777',
  accentGradient: ['#EC4899', '#DB2777'],

  // Success
  success: '#10B981',
  successLight: '#ECFDF5',
  successDark: '#059669',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningDark: '#D97706',

  // Error
  error: '#EF4444',
  errorLight: '#FEF2F2',
  errorDark: '#DC2626',

  // Neutral
  white: '#ffffff',
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
  textInverse: '#ffffff',

  // Background
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#FFFFFF',
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  }
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Fonts = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    fontFamily: Fonts.bold,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    fontFamily: Fonts.bold,
  },
  h3: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    fontFamily: Fonts.bold,
  },
  h4: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    fontFamily: Fonts.bold,
  },
  h5: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    fontFamily: Fonts.bold,
  },
  h6: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    fontFamily: Fonts.bold,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontFamily: Fonts.regular,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: Fonts.regular,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    fontFamily: Fonts.semibold,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const Transitions = {
  fast: 150,
  normal: 300,
  slow: 500,
};
