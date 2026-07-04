/**
 * 万古长夜 - 主题系统
 * 国风水墨风格配色方案
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 间距系统
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// 圆角系统
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

// 主题类型
export interface Theme {
  // 背景色
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundTertiary: string;
  backgroundCard: string;
  
  // 文字色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // 品牌色
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // 强调色
  accent: string;
  accentLight: string;
  
  // 状态色
  success: string;
  error: string;
  warning: string;
  
  // 边框
  border: string;
  borderLight: string;
  
  // 特殊色
  gold: string;
  goldLight: string;
  
  // 阵营色
  factionYouming: string;
  factionKunlun: string;
  factionPenglai: string;
  factionManhuang: string;
  factionWangu: string;
}

// 暗色主题（默认）
export const darkTheme: Theme = {
  // 背景
  backgroundRoot: '#0A0A0F',
  backgroundDefault: '#14141F',
  backgroundTertiary: '#1E1E2E',
  backgroundCard: '#1A1A2E',
  
  // 文字
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C0',
  textMuted: '#6B6B80',
  
  // 品牌 - 金色（万古长夜主题）
  primary: '#D4AF37',
  primaryLight: '#F0D060',
  primaryDark: '#A08020',
  
  // 强调 - 紫色
  accent: '#9B59B6',
  accentLight: '#BB7DD6',
  
  // 状态
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  
  // 边框
  border: '#2A2A3A',
  borderLight: '#1A1A2A',
  
  // 金色系
  gold: '#D4AF37',
  goldLight: '#FFD700',
  
  // 阵营色
  factionYouming: '#9B59B6',  // 幽冥 - 紫
  factionKunlun: '#3498DB',   // 昆仑 - 蓝
  factionPenglai: '#E91E63',  // 蓬莱 - 粉
  factionManhuang: '#FF6F00', // 蛮荒 - 橙
  factionWangu: '#D4AF37',    // 万古 - 金
};

// 亮色主题
export const lightTheme: Theme = {
  backgroundRoot: '#F5F5F5',
  backgroundDefault: '#FFFFFF',
  backgroundTertiary: '#F0F0F5',
  backgroundCard: '#FFFFFF',
  
  textPrimary: '#1A1A2E',
  textSecondary: '#4A4A5A',
  textMuted: '#8A8A9A',
  
  primary: '#B8960F',
  primaryLight: '#D4AF37',
  primaryDark: '#8A7000',
  
  accent: '#8E44AD',
  accentLight: '#A34DCA',
  
  success: '#27AE60',
  error: '#C0392B',
  warning: '#D68910',
  
  border: '#E0E0E5',
  borderLight: '#F0F0F5',
  
  gold: '#B8960F',
  goldLight: '#D4AF37',
  
  factionYouming: '#8E44AD',
  factionKunlun: '#2980B9',
  factionPenglai: '#C2185B',
  factionManhuang: '#E65100',
  factionWangu: '#B8960F',
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
};

export type ThemeMode = 'dark' | 'light' | 'system';

export { SCREEN_WIDTH, SCREEN_HEIGHT };
