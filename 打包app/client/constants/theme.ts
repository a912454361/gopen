/**
 * 主题配置 - 金色暗黑风
 */
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

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export interface Theme {
  // 背景
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundTertiary: string;
  
  // 文本
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // 边框
  border: string;
  borderLight: string;
  
  // 品牌色
  primary: string;
  accent: string;
  
  // 按钮
  buttonPrimaryText: string;
  
  // 状态
  success: string;
  error: string;
  warning: string;
}

export const darkTheme: Theme = {
  backgroundRoot: '#0A0A0F',
  backgroundDefault: '#1A1A1F',
  backgroundTertiary: '#2A2A30',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A5',
  textMuted: '#6B6B70',
  
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',
  
  primary: '#D4AF37',
  accent: '#8B5CF6',
  
  buttonPrimaryText: '#000000',
  
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const lightTheme: Theme = {
  backgroundRoot: '#F5F5F7',
  backgroundDefault: '#FFFFFF',
  backgroundTertiary: '#E5E5EA',
  
  textPrimary: '#000000',
  textSecondary: '#6B6B70',
  textMuted: '#A0A0A5',
  
  border: 'rgba(0,0,0,0.1)',
  borderLight: 'rgba(0,0,0,0.05)',
  
  primary: '#D4AF37',
  accent: '#8B5CF6',
  
  buttonPrimaryText: '#000000',
  
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};
