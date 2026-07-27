// Design system centralisé pour GlowPass Merchant

export const Palette = {
  // Couleurs primaires (à personnaliser par env vars)
  primary: process.env.EXPO_PUBLIC_MERCHANT_PRIMARY_COLOR || '#6B2737',
  secondary: process.env.EXPO_PUBLIC_MERCHANT_SECONDARY_COLOR || '#C96A80',
  accent: process.env.EXPO_PUBLIC_MERCHANT_ACCENT_COLOR || '#D4AF37',

  // Neutres (fixes)
  background: '#FFFAF6',     // beige clair
  surface: '#FFFFFF',        // blanc
  card: '#F5ECE2',           // beige pâle
  border: '#ECE1D3',         // beige foncé

  // Texte
  text: '#2C1720',           // texte dark
  textMuted: '#8A6F6A',      // texte gris
  textLight: '#FFFFFF',      // texte blanc

  // État
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
};

export const Fonts = {
  italiana: {
    fontFamily: 'Italiana_400Regular',
    fontSize: 36,
    lineHeight: 44,
  },
  manrope: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  manropeMedium: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  manropeBold: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    lineHeight: 24,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 24,
  round: 999,
};

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Kit de couleurs pour cartes (dégradés)
export const CardKits = {
  rosewood: {
    gradient: ['#6B2737', '#4A1B46'],
    text: '#FFFFFF',
  },
  prune: {
    gradient: ['#4A1B46', '#2D1033'],
    text: '#FFFFFF',
  },
  rose: {
    gradient: ['#C96A80', '#B24D68'],
    text: '#FFFFFF',
  },
};

export const theme = {
  Palette,
  Fonts,
  Spacing,
  Radius,
  Shadows,
  CardKits,
};
