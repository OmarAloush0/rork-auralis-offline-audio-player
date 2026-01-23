export const Colors = {
  dark: {
    background: '#0A0A0C',
    surface: '#121216',
    surfaceLight: '#1A1A1F',
    surfaceHighlight: '#252529',
    accent: '#E5A835',
    accentDim: '#B8862A',
    accentGlow: 'rgba(229, 168, 53, 0.15)',
    text: '#FFFFFF',
    textSecondary: '#9B9BA3',
    textTertiary: '#5A5A65',
    border: '#2A2A32',
    success: '#4CAF50',
    error: '#EF5350',
    warning: '#FF9800',
    gradient: {
      start: '#1A1A1F',
      end: '#0A0A0C',
    },
    visualizer: {
      primary: '#E5A835',
      secondary: '#FF6B35',
      tertiary: '#8B5CF6',
    },
  },
  light: {
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceLight: '#F0F0F2',
    surfaceHighlight: '#E8E8EC',
    accent: '#D4940F',
    accentDim: '#A87308',
    accentGlow: 'rgba(212, 148, 15, 0.15)',
    text: '#1A1A1F',
    textSecondary: '#6B6B75',
    textTertiary: '#9B9BA3',
    border: '#E0E0E5',
    success: '#4CAF50',
    error: '#EF5350',
    warning: '#FF9800',
    gradient: {
      start: '#FFFFFF',
      end: '#F5F5F7',
    },
    visualizer: {
      primary: '#D4940F',
      secondary: '#E85A2D',
      tertiary: '#7C4DFF',
    },
  },
};

export type ThemeColors = typeof Colors.dark;
